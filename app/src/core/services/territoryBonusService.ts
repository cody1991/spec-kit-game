import { useGameStore } from '../state/store';
import type { TerritoryBonus, TerritoryBonusConfig, ContiguityAnalysis, Country } from '../types';
import { DEFAULT_TERRITORY_BONUS_CONFIG } from '../../config/territoryBonus.config';
import { logger } from '../../config/debug.config';

/**
 * 缓存条目
 */
interface CacheEntry {
  bonus: TerritoryBonus;
  territoryHash: string;
  expiresAt: number;
}

/**
 * 领土加成服务
 * Feature: 008-territory-bonus
 *
 * 负责计算基于城市数量和领土面积的属性加成
 * - 递减增长曲线（对数函数）
 * - 连续领土额外加成
 * - 小势力防御加成
 *
 * 性能优化：
 * - 缓存机制避免重复计算
 * - console.time 性能监控
 */
export class TerritoryBonusService {
  private config: TerritoryBonusConfig;
  private cache: Map<string, CacheEntry> = new Map();
  private readonly CACHE_TTL_MS = 5000; // 缓存5秒

  constructor(config: TerritoryBonusConfig = DEFAULT_TERRITORY_BONUS_CONFIG) {
    this.config = config;
  }

  /**
   * 更新配置
   */
  setConfig(config: Partial<TerritoryBonusConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * 获取当前配置
   */
  getConfig(): TerritoryBonusConfig {
    return { ...this.config };
  }

  /**
   * 计算城市数量加成
   * 使用线性函数：每个城市贡献固定加成
   * @param cityCount 城市数量
   * @returns 加成值 (0 - maxAttackBonus)
   */
  calculateCityBonus(cityCount: number): number {
    if (cityCount <= 0) return 0;

    const { maxAttackBonus, cityBaseFactor } = this.config;
    // 线性增长：cityBaseFactor 表示每个城市的加成
    const bonus = cityCount * cityBaseFactor;

    return Math.min(maxAttackBonus, Math.max(0, bonus));
  }

  /**
   * 计算领土面积加成
   * 使用线性函数：面积占比直接转换为加成
   * @param areaRatio 面积占比 (0-1)
   * @returns 加成值 (0 - maxAttackBonus)
   */
  calculateAreaBonus(areaRatio: number): number {
    if (areaRatio <= 0) return 0;

    const { maxAttackBonus, areaBaseFactor } = this.config;
    // 线性增长：areaBaseFactor 是面积加成的系数
    // 例如 areaBaseFactor=0.5 且占比10%，则加成=5%
    const bonus = areaRatio * areaBaseFactor;

    return Math.min(maxAttackBonus, Math.max(0, bonus));
  }

  /**
   * 分析领土连通性
   * 使用 BFS 算法检测连通分量
   * @param territoryIds 领土ID列表
   * @param countries 国家数据（用于获取邻接关系）
   * @returns 连通分量分析结果
   */
  analyzeContiguity(territoryIds: string[], countries: Country[]): ContiguityAnalysis {
    if (territoryIds.length === 0) {
      return {
        regions: [],
        largestSize: 0,
        totalCount: 0,
        largestRatio: 0,
      };
    }

    // 构建领土集合用于快速查找
    const territorySet = new Set(territoryIds);

    // 构建邻接表（仅包含该势力的领土）
    const adjacencyMap = new Map<string, string[]>();
    for (const id of territoryIds) {
      const country = countries.find((c) => c.id === id);
      if (country) {
        const neighbors = country.neighbors.filter((n) => territorySet.has(n));
        adjacencyMap.set(id, neighbors);
      } else {
        adjacencyMap.set(id, []);
      }
    }

    // BFS 查找所有连通分量
    const visited = new Set<string>();
    const regions: string[][] = [];

    for (const startId of territoryIds) {
      if (visited.has(startId)) continue;

      // BFS 遍历
      const region: string[] = [];
      const queue: string[] = [startId];
      visited.add(startId);

      while (queue.length > 0) {
        const current = queue.shift()!;
        region.push(current);

        const neighbors = adjacencyMap.get(current) || [];
        for (const neighbor of neighbors) {
          if (!visited.has(neighbor)) {
            visited.add(neighbor);
            queue.push(neighbor);
          }
        }
      }

      regions.push(region);
    }

    // 计算统计数据
    const largestSize = Math.max(0, ...regions.map((r) => r.length));
    const totalCount = territoryIds.length;
    const largestRatio = totalCount > 0 ? largestSize / totalCount : 0;

    return {
      regions,
      largestSize,
      totalCount,
      largestRatio,
    };
  }

  /**
   * 计算连续领土额外加成
   * 当最大连通分量占比超过50%时给予额外加成
   * @param baseBonus 基础加成（城市+面积）
   * @param contiguityAnalysis 连通分量分析结果
   * @returns 连续领土额外加成值
   */
  calculateContinuityBonus(baseBonus: number, contiguityAnalysis: ContiguityAnalysis): number {
    const { continuityBonus, maxAttackBonus } = this.config;
    const { largestRatio } = contiguityAnalysis;

    // 仅当最大连通分量占比超过50%时才有额外加成
    if (largestRatio <= 0.5) return 0;

    // 额外加成 = 基础加成 * 连续加成系数 * (占比 - 0.5)
    const bonus = baseBonus * continuityBonus * (largestRatio - 0.5) * 2;

    return Math.min(maxAttackBonus * 0.2, Math.max(0, bonus)); // 连续加成上限为总上限的20%
  }

  /**
   * 计算小势力防御加成
   * 城市越少，防御加成越高
   * @param cityCount 城市数量
   * @returns 小势力防御加成值 (0 - smallFactionDefenseBonus)
   */
  calculateSmallFactionBonus(cityCount: number): number {
    const { smallFactionDefenseBonus, smallFactionThreshold } = this.config;

    if (cityCount >= smallFactionThreshold) return 0;

    // 线性递减：城市越少，加成越高
    const bonus =
      (smallFactionDefenseBonus * (smallFactionThreshold - cityCount)) / smallFactionThreshold;

    return Math.max(0, bonus);
  }

  /**
   * 生成领土哈希用于缓存验证
   */
  private generateTerritoryHash(territoryIds: string[]): string {
    return territoryIds.slice().sort().join(',');
  }

  /**
   * 检查缓存是否有效
   */
  private getCachedBonus(commanderId: string, territoryHash: string): TerritoryBonus | null {
    const entry = this.cache.get(commanderId);
    if (!entry) return null;

    const now = Date.now();
    if (now > entry.expiresAt || entry.territoryHash !== territoryHash) {
      this.cache.delete(commanderId);
      return null;
    }

    return entry.bonus;
  }

  /**
   * 设置缓存
   */
  private setCachedBonus(commanderId: string, bonus: TerritoryBonus, territoryHash: string): void {
    this.cache.set(commanderId, {
      bonus,
      territoryHash,
      expiresAt: Date.now() + this.CACHE_TTL_MS,
    });
  }

  /**
   * 清除缓存
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * 计算指定指挥官的总领土加成
   * @param commanderId 指挥官ID
   * @param skipCache 是否跳过缓存（默认false）
   * @returns 领土加成数据
   */
  calculateTotalBonus(commanderId: string, skipCache: boolean = false): TerritoryBonus {
    console.time(`🏰 TerritoryBonus:${commanderId}`);

    const store = useGameStore.getState();
    const commander = store.commanders.find((c) => c.id === commanderId);
    const countries = store.countries;

    if (!commander) {
      logger.log('TERRITORY_BONUS', `⚠️ Commander not found: ${commanderId}`);
      console.timeEnd(`🏰 TerritoryBonus:${commanderId}`);
      return this.createEmptyBonus(commanderId);
    }

    const territoryIds = commander.controlledTerritories;
    const territoryHash = this.generateTerritoryHash(territoryIds);

    // 检查缓存
    if (!skipCache) {
      const cached = this.getCachedBonus(commanderId, territoryHash);
      if (cached) {
        logger.log('TERRITORY_BONUS', `📦 Cache hit for ${commander.name}`);
        console.timeEnd(`🏰 TerritoryBonus:${commanderId}`);
        return cached;
      }
    }

    const cityCount = territoryIds.length;

    // 计算总面积和面积占比
    const ownedCountries = territoryIds
      .map((id) => countries.find((c) => c.id === id))
      .filter((c): c is Country => c !== undefined);

    const totalArea = ownedCountries.reduce((sum, c) => sum + c.area, 0);
    const worldTotalArea = countries.reduce((sum, c) => sum + c.area, 0);
    const areaRatio = worldTotalArea > 0 ? totalArea / worldTotalArea : 0;

    // 计算各项加成
    const cityBonus = this.calculateCityBonus(cityCount);
    const areaBonus = this.calculateAreaBonus(areaRatio);
    const baseBonus = cityBonus + areaBonus;

    // 分析连通性
    const contiguityAnalysis = this.analyzeContiguity(territoryIds, countries);
    const continuityBonus = this.calculateContinuityBonus(baseBonus, contiguityAnalysis);

    // 小势力防御加成
    const smallFactionDefenseBonus = this.calculateSmallFactionBonus(cityCount);

    // 计算总加成（攻击和防御使用不同上限）
    const totalAttackBonus = Math.min(
      this.config.maxAttackBonus,
      cityBonus + areaBonus + continuityBonus
    );
    const totalDefenseBonus = Math.min(
      this.config.maxDefenseBonus + this.config.smallFactionDefenseBonus,
      cityBonus + areaBonus + continuityBonus + smallFactionDefenseBonus
    );

    const bonus: TerritoryBonus = {
      commanderId,
      cityBonus,
      areaBonus,
      continuityBonus,
      smallFactionDefenseBonus,
      totalAttackBonus,
      totalDefenseBonus,
      largestContiguousCount: contiguityAnalysis.largestSize,
      contiguousRegionCount: contiguityAnalysis.regions.length,
      lastUpdatedAt: Date.now(),
    };

    // 缓存结果
    this.setCachedBonus(commanderId, bonus, territoryHash);

    logger.log(
      'TERRITORY_BONUS',
      `📊 Bonus calculated for ${commander.name}: ATK +${(totalAttackBonus * 100).toFixed(1)}%, DEF +${(totalDefenseBonus * 100).toFixed(1)}%`
    );

    console.timeEnd(`🏰 TerritoryBonus:${commanderId}`);
    return bonus;
  }

  /**
   * 批量计算所有活跃指挥官的加成
   * @param skipCache 是否跳过缓存（默认false）
   * @returns 指挥官ID到加成的映射
   */
  calculateAllBonuses(skipCache: boolean = false): Map<string, TerritoryBonus> {
    console.time('🏰 TerritoryBonus:calculateAll');

    const store = useGameStore.getState();
    const bonusMap = new Map<string, TerritoryBonus>();

    for (const commander of store.commanders) {
      if (commander.status === 'active') {
        const bonus = this.calculateTotalBonus(commander.id, skipCache);
        bonusMap.set(commander.id, bonus);
      }
    }

    console.timeEnd('🏰 TerritoryBonus:calculateAll');
    return bonusMap;
  }

  /**
   * 创建空的加成数据
   */
  private createEmptyBonus(commanderId: string): TerritoryBonus {
    return {
      commanderId,
      cityBonus: 0,
      areaBonus: 0,
      continuityBonus: 0,
      smallFactionDefenseBonus: 0,
      totalAttackBonus: 0,
      totalDefenseBonus: 0,
      largestContiguousCount: 0,
      contiguousRegionCount: 0,
      lastUpdatedAt: Date.now(),
    };
  }
}

/**
 * 全局单例
 */
export const territoryBonusService = new TerritoryBonusService();

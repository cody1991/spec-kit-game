import { useGameStore } from '../state/store';
import type { BattleEvent } from '../types';
import { territoryBonusService } from './territoryBonusService';

/**
 * 势力统计服务
 * 负责监听游戏事件并更新势力统计数据
 */
export class FactionStatsService {
  private unsubscribeEventLog: (() => void) | null = null;
  private unsubscribeCommanders: (() => void) | null = null;
  // 用于追踪已处理的事件ID，避免重复处理
  private processedEventIds: Set<string> = new Set();

  constructor() {
    // 构造函数不再需要防抖
  }

  /**
   * 启动服务，订阅游戏事件
   */
  start(): void {
    const store = useGameStore.getState();

    // 🔧 延迟初始化，等待countries数据
    const tryInitialize = () => {
      const currentStore = useGameStore.getState();

      if (currentStore.countries.length === 0) {
        console.warn('⚠️ FactionStatsService: countries not loaded yet, retrying in 100ms...');
        setTimeout(tryInitialize, 100);
        return;
      }

      // 初始化所有势力的统计数据
      currentStore.initializeFactionStats();

      // 调试：检查初始化后的数据
      console.log('📊 FactionStatsService started');
      console.log(`   Commanders count: ${currentStore.commanders.length}`);
      console.log(`   Countries count: ${currentStore.countries.length}`);
      console.log(`   Faction stats size: ${currentStore.factionStats.size}`);
      console.log(
        '   Sample faction stats:',
        Array.from(currentStore.factionStats.values()).slice(0, 3)
      );
    };

    tryInitialize();

    // 记录之前的eventLog长度，用于检测新事件
    let previousEventLogLength = 0;

    // 订阅所有状态变化
    this.unsubscribeEventLog = useGameStore.subscribe((state) => {
      // 检查是否有新的战斗事件
      if (state.eventLog.length > previousEventLogLength) {
        // 处理所有新增的事件（批量添加时可能有多个）
        const newEventsCount = state.eventLog.length - previousEventLogLength;
        for (let i = 0; i < newEventsCount; i++) {
          const eventIndex = previousEventLogLength + i;
          const event = state.eventLog[eventIndex];
          if (event) {
            this.handleBattleResult(event);
          }
        }
        previousEventLogLength = state.eventLog.length;
      }
    });

    // 订阅指挥官变化（用于领土统计）
    let previousCommandersLength = store.commanders.length;
    this.unsubscribeCommanders = useGameStore.subscribe((state) => {
      // 检查指挥官数量或领土变化
      const hasChanges =
        state.commanders.length !== previousCommandersLength ||
        state.commanders.some((cmd, idx) => {
          const prev = store.commanders[idx];
          return !prev || cmd.controlledTerritories.length !== prev.controlledTerritories.length;
        });

      if (hasChanges) {
        this.handleTerritoryChange();
        previousCommandersLength = state.commanders.length;
      }
    });
  }

  /**
   * 停止服务，取消订阅
   */
  stop(): void {
    this.unsubscribeEventLog?.();
    this.unsubscribeCommanders?.();
    this.processedEventIds.clear();
    console.log('📊 FactionStatsService stopped');
  }

  /**
   * 计算胜率
   * @param wins 战胜次数
   * @param losses 战败次数
   * @returns 胜率 (0-1)，如果总数为0则返回0
   */
  private calculateWinRate(wins: number, losses: number): number {
    const total = wins + losses;
    return total === 0 ? 0 : wins / total;
  }

  /**
   * 处理战斗结果，更新战胜/战败统计
   * @param event 战斗事件
   */
  private handleBattleResult(event: BattleEvent): void {
    // 检查是否已处理过此事件
    if (this.processedEventIds.has(event.id)) {
      return;
    }
    this.processedEventIds.add(event.id);
    
    // 限制已处理事件集合大小，防止内存泄漏
    if (this.processedEventIds.size > 1000) {
      const idsArray = Array.from(this.processedEventIds);
      this.processedEventIds = new Set(idsArray.slice(-500));
    }
    
    // 直接处理，不再防抖
    this.updateBattleStats(event);
  }

  /**
   * 更新战斗统计数据
   * @param event 战斗事件
   */
  private updateBattleStats(event: BattleEvent): void {
    console.time('⚔️ Battle stats update');

    // 仅处理有防守方的attack事件（排除中立领土占领）
    if (event.type !== 'attack' || !event.defenderId) {
      console.timeEnd('⚔️ Battle stats update');
      return;
    }

    const store = useGameStore.getState();
    const attackerStats = store.factionStats.get(event.attackerId!);
    const defenderStats = store.factionStats.get(event.defenderId);

    if (!attackerStats || !defenderStats) {
      console.timeEnd('⚔️ Battle stats update');
      return;
    }

    // 进攻成功：进攻方战胜+1，防守方战败+1
    if (event.result === 'success') {
      const newAttackerWins = attackerStats.wins + 1;
      const newDefenderLosses = defenderStats.losses + 1;

      store.updateFactionStats(event.attackerId!, {
        wins: newAttackerWins,
        winRate: this.calculateWinRate(newAttackerWins, attackerStats.losses),
      });

      store.updateFactionStats(event.defenderId, {
        losses: newDefenderLosses,
        winRate: this.calculateWinRate(defenderStats.wins, newDefenderLosses),
      });

      console.log(
        `⚔️ Battle stats updated: ${attackerStats.commanderName} wins+1, ${defenderStats.commanderName} losses+1`,
        `(${new Date().toISOString()})`
      );
    } else if (event.result === 'fail') {
      // 进攻失败：进攻方战败+1，防守方战胜+1
      const newAttackerLosses = attackerStats.losses + 1;
      const newDefenderWins = defenderStats.wins + 1;

      store.updateFactionStats(event.attackerId!, {
        losses: newAttackerLosses,
        winRate: this.calculateWinRate(attackerStats.wins, newAttackerLosses),
      });

      store.updateFactionStats(event.defenderId, {
        wins: newDefenderWins,
        winRate: this.calculateWinRate(newDefenderWins, defenderStats.losses),
      });

      console.log(
        `⚔️ Battle stats updated: ${attackerStats.commanderName} losses+1, ${defenderStats.commanderName} wins+1`,
        `(${new Date().toISOString()})`
      );
    }

    console.timeEnd('⚔️ Battle stats update');
  }

  /**
   * 处理领土变化，更新国家数量和面积统计
   * Feature: 008-territory-bonus - 同时更新领土加成
   */
  private handleTerritoryChange(): void {
    const store = useGameStore.getState();

    // 重新计算所有势力的领土统计
    store.commanders.forEach((commander) => {
      const stats = store.factionStats.get(commander.id);
      if (!stats) return;

      // 计算当前占领的国家列表
      const ownedCountries = commander.controlledTerritories
        .map((territoryId) => {
          return store.countries.find((c) => c.id === territoryId);
        })
        .filter((c): c is NonNullable<typeof c> => c !== undefined);

      const countryCount = ownedCountries.length;
      const totalArea = ownedCountries.reduce((sum, c) => sum + c.area, 0);

      // 只有变化时才更新
      if (countryCount !== stats.countryCount || Math.abs(totalArea - stats.totalArea) > 0.1) {
        // Feature: 008-territory-bonus - 计算领土加成
        const territoryBonus = territoryBonusService.calculateTotalBonus(commander.id);

        store.updateFactionStats(commander.id, {
          countryCount,
          totalArea,
          status: commander.status,
          territoryBonus,
        });

        console.log(
          `🗺️ Territory stats updated: ${commander.name} - ${countryCount} countries, ${(totalArea / 1000000).toFixed(2)}M km², ATK +${(territoryBonus.totalAttackBonus * 100).toFixed(1)}%, DEF +${(territoryBonus.totalDefenseBonus * 100).toFixed(1)}%`
        );
      }
    });
  }
}

/**
 * 全局单例
 */
export const factionStatsService = new FactionStatsService();

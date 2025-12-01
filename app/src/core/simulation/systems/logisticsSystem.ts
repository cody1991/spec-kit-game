import type { System } from '../tickScheduler';
import { useGameStore } from '../../state/store';

/**
 * 后勤系统
 * 
 * @performance
 * - 使用 for 循环代替 forEach 提高性能
 * - 使用批量更新减少 store 操作
 * - 缓存 territories 查找结果
 */
export class LogisticsSystem implements System {
  name = 'LogisticsSystem';
  
  // 缓存领土 ID 到领土对象的映射
  private territoryCache: Map<string, { food: number; industry: number; stability: number; garrison: number }> = new Map();

  update(_deltaMs: number): void {
    const state = useGameStore.getState();
    const { commanders, territories } = state;
    const store = useGameStore.getState();

    // 构建领土缓存（每次更新时重建，因为领土状态可能变化）
    this.territoryCache.clear();
    for (let i = 0; i < territories.length; i++) {
      const t = territories[i];
      this.territoryCache.set(t.id, {
        food: t.resourceYield.food,
        industry: t.resourceYield.industry,
        stability: t.stability,
        garrison: t.garrison,
      });
    }

    // 收集所有更新
    const allTerritoryUpdates: Array<{ id: string; updates: { stability?: number; garrison?: number } }> = [];
    const allCommanderUpdates: Array<{ id: string; updates: { currentPower?: number; morale?: number } }> = [];

    // 每个指挥官根据领土获得补给和恢复
    for (let i = 0; i < commanders.length; i++) {
      const commander = commanders[i];
      if (commander.status !== 'active') continue;

      // 计算总资源产出（使用缓存）
      let totalFood = 0;
      let totalIndustry = 0;
      const ownedTerritoryIds = commander.controlledTerritories;
      
      for (let j = 0; j < ownedTerritoryIds.length; j++) {
        const cached = this.territoryCache.get(ownedTerritoryIds[j]);
        if (cached) {
          totalFood += cached.food;
          totalIndustry += cached.industry;
        }
      }

      // 收集指挥官更新
      const powerGain = Math.min(5, totalFood + totalIndustry);
      const moraleGain = Math.min(3, Math.floor(totalFood / 2));

      allCommanderUpdates.push({
        id: commander.id,
        updates: {
          currentPower: Math.min(100, commander.currentPower + powerGain),
          morale: Math.min(100, commander.morale + moraleGain),
        },
      });

      // 收集领土更新
      for (let j = 0; j < ownedTerritoryIds.length; j++) {
        const territoryId = ownedTerritoryIds[j];
        const cached = this.territoryCache.get(territoryId);
        if (cached) {
          allTerritoryUpdates.push({
            id: territoryId,
            updates: {
              stability: Math.min(100, cached.stability + 2),
              garrison: Math.min(cached.garrison + 2, commander.currentPower),
            },
          });
        }
      }
    }

    // 一次性批量更新
    if (allCommanderUpdates.length > 0) {
      store.batchUpdateCommanders(allCommanderUpdates);
    }
    if (allTerritoryUpdates.length > 0) {
      store.batchUpdateTerritories(allTerritoryUpdates);
    }
  }
}

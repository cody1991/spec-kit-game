import type { System } from '../tickScheduler';
import { useGameStore } from '../../state/store';
import { globalEventBus } from '../../events/eventTypes';
import { logger } from '@/config/debug.config';

/**
 * 联盟系统
 * Feature: 009-unification-balance - 决战模式下禁止新联盟，50% 领土后解散联盟
 *
 * @performance
 * - 减少随机数生成次数
 * - 提前退出条件检查
 */
export class AllianceSystem implements System {
  name = 'AllianceSystem';

  update(_deltaMs: number): void {
    const state = useGameStore.getState();
    const { commanders, territories, isEndgameMode, endgameConfig } = state;

    // Feature: 009-unification-balance - 检查并解散大势力的联盟
    this.checkAndBreakAlliances(state, commanders, territories, endgameConfig.allianceBreakThreshold);

    // Feature: 009-unification-balance - 决战模式下禁止新联盟
    if (isEndgameMode) {
      logger.log('ALLIANCE_SYSTEM', '🚫 [AllianceSystem] 决战模式下禁止新联盟形成');
      return;
    }

    // 小概率形成联盟或背叛 (5% per tick) - 提前检查避免不必要的计算
    if (Math.random() >= 0.05) return;

    // 过滤活跃指挥官
    const activeCommanders = [];
    for (let i = 0; i < commanders.length; i++) {
      if (commanders[i].status === 'active') {
        activeCommanders.push(commanders[i]);
      }
    }

    // 至少需要2个活跃指挥官才能形成联盟
    if (activeCommanders.length < 2) return;

    const idx1 = Math.floor(Math.random() * activeCommanders.length);
    let idx2 = Math.floor(Math.random() * activeCommanders.length);

    // 确保选择不同的指挥官
    if (idx1 === idx2) {
      idx2 = (idx2 + 1) % activeCommanders.length;
    }

    const commander1 = activeCommanders[idx1];
    const commander2 = activeCommanders[idx2];

    // 检查是否已经是盟友或联盟数量已满
    if (commander1.alliances.includes(commander2.id)) return;
    if (commander1.alliances.length >= 3) return;

    // Feature: 009-unification-balance - 大势力不能结盟
    const totalTerritories = territories.length;
    const commander1Ratio = commander1.controlledTerritories.length / totalTerritories;
    const commander2Ratio = commander2.controlledTerritories.length / totalTerritories;
    
    if (commander1Ratio >= endgameConfig.allianceBreakThreshold || 
        commander2Ratio >= endgameConfig.allianceBreakThreshold) {
      logger.log(
        'ALLIANCE_SYSTEM',
        `🚫 [AllianceSystem] 大势力不能结盟: ${commander1.name}(${(commander1Ratio * 100).toFixed(1)}%) 或 ${commander2.name}(${(commander2Ratio * 100).toFixed(1)}%)`
      );
      return;
    }

    // 形成联盟
    const store = useGameStore.getState();
    store.updateCommander(commander1.id, {
      alliances: [...commander1.alliances, commander2.id],
      hostilities: commander1.hostilities.filter((h) => h !== commander2.id),
    });
    store.updateCommander(commander2.id, {
      alliances: [...commander2.alliances, commander1.id],
      hostilities: commander2.hostilities.filter((h) => h !== commander1.id),
    });

    store.addBattleEvent({
      id: `alliance-${Date.now()}`,
      timestamp: new Date().toISOString(),
      type: 'alliance',
      attackerId: commander1.id,
      defenderId: commander2.id,
      result: 'success',
      delta: {},
      narrative: `${commander1.name} 与 ${commander2.name} 结成联盟!`,
      seed: Math.random().toString(36),
    });

    globalEventBus.emit({
      type: 'alliance:formed',
      timestamp: new Date().toISOString(),
      payload: { commander1: commander1.id, commander2: commander2.id },
    });
  }

  /**
   * Feature: 009-unification-balance - 检查并解散大势力的联盟
   * 当某势力占领超过 50% 领土时，强制解散其所有联盟
   */
  private checkAndBreakAlliances(
    state: ReturnType<typeof useGameStore.getState>,
    commanders: typeof state.commanders,
    territories: typeof state.territories,
    threshold: number
  ): void {
    const totalTerritories = territories.length;
    if (totalTerritories === 0) return;

    for (const commander of commanders) {
      if (commander.status !== 'active') continue;
      if (commander.alliances.length === 0) continue;

      const ratio = commander.controlledTerritories.length / totalTerritories;
      
      if (ratio >= threshold) {
        // 解散所有联盟
        const alliesToBreak = [...commander.alliances];
        
        for (const allyId of alliesToBreak) {
          const ally = commanders.find((c) => c.id === allyId);
          if (!ally) continue;

          // 更新双方的联盟列表
          state.updateCommander(commander.id, {
            alliances: commander.alliances.filter((a) => a !== allyId),
          });
          state.updateCommander(allyId, {
            alliances: ally.alliances.filter((a) => a !== commander.id),
          });

          logger.log(
            'ALLIANCE_SYSTEM',
            `💔 [AllianceSystem] 联盟解散: ${commander.name}(${(ratio * 100).toFixed(1)}%) 与 ${ally.name} - 势力过大`
          );

          state.addBattleEvent({
            id: `alliance-break-${Date.now()}-${allyId}`,
            timestamp: new Date().toISOString(),
            type: 'alliance',
            attackerId: commander.id,
            defenderId: allyId,
            result: 'fail',
            delta: { reason: 'territory_threshold' },
            narrative: `${commander.name} 势力过大，与 ${ally.name} 的联盟破裂!`,
            seed: Math.random().toString(36),
          });

          globalEventBus.emit({
            type: 'alliance:broken',
            timestamp: new Date().toISOString(),
            payload: { commander1: commander.id, commander2: allyId, reason: 'territory_threshold' },
          });
        }
      }
    }
  }
}

import type { System } from '../tickScheduler';
import { useGameStore } from '../../state/store';
import { globalEventBus } from '../../events/eventTypes';
import { DEFAULT_VICTORY_CONFIG } from '@/config/victory.config';
import { logger } from '@/config/debug.config';

/**
 * 胜利系统
 * Feature: 009-unification-balance - 新增领土胜利条件
 *
 * 胜利条件：
 * 1. 领土胜利：占领 85% 以上领土
 * 2. 消灭胜利：消灭所有对手（仅剩 1 个活跃势力）
 */
export class VictorySystem implements System {
  name = 'VictorySystem';

  update(_deltaMs: number): void {
    const state = useGameStore.getState();
    const { commanders, territories } = state;
    const config = DEFAULT_VICTORY_CONFIG;

    const activeCommanders = commanders.filter((c) => c.status === 'active');

    // 胜利条件 1：领土胜利（占领 85% 以上领土）
    if (config.enableTerritoryVictory) {
      const totalTerritories = territories.length;
      
      for (const commander of activeCommanders) {
        const controlledCount = commander.controlledTerritories.length;
        const controlRatio = totalTerritories > 0 ? controlledCount / totalTerritories : 0;
        
        if (controlRatio >= config.territoryVictoryThreshold) {
          logger.log(
            'VICTORY_SYSTEM',
            `🏆 [VictorySystem] ${commander.name} 达成领土胜利: ${(controlRatio * 100).toFixed(1)}% (${controlledCount}/${totalTerritories})`
          );
          this.declareVictory(commander.id, 'territory');
          return;
        }
      }
    }

    // 胜利条件 2：消灭胜利（仅剩 1 个活跃势力）
    if (config.enableEliminationVictory && activeCommanders.length === 1) {
      logger.log(
        'VICTORY_SYSTEM',
        `🏆 [VictorySystem] ${activeCommanders[0].name} 达成消灭胜利: 消灭所有对手`
      );
      this.declareVictory(activeCommanders[0].id, 'elimination');
      return;
    }
  }

  private declareVictory(commanderId: string, victoryType: 'territory' | 'elimination'): void {
    const state = useGameStore.getState();
    const commander = state.commanders.find((c) => c.id === commanderId);

    if (!commander) return;

    const narrative = victoryType === 'territory'
      ? `${commander.name} 占领了绝大多数领土，统一了世界！`
      : `${commander.name} 消灭所有对手，统一了世界！`;

    state.addBattleEvent({
      id: `victory-${Date.now()}`,
      timestamp: new Date().toISOString(),
      type: 'victory',
      attackerId: commanderId,
      result: 'success',
      delta: { victoryType },
      narrative,
      seed: Math.random().toString(36),
    });

    state.setVictory(commanderId);

    globalEventBus.emit({
      type: 'game:victory',
      timestamp: new Date().toISOString(),
      payload: { commanderId, victoryType },
    });
  }
}

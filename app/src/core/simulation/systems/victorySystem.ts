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
 * 1. 领土胜利：统一所有国家（100% 领土）
 * 2. 消灭胜利：消灭所有对手（等同于占领所有领土）
 * 
 * 注意：游戏开始时所有领土都已分配给指挥官，没有中立领土
 */
export class VictorySystem implements System {
  name = 'VictorySystem';

  update(_deltaMs: number): void {
    const state = useGameStore.getState();
    const { commanders, countries } = state;
    const config = DEFAULT_VICTORY_CONFIG;

    const activeCommanders = commanders.filter((c) => c.status === 'active');
    
    // 使用 countries.length 作为总领土数（地图上的实际国家数量）
    const totalTerritories = countries.length;
    
    // 如果国家数据还没加载，跳过检查
    if (totalTerritories === 0) {
      return;
    }

    // 检查是否有指挥官占领了所有领土
    for (const commander of activeCommanders) {
      const controlledCount = commander.controlledTerritories.length;
      const controlRatio = controlledCount / totalTerritories;
      
      // 胜利条件：占领 100% 领土
      if (controlRatio >= config.territoryVictoryThreshold) {
        const victoryType = activeCommanders.length === 1 ? 'elimination' : 'territory';
        logger.log(
          'VICTORY_SYSTEM',
          `🏆 [VictorySystem] ${commander.name} 达成${victoryType === 'elimination' ? '消灭' : '领土'}胜利: ${(controlRatio * 100).toFixed(1)}% (${controlledCount}/${totalTerritories})`
        );
        this.declareVictory(commander.id, victoryType);
        return;
      }
    }

    // 当只剩1个活跃势力时，他必然占领了所有领土
  }

  private declareVictory(commanderId: string, victoryType: 'territory' | 'elimination'): void {
    const state = useGameStore.getState();
    const commander = state.commanders.find((c) => c.id === commanderId);

    if (!commander) return;

    const narrative = `${commander.name} 占领了所有领土，统一了世界！`;

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

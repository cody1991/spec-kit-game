import type { System } from '../tickScheduler';
import { useGameStore } from '../../state/store';
import type { BattleEvent, HistoricalCommander, Territory } from '../../types';
import { globalEventBus } from '../../events/eventTypes';
import { createCountryConquestTelemetry } from '@/services/telemetry/countryConquestTelemetry';
import { logger } from '@/config/debug.config';

/**
 * Global battle event counter for generating unique IDs
 * Resets on game restart via resetBattleEventCounter()
 */
let battleEventCounter = 0;

/**
 * Reset the battle event counter to 0
 * Called when starting a new game session
 */
export function resetBattleEventCounter(): void {
  battleEventCounter = 0;
}

/**
 * Generate a unique battle event ID
 * Format: battle-{timestamp}-{counter}
 * 
 * @returns A unique ID string that combines timestamp and sequential counter
 * @example "battle-1701234567890-42"
 */
export function generateBattleEventId(): string {
  return `battle-${Date.now()}-${battleEventCounter++}`;
}

/**
 * 战斗系统
 * 
 * @performance
 * - 减少每 Tick 的计算量
 * - 使用批量更新减少 store 操作
 * - 移除不必要的 console.log
 */
export class BattleSystem implements System {
  name = 'BattleSystem';

  update(_deltaMs: number): void {
    const state = useGameStore.getState();
    const { commanders, territories } = state;

    // 找到活跃的指挥官
    const activeCommanders = commanders.filter((c) => c.status === 'active');
    
    // 调试日志（仅在指挥官数量少时输出）
    logger.log('BATTLE_EVENTS', `🎮 Active commanders: ${activeCommanders.length}`);

    // 每个指挥官有机会发起进攻
    for (let i = 0; i < activeCommanders.length; i++) {
      const attacker = activeCommanders[i];
      if (attacker.controlledTerritories.length === 0) continue;

      // 找到相邻敌对领土（使用 Set 避免重复）
      const targetSet = new Set<string>();
      
      for (let j = 0; j < attacker.controlledTerritories.length; j++) {
        const territoryId = attacker.controlledTerritories[j];
        const territory = territories.find((t) => t.id === territoryId);
        if (!territory) continue;
        
        for (let k = 0; k < territory.adjacentIds.length; k++) {
          const adjId = territory.adjacentIds[k];
          const adjTerritory = territories.find((t) => t.id === adjId);
          // 可以攻击：1) 敌对领土 2) 中立领土（ownerId为null）
          if (adjTerritory && adjTerritory.ownerId !== attacker.id) {
            targetSet.add(adjId);
          }
        }
      }

      if (targetSet.size === 0) continue;

      // 随机选择一个目标 (80% chance per tick - 极快战斗)
      if (Math.random() < 0.8) {
        const targetIds = Array.from(targetSet);
        const targetId = targetIds[Math.floor(Math.random() * targetIds.length)];
        const target = territories.find((t) => t.id === targetId);
        if (!target) continue;
        
        // 如果是中立领土（无主），直接占领
        if (!target.ownerId) {
          this.occupyNeutralTerritory(attacker, target);
        } else {
          // 如果有主人，发起战斗（确保defender是活跃状态）
          const defender = commanders.find(
            (c) => c.id === target.ownerId && c.status === 'active'
          );
          if (defender) {
            this.executeBattle(attacker, defender, target);
          } else {
            // 领土的主人已被淘汰但领土还没清理，直接占领
            logger.log('BATTLE_EVENTS', `🏳️ Orphaned territory ${target.name}, occupying...`);
            this.occupyNeutralTerritory(attacker, target);
          }
        }
      }
    }
  }

  /**
   * 占领中立领土（无需战斗）
   */
  private occupyNeutralTerritory(attacker: HistoricalCommander, territory: Territory): void {
    const store = useGameStore.getState();

    // 直接占领
    store.updateTerritory(territory.id, {
      ownerId: attacker.id,
      garrison: Math.floor(attacker.currentPower * 0.2),
      stability: 60,
    });

    store.updateCommander(attacker.id, {
      controlledTerritories: [...attacker.controlledTerritories, territory.id],
    });

    // 添加占领事件
    const event: BattleEvent = {
      id: generateBattleEventId(),
      timestamp: new Date().toISOString(),
      type: 'attack',
      attackerId: attacker.id,
      territoryId: territory.id,
      result: 'success',
      delta: {},
      narrative: `${attacker.name} 占领了无主的 ${territory.name}!`,
      seed: Math.random().toString(36),
    };

    store.addBattleEvent(event);
    
    logger.log('BATTLE_EVENTS', `🏳️ Neutral Territory: ${territory.name} occupied by ${attacker.name}`);
  }

  private executeBattle(
    attacker: HistoricalCommander,
    defender: HistoricalCommander,
    territory: Territory
  ): void {
    // 计算战斗结果
    const attackPower =
      attacker.baseAttributes.attack * (attacker.morale / 100) * (attacker.currentPower / 100);
    const defensePower =
      defender.baseAttributes.defense *
      (defender.morale / 100) *
      (territory.stability / 100) *
      (defender.currentPower / 100);

    const attackerWins = attackPower > defensePower * (0.8 + Math.random() * 0.4);

    const event: BattleEvent = {
      id: generateBattleEventId(),
      timestamp: new Date().toISOString(),
      type: 'attack',
      attackerId: attacker.id,
      defenderId: defender.id,
      territoryId: territory.id,
      result: attackerWins ? 'success' : 'fail',
      delta: {
        attackerPowerLoss: Math.floor(Math.random() * 10) + 5,
        defenderPowerLoss: Math.floor(Math.random() * 15) + 10,
      },
      narrative: attackerWins
        ? `${attacker.name} 成功占领了 ${territory.name}!`
        : `${defender.name} 成功守住了 ${territory.name}!`,
      seed: Math.random().toString(36),
    };

    // 更新状态
    const store = useGameStore.getState();

    if (attackerWins) {
      // 转移领土
      store.updateTerritory(territory.id, {
        ownerId: attacker.id,
        garrison: Math.floor(attacker.currentPower * 0.3),
        stability: Math.max(20, territory.stability - 30),
      });

      // Add telemetry for territory ownership change (single-country conquest)
      store.addTelemetry(
        createCountryConquestTelemetry({
          territoryId: territory.id,
          territoryName: territory.name,
          previousOwnerId: defender.id,
          newOwnerId: attacker.id,
          attackPower,
          defensePower,
          battleDuration: 1,
        })
      );

      logger.log('BATTLE_EVENTS', `📍 Territory Update: ${territory.name} conquered by ${attacker.name} from ${defender.name}`);

      store.updateCommander(attacker.id, {
        controlledTerritories: [...attacker.controlledTerritories, territory.id],
        currentPower: Math.max(0, attacker.currentPower - event.delta.attackerPowerLoss),
      });

      // 更新防守方（移除失去的领土）
      const updatedDefenderTerritories = defender.controlledTerritories.filter(
        (t) => t !== territory.id
      );
      const updatedDefenderPower = Math.max(
        0,
        defender.currentPower - event.delta.defenderPowerLoss
      );

      store.updateCommander(defender.id, {
        controlledTerritories: updatedDefenderTerritories,
        currentPower: updatedDefenderPower,
      });

      // 检查防守方是否被淘汰（失去所有领土）
      if (updatedDefenderTerritories.length === 0) {
        // 清除该指挥官所有剩余领土的所有权
        updatedDefenderTerritories.forEach((territoryId) => {
          store.updateTerritory(territoryId, {
            ownerId: null,
            garrison: 0,
            stability: 50,
          });
        });

        store.updateCommander(defender.id, { 
          status: 'eliminated',
          controlledTerritories: [] // 确保清空
        });
        
        const eliminationEvent: BattleEvent = {
          ...event,
          type: 'elimination',
          narrative: `${defender.name} 已被淘汰!`,
        };
        store.addBattleEvent(eliminationEvent);
        
        logger.log('BATTLE_EVENTS', `💀 Commander Eliminated: ${defender.name}`);
        
        globalEventBus.emit({
          type: 'commander:eliminated',
          timestamp: new Date().toISOString(),
          payload: { commanderId: defender.id },
        });
      }
    } else {
      // 失败，降低士气
      store.updateCommander(attacker.id, {
        morale: Math.max(0, attacker.morale - 5),
        currentPower: Math.max(0, attacker.currentPower - event.delta.attackerPowerLoss),
      });

      store.updateCommander(defender.id, {
        morale: Math.min(100, defender.morale + 5),
        currentPower: Math.max(0, defender.currentPower - event.delta.defenderPowerLoss),
      });
    }

    store.addBattleEvent(event);
    globalEventBus.emit({
      type: 'battle:result',
      timestamp: new Date().toISOString(),
      payload: event,
    });
  }
}

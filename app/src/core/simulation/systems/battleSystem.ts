import type { System } from '../tickScheduler';
import { useGameStore } from '../../state/store';
import type { BattleEvent, HistoricalCommander, Territory } from '../../types';
import { globalEventBus } from '../../events/eventTypes';

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

export class BattleSystem implements System {
  name = 'BattleSystem';

  update(_deltaMs: number): void {
    const state = useGameStore.getState();
    const { commanders, territories } = state;

    // 找到活跃的指挥官
    const activeCommanders = commanders.filter((c) => c.status === 'active');
    
    // 调试日志
    if (activeCommanders.length < 10) {
      console.log(`🎮 Active commanders: ${activeCommanders.length}`, 
        activeCommanders.map(c => `${c.name}(${c.controlledTerritories.length})`).join(', '));
    }

    // 每个指挥官有机会发起进攻
    activeCommanders.forEach((attacker) => {
      if (attacker.controlledTerritories.length === 0) return;

      // 找到相邻敌对领土
      const ownedTerritories = territories.filter((t) =>
        attacker.controlledTerritories.includes(t.id)
      );

      const targetTerritories: Territory[] = [];
      ownedTerritories.forEach((territory) => {
        territory.adjacentIds.forEach((adjId) => {
          const adjTerritory = territories.find((t) => t.id === adjId);
          // 可以攻击：1) 敌对领土 2) 中立领土（ownerId为null）
          if (adjTerritory && adjTerritory.ownerId !== attacker.id) {
            targetTerritories.push(adjTerritory);
          }
        });
      });

      if (targetTerritories.length === 0) {
        // 调试：为什么没有目标
        if (activeCommanders.length < 10) {
          console.log(`  ⚠️ ${attacker.name} has no targets. Owned: ${attacker.controlledTerritories.length}`);
        }
        return;
      }

      // 随机选择一个目标 (30% chance per tick - 增加战斗频率)
      if (Math.random() < 0.3) {
        const target = targetTerritories[Math.floor(Math.random() * targetTerritories.length)];
        
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
            console.log(`🏳️ Orphaned territory ${target.name} (owner eliminated), occupying...`);
            this.occupyNeutralTerritory(attacker, target);
          }
        }
      }
    });
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
    
    console.log(`🏳️ Neutral Territory: ${territory.name} occupied by ${attacker.name}`);
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

      // Add telemetry for territory ownership change
      store.addTelemetry({
        type: 'territory:conquered',
        timestamp: new Date().toISOString(),
        payload: {
          territoryId: territory.id,
          territoryName: territory.name,
          previousOwnerId: defender.id,
          newOwnerId: attacker.id,
          attackPower,
          defensePower,
          battleDuration: 1,
        },
      });

      console.log(
        `📍 Territory Update: ${territory.name} conquered by ${attacker.name} from ${defender.name}`
      );

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

      // 检查防守方是否被淘汰（使用更新后的值）
      if (updatedDefenderTerritories.length === 0 || updatedDefenderPower <= 0) {
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
        
        console.log(`💀 Commander Eliminated: ${defender.name} - territories cleared`);
        
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

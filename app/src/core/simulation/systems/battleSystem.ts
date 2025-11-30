import type { System } from '../tickScheduler';
import { useGameStore } from '../../state/store';
import type { BattleEvent, HistoricalCommander, Territory } from '../../types';
import { globalEventBus } from '../../events/eventTypes';

export class BattleSystem implements System {
  name = 'BattleSystem';

  update(_deltaMs: number): void {
    const state = useGameStore.getState();
    const { commanders, territories } = state;

    // 找到活跃的指挥官
    const activeCommanders = commanders.filter((c) => c.status === 'active');

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
          if (adjTerritory && adjTerritory.ownerId && adjTerritory.ownerId !== attacker.id) {
            targetTerritories.push(adjTerritory);
          }
        });
      });

      if (targetTerritories.length === 0) return;

      // 随机选择一个目标 (10% chance per tick)
      if (Math.random() < 0.1) {
        const target = targetTerritories[Math.floor(Math.random() * targetTerritories.length)];
        const defender = commanders.find((c) => c.id === target.ownerId);

        if (defender) {
          this.executeBattle(attacker, defender, target);
        }
      }
    });
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
      id: `battle-${Date.now()}-${Math.random()}`,
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

      store.updateCommander(defender.id, {
        controlledTerritories: defender.controlledTerritories.filter((t) => t !== territory.id),
        currentPower: Math.max(0, defender.currentPower - event.delta.defenderPowerLoss),
      });

      // 检查防守方是否被淘汰
      if (
        defender.controlledTerritories.filter((t) => t !== territory.id).length === 0 ||
        defender.currentPower - event.delta.defenderPowerLoss <= 0
      ) {
        store.updateCommander(defender.id, { status: 'eliminated' });
        const eliminationEvent: BattleEvent = {
          ...event,
          type: 'elimination',
          narrative: `${defender.name} 已被淘汰!`,
        };
        store.addBattleEvent(eliminationEvent);
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

import type { System } from '../tickScheduler';
import { useGameStore } from '../../state/store';
import { globalEventBus } from '../../events/eventTypes';

export class VictorySystem implements System {
  name = 'VictorySystem';
  private lastTerritoryChangesTick: number = 0;

  update(_deltaMs: number): void {
    const state = useGameStore.getState();
    const { commanders, territories, tick, victoryThreshold } = state;

    const activeCommanders = commanders.filter((c) => c.status === 'active');

    // 检查是否只剩一个指挥官
    if (activeCommanders.length === 1) {
      this.declareVictory(activeCommanders[0].id);
      return;
    }

    // 检查是否有指挥官占领了足够的领土
    const totalTerritories = territories.length;
    for (const commander of activeCommanders) {
      const ownedCount = commander.controlledTerritories.length;
      const percentage = ownedCount / totalTerritories;

      if (percentage >= victoryThreshold) {
        this.declareVictory(commander.id);
        return;
      }
    }

    // 检查僵持（300 tick = 10分钟无变化）
    const occupiedTerritories = territories.filter((t) => t.ownerId !== null).length;
    if (occupiedTerritories === territories.length) {
      if (tick - this.lastTerritoryChangesTick > 300) {
        this.handleStalemate();
      }
    } else {
      this.lastTerritoryChangesTick = tick;
    }
  }

  private declareVictory(commanderId: string): void {
    const state = useGameStore.getState();
    const commander = state.commanders.find((c) => c.id === commanderId);

    if (!commander) return;

    state.addBattleEvent({
      id: `victory-${Date.now()}`,
      timestamp: new Date().toISOString(),
      type: 'victory',
      attackerId: commanderId,
      result: 'success',
      delta: {},
      narrative: `${commander.name} 统一了世界!`,
      seed: Math.random().toString(36),
    });

    state.setVictory(commanderId);

    globalEventBus.emit({
      type: 'game:victory',
      timestamp: new Date().toISOString(),
      payload: { commanderId },
    });
  }

  private handleStalemate(): void {
    const state = useGameStore.getState();
    const activeCommanders = state.commanders.filter((c) => c.status === 'active');

    // 找出领土最多的指挥官
    let maxTerritories = 0;
    let leader = activeCommanders[0];

    activeCommanders.forEach((c) => {
      if (c.controlledTerritories.length > maxTerritories) {
        maxTerritories = c.controlledTerritories.length;
        leader = c;
      }
    });

    state.addBattleEvent({
      id: `cataclysm-${Date.now()}`,
      timestamp: new Date().toISOString(),
      type: 'cataclysm',
      result: 'success',
      delta: {},
      narrative: `战局陷入僵持，${leader.name} 领土最多，被视为优势方！`,
      seed: Math.random().toString(36),
    });

    // 触发决战事件 - 给最弱的指挥官一些补偿
    const weakest = activeCommanders.reduce((prev, curr) =>
      curr.currentPower < prev.currentPower ? curr : prev
    );

    state.updateCommander(weakest.id, {
      currentPower: Math.min(100, weakest.currentPower + 20),
      morale: 100,
    });

    this.lastTerritoryChangesTick = state.tick;
  }
}

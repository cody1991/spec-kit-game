import type { System } from '../tickScheduler';
import { useGameStore } from '../../state/store';
import { globalEventBus } from '../../events/eventTypes';

export class VictorySystem implements System {
  name = 'VictorySystem';

  update(_deltaMs: number): void {
    const state = useGameStore.getState();
    const { commanders } = state;

    const activeCommanders = commanders.filter((c) => c.status === 'active');

    // 唯一胜利规则：只剩一个指挥官才算统一
    if (activeCommanders.length === 1) {
      this.declareVictory(activeCommanders[0].id);
      return;
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
      narrative: `${commander.name} 消灭所有对手，统一了世界！`,
      seed: Math.random().toString(36),
    });

    state.setVictory(commanderId);

    globalEventBus.emit({
      type: 'game:victory',
      timestamp: new Date().toISOString(),
      payload: { commanderId },
    });
  }
}

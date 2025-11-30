import type { System } from '../tickScheduler';
import { useGameStore } from '../../state/store';
import { globalEventBus } from '../../events/eventTypes';

export class AllianceSystem implements System {
  name = 'AllianceSystem';

  update(_deltaMs: number): void {
    const state = useGameStore.getState();
    const { commanders } = state;

    const activeCommanders = commanders.filter((c) => c.status === 'active');

    // 小概率形成联盟或背叛 (5% per tick)
    if (Math.random() < 0.05) {
      const commander1 = activeCommanders[Math.floor(Math.random() * activeCommanders.length)];
      const commander2 = activeCommanders[Math.floor(Math.random() * activeCommanders.length)];

      if (commander1.id === commander2.id) return;
      if (commander1.alliances.includes(commander2.id)) return;
      if (commander1.alliances.length >= 3) return; // Max 3 alliances

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
  }
}

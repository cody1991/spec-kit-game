import type { System } from '../tickScheduler';
import { useGameStore } from '../../state/store';
import { globalEventBus } from '../../events/eventTypes';

/**
 * 联盟系统
 * 
 * @performance
 * - 减少随机数生成次数
 * - 提前退出条件检查
 */
export class AllianceSystem implements System {
  name = 'AllianceSystem';

  update(_deltaMs: number): void {
    // 小概率形成联盟或背叛 (5% per tick) - 提前检查避免不必要的计算
    if (Math.random() >= 0.05) return;

    const state = useGameStore.getState();
    const { commanders } = state;

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

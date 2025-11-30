import type { System } from '../tickScheduler';
import { useGameStore } from '../../state/store';

export class LogisticsSystem implements System {
  name = 'LogisticsSystem';

  update(_deltaMs: number): void {
    const state = useGameStore.getState();
    const { commanders, territories } = state;

    // 每个指挥官根据领土获得补给和恢复
    commanders.forEach((commander) => {
      if (commander.status !== 'active') return;

      const ownedTerritories = territories.filter((t) =>
        commander.controlledTerritories.includes(t.id)
      );

      // 计算总资源产出
      const totalFood = ownedTerritories.reduce((sum, t) => sum + t.resourceYield.food, 0);
      const totalIndustry = ownedTerritories.reduce((sum, t) => sum + t.resourceYield.industry, 0);

      // 恢复战力和士气
      const powerGain = Math.min(5, totalFood + totalIndustry);
      const moraleGain = Math.min(3, Math.floor(totalFood / 2));

      const store = useGameStore.getState();
      store.updateCommander(commander.id, {
        currentPower: Math.min(100, commander.currentPower + powerGain),
        morale: Math.min(100, commander.morale + moraleGain),
      });

      // 提升领土稳定性
      ownedTerritories.forEach((territory) => {
        store.updateTerritory(territory.id, {
          stability: Math.min(100, territory.stability + 2),
          garrison: Math.min(territory.garrison + 2, commander.currentPower),
        });
      });
    });
  }
}

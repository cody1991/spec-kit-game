import type { HistoricalCommander, Territory } from '../types';
import { getRandomCommanders } from '@data/commandersData';
import { createTerritories, getRandomTerritoryInRegion } from '@data/mapData';

export interface InitialWorldOptions {
  seed: number;
  commanderCount?: number;
}

export function createInitialWorld(options: InitialWorldOptions) {
  const { seed, commanderCount = 10 } = options;

  // 创建领土
  const territories: Territory[] = createTerritories();

  // 随机选择指挥官
  const commanderTemplates = getRandomCommanders(commanderCount, seed);

  // 为每个指挥官分配初始领土
  const commanders: HistoricalCommander[] = commanderTemplates.map((template, index) => {
    const commanderId = `commander-${index}`;

    // 在其起始区域随机选择一个领土
    const startTerritory = getRandomTerritoryInRegion(
      territories,
      template.originRegion,
      seed + index
    );

    if (startTerritory) {
      startTerritory.ownerId = commanderId;
      startTerritory.garrison = 50;
      startTerritory.stability = 80;
    }

    // 添加属性随机扰动 (-5 到 +5)
    const rng = seedRandom(seed + index * 100);
    const perturbation = () => Math.floor((rng() - 0.5) * 10);

    const commander: HistoricalCommander = {
      id: commanderId,
      name: template.name,
      originRegion: template.originRegion,
      portraitAsset: `/portraits/${template.name}.jpg`,
      baseAttributes: {
        attack: clamp(template.baseAttributes.attack + perturbation(), 40, 100),
        defense: clamp(template.baseAttributes.defense + perturbation(), 40, 100),
        mobility: clamp(template.baseAttributes.mobility + perturbation(), 40, 100),
        leadership: clamp(template.baseAttributes.leadership + perturbation(), 40, 100),
      },
      skillCards: template.skillCards,
      currentPower: 80 + Math.floor(rng() * 20), // 80-100
      controlledTerritories: startTerritory ? [startTerritory.id] : [],
      alliances: [],
      hostilities: [],
      morale: 70 + Math.floor(rng() * 30), // 70-100
      nextActionEta: new Date(Date.now() + 2000).toISOString(),
      status: 'active',
    };

    return commander;
  });

  return {
    commanders,
    territories,
  };
}

function seedRandom(seed: number) {
  let current = seed;
  return function () {
    current = (current * 9301 + 49297) % 233280;
    return current / 233280;
  };
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

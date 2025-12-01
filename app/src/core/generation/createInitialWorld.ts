import type { HistoricalCommander, Territory, Country } from '../types';
import { getRandomCommanders } from '@data/commandersData';
import { getCountryIdsByRegion } from '@/config/regionMapping.config';
import { filterValidCommanders } from './commanderValidator';

export interface InitialWorldOptions {
  seed: number;
  commanderCount?: number;
  countries: Country[]; // 新增：需要真实国家数据
}

/**
 * 创建初始世界
 * 
 * 现在基于真实国家数据，将区域映射仅用于指挥官起始位置分配。
 * Territory.id 直接使用 Country.id（ISO数字码），彻底移除区域ID依赖。
 */
export function createInitialWorld(options: InitialWorldOptions) {
  const { seed, commanderCount = 30, countries } = options;

  if (!countries || countries.length === 0) {
    throw new Error('createInitialWorld requires countries data');
  }

  console.log(`🌍 Creating initial world with ${countries.length} countries, ${commanderCount} commanders`);

  // 从国家数据创建Territory（轻量级游戏逻辑层）
  const territories: Territory[] = countries.map((country) => ({
    id: country.id, // 使用国家ID（如'840'）而非区域ID
    name: country.name,
    polygon: [], // 多边形数据在地图层处理，这里不需要
    adjacentIds: country.neighbors || [],
    terrain: inferTerrain(country), // 根据地理位置推断地形
    resourceYield: {
      food: Math.floor(Math.random() * 5) + 3,
      industry: Math.floor(Math.random() * 5) + 2,
    },
    ownerId: null, // 初始为中立
    garrison: 0,
    stability: 50,
  }));

  // 随机选择指挥官
  const commanderTemplates = getRandomCommanders(commanderCount, seed);

  // 为每个指挥官分配初始领土
  const commanders: HistoricalCommander[] = commanderTemplates.map((template, index) => {
    const commanderId = `commander-${index}`;

    // 根据指挥官的originRegion，从区域映射中获取国家ID列表
    const regionCountryIds = getCountryIdsByRegion(template.originRegion);
    
    // 从这些国家中随机选择一个作为起始领土
    const startTerritory = getRandomCountryFromRegion(
      territories,
      regionCountryIds,
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
      controlledTerritories: startTerritory ? [startTerritory.id] : [], // 现在是国家ID
      initialRegions: [template.originRegion], // 保存原始区域信息用于调试
      alliances: [],
      hostilities: [],
      morale: 70 + Math.floor(rng() * 30), // 70-100
      nextActionEta: new Date(Date.now() + 2000).toISOString(),
      status: 'active',
    };

    return commander;
  });

  // 🔧 Feature 007: 过滤无领土的领主，确保所有活跃领主都有初始国家
  const validCommanders = filterValidCommanders(commanders);
  const excludedCount = commanders.length - validCommanders.length;

  if (excludedCount > 0) {
    console.warn(`⚠️ Excluded ${excludedCount} commanders without territories`);
  }

  console.log(`✅ Created ${validCommanders.length} commanders with country-based territories`);
  console.log(`   Sample commander territories:`, validCommanders.slice(0, 3).map(c => 
    `${c.name}: ${c.controlledTerritories.join(', ')}`
  ));

  return {
    commanders: validCommanders,
    territories,
  };
}

/**
 * 从区域对应的国家列表中随机选择一个未占领的国家
 */
function getRandomCountryFromRegion(
  territories: Territory[],
  countryIds: string[],
  seed: number
): Territory | undefined {
  // 过滤出该区域内未被占领的领土
  const availableTerritories = territories.filter(
    (t) => countryIds.includes(t.id) && !t.ownerId
  );

  if (availableTerritories.length === 0) {
    // 如果区域内所有国家都被占领，从所有未占领国家中选择
    const allAvailable = territories.filter((t) => !t.ownerId);
    if (allAvailable.length === 0) return undefined;
    
    const rng = seedRandom(seed);
    const index = Math.floor(rng() * allAvailable.length);
    return allAvailable[index];
  }

  const rng = seedRandom(seed);
  const index = Math.floor(rng() * availableTerritories.length);
  return availableTerritories[index];
}

/**
 * 根据国家地理信息推断地形类型
 */
function inferTerrain(country: Country): Territory['terrain'] {
  // 简化版：根据纬度和地理位置推断
  const lat = country.centroid.lat;
  const lon = country.centroid.lon;
  
  // 沙漠：北非、中东、中亚
  if ((lat > 15 && lat < 40 && lon > -20 && lon < 60) || // 北非、中东
      (lat > 35 && lat < 50 && lon > 50 && lon < 80)) {  // 中亚
    return 'desert';
  }
  
  // 山地：喜马拉雅、安第斯、落基山脉区域
  if ((lat > 25 && lat < 40 && lon > 70 && lon < 100) ||  // 喜马拉雅
      (lat > -50 && lat < -10 && lon > -80 && lon < -60)) { // 安第斯
    return 'mountain';
  }
  
  // 森林：赤道附近、北方针叶林
  if ((lat > -10 && lat < 10) ||  // 热带雨林
      (lat > 50 && lat < 70)) {    // 北方针叶林
    return 'forest';
  }
  
  // 默认：平原
  return 'plains';
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

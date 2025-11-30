import { geoEqualEarth } from 'd3-geo';

export interface Territory {
  id: string;
  name: string;
  polygon: number[][];
  adjacentIds: string[];
  terrain: 'plains' | 'mountain' | 'desert' | 'forest' | 'water';
  resourceYield: { food: number; industry: number };
  ownerId: string | null;
  garrison: number;
  stability: number;
}

// 地区常量
const REGION_EUROPE = 'europe' as const;
const REGION_ASIA = 'asia' as const;
const REGION_AFRICA = 'africa' as const;
const REGION_AMERICAS = 'americas' as const;
const REGION_OCEANIA = 'oceania' as const;

const TERRAIN_PLAINS = 'plains' as const;
const TERRAIN_FOREST = 'forest' as const;
const TERRAIN_DESERT = 'desert' as const;
const TERRAIN_MOUNTAIN = 'mountain' as const;

// 简化的世界地图数据 - 模拟主要地区
export const worldRegions: Array<{
  id: string;
  name: string;
  center: [number, number];
  region: 'africa' | 'americas' | 'asia' | 'europe' | 'oceania';
  terrain: Territory['terrain'];
}> = [
  { id: 'western-europe', name: '西欧', center: [5, 50], region: REGION_EUROPE, terrain: TERRAIN_PLAINS },
  { id: 'eastern-europe', name: '东欧', center: [30, 52], region: REGION_EUROPE, terrain: TERRAIN_PLAINS },
  { id: 'russia', name: '俄罗斯', center: [60, 60], region: REGION_ASIA, terrain: TERRAIN_FOREST },
  { id: 'middle-east', name: '中东', center: [45, 30], region: REGION_ASIA, terrain: TERRAIN_DESERT },
  { id: 'india', name: '印度', center: [80, 22], region: REGION_ASIA, terrain: TERRAIN_PLAINS },
  { id: 'china', name: '中国', center: [105, 35], region: REGION_ASIA, terrain: TERRAIN_PLAINS },
  { id: 'southeast-asia', name: '东南亚', center: [110, 10], region: REGION_ASIA, terrain: TERRAIN_FOREST },
  { id: 'japan', name: '日本', center: [138, 38], region: REGION_ASIA, terrain: TERRAIN_MOUNTAIN },
  { id: 'north-africa', name: '北非', center: [15, 25], region: REGION_AFRICA, terrain: TERRAIN_DESERT },
  { id: 'central-africa', name: '中非', center: [20, 0], region: REGION_AFRICA, terrain: TERRAIN_FOREST },
  { id: 'south-africa', name: '南非', center: [25, -28], region: REGION_AFRICA, terrain: TERRAIN_PLAINS },
  { id: 'north-america', name: '北美', center: [-100, 45], region: REGION_AMERICAS, terrain: TERRAIN_PLAINS },
  { id: 'central-america', name: '中美', center: [-85, 15], region: REGION_AMERICAS, terrain: TERRAIN_FOREST },
  { id: 'south-america', name: '南美', center: [-60, -15], region: REGION_AMERICAS, terrain: TERRAIN_PLAINS },
  { id: 'australia', name: '澳大利亚', center: [135, -25], region: REGION_OCEANIA, terrain: TERRAIN_DESERT },
];

// 邻接关系
const ID_WESTERN_EUROPE = 'western-europe';
const ID_EASTERN_EUROPE = 'eastern-europe';
const ID_RUSSIA = 'russia';
const ID_MIDDLE_EAST = 'middle-east';
const ID_INDIA = 'india';
const ID_CHINA = 'china';
const ID_SOUTHEAST_ASIA = 'southeast-asia';
const ID_JAPAN = 'japan';
const ID_NORTH_AFRICA = 'north-africa';
const ID_CENTRAL_AFRICA = 'central-africa';
const ID_SOUTH_AFRICA = 'south-africa';
const ID_NORTH_AMERICA = 'north-america';
const ID_CENTRAL_AMERICA = 'central-america';
const ID_SOUTH_AMERICA = 'south-america';
const ID_AUSTRALIA = 'australia';

const adjacencyMap: Record<string, string[]> = {
  [ID_WESTERN_EUROPE]: [ID_EASTERN_EUROPE, ID_NORTH_AFRICA],
  [ID_EASTERN_EUROPE]: [ID_WESTERN_EUROPE, ID_RUSSIA, ID_MIDDLE_EAST],
  [ID_RUSSIA]: [ID_EASTERN_EUROPE, ID_MIDDLE_EAST, ID_CHINA],
  [ID_MIDDLE_EAST]: [ID_EASTERN_EUROPE, ID_RUSSIA, ID_NORTH_AFRICA, ID_INDIA],
  [ID_INDIA]: [ID_MIDDLE_EAST, ID_CHINA, ID_SOUTHEAST_ASIA],
  [ID_CHINA]: [ID_RUSSIA, ID_INDIA, ID_SOUTHEAST_ASIA, ID_JAPAN],
  [ID_SOUTHEAST_ASIA]: [ID_INDIA, ID_CHINA, ID_AUSTRALIA],
  [ID_JAPAN]: [ID_CHINA],
  [ID_NORTH_AFRICA]: [ID_WESTERN_EUROPE, ID_MIDDLE_EAST, ID_CENTRAL_AFRICA],
  [ID_CENTRAL_AFRICA]: [ID_NORTH_AFRICA, ID_SOUTH_AFRICA],
  [ID_SOUTH_AFRICA]: [ID_CENTRAL_AFRICA],
  [ID_NORTH_AMERICA]: [ID_CENTRAL_AMERICA],
  [ID_CENTRAL_AMERICA]: [ID_NORTH_AMERICA, ID_SOUTH_AMERICA],
  [ID_SOUTH_AMERICA]: [ID_CENTRAL_AMERICA],
  [ID_AUSTRALIA]: [ID_SOUTHEAST_ASIA],
};

export function createTerritories(): Territory[] {
  const projection = geoEqualEarth().scale(200).translate([500, 300]);

  return worldRegions.map((region) => {
    // 为每个区域创建一个简单的多边形（六边形）
    const [x, y] = projection(region.center) || [0, 0];
    const size = 40;
    const polygon: number[][] = [];
    for (let i = 0; i < 6; i++) {
      const angle = (Math.PI / 3) * i;
      polygon.push([x + size * Math.cos(angle), y + size * Math.sin(angle)]);
    }

    return {
      id: region.id,
      name: region.name,
      polygon,
      adjacentIds: adjacencyMap[region.id] || [],
      terrain: region.terrain,
      resourceYield: {
        food: Math.floor(Math.random() * 5) + 3,
        industry: Math.floor(Math.random() * 5) + 2,
      },
      ownerId: null,
      garrison: 0,
      stability: 50,
    };
  });
}

export function getTerritoryByRegion(
  territories: Territory[],
  region: string
): Territory | undefined {
  const regionData = worldRegions.find((r) => r.region === region);
  if (!regionData) return undefined;

  return territories.find((t) => {
    const rd = worldRegions.find((r) => r.id === t.id);
    return rd?.region === region;
  });
}

export function getRandomTerritoryInRegion(
  territories: Territory[],
  region: string,
  seed: number
): Territory | undefined {
  const regionTerritories = territories.filter((t) => {
    const rd = worldRegions.find((r) => r.id === t.id);
    return rd?.region === region;
  });

  if (regionTerritories.length === 0) return undefined;

  const rng = seedRandom(seed);
  const index = Math.floor(rng() * regionTerritories.length);
  return regionTerritories[index];
}

function seedRandom(seed: number) {
  let current = seed;
  return function () {
    current = (current * 9301 + 49297) % 233280;
    return current / 233280;
  };
}

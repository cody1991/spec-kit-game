import { describe, it, expect } from 'vitest';
import { createInitialWorld } from '@core/generation/createInitialWorld';
import type { Country } from '@core/types';

// Mock国家数据用于测试
const mockCountries: Country[] = [
  {
    id: '840',
    name: '美国',
    nameEn: 'United States',
    geometry: { type: 'MultiPolygon', coordinates: [] },
    centroid: { lat: 40, lon: -100 },
    bbox: { minX: -125, minY: 25, maxX: -65, maxY: 50 },
    area: 9834000,
    neighbors: ['124'],
    gridCells: [],
  },
  {
    id: '124',
    name: '加拿大',
    nameEn: 'Canada',
    geometry: { type: 'MultiPolygon', coordinates: [] },
    centroid: { lat: 60, lon: -95 },
    bbox: { minX: -140, minY: 40, maxX: -50, maxY: 80 },
    area: 9985000,
    neighbors: ['840'],
    gridCells: [],
  },
  {
    id: '156',
    name: '中国',
    nameEn: 'China',
    geometry: { type: 'MultiPolygon', coordinates: [] },
    centroid: { lat: 35, lon: 105 },
    bbox: { minX: 73, minY: 18, maxX: 135, maxY: 53 },
    area: 9597000,
    neighbors: ['643', '356'],
    gridCells: [],
  },
  {
    id: '643',
    name: '俄罗斯',
    nameEn: 'Russia',
    geometry: { type: 'MultiPolygon', coordinates: [] },
    centroid: { lat: 60, lon: 100 },
    bbox: { minX: 20, minY: 40, maxX: 180, maxY: 80 },
    area: 17098000,
    neighbors: ['156', '276'],
    gridCells: [],
  },
  {
    id: '356',
    name: '印度',
    nameEn: 'India',
    geometry: { type: 'MultiPolygon', coordinates: [] },
    centroid: { lat: 20, lon: 78 },
    bbox: { minX: 68, minY: 8, maxX: 97, maxY: 35 },
    area: 3287000,
    neighbors: ['156'],
    gridCells: [],
  },
  {
    id: '276',
    name: '德国',
    nameEn: 'Germany',
    geometry: { type: 'MultiPolygon', coordinates: [] },
    centroid: { lat: 51, lon: 10 },
    bbox: { minX: 6, minY: 47, maxX: 15, maxY: 55 },
    area: 357000,
    neighbors: ['643', '250'],
    gridCells: [],
  },
  {
    id: '250',
    name: '法国',
    nameEn: 'France',
    geometry: { type: 'MultiPolygon', coordinates: [] },
    centroid: { lat: 46, lon: 2 },
    bbox: { minX: -5, minY: 42, maxX: 8, maxY: 51 },
    area: 643801,
    neighbors: ['276'],
    gridCells: [],
  },
  {
    id: '392',
    name: '日本',
    nameEn: 'Japan',
    geometry: { type: 'MultiPolygon', coordinates: [] },
    centroid: { lat: 36, lon: 138 },
    bbox: { minX: 129, minY: 31, maxX: 146, maxY: 45 },
    area: 377975,
    neighbors: [],
    gridCells: [],
  },
  {
    id: '076',
    name: '巴西',
    nameEn: 'Brazil',
    geometry: { type: 'MultiPolygon', coordinates: [] },
    centroid: { lat: -10, lon: -55 },
    bbox: { minX: -74, minY: -34, maxX: -35, maxY: 5 },
    area: 8516000,
    neighbors: ['032'],
    gridCells: [],
  },
  {
    id: '032',
    name: '阿根廷',
    nameEn: 'Argentina',
    geometry: { type: 'MultiPolygon', coordinates: [] },
    centroid: { lat: -34, lon: -64 },
    bbox: { minX: -73, minY: -55, maxX: -53, maxY: -22 },
    area: 2780000,
    neighbors: ['076'],
    gridCells: [],
  },
];

describe('createInitialWorld', () => {
  it('应该生成指定数量的指挥官', () => {
    const { commanders } = createInitialWorld({
      seed: 12345,
      commanderCount: 8,
      countries: mockCountries,
    });
    expect(commanders).toHaveLength(8);
  });

  it('应该为每个指挥官分配初始领土', () => {
    const { commanders } = createInitialWorld({
      seed: 12345,
      commanderCount: 10,
      countries: mockCountries,
    });
    commanders.forEach((commander) => {
      expect(commander.controlledTerritories.length).toBeGreaterThan(0);
    });
  });

  it('相同种子应该生成相同的指挥官组合', () => {
    const seed = 54321;
    const result1 = createInitialWorld({
      seed,
      commanderCount: 10,
      countries: mockCountries,
    });
    const result2 = createInitialWorld({
      seed,
      commanderCount: 10,
      countries: mockCountries,
    });

    expect(result1.commanders.map((c) => c.name)).toEqual(result2.commanders.map((c) => c.name));
  });

  it('不同种子应该生成不同的指挥官组合', () => {
    const result1 = createInitialWorld({
      seed: 111,
      commanderCount: 10,
      countries: mockCountries,
    });
    const result2 = createInitialWorld({
      seed: 222,
      commanderCount: 10,
      countries: mockCountries,
    });

    const names1 = result1.commanders.map((c) => c.name);
    const names2 = result2.commanders.map((c) => c.name);

    // 至少应该有一些不同
    const hasMinOneDifference = names1.some((name, idx) => name !== names2[idx]);
    expect(hasMinOneDifference).toBe(true);
  });

  it('所有指挥官应该有有效的属性', () => {
    const { commanders } = createInitialWorld({
      seed: 99999,
      commanderCount: 10,
      countries: mockCountries,
    });

    commanders.forEach((commander) => {
      expect(commander.baseAttributes.attack).toBeGreaterThanOrEqual(40);
      expect(commander.baseAttributes.attack).toBeLessThanOrEqual(100);
      expect(commander.baseAttributes.defense).toBeGreaterThanOrEqual(40);
      expect(commander.baseAttributes.defense).toBeLessThanOrEqual(100);
      expect(commander.baseAttributes.mobility).toBeGreaterThanOrEqual(40);
      expect(commander.baseAttributes.mobility).toBeLessThanOrEqual(100);
      expect(commander.baseAttributes.leadership).toBeGreaterThanOrEqual(40);
      expect(commander.baseAttributes.leadership).toBeLessThanOrEqual(100);

      expect(commander.currentPower).toBeGreaterThanOrEqual(80);
      expect(commander.currentPower).toBeLessThanOrEqual(100);

      expect(commander.morale).toBeGreaterThanOrEqual(70);
      expect(commander.morale).toBeLessThanOrEqual(100);

      expect(commander.status).toBe('active');
    });
  });

  it('应该创建领土并覆盖多个地区（现在是国家）', () => {
    const { territories } = createInitialWorld({
      seed: 12345,
      commanderCount: 10,
      countries: mockCountries,
    });

    // 应该基于国家数据创建领土
    expect(territories.length).toBe(mockCountries.length);

    // 检查领土ID是国家ID（数字字符串）
    territories.forEach((t) => {
      expect(mockCountries.some((c) => c.id === t.id)).toBe(true);
    });

    // 检查领土有相邻关系
    const hasAdjacency = territories.some((t) => t.adjacentIds.length > 0);
    expect(hasAdjacency).toBe(true);
  });

  it('领土ID应该是国家ID而非区域ID', () => {
    const { territories } = createInitialWorld({
      seed: 12345,
      commanderCount: 5,
      countries: mockCountries,
    });

    // 所有territory ID应该是数字字符串（ISO3数字码）
    territories.forEach((t) => {
      expect(t.id).toMatch(/^\d+$/); // 只包含数字
      expect(t.id.includes('-')).toBe(false); // 不包含连字符（旧区域ID特征）
    });
  });

  it('指挥官的controlledTerritories应该包含国家ID', () => {
    const { commanders } = createInitialWorld({
      seed: 12345,
      commanderCount: 5,
      countries: mockCountries,
    });

    commanders.forEach((commander) => {
      commander.controlledTerritories.forEach((territoryId) => {
        expect(territoryId).toMatch(/^\d+$/); // 应该是数字字符串
        expect(mockCountries.some((c) => c.id === territoryId)).toBe(true); // 应该存在于国家列表中
      });
    });
  });
});

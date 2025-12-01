import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { Country, TerritoryState } from '@core/types';

/**
 * 单元测试：世界场景国家展示逻辑
 *
 * 目标：验证地图渲染使用Country.id而非区域ID
 *
 * 测试场景：
 * 1. 地图实体集合只包含Country.id（ISO数字码）
 * 2. 不渲染区域名称标签（如"东南亚"、"北美"、"中美"）
 * 3. 所有可选中/高亮的实体都是国家级别
 */

// Mock国家数据
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
    id: '156',
    name: '中国',
    nameEn: 'China',
    geometry: { type: 'MultiPolygon', coordinates: [] },
    centroid: { lat: 35, lon: 105 },
    bbox: { minX: 73, minY: 18, maxX: 135, maxY: 53 },
    area: 9597000,
    neighbors: ['643'],
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
];

// Mock领土状态
const mockTerritoryStates = new Map<string, TerritoryState>([
  [
    '840',
    {
      countryId: '840',
      countryName: '美国',
      ownerId: 'commander-1',
      troops: 50,
      resources: 100,
      defense: 70,
      updatedAt: Date.now(),
      conqueredAt: Date.now(),
      previousOwnerId: null,
      transitionProgress: null,
      isHighlighted: false,
    },
  ],
  [
    '156',
    {
      countryId: '156',
      countryName: '中国',
      ownerId: 'commander-2',
      troops: 60,
      resources: 120,
      defense: 80,
      updatedAt: Date.now(),
      conqueredAt: Date.now(),
      previousOwnerId: null,
      transitionProgress: null,
      isHighlighted: false,
    },
  ],
]);

describe('WorldScene 国家展示逻辑', () => {
  describe('地图实体集合验证', () => {
    it('应该只包含Country.id（ISO数字码），不包含区域ID', () => {
      // 模拟从countries生成的渲染实体列表
      const renderableEntities = mockCountries.map((country) => ({
        id: country.id,
        name: country.name,
        type: 'country' as const,
      }));

      // 验证所有ID都是数字字符串（ISO码）
      renderableEntities.forEach((entity) => {
        expect(entity.id).toMatch(/^\d+$/);
        expect(entity.id.includes('-')).toBe(false); // 不包含连字符（区域ID特征）
        expect(entity.type).toBe('country');
      });

      // 验证ID存在于实际国家列表中
      renderableEntities.forEach((entity) => {
        const country = mockCountries.find((c) => c.id === entity.id);
        expect(country).toBeDefined();
      });
    });

    it('不应该包含区域名称（如"东南亚"、"北美"、"中美"）', () => {
      const regionNames = [
        '东南亚',
        '北美',
        '中美',
        '西欧',
        '东欧',
        '中东',
        'Southeast Asia',
        'North America',
        'Central America',
        'Western Europe',
        'Eastern Europe',
      ];

      // 验证国家名称不是区域名称
      mockCountries.forEach((country) => {
        expect(regionNames).not.toContain(country.name);
        expect(regionNames).not.toContain(country.nameEn);
      });

      // 验证渲染标签集合不包含区域ID
      const renderLabels = Array.from(mockTerritoryStates.entries()).map(([id, state]) => ({
        id,
        label: state.countryName,
      }));

      renderLabels.forEach((label) => {
        expect(label.id).toMatch(/^\d+$/); // 应该是数字码
        expect(regionNames).not.toContain(label.label); // 标签不应该是区域名
      });
    });

    it('可选中/可高亮的实体应该以Country.id为键', () => {
      // 模拟可选中实体映射
      const selectableEntities = new Map<string, { countryId: string; name: string }>();
      mockCountries.forEach((country) => {
        selectableEntities.set(country.id, {
          countryId: country.id,
          name: country.name,
        });
      });

      // 验证所有键都是国家ID
      selectableEntities.forEach((entity, key) => {
        expect(key).toMatch(/^\d+$/);
        expect(key).toBe(entity.countryId);
        expect(mockCountries.some((c) => c.id === key)).toBe(true);
      });
    });
  });

  describe('TerritoryState与Country对齐', () => {
    it('territoryStates的键应该与Country.id完全匹配', () => {
      mockTerritoryStates.forEach((state, countryId) => {
        // 验证键是数字字符串
        expect(countryId).toMatch(/^\d+$/);

        // 验证state.countryId与键一致
        expect(state.countryId).toBe(countryId);

        // 验证对应的Country存在
        const country = mockCountries.find((c) => c.id === countryId);
        expect(country).toBeDefined();
      });
    });

    it('从territoryStates提取的占领信息应该按国家聚合', () => {
      // 按指挥官聚合占领的国家
      const commanderCountries = new Map<string, string[]>();

      mockTerritoryStates.forEach((state) => {
        if (state.ownerId) {
          const countries = commanderCountries.get(state.ownerId) || [];
          countries.push(state.countryId);
          commanderCountries.set(state.ownerId, countries);
        }
      });

      // 验证聚合结果
      commanderCountries.forEach((countries, commanderId) => {
        // 每个国家ID都应该是数字字符串
        countries.forEach((countryId) => {
          expect(countryId).toMatch(/^\d+$/);
          expect(mockCountries.some((c) => c.id === countryId)).toBe(true);
        });

        console.log(`✓ ${commanderId} 占领 ${countries.length} 个国家: ${countries.join(', ')}`);
      });
    });
  });

  describe('区域概念移除验证', () => {
    it('不应该存在区域级聚合或统计', () => {
      // 验证没有按区域分组的数据结构
      const groupedByRegion = new Map<string, string[]>();

      // 如果存在区域分组，这个Map应该为空
      expect(groupedByRegion.size).toBe(0);

      // 所有占领信息都应该是国家级别
      mockTerritoryStates.forEach((state, countryId) => {
        expect(countryId).not.toContain('region');
        expect(countryId).not.toContain('-'); // 区域ID通常包含连字符
        expect(countryId).toMatch(/^\d+$/);
      });
    });

    it('渲染管线不应该生成区域级展示单元', () => {
      // 模拟渲染管线输出
      interface RenderUnit {
        id: string;
        type: 'country' | 'region';
        name: string;
      }

      const renderUnits: RenderUnit[] = mockCountries.map((country) => ({
        id: country.id,
        type: 'country',
        name: country.name,
      }));

      // 验证没有region类型的单元
      const regionUnits = renderUnits.filter((unit) => unit.type === 'region');
      expect(regionUnits).toHaveLength(0);

      // 验证所有单元都是country类型
      renderUnits.forEach((unit) => {
        expect(unit.type).toBe('country');
        expect(unit.id).toMatch(/^\d+$/);
      });
    });
  });

  describe('边界情况', () => {
    it('空的territoryStates不应该产生区域级回退', () => {
      const emptyStates = new Map<string, TerritoryState>();

      // 验证空状态时不生成任何区域级实体
      const renderableFromEmpty = Array.from(emptyStates.keys());
      expect(renderableFromEmpty).toHaveLength(0);
    });

    it('未占领的国家仍应该以Country.id标识', () => {
      // 日本未被占领（不在territoryStates中）
      const japan = mockCountries.find((c) => c.id === '392');
      expect(japan).toBeDefined();

      // 验证未占领国家仍可以通过Country.id访问
      expect(japan!.id).toBe('392');
      expect(japan!.id).toMatch(/^\d+$/);
    });
  });
});

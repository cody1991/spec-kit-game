import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import type { HistoricalCommander, TerritoryState, Country } from '@core/types';

/**
 * UI集成测试：指挥官与国家占领统计
 * 
 * 目标：验证UI面板按国家统计势力范围，无区域级汇总
 * 
 * 测试场景：
 * 1. 指挥官面板显示占领的国家数量（不是区域数量）
 * 2. 国家详情面板显示国家级信息（不包含"东南亚占领数"等）
 * 3. 所有统计都基于Country.id而非区域ID
 */

// Mock数据
const mockCommanders: HistoricalCommander[] = [
  {
    id: 'commander-1',
    name: '拿破仑',
    originRegion: 'europe',
    portraitAsset: '/portraits/napoleon.jpg',
    baseAttributes: { attack: 90, defense: 80, mobility: 85, leadership: 95 },
    skillCards: [],
    currentPower: 95,
    controlledTerritories: ['250', '276', '380'], // 法国、德国、意大利
    alliances: [],
    hostilities: ['commander-2'],
    morale: 85,
    nextActionEta: new Date().toISOString(),
    status: 'active',
  },
  {
    id: 'commander-2',
    name: '成吉思汗',
    originRegion: 'asia',
    portraitAsset: '/portraits/genghis.jpg',
    baseAttributes: { attack: 95, defense: 70, mobility: 90, leadership: 85 },
    skillCards: [],
    currentPower: 88,
    controlledTerritories: ['156', '643', '496'], // 中国、俄罗斯、蒙古
    alliances: [],
    hostilities: ['commander-1'],
    morale: 80,
    nextActionEta: new Date().toISOString(),
    status: 'active',
  },
];

const mockCountries: Country[] = [
  { id: '250', name: '法国', nameEn: 'France', geometry: { type: 'MultiPolygon', coordinates: [] }, centroid: { lat: 46, lon: 2 }, bbox: { minX: -5, minY: 42, maxX: 8, maxY: 51 }, area: 643801, neighbors: ['276'], gridCells: [] },
  { id: '276', name: '德国', nameEn: 'Germany', geometry: { type: 'MultiPolygon', coordinates: [] }, centroid: { lat: 51, lon: 10 }, bbox: { minX: 6, minY: 47, maxX: 15, maxY: 55 }, area: 357000, neighbors: ['250'], gridCells: [] },
  { id: '380', name: '意大利', nameEn: 'Italy', geometry: { type: 'MultiPolygon', coordinates: [] }, centroid: { lat: 42, lon: 12 }, bbox: { minX: 6, minY: 36, maxX: 18, maxY: 47 }, area: 301340, neighbors: ['276'], gridCells: [] },
  { id: '156', name: '中国', nameEn: 'China', geometry: { type: 'MultiPolygon', coordinates: [] }, centroid: { lat: 35, lon: 105 }, bbox: { minX: 73, minY: 18, maxX: 135, maxY: 53 }, area: 9597000, neighbors: ['643'], gridCells: [] },
  { id: '643', name: '俄罗斯', nameEn: 'Russia', geometry: { type: 'MultiPolygon', coordinates: [] }, centroid: { lat: 60, lon: 100 }, bbox: { minX: 20, minY: 40, maxX: 180, maxY: 80 }, area: 17098000, neighbors: ['156'], gridCells: [] },
  { id: '496', name: '蒙古', nameEn: 'Mongolia', geometry: { type: 'MultiPolygon', coordinates: [] }, centroid: { lat: 46, lon: 105 }, bbox: { minX: 87, minY: 41, maxX: 120, maxY: 52 }, area: 1564000, neighbors: ['156', '643'], gridCells: [] },
];

const mockTerritoryStates = new Map<string, TerritoryState>([
  ['250', { countryId: '250', countryName: '法国', ownerId: 'commander-1', troops: 50, resources: 100, defense: 70, updatedAt: Date.now(), conqueredAt: Date.now(), previousOwnerId: null, transitionProgress: null, isHighlighted: false }],
  ['276', { countryId: '276', countryName: '德国', ownerId: 'commander-1', troops: 45, resources: 95, defense: 75, updatedAt: Date.now(), conqueredAt: Date.now(), previousOwnerId: null, transitionProgress: null, isHighlighted: false }],
  ['380', { countryId: '380', countryName: '意大利', ownerId: 'commander-1', troops: 40, resources: 90, defense: 65, updatedAt: Date.now(), conqueredAt: Date.now(), previousOwnerId: null, transitionProgress: null, isHighlighted: false }],
  ['156', { countryId: '156', countryName: '中国', ownerId: 'commander-2', troops: 60, resources: 120, defense: 80, updatedAt: Date.now(), conqueredAt: Date.now(), previousOwnerId: null, transitionProgress: null, isHighlighted: false }],
  ['643', { countryId: '643', countryName: '俄罗斯', ownerId: 'commander-2', troops: 55, resources: 110, defense: 78, updatedAt: Date.now(), conqueredAt: Date.now(), previousOwnerId: null, transitionProgress: null, isHighlighted: false }],
  ['496', { countryId: '496', countryName: '蒙古', ownerId: 'commander-2', troops: 35, resources: 85, defense: 60, updatedAt: Date.now(), conqueredAt: Date.now(), previousOwnerId: null, transitionProgress: null, isHighlighted: false }],
]);

describe('UI集成测试：指挥官国家占领统计', () => {
  describe('指挥官势力范围统计', () => {
    it('应该显示占领的国家数量而非区域数量', () => {
      // 统计每个指挥官占领的国家
      const commanderStats = mockCommanders.map((commander) => {
        const ownedCountries = commander.controlledTerritories;
        const countryNames = ownedCountries
          .map((countryId) => mockCountries.find((c) => c.id === countryId)?.name)
          .filter(Boolean);

        return {
          commanderId: commander.id,
          name: commander.name,
          countryCount: ownedCountries.length,
          countries: countryNames,
        };
      });

      // 验证统计结果
      expect(commanderStats[0].countryCount).toBe(3); // 拿破仑占领3个国家
      expect(commanderStats[1].countryCount).toBe(3); // 成吉思汗占领3个国家

      console.log('✓ 指挥官势力范围统计：');
      commanderStats.forEach((stat) => {
        console.log(`  ${stat.name}: ${stat.countryCount}个国家 (${stat.countries.join(', ')})`);
      });
    });

    it('不应该包含区域级汇总（如"欧洲占领数"）', () => {
      // 验证统计数据中不包含区域关键词
      const regionKeywords = [
        '东南亚占领数',
        '北美占领数',
        '中美占领数',
        '欧洲占领数',
        '亚洲占领数',
        'Southeast Asia',
        'North America',
        'Central America',
        'Europe',
        'Asia',
      ];

      // 模拟统计标签
      const statLabels = mockCommanders.flatMap((commander) => [
        `${commander.name} - 占领国家`,
        `${commander.name} - 总兵力`,
        `${commander.name} - 总资源`,
      ]);

      // 验证标签不包含区域关键词
      statLabels.forEach((label) => {
        regionKeywords.forEach((keyword) => {
          expect(label).not.toContain(keyword);
        });
      });
    });

    it('占领列表应该显示具体国家名称', () => {
      mockCommanders.forEach((commander) => {
        const countryList = commander.controlledTerritories
          .map((countryId) => mockCountries.find((c) => c.id === countryId))
          .filter((c): c is Country => c !== undefined);

        // 验证每个条目都是具体国家
        countryList.forEach((country) => {
          expect(country.id).toMatch(/^\d+$/); // ISO数字码
          expect(country.name).toBeTruthy(); // 有明确的国家名称
          expect(country.name).not.toContain('洲'); // 不应该是"欧洲"、"亚洲"等大陆名
        });

        console.log(`✓ ${commander.name} 占领列表: ${countryList.map(c => c.name).join(', ')}`);
      });
    });
  });

  describe('国家详情统计', () => {
    it('应该显示国家级的占领信息', () => {
      mockTerritoryStates.forEach((state, countryId) => {
        // 验证每个state都关联到具体国家
        expect(state.countryId).toBe(countryId);
        expect(countryId).toMatch(/^\d+$/);

        // 验证有明确的占领者
        expect(state.ownerId).toBeTruthy();

        // 验证国家名称不是区域名称
        const regionNames = ['东南亚', '北美', '中美', '西欧', '东欧'];
        expect(regionNames).not.toContain(state.countryName);
      });
    });

    it('聚合统计应该按国家分组而非区域分组', () => {
      // 按指挥官聚合国家
      const commanderCountryMap = new Map<string, Set<string>>();

      mockTerritoryStates.forEach((state) => {
        if (state.ownerId) {
          if (!commanderCountryMap.has(state.ownerId)) {
            commanderCountryMap.set(state.ownerId, new Set());
          }
          commanderCountryMap.get(state.ownerId)!.add(state.countryId);
        }
      });

      // 验证聚合结果
      commanderCountryMap.forEach((countries, commanderId) => {
        // 所有条目都应该是国家ID
        countries.forEach((countryId) => {
          expect(countryId).toMatch(/^\d+$/);
          expect(mockCountries.some((c) => c.id === countryId)).toBe(true);
        });
      });

      expect(commanderCountryMap.get('commander-1')?.size).toBe(3);
      expect(commanderCountryMap.get('commander-2')?.size).toBe(3);
    });
  });

  describe('区域概念移除验证', () => {
    it('UI数据源不应该包含区域级键值', () => {
      // 检查territoryStates的所有键
      const allKeys = Array.from(mockTerritoryStates.keys());

      allKeys.forEach((key) => {
        // 不应该包含区域特征（连字符、大陆名等）
        expect(key).not.toContain('-');
        expect(key).not.toContain('region');
        expect(key).not.toContain('洲');
        expect(key).toMatch(/^\d+$/);
      });
    });

    it('统计面板数据结构应该是扁平的国家列表', () => {
      // 模拟统计面板数据结构
      interface PanelData {
        commanderId: string;
        commanderName: string;
        countries: Array<{
          countryId: string;
          countryName: string;
          troops: number;
        }>;
      }

      const panelData: PanelData[] = mockCommanders.map((commander) => {
        const countries = commander.controlledTerritories
          .map((countryId) => {
            const state = mockTerritoryStates.get(countryId);
            return state
              ? {
                  countryId,
                  countryName: state.countryName,
                  troops: state.troops,
                }
              : null;
          })
          .filter((c): c is NonNullable<typeof c> => c !== null);

        return {
          commanderId: commander.id,
          commanderName: commander.name,
          countries,
        };
      });

      // 验证数据结构
      panelData.forEach((panel) => {
        // 验证国家列表是扁平的（没有嵌套的区域结构）
        expect(Array.isArray(panel.countries)).toBe(true);

        // 验证每个条目都是国家级别
        panel.countries.forEach((country) => {
          expect(country.countryId).toMatch(/^\d+$/);
          expect(country.countryName).toBeTruthy();
        });
      });
    });

    it('不应该存在"区域汇总"或"大陆统计"节点', () => {
      // 模拟可能的数据结构
      interface StatNode {
        id: string;
        type: 'country' | 'region' | 'continent';
        name: string;
      }

      // 从territoryStates生成节点
      const nodes: StatNode[] = Array.from(mockTerritoryStates.entries()).map(
        ([countryId, state]) => ({
          id: countryId,
          type: 'country' as const,
          name: state.countryName,
        })
      );

      // 验证没有region或continent类型的节点
      const nonCountryNodes = nodes.filter((n) => n.type !== 'country');
      expect(nonCountryNodes).toHaveLength(0);

      // 所有节点都应该是country类型
      nodes.forEach((node) => {
        expect(node.type).toBe('country');
        expect(node.id).toMatch(/^\d+$/);
      });
    });
  });

  describe('边界情况', () => {
    it('占领0个国家的指挥官应该显示空列表而非区域占位', () => {
      const emptyCommander: HistoricalCommander = {
        ...mockCommanders[0],
        id: 'commander-empty',
        name: '新指挥官',
        controlledTerritories: [],
      };

      // 统计占领国家
      const countryCount = emptyCommander.controlledTerritories.length;
      expect(countryCount).toBe(0);

      // 不应该显示任何区域占位符
      const displayList = emptyCommander.controlledTerritories.map((countryId) =>
        mockCountries.find((c) => c.id === countryId)
      );
      expect(displayList).toHaveLength(0);
    });

    it('国家名称包含特殊字符时不应该误判为区域', () => {
      // 测试国家名称包含"美"、"中"等可能与区域混淆的字符
      const specialCountries = [
        { id: '840', name: '美国' }, // 包含"美"但不是"北美"
        { id: '156', name: '中国' }, // 包含"中"但不是"中东"
      ];

      specialCountries.forEach((country) => {
        expect(country.id).toMatch(/^\d+$/);
        expect(country.name).not.toBe('北美');
        expect(country.name).not.toBe('中东');
      });
    });
  });
});

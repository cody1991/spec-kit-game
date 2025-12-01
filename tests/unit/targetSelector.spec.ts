/**
 * 目标选择器测试
 * Feature: 007-conquest-logic-fix
 *
 * 测试 User Story 2: 占领更倾向于相邻国家
 */

import { describe, it, expect } from 'vitest';
import {
  selectTarget,
  calculateSelectionStats,
  type TargetSelectionResult,
} from '../../app/src/core/simulation/systems/targetSelector';
import type { HistoricalCommander, Territory } from '../../app/src/core/types';
import { DEFAULT_CONQUEST_CONFIG } from '../../app/src/config/conquest.config';

// 创建测试用的领主
function createMockCommander(
  id: string,
  territories: string[] = []
): HistoricalCommander {
  return {
    id,
    name: `Commander ${id}`,
    originRegion: 'europe',
    portraitAsset: `/portraits/commander.jpg`,
    baseAttributes: { attack: 70, defense: 70, mobility: 70, leadership: 70 },
    skillCards: [],
    currentPower: 80,
    controlledTerritories: territories,
    alliances: [],
    hostilities: [],
    morale: 80,
    nextActionEta: new Date().toISOString(),
    status: 'active',
  };
}

// 创建测试用的领土
function createMockTerritory(
  id: string,
  adjacentIds: string[] = [],
  ownerId: string | null = null
): Territory {
  return {
    id,
    name: `Territory ${id}`,
    polygon: [],
    adjacentIds,
    terrain: 'plains',
    resourceYield: { food: 5, industry: 5 },
    ownerId,
    garrison: 50,
    stability: 70,
  };
}

describe('targetSelector', () => {
  describe('selectTarget', () => {
    it('应该在有相邻目标时优先选择相邻目标（85%概率）', () => {
      const attacker = createMockCommander('attacker', ['t1']);
      const territoryMap = new Map<string, Territory>([
        ['t1', createMockTerritory('t1', ['t2', 't3'], 'attacker')],
        ['t2', createMockTerritory('t2', ['t1'], 'enemy')],
        ['t3', createMockTerritory('t3', ['t1'], null)], // 中立
        ['t4', createMockTerritory('t4', [], 'enemy')], // 远程
      ]);
      const allTerritoryIds = ['t1', 't2', 't3', 't4'];

      // 运行多次测试概率分布
      const results: TargetSelectionResult[] = [];
      for (let i = 0; i < 1000; i++) {
        const result = selectTarget(attacker, territoryMap, allTerritoryIds);
        if (result) results.push(result);
      }

      const stats = calculateSelectionStats(results);

      // 允许±5%误差，85%概率应该在80%-90%之间
      expect(stats.adjacentRatio).toBeGreaterThan(0.80);
      expect(stats.adjacentRatio).toBeLessThan(0.90);
    });

    it('应该在无相邻目标时选择远程目标', () => {
      const attacker = createMockCommander('attacker', ['t1']);
      const territoryMap = new Map<string, Territory>([
        ['t1', createMockTerritory('t1', [], 'attacker')], // 无相邻
        ['t2', createMockTerritory('t2', [], 'enemy')],
        ['t3', createMockTerritory('t3', [], 'enemy')],
      ]);
      const allTerritoryIds = ['t1', 't2', 't3'];

      const result = selectTarget(attacker, territoryMap, allTerritoryIds);

      expect(result).not.toBeNull();
      expect(result?.isAdjacent).toBe(false);
      expect(result?.selectionType).toBe('remote');
      expect(['t2', 't3']).toContain(result?.targetId);
    });

    it('应该在无任何目标时返回null', () => {
      const attacker = createMockCommander('attacker', ['t1']);
      const territoryMap = new Map<string, Territory>([
        ['t1', createMockTerritory('t1', [], 'attacker')],
      ]);
      const allTerritoryIds = ['t1'];

      const result = selectTarget(attacker, territoryMap, allTerritoryIds);

      expect(result).toBeNull();
    });

    it('应该在攻击方无领土时返回null', () => {
      const attacker = createMockCommander('attacker', []);
      const territoryMap = new Map<string, Territory>([
        ['t1', createMockTerritory('t1', [], 'enemy')],
      ]);
      const allTerritoryIds = ['t1'];

      const result = selectTarget(attacker, territoryMap, allTerritoryIds);

      expect(result).toBeNull();
    });

    it('应该不选择自己的领土作为目标', () => {
      const attacker = createMockCommander('attacker', ['t1', 't2']);
      const territoryMap = new Map<string, Territory>([
        ['t1', createMockTerritory('t1', ['t2', 't3'], 'attacker')],
        ['t2', createMockTerritory('t2', ['t1'], 'attacker')],
        ['t3', createMockTerritory('t3', ['t1'], 'enemy')],
      ]);
      const allTerritoryIds = ['t1', 't2', 't3'];

      for (let i = 0; i < 100; i++) {
        const result = selectTarget(attacker, territoryMap, allTerritoryIds);
        expect(result?.targetId).toBe('t3');
      }
    });

    it('应该在禁用远程攻击时只选择相邻目标', () => {
      const attacker = createMockCommander('attacker', ['t1']);
      const territoryMap = new Map<string, Territory>([
        ['t1', createMockTerritory('t1', ['t2'], 'attacker')],
        ['t2', createMockTerritory('t2', ['t1'], 'enemy')],
        ['t3', createMockTerritory('t3', [], 'enemy')], // 远程
      ]);
      const allTerritoryIds = ['t1', 't2', 't3'];

      const config = { ...DEFAULT_CONQUEST_CONFIG, allowRemoteAttack: false };

      for (let i = 0; i < 100; i++) {
        const result = selectTarget(attacker, territoryMap, allTerritoryIds, config);
        expect(result?.targetId).toBe('t2');
        expect(result?.isAdjacent).toBe(true);
      }
    });
  });

  describe('calculateSelectionStats', () => {
    it('应该正确计算统计数据', () => {
      const results: TargetSelectionResult[] = [
        { targetId: 't1', isAdjacent: true, selectionType: 'adjacent' },
        { targetId: 't2', isAdjacent: true, selectionType: 'adjacent' },
        { targetId: 't3', isAdjacent: false, selectionType: 'remote' },
        { targetId: 't4', isAdjacent: true, selectionType: 'adjacent' },
      ];

      const stats = calculateSelectionStats(results);

      expect(stats.totalSelections).toBe(4);
      expect(stats.adjacentSelections).toBe(3);
      expect(stats.remoteSelections).toBe(1);
      expect(stats.adjacentRatio).toBe(0.75);
      expect(stats.remoteRatio).toBe(0.25);
    });

    it('应该处理空结果', () => {
      const stats = calculateSelectionStats([]);

      expect(stats.totalSelections).toBe(0);
      expect(stats.adjacentRatio).toBe(0);
      expect(stats.remoteRatio).toBe(0);
    });
  });

  describe('概率分布验证（1000次模拟）', () => {
    it('应该符合85%/15%的概率分布（允许±5%误差）', () => {
      const attacker = createMockCommander('attacker', ['t1']);
      
      // 创建一个有足够相邻和远程目标的场景
      const territoryMap = new Map<string, Territory>();
      const allTerritoryIds: string[] = [];

      // t1 是攻击方领土，有5个相邻敌对领土
      territoryMap.set('t1', createMockTerritory('t1', ['adj1', 'adj2', 'adj3', 'adj4', 'adj5'], 'attacker'));
      allTerritoryIds.push('t1');

      // 5个相邻敌对领土
      for (let i = 1; i <= 5; i++) {
        const id = `adj${i}`;
        territoryMap.set(id, createMockTerritory(id, ['t1'], 'enemy'));
        allTerritoryIds.push(id);
      }

      // 5个远程敌对领土
      for (let i = 1; i <= 5; i++) {
        const id = `remote${i}`;
        territoryMap.set(id, createMockTerritory(id, [], 'enemy'));
        allTerritoryIds.push(id);
      }

      // 运行1000次模拟
      const results: TargetSelectionResult[] = [];
      for (let i = 0; i < 1000; i++) {
        const result = selectTarget(attacker, territoryMap, allTerritoryIds);
        if (result) results.push(result);
      }

      const stats = calculateSelectionStats(results);

      // 验证概率分布
      // 85% ± 5% = [80%, 90%]
      expect(stats.adjacentRatio).toBeGreaterThanOrEqual(0.80);
      expect(stats.adjacentRatio).toBeLessThanOrEqual(0.90);

      // 15% ± 5% = [10%, 20%]
      expect(stats.remoteRatio).toBeGreaterThanOrEqual(0.10);
      expect(stats.remoteRatio).toBeLessThanOrEqual(0.20);

      console.log(`概率分布验证: 相邻=${(stats.adjacentRatio * 100).toFixed(1)}%, 远程=${(stats.remoteRatio * 100).toFixed(1)}%`);
    });
  });
});

/**
 * 领主初始化验证器测试
 * Feature: 007-conquest-logic-fix
 *
 * 测试 User Story 1: 领主初始化必须拥有国家
 */

import { describe, it, expect } from 'vitest';
import {
  validateCommanders,
  filterValidCommanders,
  isValidCommander,
} from '../../app/src/core/generation/commanderValidator';
import type { HistoricalCommander } from '../../app/src/core/types';

// 创建测试用的领主模板
function createMockCommander(
  id: string,
  name: string,
  territories: string[] = []
): HistoricalCommander {
  return {
    id,
    name,
    originRegion: 'europe',
    portraitAsset: `/portraits/${name}.jpg`,
    baseAttributes: {
      attack: 70,
      defense: 70,
      mobility: 70,
      leadership: 70,
    },
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

describe('commanderValidator', () => {
  describe('validateCommanders', () => {
    it('应该将无领土的领主标记为排除', () => {
      const commanders = [
        createMockCommander('c1', 'Commander1', []), // 无领土
        createMockCommander('c2', 'Commander2', ['territory-1']), // 有领土
      ];

      const result = validateCommanders(commanders);

      expect(result.isValid).toBe(false);
      expect(result.validCommanders).toHaveLength(1);
      expect(result.excludedCommanders).toHaveLength(1);
      expect(result.excludedCommanders[0].id).toBe('c1');
      expect(result.exclusionReasons.get('c1')).toBe('无法分配初始领土');
    });

    it('应该保留有领土的领主', () => {
      const commanders = [
        createMockCommander('c1', 'Commander1', ['territory-1']),
        createMockCommander('c2', 'Commander2', ['territory-2', 'territory-3']),
      ];

      const result = validateCommanders(commanders);

      expect(result.isValid).toBe(true);
      expect(result.validCommanders).toHaveLength(2);
      expect(result.excludedCommanders).toHaveLength(0);
    });

    it('应该处理空领主列表', () => {
      const result = validateCommanders([]);

      expect(result.isValid).toBe(true);
      expect(result.validCommanders).toHaveLength(0);
      expect(result.excludedCommanders).toHaveLength(0);
    });

    it('应该处理所有领主都无领土的情况', () => {
      const commanders = [
        createMockCommander('c1', 'Commander1', []),
        createMockCommander('c2', 'Commander2', []),
        createMockCommander('c3', 'Commander3', []),
      ];

      const result = validateCommanders(commanders);

      expect(result.isValid).toBe(false);
      expect(result.validCommanders).toHaveLength(0);
      expect(result.excludedCommanders).toHaveLength(3);
    });
  });

  describe('filterValidCommanders', () => {
    it('应该过滤无领土领主', () => {
      const commanders = [
        createMockCommander('c1', 'Commander1', []),
        createMockCommander('c2', 'Commander2', ['territory-1']),
        createMockCommander('c3', 'Commander3', []),
        createMockCommander('c4', 'Commander4', ['territory-2']),
      ];

      const valid = filterValidCommanders(commanders);

      expect(valid).toHaveLength(2);
      expect(valid.map((c) => c.id)).toEqual(['c2', 'c4']);
    });

    it('应该保留所有有领土的领主', () => {
      const commanders = [
        createMockCommander('c1', 'Commander1', ['t1']),
        createMockCommander('c2', 'Commander2', ['t2']),
      ];

      const valid = filterValidCommanders(commanders);

      expect(valid).toHaveLength(2);
    });
  });

  describe('isValidCommander', () => {
    it('有领土的领主应该有效', () => {
      const commander = createMockCommander('c1', 'Commander1', ['territory-1']);
      expect(isValidCommander(commander)).toBe(true);
    });

    it('无领土的领主应该无效', () => {
      const commander = createMockCommander('c1', 'Commander1', []);
      expect(isValidCommander(commander)).toBe(false);
    });

    it('有多个领土的领主应该有效', () => {
      const commander = createMockCommander('c1', 'Commander1', ['t1', 't2', 't3']);
      expect(isValidCommander(commander)).toBe(true);
    });
  });
});

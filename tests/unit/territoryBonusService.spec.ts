import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TerritoryBonusService } from '../../app/src/core/services/territoryBonusService';
import type { Country, TerritoryBonusConfig } from '../../app/src/core/types';

// Mock the store
vi.mock('../../app/src/core/state/store', () => ({
  useGameStore: {
    getState: vi.fn(() => ({
      commanders: [],
      countries: [],
    })),
  },
}));

// Mock the logger
vi.mock('../../app/src/config/debug.config', () => ({
  logger: {
    log: vi.fn(),
  },
}));

describe('TerritoryBonusService', () => {
  let service: TerritoryBonusService;
  const defaultConfig: TerritoryBonusConfig = {
    maxAttackBonus: 0.5,
    maxDefenseBonus: 0.4,
    cityBaseFactor: 0.004, // 每个城市 +0.4%
    cityScaleFactor: 0,
    areaBaseFactor: 0.5,
    areaScaleFactor: 0,
    continuityBonus: 0.1,
    smallFactionDefenseBonus: 0.1,
    smallFactionThreshold: 5,
  };

  beforeEach(() => {
    service = new TerritoryBonusService(defaultConfig);
  });

  // =========================================================================
  // T010: 城市加成计算测试
  // =========================================================================
  describe('calculateCityBonus', () => {
    it('should return 0 for 0 cities', () => {
      expect(service.calculateCityBonus(0)).toBe(0);
    });

    it('should return 0 for negative cities', () => {
      expect(service.calculateCityBonus(-1)).toBe(0);
    });

    it('should return positive bonus for 1 city', () => {
      const bonus = service.calculateCityBonus(1);
      expect(bonus).toBeGreaterThan(0);
      expect(bonus).toBeLessThan(0.1); // Should be small for 1 city
    });

    it('should increase with more cities (linear growth)', () => {
      const bonus1 = service.calculateCityBonus(1);
      const bonus10 = service.calculateCityBonus(10);
      const bonus50 = service.calculateCityBonus(50);
      const bonus100 = service.calculateCityBonus(100);

      // Should increase linearly
      expect(bonus10).toBeCloseTo(bonus1 * 10, 5);
      expect(bonus50).toBeCloseTo(bonus1 * 50, 5);
      // 100 cities should hit the cap
      expect(bonus100).toBeLessThanOrEqual(defaultConfig.maxAttackBonus);
    });

    it('should not exceed maxAttackBonus', () => {
      const bonus = service.calculateCityBonus(100);
      expect(bonus).toBeLessThanOrEqual(defaultConfig.maxAttackBonus);
    });

    it('should approach but not exceed maxAttackBonus for very large city counts', () => {
      const bonus = service.calculateCityBonus(200);
      // 200 cities * 0.004 = 0.8, but capped at 0.5
      expect(bonus).toBe(defaultConfig.maxAttackBonus);
    });
  });

  // =========================================================================
  // T011: 面积加成计算测试
  // =========================================================================
  describe('calculateAreaBonus', () => {
    it('should return 0 for 0 area ratio', () => {
      expect(service.calculateAreaBonus(0)).toBe(0);
    });

    it('should return 0 for negative area ratio', () => {
      expect(service.calculateAreaBonus(-0.1)).toBe(0);
    });

    it('should return positive bonus for small area', () => {
      const bonus = service.calculateAreaBonus(0.05); // 5% of map
      expect(bonus).toBeGreaterThan(0);
    });

    it('should increase with larger area (linear growth)', () => {
      const bonus5 = service.calculateAreaBonus(0.05);
      const bonus10 = service.calculateAreaBonus(0.1);
      const bonus20 = service.calculateAreaBonus(0.2);

      // Linear: 10% should be double 5%
      expect(bonus10).toBeCloseTo(bonus5 * 2, 5);
      expect(bonus20).toBeCloseTo(bonus5 * 4, 5);
    });

    it('should not exceed maxAttackBonus', () => {
      const bonus = service.calculateAreaBonus(1.0); // 100% of map
      expect(bonus).toBeLessThanOrEqual(defaultConfig.maxAttackBonus);
    });
  });

  // =========================================================================
  // T012: 连通分量检测测试
  // =========================================================================
  describe('analyzeContiguity', () => {
    const mockCountries: Country[] = [
      {
        id: 'A',
        name: 'A',
        nameEn: 'A',
        neighbors: ['B', 'C'],
        area: 100,
        centroid: { x: 0, y: 0 },
        bbox: { minX: 0, minY: 0, maxX: 1, maxY: 1 },
        geometry: { type: 'MultiPolygon', coordinates: [] },
        gridCells: [],
      },
      {
        id: 'B',
        name: 'B',
        nameEn: 'B',
        neighbors: ['A', 'C'],
        area: 100,
        centroid: { x: 0, y: 0 },
        bbox: { minX: 0, minY: 0, maxX: 1, maxY: 1 },
        geometry: { type: 'MultiPolygon', coordinates: [] },
        gridCells: [],
      },
      {
        id: 'C',
        name: 'C',
        nameEn: 'C',
        neighbors: ['A', 'B'],
        area: 100,
        centroid: { x: 0, y: 0 },
        bbox: { minX: 0, minY: 0, maxX: 1, maxY: 1 },
        geometry: { type: 'MultiPolygon', coordinates: [] },
        gridCells: [],
      },
      {
        id: 'D',
        name: 'D',
        nameEn: 'D',
        neighbors: ['E'],
        area: 100,
        centroid: { x: 0, y: 0 },
        bbox: { minX: 0, minY: 0, maxX: 1, maxY: 1 },
        geometry: { type: 'MultiPolygon', coordinates: [] },
        gridCells: [],
      },
      {
        id: 'E',
        name: 'E',
        nameEn: 'E',
        neighbors: ['D'],
        area: 100,
        centroid: { x: 0, y: 0 },
        bbox: { minX: 0, minY: 0, maxX: 1, maxY: 1 },
        geometry: { type: 'MultiPolygon', coordinates: [] },
        gridCells: [],
      },
      {
        id: 'F',
        name: 'F',
        nameEn: 'F',
        neighbors: [],
        area: 100,
        centroid: { x: 0, y: 0 },
        bbox: { minX: 0, minY: 0, maxX: 1, maxY: 1 },
        geometry: { type: 'MultiPolygon', coordinates: [] },
        gridCells: [],
      },
    ];

    it('should return empty result for empty territory list', () => {
      const result = service.analyzeContiguity([], mockCountries);
      expect(result.regions).toHaveLength(0);
      expect(result.largestSize).toBe(0);
      expect(result.totalCount).toBe(0);
      expect(result.largestRatio).toBe(0);
    });

    it('should detect single contiguous region', () => {
      const result = service.analyzeContiguity(['A', 'B', 'C'], mockCountries);
      expect(result.regions).toHaveLength(1);
      expect(result.largestSize).toBe(3);
      expect(result.totalCount).toBe(3);
      expect(result.largestRatio).toBe(1);
    });

    it('should detect multiple disconnected regions', () => {
      const result = service.analyzeContiguity(['A', 'B', 'D', 'E'], mockCountries);
      expect(result.regions).toHaveLength(2);
      expect(result.largestSize).toBe(2);
      expect(result.totalCount).toBe(4);
      expect(result.largestRatio).toBe(0.5);
    });

    it('should handle isolated territories', () => {
      const result = service.analyzeContiguity(['A', 'F'], mockCountries);
      expect(result.regions).toHaveLength(2);
      expect(result.largestSize).toBe(1);
      expect(result.totalCount).toBe(2);
      expect(result.largestRatio).toBe(0.5);
    });

    it('should handle single territory', () => {
      const result = service.analyzeContiguity(['A'], mockCountries);
      expect(result.regions).toHaveLength(1);
      expect(result.largestSize).toBe(1);
      expect(result.totalCount).toBe(1);
      expect(result.largestRatio).toBe(1);
    });
  });

  // =========================================================================
  // T013: 加成上限测试
  // =========================================================================
  describe('Bonus Cap (50% attack, 40% defense)', () => {
    it('city bonus should not exceed 50%', () => {
      const bonus = service.calculateCityBonus(200);
      expect(bonus).toBe(0.5);
    });

    it('area bonus should not exceed 50%', () => {
      const bonus = service.calculateAreaBonus(1.0);
      expect(bonus).toBe(0.5);
    });

    it('continuity bonus should be capped', () => {
      const baseBonus = 0.3;
      const contiguityAnalysis = {
        regions: [['A', 'B', 'C', 'D', 'E']],
        largestSize: 5,
        totalCount: 5,
        largestRatio: 1.0,
      };
      const bonus = service.calculateContinuityBonus(baseBonus, contiguityAnalysis);
      expect(bonus).toBeLessThanOrEqual(0.5 * 0.2); // Max 20% of maxAttackBonus
    });
  });

  // =========================================================================
  // T028: 小势力防御加成测试 (Phase 5, but included here for completeness)
  // =========================================================================
  describe('calculateSmallFactionBonus', () => {
    it('should return 0 for factions at or above threshold', () => {
      expect(service.calculateSmallFactionBonus(5)).toBe(0);
      expect(service.calculateSmallFactionBonus(6)).toBe(0);
      expect(service.calculateSmallFactionBonus(10)).toBe(0);
    });

    it('should return positive bonus for small factions', () => {
      const bonus1 = service.calculateSmallFactionBonus(1);
      const bonus2 = service.calculateSmallFactionBonus(2);
      const bonus4 = service.calculateSmallFactionBonus(4);

      expect(bonus1).toBeGreaterThan(0);
      expect(bonus2).toBeGreaterThan(0);
      expect(bonus4).toBeGreaterThan(0);
    });

    it('should give higher bonus to smaller factions', () => {
      const bonus1 = service.calculateSmallFactionBonus(1);
      const bonus2 = service.calculateSmallFactionBonus(2);

      expect(bonus1).toBeGreaterThan(bonus2);
    });

    it('should not exceed smallFactionDefenseBonus', () => {
      const bonus = service.calculateSmallFactionBonus(1);
      expect(bonus).toBeLessThanOrEqual(defaultConfig.smallFactionDefenseBonus);
    });
  });

  // =========================================================================
  // T029: 加成上限验证测试
  // =========================================================================
  describe('Total Bonus Validation', () => {
    it('config should have correct maxAttackBonus value', () => {
      const config = service.getConfig();
      expect(config.maxAttackBonus).toBe(0.5);
    });

    it('config should have correct maxDefenseBonus value', () => {
      const config = service.getConfig();
      expect(config.maxDefenseBonus).toBe(0.4);
    });

    it('setConfig should update configuration', () => {
      service.setConfig({ maxAttackBonus: 0.6 });
      const config = service.getConfig();
      expect(config.maxAttackBonus).toBe(0.6);
    });
  });

  // =========================================================================
  // Continuity Bonus Tests
  // =========================================================================
  describe('calculateContinuityBonus', () => {
    it('should return 0 when largest ratio is 50% or below', () => {
      const contiguityAnalysis = {
        regions: [
          ['A', 'B'],
          ['C', 'D'],
        ],
        largestSize: 2,
        totalCount: 4,
        largestRatio: 0.5,
      };
      const bonus = service.calculateContinuityBonus(0.2, contiguityAnalysis);
      expect(bonus).toBe(0);
    });

    it('should return positive bonus when largest ratio exceeds 50%', () => {
      const contiguityAnalysis = {
        regions: [['A', 'B', 'C'], ['D']],
        largestSize: 3,
        totalCount: 4,
        largestRatio: 0.75,
      };
      const bonus = service.calculateContinuityBonus(0.2, contiguityAnalysis);
      expect(bonus).toBeGreaterThan(0);
    });

    it('should give maximum bonus when all territories are contiguous', () => {
      const contiguityAnalysis = {
        regions: [['A', 'B', 'C', 'D', 'E']],
        largestSize: 5,
        totalCount: 5,
        largestRatio: 1.0,
      };
      const bonus = service.calculateContinuityBonus(0.2, contiguityAnalysis);
      expect(bonus).toBeGreaterThan(0);
    });
  });
});

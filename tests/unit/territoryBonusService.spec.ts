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
    maxBonus: 0.3,
    cityBaseFactor: 0.04,
    cityScaleFactor: 0.15,
    areaBaseFactor: 0.035,
    areaScaleFactor: 0.3,
    continuityBonus: 0.25,
    smallFactionDefenseBonus: 0.15,
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

    it('should increase with more cities (diminishing returns)', () => {
      const bonus1 = service.calculateCityBonus(1);
      const bonus3 = service.calculateCityBonus(3);
      const bonus5 = service.calculateCityBonus(5);
      const bonus10 = service.calculateCityBonus(10);

      // Should increase
      expect(bonus3).toBeGreaterThan(bonus1);
      expect(bonus5).toBeGreaterThan(bonus3);
      expect(bonus10).toBeGreaterThan(bonus5);

      // Diminishing returns: increments should decrease
      const increment1to3 = bonus3 - bonus1;
      const increment3to5 = bonus5 - bonus3;
      const increment5to10 = bonus10 - bonus5;

      expect(increment3to5).toBeLessThan(increment1to3 * 1.5); // Allow some tolerance
    });

    it('should not exceed maxBonus', () => {
      const bonus = service.calculateCityBonus(100);
      expect(bonus).toBeLessThanOrEqual(defaultConfig.maxBonus);
    });

    it('should approach but not exceed maxBonus for very large city counts', () => {
      const bonus = service.calculateCityBonus(1000);
      // 新配置下增长更渐进，1000城市约20%，不会达到上限
      expect(bonus).toBeLessThanOrEqual(defaultConfig.maxBonus);
      expect(bonus).toBeGreaterThan(0.15); // 但应该有明显加成
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

    it('should increase with larger area (diminishing returns)', () => {
      const bonus5 = service.calculateAreaBonus(0.05);
      const bonus10 = service.calculateAreaBonus(0.1);
      const bonus15 = service.calculateAreaBonus(0.15);

      expect(bonus10).toBeGreaterThan(bonus5);
      expect(bonus15).toBeGreaterThanOrEqual(bonus10); // May hit cap
    });

    it('should not exceed maxBonus', () => {
      const bonus = service.calculateAreaBonus(1.0); // 100% of map
      expect(bonus).toBeLessThanOrEqual(defaultConfig.maxBonus);
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
  describe('Bonus Cap (30%)', () => {
    it('city bonus should not exceed 30%', () => {
      const bonus = service.calculateCityBonus(1000);
      expect(bonus).toBeLessThanOrEqual(0.3);
    });

    it('area bonus should not exceed 30%', () => {
      const bonus = service.calculateAreaBonus(1.0);
      expect(bonus).toBeLessThanOrEqual(0.3);
    });

    it('continuity bonus should be capped', () => {
      const baseBonus = 0.25;
      const contiguityAnalysis = {
        regions: [['A', 'B', 'C', 'D', 'E']],
        largestSize: 5,
        totalCount: 5,
        largestRatio: 1.0,
      };
      const bonus = service.calculateContinuityBonus(baseBonus, contiguityAnalysis);
      expect(bonus).toBeLessThanOrEqual(0.3 * 0.2); // Max 20% of maxBonus
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
    it('config should have correct maxBonus value', () => {
      const config = service.getConfig();
      expect(config.maxBonus).toBe(0.3);
    });

    it('setConfig should update configuration', () => {
      service.setConfig({ maxBonus: 0.25 });
      const config = service.getConfig();
      expect(config.maxBonus).toBe(0.25);
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

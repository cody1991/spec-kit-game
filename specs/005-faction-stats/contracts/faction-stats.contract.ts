/**
 * Contract: FactionStatistics Interface
 *
 * Purpose: 定义势力统计数据的接口契约，确保数据准确性和一致性
 * Version: 1.0.0
 * Date: 2025-12-01
 */

import { describe, it, expect } from 'vitest';

// ============================================================================
// Type Definitions
// ============================================================================

interface FactionStatistics {
  commanderId: string;
  commanderName: string;
  status: 'active' | 'eliminated';
  countryCount: number;
  totalArea: number;
  wins: number;
  losses: number;
  winRate: number; // -1 for N/A, otherwise [0, 1]
  lastUpdatedAt: number;
}

// ============================================================================
// Contract Tests
// ============================================================================

describe('Contract: FactionStatistics Data Model', () => {
  describe('C-001: Field Validation', () => {
    it('should have all required fields', () => {
      const stats: FactionStatistics = {
        commanderId: 'napoleon',
        commanderName: '拿破仑',
        status: 'active',
        countryCount: 10,
        totalArea: 500000,
        wins: 15,
        losses: 3,
        winRate: 0.833,
        lastUpdatedAt: Date.now(),
      };

      expect(stats).toHaveProperty('commanderId');
      expect(stats).toHaveProperty('commanderName');
      expect(stats).toHaveProperty('status');
      expect(stats).toHaveProperty('countryCount');
      expect(stats).toHaveProperty('totalArea');
      expect(stats).toHaveProperty('wins');
      expect(stats).toHaveProperty('losses');
      expect(stats).toHaveProperty('winRate');
      expect(stats).toHaveProperty('lastUpdatedAt');
    });

    it('should validate non-negative counts', () => {
      const stats: FactionStatistics = {
        commanderId: 'test',
        commanderName: 'Test',
        status: 'active',
        countryCount: 5,
        totalArea: 1000,
        wins: 10,
        losses: 2,
        winRate: 0.833,
        lastUpdatedAt: Date.now(),
      };

      expect(stats.countryCount).toBeGreaterThanOrEqual(0);
      expect(stats.totalArea).toBeGreaterThanOrEqual(0);
      expect(stats.wins).toBeGreaterThanOrEqual(0);
      expect(stats.losses).toBeGreaterThanOrEqual(0);
    });

    it('should validate winRate range', () => {
      const validStats: FactionStatistics = {
        commanderId: 'test',
        commanderName: 'Test',
        status: 'active',
        countryCount: 5,
        totalArea: 1000,
        wins: 7,
        losses: 3,
        winRate: 0.7,
        lastUpdatedAt: Date.now(),
      };

      expect(validStats.winRate).toBeGreaterThanOrEqual(0);
      expect(validStats.winRate).toBeLessThanOrEqual(1);

      // N/A case
      const naStats: FactionStatistics = {
        ...validStats,
        wins: 0,
        losses: 0,
        winRate: -1,
      };

      expect(naStats.winRate).toBe(-1);
    });
  });

  describe('C-002: WinRate Calculation', () => {
    function calculateWinRate(wins: number, losses: number): number {
      const total = wins + losses;
      return total === 0 ? -1 : wins / total;
    }

    it('should calculate correct win rate', () => {
      expect(calculateWinRate(7, 3)).toBeCloseTo(0.7, 2);
      expect(calculateWinRate(10, 0)).toBe(1.0);
      expect(calculateWinRate(0, 10)).toBe(0.0);
    });

    it('should return -1 for zero battles', () => {
      expect(calculateWinRate(0, 0)).toBe(-1);
    });

    it('should maintain precision within 0.1%', () => {
      const winRate = calculateWinRate(75, 25);
      const expected = 0.75;
      const error = Math.abs(winRate - expected);

      // 精度要求：< 0.001 (0.1%)
      expect(error).toBeLessThan(0.001);
    });
  });

  describe('C-003: Status Consistency', () => {
    it('should have status "eliminated" when countryCount is 0', () => {
      const stats: FactionStatistics = {
        commanderId: 'defeated',
        commanderName: 'Defeated Commander',
        status: 'eliminated',
        countryCount: 0,
        totalArea: 0,
        wins: 5,
        losses: 10,
        winRate: 0.333,
        lastUpdatedAt: Date.now(),
      };

      if (stats.status === 'eliminated') {
        expect(stats.countryCount).toBe(0);
      }
    });

    it('should have status "active" when countryCount > 0', () => {
      const stats: FactionStatistics = {
        commanderId: 'active',
        commanderName: 'Active Commander',
        status: 'active',
        countryCount: 10,
        totalArea: 500000,
        wins: 15,
        losses: 3,
        winRate: 0.833,
        lastUpdatedAt: Date.now(),
      };

      if (stats.countryCount > 0) {
        expect(stats.status).toBe('active');
      }
    });
  });

  describe('C-004: Data Updates', () => {
    it('should update lastUpdatedAt timestamp on any change', () => {
      const initialTime = Date.now();
      const stats: FactionStatistics = {
        commanderId: 'test',
        commanderName: 'Test',
        status: 'active',
        countryCount: 5,
        totalArea: 1000,
        wins: 10,
        losses: 2,
        winRate: 0.833,
        lastUpdatedAt: initialTime,
      };

      // Simulate update after 100ms
      const updatedTime = initialTime + 100;
      const updatedStats = {
        ...stats,
        wins: stats.wins + 1,
        winRate: calculateWinRate(stats.wins + 1, stats.losses),
        lastUpdatedAt: updatedTime,
      };

      expect(updatedStats.lastUpdatedAt).toBeGreaterThan(stats.lastUpdatedAt);
    });

    function calculateWinRate(wins: number, losses: number): number {
      const total = wins + losses;
      return total === 0 ? -1 : wins / total;
    }
  });
});

// ============================================================================
// Battle Stat Update Contract
// ============================================================================

interface BattleStatUpdate {
  attackerId: string;
  defenderId: string;
  result: 'success' | 'fail';
  timestamp: string;
}

describe('Contract: BattleStatUpdate', () => {
  describe('C-005: Battle Counting Rules', () => {
    it('should increment attacker wins and defender losses on success', () => {
      const event: BattleStatUpdate = {
        attackerId: 'attacker1',
        defenderId: 'defender1',
        result: 'success',
        timestamp: new Date().toISOString(),
      };

      // Mock initial stats
      const attackerStats = { wins: 10, losses: 2 };
      const defenderStats = { wins: 8, losses: 5 };

      if (event.result === 'success') {
        attackerStats.wins += 1;
        defenderStats.losses += 1;
      }

      expect(attackerStats.wins).toBe(11);
      expect(defenderStats.losses).toBe(6);
    });

    it('should NOT update stats on failed attack', () => {
      const event: BattleStatUpdate = {
        attackerId: 'attacker1',
        defenderId: 'defender1',
        result: 'fail',
        timestamp: new Date().toISOString(),
      };

      // Mock initial stats
      const attackerStats = { wins: 10, losses: 2 };
      const defenderStats = { wins: 8, losses: 5 };

      // Failed attacks don't count for either side
      if (event.result === 'success') {
        attackerStats.wins += 1;
        defenderStats.losses += 1;
      }

      expect(attackerStats.wins).toBe(10); // unchanged
      expect(defenderStats.losses).toBe(5); // unchanged
    });

    it('should only count battles with defenders (not neutral territories)', () => {
      // Neutral territory case: defenderId would be undefined
      // This test verifies the contract that defenderId must exist
      const event: BattleStatUpdate = {
        attackerId: 'attacker1',
        defenderId: 'defender1', // Must be present
        result: 'success',
        timestamp: new Date().toISOString(),
      };

      expect(event.defenderId).toBeDefined();
      expect(event.defenderId).not.toBe('');
    });
  });
});

// ============================================================================
// Territory Stat Update Contract
// ============================================================================

interface TerritoryStatUpdate {
  commanderId: string;
  countryId: string;
  action: 'gain' | 'lose';
  countryArea: number;
}

describe('Contract: TerritoryStatUpdate', () => {
  describe('C-006: Territory Counting', () => {
    it('should increment countryCount and totalArea on gain', () => {
      const event: TerritoryStatUpdate = {
        commanderId: 'commander1',
        countryId: 'FRA',
        action: 'gain',
        countryArea: 643801, // France area in km²
      };

      // Mock initial stats
      const stats = { countryCount: 5, totalArea: 2000000 };

      if (event.action === 'gain') {
        stats.countryCount += 1;
        stats.totalArea += event.countryArea;
      }

      expect(stats.countryCount).toBe(6);
      expect(stats.totalArea).toBe(2643801);
    });

    it('should decrement countryCount and totalArea on lose', () => {
      const event: TerritoryStatUpdate = {
        commanderId: 'commander1',
        countryId: 'FRA',
        action: 'lose',
        countryArea: 643801,
      };

      // Mock initial stats
      const stats = { countryCount: 6, totalArea: 2643801 };

      if (event.action === 'lose') {
        stats.countryCount -= 1;
        stats.totalArea -= event.countryArea;
      }

      expect(stats.countryCount).toBe(5);
      expect(stats.totalArea).toBe(2000000);
    });

    it('should not allow negative counts', () => {
      const event: TerritoryStatUpdate = {
        commanderId: 'commander1',
        countryId: 'FRA',
        action: 'lose',
        countryArea: 643801,
      };

      // Edge case: losing last territory
      const stats = { countryCount: 1, totalArea: 643801 };

      if (event.action === 'lose') {
        stats.countryCount = Math.max(0, stats.countryCount - 1);
        stats.totalArea = Math.max(0, stats.totalArea - event.countryArea);
      }

      expect(stats.countryCount).toBe(0);
      expect(stats.totalArea).toBe(0);
    });
  });
});

export type { FactionStatistics, BattleStatUpdate, TerritoryStatUpdate };

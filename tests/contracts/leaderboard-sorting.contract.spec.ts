/**
 * Contract: Leaderboard Sorting Algorithm
 * 
 * Purpose: 确保排行榜排序逻辑的正确性和一致性
 * Version: 1.0.0
 * Date: 2025-12-01
 * 
 * Sorting Rules:
 * 1. Primary: countryCount (descending)
 * 2. Secondary: totalArea (descending)
 */

import { describe, it, expect } from 'vitest';

// ============================================================================
// Type Definitions
// ============================================================================

interface FactionStatistics {
  commanderId: string;
  commanderName: string;
  countryCount: number;
  totalArea: number;
  wins: number;
  losses: number;
  winRate: number;
  status: 'active' | 'eliminated';
  lastUpdatedAt: number;
}

interface Leaderboard {
  factions: FactionStatistics[];
  timestamp: number;
  sortCriteria: {
    primary: 'countryCount';
    primaryOrder: 'desc';
    secondary: 'totalArea';
    secondaryOrder: 'desc';
  };
}

// ============================================================================
// Sorting Implementation
// ============================================================================

function sortLeaderboard(stats: FactionStatistics[]): FactionStatistics[] {
  return [...stats].sort((a, b) => {
    // Primary: countryCount descending
    if (b.countryCount !== a.countryCount) {
      return b.countryCount - a.countryCount;
    }
    // Secondary: totalArea descending
    return b.totalArea - a.totalArea;
  }).map((faction, index) => ({
    ...faction,
    rank: index + 1,
  }));
}

// ============================================================================
// Contract Tests
// ============================================================================

describe('Contract: Leaderboard Sorting', () => {
  describe('C-001: Primary Sorting by countryCount', () => {
    it('should sort by countryCount in descending order', () => {
      const stats: FactionStatistics[] = [
        {
          commanderId: 'a',
          commanderName: 'Commander A',
          countryCount: 10,
          totalArea: 1000000,
          wins: 15,
          losses: 3,
          winRate: 0.833,
          status: 'active',
          lastUpdatedAt: Date.now(),
        },
        {
          commanderId: 'b',
          commanderName: 'Commander B',
          countryCount: 25,
          totalArea: 800000,
          wins: 30,
          losses: 5,
          winRate: 0.857,
          status: 'active',
          lastUpdatedAt: Date.now(),
        },
        {
          commanderId: 'c',
          commanderName: 'Commander C',
          countryCount: 15,
          totalArea: 1200000,
          wins: 20,
          losses: 8,
          winRate: 0.714,
          status: 'active',
          lastUpdatedAt: Date.now(),
        },
      ];

      const sorted = sortLeaderboard(stats);

      expect(sorted[0].commanderId).toBe('b'); // 25 countries
      expect(sorted[1].commanderId).toBe('c'); // 15 countries
      expect(sorted[2].commanderId).toBe('a'); // 10 countries
    });

    it('should assign correct ranks', () => {
      const stats: FactionStatistics[] = [
        {
          commanderId: 'a',
          commanderName: 'Commander A',
          countryCount: 10,
          totalArea: 1000000,
          wins: 15,
          losses: 3,
          winRate: 0.833,
          status: 'active',
          lastUpdatedAt: Date.now(),
        },
        {
          commanderId: 'b',
          commanderName: 'Commander B',
          countryCount: 25,
          totalArea: 800000,
          wins: 30,
          losses: 5,
          winRate: 0.857,
          status: 'active',
          lastUpdatedAt: Date.now(),
        },
      ];

      const sorted = sortLeaderboard(stats);

      expect(sorted[0]).toHaveProperty('rank', 1);
      expect(sorted[1]).toHaveProperty('rank', 2);
    });
  });

  describe('C-002: Secondary Sorting by totalArea', () => {
    it('should use totalArea as tiebreaker when countryCount is equal', () => {
      const stats: FactionStatistics[] = [
        {
          commanderId: 'a',
          commanderName: 'Commander A',
          countryCount: 10,
          totalArea: 800000, // smaller area
          wins: 15,
          losses: 3,
          winRate: 0.833,
          status: 'active',
          lastUpdatedAt: Date.now(),
        },
        {
          commanderId: 'b',
          commanderName: 'Commander B',
          countryCount: 10,
          totalArea: 1200000, // larger area
          wins: 15,
          losses: 3,
          winRate: 0.833,
          status: 'active',
          lastUpdatedAt: Date.now(),
        },
        {
          commanderId: 'c',
          commanderName: 'Commander C',
          countryCount: 10,
          totalArea: 1000000, // middle area
          wins: 15,
          losses: 3,
          winRate: 0.833,
          status: 'active',
          lastUpdatedAt: Date.now(),
        },
      ];

      const sorted = sortLeaderboard(stats);

      expect(sorted[0].commanderId).toBe('b'); // 1.2M km²
      expect(sorted[1].commanderId).toBe('c'); // 1.0M km²
      expect(sorted[2].commanderId).toBe('a'); // 0.8M km²
    });

    it('should prioritize countryCount over totalArea', () => {
      const stats: FactionStatistics[] = [
        {
          commanderId: 'a',
          commanderName: 'Commander A',
          countryCount: 5,
          totalArea: 2000000, // huge area but few countries
          wins: 10,
          losses: 2,
          winRate: 0.833,
          status: 'active',
          lastUpdatedAt: Date.now(),
        },
        {
          commanderId: 'b',
          commanderName: 'Commander B',
          countryCount: 20,
          totalArea: 500000, // small area but many countries
          wins: 25,
          losses: 5,
          winRate: 0.833,
          status: 'active',
          lastUpdatedAt: Date.now(),
        },
      ];

      const sorted = sortLeaderboard(stats);

      // Despite having more area, 'a' should rank lower due to fewer countries
      expect(sorted[0].commanderId).toBe('b'); // 20 countries
      expect(sorted[1].commanderId).toBe('a'); // 5 countries
    });
  });

  describe('C-003: Edge Cases', () => {
    it('should handle empty array', () => {
      const stats: FactionStatistics[] = [];
      const sorted = sortLeaderboard(stats);
      expect(sorted).toEqual([]);
    });

    it('should handle single faction', () => {
      const stats: FactionStatistics[] = [
        {
          commanderId: 'a',
          commanderName: 'Solo Commander',
          countryCount: 50,
          totalArea: 5000000,
          wins: 100,
          losses: 10,
          winRate: 0.909,
          status: 'active',
          lastUpdatedAt: Date.now(),
        },
      ];

      const sorted = sortLeaderboard(stats);
      expect(sorted).toHaveLength(1);
      expect(sorted[0]).toHaveProperty('rank', 1);
    });

    it('should handle all factions with zero countries', () => {
      const stats: FactionStatistics[] = [
        {
          commanderId: 'a',
          commanderName: 'Eliminated A',
          countryCount: 0,
          totalArea: 0,
          wins: 5,
          losses: 10,
          winRate: 0.333,
          status: 'eliminated',
          lastUpdatedAt: Date.now(),
        },
        {
          commanderId: 'b',
          commanderName: 'Eliminated B',
          countryCount: 0,
          totalArea: 0,
          wins: 8,
          losses: 12,
          winRate: 0.4,
          status: 'eliminated',
          lastUpdatedAt: Date.now(),
        },
      ];

      const sorted = sortLeaderboard(stats);
      expect(sorted).toHaveLength(2);
      // All have same countryCount and totalArea, order is stable
    });

    it('should handle identical stats (stable sort)', () => {
      const stats: FactionStatistics[] = [
        {
          commanderId: 'a',
          commanderName: 'Twin A',
          countryCount: 10,
          totalArea: 1000000,
          wins: 15,
          losses: 3,
          winRate: 0.833,
          status: 'active',
          lastUpdatedAt: Date.now(),
        },
        {
          commanderId: 'b',
          commanderName: 'Twin B',
          countryCount: 10,
          totalArea: 1000000,
          wins: 15,
          losses: 3,
          winRate: 0.833,
          status: 'active',
          lastUpdatedAt: Date.now(),
        },
      ];

      const sorted = sortLeaderboard(stats);
      expect(sorted).toHaveLength(2);
      
      // Stable sort: original order preserved
      expect(sorted[0].commanderId).toBe('a');
      expect(sorted[1].commanderId).toBe('b');
    });
  });

  describe('C-004: Performance', () => {
    it('should sort 50 factions in under 10ms', () => {
      const stats: FactionStatistics[] = Array.from({ length: 50 }, (_, i) => ({
        commanderId: `commander-${i}`,
        commanderName: `Commander ${i}`,
        countryCount: Math.floor(Math.random() * 100),
        totalArea: Math.floor(Math.random() * 5000000),
        wins: Math.floor(Math.random() * 50),
        losses: Math.floor(Math.random() * 20),
        winRate: Math.random(),
        status: 'active' as const,
        lastUpdatedAt: Date.now(),
      }));

      const startTime = performance.now();
      const sorted = sortLeaderboard(stats);
      const endTime = performance.now();

      const duration = endTime - startTime;
      
      expect(sorted).toHaveLength(50);
      expect(duration).toBeLessThan(10); // < 10ms
    });
  });

  describe('C-005: Immutability', () => {
    it('should not mutate input array', () => {
      const stats: FactionStatistics[] = [
        {
          commanderId: 'a',
          commanderName: 'Commander A',
          countryCount: 10,
          totalArea: 1000000,
          wins: 15,
          losses: 3,
          winRate: 0.833,
          status: 'active',
          lastUpdatedAt: Date.now(),
        },
        {
          commanderId: 'b',
          commanderName: 'Commander B',
          countryCount: 20,
          totalArea: 800000,
          wins: 25,
          losses: 5,
          winRate: 0.833,
          status: 'active',
          lastUpdatedAt: Date.now(),
        },
      ];

      const originalOrder = stats.map(s => s.commanderId);
      const sorted = sortLeaderboard(stats);

      // Original array should be unchanged
      expect(stats.map(s => s.commanderId)).toEqual(originalOrder);
      
      // Sorted array should be different
      expect(sorted.map(s => s.commanderId)).not.toEqual(originalOrder);
    });
  });
});

export { sortLeaderboard };
export type { Leaderboard, FactionStatistics };

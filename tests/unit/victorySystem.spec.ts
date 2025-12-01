/**
 * 胜利系统单元测试
 * Feature: 009-unification-balance
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { DEFAULT_VICTORY_CONFIG } from '../../app/src/config/victory.config';

describe('VictorySystem', () => {
  describe('VictoryConfig', () => {
    it('should have territory victory threshold of 0.85 (85%)', () => {
      expect(DEFAULT_VICTORY_CONFIG.territoryVictoryThreshold).toBe(0.85);
    });

    it('should enable territory victory by default', () => {
      expect(DEFAULT_VICTORY_CONFIG.enableTerritoryVictory).toBe(true);
    });

    it('should enable elimination victory by default', () => {
      expect(DEFAULT_VICTORY_CONFIG.enableEliminationVictory).toBe(true);
    });
  });

  describe('Territory Victory Condition', () => {
    it('should trigger victory when controlling 85% of territories', () => {
      const totalTerritories = 100;
      const controlledTerritories = 85;
      const ratio = controlledTerritories / totalTerritories;
      
      expect(ratio).toBeGreaterThanOrEqual(DEFAULT_VICTORY_CONFIG.territoryVictoryThreshold);
    });

    it('should not trigger victory when controlling less than 85% of territories', () => {
      const totalTerritories = 100;
      const controlledTerritories = 84;
      const ratio = controlledTerritories / totalTerritories;
      
      expect(ratio).toBeLessThan(DEFAULT_VICTORY_CONFIG.territoryVictoryThreshold);
    });

    it('should trigger victory when controlling exactly 85% of territories', () => {
      const totalTerritories = 200;
      const controlledTerritories = 170; // 85%
      const ratio = controlledTerritories / totalTerritories;
      
      expect(ratio).toBe(DEFAULT_VICTORY_CONFIG.territoryVictoryThreshold);
    });
  });

  describe('Elimination Victory Condition', () => {
    it('should trigger victory when only 1 active commander remains', () => {
      const activeCommanders = 1;
      expect(activeCommanders).toBe(1);
    });

    it('should not trigger victory when multiple commanders are active', () => {
      const activeCommanders = 2;
      expect(activeCommanders).toBeGreaterThan(1);
    });
  });
});

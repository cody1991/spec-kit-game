/**
 * 力量恢复系统单元测试
 * Feature: 009-unification-balance
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { PowerRecoverySystem } from '../../app/src/core/simulation/systems/powerRecoverySystem';
import type { HistoricalCommander } from '../../app/src/core/types';

describe('PowerRecoverySystem', () => {
  let system: PowerRecoverySystem;

  beforeEach(() => {
    system = new PowerRecoverySystem();
  });

  describe('calculateRecovery', () => {
    it('should calculate recovery based on territory count (0.2 per territory)', () => {
      const commander = {
        controlledTerritories: Array(20).fill('territory'),
      } as HistoricalCommander;

      const recovery = system.calculateRecovery(commander);
      expect(recovery).toBe(4); // 20 * 0.2 = 4
    });

    it('should return 0 for commander with no territories', () => {
      const commander = {
        controlledTerritories: [],
      } as HistoricalCommander;

      const recovery = system.calculateRecovery(commander);
      expect(recovery).toBe(0);
    });

    it('should calculate recovery for large territory count', () => {
      const commander = {
        controlledTerritories: Array(50).fill('territory'),
      } as HistoricalCommander;

      const recovery = system.calculateRecovery(commander);
      expect(recovery).toBe(10); // 50 * 0.2 = 10
    });
  });

  describe('clampPower', () => {
    it('should not exceed MAX_POWER (100)', () => {
      const result = system.clampPower(120);
      expect(result).toBe(100);
    });

    it('should not go below MIN_POWER (20)', () => {
      const result = system.clampPower(10);
      expect(result).toBe(20);
    });

    it('should keep value within bounds', () => {
      const result = system.clampPower(60);
      expect(result).toBe(60);
    });

    it('should handle edge case at MIN_POWER', () => {
      const result = system.clampPower(20);
      expect(result).toBe(20);
    });

    it('should handle edge case at MAX_POWER', () => {
      const result = system.clampPower(100);
      expect(result).toBe(100);
    });
  });

  describe('getVictoryBonus', () => {
    it('should return victory bonus of 5', () => {
      const bonus = system.getVictoryBonus();
      expect(bonus).toBe(5);
    });
  });

  describe('setConfig', () => {
    it('should allow updating config', () => {
      system.setConfig({ recoveryPerTerritory: 0.5 });
      
      const commander = {
        controlledTerritories: Array(10).fill('territory'),
      } as HistoricalCommander;

      const recovery = system.calculateRecovery(commander);
      expect(recovery).toBe(5); // 10 * 0.5 = 5
    });
  });
});

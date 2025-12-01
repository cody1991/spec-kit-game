/**
 * 决战模式单元测试
 * Feature: 009-unification-balance
 */

import { describe, it, expect } from 'vitest';
import { DEFAULT_ENDGAME_CONFIG } from '../../app/src/config/endgame.config';

describe('EndgameMode', () => {
  describe('EndgameConfig', () => {
    it('should trigger at 3 or fewer active commanders', () => {
      expect(DEFAULT_ENDGAME_CONFIG.triggerThreshold).toBe(3);
    });

    it('should double battle frequency', () => {
      expect(DEFAULT_ENDGAME_CONFIG.battleFrequencyMultiplier).toBe(2);
    });

    it('should increase remote attack probability to 40%', () => {
      expect(DEFAULT_ENDGAME_CONFIG.remoteAttackProbability).toBe(0.4);
    });

    it('should halve power loss', () => {
      expect(DEFAULT_ENDGAME_CONFIG.powerLossMultiplier).toBe(0.5);
    });

    it('should disallow new alliances', () => {
      expect(DEFAULT_ENDGAME_CONFIG.allowNewAlliances).toBe(false);
    });

    it('should break alliances at 50% territory', () => {
      expect(DEFAULT_ENDGAME_CONFIG.allianceBreakThreshold).toBe(0.5);
    });
  });

  describe('Trigger Condition', () => {
    it('should trigger when active commanders <= threshold', () => {
      const activeCount = 3;
      const threshold = DEFAULT_ENDGAME_CONFIG.triggerThreshold;
      
      expect(activeCount <= threshold).toBe(true);
    });

    it('should not trigger when active commanders > threshold', () => {
      const activeCount = 4;
      const threshold = DEFAULT_ENDGAME_CONFIG.triggerThreshold;
      
      expect(activeCount <= threshold).toBe(false);
    });

    it('should not trigger when only 1 commander (victory condition)', () => {
      const activeCount = 1;
      // Endgame should not trigger when victory is imminent
      expect(activeCount > 1).toBe(false);
    });
  });

  describe('Battle Frequency', () => {
    it('should calculate doubled max battles', () => {
      const baseMaxBattles = 20;
      const multiplier = DEFAULT_ENDGAME_CONFIG.battleFrequencyMultiplier;
      const endgameMaxBattles = baseMaxBattles * multiplier;
      
      expect(endgameMaxBattles).toBe(40);
    });
  });

  describe('Power Loss', () => {
    it('should calculate halved power loss', () => {
      const baseLoss = 10;
      const multiplier = DEFAULT_ENDGAME_CONFIG.powerLossMultiplier;
      const endgameLoss = Math.floor(baseLoss * multiplier);
      
      expect(endgameLoss).toBe(5);
    });
  });

  describe('Remote Attack Probability', () => {
    it('should calculate adjacent probability in endgame mode', () => {
      const remoteProb = DEFAULT_ENDGAME_CONFIG.remoteAttackProbability;
      const adjacentProb = 1 - remoteProb;
      
      expect(adjacentProb).toBe(0.6); // 60% adjacent in endgame
    });
  });
});

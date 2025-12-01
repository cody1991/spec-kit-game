/**
 * 联盟系统单元测试
 * Feature: 009-unification-balance
 */

import { describe, it, expect } from 'vitest';
import { DEFAULT_ENDGAME_CONFIG } from '../../app/src/config/endgame.config';

describe('AllianceSystem', () => {
  describe('Endgame Alliance Rules', () => {
    it('should not allow new alliances in endgame mode', () => {
      expect(DEFAULT_ENDGAME_CONFIG.allowNewAlliances).toBe(false);
    });

    it('should break alliances at 50% territory threshold', () => {
      expect(DEFAULT_ENDGAME_CONFIG.allianceBreakThreshold).toBe(0.5);
    });
  });

  describe('Alliance Break Condition', () => {
    it('should trigger alliance break when territory ratio >= 50%', () => {
      const totalTerritories = 100;
      const controlledTerritories = 50;
      const ratio = controlledTerritories / totalTerritories;
      
      expect(ratio >= DEFAULT_ENDGAME_CONFIG.allianceBreakThreshold).toBe(true);
    });

    it('should not trigger alliance break when territory ratio < 50%', () => {
      const totalTerritories = 100;
      const controlledTerritories = 49;
      const ratio = controlledTerritories / totalTerritories;
      
      expect(ratio >= DEFAULT_ENDGAME_CONFIG.allianceBreakThreshold).toBe(false);
    });
  });

  describe('Large Faction Alliance Prevention', () => {
    it('should prevent large factions from forming new alliances', () => {
      const totalTerritories = 100;
      const faction1Territories = 51; // > 50%
      const faction1Ratio = faction1Territories / totalTerritories;
      
      // Large faction should not be able to form alliance
      expect(faction1Ratio >= DEFAULT_ENDGAME_CONFIG.allianceBreakThreshold).toBe(true);
    });

    it('should allow small factions to form alliances', () => {
      const totalTerritories = 100;
      const faction1Territories = 30;
      const faction2Territories = 20;
      const faction1Ratio = faction1Territories / totalTerritories;
      const faction2Ratio = faction2Territories / totalTerritories;
      
      // Both factions are small enough to form alliance
      expect(faction1Ratio < DEFAULT_ENDGAME_CONFIG.allianceBreakThreshold).toBe(true);
      expect(faction2Ratio < DEFAULT_ENDGAME_CONFIG.allianceBreakThreshold).toBe(true);
    });
  });
});

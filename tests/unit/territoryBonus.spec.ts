/**
 * 领土加成单元测试
 * Feature: 009-unification-balance
 */

import { describe, it, expect } from 'vitest';
import { DEFAULT_TERRITORY_BONUS_CONFIG } from '../../app/src/config/territoryBonus.config';

describe('TerritoryBonus', () => {
  describe('Config Values', () => {
    it('should have increased cityBaseFactor (0.005)', () => {
      expect(DEFAULT_TERRITORY_BONUS_CONFIG.cityBaseFactor).toBe(0.005);
    });

    it('should have increased areaBaseFactor (1.2)', () => {
      expect(DEFAULT_TERRITORY_BONUS_CONFIG.areaBaseFactor).toBe(1.2);
    });

    it('should have increased maxAttackBonus (0.6)', () => {
      expect(DEFAULT_TERRITORY_BONUS_CONFIG.maxAttackBonus).toBe(0.6);
    });

    it('should have increased maxDefenseBonus (0.5)', () => {
      expect(DEFAULT_TERRITORY_BONUS_CONFIG.maxDefenseBonus).toBe(0.5);
    });

    it('should have reduced smallFactionDefenseBonus (0.03)', () => {
      expect(DEFAULT_TERRITORY_BONUS_CONFIG.smallFactionDefenseBonus).toBe(0.03);
    });

    it('should have reduced smallFactionThreshold (3)', () => {
      expect(DEFAULT_TERRITORY_BONUS_CONFIG.smallFactionThreshold).toBe(3);
    });
  });

  describe('Snowball Effect Calculation', () => {
    it('should give significant bonus for 30 cities', () => {
      const cityCount = 30;
      const cityBonus = cityCount * DEFAULT_TERRITORY_BONUS_CONFIG.cityBaseFactor;
      
      // 30 * 0.005 = 0.15 (15%)
      expect(cityBonus).toBe(0.15);
    });

    it('should give significant bonus for 15% area', () => {
      const areaRatio = 0.15;
      const areaBonus = areaRatio * DEFAULT_TERRITORY_BONUS_CONFIG.areaBaseFactor;
      
      // 0.15 * 1.2 = 0.18 (18%)
      expect(areaBonus).toBe(0.18);
    });

    it('should cap attack bonus at maxAttackBonus', () => {
      const cityCount = 100;
      const areaRatio = 0.6;
      
      const cityBonus = cityCount * DEFAULT_TERRITORY_BONUS_CONFIG.cityBaseFactor;
      const areaBonus = areaRatio * DEFAULT_TERRITORY_BONUS_CONFIG.areaBaseFactor;
      const totalBonus = cityBonus + areaBonus;
      
      const cappedBonus = Math.min(totalBonus, DEFAULT_TERRITORY_BONUS_CONFIG.maxAttackBonus);
      
      expect(cappedBonus).toBe(0.6); // Capped at 60%
    });
  });

  describe('Small Faction Protection', () => {
    it('should only protect factions with <= 3 cities', () => {
      const threshold = DEFAULT_TERRITORY_BONUS_CONFIG.smallFactionThreshold;
      
      expect(threshold).toBe(3);
      expect(2 <= threshold).toBe(true); // 2 cities = protected
      expect(3 <= threshold).toBe(true); // 3 cities = protected
      expect(4 <= threshold).toBe(false); // 4 cities = not protected
    });

    it('should provide minimal defense bonus (3%)', () => {
      const bonus = DEFAULT_TERRITORY_BONUS_CONFIG.smallFactionDefenseBonus;
      
      expect(bonus).toBe(0.03);
    });
  });
});

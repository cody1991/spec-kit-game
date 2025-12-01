/**
 * Conquest Progress System Unit Tests
 *
 * Feature: 010-gradual-conquest
 * 渐进式领土蚕食机制的单元测试
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ConquestProgressSystem } from '@/core/simulation/systems/conquestProgressSystem';
import { useGameStore } from '@/core/state/store';
import { DEFAULT_CONQUEST_PROGRESS_CONFIG } from '@/config/conquestProgress.config';

describe('ConquestProgressSystem', () => {
  let system: ConquestProgressSystem;

  beforeEach(() => {
    // Reset store state before each test
    useGameStore.setState({
      conquestProgressStates: new Map(),
      conquestProgressConfig: { ...DEFAULT_CONQUEST_PROGRESS_CONFIG },
      isEndgameMode: false,
      territories: [
        {
          id: 'territory-1',
          name: 'Small Country',
          polygon: [],
          adjacentIds: [],
          terrain: 'plains' as const,
          resourceYield: { food: 0, industry: 0 },
          ownerId: 'defender-1',
          garrison: 100,
          stability: 80,
        },
        {
          id: 'territory-2',
          name: 'Large Country',
          polygon: [],
          adjacentIds: [],
          terrain: 'plains' as const,
          resourceYield: { food: 0, industry: 0 },
          ownerId: 'defender-2',
          garrison: 200,
          stability: 90,
        },
      ],
      commanders: [
        {
          id: 'attacker-1',
          name: 'Attacker',
          originRegion: 'europe' as const,
          portraitAsset: '',
          baseAttributes: { attack: 80, defense: 60, mobility: 70, leadership: 75 },
          skillCards: [],
          currentPower: 100,
          controlledTerritories: [],
          alliances: [],
          hostilities: [],
          morale: 80,
          nextActionEta: '',
          status: 'active' as const,
        },
        {
          id: 'defender-1',
          name: 'Defender',
          originRegion: 'asia' as const,
          portraitAsset: '',
          baseAttributes: { attack: 60, defense: 80, mobility: 60, leadership: 70 },
          skillCards: [],
          currentPower: 80,
          controlledTerritories: ['territory-1'],
          alliances: [],
          hostilities: [],
          morale: 70,
          nextActionEta: '',
          status: 'active' as const,
        },
      ],
      dirtyFlags: {
        territories: new Set<string>(),
        commanders: new Set<string>(),
        fullRedraw: false,
        lastRenderTick: 0,
      },
    });

    system = new ConquestProgressSystem();
  });

  describe('calculateProgressDelta', () => {
    it('should return higher progress for small countries', () => {
      const smallResult = system.calculateProgressDelta(50000, 100, 80, true);
      const mediumResult = system.calculateProgressDelta(500000, 100, 80, true);
      const largeResult = system.calculateProgressDelta(2000000, 100, 80, true);

      expect(smallResult.sizeCategory).toBe('small');
      expect(mediumResult.sizeCategory).toBe('medium');
      expect(largeResult.sizeCategory).toBe('large');

      expect(smallResult.baseProgress).toBeGreaterThan(mediumResult.baseProgress);
      expect(mediumResult.baseProgress).toBeGreaterThan(largeResult.baseProgress);
    });

    it('should apply power advantage multiplier when attacker is 2x stronger', () => {
      const result = system.calculateProgressDelta(500000, 200, 80, true);

      expect(result.multiplier).toBe(DEFAULT_CONQUEST_PROGRESS_CONFIG.powerAdvantageMultiplier);
    });

    it('should apply power disadvantage multiplier when attacker is weaker', () => {
      const result = system.calculateProgressDelta(500000, 40, 100, true);

      expect(result.multiplier).toBe(DEFAULT_CONQUEST_PROGRESS_CONFIG.powerDisadvantageMultiplier);
    });

    it('should return negative progress when defender wins', () => {
      const result = system.calculateProgressDelta(500000, 100, 80, false);

      expect(result.baseProgress).toBeLessThan(0);
      expect(result.finalProgress).toBeLessThan(0);
    });

    it('should apply endgame multiplier when in endgame mode', () => {
      useGameStore.setState({ isEndgameMode: true });

      const normalResult = system.calculateProgressDelta(500000, 100, 100, true);
      
      useGameStore.setState({ isEndgameMode: false });
      const baseResult = system.calculateProgressDelta(500000, 100, 100, true);

      expect(normalResult.multiplier).toBeGreaterThan(baseResult.multiplier);
    });
  });

  describe('updateProgress', () => {
    it('should increase progress when attacker wins', () => {
      const store = useGameStore.getState();
      
      // Initial progress should be 0
      expect(store.getConquestProgress('territory-1', 'attacker-1')).toBe(0);

      // Attacker wins a battle
      system.updateProgress('territory-1', 'attacker-1', 'defender-1', true, 100, 80);

      // Progress should increase
      const newProgress = store.getConquestProgress('territory-1', 'attacker-1');
      expect(newProgress).toBeGreaterThan(0);
    });

    it('should decrease progress when defender wins', () => {
      const store = useGameStore.getState();
      
      // Set initial progress
      store.updateConquestProgress('territory-1', 'attacker-1', 50);
      expect(store.getConquestProgress('territory-1', 'attacker-1')).toBe(50);

      // Defender wins
      system.updateProgress('territory-1', 'attacker-1', 'defender-1', false, 80, 100);

      // Progress should decrease
      const newProgress = store.getConquestProgress('territory-1', 'attacker-1');
      expect(newProgress).toBeLessThan(50);
    });

    it('should return true and trigger conquest when progress reaches 100%', () => {
      const store = useGameStore.getState();
      
      // Set progress close to 100%
      store.updateConquestProgress('territory-1', 'attacker-1', 95);

      // Win a battle that should push it over 100%
      const isConquered = system.updateProgress('territory-1', 'attacker-1', 'defender-1', true, 200, 50);

      expect(isConquered).toBe(true);
    });

    it('should not exceed 100% progress', () => {
      const store = useGameStore.getState();
      
      // Set progress to 90%
      store.updateConquestProgress('territory-1', 'attacker-1', 90);

      // Win multiple battles
      system.updateProgress('territory-1', 'attacker-1', 'defender-1', true, 200, 50);

      // Progress should be capped at 100%
      const progress = store.getConquestProgress('territory-1', 'attacker-1');
      expect(progress).toBeLessThanOrEqual(100);
    });

    it('should not go below 0% progress', () => {
      const store = useGameStore.getState();
      
      // Set low progress
      store.updateConquestProgress('territory-1', 'attacker-1', 5);

      // Lose multiple battles
      system.updateProgress('territory-1', 'attacker-1', 'defender-1', false, 50, 200);

      // Progress should be at least 0
      const progress = store.getConquestProgress('territory-1', 'attacker-1');
      expect(progress).toBeGreaterThanOrEqual(0);
    });
  });

  describe('getConquestState', () => {
    it('should return null for territories without conquest progress', () => {
      const state = system.getConquestState('non-existent');
      expect(state).toBeNull();
    });

    it('should return conquest state after progress update', () => {
      system.updateProgress('territory-1', 'attacker-1', 'defender-1', true, 100, 80);

      const state = system.getConquestState('territory-1');
      expect(state).not.toBeNull();
      expect(state?.isContested).toBe(true);
      expect(state?.leadingAttackerId).toBe('attacker-1');
    });
  });

  describe('getContestedTerritories', () => {
    it('should return empty array when no territories are contested', () => {
      const contested = system.getContestedTerritories();
      expect(contested).toEqual([]);
    });

    it('should return contested territory IDs', () => {
      system.updateProgress('territory-1', 'attacker-1', 'defender-1', true, 100, 80);

      const contested = system.getContestedTerritories();
      expect(contested).toContain('territory-1');
    });
  });

  describe('getRenderInfo', () => {
    it('should return render info for contested territory', () => {
      system.updateProgress('territory-1', 'attacker-1', 'defender-1', true, 100, 80);

      const renderInfo = system.getRenderInfo('territory-1');
      expect(renderInfo).not.toBeNull();
      expect(renderInfo?.isContested).toBe(true);
      expect(renderInfo?.leadingAttackerId).toBe('attacker-1');
      expect(renderInfo?.leadingProgress).toBeGreaterThan(0);
      expect(renderInfo?.attackerCount).toBe(1);
    });
  });

  describe('onCommanderEliminated', () => {
    it('should clear all progress for eliminated commander', () => {
      const store = useGameStore.getState();
      
      // Set progress for attacker on multiple territories
      store.updateConquestProgress('territory-1', 'attacker-1', 50);
      store.updateConquestProgress('territory-2', 'attacker-1', 30);

      // Eliminate the attacker
      system.onCommanderEliminated('attacker-1');

      // Progress should be cleared
      expect(store.getConquestProgress('territory-1', 'attacker-1')).toBe(0);
      expect(store.getConquestProgress('territory-2', 'attacker-1')).toBe(0);
    });
  });

  describe('multi-attacker scenarios', () => {
    it('should track progress independently for multiple attackers', () => {
      const store = useGameStore.getState();
      
      // Use system.updateProgress to properly update state
      system.updateProgress('territory-1', 'attacker-1', 'defender-1', true, 100, 80);
      
      // Add a second attacker (simulate another commander)
      useGameStore.setState({
        commanders: [
          ...store.commanders,
          {
            id: 'attacker-2',
            name: 'Attacker 2',
            originRegion: 'americas' as const,
            portraitAsset: '',
            baseAttributes: { attack: 90, defense: 70, mobility: 80, leadership: 85 },
            skillCards: [],
            currentPower: 120,
            controlledTerritories: [],
            alliances: [],
            hostilities: [],
            morale: 90,
            nextActionEta: '',
            status: 'active' as const,
          },
        ],
      });

      // Attacker 2 wins more battles
      system.updateProgress('territory-1', 'attacker-2', 'defender-1', true, 150, 80);
      system.updateProgress('territory-1', 'attacker-2', 'defender-1', true, 150, 80);

      const updatedStore = useGameStore.getState();
      const progress1 = updatedStore.getConquestProgress('territory-1', 'attacker-1');
      const progress2 = updatedStore.getConquestProgress('territory-1', 'attacker-2');

      expect(progress1).toBeGreaterThan(0);
      expect(progress2).toBeGreaterThan(progress1);

      // Leading attacker should be attacker-2
      const state = updatedStore.conquestProgressStates.get('territory-1');
      expect(state?.leadingAttackerId).toBe('attacker-2');
      expect(state?.leadingProgress).toBe(progress2);
    });
  });
});

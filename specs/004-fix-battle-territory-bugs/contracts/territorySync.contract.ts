/**
 * Contract: Territory State Synchronization
 * 
 * Purpose: Ensure territories array and territoryStates Map remain synchronized
 * 
 * Test scenarios:
 * 1. Bidirectional sync when ownerId changes
 * 2. Initial state completeness
 * 3. Concurrent update handling
 * 4. Subscription notification delivery
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { Territory, TerritoryState } from '@core/types';

/**
 * Contract Test Suite: Territory Update Synchronization
 */
describe('Contract: Territory Bidirectional Sync', () => {
  /**
   * C-101: Updating Territory.ownerId should sync TerritoryState.ownerId
   */
  it('C-101: should sync territoryStates when territory owner changes', () => {
    const territoryId = 'country-USA';
    const oldOwnerId = 'commander-1';
    const newOwnerId = 'commander-2';

    const initialTerritory: Territory = createMockTerritory(territoryId, oldOwnerId);
    const initialState: TerritoryState = createMockTerritoryState(territoryId, oldOwnerId);

    // Simulate store state
    const store = createMockStore([initialTerritory], new Map([[territoryId, initialState]]));

    // Update territory owner
    store.updateTerritory(territoryId, { ownerId: newOwnerId });

    // Verify both updated
    const territory = store.getTerritoryById(territoryId);
    const state = store.getTerritoryStateById(territoryId);

    expect(territory?.ownerId).toBe(newOwnerId);
    expect(state?.ownerId).toBe(newOwnerId);
    expect(state?.previousOwnerId).toBe(oldOwnerId);
  });

  /**
   * C-102: conqueredAt timestamp should update on owner change
   */
  it('C-102: should update conqueredAt when owner changes', () => {
    const territoryId = 'country-FRA';
    const beforeConquest = Date.now();

    const store = createMockStore(
      [createMockTerritory(territoryId, 'commander-1')],
      new Map([[territoryId, createMockTerritoryState(territoryId, 'commander-1')]])
    );

    // Change owner
    store.updateTerritory(territoryId, { ownerId: 'commander-2' });

    const afterConquest = Date.now();
    const state = store.getTerritoryStateById(territoryId);

    expect(state?.conqueredAt).toBeGreaterThanOrEqual(beforeConquest);
    expect(state?.conqueredAt).toBeLessThanOrEqual(afterConquest);
  });

  /**
   * C-103: transitionProgress should reset to 0 on owner change
   */
  it('C-103: should reset transitionProgress for color animation', () => {
    const territoryId = 'country-GBR';

    const store = createMockStore(
      [createMockTerritory(territoryId, 'commander-1')],
      new Map([[
        territoryId,
        { ...createMockTerritoryState(territoryId, 'commander-1'), transitionProgress: 0.7 },
      ]])
    );

    // Change owner
    store.updateTerritory(territoryId, { ownerId: 'commander-2' });

    const state = store.getTerritoryStateById(territoryId);
    expect(state?.transitionProgress).toBe(0); // Reset for new transition
  });

  /**
   * C-104: Should handle updates to garrison and stability
   */
  it('C-104: should sync garrison and stability without owner change', () => {
    const territoryId = 'country-CHN';
    const ownerId = 'commander-1';

    const store = createMockStore(
      [createMockTerritory(territoryId, ownerId)],
      new Map([[territoryId, createMockTerritoryState(territoryId, ownerId)]])
    );

    // Update garrison and stability
    store.updateTerritory(territoryId, { garrison: 1500, stability: 75 });

    const state = store.getTerritoryStateById(territoryId);
    expect(state?.troops).toBe(1500);
    expect(state?.defense).toBe(75);
    expect(state?.ownerId).toBe(ownerId); // Owner unchanged
  });
});

/**
 * Contract Test Suite: Initial State Completeness
 */
describe('Contract: Territory State Initialization', () => {
  /**
   * C-105: All countries should have corresponding TerritoryState entries
   */
  it('C-105: should create TerritoryState for every country', () => {
    const countries = [
      { id: 'USA', name: 'United States' },
      { id: 'FRA', name: 'France' },
      { id: 'CHN', name: 'China' },
    ];

    const territoryStates = initializeTerritoryStates(countries);

    expect(territoryStates.size).toBe(3);
    countries.forEach((country) => {
      expect(territoryStates.has(country.id)).toBe(true);
      const state = territoryStates.get(country.id);
      expect(state?.countryId).toBe(country.id);
      expect(state?.countryName).toBe(country.name);
    });
  });

  /**
   * C-106: Missing TerritoryStates should be created with defaults
   */
  it('C-106: should create default state for missing territories', () => {
    const territoryId = 'country-missing';
    const countryName = 'Missing Country';

    const defaultState = createDefaultTerritoryState(territoryId, countryName);

    expect(defaultState.countryId).toBe(territoryId);
    expect(defaultState.countryName).toBe(countryName);
    expect(defaultState.ownerId).toBeNull();
    expect(defaultState.troops).toBe(0);
    expect(defaultState.defense).toBe(50); // Default defense
    expect(defaultState.updatedAt).toBeGreaterThan(0);
  });

  /**
   * C-107: Should detect and report missing TerritoryStates
   */
  it('C-107: should identify territories without states', () => {
    const territories = [
      createMockTerritory('USA', 'commander-1'),
      createMockTerritory('FRA', 'commander-2'),
      createMockTerritory('CHN', null),
    ];

    const territoryStates = new Map([
      ['USA', createMockTerritoryState('USA', 'commander-1')],
      // FRA missing
      ['CHN', createMockTerritoryState('CHN', null)],
    ]);

    const missingIds = findMissingTerritoryStates(territories, territoryStates);

    expect(missingIds).toEqual(['FRA']);
  });
});

/**
 * Contract Test Suite: Subscription Mechanism
 */
describe('Contract: Territory State Subscription', () => {
  /**
   * C-108: Subscribers should be notified of ownerId changes
   */
  it('C-108: should notify subscribers when ownerId changes', () => {
    const territoryId = 'country-JPN';
    const callback = vi.fn();

    const store = createMockStore(
      [createMockTerritory(territoryId, 'commander-1')],
      new Map([[territoryId, createMockTerritoryState(territoryId, 'commander-1')]])
    );

    // Subscribe
    store.subscribeToTerritoryChanges(callback);

    // Update owner
    store.updateTerritory(territoryId, { ownerId: 'commander-2' });

    // Callback should be invoked
    expect(callback).toHaveBeenCalledTimes(1);
    expect(callback).toHaveBeenCalledWith(
      expect.objectContaining({
        territoryId,
        oldOwnerId: 'commander-1',
        newOwnerId: 'commander-2',
      })
    );
  });

  /**
   * C-109: Subscribers should NOT be notified of non-ownership updates
   */
  it('C-109: should not notify on garrison/stability changes', () => {
    const territoryId = 'country-IND';
    const callback = vi.fn();

    const store = createMockStore(
      [createMockTerritory(territoryId, 'commander-1')],
      new Map([[territoryId, createMockTerritoryState(territoryId, 'commander-1')]])
    );

    store.subscribeToTerritoryChanges(callback);

    // Update without changing owner
    store.updateTerritory(territoryId, { garrison: 2000 });

    // Should NOT trigger ownership change notification
    expect(callback).not.toHaveBeenCalled();
  });

  /**
   * C-110: Unsubscribe should stop notifications
   */
  it('C-110: should stop notifications after unsubscribe', () => {
    const territoryId = 'country-BRA';
    const callback = vi.fn();

    const store = createMockStore(
      [createMockTerritory(territoryId, 'commander-1')],
      new Map([[territoryId, createMockTerritoryState(territoryId, 'commander-1')]])
    );

    const unsubscribe = store.subscribeToTerritoryChanges(callback);

    // First update
    store.updateTerritory(territoryId, { ownerId: 'commander-2' });
    expect(callback).toHaveBeenCalledTimes(1);

    // Unsubscribe
    unsubscribe();

    // Second update should NOT trigger callback
    store.updateTerritory(territoryId, { ownerId: 'commander-3' });
    expect(callback).toHaveBeenCalledTimes(1); // Still 1
  });
});

/**
 * Contract Test Suite: Consistency Verification
 */
describe('Contract: Territory Consistency Checks', () => {
  /**
   * C-111: Should detect owner mismatches between Territory and TerritoryState
   */
  it('C-111: should detect synchronization mismatches', () => {
    const territories = [
      createMockTerritory('USA', 'commander-1'),
      createMockTerritory('FRA', 'commander-2'),
    ];

    const territoryStates = new Map([
      ['USA', createMockTerritoryState('USA', 'commander-1')], // Match
      ['FRA', createMockTerritoryState('FRA', 'commander-99')], // Mismatch
    ]);

    const mismatches = verifyTerritorySync(territories, territoryStates);

    expect(mismatches).toHaveLength(1);
    expect(mismatches[0]).toContain('FRA');
    expect(mismatches[0]).toContain('commander-2');
    expect(mismatches[0]).toContain('commander-99');
  });

  /**
   * C-112: Should pass validation when all territories are synced
   */
  it('C-112: should pass validation for fully synced state', () => {
    const territories = [
      createMockTerritory('USA', 'commander-1'),
      createMockTerritory('FRA', 'commander-2'),
      createMockTerritory('CHN', null),
    ];

    const territoryStates = new Map([
      ['USA', createMockTerritoryState('USA', 'commander-1')],
      ['FRA', createMockTerritoryState('FRA', 'commander-2')],
      ['CHN', createMockTerritoryState('CHN', null)],
    ]);

    const mismatches = verifyTerritorySync(territories, territoryStates);
    expect(mismatches).toHaveLength(0);
  });
});

// ============================================================================
// Helper Functions (to be implemented or mocked)
// ============================================================================

interface MockStore {
  updateTerritory(id: string, updates: Partial<Territory>): void;
  getTerritoryById(id: string): Territory | undefined;
  getTerritoryStateById(id: string): TerritoryState | undefined;
  subscribeToTerritoryChanges(callback: (payload: any) => void): () => void;
}

function createMockStore(
  territories: Territory[],
  territoryStates: Map<string, TerritoryState>
): MockStore {
  let listeners: Array<(payload: any) => void> = [];

  return {
    updateTerritory(id, updates) {
      const territory = territories.find((t) => t.id === id);
      if (!territory) return;

      const oldOwnerId = territory.ownerId;
      Object.assign(territory, updates);

      // Sync territoryStates
      if (updates.ownerId !== undefined) {
        const state = territoryStates.get(id);
        if (state) {
          state.previousOwnerId = oldOwnerId;
          state.ownerId = updates.ownerId;
          state.conqueredAt = Date.now();
          state.transitionProgress = 0;
          state.updatedAt = Date.now();

          // Notify subscribers
          listeners.forEach((cb) =>
            cb({
              territoryId: id,
              oldOwnerId,
              newOwnerId: updates.ownerId,
              timestamp: Date.now(),
            })
          );
        }
      }

      // Sync garrison/stability
      if (updates.garrison !== undefined || updates.stability !== undefined) {
        const state = territoryStates.get(id);
        if (state) {
          if (updates.garrison) state.troops = updates.garrison;
          if (updates.stability) state.defense = updates.stability;
          state.updatedAt = Date.now();
        }
      }
    },

    getTerritoryById(id) {
      return territories.find((t) => t.id === id);
    },

    getTerritoryStateById(id) {
      return territoryStates.get(id);
    },

    subscribeToTerritoryChanges(callback) {
      listeners.push(callback);
      return () => {
        listeners = listeners.filter((cb) => cb !== callback);
      };
    },
  };
}

function createMockTerritory(id: string, ownerId: string | null): Territory {
  return {
    id,
    name: `Territory ${id}`,
    polygon: [],
    adjacentIds: [],
    terrain: 'plains',
    resourceYield: { food: 5, industry: 5 },
    ownerId,
    garrison: 1000,
    stability: 60,
  };
}

function createMockTerritoryState(id: string, ownerId: string | null): TerritoryState {
  return {
    countryId: id,
    countryName: `Country ${id}`,
    ownerId,
    troops: 1000,
    resources: 0,
    defense: 60,
    updatedAt: Date.now(),
    conqueredAt: ownerId ? Date.now() : null,
    previousOwnerId: null,
    transitionProgress: null,
    isHighlighted: false,
  };
}

function initializeTerritoryStates(
  countries: Array<{ id: string; name: string }>
): Map<string, TerritoryState> {
  const states = new Map<string, TerritoryState>();
  countries.forEach((country) => {
    states.set(country.id, createDefaultTerritoryState(country.id, country.name));
  });
  return states;
}

function createDefaultTerritoryState(id: string, name: string): TerritoryState {
  return {
    countryId: id,
    countryName: name,
    ownerId: null,
    troops: 0,
    resources: 0,
    defense: 50,
    updatedAt: Date.now(),
    conqueredAt: null,
    previousOwnerId: null,
    transitionProgress: null,
    isHighlighted: false,
  };
}

function findMissingTerritoryStates(
  territories: Territory[],
  states: Map<string, TerritoryState>
): string[] {
  return territories.filter((t) => !states.has(t.id)).map((t) => t.id);
}

function verifyTerritorySync(
  territories: Territory[],
  states: Map<string, TerritoryState>
): string[] {
  const mismatches: string[] = [];

  territories.forEach((territory) => {
    const state = states.get(territory.id);
    if (!state) {
      mismatches.push(`Missing state for territory: ${territory.id}`);
      return;
    }

    if (state.ownerId !== territory.ownerId) {
      mismatches.push(
        `Owner mismatch for ${territory.id}: ` +
          `Territory=${territory.ownerId}, State=${state.ownerId}`
      );
    }
  });

  return mismatches;
}

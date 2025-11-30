import { create } from 'zustand';
import type {
  HistoricalCommander,
  Territory,
  BattleEvent,
  TelemetrySignal,
  Country,
  TerritoryState,
  CommanderColor,
  MapRenderState,
} from '../types';
import { resetBattleEventCounter } from '../simulation/systems/battleSystem';

/**
 * Helper function to update territory ownership and sync state
 */
function updateTerritoryOwnership(
  state: GameState,
  id: string,
  updates: Partial<Territory>,
  newTerritories: Territory[]
) {
  console.log(`🔄 [updateTerritoryOwnership] Processing ${id}, ownerId: ${updates.ownerId}`);

  const newStates = new Map(state.territoryStates);

  // Runtime path: treat incoming id strictly as a Country.id
  const existingState = newStates.get(id);

  console.log(
    `🔄 [updateTerritoryOwnership] Treating ${id} as Country.id. Existing:`,
    existingState ? `${existingState.ownerId}` : 'NOT FOUND'
  );

  if (existingState) {
    const updatedState = {
      ...existingState,
      previousOwnerId: existingState.ownerId,
      ownerId: updates.ownerId!,
      troops: updates.garrison ?? existingState.troops,
      defense: updates.stability ?? existingState.defense,
      conqueredAt: Date.now(),
      updatedAt: Date.now(),
      transitionProgress: 0,
    };

    newStates.set(id, updatedState);

    console.log(
      `🔄 [Territory] Ownership changed: ${id} ${existingState.ownerId} → ${updates.ownerId}`
    );
    console.log(`🔄 [updateTerritoryOwnership] Updated state:`, updatedState);
  } else {
    const territory = state.territories.find((t) => t.id === id);
    const newState = {
      countryId: id,
      countryName: territory?.name || id,
      ownerId: updates.ownerId!,
      troops: updates.garrison ?? 0,
      resources: 0,
      defense: updates.stability ?? 50,
      updatedAt: Date.now(),
      conqueredAt: Date.now(),
      previousOwnerId: null,
      transitionProgress: null,
      isHighlighted: false,
    };

    newStates.set(id, newState);

    console.log(`🆕 [Territory] Created new state: ${id} → ${updates.ownerId}`);
    console.log(`🆕 [updateTerritoryOwnership] New state:`, newState);
  }

  console.log(`🔄 [updateTerritoryOwnership] Returning updated states map with ${newStates.size} entries`);

  return {
    territories: newTerritories,
    territoryStates: newStates,
  };
}

/**
 * Helper function to update territory stats (garrison/stability)
 */
function updateTerritoryStats(
  state: GameState,
  id: string,
  updates: Partial<Territory>,
  newTerritories: Territory[]
) {
  const existingState = state.territoryStates.get(id);
  if (existingState) {
    const newStates = new Map(state.territoryStates);
    newStates.set(id, {
      ...existingState,
      troops: updates.garrison ?? existingState.troops,
      defense: updates.stability ?? existingState.defense,
      updatedAt: Date.now(),
    });

    return {
      territories: newTerritories,
      territoryStates: newStates,
    };
  }

  return { territories: newTerritories };
}

export interface GameState {
  // 游戏状态
  gameStarted: boolean;
  sessionId: string;
  seed: string;
  tick: number;
  elapsedMs: number;
  stasisTimerMs: number;
  victoryThreshold: number;
  isPaused: boolean;

  // 实体
  commanders: HistoricalCommander[];
  territories: Territory[];
  eventLog: BattleEvent[];

  // UI 状态
  selectedCommanderId: string | null;
  selectedTerritoryId: string | null;
  showVictoryModal: boolean;
  victorCommanderId: string | null;

  // 性能
  performanceMetrics: { fps: number; tickMs: number };
  telemetrySignals: TelemetrySignal[];

  // 地图状态
  countries: Country[];
  territoryStates: Map<string, TerritoryState>;
  colorMappings: Map<string, CommanderColor>;
  mapRenderState: MapRenderState | null;

  // Actions
  startGame: (seed: string) => void;
  setCommanders: (commanders: HistoricalCommander[]) => void;
  setTerritories: (territories: Territory[]) => void;
  updateCommander: (id: string, updates: Partial<HistoricalCommander>) => void;
  updateTerritory: (id: string, updates: Partial<Territory>) => void;
  addBattleEvent: (event: BattleEvent) => void;
  selectCommander: (id: string | null) => void;
  selectTerritory: (id: string | null) => void;
  setVictory: (commanderId: string) => void;
  incrementTick: () => void;
  setPaused: (paused: boolean) => void;
  addTelemetry: (signal: TelemetrySignal) => void;
  updatePerformance: (metrics: Partial<{ fps: number; tickMs: number }>) => void;
  resetGame: () => void;

  // Map Actions
  setCountries: (countries: Country[]) => void;
  setTerritoryStates: (states: Map<string, TerritoryState>) => void;
  updateTerritoryState: (countryId: string, updates: Partial<TerritoryState>) => void;
  setColorMappings: (mappings: Map<string, CommanderColor>) => void;
  setMapRenderState: (state: MapRenderState) => void;
  updateMapRenderState: (updates: Partial<MapRenderState>) => void;
}

export const useGameStore = create<GameState>((set) => ({
  // Initial state
  gameStarted: false,
  sessionId: '',
  seed: '',
  tick: 0,
  elapsedMs: 0,
  stasisTimerMs: 0,
  victoryThreshold: 0.9,
  isPaused: false,

  commanders: [],
  territories: [],
  eventLog: [],

  selectedCommanderId: null,
  selectedTerritoryId: null,
  showVictoryModal: false,
  victorCommanderId: null,

  performanceMetrics: { fps: 60, tickMs: 0 },
  telemetrySignals: [],

  countries: [],
  territoryStates: new Map(),
  colorMappings: new Map(),
  mapRenderState: null,

  // Actions
  startGame: (seed: string) =>
    set({
      gameStarted: true,
      sessionId: `session-${Date.now()}`,
      seed,
      tick: 0,
      elapsedMs: 0,
      stasisTimerMs: 0,
      eventLog: [],
      showVictoryModal: false,
      victorCommanderId: null,
    }),

  setCommanders: (commanders) => set({ commanders }),

  setTerritories: (territories) => set({ territories }),

  updateCommander: (id, updates) =>
    set((state) => ({
      commanders: state.commanders.map((c) => (c.id === id ? { ...c, ...updates } : c)),
    })),

  updateTerritory: (id, updates) =>
    set((state) => {
      console.log(`🔄 [store.updateTerritory] Called for ${id}:`, updates);
      
      // 1. 更新 territories 数组
      const newTerritories = state.territories.map((t) =>
        t.id === id ? { ...t, ...updates } : t
      );

      // 2. 如果 ownerId 变化，同步更新 territoryStates
      if (updates.ownerId !== undefined) {
        console.log(`🔄 [store] ownerId change detected: ${id} → ${updates.ownerId}`);
        return updateTerritoryOwnership(state, id, updates, newTerritories);
      }

      // 3. 如果只更新 garrison/stability，也同步到 territoryStates
      if (updates.garrison !== undefined || updates.stability !== undefined) {
        return updateTerritoryStats(state, id, updates, newTerritories);
      }

      return { territories: newTerritories };
    }),

  addBattleEvent: (event) =>
    set((state) => ({
      eventLog: [...state.eventLog, event].slice(-200), // Keep last 200 events
    })),

  selectCommander: (id) => set({ selectedCommanderId: id }),

  selectTerritory: (id) => set({ selectedTerritoryId: id }),

  setVictory: (commanderId) =>
    set({ showVictoryModal: true, victorCommanderId: commanderId, isPaused: true }),

  incrementTick: () =>
    set((state) => ({
      tick: state.tick + 1,
      elapsedMs: state.elapsedMs + 2000,
    })),

  setPaused: (paused) => set({ isPaused: paused }),

  addTelemetry: (signal) =>
    set((state) => ({
      telemetrySignals: [...state.telemetrySignals, signal].slice(-100),
    })),

  updatePerformance: (metrics) =>
    set((state) => ({
      performanceMetrics: { ...state.performanceMetrics, ...metrics },
    })),

  resetGame: () => {
    // Reset battle event counter to ensure ID uniqueness in new game session
    resetBattleEventCounter();
    
    set({
      gameStarted: false,
      sessionId: '',
      seed: '',
      tick: 0,
      elapsedMs: 0,
      stasisTimerMs: 0,
      commanders: [],
      territories: [],
      eventLog: [],
      selectedCommanderId: null,
      selectedTerritoryId: null,
      showVictoryModal: false,
      victorCommanderId: null,
      isPaused: false,
      countries: [],
      territoryStates: new Map(),
      mapRenderState: null,
    });
  },

  // Map Actions
  setCountries: (countries) => set({ countries }),

  setTerritoryStates: (states) => set({ territoryStates: states }),

  updateTerritoryState: (countryId, updates) =>
    set((state) => {
      const newStates = new Map(state.territoryStates);
      const existing = newStates.get(countryId);
      if (existing) {
        newStates.set(countryId, { ...existing, ...updates });
      }
      return { territoryStates: newStates };
    }),

  setColorMappings: (mappings) => set({ colorMappings: mappings }),

  setMapRenderState: (mapState) => set({ mapRenderState: mapState }),

  updateMapRenderState: (updates) =>
    set((state) => ({
      mapRenderState: state.mapRenderState ? { ...state.mapRenderState, ...updates } : null,
    })),
}));

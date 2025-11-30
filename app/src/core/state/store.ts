import { create } from 'zustand';
import type { HistoricalCommander, Territory, BattleEvent, TelemetrySignal } from '../types';

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
    set((state) => ({
      territories: state.territories.map((t) => (t.id === id ? { ...t, ...updates } : t)),
    })),

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

  resetGame: () =>
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
    }),
}));

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
  FactionStatistics,
  PerformanceMetrics,
  DirtyFlags,
} from '../types';
import { resetBattleEventCounter } from '../simulation/systems/battleSystem';
import { RingBuffer } from '@/utils/RingBuffer';
import { DEFAULT_PERFORMANCE_CONFIG, type PerformanceConfig } from '@/config/performance.config';
import { logger } from '@/config/debug.config';

/**
 * Helper function to update territory ownership and sync state
 */
function updateTerritoryOwnership(
  state: GameState,
  id: string,
  updates: Partial<Territory>,
  newTerritories: Territory[]
) {
  logger.log('STORE_UPDATE', `🔄 [updateTerritoryOwnership] Processing ${id}, ownerId: ${updates.ownerId}`);

  const newStates = new Map(state.territoryStates);

  // Runtime path: treat incoming id strictly as a Country.id
  const existingState = newStates.get(id);

  logger.log(
    'STORE_UPDATE',
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

    logger.log(
      'TERRITORY_OWNERSHIP',
      `🔄 [Territory] Ownership changed: ${id} ${existingState.ownerId} → ${updates.ownerId}`
    );
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

    logger.log('TERRITORY_OWNERSHIP', `🆕 [Territory] Created new state: ${id} → ${updates.ownerId}`);
  }

  // Mark territory as dirty for incremental rendering
  const newDirtyFlags = { ...state.dirtyFlags };
  newDirtyFlags.territories.add(id);

  return {
    territories: newTerritories,
    territoryStates: newStates,
    dirtyFlags: newDirtyFlags,
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
  eventLogBuffer: RingBuffer<BattleEvent>; // 使用 RingBuffer 存储事件

  // UI 状态
  selectedCommanderId: string | null;
  selectedTerritoryId: string | null;
  showVictoryModal: boolean;
  victorCommanderId: string | null;

  // 性能
  performanceMetrics: PerformanceMetrics;
  performanceConfig: PerformanceConfig;
  dirtyFlags: DirtyFlags;
  telemetrySignals: TelemetrySignal[];

  // 地图状态
  countries: Country[];
  territoryStates: Map<string, TerritoryState>;
  colorMappings: Map<string, CommanderColor>;
  mapRenderState: MapRenderState | null;

  // 势力统计 (Feature: 005-faction-stats)
  factionStats: Map<string, FactionStatistics>;
  showFactionStatsPanel: boolean;

  // Actions
  startGame: (seed: string) => void;
  setCommanders: (commanders: HistoricalCommander[]) => void;
  setTerritories: (territories: Territory[]) => void;
  updateCommander: (id: string, updates: Partial<HistoricalCommander>) => void;
  batchUpdateCommanders: (updates: Array<{ id: string; updates: Partial<HistoricalCommander> }>) => void;
  updateTerritory: (id: string, updates: Partial<Territory>) => void;
  batchUpdateTerritories: (updates: Array<{ id: string; updates: Partial<Territory> }>) => void;
  addBattleEvent: (event: BattleEvent) => void;
  addBattleEvents: (events: BattleEvent[]) => void;
  selectCommander: (id: string | null) => void;
  selectTerritory: (id: string | null) => void;
  setVictory: (commanderId: string) => void;
  closeVictoryModal: () => void;
  incrementTick: () => void;
  setPaused: (paused: boolean) => void;
  addTelemetry: (signal: TelemetrySignal) => void;
  updatePerformance: (metrics: Partial<PerformanceMetrics>) => void;
  resetGame: () => void;

  // Map Actions
  setCountries: (countries: Country[]) => void;
  setTerritoryStates: (states: Map<string, TerritoryState>) => void;
  updateTerritoryState: (countryId: string, updates: Partial<TerritoryState>) => void;
  setColorMappings: (mappings: Map<string, CommanderColor>) => void;
  setMapRenderState: (state: MapRenderState) => void;
  updateMapRenderState: (updates: Partial<MapRenderState>) => void;

  // Performance Actions
  setPerformanceConfig: (config: Partial<PerformanceConfig>) => void;
  markDirty: (type: 'territory' | 'commander', id: string) => void;
  markFullRedraw: () => void;
  clearDirtyFlags: () => void;

  // Faction Stats Actions (Feature: 005-faction-stats)
  updateFactionStats: (commanderId: string, updates: Partial<FactionStatistics>) => void;
  initializeFactionStats: () => void;
  toggleFactionStatsPanel: () => void;
  closeFactionStatsPanel: () => void;
}

/**
 * 创建初始脏标记
 */
function createInitialDirtyFlags(): DirtyFlags {
  return {
    territories: new Set<string>(),
    commanders: new Set<string>(),
    fullRedraw: true, // 初始需要全量绘制
    lastRenderTick: -1,
  };
}

/**
 * 创建初始性能指标
 */
function createInitialPerformanceMetrics(): PerformanceMetrics {
  return {
    fps: 60,
    tickMs: 0,
    memoryUsageMB: 0,
    renderMs: 0,
    lastUpdated: Date.now(),
  };
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
  eventLogBuffer: new RingBuffer<BattleEvent>(DEFAULT_PERFORMANCE_CONFIG.eventLogCapacity),

  selectedCommanderId: null,
  selectedTerritoryId: null,
  showVictoryModal: false,
  victorCommanderId: null,

  performanceMetrics: createInitialPerformanceMetrics(),
  performanceConfig: { ...DEFAULT_PERFORMANCE_CONFIG },
  dirtyFlags: createInitialDirtyFlags(),
  telemetrySignals: [],

  countries: [],
  territoryStates: new Map(),
  colorMappings: new Map(),
  mapRenderState: null,

  factionStats: new Map(),
  showFactionStatsPanel: false,

  // Actions
  startGame: (seed: string) =>
    set((state) => ({
      gameStarted: true,
      sessionId: `session-${Date.now()}`,
      seed,
      tick: 0,
      elapsedMs: 0,
      stasisTimerMs: 0,
      eventLog: [],
      eventLogBuffer: new RingBuffer<BattleEvent>(state.performanceConfig.eventLogCapacity),
      showVictoryModal: false,
      victorCommanderId: null,
      dirtyFlags: createInitialDirtyFlags(),
    })),

  setCommanders: (commanders) => set({ commanders }),

  setTerritories: (territories) => set({ territories }),

  updateCommander: (id, updates) =>
    set((state) => {
      // Mark commander as dirty
      const newDirtyFlags = { ...state.dirtyFlags };
      newDirtyFlags.commanders.add(id);
      
      return {
        commanders: state.commanders.map((c) => (c.id === id ? { ...c, ...updates } : c)),
        dirtyFlags: newDirtyFlags,
      };
    }),

  batchUpdateCommanders: (updates) =>
    set((state) => {
      if (updates.length === 0) return {};
      
      // 构建更新 Map
      const updateMap = new Map<string, Partial<HistoricalCommander>>();
      for (const { id, updates: commanderUpdates } of updates) {
        updateMap.set(id, commanderUpdates);
      }
      
      // 单次遍历更新
      const newCommanders = state.commanders.map((c) => {
        const commanderUpdates = updateMap.get(c.id);
        return commanderUpdates ? { ...c, ...commanderUpdates } : c;
      });
      
      // 标记脏
      const newDirtyFlags = { ...state.dirtyFlags };
      for (const { id } of updates) {
        newDirtyFlags.commanders.add(id);
      }
      
      return {
        commanders: newCommanders,
        dirtyFlags: newDirtyFlags,
      };
    }),

  updateTerritory: (id, updates) =>
    set((state) => {
      logger.log('STORE_UPDATE', `🔄 [store.updateTerritory] Called for ${id}`);
      
      // 1. 更新 territories 数组
      const newTerritories = state.territories.map((t) =>
        t.id === id ? { ...t, ...updates } : t
      );

      // 2. 如果 ownerId 变化，同步更新 territoryStates
      if (updates.ownerId !== undefined) {
        logger.log('TERRITORY_OWNERSHIP', `🔄 [store] ownerId change detected: ${id} → ${updates.ownerId}`);
        return updateTerritoryOwnership(state, id, updates, newTerritories);
      }

      // 3. 如果只更新 garrison/stability，也同步到 territoryStates
      if (updates.garrison !== undefined || updates.stability !== undefined) {
        return updateTerritoryStats(state, id, updates, newTerritories);
      }

      return { territories: newTerritories };
    }),

  batchUpdateTerritories: (updates) =>
    set((state) => {
      logger.log('STORE_UPDATE', `🔄 [store.batchUpdateTerritories] Processing ${updates.length} updates`);
      
      // 构建更新 Map，O(1) 查找
      const updateMap = new Map<string, Partial<Territory>>();
      for (const { id, updates: territoryUpdates } of updates) {
        updateMap.set(id, territoryUpdates);
      }
      
      // 单次遍历更新 territories 数组
      const newTerritories = state.territories.map((t) => {
        const territoryUpdates = updateMap.get(t.id);
        return territoryUpdates ? { ...t, ...territoryUpdates } : t;
      });
      
      // 更新 territoryStates
      const newStates = new Map(state.territoryStates);
      const newDirtyFlags = { ...state.dirtyFlags };
      
      for (const { id, updates: territoryUpdates } of updates) {
        const existingState = newStates.get(id);
        if (existingState) {
          if (territoryUpdates.ownerId !== undefined) {
            newStates.set(id, {
              ...existingState,
              previousOwnerId: existingState.ownerId,
              ownerId: territoryUpdates.ownerId,
              troops: territoryUpdates.garrison ?? existingState.troops,
              defense: territoryUpdates.stability ?? existingState.defense,
              conqueredAt: Date.now(),
              updatedAt: Date.now(),
              transitionProgress: 0,
            });
          } else if (territoryUpdates.garrison !== undefined || territoryUpdates.stability !== undefined) {
            newStates.set(id, {
              ...existingState,
              troops: territoryUpdates.garrison ?? existingState.troops,
              defense: territoryUpdates.stability ?? existingState.defense,
              updatedAt: Date.now(),
            });
          }
        }
        
        // Mark as dirty
        newDirtyFlags.territories.add(id);
      }
      
      return {
        territories: newTerritories,
        territoryStates: newStates,
        dirtyFlags: newDirtyFlags,
      };
    }),

  addBattleEvent: (event) =>
    set((state) => {
      // 使用 RingBuffer 存储事件（O(1) 操作）
      state.eventLogBuffer.push(event);
      
      // 同时更新 eventLog 数组以保持向后兼容
      return {
        eventLog: state.eventLogBuffer.toArray(),
      };
    }),

  addBattleEvents: (events) =>
    set((state) => {
      // 批量添加事件
      for (const event of events) {
        state.eventLogBuffer.push(event);
      }
      return {
        eventLog: state.eventLogBuffer.toArray(),
      };
    }),

  selectCommander: (id) => set({ selectedCommanderId: id }),

  selectTerritory: (id) => set({ selectedTerritoryId: id }),

  setVictory: (commanderId) =>
    set({ showVictoryModal: true, victorCommanderId: commanderId, isPaused: true }),

  closeVictoryModal: () =>
    set({ showVictoryModal: false }),

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
      performanceMetrics: { 
        ...state.performanceMetrics, 
        ...metrics,
        lastUpdated: Date.now(),
      },
    })),

  resetGame: () => {
    // Reset battle event counter to ensure ID uniqueness in new game session
    resetBattleEventCounter();
    
    set((state) => ({
      gameStarted: false,
      sessionId: '',
      seed: '',
      tick: 0,
      elapsedMs: 0,
      stasisTimerMs: 0,
      commanders: [],
      territories: [],
      eventLog: [],
      eventLogBuffer: new RingBuffer<BattleEvent>(state.performanceConfig.eventLogCapacity),
      selectedCommanderId: null,
      selectedTerritoryId: null,
      showVictoryModal: false,
      victorCommanderId: null,
      isPaused: false,
      countries: [],
      territoryStates: new Map(),
      mapRenderState: null,
      dirtyFlags: createInitialDirtyFlags(),
      factionStats: new Map(),
    }));
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

  // Performance Actions
  setPerformanceConfig: (config) =>
    set((state) => ({
      performanceConfig: { ...state.performanceConfig, ...config },
    })),

  markDirty: (type, id) =>
    set((state) => {
      const newDirtyFlags = { ...state.dirtyFlags };
      if (type === 'territory') {
        newDirtyFlags.territories.add(id);
      } else {
        newDirtyFlags.commanders.add(id);
      }
      return { dirtyFlags: newDirtyFlags };
    }),

  markFullRedraw: () =>
    set((state) => ({
      dirtyFlags: { ...state.dirtyFlags, fullRedraw: true },
    })),

  clearDirtyFlags: () =>
    set((state) => ({
      dirtyFlags: {
        territories: new Set<string>(),
        commanders: new Set<string>(),
        fullRedraw: false,
        lastRenderTick: state.tick,
      },
    })),

  // Faction Stats Actions Implementation
  updateFactionStats: (commanderId, updates) =>
    set((state) => {
      const newMap = new Map(state.factionStats);
      const existing = newMap.get(commanderId);
      if (existing) {
        newMap.set(commanderId, { 
          ...existing, 
          ...updates, 
          lastUpdatedAt: Date.now() 
        });
      }
      return { factionStats: newMap };
    }),

  initializeFactionStats: () =>
    set((state) => {
      logger.log('GAME_SESSION', '🔧 [initializeFactionStats] Starting...');
      
      const statsMap = new Map<string, FactionStatistics>();
      
      state.commanders.forEach((commander) => {
        // 计算占领的国家数量和总面积
        const ownedCountries = commander.controlledTerritories
          .map((territoryId) => state.countries.find((c) => c.id === territoryId))
          .filter((c): c is Country => c !== undefined);

        const countryCount = ownedCountries.length;
        const totalArea = ownedCountries.reduce((sum, c) => sum + c.area, 0);

        statsMap.set(commander.id, {
          commanderId: commander.id,
          commanderName: commander.name,
          status: commander.status,
          countryCount,
          totalArea,
          wins: 0,
          losses: 0,
          winRate: -1, // N/A initially
          lastUpdatedAt: Date.now(),
        });
      });

      logger.log('GAME_SESSION', `🔧 [initializeFactionStats] Created ${statsMap.size} faction stats`);
      return { factionStats: statsMap };
    }),

  toggleFactionStatsPanel: () =>
    set((state) => ({ showFactionStatsPanel: !state.showFactionStatsPanel })),

  closeFactionStatsPanel: () =>
    set({ showFactionStatsPanel: false }),
}));

export interface HistoricalCommander {
  id: string;
  name: string;
  originRegion: 'africa' | 'americas' | 'asia' | 'europe' | 'oceania';
  portraitAsset: string;
  baseAttributes: {
    attack: number;
    defense: number;
    mobility: number;
    leadership: number;
  };
  skillCards: SkillCard[];
  currentPower: number;
  controlledTerritories: string[];
  alliances: string[];
  hostilities: string[];
  morale: number;
  nextActionEta: string;
  status: 'active' | 'eliminated';
}

export interface SkillCard {
  id: string;
  name: string;
  trigger: string;
  modifier: string;
  cooldownMs: number;
  durationMs: number;
  activeModifier?: number;
}

export interface Territory {
  id: string;
  name: string;
  polygon: number[][];
  adjacentIds: string[];
  terrain: 'plains' | 'mountain' | 'desert' | 'forest' | 'water';
  resourceYield: { food: number; industry: number };
  ownerId: string | null;
  garrison: number;
  stability: number;
}

export interface BattleEvent {
  id: string;
  timestamp: string;
  type: 'attack' | 'alliance' | 'betrayal' | 'cataclysm' | 'victory' | 'elimination';
  attackerId?: string;
  defenderId?: string;
  territoryId?: string;
  result: 'success' | 'fail' | 'pending';
  delta: Record<string, number>;
  narrative: string;
  seed: string;
}

export interface WorldState {
  sessionId: string;
  seed: string;
  tick: number;
  commanders: HistoricalCommander[];
  territories: Territory[];
  eventLog: BattleEvent[];
  victoryThreshold: number;
  elapsedMs: number;
  stasisTimerMs: number;
  performanceMetrics: { fps: number; tickMs: number };
  lastSnapshot: string;
}

export interface TelemetrySignal {
  type: 'fps' | 'tick' | 'stasis' | 'error';
  value: number;
  timestamp: string;
}

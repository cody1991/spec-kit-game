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
  controlledTerritories: string[]; // Runtime: country IDs, Initial: region IDs
  initialRegions?: string[]; // NEW: Store original region IDs for debugging
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

// ============================================================================
// GeoJSON and Map Types
// ============================================================================

/**
 * 二维点（可以是地理坐标或屏幕坐标）
 */
export interface Point {
  x: number;
  y: number;
}

/**
 * 边界框（矩形）
 */
export interface BoundingBox {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
}

/**
 * GeoJSON MultiPolygon 类型
 */
export interface MultiPolygon {
  type: 'MultiPolygon';
  coordinates: number[][][][]; // [polygon][ring][point][lon|lat]
}

/**
 * 国家实体（地图数据）
 */
export interface Country {
  id: string; // ISO 3166-1 alpha-3
  name: string;
  nameEn: string;
  geometry: MultiPolygon;
  centroid: Point;
  bbox: BoundingBox;
  area: number; // km²
  neighbors: string[];
  simplifiedGeometry?: MultiPolygon;
  gridCells: number[];
}

/**
 * 领土状态（游戏状态）
 */
export interface TerritoryState {
  countryId: string;
  countryName?: string; // NEW: Country name (cached to avoid repeated lookups)
  ownerId: string | null;
  troops: number;
  resources: number;
  defense: number;
  updatedAt: number;
  conqueredAt: number | null;
  previousOwnerId: string | null;
  transitionProgress: number | null;
  isHighlighted: boolean;
}

/**
 * 指挥官颜色映射
 */
export interface CommanderColor {
  commanderId: string;
  primary: number; // 0xRRGGBB
  secondary: number;
  alpha: number;
  pattern?: string;
  label?: string;
  glowColor?: number;
  pulseSpeed?: number;
}

/**
 * 地图渲染状态
 */
export interface MapRenderState {
  cameraViewport: BoundingBox;
  zoom: number;
  lodLevel: 0 | 1 | 2;
  visibleCountryIds: string[];
  gridCellsInView: number[];
  hoveredCountryId: string | null;
  selectedCountryId: string | null;
  lastFrameTime: number;
  averageFps: number;
  enableAnimation: boolean;
}

export interface HistoricalCommander {
  id: string; // 与 Country.id 对齐，作为国家级占领键
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
  controlledTerritories: string[]; // Runtime: Country.id 列表，初始化阶段可从区域 ID 映射而来
  initialRegions?: string[]; // NEW: Store original region IDs for debugging
  alliances: string[];
  hostilities: string[];
  morale: number;
  nextActionEta: string;
  status: 'active' | 'eliminated';
}

export interface SkillCard {
  id: string; // 与 Country.id 对齐，作为国家级占领键
  name: string;
  trigger: string;
  modifier: string;
  cooldownMs: number;
  durationMs: number;
  activeModifier?: number;
}

export interface Territory {
  id: string; // 与 Country.id 对齐，作为国家级占领键
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
  id: string; // 与 Country.id 对齐，作为国家级占领键
  timestamp: string;
  type: 'attack' | 'alliance' | 'betrayal' | 'cataclysm' | 'victory' | 'elimination';
  attackerId?: string;
  defenderId?: string;
  territoryId?: string; // 运行时为单个 Country.id，不再接受区域 ID
  result: 'success' | 'fail' | 'pending';
  delta: Record<string, number>;
  narrative: string;
  seed: string;
}

/**
 * 性能指标（增强版）
 * 用于监控游戏运行时性能
 */
export interface PerformanceMetrics {
  /** 当前FPS */
  fps: number;
  /** Tick处理时间(ms) */
  tickMs: number;
  /** 内存使用(MB) */
  memoryUsageMB: number;
  /** 渲染时间(ms) */
  renderMs: number;
  /** 上次更新时间戳 */
  lastUpdated: number;
}

/**
 * 脏标记
 * 用于增量渲染，只渲染变化的部分
 */
export interface DirtyFlags {
  /** 需要重绘的领土ID */
  territories: Set<string>;
  /** 需要重绘的指挥官ID */
  commanders: Set<string>;
  /** 是否需要全量重绘 */
  fullRedraw: boolean;
  /** 上次渲染的Tick */
  lastRenderTick: number;
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
  performanceMetrics: PerformanceMetrics;
  lastSnapshot: string;
}

export interface TelemetrySignal {
  type: 'fps' | 'tick' | 'stasis' | 'error' | 'territory:conquered';
  timestamp: string;
  value?: number;
  payload?: Record<string, unknown>;
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

// ============================================================================
// Faction Statistics Types (Feature: 005-faction-stats)
// ============================================================================

/**
 * 势力统计数据
 * 包含领土统计和战斗统计的综合数据
 */
export interface FactionStatistics {
  commanderId: string;
  commanderName: string;
  status: 'active' | 'eliminated';
  countryCount: number;
  totalArea: number;
  wins: number;
  losses: number;
  winRate: number; // [0, 1]
  lastUpdatedAt: number;
  /** 领土加成数据 (Feature: 008-territory-bonus) */
  territoryBonus: TerritoryBonus | null;
}

/**
 * 战斗统计更新事件（内部使用）
 */
export interface BattleStatUpdate {
  attackerId: string;
  defenderId: string;
  result: 'success' | 'fail';
  timestamp: string;
}

/**
 * 领土统计更新事件（内部使用）
 */
export interface TerritoryStatUpdate {
  commanderId: string;
  countryId: string;
  action: 'gain' | 'lose';
  countryArea: number;
}

/**
 * 排行榜排序规则
 */
export interface LeaderboardSortCriteria {
  primary: 'countryCount';
  primaryOrder: 'desc';
  secondary: 'totalArea';
  secondaryOrder: 'desc';
}

/**
 * 排行榜数据
 */
export interface Leaderboard {
  factions: FactionStatistics[];
  timestamp: number;
  sortCriteria: LeaderboardSortCriteria;
}

// ============================================================================
// Territory Bonus Types (Feature: 008-territory-bonus)
// ============================================================================

/**
 * 领土加成配置
 * 可调参数，便于平衡性调优
 */
export interface TerritoryBonusConfig {
  /** 攻击加成上限 (0.50 = 50%) */
  maxAttackBonus: number;
  /** 防御加成上限 (0.40 = 40%) */
  maxDefenseBonus: number;
  /** 城市加成基础系数 */
  cityBaseFactor: number;
  /** 城市加成缩放系数 */
  cityScaleFactor: number;
  /** 面积加成基础系数 */
  areaBaseFactor: number;
  /** 面积加成缩放系数 */
  areaScaleFactor: number;
  /** 连续领土额外加成系数 */
  continuityBonus: number;
  /** 小势力防御加成上限 */
  smallFactionDefenseBonus: number;
  /** 小势力阈值（城市数） */
  smallFactionThreshold: number;
}

/**
 * 领土加成数据
 * 存储计算后的加成值
 */
export interface TerritoryBonus {
  /** 指挥官ID */
  commanderId: string;
  /** 城市数量加成 (0-0.30) */
  cityBonus: number;
  /** 领土面积加成 (0-0.30) */
  areaBonus: number;
  /** 连续领土额外加成 (0-0.06) */
  continuityBonus: number;
  /** 小势力防御加成 (0-0.15) */
  smallFactionDefenseBonus: number;
  /** 总攻击力加成 */
  totalAttackBonus: number;
  /** 总防御力加成 */
  totalDefenseBonus: number;
  /** 最大连通分量城市数 */
  largestContiguousCount: number;
  /** 连通分量数量 */
  contiguousRegionCount: number;
  /** 上次更新时间 */
  lastUpdatedAt: number;
}

/**
 * 连通分量分析结果
 */
export interface ContiguityAnalysis {
  /** 连通分量列表，每个元素是一组领土ID */
  regions: string[][];
  /** 最大连通分量大小 */
  largestSize: number;
  /** 总领土数 */
  totalCount: number;
  /** 最大连通分量占比 */
  largestRatio: number;
}

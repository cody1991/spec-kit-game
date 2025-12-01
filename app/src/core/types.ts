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

// ============================================================================
// Conquest Progress Types (Feature: 010-gradual-conquest)
// ============================================================================

/**
 * 单个攻击方对单个领土的占领进度记录
 */
export interface ConquestProgressEntry {
  /** 攻击方指挥官ID */
  attackerId: string;
  /** 当前进度 (0-100) */
  progress: number;
  /** 最后战斗时间戳 (ms) */
  lastBattleTime: number;
  /** 累计战斗次数 */
  battleCount: number;
}

/**
 * 领土的完整占领状态
 */
export interface TerritoryConquestState {
  /** 领土ID */
  territoryId: string;
  /** 当前所有者ID */
  currentOwnerId: string | null;
  /** 各攻击方的进度映射 */
  progressMap: Map<string, ConquestProgressEntry>;
  /** 是否处于争夺状态 */
  isContested: boolean;
  /** 最高进度的攻击方ID */
  leadingAttackerId: string | null;
  /** 最高进度值 */
  leadingProgress: number;
}

/**
 * 占领进度配置
 */
export interface ConquestProgressConfig {
  /** 小国面积阈值 (km²) */
  smallCountryThreshold: number;
  /** 大国面积阈值 (km²) */
  largeCountryThreshold: number;

  /** 小国进度增量 (攻击胜利) */
  smallCountryProgressGain: number;
  /** 中国进度增量 */
  mediumCountryProgressGain: number;
  /** 大国进度增量 */
  largeCountryProgressGain: number;

  /** 小国进度减量 (防守成功) */
  smallCountryProgressLoss: number;
  /** 中国进度减量 */
  mediumCountryProgressLoss: number;
  /** 大国进度减量 */
  largeCountryProgressLoss: number;

  /** 实力优势乘数 (攻击方实力 ≥ 2x 防守方) */
  powerAdvantageMultiplier: number;
  /** 实力劣势乘数 (攻击方实力 ≤ 0.5x 防守方) */
  powerDisadvantageMultiplier: number;

  /** 决战模式进度乘数 */
  endgameModeMultiplier: number;

  /** 进度衰减速率 (每分钟) */
  decayRatePerMinute: number;
  /** 衰减检查间隔 (tick数) */
  decayCheckInterval: number;
}

/**
 * 进度计算结果
 */
export interface ProgressCalculationResult {
  /** 基础进度变化量 */
  baseProgress: number;
  /** 应用乘数后的进度变化量 */
  finalProgress: number;
  /** 应用的乘数 */
  multiplier: number;
  /** 领土大小分类 */
  sizeCategory: 'small' | 'medium' | 'large';
}

/**
 * 进度变化事件
 */
export interface ConquestProgressEvent {
  /** 事件类型 */
  type: 'progress_increase' | 'progress_decrease' | 'progress_decay' | 'conquest_complete';
  /** 领土ID */
  territoryId: string;
  /** 领土名称 */
  territoryName: string;
  /** 攻击方ID */
  attackerId: string;
  /** 攻击方名称 */
  attackerName: string;
  /** 防守方ID */
  defenderId: string | null;
  /** 防守方名称 */
  defenderName: string | null;
  /** 变化前进度 */
  previousProgress: number;
  /** 变化后进度 */
  newProgress: number;
  /** 变化量 */
  delta: number;
  /** 时间戳 */
  timestamp: string;
  /** 叙事文本 */
  narrative: string;
}

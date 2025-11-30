/**
 * Shared Type Definitions
 *
 * 定义所有契约共享的核心类型。
 *
 * @module contracts/types
 */

// ============================================================================
// 地理数据类型
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

// ============================================================================
// 实体类型
// ============================================================================

/**
 * 国家实体
 */
export interface Country {
  // 唯一标识
  id: string; // ISO 3166-1 alpha-3 代码

  // 显示信息
  name: string; // 本地化名称
  nameEn: string; // 英文名称

  // 地理数据
  geometry: MultiPolygon; // 边界坐标
  centroid: Point; // 中心点
  bbox: BoundingBox; // 边界框
  area: number; // 面积（km²）

  // 拓扑关系
  neighbors: string[]; // 相邻国家 ID

  // 渲染优化
  simplifiedGeometry?: MultiPolygon; // 简化版本
  gridCells: number[]; // 所属网格单元
}

/**
 * 领土状态实体
 */
export interface TerritoryState {
  // 关联
  countryId: string; // Country.id 外键
  ownerId: string | null; // Commander.id 或 null

  // 游戏数据
  troops: number; // 驻军数量
  resources: number; // 资源储备
  defense: number; // 防御力 (0-100)

  // 状态追踪
  updatedAt: number; // 最后更新时间戳（ms）
  conqueredAt: number | null; // 占领时间戳
  previousOwnerId: string | null; // 前任占领者

  // 渲染状态
  transitionProgress: number | null; // 颜色过渡进度 (0-1)
  isHighlighted: boolean; // 是否高亮
}

/**
 * 指挥官颜色映射
 */
export interface CommanderColor {
  // 关联
  commanderId: string; // Commander.id 外键

  // 颜色方案
  primary: number; // 主要颜色（0xRRGGBB）
  secondary: number; // 次要颜色
  alpha: number; // 透明度 (0-1)

  // 可访问性
  pattern?: string; // 纹理图案名称
  label?: string; // 单字符标签

  // 动画
  glowColor?: number; // 发光颜色
  pulseSpeed?: number; // 脉冲速度（ms）
}

/**
 * 地图渲染状态
 */
export interface MapRenderState {
  // 视口
  cameraViewport: BoundingBox; // 摄像机可见区域
  zoom: number; // 缩放级别 (0.5-5.0)

  // LOD 系统
  lodLevel: 0 | 1 | 2; // 细节级别

  // 可见性
  visibleCountryIds: string[]; // 可见国家 ID
  gridCellsInView: number[]; // 可见网格单元

  // 交互
  hoveredCountryId: string | null; // 悬停国家
  selectedCountryId: string | null; // 选中国家

  // 性能
  lastFrameTime: number; // 上一帧渲染时间（ms）
  averageFps: number; // 平均帧率
  enableAnimation: boolean; // 是否启用动画
}

// ============================================================================
// 事件类型
// ============================================================================

/**
 * 地图加载事件
 */
export interface MapLoadedEvent {
  type: 'map:loaded';
  payload: {
    countries: Country[];
    loadTime: number; // 加载耗时（ms）
    source: 'network' | 'cache'; // 数据来源
  };
}

/**
 * 领土更新事件
 */
export interface TerritoryUpdatedEvent {
  type: 'territory:updated';
  payload: {
    countryId: string;
    oldOwnerId: string | null;
    newOwnerId: string | null;
    timestamp: number;
  };
}

/**
 * 地图交互事件
 */
export interface MapInteractionEvent {
  type: 'map:hover' | 'map:click' | 'map:select';
  payload: {
    countryId: string | null;
    position: Point; // 屏幕坐标
    geoPosition: Point; // 地理坐标
  };
}

/**
 * 渲染性能事件
 */
export interface RenderPerformanceEvent {
  type: 'render:performance';
  payload: {
    fps: number;
    renderTime: number;
    countriesRendered: number;
    memoryUsage: number;
  };
}

/**
 * 所有地图相关事件的联合类型
 */
export type MapEvent =
  | MapLoadedEvent
  | TerritoryUpdatedEvent
  | MapInteractionEvent
  | RenderPerformanceEvent;

// ============================================================================
// 辅助类型
// ============================================================================

/**
 * 空间网格索引
 */
export interface SpatialGrid {
  cols: number; // 列数
  rows: number; // 行数
  cellWidth: number; // 单元格宽度
  cellHeight: number; // 单元格高度
  cells: Map<number, Set<string>>; // cellId -> countryIds
}

/**
 * 颜色插值状态
 */
export interface ColorLerpState {
  countryId: string;
  fromColor: number; // 起始颜色
  toColor: number; // 目标颜色
  startTime: number; // 开始时间戳
  duration: number; // 持续时间（ms）
  easing: 'linear' | 'easeInOut'; // 缓动函数
}

/**
 * LOD 级别定义
 */
export enum LODLevel {
  FULL = 0, // 完整 193 国家（zoom > 2x）
  SIMPLIFIED = 1, // 简化 193 国家（0.5x < zoom ≤ 2x）
  REGIONS = 2, // 50 区域（zoom ≤ 0.5x）
}

/**
 * 性能分级
 */
export enum PerformanceTier {
  HIGH = 'high', // FPS > 55
  MEDIUM = 'medium', // FPS 45-55
  LOW = 'low', // FPS < 45
}

// ============================================================================
// 类型守卫（Type Guards）
// ============================================================================

/**
 * 检查是否为有效的 Country
 */
export function isValidCountry(obj: any): obj is Country {
  return (
    typeof obj === 'object' &&
    typeof obj.id === 'string' &&
    typeof obj.name === 'string' &&
    obj.geometry &&
    obj.geometry.type === 'MultiPolygon' &&
    Array.isArray(obj.geometry.coordinates)
  );
}

/**
 * 检查是否为有效的 TerritoryState
 */
export function isValidTerritoryState(obj: any): obj is TerritoryState {
  return (
    typeof obj === 'object' &&
    typeof obj.countryId === 'string' &&
    (obj.ownerId === null || typeof obj.ownerId === 'string') &&
    typeof obj.troops === 'number' &&
    typeof obj.resources === 'number' &&
    typeof obj.defense === 'number'
  );
}

/**
 * 检查是否为有效的 BoundingBox
 */
export function isValidBoundingBox(obj: any): obj is BoundingBox {
  return (
    typeof obj === 'object' &&
    typeof obj.minX === 'number' &&
    typeof obj.minY === 'number' &&
    typeof obj.maxX === 'number' &&
    typeof obj.maxY === 'number' &&
    obj.minX < obj.maxX &&
    obj.minY < obj.maxY
  );
}

// ============================================================================
// 常量
// ============================================================================

/**
 * 地图配置常量
 */
export const MAP_CONSTANTS = {
  /**
   * 网格配置
   */
  GRID: {
    COLS: 16,
    ROWS: 8,
    TOTAL_CELLS: 128,
  },

  /**
   * 缩放范围
   */
  ZOOM: {
    MIN: 0.5,
    MAX: 5.0,
    DEFAULT: 1.0,
  },

  /**
   * LOD 切换阈值
   */
  LOD_THRESHOLDS: {
    FULL: 2.0, // zoom > 2.0 使用完整地图
    SIMPLIFIED: 0.5, // zoom > 0.5 使用简化地图
  },

  /**
   * 性能阈值
   */
  PERFORMANCE: {
    TARGET_FPS: 60,
    MIN_FPS: 30,
    HIGH_TIER_THRESHOLD: 55,
    MEDIUM_TIER_THRESHOLD: 45,
  },

  /**
   * 渲染配置
   */
  RENDER: {
    DEFAULT_BORDER_WIDTH: 1,
    DEFAULT_BORDER_COLOR: 0x333333,
    DEFAULT_FILL_ALPHA: 0.7,
    HIGHLIGHT_BORDER_WIDTH: 3,
    HIGHLIGHT_GLOW_COLOR: 0xffffff,
  },

  /**
   * 动画配置
   */
  ANIMATION: {
    TRANSITION_DURATION: 500, // ms
    FADE_DURATION: 300, // ms
    PULSE_SPEED: 1000, // ms
  },
} as const;

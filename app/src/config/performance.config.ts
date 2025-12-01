/**
 * Performance Configuration
 *
 * 性能配置，支持运行时调整。
 * 用于控制日志输出、动画效果、渲染频率等性能相关设置。
 */

export interface PerformanceConfig {
  /** 是否启用详细日志（仅开发环境） */
  enableDetailedLogs: boolean;
  /** 是否启用动画效果 */
  enableAnimations: boolean;
  /** 渲染节流间隔(ms) */
  renderThrottleMs: number;
  /** 低FPS阈值，低于此值触发降级 */
  lowFpsThreshold: number;
  /** 是否自动降级 */
  autoDegrade: boolean;
  /** 事件日志容量 */
  eventLogCapacity: number;
  /** 地图重绘间隔（tick数） */
  mapRedrawInterval: number;
  /** 是否启用增量渲染 */
  enableIncrementalRender: boolean;
}

/**
 * 检测是否为生产环境
 */
const isProduction = (): boolean => {
  if (typeof process !== 'undefined' && process.env?.NODE_ENV) {
    return process.env.NODE_ENV === 'production';
  }
  // Vite 环境
  if (typeof import.meta !== 'undefined' && import.meta.env?.MODE) {
    return import.meta.env.MODE === 'production';
  }
  return false;
};

/**
 * 默认性能配置
 */
export const DEFAULT_PERFORMANCE_CONFIG: PerformanceConfig = {
  enableDetailedLogs: !isProduction(),
  enableAnimations: true,
  renderThrottleMs: 16, // ~60fps
  lowFpsThreshold: 30,
  autoDegrade: true,
  eventLogCapacity: 200,
  mapRedrawInterval: 30, // 每30 tick重绘
  enableIncrementalRender: true,
};

/**
 * 低性能模式配置
 * 当FPS低于阈值时自动切换
 */
export const LOW_PERFORMANCE_CONFIG: Partial<PerformanceConfig> = {
  enableDetailedLogs: false,
  enableAnimations: false,
  renderThrottleMs: 33, // ~30fps
  mapRedrawInterval: 60, // 每60 tick重绘
  enableIncrementalRender: true,
};

/**
 * 合并性能配置
 */
export function mergePerformanceConfig(
  base: PerformanceConfig,
  overrides: Partial<PerformanceConfig>
): PerformanceConfig {
  return { ...base, ...overrides };
}

/**
 * 根据当前FPS获取推荐配置
 */
export function getRecommendedConfig(
  currentFps: number,
  currentConfig: PerformanceConfig
): PerformanceConfig {
  if (!currentConfig.autoDegrade) {
    return currentConfig;
  }

  if (currentFps < currentConfig.lowFpsThreshold) {
    return mergePerformanceConfig(currentConfig, LOW_PERFORMANCE_CONFIG);
  }

  return currentConfig;
}

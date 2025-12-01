/**
 * Debug Configuration
 * 
 * 集中控制日志输出，避免控制台过于卡顿
 */

export const DEBUG_CONFIG = {
  // 核心系统日志
  GAME_SESSION: false,        // startSession, pauseSession 等
  WORLD_GENERATION: false,    // createInitialWorld
  
  // 地图系统日志
  MAP_LOADING: true,          // 地图加载（保留关键信息）
  MAP_RENDERING: false,       // 地图渲染（过于频繁，默认关闭）
  MAP_RENDERER_INIT: true,    // 渲染器初始化
  
  // 领土系统日志
  TERRITORY_UPDATE: false,    // 领土更新（每次战斗都会触发）
  TERRITORY_OWNERSHIP: false, // 所有权变更
  
  // 战斗系统日志
  BATTLE_EVENTS: false,       // 战斗事件
  BATTLE_RESOLUTION: false,   // 战斗解算
  
  // 性能监控
  PERFORMANCE: false,         // FPS、渲染时间等
  
  // 缓存系统
  CACHE: false,               // IndexedDB 缓存操作
  
  // 错误日志（始终启用）
  ERRORS: true,
  WARNINGS: true,
};

/**
 * 条件日志输出
 */
export const logger = {
  log: (category: keyof typeof DEBUG_CONFIG, ...args: any[]) => {
    if (DEBUG_CONFIG[category]) {
      console.log(...args);
    }
  },
  
  warn: (category: keyof typeof DEBUG_CONFIG, ...args: any[]) => {
    if (DEBUG_CONFIG[category]) {
      console.warn(...args);
    }
  },
  
  error: (...args: any[]) => {
    if (DEBUG_CONFIG.ERRORS) {
      console.error(...args);
    }
  },
  
  group: (category: keyof typeof DEBUG_CONFIG, label: string, fn: () => void) => {
    if (DEBUG_CONFIG[category]) {
      console.group(label);
      fn();
      console.groupEnd();
    }
  },
};

/**
 * 开发模式快捷方式
 * 在浏览器控制台使用：window.enableDebug('MAP_RENDERING')
 */
if (typeof window !== 'undefined') {
  (window as any).enableDebug = (category: keyof typeof DEBUG_CONFIG) => {
    DEBUG_CONFIG[category] = true;
    console.log(`✅ Enabled debug logging for: ${category}`);
  };
  
  (window as any).disableDebug = (category: keyof typeof DEBUG_CONFIG) => {
    DEBUG_CONFIG[category] = false;
    console.log(`❌ Disabled debug logging for: ${category}`);
  };
  
  (window as any).showDebugConfig = () => {
    console.table(DEBUG_CONFIG);
  };
}

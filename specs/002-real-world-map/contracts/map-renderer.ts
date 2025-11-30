/**
 * Map Renderer Contract
 *
 * 定义地图渲染接口，包括国家多边形绘制、颜色填充、交互处理。
 *
 * @module contracts/map-renderer
 */

import type { Country, TerritoryState, MapRenderState, CommanderColor } from './types';

/**
 * 地图渲染器接口
 */
export interface IMapRenderer {
  /**
   * 初始化渲染器
   *
   * @param scene - Phaser Scene 实例
   * @param config - 渲染配置
   */
  initialize(scene: Phaser.Scene, config: RenderConfig): void;

  /**
   * 渲染国家边界和填充
   *
   * @param countries - 要渲染的国家列表
   * @param territoryStates - 领土状态映射
   * @param colorMappings - 颜色映射
   * @returns 渲染统计信息
   */
  render(
    countries: Country[],
    territoryStates: Map<string, TerritoryState>,
    colorMappings: Map<string, CommanderColor>
  ): RenderStats;

  /**
   * 更新单个国家的渲染
   *
   * @param countryId - 国家 ID
   * @param state - 新的领土状态
   * @param colorMapping - 颜色映射
   */
  updateCountry(countryId: string, state: TerritoryState, colorMapping: CommanderColor): void;

  /**
   * 高亮国家（悬停或选中）
   *
   * @param countryId - 国家 ID，null 表示取消高亮
   * @param type - 高亮类型
   */
  highlightCountry(countryId: string | null, type: 'hover' | 'select'): void;

  /**
   * 清除所有渲染内容
   */
  clear(): void;

  /**
   * 销毁渲染器（释放资源）
   */
  destroy(): void;

  /**
   * 获取渲染统计信息
   */
  getStats(): RenderStats;
}

/**
 * 渲染配置
 */
export interface RenderConfig {
  /**
   * 是否使用 WebGL（默认 true）
   */
  useWebGL?: boolean;

  /**
   * 国家边界线宽度（默认 1）
   */
  borderWidth?: number;

  /**
   * 边界线颜色（默认 0x333333）
   */
  borderColor?: number;

  /**
   * 填充透明度（默认 0.7）
   */
  fillAlpha?: number;

  /**
   * 是否启用抗锯齿（默认 true）
   */
  antiAlias?: boolean;

  /**
   * 是否启用颜色过渡动画（默认 true）
   */
  enableTransition?: boolean;

  /**
   * 颜色过渡时长（ms）（默认 500）
   */
  transitionDuration?: number;

  /**
   * 高亮边界宽度（默认 3）
   */
  highlightBorderWidth?: number;

  /**
   * 高亮发光颜色（默认 0xFFFFFF）
   */
  highlightGlowColor?: number;

  /**
   * 是否启用对象池（默认 true）
   */
  useObjectPool?: boolean;

  /**
   * 对象池大小（默认 200）
   */
  poolSize?: number;
}

/**
 * 渲染统计信息
 */
export interface RenderStats {
  /**
   * 渲染的国家数量
   */
  countriesRendered: number;

  /**
   * 渲染时间（ms）
   */
  renderTime: number;

  /**
   * 当前帧率（FPS）
   */
  fps: number;

  /**
   * 绘制调用次数
   */
  drawCalls: number;

  /**
   * 顶点数量
   */
  vertices: number;

  /**
   * 内存占用（MB）
   */
  memoryUsage: number;
}

/**
 * 颜色过渡管理器接口
 */
export interface IColorTransitionManager {
  /**
   * 开始颜色过渡
   *
   * @param countryId - 国家 ID
   * @param fromColor - 起始颜色
   * @param toColor - 目标颜色
   * @param duration - 持续时间（ms）
   * @param onComplete - 完成回调
   */
  startTransition(
    countryId: string,
    fromColor: number,
    toColor: number,
    duration: number,
    onComplete?: () => void
  ): void;

  /**
   * 停止颜色过渡
   */
  stopTransition(countryId: string): void;

  /**
   * 更新所有进行中的过渡（每帧调用）
   */
  update(delta: number): void;

  /**
   * 获取当前颜色
   */
  getCurrentColor(countryId: string): number | null;

  /**
   * 清除所有过渡
   */
  clear(): void;
}

/**
 * 图形对象池接口
 */
export interface IGraphicsPool {
  /**
   * 从池中获取 Graphics 对象
   */
  acquire(): Phaser.GameObjects.Graphics;

  /**
   * 归还 Graphics 对象到池
   */
  release(graphics: Phaser.GameObjects.Graphics): void;

  /**
   * 获取池状态
   */
  getStatus(): {
    total: number;
    available: number;
    inUse: number;
  };

  /**
   * 清空池（销毁所有对象）
   */
  clear(): void;
}

/**
 * 性能监控器接口
 */
export interface IPerformanceMonitor {
  /**
   * 开始性能测量
   */
  startMeasure(label: string): void;

  /**
   * 结束性能测量
   */
  endMeasure(label: string): number;

  /**
   * 获取平均测量值
   */
  getAverageMeasure(label: string, windowSize?: number): number;

  /**
   * 更新 FPS 统计
   */
  updateFps(delta: number): void;

  /**
   * 获取当前 FPS
   */
  getCurrentFps(): number;

  /**
   * 获取平均 FPS（滑动窗口）
   */
  getAverageFps(): number;

  /**
   * 重置所有统计
   */
  reset(): void;
}

/**
 * 合约验证
 */
export async function validateMapRenderer(
  renderer: IMapRenderer,
  scene: Phaser.Scene
): Promise<void> {
  // 1. 测试初始化
  renderer.initialize(scene, {});

  // 2. 测试渲染
  const mockCountries: Country[] = [
    {
      id: 'TEST',
      name: '测试国家',
      nameEn: 'Test Country',
      geometry: {
        type: 'MultiPolygon',
        coordinates: [
          [
            [
              [0, 0],
              [10, 0],
              [10, 10],
              [0, 10],
              [0, 0],
            ],
          ],
        ],
      },
      centroid: { x: 5, y: 5 },
      bbox: { minX: 0, minY: 0, maxX: 10, maxY: 10 },
      area: 100,
      neighbors: [],
      gridCells: [0],
    },
  ];

  const mockStates = new Map<string, TerritoryState>([
    [
      'TEST',
      {
        countryId: 'TEST',
        ownerId: 'test-commander',
        troops: 1000,
        resources: 500,
        defense: 50,
        updatedAt: Date.now(),
        conqueredAt: Date.now(),
        previousOwnerId: null,
        transitionProgress: null,
        isHighlighted: false,
      },
    ],
  ]);

  const mockColors = new Map<string, CommanderColor>([
    [
      'test-commander',
      {
        commanderId: 'test-commander',
        primary: 0xff0000,
        secondary: 0x990000,
        alpha: 0.7,
      },
    ],
  ]);

  const stats = renderer.render(mockCountries, mockStates, mockColors);

  // 3. 验证统计信息
  if (stats.countriesRendered !== 1) {
    throw new Error('Contract violation: should render 1 country');
  }

  if (stats.renderTime < 0) {
    throw new Error('Contract violation: renderTime must be >= 0');
  }

  // 4. 测试高亮
  renderer.highlightCountry('TEST', 'hover');
  renderer.highlightCountry(null, 'hover');

  // 5. 测试清理
  renderer.clear();
  renderer.destroy();

  console.log('✅ IMapRenderer contract validated');
}

/**
 * 渲染优化建议
 */
export const RENDER_OPTIMIZATION_TIPS = {
  /**
   * 使用对象池避免频繁创建/销毁 Graphics
   */
  USE_OBJECT_POOL: 'Enable useObjectPool option',

  /**
   * 仅渲染可见区域内的国家
   */
  VIEWPORT_CULLING: 'Use spatial indexing to filter visible countries',

  /**
   * 批量更新减少渲染次数
   */
  BATCH_UPDATES: 'Collect multiple state changes and render once per frame',

  /**
   * 在低性能设备上禁用动画
   */
  DISABLE_ANIMATIONS: 'Set enableTransition=false when FPS < 30',

  /**
   * 使用简化几何减少顶点数
   */
  USE_SIMPLIFIED_GEOMETRY: 'Switch to LOD Level 1/2 when zoomed out',
};

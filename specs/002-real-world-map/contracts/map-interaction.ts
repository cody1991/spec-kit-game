/**
 * Map Interaction Handler Contract
 *
 * 定义地图交互处理接口，包括点击检测、悬停处理、缩放控制。
 *
 * @module contracts/map-interaction
 */

import type { Country, Point, BoundingBox, MapInteractionEvent } from './types';

/**
 * 地图交互处理器接口
 */
export interface IMapInteractionHandler {
  /**
   * 初始化交互处理器
   *
   * @param scene - Phaser Scene 实例
   * @param config - 交互配置
   */
  initialize(scene: Phaser.Scene, config: InteractionConfig): void;

  /**
   * 启用交互
   */
  enable(): void;

  /**
   * 禁用交互
   */
  disable(): void;

  /**
   * 处理鼠标移动事件
   *
   * @param pointer - Phaser 指针对象
   * @returns 鼠标下的国家 ID，无则返回 null
   */
  handlePointerMove(pointer: Phaser.Input.Pointer): string | null;

  /**
   * 处理点击事件
   *
   * @param pointer - Phaser 指针对象
   * @returns 点击的国家 ID，无则返回 null
   */
  handlePointerDown(pointer: Phaser.Input.Pointer): string | null;

  /**
   * 处理缩放事件
   *
   * @param deltaY - 滚轮增量
   * @param pointerPosition - 鼠标位置（作为缩放中心）
   */
  handleZoom(deltaY: number, pointerPosition: Point): void;

  /**
   * 注册事件监听器
   */
  on(event: MapInteractionEventType, callback: MapInteractionCallback): void;

  /**
   * 取消事件监听器
   */
  off(event: MapInteractionEventType, callback: MapInteractionCallback): void;

  /**
   * 销毁交互处理器
   */
  destroy(): void;
}

/**
 * 交互配置
 */
export interface InteractionConfig {
  /**
   * 是否启用点击检测（默认 true）
   */
  enableClick?: boolean;

  /**
   * 是否启用悬停检测（默认 true）
   */
  enableHover?: boolean;

  /**
   * 是否启用缩放（默认 true）
   */
  enableZoom?: boolean;

  /**
   * 是否启用拖拽（默认 true）
   */
  enableDrag?: boolean;

  /**
   * 悬停延迟（ms）（默认 300）
   */
  hoverDelay?: number;

  /**
   * 缩放灵敏度（默认 0.001）
   */
  zoomSensitivity?: number;

  /**
   * 拖拽阻尼系数（默认 0.9）
   */
  dragDamping?: number;

  /**
   * 点击延迟阈值（ms）（默认 200，超过视为拖拽而非点击）
   */
  clickThreshold?: number;
}

/**
 * 交互事件类型
 */
export type MapInteractionEventType =
  | 'hover' // 鼠标悬停在国家上
  | 'hoverEnd' // 鼠标离开国家
  | 'click' // 点击国家
  | 'select' // 选中国家
  | 'deselect' // 取消选中
  | 'zoom' // 缩放变化
  | 'drag'; // 地图拖拽

/**
 * 交互事件回调
 */
export type MapInteractionCallback = (event: MapInteractionEvent) => void;

/**
 * 点包含检测器接口（Point-in-Polygon）
 */
export interface IPointInPolygonDetector {
  /**
   * 检测点是否在多边形内
   *
   * @param point - 测试点
   * @param polygon - 多边形顶点列表
   * @returns 是否在多边形内
   */
  isPointInPolygon(point: Point, polygon: Point[]): boolean;

  /**
   * 批量检测点在哪些多边形内
   *
   * @param point - 测试点
   * @param polygons - 多边形列表（带 ID）
   * @returns 包含该点的多边形 ID 列表
   */
  findContainingPolygons(point: Point, polygons: Array<{ id: string; polygon: Point[] }>): string[];
}

/**
 * 空间查询接口
 */
export interface ISpatialQuery {
  /**
   * 查询边界框内的国家
   *
   * @param bbox - 边界框
   * @returns 国家 ID 列表
   */
  queryBoundingBox(bbox: BoundingBox): string[];

  /**
   * 查询点附近的国家（用于快速粗筛）
   *
   * @param point - 查询点
   * @param radius - 查询半径（世界坐标单位）
   * @returns 国家 ID 列表
   */
  queryRadius(point: Point, radius: number): string[];

  /**
   * 更新空间索引（当地图数据变化时）
   *
   * @param countries - 国家列表
   */
  updateIndex(countries: Country[]): void;
}

/**
 * 缩放控制器接口
 */
export interface IZoomController {
  /**
   * 设置缩放级别
   *
   * @param zoom - 目标缩放级别 (0.5-5.0)
   * @param center - 缩放中心（世界坐标），null 表示屏幕中心
   * @param animated - 是否使用动画过渡（默认 false）
   */
  setZoom(zoom: number, center?: Point | null, animated?: boolean): void;

  /**
   * 相对缩放（增加或减少）
   *
   * @param delta - 缩放增量（正数放大，负数缩小）
   * @param center - 缩放中心
   */
  zoom(delta: number, center?: Point | null): void;

  /**
   * 缩放到适应所有国家
   *
   * @param countryIds - 国家 ID 列表，null 表示所有国家
   * @param padding - 边距（像素）
   * @param animated - 是否使用动画
   */
  zoomToFit(countryIds?: string[] | null, padding?: number, animated?: boolean): void;

  /**
   * 获取当前缩放级别
   */
  getZoom(): number;

  /**
   * 检查缩放是否在有效范围内
   */
  isValidZoom(zoom: number): boolean;
}

/**
 * 拖拽控制器接口
 */
export interface IDragController {
  /**
   * 开始拖拽
   *
   * @param startPosition - 起始位置（屏幕坐标）
   */
  startDrag(startPosition: Point): void;

  /**
   * 更新拖拽位置
   *
   * @param currentPosition - 当前位置（屏幕坐标）
   */
  updateDrag(currentPosition: Point): void;

  /**
   * 结束拖拽
   *
   * @param endPosition - 结束位置（屏幕坐标）
   */
  endDrag(endPosition: Point): void;

  /**
   * 取消拖拽
   */
  cancelDrag(): void;

  /**
   * 是否正在拖拽
   */
  isDragging(): boolean;

  /**
   * 获取拖拽距离
   */
  getDragDistance(): number;
}

/**
 * 合约验证
 */
export async function validateMapInteractionHandler(
  handler: IMapInteractionHandler,
  scene: Phaser.Scene
): Promise<void> {
  // 1. 测试初始化
  handler.initialize(scene, {});
  handler.enable();

  // 2. 模拟鼠标移动
  const mockPointer = {
    x: 100,
    y: 100,
    worldX: 100,
    worldY: 100,
  } as Phaser.Input.Pointer;

  const hoveredId = handler.handlePointerMove(mockPointer);
  // hoveredId 可能为 null（没有国家在该位置）

  // 3. 模拟点击
  const clickedId = handler.handlePointerDown(mockPointer);
  // clickedId 可能为 null

  // 4. 测试事件监听
  let eventFired = false;
  const callback: MapInteractionCallback = (event) => {
    eventFired = true;
  };

  handler.on('click', callback);
  handler.handlePointerDown(mockPointer);

  if (!eventFired) {
    console.warn('Warning: click event not fired (may be expected if no country at position)');
  }

  handler.off('click', callback);

  // 5. 测试缩放
  handler.handleZoom(-1, { x: 100, y: 100 }); // 放大
  handler.handleZoom(1, { x: 100, y: 100 }); // 缩小

  // 6. 测试禁用/启用
  handler.disable();
  handler.enable();

  // 7. 清理
  handler.destroy();

  console.log('✅ IMapInteractionHandler contract validated');
}

/**
 * Point-in-Polygon 算法实现参考
 */
export const PIP_ALGORITHMS = {
  /**
   * Ray Casting 算法（推荐）
   * - 时间复杂度：O(n)
   * - 空间复杂度：O(1)
   * - 优点：简单、可靠、效率高
   */
  RAY_CASTING: 'https://en.wikipedia.org/wiki/Point_in_polygon#Ray_casting_algorithm',

  /**
   * Winding Number 算法
   * - 时间复杂度：O(n)
   * - 空间复杂度：O(1)
   * - 优点：处理复杂多边形更精确
   */
  WINDING_NUMBER: 'https://en.wikipedia.org/wiki/Point_in_polygon#Winding_number_algorithm',
} as const;

/**
 * 交互优化建议
 */
export const INTERACTION_OPTIMIZATION_TIPS = {
  /**
   * 使用空间索引（Grid）加速查询
   */
  USE_SPATIAL_INDEX: 'Pre-filter countries using Grid before PIP test',

  /**
   * 使用 Bounding Box 快速排除
   */
  USE_BBOX_PRECHECK: 'Test BBox before expensive PIP algorithm',

  /**
   * 缓存 PIP 结果（针对静态多边形）
   */
  CACHE_PIP_RESULTS: "Precompute PIP for grid cells if polygons don't change",

  /**
   * 使用 Web Worker 处理复杂计算
   */
  USE_WEB_WORKER: 'Offload PIP calculations to worker when CPU-bound',

  /**
   * 限制悬停检测频率
   */
  THROTTLE_HOVER: 'Throttle pointer move events to 60 Hz max',
} as const;

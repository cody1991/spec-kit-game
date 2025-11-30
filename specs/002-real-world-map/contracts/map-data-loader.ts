/**
 * Map Data Loader Contract
 *
 * 定义地图数据加载接口，包括 TopoJSON/GeoJSON 解析、坐标转换、空间索引构建。
 *
 * @module contracts/map-data-loader
 */

import type { Country, BoundingBox, Point, MultiPolygon } from './types';

/**
 * 地图数据加载器接口
 */
export interface IMapDataLoader {
  /**
   * 加载地图数据（主入口）
   *
   * @param dataUrl - TopoJSON/GeoJSON 文件 URL
   * @param options - 加载选项
   * @returns Promise<加载的国家列表>
   * @throws {MapDataLoadError} 数据加载或解析失败
   *
   * @example
   * const loader = new MapDataLoader();
   * const countries = await loader.loadMapData('/maps/world-countries.json');
   */
  loadMapData(dataUrl: string, options?: LoadOptions): Promise<Country[]>;

  /**
   * 解析 TopoJSON 数据
   *
   * @param topoData - TopoJSON 对象
   * @param objectName - TopoJSON 中的对象名称（如 "countries"）
   * @returns GeoJSON FeatureCollection
   */
  parseTopoJSON(topoData: any, objectName: string): GeoJSON.FeatureCollection;

  /**
   * 转换 GeoJSON Feature 为 Country 实体
   *
   * @param feature - GeoJSON Feature
   * @param options - 转换选项
   * @returns Country 对象
   */
  featureToCountry(feature: GeoJSON.Feature, options?: ConversionOptions): Country;

  /**
   * 批量处理国家列表（计算邻接关系、网格分配）
   *
   * @param countries - Country 列表
   * @returns 处理后的 Country 列表（包含 neighbors 和 gridCells）
   */
  postProcessCountries(countries: Country[]): Country[];
}

/**
 * 加载选项
 */
export interface LoadOptions {
  /**
   * 是否使用 Web Worker 后台加载（默认 true）
   */
  useWorker?: boolean;

  /**
   * 是否启用缓存（IndexedDB）（默认 true）
   */
  enableCache?: boolean;

  /**
   * 缓存有效期（天）（默认 7）
   */
  cacheDuration?: number;

  /**
   * 是否加载简化版本（LOD Level 1）（默认 false）
   */
  simplified?: boolean;

  /**
   * 超时时间（ms）（默认 10000）
   */
  timeout?: number;
}

/**
 * 转换选项
 */
export interface ConversionOptions {
  /**
   * 是否计算 centroid（默认 true）
   */
  calculateCentroid?: boolean;

  /**
   * 是否计算 bbox（默认 true）
   */
  calculateBbox?: boolean;

  /**
   * 是否生成简化几何（默认 false）
   */
  generateSimplified?: boolean;

  /**
   * 简化容差（默认 0.01）
   */
  simplificationTolerance?: number;
}

/**
 * 地图数据加载错误
 */
export class MapDataLoadError extends Error {
  code: 'FETCH_FAILED' | 'PARSE_ERROR' | 'INVALID_FORMAT' | 'TIMEOUT';
  originalError?: Error;

  constructor(message: string, code: MapDataLoadError['code'], originalError?: Error) {
    super(message);
    this.name = 'MapDataLoadError';
    this.code = code;
    this.originalError = originalError;
  }
}

/**
 * 加载进度回调
 */
export type LoadProgressCallback = (progress: LoadProgress) => void;

export interface LoadProgress {
  stage: 'fetching' | 'parsing' | 'processing' | 'caching';
  progress: number; // 0-100
  message?: string;
}

/**
 * 缓存接口
 */
export interface IMapDataCache {
  /**
   * 检查缓存是否存在且有效
   */
  has(key: string): Promise<boolean>;

  /**
   * 从缓存读取数据
   */
  get(key: string): Promise<Country[] | null>;

  /**
   * 写入缓存
   */
  set(key: string, data: Country[], expiresAt: number): Promise<void>;

  /**
   * 清除缓存
   */
  clear(): Promise<void>;
}

/**
 * 坐标转换接口
 */
export interface ICoordinateTransformer {
  /**
   * 地理坐标（经纬度）→ 屏幕坐标
   */
  geoToScreen(lon: number, lat: number): Point;

  /**
   * 屏幕坐标 → 地理坐标
   */
  screenToGeo(x: number, y: number): Point;

  /**
   * 批量转换多边形坐标
   */
  transformPolygon(coords: number[][][][]): number[][][][];
}

/**
 * 合约验证
 *
 * 使用示例：
 * const loader = new MapDataLoader();
 * await validateMapDataLoader(loader);
 */
export async function validateMapDataLoader(loader: IMapDataLoader): Promise<void> {
  // 1. 测试加载有效数据
  const countries = await loader.loadMapData('/test/sample-map.json');
  if (countries.length === 0) {
    throw new Error('Contract violation: loadMapData returned empty array');
  }

  // 2. 验证 Country 结构
  const country = countries[0];
  if (!country.id || !country.name || !country.geometry) {
    throw new Error('Contract violation: Country missing required fields');
  }

  // 3. 测试错误处理
  try {
    await loader.loadMapData('/nonexistent.json');
    throw new Error('Contract violation: should throw MapDataLoadError for invalid URL');
  } catch (error) {
    if (!(error instanceof MapDataLoadError)) {
      throw new Error('Contract violation: must throw MapDataLoadError');
    }
  }

  console.log('✅ IMapDataLoader contract validated');
}

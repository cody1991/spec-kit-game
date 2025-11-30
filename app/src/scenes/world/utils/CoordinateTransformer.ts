/**
 * Coordinate Transformer
 *
 * Transforms geographic coordinates (lon/lat) to screen coordinates and vice versa.
 * Uses Mercator projection via d3-geo.
 */

import { geoMercator, geoPath, type GeoProjection, type GeoPath } from 'd3-geo';
import type { Point, MultiPolygon } from '../types/mapTypes';

export class CoordinateTransformer {
  private projection: GeoProjection;
  private path: GeoPath;
  private worldWidth: number;
  private worldHeight: number;

  constructor(worldWidth = 1920, worldHeight = 1080) {
    this.worldWidth = worldWidth;
    this.worldHeight = worldHeight;

    // Create Mercator projection with proper scale for world map
    // Scale calculation: width / (2 * PI) gives proper world coverage
    // Increase scale to fill the screen better
    const scale = (worldWidth / (2 * Math.PI)) * 2.2; // 增加到 2.2 倍使地图填充屏幕

    this.projection = geoMercator()
      .scale(scale)
      .translate([worldWidth / 2, worldHeight / 2])
      .center([0, 0]); // 使用 [0, 0] 作为中心，标准墨卡托投影

    // Create path generator
    this.path = geoPath().projection(this.projection);

    console.log('🗺️  Projection configured:', {
      scale,
      translate: [worldWidth / 2, worldHeight / 2],
      center: [0, 0],
    });
  }

  /**
   * Convert geographic coordinates (lon, lat) to screen coordinates (x, y)
   */
  geoToScreen(lon: number, lat: number): Point {
    const coords = this.projection([lon, lat]);
    return {
      x: coords ? coords[0] : 0,
      y: coords ? coords[1] : 0,
    };
  }

  /**
   * Convert screen coordinates (x, y) to geographic coordinates (lon, lat)
   */
  screenToGeo(x: number, y: number): Point {
    const coords = this.projection.invert?.([x, y]);
    return {
      x: coords ? coords[0] : 0,
      y: coords ? coords[1] : 0,
    };
  }

  /**
   * Transform a MultiPolygon to screen coordinates
   */
  transformPolygon(geometry: MultiPolygon): number[][][][] {
    const transformed: number[][][][] = [];

    geometry.coordinates.forEach((polygon) => {
      const transformedPolygon: number[][][] = [];

      polygon.forEach((ring) => {
        const transformedRing: number[][] = ring.map(([lon, lat]) => {
          const point = this.geoToScreen(lon, lat);
          return [point.x, point.y];
        });

        transformedPolygon.push(transformedRing);
      });

      transformed.push(transformedPolygon);
    });

    return transformed;
  }

  /**
   * Get the path string for a GeoJSON geometry (for SVG/Canvas rendering)
   */
  getPathString(geometry: GeoJSON.Geometry): string | null {
    return this.path(geometry);
  }

  /**
   * Update projection scale (for zoom)
   */
  setScale(scale: number): void {
    this.projection.scale(scale);
  }

  /**
   * Update projection center (for pan)
   */
  setCenter(lon: number, lat: number): void {
    this.projection.center([lon, lat]);
  }

  /**
   * Update projection translate (for pan)
   */
  setTranslate(x: number, y: number): void {
    this.projection.translate([x, y]);
  }

  /**
   * Get current projection
   */
  getProjection(): GeoProjection {
    return this.projection;
  }

  /**
   * Reset projection to default
   */
  reset(): void {
    this.projection
      .scale(this.worldWidth / (2 * Math.PI))
      .translate([this.worldWidth / 2, this.worldHeight / 2])
      .center([0, 0]);
  }

  /**
   * Update world dimensions
   */
  setDimensions(width: number, height: number): void {
    this.worldWidth = width;
    this.worldHeight = height;
    this.reset();
  }
}

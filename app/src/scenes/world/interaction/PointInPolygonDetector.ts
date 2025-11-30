/**
 * Point-in-Polygon Detector
 * 
 * Uses Ray Casting algorithm to determine if a point is inside a polygon.
 * Optimized for real-time interaction detection.
 * 
 * @module interaction/PointInPolygonDetector
 */

import type { Point, MultiPolygon } from '../types/mapTypes';

/**
 * Point-in-Polygon detector interface
 */
export interface IPointInPolygonDetector {
  /**
   * Test if a point is inside a polygon
   * 
   * @param point - Point to test (screen coordinates)
   * @param polygon - Ring of points [[x,y], [x,y], ...]
   * @returns True if point is inside polygon
   */
  isPointInPolygon(point: Point, polygon: number[][]): boolean;

  /**
   * Test if a point is inside a multi-polygon geometry
   * 
   * @param point - Point to test (screen coordinates)
   * @param multiPolygon - MultiPolygon geometry
   * @returns True if point is inside any polygon
   */
  isPointInMultiPolygon(point: Point, multiPolygon: MultiPolygon): boolean;

  /**
   * Test if a point is near a polygon border
   * 
   * @param point - Point to test
   * @param polygon - Ring of points
   * @param threshold - Distance threshold in pixels
   * @returns True if point is near border
   */
  isPointNearBorder(point: Point, polygon: number[][], threshold?: number): boolean;
}

/**
 * Point-in-Polygon detector implementation using Ray Casting
 */
export class PointInPolygonDetector implements IPointInPolygonDetector {
  private defaultThreshold: number = 5; // pixels

  /**
   * Ray Casting algorithm for point-in-polygon test
   * 
   * Casts a ray from the point to infinity and counts intersections
   * with polygon edges. Odd count = inside, even count = outside.
   * 
   * @param point - Point to test
   * @param polygon - Polygon ring [[x,y], [x,y], ...]
   * @returns True if point is inside
   */
  isPointInPolygon(point: Point, polygon: number[][]): boolean {
    let inside = false;
    const x = point.x;
    const y = point.y;

    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
      const xi = polygon[i][0];
      const yi = polygon[i][1];
      const xj = polygon[j][0];
      const yj = polygon[j][1];

      // Check if ray crosses edge
      const intersect =
        yi > y !== yj > y &&
        x < ((xj - xi) * (y - yi)) / (yj - yi) + xi;

      if (intersect) {
        inside = !inside;
      }
    }

    return inside;
  }

  /**
   * Test point against multi-polygon geometry
   * 
   * A multi-polygon consists of multiple polygons, each with outer ring
   * and optional holes. Point is inside if it's in any outer ring and
   * not in any holes.
   */
  isPointInMultiPolygon(point: Point, multiPolygon: MultiPolygon): boolean {
    for (const polygon of multiPolygon.coordinates) {
      // polygon[0] is outer ring, polygon[1+] are holes
      const outerRing = polygon[0];
      
      // Check outer ring
      if (this.isPointInPolygon(point, outerRing)) {
        // Check if point is in any holes
        let inHole = false;
        
        for (let i = 1; i < polygon.length; i++) {
          if (this.isPointInPolygon(point, polygon[i])) {
            inHole = true;
            break;
          }
        }

        if (!inHole) {
          return true; // Found in outer ring, not in any holes
        }
      }
    }

    return false;
  }

  /**
   * Check if point is near polygon border
   * 
   * Uses perpendicular distance from point to each edge.
   * Useful for hover effects on borders.
   */
  isPointNearBorder(
    point: Point,
    polygon: number[][],
    threshold: number = this.defaultThreshold
  ): boolean {
    const x = point.x;
    const y = point.y;

    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
      const x1 = polygon[j][0];
      const y1 = polygon[j][1];
      const x2 = polygon[i][0];
      const y2 = polygon[i][1];

      // Calculate perpendicular distance to line segment
      const distance = this.pointToSegmentDistance(x, y, x1, y1, x2, y2);

      if (distance <= threshold) {
        return true;
      }
    }

    return false;
  }

  /**
   * Calculate perpendicular distance from point to line segment
   * 
   * @param px Point X
   * @param py Point Y
   * @param x1 Segment start X
   * @param y1 Segment start Y
   * @param x2 Segment end X
   * @param y2 Segment end Y
   * @returns Distance in pixels
   */
  private pointToSegmentDistance(
    px: number,
    py: number,
    x1: number,
    y1: number,
    x2: number,
    y2: number
  ): number {
    const dx = x2 - x1;
    const dy = y2 - y1;
    const lengthSquared = dx * dx + dy * dy;

    // Handle degenerate case (point segment)
    if (lengthSquared === 0) {
      return Math.sqrt((px - x1) * (px - x1) + (py - y1) * (py - y1));
    }

    // Calculate projection parameter
    let t = ((px - x1) * dx + (py - y1) * dy) / lengthSquared;
    t = Math.max(0, Math.min(1, t));

    // Calculate closest point on segment
    const closestX = x1 + t * dx;
    const closestY = y1 + t * dy;

    // Return distance
    return Math.sqrt((px - closestX) * (px - closestX) + (py - closestY) * (py - closestY));
  }
}

/**
 * Factory function: Create point-in-polygon detector
 */
export function createPointInPolygonDetector(): IPointInPolygonDetector {
  return new PointInPolygonDetector();
}

/**
 * Geographic Utility Functions
 * 
 * Helper functions for geographic calculations (bounding boxes, centroids, intersections).
 */

import type { BoundingBox, Point, MultiPolygon } from '../types/mapTypes';

/**
 * Check if two bounding boxes intersect
 */
export function bboxIntersects(a: BoundingBox, b: BoundingBox): boolean {
  return !(
    a.maxX < b.minX ||
    a.minX > b.maxX ||
    a.maxY < b.minY ||
    a.minY > b.maxY
  );
}

/**
 * Calculate the bounding box for a MultiPolygon
 */
export function calculateBbox(geometry: MultiPolygon): BoundingBox {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  // Iterate through all polygons and rings
  geometry.coordinates.forEach((polygon) => {
    polygon.forEach((ring) => {
      ring.forEach(([lon, lat]) => {
        minX = Math.min(minX, lon);
        minY = Math.min(minY, lat);
        maxX = Math.max(maxX, lon);
        maxY = Math.max(maxY, lat);
      });
    });
  });

  return { minX, minY, maxX, maxY };
}

/**
 * Calculate the centroid (center point) of a MultiPolygon
 * Uses a simple averaging method for speed
 */
export function calculateCentroid(geometry: MultiPolygon): Point {
  let sumX = 0;
  let sumY = 0;
  let count = 0;

  // Average all vertices
  geometry.coordinates.forEach((polygon) => {
    polygon.forEach((ring) => {
      ring.forEach(([lon, lat]) => {
        sumX += lon;
        sumY += lat;
        count++;
      });
    });
  });

  return {
    x: count > 0 ? sumX / count : 0,
    y: count > 0 ? sumY / count : 0,
  };
}

/**
 * Calculate the area of a polygon using the Shoelace formula
 * Returns area in square degrees (approximate)
 */
export function calculatePolygonArea(ring: number[][]): number {
  let area = 0;
  const n = ring.length;

  for (let i = 0; i < n - 1; i++) {
    const [x1, y1] = ring[i];
    const [x2, y2] = ring[i + 1];
    area += x1 * y2 - x2 * y1;
  }

  return Math.abs(area / 2);
}

/**
 * Calculate the total area of a MultiPolygon
 */
export function calculateArea(geometry: MultiPolygon): number {
  let totalArea = 0;

  geometry.coordinates.forEach((polygon) => {
    polygon.forEach((ring, index) => {
      const area = calculatePolygonArea(ring);
      // Outer ring adds area, holes subtract
      totalArea += index === 0 ? area : -area;
    });
  });

  return totalArea;
}

/**
 * Check if a point is inside a bounding box
 */
export function pointInBbox(point: Point, bbox: BoundingBox): boolean {
  return (
    point.x >= bbox.minX &&
    point.x <= bbox.maxX &&
    point.y >= bbox.minY &&
    point.y <= bbox.maxY
  );
}

/**
 * Expand a bounding box by a margin
 */
export function expandBbox(bbox: BoundingBox, margin: number): BoundingBox {
  return {
    minX: bbox.minX - margin,
    minY: bbox.minY - margin,
    maxX: bbox.maxX + margin,
    maxY: bbox.maxY + margin,
  };
}

/**
 * Merge multiple bounding boxes into one
 */
export function mergeBboxes(bboxes: BoundingBox[]): BoundingBox {
  if (bboxes.length === 0) {
    return { minX: 0, minY: 0, maxX: 0, maxY: 0 };
  }

  return {
    minX: Math.min(...bboxes.map((b) => b.minX)),
    minY: Math.min(...bboxes.map((b) => b.minY)),
    maxX: Math.max(...bboxes.map((b) => b.maxX)),
    maxY: Math.max(...bboxes.map((b) => b.maxY)),
  };
}

/**
 * Calculate the center of a bounding box
 */
export function bboxCenter(bbox: BoundingBox): Point {
  return {
    x: (bbox.minX + bbox.maxX) / 2,
    y: (bbox.minY + bbox.maxY) / 2,
  };
}

/**
 * Calculate the distance between two points
 */
export function distance(a: Point, b: Point): number {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Linearly interpolate between two values
 */
export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

/**
 * Ease-in-out function for smooth animations
 */
export function easeInOut(t: number): number {
  return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
}

/**
 * Clamp a value between min and max
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

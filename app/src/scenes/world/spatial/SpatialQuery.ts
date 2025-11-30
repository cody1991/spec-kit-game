/**
 * Spatial Query System
 *
 * Accelerates geographic queries using spatial grid indexing.
 * Reduces search complexity from O(n) to O(k) where k is the
 * number of items in the queried cells.
 *
 * @module spatial/SpatialQuery
 */

import type { BoundingBox, Point, Country } from '../types/mapTypes';
import { SpatialGrid } from './SpatialGrid';
import { bboxIntersects } from '../utils/geoUtils';

/**
 * Spatial query interface
 */
export interface ISpatialQuery {
  /**
   * Find countries at a specific point
   *
   * @param point - Point in screen coordinates
   * @returns Array of candidate country IDs
   */
  findCountriesAtPoint(point: Point): string[];

  /**
   * Find countries in a bounding box
   *
   * @param bbox - Bounding box in screen coordinates
   * @returns Array of country IDs
   */
  findCountriesInBbox(bbox: BoundingBox): string[];

  /**
   * Find countries in viewport
   *
   * @param viewport - Camera viewport bbox
   * @returns Array of country IDs
   */
  findCountriesInViewport(viewport: BoundingBox): string[];

  /**
   * Get neighbors of a country
   *
   * @param countryId - Country ID
   * @returns Array of neighboring country IDs
   */
  getNeighbors(countryId: string): string[];

  /**
   * Update spatial index (call when countries change)
   *
   * @param countries - Array of countries
   */
  updateIndex(countries: Country[]): void;

  /**
   * Clear spatial index
   */
  clear(): void;
}

/**
 * Spatial query implementation using grid acceleration
 */
export class SpatialQuery implements ISpatialQuery {
  private spatialGrid: SpatialGrid;
  private countryBboxCache: Map<string, BoundingBox> = new Map();
  private countryNeighborsCache: Map<string, string[]> = new Map();

  constructor(gridCols: number = 16, gridRows: number = 8) {
    this.spatialGrid = new SpatialGrid(gridCols, gridRows);
  }

  findCountriesAtPoint(point: Point): string[] {
    // Get grid cell for point
    const cellId = this.spatialGrid.getCellId(point.x, point.y);

    if (cellId === null) {
      return [];
    }

    // Get all countries in that cell
    return this.spatialGrid.getCountriesInCell(cellId);
  }

  findCountriesInBbox(bbox: BoundingBox): string[] {
    // Find all cells that intersect the bbox
    const cells = this.spatialGrid.getCellsInBbox(bbox);

    // Collect unique country IDs from all cells
    const countryIds = new Set<string>();

    for (const cellId of cells) {
      const countries = this.spatialGrid.getCountriesInCell(cellId);
      countries.forEach((id) => countryIds.add(id));
    }

    // Filter by precise bbox intersection
    const result: string[] = [];

    for (const countryId of countryIds) {
      const countryBbox = this.countryBboxCache.get(countryId);

      if (countryBbox && bboxIntersects(countryBbox, bbox)) {
        result.push(countryId);
      }
    }

    return result;
  }

  findCountriesInViewport(viewport: BoundingBox): string[] {
    return this.findCountriesInBbox(viewport);
  }

  getNeighbors(countryId: string): string[] {
    return this.countryNeighborsCache.get(countryId) || [];
  }

  updateIndex(countries: Country[]): void {
    // Clear existing index
    this.clear();

    // Index each country
    countries.forEach((country) => {
      // Cache bbox
      this.countryBboxCache.set(country.id, country.bbox);

      // Cache neighbors
      this.countryNeighborsCache.set(country.id, country.neighbors);

      // Add to spatial grid
      this.spatialGrid.addCountry(country.id, country.bbox);
    });

    console.log(
      `📍 Spatial index updated: ${countries.length} countries in ${this.spatialGrid.getCellCount()} cells`
    );
  }

  clear(): void {
    this.spatialGrid.clear();
    this.countryBboxCache.clear();
    this.countryNeighborsCache.clear();
  }

  /**
   * Get statistics about the spatial index
   */
  getStats(): {
    totalCountries: number;
    totalCells: number;
    averageCountriesPerCell: number;
  } {
    const totalCountries = this.countryBboxCache.size;
    const totalCells = this.spatialGrid.getCellCount();
    const averageCountriesPerCell = totalCells > 0 ? totalCountries / totalCells : 0;

    return {
      totalCountries,
      totalCells,
      averageCountriesPerCell,
    };
  }
}

/**
 * Factory function: Create spatial query system
 */
export function createSpatialQuery(gridCols?: number, gridRows?: number): ISpatialQuery {
  return new SpatialQuery(gridCols, gridRows);
}

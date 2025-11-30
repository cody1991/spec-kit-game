/**
 * Spatial Grid (Grid-based Spatial Hashing)
 * 
 * Provides efficient spatial indexing for countries using a 16x8 grid.
 * Enables fast viewport culling and point-in-country queries.
 */

import type { Country, BoundingBox, SpatialGrid as ISpatialGrid } from '../types/mapTypes';

export class SpatialGrid {
  private cols: number;
  private rows: number;
  private cellWidth: number;
  private cellHeight: number;
  private cells: Map<number, Set<string>>;
  private worldBounds: BoundingBox;

  constructor(cols = 16, rows = 8, worldBounds: BoundingBox) {
    this.cols = cols;
    this.rows = rows;
    this.worldBounds = worldBounds;
    this.cellWidth = (worldBounds.maxX - worldBounds.minX) / cols;
    this.cellHeight = (worldBounds.maxY - worldBounds.minY) / rows;
    this.cells = new Map();

    // Initialize all cells
    for (let i = 0; i < cols * rows; i++) {
      this.cells.set(i, new Set());
    }
  }

  /**
   * Add a country to the spatial grid
   */
  addCountry(country: Country): void {
    const cellIds = this.getCellsForBBox(country.bbox);
    
    cellIds.forEach((cellId) => {
      const cell = this.cells.get(cellId);
      if (cell) {
        cell.add(country.id);
      }
    });

    // Store grid cells in country for reference
    country.gridCells = cellIds;
  }

  /**
   * Get all cell IDs that intersect with a bounding box
   */
  getCellsForBBox(bbox: BoundingBox): number[] {
    const cellIds: number[] = [];

    const startCol = Math.max(0, Math.floor((bbox.minX - this.worldBounds.minX) / this.cellWidth));
    const endCol = Math.min(this.cols - 1, Math.floor((bbox.maxX - this.worldBounds.minX) / this.cellWidth));
    const startRow = Math.max(0, Math.floor((bbox.minY - this.worldBounds.minY) / this.cellHeight));
    const endRow = Math.min(this.rows - 1, Math.floor((bbox.maxY - this.worldBounds.minY) / this.cellHeight));

    for (let row = startRow; row <= endRow; row++) {
      for (let col = startCol; col <= endCol; col++) {
        cellIds.push(row * this.cols + col);
      }
    }

    return cellIds;
  }

  /**
   * Get all countries in specified cells
   */
  getCountriesInCells(cellIds: number[]): Set<string> {
    const countryIds = new Set<string>();

    cellIds.forEach((cellId) => {
      const cell = this.cells.get(cellId);
      if (cell) {
        cell.forEach((id) => countryIds.add(id));
      }
    });

    return countryIds;
  }

  /**
   * Get all countries in a single cell
   */
  getCountriesInCell(cellId: number): string[] {
    const cell = this.cells.get(cellId);
    return cell ? Array.from(cell) : [];
  }

  /**
   * Query countries in a bounding box (viewport culling)
   */
  queryBoundingBox(bbox: BoundingBox): string[] {
    const cellIds = this.getCellsForBBox(bbox);
    const countryIds = this.getCountriesInCells(cellIds);
    return Array.from(countryIds);
  }

  /**
   * Get grid information
   */
  getInfo(): ISpatialGrid {
    return {
      cols: this.cols,
      rows: this.rows,
      cellWidth: this.cellWidth,
      cellHeight: this.cellHeight,
      cells: this.cells,
    };
  }

  /**
   * Clear all cells
   */
  clear(): void {
    this.cells.forEach((cell) => cell.clear());
  }

  /**
   * Get total country count across all cells
   */
  getTotalCountries(): number {
    const allCountries = new Set<string>();
    this.cells.forEach((cell) => {
      cell.forEach((id) => allCountries.add(id));
    });
    return allCountries.size;
  }
}

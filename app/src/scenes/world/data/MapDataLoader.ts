/**
 * Map Data Loader
 *
 * Loads and parses TopoJSON/GeoJSON map data, converts to Country entities.
 * Supports Web Worker offloading and IndexedDB caching.
 */

import * as topojson from 'topojson-client';
import { geoCentroid } from 'd3-geo';
import type { Country, LoadOptions } from '../types/mapTypes';
import { MapDataCache } from './MapDataCache';
import { calculateBbox } from '../utils/geoUtils';
import { COUNTRY_AREAS } from '../../../data/countryAreas';

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

export class MapDataLoader {
  private cache: MapDataCache;

  constructor() {
    this.cache = new MapDataCache();
  }

  /**
   * Load map data from URL (main entry point)
   */
  async loadMapData(dataUrl: string, options: LoadOptions = {}): Promise<Country[]> {
    const { enableCache = true, cacheDuration = 7, timeout = 10000 } = options;

    const startTime = performance.now();

    // Initialize cache
    if (enableCache) {
      await this.cache.init();

      // Check cache first
      const cached = await this.cache.get(dataUrl);
      if (cached) {
        return cached;
      }
    }

    try {
      // Fetch with timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      const response = await fetch(dataUrl, {
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new MapDataLoadError(
          `Failed to fetch map data: ${response.statusText}`,
          'FETCH_FAILED'
        );
      }

      const topoData = await response.json();

      // Parse TopoJSON
      const featureCollection = this.parseTopoJSON(topoData, 'countries');

      // Convert features to Country entities
      const countries: Country[] = [];
      featureCollection.features.forEach((feature) => {
        try {
          const country = this.featureToCountry(feature);
          
          // 🔧 过滤掉南极洲（Antarctica）- 多种判断条件
          const isAntarctica = 
            country.id === 'ATA' || 
            country.id === '-99' || 
            country.id === '010' ||  // ISO 3166-1 numeric code
            country.name === 'Antarctica' || 
            country.nameEn === 'Antarctica' ||
            country.name.toLowerCase().includes('antarctica') ||
            country.nameEn.toLowerCase().includes('antarctica');
          
          if (isAntarctica) {
            return;
          }
          
          countries.push(country);
        } catch (error) {
          console.warn(`Failed to convert feature to country:`, error);
        }
      });

      // Post-process (build neighbor relationships)
      const processedCountries = this.postProcessCountries(countries);

      // Cache the result
      if (enableCache) {
        const expiresAt = Date.now() + cacheDuration * 24 * 60 * 60 * 1000;
        await this.cache.set(dataUrl, processedCountries, expiresAt);
      }

      const loadTime = Math.round(performance.now() - startTime);
      console.log(`✅ Map loaded: ${countries.length} countries in ${loadTime}ms`);

      return processedCountries;
    } catch (error) {
      if (error instanceof MapDataLoadError) {
        throw error;
      }

      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          throw new MapDataLoadError(`Map data load timeout after ${timeout}ms`, 'TIMEOUT', error);
        }

        throw new MapDataLoadError(
          `Failed to load map data: ${error.message}`,
          'FETCH_FAILED',
          error
        );
      }

      throw new MapDataLoadError('Unknown error loading map data', 'FETCH_FAILED');
    }
  }

  /**
   * Parse TopoJSON to GeoJSON FeatureCollection
   */
  parseTopoJSON(topoData: any, objectName: string): GeoJSON.FeatureCollection {
    try {
      if (!topoData.objects || !topoData.objects[objectName]) {
        throw new Error(`TopoJSON object '${objectName}' not found`);
      }

      const featureCollection = topojson.feature(
        topoData,
        topoData.objects[objectName]
      ) as GeoJSON.FeatureCollection;

      if (!featureCollection || !featureCollection.features) {
        throw new Error('Invalid GeoJSON FeatureCollection');
      }

      return featureCollection;
    } catch (error) {
      throw new MapDataLoadError(
        `Failed to parse TopoJSON: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'PARSE_ERROR',
        error instanceof Error ? error : undefined
      );
    }
  }

  /**
   * Convert GeoJSON Feature to Country entity
   */
  featureToCountry(feature: GeoJSON.Feature): Country {
    const properties = feature.properties || {};
    const geometry = feature.geometry;

    if (!geometry || (geometry.type !== 'MultiPolygon' && geometry.type !== 'Polygon')) {
      throw new Error(`Invalid geometry type: ${geometry?.type}`);
    }

    // Convert Polygon to MultiPolygon for consistency
    let multiPolygonCoords: number[][][][] = [];
    if (geometry.type === 'Polygon') {
      multiPolygonCoords = [geometry.coordinates as number[][][]];
    } else {
      multiPolygonCoords = geometry.coordinates as number[][][][];
    }

    const multiPolygon: Country['geometry'] = {
      type: 'MultiPolygon',
      coordinates: multiPolygonCoords,
    };

    // Calculate centroid using d3-geo
    const centroidCoords = geoCentroid(feature);
    const centroid = {
      x: centroidCoords[0],
      y: centroidCoords[1],
    };

    // Calculate bounding box
    const bbox = calculateBbox(multiPolygon);

    // Extract country ID and name
    // Try feature.id first (set by TopoJSON), then properties
    const id = String(
      feature.id ||
        properties.id ||
        properties.iso_a3 ||
        properties.ISO_A3 ||
        properties.name ||
        `country-${Date.now()}`
    );
    const name = properties.name || properties.NAME || id;
    const nameEn = properties.name_en || properties.NAME_EN || name;

    // Use real area data from COUNTRY_AREAS, fallback to 0 if not found
    const area = COUNTRY_AREAS[name] ?? 0;

    return {
      id,
      name,
      nameEn,
      geometry: multiPolygon,
      centroid,
      bbox,
      area,
      neighbors: [],
      gridCells: [],
    };
  }

  /**
   * Post-process countries (build neighbor relationships, grid assignment)
   */
  postProcessCountries(countries: Country[]): Country[] {
    // Build neighbor relationships (simplified: countries that share a close bbox)
    countries.forEach((country) => {
      const neighbors: string[] = [];

      countries.forEach((other) => {
        if (country.id === other.id) return;

        // Check if bounding boxes are close (share boundary or overlap)
        const dist = this.bboxDistance(country.bbox, other.bbox);
        if (dist < 0.1) {
          // Threshold for adjacency
          neighbors.push(other.id);
        }
      });

      country.neighbors = neighbors;
    });

    return countries;
  }

  /**
   * Calculate distance between two bounding boxes (0 if they overlap/touch)
   */
  private bboxDistance(a: Country['bbox'], b: Country['bbox']): number {
    const horizontalDist = Math.max(0, Math.max(a.minX - b.maxX, b.minX - a.maxX));
    const verticalDist = Math.max(0, Math.max(a.minY - b.maxY, b.minY - a.maxY));
    return Math.sqrt(horizontalDist * horizontalDist + verticalDist * verticalDist);
  }
}

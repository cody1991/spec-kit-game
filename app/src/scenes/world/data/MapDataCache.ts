/**
 * Map Data Cache (IndexedDB)
 * 
 * Caches map data in IndexedDB to speed up subsequent loads.
 * Cache entries expire after 7 days by default.
 */

import { openDB, type IDBPDatabase } from 'idb';
import type { Country } from '../types/mapTypes';

interface CacheEntry {
  key: string;
  countries: Country[];
  cachedAt: number;
  expiresAt: number;
  version: string;
}

export class MapDataCache {
  private dbName = 'map-data-cache';
  private storeName = 'countries';
  private db: IDBPDatabase | null = null;
  private readonly defaultCacheDuration = 7 * 24 * 60 * 60 * 1000; // 7 days

  /**
   * Initialize the IndexedDB database
   */
  async init(): Promise<void> {
    try {
      this.db = await openDB(this.dbName, 1, {
        upgrade(db) {
          if (!db.objectStoreNames.contains('countries')) {
            db.createObjectStore('countries', { keyPath: 'key' });
          }
        },
      });
    } catch (error) {
      console.warn('Failed to initialize IndexedDB cache:', error);
      // Continue without cache if IndexedDB is not available
    }
  }

  /**
   * Check if cache exists and is valid
   */
  async has(key: string): Promise<boolean> {
    if (!this.db) return false;

    try {
      const entry = await this.db.get(this.storeName, key) as CacheEntry | undefined;
      
      if (!entry) return false;

      // Check if expired
      if (Date.now() > entry.expiresAt) {
        await this.db.delete(this.storeName, key);
        return false;
      }

      return true;
    } catch (error) {
      console.warn('Cache check failed:', error);
      return false;
    }
  }

  /**
   * Get cached data
   */
  async get(key: string): Promise<Country[] | null> {
    if (!this.db) return null;

    try {
      const entry = await this.db.get(this.storeName, key) as CacheEntry | undefined;

      if (!entry) return null;

      // Check if expired
      if (Date.now() > entry.expiresAt) {
        await this.db.delete(this.storeName, key);
        return null;
      }

      console.log(`✅ Map data loaded from cache (age: ${Math.round((Date.now() - entry.cachedAt) / 1000 / 60)} minutes)`);
      
      return entry.countries;
    } catch (error) {
      console.warn('Cache read failed:', error);
      return null;
    }
  }

  /**
   * Store data in cache
   */
  async set(
    key: string,
    data: Country[],
    expiresAt?: number
  ): Promise<void> {
    if (!this.db) return;

    try {
      const now = Date.now();
      const entry: CacheEntry = {
        key,
        countries: data,
        cachedAt: now,
        expiresAt: expiresAt || now + this.defaultCacheDuration,
        version: 'world-atlas-50m-v1',
      };

      await this.db.put(this.storeName, entry);
      console.log(`✅ Map data cached (expires in ${Math.round((entry.expiresAt - now) / 1000 / 60 / 60)} hours)`);
    } catch (error) {
      console.warn('Cache write failed:', error);
    }
  }

  /**
   * Clear all cache entries
   */
  async clear(): Promise<void> {
    if (!this.db) return;

    try {
      await this.db.clear(this.storeName);
      console.log('✅ Map data cache cleared');
    } catch (error) {
      console.warn('Cache clear failed:', error);
    }
  }

  /**
   * Close the database connection
   */
  close(): void {
    if (this.db) {
      this.db.close();
      this.db = null;
    }
  }

  /**
   * Get cache statistics
   */
  async getStats(): Promise<{
    totalEntries: number;
    totalSize: number;
  }> {
    if (!this.db) {
      return { totalEntries: 0, totalSize: 0 };
    }

    try {
      const allKeys = await this.db.getAllKeys(this.storeName);
      const totalEntries = allKeys.length;
      
      // Estimate size (rough approximation)
      const entries = await this.db.getAll(this.storeName) as CacheEntry[];
      const totalSize = entries.reduce((sum, entry) => {
        return sum + JSON.stringify(entry.countries).length;
      }, 0);

      return { totalEntries, totalSize };
    } catch (error) {
      console.warn('Failed to get cache stats:', error);
      return { totalEntries: 0, totalSize: 0 };
    }
  }
}

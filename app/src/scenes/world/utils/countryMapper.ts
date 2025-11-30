import {
  createRegionCountryMap,
  type CountryMappingResult,
  type MappedCountry,
} from '@/config/regionMapping.config';
import type { Country, HistoricalCommander } from '@/core/types';

/**
 * Map a single region ID to country IDs
 *
 * 仅用于“世界初始化阶段”，根据历史区域 ID 找到对应的国家。
 * 运行时攻占与展示逻辑必须直接使用 Country.id，而不是 regionId。
 *
 * @param regionId - Legacy region ID (e.g., 'china', 'western-europe')
 * @returns Array of ISO 3166-1 numeric country IDs
 */
export function mapRegionToCountries(regionId: string): string[] {
  const regionCountryMap = createRegionCountryMap();
  return regionCountryMap.get(regionId) || [];
}

/**
 * Map all commanders' controlled regions to actual country IDs
 *
 * @param commanders - Array of historical commanders
 * @param countries - Array of countries from map data
 * @returns Mapping result with success/failure details
 */
export function mapCommandersToCountries(
  commanders: HistoricalCommander[],
  countries: Country[]
): CountryMappingResult {
  const startTime = performance.now();

  const regionCountryMap = createRegionCountryMap();
  const countryMap = new Map(countries.map((c) => [c.id, c]));

  const mappedCountries = new Map<string, MappedCountry>();
  const unmappedRegions: string[] = [];
  const invalidCountryIds: string[] = [];
  const warnings: string[] = [];

  let successfulMappings = 0;
  let failedMappings = 0;

  commanders.forEach((commander) => {
    commander.controlledTerritories.forEach((regionId) => {
      const countryIds = regionCountryMap.get(regionId);

      if (!countryIds) {
        // Region not found in mapping
        unmappedRegions.push(regionId);
        failedMappings++;
        warnings.push(`⚠️  Region "${regionId}" (${commander.name}) not found in mapping table`);
        return;
      }

      countryIds.forEach((countryId) => {
        const country = countryMap.get(countryId);

        if (!country) {
          // Country ID not found in map data
          invalidCountryIds.push(countryId);
          failedMappings++;
          warnings.push(
            `⚠️  Country ID "${countryId}" (from region "${regionId}") not found in map data`
          );
          return;
        }

        // Successful mapping
        mappedCountries.set(countryId, {
          countryId: country.id,
          countryName: country.name,
          regionId,
          regionName: regionId, // Will be replaced with proper name from mapping config
          ownerId: commander.id,
          ownerName: commander.name,
        });

        successfulMappings++;
      });
    });
  });

  const durationMs = performance.now() - startTime;

  return {
    mappedCountries,
    unmappedRegions: Array.from(new Set(unmappedRegions)),
    invalidCountryIds: Array.from(new Set(invalidCountryIds)),
    warnings,
    stats: {
      totalRegions: commanders.reduce((sum, c) => sum + c.controlledTerritories.length, 0),
      totalCountries: countries.length,
      successfulMappings,
      failedMappings,
      durationMs,
    },
  };
}

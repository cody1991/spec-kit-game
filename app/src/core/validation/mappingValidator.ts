import type { RegionMapping } from '@/config/regionMapping.config';
import type { Country } from '@/core/types';

/**
 * Validation error types
 */
export type ValidationErrorType =
  | 'MISSING_REGION'
  | 'INVALID_COUNTRY_ID'
  | 'DUPLICATE_COUNTRY'
  | 'EMPTY_MAPPING';

/**
 * Validation warning types
 */
export type ValidationWarningType = 'LARGE_REGION' | 'SMALL_REGION' | 'IMBALANCED_DISTRIBUTION';

/**
 * Validation error
 */
export interface ValidationError {
  type: ValidationErrorType;
  regionId?: string;
  countryId?: string;
  message: string;
}

/**
 * Validation warning
 */
export interface ValidationWarning {
  type: ValidationWarningType;
  regionId?: string;
  message: string;
  suggestion?: string;
}

/**
 * Validation summary statistics
 */
export interface ValidationSummary {
  totalMappings: number;
  totalCountries: number;
  uniqueCountries: number;
  errorCount: number;
  warningCount: number;
}

/**
 * Validation result
 */
export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
  summary: ValidationSummary;
}

/**
 * Expected region IDs from the legacy system
 */
const REQUIRED_REGION_IDS = [
  'china',
  'russia',
  'western-europe',
  'eastern-europe',
  'middle-east',
  'india',
  'japan',
  'southeast-asia',
  'north-africa',
  'central-africa',
  'south-africa',
  'north-america',
  'central-america',
  'south-america',
  'australia',
] as const;

/**
 * Validator for region-to-country mappings
 */
export class MappingValidator {
  /**
   * Validate mapping configuration against map data
   */
  validate(mappings: RegionMapping[], countries: Country[]): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    // Create country ID set for fast lookup
    const validCountryIds = new Set(countries.map((c) => c.id));

    // Track used country IDs to detect duplicates
    const usedCountryIds = new Map<string, string>();

    // Check 1: Verify all required regions are present
    const mappedRegionIds = new Set(mappings.map((m) => m.id));
    REQUIRED_REGION_IDS.forEach((requiredId) => {
      if (!mappedRegionIds.has(requiredId)) {
        errors.push({
          type: 'MISSING_REGION',
          regionId: requiredId,
          message: `Required region "${requiredId}" is missing from mapping configuration`,
        });
      }
    });

    // Check 2: Validate each mapping
    mappings.forEach((mapping) => {
      // Check 2.1: Empty country IDs
      if (mapping.countryIds.length === 0) {
        errors.push({
          type: 'EMPTY_MAPPING',
          regionId: mapping.id,
          message: `Region "${mapping.id}" has no country IDs`,
        });
        return;
      }

      // Check 2.2: Valid country IDs
      mapping.countryIds.forEach((countryId) => {
        // Validate ISO 3166-1 numeric format
        if (!/^\d{3}$/.test(countryId)) {
          errors.push({
            type: 'INVALID_COUNTRY_ID',
            regionId: mapping.id,
            countryId,
            message: `Invalid country ID "${countryId}" in region "${mapping.id}" (must be 3-digit string)`,
          });
        }

        // Validate existence in map data
        if (!validCountryIds.has(countryId)) {
          errors.push({
            type: 'INVALID_COUNTRY_ID',
            regionId: mapping.id,
            countryId,
            message: `Country ID "${countryId}" in region "${mapping.id}" not found in map data`,
          });
        }

        // Check for duplicates
        const existingRegion = usedCountryIds.get(countryId);
        if (existingRegion) {
          errors.push({
            type: 'DUPLICATE_COUNTRY',
            countryId,
            message: `Country ID "${countryId}" is assigned to multiple regions: "${existingRegion}" and "${mapping.id}"`,
          });
        } else {
          usedCountryIds.set(countryId, mapping.id);
        }
      });

      // Check 2.3: Region size balance (warnings)
      if (mapping.countryIds.length > 7) {
        warnings.push({
          type: 'LARGE_REGION',
          regionId: mapping.id,
          message: `Region "${mapping.id}" contains ${mapping.countryIds.length} countries (recommended: 1-7)`,
          suggestion: 'Consider splitting into smaller regions for game balance',
        });
      }

      if (mapping.countryIds.length === 0) {
        // Already added as error, skip warning
      }
    });

    // Summary statistics
    const totalCountries = mappings.reduce((sum, m) => sum + m.countryIds.length, 0);
    const uniqueCountries = usedCountryIds.size;

    const summary: ValidationSummary = {
      totalMappings: mappings.length,
      totalCountries,
      uniqueCountries,
      errorCount: errors.length,
      warningCount: warnings.length,
    };

    return {
      valid: errors.length === 0,
      errors,
      warnings,
      summary,
    };
  }
}

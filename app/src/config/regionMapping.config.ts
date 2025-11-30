/**
 * Region-to-Country Mapping Configuration
 *
 * 用于“初始化阶段”将历史区域 ID 映射为国家 ID 列表，
 * 例如根据指挥官配置的区域生成其初始控制的国家。
 *
 * 运行时攻占与展示逻辑必须只使用 Country.id，
 * 不得再直接依赖区域 ID 触发批量占领或展示。
 *
 * Maps legacy region IDs to ISO 3166-1 numeric country codes.
 * Reference: https://www.iso.org/iso-3166-country-codes.html
 */

export interface RegionMapping {
  id: string; // 旧 region ID（如 'china', 'western-europe'）
  name: string; // 区域名称（显示用）
  nameEn?: string; // 英文名称（可选）
  countryIds: string[]; // ISO 3166-1 numeric codes
  description?: string; // 地理范围说明（可选）
}

/**
 * Country mapping result for a single mapped country
 */
export interface MappedCountry {
  countryId: string;
  countryName: string;
  regionId: string;
  regionName: string;
  ownerId: string;
  ownerName: string;
}

/**
 * Statistics about the mapping operation
 */
export interface MappingStats {
  totalRegions: number;
  totalCountries: number;
  successfulMappings: number;
  failedMappings: number;
  durationMs: number;
}

/**
 * Result of a mapping operation
 */
export interface CountryMappingResult {
  mappedCountries: Map<string, MappedCountry>;
  unmappedRegions: string[];
  invalidCountryIds: string[];
  warnings: string[];
  stats: MappingStats;
}

/**
 * 完整的 region-to-country 映射表
 */
export const REGION_COUNTRY_MAPPINGS: RegionMapping[] = [
  {
    id: 'china',
    name: '中国',
    nameEn: 'China',
    countryIds: ['156'], // China
    description: '东亚地区，中华人民共和国',
  },
  {
    id: 'russia',
    name: '俄罗斯',
    nameEn: 'Russia',
    countryIds: ['643'], // Russia
    description: '欧亚地区，俄罗斯联邦',
  },
  {
    id: 'western-europe',
    name: '西欧',
    nameEn: 'Western Europe',
    countryIds: [
      '250', // France
      '276', // Germany
      '380', // Italy
      '528', // Netherlands
      '56', // Belgium
      '442', // Luxembourg
      '724', // Spain
    ],
    description: '西欧地区，包括法国、德国、意大利等主要国家',
  },
  {
    id: 'eastern-europe',
    name: '东欧',
    nameEn: 'Eastern Europe',
    countryIds: [
      '616', // Poland
      '804', // Ukraine
      '348', // Hungary
      '203', // Czech Republic
      '642', // Romania
    ],
    description: '东欧地区，包括波兰、乌克兰等国家',
  },
  {
    id: 'middle-east',
    name: '中东',
    nameEn: 'Middle East',
    countryIds: [
      '682', // Saudi Arabia
      '784', // United Arab Emirates
      '792', // Turkey
      '368', // Iraq
      '364', // Iran
    ],
    description: '中东地区',
  },
  {
    id: 'india',
    name: '印度',
    nameEn: 'India',
    countryIds: ['356'], // India
    description: '南亚地区，印度共和国',
  },
  {
    id: 'japan',
    name: '日本',
    nameEn: 'Japan',
    countryIds: ['392'], // Japan
    description: '东亚岛国，日本国',
  },
  {
    id: 'southeast-asia',
    name: '东南亚',
    nameEn: 'Southeast Asia',
    countryIds: [
      '704', // Vietnam
      '764', // Thailand
      '360', // Indonesia
      '458', // Malaysia
      '608', // Philippines
    ],
    description: '东南亚地区',
  },
  {
    id: 'north-africa',
    name: '北非',
    nameEn: 'North Africa',
    countryIds: [
      '818', // Egypt
      '012', // Algeria
      '434', // Libya
      '788', // Tunisia
      '504', // Morocco
    ],
    description: '北非地区',
  },
  {
    id: 'central-africa',
    name: '中非',
    nameEn: 'Central Africa',
    countryIds: [
      '180', // DR Congo
      '178', // Congo
      '404', // Kenya
      '120', // Cameroon
    ],
    description: '中非地区',
  },
  {
    id: 'south-africa',
    name: '南非',
    nameEn: 'South Africa',
    countryIds: ['710'], // South Africa
    description: '南部非洲，南非共和国',
  },
  {
    id: 'north-america',
    name: '北美',
    nameEn: 'North America',
    countryIds: [
      '840', // United States
      '124', // Canada
    ],
    description: '北美地区',
  },
  {
    id: 'central-america',
    name: '中美洲',
    nameEn: 'Central America',
    countryIds: [
      '484', // Mexico
      '188', // Costa Rica
      '591', // Panama
    ],
    description: '中美洲地区',
  },
  {
    id: 'south-america',
    name: '南美',
    nameEn: 'South America',
    countryIds: [
      '076', // Brazil
      '032', // Argentina
      '170', // Colombia
      '152', // Chile
    ],
    description: '南美地区',
  },
  {
    id: 'australia',
    name: '澳大利亚',
    nameEn: 'Australia',
    countryIds: ['036'], // Australia
    description: '大洋洲，澳大利亚联邦',
  },
];

/**
 * 根据 region ID 查找对应的 country IDs
 *
 * @param regionId - Legacy region ID (e.g., 'china', 'russia', 'western-europe')
 * @returns Array of ISO 3166-1 numeric country codes, or empty array if region not found
 *
 * @example
 * ```ts
 * const countryIds = getCountryIdsByRegion('china');
 * // Returns: ['156'] (China's ISO 3166-1 code)
 * ```
 */
export function getCountryIdsByRegion(regionId: string): string[] {
  const mapping = REGION_COUNTRY_MAPPINGS.find((m) => m.id === regionId);
  return mapping?.countryIds || [];
}

/**
 * 创建 region ID 到 country IDs 的 Map（优化查找性能）
 *
 * This function creates a Map for O(1) lookup performance when mapping regions to countries.
 * Recommended for batch operations or frequent lookups.
 *
 * @returns Map where keys are region IDs and values are arrays of country IDs
 *
 * @example
 * ```ts
 * const regionMap = createRegionCountryMap();
 * const chinaCountries = regionMap.get('china'); // ['156']
 * const franceCountries = regionMap.get('western-europe'); // ['250', '276', ...]
 * ```
 *
 * @performance
 * - Map creation: O(n) where n = number of regions
 * - Lookup: O(1) average case
 * - Memory: ~2KB for 15 regions (negligible)
 */
export function createRegionCountryMap(): Map<string, string[]> {
  return new Map(REGION_COUNTRY_MAPPINGS.map((m) => [m.id, m.countryIds]));
}

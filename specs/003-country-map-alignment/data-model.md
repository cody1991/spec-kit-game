# Data Model: 国家与地图精准对齐

**Feature**: 003-country-map-alignment  
**Date**: 2025-11-30  
**Status**: Final

## Overview

本文档定义了国家与地图精准对齐功能所需的数据模型，包括实体定义、字段说明、验证规则和状态转换。

---

## Core Entities

### 1. RegionMapping

**描述**: 定义旧的区域 ID 到真实国家 IDs 的映射关系。

**字段**:

| 字段名        | 类型       | 必填 | 说明                                        | 验证规则                                     |
| ------------- | ---------- | ---- | ------------------------------------------- | -------------------------------------------- |
| `id`          | `string`   | ✓    | 旧的区域 ID（如 'china', 'western-europe'） | 必须是预定义的 15 个区域之一                 |
| `name`        | `string`   | ✓    | 区域的显示名称（中文）                      | 非空字符串，长度 2-20                        |
| `nameEn`      | `string`   |      | 区域的英文名称                              | 可选，非空时长度 2-50                        |
| `countryIds`  | `string[]` | ✓    | ISO 3166-1 numeric codes 列表               | 数组长度 >= 1，每个元素必须是 3 位数字字符串 |
| `description` | `string`   |      | 地理范围的详细说明                          | 可选，长度 0-200                             |

**TypeScript 定义**:

```typescript
export interface RegionMapping {
  id: string;
  name: string;
  nameEn?: string;
  countryIds: string[];
  description?: string;
}
```

**示例**:

```typescript
{
  id: 'china',
  name: '中国',
  nameEn: 'China',
  countryIds: ['156'],
  description: '东亚地区，中华人民共和国'
}

{
  id: 'western-europe',
  name: '西欧',
  nameEn: 'Western Europe',
  countryIds: ['250', '276', '380', '528', '56', '442', '724'],
  description: '西欧地区，包括法国、德国、意大利、荷兰、比利时、卢森堡、西班牙'
}
```

**验证规则**:

1. `id` 必须唯一（不能重复）
2. `countryIds` 中的每个 ID 必须存在于地图数据中
3. 同一个 `countryId` 不能出现在多个 `RegionMapping` 中
4. `countryIds` 数组不能为空

**关系**:

- **一对多**: 一个 `RegionMapping` 可以包含多个国家
- **关联**: `countryIds` 关联到地图数据中的 `Country.id`

---

### 2. CountryMappingResult

**描述**: 映射操作的结果，包含成功映射的国家和失败的 region。

**字段**:

| 字段名              | 类型                         | 必填 | 说明                                                   |
| ------------------- | ---------------------------- | ---- | ------------------------------------------------------ |
| `mappedCountries`   | `Map<string, MappedCountry>` | ✓    | 成功映射的国家（key: countryId, value: MappedCountry） |
| `unmappedRegions`   | `string[]`                   | ✓    | 未能映射的 region IDs（配置缺失或错误）                |
| `invalidCountryIds` | `string[]`                   | ✓    | 无效的 country IDs（在地图数据中不存在）               |
| `warnings`          | `string[]`                   | ✓    | 警告信息列表                                           |
| `stats`             | `MappingStats`               | ✓    | 映射统计信息                                           |

**TypeScript 定义**:

```typescript
export interface CountryMappingResult {
  mappedCountries: Map<string, MappedCountry>;
  unmappedRegions: string[];
  invalidCountryIds: string[];
  warnings: string[];
  stats: MappingStats;
}

export interface MappedCountry {
  countryId: string;
  countryName: string;
  regionId: string;
  regionName: string;
  ownerId: string;
  ownerName: string;
}

export interface MappingStats {
  totalRegions: number;
  totalCountries: number;
  successfulMappings: number;
  failedMappings: number;
  durationMs: number;
}
```

**示例**:

```typescript
{
  mappedCountries: Map([
    ['156', {
      countryId: '156',
      countryName: '中国',
      regionId: 'china',
      regionName: '中国',
      ownerId: 'qin-shi-huang',
      ownerName: '秦始皇'
    }],
    ['250', {
      countryId: '250',
      countryName: 'France',
      regionId: 'western-europe',
      regionName: '西欧',
      ownerId: 'napoleon',
      ownerName: '拿破仑'
    }]
  ]),
  unmappedRegions: [],
  invalidCountryIds: ['999'], // 示例：无效的 country ID
  warnings: ['Country ID 999 not found in map data'],
  stats: {
    totalRegions: 15,
    totalCountries: 193,
    successfulMappings: 45,
    failedMappings: 1,
    durationMs: 23.5
  }
}
```

---

### 3. ValidationResult

**描述**: 映射配置验证的结果。

**字段**:

| 字段名     | 类型                  | 必填 | 说明                   |
| ---------- | --------------------- | ---- | ---------------------- |
| `valid`    | `boolean`             | ✓    | 验证是否通过           |
| `errors`   | `ValidationError[]`   | ✓    | 错误列表（阻止运行）   |
| `warnings` | `ValidationWarning[]` | ✓    | 警告列表（可降级运行） |
| `summary`  | `ValidationSummary`   | ✓    | 验证摘要               |

**TypeScript 定义**:

```typescript
export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
  summary: ValidationSummary;
}

export interface ValidationError {
  type: 'MISSING_REGION' | 'INVALID_COUNTRY_ID' | 'DUPLICATE_COUNTRY' | 'EMPTY_MAPPING';
  regionId?: string;
  countryId?: string;
  message: string;
}

export interface ValidationWarning {
  type: 'LARGE_REGION' | 'SMALL_REGION' | 'IMBALANCED_DISTRIBUTION';
  regionId?: string;
  message: string;
  suggestion?: string;
}

export interface ValidationSummary {
  totalMappings: number;
  totalCountries: number;
  uniqueCountries: number;
  errorCount: number;
  warningCount: number;
}
```

**示例**:

```typescript
// 验证通过
{
  valid: true,
  errors: [],
  warnings: [
    {
      type: 'LARGE_REGION',
      regionId: 'western-europe',
      message: 'Region "western-europe" contains 7 countries, which is above average',
      suggestion: 'Consider splitting into smaller regions for game balance'
    }
  ],
  summary: {
    totalMappings: 15,
    totalCountries: 193,
    uniqueCountries: 45,
    errorCount: 0,
    warningCount: 1
  }
}

// 验证失败
{
  valid: false,
  errors: [
    {
      type: 'INVALID_COUNTRY_ID',
      regionId: 'china',
      countryId: '999',
      message: 'Country ID "999" in region "china" does not exist in map data'
    },
    {
      type: 'DUPLICATE_COUNTRY',
      countryId: '643',
      message: 'Country ID "643" is assigned to multiple regions: ["russia", "eastern-europe"]'
    }
  ],
  warnings: [],
  summary: {
    totalMappings: 15,
    totalCountries: 193,
    uniqueCountries: 44,
    errorCount: 2,
    warningCount: 0
  }
}
```

---

## Extended Entities (Modifications to Existing Types)

### 4. HistoricalCommander (Modification)

**描述**: 历史指挥官实体，需要确保 `controlledTerritories` 字段的含义明确。

**修改说明**:

- `controlledTerritories` 字段在初始化时使用旧的 region IDs（如 'china', 'russia'）
- 在运行时，通过映射逻辑转换为真实的 country IDs（如 '156', '643'）
- 添加新字段 `initialRegions` 用于保存原始的 region IDs（可选，用于调试）

**TypeScript 定义**:

```typescript
export interface HistoricalCommander {
  id: string;
  name: string;
  originRegion: 'africa' | 'americas' | 'asia' | 'europe' | 'oceania';
  portraitAsset: string;
  baseAttributes: {
    attack: number;
    defense: number;
    mobility: number;
    leadership: number;
  };
  skillCards: SkillCard[];
  currentPower: number;
  controlledTerritories: string[]; // 运行时为 country IDs，初始化时为 region IDs
  initialRegions?: string[]; // NEW: 保存原始 region IDs（可选）
  alliances: string[];
  hostilities: string[];
  morale: number;
  nextActionEta: string;
  status: 'active' | 'eliminated';
}
```

**状态转换**:

```
初始化时:
controlledTerritories = ['china', 'russia'] (region IDs)

映射后:
controlledTerritories = ['156', '643', ...] (country IDs)
initialRegions = ['china', 'russia'] (保存原始值，可选)
```

---

### 5. TerritoryState (Modification)

**描述**: 领土状态实体，需要确保 `countryId` 字段使用标准的 ISO codes。

**修改说明**:

- `countryId` 必须是 ISO 3166-1 numeric code (string)
- 添加新字段 `countryName` 用于显示（避免重复查找）

**TypeScript 定义**:

```typescript
export interface TerritoryState {
  countryId: string; // ISO 3166-1 numeric code
  countryName?: string; // NEW: 国家名称（缓存，避免重复查找）
  ownerId: string | null;
  troops: number;
  resources: number;
  defense: number;
  updatedAt: number;
  conqueredAt: number | null;
  previousOwnerId: string | null;
  transitionProgress: number | null;
  isHighlighted: boolean;
}
```

---

## Data Flow

### Initialization Flow (启动时数据流)

```
1. Load Commanders Data (commandersData.ts)
   ↓
   commanders: HistoricalCommander[]
   controlledTerritories = ['china', 'russia', ...] (region IDs)

2. Load Map Data (MapDataLoader)
   ↓
   countries: Country[]
   countries[0].id = '156' (ISO 3166-1 numeric code)

3. Load Region Mapping Config (regionMapping.config.ts)
   ↓
   REGION_COUNTRY_MAPPINGS: RegionMapping[]

4. Validate Mapping (MappingValidator)
   ↓
   ValidationResult { valid: true, errors: [], ... }

5. Execute Mapping (countryMapper)
   ↓
   For each commander:
     For each region in controlledTerritories:
       regionId = 'china'
       ↓
       lookup in REGION_COUNTRY_MAPPINGS
       ↓
       countryIds = ['156']
       ↓
       Create TerritoryState for each countryId
       territoryStates.set('156', {
         countryId: '156',
         countryName: '中国',
         ownerId: 'qin-shi-huang',
         ...
       })

6. Update Game State (Zustand store)
   ↓
   state.territoryStates = Map<string, TerritoryState>
   (key: country ID, value: TerritoryState)

7. Render Map (MapRenderer)
   ↓
   For each country in countries:
     countryId = country.id = '156'
     ↓
     lookup in territoryStates
     ↓
     territoryState = territoryStates.get('156')
     ↓
     if territoryState exists:
       color = colorMappings.get(territoryState.ownerId)
       render country with color
```

---

## Validation Rules

### RegionMapping Validation

1. **结构完整性**:
   - 所有 15 个旧 region IDs 必须存在于映射表中
   - 每个 `RegionMapping` 必须有 `id`, `name`, `countryIds` 字段

2. **数据有效性**:
   - `countryIds` 必须是非空数组
   - 每个 `countryId` 必须是 3 位数字字符串（如 '156', '840'）
   - 每个 `countryId` 必须存在于地图数据中的 `countries` 数组

3. **唯一性**:
   - 同一个 `countryId` 不能出现在多个 `RegionMapping` 中
   - `id` 字段必须唯一

4. **平衡性**（警告级别）:
   - 每个 region 的 country 数量应大致均衡（建议 1-5 个）
   - 如果某个 region 包含 > 7 个国家，发出警告

---

## State Transitions

### TerritoryState 状态转换

**场景 1: 游戏初始化**

```
State: null
 ↓ [mapCountriesToCommanders]
State: {
  countryId: '156',
  ownerId: 'qin-shi-huang',
  troops: 50,
  conqueredAt: Date.now(),
  transitionProgress: null
}
```

**场景 2: 领土易手**

```
State: {
  countryId: '156',
  ownerId: 'qin-shi-huang',
  previousOwnerId: null
}
 ↓ [battleSystem resolves attack]
State: {
  countryId: '156',
  ownerId: 'napoleon',
  previousOwnerId: 'qin-shi-huang',
  conqueredAt: Date.now(),
  transitionProgress: 0  // Start color transition animation
}
 ↓ [MapRenderer.updateTransitions - over 500ms]
State: {
  ...
  transitionProgress: 1.0  // Animation complete
}
```

**场景 3: 指挥官被消灭**

```
State: {
  countryId: '156',
  ownerId: 'qin-shi-huang'
}
 ↓ [victorySystem eliminates commander]
State: {
  countryId: '156',
  ownerId: null,  // Neutral
  previousOwnerId: 'qin-shi-huang'
}
```

---

## Constraints and Invariants

### 不变量 (Invariants)

1. **数据一致性**:
   - `territoryStates` Map 的所有 keys 必须是有效的 country IDs（存在于 `countries` 数组中）
   - 每个 `TerritoryState.ownerId` 必须对应一个有效的 commander，或为 `null`

2. **映射完整性**:
   - 每个 commander 的 `controlledTerritories` 必须在 `territoryStates` 中有对应的条目
   - 反向验证：每个 `TerritoryState` 的 `ownerId` 必须在某个 commander 的 `controlledTerritories` 中

3. **唯一性**:
   - 同一个 country 不能同时属于两个 commander
   - `territoryStates` Map 中不能有重复的 key

### 约束 (Constraints)

1. **性能约束**:
   - 映射操作必须在 50ms 内完成
   - 单次 `TerritoryState` 更新不应触发超过 1 次重渲染

2. **数据量约束**:
   - 最多支持 193 个国家（联合国成员国数量）
   - 最多支持 50 位指挥官（当前为 10 位）
   - `territoryStates` Map 大小不超过 200 条

3. **兼容性约束**:
   - 必须向后兼容旧的 region-based 系统（过渡期）
   - 地图数据文件格式不能修改（使用现有的 TopoJSON）

---

## Summary

本数据模型定义了国家与地图精准对齐功能的核心实体（RegionMapping, CountryMappingResult, ValidationResult）及其关系，明确了数据流（从 region IDs 到 country IDs 的转换），并定义了验证规则和状态转换逻辑。所有实体都有完整的 TypeScript 类型定义，确保编译时类型安全。

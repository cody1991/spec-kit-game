# Mapping Validation Contract

**Feature**: 003-country-map-alignment  
**Date**: 2025-11-30  
**Version**: 1.0.0

## Purpose

本契约定义了映射验证的输入、输出和行为规范，确保映射逻辑的正确性和一致性。

---

## Contract 1: validateMappings

### 签名

```typescript
function validateMappings(
  mappings: RegionMapping[],
  countries: Country[]
): ValidationResult
```

### 前置条件 (Preconditions)

1. `mappings` 必须是非空数组
2. `countries` 必须是非空数组
3. 每个 `RegionMapping` 必须符合 JSON Schema 定义（见 `regionMapping.schema.json`）
4. 每个 `Country` 必须有有效的 `id` 字段

### 后置条件 (Postconditions)

1. 返回的 `ValidationResult` 必须包含 `valid`, `errors`, `warnings`, `summary` 四个字段
2. 如果 `valid = true`，则 `errors` 必须为空数组
3. 如果 `valid = false`，则 `errors` 至少包含一个 `ValidationError`
4. `summary.totalMappings` 必须等于 `mappings.length`
5. `summary.errorCount` 必须等于 `errors.length`
6. `summary.warningCount` 必须等于 `warnings.length`

### 验证规则 (Validation Rules)

#### Rule 1: 结构完整性

**错误类型**: `MISSING_REGION`

**触发条件**: 
- 必需的 region ID 在 `mappings` 中不存在

**必需的 Region IDs**:
```typescript
const REQUIRED_REGION_IDS = [
  'china', 'russia', 'india', 'japan',
  'western-europe', 'eastern-europe',
  'middle-east', 'north-africa', 'central-africa', 'south-africa',
  'north-america', 'central-america', 'south-america',
  'australia', 'southeast-asia'
];
```

**示例**:
```typescript
// Input: mappings 缺少 'china'
validateMappings([
  { id: 'russia', name: '俄罗斯', countryIds: ['643'] },
  // ... 缺少 china
], countries);

// Output:
{
  valid: false,
  errors: [{
    type: 'MISSING_REGION',
    regionId: 'china',
    message: 'Required region "china" is missing from mappings'
  }],
  // ...
}
```

#### Rule 2: Country ID 有效性

**错误类型**: `INVALID_COUNTRY_ID`

**触发条件**: 
- `mapping.countryIds` 中的某个 ID 不存在于 `countries` 数组中

**示例**:
```typescript
// Input: country ID '999' 不存在于 countries 中
validateMappings([
  { id: 'china', name: '中国', countryIds: ['999'] }
], countries); // countries 中没有 id='999' 的国家

// Output:
{
  valid: false,
  errors: [{
    type: 'INVALID_COUNTRY_ID',
    regionId: 'china',
    countryId: '999',
    message: 'Country ID "999" in region "china" does not exist in map data'
  }],
  // ...
}
```

#### Rule 3: Country ID 唯一性

**错误类型**: `DUPLICATE_COUNTRY`

**触发条件**: 
- 同一个 `countryId` 出现在多个 `RegionMapping` 中

**示例**:
```typescript
// Input: country ID '643' 同时出现在 'russia' 和 'eastern-europe'
validateMappings([
  { id: 'russia', name: '俄罗斯', countryIds: ['643'] },
  { id: 'eastern-europe', name: '东欧', countryIds: ['616', '643', '804'] }
], countries);

// Output:
{
  valid: false,
  errors: [{
    type: 'DUPLICATE_COUNTRY',
    countryId: '643',
    message: 'Country ID "643" is assigned to multiple regions: ["russia", "eastern-europe"]'
  }],
  // ...
}
```

#### Rule 4: 非空映射

**错误类型**: `EMPTY_MAPPING`

**触发条件**: 
- `mapping.countryIds` 为空数组

**示例**:
```typescript
// Input: 'china' 的 countryIds 为空
validateMappings([
  { id: 'china', name: '中国', countryIds: [] }
], countries);

// Output:
{
  valid: false,
  errors: [{
    type: 'EMPTY_MAPPING',
    regionId: 'china',
    message: 'Region "china" has no country IDs assigned'
  }],
  // ...
}
```

#### Rule 5: 区域平衡性（警告级别）

**警告类型**: `LARGE_REGION` / `SMALL_REGION` / `IMBALANCED_DISTRIBUTION`

**触发条件**: 
- `LARGE_REGION`: `countryIds.length > 7`
- `SMALL_REGION`: `countryIds.length = 1` 且该 region 不是预期的单国 region（如 'china', 'india'）
- `IMBALANCED_DISTRIBUTION`: 最大 region 的国家数 > 最小 region 的国家数 × 5

**示例**:
```typescript
// Input: 'western-europe' 包含 10 个国家（过多）
validateMappings([
  { id: 'western-europe', name: '西欧', countryIds: ['250', '276', '380', '528', '56', '442', '724', '620', '705', '191'] }
], countries);

// Output:
{
  valid: true, // 警告不影响 valid
  errors: [],
  warnings: [{
    type: 'LARGE_REGION',
    regionId: 'western-europe',
    message: 'Region "western-europe" contains 10 countries, which is above average (recommended: 1-7)',
    suggestion: 'Consider splitting into smaller regions for game balance'
  }],
  // ...
}
```

### 性能保证 (Performance Guarantees)

1. 验证操作必须在 **O(n + m)** 时间内完成，其中 n = mappings.length, m = countries.length
2. 对于典型输入（15 个 mappings, 193 个 countries），验证时间不超过 **10ms**
3. 内存使用不超过 **1MB**

### 错误处理 (Error Handling)

1. 如果 `mappings` 或 `countries` 为 `null` 或 `undefined`，抛出 `TypeError`
2. 如果 `mappings` 或 `countries` 为空数组，返回 `ValidationResult` 并设置相应错误
3. 如果某个 `RegionMapping` 结构不完整（缺少必填字段），记录 `INVALID_STRUCTURE` 错误

---

## Contract 2: mapRegionToCountries

### 签名

```typescript
function mapRegionToCountries(
  regionId: string,
  mappings: RegionMapping[]
): string[]
```

### 前置条件 (Preconditions)

1. `regionId` 必须是非空字符串
2. `mappings` 必须是有效的 `RegionMapping` 数组（已通过 `validateMappings`）

### 后置条件 (Postconditions)

1. 返回的数组包含该 `regionId` 对应的所有 `countryIds`
2. 如果 `regionId` 不存在于 `mappings` 中，返回空数组 `[]`
3. 返回的数组不包含重复元素

### 行为规范 (Behavior Specification)

**场景 1: 正常映射**
```typescript
// Given
const mappings = [
  { id: 'china', name: '中国', countryIds: ['156'] }
];

// When
const result = mapRegionToCountries('china', mappings);

// Then
expect(result).toEqual(['156']);
```

**场景 2: Region 不存在**
```typescript
// Given
const mappings = [
  { id: 'china', name: '中国', countryIds: ['156'] }
];

// When
const result = mapRegionToCountries('invalid-region', mappings);

// Then
expect(result).toEqual([]);
// 应该记录警告日志: "⚠️  Region 'invalid-region' not found in mappings"
```

**场景 3: 多国 Region**
```typescript
// Given
const mappings = [
  { id: 'western-europe', name: '西欧', countryIds: ['250', '276', '380'] }
];

// When
const result = mapRegionToCountries('western-europe', mappings);

// Then
expect(result).toEqual(['250', '276', '380']);
```

### 性能保证 (Performance Guarantees)

1. 查找操作必须在 **O(1)** 或 **O(log n)** 时间内完成（使用 Map 缓存）
2. 对于典型输入，查找时间不超过 **1ms**

---

## Contract 3: mapCommandersToCountries

### 签名

```typescript
function mapCommandersToCountries(
  commanders: HistoricalCommander[],
  mappings: RegionMapping[],
  countries: Country[]
): CountryMappingResult
```

### 前置条件 (Preconditions)

1. `commanders` 必须是非空数组
2. `mappings` 必须通过 `validateMappings` 验证
3. `countries` 必须是非空数组
4. 每个 `commander.controlledTerritories` 包含的是 region IDs

### 后置条件 (Postconditions)

1. 返回的 `CountryMappingResult.mappedCountries` 是一个 Map
2. Map 的 key 是 country IDs，value 是 `MappedCountry`
3. 每个 `MappedCountry.ownerId` 必须对应一个有效的 commander
4. `stats.successfulMappings` 等于 `mappedCountries.size`
5. `stats.totalRegions` 等于所有 commanders 的 `controlledTerritories` 总和

### 行为规范 (Behavior Specification)

**场景 1: 单指挥官单国**
```typescript
// Given
const commanders = [
  { id: 'qin', name: '秦始皇', controlledTerritories: ['china'], ... }
];
const mappings = [
  { id: 'china', name: '中国', countryIds: ['156'] }
];

// When
const result = mapCommandersToCountries(commanders, mappings, countries);

// Then
expect(result.mappedCountries.get('156')).toEqual({
  countryId: '156',
  countryName: '中国',
  regionId: 'china',
  regionName: '中国',
  ownerId: 'qin',
  ownerName: '秦始皇'
});
expect(result.stats.successfulMappings).toBe(1);
```

**场景 2: 多指挥官多国**
```typescript
// Given
const commanders = [
  { id: 'qin', name: '秦始皇', controlledTerritories: ['china'] },
  { id: 'napoleon', name: '拿破仑', controlledTerritories: ['western-europe'] }
];
const mappings = [
  { id: 'china', countryIds: ['156'] },
  { id: 'western-europe', countryIds: ['250', '276'] }
];

// When
const result = mapCommandersToCountries(commanders, mappings, countries);

// Then
expect(result.mappedCountries.size).toBe(3); // 156, 250, 276
expect(result.mappedCountries.get('156')?.ownerId).toBe('qin');
expect(result.mappedCountries.get('250')?.ownerId).toBe('napoleon');
expect(result.mappedCountries.get('276')?.ownerId).toBe('napoleon');
```

**场景 3: 部分映射失败**
```typescript
// Given
const commanders = [
  { id: 'qin', controlledTerritories: ['china', 'invalid-region'] }
];
const mappings = [
  { id: 'china', countryIds: ['156'] }
  // 缺少 'invalid-region'
];

// When
const result = mapCommandersToCountries(commanders, mappings, countries);

// Then
expect(result.mappedCountries.size).toBe(1); // 只映射了 china
expect(result.unmappedRegions).toContain('invalid-region');
expect(result.warnings).toContainEqual(
  expect.stringContaining('Region "invalid-region" not found in mappings')
);
expect(result.stats.failedMappings).toBe(1);
```

### 性能保证 (Performance Guarantees)

1. 映射操作必须在 **O(C × R × N)** 时间内完成，其中 C = commanders.length, R = avg regions per commander, N = avg countries per region
2. 对于典型输入（10 commanders, 2 regions/commander, 3 countries/region），映射时间不超过 **50ms**
3. 内存使用不超过 **5MB**

---

## Test Coverage Requirements

### 单元测试

1. **validateMappings**:
   - ✓ 所有验证规则（Rule 1-5）各至少 2 个测试用例（正常 + 异常）
   - ✓ 边界情况：空数组、单个映射、大量映射（100+）
   - ✓ 性能测试：验证 193 个国家的映射表不超过 10ms

2. **mapRegionToCountries**:
   - ✓ 正常映射、Region 不存在、多国 Region
   - ✓ 边界情况：空字符串、特殊字符、超长字符串
   - ✓ 性能测试：1000 次查找不超过 10ms

3. **mapCommandersToCountries**:
   - ✓ 单指挥官单国、多指挥官多国、部分映射失败
   - ✓ 边界情况：无指挥官、指挥官无领土、所有映射失败
   - ✓ 性能测试：10 指挥官 × 3 region × 3 country 不超过 50ms

### 集成测试

1. **WorldScene 初始化**:
   - ✓ 验证所有指挥官的 `controlledTerritories` 正确转换为 country IDs
   - ✓ 验证 `territoryStates` Map 的 key 都是有效的 country IDs
   - ✓ 验证每个 `territoryState.ownerId` 对应一个有效的 commander

### E2E 测试

1. **国家对齐验证**:
   - ✓ 测试至少 10 个关键国家的名称与位置匹配
   - ✓ 测试点击国家后详情面板显示正确信息
   - ✓ 测试指挥官详情面板显示正确的国家列表

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2025-11-30 | Initial contract definition |

---

## References

- [data-model.md](../data-model.md) - 数据模型定义
- [regionMapping.schema.json](./regionMapping.schema.json) - JSON Schema
- [research.md](../research.md) - 技术决策依据

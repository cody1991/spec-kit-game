# Research: 国家与地图精准对齐

**Feature**: 003-country-map-alignment  
**Date**: 2025-11-30  
**Status**: Complete

## Purpose

本研究文档旨在解决在实施"国家与地图精准对齐"功能时遇到的技术选择和最佳实践问题，确保所有 NEEDS CLARIFICATION 项都有明确的答案。

---

## Research Topic 1: 地图数据格式与国家 ID 标准

### 背景

当前项目使用 TopoJSON 格式的世界地图数据（`world-countries.json`），需要确定：

1. 地图数据中使用的国家 ID 标准是什么？
2. 如何将旧的 region IDs（如 'china', 'russia'）映射到地图数据中的国家 IDs？

### 调研结果

**地图数据格式**:

- 文件类型：TopoJSON (拓扑优化的 GeoJSON)
- 解析库：`topojson-client` 3.1.0
- 数据结构：包含 `countries` 对象层，每个国家是一个 Feature

**国家 ID 标准**:

- 使用 **ISO 3166-1 numeric codes**（三位数字字符串）
- 示例：中国 = '156', 美国 = '840', 法国 = '250', 俄罗斯 = '643'
- 参考资料：[ISO 3166-1 Official List](https://www.iso.org/iso-3166-country-codes.html)

**验证方法**:
通过分析 `MapDataLoader.ts` 的实现，确认地图数据解析流程：

```typescript
// TopoJSON -> GeoJSON Features -> Country entities
const featureCollection = topojson.feature(topoData, topoData.objects.countries);
// feature.id 即为 ISO 3166-1 numeric code (string)
```

**决策**:
使用 ISO 3166-1 numeric codes 作为统一的国家标识符，建立从旧 region IDs 到 ISO codes 的映射表。

**Rationale**:

- ISO 3166-1 是国际标准，稳定且广泛支持
- 地图数据已使用此标准，无需转换
- numeric codes 可直接作为字符串键使用（TypeScript 兼容）

**Alternatives Considered**:

- ❌ ISO 3166-1 alpha-2 codes (如 'CN', 'US'): 地图数据未使用，需额外转换
- ❌ ISO 3166-1 alpha-3 codes (如 'CHN', 'USA'): 规格说明中提到，但实际数据未使用
- ❌ 自定义 slug (如 'china', 'united-states'): 不标准，维护成本高

---

## Research Topic 2: Region-to-Country 映射策略

### 背景

旧系统使用 15 个地理区域 ID（如 'china', 'western-europe', 'russia'），新系统需要映射到具体的国家。需要确定：

1. 如何划分区域到国家的映射关系？
2. 一个 region 对应多个国家时，如何处理？
3. 映射配置应该如何组织和维护？

### 调研结果

**当前代码中的映射逻辑**:
分析 `WorldScene.ts` 的 `regionCountryMap`（第171-186行）：

```typescript
const regionCountryMap: Record<string, string[]> = {
  'western-europe': ['250', '276', '380', '528', '56', '442'],
  'eastern-europe': ['616', '643', '804'],
  russia: ['643'],
  china: ['156'],
  // ... 等等
};
```

**问题识别**:

1. 部分映射可能不准确（例如 'russia' 只映射到 '643'，但俄罗斯可能跨多个区域）
2. 映射关系硬编码在 `WorldScene.ts` 中，不便维护
3. 缺少验证逻辑，无法检测无效的 country IDs

**决策**:
采用配置化映射表 + 验证机制：

1. 创建独立的 `regionMapping.config.ts` 文件
2. 使用 TypeScript 类型确保编译时安全
3. 添加运行时验证逻辑，检查 country IDs 是否存在于地图数据中
4. 支持一对多映射（一个 region 可包含多个国家）

**映射原则**:

- **地理准确性**: 基于真实的地理位置划分（如 'western-europe' 包含法德意等西欧国家）
- **游戏平衡性**: 每个 region 的国家数量应大致均衡（避免某个指挥官占领过多国家）
- **历史合理性**: 指挥官的起始 region 应与其历史背景相符（如秦始皇 → 'china'）

**配置文件结构**:

```typescript
// app/src/config/regionMapping.config.ts
export interface RegionMapping {
  id: string; // 旧 region ID
  name: string; // 区域名称（显示用）
  countryIds: string[]; // ISO 3166-1 numeric codes
  description?: string; // 地理范围说明
}

export const REGION_COUNTRY_MAPPINGS: RegionMapping[] = [
  {
    id: 'china',
    name: '中国',
    countryIds: ['156'], // China
    description: '东亚地区，中华人民共和国',
  },
  {
    id: 'western-europe',
    name: '西欧',
    countryIds: ['250', '276', '380', '528', '56', '442', '724'],
    // France, Germany, Italy, Netherlands, Belgium, Luxembourg, Spain
    description: '西欧地区，包括法国、德国、意大利等主要国家',
  },
  // ... 等等
];
```

**Rationale**:

- 配置化：便于维护和测试，无需修改业务逻辑
- 类型安全：编译时检查，减少运行时错误
- 可验证：支持自动化测试，确保映射准确性
- 可扩展：未来添加新 region 或调整映射关系无需重构

**Alternatives Considered**:

- ❌ JSON 配置文件：缺少类型检查，容易出错
- ❌ 数据库存储：过度设计，本项目为客户端应用，无需后端
- ❌ 保持硬编码：不便维护，违反单一职责原则

---

## Research Topic 3: 验证和测试策略

### 背景

映射逻辑是关键数据转换，需要 100% 准确性。需要确定：

1. 如何验证映射配置的正确性？
2. 如何测试映射逻辑？
3. 如何在 E2E 测试中验证用户可见的结果？

### 调研结果

**验证策略**:

1. **编译时验证（TypeScript）**:

```typescript
// 使用 const assertion 和 readonly 确保不可变性
export const REGION_COUNTRY_MAPPINGS = [
  { id: 'china', countryIds: ['156'] },
  // ...
] as const satisfies readonly RegionMapping[];
```

2. **运行时验证（Validator）**:

```typescript
// app/src/core/validation/mappingValidator.ts
export class MappingValidator {
  validate(mappings: RegionMapping[], countries: Country[]): ValidationResult {
    // 检查 1: 所有 countryIds 是否存在于 countries 中
    // 检查 2: 是否有重复的 countryIds（一个国家不能同时属于两个 region）
    // 检查 3: 是否有未映射的 region IDs
    // 返回: { valid: boolean, errors: string[], warnings: string[] }
  }
}
```

3. **启动时验证**:
   在 `WorldScene.create()` 中调用验证器：

```typescript
const validator = new MappingValidator();
const result = validator.validate(REGION_COUNTRY_MAPPINGS, this.countries);
if (!result.valid) {
  console.error('❌ Mapping validation failed:', result.errors);
}
```

**测试策略**:

**单元测试（Vitest）**:

```typescript
// tests/unit/config/regionMapping.test.ts
describe('regionMapping.config', () => {
  it('should have valid ISO 3166-1 country codes', () => {
    // 验证所有 countryIds 都是3位数字字符串
  });

  it('should not have duplicate country assignments', () => {
    // 验证没有国家被分配到多个 region
  });

  it('should cover all expected regions', () => {
    // 验证包含所有15个旧 region IDs
  });
});

// tests/unit/scenes/world/countryMapper.test.ts
describe('countryMapper', () => {
  it('should map region IDs to country IDs correctly', () => {
    const result = mapRegionToCountries('china');
    expect(result).toEqual(['156']);
  });

  it('should handle invalid region IDs gracefully', () => {
    const result = mapRegionToCountries('invalid-region');
    expect(result).toEqual([]);
    // 应该记录警告日志
  });
});
```

**集成测试（Vitest）**:

```typescript
// tests/integration/worldScene.test.ts
describe('WorldScene mapping integration', () => {
  it('should initialize commanders with correct country mappings', async () => {
    const scene = new WorldScene();
    await scene.preload();
    scene.create();

    const state = useGameStore.getState();
    const qinCommander = state.commanders.find((c) => c.id === 'qin-shi-huang');

    // 验证秦始皇占领的国家确实是中国（156）
    const territories = Array.from(state.territoryStates.entries()).filter(
      ([_, ts]) => ts.ownerId === qinCommander.id
    );

    expect(territories).toContainEqual(['156', expect.any(Object)]);
  });
});
```

**E2E 测试（Playwright）**:

```typescript
// tests/e2e/us1-country-alignment.spec.ts
test('秦始皇占领的国家名称与地图位置匹配', async ({ page }) => {
  await page.goto('http://localhost:5173');
  await page.click('button:has-text("开始征服")');

  // 等待地图加载
  await page.waitForSelector('canvas', { state: 'visible' });

  // 获取秦始皇的颜色
  const qinColor = await page.evaluate(() => {
    const commander = window.__gameStore.getState().commanders.find((c) => c.name === '秦始皇');
    return window.__gameStore.getState().colorMappings.get(commander.id).primary;
  });

  // 点击中国区域（使用预定义的坐标，对应东亚地理位置）
  await page.click('canvas', { position: { x: 800, y: 300 } });

  // 验证弹出的详情面板显示"中国"和"秦始皇"
  await expect(page.locator('.country-detail-panel')).toContainText('中国');
  await expect(page.locator('.country-detail-panel')).toContainText('秦始皇');
});
```

**决策**:
采用三层测试策略（单元 + 集成 + E2E），结合编译时和运行时验证，确保映射准确性。

**Rationale**:

- 多层验证：编译时捕获类型错误，运行时捕获逻辑错误，测试验证最终结果
- 测试金字塔：单元测试快速覆盖核心逻辑，E2E 测试验证用户体验
- 自动化：所有验证在 CI 中自动运行，阻止错误代码合并

**Alternatives Considered**:

- ❌ 仅依赖手动测试：容易遗漏，无法保证长期质量
- ❌ 仅依赖单元测试：无法验证集成效果和用户可见结果
- ❌ 仅依赖 E2E 测试：执行慢，反馈周期长，调试困难

---

## Research Topic 4: 性能优化策略

### 背景

映射逻辑会在游戏启动时执行，需要确保不影响性能。需要确定：

1. 映射操作的时间复杂度是多少？
2. 是否需要缓存或优化？
3. 如何测量和监控性能？

### 调研结果

**性能分析**:

**操作规模**:

- 10 位指挥官
- 每位指挥官平均 1-3 个 regions
- 每个 region 平均 1-5 个国家
- 总映射操作：10 × 2 × 3 = 60 次查找

**时间复杂度**:

```typescript
// 基础映射逻辑（无优化）
commanders.forEach(commander => {              // O(C) = O(10)
  commander.controlledTerritories.forEach(regionId => {  // O(R) = O(2)
    const countryIds = regionCountryMap[regionId];       // O(1) - 对象查找
    countryIds.forEach(countryId => {          // O(N) = O(3)
      territoryStates.set(countryId, {...});   // O(1) - Map 插入
    });
  });
});
// 总复杂度: O(C × R × N) = O(10 × 2 × 3) = O(60) ≈ O(1)
```

**基准测试**:

```typescript
// 使用 performance.mark/measure
performance.mark('mapping-start');
mapCountriesToCommanders();
performance.mark('mapping-end');
performance.measure('mapping-duration', 'mapping-start', 'mapping-end');

const duration = performance.getEntriesByName('mapping-duration')[0].duration;
console.log(`⏱️  Mapping completed in ${duration.toFixed(2)}ms`);
```

**优化策略**:

1. **预处理映射表**（启动时一次性转换）:

```typescript
// 将 array-based mapping 转换为 Map，提高查找效率
const regionCountryMapCache = new Map<string, string[]>(
  REGION_COUNTRY_MAPPINGS.map((m) => [m.id, m.countryIds])
);
```

2. **避免重复验证**:

```typescript
// 验证只在开发模式下执行，生产环境跳过
if (process.env.NODE_ENV === 'development') {
  validator.validate(REGION_COUNTRY_MAPPINGS, countries);
}
```

3. **批量更新状态**:

```typescript
// 使用 Zustand 的批量更新，减少重渲染
const territoryStates = new Map<string, TerritoryState>();
// ... 填充 territoryStates ...
state.setTerritoryStates(territoryStates); // 一次性更新
```

**决策**:
当前规模下（60次操作）无需复杂优化，采用基本的预处理策略即可。重点是测量和监控，确保性能预算达标（< 50ms）。

**Rationale**:

- 规模小：60次操作，现代浏览器可在毫秒级完成
- 一次性操作：仅在游戏启动时执行，非热路径
- 过早优化：当前性能已满足需求，复杂优化反而降低可维护性

**Alternatives Considered**:

- ❌ Web Worker 并行处理：过度设计，通信开销大于收益
- ❌ 预编译映射表到 JSON：增加构建复杂度，收益有限
- ❌ Lazy loading 映射表：增加代码复杂度，无实际性能提升

---

## Research Topic 5: 错误处理与降级策略

### 背景

映射过程可能遇到各种错误（配置缺失、数据不匹配等），需要确定：

1. 如何处理映射错误？
2. 如何确保游戏在部分映射失败时仍能运行？
3. 如何向用户和开发者提供有用的错误信息？

### 调研结果

**错误场景分类**:

1. **配置错误**（开发时错误）:
   - Region ID 在映射表中不存在
   - Country ID 格式无效（非3位数字字符串）
   - 重复的 country IDs（一个国家分配到多个 region）

2. **数据不匹配**（运行时错误）:
   - Country ID 在地图数据中不存在（配置与数据不一致）
   - 地图数据加载失败
   - 指挥官数据损坏

3. **用户环境问题**:
   - 网络错误导致地图数据加载失败
   - 浏览器不支持必要的 API（IndexedDB, Canvas）

**错误处理策略**:

**1. 配置错误（编译时 + 单元测试捕获）**:

```typescript
// TypeScript 类型确保编译时安全
const VALID_REGION_IDS = ['china', 'russia', 'western-europe' /* ... */] as const;

type RegionId = (typeof VALID_REGION_IDS)[number];

// 单元测试验证配置完整性
test('all region IDs should be mapped', () => {
  const mappedIds = REGION_COUNTRY_MAPPINGS.map((m) => m.id);
  VALID_REGION_IDS.forEach((id) => {
    expect(mappedIds).toContain(id);
  });
});
```

**2. 数据不匹配（运行时警告 + 降级）**:

```typescript
// 验证 country IDs 是否存在于地图数据中
function validateCountryIds(countryIds: string[], countries: Country[]): string[] {
  const validIds = new Set(countries.map((c) => c.id));
  const invalidIds: string[] = [];

  const validCountryIds = countryIds.filter((id) => {
    if (validIds.has(id)) {
      return true;
    } else {
      invalidIds.push(id);
      console.warn(`⚠️  Country ID '${id}' not found in map data, skipping`);
      return false;
    }
  });

  if (invalidIds.length > 0) {
    console.error(`❌ Invalid country IDs detected: [${invalidIds.join(', ')}]`);
  }

  return validCountryIds;
}
```

**3. 用户环境问题（降级 + 用户提示）**:

```typescript
// 降级策略：地图数据加载失败 → 使用简化地图 → 使用旧 region 系统
try {
  countries = await loadMapData('/maps/world-countries.json');
} catch (error) {
  console.warn('Failed to load full map, trying simplified version...');
  try {
    countries = await loadMapData('/maps/world-countries-simplified.json');
  } catch (fallbackError) {
    console.error('Failed to load any map data, using old region system');
    // 使用旧的 territory-based 渲染（现有代码已支持）
    useOldRegionSystem = true;
  }
}
```

**错误日志规范**:

```typescript
// 日志级别：ERROR（阻止功能） > WARN（降级运行） > INFO（正常） > DEBUG（详细）
console.error('❌ Critical error:', { error, context }); // 功能无法运行
console.warn('⚠️  Warning:', { issue, fallback }); // 降级处理
console.log('✅ Success:', { stats }); // 正常完成
console.debug('🔍 Debug:', { details }); // 开发调试
```

**决策**:
采用分层错误处理（编译时 + 运行时 + 降级），确保游戏在部分映射失败时仍能运行，同时提供清晰的错误信息帮助开发者快速定位问题。

**Rationale**:

- 防御性编程：假设配置和数据可能不匹配，提前处理
- 用户优先：即使部分功能失败，游戏仍可继续（降级到旧系统）
- 开发者友好：清晰的错误日志和验证报告，便于问题排查

**Alternatives Considered**:

- ❌ Fail-fast（遇到错误立即崩溃）：用户体验差，不适合客户端应用
- ❌ 静默忽略错误：难以调试，可能导致数据不一致
- ❌ 复杂的错误恢复机制：过度设计，增加维护成本

---

## Summary of Decisions

| 主题             | 决策                              | Rationale                          |
| ---------------- | --------------------------------- | ---------------------------------- |
| **国家 ID 标准** | ISO 3166-1 numeric codes (string) | 地图数据已使用，国际标准，无需转换 |
| **映射配置**     | 独立的 TypeScript 配置文件        | 类型安全，便于维护，支持验证和测试 |
| **验证策略**     | 编译时 + 运行时 + 自动化测试      | 多层防护，早期发现错误，确保准确性 |
| **性能优化**     | 基本预处理 + 性能监控             | 当前规模无需复杂优化，重点是测量   |
| **错误处理**     | 分层处理 + 降级策略               | 防御性编程，确保游戏可运行性       |

---

## Next Steps

研究完成，所有 NEEDS CLARIFICATION 已解决。可以进入 Phase 1: Design & Contracts。

**后续任务**:

1. 创建 `data-model.md`（定义 RegionMapping, ValidationResult 等数据模型）
2. 创建 `contracts/` 目录（定义映射配置 schema 和验证契约）
3. 创建 `quickstart.md`（开发者快速上手指南）
4. 更新 agent context（运行 `.specify/scripts/bash/update-agent-context.sh`）

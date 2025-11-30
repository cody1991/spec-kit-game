# 核心重构：移除区域概念，统一使用国家级数据

**日期**: 2025-11-30  
**分支**: 002-country-battle-logic  
**目标**: 解决战斗系统与地图渲染脱节的根本问题

## 问题诊断

### 原始架构问题

系统存在两套并行的领土系统，导致战斗更新无法反映到地图上：

1. **旧系统（游戏逻辑层）**
   - `mapData.ts`的`createTerritories()`生成15个区域Territory
   - Territory ID：`western-europe`, `north-america`, `china`等
   - `battleSystem`使用这些区域ID调用`updateTerritory()`

2. **新系统（地图渲染层）**
   - `WorldScene`从`world-countries.json`加载真实国家数据
   - Country ID：ISO 3166-1数字码（`840`=美国, `156`=中国）
   - `mapRenderer`订阅国家ID的`territoryStates`

3. **脱节现象**
   - 战斗系统更新区域ID（如`north-america`）
   - 地图渲染监听国家ID（如`840`, `124`）
   - 结果：战斗胜利后地图不更新，占领无效果

### 根本原因

**Territory.id与Country.id类型不一致**：
- Territory使用旧的区域字符串ID
- Country使用ISO标准数字字符串ID
- 中间层的`regionMapping`试图桥接，但只在初始化时有效
- 运行时战斗系统仍在操作区域ID，与地图完全脱节

## 解决方案

### 核心策略

**彻底移除区域概念，让Territory.id直接使用Country.id**

```
旧架构：
createInitialWorld() 
  → createTerritories() (生成区域Territory)
    → Territory.id = 'western-europe'
      → battleSystem.updateTerritory('western-europe')
        → store更新区域ID
          ❌ 地图无法找到对应国家

新架构：
createInitialWorld(countries: Country[]) 
  → 从真实国家数据创建Territory
    → Territory.id = '840' (美国ISO码)
      → battleSystem.updateTerritory('840')
        → store更新国家ID
          ✅ 地图直接渲染对应国家
```

### 实施步骤

#### 1. 重构 `createInitialWorld.ts`

**修改前**:
```typescript
export function createInitialWorld(options: InitialWorldOptions) {
  const territories: Territory[] = createTerritories(); // 生成15个区域
  // Territory.id = 'western-europe', 'china' 等
}
```

**修改后**:
```typescript
export interface InitialWorldOptions {
  seed: number;
  commanderCount?: number;
  countries: Country[]; // 新增：需要真实国家数据
}

export function createInitialWorld(options: InitialWorldOptions) {
  const { countries } = options;
  
  // 从国家数据创建Territory
  const territories: Territory[] = countries.map((country) => ({
    id: country.id, // 使用国家ID（如'840'）而非区域ID
    name: country.name,
    adjacentIds: country.neighbors || [],
    // ... 其他字段
  }));
  
  // 区域映射仅用于指挥官起始位置分配
  const regionCountryIds = getCountryIdsByRegion(commander.originRegion);
  const startTerritory = getRandomCountryFromRegion(territories, regionCountryIds, seed);
}
```

**关键变化**:
- Territory.id现在是国家ISO数字码（如`'840'`, `'156'`）
- 区域映射降级为"初始化辅助工具"，仅用于将指挥官的`originRegion`转换为具体国家列表
- `controlledTerritories`直接存储国家ID

#### 2. 更新 `startSession.ts`

**修改前**:
```typescript
export function startSession(seed?: string): void {
  const { commanders, territories } = createInitialWorld({ seed, commanderCount: 30 });
  
  // 创建territoryStates（但与territories脱节）
  const territoryStates = new Map();
  // ...
}
```

**修改后**:
```typescript
export function startSession(seed?: string, countries?: Country[]): void {
  if (!countries || countries.length === 0) {
    console.warn('Countries data not provided, deferring world creation');
    return;
  }

  const { commanders, territories } = createInitialWorld({
    seed: numericSeed,
    commanderCount: 30,
    countries, // 传入国家数据
  });

  // 现在Territory.id就是国家ID，直接创建territoryStates
  const territoryStates = new Map();
  territories.forEach((territory) => {
    if (territory.ownerId) {
      const country = countries.find(c => c.id === territory.id);
      territoryStates.set(territory.id, {
        countryId: territory.id, // 现在是真实的国家ID
        countryName: country?.name || territory.name,
        ownerId: territory.ownerId,
        // ...
      });
    }
  });
}
```

#### 3. 重构 `WorldScene.ts`

**新增方法**：
```typescript
private initializeGameWorldIfNeeded(): void {
  const store = useGameStore.getState();
  const { gameStarted, seed, commanders, territories } = store;

  // 检查是否仍在使用旧区域系统
  const needsInit = gameStarted && 
                    this.countries.length > 0 &&
                    this.isUsingOldRegionSystem(territories);

  if (needsInit) {
    // 使用真实国家数据重新启动会话
    startSession(seed, this.countries);
  }
}

private isUsingOldRegionSystem(territories: Territory[]): boolean {
  if (territories.length === 0) return false;
  
  const sampleId = territories[0].id;
  // 旧系统使用'western-europe'，新系统使用'840'
  const isOldSystem = sampleId.includes('-') || isNaN(Number(sampleId));
  
  return isOldSystem;
}
```

**简化 `mapCountriesToCommanders`**：
```typescript
// 修改前：需要复杂的区域→国家映射
private mapCountriesToCommanders(): void {
  const regionCountryMap = createRegionCountryMap();
  commanders.forEach((commander) => {
    commander.controlledTerritories.forEach((regionId) => {
      const countryIds = regionCountryMap.get(regionId); // 区域→国家转换
      // ...
    });
  });
}

// 修改后：直接同步即可
private mapCountriesToCommanders(): void {
  // commanders.controlledTerritories已经是国家ID，直接同步
  territories.forEach((territory) => {
    if (territory.ownerId) {
      territoryStates.set(territory.id, { /* ... */ });
    }
  });
}
```

#### 4. 更新测试

修改 `tests/unit/core/generation.spec.ts`，提供mock国家数据：

```typescript
const mockCountries: Country[] = [
  { id: '840', name: '美国', nameEn: 'United States', /* ... */ },
  { id: '156', name: '中国', nameEn: 'China', /* ... */ },
  // ... 更多国家
];

it('领土ID应该是国家ID而非区域ID', () => {
  const { territories } = createInitialWorld({ 
    seed: 12345, 
    commanderCount: 5,
    countries: mockCountries 
  });

  territories.forEach((t) => {
    expect(t.id).toMatch(/^\d+$/); // 只包含数字
    expect(t.id.includes('-')).toBe(false); // 不包含连字符
  });
});
```

## 测试结果

### 单元测试

✅ **generation.spec.ts** (8/8 通过)
- Territory ID现在是国家ISO码：`'356'`, `'276'`, `'643'`
- 指挥官的`controlledTerritories`包含国家ID
- 创建世界基于真实国家数据

✅ **store.countryOwnership.spec.ts** (2/2 通过)
- 单国更新不会批量占领
- 区域ID不再触发特殊处理

### 构建测试

✅ **TypeScript编译**: 无错误  
✅ **Vite构建**: 成功（4.12s）  
✅ **开发服务器**: 正常启动（http://localhost:5176）

## 数据流对比

### 修改前（区域系统）

```
指挥官初始化
  └─> originRegion: 'americas'
      └─> controlledTerritories: ['north-america']
          └─> battleSystem.updateTerritory('north-america')
              └─> store.territoryStates.set('north-america', {...})
                  ❌ WorldScene查找Country.id='840'无匹配
```

### 修改后（国家系统）

```
指挥官初始化
  └─> originRegion: 'americas' (仅用于选择初始国家)
      └─> regionMapping: ['840', '124'] (美国、加拿大)
          └─> controlledTerritories: ['840']
              └─> battleSystem.updateTerritory('840')
                  └─> store.territoryStates.set('840', {...})
                      ✅ WorldScene查找Country.id='840'精确匹配
```

## 影响范围

### 核心模块

- ✅ `app/src/core/generation/createInitialWorld.ts` - 完全重构
- ✅ `app/src/core/session/startSession.ts` - 新增countries参数
- ✅ `app/src/scenes/world/WorldScene.ts` - 新增自动重初始化逻辑
- ✅ `tests/unit/core/generation.spec.ts` - 新增mock国家数据

### 数据流

1. **初始化流程**
   ```
   StartScreen点击"开始" 
     → startSession()（暂存seed） 
     → WorldScene.loadMapDataAsync() 
     → countries加载完成 
     → initializeGameWorldIfNeeded() 
     → startSession(seed, countries) 重新初始化
     → createInitialWorld基于真实国家创建Territory
   ```

2. **战斗流程**
   ```
   battleSystem.executeBattle()
     → store.updateTerritory(countryId='840')
     → updateTerritoryOwnership处理国家ID
     → territoryStates更新
     → WorldScene订阅变化
     → mapRenderer渲染对应国家（Country.id='840'）
     ✅ 地图正确显示占领
   ```

### 不变部分

- ✅ `Territory`接口定义（仅ID含义变化）
- ✅ `Country`接口和地图数据格式
- ✅ `battleSystem`核心战斗逻辑
- ✅ `store`的状态管理结构
- ✅ React UI组件（仅接收数据不同）

## 区域映射的新角色

### 修改前

- **用途**: 运行时区域→国家批量转换
- **位置**: `mapCountriesToCommanders()`核心逻辑
- **问题**: 战斗系统不知道映射，仍用区域ID

### 修改后

- **用途**: 仅初始化时选择指挥官起始国家
- **位置**: `createInitialWorld()`中的辅助函数
- **收益**: 
  - 运行时完全不依赖区域概念
  - 所有ID统一为国家ISO码
  - 战斗系统和地图渲染直接对接

**保留理由**：
- 指挥官数据仍使用`originRegion`（如拿破仑='europe'）
- 需要将抽象地理区域转换为具体国家列表
- 例：`'americas'` → `['840', '124', '484']`（美国、加拿大、墨西哥）

**代码位置**：
```typescript
// app/src/config/regionMapping.config.ts
export const REGION_COUNTRY_MAPPINGS = [
  { id: 'americas', countryIds: ['840', '124', '484', ...] },
  { id: 'europe', countryIds: ['276', '250', '380', ...] },
  // ... 仅用于初始化
];
```

## 迁移指南

### 如果你的代码使用了区域ID

❌ **错误用法**（已废弃）：
```typescript
// 不要这样做！
const territories = createTerritories(); // 返回区域Territory
battleSystem.updateTerritory('western-europe'); // 区域ID
```

✅ **正确用法**（当前）：
```typescript
// 总是使用国家ID
const countries = await loadCountries();
const { territories } = createInitialWorld({ seed, commanderCount: 30, countries });
battleSystem.updateTerritory('276'); // 国家ID（德国）
```

### 如果你需要区域信息

✅ **使用方式**：
```typescript
// 查询某国家属于哪个区域（仅供显示）
import { REGION_COUNTRY_MAPPINGS } from '@/config/regionMapping.config';

function getRegionForCountry(countryId: string): string | undefined {
  const mapping = REGION_COUNTRY_MAPPINGS.find(m => 
    m.countryIds.includes(countryId)
  );
  return mapping?.id; // 'europe', 'americas'等
}

// 示例：'276' → 'europe'
```

⚠️ **注意**：不要在游戏逻辑中依赖区域进行占领判断！

## 后续优化

### 可选改进

1. **移除mapData.ts**
   - `createTerritories()`和`worldRegions`已废弃
   - 可以完全删除该文件

2. **优化地形推断**
   - 当前`inferTerrain()`使用简化的经纬度规则
   - 可基于实际地理数据或预计算地形映射

3. **邻接关系生成**
   - 当前使用GeoJSON的neighbors字段
   - 可添加动态计算边界接触的算法

4. **性能优化**
   - Territory数量从15个→200+个
   - 考虑使用空间索引加速查询
   - 战斗系统可能需要限制并发战斗数

### 已知限制

1. **地形简化**
   - 所有国家使用推断地形，可能不准确
   - 影响游戏平衡性（地形影响战斗）

2. **邻接关系**
   - 依赖GeoJSON数据质量
   - 可能缺少小国或海峡连接

3. **初始化时序**
   - 需要等待地图加载完成
   - StartScreen到游戏启动有短暂延迟

## 总结

### 核心成就

✅ **统一数据模型**: Territory.id = Country.id (ISO数字码)  
✅ **消除脱节**: 战斗系统更新 → 地图直接渲染  
✅ **简化架构**: 移除运行时区域映射逻辑  
✅ **测试通过**: 单元测试、构建、开发服务器全部正常  

### 技术债务

- ❌ 删除废弃的`mapData.ts`
- ⚠️ 补充更准确的地形数据
- ⚠️ 添加性能监控（200+国家的战斗系统）

### 下一步

按照 `specs/002-country-battle-logic/tasks.md` 继续执行：

- [ ] T014-T015: US2的测试任务（地图按国家展示）
- [ ] T019: 调试HUD显示区域ID残留
- [ ] T020-T021: US3的测试任务（姓名唯一展示）
- [ ] T025-T029: Final Phase（文档、性能、可观测性）

---

**文档版本**: 1.0  
**最后更新**: 2025-11-30  
**维护者**: AI Programming Assistant

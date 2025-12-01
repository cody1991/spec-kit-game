# Research: 势力统计排行榜技术调研

**Feature**: 005-faction-stats  
**Date**: 2025-12-01  
**Status**: Completed

## 调研目标

解决实施计划中的技术未知点，确保统计计算性能、数据准确性和UI响应速度符合规格要求。

## 1. 统计计算算法设计

### 决策：增量更新 + Map存储

**选择理由**:

- 使用 `Map<commanderId, FactionStatistics>` 存储统计数据，O(1)查找和更新
- 采用增量更新而非全量重算：
  - 战斗事件触发时，仅更新涉及的2个势力的战胜/战败计数
  - 领土变更时，仅更新涉及的2个势力的国家数和面积
  - 排序仅在需要显示时执行（懒计算）

**性能分析**:

```typescript
// 增量更新时间复杂度
- 单次战斗更新: O(1) - 仅更新2个势力的计数
- 单次领土变更: O(1) - 仅更新2个势力的领土统计
- 排序: O(n log n) - n为势力数量（最多50个）
- 总体: < 1ms (测试数据：50势力, 200国家)
```

**备选方案及拒绝理由**:

1. **全量重算**: 每次事件都遍历所有战斗记录和领土 → 时间复杂度O(m\*n)，m为战斗数，n为势力数，性能不可接受
2. **数组存储**: 查找势力需要O(n)遍历 → 高频更新场景下性能较差
3. **数据库存储**: 增加复杂度且无持久化需求 → 过度设计

### 实现伪代码

```typescript
// 增量更新示例
function handleBattleResult(event: BattleEvent) {
  const attackerStats = factionStatsMap.get(event.attackerId);
  const defenderStats = factionStatsMap.get(event.defenderId);

  if (event.result === 'success') {
    attackerStats.wins += 1;
    defenderStats.losses += 1;
  } else {
    // 进攻失败，防守成功（不计入战败）
  }

  // 更新胜率
  attackerStats.winRate = attackerStats.wins / (attackerStats.wins + attackerStats.losses);
  defenderStats.winRate = defenderStats.wins / (defenderStats.wins + defenderStats.losses);
}
```

## 2. 战胜/战败计数规则

### 决策：仅统计领土所有权变更的战斗

**定义**:

- **战胜 (Win)**: 进攻成功，导致领土所有权从防守方转移给进攻方
- **战败 (Loss)**: 防守失败，失去领土所有权
- **不计入**:
  - 占领中立领土（无防守方）
  - 进攻失败但防守方未失去领土（这种情况不算战败，因为防守成功）

**战斗事件映射**:

```typescript
// 当前游戏中的战斗事件类型
type BattleEvent = {
  type: 'attack' | 'elimination' | ...;
  result: 'success' | 'fail';
  attackerId: string;
  defenderId?: string;  // 可选，中立领土无防守方
  territoryId: string;
}

// 计数规则
if (event.type === 'attack' && event.defenderId) {
  if (event.result === 'success') {
    // 进攻方战胜 +1
    // 防守方战败 +1
  }
  // 进攻失败不计入任何统计（防守方成功守住不算"战胜"）
}
```

**理由**:

- 符合规格定义（FR-003, FR-004, FR-011）
- 避免中立领土占领膨胀战绩
- 与现有 BattleSystem 的事件定义兼容

## 3. 胜率计算精度

### 决策：使用浮点数存储，显示时保留2位小数

**精度要求**: < 0.1% 误差（规格 SC-007）

**实现方案**:

```typescript
interface FactionStatistics {
  wins: number; // 整数
  losses: number; // 整数
  winRate: number; // 浮点数，范围 [0, 1]
}

// 计算胜率
function calculateWinRate(wins: number, losses: number): number {
  const totalBattles = wins + losses;
  if (totalBattles === 0) return -1; // 特殊值表示 N/A
  return wins / totalBattles;
}

// 显示胜率
function formatWinRate(winRate: number): string {
  if (winRate < 0) return 'N/A';
  return `${(winRate * 100).toFixed(1)}%`; // 例如: 75.5%
}
```

**精度验证**:

- JavaScript Number 是64位双精度浮点数
- 有效数字位数：约15-17位
- 对于战斗次数 < 10000 的场景，精度误差 < 0.001%
- 符合规格要求

**边界情况处理**:

- 总战斗次数 = 0 → 返回 -1，显示为 "N/A"
- 避免除零错误

## 4. 性能优化策略

### 决策：异步计算 + 防抖 + 懒排序

**策略1: 使用 requestIdleCallback 异步计算**

```typescript
function scheduleStatsUpdate(commanderId: string) {
  if ('requestIdleCallback' in window) {
    requestIdleCallback(() => updateFactionStats(commanderId));
  } else {
    // Fallback for browsers without requestIdleCallback
    setTimeout(() => updateFactionStats(commanderId), 0);
  }
}
```

**策略2: 防抖高频事件**

```typescript
import { debounce } from 'lodash-es'; // 或自实现

const debouncedUpdate = debounce((commanderId) => {
  scheduleStatsUpdate(commanderId);
}, 1000); // 最多每1秒更新一次
```

**策略3: 懒排序**

```typescript
// 仅在打开面板或手动刷新时排序
function getLeaderboard(): FactionStatistics[] {
  const stats = Array.from(factionStatsMap.values());
  return stats.sort((a, b) => {
    if (b.countryCount !== a.countryCount) {
      return b.countryCount - a.countryCount; // 主排序：国家数降序
    }
    return b.totalArea - a.totalArea; // 次排序：面积降序
  });
}
```

**策略4: 虚拟列表（降级方案）**

- 当势力数 > 50 时，使用 react-window 或 react-virtual 实现虚拟滚动
- 仅渲染可见区域的列表项

**性能基准**:

- 增量更新: < 1ms
- 排序（50个势力）: < 5ms
- 组件渲染（50个列表项）: < 100ms
- 总体: < 200ms (符合500ms预算)

## 5. 国土面积数据来源

### 决策：从 Country 实体获取 area 属性

**数据来源**:

```typescript
interface Country {
  id: string; // ISO 3166-1 alpha-3
  name: string;
  area: number; // km² (平方公里)
  geometry: MultiPolygon;
  centroid: Point;
  // ...
}

// 计算势力总面积
function calculateTotalArea(commanderId: string, countries: Country[]): number {
  const ownedCountries = territoryStates
    .entries()
    .filter(([_, state]) => state.ownerId === commanderId)
    .map(([countryId, _]) => countries.find((c) => c.id === countryId))
    .filter((c) => c !== undefined);

  return ownedCountries.reduce((sum, country) => sum + country.area, 0);
}
```

**数据可用性**:

- ✅ `Country.area` 已存在于地图数据中
- ✅ 数据类型：number (km²)
- ✅ 覆盖所有国家

**数据更新时机**:

- 领土所有权变更时（Commander.controlledTerritories 变化）
- 使用增量计算：`newArea = oldArea + gainedCountry.area - lostCountry.area`

## 6. UI设计参考

### 决策：表格布局 + 响应式排序

**布局方案**:

```
+----------------------------------------------------------+
| 势力统计排行榜                                    [关闭X] |
+-----+-------------+--------+--------+--------+-----------+
| 排名 | 势力名称    | 国家数 | 面积   | 战胜   | 战败 | 胜率 |
+-----+-------------+--------+--------+--------+-----------+
|  1  | 拿破仑      |   45   | 2.3M   |  120   |  15  | 88.9% |
|  2  | 亚历山大    |   38   | 1.8M   |   95   |  22  | 81.2% |
|  3  | 成吉思汗    |   38   | 2.1M   |  110   |  18  | 85.9% |
| ... |             |        |        |        |      |       |
+-----+-------------+--------+--------+--------+-----------+
```

**交互设计**:

- 点击行 → 展开详情面板（P3功能）
- 高亮最近变化的数据（动画效果）
- 响应式设计：移动端适配

**参考组件**:

- 现有 `CommanderPanel` 的样式风格
- 现有 `BattleTimeline` 的面板布局

**视觉反馈**:

- 数据更新时：淡入动画 + 高亮边框（持续1秒）
- 排名变化：上升↑绿色，下降↓红色

## 7. 测试策略

### 单元测试重点

**统计计算逻辑**:

```typescript
describe('FactionStatsService', () => {
  it('should increment wins when attack succeeds', () => {
    // Given: 初始战胜次数为0
    const stats = createFactionStats(commanderId);

    // When: 进攻成功
    handleBattleResult({ attackerId: commanderId, result: 'success', defenderId: 'enemy1' });

    // Then: 战胜次数+1
    expect(stats.wins).toBe(1);
  });

  it('should calculate win rate correctly', () => {
    const stats = { wins: 7, losses: 3 };
    expect(calculateWinRate(stats.wins, stats.losses)).toBeCloseTo(0.7, 2);
  });

  it('should return N/A for zero battles', () => {
    const stats = { wins: 0, losses: 0 };
    expect(calculateWinRate(stats.wins, stats.losses)).toBe(-1);
    expect(formatWinRate(-1)).toBe('N/A');
  });
});
```

**排序逻辑**:

```typescript
describe('Leaderboard Sorting', () => {
  it('should sort by country count descending', () => {
    const stats = [
      { commanderId: 'a', countryCount: 10, totalArea: 1000 },
      { commanderId: 'b', countryCount: 20, totalArea: 800 },
    ];
    const sorted = sortLeaderboard(stats);
    expect(sorted[0].commanderId).toBe('b'); // 20 > 10
  });

  it('should use area as tiebreaker', () => {
    const stats = [
      { commanderId: 'a', countryCount: 10, totalArea: 800 },
      { commanderId: 'b', countryCount: 10, totalArea: 1000 },
    ];
    const sorted = sortLeaderboard(stats);
    expect(sorted[0].commanderId).toBe('b'); // 1000 > 800
  });
});
```

### 集成测试重点

**事件订阅与更新**:

```typescript
describe('Stats Update Integration', () => {
  it('should update stats when battle event occurs', async () => {
    // Given: 初始状态
    const store = useGameStore.getState();

    // When: 触发战斗事件
    store.addBattleEvent({
      type: 'attack',
      attackerId: 'napoleon',
      defenderId: 'wellington',
      result: 'success',
    });

    // Then: 统计数据更新
    await waitFor(() => {
      const stats = store.factionStats.get('napoleon');
      expect(stats.wins).toBe(1);
    });
  });
});
```

### E2E测试重点

**用户交互流**:

```typescript
test('User can view faction stats leaderboard', async ({ page }) => {
  // 1. 打开游戏
  await page.goto('/');
  await page.click('button:has-text("开始游戏")');

  // 2. 打开统计面板
  await page.keyboard.press('s');

  // 3. 验证排行榜显示
  await expect(page.locator('.faction-stats-panel')).toBeVisible();
  await expect(page.locator('.leaderboard-row')).toHaveCount.greaterThan(0);

  // 4. 验证数据排序
  const firstRow = page.locator('.leaderboard-row').first();
  const firstCountryCount = await firstRow.locator('.country-count').textContent();
  const secondRow = page.locator('.leaderboard-row').nth(1);
  const secondCountryCount = await secondRow.locator('.country-count').textContent();
  expect(parseInt(firstCountryCount)).toBeGreaterThanOrEqual(parseInt(secondCountryCount));
});
```

## 8. 依赖库选择

### 决策：最小化外部依赖

**已有依赖（复用）**:

- React 18 ✅
- TypeScript ✅
- Zustand ✅
- Vitest + React Testing Library ✅
- Playwright ✅

**新增依赖（评估）**:

- ❌ **Lodash**: 不需要，使用原生 Array.sort 和自实现 debounce（更轻量）
- ❌ **React-Window**: 暂不需要，仅在势力数 > 50 时考虑
- ❌ **Chart.js**: P3功能（趋势图），暂不引入
- ✅ **无新增依赖** - 使用现有技术栈即可满足需求

**自实现工具函数**:

```typescript
// 简单 debounce 实现
function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: number | undefined;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait) as any;
  };
}
```

## 总结

所有技术未知点已解决，主要决策如下：

1. **统计算法**: 增量更新 + Map存储，O(1)更新，O(n log n)排序
2. **计数规则**: 仅统计势力间战斗的领土变更，不含中立领土
3. **精度保证**: 浮点数计算，精度 < 0.001%，远超规格要求（< 0.1%）
4. **性能优化**: requestIdleCallback + 防抖1秒 + 懒排序
5. **数据来源**: Country.area 属性，增量计算总面积
6. **UI设计**: 表格布局，响应式排序，视觉反馈
7. **测试策略**: 单元测试（统计+排序）+ 集成测试（事件更新）+ E2E测试（用户流）
8. **依赖管理**: 无新增依赖，复用现有技术栈

**下一步**: Phase 1 - 数据模型设计与API契约定义

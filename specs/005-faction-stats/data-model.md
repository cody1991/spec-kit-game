# Data Model: 势力统计排行榜

**Feature**: 005-faction-stats  
**Date**: 2025-12-01  
**Version**: 1.0.0

## 核心实体

### 1. FactionStatistics (势力统计)

**描述**: 单个势力的综合统计数据，包含领土和战斗信息。

**属性**:

| 属性名        | 类型   | 必需 | 描述                                 | 验证规则                |
| ------------- | ------ | ---- | ------------------------------------ | ----------------------- |
| commanderId   | string | ✅   | 指挥官/势力唯一标识                  | 非空，对应 Commander.id |
| commanderName | string | ✅   | 指挥官名称（冗余字段，优化显示性能） | 非空                    |
| status        | string | ✅   | 势力状态：'active' \| 'eliminated'   | 枚举值                  |
| countryCount  | number | ✅   | 占领的国家数量                       | >= 0                    |
| totalArea     | number | ✅   | 国土总面积（平方公里）               | >= 0                    |
| wins          | number | ✅   | 战胜次数（进攻成功导致领土变更）     | >= 0                    |
| losses        | number | ✅   | 战败次数（防守失败导致失去领土）     | >= 0                    |
| winRate       | number | ✅   | 胜率（0-1之间的浮点数，-1表示N/A）   | -1 \| [0, 1]            |
| rank          | number | ❌   | 当前排名（动态计算，不持久化）       | >= 1                    |
| lastUpdatedAt | number | ✅   | 最后更新时间戳（毫秒）               | > 0                     |

**TypeScript 定义**:

```typescript
interface FactionStatistics {
  commanderId: string;
  commanderName: string;
  status: 'active' | 'eliminated';
  countryCount: number;
  totalArea: number;
  wins: number;
  losses: number;
  winRate: number; // -1 for N/A, otherwise [0, 1]
  lastUpdatedAt: number;
}
```

**状态转换**:

```
[初始化] → Active (countryCount > 0)
Active → Eliminated (countryCount == 0)
Eliminated → [终态] (不可逆)
```

**验证函数**:

```typescript
function validateFactionStats(stats: FactionStatistics): boolean {
  if (!stats.commanderId || !stats.commanderName) return false;
  if (stats.countryCount < 0 || stats.totalArea < 0) return false;
  if (stats.wins < 0 || stats.losses < 0) return false;
  if (stats.winRate !== -1 && (stats.winRate < 0 || stats.winRate > 1)) return false;
  if (!['active', 'eliminated'].includes(stats.status)) return false;
  return true;
}
```

### 2. Leaderboard (排行榜)

**描述**: 势力统计的排序列表，提供全局视图。

**属性**:

| 属性名       | 类型                    | 必需 | 描述                   | 验证规则       |
| ------------ | ----------------------- | ---- | ---------------------- | -------------- |
| factions     | FactionStatistics[]     | ✅   | 势力统计列表（已排序） | 非空数组       |
| timestamp    | number                  | ✅   | 快照时间戳（毫秒）     | > 0            |
| sortCriteria | LeaderboardSortCriteria | ✅   | 排序规则               | 有效的排序规则 |

**TypeScript 定义**:

```typescript
type LeaderboardSortCriteria = {
  primary: 'countryCount'; // 主排序：国家数量
  primaryOrder: 'desc'; // 主排序：降序
  secondary: 'totalArea'; // 次排序：国土面积
  secondaryOrder: 'desc'; // 次排序：降序
};

interface Leaderboard {
  factions: FactionStatistics[];
  timestamp: number;
  sortCriteria: LeaderboardSortCriteria;
}
```

**排序算法**:

```typescript
function sortLeaderboard(stats: FactionStatistics[]): FactionStatistics[] {
  return stats
    .sort((a, b) => {
      // 主排序：国家数量降序
      if (b.countryCount !== a.countryCount) {
        return b.countryCount - a.countryCount;
      }
      // 次排序：国土面积降序
      return b.totalArea - a.totalArea;
    })
    .map((faction, index) => ({
      ...faction,
      rank: index + 1,
    }));
}
```

### 3. BattleStatUpdate (战斗统计更新事件)

**描述**: 内部事件，用于触发战斗统计更新。

**属性**:

| 属性名     | 类型   | 必需 | 描述                          | 验证规则        |
| ---------- | ------ | ---- | ----------------------------- | --------------- |
| attackerId | string | ✅   | 进攻方指挥官ID                | 非空            |
| defenderId | string | ✅   | 防守方指挥官ID                | 非空            |
| result     | string | ✅   | 战斗结果：'success' \| 'fail' | 枚举值          |
| timestamp  | string | ✅   | 战斗时间戳（ISO 8601）        | 有效ISO日期格式 |

**TypeScript 定义**:

```typescript
interface BattleStatUpdate {
  attackerId: string;
  defenderId: string;
  result: 'success' | 'fail';
  timestamp: string; // ISO 8601
}
```

**处理规则**:

```typescript
function handleBattleStatUpdate(event: BattleStatUpdate): void {
  const attackerStats = factionStatsMap.get(event.attackerId);
  const defenderStats = factionStatsMap.get(event.defenderId);

  if (!attackerStats || !defenderStats) return;

  if (event.result === 'success') {
    attackerStats.wins += 1;
    defenderStats.losses += 1;
  }
  // 进攻失败不计入任何统计

  // 重新计算胜率
  attackerStats.winRate = calculateWinRate(attackerStats.wins, attackerStats.losses);
  defenderStats.winRate = calculateWinRate(defenderStats.wins, defenderStats.losses);

  // 更新时间戳
  const now = Date.now();
  attackerStats.lastUpdatedAt = now;
  defenderStats.lastUpdatedAt = now;
}

function calculateWinRate(wins: number, losses: number): number {
  const total = wins + losses;
  return total === 0 ? -1 : wins / total;
}
```

### 4. TerritoryStatUpdate (领土统计更新事件)

**描述**: 内部事件，用于触发领土统计更新。

**属性**:

| 属性名      | 类型   | 必需 | 描述                   | 验证规则 |
| ----------- | ------ | ---- | ---------------------- | -------- |
| commanderId | string | ✅   | 势力ID                 | 非空     |
| countryId   | string | ✅   | 国家ID                 | 非空     |
| action      | string | ✅   | 操作：'gain' \| 'lose' | 枚举值   |
| countryArea | number | ✅   | 国家面积（平方公里）   | >= 0     |

**TypeScript 定义**:

```typescript
interface TerritoryStatUpdate {
  commanderId: string;
  countryId: string;
  action: 'gain' | 'lose';
  countryArea: number;
}
```

**处理规则**:

```typescript
function handleTerritoryStatUpdate(event: TerritoryStatUpdate): void {
  const stats = factionStatsMap.get(event.commanderId);
  if (!stats) return;

  if (event.action === 'gain') {
    stats.countryCount += 1;
    stats.totalArea += event.countryArea;
  } else if (event.action === 'lose') {
    stats.countryCount -= 1;
    stats.totalArea -= event.countryArea;
  }

  // 确保非负
  stats.countryCount = Math.max(0, stats.countryCount);
  stats.totalArea = Math.max(0, stats.totalArea);

  // 更新时间戳
  stats.lastUpdatedAt = Date.now();

  // 检查是否被淘汰
  if (stats.countryCount === 0 && stats.status === 'active') {
    stats.status = 'eliminated';
  }
}
```

## 关系图

```
┌─────────────────────────────────────────────────────────────┐
│                      GameStore (Zustand)                     │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  commanders: HistoricalCommander[]                          │
│  territories: Territory[]                                   │
│  eventLog: BattleEvent[]                                    │
│  factionStats: Map<commanderId, FactionStatistics>  [NEW]   │
│                                                              │
└──────────────────┬───────────────────────────┬──────────────┘
                   │                           │
                   │ subscribes to             │ subscribes to
                   │                           │
         ┌─────────▼──────────┐      ┌────────▼─────────┐
         │  BattleEvent       │      │ Territory Change │
         │  (战斗事件)         │      │ (领土变更事件)    │
         └─────────┬──────────┘      └────────┬─────────┘
                   │                           │
                   │ triggers                  │ triggers
                   │                           │
         ┌─────────▼──────────┐      ┌────────▼─────────┐
         │ BattleStatUpdate   │      │TerritoryStatUpdate│
         │ (战斗统计更新)      │      │ (领土统计更新)    │
         └─────────┬──────────┘      └────────┬─────────┘
                   │                           │
                   └──────────┬────────────────┘
                              │ updates
                              ▼
                 ┌────────────────────────┐
                 │  FactionStatistics     │
                 │  (势力统计数据)         │
                 └────────────┬───────────┘
                              │
                              │ sorted by
                              ▼
                    ┌──────────────────┐
                    │   Leaderboard    │
                    │   (排行榜)        │
                    └──────────┬───────┘
                               │
                               │ displayed in
                               ▼
                  ┌────────────────────────┐
                  │  FactionStatsPanel     │
                  │  (UI组件)              │
                  └────────────────────────┘
```

## 数据流

### 1. 初始化流程

```
startSession()
  ↓
初始化所有势力统计
  ↓
factionStats.set(commanderId, {
  commanderId,
  commanderName,
  status: 'active',
  countryCount: 0,
  totalArea: 0,
  wins: 0,
  losses: 0,
  winRate: -1,
  lastUpdatedAt: Date.now()
})
```

### 2. 战斗事件流程

```
BattleSystem.executeBattle()
  ↓
addBattleEvent(event)
  ↓
[FactionStatsService 订阅]
  ↓
if (event.type === 'attack' && event.defenderId) {
  ↓
  createBattleStatUpdate(event)
  ↓
  handleBattleStatUpdate()
  ↓
  更新 factionStats Map
    ↓ attacker.wins += 1 (if success)
    ↓ defender.losses += 1 (if success)
    ↓ 重新计算 winRate
}
```

### 3. 领土变更流程

```
BattleSystem.executeBattle() [attackerWins]
  ↓
updateTerritory(territoryId, { ownerId: attackerId })
  ↓
updateCommander(attackerId, { controlledTerritories: [..., territoryId] })
  ↓
[FactionStatsService 订阅]
  ↓
检测 controlledTerritories 变化
  ↓
  ├─ 进攻方: createTerritoryStatUpdate({ action: 'gain' })
  └─ 防守方: createTerritoryStatUpdate({ action: 'lose' })
  ↓
handleTerritoryStatUpdate()
  ↓
更新 factionStats Map
  ↓ countryCount +/-1
  ↓ totalArea +/- country.area
  ↓ 检查是否被淘汰
```

### 4. UI显示流程

```
用户按 'S' 键
  ↓
FactionStatsPanel 打开
  ↓
useGameStore(state => state.factionStats)
  ↓
sortLeaderboard(Array.from(factionStats.values()))
  ↓
渲染排行榜列表
  ↓
[自动订阅] factionStats 变化
  ↓
数据更新 → 重新排序 → 重新渲染
```

## 数据验证规则

### 业务规则

1. **战胜/战败计数规则**:
   - 仅统计势力间战斗（event.defenderId 存在）
   - 进攻成功 → attacker.wins++, defender.losses++
   - 进攻失败 → 不计入任何统计
   - 占领中立领土 → 不计入战斗统计

2. **领土统计规则**:
   - 国家数量 = Commander.controlledTerritories.length
   - 总面积 = Σ(Country.area for owned countries)
   - 增量计算：gain时+area, lose时-area

3. **胜率计算规则**:
   - winRate = wins / (wins + losses)
   - 总战斗次数 = 0 → winRate = -1 (显示为 "N/A")
   - 精度：保留至少3位小数（< 0.1%误差）

4. **排名规则**:
   - 主排序：国家数量降序
   - 次排序：国土面积降序
   - 排名从1开始

### 完整性约束

```typescript
// 不变量检查
function assertInvariants(stats: FactionStatistics): void {
  // 1. 数值非负
  console.assert(stats.countryCount >= 0, 'countryCount must be non-negative');
  console.assert(stats.totalArea >= 0, 'totalArea must be non-negative');
  console.assert(stats.wins >= 0, 'wins must be non-negative');
  console.assert(stats.losses >= 0, 'losses must be non-negative');

  // 2. 胜率范围
  console.assert(
    stats.winRate === -1 || (stats.winRate >= 0 && stats.winRate <= 1),
    'winRate must be -1 or in range [0, 1]'
  );

  // 3. 胜率与计数一致性
  const expectedWinRate = calculateWinRate(stats.wins, stats.losses);
  if (expectedWinRate !== -1) {
    const diff = Math.abs(stats.winRate - expectedWinRate);
    console.assert(diff < 0.001, 'winRate calculation mismatch');
  }

  // 4. 淘汰状态一致性
  if (stats.status === 'eliminated') {
    console.assert(stats.countryCount === 0, 'eliminated faction must have 0 countries');
  }
}
```

## 性能考量

### 存储结构

- 使用 `Map<commanderId, FactionStatistics>` 而非数组
- 原因：O(1)查找/更新，适合高频事件处理
- 空间复杂度：O(n)，n为势力数（最多50个）

### 计算复杂度

| 操作                 | 时间复杂度 | 说明                |
| -------------------- | ---------- | ------------------- |
| 初始化统计           | O(n)       | n为势力数           |
| 更新单个势力战斗统计 | O(1)       | Map查找+计数器更新  |
| 更新单个势力领土统计 | O(1)       | Map查找+面积累加    |
| 排序排行榜           | O(n log n) | 标准排序，n为势力数 |
| 渲染排行榜           | O(n)       | 渲染n个列表项       |

### 优化策略

1. **增量计算**: 不重新遍历所有数据，仅更新变化部分
2. **懒排序**: 仅在打开面板时排序，不在每次更新时排序
3. **防抖**: 高频事件（每秒2次）防抖至每1秒最多更新一次
4. **异步计算**: 使用 requestIdleCallback 避免阻塞主线程

## 迁移策略

### 从现有数据初始化

```typescript
function initializeFactionStats(
  commanders: HistoricalCommander[],
  territories: Territory[],
  countries: Country[]
): Map<string, FactionStatistics> {
  const statsMap = new Map<string, FactionStatistics>();

  commanders.forEach((commander) => {
    // 计算领土统计
    const ownedCountries = commander.controlledTerritories
      .map((territoryId) => {
        const territory = territories.find((t) => t.id === territoryId);
        return countries.find((c) => c.id === territory?.id);
      })
      .filter((c) => c !== undefined);

    const countryCount = ownedCountries.length;
    const totalArea = ownedCountries.reduce((sum, c) => sum + c.area, 0);

    // 初始化战斗统计为0（无历史数据）
    statsMap.set(commander.id, {
      commanderId: commander.id,
      commanderName: commander.name,
      status: commander.status,
      countryCount,
      totalArea,
      wins: 0,
      losses: 0,
      winRate: -1,
      lastUpdatedAt: Date.now(),
    });
  });

  return statsMap;
}
```

### 数据重置

```typescript
function resetFactionStats(): void {
  const store = useGameStore.getState();
  store.factionStats.clear();
  // 游戏重启时会重新初始化
}
```

## 版本历史

- **v1.0.0** (2025-12-01): 初始版本
  - 定义 FactionStatistics, Leaderboard, BattleStatUpdate, TerritoryStatUpdate
  - 明确数据流和验证规则
  - 性能优化策略

# Data Model — 战报排序与领土更新修复

## 修改的实体

### BattleEvent（增强）

| Field         | Type                                                                     | Description                             | Validation / Notes                                        |
| ------------- | ------------------------------------------------------------------------ | --------------------------------------- | --------------------------------------------------------- |
| `id`          | string                                                                   | 唯一事件标识符                          | **格式强化**：`battle-${timestamp}-${counter}`，counter为全局递增序列号 |
| `timestamp`   | ISO 8601 string                                                          | 事件发生时间                            | **验证增强**：必须可被 `new Date()` 解析且不返回Invalid Date |
| `type`        | enum(`attack`,`alliance`,`betrayal`,`cataclysm`,`victory`,`elimination`) | 事件类别                                | 不变                                                      |
| `attackerId`  | string                                                                   | 攻击方指挥官ID                          | 不变                                                      |
| `defenderId`  | string                                                                   | 防守方指挥官ID                          | 不变                                                      |
| `territoryId` | string                                                                   | 涉及的领土ID                            | 不变                                                      |
| `result`      | enum(`success`,`fail`,`pending`)                                         | 战斗结果                                | 不变                                                      |
| `delta`       | object                                                                   | 数值变化（军力损失、占领变化）          | 不变                                                      |
| `narrative`   | string                                                                   | 自然语言描述                            | 不变                                                      |
| `seed`        | string                                                                   | 随机数种子片段                          | 不变                                                      |

**增强说明**：

- **ID生成保障**：引入模块级全局计数器 `battleEventCounter`，在每次生成ID时递增，确保即使 `Date.now()` 相同也不会冲突
- **Timestamp标准化**：所有生成点统一使用 `new Date().toISOString()`，禁止使用数值时间戳或其他格式
- **ID冲突检测**：在 `store.addBattleEvent()` 中添加检查，如果检测到重复ID则记录错误并重新生成

### State transitions（新增）

1. **Generated → Validated**：事件生成后在添加到store前验证ID唯一性和timestamp有效性
2. **Validated → Stored**：通过验证后添加到 `eventLog` 数组（限制最大200条）
3. **Stored → Rendered**：BattleTimeline组件读取、排序、去重后渲染

---

### TerritoryState（增强）

| Field               | Type             | Description                           | Validation / Notes                                       |
| ------------------- | ---------------- | ------------------------------------- | -------------------------------------------------------- |
| `countryId`         | string           | 对应的国家/领土ID                     | 不变                                                     |
| `countryName`       | string           | 国家名称（缓存）                      | 不变                                                     |
| `ownerId`           | string \| null   | 当前占领者指挥官ID                    | **同步保障**：必须与 `Territory.ownerId` 同步更新         |
| `troops`            | number           | 驻军数量                              | 不变                                                     |
| `resources`         | number           | 资源储备                              | 不变                                                     |
| `defense`           | number           | 防御值                                | 不变                                                     |
| `updatedAt`         | number           | 最后更新时间戳（毫秒）                | **修复增强**：每次 ownerId 变化时必须更新                 |
| `conqueredAt`       | number \| null   | 被当前占领者占领的时间                | **修复增强**：ownerId变化时设置为 `Date.now()`           |
| `previousOwnerId`   | string \| null   | 前一个占领者ID                        | 用于颜色过渡动画                                         |
| `transitionProgress`| number \| null   | 颜色过渡进度（0-1）                   | 不变                                                     |
| `isHighlighted`     | boolean          | 是否高亮显示                          | 不变                                                     |

**增强说明**：

- **强制同步**：当 `Territory.ownerId` 更新时，必须通过 `updateTerritoryState()` 同步更新这个实体
- **初始化完整性**：游戏启动时必须确保每个 `Country` 都在 `territoryStates` Map中有对应条目，缺失时自动创建默认值
- **订阅触发**：WorldScene订阅 `territoryStates` 的变化，检测到 `ownerId` 变更时触发 `mapRenderer.updateCountry()`

### State transitions（新增）

1. **Uninitialized → Initialized**：游戏启动时为所有国家创建初始TerritoryState（ownerId为null或初始指挥官ID）
2. **Initialized → Updated**：战斗导致ownerId变化时触发完整的双向同步更新
3. **Updated → Rendered**：地图场景检测到变化后调用MapRenderer更新Phaser图形对象

---

## 新增辅助结构

### BattleEventCounter（模块级单例）

```typescript
// 在 battleSystem.ts 中定义
let battleEventCounter = 0;

export function resetBattleEventCounter() {
  battleEventCounter = 0;
}

export function generateBattleEventId(): string {
  return `battle-${Date.now()}-${battleEventCounter++}`;
}
```

**用途**：

- 确保在高频战斗场景下ID的绝对唯一性
- 提供可测试的ID生成函数
- 在 `resetGame()` 时重置计数器

---

### TerritoryUpdatePayload（类型定义）

```typescript
interface TerritoryUpdatePayload {
  territoryId: string;
  oldOwnerId: string | null;
  newOwnerId: string | null;
  timestamp: number;
  garrison?: number;
  stability?: number;
}
```

**用途**：

- 标准化领土更新事件的数据格式
- 用于日志记录和订阅回调
- 确保所有更新路径传递一致的数据

---

## 数据流增强

### 战报系统数据流

```
1. battleSystem.executeBattle()
   └─> generateBattleEventId() // 生成唯一ID
       └─> new Date().toISOString() // 标准化timestamp
           └─> store.addBattleEvent(event)
               └─> ID冲突检查 (if exists, regenerate)
                   └─> eventLog.push(event)
                       └─> BattleTimeline订阅更新
                           └─> 排序 + 去重 + 渲染
```

**关键改进点**：

- 步骤2：ID生成统一化
- 步骤4：添加冲突检测门禁
- 步骤6：渲染前添加去重逻辑

---

### 领土更新数据流

```
1. battleSystem.executeBattle() [attacker wins]
   └─> store.updateTerritory(territoryId, { ownerId: attackerId })
       ├─> territories[i].ownerId = attackerId // 数组更新
       └─> store.updateTerritoryState(territoryId, {
             ownerId: attackerId,
             conqueredAt: Date.now(),
             previousOwnerId: defenderId
           }) // Map更新
           └─> Zustand通知订阅者
               └─> WorldScene.handleTerritoryChange(payload)
                   └─> mapRenderer.updateCountry(territoryId, newState, colorMapping)
                       └─> Phaser Graphics更新颜色
```

**关键改进点**：

- 步骤2：双向同步（territories数组 + territoryStates Map）
- 步骤5：使用Zustand订阅机制替代轮询
- 步骤7：防御性处理（colorMapping缺失时使用默认值）

---

## 验证规则

### BattleEvent验证

```typescript
function validateBattleEvent(event: BattleEvent): boolean {
  // ID格式检查
  if (!/^battle-\d+-\d+$/.test(event.id)) {
    console.error(`Invalid BattleEvent ID format: ${event.id}`);
    return false;
  }
  
  // Timestamp有效性检查
  const date = new Date(event.timestamp);
  if (isNaN(date.getTime())) {
    console.error(`Invalid BattleEvent timestamp: ${event.timestamp}`);
    return false;
  }
  
  return true;
}
```

### TerritoryState同步验证

```typescript
function verifyTerritorySync(
  territories: Territory[],
  territoryStates: Map<string, TerritoryState>
): string[] {
  const mismatches: string[] = [];
  
  territories.forEach(territory => {
    const state = territoryStates.get(territory.id);
    if (!state) {
      mismatches.push(`Missing state for territory: ${territory.id}`);
      return;
    }
    
    if (state.ownerId !== territory.ownerId) {
      mismatches.push(
        `Owner mismatch for ${territory.id}: ` +
        `Territory=${territory.ownerId}, State=${state.ownerId}`
      );
    }
  });
  
  return mismatches;
}
```

---

## 性能影响

| 操作                       | 现有复杂度 | 修复后复杂度 | 影响评估           |
| -------------------------- | ---------- | ------------ | ------------------ |
| 战报ID生成                 | O(1)       | O(1)         | 无影响             |
| 战报排序                   | O(n log n) | O(n log n)   | 无影响             |
| 战报去重                   | -          | O(n)         | +1ms (n≤200)       |
| 领土更新（territories）    | O(n)       | O(n)         | 无影响             |
| 领土更新（territoryStates）| O(1)       | O(1)         | 无影响             |
| 地图渲染触发               | O(m)轮询   | O(1)订阅     | 优化约5-10ms/frame |

**总体评估**：修复后性能略有提升（订阅机制替代轮询），无负面影响。

---

## 总结

**数据模型变更**：

- BattleEvent：增强ID生成和timestamp验证
- TerritoryState：强化与Territory的同步约束
- 新增辅助结构：计数器和更新负载类型

**数据流优化**：

- 战报：生成→验证→存储→渲染（每步增加质量门禁）
- 领土：更新→双向同步→订阅通知→渲染（消除轮询）

所有变更保持向后兼容，不影响现有存档和测试用例。

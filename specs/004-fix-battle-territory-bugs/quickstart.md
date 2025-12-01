# Quick Start — 战报排序与领土更新修复

## 前提条件

- Node.js 18+ 已安装
- pnpm 已安装
- 项目依赖已安装（`pnpm install`）
- 了解现有项目结构（见 `specs/001-historic-conquest/plan.md`）

---

## 验证问题（修复前）

### 1. 复现战报乱序和重复问题

```bash
# 启动开发服务器
pnpm dev

# 打开浏览器 http://localhost:5173
# 点击"开始游戏"
# 等待5分钟，观察右侧战报面板

# 预期问题：
# - 战报时间顺序不稳定（最新的不在顶部）
# - 可能出现多条相同内容的战报
```

**验证方法**：

```javascript
// 在浏览器控制台执行
const store = useGameStore.getState();
const events = store.eventLog;

// 检查ID重复
const ids = events.map((e) => e.id);
const uniqueIds = new Set(ids);
console.log('Total events:', ids.length);
console.log('Unique IDs:', uniqueIds.size);
console.log('Has duplicates:', ids.length !== uniqueIds.size);

// 检查时间顺序
const timestamps = events.map((e) => new Date(e.timestamp).getTime());
const isSorted = timestamps.every((t, i) => i === 0 || t >= timestamps[i - 1]);
console.log('Is chronological:', isSorted);
```

---

### 2. 复现领土不更新问题

```bash
# 在浏览器控制台执行
const store = useGameStore.getState();

// 查看领土状态
console.log('Territories count:', store.territories.length);
console.log('TerritoryStates count:', store.territoryStates.size);

// 检查同步性
store.territories.forEach(t => {
  const state = store.territoryStates.get(t.id);
  if (!state) {
    console.warn('Missing state for territory:', t.id);
  } else if (state.ownerId !== t.ownerId) {
    console.error('Owner mismatch:', t.id,
      'Territory:', t.ownerId,
      'State:', state.ownerId
    );
  }
});

// 观察地图
// 预期问题：
// - 初始化后国家颜色正确
// - 战斗发生后，地图颜色不更新（但战报显示领土易手）
```

---

## 实施修复

### 第一步：修复战报ID唯一性

**文件**：`app/src/core/simulation/systems/battleSystem.ts`

```typescript
// 在文件顶部添加计数器
let battleEventCounter = 0;

export function resetBattleEventCounter() {
  battleEventCounter = 0;
}

// 修改所有战报生成点，替换：
// id: `battle-${Date.now()}-${Math.random()}`
// 为：
// id: `battle-${Date.now()}-${battleEventCounter++}`
```

**验证**：

```bash
pnpm test -- battleSystem.spec.ts
```

---

### 第二步：修复战报排序和去重

**文件**：`app/src/ui/panels/BattleTimeline.tsx`

```typescript
// 修改 recentEvents 计算逻辑
const recentEvents = useMemo(() => {
  // 1. 去重（按ID）
  const uniqueEvents = new Map<string, BattleEvent>();
  eventLog.forEach((event) => {
    uniqueEvents.set(event.id, event);
  });

  // 2. 排序（时间戳降序，相同时按ID）
  return Array.from(uniqueEvents.values())
    .sort((a, b) => {
      const timeA = new Date(a.timestamp).getTime();
      const timeB = new Date(b.timestamp).getTime();

      // 验证时间戳有效性
      if (isNaN(timeA) || isNaN(timeB)) {
        console.warn('Invalid timestamp detected:', a.timestamp, b.timestamp);
        return 0;
      }

      // 降序排列
      if (timeB !== timeA) {
        return timeB - timeA;
      }

      // 时间戳相同时按ID排序（稳定排序）
      return b.id.localeCompare(a.id);
    })
    .slice(0, 20);
}, [eventLog]);
```

**验证**：

```bash
pnpm test -- BattleTimeline.spec.tsx
```

---

### 第三步：修复领土双向同步

**文件**：`app/src/core/state/store.ts`

```typescript
// 修改 updateTerritory 方法
updateTerritory: (id, updates) =>
  set((state) => {
    // 1. 更新 territories 数组
    const newTerritories = state.territories.map((t) =>
      t.id === id ? { ...t, ...updates } : t
    );

    // 2. 如果 ownerId 变化，同步更新 territoryStates
    if (updates.ownerId !== undefined) {
      const existingState = state.territoryStates.get(id);
      const newStates = new Map(state.territoryStates);

      if (existingState) {
        newStates.set(id, {
          ...existingState,
          previousOwnerId: existingState.ownerId,
          ownerId: updates.ownerId,
          troops: updates.garrison ?? existingState.troops,
          defense: updates.stability ?? existingState.defense,
          conqueredAt: Date.now(),
          updatedAt: Date.now(),
          transitionProgress: 0, // 触发颜色过渡动画
        });

        console.log(
          `🔄 Territory sync: ${id} owner changed to ${updates.ownerId}`
        );
      }

      return {
        territories: newTerritories,
        territoryStates: newStates,
      };
    }

    return { territories: newTerritories };
  }),
```

**验证**：

```bash
pnpm test -- store.spec.ts
```

---

### 第四步：添加初始化验证

**文件**：`app/src/scenes/world/WorldScene.ts`

```typescript
// 在 create() 方法末尾添加验证
private verifyTerritoryStatesComplete(): void {
  const state = useGameStore.getState();
  const missingStates: string[] = [];

  state.countries.forEach(country => {
    if (!state.territoryStates.has(country.id)) {
      missingStates.push(country.id);

      // 创建默认状态
      const defaultState: TerritoryState = {
        countryId: country.id,
        countryName: country.name,
        ownerId: null,
        troops: 0,
        resources: 0,
        defense: 50,
        updatedAt: Date.now(),
        conqueredAt: null,
        previousOwnerId: null,
        transitionProgress: null,
        isHighlighted: false,
      };

      state.territoryStates.set(country.id, defaultState);
    }
  });

  if (missingStates.length > 0) {
    console.warn(
      `⚠️ Created default states for ${missingStates.length} territories:`,
      missingStates
    );
  } else {
    console.log('✅ All territory states initialized');
  }
}

// 在 create() 末尾调用
this.verifyTerritoryStatesComplete();
```

---

### 第五步：实现订阅式渲染

**文件**：`app/src/scenes/world/WorldScene.ts`

```typescript
// 添加属性
private territorySubscription?: () => void;

// 在 create() 方法中添加订阅
private setupTerritorySubscription(): void {
  const store = useGameStore.getState();

  // 订阅 territoryStates 变化
  this.territorySubscription = useGameStore.subscribe(
    (state) => state.territoryStates,
    (newStates, prevStates) => {
      // 检测变化的领土
      newStates.forEach((newState, territoryId) => {
        const prevState = prevStates.get(territoryId);

        // 检查 ownerId 是否变化
        if (!prevState || prevState.ownerId !== newState.ownerId) {
          this.handleTerritoryOwnershipChange(territoryId, newState);
        }
      });
    }
  );
}

private handleTerritoryOwnershipChange(
  territoryId: string,
  newState: TerritoryState
): void {
  const store = useGameStore.getState();
  const colorMapping = newState.ownerId
    ? store.colorMappings.get(newState.ownerId)
    : null;

  if (colorMapping) {
    this.mapRenderer.updateCountry(territoryId, newState, colorMapping);
    console.log(`🎨 Map updated: ${territoryId} → ${newState.ownerId}`);
  } else if (newState.ownerId) {
    console.warn(
      `⚠️ Missing color mapping for commander: ${newState.ownerId}`
    );
    // 使用默认灰色
    this.mapRenderer.updateCountry(territoryId, newState, {
      commanderId: newState.ownerId,
      primary: 0x808080,
      secondary: 0x606060,
      alpha: 0.7,
    });
  }
}

// 在 shutdown() 中清理订阅
shutdown(): void {
  if (this.territorySubscription) {
    this.territorySubscription();
    this.territorySubscription = undefined;
  }
  // ... 其他清理代码
}

// 在 create() 末尾调用
this.setupTerritorySubscription();
```

---

### 第六步：添加resetGame时的计数器重置

**文件**：`app/src/core/state/store.ts`

```typescript
// 在文件顶部导入
import { resetBattleEventCounter } from '../simulation/systems/battleSystem';

// 修改 resetGame 方法
resetGame: () => {
  resetBattleEventCounter(); // 重置战报计数器

  set({
    gameStarted: false,
    sessionId: '',
    seed: '',
    tick: 0,
    // ... 其他重置逻辑
  });
},
```

---

## 验证修复（修复后）

### 1. 验证战报系统

```bash
# 启动游戏并运行5分钟
pnpm dev

# 在控制台检查
const store = useGameStore.getState();
const events = store.eventLog;

// 应该全部通过
console.assert(events.length === new Set(events.map(e => e.id)).size, 'No duplicate IDs');

const timestamps = events.map(e => new Date(e.timestamp).getTime());
const isSorted = timestamps.slice(0, 20).every((t, i) =>
  i === 0 || t <= timestamps[i-1]
);
console.assert(isSorted, 'Timeline sorted descending');
```

---

### 2. 验证领土更新

```bash
# 在控制台观察实时日志
# 应该看到：
# - 🔄 Territory sync: XXX owner changed to YYY
# - 🎨 Map updated: XXX → YYY

# 检查同步
const store = useGameStore.getState();
const mismatches = [];
store.territories.forEach(t => {
  const state = store.territoryStates.get(t.id);
  if (state && state.ownerId !== t.ownerId) {
    mismatches.push({ id: t.id, territory: t.ownerId, state: state.ownerId });
  }
});
console.assert(mismatches.length === 0, 'All territories synced');
```

---

### 3. 运行自动化测试

```bash
# 单元测试
pnpm test

# E2E测试
pnpm test:e2e

# 覆盖率报告
pnpm test:coverage
```

**预期结果**：

- 所有现有测试通过
- 新增测试覆盖ID生成、排序、同步逻辑
- 覆盖率 ≥ 90%

---

## 常见问题

### Q1: 修复后战报面板空白

**原因**：timestamp验证过于严格，过滤掉了所有事件

**解决**：

```typescript
// 检查是否有无效时间戳
const invalidEvents = eventLog.filter((e) => isNaN(new Date(e.timestamp).getTime()));
console.log('Invalid timestamps:', invalidEvents);
```

---

### Q2: 地图颜色仍不更新

**检查清单**：

1. 订阅是否正确设置？
2. `colorMappings` 是否包含所有指挥官？
3. 控制台是否有警告日志？
4. `MapRenderer.updateCountry()` 是否被调用？

```typescript
// 添加调试日志
console.log('Subscription active:', !!this.territorySubscription);
console.log('Color mappings:', store.colorMappings.size);
```

---

### Q3: 性能下降

**检查点**：

- 战报去重耗时（应<1ms）
- 订阅回调频率（应与战斗频率匹配）
- 地图渲染帧率（应保持60 FPS）

```typescript
// 性能监控
console.time('battle-timeline-render');
// ... 渲染逻辑
console.timeEnd('battle-timeline-render');
```

---

## 回滚计划

如果修复引入新问题：

```bash
# 1. 切换回主分支
git checkout main

# 2. 或者仅回滚特定文件
git checkout main -- app/src/core/simulation/systems/battleSystem.ts
git checkout main -- app/src/ui/panels/BattleTimeline.tsx
git checkout main -- app/src/core/state/store.ts
git checkout main -- app/src/scenes/world/WorldScene.ts

# 3. 重启开发服务器
pnpm dev
```

---

## 下一步

修复验证通过后：

1. 提交代码：`git commit -m "fix: 战报排序和领土更新问题"`
2. 运行完整测试套件
3. 更新 CHANGELOG.md
4. 创建 Pull Request
5. 合并到主分支

参见 `specs/004-fix-battle-territory-bugs/tasks.md`（由 `/speckit.tasks` 生成）了解详细任务拆解。

# Data Model: 性能优化

**Feature**: 006-performance-optimization  
**Date**: 2025-12-01

## 新增/修改实体

### RingBuffer<T>

环形缓冲区，用于替代事件日志的数组实现。

```typescript
interface RingBuffer<T> {
  capacity: number;      // 最大容量
  head: number;          // 写入位置
  size: number;          // 当前元素数量
  buffer: T[];           // 底层数组
  
  push(item: T): void;   // O(1) 添加元素
  toArray(): T[];        // 转换为数组（用于UI显示）
  clear(): void;         // 清空缓冲区
}
```

**Validation Rules**:
- capacity必须为正整数
- size永远不超过capacity

**State Transitions**:
- Empty → HasItems: 第一次push
- HasItems → Full: size达到capacity
- Full → Full: 继续push时覆盖最旧元素

---

### PerformanceMetrics (增强)

扩展现有性能指标，添加内存监控。

```typescript
interface PerformanceMetrics {
  fps: number;           // 当前FPS
  tickMs: number;        // Tick处理时间(ms)
  memoryUsageMB: number; // 内存使用(MB) - 新增
  gcCount: number;       // GC次数估算 - 新增
  renderMs: number;      // 渲染时间(ms) - 新增
}
```

---

### PerformanceConfig

性能配置，支持运行时调整。

```typescript
interface PerformanceConfig {
  enableDetailedLogs: boolean;     // 是否启用详细日志
  enableAnimations: boolean;       // 是否启用动画
  renderThrottleMs: number;        // 渲染节流间隔(ms)
  lowFpsThreshold: number;         // 低FPS阈值
  autoDegrade: boolean;            // 是否自动降级
  eventLogCapacity: number;        // 事件日志容量
}
```

**Default Values**:
```typescript
const DEFAULT_PERFORMANCE_CONFIG: PerformanceConfig = {
  enableDetailedLogs: process.env.NODE_ENV === 'development',
  enableAnimations: true,
  renderThrottleMs: 16,  // ~60fps
  lowFpsThreshold: 30,
  autoDegrade: true,
  eventLogCapacity: 200,
};
```

---

### DirtyFlags

脏标记，用于增量渲染。

```typescript
interface DirtyFlags {
  territories: Set<string>;  // 需要重绘的领土ID
  commanders: Set<string>;   // 需要重绘的指挥官ID
  fullRedraw: boolean;       // 是否需要全量重绘
  lastRenderTick: number;    // 上次渲染的Tick
}
```

---

## 现有实体修改

### GameState (store.ts)

添加性能相关状态：

```typescript
interface GameState {
  // ... 现有字段 ...
  
  // 新增性能相关
  performanceConfig: PerformanceConfig;
  dirtyFlags: DirtyFlags;
  
  // Actions
  setPerformanceConfig: (config: Partial<PerformanceConfig>) => void;
  markDirty: (type: 'territory' | 'commander', id: string) => void;
  clearDirtyFlags: () => void;
}
```

---

## 数据流优化

### 状态更新批处理

```
Before:
  updateTerritory(id1) → new Map → notify subscribers
  updateTerritory(id2) → new Map → notify subscribers
  updateTerritory(id3) → new Map → notify subscribers

After:
  batchUpdateTerritories([id1, id2, id3]) → single new Map → notify once
```

### 订阅优化

```
Before:
  useGameStore.subscribe((state) => { /* 响应所有变化 */ })

After:
  useGameStore.subscribe(
    (state) => state.territoryStates,
    (territoryStates, prevTerritoryStates) => { /* 只响应领土变化 */ },
    { equalityFn: shallow }
  )
```

---

## 关系图

```
┌─────────────────────────────────────────────────────────────┐
│                        GameState                            │
├─────────────────────────────────────────────────────────────┤
│  performanceMetrics ──────► PerformanceMetrics              │
│  performanceConfig  ──────► PerformanceConfig               │
│  dirtyFlags         ──────► DirtyFlags                      │
│  eventLog           ──────► RingBuffer<BattleEvent>         │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                      WorldScene                             │
├─────────────────────────────────────────────────────────────┤
│  Subscribes to: territoryStates (selective)                 │
│  Reads: dirtyFlags, performanceConfig                       │
│  Updates: performanceMetrics                                │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                      DevHud                                 │
├─────────────────────────────────────────────────────────────┤
│  Displays: performanceMetrics (all fields)                  │
│  Controls: performanceConfig (toggle animations, etc.)      │
└─────────────────────────────────────────────────────────────┘
```

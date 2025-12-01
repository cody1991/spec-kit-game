# Research: 性能优化

**Feature**: 006-performance-optimization  
**Date**: 2025-12-01

## 性能问题根因分析

### 问题1: Console.log过度输出

**现状分析**:
- WorldScene.ts、store.ts等文件包含大量console.log调用
- 每次领土变更、Tick执行都会输出调试信息
- 字符串拼接和JSON序列化在高频调用时消耗大量CPU

**Decision**: 实现条件日志系统，生产环境禁用详细日志

**Rationale**: console.log是同步阻塞操作，高频调用会显著影响主线程性能

**Alternatives considered**:
- 完全删除日志：拒绝，会影响调试能力
- 使用Web Worker处理日志：过度复杂，收益不明显

---

### 问题2: Zustand Store订阅过度触发

**现状分析**:
- `useGameStore.subscribe()` 在WorldScene中订阅全部状态变化
- 每次状态更新都触发完整的比较逻辑
- Map对象的浅比较导致频繁的"变化检测"

**Decision**: 使用选择性订阅 + 浅比较优化

**Rationale**: Zustand支持selector模式，只订阅需要的状态片段可大幅减少重渲染

**Alternatives considered**:
- 使用immer：增加依赖，对Map类型支持有限
- 切换到Redux：迁移成本高，Zustand已足够

---

### 问题3: Map对象频繁创建

**现状分析**:
- `updateTerritory`每次调用都创建新的Map: `new Map(state.territoryStates)`
- `setupTerritorySubscription`中每次比较都复制Map
- GC压力导致周期性卡顿

**Decision**: 实现批量更新 + 复用Map对象

**Rationale**: 减少对象创建是JavaScript性能优化的核心策略

**Alternatives considered**:
- 使用Immutable.js：引入新依赖，学习成本高
- 使用普通Object替代Map：Map的性能在大量键值对时更优

---

### 问题4: 事件日志持续增长

**现状分析**:
- eventLog数组限制为200条，但每次添加都创建新数组
- `[...state.eventLog, event].slice(-200)` 每次都分配新内存

**Decision**: 使用环形缓冲区（Ring Buffer）实现

**Rationale**: 环形缓冲区避免数组复制，O(1)时间复杂度添加元素

**Alternatives considered**:
- 使用链表：JavaScript中链表性能不如数组
- 增大slice间隔：只是延迟问题，不解决根本

---

### 问题5: 地图渲染过于频繁

**现状分析**:
- `onUpdate`每30 tick调用`renderWorld()`
- 但订阅机制也会触发渲染，导致重复渲染
- 每次渲染都遍历所有国家

**Decision**: 实现脏标记（Dirty Flag）+ 增量渲染

**Rationale**: 只渲染变化的部分，避免全量重绘

**Alternatives considered**:
- 使用Canvas离屏渲染：Phaser已有优化，手动实现收益有限
- 降低渲染频率：会影响视觉流畅度

---

## 最佳实践研究

### Zustand性能优化

1. **选择性订阅**: 使用`useStore(state => state.specificField)`而非订阅整个store
2. **浅比较**: 对于对象/数组，使用`shallow`比较器
3. **批量更新**: 在单次`set()`中更新多个字段
4. **避免在render中调用getState()**: 使用hooks获取状态

### Phaser渲染优化

1. **对象池**: 使用GraphicsPool复用图形对象（已实现）
2. **视口裁剪**: 只渲染可见区域内的对象
3. **LOD**: 根据缩放级别调整渲染细节
4. **批量绘制**: 合并相同材质的绘制调用

### JavaScript内存优化

1. **避免闭包陷阱**: 闭包会持有外部变量引用
2. **及时解除引用**: 不再使用的对象设为null
3. **使用WeakMap**: 对于缓存场景，允许GC回收键
4. **监控内存**: 使用Performance API和Chrome DevTools

---

## 优化优先级

| 优化项 | 预期收益 | 实现难度 | 优先级 |
|--------|----------|----------|--------|
| 清理console.log | 高 | 低 | P0 |
| Zustand选择性订阅 | 高 | 中 | P0 |
| Map批量更新 | 高 | 中 | P1 |
| 环形缓冲区事件日志 | 中 | 低 | P1 |
| 脏标记增量渲染 | 高 | 高 | P2 |
| 性能模式开关 | 中 | 低 | P2 |

---

## 技术决策总结

1. **日志系统**: 使用现有`logger`配置，添加生产环境检测
2. **状态管理**: 优化Zustand订阅，使用selector和shallow比较
3. **数据结构**: 环形缓冲区替代数组slice，批量Map更新
4. **渲染策略**: 脏标记 + 增量更新，低FPS自动降级
5. **监控增强**: DevHud显示内存使用，添加性能警告

# Research: 渐进式领土蚕食机制

**Feature**: 010-gradual-conquest  
**Date**: 2025-12-01  
**Status**: Complete

## Research Tasks

### 1. 多攻击方进度追踪数据结构

**Decision**: 使用 `Map<attackerId, ConquestProgressEntry>` 作为每个领土的进度追踪结构

**Rationale**:
- Map 提供 O(1) 的查找、插入、删除操作
- 支持多个攻击方独立追踪进度
- 与现有 Zustand store 的 Map 使用模式一致
- 易于序列化/反序列化（IndexedDB 持久化）

**Alternatives considered**:
- Array of objects: 需要 O(n) 查找，不适合频繁更新场景
- 单一 attackerId + progress: 不支持多攻击方，需求明确要求独立追踪

### 2. 进度衰减机制实现方式

**Decision**: 在独立的 `ConquestProgressSystem` 中实现，每 tick 检查并衰减无战斗的进度

**Rationale**:
- 与 `BattleSystem` 职责分离，遵循单一职责原则
- 可独立测试衰减逻辑
- 使用 `lastBattleTime` 字段计算衰减量，避免每 tick 遍历所有领土

**Alternatives considered**:
- 在 BattleSystem 中处理：违反单一职责，增加 BattleSystem 复杂度
- 使用定时器：与游戏 tick 不同步，可能导致状态不一致

### 3. 渐变色渲染实现

**Decision**: 使用 Phaser Graphics API 的颜色插值，基于进度百分比混合攻击方和防守方颜色

**Rationale**:
- Phaser 内置颜色插值函数 `Phaser.Display.Color.Interpolate`
- 与现有 `MapRenderer` 架构兼容
- 性能开销可控（颜色计算在 CPU，渲染在 GPU）

**Alternatives considered**:
- Shader 实现：更高性能但增加复杂度，当前规模不需要
- 条纹/图案：视觉效果不如渐变直观

### 4. 领土面积分类阈值

**Decision**: 采用规格中定义的三级分类
- 小国：<10万 km²（约 100 个国家）
- 中国：10-100万 km²（约 70 个国家）
- 大国：>100万 km²（约 30 个国家）

**Rationale**:
- 与现有 `countryAreas.ts` 数据兼容
- 分布合理，大国确实需要更多战斗才能占领
- 阈值可在配置文件中调整

**Alternatives considered**:
- 连续函数：实现复杂，调试困难
- 五级分类：过于细碎，用户难以感知差异

### 5. 与现有系统的集成点

**Decision**: 修改 `BattleSystem.queueBattle()` 调用 `ConquestProgressSystem` 而非直接更换所有者

**Integration points**:
1. `BattleSystem` → `ConquestProgressSystem.updateProgress()`
2. `ConquestProgressSystem` → `store.updateTerritoryConquestProgress()`
3. `ConquestProgressSystem` → `globalEventBus.emit('territory:conquest-progress')`
4. `MapRenderer.render()` → 读取进度状态渲染渐变色
5. `CountryDetailPanel` → 显示进度信息

**Rationale**:
- 最小化对现有代码的修改
- 利用现有事件总线机制
- 保持渲染和逻辑分离

### 6. 性能优化策略

**Decision**: 采用增量更新 + 脏标记机制

**Strategies**:
1. 只在进度变化时更新 `territoryStates`
2. 使用 `dirtyFlags.territories` 标记需要重绘的领土
3. 衰减检查使用 `lastBattleTime` 过滤，避免遍历所有领土
4. 批量更新 store，减少 React 重渲染

**Performance budget**:
- 进度计算：<1ms/tick（预期 0.3ms）
- 衰减检查：<1ms/tick（预期 0.5ms）
- 渲染开销：无额外 draw call，只是颜色计算

## Dependencies

| Dependency | Version | Purpose |
| ---------- | ------- | ------- |
| Zustand | 4.4.7 | 状态管理，扩展 store |
| Phaser | 3.80.1 | 渲染，颜色插值 |
| TypeScript | 5.4.5 | 类型安全 |

## Risks & Mitigations

| Risk | Impact | Mitigation |
| ---- | ------ | ---------- |
| 多攻击方追踪增加内存 | Low | Map 结构内存效率高，且争夺中的领土数量有限 |
| 渐变色渲染性能 | Medium | 使用脏标记增量渲染，低端设备可禁用 |
| 与决战模式交互 | Low | 决战模式下进度变化×1.5，已在规格中定义 |

## Conclusion

所有技术决策已明确，无需进一步澄清。可进入 Phase 1 设计阶段。

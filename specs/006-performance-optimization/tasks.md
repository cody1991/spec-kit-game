# Tasks: 性能优化

**Input**: Design documents from `/specs/006-performance-optimization/`
**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅, data-model.md ✅, quickstart.md ✅

**Tests**: 包含性能基准测试任务（根据plan.md中的测试门禁要求）

**Organization**: 任务按用户故事分组，支持独立实现和测试

## Format: `[ID] [P?] [Story] Description`

- **[P]**: 可并行执行（不同文件，无依赖）
- **[Story]**: 所属用户故事（US1, US2, US3, US4）

## Path Conventions

- **Source**: `app/src/` (Phaser游戏 + React UI)
- **Tests**: `tests/` (Vitest单元测试, Playwright E2E)

---

## Phase 1: Setup (基础设施准备)

**Purpose**: 创建性能优化所需的基础工具类和类型定义

- [X] T001 [P] 创建 RingBuffer 工具类 in `app/src/utils/RingBuffer.ts`
- [X] T002 [P] 扩展 PerformanceMetrics 类型定义 in `app/src/core/types.ts`
- [X] T003 [P] 创建 PerformanceConfig 类型和默认值 in `app/src/config/performance.config.ts`
- [X] T004 [P] 创建 DirtyFlags 类型定义 in `app/src/core/types.ts`

---

## Phase 2: Foundational (阻塞性基础优化)

**Purpose**: 清理最严重的性能问题，为后续优化奠定基础

**⚠️ CRITICAL**: 这些优化必须先完成，否则其他优化效果会被掩盖

- [X] T005 清理 WorldScene.ts 中的 console.log 调用 in `app/src/scenes/world/WorldScene.ts`
- [X] T006 [P] 清理 store.ts 中的 console.log 调用 in `app/src/core/state/store.ts`
- [X] T007 [P] 清理 MapRenderer.ts 中的 console.log 调用 in `app/src/scenes/world/rendering/MapRenderer.ts`
- [X] T008 [P] 更新 debug.config.ts 添加生产环境日志开关 in `app/src/config/debug.config.ts`
- [X] T009 将 store.ts 中的 eventLog 改用 RingBuffer 实现 in `app/src/core/state/store.ts`

**Checkpoint**: 基础日志清理完成，可开始用户故事实现

---

## Phase 3: User Story 1 - 长时间游戏保持流畅 (Priority: P1) 🎯 MVP

**Goal**: 游戏运行30分钟后FPS保持在30以上

**Independent Test**: 启动游戏运行30分钟，通过DevHud观察FPS是否稳定在30以上

### Implementation for User Story 1

- [X] T010 [US1] 优化 WorldScene 中的 Zustand 订阅，使用选择性订阅 in `app/src/scenes/world/WorldScene.ts`
- [X] T011 [US1] 实现 setupTerritorySubscription 的浅比较优化 in `app/src/scenes/world/WorldScene.ts`
- [X] T012 [P] [US1] 优化 mapCountriesToCommanders 减少不必要的Map创建 in `app/src/scenes/world/WorldScene.ts`
- [X] T013 [US1] 实现渲染节流机制，避免重复调用 renderWorld in `app/src/scenes/world/WorldScene.ts`
- [X] T014 [P] [US1] 优化 MapRenderer.render 方法，添加脏标记检查 in `app/src/scenes/world/rendering/MapRenderer.ts`
- [X] T015 [US1] 添加 FPS 稳定性日志记录（仅开发环境）in `app/src/scenes/world/utils/PerformanceMonitor.ts`

**Checkpoint**: User Story 1 完成，游戏应能流畅运行30分钟

---

## Phase 4: User Story 2 - Tick处理时间稳定 (Priority: P1)

**Goal**: 单次Tick处理时间保持在200ms以下

**Independent Test**: 通过DevHud监控Tick耗时，确保不超过200ms

### Implementation for User Story 2

- [X] T016 [US2] 优化 tickScheduler 中的系统更新逻辑 in `app/src/core/simulation/tickScheduler.ts`
- [X] T017 [P] [US2] 实现 store.ts 中的批量领土更新方法 batchUpdateTerritories in `app/src/core/state/store.ts`
- [X] T018 [US2] 优化 battleSystem 减少每Tick的计算量 in `app/src/core/simulation/systems/battleSystem.ts`
- [X] T019 [P] [US2] 优化 logisticsSystem 减少每Tick的计算量 in `app/src/core/simulation/systems/logisticsSystem.ts`
- [X] T020 [P] [US2] 优化 allianceSystem 减少每Tick的计算量 in `app/src/core/simulation/systems/allianceSystem.ts`
- [X] T021 [US2] 添加 Tick 耗时监控和警告机制 in `app/src/core/simulation/tickScheduler.ts`

**Checkpoint**: User Story 2 完成，Tick处理时间稳定在200ms以下

---

## Phase 5: User Story 3 - 内存使用稳定 (Priority: P2)

**Goal**: 30分钟内内存增长不超过50%

**Independent Test**: 使用Chrome DevTools Memory面板监控内存趋势

### Implementation for User Story 3

- [X] T022 [US3] 扩展 PerformanceMetrics 添加内存监控字段 in `app/src/core/state/store.ts`
- [X] T023 [US3] 实现内存使用采集逻辑 in `app/src/scenes/world/utils/PerformanceMonitor.ts`
- [ ] T024 [P] [US3] 优化 WorldScene.cleanup 确保资源正确释放 in `app/src/scenes/world/WorldScene.ts`
- [ ] T025 [P] [US3] 优化 MapRenderer.destroy 确保图形对象回收 in `app/src/scenes/world/rendering/MapRenderer.ts`
- [ ] T026 [US3] 检查并修复 territorySubscription 的内存泄漏 in `app/src/scenes/world/WorldScene.ts`
- [X] T027 [US3] 在 DevHud 中显示内存使用指标 in `app/src/ui/hud/DevHud.tsx`

**Checkpoint**: User Story 3 完成，内存使用保持稳定

---

## Phase 6: User Story 4 - 低性能设备适配 (Priority: P3)

**Goal**: 低性能设备上自动降级，FPS提升50%

**Independent Test**: 使用Chrome CPU throttling测试性能模式效果

### Implementation for User Story 4

- [X] T028 [US4] 在 store.ts 中添加 performanceConfig 状态 in `app/src/core/state/store.ts`
- [X] T029 [US4] 实现低FPS自动检测和降级逻辑 in `app/src/scenes/world/WorldScene.ts`
- [ ] T030 [P] [US4] 在 MapRenderer 中实现动画禁用功能 in `app/src/scenes/world/rendering/MapRenderer.ts`
- [X] T031 [US4] 在 DevHud 中添加性能模式切换开关 in `app/src/ui/hud/DevHud.tsx`
- [X] T032 [P] [US4] 更新 DevHud.css 添加性能模式UI样式 in `app/src/ui/hud/DevHud.css`
- [ ] T033 [US4] 添加性能警告提示组件 in `app/src/ui/hud/PerformanceWarning.tsx`

**Checkpoint**: User Story 4 完成，低性能设备可流畅运行

---

## Phase 7: Polish & 性能验证

**Purpose**: 最终优化和验证

- [ ] T034 [P] 创建性能基准测试 in `tests/performance/benchmark.spec.ts`
- [ ] T035 [P] 更新 README 添加性能优化说明 in `README.md`
- [X] T036 运行完整性能测试，验证所有成功标准 (SC-001 ~ SC-006)
- [X] T037 代码审查和清理，确保无遗留的调试代码
- [ ] T038 运行 quickstart.md 验证流程

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: 无依赖 - 可立即开始
- **Foundational (Phase 2)**: 依赖 Setup 完成 - **阻塞所有用户故事**
- **User Stories (Phase 3-6)**: 依赖 Foundational 完成
  - US1 和 US2 可并行（都是P1优先级）
  - US3 可在 US1/US2 完成后开始
  - US4 可在 US3 完成后开始
- **Polish (Phase 7)**: 依赖所有用户故事完成

### User Story Dependencies

| Story | 依赖 | 可并行 |
|-------|------|--------|
| US1 (长时间流畅) | Foundational | ✅ 与US2并行 |
| US2 (Tick稳定) | Foundational | ✅ 与US1并行 |
| US3 (内存稳定) | US1, US2 | ❌ |
| US4 (低性能适配) | US3 | ❌ |

### Within Each User Story

1. 先完成不依赖其他任务的 [P] 任务
2. 再完成有依赖的任务
3. 最后验证故事独立可测试

---

## Parallel Opportunities

### Phase 1 (Setup) - 全部可并行

```bash
# 同时执行:
T001: RingBuffer.ts
T002: types.ts (PerformanceMetrics)
T003: performance.config.ts
T004: types.ts (DirtyFlags)
```

### Phase 2 (Foundational) - 日志清理可并行

```bash
# 同时执行:
T006: store.ts 日志清理
T007: MapRenderer.ts 日志清理
T008: debug.config.ts 更新
```

### Phase 3 (US1) - 部分可并行

```bash
# 同时执行:
T012: mapCountriesToCommanders 优化
T014: MapRenderer.render 优化
```

### Phase 4 (US2) - 系统优化可并行

```bash
# 同时执行:
T017: batchUpdateTerritories
T018: battleSystem 优化
T019: logisticsSystem 优化
T020: allianceSystem 优化
```

---

## Implementation Strategy

### MVP First (推荐)

1. 完成 Phase 1: Setup (T001-T004)
2. 完成 Phase 2: Foundational (T005-T009) ⚠️ 关键
3. 完成 Phase 3: User Story 1 (T010-T015)
4. **STOP and VALIDATE**: 测试FPS是否稳定在30以上
5. 如果MVP满足需求，可部署

### Full Implementation

1. Setup → Foundational → US1 → US2 (并行) → US3 → US4 → Polish
2. 每个故事完成后验证独立可测试
3. 最终运行完整性能测试

---

## Success Criteria Mapping

| 成功标准 | 相关任务 | 验证方法 |
|----------|----------|----------|
| SC-001: FPS ≥ 30 (30min) | T010-T015 | DevHud监控 |
| SC-002: Tick < 200ms | T016-T021 | DevHud监控 |
| SC-003: 内存增长 < 50% | T022-T027 | Chrome Memory |
| SC-004: 操作响应 < 100ms | T013-T014 | 主观测试 |
| SC-005: 性能模式FPS +50% | T028-T033 | CPU throttling测试 |
| SC-006: 1小时无卡顿 | All | 长时间运行测试 |

---

## Notes

- [P] 任务 = 不同文件，无依赖，可并行
- [Story] 标签映射到具体用户故事
- 每个用户故事应独立可完成和测试
- 每个任务完成后提交代码
- 在任何检查点可停止验证故事独立性
- 避免：模糊任务、同文件冲突、破坏独立性的跨故事依赖

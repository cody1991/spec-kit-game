# Tasks: 渐进式领土蚕食机制

**Input**: Design documents from `/specs/010-gradual-conquest/`
**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅, data-model.md ✅, contracts/ ✅

**Tests**: 根据 plan.md 中的测试门禁要求，本功能需要单元测试（覆盖率目标 80%）

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Project Type**: Web application (React + Phaser game)
- **Source**: `app/src/`
- **Tests**: `tests/`
- **Config**: `app/src/config/`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: 配置文件和类型定义，为所有用户故事提供基础

- [ ] T001 [P] 创建占领进度配置文件 `app/src/config/conquestProgress.config.ts`
- [ ] T002 [P] 扩展 Territory 类型定义，添加 conquestState 字段 `app/src/core/types.ts`
- [ ] T003 [P] 添加 ConquestProgressEntry、TerritoryConquestState、ConquestProgressConfig 类型 `app/src/core/types.ts`
- [ ] T004 [P] 添加 ConquestProgressEvent 事件类型 `app/src/core/events/eventTypes.ts`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: 核心基础设施，所有用户故事都依赖这些组件

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [ ] T005 扩展 Zustand store，添加 conquestProgressStates Map 和相关 actions `app/src/core/state/store.ts`
- [ ] T006 实现 ConquestProgressSystem 基础框架（System 接口） `app/src/core/simulation/systems/conquestProgressSystem.ts`
- [ ] T007 实现进度计算核心函数 calculateProgressDelta() `app/src/core/simulation/systems/conquestProgressSystem.ts`
- [ ] T008 在 tickScheduler 中注册 ConquestProgressSystem `app/src/core/simulation/tickScheduler.ts`
- [ ] T009 [P] 编写进度计算单元测试 `tests/unit/conquestProgress.test.ts`

**Checkpoint**: Foundation ready - user story implementation can now begin

---

## Phase 3: User Story 1 - 观察渐进式领土蚕食 (Priority: P1) 🎯 MVP

**Goal**: 战斗胜利后增加占领进度而非直接占领，进度达100%时正式转移领土

**Independent Test**: 启动游戏，观察战斗胜利后领土显示"占领进度"而非直接更换颜色

### Implementation for User Story 1

- [ ] T010 [US1] 实现 updateProgress() 方法 - 战斗胜利时增加进度 `app/src/core/simulation/systems/conquestProgressSystem.ts`
- [ ] T011 [US1] 实现 completeConquest() 方法 - 进度达100%时转移领土 `app/src/core/simulation/systems/conquestProgressSystem.ts`
- [ ] T012 [US1] 修改 BattleSystem.queueBattle() - 调用进度系统而非直接更换所有者 `app/src/core/simulation/systems/battleSystem.ts`
- [ ] T013 [US1] 实现防守成功时减少进度的逻辑 `app/src/core/simulation/systems/conquestProgressSystem.ts`
- [ ] T014 [US1] 添加进度变化事件发射 globalEventBus.emit('conquest:progress-changed') `app/src/core/simulation/systems/conquestProgressSystem.ts`
- [ ] T015 [US1] 更新战斗日志显示进度变化 `app/src/ui/panels/BattleTimeline.tsx`
- [ ] T016 [P] [US1] 编写 US1 集成测试 - 验证进度增加和领土转移 `tests/integration/gradualConquest.test.ts`

**Checkpoint**: User Story 1 完成 - 可独立测试渐进式占领机制

---

## Phase 4: User Story 2 - 边境拉锯战 (Priority: P1)

**Goal**: 支持进度双向变化，实现拉锯战效果

**Independent Test**: 观察两个实力相当的势力在边境的战斗是否出现进度反复变化

### Implementation for User Story 2

- [ ] T017 [US2] 实现进度双向变化逻辑 - 攻击增加/防守减少 `app/src/core/simulation/systems/conquestProgressSystem.ts`
- [ ] T018 [US2] 实现进度归零时清除攻击方信息 clearProgress() `app/src/core/simulation/systems/conquestProgressSystem.ts`
- [ ] T019 [US2] 实现进度衰减机制 processDecay() - 每分钟无战斗进度下降5% `app/src/core/simulation/systems/conquestProgressSystem.ts`
- [ ] T020 [US2] 在 update() 方法中调用衰减检查（每60 tick） `app/src/core/simulation/systems/conquestProgressSystem.ts`
- [ ] T021 [US2] 处理势力被淘汰时清除其所有进度 onCommanderEliminated() `app/src/core/simulation/systems/conquestProgressSystem.ts`
- [ ] T022 [P] [US2] 编写 US2 单元测试 - 验证拉锯战和衰减逻辑 `tests/unit/conquestProgress.test.ts`

**Checkpoint**: User Story 2 完成 - 拉锯战机制可独立验证

---

## Phase 5: User Story 3 - 领土大小影响占领难度 (Priority: P2)

**Goal**: 大国比小国更难被完全占领

**Independent Test**: 比较占领大国和小国所需的战斗次数

### Implementation for User Story 3

- [ ] T023 [US3] 实现 getTerritorySizeCategory() - 根据面积分类领土 `app/src/core/simulation/systems/conquestProgressSystem.ts`
- [ ] T024 [US3] 在 calculateProgressDelta() 中应用面积系数 `app/src/core/simulation/systems/conquestProgressSystem.ts`
- [ ] T025 [US3] 实现实力差距乘数计算 getPowerMultiplier() `app/src/core/simulation/systems/conquestProgressSystem.ts`
- [ ] T026 [US3] 集成决战模式进度加速（×1.5倍） `app/src/core/simulation/systems/conquestProgressSystem.ts`
- [ ] T027 [P] [US3] 编写 US3 单元测试 - 验证面积和实力乘数 `tests/unit/conquestProgress.test.ts`

**Checkpoint**: User Story 3 完成 - 面积影响机制可独立验证

---

## Phase 6: User Story 4 - 视觉反馈显示占领进度 (Priority: P2)

**Goal**: 在地图上直观显示占领进度

**Independent Test**: 观察正在被蚕食的领土是否有明显的视觉变化

### Implementation for User Story 4

- [ ] T028 [US4] 实现 getContestedColor() - 渐变色计算函数 `app/src/scenes/world/rendering/MapRenderer.ts`
- [ ] T029 [US4] 修改 render() 方法 - 读取进度状态渲染渐变色 `app/src/scenes/world/rendering/MapRenderer.ts`
- [ ] T030 [US4] 更新 CountryDetailPanel - 显示占领进度百分比 `app/src/ui/panels/CountryDetailPanel.tsx`
- [ ] T031 [US4] 添加悬停提示显示具体进度数值 `app/src/ui/panels/CountryDetailPanel.tsx`
- [ ] T032 [US4] 实现 getRenderInfo() 服务方法供渲染层调用 `app/src/core/simulation/systems/conquestProgressSystem.ts`
- [ ] T033 [P] [US4] 添加渐变色渲染的性能日志 `app/src/scenes/world/rendering/MapRenderer.ts`

**Checkpoint**: User Story 4 完成 - 视觉反馈可独立验证

---

## Phase 7: User Story 5 - 稳定性衰减机制 (Priority: P3)

**Goal**: 被蚕食的领土稳定性下降，更容易被进一步占领

**Independent Test**: 观察被多次攻击的领土稳定性是否持续下降

### Implementation for User Story 5

- [ ] T034 [US5] 实现进度增加时降低领土稳定性逻辑 `app/src/core/simulation/systems/conquestProgressSystem.ts`
- [ ] T035 [US5] 修改战斗计算 - 低稳定性领土防御力降低 `app/src/core/simulation/systems/battleSystem.ts`
- [ ] T036 [US5] 实现领土完全占领后稳定性恢复机制 `app/src/core/simulation/systems/conquestProgressSystem.ts`
- [ ] T037 [P] [US5] 编写 US5 单元测试 - 验证稳定性联动 `tests/unit/conquestProgress.test.ts`

**Checkpoint**: User Story 5 完成 - 稳定性机制可独立验证

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: 跨故事的优化和完善

- [ ] T038 [P] 添加开发者控制台显示当前争夺中的领土数量 `app/src/config/debug.config.ts`
- [ ] T039 [P] 在 PerformanceMetrics 中追踪进度计算耗时 `app/src/core/types.ts`
- [ ] T040 代码清理和格式化 - 运行 ESLint 和 Prettier
- [ ] T041 [P] 更新 quickstart.md 验证步骤 `specs/010-gradual-conquest/quickstart.md`
- [ ] T042 运行完整测试套件验证覆盖率 ≥80%
- [ ] T043 性能验证 - 确保进度计算 <2ms/tick

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3-7)**: All depend on Foundational phase completion
  - US1 和 US2 都是 P1 优先级，但 US2 依赖 US1 的基础实现
  - US3 和 US4 都是 P2 优先级，可并行开发
  - US5 是 P3 优先级，最后实现
- **Polish (Phase 8)**: Depends on all user stories being complete

### User Story Dependencies

```
Phase 1 (Setup)
    ↓
Phase 2 (Foundational) ← BLOCKS ALL
    ↓
Phase 3 (US1: 渐进式蚕食) ← MVP
    ↓
Phase 4 (US2: 拉锯战) ← 依赖 US1
    ↓
┌───────────────────────┐
│  Phase 5 (US3: 面积)  │ ← 可并行
│  Phase 6 (US4: 视觉)  │
└───────────────────────┘
    ↓
Phase 7 (US5: 稳定性)
    ↓
Phase 8 (Polish)
```

### Within Each User Story

- 核心逻辑实现 → 集成修改 → UI 更新 → 测试
- 所有 [P] 标记的任务可并行执行

### Parallel Opportunities

**Phase 1 (全部可并行)**:
- T001, T002, T003, T004

**Phase 2**:
- T009 (测试) 可与 T005-T008 并行编写

**Phase 5 & 6 (可并行)**:
- US3 (T023-T027) 和 US4 (T028-T033) 可由不同开发者同时进行

---

## Parallel Example: Phase 1 Setup

```bash
# 可同时启动的任务:
Task T001: "创建占领进度配置文件 app/src/config/conquestProgress.config.ts"
Task T002: "扩展 Territory 类型定义 app/src/core/types.ts"
Task T003: "添加进度相关类型定义 app/src/core/types.ts"
Task T004: "添加事件类型 app/src/core/events/eventTypes.ts"
```

## Parallel Example: User Story 3 & 4

```bash
# Developer A - User Story 3 (面积影响):
Task T023: "实现 getTerritorySizeCategory()"
Task T024: "应用面积系数"
Task T025: "实现实力差距乘数"

# Developer B - User Story 4 (视觉反馈):
Task T028: "实现 getContestedColor()"
Task T029: "修改 render() 方法"
Task T030: "更新 CountryDetailPanel"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (T001-T004)
2. Complete Phase 2: Foundational (T005-T009)
3. Complete Phase 3: User Story 1 (T010-T016)
4. **STOP and VALIDATE**: 启动游戏，验证战斗后显示进度而非直接占领
5. Deploy/demo if ready

### Incremental Delivery

1. Setup + Foundational → Foundation ready
2. Add US1 (渐进式蚕食) → Test → Deploy (MVP!)
3. Add US2 (拉锯战) → Test → Deploy
4. Add US3 + US4 (面积 + 视觉) → Test → Deploy
5. Add US5 (稳定性) → Test → Deploy
6. Polish → Final Release

### Parallel Team Strategy

With 2 developers:
1. Team completes Setup + Foundational together
2. Once Foundational is done:
   - Developer A: US1 → US2 → US5
   - Developer B: (等待 US1) → US3 + US4 (并行)
3. Stories complete and integrate independently

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- 性能目标：进度计算 <2ms/tick，渲染 60fps
- 测试覆盖率目标：80%

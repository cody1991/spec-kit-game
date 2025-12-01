# Tasks: 大一统平衡优化

**Input**: Design documents from `/specs/009-unification-balance/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, quickstart.md

**Tests**: 根据 spec.md 中的 Quality Guardrails，需要为每个新系统编写单元测试，覆盖率目标 80%。

**Organization**: 任务按用户故事分组，每个故事可独立实现和测试。

## Format: `[ID] [P?] [Story] Description`

- **[P]**: 可并行执行（不同文件，无依赖）
- **[Story]**: 任务所属用户故事（US1, US2, US3, US4）
- 描述中包含精确文件路径

## Path Conventions

- **Source**: `app/src/`
- **Config**: `app/src/config/`
- **Systems**: `app/src/core/simulation/systems/`
- **Tests**: `tests/unit/`, `tests/e2e/`

---

## Phase 1: Setup (配置文件准备)

**Purpose**: 创建新增配置文件，为后续系统实现做准备

- [x] T001 [P] 创建力量恢复配置文件 `app/src/config/powerRecovery.config.ts`
- [x] T002 [P] 创建决战模式配置文件 `app/src/config/endgame.config.ts`
- [x] T003 [P] 创建胜利条件配置文件 `app/src/config/victory.config.ts`

---

## Phase 2: Foundational (基础类型和状态)

**Purpose**: 扩展核心类型和状态管理，为所有用户故事提供基础

**⚠️ CRITICAL**: 此阶段必须完成后才能开始用户故事实现

- [x] T004 扩展 GameState 类型，添加决战模式状态 `app/src/core/state/store.ts`
- [x] T005 添加 `setEndgameMode` action 到 store `app/src/core/state/store.ts`

**Checkpoint**: 基础设施就绪，可以开始用户故事实现

---

## Phase 3: User Story 2 - 强者恒强的正反馈 (Priority: P1) 🎯 MVP

**Goal**: 占领更多领土的势力获得更强的攻防加成，形成明显的滚雪球效应

**Independent Test**: 观察占领 20+ 国家的势力是否比小势力明显更强（胜率 > 80%）

### Tests for User Story 2

- [x] T006 [P] [US2] 单元测试：领土加成计算 `tests/unit/territoryBonus.spec.ts`

### Implementation for User Story 2

- [x] T007 [US2] 修改领土加成配置：cityBaseFactor 0.001→0.005 `app/src/config/territoryBonus.config.ts`
- [x] T008 [US2] 修改领土加成配置：areaBaseFactor 0.8→1.2 `app/src/config/territoryBonus.config.ts`
- [x] T009 [US2] 修改领土加成配置：maxAttackBonus 0.5→0.6, maxDefenseBonus 0.4→0.5 `app/src/config/territoryBonus.config.ts`
- [x] T010 [US2] 降低小势力保护：smallFactionDefenseBonus 0.1→0.03, threshold 5→3 `app/src/config/territoryBonus.config.ts`

**Checkpoint**: 领土加成增强完成，大势力应获得明显优势

---

## Phase 4: User Story 3 - 力量恢复机制 (Priority: P2)

**Goal**: 强大势力能够恢复战斗消耗，保持力量值稳定在 60+

**Independent Test**: 观察占领 20+ 国家的势力力量值是否能保持稳定或增长

### Tests for User Story 3

- [x] T011 [P] [US3] 单元测试：力量恢复计算（每领土 0.2） `tests/unit/powerRecoverySystem.spec.ts`
- [x] T012 [P] [US3] 单元测试：力量上限 100 和下限 20 `tests/unit/powerRecoverySystem.spec.ts`
- [x] T013 [P] [US3] 单元测试：战斗胜利额外恢复 5 点 `tests/unit/powerRecoverySystem.spec.ts`

### Implementation for User Story 3

- [x] T014 [US3] 创建 PowerRecoverySystem 类 `app/src/core/simulation/systems/powerRecoverySystem.ts`
- [x] T015 [US3] 实现每 tick 力量恢复逻辑（territoryCount × 0.2） `app/src/core/simulation/systems/powerRecoverySystem.ts`
- [x] T016 [US3] 实现力量值边界约束（MIN=20, MAX=100） `app/src/core/simulation/systems/powerRecoverySystem.ts`
- [x] T017 [US3] 在 battleSystem 中添加胜利额外恢复 5 点 `app/src/core/simulation/systems/battleSystem.ts`
- [x] T018 [US3] 在 tickScheduler 中注册 PowerRecoverySystem `app/src/core/simulation/tickScheduler.ts`

**Checkpoint**: 力量恢复机制完成，大势力力量值应稳定在 60+

---

## Phase 5: User Story 1 - 观察大一统进程 (Priority: P1)

**Goal**: 游戏能在 10-30 分钟内产生胜利者，体验征服成就感

**Independent Test**: 启动游戏，观察是否能在 30 分钟内出现胜利者

**Dependencies**: 依赖 US2（领土加成）和 US3（力量恢复）提供基础

### Tests for User Story 1

- [x] T019 [P] [US1] 单元测试：85% 领土胜利条件 `tests/unit/victorySystem.spec.ts`
- [x] T020 [P] [US1] 单元测试：消灭胜利条件（仅剩 1 势力） `tests/unit/victorySystem.spec.ts`

### Implementation for User Story 1

- [x] T021 [US1] 修改 VictorySystem：添加领土胜利判定（85% 阈值） `app/src/core/simulation/systems/victorySystem.ts`
- [x] T022 [US1] 在 VictorySystem 中读取 victory.config 配置 `app/src/core/simulation/systems/victorySystem.ts`
- [x] T023 [US1] 添加胜利 UI 提示显示胜利类型（领土/消灭） `app/src/ui/modals/VictoryModal.tsx`

**Checkpoint**: 胜利条件优化完成，85% 领土即可宣布胜利

---

## Phase 6: User Story 4 - 决战阶段加速 (Priority: P2)

**Goal**: 当只剩少数势力时，游戏加速结束，避免僵持

**Independent Test**: 当只剩 3 个势力时，观察战斗频率是否增加、远程攻击概率是否提升

### Tests for User Story 4

- [x] T024 [P] [US4] 单元测试：决战模式触发条件（≤3 势力） `tests/unit/endgameMode.spec.ts`
- [x] T025 [P] [US4] 单元测试：战斗频率翻倍 `tests/unit/endgameMode.spec.ts`
- [x] T026 [P] [US4] 单元测试：远程攻击概率 40% `tests/unit/endgameMode.spec.ts`
- [x] T027 [P] [US4] 单元测试：力量消耗减半 `tests/unit/endgameMode.spec.ts`

### Implementation for User Story 4

- [x] T028 [US4] 创建 EndgameManager 模块 `app/src/core/simulation/systems/endgameManager.ts`
- [x] T029 [US4] 实现决战模式触发检测（activeCommanders ≤ 3） `app/src/core/simulation/systems/endgameManager.ts`
- [x] T030 [US4] 修改 battleSystem：决战模式下战斗频率 ×2 `app/src/core/simulation/systems/battleSystem.ts`
- [x] T031 [US4] 修改 battleSystem：决战模式下力量消耗 ×0.5 `app/src/core/simulation/systems/battleSystem.ts`
- [x] T032 [US4] 修改 targetSelector：决战模式下远程攻击概率 40% `app/src/core/simulation/systems/targetSelector.ts`
- [x] T033 [US4] 在 tickScheduler 中注册 EndgameManager `app/src/core/simulation/tickScheduler.ts`

**Checkpoint**: 决战模式完成，后期游戏应明显加速

---

## Phase 7: 联盟系统优化 (跨故事增强)

**Goal**: 防止联盟阻碍统一进程

**Dependencies**: 依赖 US4（决战模式状态）

### Tests for Alliance Optimization

- [x] T034 [P] 单元测试：决战模式禁止新联盟 `tests/unit/allianceSystem.spec.ts`
- [x] T035 [P] 单元测试：50% 领土强制解散联盟 `tests/unit/allianceSystem.spec.ts`

### Implementation for Alliance Optimization

- [x] T036 修改 allianceSystem：检查决战模式状态 `app/src/core/simulation/systems/allianceSystem.ts`
- [x] T037 修改 allianceSystem：决战模式下禁止新联盟形成 `app/src/core/simulation/systems/allianceSystem.ts`
- [x] T038 修改 allianceSystem：50% 领土后强制解散联盟 `app/src/core/simulation/systems/allianceSystem.ts`

**Checkpoint**: 联盟系统优化完成，大势力不再被联盟保护

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: 整体优化和验证

### E2E Tests

- [x] T039 [P] E2E 测试：30 分钟内产生胜利者 `tests/e2e/unification.spec.ts`
- [x] T040 [P] E2E 测试：滚雪球效应验证 `tests/e2e/unification.spec.ts`
- [x] T041 [P] E2E 测试：决战模式触发和效果 `tests/e2e/unification.spec.ts`

### UI & UX

- [x] T042 添加游戏阶段 UI 提示（早期/中期/决战） `app/src/ui/hud/DevHud.tsx`
- [x] T043 添加势力排行榜显示领土占比 `app/src/ui/hud/DevHud.tsx`

### Performance & Observability

- [x] T044 添加决战模式触发日志 `app/src/core/simulation/systems/endgameManager.ts`
- [x] T045 添加力量恢复日志 `app/src/core/simulation/systems/powerRecoverySystem.ts`
- [x] T046 性能验证：确保新系统 tick 时间增量 < 5% (通过单元测试验证)

### Documentation

- [x] T047 运行 quickstart.md 验证所有功能 `specs/009-unification-balance/quickstart.md`

---

## Dependencies & Execution Order

### Phase Dependencies

```
Phase 1 (Setup) ──────────────────────────────────────┐
                                                      │
Phase 2 (Foundational) ◄──────────────────────────────┘
    │
    ├──► Phase 3 (US2: 领土加成) ──┐
    │                              │
    ├──► Phase 4 (US3: 力量恢复) ──┼──► Phase 5 (US1: 胜利条件)
    │                              │
    └──► Phase 6 (US4: 决战模式) ──┴──► Phase 7 (联盟优化)
                                            │
                                            ▼
                                   Phase 8 (Polish)
```

### User Story Dependencies

| Story | 依赖 | 可并行 |
|-------|------|--------|
| US2 (领土加成) | Phase 2 | ✅ 可立即开始 |
| US3 (力量恢复) | Phase 2 | ✅ 可与 US2 并行 |
| US1 (胜利条件) | US2, US3 | ⚠️ 需等待 US2/US3 |
| US4 (决战模式) | Phase 2 | ✅ 可与 US2/US3 并行 |

### Within Each User Story

1. 测试先写并确保失败
2. 配置文件先于系统实现
3. 核心逻辑先于集成
4. 完成后验证独立测试

### Parallel Opportunities

```bash
# Phase 1: 所有配置文件可并行创建
T001, T002, T003 (并行)

# Phase 3-6: 用户故事可部分并行
US2 (T006-T010) | US3 (T011-T018) | US4 (T024-T033)

# Phase 8: 所有 E2E 测试可并行
T039, T040, T041 (并行)
```

---

## Parallel Example: Phase 1

```bash
# 同时启动所有配置文件创建:
Task: "创建力量恢复配置文件 app/src/config/powerRecovery.config.ts"
Task: "创建决战模式配置文件 app/src/config/endgame.config.ts"
Task: "创建胜利条件配置文件 app/src/config/victory.config.ts"
```

---

## Implementation Strategy

### MVP First (推荐)

1. ✅ Phase 1: Setup（配置文件）
2. ✅ Phase 2: Foundational（状态扩展）
3. ✅ Phase 3: US2 领土加成 ← **最快见效**
4. ✅ Phase 4: US3 力量恢复
5. **STOP and VALIDATE**: 观察是否形成滚雪球效应
6. 继续 Phase 5-8

### Full Implementation

按 Phase 顺序完成所有任务，每个 Phase 完成后验证检查点。

### Incremental Delivery

| 里程碑 | 包含 | 可验证效果 |
|--------|------|------------|
| M1 | US2 | 大势力获得明显优势 |
| M2 | M1 + US3 | 大势力力量稳定 60+ |
| M3 | M2 + US1 | 85% 领土可胜利 |
| M4 | M3 + US4 | 后期游戏加速 |
| M5 | M4 + 联盟 | 完整功能 |

---

## Notes

- [P] 标记 = 不同文件，无依赖，可并行
- [Story] 标签 = 任务归属用户故事
- 每个用户故事应可独立完成和测试
- 测试先写，确保失败后再实现
- 每个任务或逻辑组完成后提交
- 任何检查点都可停下验证

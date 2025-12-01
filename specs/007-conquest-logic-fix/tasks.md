# Tasks: 领主占领逻辑修复

**Input**: Design documents from `/specs/007-conquest-logic-fix/`
**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅, data-model.md ✅, contracts/ ✅

**Tests**: 根据 Constitution 要求，本功能需要测试先行（TDD），包含单元测试和集成测试。

**Organization**: 任务按用户故事分组，支持独立实现和测试。

## Format: `[ID] [P?] [Story] Description`

- **[P]**: 可并行执行（不同文件，无依赖）
- **[Story]**: 所属用户故事（US1, US2, US3）
- 包含精确文件路径

## Path Conventions

- **项目结构**: `app/src/` 为源码目录，`tests/` 为测试目录
- **核心逻辑**: `app/src/core/`
- **配置文件**: `app/src/config/`

---

## Phase 1: Setup (配置与基础设施)

**Purpose**: 添加占领逻辑配置文件

- [x] T001 创建占领逻辑配置文件 `app/src/config/conquest.config.ts`，定义 `ConquestConfig` 接口和默认值（85% 相邻概率）
- [x] T002 [P] 在 `app/src/core/types.ts` 中导出 `ConquestConfig` 类型（如需要）

---

## Phase 2: Foundational (基础前置任务)

**Purpose**: 核心工具函数，所有用户故事都依赖

**⚠️ CRITICAL**: 用户故事实现前必须完成此阶段

- [x] T003 创建初始化验证器 `app/src/core/generation/commanderValidator.ts`，实现 `filterValidCommanders` 函数
- [x] T004 [P] 创建目标选择器 `app/src/core/simulation/systems/targetSelector.ts`，实现 `selectTarget` 函数（85%/15% 概率逻辑）
- [x] T005 [P] 为验证器和选择器添加 JSDoc 注释和类型导出

**Checkpoint**: 基础工具函数就绪，可开始用户故事实现 ✅

---

## Phase 3: User Story 1 - 领主初始化必须拥有国家 (Priority: P1) 🎯 MVP

**Goal**: 确保每个活跃领主在游戏开始时至少控制一个国家，无领土的领主被排除

**Independent Test**: 启动新游戏，验证所有活跃领主的 `controlledTerritories.length >= 1`

### Tests for User Story 1

- [x] T006 [P] [US1] 单元测试：验证 `filterValidCommanders` 过滤无领土领主 `tests/unit/commanderValidator.spec.ts`
- [x] T007 [P] [US1] 单元测试：验证有领土领主被保留 `tests/unit/commanderValidator.spec.ts`
- [ ] T008 [P] [US1] 集成测试：验证 `createInitialWorld` 返回的领主都有领土 `tests/integration/conquest-logic.spec.ts`

### Implementation for User Story 1

- [x] T009 [US1] 修改 `app/src/core/generation/createInitialWorld.ts`：在返回前调用 `filterValidCommanders` 过滤无领土领主
- [x] T010 [US1] 在 `createInitialWorld.ts` 添加日志：记录被排除的领主数量和原因
- [x] T011 [US1] 更新 `createInitialWorld.ts` 返回值类型注释，说明领主已验证

**Checkpoint**: User Story 1 完成，所有活跃领主都有初始领土 ✅

---

## Phase 4: User Story 2 - 占领更倾向于相邻国家 (Priority: P1)

**Goal**: 领主攻击目标 85% 概率选择相邻国家，15% 概率远程攻击

**Independent Test**: 运行 1000 次目标选择，统计相邻/远程比例应接近 85%/15%

### Tests for User Story 2

- [x] T012 [P] [US2] 单元测试：验证 `selectTarget` 在有相邻目标时 85% 选择相邻 `tests/unit/targetSelector.spec.ts`
- [x] T013 [P] [US2] 单元测试：验证 `selectTarget` 在无相邻目标时选择远程 `tests/unit/targetSelector.spec.ts`
- [x] T014 [P] [US2] 单元测试：验证概率分布（1000次模拟，允许±5%误差）`tests/unit/targetSelector.spec.ts`
- [ ] T015 [P] [US2] 集成测试：验证 `BattleSystem` 使用新目标选择逻辑 `tests/integration/conquest-logic.spec.ts`

### Implementation for User Story 2

- [x] T016 [US2] 修改 `app/src/core/simulation/systems/battleSystem.ts`：引入 `targetSelector` 替换原有目标选择逻辑
- [x] T017 [US2] 在 `battleSystem.ts` 中实现远程目标池构建（所有非己方领土）
- [x] T018 [US2] 在 `battleSystem.ts` 添加 debug 日志：记录每次目标选择类型（相邻/远程）
- [x] T019 [US2] 更新 `BattleEvent` 叙事文本：区分相邻占领和远程占领

**Checkpoint**: User Story 2 完成，目标选择符合 85%/15% 概率分布 ✅

---

## Phase 5: User Story 3 - 游戏过程中领主数量只减不增 (Priority: P2)

**Goal**: 游戏运行后不会有新领主加入，已淘汰领主不会复活

**Independent Test**: 记录游戏开始时领主数量 N，运行 100 tick 后验证数量 ≤ N

### Tests for User Story 3

- [x] T020 [P] [US3] 单元测试：验证 `store.ts` 无法在游戏运行后添加新领主 `tests/unit/store.spec.ts`
- [x] T021 [P] [US3] 单元测试：验证已淘汰领主无法恢复为活跃状态 `tests/unit/store.spec.ts`
- [ ] T022 [P] [US3] 集成测试：验证 100 tick 后领主数量只减不增 `tests/integration/conquest-logic.spec.ts`

### Implementation for User Story 3

- [x] T023 [US3] 修改 `app/src/core/state/store.ts`：添加 `gameStarted` 标志，阻止游戏开始后添加领主
- [x] T024 [US3] 修改 `store.ts` 的 `updateCommander` 方法：禁止将 `eliminated` 状态改回 `active`
- [x] T025 [US3] 在 `store.ts` 添加防护日志：记录被阻止的非法操作

**Checkpoint**: User Story 3 完成，领主数量守恒 ✅

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: 代码质量、文档和最终验证

- [x] T026 [P] 运行 `pnpm lint` 并修复所有 lint 错误
- [ ] T027 [P] 运行 `pnpm format` 确保代码格式一致
- [ ] T028 [P] 更新 `specs/007-conquest-logic-fix/quickstart.md` 验证步骤
- [x] T029 运行完整测试套件 `pnpm test` 确保所有测试通过
- [ ] T030 手动验证：启动游戏，观察 100 tick 后领土分布是否符合预期
- [ ] T031 [P] 更新 `CODEBUDDY.md` 或相关文档，记录新增配置项

---

## Dependencies & Execution Order

### Phase Dependencies

```
Phase 1 (Setup)
    │
    ▼
Phase 2 (Foundational) ─── BLOCKS ALL USER STORIES
    │
    ├──────────────────────────────────┐
    ▼                                  ▼
Phase 3 (US1)                    Phase 4 (US2)
    │                                  │
    └──────────────┬───────────────────┘
                   ▼
            Phase 5 (US3)
                   │
                   ▼
            Phase 6 (Polish)
```

### User Story Dependencies

- **User Story 1 (P1)**: 依赖 Phase 2，无其他故事依赖
- **User Story 2 (P1)**: 依赖 Phase 2，无其他故事依赖，可与 US1 并行
- **User Story 3 (P2)**: 依赖 Phase 2，建议在 US1/US2 后实现（优先级较低）

### Within Each User Story

- 测试先行：先编写失败测试
- 实现功能：使测试通过
- 添加日志：可观测性
- 验证检查点

### Parallel Opportunities

- **Phase 1**: T001, T002 可并行
- **Phase 2**: T003, T004, T005 可并行
- **Phase 3 Tests**: T006, T007, T008 可并行
- **Phase 4 Tests**: T012, T013, T014, T015 可并行
- **Phase 5 Tests**: T020, T021, T022 可并行
- **Phase 6**: T026, T027, T028, T031 可并行
- **跨故事**: US1 和 US2 可并行开发（不同文件）

---

## Parallel Example: User Story 2

```bash
# 并行启动所有 US2 测试任务：
Task: "T012 单元测试：验证 selectTarget 在有相邻目标时 85% 选择相邻"
Task: "T013 单元测试：验证 selectTarget 在无相邻目标时选择远程"
Task: "T014 单元测试：验证概率分布（1000次模拟）"
Task: "T015 集成测试：验证 BattleSystem 使用新目标选择逻辑"

# 测试完成后，顺序执行实现任务：
Task: "T016 修改 battleSystem.ts 引入 targetSelector"
Task: "T017 实现远程目标池构建"
Task: "T018 添加 debug 日志"
Task: "T019 更新 BattleEvent 叙事文本"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. 完成 Phase 1: Setup（配置文件）
2. 完成 Phase 2: Foundational（验证器和选择器）
3. 完成 Phase 3: User Story 1（初始化验证）
4. **STOP and VALIDATE**: 启动游戏验证所有领主有领土
5. 可部署/演示 MVP

### Incremental Delivery

1. Setup + Foundational → 基础就绪
2. 添加 US1 → 独立测试 → 部署/演示 (MVP!)
3. 添加 US2 → 独立测试 → 部署/演示
4. 添加 US3 → 独立测试 → 部署/演示
5. 每个故事独立增加价值

### Suggested MVP Scope

**仅 User Story 1**：确保所有领主有初始领土
- 这是最基础的修复，解决"凭空出现"的问题
- 可快速验证和部署
- US2 和 US3 可作为后续迭代

---

## Notes

- [P] 任务 = 不同文件，无依赖，可并行
- [Story] 标签映射到具体用户故事
- 每个用户故事可独立完成和测试
- 测试先行：确保测试先失败再实现
- 每个任务或逻辑组完成后提交
- 在任何检查点停止验证故事独立性
- 避免：模糊任务、同文件冲突、破坏独立性的跨故事依赖

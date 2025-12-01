# Tasks: 战报排序与领土更新修复

**Input**: Design documents from `/specs/004-fix-battle-territory-bugs/`  
**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅, data-model.md ✅, contracts/ ✅

**Tests**: 本项目明确要求测试驱动开发（TDD），所有测试任务标记为优先执行

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each bug fix

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2)
- Include exact file paths in descriptions

## Path Conventions

本项目使用单体Web SPA结构：

- **Source**: `app/src/` at repository root
- **Tests**: `tests/` at repository root (unit/, contract/, e2e/)

## Constitution-Driven Task Requirements

- ✅ 每个用户故事包含代码质量任务（ESLint验证、JSDoc文档、复杂度检查）
- ✅ 测试金字塔完整：单元测试 → 集成测试 → E2E测试
- ✅ 性能任务包含具体指标（排序<5ms、更新<1ms、60 FPS）
- ✅ 可观测性任务定义日志格式和控制台验证方法

---

## Phase 1: Setup (Verification & Baseline)

**Purpose**: 验证问题存在并建立测试基线

- [ ] T001 Verify existing battle report sorting bug via console inspection
- [ ] T002 Verify existing territory update bug via store inspection
- [ ] T003 [P] Run baseline test suite to establish current coverage (pnpm test)
- [ ] T004 [P] Document current bug reproduction steps in quickstart.md validation section

---

## Phase 2: Foundational (Test Infrastructure)

**Purpose**: 建立测试基础设施和合约测试框架

**⚠️ CRITICAL**: 所有用户故事的测试依赖这些基础设施

- [ ] T005 Create test fixtures for BattleEvent generation in tests/unit/fixtures/battleEvent.fixture.ts
- [ ] T006 [P] Create mock store implementation for territory sync tests in tests/unit/mocks/mockStore.ts
- [ ] T007 [P] Setup Vitest configuration for contract tests in tests/contract/
- [ ] T008 Add timestamp validation utility in tests/utils/timestamp.util.ts

**Checkpoint**: 测试框架就绪 - 用户故事的测试可以并行编写

---

## Phase 3: User Story 1 - 战报按时间正序显示且去重 (Priority: P1) 🎯 MVP

**Goal**: 修复战报系统的排序混乱和ID重复问题，确保最新战报始终显示在顶部

**Independent Test**: 运行游戏5分钟，检查战报面板中20条战报按时间戳降序排列且无重复ID

**Acceptance Criteria**:

- 战报按timestamp降序排列（最新在顶部）
- 无重复事件ID
- 相同时间戳的事件按ID稳定排序
- 控制台无"Duplicate battle event"警告

### Tests for User Story 1 (测试先行 - 必须失败后再实施修复) ⚠️

- [ ] T009 [P] [US1] Write failing unit test for generateBattleEventId uniqueness in tests/unit/core/battleSystem.spec.ts
  - Test C-001: 1000次连续生成无重复
  - Test C-002: ID格式验证 (battle-{timestamp}-{counter})
  - Test C-003: 计数器单调递增
  - Test C-004: resetBattleEventCounter后计数器归零

- [ ] T010 [P] [US1] Write failing unit test for BattleEvent timestamp validation in tests/unit/core/battleSystem.spec.ts
  - Test C-005: ISO 8601格式验证
  - Test C-006: 时间戳在当前时间1秒内
  - Test C-007: 检测无效时间戳格式

- [ ] T011 [P] [US1] Write failing unit test for BattleTimeline sorting in tests/unit/ui/BattleTimeline.spec.tsx
  - Test C-008: 时间戳降序排序
  - Test C-009: 相同时间戳按ID排序
  - Test C-011: 稳定排序验证

- [ ] T012 [P] [US1] Write failing unit test for event deduplication in tests/unit/ui/BattleTimeline.spec.tsx
  - Test C-010: 去重逻辑（重复ID只保留一个）
  - 验证使用Map.set去重机制

- [ ] T013 [US1] Write failing E2E test for battle report ordering in tests/e2e/us1-battle-report-order.spec.ts
  - 运行5分钟游戏会话
  - 检查战报面板中至少10条事件
  - 验证时间戳降序
  - 验证无重复ID

**Checkpoint**: 所有US1测试已编写并失败 - 准备开始实施修复

### Implementation for User Story 1

- [x] T014 [US1] Implement global battleEventCounter in app/src/core/simulation/systems/battleSystem.ts
  - 在文件顶部添加 `let battleEventCounter = 0;`
  - 实现 `export function resetBattleEventCounter() { battleEventCounter = 0; }`
  - 实现 `export function generateBattleEventId() { return \`battle-${Date.now()}-${battleEventCounter++}\`; }`
  - 添加JSDoc注释说明ID生成策略

- [x] T015 [US1] Replace all BattleEvent ID generation with generateBattleEventId() in app/src/core/simulation/systems/battleSystem.ts
  - 替换 `executeBattle()` 中的ID生成
  - 替换 `occupyNeutralTerritory()` 中的ID生成
  - 搜索所有 `battle-${Date.now()}-${Math.random()}` 并替换
  - 验证：pnpm lint通过，无TypeScript错误

- [ ] T016 [US1] Add ID conflict detection in store.addBattleEvent() in app/src/core/state/store.ts
  - 在添加事件前检查 `eventLog` 中是否存在相同ID
  - 如果冲突，记录 `console.warn('[BattleEvent] Duplicate ID detected: ${id}')`
  - 重新生成ID（调用 `generateBattleEventId()`）
  - 限制最多重试3次

- [x] T017 [US1] Implement deduplication logic in BattleTimeline component in app/src/ui/panels/BattleTimeline.tsx
  - 创建 `useMemo` hook计算 `recentEvents`
  - 使用 `Map<string, BattleEvent>` 去重（key为event.id）
  - 添加timestamp有效性检查（`isNaN(new Date(timestamp).getTime())`）
  - 实现稳定排序：时间戳降序 → ID字符串降序
  - 提取前20条

- [ ] T018 [US1] Add timestamp standardization in BattleEvent generation in app/src/core/simulation/systems/battleSystem.ts
  - 确保所有战报使用 `new Date().toISOString()` 生成timestamp
  - 添加timestamp验证注释
  - 检查所有创建BattleEvent的位置

- [x] T019 [US1] Integrate counter reset in store.resetGame() in app/src/core/state/store.ts
  - 在文件顶部导入 `import { resetBattleEventCounter } from '../simulation/systems/battleSystem';`
  - 在 `resetGame` 函数开头调用 `resetBattleEventCounter();`
  - 添加注释说明重置的必要性

- [ ] T020 [US1] Add logging for battle event generation in app/src/core/simulation/systems/battleSystem.ts
  - 在 `generateBattleEventId()` 中添加 `console.log('[BattleEvent] Generated: ${id} at ${timestamp}')`
  - 在 `store.addBattleEvent()` 检测到重复时记录详细信息
  - 使用条件日志（仅在开发模式）

- [ ] T021 [US1] Add code quality checks for User Story 1
  - 运行 `pnpm lint:fix` 修复格式问题
  - 验证 `battleSystem.ts` 循环复杂度<15
  - 验证所有新增函数有JSDoc注释
  - 提交前运行 `pnpm test -- battleSystem.spec.ts BattleTimeline.spec.tsx`

**Checkpoint**: User Story 1修复完成 - 所有测试应通过

---

## Phase 4: User Story 2 - 地图领土实时更新 (Priority: P1)

**Goal**: 修复地图领土初始化后不更新的问题，实现双向同步和订阅式渲染

**Independent Test**: 运行游戏5分钟，观察地图上至少3次领土易手时颜色立即更新（1秒内）

**Acceptance Criteria**:

- 初始化时所有国家在territoryStates中有记录
- 战斗导致领土易手时territories和territoryStates同步更新
- 地图颜色在1秒内响应变化
- 控制台无"Territory state not found"警告

### Tests for User Story 2 (测试先行 - 必须失败后再实施修复) ⚠️

- [ ] T022 [P] [US2] Write failing contract test for territory bidirectional sync in tests/contract/territorySync.contract.spec.ts
  - Test C-101: updateTerritory时同步territoryStates
  - Test C-102: conqueredAt时间戳更新
  - Test C-103: transitionProgress重置为0
  - Test C-104: garrison和stability同步（无owner变化）

- [ ] T023 [P] [US2] Write failing contract test for territory initialization in tests/contract/territorySync.contract.spec.ts
  - Test C-105: 所有国家都有TerritoryState
  - Test C-106: 缺失时创建默认状态
  - Test C-107: 检测缺失的TerritoryState

- [ ] T024 [P] [US2] Write failing contract test for subscription mechanism in tests/contract/territorySync.contract.spec.ts
  - Test C-108: ownerId变化时通知订阅者
  - Test C-109: 非owner变化不通知
  - Test C-110: unsubscribe后停止通知

- [ ] T025 [P] [US2] Write failing contract test for consistency verification in tests/contract/territorySync.contract.spec.ts
  - Test C-111: 检测owner不一致
  - Test C-112: 完全同步时验证通过

- [ ] T026 [US2] Write failing E2E test for territory visualization in tests/e2e/us2-territory-visualization.spec.ts
  - 检查初始化时地图颜色正确
  - 监听控制台日志捕获"Territory update"
  - 等待至少3次战斗
  - 验证地图颜色随战报更新

**Checkpoint**: 所有US2测试已编写并失败 - 准备开始实施修复

### Implementation for User Story 2

- [x] T027 [US2] Implement bidirectional sync in store.updateTerritory() in app/src/core/state/store.ts
  - 修改 `updateTerritory` 方法
  - 检测 `updates.ownerId` 是否定义
  - 如果ownerId变化：同步更新territoryStates Map
  - 设置 `previousOwnerId`、`conqueredAt: Date.now()`、`transitionProgress: 0`
  - 使用不可变模式：`new Map(state.territoryStates)`
  - 返回 `{ territories: newTerritories, territoryStates: newStates }`

- [x] T028 [US2] Add territory state initialization verification in app/src/scenes/world/WorldScene.ts
  - 实现 `private verifyTerritoryStatesComplete(): void`
  - 遍历 `state.countries`，检查每个是否在 `state.territoryStates` 中
  - 缺失时创建默认TerritoryState（ownerId: null, troops: 0, defense: 50）
  - 记录警告：`console.warn('Created default states for ${missingStates.length} territories')`
  - 在 `create()` 方法末尾调用

- [x] T029 [US2] Implement subscription mechanism in app/src/scenes/world/WorldScene.ts
  - 添加私有属性：`private territorySubscription?: () => void`
  - 实现 `private setupTerritorySubscription(): void`
  - 使用 `useGameStore.subscribe((state) => state.territoryStates, callback)`
  - 在回调中检测ownerId变化
  - 调用 `this.handleTerritoryOwnershipChange(territoryId, newState)`
  - 在 `create()` 末尾调用

- [x] T030 [US2] Implement territory ownership change handler in app/src/scenes/world/WorldScene.ts
  - 实现 `private handleTerritoryOwnershipChange(territoryId: string, newState: TerritoryState): void`
  - 从 `colorMappings` 获取颜色
  - 如果colorMapping存在：调用 `this.mapRenderer.updateCountry()`
  - 如果缺失：记录警告并使用默认灰色（0x808080）
  - 添加日志：`console.log('Map updated: ${territoryId} → ${newState.ownerId}')`

- [x] T031 [US2] Add subscription cleanup in WorldScene.shutdown() in app/src/scenes/world/WorldScene.ts
  - 在 `shutdown()` 方法中检查 `this.territorySubscription`
  - 如果存在，调用 `this.territorySubscription()` 取消订阅
  - 设置 `this.territorySubscription = undefined`
  - 添加注释说明防止内存泄漏

- [ ] T032 [P] [US2] Add defensive rendering for missing color mappings in app/src/scenes/world/WorldScene.ts
  - 在 `handleTerritoryOwnershipChange()` 中添加fallback
  - 使用默认CommanderColor对象：`{ primary: 0x808080, alpha: 0.7 }`
  - 确保地图不会因缺失映射而崩溃

- [ ] T033 [US2] Add logging for territory updates in app/src/core/state/store.ts
  - 在 `updateTerritory` 中检测ownerId变化时记录
  - 格式：`console.log('[Territory] Ownership changed: ${id} ${oldOwner} → ${newOwner}')`
  - 在 `updateTerritoryState` 中记录同步操作

- [ ] T034 [US2] Add code quality checks for User Story 2
  - 运行 `pnpm lint:fix` 修复格式问题
  - 验证 `store.ts` 和 `WorldScene.ts` 循环复杂度<15
  - 检查所有新增方法有JSDoc注释
  - 验证Map更新使用不可变模式
  - 提交前运行 `pnpm test -- territorySync.contract.spec.ts`

**Checkpoint**: User Story 2修复完成 - 所有测试应通过

---

## Phase 5: Integration & Cross-Story Validation

**Purpose**: 验证两个用户故事的集成和端到端行为

- [ ] T035 [P] Run full unit test suite with coverage report (pnpm test:coverage)
  - 验证覆盖率≥90%
  - 检查修改的4个文件是否全部覆盖
  - 生成覆盖率报告并检查未覆盖的分支

- [ ] T036 [P] Run complete E2E test suite (pnpm test:e2e)
  - us1-battle-report-order.spec.ts应通过
  - us2-territory-visualization.spec.ts应通过
  - us1-start-game.spec.ts中战报顺序验证通过
  - us2-territory-visualization.spec.ts中地图更新验证通过

- [ ] T037 Verify both user stories work together in full game session
  - 启动游戏并运行10分钟
  - 同时验证战报排序和地图更新
  - 检查控制台无错误或警告
  - 验证帧率保持60 FPS

- [ ] T038 Run quickstart.md validation procedures
  - 执行"验证修复（修复后）"部分的所有检查
  - 战报ID唯一性断言通过
  - 领土同步断言通过
  - 控制台日志显示正确的事件

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: 性能优化、文档更新和最终质量保障

- [ ] T039 [P] Performance profiling for battle report rendering
  - 使用 `console.time/timeEnd` 测量排序耗时
  - 验证200条记录排序<5ms
  - 在Dev HUD中显示战报渲染指标
  - 如果超时，考虑降级策略（显示10条）

- [ ] T040 [P] Performance profiling for territory updates
  - 测量订阅回调执行时间
  - 验证单次领土更新<1ms
  - 使用Chrome DevTools Timeline验证无帧率下降
  - 验证60 FPS保持稳定

- [ ] T041 Memory leak testing with multiple game sessions
  - 使用Chrome DevTools Memory Profiler
  - 运行3次完整游戏会话（开局→结束→重新开局）
  - 检查内存增长<10%
  - 验证订阅正确清理

- [ ] T042 [P] Update COMPLETION_REPORT.md with bug fixes
  - 记录两个bug的根因分析
  - 记录实施的解决方案
  - 添加修复前后的对比截图
  - 更新已知问题列表

- [ ] T043 [P] Update README.md with bug fix notes
  - 在"Latest Improvements"部分添加条目
  - 说明战报排序和领土更新已修复
  - 提供验证步骤链接（quickstart.md）

- [ ] T044 Code review checklist validation
  - 验证ESLint无警告（pnpm lint）
  - 验证Prettier格式正确（pnpm format）
  - 检查所有修改文件的复杂度
  - 验证JSDoc注释完整
  - 检查不可变模式使用

- [ ] T045 [P] Final observability checks
  - 验证所有日志格式一致
  - 检查4类关键日志都已实现
  - 测试性能指标收集
  - 验证控制台无未预期的警告

- [ ] T046 Prepare PR with detailed description
  - 标题：`fix: 战报排序和领土更新问题 (#004)`
  - 描述包含问题根因、解决方案、测试覆盖
  - 附加测试截图和控制台日志
  - 链接到规范文档和任务列表
  - 标记为"Ready for Review"

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: 无依赖 - 立即开始
- **Phase 2 (Foundational)**: 依赖Phase 1 - 阻塞所有用户故事测试
- **Phase 3 (US1)**: 依赖Phase 2完成 - 可独立实施
- **Phase 4 (US2)**: 依赖Phase 2完成 - 可独立实施，与US1无依赖
- **Phase 5 (Integration)**: 依赖US1和US2完成
- **Phase 6 (Polish)**: 依赖Phase 5完成

### User Story Dependencies

- **User Story 1 (战报排序)**: 独立故事，无依赖
  - 修改文件：`battleSystem.ts`, `BattleTimeline.tsx`, `store.ts`（部分）
  - 可以独立测试和部署

- **User Story 2 (领土更新)**: 独立故事，无依赖
  - 修改文件：`store.ts`（部分）, `WorldScene.ts`
  - 可以独立测试和部署

**关键点**: US1和US2修改 `store.ts` 的不同部分：

- US1修改 `addBattleEvent()` 和 `resetGame()`
- US2修改 `updateTerritory()`
- 无代码冲突风险

### Within Each User Story

**US1执行顺序**：

1. T009-T013: 编写所有测试（并行）→ 验证失败
2. T014: 实现计数器（foundational）
3. T015-T018: 实施修复（可部分并行）
4. T019: 集成重置逻辑
5. T020-T021: 日志和质量检查

**US2执行顺序**：

1. T022-T026: 编写所有测试（并行）→ 验证失败
2. T027: 实现双向同步（foundational）
3. T028-T030: 实施订阅机制（顺序依赖）
4. T031-T033: 清理和日志
5. T034: 质量检查

### Parallel Opportunities

**Setup阶段（Phase 1）**：

- T002, T003, T004 可并行

**Foundational阶段（Phase 2）**：

- T005, T006, T007, T008 可并行

**US1测试阶段**：

- T009, T010, T011, T012 可并行

**US2测试阶段**：

- T022, T023, T024, T025 可并行

**US1和US2实施**：

- 如果有2名开发者，US1和US2可完全并行
- 修改的文件不冲突，可独立提交

**Integration阶段（Phase 5）**：

- T035, T036 可并行

**Polish阶段（Phase 6）**：

- T039, T040, T041 可并行
- T042, T043, T045 可并行

---

## Parallel Example: User Story 1 Tests

```bash
# 同时启动所有US1测试编写（4个任务并行）:
Task T009: "Write failing unit test for ID generation"
Task T010: "Write failing unit test for timestamp validation"
Task T011: "Write failing unit test for sorting"
Task T012: "Write failing unit test for deduplication"

# 验证所有测试失败后，开始实施
Task T014: "Implement counter" (blocking)
# 然后并行实施部分修复
Task T015: "Replace ID generation"
Task T016: "Add conflict detection"
```

---

## Parallel Example: User Story 2 Tests

```bash
# 同时启动所有US2测试编写（4个任务并行）:
Task T022: "Contract test for bidirectional sync"
Task T023: "Contract test for initialization"
Task T024: "Contract test for subscription"
Task T025: "Contract test for consistency"

# 验证所有测试失败后，开始实施
Task T027: "Implement bidirectional sync" (blocking)
Task T028: "Add initialization verification"
Task T029: "Implement subscription"
```

---

## Implementation Strategy

### MVP First (推荐 - 两个P1故事都是MVP)

由于两个用户故事都是P1优先级且互相独立，MVP应包含两者：

1. ✅ Complete Phase 1: Setup（验证问题）
2. ✅ Complete Phase 2: Foundational（测试基础设施）
3. ✅ Complete Phase 3: User Story 1（战报排序）
   - **独立验证点**: 战报面板按时间倒序、无重复
4. ✅ Complete Phase 4: User Story 2（领土更新）
   - **独立验证点**: 地图颜色随战斗更新
5. ✅ Complete Phase 5: Integration（集成验证）
6. ✅ Deploy/Demo: 两个致命bug都已修复

### Incremental Delivery

如果需要分阶段交付：

1. **快速修复（仅US1）** - 2-3小时
   - Complete Setup + Foundational → 测试就绪
   - Complete User Story 1 → 战报排序修复
   - **交付价值**: 玩家可以追踪战斗动态
   - **限制**: 地图仍不更新

2. **完整修复（US1 + US2）** - 4-6小时
   - Add User Story 2 → 地图领土更新修复
   - **交付价值**: 游戏完全可玩，两个核心反馈都正常
   - **推荐**: 这是最小可用修复（两个P1问题都是致命的）

3. **打磨版本（包含Polish）** - 6-8小时
   - Add Phase 5 & 6 → 性能优化、文档更新
   - **交付价值**: 生产就绪，性能监控完善

### Parallel Team Strategy

如果有2名开发者：

1. **共同完成**: Setup + Foundational（30分钟）
2. **分工并行**:
   - **Developer A**: User Story 1（战报系统）
     - 修改 `battleSystem.ts`, `BattleTimeline.tsx`
     - 预计2-3小时
   - **Developer B**: User Story 2（领土更新）
     - 修改 `store.ts`, `WorldScene.ts`
     - 预计2-3小时
3. **共同完成**: Integration + Polish（1-2小时）

**总时间**: 约4-5小时（相比顺序执行的6-8小时节省30-40%）

---

## Task Summary

**Total Tasks**: 46

### By Phase:

- Phase 1 (Setup): 4 tasks
- Phase 2 (Foundational): 4 tasks
- Phase 3 (User Story 1): 13 tasks (5 test tasks, 8 implementation tasks)
- Phase 4 (User Story 2): 13 tasks (5 test tasks, 8 implementation tasks)
- Phase 5 (Integration): 4 tasks
- Phase 6 (Polish): 8 tasks

### By User Story:

- **User Story 1 (战报排序)**: 13 tasks
  - Tests: 5 tasks (T009-T013)
  - Implementation: 8 tasks (T014-T021)
- **User Story 2 (领土更新)**: 13 tasks
  - Tests: 5 tasks (T022-T026)
  - Implementation: 8 tasks (T027-T034)

### Parallel Opportunities:

- **21 tasks** marked with [P] can run in parallel within their phases
- **2 user stories** can be implemented completely in parallel (US1 & US2)
- **Estimated time savings**: 30-40% with parallel execution

### Test Coverage:

- **Unit tests**: 9 test suites (ID生成、timestamp、排序、去重、同步、初始化、订阅)
- **Contract tests**: 12 contract scenarios (C-101 to C-112)
- **E2E tests**: 2 scenarios (战报顺序、领土可视化)
- **Total test tasks**: 10 tasks (22% of all tasks)

### MVP Scope:

**Both User Stories (US1 + US2)** constitute the MVP as both bugs are critical:

- ✅ 战报排序修复 → 玩家可以追踪战斗
- ✅ 领土更新修复 → 玩家可以看到势力变化
- 🎯 两者缺一不可，都是P1致命问题

### Format Validation:

✅ All 46 tasks follow the required checklist format:

- ✅ Checkbox prefix `- [ ]`
- ✅ Sequential Task ID (T001-T046)
- ✅ [P] marker for 21 parallelizable tasks
- ✅ [Story] label for 26 user story tasks (US1, US2)
- ✅ File paths included in descriptions
- ✅ Clear action verbs and specific deliverables

---

## Notes

- **[P] tasks**: 不同文件，无依赖，可并行执行
- **[Story] label**: 映射到spec.md中的用户故事，便于追踪
- **独立性**: US1和US2可以独立完成、测试和部署
- **测试驱动**: 所有测试必须先编写并失败，再实施修复
- **提交建议**: 每完成一个phase或user story后提交
- **验证点**: 每个phase后都有checkpoint，确保故事独立可测试
- **避免**: 模糊任务、文件冲突、跨故事依赖（破坏独立性）

**关键成功因素**:

1. ✅ 测试先行（TDD）确保修复正确性
2. ✅ 双向同步和订阅机制避免未来bug
3. ✅ 性能监控确保无性能退化
4. ✅ 详细日志便于问题追踪
5. ✅ 独立的用户故事支持并行开发

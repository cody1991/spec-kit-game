# Tasks: 国土领土加成系统

**Input**: Design documents from `/specs/008-territory-bonus/`
**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅, data-model.md ✅, contracts/ ✅

**Tests**: 根据 Constitution 测试门禁要求，本功能包含单元测试任务。

**Organization**: 任务按用户故事分组，支持独立实现和测试。

## Format: `[ID] [P?] [Story] Description`

- **[P]**: 可并行执行（不同文件，无依赖）
- **[Story]**: 所属用户故事 (US1, US2, US3)
- 描述中包含精确文件路径

## Path Conventions

基于 plan.md 的项目结构：
- **源码**: `app/src/`
- **测试**: `tests/unit/`

---

## Phase 1: Setup (类型定义与配置)

**Purpose**: 添加新类型定义和默认配置，为后续实现奠定基础

- [ ] T001 [P] 在 `app/src/core/types.ts` 中添加 `TerritoryBonusConfig` 接口定义
- [ ] T002 [P] 在 `app/src/core/types.ts` 中添加 `TerritoryBonus` 接口定义
- [ ] T003 [P] 在 `app/src/core/types.ts` 中添加 `ContiguityAnalysis` 接口定义
- [ ] T004 在 `app/src/core/types.ts` 中扩展 `FactionStatistics` 接口，添加 `territoryBonus` 字段
- [ ] T005 [P] 创建 `app/src/config/territoryBonus.config.ts`，定义 `DEFAULT_TERRITORY_BONUS_CONFIG`

---

## Phase 2: Foundational (核心服务框架)

**Purpose**: 创建加成计算服务的核心框架，为所有用户故事提供基础

**⚠️ CRITICAL**: 用户故事实现依赖此阶段完成

- [ ] T006 创建 `app/src/core/services/territoryBonusService.ts` 服务类框架（含空方法签名）
- [ ] T007 在 `app/src/core/state/store.ts` 中添加 `territoryBonusConfig` 状态字段
- [ ] T008 在 `app/src/core/state/store.ts` 中添加 `updateTerritoryBonus` action
- [ ] T009 在 `app/src/core/state/store.ts` 中添加 `setTerritoryBonusConfig` action

**Checkpoint**: 基础框架就绪，可开始用户故事实现

---

## Phase 3: User Story 1 - 大国获得领土加成 (Priority: P1) 🎯 MVP

**Goal**: 实现基于城市数量和领土面积的属性加成计算，让大国获得战斗优势

**Independent Test**: 观察拥有10个城市的势力与拥有3个城市的势力的属性差异

### Tests for User Story 1

- [ ] T010 [P] [US1] 创建 `tests/unit/territoryBonusService.test.ts`，编写城市加成计算测试用例
- [ ] T011 [P] [US1] 在测试文件中添加面积加成计算测试用例
- [ ] T012 [P] [US1] 在测试文件中添加连通分量检测测试用例
- [ ] T013 [P] [US1] 在测试文件中添加加成上限（30%）测试用例

### Implementation for User Story 1

- [ ] T014 [US1] 在 `territoryBonusService.ts` 中实现 `calculateCityBonus()` 方法（递减增长曲线）
- [ ] T015 [US1] 在 `territoryBonusService.ts` 中实现 `calculateAreaBonus()` 方法（递减增长曲线）
- [ ] T016 [US1] 在 `territoryBonusService.ts` 中实现 `analyzeContiguity()` 方法（BFS连通分量检测）
- [ ] T017 [US1] 在 `territoryBonusService.ts` 中实现 `calculateContinuityBonus()` 方法（连续区域额外加成）
- [ ] T018 [US1] 在 `territoryBonusService.ts` 中实现 `calculateTotalBonus()` 方法（汇总所有加成）
- [ ] T019 [US1] 在 `app/src/core/services/factionStatsService.ts` 的 `handleTerritoryChange()` 中集成加成计算
- [ ] T020 [US1] 在 `app/src/core/simulation/systems/battleSystem.ts` 中应用加成到战斗计算
- [ ] T021 [US1] 添加加成计算日志输出（使用现有 logger）

**Checkpoint**: 大国获得领土加成功能完整可用，战斗中可观察到加成效果

---

## Phase 4: User Story 2 - 加成效果可视化展示 (Priority: P2)

**Goal**: 在势力信息面板中清晰展示领土加成的具体数值和来源

**Independent Test**: 查看势力信息面板，确认显示了领土加成的具体数值和来源

### Implementation for User Story 2

- [ ] T022 [P] [US2] 创建 `app/src/ui/components/TerritoryBonusDisplay.tsx` 加成展示组件
- [ ] T023 [P] [US2] 创建 `app/src/ui/components/TerritoryBonusDisplay.css` 样式文件
- [ ] T024 [US2] 修改 `app/src/ui/panels/FactionStatsPanel.tsx`，集成 TerritoryBonusDisplay 组件
- [ ] T025 [US2] 在面板中展示基础属性与加成明细的对比（分开显示）
- [ ] T026 [US2] 添加加成来源说明（城市数量、领土面积、连续区域）
- [ ] T027 [US2] 确保领土变化后 UI 实时更新加成数值

**Checkpoint**: 玩家可在势力面板中清晰查看加成明细，理解加成来源

---

## Phase 5: User Story 3 - 小国生存机制 (Priority: P3)

**Goal**: 为小势力提供防御加成，保持游戏平衡性

**Independent Test**: 观察只有2个城市的小势力在与大势力战斗时是否仍有一定胜率

### Tests for User Story 3

- [ ] T028 [P] [US3] 在 `tests/unit/territoryBonusService.test.ts` 中添加小势力防御加成测试用例
- [ ] T029 [P] [US3] 添加加成上限验证测试用例（确保不超过30%）

### Implementation for User Story 3

- [ ] T030 [US3] 在 `territoryBonusService.ts` 中实现 `calculateSmallFactionBonus()` 方法
- [ ] T031 [US3] 修改 `calculateTotalBonus()` 方法，整合小势力防御加成到 `totalDefenseBonus`
- [ ] T032 [US3] 在 `TerritoryBonusDisplay.tsx` 中展示小势力防御加成（当适用时）
- [ ] T033 [US3] 验证战斗系统正确应用小势力防御加成

**Checkpoint**: 小势力获得防御加成，游戏平衡性得到保障

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: 性能优化、代码质量和文档完善

- [ ] T034 [P] 在 `territoryBonusService.ts` 中添加性能监控（console.time 计时）
- [ ] T035 [P] 实现加成计算缓存机制，避免重复计算
- [ ] T036 [P] 使用 `requestIdleCallback` 异步执行加成计算，避免阻塞主线程
- [ ] T037 代码审查：确保加成计算函数单一职责，复杂度可控
- [ ] T038 [P] 运行 `pnpm lint` 和 `pnpm format` 确保代码质量
- [ ] T039 [P] 运行 `pnpm test` 确保所有测试通过，覆盖率 >90%
- [ ] T040 运行 quickstart.md 验证清单，确认功能完整

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: 无依赖，可立即开始
- **Foundational (Phase 2)**: 依赖 Phase 1 完成，阻塞所有用户故事
- **User Story 1 (Phase 3)**: 依赖 Phase 2 完成
- **User Story 2 (Phase 4)**: 依赖 Phase 2 完成，可与 US1 并行（但建议 US1 先完成以便有数据展示）
- **User Story 3 (Phase 5)**: 依赖 Phase 2 完成，可与 US1/US2 并行
- **Polish (Phase 6)**: 依赖所有用户故事完成

### User Story Dependencies

- **User Story 1 (P1)**: 核心功能，无依赖其他故事
- **User Story 2 (P2)**: 展示 US1 计算的数据，建议 US1 完成后再开始
- **User Story 3 (P3)**: 扩展 US1 的加成计算，建议 US1 完成后再开始

### Within Each User Story

- 测试先行：先编写测试用例，确保测试失败
- 模型/类型 → 服务 → 集成 → UI
- 核心实现 → 集成验证

### Parallel Opportunities

**Phase 1 并行**:
```
T001, T002, T003, T005 可同时执行（不同文件）
```

**Phase 3 (US1) 测试并行**:
```
T010, T011, T012, T013 可同时执行（同一测试文件的不同测试用例）
```

**Phase 4 (US2) 并行**:
```
T022, T023 可同时执行（组件和样式分离）
```

---

## Implementation Strategy

### MVP First (仅 User Story 1)

1. 完成 Phase 1: Setup（类型定义）
2. 完成 Phase 2: Foundational（服务框架）
3. 完成 Phase 3: User Story 1（核心加成计算）
4. **STOP and VALIDATE**: 独立测试 US1
   - 运行单元测试
   - 在游戏中观察大国加成效果
5. 如满足需求可先部署 MVP

### Incremental Delivery

1. Setup + Foundational → 基础框架就绪
2. User Story 1 → 测试 → 部署（MVP!）
3. User Story 2 → 测试 → 部署（加成可视化）
4. User Story 3 → 测试 → 部署（小国保护）
5. Polish → 最终优化

---

## Notes

- [P] 任务 = 不同文件，无依赖冲突
- [Story] 标签将任务映射到特定用户故事
- 每个用户故事应可独立完成和测试
- 测试先行：先写测试，确保失败后再实现
- 每完成一个任务或逻辑组后提交
- 在任何检查点可停下来独立验证故事

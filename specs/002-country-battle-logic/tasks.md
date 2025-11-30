---
description: 'Task list for feature implementation: 国家攻占规则调整'
---

# Tasks: 国家攻占规则调整

**Input**: Design documents from `/specs/002-country-battle-logic/`
**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/, quickstart.md

**Tests**: 本特性在规格与研究中明确要求“测试即规范”，因此下面各用户故事阶段都会包含测试任务（Vitest + Playwright）。

**Organization**: 任务按用户故事分组，以支持每个故事独立实现与测试。

## Format: `[ID] [P?] [Story] Description`

- **[P]**: 可以并行执行（操作不同文件且无依赖关系）
- **[Story]**: 任务所属的用户故事（US1, US2, US3）
- 所有任务描述中都包含明确的文件路径

## Path Conventions

- 前端游戏代码：`app/src/`
  - 核心领域与状态：`app/src/core/`
  - 世界场景：`app/src/scenes/world/`
  - 配置与映射：`app/src/config/`
  - 服务与遥测：`app/src/services/`
  - React UI：`app/src/ui/`
- 测试代码：`tests/`
  - 单元测试：`tests/unit/`
  - 集成测试：`tests/integration/`
  - 端到端测试（Playwright）：`tests/e2e/`
- 特性文档：`specs/002-country-battle-logic/`

## Constitution-Driven Task Requirements

- 每个用户故事至少包含一个代码质量/文档任务（如接口契约校对、可维护性拆解或日志/注释补全）。
- 明确测试任务：单元、集成与端到端测试任务会标记所属故事，并在描述中写出需覆盖的场景或指标。
- 用户体验与可达性具备专门任务（可用性验证、地图可读性、键盘导航等）。
- 性能与可观测性任务指定目标指标或关注点，并指明需要接入/使用的工具（如 `PerformanceMonitor` 与 telemetry 服务）。

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: 确认当前仓库环境、脚本与基本结构处于可用状态，为后续实现提供稳定基础。

- [X] T001 确认根目录 `package.json` 中的脚本可用，并在仓库根运行 `pnpm install && pnpm test` 作为基线（文件：`package.json`）
- [X] T002 [P] 验证测试目录结构是否满足计划（`tests/unit/`, `tests/integration/`, `tests/e2e/`），如缺失则创建空占位文件 `tests/unit/README.md` 等以固定结构（目录：`tests/`）
- [X] T003 [P] 复盘本特性的规格与实现计划，标记关键约束（国家粒度占领、逐个国家攻占、姓名唯一展示）以便后续任务引用（文件：`specs/002-country-battle-logic/spec.md`, `specs/002-country-battle-logic/plan.md`）

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: 建立所有后续用户故事共享的数据模型与初始化约束，确保运行时始终以国家为单位表达占领。

**⚠️ CRITICAL**: 本阶段完成前，不应开始任何用户故事实现。

- [X] T004 对齐数据模型：根据 `specs/002-country-battle-logic/data-model.md` 更新/核对 `HistoricalCommander`、`Country`、`TerritoryState` 与 `BattleEvent` 接口定义，确保字段与约束一致（文件：`app/src/core/types.ts`）
- [X] T005 [P] 将 `RegionMapping` 明确限制为“初始化期工具”：在 `app/src/config/regionMapping.config.ts` 中补充注释与必要类型约束，标明运行时占领逻辑禁止直接依赖区域 ID（文件：`app/src/config/regionMapping.config.ts`）
- [X] T006 [P] 审查并调整区域→国家映射在运行时的使用：
      - 确保 `app/src/scenes/world/utils/countryMapper.ts` 仅在初始化阶段将历史配置映射到国家列表；
      - 在 `app/src/core/state/store.ts` 中为 `updateTerritoryOwnership` 引入/保留“初始化路径”与“运行时路径”的清晰分支，保证运行期攻占仅接收 `countryId`（文件：`app/src/scenes/world/utils/countryMapper.ts`, `app/src/core/state/store.ts`）

**Checkpoint**: 数据模型与区域/国家映射约束稳定，后续用户故事可以假设“运行时仅以国家为占领单位”。

---

## Phase 3: User Story 1 - 逐个攻占对手国家 (Priority: P1) 🎯 MVP

**Goal**: 玩家在攻占对手时，攻占操作总是以单个国家为单位结算，不存在“一次性占领对手所有国家”的流程或隐式效果。

**Independent Test**: 在仅实现本故事的情况下，玩家可以多次选择不同国家发起攻占，每次操作只影响对应国家的所有权；多轮操作后，势力变化轨迹完全由单国攻占组成。

### Tests for User Story 1

> 测试优先：先写失败的测试，再实现逻辑。

- [X] T007 [P] [US1] 为 `updateTerritory`/`updateTerritoryOwnership` 编写单元测试，验证传入单个 `countryId` 时仅该国家的 `TerritoryState.ownerId` 发生变化，且不会因区域 ID 触发多国占领（文件：`tests/unit/core/state/store.countryOwnership.spec.ts`）
- [X] T008 [P] [US1] 为 `app/src/core/simulation/systems/battleSystem.ts` 编写单元测试，验证战斗系统在成功攻占时仅产生单个目标国家的 `BattleEvent`，`territoryId` 始终为 `Country.id` 而非区域 ID（文件：`tests/unit/core/simulation/battleSystem.countryConquest.spec.ts`）
- [X] T009 [P] [US1] 使用 Playwright 编写端到端测试，覆盖从世界地图中依次选择多个国家进行攻占的流程，断言每次操作仅改变对应国家所有权，对手其他国家保持不变（文件：`tests/e2e/country-conquest.single-country.spec.ts`）

### Implementation for User Story 1

- [X] T010 [P] [US1] 调整 `app/src/core/state/store.ts` 中 `updateTerritory`/`updateTerritoryOwnership` 实现，将运行期攻占路径限制为只接受 `countryId`，并确保区域映射分支仅用于对局初始化或数据迁移（文件：`app/src/core/state/store.ts`）
- [X] T011 [P] [US1] 更新 `app/src/core/simulation/systems/battleSystem.ts`，使攻占结算逻辑针对单个国家生成所有权变更事件，并仅对该国家触发状态更新与战报叙述（文件：`app/src/core/simulation/systems/battleSystem.ts`）
- [X] T012 [P] [US1] 更新 `app/src/scenes/world/WorldScene.ts` 的交互与指令下发逻辑，确保攻占入口总是基于一个选中的 `Country.id` 调用战斗系统与 store，而不存在“对某指挥官全部国家发起攻占”的分支（文件：`app/src/scenes/world/WorldScene.ts`）
- [X] T013 [US1] 按 `research.md` Topic 4/5 为单国攻占链路增加最小遥测与日志：在 `app/src/services/telemetry/` 下新增或扩展模块记录国家所有权变更（含前后占领者与国家 ID），用于后续调试与性能分析（文件：`app/src/services/telemetry/countryConquestTelemetry.ts` 或同目录现有文件）

**Checkpoint**: 完成本阶段后，单国攻占规则可在本地通过 Vitest + Playwright 独立验证，战斗/事件/状态三者在国家粒度上保持一致。

---

## Phase 4: User Story 2 - 地图按国家展示归属 (Priority: P2)

**Goal**: 地图与相关 UI 只按国家维度展示势力归属，不再出现“东南亚/北美/中美”等区域级占领节点或混淆性统计。

**Independent Test**: 在仅实现本故事（加上基础设施）的情况下，进入世界地图和相关面板时，所有势力展示都是以单个国家为单位，手动检查不会在任何地方看到区域名作为占领或统计行。

### Tests for User Story 2

- [ ] T014 [P] [US2] 为世界场景视图编写单元测试，验证地图上用于着色/高亮的实体集合只包含 `Country.id`，并显式断言不会渲染名称为“东南亚/北美/中美”等区域标签（文件：`tests/unit/scenes/world/worldScene.countryDisplay.test.ts`）
- [ ] T015 [P] [US2] 编写 UI 集成测试，验证指挥官面板/国家详情面板中展示的势力范围按国家统计且无区域级汇总行，例如“东南亚占领数”等（文件：`tests/integration/ui/commanderCountryOwnership.test.ts`）

### Implementation for User Story 2

- [X] T016 [P] [US2] 调整 `app/src/scenes/world/WorldScene.ts` 中的地图渲染与交互逻辑，确保所有与占领相关的集合（可选中、可高亮、可显示标记）均以 `Country.id` 为粒度构建，不再依赖区域 ID（文件：`app/src/scenes/world/WorldScene.ts`）
- [X] T017 [P] [US2] 更新 `app/src/ui/panels/CommanderPanel.tsx` 与 `app/src/ui/panels/CountryDetailPanel.tsx`，移除任何基于“东南亚/北美/中美”等区域名的展示或统计，改为根据 `TerritoryState`/`Country` 汇总每个指挥官的国家占领情况（文件：`app/src/ui/panels/CommanderPanel.tsx`, `app/src/ui/panels/CountryDetailPanel.tsx`）
- [X] T018 [P] [US2] 调整地图数据加载与缓存管线，使其在生成可视节点和索引结构时只使用 `Country` 列表，而非区域 ID，确保 `MapDataLoader`/`MapDataCache` 路径上不再生成区域级展示单元（文件：`app/src/scenes/world/data/MapDataLoader.ts`, `app/src/scenes/world/data/MapDataCache.ts`）
- [ ] T019 [US2] 在调试 HUD 或诊断面板中增加简单校验视图，例如在 `app/src/ui/hud/DevHud.tsx` 中展示当前场景中仍存在的区域 ID（如有）以辅助人工确认区域概念已从展示层移除（文件：`app/src/ui/hud/DevHud.tsx`）

**Checkpoint**: 完成本阶段后，任意查看世界地图和相关 UI 时，只会看到国家级别的占领信息，区域名仅可能出现在说明文本而非占领节点。

---

## Phase 5: User Story 3 - 占领后只显示当前占领者姓名 (Priority: P3)

**Goal**: 任意时刻每个国家上仅展示当前占领者姓名或标识，历史占领者姓名不会在地图或主要面板中与当前姓名叠加展示。

**Independent Test**: 在仅实现本故事（加上基础设施与前两个故事）的情况下，通过多次易主场景验证地图和 UI 上每个国家只出现一个当前占领者姓名；历史占领者信息仅出现在战报或时间线上，以明确方式区分。

### Tests for User Story 3

- [ ] T020 [P] [US3] 为世界场景标签渲染逻辑编写单元测试，构造多次易主序列，断言任何时间点给定 `countryId` 只会有一个标签对象与之关联（文件：`tests/unit/scenes/world/worldScene.countryLabels.test.ts`）
- [ ] T021 [P] [US3] 扩展端到端测试，在 `tests/e2e/country-conquest.labels.spec.ts` 中模拟同一国家在多个指挥官之间反复易主，并在关键步骤截图或断言只显示当前占领者姓名（文件：`tests/e2e/country-conquest.labels.spec.ts`）

### Implementation for User Story 3

- [X] T022 [P] [US3] 重构 `app/src/scenes/world/WorldScene.ts` 与 `app/src/scenes/world/rendering/MapRenderer.ts` 中的姓名标签创建与销毁逻辑，将标签完全绑定到 `TerritoryState.ownerId` 和 `countryId`，并在所有权变更或国家被重新绘制时清理旧标签以避免堆积（文件：`app/src/scenes/world/WorldScene.ts`, `app/src/scenes/world/rendering/MapRenderer.ts`）
- [X] T023 [P] [US3] 更新 React 侧面板（如 `app/src/ui/panels/CountryDetailPanel.tsx` 与 `app/src/ui/panels/BattleTimeline.tsx`），区分“当前占领者姓名”和“历史占领者记录”，避免在同一显示区域内重复出现同一个人的名字（文件：`app/src/ui/panels/CountryDetailPanel.tsx`, `app/src/ui/panels/BattleTimeline.tsx`）
- [X] T024 [US3] 确保在对局重新加载或会话恢复时正确重建 `TerritoryState` 与标签集，在 `app/src/core/session/startSession.ts` 及相关挂钩中清理旧的姓名渲染状态，避免刷新后出现历史姓名残留（文件：`app/src/core/session/startSession.ts`, `app/src/scenes/world/WorldScene.ts`）

**Checkpoint**: 完成本阶段后，多次易主与重载场景中都不应再出现姓名重叠或残留问题。

---

## Final Phase: Polish & Cross-Cutting Concerns

**Purpose**: 聚焦文档、性能、可观测性与体验的收尾工作，覆盖多个用户故事的横切关注点。

- [ ] T025 [P] 校对并更新特性文档与契约，使其与最终实现保持一致：同步 `specs/002-country-battle-logic/quickstart.md` 与 `specs/002-country-battle-logic/contracts/conquest-api.yaml` 中与国家级攻占相关的描述（文件：`specs/002-country-battle-logic/quickstart.md`, `specs/002-country-battle-logic/contracts/conquest-api.yaml`）
- [ ] T026 [P] 基于 `app/src/scenes/world/utils/PerformanceMonitor.ts` 与遥测服务，为国家攻占路径补充或细化性能度量（如单次攻占渲染耗时），并在日志中标记异常情况供运维分析（文件：`app/src/scenes/world/utils/PerformanceMonitor.ts`, `app/src/services/telemetry/*`）
- [ ] T027 在仓库根运行完整测试套件（含覆盖率与端到端测试：`pnpm test`, `pnpm test:coverage`, `pnpm test:e2e`），并根据失败结果修复 `app/` 与 `tests/` 中的相关代码（文件：`package.json`, `tests/`）
- [ ] T028 清理调试日志：审查并移除实现过程中加入的临时 `console.log` 等调试输出，仅保留有价值的结构化日志（文件：`app/src/core/state/store.ts`, `app/src/scenes/world/WorldScene.ts`, `app/src/scenes/world/utils/countryMapper.ts`）
- [ ] T029 进行最终 UX/可达性自查：从 `StartScreen` 进入地图，使用键盘/读屏等方式验证国家占领信息可读性与可达性，必要时在 `app/src/ui/` 中微调样式或焦点管理（文件：`app/src/ui/screens/StartScreen.tsx`, `app/src/ui/panels/*`, `app/src/ui/hud/DevHud.tsx`）

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: 无依赖，可立即开始；完成后确认环境稳定。
- **Foundational (Phase 2)**: 依赖 Phase 1；在“数据模型与区域/国家约束”稳定前，禁止开始任何用户故事开发。
- **User Stories (Phase 3–5)**: 均依赖 Phase 2 完成；
  - 在单人节奏下，推荐按优先级顺序依次完成：US1 (P1) → US2 (P2) → US3 (P3)。
  - 如团队有人手，可在完成 Phase 2 后并行推进多个用户故事，但需遵守测试与质量门禁。
- **Polish (Final Phase)**: 依赖所有计划实现的用户故事完成后再执行，用于统一收尾与质量对齐。

### User Story Dependencies

- **User Story 1 (P1)**: 仅依赖基础设施（Phase 1–2），可独立实现与验证，是 MVP 的核心故事。
- **User Story 2 (P2)**: 依赖 US1 中建立的国家级占领规则与数据结构，但应保持展示逻辑在测试层面可以独立验证（地图与 UI 按国家展示归属）。
- **User Story 3 (P3)**: 依赖 US1 的单国攻占与 US2 的国家级展示结构，在此基础上解决姓名唯一展示问题；在测试中可通过构造多次易主场景单独验证。

### Within Each User Story

- 优先完成测试任务（T007–T009, T014–T015, T020–T021），确保初期测试在未实现逻辑时失败。
- 然后实现核心状态与逻辑（US1 的 T010–T012、US2 的 T016–T018、US3 的 T022–T024）。
- 最后补充日志、遥测与 UX 细节（如 T013, T019, T023 等）。
- 每个用户故事完成后，应能通过其对应的单元/集成/E2E 测试，而不依赖其他故事的额外功能。

### Parallel Opportunities

- Setup 阶段中 T002 与 T003 可在完成 T001 后并行进行。
- Foundational 中 T005 与 T006 为 [P] 任务，可在对数据模型对齐（T004）完成后并行推进。
- 完成 Phase 2 后：
  - US1、US2、US3 可以由不同开发者并行推进，但需协调共享文件（如 `WorldScene.ts`）的修改顺序或使用小步提交。
- 各用户故事内部：
  - 测试任务（如 T007/T008/T009 或 T014/T015）可以在同一阶段并行编写。
  - 标记为 [P] 的实现任务通常操作不同文件，可按团队分工并行完成。

---

## Parallel Examples

### User Story 1 – 单国攻占

```bash
# 并行编写 US1 的单元与端到端测试
任务: "T007 [P] [US1] store.countryOwnership 单元测试"
任务: "T008 [P] [US1] battleSystem.countryConquest 单元测试"
任务: "T009 [P] [US1] country-conquest.single-country Playwright 测试"

# 并行实现 US1 的核心逻辑（不同文件）
任务: "T010 [P] [US1] 更新 app/src/core/state/store.ts 仅按国家更新占领"
任务: "T011 [P] [US1] 更新 app/src/core/simulation/systems/battleSystem.ts 生成单国事件"
任务: "T012 [P] [US1] 更新 app/src/scenes/world/WorldScene.ts 仅以 Country.id 作为攻占目标"
```

### User Story 2 – 地图按国家展示归属

```bash
# 并行完善展示相关测试
任务: "T014 [P] [US2] worldScene.countryDisplay 单元测试"
任务: "T015 [P] [US2] commanderCountryOwnership 集成测试"

# 并行更新地图场景与面板
任务: "T016 [P] [US2] 调整 WorldScene 仅以 Country.id 渲染占领"
任务: "T017 [P] [US2] 更新 CommanderPanel/CountryDetailPanel 按国家展示归属"
任务: "T018 [P] [US2] 调整 MapDataLoader/MapDataCache 仅生成国家级节点"
```

### User Story 3 – 姓名唯一展示

```bash
# 并行完善姓名唯一展示的测试
任务: "T020 [P] [US3] worldScene.countryLabels 单元测试"
任务: "T021 [P] [US3] country-conquest.labels 端到端测试"

# 并行重构标签与 UI 展示
任务: "T022 [P] [US3] 重构 WorldScene/MapRenderer 姓名标签生命周期"
任务: "T023 [P] [US3] 更新 CountryDetailPanel/BattleTimeline 区分当前与历史占领者"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. 完成 Phase 1（环境确认）与 Phase 2（数据模型与区域/国家约束）。
2. 在 Phase 3 中按顺序完成 US1 的测试与实现任务（T007–T013）。
3. 运行相关单元与端到端测试，确保“逐个国家攻占”在国家粒度上工作正常。
4. 在仅完成 US1 的情况下即可形成可演示的 MVP：玩家可以多次选择不同国家发起攻占，每次只影响被选中的国家。

### Incremental Delivery

1. 在 US1 完成并稳定后，引入 US2，专注于将所有展示统一为国家粒度：
   - 完成 T014–T019 后，可再次演示“按国家展示归属”的改进效果。
2. 随后实现 US3，解决姓名重叠问题：
   - 完成 T020–T024 后，可演示多次易主仍只显示当前占领者姓名的地图体验。
3. 每个阶段完成后都可独立演示和验证，不必等待全部故事完成再一次性发布。

### Parallel Team Strategy

在多人协作的情况下：

1. 全团队共同完成 Phase 1–2（确认环境与基础约束），确保大家共享同一数据与规则认知。
2. Phase 3–5 中：
   - 开发者 A 负责 US1（核心攻占规则与事件），
   - 开发者 B 负责 US2（地图与面板展示），
   - 开发者 C 负责 US3（姓名标签与易主体验），
   同步协调对共享文件（如 `WorldScene.ts`、`store.ts`）的修改顺序与合并策略。
3. 所有故事完成后，由一名或多人负责执行 Final Phase 中的统一测试、文档与性能/可观测性收尾。

---

## Notes

- 所有任务均遵循 `- [ ] Txxx [P?] [US?] 描述 + 路径` 格式，便于追踪与自动处理。
- 标记为 [P] 的任务可以并行执行，但仍需注意共享文件的修改冲突。
- 每个用户故事在其阶段内应当可以独立完成与测试，满足规格中的“独立测试”要求。
- 任何新增逻辑都应遵守宪法中关于代码质量、测试、体验、性能与可观测性的约束。
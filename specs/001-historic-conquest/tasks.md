---
description: 'Task list for Historic World Conquest Simulator'
---

# Tasks: Historic World Conquest Simulator

**Input**: Plan/spec/research/data-model/contracts/quickstart in `/specs/001-historic-conquest/`  
**Prerequisites**: Phase 0 research complete; plan.md + spec.md approved  
**Tests**: Required per constitution (unit + contract + e2e)

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Initialize project workspace, toolchain, and CI gates.

- [ ] T001 Initialize pnpm workspace with TypeScript/React/Phaser dependencies in `package.json` and lockfile.
- [ ] T002 Scaffold directory tree (`app/src/{core,data,scenes,ui,services,styles}`, `tests/{unit,contract,e2e}`) and add placeholder entry `app/src/main.tsx`.
- [ ] T003 Configure Vite + React + Phaser bundler in `app/vite.config.ts` with dev server aliases and asset handling.
- [ ] T004 Define strict TypeScript config and path aliases (`tsconfig.json`, `tsconfig.app.json`).
- [ ] T005 Add ESLint (typescript-eslint + sonarjs), Prettier, Vitest, Playwright scripts plus CI workflow `.github/workflows/ci.yml` to gate lint/test/coverage.

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Data pipelines, simulation skeleton, persistence, telemetry—must exist before any story work. ⚠️ Stories blocked until this phase completes.

- [ ] T006 Implement Natural Earth + commander preprocessing scripts (`scripts/map/build-geojson.ts`, `scripts/data/build-commanders.ts`) to output assets into `app/src/data/`.
- [ ] T007 Create global Zustand store + typed events in `app/src/core/state/store.ts` and `app/src/core/events/eventTypes.ts`.
- [ ] T008 Build tick scheduler + system interfaces (`app/src/core/simulation/tickScheduler.ts`, `app/src/core/simulation/systems/*.ts`).
- [ ] T009 Implement IndexedDB persistence adapter with snapshot/seed stores in `app/src/services/persistence/indexedDbClient.ts`.
- [ ] T010 Add telemetry logger + Dev HUD overlay (`app/src/services/telemetry/*`, `app/src/ui/hud/DevHud.tsx`) capturing FPS/Tick/Stasis metrics.
- [ ] T011 Generate API client stubs from `contracts/historic-conquest.openapi.yaml` into `app/src/services/api/sessionClient.ts` (create-session/state/timeline/share).

---

## Phase 3: User Story 1 – 启动全球征服战局 (Priority P1)

**Goal**: 玩家点击「开始战局」后 3 秒内看到完整地图、随机指挥官与可展开属性面板。  
**Independent Test**: `tests/e2e/us1-start-game.spec.ts` launches dev server, clicks「开始战局」，断言 ≥8 位角色与属性面板加载成功。

### Tests (required)

- [ ] T012 [P] [US1] Author Vitest specs for commander/territory generator randomness in `tests/unit/core/generation.spec.ts` (seed reproducibility & regional coverage).

### Implementation

- [ ] T013 [US1] Implement `app/src/core/generation/createInitialWorld.ts` to assemble commanders、领土和属性扰动逻辑。
- [ ] T014 [US1] Build Natural Earth polygon loader + Phaser `WorldScene` rendering/interaction in `app/src/scenes/world/WorldScene.ts`.
- [ ] T015 [P] [US1] Create React start screen + CTA + loading progress UI in `app/src/ui/screens/StartScreen.tsx`.
- [ ] T016 [US1] Wire start CTA to session bootstrap + store hydration (`app/src/core/session/startSession.ts`, `app/src/core/state/store.ts`).

### Validation

- [ ] T017 [US1] Implement Playwright flow `tests/e2e/us1-start-game.spec.ts` verifying随机阵容、属性展开、重开局种子差异。

---

## Phase 4: User Story 2 – 观察与解读动态战况 (Priority P1)

**Goal**: 玩家可拖拽/缩放地图、点选任意领袖/领土查看详情，并在战报时间线理解战况。  
**Independent Test**: `tests/e2e/us2-observe-warflow.spec.ts` 2 分钟内多次查询指挥官/领土并回放最近 10 条战报。

### Tests (required)

- [ ] T018 [P] [US2] Add Vitest suite `tests/unit/core/timelineAggregator.spec.ts` covering事件聚合、筛选、指挥官统计 selectors。

### Implementation

- [ ] T019 [US2] Implement摄像机/拖拽/缩放控制 +指针命中逻辑在 `app/src/scenes/world/CameraController.ts`.
- [ ] T020 [US2] Build commander & territory inspector panels (军力、盟友、倒计时) in `app/src/ui/panels/CommanderPanel.tsx` + `app/src/ui/panels/TerritoryPanel.tsx`.
- [ ] T021 [US2] Implement战报时间线面板含过滤/回放在 `app/src/ui/panels/BattleTimeline.tsx`.
- [ ] T022 [US2] Connect battle events → UI 高亮 + 事件聚焦 (`app/src/core/events/battleEventBus.ts`, update store selectors).
- [ ] T023 [US2] Create Playwright scenario `tests/e2e/us2-observe-warflow.spec.ts` 覆盖拖拽、点击、战报回放与性能 HUD。

---

## Phase 5: User Story 3 – 结算与分享战果 (Priority P2)

**Goal**: 战局统一或达 90% 占领即弹出结算卡片，展示统计并可复制战报/重新开局。  
**Independent Test**: `tests/e2e/us3-summary-share.spec.ts` 在加速模式下触发胜利，验证统计、复制与再开局。

### Tests (required)

- [ ] T024 [P] [US3] Implement Vitest `tests/unit/core/victoryDetector.spec.ts` for胜利阈值、僵持触发与事件输出。

### Implementation

- [ ] T025 [US3] Develop胜利/僵持检测与决战事件逻辑 in `app/src/core/simulation/victoryService.ts`.
- [ ] T026 [US3] Create胜利面板、统计与复制 UI (`app/src/ui/modals/VictoryModal.tsx`, `app/src/ui/components/VictoryStats.tsx`).
- [ ] T027 [US3] Implement share + restart services (`app/src/services/share/shareReport.ts`, reuse `sessionClient.restartSession`).

### Validation

- [ ] T028 [US3] Build Playwright `tests/e2e/us3-summary-share.spec.ts` 覆盖结算、复制战报、再开局随机性。

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: 性能、可达性、文档、工具化收尾。

- [ ] T029 [P] Add stasis watchdog +性能压测脚本 `scripts/perf/stasis-watchdog.ts` (运行 15 分钟并记录指标)。
- [ ] T030 Run axe + keyboard + iPad 触控自动化并捕获报告 `tests/e2e/a11y-ipad.spec.ts`.
- [ ] T031 Update telemetry dashboard + Quickstart runbooks (`app/telemetry/dashboard.md`, `specs/001-historic-conquest/quickstart.md`) with操作指南/报警阈值。
- [ ] T032 Ship CLI `scripts/tools/seed-replay.ts` 支持通过种子重放与问题定位。

---

## Dependencies & Execution Order

1. **Phase 1 Setup** → provides repo + tooling baseline.
2. **Phase 2 Foundational** → 必须完成（数据、状态、模拟、持久化、Telemetry、API）才能开始任何用户故事。
3. **User Story Order**: US1 (启动) → US2 (观战) → US3 (结算)。US2 依赖 US1 的地图/指挥官渲染；US3 依赖前两者的战局数据。
4. **Polish** runs after stories (可与 US3 后半段并行，只要主要功能稳定)。

### Dependency Graph (Story Level)

```
Setup → Foundational → US1 → US2 → US3 → Polish
```

## Parallel Execution Examples

- **US1**: 可并行 `T012`（单测）与 `T015`（React UI），待 `T013/T014` 完成后再整合。
- **US2**: `T019`（摄像机控制）与 `T020`（面板 UI）可并行；完成后再整合 `T021/T022`.
- **US3**: `T024`（单测）与 `T026`（UI）可并行，但 `T025` 需先完成以驱动 `T027/T028`.
- **Polish**: `T029` 与 `T032` 可同时进行；`T031` 需等待性能/可达性数据。

## Implementation Strategy

### MVP First (User Story 1)

1. 完成 Setup + Foundational。
2. 实现 US1（地图 + 开局 +属性面板）→ 通过 T017。
3. 发布最小可玩版本供体验验证。

### Incremental Delivery

1. **Drop 1**: US1（启动与观战基础）
2. **Drop 2**: US2（深度观战体验 + 战报）
3. **Drop 3**: US3（结算/分享 + 重开局）
4. **Drop 4**: Polish（性能、可达性、runbooks、工具）

### Parallel Team Strategy

- Dev A：专注 `app/src/scenes` & `core/simulation`.
- Dev B：负责 React UI (`app/src/ui/*`) + Playwright flows。
- Dev C：处理数据脚本、IndexedDB、Telemetry/Share 服务。
- QA/Automation：与各故事同步撰写/运行 Vitest + Playwright 套件。

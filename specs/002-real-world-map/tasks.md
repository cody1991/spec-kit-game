# Tasks: 真实世界地图可视化

**Feature Branch**: `002-real-world-map`  
**Input**: Design documents from `/specs/002-real-world-map/`  
**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅, data-model.md ✅, contracts/ ✅

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `- [ ] [ID] [P?] [Story?] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3, US4)
- Include exact file paths in descriptions

## Summary

- **Total Tasks**: 47
- **User Stories**: 4 (US1-P1, US2-P1, US3-P2, US4-P3)
- **Test Coverage**: E2E tests for all acceptance scenarios
- **MVP Scope**: User Story 1 (US1) - Display real world map

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and dependency installation

- [ ] T001 Download World Atlas TopoJSON 50m data to `app/public/maps/world-countries.json` (2.5MB)
- [ ] T002 [P] Download simplified TopoJSON 110m data to `app/public/maps/world-countries-simplified.json` (700KB)
- [ ] T003 [P] Verify `d3-geo` and `topojson-client` dependencies in `package.json`
- [ ] T004 [P] Add type definitions for GeoJSON in `app/src/core/types.ts`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [ ] T005 Create shared types in `app/src/scenes/world/types/mapTypes.ts` (Country, TerritoryState, MapRenderState, CommanderColor interfaces)
- [ ] T006 [P] Create SpatialGrid class in `app/src/scenes/world/spatial/SpatialGrid.ts` (16x8 grid hashing)
- [ ] T007 [P] Create GraphicsPool class in `app/src/scenes/world/rendering/GraphicsPool.ts` (pool size: 200)
- [ ] T008 [P] Create PerformanceMonitor class in `app/src/scenes/world/utils/PerformanceMonitor.ts` (FPS tracking, render time measurement)
- [ ] T009 Extend Zustand store in `app/src/core/state/store.ts` to add map state (countries, territoryStates, colorMappings, renderState)
- [ ] T010 Create MapDataCache class in `app/src/scenes/world/data/MapDataCache.ts` (IndexedDB wrapper for 7-day cache)
- [ ] T011 [P] Create utility functions in `app/src/scenes/world/utils/geoUtils.ts` (bboxIntersects, calculateCentroid, calculateBbox)

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - 查看真实世界地图 (Priority: P1) 🎯 MVP

**Goal**: 用户能够看到完整的世界地图轮廓和国家边界，而不是黑屏

**Independent Test**: 启动游戏后，地图区域显示清晰的世界地图轮廓，包括大陆、海洋、主要国家边界线

### Implementation for User Story 1

- [ ] T012 [P] [US1] Implement IMapDataLoader interface in `app/src/scenes/world/data/MapDataLoader.ts` (load TopoJSON, parse to Country entities)
- [ ] T013 [P] [US1] Implement ICoordinateTransformer in `app/src/scenes/world/utils/CoordinateTransformer.ts` (geo to screen projection using d3-geo)
- [ ] T014 [US1] Implement loadMapData() method with Web Worker support and caching in `app/src/scenes/world/data/MapDataLoader.ts`
- [ ] T015 [US1] Implement parseTopoJSON() method using topojson-client in `app/src/scenes/world/data/MapDataLoader.ts`
- [ ] T016 [US1] Implement featureToCountry() conversion in `app/src/scenes/world/data/MapDataLoader.ts` (calculate centroid, bbox, area)
- [ ] T017 [US1] Implement postProcessCountries() to build neighbors list in `app/src/scenes/world/data/MapDataLoader.ts`
- [ ] T018 [US1] Implement IMapRenderer interface in `app/src/scenes/world/rendering/MapRenderer.ts` (render countries using Phaser Graphics API)
- [ ] T019 [US1] Implement initialize() method with RenderConfig support in `app/src/scenes/world/rendering/MapRenderer.ts`
- [ ] T020 [US1] Implement render() method with viewport culling in `app/src/scenes/world/rendering/MapRenderer.ts` (only render visible countries)
- [ ] T021 [US1] Implement renderCountry() private method to draw polygon borders in `app/src/scenes/world/rendering/MapRenderer.ts`
- [ ] T022 [US1] Integrate MapDataLoader into WorldScene.preload() in `app/src/scenes/world/WorldScene.ts`
- [ ] T023 [US1] Integrate MapRenderer into WorldScene.create() in `app/src/scenes/world/WorldScene.ts`
- [ ] T024 [US1] Add error handling for map data load failures with fallback to simplified map in `app/src/scenes/world/WorldScene.ts`
- [ ] T025 [US1] Update WorldScene.update() to call MapRenderer.render() with visible countries in `app/src/scenes/world/WorldScene.ts`
- [ ] T026 [US1] Add logging for map load success/failure in `app/src/scenes/world/MapDataLoader.ts`

### E2E Tests for User Story 1

- [ ] T027 [P] [US1] E2E test: User should see world map on game start in `tests/e2e/us1-view-world-map.spec.ts` (verify canvas visible, map not black)
- [ ] T028 [P] [US1] E2E test: Map remains visible during drag/zoom in `tests/e2e/us1-view-world-map.spec.ts` (verify borders don't disappear)
- [ ] T029 [P] [US1] E2E test: User can identify major countries in `tests/e2e/us1-view-world-map.spec.ts` (verify tooltip shows country name)

**Checkpoint**: At this point, User Story 1 should be fully functional - users can see the world map

---

## Phase 4: User Story 2 - 可视化领土占领状态 (Priority: P1) 🎯 MVP

**Goal**: 通过不同颜色清楚地看到每个指挥官占领的国家/地区

**Independent Test**: 启动新游戏，每个指挥官的起始国家用独特颜色填充，可以点击查看详情

### Implementation for User Story 2

- [ ] T030 [P] [US2] Define 10 commander colors in `app/src/data/commandersData.ts` (high contrast colors with accessibility patterns)
- [ ] T031 [P] [US2] Create ColorMapping initialization in `app/src/core/session/startSession.ts` (map commander IDs to colors)
- [ ] T032 [US2] Implement fillCountry() method in `app/src/scenes/world/rendering/MapRenderer.ts` (fill polygon with commander color)
- [ ] T033 [US2] Implement updateCountry() method in `app/src/scenes/world/rendering/MapRenderer.ts` (redraw single country on state change)
- [ ] T034 [US2] Subscribe to territoryStates changes in `app/src/scenes/world/WorldScene.ts` (trigger MapRenderer.updateCountry on changes)
- [ ] T035 [US2] Add border rendering with secondary color in `app/src/scenes/world/rendering/MapRenderer.ts`
- [ ] T036 [US2] Implement highlightCountry() method for selection/hover in `app/src/scenes/world/rendering/MapRenderer.ts` (add glow effect)
- [ ] T037 [US2] Create CountryDetailPanel component in `app/src/ui/panels/CountryDetailPanel.tsx` (show owner, troops, resources)
- [ ] T038 [US2] Integrate CountryDetailPanel into game UI in `app/src/ui/GameUI.tsx`
- [ ] T039 [US2] Add telemetry logging for territory updates in `app/src/core/simulation/systems/battleSystem.ts`

### E2E Tests for User Story 2

- [ ] T040 [P] [US2] E2E test: Initial territories colored by commander in `tests/e2e/us2-territory-visualization.spec.ts` (verify 10 different colors visible)
- [ ] T041 [P] [US2] E2E test: Territory color updates on conquest in `tests/e2e/us2-territory-visualization.spec.ts` (trigger battle, verify color change)
- [ ] T042 [P] [US2] E2E test: Click country shows detail panel in `tests/e2e/us2-territory-visualization.spec.ts` (verify panel displays correct info)

**Checkpoint**: At this point, User Stories 1 AND 2 should both work independently - map visible with colored territories

---

## Phase 5: User Story 3 - 观察领土扩张和侵蚀 (Priority: P2)

**Goal**: 实时观察领土随战斗结果逐渐扩张或被侵蚀，感受征服战争的动态过程

**Independent Test**: 观察一局完整游戏，能看到领土边界随时间推移而变化，扩张和收缩有明确的视觉反馈

### Implementation for User Story 3

- [ ] T043 [P] [US3] Implement IColorTransitionManager in `app/src/scenes/world/rendering/ColorTransitionManager.ts` (manage color lerp animations)
- [ ] T044 [US3] Implement startTransition() with easing functions in `app/src/scenes/world/rendering/ColorTransitionManager.ts` (500ms transition duration)
- [ ] T045 [US3] Integrate ColorTransitionManager into MapRenderer.updateCountry() in `app/src/scenes/world/rendering/MapRenderer.ts`
- [ ] T046 [US3] Update WorldScene.update() to call ColorTransitionManager.update() each frame in `app/src/scenes/world/WorldScene.ts`
- [ ] T047 [US3] Implement performance-based animation disabling in `app/src/scenes/world/rendering/MapRenderer.ts` (disable if FPS < 30)
- [ ] T048 [US3] Add visual feedback for commander elimination in `app/src/scenes/world/rendering/MapRenderer.ts` (fade territories to neutral gray)

### E2E Tests for User Story 3

- [ ] T049 [P] [US3] E2E test: Smooth territory color transition on conquest in `tests/e2e/us3-territory-changes.spec.ts` (verify 500ms animation)
- [ ] T050 [P] [US3] E2E test: Expanding commander's territory visibly grows in `tests/e2e/us3-territory-changes.spec.ts` (observe multi-conquest sequence)
- [ ] T051 [P] [US3] E2E test: Defeated commander's territory disappears in `tests/e2e/us3-territory-changes.spec.ts` (verify all territories change color)

**Checkpoint**: All core user stories complete - dynamic territory visualization functional

---

## Phase 6: User Story 4 - 地图交互增强 (Priority: P3)

**Goal**: 通过点击、悬停等交互获取地图详细信息（国家名称、统治者、兵力等）

**Independent Test**: 鼠标在地图上各种交互操作正常响应，悬停显示提示，点击显示详细面板，不影响操作流畅性

### Implementation for User Story 4

- [ ] T052 [P] [US4] Implement IPointInPolygonDetector in `app/src/scenes/world/interaction/PointInPolygonDetector.ts` (Ray Casting algorithm)
- [ ] T053 [P] [US4] Implement ISpatialQuery in `app/src/scenes/world/spatial/SpatialQuery.ts` (BBox intersection with grid acceleration)
- [ ] T054 [US4] Implement IMapInteractionHandler interface in `app/src/scenes/world/interaction/MapInteractionHandler.ts`
- [ ] T055 [US4] Implement handlePointerMove() with hover detection in `app/src/scenes/world/interaction/MapInteractionHandler.ts` (< 100ms response time)
- [ ] T056 [US4] Implement handlePointerDown() with click detection in `app/src/scenes/world/interaction/MapInteractionHandler.ts`
- [ ] T057 [US4] Implement handleZoom() with IZoomController in `app/src/scenes/world/interaction/ZoomController.ts` (zoom range: 0.5x - 5x)
- [ ] T058 [US4] Implement IDragController in `app/src/scenes/world/interaction/DragController.ts` (pan map with mouse drag)
- [ ] T059 [US4] Integrate MapInteractionHandler into WorldScene in `app/src/scenes/world/WorldScene.ts`
- [ ] T060 [US4] Add hover tooltip display in `app/src/ui/panels/CountryTooltip.tsx` (show country name + owner on 300ms delay)
- [ ] T061 [US4] Connect interaction events to MapRenderer highlights in `app/src/scenes/world/WorldScene.ts`
- [ ] T062 [US4] Implement LOD level switching based on zoom in `app/src/scenes/world/WorldScene.ts` (Level 0: >2x, Level 1: 0.5-2x, Level 2: <0.5x)

### E2E Tests for User Story 4

- [ ] T063 [P] [US4] E2E test: Hover shows country tooltip in `tests/e2e/us4-map-interaction.spec.ts` (verify tooltip appears after 300ms)
- [ ] T064 [P] [US4] E2E test: Click shows detail panel in `tests/e2e/us4-map-interaction.spec.ts` (verify panel with correct data)
- [ ] T065 [P] [US4] E2E test: Mouse over borders highlights country in `tests/e2e/us4-map-interaction.spec.ts` (verify border glow effect)
- [ ] T066 [P] [US4] E2E test: Detail panel updates on territory change in `tests/e2e/us4-map-interaction.spec.ts` (trigger battle, verify panel updates)

**Checkpoint**: All user stories complete - full interactive map experience

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Performance optimization, code quality, documentation

- [ ] T067 [P] Add unit tests for MapDataLoader in `tests/unit/map-data-loader.spec.ts` (test TopoJSON parsing, Country conversion)
- [ ] T068 [P] Add unit tests for CoordinateTransformer in `tests/unit/coordinate-transformer.spec.ts` (test geo-to-screen projection accuracy)
- [ ] T069 [P] Add unit tests for SpatialGrid in `tests/unit/spatial-grid.spec.ts` (test cell allocation, query performance)
- [ ] T070 [P] Add unit tests for PointInPolygonDetector in `tests/unit/point-in-polygon.spec.ts` (test Ray Casting algorithm correctness)
- [ ] T071 Add performance benchmark test in `tests/performance/map-rendering.bench.ts` (measure render time, FPS, memory usage)
- [ ] T072 [P] Run ESLint and fix violations in `app/src/scenes/world/`
- [ ] T073 [P] Add JSDoc comments to all public methods in `app/src/scenes/world/`
- [ ] T074 Validate quickstart.md instructions by following them in clean environment
- [ ] T075 Add dev HUD panel showing FPS, render time, visible countries in `app/src/ui/DevHUD.tsx`
- [ ] T076 [P] Create visual regression test baseline screenshots in `tests/visual/map-baseline/`
- [ ] T077 Implement color-blind mode toggle in settings (enable pattern overlays)
- [ ] T078 Add keyboard navigation support for country selection (arrow keys)
- [ ] T079 Optimize memory usage by unloading unused LOD levels
- [ ] T080 Add error boundary for map rendering failures in `app/src/ui/ErrorBoundary.tsx`
- [ ] T081 Update IMPLEMENTATION_SUMMARY.md with feature completion status

---

## Dependencies & Execution Order

### Phase Dependencies

```
Phase 1 (Setup)
    ↓
Phase 2 (Foundational) ← BLOCKS all user stories
    ↓
┌───────────┬───────────┬───────────┬───────────┐
│  Phase 3  │  Phase 4  │  Phase 5  │  Phase 6  │
│   (US1)   │   (US2)   │   (US3)   │   (US4)   │
│   P1 MVP  │   P1 MVP  │    P2     │    P3     │
└───────────┴───────────┴───────────┴───────────┘
                    ↓
              Phase 7 (Polish)
```

### User Story Dependencies

- **User Story 1 (P1)**: Independent - Can start after Foundational (Phase 2)
- **User Story 2 (P1)**: Depends on US1 completion (uses MapRenderer from US1)
- **User Story 3 (P2)**: Depends on US2 completion (extends color rendering from US2)
- **User Story 4 (P3)**: Independent of US3 - Can start after US1 completion (uses MapRenderer and SpatialGrid)

### Task Dependencies Within Each User Story

**User Story 1**:
- T012-T013 [P] → T014-T017 → T018-T021 → T022-T026
- Tests T027-T029 can run in parallel after implementation complete

**User Story 2**:
- T030-T031 [P] → T032-T036 → T037-T039
- Tests T040-T042 can run in parallel after implementation complete

**User Story 3**:
- T043 [P] → T044-T048
- Tests T049-T051 can run in parallel after implementation complete

**User Story 4**:
- T052-T053 [P] → T054-T058 → T059-T062
- Tests T063-T066 can run in parallel after implementation complete

### Parallel Opportunities

**Phase 1 (Setup)**: T001, T002, T003, T004 can all run in parallel

**Phase 2 (Foundational)**: T006, T007, T008, T010, T011 can run in parallel (after T005)

**Phase 3 (US1)**: T012 and T013 can run in parallel

**Phase 4 (US2)**: T030 and T031 can run in parallel

**Phase 6 (US4)**: T052 and T053 can run in parallel

**Phase 7 (Polish)**: T067-T070, T072, T073, T076 can all run in parallel

---

## Parallel Example: User Story 1

```bash
# Step 1: Foundation tasks (parallel)
Task T012: "Implement IMapDataLoader interface in app/src/scenes/world/data/MapDataLoader.ts"
Task T013: "Implement ICoordinateTransformer in app/src/scenes/world/utils/CoordinateTransformer.ts"

# Step 2: After T012 completes (sequential)
Task T014: "Implement loadMapData() with Web Worker support"
Task T015: "Implement parseTopoJSON() using topojson-client"
Task T016: "Implement featureToCountry() conversion"
Task T017: "Implement postProcessCountries() to build neighbors"

# Step 3: After T013 completes (sequential)
Task T018: "Implement IMapRenderer interface"
Task T019: "Implement initialize() with RenderConfig"
Task T020: "Implement render() with viewport culling"
Task T021: "Implement renderCountry() private method"

# Step 4: Integration (after both paths complete)
Task T022: "Integrate MapDataLoader into WorldScene.preload()"
Task T023: "Integrate MapRenderer into WorldScene.create()"
Task T024: "Add error handling with fallback"
Task T025: "Update WorldScene.update() to call render()"
Task T026: "Add logging"

# Step 5: Tests (all parallel after implementation)
Task T027: "E2E test: User should see world map"
Task T028: "E2E test: Map remains visible during drag/zoom"
Task T029: "E2E test: User can identify major countries"
```

---

## Implementation Strategy

### MVP First (User Story 1 + 2 Only)

1. **Phase 1**: Setup → Download map data, verify dependencies
2. **Phase 2**: Foundational → Build core infrastructure (CRITICAL)
3. **Phase 3**: User Story 1 → Display world map
4. **VALIDATE**: Test US1 independently (T027-T029)
5. **Phase 4**: User Story 2 → Add territory colors
6. **VALIDATE**: Test US2 independently (T040-T042)
7. **DEPLOY MVP**: Basic functional game with visible, colored map

### Incremental Delivery

```
Setup + Foundation
    ↓
US1 (Display Map) → Test → Demo 🎯 (First visible milestone)
    ↓
US2 (Territory Colors) → Test → Demo 🎯 (MVP complete)
    ↓
US3 (Animations) → Test → Demo ✨ (Enhanced experience)
    ↓
US4 (Interactions) → Test → Demo ✨ (Full feature)
    ↓
Polish → Final Release 🚀
```

### Parallel Team Strategy

With 3 developers after Foundation complete:

- **Developer A**: US1 (T012-T029) → Critical path
- **Developer B**: US2 (T030-T042) → Depends on US1
- **Developer C**: US4 (T052-T066) → Can start after US1, independent of US2/US3

Then:
- **Developer A**: US3 (T043-T051) → After US2 complete
- **All**: Polish tasks (T067-T081) → Parallel

---

## Performance Targets

Based on research.md findings:

| Metric | Target | Measurement |
|--------|--------|-------------|
| Map load time | ≤ 2s | T014 implementation |
| Render FPS | ≥ 60 (standard) / ≥ 30 (low-end) | T020, T047 implementation |
| Territory update | ≤ 50ms | T033 implementation |
| Interaction latency | ≤ 100ms | T055, T056 implementation |
| Memory increase | ≤ 50MB | T079 optimization |

Validation: T071 (performance benchmark test)

---

## Success Criteria Mapping

| Success Criteria | Tasks | Validation |
|------------------|-------|------------|
| SC-001: See map in 3s | T012-T026 | T027 |
| SC-002: Identify 20+ countries | T012-T029, T060 | T029 |
| SC-003: Distinguish 10 commanders by color | T030-T042 | T040 |
| SC-004: 90% territory changes visible in 1s | T043-T048 | T049 |
| SC-005: Interaction < 100ms | T052-T062 | T063-T066 |
| SC-006: 60 FPS standard / 30 FPS low-end | T020, T047 | T071 |
| SC-007: Load failure rate < 1% | T024 | Production telemetry |
| SC-008: 80% task completion rate | All tasks | User testing |

---

## Notes

- **[P]** tasks can run in parallel (different files, no blocking dependencies)
- **[Story]** label maps task to user story for traceability
- Each user story should be independently testable
- Stop at any checkpoint to validate story works independently
- MVP = US1 + US2 (visible map with colored territories)
- Full feature = US1 + US2 + US3 + US4 (interactive animated map)
- Commit after each task or logical group for easier rollback

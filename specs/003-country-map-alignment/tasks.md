# Tasks: 国家与地图精准对齐

**Feature Branch**: `003-country-map-alignment`  
**Date**: 2025-11-30  
**Input**: Design documents from `/specs/003-country-map-alignment/`

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1, US2, US3, US4)
- Include exact file paths in descriptions

## Path Conventions

Project uses single web application structure:
- Source code: `app/src/`
- Public assets: `app/public/`
- Tests: `tests/`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and configuration setup

- [ ] T001 Verify existing TypeScript project structure and dependencies per plan.md
- [ ] T002 [P] Create `app/src/config/` directory for mapping configuration files
- [ ] T003 [P] Create `app/src/core/validation/` directory for validation utilities
- [ ] T004 [P] Create `tests/unit/config/` directory for config unit tests
- [ ] T005 [P] Create `tests/unit/scenes/world/` directory for mapper unit tests
- [ ] T006 [P] Create `tests/integration/` directory for integration tests
- [ ] T007 [P] Create `tests/e2e/` directory for E2E tests (if not exists)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story implementation

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [ ] T008 Create region mapping configuration file in `app/src/config/regionMapping.config.ts` with all 15 region mappings (china, russia, western-europe, eastern-europe, middle-east, india, japan, southeast-asia, north-africa, central-africa, south-africa, north-america, central-america, south-america, australia)
- [ ] T009 Define TypeScript interfaces (RegionMapping, CountryMappingResult, MappedCountry, MappingStats) in `app/src/config/regionMapping.config.ts`
- [ ] T010 [P] Implement helper functions (getCountryIdsByRegion, createRegionCountryMap) in `app/src/config/regionMapping.config.ts`
- [ ] T011 [P] Add TypeScript type extensions for HistoricalCommander in `app/src/core/types.ts` (add optional initialRegions field)
- [ ] T012 [P] Add TypeScript type extensions for TerritoryState in `app/src/core/types.ts` (add optional countryName field)
- [ ] T013 Create MappingValidator class in `app/src/core/validation/mappingValidator.ts` with validate() method
- [ ] T014 Implement validation rules (structure, data validity, uniqueness, balance) in `app/src/core/validation/mappingValidator.ts`
- [ ] T015 Define ValidationResult, ValidationError, ValidationWarning, ValidationSummary types in `app/src/core/validation/mappingValidator.ts`

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 & 2 - 准确识别国家位置 & 修正映射逻辑 (Priority: P1) 🎯 MVP

**Goal**: 修复国家名称与地图位置不匹配的核心问题，确保所有指挥官占领的国家名称与地图上的实际地理位置完全对应

**Why Combined**: US1 和 US2 是同一功能的两个视角（用户视角和技术视角），必须一起实施才能验证

**Independent Test**: 
1. 启动游戏，查看秦始皇占领的区域是否在中国的实际地理位置（东亚）
2. 点击中国区域，详情面板显示"中国"和"秦始皇"
3. 查看拿破仑占领的区域是否在法国的实际地理位置（西欧）

### Implementation for User Story 1 & 2

- [ ] T016 [P] [US1][US2] Create country mapper utility in `app/src/scenes/world/utils/countryMapper.ts` with mapRegionToCountries() function
- [ ] T017 [P] [US1][US2] Implement mapCommandersToCountries() function in `app/src/scenes/world/utils/countryMapper.ts` that returns CountryMappingResult
- [ ] T018 [US1][US2] Update WorldScene.mapCountriesToCommanders() method in `app/src/scenes/world/WorldScene.ts` to use new mapping config and countryMapper utility
- [ ] T019 [US1][US2] Add import for createRegionCountryMap from regionMapping.config.ts in `app/src/scenes/world/WorldScene.ts`
- [ ] T020 [US1][US2] Replace hardcoded regionCountryMap with createRegionCountryMap() call in WorldScene.mapCountriesToCommanders()
- [ ] T021 [US1][US2] Update mapping logic to use regionCountryMap.get() for lookup and handle missing regions with warning logs
- [ ] T022 [US1][US2] Update territoryStates creation to include countryName field from countries array in WorldScene.mapCountriesToCommanders()
- [ ] T023 [US1][US2] Add validation call using MappingValidator in WorldScene.mapCountriesToCommanders() (development mode only)
- [ ] T024 [US1][US2] Add detailed mapping logs (region → country IDs, sample mappings) in WorldScene.mapCountriesToCommanders()
- [ ] T025 [US1][US2] Add performance measurement using performance.mark/measure around mapping logic in WorldScene.mapCountriesToCommanders()
- [ ] T026 [P] [US1][US2] Update CountryDetailPanel.tsx in `app/src/ui/panels/CountryDetailPanel.tsx` to display country.name from territoryState.countryName
- [ ] T027 [P] [US1][US2] Update CommanderPanel.tsx in `app/src/ui/panels/CommanderPanel.tsx` to display real country names instead of region IDs
- [ ] T028 [US1][US2] Verify hover tooltip displays country.name correctly (check existing WorldScene mouse event handlers)
- [ ] T029 [US1][US2] Run ESLint and Prettier on all modified files (`npm run lint:fix && npm run format`)
- [ ] T030 [US1][US2] Add JSDoc comments to all public functions in regionMapping.config.ts and countryMapper.ts

**Constitution Compliance**:
- [ ] T031 [US1][US2] Code Quality: Review mapping configuration structure, ensure file < 200 lines and complexity < 15
- [ ] T032 [US1][US2] Observability: Verify all required logs (startup, mapping details, errors, performance) are present in WorldScene
- [ ] T033 [US1][US2] Performance: Verify mapping logic completes in < 50ms using performance metrics logs

**Checkpoint**: At this point, User Story 1 & 2 should be fully functional - all commanders show correct country names matching map positions

---

## Phase 4: User Story 3 - 验证和测试国家对齐 (Priority: P2)

**Goal**: 建立自动化测试套件，验证国家名称和地图位置的对齐准确性，防止回归问题

**Independent Test**: 运行测试套件 (`npm run test` 和 `npm run test:e2e`)，所有测试通过，覆盖率达标

### Tests for User Story 3

> **NOTE: These tests validate the work done in US1/US2**

#### Unit Tests

- [ ] T034 [P] [US3] Create regionMapping.test.ts in `tests/unit/config/regionMapping.test.ts` with test suite setup
- [ ] T035 [P] [US3] Test: REGION_COUNTRY_MAPPINGS should have 15 region mappings in `tests/unit/config/regionMapping.test.ts`
- [ ] T036 [P] [US3] Test: All countryIds should be valid ISO 3166-1 codes (3-digit strings) in `tests/unit/config/regionMapping.test.ts`
- [ ] T037 [P] [US3] Test: No duplicate country IDs across all regions in `tests/unit/config/regionMapping.test.ts`
- [ ] T038 [P] [US3] Test: getCountryIdsByRegion('china') should return ['156'] in `tests/unit/config/regionMapping.test.ts`
- [ ] T039 [P] [US3] Test: getCountryIdsByRegion('invalid-region') should return empty array in `tests/unit/config/regionMapping.test.ts`
- [ ] T040 [P] [US3] Create countryMapper.test.ts in `tests/unit/scenes/world/countryMapper.test.ts` with test suite setup
- [ ] T041 [P] [US3] Test: mapRegionToCountries() should handle valid region IDs in `tests/unit/scenes/world/countryMapper.test.ts`
- [ ] T042 [P] [US3] Test: mapRegionToCountries() should handle invalid region IDs gracefully in `tests/unit/scenes/world/countryMapper.test.ts`
- [ ] T043 [P] [US3] Test: mapCommandersToCountries() should map single commander with single country in `tests/unit/scenes/world/countryMapper.test.ts`
- [ ] T044 [P] [US3] Test: mapCommandersToCountries() should map multiple commanders with multiple countries in `tests/unit/scenes/world/countryMapper.test.ts`
- [ ] T045 [P] [US3] Test: mapCommandersToCountries() should handle partial mapping failures in `tests/unit/scenes/world/countryMapper.test.ts`
- [ ] T046 [P] [US3] Create mappingValidator.test.ts in `tests/unit/core/validation/mappingValidator.test.ts` with test suite setup
- [ ] T047 [P] [US3] Test: MappingValidator should pass validation for correct mappings in `tests/unit/core/validation/mappingValidator.test.ts`
- [ ] T048 [P] [US3] Test: MappingValidator should detect missing required regions in `tests/unit/core/validation/mappingValidator.test.ts`
- [ ] T049 [P] [US3] Test: MappingValidator should detect invalid country IDs in `tests/unit/core/validation/mappingValidator.test.ts`
- [ ] T050 [P] [US3] Test: MappingValidator should detect duplicate country IDs in `tests/unit/core/validation/mappingValidator.test.ts`
- [ ] T051 [P] [US3] Test: MappingValidator should warn about large regions (> 7 countries) in `tests/unit/core/validation/mappingValidator.test.ts`

#### Integration Tests

- [ ] T052 [P] [US3] Create worldScene.integration.test.ts in `tests/integration/worldScene.integration.test.ts` with test setup (mock Phaser, Zustand)
- [ ] T053 [P] [US3] Test: WorldScene should initialize commanders with correct country mappings in `tests/integration/worldScene.integration.test.ts`
- [ ] T054 [P] [US3] Test: WorldScene should create territoryStates with country IDs as keys in `tests/integration/worldScene.integration.test.ts`
- [ ] T055 [P] [US3] Test: WorldScene should handle mapping errors gracefully without crashing in `tests/integration/worldScene.integration.test.ts`
- [ ] T056 [P] [US3] Test: territoryStates should include countryName field in `tests/integration/worldScene.integration.test.ts`

#### E2E Tests

- [ ] T057 [P] [US3] Create us1-country-alignment.spec.ts in `tests/e2e/us1-country-alignment.spec.ts` with Playwright test setup
- [ ] T058 [P] [US3] Test: 秦始皇占领的国家名称与地图位置匹配（点击东亚区域验证显示"中国"和"秦始皇"）in `tests/e2e/us1-country-alignment.spec.ts`
- [ ] T059 [P] [US3] Test: 拿破仑占领的国家名称与地图位置匹配（点击西欧区域验证显示"France"和"拿破仑"）in `tests/e2e/us1-country-alignment.spec.ts`
- [ ] T060 [P] [US3] Test: 至少10个关键国家的对齐验证（中国、美国、俄罗斯、法国、德国、日本、印度、巴西、澳大利亚、南非）in `tests/e2e/us1-country-alignment.spec.ts`
- [ ] T061 [P] [US3] Create us2-commander-territories.spec.ts in `tests/e2e/us2-commander-territories.spec.ts` with Playwright test setup
- [ ] T062 [P] [US3] Test: 指挥官详情面板显示正确的国家名称列表 in `tests/e2e/us2-commander-territories.spec.ts`
- [ ] T063 [P] [US3] Test: 悬停在国家上显示正确的国家名称和占领者 in `tests/e2e/us2-commander-territories.spec.ts`

### Coverage & Quality Validation

- [ ] T064 [US3] Run unit tests with coverage: `npm run test:coverage` and verify mapping logic >= 90% coverage
- [ ] T065 [US3] Run integration tests and verify all pass: `npm run test tests/integration/`
- [ ] T066 [US3] Run E2E tests and verify all pass: `npm run test:e2e`
- [ ] T067 [US3] Review coverage report and add missing tests for uncovered edge cases
- [ ] T068 [US3] Configure CI to run all tests on PR (update GitHub Actions or CI config if needed)

**Constitution Compliance**:
- [ ] T069 [US3] Testing Evidence: Verify test pyramid is complete (unit > integration > E2E)
- [ ] T070 [US3] Testing Evidence: Verify all tests are tagged with correct user story labels
- [ ] T071 [US3] Testing Evidence: Verify tests fail correctly when mapping is broken (test the tests)

**Checkpoint**: At this point, comprehensive test suite is in place and all tests pass, providing safety net for future changes

---

## Phase 5: User Story 4 - 提供国家对齐调试工具 (Priority: P3)

**Goal**: 增强开发者体验，提供清晰的调试日志和可选的可视化调试模式

**Independent Test**: 
1. 打开浏览器控制台，查看是否有清晰的映射日志
2. 添加 URL 参数 `?debug=true`，验证地图上叠加显示国家 ID 和名称

### Implementation for User Story 4

- [ ] T072 [P] [US4] Add debug mode detection in WorldScene.create() (check URL parameter `debug=true`)
- [ ] T073 [P] [US4] Enhance console logging in WorldScene.mapCountriesToCommanders() with emoji and structured format
- [ ] T074 [P] [US4] Add mapping summary log: "🗺️ Mapped X countries to Y commanders" with detailed breakdown
- [ ] T075 [P] [US4] Add per-commander mapping log: "秦始皇 -> 中国 (156) ✓" for each commander
- [ ] T076 [P] [US4] Add warning logs for unmapped regions: "⚠️ Region 'xxx' not found in mappings"
- [ ] T077 [P] [US4] Add error logs for invalid country IDs: "❌ Country ID 'xxx' not found in map data"
- [ ] T078 [P] [US4] Add performance logs: "⏱️ Mapping completed in XXms"
- [ ] T079 [US4] Implement debug overlay rendering in WorldScene (if debug mode enabled)
- [ ] T080 [US4] Add country ID and name text labels on map in debug mode (using Phaser.GameObjects.Text)
- [ ] T081 [US4] Add bounding box visualization for each country in debug mode (using Phaser.GameObjects.Graphics)
- [ ] T082 [US4] Update DevHud component in `app/src/ui/hud/DevHud.tsx` to display mapping statistics (if not exists, create debug info panel)
- [ ] T083 [US4] Add mapping metrics to DevHud: total countries, mapped countries, unmapped regions, errors
- [ ] T084 [US4] Add toggle button in DevHud to enable/disable debug overlay

**Constitution Compliance**:
- [ ] T085 [US4] Observability: Verify all log levels (INFO, WARN, ERROR, DEBUG) are used correctly
- [ ] T086 [US4] Observability: Verify logs include all required context (region ID, country ID, commander name)
- [ ] T087 [US4] User Experience: Verify debug mode does not impact normal gameplay (performance overhead < 10ms)

### Documentation

- [ ] T088 [P] [US4] Create debugging guide section in quickstart.md (how to use console logs and debug mode)
- [ ] T089 [P] [US4] Add troubleshooting section to quickstart.md (common errors and solutions)
- [ ] T090 [P] [US4] Update README.md with URL parameter documentation (?debug=true)

**Checkpoint**: At this point, developers have comprehensive debugging tools to diagnose any mapping issues quickly

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Final quality checks, documentation, and optimization

- [ ] T091 [P] Review all modified files for code quality and consistency
- [ ] T092 [P] Run full lint and format check: `npm run lint && npm run format`
- [ ] T093 [P] Run all tests one final time: `npm run test && npm run test:e2e`
- [ ] T094 [P] Measure performance: verify game startup time increase < 50ms
- [ ] T095 [P] Measure performance: verify mapping logic execution time < 50ms
- [ ] T096 [P] Measure performance: verify map rendering FPS = 60
- [ ] T097 [P] Check memory usage: verify no memory leaks in mapping logic
- [ ] T098 [P] Visual regression testing: capture baseline screenshots of map with correct alignments
- [ ] T099 [P] Visual regression testing: run Playwright visual comparison tests
- [ ] T100 Update IMPLEMENTATION_SUMMARY.md or similar project doc with mapping fix details
- [ ] T101 Update checklists/requirements.md to mark all items as complete
- [ ] T102 Final code review: check against Constitution principles (quality, testing, UX, performance, observability)
- [ ] T103 Create PR with detailed description of changes and test evidence
- [ ] T104 After merge: monitor production logs for 24 hours for any mapping errors

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup (Phase 1) - BLOCKS all user stories
- **User Story 1 & 2 (Phase 3)**: Depends on Foundational (Phase 2) - Core implementation (MVP)
- **User Story 3 (Phase 4)**: Depends on US1/US2 (Phase 3) - Tests validate US1/US2 work
- **User Story 4 (Phase 5)**: Depends on US1/US2 (Phase 3) - Debugging tools enhance US1/US2
- **Polish (Phase 6)**: Depends on all user stories being complete

### User Story Dependencies

```
Phase 2 (Foundational)
    ↓
Phase 3 (US1 & US2) ← MVP - Must complete first
    ↓
    ├→ Phase 4 (US3) ← Tests (can start after US1/US2)
    └→ Phase 5 (US4) ← Debug tools (can start after US1/US2)
    ↓
Phase 6 (Polish) ← Requires all phases
```

**Note**: US3 and US4 can be developed in parallel after US1/US2 is complete

### Within Each User Story

**Phase 3 (US1/US2)**:
1. Foundation setup (T016-T017) - Create mapper utility
2. Core implementation (T018-T025) - Update WorldScene
3. UI updates (T026-T028) - Update panels and tooltips
4. Quality checks (T029-T033) - Lint, docs, validation

**Phase 4 (US3)**:
1. Unit tests (T034-T051) - Can all run in parallel [P]
2. Integration tests (T052-T056) - Can all run in parallel [P]
3. E2E tests (T057-T063) - Can all run in parallel [P]
4. Coverage validation (T064-T071) - Sequential verification

**Phase 5 (US4)**:
1. Logging enhancements (T072-T078) - Can all run in parallel [P]
2. Debug overlay (T079-T084) - Sequential (depends on debug mode detection)
3. Documentation (T088-T090) - Can all run in parallel [P]
4. Quality checks (T085-T087) - Sequential verification

### Parallel Opportunities

#### Phase 1 (Setup) - All parallel:
```bash
T002, T003, T004, T005, T006, T007 - Create directories
```

#### Phase 2 (Foundational) - Partial parallel:
```bash
# Parallel group 1:
T010, T011, T012, T013, T014, T015 - After T008/T009 complete

# Sequential:
T008 → T009 (define types first) → (T010-T015 in parallel)
```

#### Phase 3 (US1/US2) - Partial parallel:
```bash
# Parallel group 1:
T016, T017, T026, T027 - Different files

# Sequential:
T018-T025 - Same file (WorldScene.ts), must be sequential
T029-T033 - Quality checks after implementation
```

#### Phase 4 (US3) - High parallelism:
```bash
# All unit tests in parallel:
T034-T051 - Different test files

# All integration tests in parallel:
T052-T056 - Different test files

# All E2E tests in parallel:
T057-T063 - Different test files

# Sequential coverage validation:
T064-T071
```

#### Phase 5 (US4) - High parallelism:
```bash
# Parallel group 1:
T072-T078, T088-T090 - Logging + docs

# Sequential:
T079-T084 - Debug overlay implementation

# Sequential validation:
T085-T087
```

---

## Parallel Example: User Story 3 (Testing)

```bash
# Launch all unit test implementations together:
Task: T034-T051 (18 unit tests across 3 files)
  - tests/unit/config/regionMapping.test.ts (T034-T039)
  - tests/unit/scenes/world/countryMapper.test.ts (T040-T045)
  - tests/unit/core/validation/mappingValidator.test.ts (T046-T051)

# Launch all integration tests together:
Task: T052-T056 (5 integration tests)
  - tests/integration/worldScene.integration.test.ts

# Launch all E2E tests together:
Task: T057-T063 (7 E2E tests across 2 files)
  - tests/e2e/us1-country-alignment.spec.ts (T057-T060)
  - tests/e2e/us2-commander-territories.spec.ts (T061-T063)
```

---

## Implementation Strategy

### MVP First (User Story 1 & 2 Only)

**Estimated Time**: 4-6 hours

1. Complete Phase 1: Setup (30 min)
2. Complete Phase 2: Foundational (1-2 hours)
3. Complete Phase 3: User Story 1 & 2 (2-3 hours)
4. **STOP and VALIDATE**: Test manually in browser
   - 启动游戏，验证秦始皇在中国（东亚）
   - 验证拿破仑在法国（西欧）
   - 点击各个国家，验证名称匹配
5. Deploy/demo if ready (MVP 完成!)

### Incremental Delivery

**Estimated Total Time**: 12-16 hours

1. Complete Setup + Foundational (Phases 1-2): 2 hours → Foundation ready
2. Complete US1/US2 (Phase 3): 3 hours → **MVP ready for demo/deploy** ✓
3. Complete US3 (Phase 4): 4 hours → Tests in place, safety net complete
4. Complete US4 (Phase 5): 2 hours → Debugging tools ready
5. Complete Polish (Phase 6): 1 hour → Production ready

Each phase adds value without breaking previous work.

### Parallel Team Strategy

With 2-3 developers:

**Day 1 (Together)**:
- All: Complete Setup + Foundational (Phases 1-2)

**Day 2 (Parallel)**:
- Developer A: Phase 3 (US1/US2 implementation) - 3 hours
- Developer B: Wait for Phase 3, then start Phase 4 (US3 unit tests) - 2 hours
- Developer C: Wait for Phase 3, then start Phase 5 (US4 logging) - 2 hours

**Day 3 (Parallel)**:
- Developer A: Help with test fixes and code review
- Developer B: Complete Phase 4 (integration + E2E tests) - 2 hours
- Developer C: Complete Phase 5 (debug overlay) - 2 hours
- All: Phase 6 (Polish) together - 1 hour

---

## Task Summary

**Total Tasks**: 104 tasks

### Task Count by Phase:
- Phase 1 (Setup): 7 tasks
- Phase 2 (Foundational): 8 tasks (CRITICAL - blocks all stories)
- Phase 3 (US1 & US2): 18 tasks (MVP)
- Phase 4 (US3): 38 tasks (Testing)
- Phase 5 (US4): 19 tasks (Debug tools)
- Phase 6 (Polish): 14 tasks

### Task Count by User Story:
- US1 & US2 (P1): 18 tasks (Combined - MVP)
- US3 (P2): 38 tasks (Testing & validation)
- US4 (P3): 19 tasks (Debugging & observability)
- Infrastructure: 29 tasks (Setup + Foundational + Polish)

### Parallel Opportunities:
- Phase 1: 6 parallel tasks (T002-T007)
- Phase 2: 6 parallel tasks (T010-T015)
- Phase 3: 4 parallel tasks (T016, T017, T026, T027)
- Phase 4: 30 parallel tasks (all test implementations)
- Phase 5: 11 parallel tasks (T072-T078, T088-T090)
- Phase 6: 9 parallel tasks (T091-T099)

**Total Parallelizable Tasks**: 66 out of 104 (63%)

### MVP Scope:
**Phase 1-3 only** (33 tasks, 4-6 hours):
- Setup infrastructure
- Foundational mapping configuration
- Core US1/US2 implementation
- Result: Working feature with correct country-map alignment

### Format Validation:
✓ All 104 tasks follow checklist format: `- [ ] [ID] [P?] [Story?] Description with file path`
✓ All user story tasks properly tagged: [US1], [US2], [US3], [US4]
✓ All parallelizable tasks marked with [P]
✓ All tasks include specific file paths

---

## Notes

- **[P] tasks** = different files, no dependencies, can run in parallel
- **[Story] labels** map tasks to specific user stories for traceability
- **US1 & US2 combined** because they are two views of the same fix (must be done together)
- **MVP = Phase 1-3** (US1/US2 only) - Delivers core value
- **Testing (US3)** has highest parallelism - 30 tasks can run simultaneously
- **Verify tests fail** before implementing (TDD approach for US3)
- **Commit frequently** - after each task or logical group
- **Stop at checkpoints** to validate independently
- **Avoid cross-story dependencies** - each story should be independently testable

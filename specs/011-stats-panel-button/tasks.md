# Tasks: 势力统计排行榜按钮

**Input**: Design documents from `/specs/011-stats-panel-button/`
**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅, quickstart.md ✅

**Tests**: 规格中要求包含测试（Testing Evidence），因此包含测试任务。

**Organization**: 任务按用户故事分组，支持独立实现和测试。

## Format: `[ID] [P?] [Story] Description`

- **[P]**: 可并行执行（不同文件，无依赖）
- **[Story]**: 任务所属用户故事（US1, US2）
- 描述中包含准确的文件路径

## Path Conventions

- **项目结构**: `app/src/` 源代码, `tests/` 测试代码
- **UI 组件**: `app/src/ui/panels/`
- **状态管理**: `app/src/core/state/`

---

## Phase 1: Setup (准备工作)

**Purpose**: 确认现有代码结构和依赖

- [x] T001 确认 `app/src/core/state/store.ts` 中 `toggleFactionStatsPanel` action 可用
- [x] T002 确认 `app/src/ui/panels/BattleTimeline.tsx` 组件结构和现有按钮样式

---

## Phase 2: User Story 1 - 点击按钮打开势力统计面板 (Priority: P1) 🎯 MVP

**Goal**: 添加统计按钮，点击可切换势力统计面板的显示/隐藏

**Independent Test**: 启动游戏后，点击"📊 统计"按钮，验证面板正确显示和隐藏

### Implementation for User Story 1

- [x] T003 [P] [US1] 在 `app/src/ui/panels/BattleTimeline.css` 中添加 `.stats-btn` 样式（复用 `.pause-btn` 风格）
- [x] T004 [US1] 在 `app/src/ui/panels/BattleTimeline.tsx` 中导入 `toggleFactionStatsPanel` action
- [x] T005 [US1] 在 `app/src/ui/panels/BattleTimeline.tsx` 的 `.timeline-header` 中添加统计按钮（暂停按钮旁边）
- [ ] T006 [US1] 手动验证：启动游戏，点击按钮，确认面板显示/隐藏切换正常

**Checkpoint**: User Story 1 完成 - 按钮可点击切换面板

---

## Phase 3: User Story 2 - 按钮与快捷键功能一致 (Priority: P2)

**Goal**: 确保按钮和 S 键快捷键行为完全一致

**Independent Test**: 交替使用按钮和 S 键，验证面板状态变化一致

### Implementation for User Story 2

- [x] T007 [US2] 验证按钮调用的是同一个 `toggleFactionStatsPanel` action（代码审查）
- [ ] T008 [US2] 手动验证：面板关闭时点击按钮打开，再按 S 键关闭
- [ ] T009 [US2] 手动验证：面板通过 S 键打开，点击按钮关闭

**Checkpoint**: User Story 2 完成 - 按钮与快捷键行为一致

---

## Phase 4: Polish & 质量保障

**Purpose**: 代码质量检查和文档更新

- [x] T010 运行 `pnpm lint` 确保无 lint 错误
- [x] T011 运行 `pnpm format` 确保代码格式一致
- [ ] T012 按 `specs/011-stats-panel-button/quickstart.md` 执行完整验证流程
- [ ] T013 [P] 更新 `app/src/ui/panels/BattleTimeline.tsx` 组件注释，说明统计按钮功能

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: 无依赖，立即开始
- **Phase 2 (US1)**: 依赖 Phase 1 完成
- **Phase 3 (US2)**: 依赖 Phase 2 完成（需要按钮已实现）
- **Phase 4 (Polish)**: 依赖所有用户故事完成

### User Story Dependencies

- **User Story 1 (P1)**: 无依赖，可在 Setup 后立即开始
- **User Story 2 (P2)**: 依赖 US1 完成（需要按钮存在才能验证一致性）

### Parallel Opportunities

- T003 和 T004 可并行（CSS 和 JS 导入互不影响）
- T010 和 T011 可并行（lint 和 format 独立）

---

## Parallel Example: User Story 1

```bash
# 可并行执行:
Task T003: "添加 .stats-btn 样式到 BattleTimeline.css"
Task T004: "导入 toggleFactionStatsPanel action"

# 然后顺序执行:
Task T005: "添加按钮到 JSX"
Task T006: "手动验证"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. 完成 Phase 1: Setup（确认现有代码）
2. 完成 Phase 2: User Story 1（添加按钮）
3. **验证**: 测试按钮点击功能
4. 可部署/演示 MVP

### Full Feature

1. MVP + User Story 2（验证一致性）
2. Phase 4 Polish（质量保障）
3. 完整功能交付

---

## Notes

- 本功能简单，总计 13 个任务
- 核心实现仅需 T003-T005 三个任务
- 无需新增状态或 action，完全复用现有代码
- 按钮样式复用现有 `.pause-btn` 风格，保持 UI 一致性

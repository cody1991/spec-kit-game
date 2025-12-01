# Tasks: 势力统计排行榜 (Faction Statistics Leaderboard)

**Input**: Design documents from `/specs/005-faction-stats/`
**Prerequisites**: spec.md (user stories), research.md (technical decisions), data-model.md (entities), contracts/ (test contracts), quickstart.md (dev guide)

**Tech Stack**: TypeScript + React 18 + Zustand + Vitest + Playwright (无新增依赖)

**Tests**: 本功能包含契约测试任务，基于 TDD 方法确保数据准确性和算法正确性

**Organization**: 任务按用户故事组织，每个故事可独立实现和测试

---

## Format: `- [ ] [ID] [P?] [Story?] Description`

- **[P]**: 可并行执行（不同文件，无依赖）
- **[Story]**: 所属用户故事（US1, US2, US3）
- 任务描述包含具体文件路径

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: 项目基础设施准备，确保开发和测试环境就绪

- [x] T001 验证当前分支为 `005-faction-stats` 且工作区干净
- [x] T002 安装项目依赖 `cd app && pnpm install`
- [x] T003 [P] 运行现有测试套件确保基线通过 `pnpm test`
- [x] T004 [P] 验证开发服务器可正常启动 `pnpm dev`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: 核心类型定义和状态管理基础，所有用户故事的必备前提

**⚠️ CRITICAL**: 此阶段必须完成后才能开始任何用户故事实现

### 类型系统基础

- [x] T005 [P] 在 `app/src/core/types.ts` 中定义 `FactionStatistics` 接口（9个字段：commanderId, commanderName, status, countryCount, totalArea, wins, losses, winRate, lastUpdatedAt）
- [x] T006 [P] 在 `app/src/core/types.ts` 中定义内部事件类型 `BattleStatUpdate` 和 `TerritoryStatUpdate`
- [x] T007 [P] 在 `app/src/core/types.ts` 中定义 `Leaderboard` 类型和 `LeaderboardSortCriteria` 类型

### 状态管理基础

- [x] T008 在 `app/src/core/state/store.ts` 的 `GameState` 接口中添加 `factionStats: Map<string, FactionStatistics>`
- [x] T009 在 `app/src/core/state/store.ts` 中添加 `showFactionStatsPanel: boolean` 状态
- [x] T010 [P] 在 `app/src/core/state/store.ts` 中实现 `updateFactionStats: (commanderId: string, updates: Partial<FactionStatistics>) => void` 方法
- [x] T011 [P] 在 `app/src/core/state/store.ts` 中实现 `initializeFactionStats: () => void` 方法（从现有 commanders/territories/countries 初始化统计数据）
- [x] T012 [P] 在 `app/src/core/state/store.ts` 中实现 `toggleFactionStatsPanel: () => void` 和 `closeFactionStatsPanel: () => void` 方法

### 契约测试基础设施

- [x] T013 [P] 复制 `specs/005-faction-stats/contracts/faction-stats.contract.ts` 到 `tests/contracts/faction-stats.contract.spec.ts`（6个测试套件）
- [x] T014 [P] 复制 `specs/005-faction-stats/contracts/leaderboard-sorting.contract.ts` 到 `tests/contracts/leaderboard-sorting.contract.spec.ts`（5个测试套件）
- [ ] T015 运行契约测试并确认初始失败 `pnpm test tests/contracts` - 验证 TDD 红灯状态

**Checkpoint**: 类型系统和状态管理基础就绪，契约测试处于失败状态（TDD 红灯） - 用户故事实现可以开始

---

## Phase 3: User Story 1 - 查看势力综合排行榜 (Priority: P1) 🎯 MVP

**Goal**: 实现核心排行榜功能，显示所有活跃势力的多维统计数据（国家数量、面积、战胜/战败/胜率），按国家数量降序排列

**Independent Test**: 
1. 启动游戏并等待战斗发生（进攻成功和失败各至少1次）
2. 按 'S' 键打开统计面板
3. 验证排行榜显示所有活跃势力，按国家数量降序排列
4. 验证每个势力显示6个统计维度（国家数、面积、战胜、战败、胜率、状态）
5. 验证零战斗次数势力显示胜率为 "N/A"

### 核心服务层实现

- [x] T016 [P] [US1] 创建 `app/src/core/services/factionStatsService.ts` - 实现 `FactionStatsService` 类骨架（start, stop, 私有方法占位符）
- [x] T017 [US1] 在 `factionStatsService.ts` 中实现 `calculateWinRate(wins: number, losses: number): number` - 返回 -1 当总数为0，否则返回 wins/total（满足 C-002 契约）
- [x] T018 [US1] 在 `factionStatsService.ts` 中实现 `handleBattleResult(event: BattleEvent): void` - 仅处理有 defenderId 的 attack 事件，success时更新进攻方 wins 和防守方 losses（满足 C-005 契约）
- [x] T019 [US1] 在 `factionStatsService.ts` 中实现 `handleTerritoryChange()` - 订阅 commanders 的 controlledTerritories 变化，增量更新 countryCount 和 totalArea（满足 C-006 契约）
- [x] T020 [US1] 在 `factionStatsService.ts` 中实现 `start()` 方法 - 调用 store.initializeFactionStats() 并订阅 eventLog 和 commanders 变化
- [x] T021 [US1] 在 `app/src/core/state/store.ts` 中完善 `initializeFactionStats()` - 遍历所有 commanders，计算初始 countryCount/totalArea，战斗统计初始化为0

### 排序算法实现

- [x] T022 [US1] 创建 `app/src/utils/leaderboardSort.ts` - 实现 `sortLeaderboard(stats: FactionStatistics[]): FactionStatistics[]` 函数，主排序按 countryCount 降序，次排序按 totalArea 降序，添加 rank 字段（满足 C-001, C-002, C-005 契约）

### UI 组件实现

- [x] T023 [P] [US1] 创建 `app/src/ui/panels/FactionStatsPanel.tsx` - 实现面板组件骨架（header + 关闭按钮 + 空表格）
- [x] T024 [US1] 在 `FactionStatsPanel.tsx` 中使用 `useGameStore` 订阅 `factionStats` 和 `showFactionStatsPanel`
- [x] T025 [US1] 在 `FactionStatsPanel.tsx` 中使用 `useMemo` 调用 `sortLeaderboard()` 对 factionStats 排序
- [x] T026 [US1] 在 `FactionStatsPanel.tsx` 中渲染表格 - 7列（排名、势力、国家数、面积、战胜、战败、胜率）+ 数据行遍历
- [x] T027 [US1] 在 `FactionStatsPanel.tsx` 中实现 `formatArea(area: number): string` - 大于1M显示为 "X.XM"，否则显示为 "XK"
- [x] T028 [US1] 在 `FactionStatsPanel.tsx` 中实现 `formatWinRate(winRate: number): string` - winRate < 0 返回 "N/A"，否则返回 "XX.X%"
- [x] T029 [P] [US1] 创建 `app/src/ui/panels/FactionStatsPanel.css` - 实现面板样式（固定定位、半透明背景、表格样式、响应式字体）
- [x] T030 [US1] 在 `FactionStatsPanel.css` 中添加数据更新动画效果（淡入 + 1秒高亮边框）

### 应用集成

- [x] T031 [US1] 在 `app/src/App.tsx` 中导入 `FactionStatsPanel` 和 `factionStatsService`
- [x] T032 [US1] 在 `App.tsx` 中使用 `useEffect` 启动和停止 `factionStatsService`（组件挂载时 start，卸载时 stop）
- [x] T033 [US1] 在 `App.tsx` 中使用 `useEffect` 添加键盘事件监听 - 按 'S' 或 's' 键调用 `toggleFactionStatsPanel()`
- [x] T034 [US1] 在 `App.tsx` JSX 中渲染 `<FactionStatsPanel />`

### 质量保证 (Constitution - Code Quality)

- [x] T035 [US1] 运行 ESLint 检查所有新增文件 `pnpm lint` - 修复所有错误和警告
- [x] T036 [US1] 运行 TypeScript 类型检查 `pnpm type-check` - 确保无类型错误
- [x] T037 [US1] 为 `factionStatsService.ts` 添加 JSDoc 注释（所有公共方法和关键私有方法）
- [x] T038 [US1] 为 `leaderboardSort.ts` 添加函数签名注释和算法说明

### 契约测试验证 (Constitution - Testing Evidence)

- [ ] T039 [US1] 运行 `tests/contracts/faction-stats.contract.spec.ts` - 确保所有6个测试套件通过（C-001 至 C-006）
- [ ] T040 [US1] 运行 `tests/contracts/leaderboard-sorting.contract.spec.ts` - 确保所有5个测试套件通过（C-001 至 C-005）
- [ ] T041 [US1] 生成测试覆盖率报告 `pnpm test:coverage` - 验证 `factionStatsService.ts` 和 `leaderboardSort.ts` 覆盖率 ≥ 90%

### 性能验证 (Constitution - Performance)

- [ ] T042 [US1] 在浏览器控制台使用 `performance.now()` 测量排行榜渲染时间 - 确保 < 500ms（SC-001）
- [ ] T043 [US1] 在 `factionStatsService.ts` 中添加 `console.time/timeEnd` 测量统计计算时间 - 验证 < 50ms（SC-005）
- [ ] T044 [US1] 使用 React DevTools Profiler 测量 `FactionStatsPanel` 渲染性能 - 确保 < 100ms 且 FPS 影响 < 5%

### 用户体验验证 (Constitution - UX)

- [ ] T045 [US1] 手动测试：打开面板响应时间 < 3秒，数据显示完整（SC-001）
- [ ] T046 [US1] 手动测试：验证排序逻辑正确性 - 多个势力国家数相同时按面积排序（FR-006）
- [ ] T047 [US1] 手动测试：验证零战斗次数势力显示胜率为 "N/A"（FR-005）
- [ ] T048 [US1] 手动测试：键盘快捷键 'S' 打开/关闭面板流畅无延迟
- [ ] T049 [US1] 手动测试：点击关闭按钮能够关闭面板（FR-014）

**Checkpoint**: User Story 1 完成 - 排行榜基础功能可独立使用，所有契约测试通过，性能达标

---

## Phase 4: User Story 2 - 实时更新排行榜 (Priority: P2)

**Goal**: 当游戏中发生领土变更或战斗时，排行榜数据自动更新，无需手动刷新

**Independent Test**:
1. 打开统计面板（按 'S'）
2. 观察游戏进行，等待至少2次战斗发生
3. 验证排行榜数据在战斗结束后2秒内自动更新（无需手动操作）
4. 验证更新的数据行有视觉反馈（动画高亮）

### 防抖优化实现

- [ ] T050 [P] [US2] 创建 `app/src/utils/debounce.ts` - 实现通用 `debounce<T>()` 函数（wait 毫秒延迟，返回防抖版本函数）
- [ ] T051 [US2] 在 `factionStatsService.ts` 中使用 `debounce()` 包装 `handleBattleResult` - 设置 1000ms 防抖间隔（research.md 策略2）
- [ ] T052 [US2] 在 `factionStatsService.ts` 中使用 `requestIdleCallback` 或 `setTimeout` fallback 异步执行统计更新（research.md 策略1）

### 自动更新集成

- [ ] T053 [US2] 在 `FactionStatsPanel.tsx` 中验证 Zustand 的自动订阅机制 - 确保 `factionStats` 变化时组件自动重新渲染
- [ ] T054 [US2] 在 `FactionStatsPanel.tsx` 中为数据行添加 `key={faction.commanderId}` - 确保 React 正确识别变化的行

### 视觉反馈增强

- [ ] T055 [US2] 在 `FactionStatsPanel.css` 中添加 `.row-updated` 类 - 1秒淡入动画 + 黄色边框高亮
- [ ] T056 [US2] 在 `FactionStatsPanel.tsx` 中使用 `useEffect` 和 `useState` 追踪最近更新的势力 ID - 动态添加/移除 `.row-updated` 类

### 性能监控 (Constitution - Observability)

- [ ] T057 [US2] 在 `factionStatsService.ts` 中添加 `console.log` 记录每次统计更新事件（时间戳、涉及势力、更新类型）
- [ ] T058 [US2] 在浏览器控制台验证防抖生效 - 高频战斗时最多每1秒更新一次统计

### 质量保证

- [ ] T059 [US2] 手动测试：打开面板后触发5次连续战斗 - 验证数据在最后一次战斗后2秒内更新（SC-002）
- [ ] T060 [US2] 手动测试：关闭面板，等待战斗发生，重新打开 - 验证显示最新数据（FR-010）
- [ ] T061 [US2] 手动测试：验证更新的数据行有黄色高亮动画，持续1秒后消失

**Checkpoint**: User Story 2 完成 - 排行榜支持实时自动更新，有视觉反馈，性能优化生效

---

## Phase 5: User Story 3 - 查看势力详细统计 (Priority: P3)

**Goal**: 点击排行榜中的势力可查看详细信息（占领国家列表、战斗历史、分项统计）

**Independent Test**:
1. 打开统计面板（按 'S'）
2. 点击排行榜中任意势力行
3. 验证展开或弹出详情面板，显示该势力的完整信息：
   - 占领的国家列表及各自面积
   - 最近10条战斗记录（对手、结果、时间）
   - 进攻成功率和防守成功率分别显示
4. 点击关闭按钮返回排行榜主视图

### 数据模型扩展

- [ ] T062 [P] [US3] 在 `app/src/core/types.ts` 中定义 `FactionDetailStats` 接口（扩展 FactionStatistics，添加 ownedCountries: Country[], recentBattles: BattleEvent[], offenseWinRate: number, defenseWinRate: number）
- [ ] T063 [US3] 在 `app/src/core/state/store.ts` 中添加 `selectedFactionId: string | null` 状态
- [ ] T064 [US3] 在 `app/src/core/state/store.ts` 中添加 `setSelectedFaction: (id: string | null) => void` 方法

### 详情数据计算

- [ ] T065 [P] [US3] 创建 `app/src/core/services/factionDetailService.ts` - 实现 `getFactionDetail(commanderId: string): FactionDetailStats` 方法
- [ ] T066 [US3] 在 `factionDetailService.ts` 中实现 `getOwnedCountries(commanderId: string): Country[]` - 从 territories 和 countries 筛选
- [ ] T067 [US3] 在 `factionDetailService.ts` 中实现 `getRecentBattles(commanderId: string, limit: number): BattleEvent[]` - 从 eventLog 筛选最近的进攻和防守事件
- [ ] T068 [US3] 在 `factionDetailService.ts` 中实现 `calculateOffenseWinRate()` 和 `calculateDefenseWinRate()` - 分别统计进攻成功率和防守成功率

### 详情面板 UI

- [ ] T069 [P] [US3] 创建 `app/src/ui/panels/FactionDetailPanel.tsx` - 实现详情面板组件骨架（header + 返回按钮 + 3个区域占位符）
- [ ] T070 [US3] 在 `FactionDetailPanel.tsx` 中实现"占领国家列表"区域 - 表格显示国家名称和面积
- [ ] T071 [US3] 在 `FactionDetailPanel.tsx` 中实现"战斗历史"区域 - 列表显示最近10条战斗（时间、对手、结果、领土）
- [ ] T072 [US3] 在 `FactionDetailPanel.tsx` 中实现"分项统计"区域 - 卡片显示进攻成功率和防守成功率
- [ ] T073 [P] [US3] 创建 `app/src/ui/panels/FactionDetailPanel.css` - 实现详情面板样式（网格布局、卡片样式、滚动区域）

### 交互集成

- [ ] T074 [US3] 在 `FactionStatsPanel.tsx` 中为表格行添加 `onClick` 事件 - 调用 `setSelectedFaction(faction.commanderId)`
- [ ] T075 [US3] 在 `FactionStatsPanel.tsx` 中添加鼠标悬停效果 CSS - `.leaderboard-row:hover { background: rgba(255,255,255,0.1); cursor: pointer; }`
- [ ] T076 [US3] 在 `App.tsx` 中渲染 `<FactionDetailPanel />` - 根据 `selectedFactionId` 条件渲染
- [ ] T077 [US3] 在 `FactionDetailPanel.tsx` 中实现返回按钮 - 点击时调用 `setSelectedFaction(null)`

### 单元测试 (Constitution - Testing Evidence)

- [ ] T078 [P] [US3] 创建 `tests/unit/services/factionDetailService.spec.ts` - 测试 `getOwnedCountries()` 正确筛选（至少3个测试用例）
- [ ] T079 [P] [US3] 在 `factionDetailService.spec.ts` 中测试 `getRecentBattles()` 限制返回数量和时间排序（至少2个测试用例）
- [ ] T080 [P] [US3] 在 `factionDetailService.spec.ts` 中测试 `calculateOffenseWinRate()` 和 `calculateDefenseWinRate()` 计算正确性（各2个测试用例）
- [ ] T081 [US3] 运行单元测试并确保覆盖率 ≥ 90% `pnpm test tests/unit/services/factionDetailService.spec.ts --coverage`

### 集成测试 (Constitution - Testing Evidence)

- [ ] T082 [P] [US3] 创建 `tests/integration/ui/factionDetailPanel.spec.tsx` - 使用 React Testing Library 测试点击势力行打开详情面板
- [ ] T083 [P] [US3] 在 `factionDetailPanel.spec.tsx` 中测试详情面板显示正确的国家列表（mock 数据验证）
- [ ] T084 [P] [US3] 在 `factionDetailPanel.spec.tsx` 中测试点击返回按钮关闭详情面板
- [ ] T085 [US3] 运行集成测试 `pnpm test tests/integration/ui/factionDetailPanel.spec.tsx`

### 用户体验验证 (Constitution - UX)

- [ ] T086 [US3] 手动测试：点击势力行后详情面板在500ms内显示（流畅过渡动画）
- [ ] T087 [US3] 手动测试：验证国家列表显示完整且按面积降序排列
- [ ] T088 [US3] 手动测试：验证战斗历史最多显示10条且按时间倒序排列
- [ ] T089 [US3] 手动测试：验证进攻/防守成功率计算正确（手动计算对比）
- [ ] T090 [US3] 手动测试：详情面板支持滚动，内容超出时不遮挡

**Checkpoint**: User Story 3 完成 - 详情面板功能完整，所有测试通过，交互流畅

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: 最终优化、文档完善和跨故事质量改进

### E2E 测试 (Constitution - Testing Evidence)

- [ ] T091 [P] 创建 `tests/e2e/faction-stats.spec.ts` - Playwright E2E 测试套件骨架
- [ ] T092 [P] 在 `faction-stats.spec.ts` 中添加测试：打开游戏 → 按 'S' → 验证面板显示 → 验证至少显示1个势力
- [ ] T093 [P] 在 `faction-stats.spec.ts` 中添加测试：触发战斗 → 验证统计数据更新（对比战斗前后的 wins/losses）
- [ ] T094 [P] 在 `faction-stats.spec.ts` 中添加测试：验证排序逻辑（第一行国家数 ≥ 第二行国家数）
- [ ] T095 在 `faction-stats.spec.ts` 中添加测试（仅当实现 US3）：点击势力行 → 验证详情面板显示
- [ ] T096 运行 E2E 测试 `pnpm test:e2e tests/e2e/faction-stats.spec.ts`

### 可访问性改进 (Constitution - UX)

- [ ] T097 [P] 在 `FactionStatsPanel.tsx` 中添加 ARIA 属性：`role="dialog"`, `aria-labelledby="panel-title"`, `aria-modal="true"`
- [ ] T098 [P] 在 `FactionStatsPanel.tsx` 中添加键盘导航支持：按 'Escape' 键关闭面板
- [ ] T099 [P] 在 `FactionStatsPanel.css` 中添加高对比度支持：确保文字与背景对比度 ≥ 4.5:1（WCAG AA）
- [ ] T100 使用 axe DevTools 或 Lighthouse 测试可访问性 - 确保无严重或中等错误

### 性能基准测试 (Constitution - Performance)

- [ ] T101 创建 `tests/performance/faction-stats-benchmark.spec.ts` - 性能基准测试脚本
- [ ] T102 在基准测试中验证：50个势力排序时间 < 5ms（使用 `performance.now()`）
- [ ] T103 在基准测试中验证：增量更新单个势力统计 < 1ms
- [ ] T104 在基准测试中验证：面板打开渲染时间 < 500ms（SC-001）
- [ ] T105 运行性能基准测试并记录结果到 `specs/005-faction-stats/performance-report.md`

### 可观测性增强 (Constitution - Observability)

- [ ] T106 [P] 在 `factionStatsService.ts` 中集成 DevHud（如果项目有）- 显示统计更新频率和计算耗时
- [ ] T107 [P] 在 `FactionStatsPanel.tsx` 中添加 `data-testid` 属性到关键元素（面板、表格行、关闭按钮）方便自动化测试
- [ ] T108 在浏览器控制台添加全局调试函数 `window.__debugFactionStats()` - 输出当前所有势力统计数据

### 代码质量最终检查 (Constitution - Code Quality)

- [ ] T109 运行完整的 ESLint 检查 `pnpm lint` - 确保无错误和警告
- [ ] T110 运行完整的 TypeScript 类型检查 `pnpm type-check` - 确保无类型错误
- [ ] T111 运行完整的测试套件 `pnpm test` - 确保所有单元、集成、契约测试通过
- [ ] T112 生成最终测试覆盖率报告 `pnpm test:coverage` - 验证新增代码覆盖率 ≥ 90%
- [ ] T113 代码审查：检查所有新增文件是否符合项目代码风格（函数长度 ≤ 50行，文件长度 ≤ 300行）
- [ ] T114 代码审查：检查所有公共 API 是否有 JSDoc 注释

### 文档完善

- [ ] T115 [P] 更新 `specs/005-faction-stats/quickstart.md` - 添加"已完成功能"章节（列出 US1, US2, US3 的实现状态）
- [ ] T116 [P] 创建 `specs/005-faction-stats/performance-report.md` - 记录所有性能基准测试结果和对比规格要求（SC-001 至 SC-008）
- [ ] T117 [P] 在 `README.md`（项目根目录）中添加"势力统计排行榜"功能说明和快捷键使用指南

### 验证 quickstart.md 场景

- [ ] T118 按照 `specs/005-faction-stats/quickstart.md` 中的"开发步骤"逐步验证所有代码示例可运行
- [ ] T119 按照 `quickstart.md` 中的"调试技巧"验证浏览器控制台命令可用
- [ ] T120 按照 `quickstart.md` 中的"常见问题"验证所有问题的解决方案有效

### 最终验证清单

- [ ] T121 Success Criteria 验证：SC-001（打开面板 < 3秒）- 手动测试
- [ ] T122 Success Criteria 验证：SC-002（更新 < 2秒）- 手动测试
- [ ] T123 Success Criteria 验证：SC-003（支持50个势力）- 性能测试已覆盖
- [ ] T124 Success Criteria 验证：SC-004（90%理解度）- 可选用户测试或内部试玩反馈
- [ ] T125 Success Criteria 验证：SC-005（FPS影响 < 5%）- 使用浏览器性能监控工具验证
- [ ] T126 Success Criteria 验证：SC-006（战斗统计100%准确）- 契约测试已覆盖
- [ ] T127 Success Criteria 验证：SC-007（胜率精度 < 0.1%）- 契约测试已覆盖
- [ ] T128 Success Criteria 验证：SC-008（0崩溃率）- E2E 测试通过 + 手动测试无崩溃

**Checkpoint**: 所有功能完成、测试通过、文档齐全 - 功能可合并到主分支

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: 无依赖 - 可立即开始
- **Foundational (Phase 2)**: 依赖 Setup 完成 - **阻塞所有用户故事**
- **User Stories (Phase 3-5)**: 全部依赖 Foundational 完成
  - US1, US2, US3 可并行开发（如有多人团队）
  - 或按优先级顺序实现（P1 → P2 → P3）
- **Polish (Phase 6)**: 依赖所需的用户故事完成

### User Story Dependencies

- **User Story 1 (P1)**: Foundational 完成后可开始 - 无其他故事依赖 ✅ 独立可测试
- **User Story 2 (P2)**: Foundational 完成后可开始 - 依赖 US1 的服务层，但仍可独立测试（mock US1 组件）
- **User Story 3 (P3)**: Foundational 完成后可开始 - 依赖 US1 的排行榜 UI，但详情面板可独立测试

### Within Each User Story

1. **契约测试优先**（TDD 红灯）
2. **服务层** → **排序算法** → **UI 组件**（并行任务标记 [P]）
3. **应用集成** → **质量保证** → **性能验证** → **用户体验验证**
4. 故事完成后进入下一优先级

### Parallel Opportunities

#### Phase 1 (Setup)
- T002, T003, T004 可并行（不同操作）

#### Phase 2 (Foundational)
- T005, T006, T007 可并行（类型定义不同接口）
- T010, T011, T012 可并行（store 中不同方法）
- T013, T014 可并行（复制不同契约文件）

#### Phase 3 (User Story 1)
- T016 + T022 + T023 可并行（服务、工具、UI 骨架不同文件）
- T027, T028, T029 可并行（不同工具函数和样式）

#### Phase 4 (User Story 2)
- T050 + T055 可并行（工具函数和样式）

#### Phase 5 (User Story 3)
- T062 + T065 + T069 可并行（类型、服务、UI 不同文件）
- T078, T079, T080 可并行（不同测试文件或不同测试套件）
- T082, T083, T084 可并行（不同测试场景）

#### Phase 6 (Polish)
- T092, T093, T094 可并行（不同 E2E 测试用例）
- T097, T098, T099 可并行（不同可访问性改进）
- T106, T107 可并行（不同可观测性增强）
- T115, T116, T117 可并行（不同文档文件）

---

## Parallel Example: User Story 1 核心实现

```bash
# 第一批：骨架和基础（T016, T022, T023）
Task: "创建 factionStatsService.ts 类骨架"
Task: "创建 leaderboardSort.ts 排序函数"
Task: "创建 FactionStatsPanel.tsx 组件骨架"

# 第二批：工具函数（T027, T028）
Task: "实现 formatArea() 函数"
Task: "实现 formatWinRate() 函数"

# 第三批：集成（T031, T032, T033 可串行，但每个内部修改可合并）
Task: "在 App.tsx 中集成所有部分（导入+useEffect+键盘事件+渲染）"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only) - 推荐策略

1. ✅ **完成 Phase 1**: Setup（约 15 分钟）
2. ✅ **完成 Phase 2**: Foundational（约 1-2 小时）- **关键阻塞点**
3. ✅ **完成 Phase 3**: User Story 1（约 4-6 小时）
4. ⏸ **STOP and VALIDATE**: 
   - 运行所有契约测试（应全部通过）
   - 手动测试排行榜功能（打开、显示、排序、关闭）
   - 验证性能指标达标
5. 🚀 **Deploy/Demo MVP**: 基础排行榜功能可用，满足核心需求

### Incremental Delivery（如有更多时间）

1. ✅ Setup + Foundational → **Foundation ready**
2. ✅ User Story 1 → 测试独立功能 → **MVP 完成！**
3. ✅ User Story 2 → 测试独立功能 → **增强版：实时更新**
4. ✅ User Story 3 → 测试独立功能 → **完整版：详情面板**
5. ✅ Polish → 最终优化 → **Production Ready**

### Parallel Team Strategy（多人协作）

**前提**: 必须先完成 Setup + Foundational

1. **团队完成 Phase 1 + Phase 2**（1-2小时）
2. **Phase 2 完成后分工**:
   - **Developer A**: User Story 1（核心功能，优先级最高）
   - **Developer B**: User Story 2（等待 A 完成服务层后开始，或先准备防抖工具）
   - **Developer C**: User Story 3（等待 A 完成排行榜 UI 后开始）
3. **各故事独立完成和集成**
4. **汇合后统一执行 Polish**

---

## Notes

- **[P] 标记**: 不同文件，无依赖，可并行执行
- **[Story] 标记**: 任务归属清晰，便于追踪和独立测试
- **TDD 方法**: 契约测试先行，确保先失败（红灯），再实现（绿灯），最后重构
- **Checkpoint**: 每个用户故事结束都有独立验证点，可随时停止或展示
- **避免**: 模糊任务、相同文件冲突、跨故事强依赖破坏独立性
- **提交建议**: 每完成一个任务或逻辑组提交一次 Git commit
- **性能预算**: 统计计算 < 50ms，排序 < 5ms，渲染 < 500ms，更新 < 2s
- **覆盖率目标**: 新增代码单元测试覆盖率 ≥ 90%，契约测试 100% 通过
- **Constitution 对齐**: 每个用户故事包含代码质量、测试、UX、性能和可观测性任务

---

## Summary

- **Total Tasks**: 128
- **Task Breakdown**:
  - Phase 1 (Setup): 4 tasks
  - Phase 2 (Foundational): 11 tasks
  - Phase 3 (User Story 1 - MVP): 34 tasks
  - Phase 4 (User Story 2): 12 tasks
  - Phase 5 (User Story 3): 29 tasks
  - Phase 6 (Polish): 38 tasks
- **Parallel Opportunities**: 约 40% 的任务标记 [P]，可显著提升开发效率
- **Independent Test Criteria**: 每个用户故事都有明确的独立测试标准
- **MVP Scope**: User Story 1（T001-T049，约 6-8 小时完成）
- **Constitution Compliance**: 所有任务符合代码质量、测试、UX、性能和可观测性要求
- **Format Validation**: ✅ 所有任务遵循 `- [ ] [ID] [P?] [Story?] Description with file path` 格式

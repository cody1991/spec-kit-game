# Implementation Plan: 势力统计排行榜

**Branch**: `005-faction-stats` | **Date**: 2025-12-01 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/005-faction-stats/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

创建一个全新的势力统计排行榜面板（FactionStatsPanel），展示所有活跃和已淘汰势力的综合统计数据。面板需要实时显示每个势力的国家数量、国土面积、战胜/战败次数和胜率，并按国家数量降序排序。技术方案采用 React + TypeScript + Zustand 状态管理，通过订阅游戏事件（领土变更、战斗结果）实时更新统计数据，确保数据准确性达到100%且性能影响小于5%。

## Technical Context

**Language/Version**: TypeScript 5.x + React 18  
**Primary Dependencies**: 
- React 18 (UI框架)
- Zustand (全局状态管理)
- Phaser 3 (游戏引擎，用于渲染层)
- Vite (构建工具)

**Storage**: 内存存储（Zustand store），无持久化需求（统计数据基于当前游戏会话）  
**Testing**: Vitest + React Testing Library (单元测试) + Playwright (E2E测试)  
**Target Platform**: Web浏览器（桌面端为主，支持现代浏览器）  
**Project Type**: Web应用（单页应用 SPA）  
**Performance Goals**: 
- 排行榜渲染时间 < 500ms
- 统计计算时间 < 50ms（针对200个国家+50个势力）
- 数据更新延迟 < 2秒（战斗结束后）
- 帧率影响 < 5%（保持60fps）

**Constraints**: 
- 统计计算必须异步执行，不阻塞游戏主循环
- 战胜/战败统计准确率 100%（与战斗事件完全一致）
- 胜率计算精度误差 < 0.1%
- 支持至少50个活跃势力同时显示

**Scale/Scope**: 
- 预期势力数：10-50个
- 预期国家数：150-200个
- 战斗事件频率：每秒0.5-2次（取决于战争速度设置）
- 面板刷新频率：每2秒或事件触发时

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

### 1. 代码质量门禁 ✅

**策略**:
- 使用 ESLint + TypeScript strict mode 进行静态分析
- 使用 Prettier 统一代码格式
- 代码评审清单：
  - 统计计算逻辑的时间复杂度（目标：O(n)，n为势力数）
  - React组件的职责单一性（统计计算与UI渲染分离）
  - TypeScript类型覆盖率 100%

**复杂度控制**:
- 单个文件不超过300行
- 函数不超过50行
- 循环复杂度 ≤ 10

**文档要求**:
- 统计计算算法的注释说明
- 战胜/战败计数规则的文档
- UI组件的 Props 接口文档

### 2. 测试门禁 ✅

**测试金字塔**:
- **单元测试（70%）**: 
  - 统计计算逻辑（国家数量、面积、战胜/战败、胜率）
  - 排序算法（主排序：国家数，次排序：面积）
  - 边界情况（零战斗、除零、空数据）
- **集成测试（20%）**:
  - 战斗事件触发统计更新
  - 领土变更触发统计更新
  - Zustand store 数据流
- **E2E测试（10%）**:
  - 打开面板 → 查看排行榜
  - 战斗后数据自动更新
  - 点击势力查看详情

**覆盖率目标**: ≥ 90% (重点覆盖统计计算逻辑)

**CI集成**: 
- 所有测试在 `pnpm test` 中执行
- PR合并前必须通过所有测试
- 回归测试套件执行时间 < 5分钟

**测试先行策略**: 
1. 先编写统计计算逻辑的单元测试（TDD）
2. 实现统计服务
3. 编写UI组件测试
4. 实现UI组件
5. 编写E2E测试验收场景

### 3. 体验门禁 ✅

**目标用户**: 游戏玩家（观察战局态势）

**成功路径**:
1. 玩家通过快捷键（如'S'）或按钮打开统计面板
2. 面板以流畅动画展开（< 300ms）
3. 排行榜清晰显示所有势力及其统计数据
4. 数据按国家数量降序排列，一目了然
5. 战斗发生后，相关数据自动更新并高亮变化

**失败恢复**:
- 统计数据计算失败 → 显示"数据加载中"或上次成功的快照
- 零战斗次数 → 胜率显示为"N/A"而非错误
- 面板渲染卡顿 → 降级为手动刷新模式

**可达性要求**:
- 支持键盘快捷键打开/关闭面板（'S'键或Esc）
- 面板内容可通过Tab键导航
- 文本对比度符合WCAG AA标准
- 数据更新时有视觉反馈（动画/高亮）

**可用性验收**:
- 任务完成率：95%的玩家能在首次尝试时成功打开并理解排行榜
- 用户反馈：通过游戏内遥测收集面板打开次数、停留时间

### 4. 性能门禁 ✅

**端到端性能预算**:
- 面板打开时间：< 3秒（包含数据计算和渲染）
- 统计计算时间：< 50ms（200国家+50势力场景）
- 数据更新延迟：< 2秒（战斗事件到UI刷新）
- 帧率影响：< 5%（游戏保持≥60fps）

**基准方案**:
- 使用 Vitest 的 `bench` API 测试统计计算性能
- 使用 React DevTools Profiler 测试组件渲染性能
- 在开发模式下记录统计计算耗时（console.time）

**降级策略**:
- 当统计计算超过100ms → 切换为手动刷新按钮
- 当势力数超过50 → 分页显示（每页25个）
- 当帧率低于45fps → 停止自动更新，仅保留手动刷新

**背压机制**:
- 使用防抖（debounce）处理高频战斗事件（最多每1秒更新一次）
- 统计计算在 requestIdleCallback 中执行（浏览器空闲时）

### 5. 可观测性门禁 ✅

**日志**:
- 统计计算开始/结束（包含耗时）
- 战胜/战败计数更新（记录势力ID和计数值）
- 排序结果变化（记录排名变动）
- 异常情况（如除零、数据异常）

**指标**:
- 面板打开次数（按session聚合）
- 面板停留时间（中位数、p95）
- 统计计算耗时（p50、p95、p99）
- 数据更新频率（每分钟次数）

**追踪**:
- 用户交互流：打开面板 → 查看排行榜 → 点击详情 → 关闭面板
- 数据流：战斗事件 → 统计更新 → UI刷新

**仪表盘位置**:
- 使用现有的 DevHud 组件显示实时性能指标
- 在浏览器控制台输出详细日志（开发模式）
- 使用 Zustand DevTools 跟踪状态变化

**上线复盘**:
- 上线后24小时内检查：
  - 面板打开失败率 < 1%
  - 统计计算超时次数 = 0
  - 用户停留时间 > 5秒（说明有价值）
  - 性能指标是否符合预算

## Project Structure

### Documentation (this feature)

```text
specs/005-faction-stats/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (技术调研：统计算法、性能优化、UI设计)
├── data-model.md        # Phase 1 output (数据模型：FactionStatistics, Leaderboard)
├── quickstart.md        # Phase 1 output (快速开始指南)
├── contracts/           # Phase 1 output (API契约)
│   ├── faction-stats.contract.ts      # 势力统计接口契约
│   └── leaderboard-sorting.contract.ts # 排序算法契约
├── checklists/
│   └── requirements.md  # 需求检查清单（已完成）
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
app/
├── src/
│   ├── core/
│   │   ├── state/
│   │   │   └── store.ts                    # [UPDATE] 新增 factionStats 状态
│   │   ├── services/
│   │   │   └── factionStatsService.ts      # [NEW] 统计计算服务
│   │   └── types.ts                        # [UPDATE] 新增 FactionStatistics 类型
│   │
│   ├── ui/
│   │   └── panels/
│   │       ├── FactionStatsPanel.tsx       # [NEW] 排行榜主面板
│   │       ├── FactionStatsPanel.css       # [NEW] 面板样式
│   │       ├── FactionDetailPanel.tsx      # [NEW] 势力详情面板（P3优先级）
│   │       └── FactionDetailPanel.css      # [NEW] 详情样式
│   │
│   └── App.tsx                              # [UPDATE] 集成 FactionStatsPanel
│
└── tests/
    ├── unit/
    │   ├── services/
    │   │   └── factionStatsService.spec.ts # [NEW] 统计服务单元测试
    │   └── utils/
    │       └── factionStatsSorting.spec.ts  # [NEW] 排序逻辑单元测试
    │
    ├── integration/
    │   └── ui/
    │       └── factionStatsPanel.spec.ts    # [NEW] 面板集成测试
    │
    └── e2e/
        └── faction-stats.spec.ts            # [NEW] 端到端测试
```

**Structure Decision**: 

采用 **Web应用单项目结构**，因为这是一个纯前端功能，无需后端服务。主要文件组织：

1. **服务层** (`core/services/factionStatsService.ts`): 
   - 负责统计计算逻辑
   - 订阅 Zustand store 的战斗事件和领土变更
   - 异步更新统计数据

2. **状态层** (`core/state/store.ts`):
   - 新增 `factionStats: Map<commanderId, FactionStatistics>` 状态
   - 提供 `updateFactionStats()` action
   - 集成到现有 Zustand store

3. **UI层** (`ui/panels/`):
   - `FactionStatsPanel`: 主排行榜组件（P1）
   - `FactionDetailPanel`: 详情面板组件（P3）
   - 使用 React Hooks 订阅状态变化

4. **测试层** (`tests/`):
   - 单元测试：统计计算、排序算法
   - 集成测试：事件触发更新
   - E2E测试：用户交互流

## Complexity Tracking

> **填写原因**: 无宪章违规，但需记录技术决策

| 技术决策                                   | 选择原因                                                 | 备选方案及拒绝理由                                                 |
| ------------------------------------------ | -------------------------------------------------------- | ------------------------------------------------------------------ |
| 使用 Map<commanderId, Stats> 而非数组存储 | O(1)查找性能，适合高频更新场景（每秒0.5-2次战斗事件）   | 数组存储需要O(n)查找，在50个势力场景下性能较差                     |
| 统计计算在服务层而非组件内                 | 单一职责原则，便于单元测试和性能优化                     | 组件内计算会导致重复渲染和难以测试                                 |
| 使用 requestIdleCallback 异步计算          | 避免阻塞游戏主循环，确保60fps                            | 同步计算会在高频战斗时导致帧率下降                                 |
| 战胜/战败仅统计势力间战斗                  | 符合规格要求，避免中立领土占领干扰战绩统计               | 包含中立领土会导致战绩膨胀，失去对比意义                           |
| 详情面板作为独立组件（P3）                 | 支持增量开发，P1先完成基础排行榜，P3再增强               | 合并为单一组件会增加初始开发复杂度，不利于MVP快速验证              |
| 使用 Zustand store 而非独立状态            | 复用现有架构，保持状态管理一致性，便于与其他功能集成     | 独立状态管理（如Context API）会增加架构复杂度，且与现有系统不一致 |
| 防抖1秒处理高频事件                        | 平衡实时性和性能，避免不必要的重复计算                   | 不防抖会导致高频战斗时计算开销过大；防抖过长（>2秒）影响实时体验  |

**无违规说明**: 本计划严格遵循宪章所有原则，无需豁免。

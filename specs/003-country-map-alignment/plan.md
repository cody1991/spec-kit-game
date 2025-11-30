# Implementation Plan: 国家与地图精准对齐

**Branch**: `003-country-map-alignment` | **Date**: 2025-11-30 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/003-country-map-alignment/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

修复当前版本中国家名称与地图位置不匹配的核心问题。通过建立准确的 region-to-country 映射表，将旧的区域 ID（如 'china', 'western-europe'）正确映射到标准的 ISO 3166-1 alpha-3 国家代码，确保指挥官占领的国家名称与地图上的实际地理位置完全对应。技术路径：配置化映射表 + 数据流统一化 + 自动化测试验证。

## Technical Context

**Language/Version**: TypeScript 5.4.5 (ES2020 target)
**Primary Dependencies**:

- Phaser 3.80.1 (游戏引擎，地图渲染)
- React 18.2.0 + React-DOM (UI 组件)
- Zustand 4.4.7 (状态管理)
- D3-Geo 3.1.0 (地理坐标投影)
- TopoJSON-Client 3.1.0 (地图数据解析)

**Storage**:

- IndexedDB via `idb` 7.1.1 (地图数据缓存)
- In-memory Zustand store (游戏状态)
- Static JSON files (`/app/public/maps/world-countries.json`)

**Testing**:

- Vitest 1.0.4 (单元测试 + 集成测试)
- @testing-library/react 14.1.2 (React 组件测试)
- Playwright 1.40.1 (E2E 测试)
- @vitest/coverage-v8 (覆盖率报告)

**Target Platform**: Web (Vite 5.0.8 开发服务器，静态部署)
**Project Type**: Web application (单页应用，Phaser + React 混合架构)

**Performance Goals**:

- 地图渲染保持 60 FPS（当前已实现）
- 映射逻辑执行时间 < 50ms（不影响启动速度）
- 国家颜色更新延迟 < 100ms（实时性）

**Constraints**:

- 不修改现有地图数据文件（world-countries.json）的结构
- 保持与现有 Phaser 渲染管线的兼容性
- 不破坏已有的 commander 和 territory 数据模型
- 向后兼容旧的 region-based 配置（过渡期）

**Scale/Scope**:

- 10 位历史指挥官
- 193 个国家（联合国成员国）
- 15 个旧区域 ID 需要映射
- 预计映射关系数：15 region IDs → ~50 country IDs

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

### ✅ 1. 代码质量门禁

**格式化与静态分析**:

- 使用现有的 ESLint + Prettier 配置
- `npm run lint` 检查 TypeScript + React 代码
- `npm run format` 统一格式化
- 配置文件：`.eslintrc.json`, `.prettierrc`

**复杂度衡量**:

- ESLint 规则：`max-lines: 300`, `complexity: 15`
- SonarJS 插件已启用，检测代码异味
- 映射逻辑将提取到独立配置文件，单个文件 < 200 行

**代码评审策略**:

- 映射配置文件需 peer review（关键数据）
- 渲染逻辑变更需验证性能无回归
- 所有 PR 需通过 CI lint 检查

**文档产出**:

- `regionMapping.config.ts` 包含详细注释（每个 region 的地理含义）
- `research.md` 记录映射决策依据
- `quickstart.md` 提供开发者快速上手指南

**✓ 通过**: 计划中已明确格式化、静态分析、复杂度控制和文档产出策略。

---

### ✅ 2. 测试门禁

**测试金字塔**:

```
       /\       E2E (Playwright)
      /  \        - 10个关键国家对齐验证
     /____\       - 点击交互验证
    /      \    Integration (Vitest)
   /        \     - 映射逻辑集成测试
  /__________\    - WorldScene 初始化测试
 /            \  Unit (Vitest)
/______________\   - regionCountryMap 验证
                   - 映射函数单元测试
```

**覆盖率目标**:

- 映射逻辑（config + mapper）: 100%（关键路径）
- WorldScene.mapCountriesToCommanders: 90%
- 整体新增代码覆盖率: > 85%

**测试先行策略**:

- Phase 2 实施时，先编写失败的单元测试
- 映射配置完成后，立即运行验证测试
- E2E 测试在集成阶段添加，验证用户可见结果

**CI 集成**:

- `npm run test` 运行所有单元测试（< 10s）
- `npm run test:coverage` 生成覆盖率报告
- `npm run test:e2e` 运行 E2E 测试（< 2min）
- 测试失败阻止 PR 合并

**✓ 通过**: 测试金字塔完整，覆盖率目标明确，CI 集成已配置。

---

### ✅ 3. 体验门禁

**目标用户**:

- 游戏玩家（观察地图，识别国家）
- 开发者（维护映射配置，调试问题）

**成功路径**:

1. **主路径（P1）**: 玩家启动游戏 → 查看地图 → 点击指挥官 → 看到正确的国家名称与地图位置对应
2. **验证路径（P2）**: 开发者运行测试 → 测试自动验证10个关键国家 → 测试通过
3. **调试路径（P3）**: 开发者打开控制台 → 查看映射日志 → 快速定位问题

**失败恢复体验**:

- 如果映射文件缺失或损坏 → 显示警告日志，降级到旧的 region 显示，游戏继续运行
- 如果某个 region 无法映射 → 跳过该 region，记录警告，不影响其他映射
- 如果地图数据加载失败 → 显示简化地图（现有降级逻辑）

**可达性验证方法**:

- 键盘导航：Tab 键可访问所有交互元素（国家点击、面板操作）
- 颜色对比：使用高对比度颜色区分不同指挥官（已有）
- 屏幕阅读器：国家名称通过 aria-label 暴露（现有 CountryDetailPanel 已支持）

**可用性指标**:

- SC-002: 100% 用户能正确识别秦始皇占领中国（测试验证）
- SC-008: 80% 用户首次游戏时顺利完成任务（用户测试）

**✓ 通过**: 目标用户明确，成功路径和失败恢复体验已定义，可用性指标可测量。

---

### ✅ 4. 性能门禁

**端到端性能预算**:

- 游戏启动时间：不增加超过 50ms
- 映射逻辑执行时间：< 50ms（10位指挥官 × 15个region → ~50个country）
- 国家颜色更新：< 100ms（单次领土变化）
- 地图渲染帧率：保持 60 FPS（不低于现有水平）

**基准方案**:

- 使用现有的 `PerformanceMonitor` 工具测量 FPS
- 在 `WorldScene.mapCountriesToCommanders` 中添加 `performance.mark/measure`
- 记录映射前后的时间差，输出到控制台
- E2E 测试中使用 Playwright 的 Performance API 测量页面加载时间

**降级与背压策略**:

- 如果映射时间超过 100ms → 记录警告，考虑简化映射表（减少 country 数量）
- 如果 FPS 低于 30 → 禁用颜色过渡动画（现有逻辑已支持）
- 如果内存占用超过阈值 → 使用简化版地图数据（现有降级逻辑）

**监测回归**:

- CI 中运行性能基准测试（使用 Vitest benchmark）
- 对比 PR 前后的性能指标（启动时间、映射时间）
- 如果回归 > 5% → PR 被阻止，需优化或提供豁免说明

**✓ 通过**: 性能预算明确，基准方案可执行，降级策略完备，回归监测已定义。

---

### ✅ 5. 可观测性门禁

**日志最小集合**:

- **启动日志**: "🔍 Starting country-to-commander mapping..." (INFO)
- **映射详情**: " 秦始皇 -> 中国 (156) ✓" (DEBUG)
- **映射统计**: "🗺️ Mapped 45 countries to 10 commanders" (INFO)
- **错误日志**: "❌ Failed to map region 'unknown-region': not found in mapping table" (ERROR)
- **性能日志**: "⏱️ Mapping completed in 23ms" (DEBUG)

**指标最小集合**:

- `game.mapping.duration_ms`: 映射逻辑执行时间
- `game.mapping.success_count`: 成功映射的国家数
- `game.mapping.failure_count`: 失败映射的 region 数
- `game.render.fps`: 地图渲染帧率（已有）

**追踪信号**:

- 用户点击国家 → 记录 country ID 和 owner ID
- 领土易手 → 记录 previous owner → new owner 转换
- 映射冲突 → 记录冲突的 region 和 country IDs

**仪表盘位置**:

- 开发模式：`DevHud` 组件显示 FPS、映射统计、错误数
- 生产模式：控制台日志（用户可通过 F12 查看）
- CI 报告：测试输出中包含性能指标和覆盖率

**上线后复盘流程**:

- 上线后 1 小时：检查控制台是否有映射错误日志
- 上线后 24 小时：收集用户反馈，检查是否有国家对齐问题报告
- 上线后 7 天：统计 E2E 测试通过率，评估视觉回归测试结果

**✓ 通过**: 日志、指标、追踪信号已定义，仪表盘位置明确，复盘流程可执行。

---

## Project Structure

### Documentation (this feature)

```text
specs/003-country-map-alignment/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (mapping decisions, best practices)
├── data-model.md        # Phase 1 output (RegionCountryMapping, validation rules)
├── quickstart.md        # Phase 1 output (developer guide)
├── contracts/           # Phase 1 output (mapping config schema, validation contract)
│   ├── regionMapping.schema.json
│   └── mappingValidation.contract.md
├── spec.md              # Feature specification (already exists)
├── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
└── checklists/          # Quality checklists (already exists)
    └── requirements.md
```

### Source Code (repository root)

```text
app/
├── src/
│   ├── config/                        # NEW: Configuration files
│   │   └── regionMapping.config.ts    # NEW: Region-to-Country mapping table
│   ├── core/
│   │   ├── types.ts                   # MODIFY: Add CountryMappingConfig type
│   │   ├── state/
│   │   │   └── store.ts               # MODIFY: Ensure territoryStates uses country IDs
│   │   └── validation/                # NEW: Validation utilities
│   │       └── mappingValidator.ts    # NEW: Validate mapping configuration
│   ├── scenes/
│   │   └── world/
│   │       ├── WorldScene.ts          # MODIFY: Update mapCountriesToCommanders()
│   │       └── utils/
│   │           └── countryMapper.ts   # NEW: Region-to-Country mapping logic
│   ├── ui/
│   │   └── panels/
│   │       ├── CommanderPanel.tsx     # MODIFY: Display real country names
│   │       └── CountryDetailPanel.tsx # MODIFY: Display real country names
│   └── data/
│       └── commandersData.ts          # NO CHANGE: Keep existing structure
│
├── public/
│   └── maps/
│       ├── world-countries.json       # NO CHANGE: Existing map data
│       └── world-countries-simplified.json  # NO CHANGE: Fallback map
│
tests/
├── unit/
│   ├── config/
│   │   └── regionMapping.test.ts      # NEW: Test mapping configuration
│   └── scenes/
│       └── world/
│           └── countryMapper.test.ts  # NEW: Test mapping logic
├── integration/
│   └── worldScene.test.ts             # NEW: Test WorldScene initialization
└── e2e/
    ├── us1-country-alignment.spec.ts  # NEW: Test country name-position alignment
    └── us2-commander-territories.spec.ts  # NEW: Test commander detail panel
```

**Structure Decision**:
采用单 Web 应用结构（`app/` 目录），前端使用 Phaser (Canvas) + React (UI Overlay) 混合架构。新增的映射逻辑集中在 `app/src/config/` 和 `app/src/scenes/world/utils/` 中，保持与现有代码结构的一致性。测试文件按类型分层（unit/integration/e2e），对应测试金字塔结构。

## Complexity Tracking

**无违反项**：本计划符合所有 Constitution 原则，无需复杂度豁免。

- 映射逻辑设计简洁：配置文件 + 纯函数映射，无额外抽象层
- 测试覆盖完整：单元测试 100%，集成测试覆盖关键流程，E2E 验证用户体验
- 性能影响可控：映射逻辑 O(n)，n < 100，执行时间 < 50ms
- 可观测性充分：日志、指标、追踪信号齐全，便于问题排查

---

## Phase 0-1 Completion Checklist

### Phase 0: Research ✅

- [x] 地图数据格式与国家 ID 标准（ISO 3166-1 numeric codes）
- [x] Region-to-Country 映射策略（配置化映射表）
- [x] 验证和测试策略（三层测试 + 编译时/运行时验证）
- [x] 性能优化策略（基本预处理 + 性能监控）
- [x] 错误处理与降级策略（分层处理 + 降级方案）
- [x] 所有 NEEDS CLARIFICATION 已解决

### Phase 1: Design & Contracts ✅

- [x] `data-model.md` - 数据模型定义完成
  - RegionMapping, CountryMappingResult, ValidationResult
  - HistoricalCommander 和 TerritoryState 扩展
  - 数据流和状态转换定义
- [x] `contracts/` - API 契约定义完成
  - `regionMapping.schema.json` - JSON Schema
  - `mappingValidation.contract.md` - 验证契约（3个核心函数）
- [x] `quickstart.md` - 开发者快速上手指南完成
  - 4步实施指南（配置 + 修复 + 验证 + 测试）
  - 常见问题解答
  - 性能优化建议
- [x] Agent context update - CodeBuddy 上下文已更新

### Constitution Check (Re-evaluation) ✅

所有 5 项门禁已通过（详见 [Constitution Check](#constitution-check) 章节）：

1. ✅ 代码质量门禁
2. ✅ 测试门禁
3. ✅ 体验门禁
4. ✅ 性能门禁
5. ✅ 可观测性门禁

---

## Ready for Phase 2

Phase 0-1 已完成，所有设计文档和契约已就绪。可以进入 Phase 2: Implementation。

**下一步**: 运行 `/speckit.tasks` 命令生成详细的实施任务清单（tasks.md）。

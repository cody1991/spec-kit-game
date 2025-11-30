# Implementation Plan: 国家攻占规则调整

**Branch**: `002-country-battle-logic` | **Date**: 2025-11-30 | **Spec**: [link](../spec.md)
**Input**: Feature specification from `/specs/002-country-battle-logic/spec.md`

**Note**: This plan遵循仓库宪法（Spec Kit Game Constitution 1.0.0），并将按 Phase 0/1 输出 research、数据模型、契约与快速上手文档。

## Summary

从规格中抽取的主需求：

- 移除「东南亚」「北美」「中美」等区域级占领单位，统一以「国家」作为最小占领与展示粒度。
- 调整攻占流程为「一个国家一个国家」结算，禁止任意形式的「一次性占领对手全部国家」行为。
- 更新地图展示逻辑，确保每个国家任意时刻只展示当前占领者姓名/标识，不出现名称叠加或残留。

技术路线概述：

- 在现有 `core/state` 与 `core/simulation` 中引入/强化「国家占领状态」模型，使攻占、胜利系统只读写国家级所有权，而非区域级聚合。
- 在 `scenes/world` 与 `ui/panels` 等前端渲染层重构占领与姓名展示逻辑，使之绑定单个国家实体，并在占领事件流中做增量更新，避免名称残留。
- 在测试层新增/扩展针对国家攻占与展示的单元、集成和端到端用例，以测试即规范的方式锁定本次规则变更。

## Technical Context

**Language/Version**: TypeScript 5.4.x + React 18，构建/开发基于 Vite 5（ESM 模式）  
**Primary Dependencies**: React 18、Vite 5、Phaser 3.80（世界地图场景与战斗可视化）、Zustand（状态管理）、d3-geo + topojson-client（地图投影与地理数据）、idb（浏览器 IndexedDB 存储）  
**Storage**: 浏览器内存为主，按需通过 `idb` 在 IndexedDB 中缓存地图与会话相关数据，无服务器端数据库  
**Testing**: Vitest（单元/集成测试，含 `@testing-library/react`）、Playwright（端到端 UI 测试），并在 CI 中通过 `pnpm test` / `pnpm test:e2e` 执行  
**Target Platform**: 现代桌面浏览器（Chromium、Firefox、Safari 最新稳定版本），通过 Vite 本地开发与静态资源构建  
**Project Type**: 单体 Web SPA（React + Phaser 前端游戏），所有游戏逻辑与状态均在前端实现  
**Performance Goals**: 
- 世界地图基本交互（国家 hover、高亮、详情面板展开）在常规开发机上 p95 交互响应时间 < 150ms。
- 单次国家攻占结算后，地图颜色与姓名更新在 200ms 内完成并稳定渲染，不引入明显掉帧（目标 60fps）。
- 新增国家级运算逻辑应保持 O(N) 复杂度（N 为国家数量），禁止在主循环中进行 O(N^2) 级遍历。

**Constraints**: 
- 不引入后端服务或新增远程依赖，仅在现有前端架构内完成逻辑变更。
- 额外内存占用控制在国家状态与渲染辅助结构所需的少量增量之内，不显著提高页面初始加载体积（地图数据文件保持现状级别）。
- 需要与现有世界地图渲染与模拟系统兼容，不破坏当前会话生命周期、Tick 调度和胜利判定机制。

**Scale/Scope**: 
- 地图维持当前世界国家粒度（约 200 个国家级实体）。
- 单局游戏时长典型在 10–60 分钟范围内，本特性主要影响地图展示与攻占交互，而非整体游戏模式或存档系统。

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

1. **代码质量门禁**  
   - 采用现有 ESLint（含 TypeScript/React 规则）与 Prettier 作为基础质量门禁，所有变更需通过 `pnpm lint` 与 `pnpm format`。
   - 对涉及 `core/simulation`、`core/state` 与 `scenes/world` 的关键路径修改，要求至少一名熟悉该模块的评审者进行代码评审，评审记录中需明确说明：
     - 如何保持职责单一与依赖清晰（例如将「国家所有权」与「地图展示」逻辑拆分为独立服务或模块）。
     - 复杂度控制（避免在单一函数/文件中堆叠过多分支与状态变更）。
   - 对新增的国家占领相关数据结构和接口，补充类型定义与必要的代码级文档，使后续迭代可独立理解与扩展。

2. **测试门禁**  
   - 为关键功能（逐个国家攻占、禁止批量占领、国家姓名唯一展示）编写或扩展 Vitest 单元/集成测试，并将用例命名映射到规格中的 FR/用户故事编号（例如 `fr001_country_unit_conquest`）。
   - 使用 Playwright 增加至少一条端到端回归脚本：从开始界面进入世界地图，执行多次国家攻占，并断言国家归属与姓名展示与预期一致。
   - 新增逻辑的单元测试覆盖率目标不低于 90%，关键路径端到端测试需在 CI 中阻塞合并（测试失败时禁止合入）。

3. **体验门禁**  
   - 在规划与验收中显式引用规格中的用户故事，确保：
     - 玩家始终以国家为单位理解占领结果，不再看到区域级占领节点。
     - 玩家在多次易主场景中能一眼识别当前占领者，不被历史姓名残留干扰。
   - 针对世界地图的键盘导航和焦点管理维持或提升现有可达性水平，重要信息（国家归属、占领者姓名）应有清晰的视觉与文本提示。
   - 在内测或灰度阶段收集定性反馈（例如问题记录或简短问卷），验证是否达成规格中的可读性提升目标。

4. **性能门禁**  
   - 在 `scenes/world` 的现有性能监控与 `PerformanceMonitor` 工具基础上，关注：
     - 国家攻占操作引入的额外渲染与逻辑耗时是否保持在预设预算内。
     - 多次连续攻占时是否产生明显掉帧或卡顿。
   - 如果发现新增逻辑导致 p95 交互延迟增加超过 5%，需在同一迭代内优化或记录豁免与后续修复计划。

5. **可观测性门禁**  
   - 在前端 Telemetry/日志（如 `services/telemetry`）中增加适度埋点，用于记录：
     - 国家所有权变更事件（包含前后占领者与国家标识）。
     - 含有异常状态的情况（例如检测到同一国家存在多个占领者名称渲染尝试时的防御性日志）。
   - 在分析或调试过程中，可通过这些信号快速复盘一局游戏中的占领轨迹与异常展示问题，必要时支持构建简单的调试视图或分析脚本。

> 结论：在当前计划下，所有宪法门禁均有对应的实现或验证策略，不存在需要豁免的违例；若后续设计或实现提出需要新增复杂结构，将在“Complexity Tracking”部分单独记录和论证。

## Project Structure

### Documentation (this feature)

```text
specs/002-country-battle-logic/
├── plan.md              # 本实现计划（/speckit.plan 输出）
├── research.md          # Phase 0：研究与决策记录
├── data-model.md        # Phase 1：数据模型与状态迁移设计
├── quickstart.md        # Phase 1：本特性开发与验证快速上手指南
├── contracts/           # Phase 1：与前端/系统交互的契约描述（如 API/事件）
└── tasks.md             # Phase 2：实施任务拆解（由 /speckit.tasks 生成）
```

### Source Code (repository root)

```text
app/
├── index.html                 # Vite 入口 HTML
├── vite.config.ts             # Vite + React + Phaser 配置
└── src/
    ├── main.tsx              # React/Phaser 应用入口
    ├── App.tsx               # 顶层应用组件
    ├── config/               # 区域与国家映射等配置（如 regionMapping.config.ts）
    ├── core/                 # 核心领域层（类型、会话、模拟、状态等）
    │   ├── types.ts
    │   ├── events/
    │   ├── generation/
    │   ├── session/
    │   ├── simulation/       # Tick 调度与系统（battleSystem、victorySystem 等）
    │   ├── state/            # Zustand store 与世界/玩家状态
    │   └── validation/
    ├── data/                 # 指挥官、地图等静态数据
    ├── scenes/               # Phaser 场景
    │   ├── boot/
    │   └── world/            # 世界地图场景、渲染与交互
    ├── services/             # API、持久化、分享与遥测服务
    ├── styles/               # 全局样式
    └── ui/                   # React UI（HUD、面板、弹窗、起始界面等）

specs/
└── 002-country-battle-logic/ # 本特性相关文档

tests/
├── unit/                     # 单元测试（可按模块划分）
├── integration/              # 集成测试（组件 + 状态 + 场景）
└── e2e/                      # Playwright 端到端测试
```

**Structure Decision**: 

- 保持现有单仓前端游戏结构，在 `app/src/core` 与 `app/src/scenes/world` 中集中演进国家攻占与展示逻辑，并在 `app/src/ui` 中调整 HUD/面板以反映新的国家级规则。
- 测试仍然集中在根目录 `tests/` 与 `app` 内部测试组合中，通过 Vitest + Playwright 构建测试金字塔，不拆分额外项目或子仓库。

## Complexity Tracking

> 当前计划未引入超出宪法建议范围的复杂结构（如额外项目、过度抽象模式等），本表保持为空。如后续设计需要引入新的基础设施或模式，将在此处记录并论证。

| Violation                  | Why Needed         | Simpler Alternative Rejected Because |
| -------------------------- | ------------------ | ------------------------------------ |

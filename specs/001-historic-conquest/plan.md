# Implementation Plan: Historic World Conquest Simulator

**Branch**: `001-historic-conquest` | **Date**: 2025-11-30 | **Spec**: [/specs/001-historic-conquest/spec.md](./spec.md)  
**Input**: Feature specification from `/specs/001-historic-conquest/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

Single-player实时策略浏览器游戏：在交互式世界地图上随机生成历史人物，依据属性、地缘与事件系统展开攻防直至统一全局。前端采用 TypeScript + Vite + Phaser 3（WebGL）渲染地图战场，配合 React Overlay 提供属性面板与战报侧栏；核心模拟通过逐帧调度系统（进攻、补给、联盟、事件），以数据驱动方式支撑重开局、回放与结算。性能目标为 3 秒内首屏、60 FPS 交互与 12 分钟内完成一局。

## Technical Context

**Language/Version**: TypeScript 5.4（ESM，strictNullChecks on）  
**Primary Dependencies**: Phaser 3.80（世界地图渲染与摄像机）；React 18 + React DOM（UI 面板）；Zustand 4（全局状态与回放缓存）；d3-geo + topojson-client（投影与地图简化）；idb 7（IndexedDB 封装）；Vite 5（构建）；Vitest + Testing Library + Playwright（测试栈）  
**Storage**: IndexedDB（战局快照、随机种子、战报索引）；localStorage（UI 偏好）  
**Testing**: Vitest（核心算法与渲染适配器单测）、Testing Library（React UI）、Playwright（端到端战局与可用性场景）、Phaser Headless Harness（战斗模拟合同测试）  
**Target Platform**: 桌面 Chrome/Edge/Firefox/Safari 最新两个版本 + iPadOS 16+ 横屏模式（支持触控手势）  
**Project Type**: 单体 Web SPA（Phaser Canvas + React Overlay）  
**Performance Goals**: 首屏资源 <3s@30Mbps；地图交互/战报操作 p95 <120ms；渲染帧率≥60 FPS；模拟 Tick ≤16ms；内存峰值 ≤200MB  
**Constraints**: 纯前端、离线友好（Service Worker 缓存地图与资产）；需在中端 GPU 上稳定；必须允许重放最近战局并在刷新后恢复；不得使用需要额外授权的受限地图资产  
**Scale/Scope**: 1 个前端包、5+ 游戏场景/系统、约 200 个领土多边形、最大 12 位历史领袖并行模拟、战报保留最近 200 条事件

## Constitution Check

1. **代码质量门禁**：启用 ESLint（typescript-eslint + sonarjs）与 Prettier，CI 级联格式/静态分析；核心模块遵循分层（渲染/模拟/数据）并记录在 Architecture ADR；Phaser Scene 与模拟系统复杂度>15 必须拆分且伴随文档/序列图；PR 模板要求列出风险与文档链接。
2. **测试门禁**：采用测试金字塔——Vitest 单测（随机生成器、战斗计算、存档恢复）、Phaser Headless 合同测试（Tick 完整性）、Playwright E2E（User Story 1-3）、Web Vitals 合规测试；覆盖率门槛 90%，CI 中任何测试失败即阻塞合并并附控制台录像。
3. **体验门禁**：规划两类玩家（策略爱好者、休闲观战者）旅程；地图交互提供键鼠/触控/键盘三套入口并做 WCAG 对比度校验；战报侧栏提供「回放」与「可读性」快速测试脚本；失败路径（长时间僵持、网络中断、存档损坏）在 UX 流程中明确并配合提示。
4. **性能门禁**：Tick 预算 16ms、渲染预算 16ms，使用 Dev HUD 记录 FPS、Tick 用时、战斗队列长度；引入第三方数据（GeoJSON、人物包）前先离线压缩与按需加载；提供自动「决战事件」与降级策略（关闭粒子效果、降低刷新率）以应对资源紧张。
5. **可观测性门禁**：在开发与生产构建植入自定义 telemetry 集合（console.info + optional OTLP exporter），收集战局开始/结束、僵持检测、性能指标；以 `app/telemetry/dashboard.md` 维护仪表；发布后 24h/7d 回顾脚本依赖 Playwright + Lighthouse 报告与 Web Vitals 导出。

## Project Structure

### Documentation (this feature)

```text
specs/001-historic-conquest/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
└── tasks.md              # 由 /speckit.tasks 生成
```

### Source Code (repository root)

```text
app/
├── src/
│   ├── core/                # 模拟系统（tick、事件、AI）
│   ├── data/                # 历史人物、地图元数据、随机种子
│   ├── scenes/              # Phaser 场景（boot、world, overlay）
│   ├── ui/                  # React 组件（战报、属性面板、HUD）
│   ├── services/            # 存档、遥测、音频
│   ├── styles/
│   └── main.tsx             # 入口，装载 Phaser + React
├── public/                  # 地图切片、音效、字体
└── vite.config.ts

tests/
├── unit/                    # Vitest 针对 core/data/services
├── contract/                # Headless Phaser 场景合同 & 数据契约
└── e2e/                     # Playwright flows（启动、观战、结算）
```

**Structure Decision**: 单仓前端 SPA，`app/src` 根据职责拆分 core/scenes/ui，避免 Phaser 逻辑与 React 互相干扰；独立 `tests/` 体现宪章要求的测试金字塔。

## Complexity Tracking

当前方案未超出宪章允许的复杂度，无需额外豁免；如后续引入额外渲染引擎或多项目拆分，将补充本节。

# Implementation Plan: 真实世界地图可视化

**Branch**: `002-real-world-map` | **Date**: 2025-11-30 | **Spec**: [spec.md](./spec.md)  
**Input**: Feature specification from `/specs/002-real-world-map/spec.md`

## Summary

修复当前版本的黑屏问题，实现基于真实世界地图的可视化系统。使用 GeoJSON 格式加载包含193个国家边界的真实世界地图数据，通过 Phaser Graphics API 渲染国家轮廓和填充颜色，集成 Zustand 状态管理实现领土占领状态的实时同步。关键技术挑战包括：优化大量多边形的渲染性能达到60 FPS，实现流畅的颜色过渡动画，以及提供响应式的交互反馈（点击、悬停、缩放）。

## Technical Context

**Language/Version**: TypeScript 5.4（ESM，strictNullChecks on）  
**Primary Dependencies**:

- Phaser 3.80（地图渲染、Graphics API、交互事件）
- React 18 + React DOM（UI 面板和详情展示）
- Zustand 4（全局状态管理）
- d3-geo 3.1（地理投影和坐标转换）
- topojson-client 3.1（TopoJSON 解析和优化）

**Storage**:

- 静态资源（public/maps/）：GeoJSON/TopoJSON 地图数据文件
- Zustand store：当前领土占领状态、颜色映射
- IndexedDB：地图数据缓存（可选，用于加速二次加载）

**Testing**:

- Vitest：地图数据加载、坐标转换、颜色映射算法单测
- Testing Library：React 详情面板组件测试
- Playwright：端到端可视化验证（截图对比）
- 性能测试：FPS 监控、渲染时间基准测试

**Target Platform**: 桌面 Chrome/Edge/Firefox/Safari 最新两个版本 + iPadOS 16+ 横屏模式

**Project Type**: Web SPA（Phaser Canvas + React Overlay）- 现有项目扩展

**Performance Goals**:

- 地图初始加载 ≤ 2秒（包括数据下载和首次渲染）
- 地图渲染帧率 ≥ 60 FPS（标准设备）/ ≥ 30 FPS（低配设备）
- 单次领土更新 ≤ 50ms
- 交互响应延迟 ≤ 100ms
- 内存增量 ≤ 50MB

**Constraints**:

- 必须兼容现有的 Phaser WorldScene
- 不能破坏现有的游戏逻辑和状态管理
- 需要支持 193 个国家的完整边界数据
- 必须提供降级方案（数据加载失败时回退到简化地图）
- 颜色方案必须支持色盲用户（提供纹理或标签备选）

**Scale/Scope**:

- 1 个新的地图渲染模块
- 193+ 个国家多边形（每个约 50-500 个顶点）
- 10 种指挥官颜色映射
- 3 个新的交互处理器（点击、悬停、缩放）
- 约 1500 行新增代码

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

1. ✅ **代码质量门禁**：
   - **格式化与静态分析**：继续使用现有的 ESLint + Prettier 配置，所有新代码必须通过 CI 检查
   - **复杂度控制**：地图渲染模块按职责拆分为：数据加载器（MapDataLoader）、渲染器（MapRenderer）、交互处理器（MapInteractionHandler）
   - **文档要求**：为每个新模块提供 JSDoc 注释，说明输入/输出格式和性能特性
   - **代码评审**：PR 需包含性能基准测试结果和渲染截图对比

2. ✅ **测试门禁**：
   - **测试金字塔**：
     - 单元测试：GeoJSON 解析、坐标转换、颜色映射算法（目标覆盖率 90%）
     - 集成测试：地图加载 → 渲染 → 状态同步完整流程
     - E2E 测试：覆盖 US1-US4 的所有验收场景（用户能看到地图、识别领土、观察变化、进行交互）
     - 视觉回归测试：使用 Playwright 截图对比确保地图渲染一致性
   - **测试先行**：先编写失败的 E2E 测试（断言地图可见），再实现功能
   - **CI 阻塞**：任何测试失败或覆盖率下降都会阻止合并

3. ✅ **体验门禁**：
   - **目标用户**：策略游戏爱好者（需要清晰的地图）和休闲观战者（需要易于理解的可视化）
   - **成功路径**：用户启动游戏 → 3秒内看到完整地图 → 通过颜色识别领土 → 点击查看详情
   - **失败恢复**：
     - 地图数据加载失败 → 显示错误提示并回退到简化区域地图
     - 渲染性能不足 → 自动禁用动画效果并降低细节级别
     - 交互无响应 → 显示加载指示器并记录性能日志
   - **可达性**：为色盲用户提供边界纹理或标签模式，确保键盘导航可用
   - **可用性验证**：通过用户测试确认 80% 用户能在首次游戏时识别地图和领土

4. ✅ **性能门禁**：
   - **性能预算**：
     - 地图渲染每帧 ≤ 16ms（60 FPS）
     - 领土颜色更新 ≤ 50ms
     - GeoJSON 数据解析 ≤ 500ms
     - 总内存增量 ≤ 50MB
   - **基准方案**：使用 Vitest + performance.now() 测量关键路径，在 Dev HUD 中实时显示 FPS 和渲染时间
   - **降级策略**：
     - 如果 FPS < 30：禁用颜色过渡动画，使用直接切换
     - 如果内存不足：加载简化版本的地图数据（减少顶点数）
     - 如果设备 GPU 弱：使用 Canvas 2D 代替 WebGL
   - **监测回归**：CI 中运行性能基准测试，任何指标劣化 > 10% 触发警告

5. ✅ **可观测性门禁**：
   - **遥测信号**：
     - 日志：地图加载开始/完成/失败、领土更新事件、交互操作
     - 指标：FPS、渲染时间、内存占用、交互延迟
     - 追踪：从地图加载到首次渲染的完整链路
   - **仪表盘**：在 Dev HUD 中显示实时性能数据，生产环境记录到 console 或可选的 OTLP exporter
   - **24h 复盘**：发布后检查地图加载成功率、平均 FPS、用户交互热点

## Project Structure

### Documentation (this feature)

```text
specs/002-real-world-map/
├── plan.md              # 本文件
├── research.md          # Phase 0 输出（地图数据源、渲染策略、性能优化）
├── data-model.md        # Phase 1 输出（Country、ColorMapping、MapState 实体）
├── quickstart.md        # Phase 1 输出（开发者集成指南）
├── contracts/           # Phase 1 输出（地图数据接口、状态更新契约）
└── tasks.md             # Phase 2 输出（由 /speckit.tasks 生成）
```

### Source Code (repository root)

```text
app/
├── src/
│   ├── core/
│   │   ├── types.ts                    # 添加 Country、MapState 类型定义
│   │   └── state/
│   │       └── store.ts                # 扩展 Zustand store，添加地图状态
│   ├── data/
│   │   ├── mapData.ts                  # 重构：从硬编码区域改为 GeoJSON 加载
│   │   └── commandersData.ts           # 现有文件，可能需要调整颜色映射
│   ├── scenes/
│   │   └── world/
│   │       ├── WorldScene.ts           # 重构：集成新的地图渲染器
│   │       ├── MapRenderer.ts          # 新增：核心地图渲染逻辑
│   │       ├── MapDataLoader.ts        # 新增：GeoJSON 加载和解析
│   │       └── MapInteractionHandler.ts # 新增：点击、悬停、缩放处理
│   ├── ui/
│   │   └── panels/
│   │       └── CountryDetailPanel.tsx  # 新增：国家详情面板组件
│   └── services/
│       └── telemetry/                  # 现有：添加地图性能遥测
├── public/
│   └── maps/
│       ├── world-countries.geojson     # 新增：完整的世界地图数据
│       └── world-countries-simplified.json # 新增：简化版本（降级用）
└── vite.config.ts                      # 可能需要调整静态资源配置

tests/
├── unit/
│   ├── map-data-loader.spec.ts        # 新增：测试 GeoJSON 解析
│   ├── map-renderer.spec.ts           # 新增：测试坐标转换和渲染逻辑
│   └── color-mapping.spec.ts          # 新增：测试颜色映射算法
├── contract/
│   └── map-state-sync.spec.ts         # 新增：测试地图与游戏状态同步
└── e2e/
    ├── us1-view-world-map.spec.ts     # 新增：US1 验收测试
    ├── us2-territory-visualization.spec.ts # 新增：US2 验收测试
    ├── us3-territory-changes.spec.ts  # 新增：US3 验收测试
    └── us4-map-interaction.spec.ts    # 新增：US4 验收测试
```

**Structure Decision**:

- 在现有 `app/src/scenes/world/` 目录下新增三个专门的地图处理模块，保持与现有 Phaser 场景的集成
- 重用现有的 Zustand store 和 UI 面板结构，最小化对现有代码的影响
- 将地图数据文件放在 `public/maps/` 下，便于静态资源管理和 CDN 缓存
- 测试文件结构与源代码对应，便于维护和追溯

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

当前方案未超出宪章允许的复杂度，无需额外豁免。主要复杂性来自：

1. **地图数据规模**：193 个国家多边形（约 50,000 个顶点）- 通过 TopoJSON 压缩和按需加载解决
2. **渲染性能**：大量多边形实时渲染 - 通过空间索引、视口裁剪、LOD（细节层次）优化解决
3. **状态同步**：地图渲染与游戏状态实时同步 - 通过 Zustand 订阅机制和批量更新解决

这些复杂性都在可控范围内，且有明确的技术解决方案（将在 research.md 中详细说明）。

---

## Phase 0: Research & Technical Decisions

**Status**: 待执行 - 需要解决的技术未知项

### Research Tasks

1. **地图数据源选择**
   - **问题**：选择哪个 GeoJSON 数据源？精度如何权衡？
   - **研究方向**：
     - Natural Earth Data（低/中/高精度版本）
     - World Atlas TopoJSON
     - OpenStreetMap 导出
   - **决策标准**：文件大小 < 5MB、包含193国家、许可证友好、更新频率

2. **渲染策略**
   - **问题**：使用 Phaser Graphics API 还是自定义 WebGL？
   - **研究方向**：
     - Phaser Graphics.fillPath() 性能测试（193 个多边形）
     - 自定义 Shader（批量渲染优化）
     - Canvas 2D 降级方案
   - **决策标准**：60 FPS 达成率、开发复杂度、兼容性

3. **性能优化技术**
   - **问题**：如何在保证视觉质量的前提下达到 60 FPS？
   - **研究方向**：
     - 空间索引（Quadtree）减少渲染对象
     - 视口裁剪（只渲染可见国家）
     - LOD 系统（缩放级别切换简化/详细地图）
     - 对象池（复用 Graphics 对象）
   - **决策标准**：FPS 提升效果、内存开销、实现复杂度

4. **颜色过渡动画**
   - **问题**：如何实现流畅的领土颜色过渡？
   - **研究方向**：
     - Phaser Tween 系统
     - 自定义插值算法（支持多个多边形同时过渡）
     - CSS 过渡（如果使用 DOM 覆盖层）
   - **决策标准**：动画流畅度、性能影响、取消/中断支持

5. **交互优化**
   - **问题**：如何实现低延迟的点击和悬停检测？
   - **研究方向**：
     - Phaser 内置的 input polygon（可能性能不佳）
     - 自定义点包含算法（Point-in-Polygon）
     - 预计算碰撞盒（Bounding Box）加速
   - **决策标准**：响应延迟 < 100ms、误触率、内存占用

### Expected Outputs

完成 Phase 0 后，`research.md` 应包含：

- 每个研究任务的决策结论（选择哪个方案）
- 决策理由（为什么选择该方案）
- 被拒绝的替代方案及原因
- 技术风险和缓解措施
- 性能基准测试初步结果

---

## Phase 1: Design & Contracts

**Status**: 待执行 - 依赖 Phase 0 完成

### Design Tasks

1. **数据模型设计** (`data-model.md`)
   - 从 spec.md 的 Key Entities 提取：Country、ColorMapping、MapState
   - 定义每个实体的字段、类型、验证规则
   - 设计状态转换（领土占领状态变化）

2. **API 契约生成** (`contracts/`)
   - 地图数据接口：GeoJSON 加载、解析、校验
   - 状态更新契约：领土占领变化如何触发地图重绘
   - 交互事件契约：点击、悬停事件的输入/输出格式

3. **快速入门指南** (`quickstart.md`)
   - 开发者如何集成新的地图渲染器
   - 如何添加新的国家数据
   - 如何自定义颜色方案
   - 性能调优建议

4. **Agent 上下文更新**
   - 运行 `.specify/scripts/bash/update-agent-context.sh codebuddy`
   - 添加本次计划中的新技术决策（地图数据格式、渲染策略、性能优化技术）

### Expected Outputs

- `data-model.md`：完整的实体定义和关系图
- `contracts/map-data.json`：GeoJSON 数据接口的 JSON Schema
- `contracts/map-state.ts`：TypeScript 类型定义和状态转换规则
- `quickstart.md`：开发者集成文档
- `.codebuddy/context.md`：更新的 agent 上下文

---

## Phase 2: Task Breakdown

**Status**: 待执行 - 将由 `/speckit.tasks` 命令生成

Phase 2 将生成详细的任务列表（`tasks.md`），包括：

- 开发任务（实现地图加载、渲染、交互）
- 测试任务（单元测试、集成测试、E2E 测试）
- 质量任务（性能优化、代码审查、文档）
- 用户体验任务（可用性测试、可访问性验证）

每个任务将映射到对应的用户故事（US1-US4）和功能需求（FR-001 ~ FR-013）。

---

## Next Steps

1. ✅ 完成 Constitution Check（已通过）
2. ⏳ 执行 Phase 0 研究（生成 `research.md`）
3. ⏳ 执行 Phase 1 设计（生成 `data-model.md`、`contracts/`、`quickstart.md`）
4. ⏳ 运行 `/speckit.tasks` 生成详细任务清单

**当前状态**: Plan 完成，准备进入 Phase 0 研究

# Implementation Plan: 性能优化

**Branch**: `006-performance-optimization` | **Date**: 2025-12-01 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/006-performance-optimization/spec.md`

## Summary

解决游戏长时间运行后FPS降至1.0的严重性能问题。主要优化方向包括：清理冗余console.log、优化Zustand订阅机制、减少Map对象频繁创建、限制事件日志增长、实现渲染节流机制。目标是30分钟后FPS保持30以上，Tick处理时间小于200ms。

## Technical Context

**Language/Version**: TypeScript 5.4.5  
**Primary Dependencies**: React 18.2, Phaser 3.80, Zustand 4.4.7, Vite 5.0  
**Storage**: N/A (内存状态管理)  
**Testing**: Vitest 1.0.4, Playwright 1.40.1  
**Target Platform**: 现代桌面浏览器 (Chrome, Firefox, Safari)  
**Project Type**: Web application (Phaser游戏 + React UI)  
**Performance Goals**: FPS ≥ 30, Tick处理 < 200ms, 内存增长 < 50%/30min  
**Constraints**: 不改变游戏核心逻辑，保持现有功能完整  
**Scale/Scope**: 25个活跃指挥官, 200个国家, 200条事件日志上限

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

1. **代码质量门禁**: ✅ PASS
   - 使用ESLint + Prettier进行代码格式化和静态分析
   - 性能优化代码将添加注释说明优化原理
   - 复杂度通过模块化拆分控制

2. **测试门禁**: ✅ PASS
   - 添加性能基准测试验证优化效果
   - 现有单元测试覆盖率目标15%（已配置）
   - CI中运行vitest确保回归检测

3. **体验门禁**: ✅ PASS
   - 目标用户：游戏玩家
   - 成功路径：流畅游玩30分钟以上
   - 失败恢复：低FPS时自动降级，禁用动画效果
   - DevHud提供实时性能反馈

4. **性能门禁**: ✅ PASS
   - 端到端性能目标：FPS ≥ 30, Tick < 200ms
   - 基准方案：使用PerformanceMonitor类监控
   - 降级策略：FPS < 30时禁用动画，启用性能模式

5. **可观测性门禁**: ✅ PASS
   - DevHud显示FPS、Tick耗时、活跃指挥官数、事件数
   - 增强显示内存使用指标
   - 性能警告提示机制

## Project Structure

### Documentation (this feature)

```text
specs/006-performance-optimization/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output (N/A for this feature)
└── tasks.md             # Phase 2 output
```

### Source Code (repository root)

```text
app/src/
├── core/
│   ├── state/store.ts           # Zustand store优化
│   ├── simulation/tickScheduler.ts  # Tick调度优化
│   └── types.ts
├── scenes/world/
│   ├── WorldScene.ts            # 渲染优化
│   ├── rendering/MapRenderer.ts # 地图渲染优化
│   └── utils/PerformanceMonitor.ts  # 性能监控增强
├── ui/hud/DevHud.tsx            # DevHud增强
└── config/debug.config.ts       # 日志配置

tests/
├── unit/                        # 单元测试
├── integration/                 # 集成测试
└── performance/                 # 性能基准测试（新增）
```

**Structure Decision**: 使用现有Web application结构，优化集中在core/和scenes/world/目录

## Complexity Tracking

> 无需额外复杂度，所有优化在现有架构内完成

| Violation | Why Needed | Simpler Alternative Rejected Because |
| --------- | ---------- | ------------------------------------ |
| N/A       | N/A        | N/A                                  |

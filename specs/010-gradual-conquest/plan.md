# Implementation Plan: 渐进式领土蚕食机制

**Branch**: `010-gradual-conquest` | **Date**: 2025-12-01 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/010-gradual-conquest/spec.md`

## Summary

实现渐进式领土蚕食机制，将当前"一次性完全占领"模式改为"逐步蚕食"模式。战斗胜利后增加占领进度（而非直接更换所有者），进度达到100%时正式转移领土。支持多攻击方独立追踪进度、进度自动衰减、以及基于领土面积的进度计算规则。

## Technical Context

**Language/Version**: TypeScript 5.4.5  
**Primary Dependencies**: React 18.2, Zustand 4.4.7, Phaser 3.80.1, D3-geo 3.1.0  
**Storage**: 内存状态（Zustand store）+ IndexedDB（idb 7.1.1）用于持久化  
**Testing**: Vitest 1.0.4 + Playwright 1.40.1  
**Target Platform**: Web Browser (Chrome, Firefox, Safari)  
**Project Type**: Web application (React + Phaser game)  
**Performance Goals**: 60fps 渲染，tick 处理时间 <10ms  
**Constraints**: 占领进度计算不应增加超过 2ms 的 tick 处理时间  
**Scale/Scope**: ~200 个国家/领土，30-50 个指挥官

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

1. **代码质量门禁** ✅
   - 格式化：使用 Prettier 统一格式
   - 静态分析：ESLint + TypeScript 严格模式
   - 代码评审：PR 合并前需 review
   - 复杂度：新增模块遵循单一职责原则，`ConquestProgressSystem` 独立于 `BattleSystem`

2. **测试门禁** ✅
   - 测试金字塔：单元测试（进度计算逻辑）> 集成测试（系统交互）> E2E（用户流程）
   - 覆盖率目标：80%（针对新增代码）
   - CI 阻塞：`pnpm test` 必须通过才能合并
   - 测试先行：先编写进度计算的测试用例

3. **体验门禁** ✅
   - 目标用户：游戏玩家，期望看到渐进式征服过程
   - 成功路径：观察领土被逐步蚕食，体验拉锯战紧张感
   - 失败恢复：进度衰减机制防止"占坑不打"
   - 可达性：渐变色需有足够对比度，悬停显示具体进度数值

4. **性能门禁** ✅
   - 性能预算：进度计算 <2ms/tick，渲染 60fps
   - 基准方案：使用 Map 数据结构 O(1) 查找，批量更新减少 store 调用
   - 降级策略：低端设备可禁用渐变色动画

5. **可观测性门禁** ✅
   - 日志：使用现有 `logger` 记录进度变化事件
   - 指标：在 `PerformanceMetrics` 中追踪进度计算耗时
   - 仪表盘：开发者控制台显示当前争夺中的领土数量

## Project Structure

### Documentation (this feature)

```text
specs/010-gradual-conquest/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output (internal interfaces)
└── tasks.md             # Phase 2 output (/speckit.tasks command)
```

### Source Code (repository root)

```text
app/src/
├── core/
│   ├── types.ts                          # 扩展 Territory 类型
│   ├── simulation/
│   │   └── systems/
│   │       ├── battleSystem.ts           # 修改：使用进度系统
│   │       └── conquestProgressSystem.ts # 新增：进度管理系统
│   └── state/
│       └── store.ts                      # 扩展：进度状态管理
├── config/
│   └── conquestProgress.config.ts        # 新增：进度配置
├── scenes/world/
│   └── rendering/
│       └── MapRenderer.ts                # 修改：渐变色渲染
└── ui/panels/
    └── CountryDetailPanel.tsx            # 修改：显示进度信息

tests/
├── unit/
│   └── conquestProgress.test.ts          # 新增：进度计算测试
└── integration/
    └── gradualConquest.test.ts           # 新增：系统集成测试
```

**Structure Decision**: 遵循现有项目结构，新增 `conquestProgressSystem.ts` 作为独立系统，与 `battleSystem.ts` 协作但职责分离。

## Complexity Tracking

> 无违规项，设计遵循现有架构模式。

| Violation | Why Needed | Simpler Alternative Rejected Because |
| --------- | ---------- | ------------------------------------ |
| N/A       | N/A        | N/A                                  |

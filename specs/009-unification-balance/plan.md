# Implementation Plan: 大一统平衡优化

**Branch**: `009-unification-balance` | **Date**: 2025-12-01 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/009-unification-balance/spec.md`

## Summary

本功能旨在解决游戏中难以出现大一统的问题。通过增强领土加成、添加力量恢复机制、优化胜利条件、实现决战模式、优化联盟系统和降低小势力保护，形成"强者恒强"的正反馈循环，确保 90% 的游戏能在 30 分钟内产生胜利者。

## Technical Context

**Language/Version**: TypeScript 5.x  
**Primary Dependencies**: Zustand (状态管理), Phaser 3 (游戏引擎), React 18 (UI)  
**Storage**: 内存状态（Zustand store），无持久化需求  
**Testing**: Vitest (单元测试), Playwright (E2E 测试)  
**Target Platform**: Web 浏览器 (Chrome, Firefox, Safari)  
**Project Type**: Web 应用（前端游戏）  
**Performance Goals**: 60 FPS，每 tick 处理时间 < 50ms  
**Constraints**: 新增系统不应增加超过 5% 的 tick 处理时间  
**Scale/Scope**: 30-50 个指挥官，~200 个国家/领土

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

### 1. 代码质量门禁 ✅

- **格式化**: ESLint + Prettier，已在项目中配置
- **静态分析**: TypeScript 严格模式
- **代码评审**: PR 必须通过审查
- **复杂度控制**: 新系统拆分为独立模块（PowerRecoverySystem, EndgameManager）

### 2. 测试门禁 ✅

- **测试金字塔**:
  - 单元测试: 各系统的核心逻辑（领土加成计算、力量恢复、胜利条件判断）
  - 集成测试: 系统间交互（决战模式触发后的联盟行为）
  - E2E 测试: 完整游戏流程（30 分钟内产生胜利者）
- **覆盖率目标**: 80%
- **测试先行**: 先编写失败测试，再实现功能
- **CI 阻塞**: 测试失败阻止合并

### 3. 体验门禁 ✅

- **目标用户**: 观看自动战斗模拟的玩家
- **成功路径**: 启动游戏 → 观察战斗 → 看到某势力统一世界
- **失败恢复**: 如果游戏卡住，可重新开始
- **可达性**: 添加 UI 提示显示当前游戏阶段（早期/中期/决战）
- **可用性指标**: 游戏在 30 分钟内结束的比例 ≥ 90%

### 4. 性能门禁 ✅

- **性能预算**: 每 tick 处理时间 < 50ms，新增系统增量 < 2.5ms
- **基准方案**: 使用 `PerformanceMonitor` 监控 tick 时间
- **降级策略**: 如果 tick 时间过长，减少每 tick 战斗数量
- **回归监测**: CI 中运行性能基准测试

### 5. 可观测性门禁 ✅

- **日志**: 使用现有 `logger` 系统记录关键事件（决战模式触发、胜利宣布）
- **指标**: 通过 `factionStats` 追踪势力统计
- **追踪**: 战斗事件记录在 `eventLog` 中
- **仪表盘**: 游戏内 UI 显示势力排行榜和游戏阶段
- **24h 复盘**: 通过游戏日志分析平衡性

## Project Structure

### Documentation (this feature)

```text
specs/009-unification-balance/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output (N/A - no API)
├── checklists/          # Quality checklists
│   └── requirements.md
└── tasks.md             # Phase 2 output
```

### Source Code (repository root)

```text
app/src/
├── config/
│   ├── conquest.config.ts        # 修改：决战模式配置
│   ├── territoryBonus.config.ts  # 修改：领土加成配置
│   └── endgame.config.ts         # 新增：决战模式配置
├── core/
│   ├── simulation/
│   │   ├── systems/
│   │   │   ├── battleSystem.ts       # 修改：力量恢复、决战模式
│   │   │   ├── victorySystem.ts      # 修改：领土胜利条件
│   │   │   ├── allianceSystem.ts     # 修改：联盟限制
│   │   │   └── powerRecoverySystem.ts # 新增：力量恢复系统
│   │   └── tickScheduler.ts          # 修改：注册新系统
│   ├── state/
│   │   └── store.ts                  # 修改：决战模式状态
│   └── types.ts                      # 修改：新类型定义

tests/
├── unit/
│   ├── powerRecoverySystem.test.ts   # 新增
│   ├── victorySystem.test.ts         # 新增/修改
│   └── endgameMode.test.ts           # 新增
└── e2e/
    └── unification.spec.ts           # 新增：大一统测试
```

**Structure Decision**: 遵循现有项目结构，在 `app/src/core/simulation/systems/` 下添加新系统，配置文件放在 `app/src/config/`。

## Complexity Tracking

> 无宪章违规需要记录。所有新增内容遵循现有架构模式。

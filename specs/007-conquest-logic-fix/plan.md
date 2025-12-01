# Implementation Plan: 领主占领逻辑修复

**Branch**: `007-conquest-logic-fix` | **Date**: 2025-12-01 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/007-conquest-logic-fix/spec.md`

## Summary

修复领主占领逻辑的两个核心问题：
1. **初始化保证**：确保每个活跃领主在游戏开始时必须拥有至少一个国家，未分配到国家的领主不参与游戏
2. **相邻性倾向**：领主攻击目标选择 85% 概率选择相邻国家，15% 概率允许远程攻击

技术方案：修改 `createInitialWorld.ts` 添加初始化验证和过滤逻辑，修改 `BattleSystem.ts` 实现概率化目标选择。

## Technical Context

**Language/Version**: TypeScript 5.4.5  
**Primary Dependencies**: React 18.2, Phaser 3.80, Zustand 4.4, d3-geo 3.1  
**Storage**: N/A (内存状态管理)  
**Testing**: Vitest 1.0 (单元/集成), Playwright 1.40 (E2E)  
**Target Platform**: Web Browser (Vite 构建)
**Project Type**: Web 应用 (Phaser 游戏 + React UI)  
**Performance Goals**: 60 FPS 游戏渲染，O(1) 相邻性查找  
**Constraints**: 不影响现有战斗系统性能，保持代码风格一致  
**Scale/Scope**: 50 个领主，200+ 国家/领土

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

1. **代码质量门禁** ✅
   - 格式化：使用 Prettier 统一格式
   - 静态分析：ESLint + TypeScript 严格模式
   - 评审策略：修改 `createInitialWorld.ts` 和 `BattleSystem.ts` 需添加注释说明逻辑变更
   - 复杂度控制：新增逻辑封装为独立函数，避免增加现有函数复杂度

2. **测试门禁** ✅
   - 测试金字塔：单元测试 > 集成测试
   - 覆盖率目标：新增代码 90%+ 覆盖
   - 测试先行：先编写失败测试，再实现功能
   - CI 阻塞：`pnpm test` 必须通过才能合并

3. **体验门禁** ✅
   - 目标用户：游戏玩家
   - 成功路径：领土扩张呈渐进式，玩家可预测势力变化趋势
   - 失败恢复：无需特殊处理（游戏逻辑修复）
   - 可用性验证：观察 100 tick 后领土分布是否符合地理逻辑

4. **性能门禁** ✅
   - 性能预算：相邻性检查 O(1)，不增加每 tick 处理时间
   - 基准方案：对比修改前后的 tick 处理时间
   - 降级策略：N/A（纯逻辑修复）

5. **可观测性门禁** ✅
   - 日志：在 debug 模式下记录目标选择决策（相邻/远程）
   - 指标：可通过 DevHud 观察领土占领统计
   - 追踪：现有 BattleEvent 已包含攻击者、目标信息

## Project Structure

### Documentation (this feature)

```text
specs/007-conquest-logic-fix/
├── spec.md              # 功能规格说明
├── plan.md              # 本文件
├── research.md          # Phase 0 研究输出
├── data-model.md        # Phase 1 数据模型
├── quickstart.md        # Phase 1 快速开始指南
├── contracts/           # Phase 1 接口契约
│   └── battle-system.ts # 战斗系统接口定义
├── checklists/          # 质量检查清单
│   └── requirements.md  # 需求检查清单
└── tasks.md             # Phase 2 任务分解 (由 /speckit.tasks 生成)
```

### Source Code (repository root)

```text
app/src/
├── core/
│   ├── generation/
│   │   └── createInitialWorld.ts  # 修改：添加领主初始化验证
│   ├── simulation/
│   │   └── systems/
│   │       └── battleSystem.ts    # 修改：添加概率化目标选择
│   ├── state/
│   │   └── store.ts               # 可能修改：确保领主数量不增加
│   └── types.ts                   # 无需修改
├── data/
│   └── commandersData.ts          # 无需修改
└── config/
    └── regionMapping.config.ts    # 无需修改

tests/
├── unit/
│   ├── createInitialWorld.spec.ts # 新增：初始化验证测试
│   └── battleSystem.spec.ts       # 新增/修改：目标选择测试
└── integration/
    └── conquest-logic.spec.ts     # 新增：占领逻辑集成测试
```

**Structure Decision**: 使用现有单项目结构，修改集中在 `app/src/core/` 目录下的两个核心文件。

## Complexity Tracking

> 无违规项，本次修改为逻辑修复，不引入新的架构复杂度。

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|--------------------------------------|
| N/A       | N/A        | N/A                                  |

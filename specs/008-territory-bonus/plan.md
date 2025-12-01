# Implementation Plan: 国土领土加成系统

**Branch**: `008-territory-bonus` | **Date**: 2025-12-01 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/008-territory-bonus/spec.md`

## Summary

实现基于国土面积和城市数量的属性加成系统，让控制更多领土的势力获得攻击力和防御力加成（递减增长，上限30%），同时为小势力（1-2城市）提供防御加成以保持游戏平衡。连续领土区域获得额外加成奖励。

## Technical Context

**Language/Version**: TypeScript 5.4.5  
**Primary Dependencies**: React 18.2, Zustand 4.4.7, Phaser 3.80.1, D3-geo 3.1.0  
**Storage**: IndexedDB (idb 7.1.1) - 用于游戏状态持久化  
**Testing**: Vitest 1.0.4, Playwright 1.40.1  
**Target Platform**: Web (现代浏览器)  
**Project Type**: Web 应用（前端游戏）  
**Performance Goals**: 60fps 游戏渲染，加成计算 <5ms  
**Constraints**: 加成计算不应阻塞主线程，需在领土变化时即时更新  
**Scale/Scope**: 50个指挥官，约200个国家/领土

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

1. **代码质量门禁**: ✅
   - 格式化：使用 Prettier（已配置）
   - 静态分析：ESLint + TypeScript 严格模式
   - 代码评审：新增加成计算模块需独立封装，便于单元测试
   - 复杂度控制：加成计算函数保持单一职责，递减曲线公式独立抽取

2. **测试门禁**: ✅
   - 测试金字塔：单元测试（加成公式）> 集成测试（与战斗系统联动）> E2E（UI展示）
   - 覆盖率目标：加成计算模块 >90%
   - 测试先行：先编写加成公式的测试用例，再实现功能
   - CI 阻塞：`pnpm test` 必须通过

3. **体验门禁**: ✅
   - 目标用户：游戏玩家，需要理解势力强弱差异
   - 成功路径：查看势力面板 → 看到基础属性和加成明细 → 理解加成来源
   - 失败恢复：加成计算异常时使用基础属性，不影响游戏进行
   - 可达性：加成数值在 FactionStatsPanel 中清晰展示

4. **性能门禁**: ✅
   - 性能预算：加成计算 <5ms，不影响 60fps
   - 基准方案：使用 `console.time` 监控计算耗时
   - 降级策略：若计算超时，使用缓存值
   - 触发时机：仅在领土变化时重新计算，非每帧计算

5. **可观测性门禁**: ✅
   - 日志：加成变化时输出日志（使用现有 logger）
   - 指标：加成计算耗时纳入 performanceMetrics
   - 追踪：领土变化 → 加成更新 → UI 刷新的完整链路
   - 仪表盘：FactionStatsPanel 实时展示加成数据

## Project Structure

### Documentation (this feature)

```text
specs/008-territory-bonus/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output (N/A - 纯前端功能)
└── tasks.md             # Phase 2 output
```

### Source Code (repository root)

```text
app/
├── src/
│   ├── core/
│   │   ├── types.ts                    # 扩展：TerritoryBonus 类型
│   │   ├── services/
│   │   │   ├── factionStatsService.ts  # 修改：集成加成计算
│   │   │   └── territoryBonusService.ts # 新增：加成计算核心逻辑
│   │   └── state/
│   │       └── store.ts                # 扩展：加成状态管理
│   └── ui/
│       └── panels/
│           └── FactionStatsPanel.tsx   # 修改：展示加成明细
└── tests/
    └── unit/
        └── territoryBonusService.test.ts # 新增：加成计算测试
```

**Structure Decision**: 遵循现有项目结构，在 `core/services/` 下新增 `territoryBonusService.ts` 处理加成计算逻辑，与现有 `factionStatsService.ts` 协作。

## Complexity Tracking

> 无违反宪章的情况，无需记录复杂度豁免。

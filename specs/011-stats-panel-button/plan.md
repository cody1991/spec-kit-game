# Implementation Plan: 势力统计排行榜按钮

**Branch**: `011-stats-panel-button` | **Date**: 2025-12-04 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/011-stats-panel-button/spec.md`

## Summary

在游戏界面顶部控制栏添加一个势力统计按钮，点击可切换势力统计排行榜面板的显示/隐藏状态，与现有的 S 键快捷键功能一致。按钮将放置在 `BattleTimeline` 组件的头部区域，与暂停按钮同排。

## Technical Context

**Language/Version**: TypeScript 5.4.5  
**Primary Dependencies**: React 18.2, Zustand 4.4.7, Phaser 3.80.1  
**Storage**: N/A（无新数据存储需求）  
**Testing**: Vitest 1.0.4, @testing-library/react 14.1.2, Playwright 1.40.1  
**Target Platform**: Web 浏览器（桌面优先）  
**Project Type**: Web 应用（React + Phaser 游戏）  
**Performance Goals**: 按钮点击响应 < 100ms  
**Constraints**: 按钮不遮挡地图主要内容，与现有 UI 风格一致  
**Scale/Scope**: 单一 UI 组件添加，影响范围小

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

1. **代码质量门禁**: ✅
   - 使用项目现有的 ESLint + Prettier 配置
   - 按钮组件遵循现有 React 组件模式
   - 代码复杂度低（单一职责：触发状态切换）

2. **测试门禁**: ✅
   - 单元测试：按钮渲染、点击事件触发
   - 集成测试：按钮与 store 状态联动
   - 覆盖率目标：新增代码 100% 覆盖

3. **体验门禁**: ✅
   - 目标用户：游戏玩家
   - 成功路径：点击按钮 → 面板显示/隐藏
   - 失败恢复：无（操作可逆，再次点击即可）
   - 可达性：按钮可通过键盘聚焦和触发

4. **性能门禁**: ✅
   - 性能预算：点击响应 < 100ms
   - 无新增网络请求或复杂计算
   - 降级策略：N/A（S 键快捷键作为备选）

5. **可观测性门禁**: ✅
   - 日志：按钮点击事件可通过 DevHud 观察
   - 指标：面板显示状态已在 store 中追踪
   - 追踪：N/A（纯前端交互）

## Project Structure

### Documentation (this feature)

```text
specs/011-stats-panel-button/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output (N/A - 无新数据模型)
├── quickstart.md        # Phase 1 output
└── tasks.md             # Phase 2 output
```

### Source Code (repository root)

```text
app/
├── src/
│   ├── ui/
│   │   ├── panels/
│   │   │   └── BattleTimeline.tsx    # 修改：添加统计按钮
│   │   │   └── BattleTimeline.css    # 修改：添加按钮样式
│   │   └── ...
│   ├── core/
│   │   └── state/
│   │       └── store.ts              # 已有：toggleFactionStatsPanel action
│   └── ...
└── tests/
    └── unit/
        └── ui/
            └── BattleTimeline.test.tsx  # 新增：按钮测试
```

**Structure Decision**: 在现有 `BattleTimeline` 组件中添加按钮，复用现有的控制栏布局，无需创建新组件。

## Complexity Tracking

> 无违规项，功能简单直接。

| Violation | Why Needed | Simpler Alternative Rejected Because |
| --------- | ---------- | ------------------------------------ |
| N/A       | N/A        | N/A                                  |

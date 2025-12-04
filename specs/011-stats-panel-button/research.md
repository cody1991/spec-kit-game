# Research: 势力统计排行榜按钮

**Feature**: 011-stats-panel-button  
**Date**: 2025-12-04

## 研究任务

本功能相对简单，主要研究点为：

1. 现有 UI 组件模式
2. 按钮放置位置的最佳实践
3. 状态管理复用

## 研究结果

### 1. 现有 UI 组件模式

**Decision**: 复用 `BattleTimeline` 组件的控制栏布局

**Rationale**:
- `BattleTimeline` 已有暂停按钮，位于组件头部的 `.timeline-header` 区域
- 按钮样式 `.pause-btn` 已定义，可复用或扩展
- 与规格要求的"顶部控制栏，与暂停/速度按钮同排"一致

**Alternatives considered**:
- 创建独立的 `GameControlBar` 组件：增加复杂度，对于单个按钮过度设计
- 在 `App.tsx` 中添加浮动按钮：破坏现有布局，不符合规格要求

### 2. 按钮放置位置

**Decision**: 在 `BattleTimeline` 的 `.timeline-header` 中，暂停按钮旁边添加统计按钮

**Rationale**:
- 符合规格要求的"顶部控制栏"位置
- 与暂停按钮视觉一致，用户易于发现
- 不需要修改整体布局

**Alternatives considered**:
- 放在 `CommanderPanel` 中：不符合"控制栏"的语义
- 放在 `DevHud` 中：DevHud 是开发调试用，不适合放置用户功能按钮

### 3. 状态管理复用

**Decision**: 直接调用现有的 `toggleFactionStatsPanel` action

**Rationale**:
- Store 中已有 `showFactionStatsPanel` 状态和 `toggleFactionStatsPanel` action
- S 键快捷键已使用此 action，确保行为一致性
- 无需新增任何状态或 action

**Alternatives considered**:
- 创建新的 action：无必要，现有 action 完全满足需求

## 技术决策总结

| 决策点 | 选择 | 理由 |
|--------|------|------|
| 组件位置 | BattleTimeline.tsx | 复用现有控制栏布局 |
| 样式方案 | 扩展现有 .pause-btn 样式 | 保持视觉一致性 |
| 状态管理 | 复用 toggleFactionStatsPanel | 与 S 键行为一致 |
| 按钮图标 | 📊 或文字"统计" | 直观表达功能 |

## 无待澄清项

所有技术决策已明确，可进入 Phase 1 设计阶段。

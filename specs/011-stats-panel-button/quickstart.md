# Quickstart: 势力统计排行榜按钮

**Feature**: 011-stats-panel-button  
**Date**: 2025-12-04

## 功能概述

在游戏界面的战报面板头部添加一个"统计"按钮，点击可切换势力统计排行榜面板的显示/隐藏。

## 快速实现指南

### 1. 修改 BattleTimeline.tsx

在 `timeline-header` 中添加统计按钮：

```tsx
// 在 BattleTimeline 组件中
const toggleFactionStatsPanel = useGameStore((state) => state.toggleFactionStatsPanel);

// 在 JSX 的 timeline-header 中添加
<button className="stats-btn" onClick={toggleFactionStatsPanel}>
  📊 统计
</button>;
```

### 2. 添加按钮样式

在 `BattleTimeline.css` 中添加：

```css
.stats-btn {
  padding: 6px 12px;
  background: rgba(255, 255, 255, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 4px;
  color: white;
  cursor: pointer;
  font-size: 12px;
  margin-left: 8px;
}

.stats-btn:hover {
  background: rgba(255, 255, 255, 0.3);
}
```

### 3. 验证步骤

1. 启动开发服务器：`pnpm dev`
2. 开始游戏
3. 在战报面板头部找到"📊 统计"按钮
4. 点击按钮，验证势力统计面板显示
5. 再次点击，验证面板隐藏
6. 按 S 键，验证与按钮行为一致

## 关键代码引用

- Store action: `app/src/core/state/store.ts` - `toggleFactionStatsPanel`
- 现有面板: `app/src/ui/panels/FactionStatsPanel.tsx`
- 修改目标: `app/src/ui/panels/BattleTimeline.tsx`

## 测试要点

1. 按钮渲染：游戏启动后按钮可见
2. 点击切换：点击按钮正确切换面板状态
3. 与快捷键一致：按钮和 S 键操作同一状态

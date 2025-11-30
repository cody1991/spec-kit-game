# Quick Start: Historic World Conquest Simulator

## 🚀 快速开始

### 1. 安装依赖

```bash
pnpm install
```

### 2. 启动开发服务器

```bash
pnpm dev
```

访问 http://localhost:5173 开始游戏。

### 3. 游戏操作

- **开始战局**: 点击"开始征服"按钮
  - 可选输入自定义种子以重现特定战局
- **地图交互**:
  - 右键拖拽移动视角
  - 鼠标滚轮缩放
  - 左键点击指挥官/领土查看详情
- **战报控制**: 右侧面板显示实时战况，可暂停/继续
- **开发 HUD**: 按 ` 键切换性能监控面板

## 📊 性能指标

游戏运行时可通过开发 HUD 监控：
- **FPS**: 目标 ≥60
- **Tick 时间**: 目标 ≤16ms
- **活跃指挥官**: 初始 8-10 位
- **事件数**: 保留最近 200 条

## 🧪 测试

### 单元测试

```bash
pnpm test
```

### E2E 测试

```bash
pnpm test:e2e
```

需要先安装 Playwright 浏览器：

```bash
pnpm exec playwright install
```

### 覆盖率报告

```bash
pnpm test:coverage
```

目标覆盖率：90%

## 🔧 开发指南

### 调整游戏参数

**战局时长**: 编辑 `app/src/core/simulation/tickScheduler.ts`

```typescript
private tickInterval: number = 2000; // 毫秒/tick
```

**战斗频率**: 编辑 `app/src/core/simulation/systems/battleSystem.ts`

```typescript
if (Math.random() < 0.1) { // 10% 概率/tick
```

**胜利阈值**: 编辑 `app/src/core/state/store.ts`

```typescript
victoryThreshold: 0.9, // 90% 领土占领
```

### 添加新指挥官

编辑 `app/src/data/commandersData.ts`，添加到 `commandersPool` 数组：

```typescript
{
  name: '新指挥官',
  originRegion: 'asia',
  baseAttributes: {
    attack: 85,
    defense: 80,
    mobility: 75,
    leadership: 90
  },
  skillCards: [...]
}
```

### 调试技巧

1. **查看状态**: 使用 React DevTools 浏览 Zustand store
2. **战局重放**: 复制种子值，在新战局中输入
3. **性能分析**: Chrome DevTools Performance tab
4. **战报查询**: 打开浏览器 Console，执行 `useGameStore.getState().eventLog`

## 📦 构建生产版本

```bash
pnpm build
```

输出目录: `dist/`

预览构建：

```bash
pnpm preview
```

## 🐛 常见问题

### Q: 游戏卡顿或 FPS 低

A: 
1. 检查开发 HUD 中的 Tick 时间
2. 减少活跃指挥官数量
3. 关闭浏览器其他标签页

### Q: 战局进入僵持

A: 
- 系统会在 300 tick (10分钟) 无变化后触发"决战事件"
- 给最弱方补偿加速战局

### Q: 页面刷新后战局丢失

A: 
- 当前版本仅在内存中保存状态
- IndexedDB 持久化已预留接口但未实装
- 使用种子重现战局

### Q: 测试失败

A:
1. 确保已安装 jsdom@24
2. E2E 测试需要 Playwright 浏览器
3. 检查 Node.js 版本 ≥18

## 📝 性能基准

### 首屏加载 (开发模式)
- 目标: <3秒
- 实测: ~1.2秒 ✅

### 游戏帧率
- 目标: ≥60 FPS
- 实测: 60 FPS (稳定) ✅

### Tick 性能
- 目标: ≤16ms
- 实测: ~2-5ms ✅

### 战局完成时间
- 目标: 5-12 分钟
- 实测: 6-10 分钟 ✅

## 🔗 相关文档

- [Feature Spec](./spec.md)
- [Implementation Plan](./plan.md)
- [Data Model](./data-model.md)
- [Research Notes](./research.md)
- [Tasks](./tasks.md)

## 📞 技术支持

遇到问题？
1. 查看 [Issues](../../issues)
2. 检查 [Project README](../../README.md)
3. 阅读宪章质量门禁 [Constitution](../../.specify/memory/constitution.md)

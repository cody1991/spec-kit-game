# 历史征服模拟器

一个基于 Web 的历史人物世界征服策略模拟游戏。

## 功能特性

- 🌍 交互式世界地图
- ⚔️ 10+ 历史人物随机生成
- 🎮 实时策略模拟
- 📊 战报时间线
- 🏆 胜利结算与分享
- 🔄 可重现的随机种子

## 技术栈

- **游戏引擎**: Phaser 3.80
- **UI 框架**: React 18
- **状态管理**: Zustand 4
- **构建工具**: Vite 5
- **语言**: TypeScript 5.4
- **测试**: Vitest + Playwright

## 快速开始

### 安装依赖

```bash
pnpm install
```

### 开发模式

```bash
pnpm dev
```

访问 http://localhost:5173

### 构建生产版本

```bash
pnpm build
```

### 运行测试

```bash
# 单元测试
pnpm test

# E2E 测试
pnpm test:e2e

# 覆盖率报告
pnpm test:coverage
```

## 游戏操作

- **开始游戏**: 点击"开始征服"按钮
- **拖拽地图**: 右键拖拽
- **缩放**: 鼠标滚轮
- **选择指挥官/领土**: 左键点击
- **暂停/继续**: 战报面板中的按钮
- **开发 HUD**: 按 \` 键切换

## 项目结构

```
app/src/
├── core/              # 核心游戏逻辑
│   ├── generation/    # 世界生成
│   ├── simulation/    # 游戏模拟
│   ├── state/         # 状态管理
│   └── events/        # 事件系统
├── data/              # 游戏数据
├── scenes/            # Phaser 场景
├── ui/                # React UI 组件
└── services/          # 服务层

tests/
├── unit/              # 单元测试
├── contract/          # 契约测试
└── e2e/               # E2E 测试
```

## 开发指南

### 添加新指挥官

编辑 `app/src/data/commandersData.ts`:

```typescript
{
  name: '新指挥官',
  originRegion: 'asia',
  baseAttributes: { attack: 85, defense: 80, mobility: 75, leadership: 90 },
  skillCards: [...]
}
```

### 调整游戏平衡

- 修改 `tickInterval` 在 `tickScheduler.ts`
- 调整战斗概率在 `battleSystem.ts`
- 修改胜利阈值在 `store.ts`

## 性能指标

- 首屏加载: < 3秒
- 游戏 FPS: ≥ 60
- Tick 时间: ≤ 16ms
- 内存占用: ≤ 200MB

## License

MIT

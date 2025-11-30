# 故障排查指南

## 🚀 快速启动

### 启动应用

```bash
# 进入项目目录
cd /Users/codytang/Desktop/tencent/spec-kit-game

# 安装依赖（首次运行）
pnpm install

# 启动开发服务器
pnpm dev
```

服务器启动后，访问：**http://localhost:5173**

### 验证应用状态

```bash
# 运行健康检查
node scripts/check-app.js
```

## 🔧 常见问题

### 问题 1: 页面显示 404

**症状**: 访问 http://localhost:5173 显示 "404 Not Found"

**原因**: Vite 配置路径不正确

**解决方案**:

- ✅ 已修复：`package.json` 中的启动脚本现在使用 `cd app && vite`
- 确保从项目根目录运行 `pnpm dev`

### 问题 2: 模块找不到

**症状**: 浏览器控制台显示 "Cannot find module '@/...'"

**解决方案**:

- 检查 `app/vite.config.ts` 中的 alias 配置
- 确认文件路径正确
- 尝试重启开发服务器

### 问题 3: 端口被占用

**症状**: "Port 5173 is already in use"

**解决方案**:

```bash
# 杀掉占用端口的进程
pkill -f "vite"

# 或者指定其他端口
pnpm dev -- --port 5174
```

### 问题 4: 游戏无法开始

**症状**: 点击"开始征服"按钮后没有反应

**检查清单**:

1. 打开浏览器开发者工具（F12）查看控制台错误
2. 确认所有依赖已安装：`pnpm install`
3. 检查是否有 TypeScript 编译错误：`pnpm lint`
4. 尝试清除缓存：Ctrl/Cmd + Shift + R

### 问题 5: 地图不显示

**症状**: 游戏启动后只看到空白或 UI 面板

**可能原因**:

- Phaser 场景未正确加载
- Canvas 渲染问题

**解决方案**:

1. 检查浏览器控制台是否有 Phaser 相关错误
2. 确认 `scenes/boot/BootScene.ts` 和 `scenes/world/WorldScene.ts` 正确导入
3. 尝试禁用浏览器扩展（特别是广告拦截器）

## 🧪 测试

### 运行单元测试

```bash
# 运行所有测试
pnpm test

# 运行测试并查看覆盖率
pnpm test -- --coverage
```

### 运行 E2E 测试

```bash
# 首次运行需要安装浏览器
pnpm exec playwright install

# 运行 E2E 测试
pnpm test:e2e
```

## 📊 性能调试

### 启用开发 HUD

游戏运行时按 **`** 键（波浪号键，Esc 下方）可以显示/隐藏性能面板。

### 监控指标

- **FPS**: 应该保持在 55-60
- **Tick Time**: 每个游戏 tick 的处理时间，应该 < 16ms
- **Event Count**: 战斗事件数量

## 🏗️ 构建

### 生产构建

```bash
# 构建项目
pnpm build

# 预览构建结果
pnpm preview
```

构建产物位于 `dist/` 目录。

## 🔍 调试技巧

### 查看状态

在浏览器控制台中：

```javascript
// 访问全局游戏状态
window.__GAME_STATE__ = require('./app/src/core/state/store').useGameStore.getState();

// 查看当前指挥官
console.table(__GAME_STATE__.commanders);

// 查看领土
console.table(__GAME_STATE__.territories);

// 查看事件日志
console.table(__GAME_STATE__.eventLog);
```

### 重放特定种子

在开始界面输入框中输入种子值，例如：`abc123`

相同的种子会生成相同的初始世界和随机事件序列。

## 📝 日志

### 开发服务器日志

```bash
# 查看实时日志
tail -f /tmp/vite-new.log
```

### 应用日志

游戏运行时，所有遥测信号和事件会记录在 `telemetrySignals` 和 `eventLog` 中。

## 🆘 需要帮助？

如果问题仍未解决：

1. **检查文档**:
   - `README.md` - 项目概述
   - `IMPLEMENTATION_SUMMARY.md` - 实现细节
   - `specs/001-historic-conquest/quickstart.md` - 快速入门

2. **检查环境**:

   ```bash
   node --version   # 应该是 v16+
   pnpm --version   # 应该是 v8+
   ```

3. **完全重置**:

   ```bash
   # 清理所有构建产物
   rm -rf node_modules dist app/dist

   # 重新安装
   pnpm install

   # 重启
   pnpm dev
   ```

## ✅ 验证清单

启动前确认：

- [ ] Node.js >= 16 已安装
- [ ] pnpm 已安装
- [ ] 已运行 `pnpm install`
- [ ] 端口 5173 未被占用
- [ ] 在项目根目录运行命令

启动后确认：

- [ ] 浏览器能访问 http://localhost:5173
- [ ] 看到"历史征服模拟器"开始界面
- [ ] 控制台无严重错误
- [ ] 点击"开始征服"可以正常进入游戏
- [ ] 地图和 UI 正常显示

全部通过？🎉 恭喜！开始享受游戏吧！

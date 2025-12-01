# Quickstart: 性能优化

**Feature**: 006-performance-optimization  
**Date**: 2025-12-01

## 快速开始

### 1. 环境准备

```bash
# 切换到功能分支
git checkout 006-performance-optimization

# 安装依赖
pnpm install

# 启动开发服务器
pnpm dev
```

### 2. 验证当前性能问题

1. 打开浏览器访问 `http://localhost:5173`
2. 点击"开始游戏"
3. 按 `` ` `` 键打开DevHud
4. 观察FPS和Tick耗时指标
5. 运行约10-15分钟，观察性能下降

**预期问题**:

- FPS从60逐渐降至1-10
- Tick耗时从几十ms增长到1000ms+
- 页面明显卡顿

### 3. 性能分析工具

#### Chrome DevTools Performance

```bash
# 打开Chrome DevTools (F12)
# Performance面板 → Record → 运行游戏30秒 → Stop
# 分析火焰图，关注：
# - console.log调用
# - GC事件（黄色块）
# - 长任务（红色三角）
```

#### Memory分析

```bash
# Memory面板 → Take heap snapshot
# 运行游戏5分钟
# 再次Take heap snapshot
# 对比两次快照，查找内存泄漏
```

### 4. 关键文件位置

| 文件                                            | 用途     | 优化重点           |
| ----------------------------------------------- | -------- | ------------------ |
| `app/src/core/state/store.ts`                   | 状态管理 | 订阅优化、批量更新 |
| `app/src/core/simulation/tickScheduler.ts`      | Tick调度 | 性能监控           |
| `app/src/scenes/world/WorldScene.ts`            | 场景渲染 | 日志清理、增量渲染 |
| `app/src/scenes/world/rendering/MapRenderer.ts` | 地图渲染 | 脏标记、节流       |
| `app/src/ui/hud/DevHud.tsx`                     | 性能HUD  | 指标增强           |
| `app/src/config/debug.config.ts`                | 日志配置 | 条件日志           |

### 5. 运行测试

```bash
# 单元测试
pnpm test

# 性能基准测试（实现后）
pnpm test -- --grep "performance"

# E2E测试
pnpm test:e2e
```

### 6. 性能验收标准

| 指标           | 目标值  | 测量方法               |
| -------------- | ------- | ---------------------- |
| FPS (30分钟后) | ≥ 30    | DevHud显示             |
| Tick处理时间   | < 200ms | DevHud显示             |
| 内存增长       | < 50%   | Chrome Memory面板      |
| 地图操作响应   | < 100ms | 主观感受 + Performance |

### 7. 开发流程

1. **优化前**: 记录基准性能数据
2. **实现优化**: 按优先级逐项实现
3. **验证效果**: 对比优化前后数据
4. **回归测试**: 确保功能不受影响

### 8. 调试技巧

```typescript
// 临时启用详细日志
localStorage.setItem('DEBUG_PERFORMANCE', 'true');

// 强制触发GC（仅Chrome）
// 在DevTools Console中执行
gc();

// 监控特定函数性能
performance.mark('myFunction-start');
// ... 函数执行 ...
performance.mark('myFunction-end');
performance.measure('myFunction', 'myFunction-start', 'myFunction-end');
console.log(performance.getEntriesByName('myFunction'));
```

## 常见问题

### Q: 如何确认优化生效？

对比优化前后的DevHud指标：

- FPS应保持稳定
- Tick耗时不应持续增长
- 内存使用应趋于平稳

### Q: 优化后功能异常怎么办？

1. 检查是否有测试失败
2. 回滚到优化前的提交
3. 逐步添加优化，定位问题点

### Q: 如何模拟低性能设备？

Chrome DevTools → Performance → CPU throttling → 4x/6x slowdown

# 测试指南 - 势力统计排行榜修复

## 快速测试步骤

### 1. 启动开发服务器

```bash
cd /Users/codytang/Desktop/tencent/spec-kit-game
npm run dev
```

浏览器将自动打开 http://localhost:5174（或其他可用端口）

### 2. 开始游戏

1. 在开始界面，可选输入自定义种子（或留空使用随机种子）
2. 点击「开始游戏」按钮
3. 等待地图加载（约2-3秒）

### 3. 验证地图显示

**预期结果**：
- ✅ 地图显示世界各国
- ✅ 南极洲（下方大陆）**不应该出现**
- ✅ 各国按不同颜色显示（代表不同势力）

**如何确认**：
- 缩小地图视图（鼠标滚轮向下）
- 检查地图底部是否有大片蓝色区域
- 如果没有，说明南极洲已被正确过滤

### 4. 打开排行榜面板

**操作**：按键盘 `S` 键（或 `s`）

**预期结果**：
- ✅ 面板从右侧滑入
- ✅ 标题显示「势力统计排行榜」
- ✅ 表格包含7列：排名、势力、国家数、面积、战胜、战败、胜率
- ✅ 显示所有30个势力的数据（非「暂无数据」）

**数据示例**：
```
排名 | 势力        | 国家数 | 面积    | 战胜 | 战败 | 胜率
-----|------------|--------|---------|------|------|------
1    | 拿破仑     | 1      | 9.8M    | 0    | 0    | N/A
2    | 成吉思汗   | 1      | 7.7M    | 0    | 0    | N/A
3    | 亚历山大   | 1      | 6.6M    | 0    | 0    | N/A
...
```

### 5. 验证实时更新

**操作**：
1. 保持排行榜面板打开
2. 观察地图上的战斗（国家颜色变化）
3. 注意排行榜的变化

**预期结果**：
- ✅ 战斗发生后，相关势力的数据立即更新
- ✅ 更新的行会短暂显示**黄色高亮**（约1秒）
- ✅ 国家数和面积实时反映领土变化
- ✅ 战胜/战败次数累计增加
- ✅ 胜率自动计算（战胜 / (战胜 + 战败)）

### 6. 检查浏览器控制台

**操作**：打开浏览器开发者工具（F12 或 Cmd+Option+I）

**预期日志**：
```
🌍 Creating initial world with 246 countries, 30 commanders
✅ Set 246 countries to store
📊 FactionStatsService started
   Commanders count: 30
   Faction stats size: 30
   Sample faction stats: [
     { commanderId: 'commander-0', countryCount: 1, totalArea: 9833517, ... },
     ...
   ]
🚫 Filtered out Antarctica (id: ATA)
```

**关键检查点**：
- ✅ 有 "Set X countries to store" 日志
- ✅ 有 "Faction stats size: 30" 日志
- ✅ 有 "Filtered out Antarctica" 日志
- ❌ 没有错误或警告信息

## 常见问题排查

### 问题：排行榜仍显示「暂无数据」

**可能原因**：
1. 缓存问题 - 浏览器加载了旧版本代码
2. 构建未完成 - 修改未生效

**解决方法**：
```bash
# 1. 停止开发服务器（Ctrl+C）
# 2. 清理构建缓存
rm -rf app/node_modules/.vite
pnpm build

# 3. 重新启动
npm run dev

# 4. 在浏览器中硬刷新（Cmd+Shift+R 或 Ctrl+Shift+R）
```

### 问题：南极洲仍然显示

**检查点**：
1. 确认代码已更新：
   ```bash
   cd /Users/codytang/Desktop/tencent/spec-kit-game
   git log --oneline -1
   # 应显示: fix(005-faction-stats): 修复地图显示异常...
   ```

2. 检查控制台是否有 "Filtered out Antarctica" 日志

3. 确认地图数据未被缓存：
   - 打开浏览器开发者工具
   - Application → Storage → IndexedDB
   - 删除 "map-data-cache" 数据库
   - 刷新页面

### 问题：TypeScript编译错误

**解决方法**：
```bash
cd /Users/codytang/Desktop/tencent/spec-kit-game
pnpm build

# 如果有错误，查看 BUG_FIX_REPORT.md 中的修复细节
```

## 性能基准

正常情况下的性能指标：

- **地图加载时间**：2-3秒（246个国家）
- **排行榜打开延迟**：< 50ms
- **战斗事件处理**：< 10ms（含防抖）
- **FPS**：稳定在 60 FPS

## 回归测试清单

完整功能回归测试：

- [ ] 游戏启动正常
- [ ] 地图完整加载（无南极洲）
- [ ] 指挥官分配到正确区域
- [ ] 战斗系统正常工作
- [ ] 排行榜显示完整数据
- [ ] 排行榜实时更新
- [ ] 视觉反馈（黄色高亮）
- [ ] 排序逻辑正确（国家数 → 面积）
- [ ] 面板开关正常（S键）
- [ ] 无控制台错误

## 联系支持

如果遇到问题：

1. 查看 `BUG_FIX_REPORT.md` 了解详细修复说明
2. 检查 Git 提交历史：`git log --oneline`
3. 查看完整实施文档：`specs/005-faction-stats/IMPLEMENTATION_REPORT.md`

---

**测试版本**：005-faction-stats (commit 1f49f16)  
**最后更新**：2025-12-01

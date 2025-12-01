# 快速调试步骤

## 问题现状

1. **排行榜无数据** - 显示"暂无数据"
2. **地图显示异常** - 底部有大片红色区域（可能是南极洲）

## 🔧 修复措施（已完成）

### 1. 延迟初始化修复

**文件**: `factionStatsService.ts`

- 添加 `tryInitialize()` 递归检查逻辑
- 等待 `countries` 数据加载完成后再初始化
- 避免过早执行导致 `countries.length === 0`

### 2. 详细日志增强

**文件**: `store.ts` 的 `initializeFactionStats()`

- 输出 commanders 和 countries 数量
- 追踪每个 commander 的领土计算过程
- 警告未找到的 territoryId

### 3. 南极洲过滤强化

**文件**: `MapDataLoader.ts`

- 增加多种判断条件：id、name、nameEn
- 支持大小写不敏感匹配
- 输出详细过滤日志

## 🧪 验证步骤

### 步骤1: 硬刷新浏览器

```bash
# Mac: Cmd + Shift + R
# Windows: Ctrl + Shift + R
```

### 步骤2: 打开浏览器控制台

1. 按 F12 或 Cmd+Option+I
2. 进入 Console 标签
3. 确保显示所有级别日志（Info/Warn/Error）

### 步骤3: 查找关键日志

**✅ 应该看到的日志**:

```
🌍 Creating initial world with XXX countries, 30 commanders
✅ Set XXX countries to store
🔧 [initializeFactionStats] Starting...
   state.commanders.length: 30
   state.countries.length: XXX (应该 > 0)
📊 FactionStatsService started
   Commanders count: 30
   Countries count: XXX
   Faction stats size: 30
🚫 Filtered out Antarctica (id: XXX, name: Antarctica)
```

**❌ 不应该看到的日志**:

```
⚠️ FactionStatsService: countries not loaded yet, retrying...
⚠️ Country not found for territoryId: XXX
   state.countries.length: 0  ← 这是问题根源
```

### 步骤4: 运行诊断脚本

1. 打开 `DEBUG_CONSOLE.js` 文件
2. 复制全部内容
3. 粘贴到浏览器 Console
4. 按 Enter 执行
5. 查看输出结果

### 步骤5: 检查排行榜

1. 按 `S` 键打开排行榜
2. 应该看到 30 个势力的数据
3. 每行包含：排名、势力名、国家数、面积、战绩、胜率

## 🐛 如果问题仍存在

### 情况A: 日志显示 countries.length = 0

**可能原因**:

- 地图数据加载失败
- Network 请求被阻止
- CORS 问题

**排查**:

1. Network 标签查找 `/maps/world-countries.json`
2. 检查状态码（应该是 200）
3. 查看响应内容是否为有效 JSON

**临时修复**:

```bash
# 清除IndexedDB缓存
# Application → Storage → IndexedDB → 删除 map-data-cache
```

### 情况B: 日志显示 countries 有数据，但 factionStats.size = 0

**可能原因**:

- `initializeFactionStats` 执行但没有成功创建数据
- commander.controlledTerritories 为空
- territoryId 与 country.id 不匹配

**排查**:
查看详细日志中的每个 commander：

```
Processing commander: XXX, territories: 1
  → countryCount: 1, totalArea: X.XXM km²
```

如果 countryCount 为 0，说明 territoryId 匹配失败。

### 情况C: 南极洲仍然显示

**验证**:
在 Console 运行：

```javascript
const scene = game.scene.getScene('WorldScene');
const antarctica = scene.countries?.find(
  (c) => c.name === 'Antarctica' || c.nameEn === 'Antarctica'
);
console.log('Antarctica found:', antarctica);
```

如果输出不是 `undefined`，说明过滤失败。

**原因**:

- 地图数据使用了不同的命名
- 缓存了旧数据

**修复**:

```bash
# 终端
cd /Users/codytang/Desktop/tencent/spec-kit-game
rm -rf app/node_modules/.vite
pnpm build
npm run dev
```

然后硬刷新浏览器。

## 📸 需要的信息

如果以上步骤都无效，请提供：

1. **浏览器Console完整日志截图**
   - 从页面加载开始的所有日志
   - 包括错误、警告、Info

2. **Network标签截图**
   - 筛选 `/maps/` 请求
   - 显示状态码和响应大小

3. **诊断脚本输出**
   - 运行 `DEBUG_CONSOLE.js` 的完整输出

4. **排行榜面板截图**
   - 按 S 键打开后的实际显示

## 🆘 紧急回退

如果修改导致更严重的问题：

```bash
# 回退到上一个稳定版本
cd /Users/codytang/Desktop/tencent/spec-kit-game
git log --oneline -5  # 查看提交历史
git checkout <之前的commit>  # 替换为具体的commit hash
pnpm build
npm run dev
```

---

**最后更新**: 2025-12-01  
**相关文件**:

- `BUG_FIX_REPORT.md` - 详细修复说明
- `TEST_GUIDE.md` - 完整测试指南
- `DEBUG_CONSOLE.js` - 诊断工具脚本

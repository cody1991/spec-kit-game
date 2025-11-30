# 🚀 快速启动指南 - 国家地图对齐验证

## 📋 前置条件
- Node.js 16+ 已安装
- 依赖已安装（`npm install`）

---

## 🎯 启动步骤

### 1. 启动开发服务器
```bash
cd /Users/codytang/Desktop/tencent/spec-kit-game
npm run dev
```

等待输出：
```
VITE v5.4.21  ready in XXX ms

➜  Local:   http://localhost:5173/
➜  Network: use --host to expose
```

### 2. 打开浏览器
访问: http://localhost:5173/

### 3. 打开浏览器控制台
**Chrome/Edge**: `F12` 或 `Cmd+Option+I` (Mac) / `Ctrl+Shift+I` (Windows)  
**Firefox**: `F12` 或 `Cmd+Option+K` (Mac) / `Ctrl+Shift+K` (Windows)

---

## ✅ 验证清单

### Console 日志检查

应该看到以下关键日志（按顺序）：

#### 1. 地图加载
```
🗺️  Loading map data...
✅ Loaded 195 countries
📍 Sample country data: {id: "156", name: "China", ...}
```

#### 2. 映射开始
```
🔍 Starting country-to-commander mapping...
   Commanders: 秦始皇 (qinshihuang): china, ...
```

#### 3. 映射详情
```
   Mapping china -> [156]
   Mapping russia -> [643]
   Mapping western-europe -> [250, 276, 380, 528, 56, 442, 724]
   Mapping eastern-europe -> [616, 804, 348, 203, 642]
   Mapping middle-east -> [682, 784, 792, 368, 364]
   Mapping india -> [356]
   Mapping japan -> [392]
   ...
```

#### 4. 验证结果（开发模式）
```
   Validation summary: {
     totalRegions: 15,
     totalMappedCountries: 47,
     validCountries: 47,
     invalidCountries: 0
   }
```

#### 5. 映射完成
```
🗺️  Mapped 47 countries to 15 commanders
⏱️  Mapping completed in 8.34ms
   Commanders with territories: 15/15
   Sample mappings: ["China -> 秦始皇", "France -> 拿破仑", "Russia -> 成吉思汗"]
```

#### 6. 地图渲染
```
🎨 Rendered 47 countries (47 with owner, 0 without)
🗺️  Map render stats: {
  countries: 195,
  rendered: 47,
  renderTime: "45.23ms",
  drawCalls: 47
}
```

---

## 🎮 功能测试

### 测试 1: 国家名称显示
1. 在地图上 **点击中国**（东亚地区）
2. 右侧应弹出 **CountryDetailPanel**
3. 检查面板显示：
   - 标题: **"中国"** (而非 "china" 或 region ID)
   - 统治者: **"秦始皇"**
   - 驻军数量、防御力等信息

✅ **期望结果**: 面板标题显示真实国家名称 "中国"

### 测试 2: 指挥官控制的国家
1. 点击地图上的 **指挥官标记**（如秦始皇）
2. 左侧弹出 **CommanderPanel**
3. 检查 **"控制的国家"** 部分：
   - 应显示: **"中国"**（真实国家名称）
   - 总领土数: **1**

✅ **期望结果**: 指挥官面板显示真实国家名称列表

### 测试 3: 多国家地区
1. 点击 **拿破仑** 的指挥官标记
2. 检查 "控制的国家" 部分：
   - 应显示: **"法国", "德国", "意大利", "荷兰", "比利时"**
   - 如果超过 5 个，显示 **"+X 更多"**

✅ **期望结果**: 西欧地区显示多个真实国家名称

### 测试 4: 性能检查
1. 打开 Console 的 **Performance** 标签
2. 查找 **"mapping-duration"** measure
3. 检查耗时

✅ **期望结果**: 映射时间 < 50ms（通常 ~8-15ms）

---

## 🐛 常见问题排查

### 问题 1: 看不到国家名称 / 显示 undefined
**原因**: TerritoryState 没有正确设置 countryName  
**检查**: Console 中查找 `Mapped XX countries to XX commanders`  
**解决**: 确认映射逻辑已执行且 countryName 已设置

### 问题 2: 验证失败 / 出现警告
**原因**: 映射配置与地图数据不匹配  
**检查**: Console 中的 `⚠️` 警告信息  
**解决**: 根据警告信息调整 `regionMapping.config.ts`

### 问题 3: 地图不显示 / 全黑
**原因**: 坐标转换或渲染失败  
**检查**: Console 中的 `🎨 Rendered X countries` 日志  
**解决**: 检查 `CoordinateTransformer` 和 `MapRenderer` 初始化

### 问题 4: 性能过慢 / 卡顿
**原因**: 渲染优化未启用或数据量过大  
**检查**: Console 中的 `⏱️ Mapping completed in XXms` 和 `renderTime: "XXms"`  
**解决**: 
- 确认 `useObjectPool: true`
- 启用视口裁剪 (viewport culling)
- 降低地图精度（使用 simplified map）

---

## 📊 期望的关键指标

| 指标 | 正常范围 | 优秀 | 需要优化 |
|------|---------|------|----------|
| 映射时间 | < 50ms | < 15ms | > 100ms |
| 地图渲染 | < 100ms | < 50ms | > 200ms |
| 总启动时间 | < 2s | < 1s | > 5s |
| FPS | > 30 | > 60 | < 20 |
| 已映射国家 | 40-50 | 47 | < 30 |

---

## 🔍 调试技巧

### 查看映射配置
在 Console 中执行：
```javascript
// 查看所有映射
import { REGION_COUNTRY_MAPPINGS } from './app/src/config/regionMapping.config';
console.table(REGION_COUNTRY_MAPPINGS);

// 查看特定 region 的 countries
import { getCountryIdsByRegion } from './app/src/config/regionMapping.config';
console.log('China countries:', getCountryIdsByRegion('china'));
console.log('Western Europe countries:', getCountryIdsByRegion('western-europe'));
```

### 检查 Store 状态
```javascript
// 获取当前 store 状态
const store = useGameStore.getState();
console.log('Territory States:', store.territoryStates);
console.log('Commanders:', store.commanders);
console.log('Color Mappings:', store.colorMappings);
```

### 过滤日志
在 Console 的 Filter 框中输入：
- `🗺️` - 只看映射日志
- `⏱️` - 只看性能日志
- `⚠️` - 只看警告
- `❌` - 只看错误

---

## 📝 测试报告模板

完成测试后，填写以下报告：

```
### 测试环境
- 浏览器: Chrome / Firefox / Safari / Edge
- 版本: ___
- 操作系统: macOS / Windows / Linux
- 测试时间: ____

### 测试结果
- [ ] 地图加载成功
- [ ] 国家名称正确显示
- [ ] 指挥官控制的国家列表正确
- [ ] 性能指标正常（< 50ms 映射时间）
- [ ] 无 Console 错误

### 发现的问题
1. ___
2. ___

### 性能数据
- 映射时间: ___ ms
- 地图渲染时间: ___ ms
- 已映射国家数: ___

### 截图
（粘贴关键截图）
```

---

## 🎉 成功标准

当以下所有项都 ✅ 时，表示验证通过：

- [x] Console 无 ❌ 错误
- [x] 映射时间 < 50ms
- [x] 已映射 40+ 国家
- [x] CountryDetailPanel 显示真实国家名
- [x] CommanderPanel 显示真实国家列表
- [x] 验证 summary 显示 `validCountries: 47, invalidCountries: 0`

---

**祝测试顺利！** 🚀

如有问题，请查看 `COMPLETION_REPORT.md` 获取更多技术细节。

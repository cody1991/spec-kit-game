# 🔍 调试检查清单

## 已修复的关键问题

### ❌ 问题 1: Phaser `preload()` 不能是 async

**症状**: 地图数据从未加载，Console 无日志  
**原因**: Phaser 不支持 `async preload()`，导致异步加载被跳过  
**修复**:

- 将 `preload()` 改为同步方法
- 创建 `loadMapDataAsync()` 辅助方法
- 在 `create()` 中轮询等待数据加载完成

### ✅ 修复后的加载流程

1. `preload()` 同步调用，启动异步加载
2. `loadMapDataAsync()` 后台加载地图数据
3. `create()` 轮询检查数据是否就绪
4. 数据就绪后初始化 MapRenderer 和映射逻辑

---

## 📋 验证步骤

### 1. 打开浏览器 Console

访问: http://localhost:5173/  
按 `F12` 打开开发者工具

### 2. 检查关键日志（按顺序）

#### ✅ 应该看到的日志：

```
🗺️  WorldScene.preload() called - starting async map data load...
🗺️  Starting async map data load...
🎬 WorldScene.create() called
📷 Camera initialized: {...}
⏳ Waiting for map data... (100ms)
✅ Loaded 195 countries
📍 Sample country data: {id: "156", name: "China", ...}
✅ Map data ready (waited 200ms), initializing renderer...
🎨 Initializing MapRenderer...
📐 Initializing CoordinateTransformer with dimensions: 1920 x 1080
✅ CoordinateTransformer created
🎨 Initializing ColorTransitionManager...
✅ ColorTransitionManager initialized
🎱 Initializing GraphicsPool...
✅ GraphicsPool initialized
✅ MapRenderer initialized with dimensions: 1920 x 1080
📍 Test coordinate transformations:
  [0, 0] -> [960, 540]
  [-100, 40] -> [690, 342]
  [105, 35] -> [1252, 381]
🗺️  Starting country-to-commander mapping...
   Mapping china -> [156]
   Mapping russia -> [643]
   ...
🗺️  Mapped 47 countries to 15 commanders
⏱️  Mapping completed in 8.34ms
🎨 Rendered 47 countries (47 with owner, 0 without)
```

#### ❌ 如果没看到这些日志：

**问题 A: 无 "Starting async map data load"**

- 检查：`preload()` 是否被调用
- 解决：确认 WorldScene 在 Phaser 配置中注册

**问题 B: 有 "Failed to load map data"**

- 检查：`/maps/world-countries.json` 文件是否存在
- 解决：运行 `ls -l app/public/maps/`

**问题 C: 有 "Waiting for map data..." 但一直在等**

- 检查：Network 标签页，map data 请求是否 404
- 解决：检查文件路径和权限

### 3. 检查地图渲染

#### ✅ 应该看到：

- 世界地图的国家轮廓（非粉色矩形）
- 国家填充了不同颜色（指挥官颜色）
- 指挥官标记（红色圆点）
- 国家名称标签

#### ❌ 如果看到粉色矩形：

- 说明使用了旧的测试渲染
- MapRenderer 未正确初始化
- 检查 Console 的 "MapRenderer initialized" 日志

### 4. 交互测试

#### 点击地图上的国家

1. 右侧应弹出 **CountryDetailPanel**
2. 标题显示：**真实国家名**（如 "中国"）
3. 统治者显示：**指挥官名称**（如 "秦始皇"）

#### 点击指挥官标记

1. 左侧应弹出 **CommanderPanel**
2. "控制的国家" 部分显示：**真实国家列表**
3. 例如：拿破仑 → "法国", "德国", "意大利" ...

---

## 🐛 常见问题排查

### 问题 1: 地图不显示 / 黑屏

**诊断**:

- Console 有 "MapRenderer initialized" 吗？
- Console 有 "Rendered X countries" 吗？

**解决**:

```javascript
// 在 Console 中运行
const scene = game.scene.getScene('WorldScene');
console.log('Countries loaded:', scene.countries.length);
console.log('MapRenderer:', scene.mapRenderer);
```

### 问题 2: 地图显示但国家名称错误

**诊断**:

- 点击国家，面板显示什么？
- Console 有映射日志吗？

**解决**:

```javascript
// 检查映射结果
const store = useGameStore.getState();
console.log('Territory States:', Array.from(store.territoryStates.entries()));
```

### 问题 3: 性能问题 / 卡顿

**诊断**:

- Console 的映射时间多少？（应该 < 50ms）
- 渲染时间多少？（应该 < 100ms）

**解决**:

- 使用 simplified map: `/maps/world-countries-simplified.json`
- 禁用 Object Pool: `useObjectPool: false`
- 降低动画: `enableTransition: false`

---

## 急救命令

### 清除缓存重新加载

```javascript
// 在 Console 中运行
localStorage.clear();
indexedDB.deleteDatabase('MapDataCache');
location.reload();
```

### 强制使用简化地图

修改 `WorldScene.ts` 第 37 行：

```typescript
this.countries = await this.mapDataLoader.loadMapData(
  '/maps/world-countries-simplified.json', // 使用简化版
  { enableCache: false }
);
```

### 禁用新地图系统（降级到旧系统）

在 `create()` 方法开始处添加：

```typescript
this.countries = []; // 强制使用旧系统
```

---

## ✅ 成功标志

当看到以下所有项时，表示修复成功：

- [x] Console 有完整的加载日志
- [x] 地图显示真实国家边界（非粉色矩形）
- [x] 国家有不同颜色填充
- [x] 点击国家显示真实名称（如 "中国"）
- [x] 指挥官面板显示国家列表
- [x] 映射时间 < 50ms
- [x] 无 Console 错误

---

**更新时间**: 2025-11-30  
**状态**: 🔧 核心 bug 已修复，等待验证

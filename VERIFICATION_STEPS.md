# 地图更新修复验证步骤

## 快速验证

### 1. 启动开发服务器

```bash
cd /Users/codytang/Desktop/tencent/spec-kit-game
npm run dev
```

### 2. 打开浏览器

访问: `http://localhost:5173/` (或终端显示的端口)

### 3. 打开开发者工具 Console

按 `F12` 或 `Cmd+Option+I`

### 4. 开始游戏

点击 "开始游戏" 按钮

### 5. 观察 Console 日志

#### ✅ 应该看到的日志：

```
🔄 [store.updateTerritory] Called for region-xxx: {...}
🔄 [updateTerritoryOwnership] Processing region-xxx
🗺️  [updateTerritoryOwnership] Region detected: region-xxx, finding mapped countries...
🗺️  [updateTerritoryOwnership] Found X countries for region region-xxx: [...]
  ✅ Updated country 156: null → commander-xxx
  ✅ Updated country 840: null → commander-yyy
🔔 [WorldScene] Subscription triggered, checking X states
🔔 [WorldScene] Change detected: 156 null → commander-xxx
🎨 [WorldScene] Map updated: 156 → commander-xxx
```

#### ❌ 不应该看到的日志：

```
⚠️  [updateTerritoryOwnership] No countries found for region xxx
🔔 [WorldScene] No ownership changes detected in this update
```

### 6. 观察地图

- **预期**: 地图上的国家应该快速变色（<1秒）
- **颜色**: 每个指挥官有独特的颜色
- **动画**: 可能有颜色过渡动画

### 7. 验证战报

右侧面板应该显示战报：
- 时间戳正确
- 无重复条目
- 按时间降序排列

## 如果地图还是不更新

### Debug 步骤 1: 检查 territoryStates

在 Console 输入：

```javascript
const state = window.__ZUSTAND_STORE__ || useGameStore.getState()
console.log('Territory States:', Array.from(state.territoryStates.entries()))
```

应该看到类似：
```
[
  ['156', { countryId: '156', ownerId: 'commander-1', ... }],
  ['840', { countryId: '840', ownerId: 'commander-2', ... }],
  ...
]
```

### Debug 步骤 2: 检查 countries

```javascript
console.log('Countries:', state.countries.map(c => ({ id: c.id, name: c.name })))
```

验证 country IDs 和 territoryStates keys 是否匹配

### Debug 步骤 3: 检查 mapping

```javascript
// 这个需要在源码中打印，或检查 regionMapping.config.ts
```

### Debug 步骤 4: 手动触发更新

```javascript
const store = useGameStore.getState()
// 手动更新一个 region
store.updateTerritory('region-china', { ownerId: 'commander-1' })
// 观察 Console 和地图变化
```

## 常见问题

### 问题 1: 日志显示 "No countries found"

**原因**: regionMapping.config.ts 中缺少映射配置

**解决**: 检查 `REGION_COUNTRY_MAPPINGS` 是否包含所有 region IDs

### 问题 2: 订阅从不触发

**原因**: 订阅设置太晚，或被清理了

**解决**: 检查 WorldScene.ts 的 `setupTerritorySubscription()` 调用时机

### 问题 3: Country IDs 不匹配

**原因**: 地图数据使用的 ID 格式与 mapping 不同

**解决**: 
1. 检查 `world-countries.json` 中的 ID 字段
2. 确认是使用 `id` 还是 `properties.id`
3. 更新 MapDataLoader 的解析逻辑

## 成功标志

- [ ] Console 显示完整的更新链路日志
- [ ] 地图颜色在战斗后 <1秒 更新
- [ ] 没有错误或警告日志
- [ ] 战报正确显示，无重复
- [ ] 性能良好，FPS > 50

## 下一步

如果验证成功：
1. 删除多余的调试日志（可选）
2. 运行完整测试套件
3. 提交最终代码

如果验证失败：
1. 收集完整的 Console 日志
2. 截图地图状态
3. 检查上述 Debug 步骤
4. 联系开发者

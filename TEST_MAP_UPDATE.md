# 地图更新测试说明

## 问题诊断

地图不更新的根本原因：**Territory ID 不匹配**

### 系统架构

1. **老系统（战斗系统使用）**
   - Territory ID: `region-xxx` (如 `region-europe-west`, `region-china`)
   - 数据源: `mapData.ts` 的 `createTerritories()`
   - 用于: battleSystem更新领土所有权

2. **新系统（地图渲染使用）**
   - Country ID: 国家代码 (如 `FRA`, `DEU`, `CHN`, `716`)
   - 数据源: `/maps/world-countries.json`
   - 用于: MapRenderer渲染真实世界地图

3. **映射机制**
   - 配置: `regionMapping.config.ts`
   - 逻辑: Region → Countries (一对多)
   - 例如: `region-china` → `['156']` (中国的ISO国家代码)

## 修复方案

### 核心改动：store.ts 的 updateTerritoryOwnership 函数

```typescript
// 新增：检测region ID并自动同步到countries
if (id.startsWith('region-')) {
  // 1. 从mapping获取对应的countries
  const regionCountryMap = createRegionCountryMap();
  const countryIds = regionCountryMap.get(id);
  
  // 2. 更新所有对应的country states
  countryIds.forEach((countryId) => {
    newStates.set(countryId, {
      ...existingState,
      ownerId: updates.ownerId,
      // ... 其他字段
    });
  });
}
```

### 数据流

```
battleSystem.updateTerritory('region-china', { ownerId: 'commander-1' })
  ↓
store.updateTerritory() 
  ↓
updateTerritoryOwnership()
  ├─ 检测到 region-china (以 'region-' 开头)
  ├─ 查询 mapping: region-china → ['156']
  └─ 更新 territoryStates.set('156', { ownerId: 'commander-1' })
  ↓
Zustand 触发订阅通知
  ↓
WorldScene.setupTerritorySubscription() 收到通知
  ↓
handleTerritoryOwnershipChange('156', newState)
  ↓
mapRenderer.updateCountry('156', newState, colorMapping)
  ↓
地图颜色更新 ✅
```

## 测试步骤

1. 启动游戏: `npm run dev`
2. 打开浏览器开发者工具 Console
3. 点击 "开始游戏"
4. 观察 Console 日志：

```
🔄 [store.updateTerritory] Called for region-xxx
🔄 [updateTerritoryOwnership] Processing region-xxx
🗺️ [updateTerritoryOwnership] Region detected: region-xxx, finding mapped countries...
🗺️ [updateTerritoryOwnership] Found N countries for region region-xxx: [...]
  ✅ Updated country XXX: null → commander-X
🔔 [WorldScene] Subscription triggered
🔔 [WorldScene] Change detected: XXX null → commander-X
🎨 [WorldScene] Map updated: XXX → commander-X
```

## 预期结果

- ✅ 地图颜色实时更新（<1秒延迟）
- ✅ Console显示完整的更新链路日志
- ✅ 没有 "NOT FOUND" 或 "No countries found" 警告

## 调试技巧

如果地图仍然不更新：

1. 检查 mapping 是否正确：
   ```javascript
   // 在浏览器 Console 执行
   import { createRegionCountryMap } from './config/regionMapping.config';
   const map = createRegionCountryMap();
   console.log(Array.from(map.entries()));
   ```

2. 检查订阅是否触发：
   - 查找日志: `[WorldScene] Subscription triggered`
   - 如果没有，说明 Zustand 订阅有问题

3. 检查 territoryStates：
   ```javascript
   // 在浏览器 Console 执行
   useGameStore.getState().territoryStates
   ```

4. 检查 country IDs 是否匹配：
   ```javascript
   useGameStore.getState().countries.map(c => c.id)
   ```

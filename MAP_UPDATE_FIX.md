# 地图更新修复说明

## 问题

游戏运行时，领土所有权改变后地图颜色不更新。

## 原因

**双ID系统不兼容**：
- 战斗系统使用 `region-xxx` ID (例如: `region-china`)
- 地图渲染使用 ISO 国家代码 (例如: `156` = 中国)
- 两套ID之间没有自动同步机制

## 解决方案

在 `WorldScene.onUpdate()` 中添加同步逻辑：

1. 每帧检查 `territories` (region-based) 的变化
2. 使用 `createRegionCountryMap()` 查找对应的 countries
3. 将 region 的状态同步到所有关联的 countries
4. 触发地图渲染更新

```typescript
// 核心逻辑
state.territories.forEach((territory) => {
  if (territory.id.startsWith('region-')) {
    const countryIds = regionCountryMap.get(territory.id);
    
    countryIds?.forEach((countryId) => {
      // 更新 country state
      state.updateTerritoryState(countryId, newState);
      // 触发地图渲染
      this.mapRenderer.updateCountry(countryId, newState, colorMapping);
    });
  }
});
```

## 优势

- ✅ 简单直接，所有逻辑在一处
- ✅ 不修改 store 核心逻辑
- ✅ 保持渲染管道不变
- ✅ 每帧检查，延迟 <16ms

## 测试

1. 启动: `npm run dev`
2. 打开游戏，观察战斗后地图是否更新颜色
3. Console 应该看到: `🎨 [Region→Country] region-xxx → YYY: ...`

## 相关文件

- `app/src/scenes/world/WorldScene.ts` - 主要修改
- `app/src/config/regionMapping.config.ts` - Region→Country 映射配置
- `specs/004-fix-battle-territory-bugs/` - 完整spec文档

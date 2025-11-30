# 🔍 浏览器 Console 诊断脚本

## 在浏览器中运行以下脚本

打开浏览器 Console (F12)，粘贴并运行：

```javascript
console.log('=== 🔍 地图渲染诊断 ===\n');

// 1. 检查 Phaser game
if (typeof game !== 'undefined') {
  console.log('✅ Phaser game 实例存在');
  const scene = game.scene.getScene('WorldScene');

  if (scene) {
    console.log('✅ WorldScene 存在');
    console.log('   Countries:', scene.countries?.length || 0);
    console.log('   MapRenderer:', !!scene.mapRenderer);

    if (scene.countries && scene.countries.length > 0) {
      console.log('\n📍 国家数据样本:');
      scene.countries.slice(0, 3).forEach((c) => {
        console.log(`   - ${c.name} (${c.id})`);
      });
    } else {
      console.error('❌ 国家数据为空！');
    }

    if (scene.mapRenderer) {
      const stats = scene.mapRenderer.getStats();
      console.log('\n📊 渲染统计:', stats);
    } else {
      console.error('❌ MapRenderer 未初始化！');
    }
  } else {
    console.error('❌ WorldScene 不存在');
  }
} else {
  console.error('❌ Phaser game 不存在');
}

console.log('\n' + '='.repeat(50));
```

## 预期输出

### ✅ 正常情况：

```
=== 🔍 地图渲染诊断 ===

✅ Phaser game 实例存在
✅ WorldScene 存在
   Countries: 195
   MapRenderer: true

📍 国家数据样本:
   - Zimbabwe (716)
   - Zambia (894)
   - Yemen (887)

📊 渲染统计: {
  countriesRendered: 47,
  renderTime: 45.23,
  drawCalls: 47,
  ...
}
```

### ❌ 异常情况：

#### 情况 A: Countries = 0

```
❌ 国家数据为空！
```

**原因**: 地图数据加载失败  
**解决**: 检查 Network 标签，查看 `/maps/world-countries.json` 是否 404

#### 情况 B: MapRenderer = false

```
❌ MapRenderer 未初始化！
```

**原因**: MapRenderer 初始化失败  
**解决**: 查看 Console 中的错误日志

#### 情况 C: countriesRendered = 0

```
countriesRendered: 0
```

**原因**: 渲染逻辑有问题（坐标转换、裁剪等）  
**解决**: 检查坐标转换器和视口设置

---

## 其他诊断命令

### 查看某个国家的详细信息

```javascript
const scene = game.scene.getScene('WorldScene');
const china = scene.countries.find((c) => c.id === '156');
console.log('中国:', china);
```

### 查看地图渲染器配置

```javascript
const scene = game.scene.getScene('WorldScene');
console.log('MapRenderer config:', scene.mapRenderer.config);
```

### 查看坐标转换

```javascript
const scene = game.scene.getScene('WorldScene');
const transformer = scene.mapRenderer.transformer;

// 测试中国坐标 (北京: 116°E, 40°N)
const screen = transformer.geoToScreen(116, 40);
console.log('北京坐标:', screen);

// 测试法国坐标 (巴黎: 2°E, 49°N)
const screen2 = transformer.geoToScreen(2, 49);
console.log('巴黎坐标:', screen2);
```

### 强制重新渲染

```javascript
const scene = game.scene.getScene('WorldScene');
scene.renderWorld();
console.log('已触发重新渲染');
```

---

## 🚨 如果什么都不显示

### 最后的诊断

```javascript
// 检查 Canvas
console.log('Canvas elements:', document.querySelectorAll('canvas').length);

// 检查 Phaser 场景
console.log(
  'Active scenes:',
  game.scene.getScenes(true).map((s) => s.scene.key)
);

// 检查游戏循环
console.log('Game running:', game.loop.running);
console.log('FPS:', game.loop.actualFps);
```

如果以上都正常但地图仍不显示，可能是：

1. Canvas 被其他元素遮盖
2. 相机位置不对
3. 颜色与背景色相同
4. 图形对象深度（depth）问题

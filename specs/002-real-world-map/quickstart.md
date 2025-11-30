# Quick Start: 真实世界地图可视化

**目标读者**: 开发者  
**前置条件**: 熟悉 TypeScript、Phaser 3、React  
**预计时间**: 15-20 分钟

本指南帮助开发者快速集成和使用真实世界地图可视化功能。

---

## 📦 1. 安装和设置

### 1.1 已安装的依赖

确认以下依赖已在 `package.json` 中：

```json
{
  "dependencies": {
    "phaser": "^3.80.1",
    "d3-geo": "^3.1.0",
    "topojson-client": "^3.1.0",
    "react": "^18.2.0",
    "zustand": "^4.4.7"
  }
}
```

### 1.2 添加地图数据文件

下载 World Atlas TopoJSON 数据并放置在 `app/public/maps/` 目录：

```bash
# 完整版本（50m 精度，约 2.5MB）
curl -o app/public/maps/world-countries.json \
  https://cdn.jsdelivr.net/npm/world-atlas@2/countries-50m.json

# 简化版本（110m 精度，约 700KB，用于降级）
curl -o app/public/maps/world-countries-simplified.json \
  https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json
```

---

## 🚀 2. 基础集成

### 2.1 加载地图数据

在 `WorldScene` 的 `preload()` 中加载地图数据：

```typescript
// app/src/scenes/world/WorldScene.ts
import { MapDataLoader } from './MapDataLoader';

class WorldScene extends Phaser.Scene {
  private mapDataLoader!: MapDataLoader;
  private countries: Country[] = [];

  preload() {
    console.log('Loading map data...');
    // Phaser 会自动处理异步加载
  }

  async create() {
    // 初始化地图加载器
    this.mapDataLoader = new MapDataLoader();

    try {
      // 加载地图数据（支持缓存）
      this.countries = await this.mapDataLoader.loadMapData(
        '/maps/world-countries.json',
        {
          enableCache: true,
          cacheDuration: 7, // 天
          useWorker: true   // 后台解析
        }
      );

      console.log(`✅ Loaded ${this.countries.length} countries`);

      // 初始化渲染器和交互处理器
      this.initializeRenderer();
      this.initializeInteraction();
    } catch (error) {
      console.error('❌ Failed to load map data:', error);
      // 降级到简化地图
      await this.loadFallbackMap();
    }
  }
}
```

### 2.2 渲染地图

创建 `MapRenderer` 实例并渲染国家：

```typescript
// app/src/scenes/world/WorldScene.ts (续)
import { MapRenderer } from './MapRenderer';
import { useGameStore } from '@core/state/store';

class WorldScene extends Phaser.Scene {
  private mapRenderer!: MapRenderer;

  initializeRenderer() {
    // 初始化渲染器
    this.mapRenderer = new MapRenderer();
    this.mapRenderer.initialize(this, {
      useWebGL: true,
      fillAlpha: 0.7,
      enableTransition: true,
      transitionDuration: 500
    });

    // 首次渲染
    this.renderMap();

    // 监听游戏状态变化
    useGameStore.subscribe((state) => {
      this.onGameStateChanged(state);
    });
  }

  renderMap() {
    const { territoryStates, colorMappings } = useGameStore.getState();

    const stats = this.mapRenderer.render(
      this.countries,
      territoryStates,
      colorMappings
    );

    console.log(`Rendered ${stats.countriesRendered} countries in ${stats.renderTime}ms`);
    console.log(`FPS: ${stats.fps}`);
  }

  onGameStateChanged(state: GameState) {
    // 只更新变化的国家（性能优化）
    const changedCountries = this.detectChanges(state);
    for (const countryId of changedCountries) {
      const territoryState = state.territoryStates.get(countryId);
      const colorMapping = state.colorMappings.get(territoryState?.ownerId || 'neutral');
      
      if (territoryState && colorMapping) {
        this.mapRenderer.updateCountry(countryId, territoryState, colorMapping);
      }
    }
  }
}
```

### 2.3 添加交互

创建 `MapInteractionHandler` 处理用户交互：

```typescript
// app/src/scenes/world/WorldScene.ts (续)
import { MapInteractionHandler } from './MapInteractionHandler';

class WorldScene extends Phaser.Scene {
  private interactionHandler!: MapInteractionHandler;

  initializeInteraction() {
    // 初始化交互处理器
    this.interactionHandler = new MapInteractionHandler(this.countries);
    this.interactionHandler.initialize(this, {
      enableClick: true,
      enableHover: true,
      enableZoom: true,
      enableDrag: true,
      hoverDelay: 300
    });

    // 监听交互事件
    this.interactionHandler.on('hover', (event) => {
      if (event.payload.countryId) {
        this.mapRenderer.highlightCountry(event.payload.countryId, 'hover');
        this.showCountryTooltip(event.payload.countryId, event.payload.position);
      } else {
        this.mapRenderer.highlightCountry(null, 'hover');
        this.hideCountryTooltip();
      }
    });

    this.interactionHandler.on('click', (event) => {
      if (event.payload.countryId) {
        const store = useGameStore.getState();
        store.selectTerritory(event.payload.countryId);
        this.mapRenderer.highlightCountry(event.payload.countryId, 'select');
      }
    });

    this.interactionHandler.on('zoom', (event) => {
      this.updateLOD(event.payload.zoom);
    });
  }

  showCountryTooltip(countryId: string, position: Point) {
    const country = this.countries.find(c => c.id === countryId);
    const state = useGameStore.getState().territoryStates.get(countryId);
    
    if (country && state) {
      // 显示 React 组件或 DOM 提示
      const commander = useGameStore.getState().commanders.find(c => c.id === state.ownerId);
      console.log(`Tooltip: ${country.name} - ${commander?.name || '中立'}`);
    }
  }

  updateLOD(zoom: number) {
    let lodLevel: 0 | 1 | 2 = 0;
    if (zoom > 2.0) lodLevel = 0;
    else if (zoom > 0.5) lodLevel = 1;
    else lodLevel = 2;

    console.log(`LOD Level: ${lodLevel}, Zoom: ${zoom.toFixed(2)}`);
    // 根据 LOD 级别切换地图数据
  }
}
```

---

## 🎨 3. 自定义颜色方案

### 3.1 定义指挥官颜色

在游戏初始化时设置颜色映射：

```typescript
// app/src/core/session/startSession.ts
import type { CommanderColor } from '@core/types';

export function startSession(seed?: string): void {
  // ... 现有代码 ...

  // 定义颜色方案
  const colorMappings = new Map<string, CommanderColor>([
    ['napoleon', {
      commanderId: 'napoleon',
      primary: 0x0066CC,      // 法国蓝
      secondary: 0x003D7A,
      alpha: 0.7,
      pattern: 'stripes',
      label: '拿',
      glowColor: 0x0088FF,
      pulseSpeed: 1000
    }],
    ['qin-shi-huang', {
      commanderId: 'qin-shi-huang',
      primary: 0xCC0000,      // 中国红
      secondary: 0x7A0000,
      alpha: 0.7,
      pattern: 'dots',
      label: '秦'
    }],
    // ... 其他指挥官 ...
  ]);

  // 保存到状态
  useGameStore.getState().setColorMappings(colorMappings);
}
```

### 3.2 支持色盲模式

添加纹理图案作为颜色的备选：

```typescript
// app/src/scenes/world/MapRenderer.ts
class MapRenderer {
  renderCountryWithPattern(
    country: Country,
    color: number,
    pattern: string
  ) {
    // 1. 填充颜色
    this.graphics.fillStyle(color, 0.7);
    this.graphics.fillPath();

    // 2. 叠加纹理图案
    if (pattern) {
      this.graphics.lineStyle(1, 0x000000, 0.3);
      this.drawPattern(country.geometry, pattern);
    }
  }

  drawPattern(geometry: MultiPolygon, pattern: string) {
    switch (pattern) {
      case 'stripes':
        // 绘制斜线纹理
        break;
      case 'dots':
        // 绘制点纹理
        break;
      // ... 其他图案 ...
    }
  }
}
```

---

## ⚡ 4. 性能优化

### 4.1 视口裁剪

只渲染摄像机可见区域内的国家：

```typescript
// app/src/scenes/world/WorldScene.ts
class WorldScene extends Phaser.Scene {
  update(time: number, delta: number) {
    // 更新可见国家列表
    const cameraViewport = this.cameras.main.worldView;
    const visibleCountries = this.getVisibleCountries(cameraViewport);

    // 只渲染可见国家
    this.mapRenderer.render(visibleCountries, ...);
  }

  getVisibleCountries(viewport: BoundingBox): Country[] {
    return this.countries.filter(country => {
      return this.bboxIntersects(country.bbox, viewport);
    });
  }

  bboxIntersects(a: BoundingBox, b: BoundingBox): boolean {
    return !(
      a.maxX < b.minX ||
      a.minX > b.maxX ||
      a.maxY < b.minY ||
      a.minY > b.maxY
    );
  }
}
```

### 4.2 对象池

使用对象池避免频繁创建/销毁 Graphics 对象：

```typescript
// app/src/scenes/world/GraphicsPool.ts
export class GraphicsPool {
  private pool: Phaser.GameObjects.Graphics[] = [];
  private scene: Phaser.Scene;
  private readonly maxSize: number;

  constructor(scene: Phaser.Scene, maxSize = 200) {
    this.scene = scene;
    this.maxSize = maxSize;
  }

  acquire(): Phaser.GameObjects.Graphics {
    if (this.pool.length > 0) {
      return this.pool.pop()!;
    }
    return this.scene.add.graphics();
  }

  release(graphics: Phaser.GameObjects.Graphics): void {
    if (this.pool.length < this.maxSize) {
      graphics.clear();
      graphics.setVisible(false);
      this.pool.push(graphics);
    } else {
      graphics.destroy();
    }
  }
}
```

### 4.3 性能监控

实时监控 FPS 和渲染时间：

```typescript
// app/src/scenes/world/WorldScene.ts
class WorldScene extends Phaser.Scene {
  private performanceMonitor = {
    fps: 60,
    renderTime: 0,
    frameCount: 0,
    lastTime: 0
  };

  update(time: number, delta: number) {
    // 更新 FPS
    this.performanceMonitor.frameCount++;
    if (time - this.performanceMonitor.lastTime >= 1000) {
      this.performanceMonitor.fps = this.performanceMonitor.frameCount;
      this.performanceMonitor.frameCount = 0;
      this.performanceMonitor.lastTime = time;

      // 根据 FPS 自适应调整
      if (this.performanceMonitor.fps < 30) {
        console.warn('⚠️ Low FPS detected, disabling animations');
        this.mapRenderer.setEnableAnimation(false);
      }
    }

    // 测量渲染时间
    const startTime = performance.now();
    this.renderMap();
    this.performanceMonitor.renderTime = performance.now() - startTime;

    // 更新 HUD
    useGameStore.getState().updatePerformance({
      fps: this.performanceMonitor.fps,
      tickMs: this.performanceMonitor.renderTime
    });
  }
}
```

---

## 🧪 5. 测试

### 5.1 单元测试示例

```typescript
// tests/unit/map-data-loader.spec.ts
import { describe, it, expect } from 'vitest';
import { MapDataLoader } from '@scenes/world/MapDataLoader';

describe('MapDataLoader', () => {
  it('should load and parse TopoJSON data', async () => {
    const loader = new MapDataLoader();
    const countries = await loader.loadMapData('/test/sample-map.json');

    expect(countries).toHaveLength(193);
    expect(countries[0]).toHaveProperty('id');
    expect(countries[0]).toHaveProperty('name');
    expect(countries[0]).toHaveProperty('geometry');
  });

  it('should calculate bounding boxes correctly', async () => {
    const loader = new MapDataLoader();
    const countries = await loader.loadMapData('/test/sample-map.json');

    const china = countries.find(c => c.id === 'CHN');
    expect(china).toBeDefined();
    expect(china!.bbox.minX).toBeLessThan(china!.bbox.maxX);
    expect(china!.bbox.minY).toBeLessThan(china!.bbox.maxY);
  });
});
```

### 5.2 E2E 测试示例

```typescript
// tests/e2e/us1-view-world-map.spec.ts
import { test, expect } from '@playwright/test';

test('US1: 用户应该能看到真实世界地图', async ({ page }) => {
  await page.goto('http://localhost:5173');

  // 点击开始按钮
  await page.click('button:has-text("开始征服")');

  // 等待地图加载
  await page.waitForTimeout(3000);

  // 验证地图可见（通过截图对比或 Canvas 内容检测）
  const canvas = await page.locator('canvas').first();
  expect(canvas).toBeVisible();

  // 验证可以识别国家（通过悬停提示）
  await page.mouse.move(500, 300);
  await page.waitForTimeout(500);

  // 应该显示国家提示
  const tooltip = await page.locator('.country-tooltip');
  await expect(tooltip).toBeVisible();
});
```

---

## 🐛 6. 调试技巧

### 6.1 启用详细日志

```typescript
// app/src/scenes/world/MapDataLoader.ts
const DEBUG = true;

if (DEBUG) {
  console.log('Loading map data from:', dataUrl);
  console.log('Countries loaded:', countries.length);
  console.log('Load time:', loadTime, 'ms');
}
```

### 6.2 可视化调试

在开发模式下绘制边界框和网格：

```typescript
// app/src/scenes/world/WorldScene.ts
class WorldScene extends Phaser.Scene {
  renderDebugInfo() {
    if (process.env.NODE_ENV !== 'development') return;

    const debugGraphics = this.add.graphics();
    debugGraphics.lineStyle(1, 0xFF0000, 0.5);

    // 绘制所有国家的边界框
    for (const country of this.countries) {
      debugGraphics.strokeRect(
        country.bbox.minX,
        country.bbox.minY,
        country.bbox.maxX - country.bbox.minX,
        country.bbox.maxY - country.bbox.minY
      );
    }

    // 绘制空间网格
    debugGraphics.lineStyle(1, 0x00FF00, 0.3);
    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 16; col++) {
        const x = col * (this.worldWidth / 16);
        const y = row * (this.worldHeight / 8);
        debugGraphics.strokeRect(x, y, this.worldWidth / 16, this.worldHeight / 8);
      }
    }
  }
}
```

---

## 📚 7. 常见问题

### Q1: 地图加载很慢怎么办？

**A**: 使用缓存和 Web Worker：

```typescript
const countries = await loader.loadMapData('/maps/world-countries.json', {
  enableCache: true,      // 启用 IndexedDB 缓存
  useWorker: true,        // 后台解析
  timeout: 10000          // 增加超时时间
});
```

### Q2: FPS 低于 30 怎么办？

**A**: 启用性能降级：

```typescript
if (this.performanceMonitor.fps < 30) {
  // 1. 禁用动画
  this.mapRenderer.setEnableAnimation(false);

  // 2. 切换到简化地图
  this.loadSimplifiedMap();

  // 3. 减少渲染对象
  this.setVisibleCountriesLimit(50);
}
```

### Q3: 如何添加新的国家数据？

**A**: 编辑 GeoJSON 文件并更新缓存：

```bash
# 1. 编辑地图数据
vim app/public/maps/world-countries.json

# 2. 清除缓存
# 在浏览器开发者工具中：Application -> IndexedDB -> map-data-cache -> 删除
```

---

## 🎓 8. 下一步

- 阅读 [data-model.md](./data-model.md) 了解数据结构
- 查看 [contracts/](./contracts/) 了解接口定义
- 运行 `pnpm test` 执行测试套件
- 查看 [research.md](./research.md) 了解技术决策

---

**需要帮助？** 查看项目 README 或提交 Issue。

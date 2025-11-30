# Data Model: 真实世界地图可视化

**Date**: 2025-11-30  
**Phase**: Phase 1 - Design  
**Status**: Complete

本文档定义了真实世界地图可视化功能的核心数据实体、关系和状态转换规则。

---

## 实体概览

```
┌─────────────┐         ┌──────────────────┐         ┌─────────────────┐
│   Country   │◄────────│  TerritoryState  │────────►│ CommanderColor  │
│             │  1..193 │                  │  1..10  │                 │
│ - id        │         │ - countryId      │         │ - commanderId   │
│ - name      │         │ - ownerId        │         │ - color         │
│ - geometry  │         │ - troops         │         │ - pattern       │
│ - bbox      │         │ - updatedAt      │         └─────────────────┘
│ - neighbors │         └──────────────────┘
└─────────────┘                  │
       │                         │
       │                         ▼
       │                ┌──────────────────┐
       │                │   MapRenderState │
       │                │                  │
       └───────────────►│ - visibleIds     │
                        │ - zoom           │
                        │ - lodLevel       │
                        │ - cameraViewport │
                        └──────────────────┘
```

---

## 实体 1：Country（国家）

代表地图上的一个可占领单位，包含地理边界和元数据。

### 字段定义

```typescript
interface Country {
  // 唯一标识
  id: string; // ISO 3166-1 alpha-3 国家代码（如 "CHN", "USA"）

  // 显示信息
  name: string; // 国家名称（如 "中国", "美国"）
  nameEn: string; // 英文名称（用于调试和日志）

  // 地理数据
  geometry: MultiPolygon; // GeoJSON MultiPolygon 格式的边界坐标
  centroid: Point; // 国家中心点（用于放置标签或图标）
  bbox: BoundingBox; // 边界框（用于快速碰撞检测）
  area: number; // 面积（平方千米，用于排序或筛选）

  // 拓扑关系
  neighbors: string[]; // 相邻国家的 ID 列表

  // 渲染优化
  simplifiedGeometry?: MultiPolygon; // 简化版本几何数据（LOD 使用）
  gridCells: number[]; // 所属网格单元 ID（空间索引）
}

// 辅助类型
interface Point {
  x: number; // 经度或屏幕 X 坐标
  y: number; // 纬度或屏幕 Y 坐标
}

interface BoundingBox {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
}

interface MultiPolygon {
  type: 'MultiPolygon';
  coordinates: number[][][][]; // GeoJSON 标准格式
}
```

### 验证规则

- `id`: 必须是有效的 ISO 3166-1 alpha-3 代码（3 个大写字母）
- `name`: 非空字符串，长度 1-50
- `geometry`: 必须是有效的 GeoJSON MultiPolygon，至少包含 1 个多边形
- `bbox`: minX < maxX, minY < maxY
- `area`: > 0
- `neighbors`: 列表中的每个 ID 必须存在于 Country 集合中
- `gridCells`: 非空数组，每个 cell ID 在有效范围内（0 - 127）

### 数据来源

- **主要来源**: World Atlas TopoJSON 50m 数据集
- **转换流程**:
  1. 使用 `topojson-client` 解析 TopoJSON
  2. 转换为 GeoJSON MultiPolygon
  3. 计算 centroid（使用 d3-geo `geoCentroid`）
  4. 计算 bbox（遍历所有顶点）
  5. 构建 neighbors 列表（TopoJSON 拓扑信息）
  6. 分配到 Grid cells（根据 bbox 与网格相交）

### 示例数据

```json
{
  "id": "CHN",
  "name": "中国",
  "nameEn": "China",
  "geometry": {
    "type": "MultiPolygon",
    "coordinates": [[[[120.5, 35.2], [121.0, 35.5], ...]]]
  },
  "centroid": { "x": 104.1954, "y": 35.8617 },
  "bbox": { "minX": 73.5, "minY": 18.2, "maxX": 135.1, "maxY": 53.6 },
  "area": 9596961,
  "neighbors": ["RUS", "MNG", "PRK", "IND", "NPL", "BTN", ...],
  "gridCells": [52, 53, 60, 61, 68, 69]
}
```

---

## 实体 2：TerritoryState（领土状态）

记录当前每个国家的占领者和游戏状态，连接 Country（地理）和 Commander（游戏逻辑）。

### 字段定义

```typescript
interface TerritoryState {
  // 关联
  countryId: string; // Country.id 外键
  ownerId: string | null; // Commander.id，null 表示中立

  // 游戏数据
  troops: number; // 当前驻军数量
  resources: number; // 资源储备
  defense: number; // 防御力（基础值 + 地形修正）

  // 状态追踪
  updatedAt: number; // 最后更新时间戳（ms）
  conqueredAt: number | null; // 被当前 owner 占领的时间戳
  previousOwnerId: string | null; // 前任占领者（用于颜色过渡动画）

  // 渲染状态
  transitionProgress: number; // 颜色过渡进度 (0-1)，null 表示无过渡
  isHighlighted: boolean; // 是否高亮（用户选中或悬停）
}
```

### 验证规则

- `countryId`: 必须存在于 Country 集合中
- `ownerId`: 必须是有效的 Commander ID 或 null
- `troops`: ≥ 0
- `resources`: ≥ 0
- `defense`: 0-100
- `updatedAt`: 有效的 Unix 时间戳（ms）
- `transitionProgress`: 0-1 或 null

### 状态转换

```
┌──────────┐  占领  ┌──────────┐  被攻陷  ┌──────────┐
│  中立    │───────►│  占领中  │─────────►│  易手    │
│ owner=null │        │ owner=A  │          │ owner=B  │
└──────────┘        └──────────┘          └──────────┘
     ▲                                          │
     │                                          │
     └───────────── 被消灭 ─────────────────────┘
               owner 失去所有领土
```

#### 状态转换规则

1. **中立 → 占领中**
   - 触发：游戏初始化或 owner 被消灭
   - 前置条件：`ownerId === null`
   - 后置条件：`ownerId = commanderId`, `conqueredAt = now()`, `previousOwnerId = null`

2. **占领中 → 易手**
   - 触发：战斗结算，防守方失败
   - 前置条件：`troops < attackingTroops`
   - 后置条件：
     - `previousOwnerId = ownerId`
     - `ownerId = attackerId`
     - `conqueredAt = now()`
     - `transitionProgress = 0`（开始颜色过渡动画）
     - `troops = attackingTroops - defenderTroops`

3. **易手 → 稳定占领**
   - 触发：颜色过渡动画完成（0.5-1 秒后）
   - 前置条件：`transitionProgress === 1`
   - 后置条件：`previousOwnerId = null`, `transitionProgress = null`

4. **任意状态 → 中立**
   - 触发：owner 被消灭（失去所有领土）
   - 前置条件：`ownerId` 的所有 TerritoryState 都被其他人占领
   - 后置条件：`ownerId = null`, `conqueredAt = null`

### 示例数据

```json
{
  "countryId": "CHN",
  "ownerId": "qin-shi-huang",
  "troops": 15000,
  "resources": 8500,
  "defense": 75,
  "updatedAt": 1701345678000,
  "conqueredAt": 1701340000000,
  "previousOwnerId": null,
  "transitionProgress": null,
  "isHighlighted": false
}
```

---

## 实体 3：CommanderColor（指挥官颜色映射）

定义每个指挥官的视觉表现（颜色、纹理），确保地图上领土可区分。

### 字段定义

```typescript
interface CommanderColor {
  // 关联
  commanderId: string; // Commander.id 外键

  // 颜色方案
  primary: number; // 主要填充颜色（Phaser 颜色格式：0xRRGGBB）
  secondary: number; // 次要颜色（边界或高亮）
  alpha: number; // 透明度（0-1）

  // 可访问性
  pattern?: string; // 纹理图案名称（用于色盲模式）
  label?: string; // 单字符标签（如 "秦"、"拿"）

  // 动画
  glowColor?: number; // 发光效果颜色（选中时）
  pulseSpeed?: number; // 脉冲速度（ms，选中时）
}
```

### 验证规则

- `commanderId`: 必须是有效的 Commander ID
- `primary`: 有效的 24 位颜色值（0x000000 - 0xFFFFFF）
- `secondary`: 有效的 24 位颜色值
- `alpha`: 0-1
- `pattern`: 如果存在，必须是预定义的纹理名称之一

### 颜色方案设计

**设计原则**：

1. **高对比度**: 相邻领土颜色明显区分（WCAG AA 对比度 ≥ 4.5:1）
2. **色盲友好**: 避免纯红绿组合，提供纹理备选
3. **文化适配**: 尊重历史人物的地域或象征颜色

**预定义 10 种颜色**：

| 指挥官     | primary          | secondary | 纹理      | 理由     |
| ---------- | ---------------- | --------- | --------- | -------- |
| 拿破仑     | 0x0066CC（蓝）   | 0x003D7A  | stripes   | 法国蓝   |
| 秦始皇     | 0xCC0000（红）   | 0x7A0000  | dots      | 中国红   |
| 克娄巴特拉 | 0xFFCC00（金黄） | 0xB8860B  | waves     | 埃及金   |
| 成吉思汗   | 0x008800（绿）   | 0x004D00  | triangles | 草原绿   |
| 亚历山大   | 0x9933FF（紫）   | 0x5B1F99  | grid      | 皇家紫   |
| 凯撒       | 0xFF6600（橙）   | 0xB84700  | circles   | 罗马橙   |
| 阿提拉     | 0x663300（棕）   | 0x3D1F00  | crosses   | 匈奴棕   |
| 萨拉丁     | 0x00AA88（青绿） | 0x006655  | diamonds  | 阿拉伯青 |
| 维多利亚   | 0xFF0066（玫红） | 0x99003D  | hexagons  | 英国玫瑰 |
| 俾斯麦     | 0x666666（灰）   | 0x333333  | checkers  | 铁血灰   |

### 色盲模式映射

```typescript
const colorBlindPatterns = {
  stripes: 'diagonal-lines', // 斜线纹理
  dots: 'small-circles', // 小圆点
  waves: 'wavy-lines', // 波浪线
  triangles: 'up-triangles', // 向上三角
  grid: 'square-grid', // 方格
  circles: 'large-circles', // 大圆圈
  crosses: 'cross-hatch', // 交叉线
  diamonds: 'diamond-shape', // 钻石形
  hexagons: 'hexagon-tiles', // 六边形
  checkers: 'checkerboard', // 棋盘格
};
```

### 示例数据

```json
{
  "commanderId": "qin-shi-huang",
  "primary": 0xcc0000,
  "secondary": 0x7a0000,
  "alpha": 0.7,
  "pattern": "dots",
  "label": "秦",
  "glowColor": 0xff0000,
  "pulseSpeed": 1000
}
```

---

## 实体 4：MapRenderState（地图渲染状态）

管理地图渲染的全局状态，用于优化和交互。

### 字段定义

```typescript
interface MapRenderState {
  // 视口
  cameraViewport: BoundingBox; // 摄像机可见区域（世界坐标）
  zoom: number; // 当前缩放级别（0.5x - 5x）

  // LOD 系统
  lodLevel: 0 | 1 | 2; // 当前细节级别
  // 0: 完整 193 国家（zoom > 2x）
  // 1: 简化 193 国家（0.5x < zoom ≤ 2x）
  // 2: 50 区域（zoom ≤ 0.5x）

  // 可见性
  visibleCountryIds: string[]; // 当前帧需要渲染的 Country ID 列表
  gridCellsInView: number[]; // 可见的网格单元 ID

  // 交互
  hoveredCountryId: string | null; // 鼠标悬停的国家
  selectedCountryId: string | null; // 用户选中的国家

  // 性能
  lastFrameTime: number; // 上一帧渲染时间（ms）
  averageFps: number; // 平均帧率（滑动窗口）
  enableAnimation: boolean; // 是否启用动画（根据性能动态调整）
}
```

### 验证规则

- `zoom`: 0.5 - 5.0
- `lodLevel`: 0, 1, or 2
- `visibleCountryIds`: 列表中的每个 ID 必须存在
- `lastFrameTime`: ≥ 0
- `averageFps`: 0 - 240

### LOD 切换逻辑

```typescript
function updateLodLevel(zoom: number): 0 | 1 | 2 {
  if (zoom > 2.0) return 0; // 完整细节
  if (zoom > 0.5) return 1; // 中等细节
  return 2; // 低细节（简化地图）
}
```

### 可见性计算

```typescript
function updateVisibleCountries(
  cameraViewport: BoundingBox,
  grid: SpatialGrid,
  countries: Map<string, Country>
): string[] {
  // 1. 找到视口内的网格单元
  const cellsInView = grid.getCellsInBounds(cameraViewport);

  // 2. 收集这些单元中的所有国家
  const candidateIds = new Set<string>();
  for (const cellId of cellsInView) {
    for (const countryId of grid.getCountriesInCell(cellId)) {
      candidateIds.add(countryId);
    }
  }

  // 3. 精确检测（Bounding Box 相交）
  const visibleIds: string[] = [];
  for (const id of candidateIds) {
    const country = countries.get(id)!;
    if (bboxIntersects(country.bbox, cameraViewport)) {
      visibleIds.push(id);
    }
  }

  return visibleIds;
}
```

### 性能自适应

```typescript
function updateAnimationSetting(averageFps: number): boolean {
  if (averageFps > 55) return true; // High: 启用全部动画
  if (averageFps > 45) return true; // Medium: 启用动画但缩短时间
  return false; // Low: 禁用动画
}
```

### 示例数据

```json
{
  "cameraViewport": {
    "minX": 60, "minY": 20, "maxX": 140, "maxY": 60
  },
  "zoom": 1.5,
  "lodLevel": 1,
  "visibleCountryIds": ["CHN", "RUS", "MNG", "JPN", "KOR", ...],
  "gridCellsInView": [52, 53, 60, 61, 68, 69],
  "hoveredCountryId": "CHN",
  "selectedCountryId": null,
  "lastFrameTime": 14.5,
  "averageFps": 60,
  "enableAnimation": true
}
```

---

## 辅助数据结构

### SpatialGrid（空间网格索引）

```typescript
interface SpatialGrid {
  cols: number; // 网格列数（16）
  rows: number; // 网格行数（8）
  cellWidth: number; // 单元格宽度（世界坐标）
  cellHeight: number; // 单元格高度
  cells: Map<number, Set<string>>; // cellId -> countryIds
}

// 使用示例
const grid = new SpatialGrid(16, 8, worldBounds);
grid.addCountry(country);
const countriesInCell = grid.getCountriesInCell(52);
```

### ColorLerpState（颜色插值状态）

```typescript
interface ColorLerpState {
  countryId: string;
  fromColor: number; // 旧颜色
  toColor: number; // 新颜色
  startTime: number; // 开始时间戳
  duration: number; // 持续时间（ms）
  easing: 'linear' | 'easeInOut'; // 缓动函数
}

// 计算当前颜色
function getCurrentColor(state: ColorLerpState, now: number): number {
  const progress = Math.min(1, (now - state.startTime) / state.duration);
  const t = state.easing === 'linear' ? progress : easeInOut(progress);
  return lerpColor(state.fromColor, state.toColor, t);
}
```

---

## 关系总结

### 一对多关系

- **Country 1 ↔ N TerritoryState**: 每个国家在不同游戏局中有不同的占领状态
- **Commander 1 ↔ N TerritoryState**: 每个指挥官可以占领多个国家
- **Commander 1 ↔ 1 CommanderColor**: 每个指挥官有唯一的颜色配置

### 级联更新

1. **领土易手**:

   ```
   BattleSystem → TerritoryState.ownerId 更新
     → 触发 ColorLerpState 创建
       → 触发 MapRenderer 重绘
   ```

2. **摄像机移动**:

   ```
   User Input → Camera.setScroll()
     → MapRenderState.cameraViewport 更新
       → updateVisibleCountries()
         → MapRenderer 仅渲染可见国家
   ```

3. **指挥官消灭**:
   ```
   VictorySystem → Commander.eliminated = true
     → 批量更新 TerritoryState.ownerId = null
       → 批量移除颜色填充
         → 显示中立色（灰色）
   ```

---

## 存储策略

### 内存存储（Zustand Store）

```typescript
interface MapStore {
  countries: Map<string, Country>; // 地图数据（加载后不变）
  territoryStates: Map<string, TerritoryState>; // 动态游戏状态
  renderState: MapRenderState; // 渲染状态
  colorMappings: Map<string, CommanderColor>; // 颜色配置
}
```

### 持久化存储（IndexedDB）

```typescript
// 缓存地图数据，加速二次加载
interface MapDataCache {
  version: string; // 数据版本（如 "world-atlas-50m-v1"）
  countries: Country[];
  cachedAt: number; // 缓存时间戳
  expiresAt: number; // 过期时间（7 天后）
}
```

---

## 性能考虑

### 内存占用估算

| 数据           | 数量      | 单项大小 | 总计        |
| -------------- | --------- | -------- | ----------- |
| Country        | 193       | ~50KB    | ~10MB       |
| TerritoryState | 193       | ~200B    | ~40KB       |
| CommanderColor | 10        | ~100B    | ~1KB        |
| MapRenderState | 1         | ~5KB     | ~5KB        |
| SpatialGrid    | 128 cells | ~50KB    | ~50KB       |
| **总计**       |           |          | **~10.1MB** |

符合 ≤ 50MB 内存增量预算。

### 更新频率

| 操作       | 频率    | 影响范围                      |
| ---------- | ------- | ----------------------------- |
| 渲染帧     | 60 FPS  | visibleCountryIds（~60 个）   |
| 领土更新   | ~1/秒   | 单个 TerritoryState           |
| 摄像机移动 | ~10 FPS | MapRenderState.cameraViewport |
| 交互检测   | ~60 FPS | hoveredCountryId              |

---

## 下一步：API 契约

基于以上数据模型，Phase 1 的下一步是生成 API 契约（`contracts/`），定义数据加载、状态更新、交互事件的接口规范。

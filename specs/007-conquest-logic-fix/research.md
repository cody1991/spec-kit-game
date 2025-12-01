# Research: 真实领土面积数据

**Date**: 2025-12-01  
**Feature**: 007-conquest-logic-fix  
**Focus**: 获取并集成真实的国家领土面积数据

## 问题背景

当前游戏中的国家面积数据是通过 `calculateArea()` 函数基于 Shoelace 公式计算的多边形面积，返回的是**平方度数**而非真实的平方公里数。这导致面积显示不准确，影响游戏体验。

## 研究发现

### 1. 当前数据结构

- **地图数据文件**: `app/public/maps/world-countries.json` (TopoJSON 格式)
- **国家数量**: 241 个
- **属性字段**: 只有 `name` 属性，没有面积数据
- **面积计算**: `MapDataLoader.ts` 使用 `geoUtils.calculateArea()` 计算几何面积

### 2. 真实面积数据源

**选择**: [samayo/country-json](https://github.com/samayo/country-json)

- **数据文件**: `country-by-surface-area.json`
- **国家数量**: 240 个
- **数据格式**: `{ "country": "China", "area": 9572900.00 }`
- **单位**: 平方公里 (km²)

**替代方案考虑**:
- REST Countries API - 需要网络请求，增加延迟
- World Bank Data - 数据格式复杂
- Natural Earth - 需要额外处理

**选择理由**: 静态 JSON 数据，无网络依赖，数据完整，易于集成

### 3. 名称匹配问题

地图数据中的国家名称与面积数据源存在差异，需要建立映射关系：

| 地图名称 | 面积数据名称 |
|---------|-------------|
| United States of America | United States |
| Dem. Rep. Congo | Congo, Democratic Republic of the |
| Czech Rep. | Czech Republic |
| Bosnia and Herz. | Bosnia and Herzegovina |
| ... | ... |

**解决方案**: 创建 `name_mapping` 字典处理名称差异

### 4. 特殊地区处理

部分地区在面积数据源中缺失，使用估计值：

| 地区 | 面积 (km²) | 来源 |
|-----|-----------|------|
| Kosovo | 10,887 | Wikipedia |
| Somaliland | 176,120 | Wikipedia |
| Vatican | 0.44 | Official |
| N. Cyprus | 3,355 | Wikipedia |

## 决策

### Decision 1: 数据存储方式

**选择**: 静态 TypeScript 文件 (`countryAreas.ts`)

**理由**:
- 编译时类型检查
- 无运行时网络请求
- Tree-shaking 友好
- 易于维护和更新

**替代方案**: 
- JSON 文件 + 动态导入 - 增加异步复杂度
- 嵌入 TopoJSON - 需要修改地图数据格式

### Decision 2: 面积数据使用位置

**选择**: 
1. `MapDataLoader.ts` - 加载时赋值给 `Country.area`
2. `CountryDetailPanel.tsx` - 显示国家详情时展示面积
3. `FactionStatsPanel.tsx` - 已有面积显示，使用 `Country.area`

### Decision 3: 面积格式化

**选择**: 
- ≥ 1,000,000 km² → "X.XXM km²" (如 "9.57M km²")
- ≥ 1,000 km² → "X.XK km²" (如 "18.3K km²")
- < 1,000 km² → "X km²" (如 "444 km²")

## 实现方案

### 文件变更

1. **新增**: `app/src/data/countryAreas.ts`
   - 导出 `COUNTRY_AREAS: Record<string, number>`
   - 包含 241 个国家的真实面积数据

2. **修改**: `app/src/scenes/world/data/MapDataLoader.ts`
   - 导入 `COUNTRY_AREAS`
   - 使用真实面积替代计算面积

3. **修改**: `app/src/ui/panels/CountryDetailPanel.tsx`
   - 添加面积显示
   - 添加 `formatArea()` 函数

4. **修改**: `app/src/ui/panels/CountryDetailPanel.css`
   - 添加 `.area-value` 样式

### 数据生成脚本

创建 `scripts/generate-country-areas.py`:
- 读取地图数据获取国家列表
- 下载面积数据源
- 处理名称映射
- 生成 TypeScript 文件

## 验证计划

1. **单元测试**: 验证所有地图国家都有面积数据
2. **集成测试**: 验证 `FactionStatsPanel` 显示正确的总面积
3. **视觉验证**: 检查 `CountryDetailPanel` 面积显示格式

## 参考资料

- [samayo/country-json](https://github.com/samayo/country-json)
- [ISO 3166-1](https://en.wikipedia.org/wiki/ISO_3166-1)
- [World countries by area](https://en.wikipedia.org/wiki/List_of_countries_and_dependencies_by_area)

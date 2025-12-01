# Implementation Plan: 领主占领逻辑修复 + 真实领土面积

**Branch**: `007-conquest-logic-fix` | **Date**: 2025-12-01 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/007-conquest-logic-fix/spec.md`

## Summary

本次实现包含两个主要目标：
1. **领主占领逻辑修复**: 确保领主初始化时必须拥有国家，占领倾向于相邻国家
2. **真实领土面积数据**: 集成真实的国家面积数据（km²），替代基于几何计算的近似值

技术方案：
- 使用静态 TypeScript 文件存储 241 个国家的真实面积数据
- 在 `MapDataLoader` 加载时赋值真实面积
- 在 `CountryDetailPanel` 和 `FactionStatsPanel` 中显示面积

## Technical Context

**Language/Version**: TypeScript 5.x, React 18.x  
**Primary Dependencies**: Phaser 3, Zustand, D3-geo, TopoJSON  
**Storage**: IndexedDB (地图缓存), Zustand store (游戏状态)  
**Testing**: Vitest  
**Target Platform**: Web (Chrome, Firefox, Safari)  
**Project Type**: Web application (单体前端)  
**Performance Goals**: 60 fps, 地图加载 < 3s  
**Constraints**: 纯前端，无后端依赖  
**Scale/Scope**: 241 个国家，50 个领主

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

1. **代码质量门禁**: ✅
   - ESLint + Prettier 自动格式化
   - TypeScript 严格模式
   - 新增代码保持现有风格

2. **测试门禁**: ✅
   - 现有测试通过 (`pnpm test`)
   - 面积数据完整性可通过构建验证

3. **体验门禁**: ✅
   - 面积显示格式化友好 (M/K km²)
   - 面板布局清晰

4. **性能门禁**: ✅
   - 静态数据，无运行时计算开销
   - Tree-shaking 友好

5. **可观测性门禁**: ✅
   - 控制台日志记录国家加载数量
   - 面积数据缺失时 fallback 为 0

## Project Structure

### Documentation (this feature)

```text
specs/007-conquest-logic-fix/
├── plan.md              # This file
├── research.md          # Phase 0 output - 面积数据研究
├── spec.md              # Feature specification
└── tasks.md             # Phase 2 output (待生成)
```

### Source Code (repository root)

```text
app/src/
├── data/
│   ├── countryAreas.ts          # NEW: 真实国家面积数据
│   └── mapData.ts               # 现有地图数据
├── scenes/world/
│   └── data/
│       └── MapDataLoader.ts     # MODIFIED: 使用真实面积
├── ui/panels/
│   ├── CountryDetailPanel.tsx   # MODIFIED: 显示面积
│   ├── CountryDetailPanel.css   # MODIFIED: 面积样式
│   └── FactionStatsPanel.tsx    # 已有面积显示
└── core/
    └── services/
        └── factionStatsService.ts # 使用 Country.area

scripts/
└── generate-country-areas.py    # NEW: 面积数据生成脚本
```

**Structure Decision**: 使用现有的单体前端结构，新增 `data/countryAreas.ts` 存储面积数据

## Implementation Status

### Phase 0: Research ✅

- [x] 研究真实面积数据源
- [x] 分析地图数据结构
- [x] 确定名称映射方案
- [x] 生成 `research.md`

### Phase 1: Implementation ✅

- [x] 创建 `countryAreas.ts` (241 个国家)
- [x] 修改 `MapDataLoader.ts` 使用真实面积
- [x] 修改 `CountryDetailPanel.tsx` 显示面积
- [x] 添加 CSS 样式
- [x] 构建验证通过

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
| --------- | ---------- | ------------------------------------ |
| 无 | - | - |

## Next Steps

1. 运行游戏验证面积显示
2. 继续实现领主占领逻辑修复（spec.md 中的其他需求）

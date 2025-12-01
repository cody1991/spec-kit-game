# spec-kit-game Development Guidelines

Auto-generated from all feature plans. Last updated: 2025-11-30

## Active Technologies

- TypeScript 5.4（严格模式，ESM） + Phaser 3.80（地图渲染）、React 18（UI面板）、Zustand 4（状态管理与订阅） (004-fix-battle-territory-bugs)
- IndexedDB（eventLog持久化）、Zustand内存存储（territories、territoryStates） (004-fix-battle-territory-bugs)
- TypeScript 5.4.x + React 18，构建/开发基于 Vite 5（ESM 模式） + React 18、Vite 5、Phaser 3.80（世界地图场景与战斗可视化）、Zustand（状态管理）、d3-geo + topojson-client（地图投影与地理数据）、idb（浏览器 IndexedDB 存储） (002-country-battle-logic)
- 浏览器内存为主，按需通过 `idb` 在 IndexedDB 中缓存地图与会话相关数据，无服务器端数据库 (002-country-battle-logic)
- TypeScript 5.x + React 18 (005-faction-stats)
- 内存存储（Zustand store），无持久化需求（统计数据基于当前游戏会话） (005-faction-stats)
- TypeScript 5.4.5 + React 18.2, Phaser 3.80, Zustand 4.4.7, Vite 5.0 (006-performance-optimization)
- N/A (内存状态管理) (006-performance-optimization)
- TypeScript 5.4.5 + React 18.2, Phaser 3.80, Zustand 4.4, d3-geo 3.1 (007-conquest-logic-fix)
- TypeScript 5.x, React 18.x + Phaser 3, Zustand, D3-geo, TopoJSON (007-conquest-logic-fix)
- IndexedDB (地图缓存), Zustand store (游戏状态) (007-conquest-logic-fix)
- TypeScript 5.4.5 + React 18.2, Zustand 4.4.7, Phaser 3.80.1, D3-geo 3.1.0 (008-territory-bonus)
- IndexedDB (idb 7.1.1) - 用于游戏状态持久化 (008-territory-bonus)

- TypeScript 5.4.5 (ES2020 target) (003-country-map-alignment)

- TypeScript 5.4（ESM，strictNullChecks on） + Phaser 3.80（世界地图渲染与摄像机）；React 18 + React DOM（UI 面板）；Zustand 4（全局状态与回放缓存）；d3-geo + topojson-client（投影与地图简化）；idb 7（IndexedDB 封装）；Vite 5（构建）；Vitest + Testing Library + Playwright（测试栈） (001-historic-conquest)

## Project Structure

```text
src/
tests/
```

## Commands

npm test && npm run lint

## Code Style

TypeScript 5.4（ESM，strictNullChecks on）: Follow standard conventions

## Recent Changes

- 008-territory-bonus: Added TypeScript 5.4.5 + React 18.2, Zustand 4.4.7, Phaser 3.80.1, D3-geo 3.1.0
- 007-conquest-logic-fix: Added TypeScript 5.x, React 18.x + Phaser 3, Zustand, D3-geo, TopoJSON
- 007-conquest-logic-fix: Added TypeScript 5.4.5 + React 18.2, Phaser 3.80, Zustand 4.4, d3-geo 3.1

<!-- MANUAL ADDITIONS START -->
<!-- MANUAL ADDITIONS END -->

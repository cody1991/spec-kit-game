# Quickstart — Historic World Conquest Simulator

## Prerequisites
1. **Node.js 20.x + PNPM 8**（启用 `corepack enable`）。  
2. **mapshaper CLI** (`npm i -g mapshaper`)：用于将 Natural Earth 数据转换为 TopoJSON。  
3. **Playwright Browsers**：`pnpm exec playwright install`。  
4. 可访问 `public/assets/natural-earth/`（存放 1:110m GeoJSON 原始数据）与历史人物 CSV。

## Install & Bootstrap
```bash
pnpm install
# 预处理地图与指挥官数据
pnpm run data:build   # 调用 scripts/map/build-geojson.ts + scripts/data/build-commanders.ts
# 启动 Dev 服务器（Vite + Phaser HUD）
pnpm run dev
```
- `pnpm run dev` 启动后访问 http://localhost:5173，Dev HUD 将显示 FPS/Tick。
- Service Worker 在 `pnpm run dev:sw` 中可选启用，用于测试离线体验。

## Available Scripts
| Script | Purpose |
|--------|---------|
| `pnpm run dev` | Vite 开发服务器，热重载 React + Phaser |
| `pnpm run build` | 生产构建（含 PWA manifest & SW 生成） |
| `pnpm run preview` | 本地预览生产构建 |
| `pnpm run lint` | ESLint + Prettier 检查 |
| `pnpm run typecheck` | `tsc --noEmit` 严格模式 |
| `pnpm run data:build` | 生成 `app/src/data/territories.json` 与 `commanders.json` |
| `pnpm run telemetry:dev` | 推送 FPS/Tick/Morale 等指标到 Dev Console 仪表 |

## Testing Strategy（宪章测试门禁）
1. **Unit**：`pnpm run test:unit`（Vitest + jsdom）覆盖随机生成器、战斗计算、存档恢复。  
2. **Contract**：`pnpm run test:contract` 启动 Headless Phaser，验证 Tick 调度和 API 契约（基于 `contracts/historic-conquest.openapi.yaml`）。  
3. **E2E**：`pnpm run test:e2e`，先运行 `pnpm run dev` 或 `pnpm run preview`；Playwright 脚本覆盖 User Story 1–3。  
4. **Coverage**：`pnpm run test:coverage` 输出 `coverage/lcov-report`，需 ≥90%。

## Performance & UX Validation
1. **Performance Budget**：`pnpm run perf:profile` 使用 Lighthouse CI + Web Vitals，确保首屏 <3s、交互延迟 <120ms、FPS≥60。  
2. **Stasis Watchdog**：`pnpm run sim:stasis` 以极端参数运行 15 分钟，验证决战事件能打破僵持。  
3. **Accessibility**：`pnpm run a11y`（axe + keyboard 测试）检查键盘可用性与对比度；`pnpm run test:e2e --project=ipad` 验证触控手势。

## Observability Hooks
- Dev HUD：`H` 切换显示 FPS、Tick、Queue 长度。  
- Telemetry Export：`pnpm run telemetry:export` 将最近 24h 指标推送至 `app/telemetry/dashboard.md`。  
- 日志级别：使用 `LOG_LEVEL=debug` 以输出每条 BattleEvent，发布构建默认 `info`。

## Recovery / Restart
- IndexedDB `historic-conquest/runs` 自动每 30s 快照；可通过 DevTools Application 面板验证写入。  
- `pnpm run seed:replay --seed <value>` 重放特定种子以复测异常战局。

遵循以上步骤可在本地完成开发、测试、性能及体验验证，满足宪章门禁后即可进入 `/speckit.tasks` 阶段。

# Quickstart – 国家攻占规则调整

本指南帮助你快速在本仓库中实现并验证“以国家为单位的攻占与展示”特性，对应规格见 `specs/002-country-battle-logic/spec.md`，实现计划见 `plan.md`。

## 1. 启动与基础命令

1. 安装依赖：
   - 在仓库根目录执行：
     - `pnpm install`
2. 启动开发环境：
   - 在根目录执行：
     - `pnpm dev`（内部会进入 `app` 并启动 Vite 开发服务器）。
3. 运行测试：
   - 单元/集成测试：`pnpm test`
   - 覆盖率：`pnpm test:coverage`
   - 端到端测试：`pnpm test:e2e`

## 2. 实现顺序建议

### 步骤 1：统一以国家 ID 为占领单位

目标：

- 确保运行时所有占领与展示逻辑都以 `Country.id`（国家 ID）为唯一键，消除区域级占领。

建议修改点：

1. `app/src/config/regionMapping.config.ts`
   - 将其用途约束在“初始化映射”与调试工具，避免在运行时攻占调用链中使用。
2. `app/src/core/types.ts`
   - 确认 `HistoricalCommander.controlledTerritories` 在运行时仅存国家 ID，区域 ID 只出现在 `initialRegions` 中。
3. `app/src/core/state/store.ts`
   - 审查并调整 `updateTerritoryOwnership`：
     - 启动期可以使用 region→country 映射批量生成初始 `territoryStates`。
     - 对局运行时，从攻占事件入口开始只允许传入 `countryId`，避免通过区域 ID 一次性更新多个国家。

### 步骤 2：重构攻占流程为“一个国家一个国家”

目标：

- 每一次攻占操作都只影响一个国家，不再出现“一次性占领全部国家”的行为。

建议修改点：

1. `app/src/core/simulation/systems/battleSystem.ts` 与相关系统：
   - 确保战斗结算仅针对单个 `territoryId/countryId` 生成成功攻占事件。  
   - 若当前逻辑存在按区域批量更新，需要改为对国家列表逐个生成事件和状态更新。
2. `app/src/core/state/store.ts`
   - 通过 `updateTerritory` 和 `updateTerritoryState` 保证每次状态更新只对应一个 `countryId`。  
   - 为“由区域触发的批量更新”保留初始化路径（如有需要），并明确与运行期分支隔离。
3. `app/src/scenes/world/WorldScene.ts` 与 `app/src/scenes/world/utils/countryMapper.ts`：
   - 使用 `Country.id` 作为交互选中、战斗目标与日志事件中的统一标识。

### 步骤 3：修复姓名重叠问题

目标：

- 每个国家在任何时刻只展示当前占领者姓名/标识，不与旧名字重叠。

建议修改点：

1. 找到负责在地图上绘制占领者姓名的代码（通常位于 `app/src/ui` 或 `app/src/scenes/world`）：
   - 确保渲染时只读 `GameState.territoryStates` 中的 `ownerId` + 指挥官信息，而不是叠加多个文本节点。  
   - 使用稳定的 `key` 或对象 ID 来管理姓名文本，使旧文本在所有权变更时被销毁或复用。
2. 在 React UI（如 `CountryDetailPanel`、`BattleTimeline` 等）中：
   - 确保只展示当前占领者姓名，不追加显示历史占领者名称。  
   - 历史信息如需展示，应明确放在战报或时间线中，与当前状态区分。

## 3. 测试与验证路径

### 单元与集成测试

推荐新增或更新的测试位置：

- `tests/unit/core/state/store.*.test.ts`（或等价路径）：
  - 覆盖以下场景：
    - 传入国家 ID 时，仅该国家的 `TerritoryState.ownerId` 发生变化。
    - 传入区域 ID 时，不会在运行时触发批量占领（或仅在明确标记的初始化路径中生效）。
- `tests/unit/scenes/world/*`：
  - 确认国家选择与战斗目标使用的是 `Country.id`，而非区域 ID。

### 端到端测试（Playwright）

新增或调整用例以覆盖：

1. 单国攻占：
   - 从开始界面进入世界地图。
   - 选择一个敌方国家并发起攻占，观察战斗结算。  
   - 断言：只有该国家的颜色与姓名发生变化，对方其他国家保持不变。
2. 多次易主：
   - 在同一局中让同一个国家经历多次易主。  
   - 断言：任意时刻该国家只展示当前占领者姓名，没有历史名字残留或重叠。
3. 刷新/重新进入：
   - 在一次或多次攻占后刷新页面或重新进入对局。  
   - 断言：地图展示与内部状态一致，不出现区域级占领节点或错误的姓名。

## 4. 参考文档

- 规格：`specs/002-country-battle-logic/spec.md`
- 实现计划：`specs/002-country-battle-logic/plan.md`
- 数据模型：`specs/002-country-battle-logic/data-model.md`
- API 契约：`specs/002-country-battle-logic/contracts/conquest-api.yaml`
- 宪法：`.specify/memory/constitution.md` – 质量、测试、体验与性能门禁的统一约束

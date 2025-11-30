# Data Model – 国家攻占规则调整

本文件描述在“国家攻占规则调整”特性下，核心领域实体及其关系、约束与状态迁移。目标是统一以国家为粒度表达占领与展示，移除“东南亚/北美/中美”等区域级占领概念。

## 1. 核心实体

### 1.1 HistoricalCommander（指挥官 / 玩家）

代表一名历史指挥官（也是玩家在规则层面对应的势力）。

关键字段（与本特性相关）：

- `id: string`：指挥官唯一标识。
- `name: string`：展示名称，用于地图、面板和战报中展示。
- `originRegion: 'africa' | 'americas' | 'asia' | 'europe' | 'oceania'`：出身大洲，用于背景与平衡，不作为占领单位。
- `controlledTerritories: string[]`：
  - 本特性后的约定：对局运行时，该数组仅存储国家 ID（Country.id），不再存储区域 ID。  
  - 初始化阶段可以通过 `initialRegions` 和映射表从区域生成国家列表，但一旦世界状态建立完成，`controlledTerritories` 即视为仅包含国家。
- `initialRegions?: string[]`：保留原始区域 ID 作为调试依据，不参与运行时占领逻辑。
- `status: 'active' | 'eliminated'`：势力存续状态，当 `controlledTerritories` 为空且满足其他规则时可标记为 `eliminated`。

关系：

- 与 `TerritoryState` 通过 `ownerId`/`previousOwnerId` 建立 1:n 关系（一个指挥官可拥有多个国家）。

约束：

- 运行过程中，`controlledTerritories` 与 `TerritoryState` 中 `ownerId` 映射应保持一致：
  - 任意时刻，`controlledTerritories` 中的每个国家 ID 都应有对应 `TerritoryState`，且其 `ownerId === commander.id`。
  - 当某国家易主时，必须同时更新两处数据（或通过统一的领域服务保持一致）。

---

### 1.2 Country（国家）

代表世界地图上的国家实体，来自地图数据（GeoJSON）。

关键字段：

- `id: string`：国家唯一标识（ISO 3166-1 alpha-3）。
- `name: string`：本地化名称，用于 UI 展示。
- `nameEn: string`：英文名或拉丁字母名，用于调试与兼容。
- `geometry: MultiPolygon`、`centroid: Point`、`bbox: BoundingBox`：地图渲染与命中检测相关信息。
- `neighbors: string[]`：邻国列表，用于攻击范围、扩张链路等逻辑。

关系：

- 每个 `Country` 在游戏状态层对应零或一个 `TerritoryState`（未加载或尚未生成状态时为零）。

约束：

- `Country.id` 是国家级占领的唯一键，所有占领与展示逻辑都必须围绕这一键进行。
- 不再引入额外“区域实体”作为占领单位；区域信息仅作为分组或过滤条件存在（如 `RegionMapping.description`）。

---

### 1.3 Territory & TerritoryState（领土与领土状态）

`Territory`：地理与资源层面的静态“格子”（目前通常按国家切分，但保持一定抽象度）。

`TerritoryState`：与特定国家（Country）绑定的动态状态，是展示与攻占逻辑的主要来源。

关键字段：

- `Territory.id: string`：领土 ID，运行时应与 `Country.id` 对齐或可一一映射。
- `Territory.ownerId: string | null`：当前占领者指挥官 ID（静态视图，用于初始化或简化查询）。
- `Territory.garrison: number`：驻军数量。
- `Territory.stability: number`：稳定度/防御力。
- `TerritoryState.countryId: string`：绑定的国家 ID，与 `Country.id` 一致。
- `TerritoryState.countryName?: string`：缓存国家名称，减少重复查表。
- `TerritoryState.ownerId: string | null`：当前占领者 ID，用于驱动颜色与姓名展示。
- `TerritoryState.previousOwnerId: string | null`：最近一次易主前的占领者 ID，用于战报与动画。
- `TerritoryState.conqueredAt: number | null`：最近一次被占领的时间戳。
- `TerritoryState.transitionProgress: number | null`：颜色过渡/动画进度。
- 其他数值字段（troops、resources、defense 等）：用于战斗与经济计算。

关系：

- `Territory.id` 与 `TerritoryState.countryId` 应保持一致或可单射映射（不允许一个国家有多个 `TerritoryState`）。
- `TerritoryState.ownerId` 指向 `HistoricalCommander.id`。

约束：

- 任意时刻，每个 `countryId` 至多存在一个 `TerritoryState` 实例，确保“单一所有权来源”。
- 占领时操作的核心对象是 `TerritoryState`：
  - 更新所有权、驻军、防御等字段。
  - UI 只从 `TerritoryState` 读取名称与颜色，不直接根据区域或其他中间结构渲染。

---

### 1.4 BattleEvent（战斗 / 攻占事件）

代表一次战斗或外交事件的日志记录，是“测试即规范”和可观测性的关键实体之一。

与本特性高度相关的字段：

- `id: string`：事件唯一标识。
- `timestamp: string`：事件发生时间。
- `type: 'attack' | 'victory' | 'elimination' | ...`：事件类型。
- `attackerId?: string` / `defenderId?: string`：攻防双方指挥官 ID。
- `territoryId?: string`：
  - 本特性后，约定该字段应存储单个 `Country.id`，用于标记具体攻占的国家。  
  - 不再接受“区域 ID”作为该字段的合法值。
- `result: 'success' | 'fail' | 'pending'`：战斗结果。
- `delta: Record<string, number>`：对战后状态变化（如兵力损耗、士气变更）。
- `narrative: string`：用于战报和时间线展示的文字描述。

关系与约束：

- 每条成功的“攻占”事件（`type: 'attack'` 且 `result: 'success'`）都应对应一次 `TerritoryState` 的 ownerId 变更。  
- 在回放或分析时，可以通过 `territoryId` 关联到 `Country` 与 `TerritoryState`，重建国家易主轨迹。

---

## 2. 从区域到国家的映射角色调整

### 2.1 RegionMapping 与 CountryMappingResult

当前存在的区域到国家映射配置：

- `RegionMapping`：定义 `id`（如 `southeast-asia`、`north-america`）、显示名称、包含的国家 ID 列表。
- `CountryMappingResult`：用于将指挥官的 `controlledTerritories` 映射为具体国家列表，包含 `mappedCountries`、`unmappedRegions`、`invalidCountryIds` 等诊断信息。

在本特性下的角色：

- 启动期：可以继续使用 `RegionMapping` 作为“初始配置→国家列表”的辅助工具：
  - 将历史指挥官的区域配置转换为国家列表，填充至 `HistoricalCommander.controlledTerritories` 与初始 `TerritoryState`。  
  - 将历史区域 ID 记录在 `HistoricalCommander.initialRegions` 用于调试和回溯。
- 运行期：
  - 所有实时占领、战斗逻辑不再依据区域 ID 进行更新。
  - `updateTerritoryOwnership`、战斗系统与 UI 等运行期逻辑统一以 `countryId` 为键进行操作。

约束：

- 任何在对局进行中使用 `RegionMapping` 的代码都应被限制在初始化与分析工具中，而不能出现在“实时攻占调用链”中。

---

## 3. 状态迁移（占领流程）

本节描述一次成功攻占某个国家时，关键实体之间的状态迁移。

### 3.1 前置条件

- 存在攻击方指挥官 `A` 和防守方指挥官 `B`（若为中立则 `B` 可为 null）。
- 存在目标国家 `C`，其 `Country.id = cid`，且有对应的 `TerritoryState` 或可创建新的状态。
- 战斗系统根据当前状态（兵力、防御、技能等）计算得出结果为“成功攻占”。

### 3.2 迁移步骤（概念层面）

1. 更新 `TerritoryState`：
   - 将 `TerritoryState.countryId = cid` 的实例的 `previousOwnerId` 设为当前 `ownerId`。  
   - 将 `ownerId` 更新为攻击方 `A.id`。  
   - 根据战斗结果调整 `troops`、`defense` 等字段。  
   - 更新 `conqueredAt` 与 `updatedAt` 时间戳，重置或初始化 `transitionProgress` 等动画相关字段。

2. 更新指挥官控制列表：
   - 在被攻占方 `B` 的 `controlledTerritories` 中移除 `cid`（若存在）。  
   - 在攻击方 `A` 的 `controlledTerritories` 中添加 `cid`，若已存在则保持去重。  
   - 若更新后 `B.controlledTerritories` 为空且满足其他淘汰条件，可以将 `B.status` 设为 `eliminated`。

3. 更新 `Territory` 快照（如果仍在使用）：
   - 将 `Territory.id === cid` 的实体的 `ownerId` 更新为 `A.id`。  
   - 可同步 `garrison` / `stability` 字段以反映最新状态。

4. 记录 `BattleEvent`：
   - 写入一条包含 `attackerId = A.id`、`defenderId = B.id`（或 null）、`territoryId = cid`、`result = 'success'` 的事件。  
   - `narrative` 中描述“谁在何时攻占了哪个国家”，便于战报和时间线展示。  
   - 可在 `delta` 中记录兵力和防御变化等数值。

5. 驱动 UI 更新：
   - 颜色：基于最新 `TerritoryState.ownerId` 与 `CommanderColor` 重新计算或增量更新国家 `cid` 的地图填充颜色。  
   - 姓名：依据最新 `TerritoryState.ownerId` 渲染各类 UI 文本，确保只存在一个当前占领者名称投影；旧的姓名或标识通过 React/Phaser 生命周期被销毁或覆盖。

### 3.3 失败与边界场景

- 若战斗结果为失败（`result = 'fail'`）：
  - `TerritoryState.ownerId` 不变，仅更新数值字段（兵力、稳定度等）。  
  - 仍记录 `BattleEvent`，但不触发所有权迁移。
- 若指定的 `cid` 不存在对应 `Country` 或 `TerritoryState`：
  - 行为应视为错误或无效操作，不进行隐式创建。  
  - 可通过 Telemetry 或日志记录异常，便于发现数据问题。

---

## 4. 验证规则与一致性检查

### 4.1 运行时一致性

- 在调试或 Telemetry 分析中，可以周期性检查：
  - `∑ commander.controlledTerritories` 是否与 `TerritoryState.ownerId` 分布一致。  
  - 是否存在某个 `countryId` 被多个指挥官同时声明为控制（逻辑上应不可见）。

### 4.2 初始化阶段验证

- 在使用 `RegionMapping` 做初始化映射时：
  - 检查每个区域 ID 是否能映射到至少一个有效国家 ID，否则记录在 `unmappedRegions` 中。  
  - 检查每个国家 ID 是否存在于地图数据中，否则记录在 `invalidCountryIds` 中。  
  - 一旦初始状态生成完成，运行时占领逻辑即不再依赖区域 ID。

### 4.3 UI 层验证

- 在 UI 组件测试中，针对以下场景进行验证：
  - 单国攻占：一个国家从 `B` → `A` 后，地图与面板上仅出现 `A.name`。  
  - 多次易主：同一国家经历多次易主后，任意截点只展示一个当前占领者姓名，无历史重影。  
  - 刷新/重进：重新进入对局或刷新页面后，UI 展示的占领情况与最新 `TerritoryState` 与 `BattleEvent` 一致。

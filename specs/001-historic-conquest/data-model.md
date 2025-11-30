# Data Model — Historic World Conquest Simulator

## Entity: HistoricalCommander
| Field | Type | Description | Validation / Notes |
|-------|------|-------------|--------------------|
| `id` | string UUID | Stable identifier per commander in一个战局 | Required, unique
| `name` | string | 历史人物姓名 | 必须存在，并映射到公开资料
| `originRegion` | enum(`africa`,`americas`,`asia`,`europe`,`oceania`) | 决定出生洲与领地分配 | 至少一位角色占据每个洲（若可用）
| `portraitAsset` | string | 头像资源路径 | 需缓存并在首屏预加载列表中
| `baseAttributes` | object | `{attack, defense, mobility, leadership}` 0–100 | 所有值 40–90，来源于标准化数据
| `skillCards` | SkillCard[] | 被动/触发技能列表 | 长度 1–2，包含描述与冷却
| `currentPower` | number | 当前综合战力 | 由 base + buffs 计算，>=0
| `controlledTerritories` | string[] Territory IDs | 角色控制领土集合 | 与 Territory.ownerId 对齐
| `alliances` | string[] Commander IDs | 活跃盟友 | 不含自身，数量≤3
| `hostilities` | string[] Commander IDs | 明确敌对列表 | 自动同步于事件系统
| `morale` | number (0–100) | 士气值影响胜率 | 每 Tick 夹逼在0–100，UI 显示色阶
| `nextActionEta` | ISO timestamp | 下一次行动倒计时完成时间 | 更新频率 ≤Tick 间隔
| `status` | enum(`active`,`eliminated`) | 是否仍在局中 | Eliminated 时 controlledTerritories 置空，触发事件

### State transitions
1. **Spawned → Active**：在开局或再开局时初始化 baseAttributes + 随机扰动，生成初始领土。  
2. **Active → AllianceFormed**：`alliances` 更新，并生成 `BattleEvent` 记录；持续生效直到破盟。  
3. **Active → Eliminated**：`currentPower <= 0` 或无领土；标记 status，触发结算更新。  
4. **Any → Buffed**：技能或事件修改属性，记录在 `skillCards` 的 `activeModifier` 字段。

## Entity: Territory
| Field | Type | Description | Validation |
|-------|------|-------------|-----------|
| `id` | string | 多边形唯一 ID，对应 GeoJSON Feature | Required
| `name` | string | 领土可读名称（如“东欧平原”） | 本地化支持
| `polygon` | number[][] | Equal Earth 投影后的坐标点数组 | 点数 ≤ 120，闭合
| `adjacentIds` | string[] | 相邻领土 ID 列表 | 不包含自身，保持对称
| `terrain` | enum(`plains`,`mountain`,`desert`,`forest`,`water`) | 影响战斗系数 | `water` 领土不可占领
| `resourceYield` | `{food:number, industry:number}` | 资源/补给产出 | 0–10 范围，驱动 Logistics 系统
| `ownerId` | string | 当前控制者 commander id 或 `null` | `null` 表示中立
| `garrison` | number | 驻军力量 | >=0；与 ownerId 一致
| `stability` | number 0–100 | 易守难攻程度 | Tick 衰减/增长，影响胜率

### State transitions
- **Neutral → Claimed**：发生 BattleEvent 且 attacker 胜；更新 ownerId/garrison/stability。  
- **Claimed → Neutral**：城池被摧毁或决战事件清零；向 BattleEvent 写入 `territoryReleased`.  
- **Claimed → Disputed**：同时存在入侵与防守行动时临时状态，用于 UI 高亮。

## Entity: BattleEvent
| Field | Type | Description |
|-------|------|-------------|
| `id` | string | 事件 ID |
| `timestamp` | ISO string | 发生时间 |
| `type` | enum(`attack`,`alliance`,`betrayal`,`cataclysm`,`victory`,`elimination`) | 事件类别 |
| `attackerId` | string | 可能为空（如自然灾害） |
| `defenderId` | string | 仅攻防需要 |
| `territoryId` | string | 涉及领土 |
| `result` | enum(`success`,`fail`,`pending`) | 战斗结果 |
| `delta` | object | 变化值（比如占领百分比、军力损失） |
| `narrative` | string | 供战报面板展示的自然语言描述 |
| `seed` | string | 随机数种子片段，用于重放 |

### Usage
- 用于战报时间线、回放、复制摘要与性能分析。  
- 保存最近 200 条在内存，全部写入 IndexedDB `runs`。

## Entity: WorldState
| Field | Type | Description |
|-------|------|-------------|
| `sessionId` | string | 当前战局 ID |
| `seed` | string | 初始随机种子，关联 `seeds` store |
| `tick` | number | 已执行 tick 数 |
| `commanders` | HistoricalCommander[] | 当前所有指挥官快照 |
| `territories` | Territory[] | 当前领土状态 |
| `eventLog` | BattleEvent[] | 截至目前的战报 |
| `victoryThreshold` | number (0–1) | 达成统一所需占比，默认 0.9 |
| `elapsedMs` | number | 战局经过时间，驱动 SC-002 指标 |
| `stasisTimerMs` | number | 无占领变化持续时间，用于触发决战事件 |
| `performanceMetrics` | `{fps:number, tickMs:number}` | 最近 30 秒平均性能 |
| `lastSnapshot` | ISO timestamp | 最近写入 IndexedDB 的时间 |

### State transitions
1. **Bootstrapped → Running**：加载资产、地图与 commander pool，初始化第 0 Tick。  
2. **Running → Paused**：当用户打开菜单或切换标签页；Tick 冻结但 UI 仍可浏览历史。  
3. **Running → Concluded**：胜利条件满足或手动终止；写入结算摘要。  
4. **Any → Restored**：从 IndexedDB 加载快照，重建 commanders/territories/eventLog，并恢复 Tick Scheduler。

## Supporting Structures
- **SkillCard**: `{ id, name, trigger, modifier, cooldownMs, durationMs }`，用于 commander 技能。  
- **TelemetrySignal**: `{ type: 'fps'|'tick'|'stasis'|'error', value: number, timestamp }`，供可观测性仪表使用。

---
所有实体与关系与规格/研究保持一致，可直接映射为 TypeScript 接口与 JSON Schema，用于 contracts 与测试夹具。

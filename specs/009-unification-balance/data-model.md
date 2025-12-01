# Data Model: 大一统平衡优化

**Feature**: 009-unification-balance  
**Date**: 2025-12-01

## Entity Changes

### 1. GameState (扩展)

**位置**: `app/src/core/state/store.ts`

```typescript
interface GameState {
  // ... 现有字段 ...
  
  // 新增：决战模式状态
  isEndgameMode: boolean;
  endgameTriggerTick: number | null;
  
  // Actions
  setEndgameMode: (active: boolean) => void;
}
```

**字段说明**:
| 字段 | 类型 | 说明 | 默认值 |
|------|------|------|--------|
| isEndgameMode | boolean | 是否处于决战模式 | false |
| endgameTriggerTick | number \| null | 决战模式触发的 tick | null |

### 2. EndgameConfig (新增)

**位置**: `app/src/config/endgame.config.ts`

```typescript
export interface EndgameConfig {
  /** 触发决战模式的活跃势力数阈值 */
  triggerThreshold: number;
  
  /** 战斗频率倍数 */
  battleFrequencyMultiplier: number;
  
  /** 决战模式下的远程攻击概率 */
  remoteAttackProbability: number;
  
  /** 力量消耗倍数（0.5 = 减半） */
  powerLossMultiplier: number;
  
  /** 是否允许新联盟 */
  allowNewAlliances: boolean;
  
  /** 强制解散联盟的领土占比阈值 */
  allianceBreakThreshold: number;
}

export const DEFAULT_ENDGAME_CONFIG: EndgameConfig = {
  triggerThreshold: 3,
  battleFrequencyMultiplier: 2,
  remoteAttackProbability: 0.4,
  powerLossMultiplier: 0.5,
  allowNewAlliances: false,
  allianceBreakThreshold: 0.5,
};
```

### 3. PowerRecoveryConfig (新增)

**位置**: `app/src/config/powerRecovery.config.ts`

```typescript
export interface PowerRecoveryConfig {
  /** 每个领土的恢复系数 */
  recoveryPerTerritory: number;
  
  /** 战斗胜利额外恢复 */
  victoryBonus: number;
  
  /** 力量最小值 */
  minPower: number;
  
  /** 力量最大值 */
  maxPower: number;
}

export const DEFAULT_POWER_RECOVERY_CONFIG: PowerRecoveryConfig = {
  recoveryPerTerritory: 0.2,
  victoryBonus: 5,
  minPower: 20,
  maxPower: 100,
};
```

### 4. TerritoryBonusConfig (修改)

**位置**: `app/src/config/territoryBonus.config.ts`

```typescript
// 修改后的默认配置
export const DEFAULT_TERRITORY_BONUS_CONFIG: TerritoryBonusConfig = {
  maxAttackBonus: 0.6,            // 原 0.5 → 0.6
  maxDefenseBonus: 0.5,           // 原 0.4 → 0.5
  cityBaseFactor: 0.005,          // 原 0.001 → 0.005
  cityScaleFactor: 0,
  areaBaseFactor: 1.2,            // 原 0.8 → 1.2
  areaScaleFactor: 0,
  continuityBonus: 0.1,
  smallFactionDefenseBonus: 0.03, // 原 0.1 → 0.03
  smallFactionThreshold: 3,       // 原 5 → 3
};
```

### 5. VictoryConfig (新增)

**位置**: `app/src/config/victory.config.ts`

```typescript
export interface VictoryConfig {
  /** 领土胜利阈值（占比） */
  territoryVictoryThreshold: number;
  
  /** 是否启用领土胜利 */
  enableTerritoryVictory: boolean;
  
  /** 是否启用消灭胜利 */
  enableEliminationVictory: boolean;
}

export const DEFAULT_VICTORY_CONFIG: VictoryConfig = {
  territoryVictoryThreshold: 0.85,
  enableTerritoryVictory: true,
  enableEliminationVictory: true,
};
```

## State Transitions

### 游戏阶段状态机

```
┌─────────────┐
│   EARLY     │  活跃势力 > 10
│  (早期)     │
└──────┬──────┘
       │ 活跃势力 ≤ 10
       ▼
┌─────────────┐
│   MIDDLE    │  活跃势力 > 3
│  (中期)     │
└──────┬──────┘
       │ 活跃势力 ≤ 3
       ▼
┌─────────────┐
│  ENDGAME    │  决战模式
│  (决战)     │  - 战斗频率 ×2
└──────┬──────┘  - 远程攻击 40%
       │         - 力量消耗 ×0.5
       │ 胜利条件达成
       ▼
┌─────────────┐
│  VICTORY    │  游戏结束
│  (胜利)     │
└─────────────┘
```

### 胜利条件判定

```
每 tick 检查:
├── 领土胜利: controlledTerritories.length / totalTerritories >= 0.85
│   └── 触发 → declareVictory(commanderId)
│
└── 消灭胜利: activeCommanders.length === 1
    └── 触发 → declareVictory(lastCommanderId)
```

### 联盟生命周期

```
联盟形成条件:
├── 非决战模式 (isEndgameMode === false)
├── 双方领土占比 < 50%
└── 双方未达联盟上限 (alliances.length < 3)

联盟强制解散:
├── 任一方领土占比 ≥ 50%
└── 进入决战模式后不再形成新联盟
```

## Validation Rules

### 力量值约束

```typescript
// 任何时候
MIN_POWER ≤ currentPower ≤ MAX_POWER
// 即: 20 ≤ currentPower ≤ 100
```

### 领土加成约束

```typescript
// 攻击加成
0 ≤ totalAttackBonus ≤ maxAttackBonus (0.6)

// 防御加成
0 ≤ totalDefenseBonus ≤ maxDefenseBonus (0.5)
```

### 决战模式约束

```typescript
// 一旦触发，不可逆
if (isEndgameMode) {
  // 禁止新联盟
  // 战斗频率 ×2
  // 远程攻击概率 = 0.4
}
```

## Relationships

```
┌──────────────────┐      ┌──────────────────┐
│ HistoricalCommander │◄────│    Territory     │
│                  │      │                  │
│ - currentPower   │      │ - ownerId        │
│ - controlledTerritories │      │ - stability      │
│ - alliances      │      │                  │
└──────────────────┘      └──────────────────┘
         │                         │
         │                         │
         ▼                         ▼
┌──────────────────┐      ┌──────────────────┐
│  FactionStatistics │      │  TerritoryState  │
│                  │      │                  │
│ - countryCount   │      │ - ownerId        │
│ - totalArea      │      │ - troops         │
│ - territoryBonus │      │                  │
└──────────────────┘      └──────────────────┘
         │
         ▼
┌──────────────────┐
│  TerritoryBonus  │
│                  │
│ - totalAttackBonus │
│ - totalDefenseBonus │
└──────────────────┘
```

## Migration Notes

本功能不涉及数据迁移，所有变更都是运行时状态和配置修改。

- 配置文件修改：直接覆盖默认值
- 新增状态字段：在 store 初始化时设置默认值
- 新增系统：在 tickScheduler 中注册

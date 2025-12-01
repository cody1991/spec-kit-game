# Data Model: 渐进式领土蚕食机制

**Feature**: 010-gradual-conquest  
**Date**: 2025-12-01  
**Status**: Complete

## Entity Definitions

### 1. ConquestProgressEntry (新增)

单个攻击方对单个领土的占领进度记录。

```typescript
interface ConquestProgressEntry {
  /** 攻击方指挥官ID */
  attackerId: string;
  /** 当前进度 (0-100) */
  progress: number;
  /** 最后战斗时间戳 (ms) */
  lastBattleTime: number;
  /** 累计战斗次数 */
  battleCount: number;
}
```

**Validation Rules**:
- `progress`: 0 ≤ progress ≤ 100
- `lastBattleTime`: 必须是有效的时间戳
- `battleCount`: ≥ 0

### 2. TerritoryConquestState (新增)

领土的完整占领状态，支持多攻击方。

```typescript
interface TerritoryConquestState {
  /** 领土ID */
  territoryId: string;
  /** 当前所有者ID */
  currentOwnerId: string | null;
  /** 各攻击方的进度映射 */
  progressMap: Map<string, ConquestProgressEntry>;
  /** 是否处于争夺状态 */
  isContested: boolean;
  /** 最高进度的攻击方ID (缓存，用于快速查找) */
  leadingAttackerId: string | null;
  /** 最高进度值 (缓存) */
  leadingProgress: number;
}
```

**State Transitions**:

```
┌─────────────┐     攻击胜利      ┌─────────────┐
│   Neutral   │ ───────────────→ │  Contested  │
│ (无争夺)    │                   │  (争夺中)   │
└─────────────┘                   └─────────────┘
       ↑                                │
       │ 进度归零                       │ 进度达100%
       │ 或衰减至0                      ↓
       │                          ┌─────────────┐
       └────────────────────────  │  Conquered  │
                                  │  (已占领)   │
                                  └─────────────┘
```

### 3. Territory (扩展现有类型)

扩展现有 `Territory` 接口，添加占领进度相关字段。

```typescript
interface Territory {
  // ... 现有字段 ...
  id: string;
  name: string;
  ownerId: string | null;
  garrison: number;
  stability: number;
  
  // 新增字段
  /** 占领进度状态 */
  conquestState: TerritoryConquestState | null;
}
```

### 4. ConquestProgressConfig (新增)

占领进度系统的配置参数。

```typescript
interface ConquestProgressConfig {
  /** 小国面积阈值 (km²) */
  smallCountryThreshold: number;
  /** 大国面积阈值 (km²) */
  largeCountryThreshold: number;
  
  /** 小国进度增量 (攻击胜利) */
  smallCountryProgressGain: number;
  /** 中国进度增量 */
  mediumCountryProgressGain: number;
  /** 大国进度增量 */
  largeCountryProgressGain: number;
  
  /** 小国进度减量 (防守成功) */
  smallCountryProgressLoss: number;
  /** 中国进度减量 */
  mediumCountryProgressLoss: number;
  /** 大国进度减量 */
  largeCountryProgressLoss: number;
  
  /** 实力优势乘数 (攻击方实力 ≥ 2x 防守方) */
  powerAdvantageMultiplier: number;
  /** 实力劣势乘数 (攻击方实力 ≤ 0.5x 防守方) */
  powerDisadvantageMultiplier: number;
  
  /** 决战模式进度乘数 */
  endgameModeMultiplier: number;
  
  /** 进度衰减速率 (每分钟) */
  decayRatePerMinute: number;
  /** 衰减检查间隔 (tick数) */
  decayCheckInterval: number;
}
```

**Default Values**:

```typescript
const DEFAULT_CONQUEST_PROGRESS_CONFIG: ConquestProgressConfig = {
  smallCountryThreshold: 100000,      // 10万 km²
  largeCountryThreshold: 1000000,     // 100万 km²
  
  smallCountryProgressGain: 40,
  mediumCountryProgressGain: 25,
  largeCountryProgressGain: 15,
  
  smallCountryProgressLoss: 30,
  mediumCountryProgressLoss: 20,
  largeCountryProgressLoss: 12,
  
  powerAdvantageMultiplier: 1.5,
  powerDisadvantageMultiplier: 0.7,
  
  endgameModeMultiplier: 1.5,
  
  decayRatePerMinute: 5,
  decayCheckInterval: 60,  // 每60 tick检查一次 (~1秒)
};
```

### 5. ConquestProgressEvent (新增)

进度变化事件，用于日志和UI更新。

```typescript
interface ConquestProgressEvent {
  /** 事件类型 */
  type: 'progress_increase' | 'progress_decrease' | 'progress_decay' | 'conquest_complete';
  /** 领土ID */
  territoryId: string;
  /** 攻击方ID */
  attackerId: string;
  /** 防守方ID */
  defenderId: string | null;
  /** 变化前进度 */
  previousProgress: number;
  /** 变化后进度 */
  newProgress: number;
  /** 变化量 */
  delta: number;
  /** 时间戳 */
  timestamp: string;
  /** 叙事文本 */
  narrative: string;
}
```

## Relationships

```
┌─────────────────┐
│   Commander     │
│  (指挥官)       │
└────────┬────────┘
         │ 1:N (攻击多个领土)
         ↓
┌─────────────────┐       ┌─────────────────┐
│ ConquestProgress│ N:1   │    Territory    │
│    Entry        │ ────→ │    (领土)       │
└─────────────────┘       └─────────────────┘
         │                         │
         │ N:1                     │ 1:1
         ↓                         ↓
┌─────────────────┐       ┌─────────────────┐
│ TerritoryConquest│ 1:1  │  TerritoryState │
│     State       │ ────→ │   (渲染状态)    │
└─────────────────┘       └─────────────────┘
```

## Store Extensions

### GameState (扩展)

```typescript
interface GameState {
  // ... 现有字段 ...
  
  // 新增
  /** 全局占领进度状态 */
  conquestProgressStates: Map<string, TerritoryConquestState>;
  /** 占领进度配置 */
  conquestProgressConfig: ConquestProgressConfig;
  
  // 新增 Actions
  updateConquestProgress: (
    territoryId: string,
    attackerId: string,
    delta: number,
    isDecay?: boolean
  ) => void;
  
  clearConquestProgress: (territoryId: string, attackerId: string) => void;
  
  completeConquest: (territoryId: string, attackerId: string) => void;
  
  getConquestProgress: (territoryId: string, attackerId: string) => number;
  
  getContestedTerritories: () => string[];
}
```

## Migration Notes

1. **Territory 类型扩展**: 新增 `conquestState` 字段，默认值为 `null`
2. **Store 扩展**: 新增 `conquestProgressStates` Map，初始化为空
3. **向后兼容**: 现有保存的游戏数据无 `conquestState` 字段时，系统自动初始化为 `null`
4. **IndexedDB Schema**: 版本号升级，添加 `conquestProgressStates` 字段

# Data Model: 国土领土加成系统

**Feature**: 008-territory-bonus  
**Date**: 2025-12-01

## 类型定义

### 新增类型

```typescript
/**
 * 领土加成配置
 * 可调参数，便于平衡性调优
 */
export interface TerritoryBonusConfig {
  /** 加成上限 (0.30 = 30%) */
  maxBonus: number;
  /** 城市加成基础系数 */
  cityBaseFactor: number;
  /** 城市加成缩放系数 */
  cityScaleFactor: number;
  /** 面积加成基础系数 */
  areaBaseFactor: number;
  /** 面积加成缩放系数 */
  areaScaleFactor: number;
  /** 连续领土额外加成系数 */
  continuityBonus: number;
  /** 小势力防御加成上限 */
  smallFactionDefenseBonus: number;
  /** 小势力阈值（城市数） */
  smallFactionThreshold: number;
}

/**
 * 领土加成数据
 * 存储计算后的加成值
 */
export interface TerritoryBonus {
  /** 指挥官ID */
  commanderId: string;
  /** 城市数量加成 (0-0.30) */
  cityBonus: number;
  /** 领土面积加成 (0-0.30) */
  areaBonus: number;
  /** 连续领土额外加成 (0-0.06) */
  continuityBonus: number;
  /** 小势力防御加成 (0-0.15) */
  smallFactionDefenseBonus: number;
  /** 总攻击力加成 */
  totalAttackBonus: number;
  /** 总防御力加成 */
  totalDefenseBonus: number;
  /** 最大连通分量城市数 */
  largestContiguousCount: number;
  /** 连通分量数量 */
  contiguousRegionCount: number;
  /** 上次更新时间 */
  lastUpdatedAt: number;
}

/**
 * 连通分量分析结果
 */
export interface ContiguityAnalysis {
  /** 连通分量列表，每个元素是一组领土ID */
  regions: string[][];
  /** 最大连通分量大小 */
  largestSize: number;
  /** 总领土数 */
  totalCount: number;
  /** 最大连通分量占比 */
  largestRatio: number;
}
```

### 扩展现有类型

```typescript
// 扩展 FactionStatistics (在 types.ts 中)
export interface FactionStatistics {
  // ... 现有字段 ...

  /** 领土加成数据 */
  territoryBonus: TerritoryBonus | null;
}

// 扩展 GameState (在 store.ts 中)
export interface GameState {
  // ... 现有字段 ...

  /** 领土加成配置 */
  territoryBonusConfig: TerritoryBonusConfig;

  // 新增 Actions
  updateTerritoryBonus: (commanderId: string, bonus: TerritoryBonus) => void;
  setTerritoryBonusConfig: (config: Partial<TerritoryBonusConfig>) => void;
}
```

## 默认配置

```typescript
export const DEFAULT_TERRITORY_BONUS_CONFIG: TerritoryBonusConfig = {
  maxBonus: 0.3, // 30%上限
  cityBaseFactor: 0.15, // 城市基础系数
  cityScaleFactor: 0.5, // 城市缩放系数
  areaBaseFactor: 0.12, // 面积基础系数
  areaScaleFactor: 0.8, // 面积缩放系数
  continuityBonus: 0.2, // 连续领土额外20%
  smallFactionDefenseBonus: 0.15, // 小势力最高15%防御
  smallFactionThreshold: 3, // 3城市以下触发
};
```

## 实体关系

```
┌─────────────────┐     1:1      ┌──────────────────┐
│ HistoricalCommander │◄─────────►│ FactionStatistics │
└─────────────────┘              └──────────────────┘
        │                                │
        │ 1:N                            │ 1:1
        ▼                                ▼
┌─────────────────┐              ┌──────────────────┐
│ controlledTerritories │         │ TerritoryBonus   │
│ (Country.id[])       │         └──────────────────┘
└─────────────────┘
        │
        │ N:1
        ▼
┌─────────────────┐
│    Country      │
│ (id, area,      │
│  neighbors)     │
└─────────────────┘
```

## 状态转换

### 加成计算触发条件

```
┌──────────────┐
│  游戏初始化   │
└──────┬───────┘
       │
       ▼
┌──────────────┐     领土变化      ┌──────────────┐
│ 初始加成计算  │◄─────────────────│ 战斗结果处理  │
└──────┬───────┘                  └──────────────┘
       │                                 ▲
       ▼                                 │
┌──────────────┐                         │
│ 存储到 Store │─────────────────────────┘
└──────────────┘
```

### 加成应用流程

```
战斗开始
    │
    ▼
读取攻击方 TerritoryBonus
    │
    ▼
读取防守方 TerritoryBonus
    │
    ▼
计算有效攻击力 = baseAttack * (1 + totalAttackBonus)
    │
    ▼
计算有效防御力 = baseDefense * (1 + totalDefenseBonus)
    │
    ▼
执行战斗计算
```

## 验证规则

| 字段                     | 规则                                        |
| ------------------------ | ------------------------------------------- |
| cityBonus                | 0 ≤ value ≤ maxBonus                        |
| areaBonus                | 0 ≤ value ≤ maxBonus                        |
| continuityBonus          | 0 ≤ value ≤ maxBonus \* continuityBonusRate |
| smallFactionDefenseBonus | 0 ≤ value ≤ smallFactionDefenseBonus        |
| totalAttackBonus         | cityBonus + areaBonus + continuityBonus     |
| totalDefenseBonus        | totalAttackBonus + smallFactionDefenseBonus |

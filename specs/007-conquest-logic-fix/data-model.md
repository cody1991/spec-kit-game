# Data Model: 领主占领逻辑修复

**Feature**: 007-conquest-logic-fix  
**Date**: 2025-12-01

## 实体概览

本次修改不新增实体，仅涉及现有实体的行为约束。

### HistoricalCommander（领主）

```typescript
interface HistoricalCommander {
  id: string;
  name: string;
  originRegion: 'africa' | 'americas' | 'asia' | 'europe' | 'oceania';
  // ... 其他属性省略

  // 关键属性
  controlledTerritories: string[]; // 控制的国家ID列表
  status: 'active' | 'eliminated'; // 状态
}
```

**约束变更**:

- **初始化约束**: `controlledTerritories.length >= 1` 对于所有 `status === 'active'` 的领主
- **不变量**: 游戏运行后，活跃领主数量只减不增

### Territory（领土/国家）

```typescript
interface Territory {
  id: string; // 国家ID (ISO数字码)
  name: string;
  adjacentIds: string[]; // 相邻国家ID列表
  ownerId: string | null; // 当前控制者ID
  // ... 其他属性省略
}
```

**约束变更**: 无

## 状态转换

### 领主状态机

```
[初始化]
    │
    ▼
┌─────────┐     分配失败      ┌──────────┐
│ pending │ ─────────────────▶│ excluded │ (不加入游戏)
└─────────┘                   └──────────┘
    │
    │ 分配成功
    ▼
┌─────────┐     失去所有领土   ┌────────────┐
│ active  │ ─────────────────▶│ eliminated │
└─────────┘                   └────────────┘
    │
    │ 游戏结束
    ▼
┌─────────┐
│ victory │ (可选)
└─────────┘
```

### 攻击目标选择决策树

```
[选择攻击目标]
    │
    ├── 85% 概率 ──▶ [相邻目标池]
    │                    │
    │                    ▼
    │               随机选择一个相邻敌对领土
    │
    └── 15% 概率 ──▶ [远程目标池]
                         │
                         ▼
                    随机选择一个非己方领土
```

## 验证规则

### 初始化验证

| 规则ID | 描述                      | 验证时机       |
| ------ | ------------------------- | -------------- |
| V-001  | 活跃领主必须有至少1个领土 | 世界创建完成后 |
| V-002  | 无领土的领主必须被排除    | 世界创建完成后 |

### 运行时验证

| 规则ID | 描述                 | 验证时机     |
| ------ | -------------------- | ------------ |
| V-003  | 活跃领主数量不得增加 | 每次状态变更 |
| V-004  | 已淘汰领主不得复活   | 每次状态变更 |

## 配置参数

```typescript
// 建议添加到 config/ 目录
interface ConquestConfig {
  /** 选择相邻目标的概率 (0-1) */
  adjacentTargetProbability: number; // 默认: 0.85

  /** 是否允许远程攻击 */
  allowRemoteAttack: boolean; // 默认: true
}

const DEFAULT_CONQUEST_CONFIG: ConquestConfig = {
  adjacentTargetProbability: 0.85,
  allowRemoteAttack: true,
};
```

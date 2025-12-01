# Research: 大一统平衡优化

**Feature**: 009-unification-balance  
**Date**: 2025-12-01

## Research Tasks

### 1. 现有战斗系统分析

**问题**: 当前战斗系统如何计算胜负？力量消耗机制是什么？

**发现**:
- 位置: `app/src/core/simulation/systems/battleSystem.ts`
- 攻击力计算: `attackPower = attack * (morale/100) * (currentPower/100) * (1 + territoryBonus)`
- 防御力计算: `defensePower = defense * (morale/100) * (stability/100) * (currentPower/100) * (1 + defenseBonus)`
- 胜负判定: `attackerWins = attackPower > defensePower * (0.8 + Math.random() * 0.4)`
- 力量消耗:
  - 攻击方: 5-15 点
  - 防守方: 10-25 点

**决策**: 在现有系统基础上添加力量恢复机制，不改变核心战斗公式

**理由**: 保持战斗系统稳定性，通过恢复机制而非修改消耗来解决问题

### 2. 领土加成系统分析

**问题**: 当前领土加成如何计算？为什么效果不明显？

**发现**:
- 位置: `app/src/config/territoryBonus.config.ts`
- 当前配置:
  ```typescript
  cityBaseFactor: 0.001,    // 每城市 +0.1%
  areaBaseFactor: 0.8,      // 面积系数
  maxAttackBonus: 0.5,      // 50% 上限
  ```
- 问题: 100 个城市仅 +10% 加成，无法形成滚雪球效应

**决策**: 将 `cityBaseFactor` 提高到 0.005（每城市 +0.5%），`areaBaseFactor` 提高到 1.2

**理由**: 30 个城市 = +15% 加成，50 个城市 = +25% 加成，形成明显优势

**替代方案考虑**:
- 指数增长模式 - 过于复杂，可能导致后期过于不平衡
- 阶梯式加成 - 不够平滑，玩家体验不连贯

### 3. 胜利条件系统分析

**问题**: 当前胜利条件是什么？如何添加领土胜利？

**发现**:
- 位置: `app/src/core/simulation/systems/victorySystem.ts`
- 当前条件: 仅当 `activeCommanders.length === 1` 时宣布胜利
- 问题: 必须消灭所有对手，游戏时间过长

**决策**: 添加领土胜利条件（85% 领土）

**理由**: 
- 85% 阈值允许最后几个小势力存在但不影响胜利
- 与"消灭所有对手"条件共存，先达成者触发

**替代方案考虑**:
- 90% 阈值 - 仍然太高，可能难以达成
- 80% 阈值 - 可能过早结束，减少戏剧性

### 4. 决战模式设计

**问题**: 如何设计决战模式以加速游戏后期？

**发现**:
- 触发条件: 活跃势力 ≤ 3
- 需要影响的系统:
  - `battleSystem`: 战斗频率、力量消耗
  - `targetSelector`: 远程攻击概率
  - `allianceSystem`: 禁止新联盟

**决策**: 创建 `EndgameManager` 模块管理决战模式状态和效果

**设计**:
```typescript
interface EndgameConfig {
  triggerThreshold: 3;           // 触发阈值（活跃势力数）
  battleFrequencyMultiplier: 2;  // 战斗频率 ×2
  remoteAttackProbability: 0.4;  // 远程攻击 40%
  powerLossMultiplier: 0.5;      // 力量消耗 ×0.5
  allowNewAlliances: false;      // 禁止新联盟
}
```

**理由**: 集中管理决战模式逻辑，便于调试和平衡

### 5. 力量恢复机制设计

**问题**: 如何设计力量恢复以防止势力衰退？

**发现**:
- 当前无恢复机制
- 需要考虑:
  - 恢复速度与领土数量的关系
  - 上限和下限
  - 与战斗消耗的平衡

**决策**: 实现 `PowerRecoverySystem`

**设计**:
```typescript
// 每 tick 恢复量
recovery = territoryCount * 0.2;

// 胜利额外恢复
victoryBonus = 5;

// 边界
MIN_POWER = 20;
MAX_POWER = 100;
```

**理由**:
- 20 个领土 = 每 tick +4 力量，可抵消平均战斗消耗（~10）
- 50 个领土 = 每 tick +10 力量，形成正向循环
- 最低值 20 确保势力始终有战斗能力

**替代方案考虑**:
- 固定恢复（如每 tick +5）- 无法形成滚雪球效应
- 百分比恢复（如 5% currentPower）- 弱者恢复太慢

### 6. 联盟系统优化分析

**问题**: 如何防止联盟阻碍统一？

**发现**:
- 位置: `app/src/core/simulation/systems/allianceSystem.ts`
- 当前行为: 5% 概率每 tick 形成联盟，无解散机制
- 问题: 联盟固化导致势力无法扩张

**决策**: 
1. 决战模式下禁止新联盟
2. 占领 50% 领土后强制解散联盟

**理由**: 
- 允许早期联盟增加游戏趣味性
- 后期解散联盟确保游戏能够结束

## Summary

| 研究项 | 决策 | 影响文件 |
|--------|------|----------|
| 战斗系统 | 添加力量恢复，不改变核心公式 | battleSystem.ts |
| 领土加成 | cityBaseFactor: 0.005, areaBaseFactor: 1.2 | territoryBonus.config.ts |
| 胜利条件 | 添加 85% 领土胜利 | victorySystem.ts |
| 决战模式 | 新建 EndgameManager | endgame.config.ts, store.ts |
| 力量恢复 | 新建 PowerRecoverySystem | powerRecoverySystem.ts |
| 联盟优化 | 决战禁止联盟，50% 领土解散联盟 | allianceSystem.ts |

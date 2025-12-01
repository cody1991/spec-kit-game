# Quickstart: 渐进式领土蚕食机制

**Feature**: 010-gradual-conquest  
**Date**: 2025-12-01

## 概述

本功能将战斗系统从"一次性完全占领"改为"渐进式蚕食"模式。战斗胜利后增加占领进度，进度达到100%时正式转移领土所有权。

## 核心概念

### 占领进度

- 每个领土可以被多个势力同时蚕食
- 每个攻击方有独立的进度（0-100%）
- 先达到100%的攻击方获得领土

### 进度变化规则

| 领土大小 | 攻击胜利 | 防守成功 |
| -------- | -------- | -------- |
| 小国 (<10万km²) | +40% | -30% |
| 中国 (10-100万km²) | +25% | -20% |
| 大国 (>100万km²) | +15% | -12% |

### 实力乘数

- 攻击方实力 ≥ 2× 防守方：进度变化 ×1.5
- 攻击方实力 ≤ 0.5× 防守方：进度变化 ×0.7
- 决战模式：进度变化 ×1.5

### 进度衰减

- 无战斗时，进度每分钟下降5%
- 进度降到0%时，攻击方信息清除

## 快速开始

### 1. 配置文件

```typescript
// app/src/config/conquestProgress.config.ts
import type { ConquestProgressConfig } from '@/core/types';

export const DEFAULT_CONQUEST_PROGRESS_CONFIG: ConquestProgressConfig = {
  smallCountryThreshold: 100000,
  largeCountryThreshold: 1000000,
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
  decayCheckInterval: 60,
};
```

### 2. 系统集成

```typescript
// 在 tickScheduler 中注册
import { ConquestProgressSystem } from './systems/conquestProgressSystem';

const systems: System[] = [
  new BattleSystem(),
  new ConquestProgressSystem(),  // 新增
  new PowerRecoverySystem(),
  // ...
];
```

### 3. BattleSystem 修改

```typescript
// battleSystem.ts - queueBattle 方法
private queueBattle(attacker, defender, territory, attackType) {
  // ... 战斗计算 ...
  
  // 调用进度系统而非直接更换所有者
  const conquestSystem = this.getConquestProgressSystem();
  const isConquered = conquestSystem.updateProgress(
    territory.id,
    attacker.id,
    defender.id,
    attackerWins
  );
  
  if (isConquered) {
    // 进度达到100%，执行领土转移
    this.executeConquest(attacker, defender, territory);
  }
}
```

### 4. 渲染集成

```typescript
// MapRenderer.ts - 渐变色渲染
private getContestedColor(
  territoryId: string,
  ownerColor: number,
  attackerColor: number,
  progress: number
): number {
  // 使用 Phaser 颜色插值
  return Phaser.Display.Color.Interpolate.ColorWithColor(
    Phaser.Display.Color.IntegerToColor(ownerColor),
    Phaser.Display.Color.IntegerToColor(attackerColor),
    100,
    progress
  ).color;
}
```

## 测试验证

### 单元测试

```bash
pnpm test tests/unit/conquestProgress.test.ts
```

### 手动测试

1. 启动游戏：`pnpm dev`
2. 观察战斗事件，确认显示进度变化而非直接占领
3. 悬停争夺中的领土，确认显示进度百分比
4. 等待无战斗，确认进度自动衰减

## 关键文件

| 文件 | 用途 |
| ---- | ---- |
| `config/conquestProgress.config.ts` | 进度配置 |
| `core/types.ts` | 类型定义扩展 |
| `core/simulation/systems/conquestProgressSystem.ts` | 进度系统 |
| `core/simulation/systems/battleSystem.ts` | 战斗系统（修改） |
| `core/state/store.ts` | 状态管理（扩展） |
| `scenes/world/rendering/MapRenderer.ts` | 渐变色渲染 |
| `ui/panels/CountryDetailPanel.tsx` | 进度显示 |

## 常见问题

### Q: 进度不增加？
检查 `BattleSystem` 是否正确调用 `ConquestProgressSystem.updateProgress()`

### Q: 渐变色不显示？
确认 `MapRenderer` 正确读取 `conquestProgressStates`

### Q: 进度不衰减？
检查 `ConquestProgressSystem.processDecay()` 是否在 tick 中被调用

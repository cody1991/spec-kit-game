# Feature Specification: 大一统平衡优化

**Feature Branch**: `009-unification-balance`  
**Created**: 2025-12-01  
**Status**: Draft  
**Input**: User description: "分析下现在的攻伐机制，为什么很难出现大一统的情况？提供一些好的解决方案。"

---

## Clarifications

### Session 2025-12-01

- Q: 本次迭代的实施范围？ → A: 一次性实施所有 6 个方案（P0 + P1 + P2），包括领土加成增强、力量恢复机制、胜利条件优化、决战模式、联盟系统优化、移除小势力保护
- Q: 边界情况处理策略？ → A: 设置力量最低值为 20，决战模式自动处理包围问题，依靠现有随机性打破僵局

---

## 问题分析：为什么很难出现大一统？

通过对当前代码的深入分析，我发现以下几个核心问题导致游戏难以出现大一统：

### 问题 1：战斗消耗机制导致"互相消耗"

**代码位置**: `battleSystem.ts:196-220`

```typescript
const attackerPowerLoss = Math.floor(Math.random() * 10) + 5;  // 5-15
const defenderPowerLoss = Math.floor(Math.random() * 15) + 10; // 10-25
```

**问题**：
- 攻击方每次战斗损失 5-15 点力量
- 防守方每次战斗损失 10-25 点力量
- 即使胜利，攻击方也会持续消耗，导致强者越打越弱
- 没有力量恢复机制，所有势力都在持续衰退

### 问题 2：领土加成不足以形成"滚雪球"效应

**代码位置**: `territoryBonus.config.ts`

```typescript
cityBaseFactor: 0.001,    // 每个城市仅 +0.1%
areaBaseFactor: 0.8,      // 面积系数
maxAttackBonus: 0.5,      // 50% 攻击上限
```

**问题**：
- 占领更多领土带来的加成太弱（每城市仅 0.1%）
- 即使占领 100 个国家，攻击加成也只有约 10%
- 无法形成"强者恒强"的正反馈循环

### 问题 3：胜利条件过于苛刻

**代码位置**: `victorySystem.ts:14-17`

```typescript
// 唯一胜利规则：只剩一个指挥官才算统一
if (activeCommanders.length === 1) {
  this.declareVictory(activeCommanders[0].id);
}
```

**问题**：
- 必须消灭所有 30-50 个对手才能获胜
- 没有"占领 90% 领土"等替代胜利条件
- 游戏时间过长，玩家可能失去兴趣

### 问题 4：联盟系统阻碍统一

**代码位置**: `allianceSystem.ts`

**问题**：
- 联盟会持续形成（5% 每 tick）
- 联盟成员不会互相攻击（假设）
- 但没有联盟解散机制，导致势力固化

### 问题 5：远程攻击概率过低

**代码位置**: `conquest.config.ts`

```typescript
adjacentTargetProbability: 0.85,  // 85% 相邻攻击
allowRemoteAttack: true,          // 15% 远程攻击
```

**问题**：
- 85% 概率只能攻击相邻国家
- 当一个势力被其他势力包围时，扩张受限
- 地理隔离（如澳大利亚、日本）的势力难以被消灭

### 问题 6：小势力防御加成让弱者更难被消灭

**代码位置**: `territoryBonus.config.ts:32-33`

```typescript
smallFactionDefenseBonus: 0.1,    // 小势力 +10% 防御
smallFactionThreshold: 5,          // 5 城市以下触发
```

**问题**：
- 小势力获得额外防御加成
- 设计初衷是保护弱者，但也延长了游戏时间
- 让最后几个势力更难被消灭

---

## User Scenarios & Testing _(mandatory)_

### User Story 1 - 观察大一统进程 (Priority: P1)

作为玩家，我希望能在合理的游戏时间内（10-30 分钟）看到某个势力统一世界，体验征服的成就感。

**Why this priority**: 这是游戏的核心体验，如果永远无法看到统一，游戏就失去了目标感。

**Independent Test**: 启动游戏，观察是否能在 30 分钟内出现胜利者。

**Acceptance Scenarios**:

1. **Given** 游戏开始有 30 个指挥官, **When** 游戏运行 20-30 分钟, **Then** 应该有一个势力占领超过 70% 的领土
2. **Given** 游戏运行中, **When** 某势力占领 90% 领土, **Then** 系统宣布该势力胜利
3. **Given** 游戏运行中, **When** 只剩最后 3 个势力, **Then** 游戏进入"决战阶段"，加速结束

---

### User Story 2 - 强者恒强的正反馈 (Priority: P1)

作为玩家，我希望看到占领更多领土的势力变得更强，形成明显的"滚雪球"效应。

**Why this priority**: 没有正反馈，游戏会陷入僵局。

**Independent Test**: 观察占领 20+ 国家的势力是否明显比小势力更强。

**Acceptance Scenarios**:

1. **Given** 某势力占领 30 个国家, **When** 与只有 5 个国家的势力战斗, **Then** 胜率应超过 80%
2. **Given** 某势力占领超过 50% 领土, **When** 发起攻击, **Then** 应获得显著的攻击加成（至少 +30%）

---

### User Story 3 - 力量恢复机制 (Priority: P2)

作为玩家，我希望强大的势力能够恢复战斗消耗，而不是越打越弱。

**Why this priority**: 没有恢复机制，所有势力最终都会衰退到无法战斗。

**Independent Test**: 观察大势力的力量值是否能保持稳定或增长。

**Acceptance Scenarios**:

1. **Given** 某势力占领 20 个国家, **When** 每个 tick, **Then** 应恢复一定量的力量值
2. **Given** 某势力占领 50 个国家, **When** 每个 tick, **Then** 恢复速度应比小势力更快

---

### User Story 4 - 决战阶段加速 (Priority: P2)

作为玩家，当游戏进入后期只剩少数势力时，我希望游戏能加速结束。

**Why this priority**: 避免游戏后期的僵持状态。

**Independent Test**: 当只剩 5 个势力时，观察战斗频率是否增加。

**Acceptance Scenarios**:

1. **Given** 只剩 5 个活跃势力, **When** 游戏继续, **Then** 战斗频率应增加 50%
2. **Given** 只剩 3 个活跃势力, **When** 游戏继续, **Then** 远程攻击概率应增加到 50%

---

### Edge Cases

- **当所有势力力量值都降到很低时**：系统设置力量最低值为 20，任何势力的 currentPower 不会低于此值
- **当某势力被完全包围且没有相邻敌人时**：决战模式下远程攻击概率提升至 40%，自动解决地理隔离问题
- **当两个势力实力完全相当时**：依靠现有战斗系统的随机性（0.8-1.2 倍随机因子）自然打破僵局

---

## Requirements _(mandatory)_

### Functional Requirements

#### 领土加成增强

- **FR-001**: 系统必须增加领土加成系数，每个城市至少 +0.5% 攻击/防御加成
- **FR-002**: 系统必须实现面积加成的指数增长，占领 30% 领土时获得 +20% 加成
- **FR-003**: 系统必须移除或降低小势力防御加成（从 10% 降到 3%）

#### 力量恢复机制

- **FR-004**: 系统必须实现力量恢复机制，每 tick 恢复 = 占领国家数 × 0.2
- **FR-005**: 系统必须设置力量值上限为 100，恢复不能超过上限
- **FR-005b**: 系统必须设置力量值下限为 20，任何势力的 currentPower 不会低于此值
- **FR-006**: 系统必须在战斗胜利后额外恢复 5 点力量（士气提升）

#### 胜利条件优化

- **FR-007**: 系统必须增加"领土胜利"条件：占领 85% 领土即可宣布胜利
- **FR-008**: 系统必须在只剩 3 个势力时触发"决战模式"

#### 决战模式

- **FR-009**: 决战模式下，战斗频率增加 100%（每 tick 最多 40 场战斗）
- **FR-010**: 决战模式下，远程攻击概率增加到 40%
- **FR-011**: 决战模式下，力量消耗减少 50%（加速决出胜负）

#### 联盟系统优化

- **FR-012**: 系统必须在决战模式下禁止新联盟形成
- **FR-013**: 系统必须在某势力占领 50% 领土后，强制解散其所有联盟

### Key Entities

- **PowerRecoverySystem**: 负责计算和应用力量恢复的系统
- **EndgameManager**: 管理决战模式的触发和效果
- **VictoryCondition**: 扩展的胜利条件配置

---

## Quality Guardrails

- **Code Quality**: 所有新增代码需通过 ESLint 检查，遵循现有代码风格
- **Testing Evidence**: 为每个新系统编写单元测试，覆盖率目标 80%
- **User Experience**: 添加 UI 提示显示当前游戏阶段（早期/中期/决战）
- **Performance & Observability**: 新增系统不应增加超过 5% 的 tick 处理时间

---

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: 90% 的游戏能在 30 分钟内产生胜利者
- **SC-002**: 占领 50% 领土的势力应在 10 分钟内扩张到 70%+
- **SC-003**: 游戏后期（剩余 5 个势力）到结束的时间不超过 10 分钟
- **SC-004**: 领先势力的力量值应保持在 60+ 而非持续衰退

---

## 实施方案（本次迭代全部实施）

| 优先级 | 方案 | 预期效果 | 实现难度 | 状态 |
|--------|------|----------|----------|------|
| P0 | 增加领土加成系数 | 形成滚雪球效应 | 低（修改配置） | ✅ 本次实施 |
| P0 | 添加力量恢复机制 | 防止势力衰退 | 中（新增系统） | ✅ 本次实施 |
| P1 | 领土胜利条件（85%） | 加速游戏结束 | 低（修改判断） | ✅ 本次实施 |
| P1 | 决战模式 | 加速后期进程 | 中（新增逻辑） | ✅ 本次实施 |
| P2 | 联盟系统优化 | 减少僵局 | 低（修改条件） | ✅ 本次实施 |
| P2 | 移除小势力保护 | 加速淘汰 | 低（修改配置） | ✅ 本次实施 |

---

## 快速修复建议（可立即实施）

### 1. 修改 `territoryBonus.config.ts`

```typescript
export const DEFAULT_TERRITORY_BONUS_CONFIG: TerritoryBonusConfig = {
  maxAttackBonus: 0.6,           // 提高到 60%
  maxDefenseBonus: 0.5,          // 提高到 50%
  cityBaseFactor: 0.005,         // 每城市 +0.5%（原 0.1%）
  areaBaseFactor: 1.2,           // 提高面积系数（原 0.8）
  smallFactionDefenseBonus: 0.03, // 降低到 3%（原 10%）
  smallFactionThreshold: 3,       // 降低阈值（原 5）
};
```

### 2. 修改 `victorySystem.ts`

```typescript
update(_deltaMs: number): void {
  const state = useGameStore.getState();
  const { commanders, territories } = state;
  
  const activeCommanders = commanders.filter((c) => c.status === 'active');
  
  // 新增：领土胜利条件
  const totalTerritories = territories.length;
  for (const commander of activeCommanders) {
    const controlledCount = commander.controlledTerritories.length;
    if (controlledCount / totalTerritories >= 0.85) {
      this.declareVictory(commander.id);
      return;
    }
  }
  
  // 原有：消灭所有对手
  if (activeCommanders.length === 1) {
    this.declareVictory(activeCommanders[0].id);
  }
}
```

### 3. 在 `battleSystem.ts` 中添加力量恢复

```typescript
// 在 update() 方法末尾添加
private applyPowerRecovery(): void {
  const state = useGameStore.getState();
  const activeCommanders = state.commanders.filter(c => c.status === 'active');
  
  for (const commander of activeCommanders) {
    const territoryCount = commander.controlledTerritories.length;
    const recovery = Math.floor(territoryCount * 0.3); // 每国家恢复 0.3
    const newPower = Math.min(100, commander.currentPower + recovery);
    
    if (newPower > commander.currentPower) {
      this.batch.commanders.set(commander.id, {
        ...this.batch.commanders.get(commander.id),
        currentPower: newPower,
      });
    }
  }
}
```

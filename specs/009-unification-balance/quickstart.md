# Quickstart: 大一统平衡优化

**Feature**: 009-unification-balance  
**Branch**: `009-unification-balance`

## 快速开始

### 1. 切换到功能分支

```bash
git checkout 009-unification-balance
```

### 2. 安装依赖

```bash
cd app
pnpm install
```

### 3. 启动开发服务器

```bash
pnpm dev
```

### 4. 运行测试

```bash
# 单元测试
pnpm test

# E2E 测试
pnpm test:e2e
```

## 实施顺序

按以下顺序实施以确保每步都可独立验证：

### Step 1: 配置修改（低风险，立即见效）

1. **修改 `territoryBonus.config.ts`**
   - 提高 `cityBaseFactor` 到 0.005
   - 提高 `areaBaseFactor` 到 1.2
   - 降低 `smallFactionDefenseBonus` 到 0.03

2. **验证**: 观察大势力是否获得更高加成

### Step 2: 力量恢复系统

1. **创建 `powerRecovery.config.ts`**
2. **创建 `powerRecoverySystem.ts`**
3. **在 `tickScheduler.ts` 中注册**

4. **验证**: 观察大势力力量值是否稳定在 60+

### Step 3: 胜利条件优化

1. **创建 `victory.config.ts`**
2. **修改 `victorySystem.ts`** 添加领土胜利判定

3. **验证**: 当某势力占领 85% 领土时触发胜利

### Step 4: 决战模式

1. **创建 `endgame.config.ts`**
2. **修改 `store.ts`** 添加决战模式状态
3. **修改 `battleSystem.ts`** 应用决战模式效果
4. **修改 `targetSelector.ts`** 提高远程攻击概率

5. **验证**: 当只剩 3 个势力时，战斗加速

### Step 5: 联盟系统优化

1. **修改 `allianceSystem.ts`**
   - 决战模式下禁止新联盟
   - 50% 领土后解散联盟

2. **验证**: 大势力不再有联盟保护

## 关键文件

| 文件 | 操作 | 说明 |
|------|------|------|
| `config/territoryBonus.config.ts` | 修改 | 提高加成系数 |
| `config/powerRecovery.config.ts` | 新增 | 力量恢复配置 |
| `config/endgame.config.ts` | 新增 | 决战模式配置 |
| `config/victory.config.ts` | 新增 | 胜利条件配置 |
| `simulation/systems/powerRecoverySystem.ts` | 新增 | 力量恢复系统 |
| `simulation/systems/victorySystem.ts` | 修改 | 添加领土胜利 |
| `simulation/systems/battleSystem.ts` | 修改 | 决战模式效果 |
| `simulation/systems/allianceSystem.ts` | 修改 | 联盟限制 |
| `state/store.ts` | 修改 | 决战模式状态 |

## 测试验证

### 单元测试检查点

```typescript
// powerRecoverySystem.test.ts
describe('PowerRecoverySystem', () => {
  it('should recover power based on territory count');
  it('should not exceed MAX_POWER');
  it('should not go below MIN_POWER');
  it('should grant victory bonus on win');
});

// victorySystem.test.ts
describe('VictorySystem', () => {
  it('should declare victory at 85% territory');
  it('should declare victory when one commander remains');
});

// endgameMode.test.ts
describe('EndgameMode', () => {
  it('should trigger when 3 commanders remain');
  it('should double battle frequency');
  it('should increase remote attack probability');
});
```

### E2E 测试检查点

```typescript
// unification.spec.ts
describe('Unification Balance', () => {
  it('should produce a winner within 30 minutes');
  it('should show snowball effect for large factions');
  it('should enter endgame mode with 3 factions');
});
```

## 调试技巧

### 启用详细日志

在 `debug.config.ts` 中启用相关日志：

```typescript
export const LOG_CONFIG = {
  BATTLE_SYSTEM: true,
  TERRITORY_BONUS: true,
  POWER_RECOVERY: true,  // 新增
  ENDGAME_MODE: true,    // 新增
  VICTORY_SYSTEM: true,  // 新增
};
```

### 快速测试决战模式

在浏览器控制台中：

```javascript
// 强制触发决战模式（仅测试用）
const store = window.__GAME_STORE__;
store.getState().setEndgameMode(true);
```

### 观察力量恢复

```javascript
// 监控某个势力的力量值
const commanderId = 'commander-0';
setInterval(() => {
  const commander = store.getState().commanders.find(c => c.id === commanderId);
  console.log(`${commander.name}: Power=${commander.currentPower}, Territories=${commander.controlledTerritories.length}`);
}, 5000);
```

## 常见问题

### Q: 游戏仍然无法在 30 分钟内结束？

检查：
1. 领土加成是否生效（查看 factionStats）
2. 力量恢复是否工作（力量值应稳定在 60+）
3. 决战模式是否触发（isEndgameMode 应为 true）

### Q: 决战模式没有触发？

检查 `activeCommanders.length` 是否 ≤ 3。可能有"僵尸"势力（无领土但未标记为 eliminated）。

### Q: 领土胜利没有触发？

检查 `controlledTerritories.length / territories.length` 是否 ≥ 0.85。

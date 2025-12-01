# Quickstart: 领主占领逻辑修复

**Feature**: 007-conquest-logic-fix  
**Date**: 2025-12-01

## 概述

本功能修复领主占领逻辑的两个问题：
1. 确保每个活跃领主在游戏开始时必须拥有至少一个国家
2. 领主攻击目标 85% 概率选择相邻国家，15% 概率允许远程攻击

## 快速开始

### 1. 切换到功能分支

```bash
git checkout 007-conquest-logic-fix
```

### 2. 安装依赖

```bash
pnpm install
```

### 3. 运行测试

```bash
# 运行所有测试
pnpm test

# 运行特定测试文件
pnpm test tests/unit/battleSystem.spec.ts
pnpm test tests/unit/createInitialWorld.spec.ts
```

### 4. 启动开发服务器

```bash
pnpm dev
```

访问 http://localhost:5173 查看游戏

## 修改文件清单

| 文件 | 修改类型 | 说明 |
|------|----------|------|
| `app/src/core/generation/createInitialWorld.ts` | 修改 | 添加初始化验证和过滤 |
| `app/src/core/simulation/systems/battleSystem.ts` | 修改 | 添加概率化目标选择 |
| `app/src/config/conquest.config.ts` | 新增 | 占领逻辑配置 |
| `tests/unit/createInitialWorld.spec.ts` | 新增/修改 | 初始化测试 |
| `tests/unit/battleSystem.spec.ts` | 新增/修改 | 目标选择测试 |
| `tests/integration/conquest-logic.spec.ts` | 新增 | 集成测试 |

## 验证方法

### 验证初始化逻辑

1. 启动游戏，打开浏览器控制台
2. 检查日志输出，确认所有活跃领主都有领土：
   ```
   ✅ Created N commanders with country-based territories
   ```
3. 如果有领主被排除，会看到：
   ```
   ⚠️ Excluded M commanders without territories
   ```

### 验证目标选择逻辑

1. 启动游戏，开启 DevHud（按 D 键）
2. 观察战斗日志，统计相邻/远程攻击比例
3. 预期：约 85% 攻击发生在相邻国家

### 自动化测试验证

```bash
# 运行概率分布测试（1000次模拟）
pnpm test tests/unit/battleSystem.spec.ts -t "target selection probability"
```

## 配置调整

如需调整相邻攻击概率，修改配置文件：

```typescript
// app/src/config/conquest.config.ts
export const CONQUEST_CONFIG: ConquestConfig = {
  adjacentTargetProbability: 0.85,  // 修改此值
  allowRemoteAttack: true,
};
```

## 常见问题

### Q: 为什么有些领主没有出现在游戏中？

A: 如果初始化时可用国家数量少于领主数量，部分领主会被排除。这是预期行为。

### Q: 远程攻击是否会导致游戏不平衡？

A: 15% 的远程攻击概率足够低，不会显著影响游戏平衡，但会增加戏剧性。

### Q: 如何完全禁用远程攻击？

A: 设置 `allowRemoteAttack: false` 或 `adjacentTargetProbability: 1.0`

# Quickstart: 国土领土加成系统

**Feature**: 008-territory-bonus  
**Date**: 2025-12-01

## 快速开始

### 1. 开发环境准备

```bash
# 切换到功能分支
git checkout 008-territory-bonus

# 安装依赖
pnpm install

# 启动开发服务器
pnpm dev
```

### 2. 核心文件位置

| 文件                                             | 用途                     |
| ------------------------------------------------ | ------------------------ |
| `app/src/core/services/territoryBonusService.ts` | 加成计算核心逻辑（新建） |
| `app/src/core/types.ts`                          | 类型定义扩展             |
| `app/src/core/state/store.ts`                    | 状态管理扩展             |
| `app/src/core/services/factionStatsService.ts`   | 集成加成计算             |
| `app/src/ui/panels/FactionStatsPanel.tsx`        | UI展示加成               |

### 3. 实现步骤

#### Step 1: 添加类型定义

在 `app/src/core/types.ts` 中添加：

```typescript
// 领土加成配置
export interface TerritoryBonusConfig { ... }

// 领土加成数据
export interface TerritoryBonus { ... }

// 连通分量分析结果
export interface ContiguityAnalysis { ... }
```

#### Step 2: 创建加成计算服务

创建 `app/src/core/services/territoryBonusService.ts`：

```typescript
export class TerritoryBonusService {
  // 计算城市数量加成
  calculateCityBonus(cityCount: number): number { ... }

  // 计算面积加成
  calculateAreaBonus(areaRatio: number): number { ... }

  // 分析连通分量
  analyzeContiguity(territoryIds: string[], countries: Country[]): ContiguityAnalysis { ... }

  // 计算小势力防御加成
  calculateSmallFactionBonus(cityCount: number): number { ... }

  // 计算总加成
  calculateTotalBonus(commanderId: string): TerritoryBonus { ... }
}
```

#### Step 3: 扩展 Store

在 `app/src/core/state/store.ts` 中添加：

```typescript
// 状态
territoryBonusConfig: TerritoryBonusConfig;

// Actions
updateTerritoryBonus: (commanderId: string, bonus: TerritoryBonus) => void;
setTerritoryBonusConfig: (config: Partial<TerritoryBonusConfig>) => void;
```

#### Step 4: 集成到 FactionStatsService

修改 `handleTerritoryChange()` 方法，在领土统计更新后调用加成计算。

#### Step 5: 更新 UI

修改 `FactionStatsPanel.tsx` 展示加成明细。

### 4. 测试

```bash
# 运行单元测试
pnpm test

# 运行特定测试文件
pnpm test territoryBonusService

# 查看测试覆盖率
pnpm test:coverage
```

### 5. 验证清单

- [ ] 加成计算正确（对照 research.md 中的示例）
- [ ] 连通分量检测正确
- [ ] 小势力防御加成生效
- [ ] UI 正确展示加成明细
- [ ] 战斗系统应用加成
- [ ] 性能满足要求（<5ms）

## 调试技巧

### 查看加成计算日志

```typescript
// 在浏览器控制台启用日志
localStorage.setItem('DEBUG_TERRITORY_BONUS', 'true');
```

### 手动触发加成计算

```typescript
// 在浏览器控制台
const { territoryBonusService } = await import('./core/services/territoryBonusService');
const bonus = territoryBonusService.calculateTotalBonus('commander-id');
console.log(bonus);
```

## 相关文档

- [spec.md](./spec.md) - 功能规格说明
- [research.md](./research.md) - 技术研究
- [data-model.md](./data-model.md) - 数据模型

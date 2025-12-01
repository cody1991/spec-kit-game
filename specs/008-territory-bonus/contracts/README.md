# Contracts: 国土领土加成系统

**Feature**: 008-territory-bonus

## 说明

本功能为纯前端游戏逻辑，不涉及后端 API。

所有数据交互通过 Zustand Store 进行，无需定义 REST/GraphQL 契约。

## 内部接口

### TerritoryBonusService

```typescript
interface ITerritoryBonusService {
  /**
   * 计算指定指挥官的领土加成
   * @param commanderId 指挥官ID
   * @returns 领土加成数据
   */
  calculateTotalBonus(commanderId: string): TerritoryBonus;

  /**
   * 批量计算所有活跃指挥官的加成
   * @returns 指挥官ID到加成的映射
   */
  calculateAllBonuses(): Map<string, TerritoryBonus>;

  /**
   * 分析领土连通性
   * @param territoryIds 领土ID列表
   * @returns 连通分量分析结果
   */
  analyzeContiguity(territoryIds: string[]): ContiguityAnalysis;
}
```

### Store Actions

```typescript
interface TerritoryBonusActions {
  updateTerritoryBonus: (commanderId: string, bonus: TerritoryBonus) => void;
  setTerritoryBonusConfig: (config: Partial<TerritoryBonusConfig>) => void;
}
```

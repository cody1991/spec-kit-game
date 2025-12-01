# Research: 国土领土加成系统

**Feature**: 008-territory-bonus  
**Date**: 2025-12-01

## 研究任务

### 1. 递减增长曲线公式选择

**Decision**: 使用对数函数实现递减增长

**Rationale**:
- 对数函数 `log(1 + x)` 天然具有递减增长特性
- 前期增长快（1→5城市增长明显），后期边际递减（10→15城市增长缓慢）
- 公式简单，计算高效，易于调参

**公式设计**:
```
城市加成 = min(MAX_BONUS, BASE_FACTOR * log(1 + cityCount * SCALE_FACTOR))
面积加成 = min(MAX_BONUS, BASE_FACTOR * log(1 + areaRatio * SCALE_FACTOR))

其中:
- MAX_BONUS = 0.30 (30%上限)
- BASE_FACTOR = 0.15 (基础系数，控制增长速度)
- SCALE_FACTOR = 0.5 (缩放系数，控制曲线形状)
- areaRatio = 势力面积 / 总地图面积
```

**示例计算** (城市加成):
| 城市数 | 加成值 | 说明 |
|--------|--------|------|
| 1 | 5% | 单城市基础加成 |
| 3 | 10% | 小势力 |
| 5 | 13% | 中等势力 |
| 10 | 18% | 大势力 |
| 20 | 23% | 超大势力 |
| 50+ | 30% | 触及上限 |

**Alternatives considered**:
- 线性增长：增长过于均匀，大国优势不明显
- 指数增长：后期增长过快，容易失衡
- 阶梯函数：不够平滑，玩家体验不佳

### 2. 连续领土检测算法

**Decision**: 使用 BFS/DFS 连通分量算法

**Rationale**:
- 现有 `Country.neighbors` 数据已提供邻接关系
- BFS 时间复杂度 O(V+E)，对于 ~200 个国家足够高效
- 可复用现有数据结构，无需额外存储

**算法流程**:
1. 获取势力所有控制领土 ID 列表
2. 构建子图（仅包含该势力领土）
3. BFS 遍历找出所有连通分量
4. 返回最大连通分量大小和连通分量数量

**连续区域额外加成**:
```
连续加成 = 基础加成 * (1 + CONTINUITY_BONUS * (最大连通分量占比 - 0.5))

其中:
- CONTINUITY_BONUS = 0.2 (最多额外20%加成)
- 最大连通分量占比 = 最大连通分量城市数 / 总城市数
- 仅当占比 > 50% 时才有额外加成
```

**Alternatives considered**:
- Union-Find：实现更复杂，优势不明显
- 预计算邻接矩阵：内存开销大，实时性差

### 3. 小势力防御加成机制

**Decision**: 反向递减加成（城市越少，防御加成越高）

**Rationale**:
- 保持小势力生存能力，避免被大国秒杀
- 符合"困兽犹斗"的游戏体验
- 与大国攻击加成形成博弈

**公式设计**:
```
小势力防御加成 = max(0, SMALL_FACTION_BONUS * (THRESHOLD - cityCount) / THRESHOLD)

其中:
- SMALL_FACTION_BONUS = 0.15 (最高15%防御加成)
- THRESHOLD = 3 (3城市以下触发)
```

**示例**:
| 城市数 | 防御加成 |
|--------|----------|
| 1 | 10% |
| 2 | 5% |
| 3+ | 0% |

### 4. 与现有系统集成方案

**Decision**: 扩展 FactionStatistics 类型，新增 TerritoryBonusService

**集成点**:
1. **types.ts**: 扩展 `FactionStatistics` 添加加成字段
2. **store.ts**: 添加加成状态和更新方法
3. **factionStatsService.ts**: 在领土变化时调用加成计算
4. **battleSystem.ts**: 战斗计算时应用加成
5. **FactionStatsPanel.tsx**: 展示加成明细

**数据流**:
```
领土变化 → factionStatsService.handleTerritoryChange()
         → territoryBonusService.calculateBonus()
         → store.updateFactionStats() (包含加成)
         → battleSystem 读取加成 → 应用到战斗
         → FactionStatsPanel 展示
```

### 5. 性能优化策略

**Decision**: 缓存 + 增量更新

**策略**:
1. **缓存加成值**: 存储在 store 中，避免重复计算
2. **增量更新**: 仅在领土变化时重新计算受影响势力
3. **防抖处理**: 连续领土变化时合并计算（复用现有 debounce）
4. **异步计算**: 使用 `requestIdleCallback` 避免阻塞主线程

**性能预期**:
- 单次加成计算: <1ms
- 连通分量检测: <3ms (200个国家)
- 总计算时间: <5ms

## 技术风险

| 风险 | 影响 | 缓解措施 |
|------|------|----------|
| 加成计算影响帧率 | 中 | 使用缓存和异步计算 |
| 连通分量算法复杂 | 低 | 复用现有邻接数据 |
| 加成参数不平衡 | 中 | 可配置参数，便于调优 |

## 结论

所有技术问题已解决，可进入 Phase 1 设计阶段。

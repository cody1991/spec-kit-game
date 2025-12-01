# Quick Start: 势力统计排行榜开发指南

**Feature**: 005-faction-stats  
**Date**: 2025-12-01  
**Audience**: 开发者、QA工程师

## 快速概览

本功能为游戏添加一个全新的势力统计排行榜面板，展示所有势力的综合数据：
- **领土统计**: 国家数量、国土面积
- **战斗统计**: 战胜次数、战败次数、胜率
- **排序规则**: 按国家数量降序排列（主），面积降序（次）

## 开发环境准备

### 1. 安装依赖

```bash
cd /Users/codytang/Desktop/tencent/spec-kit-game
pnpm install
```

### 2. 运行开发服务器

```bash
cd app
pnpm dev
```

访问 `http://localhost:5173`

### 3. 运行测试

```bash
# 单元测试
pnpm test

# 监听模式
pnpm test:watch

# E2E测试
pnpm test:e2e
```

## 核心文件结构

```
app/src/
├── core/
│   ├── state/store.ts                   # [修改] 新增 factionStats 状态
│   ├── services/
│   │   └── factionStatsService.ts       # [新建] 统计服务
│   └── types.ts                         # [修改] 新增类型定义
│
├── ui/panels/
│   ├── FactionStatsPanel.tsx            # [新建] 主面板组件
│   ├── FactionStatsPanel.css            # [新建] 样式
│   ├── FactionDetailPanel.tsx           # [新建] 详情面板(P3)
│   └── FactionDetailPanel.css           # [新建] 详情样式(P3)
│
└── App.tsx                               # [修改] 集成面板

tests/
├── unit/services/factionStatsService.spec.ts
├── integration/ui/factionStatsPanel.spec.ts
└── e2e/faction-stats.spec.ts
```

## 开发步骤（TDD方式）

### Phase 1: 类型定义

**文件**: `app/src/core/types.ts`

```typescript
// 1. 添加势力统计类型
export interface FactionStatistics {
  commanderId: string;
  commanderName: string;
  status: 'active' | 'eliminated';
  countryCount: number;
  totalArea: number;
  wins: number;
  losses: number;
  winRate: number; // -1 for N/A, [0, 1] otherwise
  lastUpdatedAt: number;
}

// 2. 添加排行榜类型
export interface Leaderboard {
  factions: FactionStatistics[];
  timestamp: number;
}
```

### Phase 2: 状态管理

**文件**: `app/src/core/state/store.ts`

```typescript
// 1. 在 GameState 接口中添加
interface GameState {
  // ... 现有状态
  factionStats: Map<string, FactionStatistics>; // [NEW]
  
  // ... 现有 actions
  updateFactionStats: (commanderId: string, updates: Partial<FactionStatistics>) => void; // [NEW]
  initializeFactionStats: () => void; // [NEW]
}

// 2. 在 create 中初始化
export const useGameStore = create<GameState>((set, get) => ({
  // ... 现有状态
  factionStats: new Map(),
  
  // ... 现有 actions
  
  updateFactionStats: (commanderId, updates) =>
    set((state) => {
      const newMap = new Map(state.factionStats);
      const existing = newMap.get(commanderId) || createEmptyStats(commanderId);
      newMap.set(commanderId, { ...existing, ...updates, lastUpdatedAt: Date.now() });
      return { factionStats: newMap };
    }),
  
  initializeFactionStats: () => {
    const { commanders, territories, countries } = get();
    const statsMap = new Map<string, FactionStatistics>();
    
    commanders.forEach(commander => {
      // 计算初始统计
      const stats = calculateInitialStats(commander, territories, countries);
      statsMap.set(commander.id, stats);
    });
    
    set({ factionStats: statsMap });
  },
}));
```

### Phase 3: 统计服务（TDD）

**测试文件**: `tests/unit/services/factionStatsService.spec.ts`

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { FactionStatsService } from '@core/services/factionStatsService';

describe('FactionStatsService', () => {
  let service: FactionStatsService;
  
  beforeEach(() => {
    service = new FactionStatsService();
  });
  
  describe('战斗统计更新', () => {
    it('should increment wins when attack succeeds', () => {
      // Given
      const initialStats = {
        commanderId: 'napoleon',
        wins: 10,
        losses: 2,
      };
      
      // When
      service.handleBattleResult({
        attackerId: 'napoleon',
        defenderId: 'wellington',
        result: 'success',
      });
      
      // Then
      const updatedStats = service.getStats('napoleon');
      expect(updatedStats.wins).toBe(11);
    });
    
    // ... 更多测试用例
  });
});
```

**实现文件**: `app/src/core/services/factionStatsService.ts`

```typescript
import { useGameStore } from '@core/state/store';
import type { BattleEvent, Territory, Country } from '@core/types';

export class FactionStatsService {
  private unsubscribe: (() => void) | null = null;
  
  // 启动服务，订阅事件
  start(): void {
    const store = useGameStore.getState();
    
    // 初始化统计
    store.initializeFactionStats();
    
    // 订阅战斗事件
    this.unsubscribe = useGameStore.subscribe(
      (state) => state.eventLog,
      (eventLog) => this.handleBattleEvents(eventLog)
    );
  }
  
  // 停止服务
  stop(): void {
    this.unsubscribe?.();
  }
  
  // 处理战斗事件
  private handleBattleEvents(eventLog: BattleEvent[]): void {
    const latestEvent = eventLog[eventLog.length - 1];
    if (!latestEvent || latestEvent.type !== 'attack') return;
    if (!latestEvent.defenderId) return; // 跳过中立领土
    
    const store = useGameStore.getState();
    
    if (latestEvent.result === 'success') {
      // 更新进攻方战胜
      const attackerStats = store.factionStats.get(latestEvent.attackerId);
      if (attackerStats) {
        const newWins = attackerStats.wins + 1;
        const newWinRate = this.calculateWinRate(newWins, attackerStats.losses);
        store.updateFactionStats(latestEvent.attackerId, { wins: newWins, winRate: newWinRate });
      }
      
      // 更新防守方战败
      const defenderStats = store.factionStats.get(latestEvent.defenderId);
      if (defenderStats) {
        const newLosses = defenderStats.losses + 1;
        const newWinRate = this.calculateWinRate(defenderStats.wins, newLosses);
        store.updateFactionStats(latestEvent.defenderId, { losses: newLosses, winRate: newWinRate });
      }
    }
  }
  
  // 计算胜率
  private calculateWinRate(wins: number, losses: number): number {
    const total = wins + losses;
    return total === 0 ? -1 : wins / total;
  }
}

// 全局单例
export const factionStatsService = new FactionStatsService();
```

### Phase 4: UI组件（TDD）

**测试文件**: `tests/integration/ui/factionStatsPanel.spec.ts`

```typescript
import { render, screen, waitFor } from '@testing-library/react';
import { FactionStatsPanel } from '@ui/panels/FactionStatsPanel';
import { useGameStore } from '@core/state/store';

describe('FactionStatsPanel', () => {
  it('should display leaderboard with sorted factions', async () => {
    // Setup mock data
    useGameStore.setState({
      factionStats: new Map([
        ['napoleon', { commanderId: 'napoleon', commanderName: '拿破仑', countryCount: 20, ... }],
        ['alexander', { commanderId: 'alexander', commanderName: '亚历山大', countryCount: 15, ... }],
      ]),
    });
    
    render(<FactionStatsPanel />);
    
    // Verify first faction has more countries
    const rows = screen.getAllByRole('row');
    expect(rows[1]).toHaveTextContent('拿破仑'); // First data row
    expect(rows[2]).toHaveTextContent('亚历山大');
  });
});
```

**实现文件**: `app/src/ui/panels/FactionStatsPanel.tsx`

```typescript
import { useMemo } from 'react';
import { useGameStore } from '@core/state/store';
import './FactionStatsPanel.css';

export function FactionStatsPanel() {
  const factionStats = useGameStore((state) => state.factionStats);
  const isPanelOpen = useGameStore((state) => state.showFactionStatsPanel);
  const closePan = useGameStore((state) => state.closeFactionStatsPanel);
  
  // 排序排行榜
  const leaderboard = useMemo(() => {
    const stats = Array.from(factionStats.values());
    return stats
      .sort((a, b) => {
        if (b.countryCount !== a.countryCount) {
          return b.countryCount - a.countryCount;
        }
        return b.totalArea - a.totalArea;
      })
      .map((faction, index) => ({ ...faction, rank: index + 1 }));
  }, [factionStats]);
  
  if (!isPanelOpen) return null;
  
  return (
    <div className="faction-stats-panel">
      <div className="panel-header">
        <h2>势力统计排行榜</h2>
        <button onClick={closePanel}>×</button>
      </div>
      
      <table className="leaderboard">
        <thead>
          <tr>
            <th>排名</th>
            <th>势力</th>
            <th>国家数</th>
            <th>面积</th>
            <th>战胜</th>
            <th>战败</th>
            <th>胜率</th>
          </tr>
        </thead>
        <tbody>
          {leaderboard.map(faction => (
            <tr key={faction.commanderId}>
              <td>{faction.rank}</td>
              <td>{faction.commanderName}</td>
              <td>{faction.countryCount}</td>
              <td>{formatArea(faction.totalArea)}</td>
              <td>{faction.wins}</td>
              <td>{faction.losses}</td>
              <td>{formatWinRate(faction.winRate)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function formatArea(area: number): string {
  if (area > 1000000) {
    return `${(area / 1000000).toFixed(1)}M`;
  }
  return `${(area / 1000).toFixed(0)}K`;
}

function formatWinRate(winRate: number): string {
  if (winRate < 0) return 'N/A';
  return `${(winRate * 100).toFixed(1)}%`;
}
```

### Phase 5: 集成到应用

**文件**: `app/src/App.tsx`

```typescript
import { FactionStatsPanel } from './ui/panels/FactionStatsPanel';
import { factionStatsService } from './core/services/factionStatsService';

function App() {
  // 启动统计服务
  useEffect(() => {
    factionStatsService.start();
    return () => factionStatsService.stop();
  }, []);
  
  // 键盘快捷键
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === 's' || e.key === 'S') {
        useGameStore.getState().toggleFactionStatsPanel();
      }
    };
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, []);
  
  return (
    <>
      {/* ... 现有组件 */}
      <FactionStatsPanel />
    </>
  );
}
```

## 测试清单

### 单元测试
- [ ] 统计计算逻辑（战胜/战败/胜率）
- [ ] 排序算法（主次排序）
- [ ] 边界情况（零战斗、负数防护）

### 集成测试
- [ ] 战斗事件触发统计更新
- [ ] 领土变更触发统计更新
- [ ] Zustand store 数据流

### E2E测试
- [ ] 打开面板显示排行榜
- [ ] 战斗后数据自动更新
- [ ] 键盘快捷键交互

## 调试技巧

### 1. 查看统计数据

```typescript
// 浏览器控制台
useGameStore.getState().factionStats
```

### 2. 触发统计更新

```typescript
// 模拟战斗事件
useGameStore.getState().addBattleEvent({
  type: 'attack',
  attackerId: 'napoleon',
  defenderId: 'wellington',
  result: 'success',
  territoryId: 'FRA',
  timestamp: new Date().toISOString(),
  ...
});
```

### 3. 查看排序结果

```typescript
// 浏览器控制台
const stats = Array.from(useGameStore.getState().factionStats.values());
stats.sort((a, b) => b.countryCount - a.countryCount);
```

## 性能监控

### 1. 统计计算时间

```typescript
console.time('statsUpdate');
service.handleBattleEvents(eventLog);
console.timeEnd('statsUpdate'); // 应 < 1ms
```

### 2. 排序时间

```typescript
console.time('leaderboardSort');
const sorted = sortLeaderboard(stats);
console.timeEnd('leaderboardSort'); // 应 < 5ms (50个势力)
```

### 3. 组件渲染时间

使用 React DevTools Profiler 查看 `FactionStatsPanel` 渲染时间（应 < 100ms）

## 常见问题

### Q1: 战胜/战败计数不准确？
**A**: 检查是否正确区分了中立领土占领（不计入战斗统计）
```typescript
if (event.type === 'attack' && event.defenderId) {
  // 仅统计有防守方的战斗
}
```

### Q2: 胜率显示为 NaN？
**A**: 检查零战斗情况的处理
```typescript
const winRate = total === 0 ? -1 : wins / total;
if (winRate < 0) return 'N/A';
```

### Q3: 排行榜排序错误？
**A**: 确保主次排序逻辑正确
```typescript
if (b.countryCount !== a.countryCount) {
  return b.countryCount - a.countryCount; // 主排序
}
return b.totalArea - a.totalArea; // 次排序
```

## 下一步

1. 完成 P1 功能（基础排行榜）
2. 测试通过所有单元测试和集成测试
3. 性能基准测试达标
4. 可选：实现 P3 功能（详情面板）

## 参考文档

- [完整规格说明](./spec.md)
- [数据模型](./data-model.md)
- [技术调研](./research.md)
- [API契约](./contracts/)

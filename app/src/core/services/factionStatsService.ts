import { useGameStore } from '../state/store';
import type { BattleEvent, FactionStatistics } from '../types';
import { debounce } from '../../utils/debounce';

/**
 * 势力统计服务
 * 负责监听游戏事件并更新势力统计数据
 */
export class FactionStatsService {
  private unsubscribeEventLog: (() => void) | null = null;
  private unsubscribeCommanders: (() => void) | null = null;
  private debouncedHandleBattle: ((event: BattleEvent) => void) | null = null;

  constructor() {
    // 创建防抖版本的战斗处理函数（1秒防抖间隔）
    this.debouncedHandleBattle = debounce(
      this.handleBattleResultInternal.bind(this),
      1000
    );
  }

  /**
   * 启动服务，订阅游戏事件
   */
  start(): void {
    const store = useGameStore.getState();
    
    // 初始化所有势力的统计数据
    store.initializeFactionStats();

    // 订阅战斗事件
    this.unsubscribeEventLog = useGameStore.subscribe(
      (state) => state.eventLog,
      (eventLog) => {
        if (eventLog.length > 0) {
          const latestEvent = eventLog[eventLog.length - 1];
          this.handleBattleResult(latestEvent);
        }
      }
    );

    // 订阅指挥官变化（用于领土统计）
    this.unsubscribeCommanders = useGameStore.subscribe(
      (state) => state.commanders,
      (commanders) => {
        this.handleTerritoryChange();
      }
    );

    console.log('📊 FactionStatsService started');
  }

  /**
   * 停止服务，取消订阅
   */
  stop(): void {
    this.unsubscribeEventLog?.();
    this.unsubscribeCommanders?.();
    console.log('📊 FactionStatsService stopped');
  }

  /**
   * 计算胜率
   * @param wins 战胜次数
   * @param losses 战败次数
   * @returns 胜率 (0-1)，如果总数为0则返回-1表示N/A
   */
  private calculateWinRate(wins: number, losses: number): number {
    const total = wins + losses;
    return total === 0 ? -1 : wins / total;
  }

  /**
   * 处理战斗结果，更新战胜/战败统计（防抖版本的入口）
   * @param event 战斗事件
   */
  private handleBattleResult(event: BattleEvent): void {
    this.debouncedHandleBattle?.(event);
  }

  /**
   * 处理战斗结果的实际逻辑（内部使用，已防抖）
   * @param event 战斗事件
   */
  private handleBattleResultInternal(event: BattleEvent): void {
    // 使用 requestIdleCallback 异步执行，避免阻塞主线程
    const scheduleUpdate = () => {
      if ('requestIdleCallback' in window) {
        requestIdleCallback(() => this.updateBattleStats(event));
      } else {
        // Fallback for browsers without requestIdleCallback
        setTimeout(() => this.updateBattleStats(event), 0);
      }
    };

    scheduleUpdate();
  }

  /**
   * 更新战斗统计数据
   * @param event 战斗事件
   */
  private updateBattleStats(event: BattleEvent): void {
    console.time('⚔️ Battle stats update');

    // 仅处理有防守方的attack事件（排除中立领土占领）
    if (event.type !== 'attack' || !event.defenderId) {
      console.timeEnd('⚔️ Battle stats update');
      return;
    }

    const store = useGameStore.getState();
    const attackerStats = store.factionStats.get(event.attackerId!);
    const defenderStats = store.factionStats.get(event.defenderId);

    if (!attackerStats || !defenderStats) {
      console.timeEnd('⚔️ Battle stats update');
      return;
    }

    // 进攻成功：进攻方战胜+1，防守方战败+1
    if (event.result === 'success') {
      const newAttackerWins = attackerStats.wins + 1;
      const newDefenderLosses = defenderStats.losses + 1;

      store.updateFactionStats(event.attackerId!, {
        wins: newAttackerWins,
        winRate: this.calculateWinRate(newAttackerWins, attackerStats.losses),
      });

      store.updateFactionStats(event.defenderId, {
        losses: newDefenderLosses,
        winRate: this.calculateWinRate(defenderStats.wins, newDefenderLosses),
      });

      console.log(
        `⚔️ Battle stats updated: ${attackerStats.commanderName} wins+1, ${defenderStats.commanderName} losses+1`,
        `(${new Date().toISOString()})`
      );
    }
    // 进攻失败：不计入任何统计

    console.timeEnd('⚔️ Battle stats update');
  }

  /**
   * 处理领土变化，更新国家数量和面积统计
   */
  private handleTerritoryChange(): void {
    const store = useGameStore.getState();
    
    // 重新计算所有势力的领土统计
    store.commanders.forEach((commander) => {
      const stats = store.factionStats.get(commander.id);
      if (!stats) return;

      // 计算当前占领的国家列表
      const ownedCountries = commander.controlledTerritories
        .map((territoryId) => {
          return store.countries.find((c) => c.id === territoryId);
        })
        .filter((c): c is NonNullable<typeof c> => c !== undefined);

      const countryCount = ownedCountries.length;
      const totalArea = ownedCountries.reduce((sum, c) => sum + c.area, 0);

      // 只有变化时才更新
      if (countryCount !== stats.countryCount || Math.abs(totalArea - stats.totalArea) > 0.1) {
        store.updateFactionStats(commander.id, {
          countryCount,
          totalArea,
          status: commander.status,
        });

        console.log(`🗺️ Territory stats updated: ${commander.name} - ${countryCount} countries, ${(totalArea / 1000000).toFixed(2)}M km²`);
      }
    });
  }
}

/**
 * 全局单例
 */
export const factionStatsService = new FactionStatsService();

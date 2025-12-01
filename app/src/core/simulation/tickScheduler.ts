import { useGameStore } from '../state/store';
import { BattleSystem } from './systems/battleSystem';
import { LogisticsSystem } from './systems/logisticsSystem';
import { AllianceSystem } from './systems/allianceSystem';
import { VictorySystem } from './systems/victorySystem';
import { PowerRecoverySystem } from './systems/powerRecoverySystem';
import { EndgameManager } from './systems/endgameManager';
import { ConquestProgressSystem } from './systems/conquestProgressSystem';
import { logger } from '@/config/debug.config';

export interface System {
  name: string;
  update(deltaMs: number): void;
}

/**
 * Tick 调度器
 *
 * @performance
 * - 使用 requestAnimationFrame 进行调度
 * - 添加 Tick 耗时监控和警告
 * - 支持性能降级（跳过非关键系统）
 */
export class TickScheduler {
  private systems: System[] = [];
  private tickInterval: number = 100; // 0.1 second per tick (5x faster)
  private lastTickTime: number = 0;
  private isRunning: boolean = false;
  private rafId: number | null = null;
  private readonly TICK_WARNING_THRESHOLD_MS = 200; // 超过此值发出警告
  private consecutiveSlowTicks = 0;
  private readonly MAX_SLOW_TICKS_BEFORE_SKIP = 3; // 连续慢tick后跳过非关键系统

  constructor() {
    this.systems = [
      new EndgameManager(), // Feature: 009-unification-balance - 先检测决战模式
      new BattleSystem(),
      new ConquestProgressSystem(), // Feature: 010-gradual-conquest - 进度衰减检查
      new LogisticsSystem(),
      new AllianceSystem(),
      new PowerRecoverySystem(), // Feature: 009-unification-balance
      new VictorySystem(),
    ];
  }

  start(): void {
    if (this.isRunning) return;
    this.isRunning = true;
    this.lastTickTime = Date.now();
    this.consecutiveSlowTicks = 0;
    this.loop();
  }

  stop(): void {
    this.isRunning = false;
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
  }

  private loop = (): void => {
    if (!this.isRunning) return;

    const now = Date.now();
    const deltaMs = now - this.lastTickTime;

    const { isPaused, performanceConfig } = useGameStore.getState();

    if (!isPaused && deltaMs >= this.tickInterval) {
      const tickStart = performance.now();

      // 根据性能状态决定执行哪些系统
      const shouldSkipNonCritical = this.consecutiveSlowTicks >= this.MAX_SLOW_TICKS_BEFORE_SKIP;

      // Execute systems
      for (let i = 0; i < this.systems.length; i++) {
        const system = this.systems[i];

        // 在性能降级模式下跳过非关键系统（只保留 BattleSystem 和 VictorySystem）
        if (
          shouldSkipNonCritical &&
          system.name !== 'BattleSystem' &&
          system.name !== 'VictorySystem'
        ) {
          continue;
        }

        try {
          system.update(deltaMs);
        } catch (error) {
          logger.error(`System ${system.name} error:`, error);
        }
      }

      // Update performance metrics
      const tickMs = performance.now() - tickStart;

      // 监控 Tick 耗时
      if (tickMs > this.TICK_WARNING_THRESHOLD_MS) {
        this.consecutiveSlowTicks++;
        logger.log(
          'PERFORMANCE',
          `⚠️ Slow tick detected: ${tickMs.toFixed(2)}ms (threshold: ${this.TICK_WARNING_THRESHOLD_MS}ms)`
        );

        if (this.consecutiveSlowTicks >= this.MAX_SLOW_TICKS_BEFORE_SKIP) {
          logger.log('PERFORMANCE', `🔻 Performance degradation: skipping non-critical systems`);
        }
      } else {
        // 恢复正常
        if (this.consecutiveSlowTicks > 0) {
          this.consecutiveSlowTicks = Math.max(0, this.consecutiveSlowTicks - 1);
        }
      }

      useGameStore.getState().updatePerformance({ tickMs });
      useGameStore.getState().incrementTick();

      this.lastTickTime = now;
    }

    this.rafId = requestAnimationFrame(this.loop);
  };

  /**
   * 获取当前性能状态
   */
  getPerformanceStatus(): {
    consecutiveSlowTicks: number;
    isInDegradedMode: boolean;
  } {
    return {
      consecutiveSlowTicks: this.consecutiveSlowTicks,
      isInDegradedMode: this.consecutiveSlowTicks >= this.MAX_SLOW_TICKS_BEFORE_SKIP,
    };
  }
}

export const globalTickScheduler = new TickScheduler();

import { useGameStore } from '../state/store';
import { BattleSystem } from './systems/battleSystem';
import { LogisticsSystem } from './systems/logisticsSystem';
import { AllianceSystem } from './systems/allianceSystem';
import { VictorySystem } from './systems/victorySystem';

export interface System {
  name: string;
  update(deltaMs: number): void;
}

export class TickScheduler {
  private systems: System[] = [];
  private tickInterval: number = 500; // 0.5 seconds per tick (4x faster)
  private lastTickTime: number = 0;
  private isRunning: boolean = false;
  private rafId: number | null = null;

  constructor() {
    this.systems = [
      new BattleSystem(),
      new LogisticsSystem(),
      new AllianceSystem(),
      new VictorySystem(),
    ];
  }

  start(): void {
    if (this.isRunning) return;
    this.isRunning = true;
    this.lastTickTime = Date.now();
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

    const { isPaused } = useGameStore.getState();

    if (!isPaused && deltaMs >= this.tickInterval) {
      const tickStart = performance.now();

      // Execute all systems
      this.systems.forEach((system) => {
        try {
          system.update(deltaMs);
        } catch (error) {
          console.error(`System ${system.name} error:`, error);
        }
      });

      // Update performance metrics
      const tickMs = performance.now() - tickStart;
      useGameStore.getState().updatePerformance({ tickMs });
      useGameStore.getState().incrementTick();

      this.lastTickTime = now;
    }

    this.rafId = requestAnimationFrame(this.loop);
  };
}

export const globalTickScheduler = new TickScheduler();

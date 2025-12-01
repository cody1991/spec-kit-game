/**
 * Performance Monitor
 *
 * Tracks FPS, render time, and other performance metrics.
 * Provides sliding window averages for smoother readings.
 *
 * @performance
 * - 使用滑动窗口计算平均值
 * - 支持内存使用监控
 * - 提供 FPS 稳定性日志（仅开发环境）
 */

import { logger } from '@/config/debug.config';

export class PerformanceMonitor {
  private measurements: Map<string, number[]> = new Map();
  private frameTimestamps: number[] = [];
  private readonly windowSize: number;
  private currentFps = 60;
  private averageFps = 60;
  private lastFrameTime = 0;
  private minFps = 60;
  private maxFps = 60;
  private fpsHistory: number[] = [];
  private lastLogTime = 0;
  private readonly logIntervalMs = 10000; // 每10秒记录一次

  constructor(windowSize = 60) {
    this.windowSize = windowSize;
  }

  /**
   * Start a performance measurement
   */
  startMeasure(label: string): void {
    const timestamp = performance.now();
    this.measurements.set(`${label}_start`, [timestamp]);
  }

  /**
   * End a performance measurement and return duration
   */
  endMeasure(label: string): number {
    const endTime = performance.now();
    const startTimes = this.measurements.get(`${label}_start`);

    if (!startTimes || startTimes.length === 0) {
      logger.warn('PERFORMANCE', `No start measurement found for label: ${label}`);
      return 0;
    }

    const startTime = startTimes[0];
    const duration = endTime - startTime;

    // Store in history
    const history = this.measurements.get(label) || [];
    history.push(duration);

    // Keep only windowSize entries
    if (history.length > this.windowSize) {
      history.shift();
    }

    this.measurements.set(label, history);

    // Clean up start measurement
    this.measurements.delete(`${label}_start`);

    return duration;
  }

  /**
   * Get average measurement value over the window
   */
  getAverageMeasure(label: string, windowSize?: number): number {
    const history = this.measurements.get(label);
    if (!history || history.length === 0) {
      return 0;
    }

    const size = windowSize || Math.min(this.windowSize, history.length);
    const recentValues = history.slice(-size);
    const sum = recentValues.reduce((a, b) => a + b, 0);

    return sum / recentValues.length;
  }

  /**
   * Update FPS statistics
   */
  updateFps(delta: number): void {
    const currentTime = performance.now();
    this.frameTimestamps.push(currentTime);

    // Remove old timestamps (older than 1 second)
    while (this.frameTimestamps.length > 0 && currentTime - this.frameTimestamps[0] > 1000) {
      this.frameTimestamps.shift();
    }

    // Calculate current FPS
    this.currentFps = this.frameTimestamps.length;

    // Update average FPS (exponential moving average)
    this.averageFps = this.averageFps * 0.9 + this.currentFps * 0.1;

    // Track min/max FPS
    this.minFps = Math.min(this.minFps, this.currentFps);
    this.maxFps = Math.max(this.maxFps, this.currentFps);

    // Store FPS history for stability analysis
    this.fpsHistory.push(this.currentFps);
    if (this.fpsHistory.length > 300) {
      // 5 seconds at 60fps
      this.fpsHistory.shift();
    }

    // Store frame time
    this.lastFrameTime = delta;

    // Log FPS stability periodically (development only)
    if (currentTime - this.lastLogTime > this.logIntervalMs) {
      this.logFpsStability();
      this.lastLogTime = currentTime;
    }
  }

  /**
   * Log FPS stability metrics (development only)
   */
  private logFpsStability(): void {
    if (this.fpsHistory.length < 60) return;

    const avg = this.fpsHistory.reduce((a, b) => a + b, 0) / this.fpsHistory.length;
    const variance =
      this.fpsHistory.reduce((sum, fps) => sum + Math.pow(fps - avg, 2), 0) /
      this.fpsHistory.length;
    const stdDev = Math.sqrt(variance);

    // Calculate stability score (0-100, higher is better)
    const stabilityScore = Math.max(0, Math.min(100, 100 - stdDev * 2));

    logger.log(
      'PERFORMANCE',
      `📊 FPS Stability Report:
  Average: ${avg.toFixed(1)} fps
  Min: ${this.minFps} fps
  Max: ${this.maxFps} fps
  Std Dev: ${stdDev.toFixed(2)}
  Stability Score: ${stabilityScore.toFixed(0)}/100`
    );

    // Reset min/max for next period
    this.minFps = this.currentFps;
    this.maxFps = this.currentFps;
  }

  /**
   * Get current FPS
   */
  getCurrentFps(): number {
    return this.currentFps;
  }

  /**
   * Get average FPS (smoothed)
   */
  getAverageFps(): number {
    return Math.round(this.averageFps);
  }

  /**
   * Get last frame time
   */
  getLastFrameTime(): number {
    return this.lastFrameTime;
  }

  /**
   * Get FPS stability score (0-100)
   */
  getStabilityScore(): number {
    if (this.fpsHistory.length < 60) return 100;

    const avg = this.fpsHistory.reduce((a, b) => a + b, 0) / this.fpsHistory.length;
    const variance =
      this.fpsHistory.reduce((sum, fps) => sum + Math.pow(fps - avg, 2), 0) /
      this.fpsHistory.length;
    const stdDev = Math.sqrt(variance);

    return Math.max(0, Math.min(100, 100 - stdDev * 2));
  }

  /**
   * Get memory usage (if available)
   */
  getMemoryUsageMB(): number {
    // @ts-ignore - performance.memory is Chrome-specific
    if (typeof performance !== 'undefined' && performance.memory) {
      // @ts-ignore
      return performance.memory.usedJSHeapSize / (1024 * 1024);
    }
    return 0;
  }

  /**
   * Reset all statistics
   */
  reset(): void {
    this.measurements.clear();
    this.frameTimestamps = [];
    this.currentFps = 60;
    this.averageFps = 60;
    this.lastFrameTime = 0;
    this.minFps = 60;
    this.maxFps = 60;
    this.fpsHistory = [];
  }

  /**
   * Get all current statistics
   */
  getStats(): {
    currentFps: number;
    averageFps: number;
    lastFrameTime: number;
    minFps: number;
    maxFps: number;
    stabilityScore: number;
    memoryUsageMB: number;
    measurements: Record<string, number>;
  } {
    const measurements: Record<string, number> = {};

    this.measurements.forEach((values, label) => {
      if (!label.endsWith('_start')) {
        measurements[label] = this.getAverageMeasure(label);
      }
    });

    return {
      currentFps: this.currentFps,
      averageFps: Math.round(this.averageFps),
      lastFrameTime: this.lastFrameTime,
      minFps: this.minFps,
      maxFps: this.maxFps,
      stabilityScore: this.getStabilityScore(),
      memoryUsageMB: this.getMemoryUsageMB(),
      measurements,
    };
  }
}

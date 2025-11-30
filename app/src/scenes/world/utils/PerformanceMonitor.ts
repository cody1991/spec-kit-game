/**
 * Performance Monitor
 *
 * Tracks FPS, render time, and other performance metrics.
 * Provides sliding window averages for smoother readings.
 */

export class PerformanceMonitor {
  private measurements: Map<string, number[]> = new Map();
  private frameTimestamps: number[] = [];
  private readonly windowSize: number;
  private currentFps = 60;
  private averageFps = 60;
  private lastFrameTime = 0;

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
      console.warn(`No start measurement found for label: ${label}`);
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

    // Store frame time
    this.lastFrameTime = delta;
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
   * Reset all statistics
   */
  reset(): void {
    this.measurements.clear();
    this.frameTimestamps = [];
    this.currentFps = 60;
    this.averageFps = 60;
    this.lastFrameTime = 0;
  }

  /**
   * Get all current statistics
   */
  getStats(): {
    currentFps: number;
    averageFps: number;
    lastFrameTime: number;
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
      measurements,
    };
  }
}

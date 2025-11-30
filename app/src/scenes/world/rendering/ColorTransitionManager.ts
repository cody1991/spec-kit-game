/**
 * Color Transition Manager
 *
 * 管理领土颜色过渡动画，使占领状态变化更流畅自然。
 *
 * @module rendering/ColorTransitionManager
 */

import type { ColorLerpState } from '../types/mapTypes';

/**
 * 缓动函数类型
 */
export type EasingFunction = (t: number) => number;

/**
 * 颜色过渡管理器接口
 */
export interface IColorTransitionManager {
  /**
   * 启动颜色过渡
   *
   * @param countryId - 国家ID
   * @param fromColor - 起始颜色 (0xRRGGBB)
   * @param toColor - 目标颜色 (0xRRGGBB)
   * @param duration - 过渡时长 (ms)
   * @param easing - 缓动函数类型
   */
  startTransition(
    countryId: string,
    fromColor: number,
    toColor: number,
    duration?: number,
    easing?: 'linear' | 'easeInOut' | 'easeIn' | 'easeOut'
  ): void;

  /**
   * 取消指定国家的过渡
   *
   * @param countryId - 国家ID
   */
  cancelTransition(countryId: string): void;

  /**
   * 更新所有过渡状态（每帧调用）
   *
   * @param deltaTime - 距上一帧的时间 (ms)
   * @returns 当前过渡状态映射
   */
  update(deltaTime: number): Map<string, number>;

  /**
   * 获取指定国家的当前插值颜色
   *
   * @param countryId - 国家ID
   * @returns 当前颜色 (0xRRGGBB) 或 null
   */
  getCurrentColor(countryId: string): number | null;

  /**
   * 检查是否有活跃的过渡
   */
  hasActiveTransitions(): boolean;

  /**
   * 清除所有过渡
   */
  clear(): void;
}

/**
 * 颜色过渡管理器实现
 */
export class ColorTransitionManager implements IColorTransitionManager {
  private transitions: Map<string, ColorLerpState> = new Map();
  private easingFunctions: Map<string, EasingFunction>;
  private defaultDuration: number = 500; // ms

  constructor(defaultDuration?: number) {
    if (defaultDuration !== undefined) {
      this.defaultDuration = defaultDuration;
    }

    // 初始化缓动函数
    this.easingFunctions = new Map([
      ['linear', this.easeLinear],
      ['easeInOut', this.easeInOut],
      ['easeIn', this.easeIn],
      ['easeOut', this.easeOut],
    ]);
  }

  startTransition(
    countryId: string,
    fromColor: number,
    toColor: number,
    duration: number = this.defaultDuration,
    easing: 'linear' | 'easeInOut' | 'easeIn' | 'easeOut' = 'easeInOut'
  ): void {
    // 如果颜色相同，不需要过渡
    if (fromColor === toColor) {
      this.transitions.delete(countryId);
      return;
    }

    // 创建新的过渡状态
    const transition: ColorLerpState = {
      countryId,
      fromColor,
      toColor,
      startTime: Date.now(),
      duration,
      easing,
    };

    this.transitions.set(countryId, transition);
  }

  cancelTransition(countryId: string): void {
    this.transitions.delete(countryId);
  }

  update(deltaTime: number): Map<string, number> {
    const currentColors = new Map<string, number>();
    const now = Date.now();
    const toRemove: string[] = [];

    for (const [countryId, transition] of this.transitions.entries()) {
      const elapsed = now - transition.startTime;
      const progress = Math.min(elapsed / transition.duration, 1);

      if (progress >= 1) {
        // 过渡完成
        currentColors.set(countryId, transition.toColor);
        toRemove.push(countryId);
      } else {
        // 计算插值颜色
        const easingFunc = this.easingFunctions.get(transition.easing) || this.easeInOut;
        const t = easingFunc(progress);
        const color = this.lerpColor(transition.fromColor, transition.toColor, t);
        currentColors.set(countryId, color);
      }
    }

    // 移除已完成的过渡
    for (const countryId of toRemove) {
      this.transitions.delete(countryId);
    }

    return currentColors;
  }

  getCurrentColor(countryId: string): number | null {
    const transition = this.transitions.get(countryId);
    if (!transition) return null;

    const now = Date.now();
    const elapsed = now - transition.startTime;
    const progress = Math.min(elapsed / transition.duration, 1);

    if (progress >= 1) {
      return transition.toColor;
    }

    const easingFunc = this.easingFunctions.get(transition.easing) || this.easeInOut;
    const t = easingFunc(progress);
    return this.lerpColor(transition.fromColor, transition.toColor, t);
  }

  hasActiveTransitions(): boolean {
    return this.transitions.size > 0;
  }

  clear(): void {
    this.transitions.clear();
  }

  // ============================================================================
  // Private Methods - Color Interpolation
  // ============================================================================

  /**
   * 颜色线性插值
   *
   * @param fromColor - 起始颜色 (0xRRGGBB)
   * @param toColor - 目标颜色 (0xRRGGBB)
   * @param t - 插值参数 [0, 1]
   * @returns 插值后的颜色 (0xRRGGBB)
   */
  private lerpColor(fromColor: number, toColor: number, t: number): number {
    // 提取 RGB 分量
    const r1 = (fromColor >> 16) & 0xff;
    const g1 = (fromColor >> 8) & 0xff;
    const b1 = fromColor & 0xff;

    const r2 = (toColor >> 16) & 0xff;
    const g2 = (toColor >> 8) & 0xff;
    const b2 = toColor & 0xff;

    // 线性插值
    const r = Math.round(r1 + (r2 - r1) * t);
    const g = Math.round(g1 + (g2 - g1) * t);
    const b = Math.round(b1 + (b2 - b1) * t);

    // 组合回十六进制
    return (r << 16) | (g << 8) | b;
  }

  // ============================================================================
  // Private Methods - Easing Functions
  // ============================================================================

  /**
   * 线性缓动（无缓动）
   */
  private easeLinear(t: number): number {
    return t;
  }

  /**
   * 缓入缓出（S曲线）
   */
  private easeInOut(t: number): number {
    return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
  }

  /**
   * 缓入（加速）
   */
  private easeIn(t: number): number {
    return t * t;
  }

  /**
   * 缓出（减速）
   */
  private easeOut(t: number): number {
    return t * (2 - t);
  }
}

/**
 * 工厂函数：创建颜色过渡管理器
 */
export function createColorTransitionManager(defaultDuration?: number): IColorTransitionManager {
  return new ColorTransitionManager(defaultDuration);
}

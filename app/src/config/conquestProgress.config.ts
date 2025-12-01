/**
 * Conquest Progress Configuration
 *
 * Feature: 010-gradual-conquest
 * 渐进式领土蚕食机制的配置参数
 */

import type { ConquestProgressConfig } from '@/core/types';

/**
 * 默认占领进度配置
 */
export const DEFAULT_CONQUEST_PROGRESS_CONFIG: ConquestProgressConfig = {
  // 领土大小阈值 (km²)
  smallCountryThreshold: 100000,      // 10万 km²
  largeCountryThreshold: 1000000,     // 100万 km²

  // 攻击胜利时的进度增量
  smallCountryProgressGain: 40,       // 小国 +40%
  mediumCountryProgressGain: 25,      // 中国 +25%
  largeCountryProgressGain: 15,       // 大国 +15%

  // 防守成功时的进度减量
  smallCountryProgressLoss: 30,       // 小国 -30%
  mediumCountryProgressLoss: 20,      // 中国 -20%
  largeCountryProgressLoss: 12,       // 大国 -12%

  // 实力乘数
  powerAdvantageMultiplier: 1.5,      // 攻击方实力 ≥ 2× 防守方
  powerDisadvantageMultiplier: 0.7,   // 攻击方实力 ≤ 0.5× 防守方

  // 决战模式乘数
  endgameModeMultiplier: 1.5,

  // 进度衰减
  decayRatePerMinute: 5,              // 每分钟衰减 5%
  decayCheckInterval: 60,             // 每 60 tick 检查一次 (~1秒)
};

/**
 * 获取占领进度配置
 */
export function getConquestProgressConfig(): ConquestProgressConfig {
  return { ...DEFAULT_CONQUEST_PROGRESS_CONFIG };
}

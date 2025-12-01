/**
 * 力量恢复配置
 * Feature: 009-unification-balance
 *
 * 配置说明：
 * - recoveryPerTerritory: 每个领土每 tick 恢复的力量值
 * - victoryBonus: 战斗胜利后额外恢复的力量值
 * - minPower: 力量最小值（任何势力不会低于此值）
 * - maxPower: 力量最大值（恢复不会超过此值）
 *
 * 设计目标：
 * - 大势力（20+ 领土）每 tick 恢复 4+ 力量，可抵消战斗消耗
 * - 超大势力（50+ 领土）每 tick 恢复 10+ 力量，形成正向循环
 * - 最低值 20 确保势力始终有战斗能力
 */

export interface PowerRecoveryConfig {
  /** 每个领土的恢复系数 */
  recoveryPerTerritory: number;

  /** 战斗胜利额外恢复 */
  victoryBonus: number;

  /** 力量最小值 */
  minPower: number;

  /** 力量最大值 */
  maxPower: number;
}

export const DEFAULT_POWER_RECOVERY_CONFIG: PowerRecoveryConfig = {
  recoveryPerTerritory: 0.2,
  victoryBonus: 5,
  minPower: 20,
  maxPower: 100,
};

/**
 * 决战模式配置
 * Feature: 009-unification-balance
 *
 * 配置说明：
 * - triggerThreshold: 触发决战模式的活跃势力数阈值
 * - battleFrequencyMultiplier: 战斗频率倍数
 * - remoteAttackProbability: 决战模式下的远程攻击概率
 * - powerLossMultiplier: 力量消耗倍数（0.5 = 减半）
 * - allowNewAlliances: 是否允许新联盟
 * - allianceBreakThreshold: 强制解散联盟的领土占比阈值
 *
 * 设计目标：
 * - 当只剩 3 个势力时触发决战模式
 * - 战斗频率翻倍，加速游戏结束
 * - 远程攻击概率提升到 40%，解决地理隔离问题
 * - 力量消耗减半，让强者更容易获胜
 */

export interface EndgameConfig {
  /** 触发决战模式的活跃势力数阈值 */
  triggerThreshold: number;

  /** 战斗频率倍数 */
  battleFrequencyMultiplier: number;

  /** 决战模式下的远程攻击概率 */
  remoteAttackProbability: number;

  /** 力量消耗倍数（0.5 = 减半） */
  powerLossMultiplier: number;

  /** 是否允许新联盟 */
  allowNewAlliances: boolean;

  /** 强制解散联盟的领土占比阈值 */
  allianceBreakThreshold: number;
}

export const DEFAULT_ENDGAME_CONFIG: EndgameConfig = {
  triggerThreshold: 3,
  battleFrequencyMultiplier: 2,
  remoteAttackProbability: 0.4,
  powerLossMultiplier: 0.5,
  allowNewAlliances: false,
  allianceBreakThreshold: 0.5,
};

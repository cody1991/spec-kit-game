/**
 * 胜利条件配置
 * Feature: 009-unification-balance
 *
 * 配置说明：
 * - territoryVictoryThreshold: 领土胜利阈值（占比）
 * - enableTerritoryVictory: 是否启用领土胜利
 * - enableEliminationVictory: 是否启用消灭胜利
 *
 * 设计目标：
 * - 占领 85% 领土即可宣布胜利，无需消灭所有对手
 * - 保留消灭胜利作为备选条件
 * - 加速游戏结束，提升玩家体验
 */

export interface VictoryConfig {
  /** 领土胜利阈值（占比） */
  territoryVictoryThreshold: number;

  /** 是否启用领土胜利 */
  enableTerritoryVictory: boolean;

  /** 是否启用消灭胜利 */
  enableEliminationVictory: boolean;
}

export const DEFAULT_VICTORY_CONFIG: VictoryConfig = {
  territoryVictoryThreshold: 0.85,
  enableTerritoryVictory: true,
  enableEliminationVictory: true,
};

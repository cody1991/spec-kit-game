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
 * - 必须统一所有国家（100% 领土）才能胜利
 * - 保留消灭胜利作为备选条件
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
  territoryVictoryThreshold: 1.0, // 必须 100% 统一所有国家
  enableTerritoryVictory: true,
  enableEliminationVictory: true,
};

/**
 * 占领逻辑配置
 * Feature: 007-conquest-logic-fix
 *
 * 定义领主攻击目标选择的概率配置
 */

/**
 * 占领逻辑配置接口
 */
export interface ConquestConfig {
  /**
   * 选择相邻目标的概率 (0-1)
   * 默认值: 0.85 (85% 概率选择相邻国家)
   */
  adjacentTargetProbability: number;

  /**
   * 是否允许远程攻击
   * 默认值: true
   */
  allowRemoteAttack: boolean;
}

/**
 * 默认占领配置
 * - 85% 概率选择相邻国家
 * - 15% 概率允许远程攻击
 */
export const DEFAULT_CONQUEST_CONFIG: ConquestConfig = {
  adjacentTargetProbability: 0.85,
  allowRemoteAttack: true,
};

/**
 * 获取当前占领配置
 * 可以在未来扩展为从环境变量或用户设置读取
 */
export function getConquestConfig(): ConquestConfig {
  return { ...DEFAULT_CONQUEST_CONFIG };
}

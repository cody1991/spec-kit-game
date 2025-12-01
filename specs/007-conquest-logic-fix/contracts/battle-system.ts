/**
 * Battle System Contracts
 * Feature: 007-conquest-logic-fix
 *
 * 定义战斗系统的接口契约，用于测试和实现参考
 */

import type { HistoricalCommander, Territory } from '@/core/types';

// ============================================================================
// 配置接口
// ============================================================================

/**
 * 占领逻辑配置
 */
export interface ConquestConfig {
  /** 选择相邻目标的概率 (0-1)，默认 0.85 */
  adjacentTargetProbability: number;

  /** 是否允许远程攻击，默认 true */
  allowRemoteAttack: boolean;
}

export const DEFAULT_CONQUEST_CONFIG: ConquestConfig = {
  adjacentTargetProbability: 0.85,
  allowRemoteAttack: true,
};

// ============================================================================
// 目标选择接口
// ============================================================================

/**
 * 目标选择结果
 */
export interface TargetSelectionResult {
  /** 选中的目标领土ID */
  targetId: string;

  /** 是否为相邻目标 */
  isAdjacent: boolean;

  /** 选择类型 */
  selectionType: 'adjacent' | 'remote';
}

/**
 * 目标选择器接口
 */
export interface ITargetSelector {
  /**
   * 为攻击方选择攻击目标
   *
   * @param attacker - 攻击方领主
   * @param territories - 所有领土的 Map
   * @param config - 占领配置
   * @returns 目标选择结果，如果没有可用目标则返回 null
   */
  selectTarget(
    attacker: HistoricalCommander,
    territories: Map<string, Territory>,
    config?: ConquestConfig
  ): TargetSelectionResult | null;
}

// ============================================================================
// 初始化验证接口
// ============================================================================

/**
 * 初始化验证结果
 */
export interface InitializationValidationResult {
  /** 是否通过验证 */
  isValid: boolean;

  /** 有效的领主列表（有领土的） */
  validCommanders: HistoricalCommander[];

  /** 被排除的领主列表（无领土的） */
  excludedCommanders: HistoricalCommander[];

  /** 排除原因 */
  exclusionReasons: Map<string, string>;
}

/**
 * 初始化验证器接口
 */
export interface IInitializationValidator {
  /**
   * 验证领主初始化结果
   *
   * @param commanders - 初始化后的领主列表
   * @returns 验证结果
   */
  validateCommanders(commanders: HistoricalCommander[]): InitializationValidationResult;

  /**
   * 过滤并返回有效的领主列表
   *
   * @param commanders - 初始化后的领主列表
   * @returns 只包含有领土的领主
   */
  filterValidCommanders(commanders: HistoricalCommander[]): HistoricalCommander[];
}

// ============================================================================
// 测试辅助类型
// ============================================================================

/**
 * 目标选择统计（用于测试验证概率分布）
 */
export interface TargetSelectionStats {
  /** 总选择次数 */
  totalSelections: number;

  /** 相邻目标选择次数 */
  adjacentSelections: number;

  /** 远程目标选择次数 */
  remoteSelections: number;

  /** 相邻选择比例 */
  adjacentRatio: number;

  /** 远程选择比例 */
  remoteRatio: number;
}

/**
 * 计算目标选择统计
 */
export function calculateSelectionStats(results: TargetSelectionResult[]): TargetSelectionStats {
  const total = results.length;
  const adjacent = results.filter((r) => r.isAdjacent).length;
  const remote = total - adjacent;

  return {
    totalSelections: total,
    adjacentSelections: adjacent,
    remoteSelections: remote,
    adjacentRatio: total > 0 ? adjacent / total : 0,
    remoteRatio: total > 0 ? remote / total : 0,
  };
}

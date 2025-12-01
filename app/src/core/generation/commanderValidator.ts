/**
 * 领主初始化验证器
 * Feature: 007-conquest-logic-fix
 *
 * 确保每个活跃领主在游戏开始时至少控制一个国家
 * 无领土的领主将被排除出游戏
 */

import type { HistoricalCommander } from '../types';
import { logger } from '@/config/debug.config';

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

  /** 排除原因映射 */
  exclusionReasons: Map<string, string>;
}

/**
 * 验证领主初始化结果
 *
 * 检查每个领主是否有至少一个初始领土
 *
 * @param commanders - 初始化后的领主列表
 * @returns 验证结果，包含有效和被排除的领主
 *
 * @example
 * ```typescript
 * const result = validateCommanders(commanders);
 * if (!result.isValid) {
 *   console.warn(`${result.excludedCommanders.length} commanders excluded`);
 * }
 * ```
 */
export function validateCommanders(
  commanders: HistoricalCommander[]
): InitializationValidationResult {
  const validCommanders: HistoricalCommander[] = [];
  const excludedCommanders: HistoricalCommander[] = [];
  const exclusionReasons = new Map<string, string>();

  for (const commander of commanders) {
    if (commander.controlledTerritories.length === 0) {
      excludedCommanders.push(commander);
      exclusionReasons.set(commander.id, '无法分配初始领土');
      logger.log(
        'COMMANDER_VALIDATION',
        `⚠️ [validateCommanders] 排除领主 ${commander.name} (${commander.id}): 无初始领土`
      );
    } else {
      validCommanders.push(commander);
    }
  }

  const isValid = excludedCommanders.length === 0;

  if (excludedCommanders.length > 0) {
    logger.log(
      'COMMANDER_VALIDATION',
      `📊 [validateCommanders] 验证结果: ${validCommanders.length} 有效, ${excludedCommanders.length} 被排除`
    );
  }

  return {
    isValid,
    validCommanders,
    excludedCommanders,
    exclusionReasons,
  };
}

/**
 * 过滤并返回有效的领主列表
 *
 * 只保留拥有至少一个领土的领主
 * 这是 validateCommanders 的简化版本，直接返回有效列表
 *
 * @param commanders - 初始化后的领主列表
 * @returns 只包含有领土的领主
 *
 * @example
 * ```typescript
 * const validCommanders = filterValidCommanders(commanders);
 * // 所有返回的领主都保证有 controlledTerritories.length >= 1
 * ```
 */
export function filterValidCommanders(commanders: HistoricalCommander[]): HistoricalCommander[] {
  const result = validateCommanders(commanders);
  return result.validCommanders;
}

/**
 * 检查单个领主是否有效（有领土）
 *
 * @param commander - 要检查的领主
 * @returns 是否有效
 */
export function isValidCommander(commander: HistoricalCommander): boolean {
  return commander.controlledTerritories.length > 0;
}

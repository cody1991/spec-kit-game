/**
 * 目标选择器
 * Feature: 007-conquest-logic-fix (updated in 009-unification-balance)
 *
 * 实现领主攻击目标选择的概率逻辑：
 * - 正常模式：85% 概率选择相邻国家，15% 概率允许远程攻击
 * - 决战模式：60% 概率选择相邻国家，40% 概率允许远程攻击
 */

import type { HistoricalCommander, Territory } from '../../types';
import { DEFAULT_CONQUEST_CONFIG, type ConquestConfig } from '@/config/conquest.config';
import { useGameStore } from '../../state/store';
import { logger } from '@/config/debug.config';

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
 * 为攻击方选择攻击目标
 *
 * 根据配置的概率选择相邻或远程目标：
 * - 默认 85% 概率选择相邻国家
 * - 默认 15% 概率选择远程国家（任意非己方领土）
 *
 * @param attacker - 攻击方领主
 * @param territoryMap - 所有领土的 Map（id -> Territory）
 * @param allTerritoryIds - 所有领土ID列表（用于远程目标池）
 * @param config - 占领配置（可选，默认使用 DEFAULT_CONQUEST_CONFIG）
 * @returns 目标选择结果，如果没有可用目标则返回 null
 *
 * @example
 * ```typescript
 * const result = selectTarget(attacker, territoryMap, allTerritoryIds);
 * if (result) {
 *   console.log(`选择${result.selectionType}目标: ${result.targetId}`);
 * }
 * ```
 */
export function selectTarget(
  attacker: HistoricalCommander,
  territoryMap: Map<string, Territory>,
  allTerritoryIds: string[],
  config: ConquestConfig = DEFAULT_CONQUEST_CONFIG
): TargetSelectionResult | null {
  // 如果攻击方没有领土，无法发起攻击
  if (attacker.controlledTerritories.length === 0) {
    return null;
  }

  // 构建相邻目标池（敌对或中立的相邻领土）
  const adjacentTargets = new Set<string>();
  for (const territoryId of attacker.controlledTerritories) {
    const territory = territoryMap.get(territoryId);
    if (!territory) continue;

    for (const adjId of territory.adjacentIds) {
      const adjTerritory = territoryMap.get(adjId);
      if (adjTerritory && adjTerritory.ownerId !== attacker.id) {
        adjacentTargets.add(adjId);
      }
    }
  }

  // 构建远程目标池（所有非己方领土）
  const remoteTargets: string[] = [];
  if (config.allowRemoteAttack) {
    for (const territoryId of allTerritoryIds) {
      const territory = territoryMap.get(territoryId);
      if (territory && territory.ownerId !== attacker.id && !adjacentTargets.has(territoryId)) {
        remoteTargets.push(territoryId);
      }
    }
  }

  const hasAdjacentTargets = adjacentTargets.size > 0;
  const hasRemoteTargets = remoteTargets.length > 0;

  // 如果没有任何可用目标，返回 null
  if (!hasAdjacentTargets && !hasRemoteTargets) {
    return null;
  }

  // 决定选择相邻还是远程目标
  const roll = Math.random();
  let selectAdjacent: boolean;

  // Feature: 009-unification-balance - 决战模式下远程攻击概率提升
  const state = useGameStore.getState();
  const { isEndgameMode, endgameConfig } = state;
  const effectiveAdjacentProbability = isEndgameMode
    ? 1 - endgameConfig.remoteAttackProbability // 决战模式：60% 相邻
    : config.adjacentTargetProbability; // 正常模式：85% 相邻

  if (!hasAdjacentTargets) {
    // 没有相邻目标，只能选择远程
    selectAdjacent = false;
  } else if (!hasRemoteTargets || !config.allowRemoteAttack) {
    // 没有远程目标或不允许远程攻击，只能选择相邻
    selectAdjacent = true;
  } else {
    // 根据概率决定
    selectAdjacent = roll < effectiveAdjacentProbability;
  }

  let targetId: string;
  let isAdjacent: boolean;
  let selectionType: 'adjacent' | 'remote';

  if (selectAdjacent) {
    // 从相邻目标池随机选择
    const adjacentArray = Array.from(adjacentTargets);
    targetId = adjacentArray[Math.floor(Math.random() * adjacentArray.length)];
    isAdjacent = true;
    selectionType = 'adjacent';
  } else {
    // 从远程目标池随机选择
    targetId = remoteTargets[Math.floor(Math.random() * remoteTargets.length)];
    isAdjacent = false;
    selectionType = 'remote';
  }

  logger.log(
    'TARGET_SELECTION',
    `🎯 [selectTarget] ${attacker.name} 选择${selectionType === 'adjacent' ? '相邻' : '远程'}目标: ${targetId} (roll: ${roll.toFixed(3)}, threshold: ${effectiveAdjacentProbability.toFixed(2)}${isEndgameMode ? ' [决战模式]' : ''})`
  );

  return {
    targetId,
    isAdjacent,
    selectionType,
  };
}

/**
 * 计算目标选择统计
 *
 * 用于测试验证概率分布是否符合预期
 *
 * @param results - 目标选择结果数组
 * @returns 统计数据
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

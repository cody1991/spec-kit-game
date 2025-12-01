/**
 * Conquest Progress System Contract
 * 
 * Feature: 010-gradual-conquest
 * Date: 2025-12-01
 * 
 * 定义占领进度系统的接口契约
 */

import type { System } from '@/core/simulation/tickScheduler';

// ============================================================================
// Data Types
// ============================================================================

/**
 * 单个攻击方对单个领土的占领进度记录
 */
export interface ConquestProgressEntry {
  /** 攻击方指挥官ID */
  attackerId: string;
  /** 当前进度 (0-100) */
  progress: number;
  /** 最后战斗时间戳 (ms) */
  lastBattleTime: number;
  /** 累计战斗次数 */
  battleCount: number;
}

/**
 * 领土的完整占领状态
 */
export interface TerritoryConquestState {
  /** 领土ID */
  territoryId: string;
  /** 当前所有者ID */
  currentOwnerId: string | null;
  /** 各攻击方的进度映射 */
  progressMap: Map<string, ConquestProgressEntry>;
  /** 是否处于争夺状态 */
  isContested: boolean;
  /** 最高进度的攻击方ID */
  leadingAttackerId: string | null;
  /** 最高进度值 */
  leadingProgress: number;
}

/**
 * 进度变化事件
 */
export interface ConquestProgressEvent {
  type: 'progress_increase' | 'progress_decrease' | 'progress_decay' | 'conquest_complete';
  territoryId: string;
  attackerId: string;
  defenderId: string | null;
  previousProgress: number;
  newProgress: number;
  delta: number;
  timestamp: string;
  narrative: string;
}

/**
 * 进度计算结果
 */
export interface ProgressCalculationResult {
  /** 基础进度变化量 */
  baseProgress: number;
  /** 应用乘数后的进度变化量 */
  finalProgress: number;
  /** 应用的乘数 */
  multiplier: number;
  /** 领土大小分类 */
  sizeCategory: 'small' | 'medium' | 'large';
}

// ============================================================================
// System Interface
// ============================================================================

/**
 * 占领进度系统接口
 */
export interface IConquestProgressSystem extends System {
  name: 'ConquestProgressSystem';
  
  /**
   * 计算进度变化量
   * @param territoryArea 领土面积 (km²)
   * @param attackerPower 攻击方实力
   * @param defenderPower 防守方实力
   * @param isAttackerWin 是否攻击方胜利
   * @returns 进度计算结果
   */
  calculateProgressDelta(
    territoryArea: number,
    attackerPower: number,
    defenderPower: number,
    isAttackerWin: boolean
  ): ProgressCalculationResult;
  
  /**
   * 更新占领进度
   * @param territoryId 领土ID
   * @param attackerId 攻击方ID
   * @param defenderId 防守方ID
   * @param isAttackerWin 是否攻击方胜利
   * @returns 是否触发领土转移
   */
  updateProgress(
    territoryId: string,
    attackerId: string,
    defenderId: string | null,
    isAttackerWin: boolean
  ): boolean;
  
  /**
   * 处理进度衰减
   * @param currentTime 当前时间戳
   */
  processDecay(currentTime: number): void;
  
  /**
   * 获取领土的占领状态
   * @param territoryId 领土ID
   */
  getConquestState(territoryId: string): TerritoryConquestState | null;
  
  /**
   * 获取所有争夺中的领土
   */
  getContestedTerritories(): string[];
  
  /**
   * 清除指定攻击方的进度
   * @param territoryId 领土ID
   * @param attackerId 攻击方ID
   */
  clearProgress(territoryId: string, attackerId: string): void;
  
  /**
   * 当势力被淘汰时，清除其所有进度
   * @param commanderId 被淘汰的指挥官ID
   */
  onCommanderEliminated(commanderId: string): void;
}

// ============================================================================
// Service Interface
// ============================================================================

/**
 * 占领进度服务接口（供其他系统调用）
 */
export interface IConquestProgressService {
  /**
   * 获取指定领土上指定攻击方的进度
   */
  getProgress(territoryId: string, attackerId: string): number;
  
  /**
   * 获取领土的最高进度攻击方
   */
  getLeadingAttacker(territoryId: string): { attackerId: string; progress: number } | null;
  
  /**
   * 检查领土是否处于争夺状态
   */
  isContested(territoryId: string): boolean;
  
  /**
   * 获取渲染所需的进度信息
   */
  getRenderInfo(territoryId: string): {
    isContested: boolean;
    leadingAttackerId: string | null;
    leadingProgress: number;
    attackerCount: number;
  } | null;
}

// ============================================================================
// Event Types
// ============================================================================

/**
 * 事件总线事件类型扩展
 */
export type ConquestProgressEventType = 
  | { type: 'conquest:progress-changed'; payload: ConquestProgressEvent }
  | { type: 'conquest:territory-transferred'; payload: { territoryId: string; fromId: string | null; toId: string } }
  | { type: 'conquest:decay-applied'; payload: { territoryId: string; attackerId: string; decayAmount: number } };

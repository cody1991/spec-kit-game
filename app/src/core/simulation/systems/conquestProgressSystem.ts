/**
 * Conquest Progress System
 *
 * Feature: 010-gradual-conquest
 * 渐进式领土蚕食机制的核心系统
 *
 * 职责：
 * - 计算战斗后的进度变化
 * - 管理进度衰减
 * - 处理领土转移
 * - 发射进度变化事件
 */

import type { System } from '../tickScheduler';
import { useGameStore } from '../../state/store';
import type {
  ProgressCalculationResult,
  ConquestProgressEvent,
  TerritoryConquestState,
} from '../../types';
import { globalEventBus } from '../../events/eventTypes';
import { logger } from '@/config/debug.config';
import { COUNTRY_AREAS } from '@/data/countryAreas';

/**
 * 占领进度系统
 */
export class ConquestProgressSystem implements System {
  name = 'ConquestProgressSystem';

  private lastDecayCheckTick = 0;

  /**
   * 系统更新（每 tick 调用）
   */
  update(_deltaMs: number): void {
    const state = useGameStore.getState();
    const { tick, conquestProgressConfig } = state;

    // 检查进度衰减（每 decayCheckInterval tick）
    if (tick - this.lastDecayCheckTick >= conquestProgressConfig.decayCheckInterval) {
      this.processDecay(Date.now());
      this.lastDecayCheckTick = tick;
    }
  }

  /**
   * 计算进度变化量
   *
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
  ): ProgressCalculationResult {
    const state = useGameStore.getState();
    const config = state.conquestProgressConfig;
    const { isEndgameMode } = state;

    // 1. 确定领土大小分类
    const sizeCategory = this.getTerritorySizeCategory(territoryArea);

    // 2. 获取基础进度变化量
    let baseProgress: number;
    if (isAttackerWin) {
      switch (sizeCategory) {
        case 'small':
          baseProgress = config.smallCountryProgressGain;
          break;
        case 'medium':
          baseProgress = config.mediumCountryProgressGain;
          break;
        case 'large':
          baseProgress = config.largeCountryProgressGain;
          break;
      }
    } else {
      // 防守成功，进度减少（负值）
      switch (sizeCategory) {
        case 'small':
          baseProgress = -config.smallCountryProgressLoss;
          break;
        case 'medium':
          baseProgress = -config.mediumCountryProgressLoss;
          break;
        case 'large':
          baseProgress = -config.largeCountryProgressLoss;
          break;
      }
    }

    // 3. 计算实力乘数
    const powerMultiplier = this.getPowerMultiplier(attackerPower, defenderPower);

    // 4. 应用决战模式乘数
    let multiplier = powerMultiplier;
    if (isEndgameMode) {
      multiplier *= config.endgameModeMultiplier;
    }

    // 5. 计算最终进度
    const finalProgress = Math.round(baseProgress * multiplier);

    return {
      baseProgress,
      finalProgress,
      multiplier,
      sizeCategory,
    };
  }

  /**
   * 更新占领进度
   *
   * @param territoryId 领土ID
   * @param attackerId 攻击方ID
   * @param defenderId 防守方ID
   * @param isAttackerWin 是否攻击方胜利
   * @param attackerPower 攻击方实力
   * @param defenderPower 防守方实力
   * @returns 是否触发领土转移
   */
  updateProgress(
    territoryId: string,
    attackerId: string,
    defenderId: string | null,
    isAttackerWin: boolean,
    attackerPower: number,
    defenderPower: number
  ): boolean {
    const state = useGameStore.getState();

    // 获取领土面积
    const territory = state.territories.find((t) => t.id === territoryId);
    const territoryName = territory?.name || territoryId;
    const territoryArea = COUNTRY_AREAS[territoryName] ?? 500000; // 默认中等大小

    // 计算进度变化
    const result = this.calculateProgressDelta(
      territoryArea,
      attackerPower,
      defenderPower,
      isAttackerWin
    );

    // 获取当前进度
    const currentProgress = state.getConquestProgress(territoryId, attackerId);
    const previousProgress = currentProgress;
    const newProgress = Math.max(0, Math.min(100, currentProgress + result.finalProgress));

    // 更新进度
    state.updateConquestProgress(territoryId, attackerId, result.finalProgress);

    // 获取指挥官名称
    const attacker = state.commanders.find((c) => c.id === attackerId);
    const defender = defenderId ? state.commanders.find((c) => c.id === defenderId) : null;

    // 发射进度变化事件
    const eventType = isAttackerWin ? 'progress_increase' : 'progress_decrease';
    this.emitProgressEvent({
      type: eventType,
      territoryId,
      territoryName,
      attackerId,
      attackerName: attacker?.name || attackerId,
      defenderId,
      defenderName: defender?.name || null,
      previousProgress,
      newProgress,
      delta: result.finalProgress,
      timestamp: new Date().toISOString(),
      narrative: this.generateNarrative(
        eventType,
        attacker?.name || attackerId,
        territoryName,
        result.finalProgress,
        newProgress
      ),
    });

    // 检查是否达到 100% 完成占领
    if (newProgress >= 100) {
      this.completeConquest(territoryId, attackerId, defenderId);
      return true;
    }

    return false;
  }

  /**
   * 完成占领（进度达到 100%）
   */
  completeConquest(territoryId: string, attackerId: string, defenderId: string | null): void {
    const state = useGameStore.getState();

    // 获取领土和指挥官信息
    const territory = state.territories.find((t) => t.id === territoryId);
    const territoryName = territory?.name || territoryId;
    const attacker = state.commanders.find((c) => c.id === attackerId);
    const defender = defenderId ? state.commanders.find((c) => c.id === defenderId) : null;

    // 清除占领进度
    state.completeConquest(territoryId, attackerId);

    // 发射完成事件
    this.emitProgressEvent({
      type: 'conquest_complete',
      territoryId,
      territoryName,
      attackerId,
      attackerName: attacker?.name || attackerId,
      defenderId,
      defenderName: defender?.name || null,
      previousProgress: 100,
      newProgress: 100,
      delta: 0,
      timestamp: new Date().toISOString(),
      narrative: `${attacker?.name || attackerId} 完全占领了 ${territoryName}！`,
    });

    // 发射领土转移事件
    globalEventBus.emit({
      type: 'conquest:territory-transferred',
      timestamp: new Date().toISOString(),
      payload: {
        territoryId,
        fromId: defenderId,
        toId: attackerId,
      },
    });

    logger.log(
      'CONQUEST_PROGRESS',
      `🏆 [ConquestProgressSystem] Conquest complete: ${territoryName} → ${attacker?.name || attackerId}`
    );
  }

  /**
   * 处理进度衰减
   */
  processDecay(currentTime: number): void {
    const state = useGameStore.getState();
    const config = state.conquestProgressConfig;

    // 衰减间隔（毫秒）
    const decayIntervalMs = (config.decayCheckInterval / 60) * 60000; // tick 转换为毫秒
    const decayAmount = config.decayRatePerMinute * (decayIntervalMs / 60000);

    state.conquestProgressStates.forEach((conquestState, territoryId) => {
      if (!conquestState.isContested) return;

      conquestState.progressMap.forEach((entry, attackerId) => {
        // 检查是否超过衰减间隔没有战斗
        const timeSinceLastBattle = currentTime - entry.lastBattleTime;

        if (timeSinceLastBattle >= decayIntervalMs) {
          // 应用衰减
          state.updateConquestProgress(territoryId, attackerId, -decayAmount, true);

          // 发射衰减事件
          globalEventBus.emit({
            type: 'conquest:decay-applied',
            timestamp: new Date().toISOString(),
            payload: {
              territoryId,
              attackerId,
              decayAmount,
            },
          });

          logger.log(
            'CONQUEST_PROGRESS',
            `📉 [ConquestProgressSystem] Decay: ${territoryId} | ${attackerId} | -${decayAmount}%`
          );
        }
      });
    });
  }

  /**
   * 当势力被淘汰时，清除其所有进度
   */
  onCommanderEliminated(commanderId: string): void {
    const state = useGameStore.getState();

    state.conquestProgressStates.forEach((conquestState, territoryId) => {
      if (conquestState.progressMap.has(commanderId)) {
        state.clearConquestProgress(territoryId, commanderId);

        logger.log(
          'CONQUEST_PROGRESS',
          `🗑️ [ConquestProgressSystem] Cleared progress for eliminated commander: ${commanderId} on ${territoryId}`
        );
      }
    });
  }

  /**
   * 获取领土的占领状态
   */
  getConquestState(territoryId: string): TerritoryConquestState | null {
    const state = useGameStore.getState();
    return state.conquestProgressStates.get(territoryId) ?? null;
  }

  /**
   * 获取所有争夺中的领土
   */
  getContestedTerritories(): string[] {
    return useGameStore.getState().getContestedTerritories();
  }

  /**
   * 获取渲染所需的进度信息
   */
  getRenderInfo(territoryId: string): {
    isContested: boolean;
    leadingAttackerId: string | null;
    leadingProgress: number;
    attackerCount: number;
  } | null {
    const conquestState = this.getConquestState(territoryId);
    if (!conquestState) return null;

    return {
      isContested: conquestState.isContested,
      leadingAttackerId: conquestState.leadingAttackerId,
      leadingProgress: conquestState.leadingProgress,
      attackerCount: conquestState.progressMap.size,
    };
  }

  // ============================================================================
  // Private Methods
  // ============================================================================

  /**
   * 获取领土大小分类
   */
  private getTerritorySizeCategory(area: number): 'small' | 'medium' | 'large' {
    const config = useGameStore.getState().conquestProgressConfig;

    if (area < config.smallCountryThreshold) {
      return 'small';
    } else if (area > config.largeCountryThreshold) {
      return 'large';
    }
    return 'medium';
  }

  /**
   * 计算实力乘数
   */
  private getPowerMultiplier(attackerPower: number, defenderPower: number): number {
    const config = useGameStore.getState().conquestProgressConfig;

    if (defenderPower <= 0) return config.powerAdvantageMultiplier;

    const ratio = attackerPower / defenderPower;

    if (ratio >= 2) {
      return config.powerAdvantageMultiplier;
    } else if (ratio <= 0.5) {
      return config.powerDisadvantageMultiplier;
    }

    return 1;
  }

  /**
   * 发射进度变化事件
   */
  private emitProgressEvent(event: ConquestProgressEvent): void {
    globalEventBus.emit({
      type: 'conquest:progress-changed',
      timestamp: event.timestamp,
      payload: event,
    });
  }

  /**
   * 生成叙事文本
   */
  private generateNarrative(
    type: string,
    attackerName: string,
    territoryName: string,
    delta: number,
    newProgress: number
  ): string {
    switch (type) {
      case 'progress_increase':
        return `${attackerName} 在 ${territoryName} 取得进展，占领进度 +${delta}% (${newProgress}%)`;
      case 'progress_decrease':
        return `${attackerName} 在 ${territoryName} 遭遇挫折，占领进度 ${delta}% (${newProgress}%)`;
      case 'progress_decay':
        return `${attackerName} 对 ${territoryName} 的占领进度因无战斗而衰减 (${newProgress}%)`;
      case 'conquest_complete':
        return `${attackerName} 完全占领了 ${territoryName}！`;
      default:
        return `${attackerName} 在 ${territoryName} 的占领进度变化`;
    }
  }
}

// 导出单例
export const conquestProgressSystem = new ConquestProgressSystem();

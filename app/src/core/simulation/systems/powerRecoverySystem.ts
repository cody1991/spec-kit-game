/**
 * 力量恢复系统
 * Feature: 009-unification-balance
 *
 * 功能：
 * - 每 tick 根据占领领土数量恢复力量
 * - 强制力量值在 [MIN_POWER, MAX_POWER] 范围内
 * - 形成"强者恒强"的正反馈循环
 *
 * @performance
 * - 单次遍历所有活跃指挥官
 * - 批量更新减少 store 调用
 */

import type { System } from '../tickScheduler';
import { useGameStore } from '../../state/store';
import type { HistoricalCommander } from '../../types';
import { DEFAULT_POWER_RECOVERY_CONFIG, type PowerRecoveryConfig } from '@/config/powerRecovery.config';
import { logger } from '@/config/debug.config';

export class PowerRecoverySystem implements System {
  name = 'PowerRecoverySystem';
  private config: PowerRecoveryConfig = DEFAULT_POWER_RECOVERY_CONFIG;

  /**
   * 计算指挥官的力量恢复量
   * @param commander - 指挥官
   * @returns 恢复量
   */
  calculateRecovery(commander: HistoricalCommander): number {
    const territoryCount = commander.controlledTerritories.length;
    return territoryCount * this.config.recoveryPerTerritory;
  }

  /**
   * 应用力量边界约束
   * @param power - 当前力量值
   * @returns 约束后的力量值
   */
  clampPower(power: number): number {
    return Math.max(this.config.minPower, Math.min(this.config.maxPower, power));
  }

  /**
   * 获取战斗胜利额外恢复
   */
  getVictoryBonus(): number {
    return this.config.victoryBonus;
  }

  /**
   * 更新配置
   */
  setConfig(config: Partial<PowerRecoveryConfig>): void {
    this.config = { ...this.config, ...config };
  }

  update(_deltaMs: number): void {
    const state = useGameStore.getState();
    const { commanders } = state;

    // 收集需要更新的指挥官
    const updates: Array<{ id: string; updates: Partial<HistoricalCommander> }> = [];

    for (const commander of commanders) {
      if (commander.status !== 'active') continue;

      const recovery = this.calculateRecovery(commander);
      const newPower = this.clampPower(commander.currentPower + recovery);

      // 只有当力量值变化时才更新
      if (newPower !== commander.currentPower) {
        updates.push({
          id: commander.id,
          updates: { currentPower: newPower },
        });

        logger.log(
          'POWER_RECOVERY',
          `💪 [PowerRecovery] ${commander.name}: ${commander.currentPower.toFixed(1)} + ${recovery.toFixed(1)} = ${newPower.toFixed(1)} (${commander.controlledTerritories.length} territories)`
        );
      }
    }

    // 批量更新
    if (updates.length > 0) {
      state.batchUpdateCommanders(updates);
    }
  }
}

// 导出单例实例供其他系统使用
export const powerRecoverySystem = new PowerRecoverySystem();

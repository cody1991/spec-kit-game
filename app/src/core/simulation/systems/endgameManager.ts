/**
 * 决战模式管理器
 * Feature: 009-unification-balance
 *
 * 功能：
 * - 检测决战模式触发条件（活跃势力 ≤ 3）
 * - 管理决战模式状态
 * - 触发后不可逆
 *
 * 决战模式效果（由其他系统读取状态实现）：
 * - 战斗频率 ×2（battleSystem）
 * - 远程攻击概率 40%（targetSelector）
 * - 力量消耗 ×0.5（battleSystem）
 * - 禁止新联盟（allianceSystem）
 */

import type { System } from '../tickScheduler';
import { useGameStore } from '../../state/store';
import { logger } from '@/config/debug.config';

export class EndgameManager implements System {
  name = 'EndgameManager';

  update(_deltaMs: number): void {
    const state = useGameStore.getState();
    const { commanders, isEndgameMode, endgameConfig } = state;

    // 如果已经是决战模式，不需要再检测
    if (isEndgameMode) return;

    // 统计活跃势力数量
    const activeCommanders = commanders.filter((c) => c.status === 'active');
    const activeCount = activeCommanders.length;

    // 检测是否触发决战模式
    if (activeCount <= endgameConfig.triggerThreshold && activeCount > 1) {
      logger.log(
        'ENDGAME_MODE',
        `⚔️ [EndgameManager] 决战模式触发！剩余 ${activeCount} 个活跃势力`
      );
      
      // 记录触发时的势力信息
      const factionInfo = activeCommanders
        .map((c) => `${c.name}(${c.controlledTerritories.length}领土)`)
        .join(', ');
      logger.log('ENDGAME_MODE', `⚔️ [EndgameManager] 参战势力: ${factionInfo}`);

      // 触发决战模式
      state.setEndgameMode(true);

      // 添加事件日志
      state.addBattleEvent({
        id: `endgame-${Date.now()}`,
        timestamp: new Date().toISOString(),
        type: 'alliance', // 复用类型，表示重大事件
        attackerId: activeCommanders[0]?.id || '',
        result: 'success',
        delta: { activeCount },
        narrative: `⚔️ 决战模式启动！仅剩 ${activeCount} 个势力争夺天下！`,
        seed: Math.random().toString(36),
      });
    }
  }
}

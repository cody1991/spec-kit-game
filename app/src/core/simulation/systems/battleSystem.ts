import type { System } from '../tickScheduler';
import { useGameStore } from '../../state/store';
import type { BattleEvent, HistoricalCommander, Territory } from '../../types';
import { globalEventBus } from '../../events/eventTypes';
import { createCountryConquestTelemetry } from '@/services/telemetry/countryConquestTelemetry';
import { logger } from '@/config/debug.config';
import { selectTarget } from './targetSelector';
import { getConquestConfig } from '@/config/conquest.config';

/**
 * Global battle event counter for generating unique IDs
 * Resets on game restart via resetBattleEventCounter()
 */
let battleEventCounter = 0;

/**
 * Reset the battle event counter to 0
 * Called when starting a new game session
 */
export function resetBattleEventCounter(): void {
  battleEventCounter = 0;
}

/**
 * Generate a unique battle event ID
 * Format: battle-{timestamp}-{counter}
 *
 * @returns A unique ID string that combines timestamp and sequential counter
 * @example "battle-1701234567890-42"
 */
export function generateBattleEventId(): string {
  return `battle-${Date.now()}-${battleEventCounter++}`;
}

// 批量更新收集器
interface BatchUpdates {
  territories: Map<string, Partial<Territory>>;
  commanders: Map<string, Partial<HistoricalCommander>>;
  events: BattleEvent[];
  telemetry: any[];
  eliminations: string[];
}

/**
 * 战斗系统
 *
 * @performance
 * - 使用 Map 缓存 O(1) 查找代替 Array.find() O(n)
 * - 批量收集所有更新，最后一次性提交到 store
 * - 减少 Zustand set() 调用次数（从 N 次减少到 1 次）
 */
export class BattleSystem implements System {
  name = 'BattleSystem';

  // 缓存 Map，避免每 tick 重复创建
  private territoryMap: Map<string, Territory> = new Map();
  private commanderMap: Map<string, HistoricalCommander> = new Map();

  // 批量更新收集器
  private batch: BatchUpdates = {
    territories: new Map(),
    commanders: new Map(),
    events: [],
    telemetry: [],
    eliminations: [],
  };

  update(_deltaMs: number): void {
    const state = useGameStore.getState();
    const { commanders, territories } = state;

    // 重置批量更新收集器
    this.batch.territories.clear();
    this.batch.commanders.clear();
    this.batch.events = [];
    this.batch.telemetry = [];
    this.batch.eliminations = [];

    // 构建领土查找 Map（O(n) 一次，之后 O(1) 查找）
    this.territoryMap.clear();
    for (let i = 0; i < territories.length; i++) {
      this.territoryMap.set(territories[i].id, territories[i]);
    }

    // 构建指挥官查找 Map
    this.commanderMap.clear();
    for (let i = 0; i < commanders.length; i++) {
      this.commanderMap.set(commanders[i].id, commanders[i]);
    }

    // 找到活跃的指挥官
    const activeCommanders: HistoricalCommander[] = [];
    for (let i = 0; i < commanders.length; i++) {
      if (commanders[i].status === 'active') {
        activeCommanders.push(commanders[i]);
      }
    }

    // 限制每 tick 最多处理的战斗数量（增加到 20，因为有 50 个指挥官）
    const MAX_BATTLES_PER_TICK = 20;
    let battlesThisTick = 0;

    // 🔧 Feature 007: 使用概率化目标选择（85% 相邻，15% 远程）
    const conquestConfig = getConquestConfig();
    const allTerritoryIds = territories.map((t) => t.id);

    // 每个指挥官有机会发起进攻
    for (let i = 0; i < activeCommanders.length && battlesThisTick < MAX_BATTLES_PER_TICK; i++) {
      const attacker = activeCommanders[i];
      if (attacker.controlledTerritories.length === 0) continue;

      // 随机选择一个目标 (95% chance per tick - 更积极的扩张)
      if (Math.random() < 0.95) {
        // 🔧 Feature 007: 使用新的目标选择器
        const selectionResult = selectTarget(
          attacker,
          this.territoryMap,
          allTerritoryIds,
          conquestConfig
        );

        if (!selectionResult) continue;

        const target = this.territoryMap.get(selectionResult.targetId);
        if (!target) continue;

        // 记录目标选择类型（用于调试和验证）
        logger.log(
          'BATTLE_SYSTEM',
          `⚔️ [BattleSystem] ${attacker.name} 发起${selectionResult.selectionType === 'adjacent' ? '相邻' : '远程'}攻击: ${target.name}`
        );

        if (!target.ownerId) {
          this.queueOccupyNeutralTerritory(attacker, target, selectionResult.selectionType);
        } else {
          const defender = this.commanderMap.get(target.ownerId);
          if (defender && defender.status === 'active') {
            this.queueBattle(attacker, defender, target, selectionResult.selectionType);
          } else {
            this.queueOccupyNeutralTerritory(attacker, target, selectionResult.selectionType);
          }
        }
        battlesThisTick++;
      }
    }

    // 一次性提交所有更新
    this.commitBatch();
  }

  /**
   * 队列：占领中立领土
   * @param attackType - 攻击类型（相邻/远程）
   */
  private queueOccupyNeutralTerritory(
    attacker: HistoricalCommander,
    territory: Territory,
    attackType: 'adjacent' | 'remote' = 'adjacent'
  ): void {
    // 更新领土
    this.batch.territories.set(territory.id, {
      ownerId: attacker.id,
      garrison: Math.floor(attacker.currentPower * 0.2),
      stability: 60,
    });

    // 更新指挥官（合并已有更新）
    const existingUpdate = this.batch.commanders.get(attacker.id) || {};
    const currentTerritories = existingUpdate.controlledTerritories || [
      ...attacker.controlledTerritories,
    ];
    this.batch.commanders.set(attacker.id, {
      ...existingUpdate,
      controlledTerritories: [...currentTerritories, territory.id],
    });

    // 添加事件
    const narrativePrefix = attackType === 'remote' ? '远程' : '';
    this.batch.events.push({
      id: generateBattleEventId(),
      timestamp: new Date().toISOString(),
      type: 'attack',
      attackerId: attacker.id,
      territoryId: territory.id,
      result: 'success',
      delta: {},
      narrative: `${attacker.name} ${narrativePrefix}占领了无主的 ${territory.name}!`,
      seed: Math.random().toString(36),
    });
  }

  /**
   * 队列：战斗
   * Feature: 008-territory-bonus - 应用领土加成到战斗计算
   * @param attackType - 攻击类型（相邻/远程）
   */
  private queueBattle(
    attacker: HistoricalCommander,
    defender: HistoricalCommander,
    territory: Territory,
    attackType: 'adjacent' | 'remote' = 'adjacent'
  ): void {
    // Feature: 008-territory-bonus - 获取领土加成
    const store = useGameStore.getState();
    const attackerStats = store.factionStats.get(attacker.id);
    const defenderStats = store.factionStats.get(defender.id);

    const attackerBonus = attackerStats?.territoryBonus?.totalAttackBonus ?? 0;
    const defenderBonus = defenderStats?.territoryBonus?.totalDefenseBonus ?? 0;

    // 应用加成到战斗力计算
    const baseAttackPower =
      attacker.baseAttributes.attack * (attacker.morale / 100) * (attacker.currentPower / 100);
    const baseDefensePower =
      defender.baseAttributes.defense *
      (defender.morale / 100) *
      (territory.stability / 100) *
      (defender.currentPower / 100);

    // Feature: 008-territory-bonus - 应用加成
    const attackPower = baseAttackPower * (1 + attackerBonus);
    const defensePower = baseDefensePower * (1 + defenderBonus);

    logger.log(
      'TERRITORY_BONUS',
      `⚔️ Battle: ${attacker.name} (ATK ${baseAttackPower.toFixed(1)} * ${(1 + attackerBonus).toFixed(2)} = ${attackPower.toFixed(1)}) vs ${defender.name} (DEF ${baseDefensePower.toFixed(1)} * ${(1 + defenderBonus).toFixed(2)} = ${defensePower.toFixed(1)})`
    );

    const attackerWins = attackPower > defensePower * (0.8 + Math.random() * 0.4);
    const attackerPowerLoss = Math.floor(Math.random() * 10) + 5;
    const defenderPowerLoss = Math.floor(Math.random() * 15) + 10;

    const narrativePrefix = attackType === 'remote' ? '远程' : '';
    const event: BattleEvent = {
      id: generateBattleEventId(),
      timestamp: new Date().toISOString(),
      type: 'attack',
      attackerId: attacker.id,
      defenderId: defender.id,
      territoryId: territory.id,
      result: attackerWins ? 'success' : 'fail',
      delta: { attackerPowerLoss, defenderPowerLoss },
      narrative: attackerWins
        ? `${attacker.name} ${narrativePrefix}成功占领了 ${territory.name}!`
        : `${defender.name} 成功守住了 ${territory.name}!`,
      seed: Math.random().toString(36),
    };

    // 获取已有更新
    const attackerUpdate = this.batch.commanders.get(attacker.id) || {};
    const defenderUpdate = this.batch.commanders.get(defender.id) || {};

    // 获取当前值（考虑已有更新）
    const attackerCurrentPower = attackerUpdate.currentPower ?? attacker.currentPower;
    const attackerMorale = attackerUpdate.morale ?? attacker.morale;
    const defenderCurrentPower = defenderUpdate.currentPower ?? defender.currentPower;
    const defenderMorale = defenderUpdate.morale ?? defender.morale;
    const attackerTerritories = attackerUpdate.controlledTerritories || [
      ...attacker.controlledTerritories,
    ];
    const defenderTerritories = defenderUpdate.controlledTerritories || [
      ...defender.controlledTerritories,
    ];

    if (attackerWins) {
      // 更新领土
      this.batch.territories.set(territory.id, {
        ownerId: attacker.id,
        garrison: Math.floor(attacker.currentPower * 0.3),
        stability: Math.max(20, territory.stability - 30),
      });

      // 更新攻击方
      this.batch.commanders.set(attacker.id, {
        ...attackerUpdate,
        controlledTerritories: [...attackerTerritories, territory.id],
        currentPower: Math.max(0, attackerCurrentPower - attackerPowerLoss),
      });

      // 更新防守方
      const newDefenderTerritories = defenderTerritories.filter((t) => t !== territory.id);
      this.batch.commanders.set(defender.id, {
        ...defenderUpdate,
        controlledTerritories: newDefenderTerritories,
        currentPower: Math.max(0, defenderCurrentPower - defenderPowerLoss),
        ...(newDefenderTerritories.length === 0 ? { status: 'eliminated' as const } : {}),
      });

      // 检查淘汰
      if (newDefenderTerritories.length === 0) {
        this.batch.eliminations.push(defender.id);
        this.batch.events.push({
          ...event,
          type: 'elimination',
          narrative: `${defender.name} 已被淘汰!`,
        });
      }

      // 添加遥测
      this.batch.telemetry.push(
        createCountryConquestTelemetry({
          territoryId: territory.id,
          territoryName: territory.name,
          previousOwnerId: defender.id,
          newOwnerId: attacker.id,
          attackPower,
          defensePower,
          battleDuration: 1,
        })
      );
    } else {
      // 失败
      this.batch.commanders.set(attacker.id, {
        ...attackerUpdate,
        morale: Math.max(0, attackerMorale - 5),
        currentPower: Math.max(0, attackerCurrentPower - attackerPowerLoss),
      });

      this.batch.commanders.set(defender.id, {
        ...defenderUpdate,
        morale: Math.min(100, defenderMorale + 5),
        currentPower: Math.max(0, defenderCurrentPower - defenderPowerLoss),
      });
    }

    this.batch.events.push(event);
  }

  /**
   * 一次性提交所有更新到 store
   */
  private commitBatch(): void {
    if (
      this.batch.territories.size === 0 &&
      this.batch.commanders.size === 0 &&
      this.batch.events.length === 0
    ) {
      return;
    }

    const store = useGameStore.getState();

    // 批量更新领土
    if (this.batch.territories.size > 0) {
      const updates = Array.from(this.batch.territories.entries()).map(([id, updates]) => ({
        id,
        updates,
      }));
      store.batchUpdateTerritories(updates);
    }

    // 批量更新指挥官
    if (this.batch.commanders.size > 0) {
      const updates = Array.from(this.batch.commanders.entries()).map(([id, updates]) => ({
        id,
        updates,
      }));
      store.batchUpdateCommanders(updates);
    }

    // 批量添加事件
    if (this.batch.events.length > 0) {
      store.addBattleEvents(this.batch.events);
    }

    // 添加遥测
    for (const telemetry of this.batch.telemetry) {
      store.addTelemetry(telemetry);
    }

    // 发送淘汰事件
    for (const commanderId of this.batch.eliminations) {
      globalEventBus.emit({
        type: 'commander:eliminated',
        timestamp: new Date().toISOString(),
        payload: { commanderId },
      });
    }

    // 发送战斗结果事件
    for (const event of this.batch.events) {
      if (event.type === 'attack') {
        globalEventBus.emit({
          type: 'battle:result',
          timestamp: new Date().toISOString(),
          payload: event,
        });
      }
    }
  }
}

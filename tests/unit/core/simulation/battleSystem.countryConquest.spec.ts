import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { useGameStore } from '@core/state/store';
import type { HistoricalCommander, Territory } from '@core/types';
import { BattleSystem } from '@core/simulation/systems/battleSystem';

function createCommander(
  id: string,
  name: string,
  controlledTerritories: string[]
): HistoricalCommander {
  return {
    id,
    name,
    originRegion: 'americas',
    portraitAsset: '',
    baseAttributes: {
      attack: 100,
      defense: 80,
      mobility: 80,
      leadership: 90,
    },
    skillCards: [],
    currentPower: 100,
    controlledTerritories,
    initialRegions: ['north-america'],
    alliances: [],
    hostilities: [],
    morale: 100,
    nextActionEta: '',
    status: 'active',
  };
}

function createTerritory(
  id: string,
  name: string,
  ownerId: string | null,
  stability: number
): Territory {
  return {
    id,
    name,
    polygon: [
      [0, 0],
      [1, 0],
      [1, 1],
      [0, 1],
    ],
    adjacentIds: [],
    terrain: 'plains',
    resourceYield: { food: 0, industry: 0 },
    ownerId,
    garrison: 20,
    stability,
  };
}

describe('BattleSystem 国家粒度攻占逻辑', () => {
  beforeEach(() => {
    useGameStore.getState().resetGame();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('成功攻占时仅产生单个目标国家的 BattleEvent，territoryId 为 Country.id', () => {
    const attacker = createCommander('commander-a', 'Attacker', ['840']);
    const defender = createCommander('commander-b', 'Defender', ['840', '124']);

    const targetTerritory = createTerritory('840', 'United States', 'commander-b', 60);
    const otherTerritory = createTerritory('124', 'Canada', 'commander-b', 60);

    const store = useGameStore.getState();
    store.setCommanders([attacker, defender]);
    store.setTerritories([targetTerritory, otherTerritory]);

    // 控制随机数：确保触发战斗且进攻方获胜
    vi.spyOn(Math, 'random').mockReturnValue(0);

    const system = new BattleSystem();

    // 由于 queueBattle 是私有方法且需要配合 commitBatch 使用
    // 我们改为直接调用 update() 方法来测试完整流程
    // 设置 attacker 的领土与 defender 的领土相邻
    targetTerritory.adjacentIds = ['840']; // attacker 的领土
    store.setTerritories([
      { ...createTerritory('840', 'United States', 'commander-b', 60), adjacentIds: [] },
      { ...createTerritory('124', 'Canada', 'commander-b', 60), adjacentIds: [] },
    ]);

    // 重新设置：attacker 控制一个领土，与 defender 的领土相邻
    const attackerTerritory = createTerritory('156', 'China', 'commander-a', 80);
    attackerTerritory.adjacentIds = ['840']; // 与 United States 相邻

    store.setCommanders([
      { ...attacker, controlledTerritories: ['156'] },
      { ...defender, controlledTerritories: ['840', '124'] },
    ]);
    store.setTerritories([
      attackerTerritory,
      { ...createTerritory('840', 'United States', 'commander-b', 60), adjacentIds: ['156'] },
      { ...createTerritory('124', 'Canada', 'commander-b', 60), adjacentIds: [] },
    ]);

    // Feature: 010-gradual-conquest - 设置高初始进度以便单次战斗即可完成占领
    // 这样测试可以验证完全占领的逻辑
    store.updateConquestProgress('840', 'commander-a', 95);

    // 调用 update 方法
    system.update(500);

    const state = useGameStore.getState();

    // 应该产生战斗事件
    expect(state.eventLog.length).toBeGreaterThanOrEqual(1);

    const event = state.eventLog[0];
    expect(event.result).toBe('success');
    expect(event.territoryId).toBe('840');

    // Feature: 010-gradual-conquest - 由于进度已接近100%，战斗胜利后应完成占领
    // 只更新了目标国家的所有权
    const updatedTerritories = state.territories;
    const updatedTarget = updatedTerritories.find((t) => t.id === '840');
    const updatedOther = updatedTerritories.find((t) => t.id === '124');

    expect(updatedTarget).toBeDefined();
    expect(updatedTarget!.ownerId).toBe('commander-a');

    expect(updatedOther).toBeDefined();
    expect(updatedOther!.ownerId).toBe('commander-b');

    // 受控的 commander 领土列表：attacker 新增该 countryId，defender 只失去该 countryId
    const updatedAttacker = state.commanders.find((c) => c.id === 'commander-a');
    const updatedDefender = state.commanders.find((c) => c.id === 'commander-b');

    expect(updatedAttacker).toBeDefined();
    expect(updatedAttacker!.controlledTerritories).toContain('840');

    expect(updatedDefender).toBeDefined();
    expect(updatedDefender!.controlledTerritories).not.toContain('840');
    expect(updatedDefender!.controlledTerritories).toContain('124');
  });

  it('Feature: 010-gradual-conquest - 战斗胜利时增加占领进度而非立即占领', () => {
    const attacker = createCommander('commander-a', 'Attacker', ['156']);
    const defender = createCommander('commander-b', 'Defender', ['840', '124']);

    const store = useGameStore.getState();
    
    // 设置领土
    const attackerTerritory = createTerritory('156', 'China', 'commander-a', 80);
    attackerTerritory.adjacentIds = ['840'];
    
    store.setCommanders([attacker, defender]);
    store.setTerritories([
      attackerTerritory,
      { ...createTerritory('840', 'United States', 'commander-b', 60), adjacentIds: ['156'] },
      { ...createTerritory('124', 'Canada', 'commander-b', 60), adjacentIds: [] },
    ]);

    // 控制随机数：确保触发战斗且进攻方获胜
    vi.spyOn(Math, 'random').mockReturnValue(0);

    const system = new BattleSystem();
    system.update(500);

    const state = useGameStore.getState();

    // 应该产生战斗事件
    expect(state.eventLog.length).toBeGreaterThanOrEqual(1);

    const event = state.eventLog[0];
    expect(event.result).toBe('success');

    // 由于初始进度为0，单次战斗不会完成占领
    // 领土所有权应该保持不变
    const updatedTarget = state.territories.find((t) => t.id === '840');
    expect(updatedTarget!.ownerId).toBe('commander-b');

    // 但占领进度应该增加
    const progress = state.getConquestProgress('840', 'commander-a');
    expect(progress).toBeGreaterThan(0);
  });
});

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

    // 直接调用战斗执行逻辑，模拟一次对单个国家的攻占
    // 私有方法在运行时仍可通过 any 访问，这里只在测试中使用
    (system as any).executeBattle(attacker, defender, targetTerritory);

    const state = useGameStore.getState();

    // 仅产生一个战斗事件（无额外 elimination 事件）
    expect(state.eventLog).toHaveLength(1);

    const event = state.eventLog[0];
    expect(event.result).toBe('success');
    expect(event.territoryId).toBe('840');

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
});

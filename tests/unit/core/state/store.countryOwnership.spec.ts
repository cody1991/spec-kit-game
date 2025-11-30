import { describe, it, expect, beforeEach } from 'vitest';
import { useGameStore } from '@core/state/store';
import type { Territory, TerritoryState } from '@core/types';

function createTerritory(id: string, name: string, ownerId: string | null): Territory {
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
    garrison: 10,
    stability: 60,
  };
}

function createTerritoryState(
  countryId: string,
  countryName: string,
  ownerId: string | null
): TerritoryState {
  return {
    countryId,
    countryName,
    ownerId,
    troops: 20,
    resources: 0,
    defense: 50,
    updatedAt: Date.now(),
    conqueredAt: null,
    previousOwnerId: null,
    transitionProgress: null,
    isHighlighted: false,
  };
}

describe('GameStore updateTerritory / updateTerritoryOwnership', () => {
  beforeEach(() => {
    // 使用内置 resetGame 将 store 恢复到初始状态
    useGameStore.getState().resetGame();
  });

  it('传入单个 countryId 时仅该国家的 TerritoryState.ownerId 发生变化', () => {
    const store = useGameStore.getState();

    const territories: Territory[] = [
      createTerritory('840', 'United States', 'commander-a'),
      createTerritory('124', 'Canada', 'commander-b'),
      createTerritory('484', 'Mexico', null),
    ];

    store.setTerritories(territories);

    const initialStates = new Map<string, TerritoryState>();
    initialStates.set('840', createTerritoryState('840', 'United States', 'commander-a'));
    initialStates.set('124', createTerritoryState('124', 'Canada', 'commander-b'));
    initialStates.set('484', createTerritoryState('484', 'Mexico', null));
    store.setTerritoryStates(initialStates);

    // Act: 更新单个国家的所有权
    store.updateTerritory('840', {
      ownerId: 'commander-c',
      garrison: 30,
      stability: 80,
    });

    const { territoryStates } = useGameStore.getState();

    // 仍然只存在三个国家的状态
    expect(territoryStates.size).toBe(3);

    const usState = territoryStates.get('840');
    const caState = territoryStates.get('124');
    const mxState = territoryStates.get('484');

    expect(usState).toBeDefined();
    expect(caState).toBeDefined();
    expect(mxState).toBeDefined();

    // 仅目标国家的 ownerId / previousOwnerId / troops / defense 被更新
    expect(usState!.ownerId).toBe('commander-c');
    expect(usState!.previousOwnerId).toBe('commander-a');
    expect(usState!.troops).toBe(30);
    expect(usState!.defense).toBe(80);

    // 其他国家保持不变
    expect(caState!.ownerId).toBe('commander-b');
    expect(mxState!.ownerId).toBeNull();
  });

  it('传入看似区域的 ID 时不会批量占领多个国家', () => {
    const store = useGameStore.getState();

    const territories: Territory[] = [
      createTerritory('840', 'United States', 'commander-a'),
      createTerritory('124', 'Canada', 'commander-b'),
    ];

    store.setTerritories(territories);

    const initialStates = new Map<string, TerritoryState>();
    initialStates.set('840', createTerritoryState('840', 'United States', 'commander-a'));
    initialStates.set('124', createTerritoryState('124', 'Canada', 'commander-b'));
    store.setTerritoryStates(initialStates);

    // Act: 使用看起来像区域 ID 的字符串进行更新
    store.updateTerritory('north-america', {
      ownerId: 'region-owner',
      garrison: 40,
      stability: 90,
    });

    const { territoryStates } = useGameStore.getState();

    const usState = territoryStates.get('840');
    const caState = territoryStates.get('124');

    // 已有国家状态不应被批量改写
    expect(usState!.ownerId).toBe('commander-a');
    expect(caState!.ownerId).toBe('commander-b');

    // 关键断言：不会因为 "north-america" 这样疑似区域 ID 而改变现有多国占领
    // 如有需要，后续可以针对 "north-america" 对应的单一条目做更严格校验
  });
});

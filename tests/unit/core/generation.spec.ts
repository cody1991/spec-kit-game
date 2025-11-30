import { describe, it, expect } from 'vitest';
import { createInitialWorld } from '@core/generation/createInitialWorld';

describe('createInitialWorld', () => {
  it('应该生成指定数量的指挥官', () => {
    const { commanders } = createInitialWorld({ seed: 12345, commanderCount: 8 });
    expect(commanders).toHaveLength(8);
  });

  it('应该为每个指挥官分配初始领土', () => {
    const { commanders } = createInitialWorld({ seed: 12345, commanderCount: 10 });
    commanders.forEach((commander) => {
      expect(commander.controlledTerritories.length).toBeGreaterThan(0);
    });
  });

  it('相同种子应该生成相同的指挥官组合', () => {
    const seed = 54321;
    const result1 = createInitialWorld({ seed, commanderCount: 10 });
    const result2 = createInitialWorld({ seed, commanderCount: 10 });

    expect(result1.commanders.map((c) => c.name)).toEqual(
      result2.commanders.map((c) => c.name)
    );
  });

  it('不同种子应该生成不同的指挥官组合', () => {
    const result1 = createInitialWorld({ seed: 111, commanderCount: 10 });
    const result2 = createInitialWorld({ seed: 222, commanderCount: 10 });

    const names1 = result1.commanders.map((c) => c.name);
    const names2 = result2.commanders.map((c) => c.name);

    // 至少应该有一些不同
    const hasMinOneDifference = names1.some((name, idx) => name !== names2[idx]);
    expect(hasMinOneDifference).toBe(true);
  });

  it('所有指挥官应该有有效的属性', () => {
    const { commanders } = createInitialWorld({ seed: 99999, commanderCount: 10 });

    commanders.forEach((commander) => {
      expect(commander.baseAttributes.attack).toBeGreaterThanOrEqual(40);
      expect(commander.baseAttributes.attack).toBeLessThanOrEqual(100);
      expect(commander.baseAttributes.defense).toBeGreaterThanOrEqual(40);
      expect(commander.baseAttributes.defense).toBeLessThanOrEqual(100);
      expect(commander.baseAttributes.mobility).toBeGreaterThanOrEqual(40);
      expect(commander.baseAttributes.mobility).toBeLessThanOrEqual(100);
      expect(commander.baseAttributes.leadership).toBeGreaterThanOrEqual(40);
      expect(commander.baseAttributes.leadership).toBeLessThanOrEqual(100);

      expect(commander.currentPower).toBeGreaterThanOrEqual(80);
      expect(commander.currentPower).toBeLessThanOrEqual(100);

      expect(commander.morale).toBeGreaterThanOrEqual(70);
      expect(commander.morale).toBeLessThanOrEqual(100);

      expect(commander.status).toBe('active');
    });
  });

  it('应该创建领土并覆盖多个地区', () => {
    const { territories } = createInitialWorld({ seed: 12345, commanderCount: 10 });

    expect(territories.length).toBeGreaterThan(10);

    // 检查领土有相邻关系
    const hasAdjacency = territories.some((t) => t.adjacentIds.length > 0);
    expect(hasAdjacency).toBe(true);
  });
});

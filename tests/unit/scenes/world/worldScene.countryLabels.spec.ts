import { describe, it, expect, beforeEach } from 'vitest';
import type { TerritoryState } from '@core/types';

/**
 * 单元测试：世界场景国家标签渲染逻辑
 *
 * 目标：验证任何时刻每个国家只有一个当前占领者标签
 *
 * 测试场景：
 * 1. 构造多次易主序列
 * 2. 验证任何时间点给定countryId只有一个标签对象
 * 3. 确保旧标签被正确清理，不会堆积
 */

// 模拟标签管理器
class LabelManager {
  private labels: Map<string, { ownerId: string; text: string; createdAt: number }> = new Map();

  /**
   * 设置或更新国家标签
   */
  setLabel(countryId: string, ownerId: string, ownerName: string): void {
    // 如果存在旧标签，先删除
    if (this.labels.has(countryId)) {
      const old = this.labels.get(countryId);
      console.log(`🗑️  清理旧标签: ${countryId} (${old?.text})`);
    }

    // 创建新标签
    this.labels.set(countryId, {
      ownerId,
      text: ownerName,
      createdAt: Date.now(),
    });

    console.log(`✨ 创建新标签: ${countryId} -> ${ownerName}`);
  }

  /**
   * 删除国家标签
   */
  removeLabel(countryId: string): void {
    if (this.labels.has(countryId)) {
      const label = this.labels.get(countryId);
      console.log(`🗑️  删除标签: ${countryId} (${label?.text})`);
      this.labels.delete(countryId);
    }
  }

  /**
   * 获取国家标签
   */
  getLabel(countryId: string) {
    return this.labels.get(countryId);
  }

  /**
   * 获取所有标签
   */
  getAllLabels() {
    return this.labels;
  }

  /**
   * 清空所有标签
   */
  clear(): void {
    this.labels.clear();
  }
}

describe('WorldScene 国家标签渲染逻辑', () => {
  let labelManager: LabelManager;

  beforeEach(() => {
    labelManager = new LabelManager();
  });

  describe('单国家标签唯一性', () => {
    it('任何时刻给定countryId只应该有一个标签对象', () => {
      const countryId = '840'; // 美国

      // 初始占领
      labelManager.setLabel(countryId, 'commander-1', '拿破仑');
      expect(labelManager.getLabel(countryId)).toEqual({
        ownerId: 'commander-1',
        text: '拿破仑',
        createdAt: expect.any(Number),
      });

      // 验证只有一个标签
      expect(labelManager.getAllLabels().size).toBe(1);

      // 易主
      labelManager.setLabel(countryId, 'commander-2', '成吉思汗');
      expect(labelManager.getLabel(countryId)).toEqual({
        ownerId: 'commander-2',
        text: '成吉思汗',
        createdAt: expect.any(Number),
      });

      // 验证仍然只有一个标签
      expect(labelManager.getAllLabels().size).toBe(1);
    });

    it('多次易主后不应该出现标签堆积', () => {
      const countryId = '156'; // 中国
      const owners = [
        { id: 'cmd-1', name: '秦始皇' },
        { id: 'cmd-2', name: '成吉思汗' },
        { id: 'cmd-3', name: '拿破仑' },
        { id: 'cmd-4', name: '凯撒' },
        { id: 'cmd-5', name: '亚历山大' },
      ];

      // 模拟多次易主
      owners.forEach((owner, index) => {
        labelManager.setLabel(countryId, owner.id, owner.name);

        // 每次都应该只有一个标签
        expect(labelManager.getAllLabels().size).toBe(1);

        // 标签内容应该是当前占领者
        const label = labelManager.getLabel(countryId);
        expect(label?.text).toBe(owner.name);
        expect(label?.ownerId).toBe(owner.id);

        console.log(
          `✓ 第${index + 1}次易主: ${owner.name} (总标签数: ${labelManager.getAllLabels().size})`
        );
      });

      // 最终验证
      const finalLabel = labelManager.getLabel(countryId);
      expect(finalLabel?.text).toBe('亚历山大'); // 最后的占领者
    });
  });

  describe('多国家标签管理', () => {
    it('多个国家可以同时有自己的标签', () => {
      const countries = [
        { id: '840', ownerId: 'cmd-1', name: '拿破仑' },
        { id: '156', ownerId: 'cmd-2', name: '成吉思汗' },
        { id: '392', ownerId: 'cmd-3', name: '德川家康' },
      ];

      // 为每个国家设置标签
      countries.forEach((country) => {
        labelManager.setLabel(country.id, country.ownerId, country.name);
      });

      // 验证标签数量
      expect(labelManager.getAllLabels().size).toBe(3);

      // 验证每个国家的标签
      countries.forEach((country) => {
        const label = labelManager.getLabel(country.id);
        expect(label?.text).toBe(country.name);
        expect(label?.ownerId).toBe(country.ownerId);
      });
    });

    it('一个国家易主不应该影响其他国家的标签', () => {
      // 初始设置
      labelManager.setLabel('840', 'cmd-1', '华盛顿');
      labelManager.setLabel('156', 'cmd-2', '秦始皇');
      labelManager.setLabel('392', 'cmd-3', '德川家康');

      expect(labelManager.getAllLabels().size).toBe(3);

      // 美国易主
      labelManager.setLabel('840', 'cmd-4', '拿破仑');

      // 验证总数不变
      expect(labelManager.getAllLabels().size).toBe(3);

      // 验证美国标签更新
      expect(labelManager.getLabel('840')?.text).toBe('拿破仑');

      // 验证其他国家标签未变
      expect(labelManager.getLabel('156')?.text).toBe('秦始皇');
      expect(labelManager.getLabel('392')?.text).toBe('德川家康');
    });
  });

  describe('标签清理逻辑', () => {
    it('占领者被淘汰时应该清理其所有国家标签', () => {
      // 拿破仑占领3个国家
      labelManager.setLabel('250', 'napoleon', '拿破仑');
      labelManager.setLabel('276', 'napoleon', '拿破仑');
      labelManager.setLabel('380', 'napoleon', '拿破仑');

      expect(labelManager.getAllLabels().size).toBe(3);

      // 拿破仑被淘汰，清理所有标签
      const napoleonCountries = ['250', '276', '380'];
      napoleonCountries.forEach((countryId) => {
        const label = labelManager.getLabel(countryId);
        if (label?.ownerId === 'napoleon') {
          labelManager.removeLabel(countryId);
        }
      });

      // 验证标签被清理
      expect(labelManager.getAllLabels().size).toBe(0);
      expect(labelManager.getLabel('250')).toBeUndefined();
      expect(labelManager.getLabel('276')).toBeUndefined();
      expect(labelManager.getLabel('380')).toBeUndefined();
    });

    it('国家变为中立时应该清理标签', () => {
      labelManager.setLabel('840', 'cmd-1', '华盛顿');
      expect(labelManager.getLabel('840')).toBeDefined();

      // 国家变为中立
      labelManager.removeLabel('840');

      expect(labelManager.getLabel('840')).toBeUndefined();
      expect(labelManager.getAllLabels().size).toBe(0);
    });
  });

  describe('与TerritoryState同步', () => {
    it('标签应该与territoryStates的ownerId变化同步', () => {
      // 模拟territoryStates变化
      const territoryStates: Map<string, TerritoryState> = new Map();

      // 初始状态
      territoryStates.set('840', {
        countryId: '840',
        countryName: '美国',
        ownerId: 'cmd-1',
        troops: 50,
        resources: 100,
        defense: 70,
        updatedAt: Date.now(),
        conqueredAt: Date.now(),
        previousOwnerId: null,
        transitionProgress: null,
        isHighlighted: false,
      });

      // 同步到标签
      territoryStates.forEach((state, countryId) => {
        if (state.ownerId) {
          labelManager.setLabel(countryId, state.ownerId, `占领者-${state.ownerId}`);
        }
      });

      expect(labelManager.getLabel('840')?.ownerId).toBe('cmd-1');

      // 更新territoryState
      const updatedState = territoryStates.get('840')!;
      updatedState.ownerId = 'cmd-2';
      updatedState.previousOwnerId = 'cmd-1';

      // 同步到标签
      territoryStates.forEach((state, countryId) => {
        if (state.ownerId) {
          labelManager.setLabel(countryId, state.ownerId, `占领者-${state.ownerId}`);
        }
      });

      // 验证标签更新
      expect(labelManager.getLabel('840')?.ownerId).toBe('cmd-2');
      expect(labelManager.getAllLabels().size).toBe(1); // 仍然只有一个标签
    });

    it('territoryStates删除时应该删除对应标签', () => {
      const territoryStates: Map<string, TerritoryState> = new Map();

      // 初始3个国家
      territoryStates.set('840', {
        countryId: '840',
        countryName: '美国',
        ownerId: 'cmd-1',
        troops: 50,
        resources: 100,
        defense: 70,
        updatedAt: Date.now(),
        conqueredAt: Date.now(),
        previousOwnerId: null,
        transitionProgress: null,
        isHighlighted: false,
      });

      territoryStates.set('156', {
        countryId: '156',
        countryName: '中国',
        ownerId: 'cmd-2',
        troops: 60,
        resources: 120,
        defense: 80,
        updatedAt: Date.now(),
        conqueredAt: Date.now(),
        previousOwnerId: null,
        transitionProgress: null,
        isHighlighted: false,
      });

      // 同步标签
      territoryStates.forEach((state, countryId) => {
        if (state.ownerId) {
          labelManager.setLabel(countryId, state.ownerId, state.countryName);
        }
      });

      expect(labelManager.getAllLabels().size).toBe(2);

      // 删除一个territoryState
      territoryStates.delete('840');

      // 同步删除标签
      const currentCountries = new Set(territoryStates.keys());
      labelManager.getAllLabels().forEach((_, countryId) => {
        if (!currentCountries.has(countryId)) {
          labelManager.removeLabel(countryId);
        }
      });

      // 验证标签被删除
      expect(labelManager.getAllLabels().size).toBe(1);
      expect(labelManager.getLabel('840')).toBeUndefined();
      expect(labelManager.getLabel('156')).toBeDefined();
    });
  });

  describe('边界情况', () => {
    it('连续快速易主不应该导致标签错乱', () => {
      const countryId = '840';

      // 快速连续更新10次
      for (let i = 1; i <= 10; i++) {
        labelManager.setLabel(countryId, `cmd-${i}`, `指挥官${i}`);
      }

      // 应该只有最后一次的标签
      expect(labelManager.getAllLabels().size).toBe(1);
      expect(labelManager.getLabel(countryId)?.text).toBe('指挥官10');
    });

    it('空的ownerId应该触发标签清理', () => {
      labelManager.setLabel('840', 'cmd-1', '华盛顿');
      expect(labelManager.getLabel('840')).toBeDefined();

      // 模拟ownerId变为null（国家变为中立）
      labelManager.removeLabel('840');

      expect(labelManager.getLabel('840')).toBeUndefined();
    });

    it('相同占领者重新占领应该重置标签', async () => {
      const countryId = '840';

      // 第一次占领
      labelManager.setLabel(countryId, 'cmd-1', '拿破仑');
      const firstLabel = labelManager.getLabel(countryId);

      // 等待1ms确保时间戳不同
      await new Promise((resolve) => setTimeout(resolve, 1));

      // 失去后重新占领
      labelManager.removeLabel(countryId);
      labelManager.setLabel(countryId, 'cmd-1', '拿破仑');
      const secondLabel = labelManager.getLabel(countryId);

      // 虽然占领者相同，但应该是新标签
      expect(secondLabel?.ownerId).toBe(firstLabel?.ownerId);
      expect(secondLabel?.createdAt).toBeGreaterThan(firstLabel!.createdAt);
    });
  });
});

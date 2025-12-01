import type { TerritoryBonusConfig } from '../core/types';

/**
 * 领土加成默认配置
 * Feature: 008-territory-bonus
 *
 * 配置说明：
 * - maxAttackBonus: 攻击加成上限
 * - maxDefenseBonus: 防御加成上限
 * - cityBaseFactor: 每个城市贡献的加成（线性）- 权重降低
 * - areaBaseFactor: 面积加成系数（面积占比 * 系数 = 加成）- 权重增大
 * - continuityBonus: 连续领土的额外加成比例
 * - smallFactionDefenseBonus: 小势力防御加成上限
 * - smallFactionThreshold: 触发小势力保护的城市数阈值
 *
 * 加成设计（面积为主，城市为辅）：
 * - 城市加成：每个城市 +0.1%（权重降低）
 * - 面积加成：占10%地图 = +8%加成（系数0.8，权重增大）
 * - 总计上限50%
 *
 * 示例：
 * - 10 国家 + 5%面积: ~1% + 4% = 5%
 * - 30 国家 + 15%面积: ~3% + 12% = 15%
 * - 60 国家 + 30%面积: ~6% + 24% = 30%
 * - 100 国家 + 60%面积: ~10% + 48% = 50%（上限）
 */
export const DEFAULT_TERRITORY_BONUS_CONFIG: TerritoryBonusConfig = {
  maxAttackBonus: 0.5, // 50% 攻击上限
  maxDefenseBonus: 0.4, // 40% 防御上限
  cityBaseFactor: 0.001, // 每个城市 +0.1%（降低权重）
  cityScaleFactor: 0, // 线性模式不使用
  areaBaseFactor: 0.8, // 面积系数：占10%地图=+8%（增大权重）
  areaScaleFactor: 0, // 线性模式不使用
  continuityBonus: 0.1, // 连续领土额外10%
  smallFactionDefenseBonus: 0.1, // 小势力最高10%防御
  smallFactionThreshold: 5, // 5城市以下触发小势力保护
};

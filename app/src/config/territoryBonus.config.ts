import type { TerritoryBonusConfig } from '../core/types';

/**
 * 领土加成默认配置
 * Feature: 008-territory-bonus (updated in 009-unification-balance)
 *
 * 配置说明：
 * - maxAttackBonus: 攻击加成上限
 * - maxDefenseBonus: 防御加成上限
 * - cityBaseFactor: 每个城市贡献的加成（线性）- 增强以形成滚雪球效应
 * - areaBaseFactor: 面积加成系数（面积占比 * 系数 = 加成）- 增强
 * - continuityBonus: 连续领土的额外加成比例
 * - smallFactionDefenseBonus: 小势力防御加成上限 - 降低以加速淘汰
 * - smallFactionThreshold: 触发小势力保护的城市数阈值 - 降低
 *
 * 加成设计（增强版，形成滚雪球效应）：
 * - 城市加成：每个城市 +0.5%（原 0.1%，增强 5 倍）
 * - 面积加成：占10%地图 = +12%加成（系数1.2，原0.8）
 * - 总计上限60%攻击，50%防御
 *
 * 示例：
 * - 10 国家 + 5%面积: ~5% + 6% = 11%
 * - 30 国家 + 15%面积: ~15% + 18% = 33%
 * - 60 国家 + 30%面积: ~30% + 36% = 60%（上限）
 * - 100 国家 + 60%面积: ~50% + 72% = 60%（上限）
 */
export const DEFAULT_TERRITORY_BONUS_CONFIG: TerritoryBonusConfig = {
  maxAttackBonus: 0.6, // 60% 攻击上限（原 50%）
  maxDefenseBonus: 0.5, // 50% 防御上限（原 40%）
  cityBaseFactor: 0.005, // 每个城市 +0.5%（原 0.1%，增强 5 倍）
  cityScaleFactor: 0, // 线性模式不使用
  areaBaseFactor: 1.2, // 面积系数：占10%地图=+12%（原0.8）
  areaScaleFactor: 0, // 线性模式不使用
  continuityBonus: 0.1, // 连续领土额外10%
  smallFactionDefenseBonus: 0.03, // 小势力最高3%防御（原 10%，降低以加速淘汰）
  smallFactionThreshold: 3, // 3城市以下触发小势力保护（原 5）
};

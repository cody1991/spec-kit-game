import type { TerritoryBonusConfig } from '../core/types';

/**
 * 领土加成默认配置
 * Feature: 008-territory-bonus
 *
 * 配置说明：
 * - maxBonus: 加成上限，防止大国过于强大
 * - cityBaseFactor/cityScaleFactor: 控制城市加成的递减曲线
 * - areaBaseFactor/areaScaleFactor: 控制面积加成的递减曲线
 * - continuityBonus: 连续领土的额外加成比例
 * - smallFactionDefenseBonus: 小势力防御加成上限
 * - smallFactionThreshold: 触发小势力保护的城市数阈值
 *
 * 加成曲线设计目标（城市数量加成）：
 * - 5 城市: ~3%
 * - 10 城市: ~5%
 * - 15 城市: ~7%
 * - 20 城市: ~9%
 * - 30 城市: ~11%
 * - 50 城市: ~14%
 * - 100 城市: ~18%（接近上限）
 *
 * 面积加成类似，两者叠加 + 连续区域加成可达 30% 上限
 */
export const DEFAULT_TERRITORY_BONUS_CONFIG: TerritoryBonusConfig = {
  maxBonus: 0.3, // 30%上限
  cityBaseFactor: 0.04, // 降低：城市基础系数（原0.15）
  cityScaleFactor: 0.15, // 降低：城市缩放系数（原0.5）
  areaBaseFactor: 0.035, // 降低：面积基础系数（原0.12）
  areaScaleFactor: 0.3, // 降低：面积缩放系数（原0.8）
  continuityBonus: 0.25, // 连续领土额外25%
  smallFactionDefenseBonus: 0.15, // 小势力最高15%防御
  smallFactionThreshold: 5, // 提高阈值：5城市以下触发（原3）
};

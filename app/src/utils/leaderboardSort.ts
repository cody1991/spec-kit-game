import type { FactionStatistics } from '../core/types';

/**
 * 排行榜排序算法
 * 
 * 排序规则：
 * 1. 主排序：国家数量降序 (countryCount DESC)
 * 2. 次排序：国土面积降序 (totalArea DESC)
 * 
 * @param stats 势力统计数据数组
 * @returns 排序后的数组，每个元素添加了 rank 字段
 */
export function sortLeaderboard(
  stats: FactionStatistics[]
): (FactionStatistics & { rank: number })[] {
  // 创建副本避免修改原数组
  return [...stats]
    .sort((a, b) => {
      // 主排序：国家数量降序
      if (b.countryCount !== a.countryCount) {
        return b.countryCount - a.countryCount;
      }
      // 次排序：国土面积降序
      return b.totalArea - a.totalArea;
    })
    .map((faction, index) => ({
      ...faction,
      rank: index + 1,
    }));
}

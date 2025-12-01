import { useMemo, useEffect, useState } from 'react';
import { useGameStore } from '../../core/state/store';
import { sortLeaderboard } from '../../utils/leaderboardSort';
import './FactionStatsPanel.css';

/**
 * 格式化面积显示
 * @param area 面积（平方公里）
 * @returns 格式化字符串（例如："2.3M" 或 "850K"）
 */
function formatArea(area: number): string {
  if (area >= 1000000) {
    return `${(area / 1000000).toFixed(1)}M`;
  }
  return `${(area / 1000).toFixed(0)}K`;
}

/**
 * 格式化胜率显示
 * @param winRate 胜率 (-1表示N/A，否则为0-1之间的数)
 * @returns 格式化字符串（例如："75.5%" 或 "N/A"）
 */
function formatWinRate(winRate: number): string {
  if (winRate < 0) {
    return 'N/A';
  }
  return `${(winRate * 100).toFixed(1)}%`;
}

/**
 * 势力统计排行榜面板
 */
export function FactionStatsPanel() {
  const factionStats = useGameStore((state) => state.factionStats);
  const showPanel = useGameStore((state) => state.showFactionStatsPanel);
  const closePanel = useGameStore((state) => state.closeFactionStatsPanel);

  // 追踪最近更新的势力ID（用于视觉反馈）
  const [recentlyUpdatedIds, setRecentlyUpdatedIds] = useState<Set<string>>(new Set());

  // 排序排行榜
  const leaderboard = useMemo(() => {
    const stats = Array.from(factionStats.values());
    return sortLeaderboard(stats);
  }, [factionStats]);

  // 监听 factionStats 变化，追踪更新的势力
  useEffect(() => {
    // 找出最近更新的势力（lastUpdatedAt 在最近2秒内）
    const now = Date.now();
    const recentThreshold = 2000; // 2秒
    const updatedIds = new Set<string>();

    factionStats.forEach((stats) => {
      if (now - stats.lastUpdatedAt < recentThreshold) {
        updatedIds.add(stats.commanderId);
      }
    });

    if (updatedIds.size > 0) {
      setRecentlyUpdatedIds(updatedIds);

      // 1秒后移除高亮
      const timer = setTimeout(() => {
        setRecentlyUpdatedIds(new Set());
      }, 1000);

      return () => clearTimeout(timer);
    }
  }, [factionStats]);

  if (!showPanel) {
    return null;
  }

  return (
    <div className="faction-stats-panel">
      <div className="panel-header">
        <h2 id="panel-title">势力统计排行榜</h2>
        <button className="close-btn" onClick={closePanel} aria-label="关闭">
          ×
        </button>
      </div>

      <div className="panel-content">
        <table className="leaderboard">
          <thead>
            <tr>
              <th>排名</th>
              <th>势力</th>
              <th>国家数</th>
              <th>面积</th>
              <th>战胜</th>
              <th>战败</th>
              <th>胜率</th>
            </tr>
          </thead>
          <tbody>
            {leaderboard.length === 0 ? (
              <tr>
                <td colSpan={7} className="empty-message">
                  暂无数据
                </td>
              </tr>
            ) : (
              leaderboard.map((faction) => (
                <tr 
                  key={faction.commanderId} 
                  className={`leaderboard-row ${recentlyUpdatedIds.has(faction.commanderId) ? 'row-updated' : ''}`}
                >
                  <td className="rank">{faction.rank}</td>
                  <td className="faction-name">{faction.commanderName}</td>
                  <td className="country-count">{faction.countryCount}</td>
                  <td className="area">{formatArea(faction.totalArea)}</td>
                  <td className="wins">{faction.wins}</td>
                  <td className="losses">{faction.losses}</td>
                  <td className="win-rate">{formatWinRate(faction.winRate)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

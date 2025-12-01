import React from 'react';
import type { TerritoryBonus } from '../../core/types';
import './TerritoryBonusDisplay.css';

interface TerritoryBonusDisplayProps {
  bonus: TerritoryBonus | null;
  showDetails?: boolean;
}

/**
 * 领土加成展示组件
 * Feature: 008-territory-bonus
 *
 * 展示势力的领土加成明细，包括：
 * - 城市数量加成
 * - 领土面积加成
 * - 连续区域加成
 * - 小势力防御加成
 * - 总攻击/防御加成
 */
export const TerritoryBonusDisplay: React.FC<TerritoryBonusDisplayProps> = ({
  bonus,
  showDetails = true,
}) => {
  if (!bonus) {
    return (
      <div className="territory-bonus-display territory-bonus-empty">
        <span className="bonus-label">领土加成</span>
        <span className="bonus-value">计算中...</span>
      </div>
    );
  }

  const formatPercent = (value: number): string => {
    return `+${(value * 100).toFixed(1)}%`;
  };

  const hasSmallFactionBonus = bonus.smallFactionDefenseBonus > 0;

  return (
    <div className="territory-bonus-display">
      <div className="bonus-header">
        <span className="bonus-title">🏰 领土加成</span>
      </div>

      {/* 总加成摘要 */}
      <div className="bonus-summary">
        <div className="bonus-item bonus-attack">
          <span className="bonus-icon">⚔️</span>
          <span className="bonus-label">攻击力</span>
          <span className="bonus-value">{formatPercent(bonus.totalAttackBonus)}</span>
        </div>
        <div className="bonus-item bonus-defense">
          <span className="bonus-icon">🛡️</span>
          <span className="bonus-label">防御力</span>
          <span className="bonus-value">{formatPercent(bonus.totalDefenseBonus)}</span>
        </div>
      </div>

      {/* 详细加成明细 */}
      {showDetails && (
        <div className="bonus-details">
          <div className="bonus-detail-item">
            <span className="detail-label">🏙️ 城市加成</span>
            <span className="detail-value">{formatPercent(bonus.cityBonus)}</span>
          </div>
          <div className="bonus-detail-item">
            <span className="detail-label">🗺️ 面积加成</span>
            <span className="detail-value">{formatPercent(bonus.areaBonus)}</span>
          </div>
          {bonus.continuityBonus > 0 && (
            <div className="bonus-detail-item bonus-continuity">
              <span className="detail-label">🔗 连续区域</span>
              <span className="detail-value">{formatPercent(bonus.continuityBonus)}</span>
            </div>
          )}
          {hasSmallFactionBonus && (
            <div className="bonus-detail-item bonus-small-faction">
              <span className="detail-label">🛡️ 小势力保护</span>
              <span className="detail-value">{formatPercent(bonus.smallFactionDefenseBonus)}</span>
            </div>
          )}
        </div>
      )}

      {/* 连通性信息 */}
      {showDetails && (
        <div className="bonus-contiguity-info">
          <span className="contiguity-label">
            连通区域: {bonus.contiguousRegionCount} 个
            {bonus.contiguousRegionCount > 1 && (
              <span className="contiguity-hint">（最大 {bonus.largestContiguousCount} 城）</span>
            )}
          </span>
        </div>
      )}
    </div>
  );
};

export default TerritoryBonusDisplay;

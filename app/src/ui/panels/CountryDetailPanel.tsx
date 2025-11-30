/**
 * Country Detail Panel
 * 
 * Displays detailed information about a selected country/territory
 * Shows: country name, owner (commander), troops, resources, defense
 */

import { useGameStore } from '@core/state/store';
import type { Country, TerritoryState, CommanderColor } from '@core/types';
import './CountryDetailPanel.css';

export function CountryDetailPanel() {
  const selectedTerritoryId = useGameStore((state) => state.selectedTerritoryId);
  const commanders = useGameStore((state) => state.commanders);
  const territories = useGameStore((state) => state.territories);
  const territoryStates = useGameStore((state) => state.territoryStates);
  const colorMappings = useGameStore((state) => state.colorMappings);

  if (!selectedTerritoryId) {
    return null;
  }

  // Get territory data
  const territory = territories.find((t) => t.id === selectedTerritoryId);
  const territoryState = territoryStates.get(selectedTerritoryId);
  
  if (!territory) {
    return null;
  }

  // Get owner info
  const owner = territory.ownerId
    ? commanders.find((c) => c.id === territory.ownerId)
    : null;
  
  const colorMapping = territory.ownerId
    ? colorMappings.get(territory.ownerId)
    : null;

  return (
    <div className="country-detail-panel">
      <div className="panel-header">
        <h3>{territory.name}</h3>
        <button
          className="close-button"
          onClick={() => useGameStore.getState().selectTerritory(null)}
          aria-label="Close detail panel"
        >
          ✕
        </button>
      </div>

      <div className="panel-content">
        {/* Owner Info */}
        <div className="info-section">
          <div className="info-label">统治者</div>
          {owner ? (
            <div className="info-value commander-info">
              {colorMapping && (
                <div
                  className="commander-color-indicator"
                  style={{
                    backgroundColor: `#${colorMapping.primary.toString(16).padStart(6, '0')}`,
                  }}
                  title={colorMapping.label}
                />
              )}
              <span>{owner.name}</span>
            </div>
          ) : (
            <div className="info-value neutral">中立</div>
          )}
        </div>

        {/* Territory Stats */}
        {territoryState && (
          <>
            <div className="info-section">
              <div className="info-label">驻军</div>
              <div className="info-value">
                {territoryState.troops.toLocaleString()} 兵力
              </div>
            </div>

            <div className="info-section">
              <div className="info-label">防御力</div>
              <div className="info-value">
                <div className="stat-bar">
                  <div
                    className="stat-bar-fill"
                    style={{ width: `${territoryState.defense}%` }}
                  />
                </div>
                <span className="stat-value">{territoryState.defense}</span>
              </div>
            </div>

            {territoryState.resources > 0 && (
              <div className="info-section">
                <div className="info-label">资源</div>
                <div className="info-value">
                  {territoryState.resources.toLocaleString()}
                </div>
              </div>
            )}
          </>
        )}

        {/* Legacy territory stats (fallback) */}
        {!territoryState && (
          <>
            <div className="info-section">
              <div className="info-label">驻军</div>
              <div className="info-value">
                {territory.garrison?.toLocaleString() || 0} 兵力
              </div>
            </div>

            <div className="info-section">
              <div className="info-label">稳定度</div>
              <div className="info-value">
                <div className="stat-bar">
                  <div
                    className="stat-bar-fill"
                    style={{ width: `${territory.stability || 0}%` }}
                  />
                </div>
                <span className="stat-value">{territory.stability || 0}</span>
              </div>
            </div>
          </>
        )}

        {/* Conquest Info */}
        {territoryState?.conqueredAt && (
          <div className="info-section conquest-info">
            <div className="info-label">占领时间</div>
            <div className="info-value">
              {formatTimeSince(territoryState.conqueredAt)}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Format time since conquest
 */
function formatTimeSince(timestamp: number): string {
  const now = Date.now();
  const diffMs = now - timestamp;
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);

  if (diffMinutes < 1) {
    return '刚刚';
  } else if (diffMinutes < 60) {
    return `${diffMinutes} 分钟前`;
  } else {
    const diffHours = Math.floor(diffMinutes / 60);
    return `${diffHours} 小时前`;
  }
}

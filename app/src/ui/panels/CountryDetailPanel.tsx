/**
 * Country Detail Panel
 *
 * Displays detailed information about a selected country/territory
 * Shows: country name, owner (commander), troops, resources, defense
 */

import { useGameStore } from '@core/state/store';
import type { Country, TerritoryState, CommanderColor } from '@core/types';
import { COUNTRY_AREAS } from '../../data/countryAreas';
import './CountryDetailPanel.css';

/**
 * Format area for display
 * @param area Area in km²
 * @returns Formatted string (e.g., "9.57M km²" or "18.3K km²")
 */
function formatArea(area: number): string {
  if (area >= 1000000) {
    return `${(area / 1000000).toFixed(2)}M km²`;
  } else if (area >= 1000) {
    return `${(area / 1000).toFixed(1)}K km²`;
  }
  return `${area.toFixed(0)} km²`;
}

export function CountryDetailPanel() {
  const selectedTerritoryId = useGameStore((state) => state.selectedTerritoryId);
  const commanders = useGameStore((state) => state.commanders);
  const territories = useGameStore((state) => state.territories);
  const territoryStates = useGameStore((state) => state.territoryStates);
  const colorMappings = useGameStore((state) => state.colorMappings);

  if (!selectedTerritoryId) {
    return null;
  }

  // Get territory state (new system - country-based)
  const territoryState = territoryStates.get(selectedTerritoryId);

  // Fallback to legacy territory system if territoryState not found
  const territory = territories.find((t) => t.id === selectedTerritoryId);

  // Use country name from territoryState if available, otherwise use territory name
  const displayName = territoryState?.countryName || territory?.name || selectedTerritoryId;
  const ownerId = territoryState?.ownerId || territory?.ownerId;

  // Get real area data
  const countryArea = COUNTRY_AREAS[displayName] ?? 0;

  // Get owner info
  const owner = ownerId ? commanders.find((c) => c.id === ownerId) : null;

  const colorMapping = ownerId ? colorMappings.get(ownerId) : null;

  return (
    <div className="country-detail-panel">
      <div className="panel-header">
        <h3>{displayName}</h3>
        <button
          className="close-button"
          onClick={() => useGameStore.getState().selectTerritory(null)}
          aria-label="Close detail panel"
        >
          ✕
        </button>
      </div>

      <div className="panel-content">
        {/* Current owner (single, country-level) */}
        <div className="info-section">
          <div className="info-label">当前占领者</div>
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

        {/* Country Area */}
        {countryArea > 0 && (
          <div className="info-section">
            <div className="info-label">国土面积</div>
            <div className="info-value area-value">{formatArea(countryArea)}</div>
          </div>
        )}

        {/* Territory Stats */}
        {territoryState && (
          <>
            <div className="info-section">
              <div className="info-label">驻军</div>
              <div className="info-value">{territoryState.troops.toLocaleString()} 兵力</div>
            </div>

            <div className="info-section">
              <div className="info-label">防御力</div>
              <div className="info-value">
                <div className="stat-bar">
                  <div className="stat-bar-fill" style={{ width: `${territoryState.defense}%` }} />
                </div>
                <span className="stat-value">{territoryState.defense}</span>
              </div>
            </div>

            {territoryState.resources > 0 && (
              <div className="info-section">
                <div className="info-label">资源</div>
                <div className="info-value">{territoryState.resources.toLocaleString()}</div>
              </div>
            )}
          </>
        )}

        {/* Legacy territory stats (fallback) */}
        {!territoryState && (
          <>
            <div className="info-section">
              <div className="info-label">驻军</div>
              <div className="info-value">{territory.garrison?.toLocaleString() || 0} 兵力</div>
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
            <div className="info-value">{formatTimeSince(territoryState.conqueredAt)}</div>
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

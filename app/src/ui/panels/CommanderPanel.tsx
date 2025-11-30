import { useGameStore } from '@core/state/store';
import './CommanderPanel.css';

export function CommanderPanel() {
  const selectedCommanderId = useGameStore((state) => state.selectedCommanderId);
  const commanders = useGameStore((state) => state.commanders);
  const selectCommander = useGameStore((state) => state.selectCommander);

  const commander = commanders.find((c) => c.id === selectedCommanderId);

  if (!commander) return null;

  return (
    <div className="commander-panel">
      <div className="panel-header">
        <h3>{commander.name}</h3>
        <button className="close-btn" onClick={() => selectCommander(null)}>
          ×
        </button>
      </div>

      <div className="panel-content">
        <div className="status-badge">{commander.status === 'active' ? '活跃' : '已淘汰'}</div>

        <div className="stats-section">
          <h4>属性</h4>
          <div className="stat-row">
            <span>攻击</span>
            <div className="stat-bar">
              <div
                className="stat-fill attack"
                style={{ width: `${commander.baseAttributes.attack}%` }}
              />
            </div>
            <span>{commander.baseAttributes.attack}</span>
          </div>
          <div className="stat-row">
            <span>防御</span>
            <div className="stat-bar">
              <div
                className="stat-fill defense"
                style={{ width: `${commander.baseAttributes.defense}%` }}
              />
            </div>
            <span>{commander.baseAttributes.defense}</span>
          </div>
          <div className="stat-row">
            <span>机动</span>
            <div className="stat-bar">
              <div
                className="stat-fill mobility"
                style={{ width: `${commander.baseAttributes.mobility}%` }}
              />
            </div>
            <span>{commander.baseAttributes.mobility}</span>
          </div>
          <div className="stat-row">
            <span>统御</span>
            <div className="stat-bar">
              <div
                className="stat-fill leadership"
                style={{ width: `${commander.baseAttributes.leadership}%` }}
              />
            </div>
            <span>{commander.baseAttributes.leadership}</span>
          </div>
        </div>

        <div className="info-section">
          <div className="info-item">
            <span className="info-label">战力</span>
            <span className="info-value">{commander.currentPower}</span>
          </div>
          <div className="info-item">
            <span className="info-label">士气</span>
            <span className="info-value">{commander.morale}</span>
          </div>
          <div className="info-item">
            <span className="info-label">领土数</span>
            <span className="info-value">{commander.controlledTerritories.length}</span>
          </div>
        </div>

        {commander.alliances.length > 0 && (
          <div className="alliances-section">
            <h4>盟友</h4>
            <div className="alliance-list">
              {commander.alliances.map((allyId) => {
                const ally = commanders.find((c) => c.id === allyId);
                return <span key={allyId} className="ally-tag">{ally?.name || allyId}</span>;
              })}
            </div>
          </div>
        )}

        {commander.skillCards.length > 0 && (
          <div className="skills-section">
            <h4>技能</h4>
            {commander.skillCards.map((skill) => (
              <div key={skill.id} className="skill-card">
                <div className="skill-name">{skill.name}</div>
                <div className="skill-desc">{skill.modifier}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

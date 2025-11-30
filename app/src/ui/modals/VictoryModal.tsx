import { useGameStore } from '@core/state/store';
import { restartSession } from '@core/session/startSession';
import './VictoryModal.css';

export function VictoryModal() {
  const showVictoryModal = useGameStore((state) => state.showVictoryModal);
  const victorCommanderId = useGameStore((state) => state.victorCommanderId);
  const commanders = useGameStore((state) => state.commanders);
  const eventLog = useGameStore((state) => state.eventLog);
  const elapsedMs = useGameStore((state) => state.elapsedMs);
  const seed = useGameStore((state) => state.seed);

  if (!showVictoryModal || !victorCommanderId) return null;

  const victor = commanders.find((c) => c.id === victorCommanderId);
  if (!victor) return null;

  const totalBattles = eventLog.filter((e) => e.type === 'attack').length;
  const victorBattles = eventLog.filter(
    (e) => e.type === 'attack' && e.attackerId === victorCommanderId && e.result === 'success'
  ).length;
  const eliminatedCount = commanders.filter((c) => c.status === 'eliminated').length;
  const elapsedMinutes = Math.floor(elapsedMs / 60000);
  const elapsedSeconds = Math.floor((elapsedMs % 60000) / 1000);

  const handleCopyReport = () => {
    const report = `
历史征服模拟器 - 战局报告

🏆 胜利者: ${victor.name}
⏱️ 用时: ${elapsedMinutes}分${elapsedSeconds}秒
⚔️ 总战役数: ${totalBattles}
🎯 胜利战役: ${victorBattles}
💀 淘汰对手: ${eliminatedCount}
🌍 领土数: ${victor.controlledTerritories.length}
🌱 种子: ${seed}

生成于: ${new Date().toLocaleString()}
    `.trim();

    navigator.clipboard.writeText(report).then(() => {
      alert('战报已复制到剪贴板！');
    });
  };

  return (
    <div className="victory-modal-overlay">
      <div className="victory-modal">
        <div className="victory-header">
          <h2>🎉 胜利！</h2>
        </div>

        <div className="victory-content">
          <div className="victor-name">{victor.name}</div>
          <div className="victor-subtitle">统一了世界！</div>

          <div className="stats-grid">
            <div className="stat-box">
              <div className="stat-label">用时</div>
              <div className="stat-value">
                {elapsedMinutes}:{elapsedSeconds.toString().padStart(2, '0')}
              </div>
            </div>
            <div className="stat-box">
              <div className="stat-label">战役数</div>
              <div className="stat-value">{totalBattles}</div>
            </div>
            <div className="stat-box">
              <div className="stat-label">胜利战役</div>
              <div className="stat-value">{victorBattles}</div>
            </div>
            <div className="stat-box">
              <div className="stat-label">淘汰对手</div>
              <div className="stat-value">{eliminatedCount}</div>
            </div>
            <div className="stat-box">
              <div className="stat-label">领土数</div>
              <div className="stat-value">{victor.controlledTerritories.length}</div>
            </div>
            <div className="stat-box">
              <div className="stat-label">最终战力</div>
              <div className="stat-value">{victor.currentPower}</div>
            </div>
          </div>

          <div className="seed-info">
            <span className="seed-label">种子:</span>
            <code className="seed-value">{seed}</code>
          </div>
        </div>

        <div className="victory-actions">
          <button className="action-btn secondary" onClick={handleCopyReport}>
            📋 复制战报
          </button>
          <button className="action-btn primary" onClick={restartSession}>
            🔄 再来一局
          </button>
        </div>
      </div>
    </div>
  );
}

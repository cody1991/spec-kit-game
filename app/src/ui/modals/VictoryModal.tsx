import { useGameStore } from '@core/state/store';
import { restartSession } from '@core/session/startSession';
import './VictoryModal.css';

/**
 * 获取胜利类型信息
 * Feature: 009-unification-balance
 */
function getVictoryTypeInfo(eventLog: any[], victorCommanderId: string, territories: any[], controlledCount: number) {
  // 查找胜利事件
  const victoryEvent = eventLog.find(
    (e) => e.type === 'victory' && e.attackerId === victorCommanderId
  );
  
  const victoryType = victoryEvent?.delta?.victoryType;
  const totalTerritories = territories.length || 1;
  const ratio = ((controlledCount / totalTerritories) * 100).toFixed(1);
  
  if (victoryType === 'territory') {
    return {
      type: '领土胜利',
      emoji: '🗺️',
      description: `占领了 ${ratio}% 的领土`,
    };
  } else {
    return {
      type: '消灭胜利',
      emoji: '⚔️',
      description: '消灭了所有对手',
    };
  }
}

export function VictoryModal() {
  const showVictoryModal = useGameStore((state) => state.showVictoryModal);
  const victorCommanderId = useGameStore((state) => state.victorCommanderId);
  const commanders = useGameStore((state) => state.commanders);
  const territories = useGameStore((state) => state.territories);
  const eventLog = useGameStore((state) => state.eventLog);
  const elapsedMs = useGameStore((state) => state.elapsedMs);
  const seed = useGameStore((state) => state.seed);
  const closeVictoryModal = useGameStore((state) => state.closeVictoryModal);

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

  // Feature: 009-unification-balance - 胜利类型信息
  const victoryInfo = getVictoryTypeInfo(
    eventLog,
    victorCommanderId,
    territories,
    victor.controlledTerritories.length
  );

  const handleCopyReport = () => {
    const report = `
历史征服模拟器 - 战局报告

🏆 胜利者: ${victor.name}
${victoryInfo.emoji} 胜利类型: ${victoryInfo.type}
📝 ${victoryInfo.description}
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
    <div className="victory-modal-overlay" onClick={closeVictoryModal} data-testid="victory-modal">
      <div className="victory-modal" onClick={(e) => e.stopPropagation()}>
        <button className="close-btn" onClick={closeVictoryModal} aria-label="关闭">
          ✕
        </button>
        <div className="victory-header">
          <h2>🎉 胜利！</h2>
        </div>

        <div className="victory-content">
          <div className="victor-name">{victor.name}</div>
          <div className="victor-subtitle">统一了世界！</div>
          
          {/* Feature: 009-unification-balance - 显示胜利类型 */}
          <div className="victory-type">
            <span className="victory-type-emoji">{victoryInfo.emoji}</span>
            <span className="victory-type-text">{victoryInfo.type}</span>
            <span className="victory-type-desc">{victoryInfo.description}</span>
          </div>

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
          <button className="action-btn secondary" onClick={closeVictoryModal}>
            ↩️ 继续观察
          </button>
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

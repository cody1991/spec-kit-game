import { useGameStore } from '@core/state/store';
import './BattleTimeline.css';

export function BattleTimeline() {
  const eventLog = useGameStore((state) => state.eventLog);
  const commanders = useGameStore((state) => state.commanders);
  const isPaused = useGameStore((state) => state.isPaused);
  const setPaused = useGameStore((state) => state.setPaused);

  const getCommanderName = (id?: string) => {
    if (!id) return '未知';
    const commander = commanders.find((c) => c.id === id);
    return commander?.name || id;
  };

  const recentEvents = [...eventLog].reverse().slice(0, 20);

  return (
    <div className="battle-timeline">
      <div className="timeline-header">
        <h3>战报</h3>
        <button className="pause-btn" onClick={() => setPaused(!isPaused)}>
          {isPaused ? '▶️ 继续' : '⏸️ 暂停'}
        </button>
      </div>

      <div className="timeline-content">
        {recentEvents.length === 0 ? (
          <div className="empty-state">暂无战报</div>
        ) : (
          recentEvents.map((event) => (
            <div key={event.id} className={`event-item event-${event.type}`}>
              <div className="event-time">{new Date(event.timestamp).toLocaleTimeString()}</div>
              <div className="event-narrative">{event.narrative}</div>
              {event.attackerId && event.defenderId && (
                <div className="event-participants">
                  <span className="attacker">{getCommanderName(event.attackerId)}</span>
                  <span className="vs">VS</span>
                  <span className="defender">{getCommanderName(event.defenderId)}</span>
                </div>
              )}
              <div className={`event-result result-${event.result}`}>{event.result}</div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

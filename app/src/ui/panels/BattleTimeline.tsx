import { useMemo } from 'react';
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

  // 获取最新的 20 条事件（去重、按时间戳排序，最新的在最上面）
  const recentEvents = useMemo(() => {
    // 1. 去重（按ID）
    const uniqueEvents = new Map();
    eventLog.forEach((event) => {
      if (!uniqueEvents.has(event.id)) {
        uniqueEvents.set(event.id, event);
      }
    });

    // 2. 排序（时间戳降序，相同时按ID稳定排序）
    return Array.from(uniqueEvents.values())
      .sort((a, b) => {
        const timeA = new Date(a.timestamp).getTime();
        const timeB = new Date(b.timestamp).getTime();

        // 验证时间戳有效性
        if (isNaN(timeA) || isNaN(timeB)) {
          console.warn('[BattleTimeline] Invalid timestamp detected:', {
            a: a.timestamp,
            b: b.timestamp,
          });
          return 0;
        }

        // 降序排列（最新的在前）
        if (timeB !== timeA) {
          return timeB - timeA;
        }

        // 时间戳相同时按ID排序（稳定排序）
        return b.id.localeCompare(a.id);
      })
      .slice(0, 20);
  }, [eventLog]);

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

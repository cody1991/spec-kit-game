import { useMemo } from 'react';
import { useGameStore } from '@core/state/store';
import './BattleTimeline.css';

// 单个事件项组件
function EventItem({ 
  event, 
  commanderNames
}: { 
  event: any; 
  commanderNames: Map<string, string>;
}) {
  const getCommanderName = (id?: string) => {
    if (!id) return '未知';
    return commanderNames.get(id) || id;
  };

  return (
    <div className={`event-item event-${event.type}`}>
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
  );
}

export function BattleTimeline() {
  // 订阅 eventLog - 每次更新都会是新数组
  const eventLog = useGameStore((state) => state.eventLog);
  const commanders = useGameStore((state) => state.commanders);
  const isPaused = useGameStore((state) => state.isPaused);
  const setPaused = useGameStore((state) => state.setPaused);
  
  // 构建指挥官名称映射
  const commanderNameMap = useMemo(() => {
    const map = new Map<string, string>();
    for (const c of commanders) {
      map.set(c.id, c.name);
    }
    return map;
  }, [commanders]);

  // 获取最新的 10 条事件，最新的在最上面
  // 使用 eventLog.length 作为额外依赖确保更新
  const recentEvents = useMemo(() => {
    // 取最后 10 条并反转，使最新的显示在顶部
    return eventLog.slice(-10).reverse();
  }, [eventLog]);

  return (
    <div className="battle-timeline">
      <div className="timeline-header">
        <h3>战报（历史记录）</h3>
        <button className="pause-btn" onClick={() => setPaused(!isPaused)}>
          {isPaused ? '▶️ 继续' : '⏸️ 暂停'}
        </button>
      </div>

      <div className="timeline-content">
        {recentEvents.length === 0 ? (
          <div className="empty-state">暂无战报</div>
        ) : (
          recentEvents.map((event) => (
            <EventItem 
              key={event.id} 
              event={event} 
              commanderNames={commanderNameMap}
            />
          ))
        )}
      </div>
    </div>
  );
}

import { useMemo, useRef, memo } from 'react';
import { useGameStore } from '@core/state/store';
import './BattleTimeline.css';

// 单个事件项组件，使用 memo 避免不必要的重渲染
const EventItem = memo(function EventItem({ 
  event, 
  getCommanderName 
}: { 
  event: any; 
  getCommanderName: (id?: string) => string;
}) {
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
});

export function BattleTimeline() {
  // 只订阅 eventLog 的长度变化，而不是整个数组
  const eventLogLength = useGameStore((state) => state.eventLog.length);
  const eventLog = useGameStore((state) => state.eventLog);
  const commanders = useGameStore((state) => state.commanders);
  const isPaused = useGameStore((state) => state.isPaused);
  const setPaused = useGameStore((state) => state.setPaused);
  
  // 缓存指挥官名称映射
  const commanderNameMap = useRef(new Map<string, string>());
  
  // 更新指挥官名称缓存
  useMemo(() => {
    commanderNameMap.current.clear();
    for (const c of commanders) {
      commanderNameMap.current.set(c.id, c.name);
    }
  }, [commanders]);

  const getCommanderName = (id?: string) => {
    if (!id) return '未知';
    return commanderNameMap.current.get(id) || id;
  };

  // 获取最新的 10 条事件（减少数量以提高性能）
  const recentEvents = useMemo(() => {
    // 直接取最后 10 条，不需要去重和排序（RingBuffer 已经保证顺序）
    const events = eventLog.slice(-10).reverse();
    return events;
  }, [eventLog, eventLogLength]);

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
              getCommanderName={getCommanderName}
            />
          ))
        )}
      </div>
    </div>
  );
}

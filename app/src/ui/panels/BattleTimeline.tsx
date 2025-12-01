import { useGameStore } from '@core/state/store';
import './BattleTimeline.css';

// 单个事件项组件
function EventItem({
  event,
  getCommanderName,
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
}

export function BattleTimeline() {
  // 订阅 eventLog
  const eventLog = useGameStore((state) => state.eventLog);
  const commanders = useGameStore((state) => state.commanders);
  const isPaused = useGameStore((state) => state.isPaused);
  const setPaused = useGameStore((state) => state.setPaused);

  // 构建指挥官名称映射 - 每次渲染都重新构建（commanders 变化不频繁）
  const commanderNameMap = new Map<string, string>();
  for (const c of commanders) {
    commanderNameMap.set(c.id, c.name);
  }

  const getCommanderName = (id?: string) => {
    if (!id) return '未知';
    return commanderNameMap.get(id) || id;
  };

  // 直接计算最新的 10 条事件，最新的在最上面
  // 不使用 useMemo，确保每次 eventLog 变化都重新计算
  const recentEvents: any[] = [];
  const startIndex = Math.max(0, eventLog.length - 10);
  for (let i = eventLog.length - 1; i >= startIndex; i--) {
    recentEvents.push(eventLog[i]);
  }

  return (
    <div className="battle-timeline">
      <div className="timeline-header">
        <h3>战报（历史记录）</h3>
        <button className="pause-btn" onClick={() => setPaused(!isPaused)}>
          {isPaused ? '▶️ 继续' : '⏸️ 暂停'}
        </button>
      </div>

      {/* 使用 eventLog.length 作为 key 强制整个列表重新渲染 */}
      <div className="timeline-content" key={eventLog.length}>
        {recentEvents.length === 0 ? (
          <div className="empty-state">暂无战报</div>
        ) : (
          recentEvents.map((event) => (
            <EventItem key={event.id} event={event} getCommanderName={getCommanderName} />
          ))
        )}
      </div>
    </div>
  );
}

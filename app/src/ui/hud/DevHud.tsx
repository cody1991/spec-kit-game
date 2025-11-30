import { useEffect, useState } from 'react';
import { useGameStore } from '@core/state/store';
import './DevHud.css';

export function DevHud() {
  const performanceMetrics = useGameStore((state) => state.performanceMetrics);
  const tick = useGameStore((state) => state.tick);
  const commanders = useGameStore((state) => state.commanders);
  const eventLog = useGameStore((state) => state.eventLog);
  const [show, setShow] = useState(false);

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === '`') {
        setShow((prev) => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, []);

  if (!show) {
    return (
      <div className="dev-hud-toggle" onClick={() => setShow(true)}>
        📊
      </div>
    );
  }

  const activeCommanders = commanders.filter((c) => c.status === 'active').length;

  return (
    <div className="dev-hud">
      <div className="hud-header">
        <span>开发 HUD</span>
        <button onClick={() => setShow(false)}>×</button>
      </div>

      <div className="hud-content">
        <div className="hud-row">
          <span className="hud-label">FPS:</span>
          <span className="hud-value">{performanceMetrics.fps.toFixed(1)}</span>
        </div>

        <div className="hud-row">
          <span className="hud-label">Tick:</span>
          <span className="hud-value">{tick}</span>
        </div>

        <div className="hud-row">
          <span className="hud-label">Tick 耗时:</span>
          <span className="hud-value">{performanceMetrics.tickMs.toFixed(2)}ms</span>
        </div>

        <div className="hud-row">
          <span className="hud-label">活跃指挥官:</span>
          <span className="hud-value">{activeCommanders}</span>
        </div>

        <div className="hud-row">
          <span className="hud-label">事件数:</span>
          <span className="hud-value">{eventLog.length}</span>
        </div>
      </div>

      <div className="hud-footer">按 ` 键切换</div>
    </div>
  );
}

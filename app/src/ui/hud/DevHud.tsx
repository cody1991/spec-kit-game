import { useEffect, useState, useCallback, useMemo } from 'react';
import { useGameStore } from '@core/state/store';
import './DevHud.css';

/**
 * 计算游戏阶段
 * Feature: 009-unification-balance
 */
function getGamePhase(activeCount: number, isEndgameMode: boolean): { phase: string; color: string; emoji: string } {
  if (isEndgameMode || activeCount <= 3) {
    return { phase: '决战', color: '#ef4444', emoji: '⚔️' };
  } else if (activeCount <= 10) {
    return { phase: '中期', color: '#facc15', emoji: '🏹' };
  } else {
    return { phase: '早期', color: '#4ade80', emoji: '🌱' };
  }
}

export function DevHud() {
  const performanceMetrics = useGameStore((state) => state.performanceMetrics);
  const performanceConfig = useGameStore((state) => state.performanceConfig);
  const setPerformanceConfig = useGameStore((state) => state.setPerformanceConfig);
  const tick = useGameStore((state) => state.tick);
  const commanders = useGameStore((state) => state.commanders);
  const territories = useGameStore((state) => state.territories);
  const eventLog = useGameStore((state) => state.eventLog);
  const isEndgameMode = useGameStore((state) => state.isEndgameMode);
  const [show, setShow] = useState(false);
  const [memoryUsage, setMemoryUsage] = useState(0);

  // 计算活跃指挥官数量（移到顶层）
  const activeCommanders = useMemo(
    () => commanders.filter((c) => c.status === 'active').length,
    [commanders]
  );

  // Feature: 009-unification-balance - 游戏阶段（移到顶层）
  const gamePhase = useMemo(
    () => getGamePhase(activeCommanders, isEndgameMode),
    [activeCommanders, isEndgameMode]
  );

  // 计算领先势力信息（移到顶层）
  const leadingFaction = useMemo(() => {
    const active = commanders.filter((c) => c.status === 'active');
    if (active.length === 0) return null;
    
    const sorted = [...active].sort(
      (a, b) => b.controlledTerritories.length - a.controlledTerritories.length
    );
    const leader = sorted[0];
    const totalTerritories = territories.length || 1;
    const ratio = (leader.controlledTerritories.length / totalTerritories) * 100;
    
    return {
      name: leader.name,
      territories: leader.controlledTerritories.length,
      ratio: ratio.toFixed(1),
    };
  }, [commanders, territories]);

  // 定期更新内存使用
  useEffect(() => {
    const updateMemory = () => {
      // @ts-ignore - performance.memory is Chrome-specific
      if (typeof performance !== 'undefined' && performance.memory) {
        // @ts-ignore
        setMemoryUsage(performance.memory.usedJSHeapSize / (1024 * 1024));
      }
    };

    updateMemory();
    const interval = setInterval(updateMemory, 2000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === '`') {
        setShow((prev) => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, []);

  const toggleAnimations = useCallback(() => {
    setPerformanceConfig({ enableAnimations: !performanceConfig.enableAnimations });
  }, [performanceConfig.enableAnimations, setPerformanceConfig]);

  const toggleAutoDegrade = useCallback(() => {
    setPerformanceConfig({ autoDegrade: !performanceConfig.autoDegrade });
  }, [performanceConfig.autoDegrade, setPerformanceConfig]);

  if (!show) {
    return (
      <div className="dev-hud-toggle" onClick={() => setShow(true)}>
        📊
      </div>
    );
  }

  // FPS 状态颜色
  const fpsColor =
    performanceMetrics.fps >= 30 ? '#4ade80' : performanceMetrics.fps >= 15 ? '#facc15' : '#ef4444';

  // Tick 耗时状态颜色
  const tickColor =
    performanceMetrics.tickMs < 100
      ? '#4ade80'
      : performanceMetrics.tickMs < 200
        ? '#facc15'
        : '#ef4444';

  return (
    <div className="dev-hud">
      <div className="hud-header">
        <span>开发 HUD</span>
        <button onClick={() => setShow(false)}>×</button>
      </div>

      <div className="hud-content">
        <div className="hud-section">
          <div className="hud-section-title">性能指标</div>

          <div className="hud-row">
            <span className="hud-label">FPS:</span>
            <span className="hud-value" style={{ color: fpsColor }}>
              {performanceMetrics.fps.toFixed(1)}
            </span>
          </div>

          <div className="hud-row">
            <span className="hud-label">Tick 耗时:</span>
            <span className="hud-value" style={{ color: tickColor }}>
              {performanceMetrics.tickMs.toFixed(2)}ms
            </span>
          </div>

          <div className="hud-row">
            <span className="hud-label">渲染时间:</span>
            <span className="hud-value">{(performanceMetrics.renderMs || 0).toFixed(2)}ms</span>
          </div>

          <div className="hud-row">
            <span className="hud-label">内存使用:</span>
            <span className="hud-value">{memoryUsage.toFixed(1)} MB</span>
          </div>
        </div>

        <div className="hud-section">
          <div className="hud-section-title">游戏状态</div>

          <div className="hud-row">
            <span className="hud-label">游戏阶段:</span>
            <span className="hud-value" style={{ color: gamePhase.color }} data-testid="game-phase-indicator">
              {gamePhase.emoji} {gamePhase.phase}
            </span>
          </div>

          <div className="hud-row">
            <span className="hud-label">Tick:</span>
            <span className="hud-value">{tick}</span>
          </div>

          <div className="hud-row">
            <span className="hud-label">活跃指挥官:</span>
            <span className="hud-value">{activeCommanders}</span>
          </div>

          <div className="hud-row">
            <span className="hud-label">事件数:</span>
            <span className="hud-value">{eventLog.length}</span>
          </div>

          {leadingFaction && (
            <div className="hud-row">
              <span className="hud-label">领先势力:</span>
              <span className="hud-value">
                {leadingFaction.name} ({leadingFaction.ratio}%)
              </span>
            </div>
          )}

          {isEndgameMode && (
            <div className="hud-row">
              <span className="hud-label">决战模式:</span>
              <span className="hud-value" style={{ color: '#ef4444' }}>⚔️ 已激活</span>
            </div>
          )}
        </div>

        <div className="hud-section">
          <div className="hud-section-title">性能模式</div>

          <div className="hud-row hud-toggle-row">
            <span className="hud-label">动画效果:</span>
            <button
              className={`hud-toggle ${performanceConfig.enableAnimations ? 'active' : ''}`}
              onClick={toggleAnimations}
            >
              {performanceConfig.enableAnimations ? '开' : '关'}
            </button>
          </div>

          <div className="hud-row hud-toggle-row">
            <span className="hud-label">自动降级:</span>
            <button
              className={`hud-toggle ${performanceConfig.autoDegrade ? 'active' : ''}`}
              onClick={toggleAutoDegrade}
            >
              {performanceConfig.autoDegrade ? '开' : '关'}
            </button>
          </div>
        </div>
      </div>

      <div className="hud-footer">按 ` 键切换</div>
    </div>
  );
}

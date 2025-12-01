import { useState } from 'react';
import { startSession } from '@core/session/startSession';
import './StartScreen.css';

export function StartScreen() {
  const [loading, setLoading] = useState(false);

  const handleStart = () => {
    setLoading(true);
    setTimeout(() => {
      startSession();
      setLoading(false);
    }, 500);
  };

  return (
    <div className="start-screen">
      <div className="start-content">
        <h1 className="title">历史征服模拟器</h1>
        <p className="subtitle">见证历史人物争霸世界</p>

        <div className="start-form">
          <button className="start-button" onClick={handleStart} disabled={loading}>
            {loading ? '准备战局...' : '开始征服'}
          </button>
        </div>

        <div className="features">
          <div className="feature-item">
            <span className="feature-icon">🌍</span>
            <span className="feature-text">交互式世界地图</span>
          </div>
          <div className="feature-item">
            <span className="feature-icon">⚔️</span>
            <span className="feature-text">50+ 历史人物</span>
          </div>
          <div className="feature-item">
            <span className="feature-icon">🎮</span>
            <span className="feature-text">实时策略模拟</span>
          </div>
        </div>
      </div>
    </div>
  );
}

import { useEffect, useRef } from 'react';
import Phaser from 'phaser';
import { BootScene } from './scenes/boot/BootScene';
import { WorldScene } from './scenes/world/WorldScene';
import { StartScreen } from './ui/screens/StartScreen';
import { CommanderPanel } from './ui/panels/CommanderPanel';
import { BattleTimeline } from './ui/panels/BattleTimeline';
import { CountryDetailPanel } from './ui/panels/CountryDetailPanel';
import { FactionStatsPanel } from './ui/panels/FactionStatsPanel';
import { VictoryModal } from './ui/modals/VictoryModal';
import { DevHud } from './ui/hud/DevHud';
import { useGameStore } from './core/state/store';
import { factionStatsService } from './core/services/factionStatsService';

export function App() {
  const gameRef = useRef<Phaser.Game | null>(null);
  const gameStarted = useGameStore((state) => state.gameStarted);

  // 启动和停止势力统计服务
  useEffect(() => {
    if (gameStarted) {
      factionStatsService.start();
      return () => {
        factionStatsService.stop();
      };
    }
  }, [gameStarted]);

  // 键盘快捷键：按 'S' 或 's' 切换统计面板
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === 's' || e.key === 'S') {
        useGameStore.getState().toggleFactionStatsPanel();
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => {
      window.removeEventListener('keydown', handleKeyPress);
    };
  }, []);

  useEffect(() => {
    if (!gameRef.current && gameStarted) {
      const config: Phaser.Types.Core.GameConfig = {
        type: Phaser.AUTO,
        width: window.innerWidth,
        height: window.innerHeight,
        parent: 'phaser-container',
        backgroundColor: '#1a1a2e',
        scene: [BootScene, WorldScene],
        scale: {
          mode: Phaser.Scale.RESIZE,
          autoCenter: Phaser.Scale.CENTER_BOTH,
        },
        render: {
          antialias: true,
          pixelArt: false,
        },
      };

      gameRef.current = new Phaser.Game(config);

      // 更新 FPS 指标
      const fpsInterval = setInterval(() => {
        if (gameRef.current) {
          const fps = gameRef.current.loop.actualFps;
          useGameStore.getState().updatePerformance({ fps });
        }
      }, 1000);

      return () => {
        clearInterval(fpsInterval);
        if (gameRef.current) {
          gameRef.current.destroy(true);
          gameRef.current = null;
        }
      };
    }
  }, [gameStarted]);

  return (
    <div className="app-container">
      {!gameStarted && <StartScreen />}
      <div id="phaser-container" style={{ display: gameStarted ? 'block' : 'none' }} />

      {gameStarted && (
        <>
          <CommanderPanel />
          <BattleTimeline />
          <CountryDetailPanel />
          <FactionStatsPanel />
          <VictoryModal />
          <DevHud />
        </>
      )}
    </div>
  );
}

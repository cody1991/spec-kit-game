import { useEffect, useRef } from 'react';
import Phaser from 'phaser';
import { BootScene } from './scenes/boot/BootScene';
import { WorldScene } from './scenes/world/WorldScene';
import { StartScreen } from './ui/screens/StartScreen';
import { CommanderPanel } from './ui/panels/CommanderPanel';
import { BattleTimeline } from './ui/panels/BattleTimeline';
import { VictoryModal } from './ui/modals/VictoryModal';
import { DevHud } from './ui/hud/DevHud';
import { useGameStore } from './core/state/store';

export function App() {
  const gameRef = useRef<Phaser.Game | null>(null);
  const gameStarted = useGameStore((state) => state.gameStarted);

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
          <VictoryModal />
          <DevHud />
        </>
      )}
    </div>
  );
}

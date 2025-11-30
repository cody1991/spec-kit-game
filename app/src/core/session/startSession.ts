import { useGameStore } from '../state/store';
import { createInitialWorld } from '../generation/createInitialWorld';
import { globalTickScheduler } from '../simulation/tickScheduler';
import { globalEventBus } from '../events/eventTypes';

export function startSession(seed?: string): void {
  const numericSeed = seed ? parseInt(seed, 36) : Math.floor(Math.random() * 1000000);
  const seedString = seed || numericSeed.toString(36);

  // 创建初始世界
  const { commanders, territories } = createInitialWorld({
    seed: numericSeed,
    commanderCount: 10,
  });

  // 更新状态
  const store = useGameStore.getState();
  store.startGame(seedString);
  store.setCommanders(commanders);
  store.setTerritories(territories);

  // 发送游戏开始事件
  store.addBattleEvent({
    id: `start-${Date.now()}`,
    timestamp: new Date().toISOString(),
    type: 'attack', // Using 'attack' as generic event type
    result: 'success',
    delta: {},
    narrative: `战局开始! 种子: ${seedString}`,
    seed: seedString,
  });

  globalEventBus.emit({
    type: 'game:start',
    timestamp: new Date().toISOString(),
    payload: { seed: seedString, commanderCount: commanders.length },
  });

  // 启动模拟
  globalTickScheduler.start();
}

export function pauseSession(): void {
  const store = useGameStore.getState();
  store.setPaused(true);

  globalEventBus.emit({
    type: 'game:pause',
    timestamp: new Date().toISOString(),
    payload: {},
  });
}

export function resumeSession(): void {
  const store = useGameStore.getState();
  store.setPaused(false);

  globalEventBus.emit({
    type: 'game:resume',
    timestamp: new Date().toISOString(),
    payload: {},
  });
}

export function restartSession(): void {
  globalTickScheduler.stop();

  const store = useGameStore.getState();
  store.resetGame();

  // Wait a bit before starting new session
  setTimeout(() => {
    startSession();
  }, 100);
}

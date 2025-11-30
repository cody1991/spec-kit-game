import { useGameStore } from '../state/store';
import { createInitialWorld } from '../generation/createInitialWorld';
import { globalTickScheduler } from '../simulation/tickScheduler';
import { globalEventBus } from '../events/eventTypes';
import { commandersPool } from '../../data/commandersData';
import type { CommanderColor } from '../types';

export function startSession(seed?: string): void {
  const numericSeed = seed ? parseInt(seed, 36) : Math.floor(Math.random() * 1000000);
  const seedString = seed || numericSeed.toString(36);

  // 创建初始世界
  const { commanders, territories } = createInitialWorld({
    seed: numericSeed,
    commanderCount: 30, // 增加到 30 个指挥官，史诗级战斗！
  });

  // 创建颜色映射
  const colorMappings = new Map<string, CommanderColor>();
  commanders.forEach((commander) => {
    // Find the commander template with color mapping
    const template = commandersPool.find((t) => t.name === commander.name);
    if (template?.colorMapping) {
      colorMappings.set(commander.id, {
        commanderId: commander.id,
        primary: template.colorMapping.primary,
        secondary: template.colorMapping.secondary,
        alpha: template.colorMapping.alpha,
        pattern: template.colorMapping.pattern,
        label: template.colorMapping.label,
        glowColor: template.colorMapping.glowColor,
        pulseSpeed: template.colorMapping.pulseSpeed,
      });
    } else {
      // Fallback: generate color from hash if no mapping exists
      const hash = commander.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
      const hue = (hash * 137.508) % 360; // Golden angle
      const rgb = Phaser.Display.Color.HSVToRGB(hue / 360, 0.7, 0.9);
      colorMappings.set(commander.id, {
        commanderId: commander.id,
        primary: rgb.color,
        secondary: rgb.color,
        alpha: 0.7,
      });
    }
  });

  // 初始化领土状态（用于新地图系统）
  // Note: This will be populated with actual country data once map is loaded
  // For now, we create empty states that will be populated by territory updates
  const territoryStates = new Map();
  territories.forEach((territory) => {
    if (territory.ownerId) {
      territoryStates.set(territory.id, {
        countryId: territory.id,
        ownerId: territory.ownerId,
        troops: territory.garrison,
        resources: 0,
        defense: territory.stability || 50,
        updatedAt: Date.now(),
        conqueredAt: Date.now(),
        previousOwnerId: null,
        transitionProgress: null,
        isHighlighted: false,
      });
    }
  });

  // 更新状态
  const store = useGameStore.getState();
  store.startGame(seedString);
  store.setCommanders(commanders);
  store.setTerritories(territories);
  store.setColorMappings(colorMappings);
  store.setTerritoryStates(territoryStates);

  console.log(`✅ Initialized ${colorMappings.size} commander color mappings`);
  console.log(`✅ Initialized ${territoryStates.size} territory states`);

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

import { useGameStore } from '../state/store';
import { createInitialWorld } from '../generation/createInitialWorld';
import { globalTickScheduler } from '../simulation/tickScheduler';
import { globalEventBus } from '../events/eventTypes';
import { commandersPool } from '../../data/commandersData';
import type { CommanderColor, Country } from '../types';

/**
 * 启动游戏会话
 * 
 * 注意：现在需要等待地图数据加载完成后才能初始化游戏世界。
 * 如果地图数据未准备好，将推迟初始化直到数据可用。
 */
export function startSession(seed?: string, countries?: Country[]): void {
  const numericSeed = seed ? parseInt(seed, 36) : Math.floor(Math.random() * 1000000);
  const seedString = seed || numericSeed.toString(36);

  // 检查是否提供了国家数据
  if (!countries || countries.length === 0) {
    // 保存seed到store，等待地图加载完成后再初始化
    const store = useGameStore.getState();
    store.startGame(seedString);
    
    // 发送游戏准备事件（但还未完全初始化）
    globalEventBus.emit({
      type: 'game:start',
      timestamp: new Date().toISOString(),
      payload: { seed: seedString, status: 'pending-map-data' },
    });
    
    return;
  }

  // 创建初始世界（现在基于真实国家数据）
  const { commanders, territories } = createInitialWorld({
    seed: numericSeed,
    commanderCount: 30, // 增加到 30 个指挥官，史诗级战斗！
    countries,
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

  // 初始化领土状态（现在Territory.id直接是国家ID）
  const territoryStates = new Map();
  territories.forEach((territory) => {
    if (territory.ownerId) {
      const country = countries.find(c => c.id === territory.id);
      territoryStates.set(territory.id, {
        countryId: territory.id, // 现在是真实的国家ID（如'840'）
        countryName: country?.name || territory.name, // 使用真实国家名称
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
  store.setCountries(countries); // 🔧 关键：设置国家数据到store
  store.setColorMappings(colorMappings);
  store.setTerritoryStates(territoryStates);

  console.log('✅ Game session started');

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

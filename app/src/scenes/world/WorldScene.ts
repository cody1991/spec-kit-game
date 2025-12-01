import Phaser from 'phaser';
import { useGameStore } from '@core/state/store';
import type { Territory, HistoricalCommander, TerritoryState } from '@core/types';
import { MapDataLoader } from './data/MapDataLoader';
import { MapRenderer } from './rendering/MapRenderer';
import { PerformanceMonitor } from './utils/PerformanceMonitor';
import type { Country } from './types/mapTypes';
import { startSession } from '@core/session/startSession';
import { logger } from '@/config/debug.config';

export class WorldScene extends Phaser.Scene {
  private territoriesGroup!: Phaser.GameObjects.Group;
  private commandersGroup!: Phaser.GameObjects.Group;
  private cameraController!: CameraController;
  private mapDataLoader!: MapDataLoader;
  private mapRenderer!: MapRenderer;
  private performanceMonitor!: PerformanceMonitor;
  private countries: Country[] = [];
  private territorySubscription?: () => void;
  private lastRenderTime: number = 0;
  private renderThrottleMs: number = 16; // 默认 ~60fps

  constructor() {
    super({ key: 'WorldScene' });
  }

  preload(): void {
    // Initialize map data loader
    this.mapDataLoader = new MapDataLoader();

    // Start async loading (will complete in create() or later)
    this.loadMapDataAsync();
  }

  /**
   * Async helper to load map data
   * Called from preload(), completes in create() phase
   */
  private async loadMapDataAsync(): Promise<void> {
    try {
      // Load map data with caching
      const basePath = import.meta.env.BASE_URL || '/';
      this.countries = await this.mapDataLoader.loadMapData(
        `${basePath}maps/world-countries.json`,
        {
          enableCache: true,
          cacheDuration: 7,
          useWorker: false, // Disable for now, can enable later
          timeout: 10000,
        }
      );

      // Store in Phaser registry for renderer access
      this.registry.set('countries', this.countries);

      logger.log('MAP_LOADING', `✅ Loaded ${this.countries.length} countries`);

      // 🔑 关键：地图加载完成后，检查游戏是否已启动但缺少国家数据
      this.initializeGameWorldIfNeeded();

      // Trigger initialization if create() already ran
      if (this.scene.isActive()) {
        this.initializeMapRenderer();
        this.renderWorld();
      }
    } catch (error) {
      logger.error('❌ Failed to load map data:', error);

      // Try fallback to simplified map
      try {
        const basePath = import.meta.env.BASE_URL || '/';
        this.countries = await this.mapDataLoader.loadMapData(
          `${basePath}maps/world-countries-simplified.json`,
          {
            enableCache: false,
            timeout: 5000,
          }
        );

        this.registry.set('countries', this.countries);
        logger.log(
          'MAP_LOADING',
          `✅ Loaded simplified map with ${this.countries.length} countries`
        );

        // 初始化游戏世界（如果需要）
        this.initializeGameWorldIfNeeded();

        // Trigger initialization
        if (this.scene.isActive()) {
          this.initializeMapRenderer();
          this.renderWorld();
        }
      } catch (fallbackError) {
        logger.error('❌ Fallback map load also failed:', fallbackError);
        // Continue with empty map - old territory system will be used
      }
    }
  }

  create(): void {
    logger.log('MAP_RENDERER_INIT', '🎬 WorldScene.create() called');

    this.territoriesGroup = this.add.group();
    this.commandersGroup = this.add.group();

    // Initialize performance monitor
    this.performanceMonitor = new PerformanceMonitor(60);

    // Set up camera bounds for world map
    const camera = this.cameras.main;
    // Set larger world bounds to allow panning around the map
    camera.setBounds(-2000, -1500, 6000, 4500);
    // Start camera at (0, 0) to show the center of the map
    camera.setScroll(0, 0);
    camera.setZoom(1);

    logger.log('MAP_RENDERER_INIT', '📷 Camera initialized');

    // Wait for map data to load (async operation from preload)
    // Check periodically until countries are loaded
    const checkInterval = 100; // Check every 100ms
    const maxWaitTime = 5000; // Max wait 5 seconds
    let elapsedTime = 0;

    const waitForMapData = () => {
      elapsedTime += checkInterval;

      if (this.countries.length > 0) {
        logger.log(
          'MAP_LOADING',
          `✅ Map data ready (waited ${elapsedTime}ms), initializing renderer...`
        );
        this.initializeMapRenderer();
        this.initializeCameraController();
        this.verifyTerritoryStatesComplete();
        this.setupTerritorySubscription();
        this.setupStateSubscription();
        this.renderWorld();
        this.events.on('postupdate', this.onUpdate, this);
      } else if (elapsedTime < maxWaitTime) {
        logger.log('MAP_LOADING', `⏳ Waiting for map data... (${elapsedTime}ms)`);
        this.time.delayedCall(checkInterval, waitForMapData);
      } else {
        logger.warn('WARNINGS', '⚠️  Map data not loaded after 5s, falling back to old system');
        this.initializeCameraController();
        this.verifyTerritoryStatesComplete();
        this.setupTerritorySubscription();
        this.setupStateSubscription();
        this.renderWorld();
        this.events.on('postupdate', this.onUpdate, this);
      }
    };

    // Start waiting
    this.time.delayedCall(checkInterval, waitForMapData);
  }

  private initializeCameraController(): void {
    // 初始化相机控制
    this.cameraController = new CameraController(this);
  }

  /**
   * 检查游戏是否需要初始化世界数据
   *
   * 当地图数据加载完成后调用。如果游戏已通过StartScreen启动但缺少国家数据，
   * 此方法将使用真实国家数据重新初始化游戏世界。
   */
  private initializeGameWorldIfNeeded(): void {
    const store = useGameStore.getState();
    const { gameStarted, seed, commanders, territories } = store;

    // 检查是否需要初始化：游戏已启动但指挥官/领土为空或使用旧区域系统
    const needsInit =
      gameStarted &&
      this.countries.length > 0 &&
      (commanders.length === 0 ||
        territories.length === 0 ||
        this.isUsingOldRegionSystem(territories));

    if (needsInit) {
      logger.log('GAME_SESSION', '🔄 Reinitializing game world with country data...');

      // 使用真实国家数据重新启动会话
      startSession(seed, this.countries);

      logger.log('GAME_SESSION', '✅ Game world reinitialized with country-based territories');
    }
  }

  /**
   * 检测是否仍在使用旧的区域系统
   *
   * 通过检查territory ID是否为旧的区域ID（如'western-europe'）来判断
   */
  private isUsingOldRegionSystem(territories: Territory[]): boolean {
    if (territories.length === 0) return false;

    // 旧系统使用如'western-europe'这样的ID，新系统使用ISO数字码如'840'
    const sampleId = territories[0].id;
    const isOldSystem = sampleId.includes('-') || isNaN(Number(sampleId));

    return isOldSystem;
  }

  private setupStateSubscription(): void {
    // 在实际应用中，这里应该订阅 Zustand store 的变化
    // 由于 Phaser 场景的生命周期，我们在 update 中轮询状态
  }

  private initializeMapRenderer(): void {
    try {
      logger.log('MAP_RENDERER_INIT', '🎨 Initializing MapRenderer...');
      this.mapRenderer = new MapRenderer();
      this.mapRenderer.initialize(this, {
        useWebGL: true,
        fillAlpha: 0.7,
        enableTransition: true,
        transitionDuration: 500,
        useObjectPool: true,
        poolSize: 200,
      });

      logger.log('MAP_RENDERER_INIT', '✅ MapRenderer initialized successfully');

      // Map countries to commanders
      this.mapCountriesToCommanders();
    } catch (error) {
      logger.error('❌ Failed to initialize MapRenderer:', error);
      this.mapRenderer = null as any;
    }
  }

  /**
   * 同步地图国家与指挥官占领状态
   *
   * 现在commanders.controlledTerritories直接包含国家ID，不再需要区域映射。
   * 此方法仅用于确保territoryStates与实际占领情况同步。
   *
   * @performance
   * - Target: < 10ms for 200 countries（比之前更快，因为不需要区域映射）
   * - Uses Map data structure for O(1) lookups
   * - 复用已存在的 Map 对象，减少 GC 压力
   */
  private mapCountriesToCommanders(): void {
    performance.mark('mapping-start');

    const state = useGameStore.getState();
    const { commanders, territories } = state;

    logger.log('MAP_LOADING', '🔍 Syncing country ownership from game state...');

    // 复用已存在的 Map 或创建新的
    const territoryStates = new Map<string, TerritoryState>();

    // 使用 for 循环代替 forEach 以提高性能
    for (let i = 0; i < territories.length; i++) {
      const territory = territories[i];
      if (territory.ownerId) {
        const country = this.countries.find((c) => c.id === territory.id);

        territoryStates.set(territory.id, {
          countryId: territory.id,
          countryName: country?.name || territory.name,
          ownerId: territory.ownerId,
          troops: territory.garrison,
          resources: 0,
          defense: territory.stability,
          updatedAt: Date.now(),
          conqueredAt: Date.now(),
          previousOwnerId: null,
          transitionProgress: null,
          isHighlighted: false,
        });
      }
    }

    // 更新store中的territoryStates（确保地图渲染层有正确数据）
    state.setTerritoryStates(territoryStates);

    performance.mark('mapping-end');
    performance.measure('mapping-duration', 'mapping-start', 'mapping-end');
    const duration = performance.getEntriesByName('mapping-duration')[0]?.duration || 0;

    logger.log(
      'MAP_LOADING',
      `🗺️  Synced ${territoryStates.size} countries with ${commanders.length} commanders in ${duration.toFixed(2)}ms`
    );
  }

  /**
   * Verify that all countries have corresponding TerritoryState entries
   * Creates default states for any missing territories
   */
  private verifyTerritoryStatesComplete(): void {
    const state = useGameStore.getState();
    const missingStates: string[] = [];

    state.countries.forEach((country) => {
      if (!state.territoryStates.has(country.id)) {
        missingStates.push(country.id);

        // Create default state
        const defaultState: TerritoryState = {
          countryId: country.id,
          countryName: country.name,
          ownerId: null,
          troops: 0,
          resources: 0,
          defense: 50,
          updatedAt: Date.now(),
          conqueredAt: null,
          previousOwnerId: null,
          transitionProgress: null,
          isHighlighted: false,
        };

        const newStates = new Map(state.territoryStates);
        newStates.set(country.id, defaultState);
        state.setTerritoryStates(newStates);
      }
    });

    if (missingStates.length > 0) {
      logger.warn(
        'WARNINGS',
        `⚠️  [WorldScene] Created default states for ${missingStates.length} territories`
      );
    } else {
      logger.log('MAP_LOADING', '✅ [WorldScene] All territory states initialized');
    }
  }

  /**
   * Setup subscription to territoryStates changes
   * Triggers map updates when territory ownership changes
   *
   * @performance
   * - 使用浅比较优化，只在实际变化时触发更新
   * - 节流订阅回调，延迟处理而不是丢弃更新
   */
  private setupTerritorySubscription(): void {
    const state = useGameStore.getState();
    let previousSize = state.territoryStates.size;
    let pendingUpdate = false;
    let throttleTimer: ReturnType<typeof setTimeout> | null = null;
    const SUBSCRIPTION_THROTTLE_MS = 100; // 最多每100ms处理一次

    logger.log(
      'SUBSCRIPTION',
      `🔔 [WorldScene] Setting up subscription with ${previousSize} initial states`
    );

    const processUpdate = () => {
      pendingUpdate = false;
      throttleTimer = null;
      // 触发渲染
      this.renderWorld();
    };

    // Subscribe to all state changes with optimized comparison
    this.territorySubscription = useGameStore.subscribe((newState) => {
      const newStates = newState.territoryStates;
      const newSize = newStates.size;
      const dirtyTerritories = newState.dirtyFlags.territories;

      // 快速检查：如果没有脏领土且大小相同，跳过
      if (
        dirtyTerritories.size === 0 &&
        newSize === previousSize &&
        !newState.dirtyFlags.fullRedraw
      ) {
        return;
      }

      previousSize = newSize;

      // 标记有待处理的更新
      if (dirtyTerritories.size > 0 || newState.dirtyFlags.fullRedraw) {
        logger.log(
          'SUBSCRIPTION',
          `🔔 [WorldScene] ${dirtyTerritories.size} dirty territories detected`
        );

        // 如果没有待处理的定时器，立即设置一个
        if (!throttleTimer) {
          if (!pendingUpdate) {
            // 首次更新立即执行
            pendingUpdate = true;
            processUpdate();
          }
          // 设置节流定时器，确保后续更新不会太频繁
          throttleTimer = setTimeout(() => {
            if (pendingUpdate) {
              processUpdate();
            } else {
              throttleTimer = null;
            }
          }, SUBSCRIPTION_THROTTLE_MS);
        } else {
          // 已有定时器，标记待处理
          pendingUpdate = true;
        }
      }
    });

    logger.log('SUBSCRIPTION', '✅ [WorldScene] Territory subscription active');
  }

  /**
   * Handle territory ownership change
   * Updates map rendering with new color
   */
  private handleTerritoryOwnershipChange(territoryId: string, newState: TerritoryState): void {
    if (!this.mapRenderer) return;

    const state = useGameStore.getState();
    const colorMapping = newState.ownerId ? state.colorMappings.get(newState.ownerId) : null;

    if (colorMapping) {
      this.mapRenderer.updateCountry(territoryId, newState, colorMapping);
      logger.log(
        'TERRITORY_OWNERSHIP',
        `🎨 [WorldScene] Map updated: ${territoryId} → ${newState.ownerId}`
      );
    } else if (newState.ownerId) {
      logger.warn(
        'WARNINGS',
        `⚠️  [WorldScene] Missing color mapping for commander: ${newState.ownerId}`
      );
      // Use default gray color
      this.mapRenderer.updateCountry(territoryId, newState, {
        commanderId: newState.ownerId,
        primary: 0x808080,
        secondary: 0x606060,
        alpha: 0.7,
      });
    } else {
      // Territory became neutral (ownerId is null)
      this.mapRenderer.updateCountry(territoryId, newState, {
        commanderId: '',
        primary: 0x444444,
        secondary: 0x333333,
        alpha: 0.5,
      });
    }
  }

  /**
   * 渲染世界地图
   *
   * @performance
   * - 使用脏标记进行增量渲染
   * - 渲染节流避免过于频繁的重绘
   */
  private renderWorld(): void {
    const state = useGameStore.getState();
    const {
      territories,
      commanders,
      territoryStates,
      colorMappings,
      dirtyFlags,
      performanceConfig,
    } = state;

    // 检查是否需要渲染（节流）
    const now = performance.now();
    if (now - this.lastRenderTime < this.renderThrottleMs && !dirtyFlags.fullRedraw) {
      return;
    }
    this.lastRenderTime = now;

    // Use new map renderer if available
    if (this.mapRenderer && this.countries.length > 0 && territoryStates.size > 0) {
      this.performanceMonitor.startMeasure('mapRender');

      // 如果启用增量渲染且不需要全量重绘，只渲染脏区域
      const shouldIncrementalRender =
        performanceConfig.enableIncrementalRender &&
        !dirtyFlags.fullRedraw &&
        dirtyFlags.territories.size > 0;

      const stats = this.mapRenderer.render(
        this.countries,
        territoryStates,
        colorMappings,
        commanders,
        shouldIncrementalRender ? dirtyFlags.territories : undefined
      );

      this.performanceMonitor.endMeasure('mapRender');

      // 清除脏标记
      state.clearDirtyFlags();

      // Update performance metrics
      useGameStore.getState().updatePerformance({
        fps: this.performanceMonitor.getAverageFps(),
        tickMs: stats.renderTime,
        renderMs: stats.renderTime,
      });

      return;
    }

    // Fallback to old rendering system
    // 清空现有对象
    this.territoriesGroup.clear(true, true);
    this.commandersGroup.clear(true, true);

    // 渲染领土
    territories.forEach((territory) => {
      this.renderTerritory(territory);
    });

    // 渲染指挥官标记 (清除之前的标记)
    this.commandersGroup.clear(true, true);
    commanders
      .filter((c) => c.status === 'active')
      .forEach((commander) => {
        this.renderCommander(commander, territories);
      });
  }

  private renderTerritory(territory: Territory): void {
    const polygon = new Phaser.GameObjects.Polygon(
      this,
      0,
      0,
      territory.polygon.flat(),
      this.getTerritoryColor(territory),
      0.7
    );
    polygon.setStrokeStyle(2, 0xffffff, 0.5);
    polygon.setInteractive(
      new Phaser.Geom.Polygon(territory.polygon.flat()),
      Phaser.Geom.Polygon.Contains
    );

    polygon.on('pointerdown', () => {
      useGameStore.getState().selectTerritory(territory.id);
    });

    polygon.on('pointerover', () => {
      polygon.setFillStyle(this.getTerritoryColor(territory), 1);
    });

    polygon.on('pointerout', () => {
      polygon.setFillStyle(this.getTerritoryColor(territory), 0.7);
    });

    this.territoriesGroup.add(polygon);

    // 添加领土名称
    const center = this.getPolygonCenter(territory.polygon);
    const text = this.add.text(center[0], center[1], territory.name, {
      fontSize: '12px',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 2,
    });
    text.setOrigin(0.5);
    this.territoriesGroup.add(text);
  }

  private renderCommander(commander: HistoricalCommander, territories: Territory[]): void {
    if (commander.controlledTerritories.length === 0) return;

    // NEW: Use new map system if available
    if (this.countries.length > 0) {
      const state = useGameStore.getState();

      // Find all countries currently owned by this commander based on TerritoryState (Country.id)
      const ownedCountryIds: string[] = [];
      state.territoryStates.forEach((territoryState, countryId) => {
        if (territoryState.ownerId === commander.id) {
          ownedCountryIds.push(countryId);
        }
      });

      const controlledCountries = this.countries.filter((country) =>
        ownedCountryIds.includes(country.id)
      );

      if (controlledCountries.length === 0) return;

      // Use the first country's centroid as commander position
      const firstCountry = controlledCountries[0];
      const { centroid } = firstCountry;

      // Transform geographic coordinates to screen coordinates
      if (!this.mapRenderer) return;
      const transformer = (this.mapRenderer as any).transformer;
      if (!transformer) return;

      // centroid uses x=lon, y=lat
      const screenPos = transformer.geoToScreen(centroid.x, centroid.y);

      // Get commander color
      const colorMapping = state.colorMappings.get(commander.id);
      const color = colorMapping ? colorMapping.primary : 0xff0000;

      // 指挥官标记 (圆形 + 国旗图标)
      const circle = this.add.circle(screenPos.x, screenPos.y, 12, color, 1);
      circle.setStrokeStyle(2, 0xffffff);
      circle.setInteractive();

      circle.on('pointerdown', () => {
        useGameStore.getState().selectCommander(commander.id);
      });

      this.commandersGroup.add(circle);

      // 指挥官名称
      const nameText = this.add.text(screenPos.x, screenPos.y - 20, commander.name, {
        fontSize: '14px',
        color: '#ffff00',
        stroke: '#000000',
        strokeThickness: 3,
        fontStyle: 'bold',
      });
      nameText.setOrigin(0.5);
      this.commandersGroup.add(nameText);

      return;
    }

    // FALLBACK: Use old territory system
    const firstTerritory = territories.find((t) => t.id === commander.controlledTerritories[0]);
    if (!firstTerritory) return;

    const center = this.getPolygonCenter(firstTerritory.polygon);

    // 指挥官标记
    const circle = this.add.circle(center[0], center[1], 12, 0xff0000, 1);
    circle.setStrokeStyle(2, 0xffffff);
    circle.setInteractive();

    circle.on('pointerdown', () => {
      useGameStore.getState().selectCommander(commander.id);
    });

    this.commandersGroup.add(circle);

    // 指挥官名称
    const nameText = this.add.text(center[0], center[1] - 20, commander.name, {
      fontSize: '14px',
      color: '#ffff00',
      stroke: '#000000',
      strokeThickness: 3,
      fontStyle: 'bold',
    });
    nameText.setOrigin(0.5);
    this.commandersGroup.add(nameText);
  }

  private getTerritoryColor(territory: Territory): number {
    if (!territory.ownerId) {
      return 0x444444; // Neutral
    }

    // 根据 ownerId 生成颜色
    const hash = territory.ownerId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const hue = (hash * 137.508) % 360; // Golden angle
    return Phaser.Display.Color.HSVToRGB(hue / 360, 0.7, 0.9).color;
  }

  private getPolygonCenter(polygon: number[][]): [number, number] {
    const sumX = polygon.reduce((sum, point) => sum + point[0], 0);
    const sumY = polygon.reduce((sum, point) => sum + point[1], 0);
    return [sumX / polygon.length, sumY / polygon.length];
  }

  private onUpdate(): void {
    // Update performance monitor
    const delta = this.game.loop.delta;
    this.performanceMonitor.updateFps(delta);

    // Update color transitions in map renderer
    if (this.mapRenderer) {
      this.mapRenderer.updateTransitions(delta);
    }

    // Access game state (for tick-based rendering)
    const state = useGameStore.getState();
    const { performanceConfig } = state;

    // 根据配置的间隔重新渲染地图
    if (state.tick % performanceConfig.mapRedrawInterval === 0) {
      // 标记需要全量重绘
      state.markFullRedraw();
      this.renderWorld();
    }

    // Check performance and adjust settings
    const fps = this.performanceMonitor.getAverageFps();

    // 自动降级：低FPS时禁用动画
    if (performanceConfig.autoDegrade && fps < performanceConfig.lowFpsThreshold) {
      if (this.mapRenderer) {
        this.mapRenderer.setEnableAnimation(false);
      }
      // 增加渲染节流间隔
      this.renderThrottleMs = 33; // ~30fps

      // 更新配置
      if (state.performanceConfig.enableAnimations) {
        state.setPerformanceConfig({ enableAnimations: false });
        logger.log('PERFORMANCE', `⚠️  Low FPS (${fps.toFixed(1)}), disabling animations`);
      }
    }
  }

  cleanup(): void {
    this.events.off('postupdate', this.onUpdate, this);

    // Cleanup subscription to prevent memory leaks
    if (this.territorySubscription) {
      this.territorySubscription();
      this.territorySubscription = undefined;
      logger.log('MAP_RENDERER_INIT', '✅ [WorldScene] Territory subscription cleaned up');
    }

    if (this.mapRenderer) {
      this.mapRenderer.destroy();
    }
  }
}

class CameraController {
  private scene: Phaser.Scene;
  private isDragging = false;
  private lastPointerX = 0;
  private lastPointerY = 0;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.setupControls();
  }

  private setupControls(): void {
    const camera = this.scene.cameras.main;

    // 左键或右键都可以拖拽地图
    this.scene.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      // 允许左键和右键拖拽
      if (pointer.leftButtonDown() || pointer.rightButtonDown()) {
        this.isDragging = true;
        this.lastPointerX = pointer.x;
        this.lastPointerY = pointer.y;

        // 改变鼠标样式
        this.scene.game.canvas.style.cursor = 'grabbing';
      }
    });

    this.scene.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
      if (this.isDragging) {
        const deltaX = pointer.x - this.lastPointerX;
        const deltaY = pointer.y - this.lastPointerY;

        // 直接移动相机，使用更平滑的拖拽
        camera.scrollX -= deltaX / camera.zoom;
        camera.scrollY -= deltaY / camera.zoom;

        this.lastPointerX = pointer.x;
        this.lastPointerY = pointer.y;
      } else {
        // 鼠标悬停时显示可拖拽提示
        this.scene.game.canvas.style.cursor = 'grab';
      }
    });

    this.scene.input.on('pointerup', () => {
      if (this.isDragging) {
        this.isDragging = false;
        this.scene.game.canvas.style.cursor = 'grab';
      }
    });

    // 滚轮缩放 - 扩大缩放范围，允许更小的缩放以查看完整地图
    this.scene.input.on(
      'wheel',
      (pointer: Phaser.Input.Pointer, _gameObjects: unknown[], _deltaX: number, deltaY: number) => {
        // 计算缩放因子
        const zoomFactor = deltaY > 0 ? 0.9 : 1.1;
        // 扩大缩放范围: 0.3 (完整世界地图) 到 3.0 (区域细节)
        const newZoom = Phaser.Math.Clamp(camera.zoom * zoomFactor, 0.3, 3.0);

        // 以鼠标位置为中心进行缩放
        const worldPoint = camera.getWorldPoint(pointer.x, pointer.y);
        camera.setZoom(newZoom);

        // 调整相机位置，使缩放中心保持在鼠标位置
        const newWorldPoint = camera.getWorldPoint(pointer.x, pointer.y);
        camera.scrollX += worldPoint.x - newWorldPoint.x;
        camera.scrollY += worldPoint.y - newWorldPoint.y;

        console.log(`🔍 Zoom: ${newZoom.toFixed(2)}x`);
      }
    );

    console.log(
      '🎮 Camera controls initialized (drag: left/right click, zoom: mouse wheel 0.3x-3.0x)'
    );
  }
}

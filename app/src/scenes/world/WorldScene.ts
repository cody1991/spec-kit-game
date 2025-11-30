import Phaser from 'phaser';
import { useGameStore } from '@core/state/store';
import type { Territory, HistoricalCommander } from '@core/types';
import { MapDataLoader } from './data/MapDataLoader';
import { MapRenderer } from './rendering/MapRenderer';
import { PerformanceMonitor } from './utils/PerformanceMonitor';
import type { Country } from './types/mapTypes';
import { createRegionCountryMap } from '@/config/regionMapping.config';
import { MappingValidator } from '@/core/validation/mappingValidator';
import { REGION_COUNTRY_MAPPINGS } from '@/config/regionMapping.config';

export class WorldScene extends Phaser.Scene {
  private territoriesGroup!: Phaser.GameObjects.Group;
  private commandersGroup!: Phaser.GameObjects.Group;
  private cameraController!: CameraController;
  private mapDataLoader!: MapDataLoader;
  private mapRenderer!: MapRenderer;
  private performanceMonitor!: PerformanceMonitor;
  private countries: Country[] = [];

  constructor() {
    super({ key: 'WorldScene' });
  }

  preload(): void {
    console.log('🗺️  WorldScene.preload() called - starting async map data load...');

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
    console.log('🗺️  Starting async map data load...');

    try {
      // Load map data with caching
      this.countries = await this.mapDataLoader.loadMapData('/maps/world-countries.json', {
        enableCache: true,
        cacheDuration: 7,
        useWorker: false, // Disable for now, can enable later
        timeout: 10000,
      });

      // Store in Phaser registry for renderer access
      this.registry.set('countries', this.countries);

      // Log sample country data for debugging
      if (this.countries.length > 0) {
        const sample = this.countries[0];
        console.log('📍 Sample country data:', {
          id: sample.id,
          name: sample.name,
          bbox: sample.bbox,
          centroid: sample.centroid,
          coordinatesSample: sample.geometry.coordinates[0]?.[0]?.slice(0, 3),
        });
      }

      console.log(`✅ Loaded ${this.countries.length} countries`);

      // Trigger initialization if create() already ran
      if (this.scene.isActive()) {
        console.log('🎨 Scene active, initializing map renderer now...');
        this.initializeMapRenderer();
        this.renderWorld();
      }
    } catch (error) {
      console.error('❌ Failed to load map data:', error);

      // Try fallback to simplified map
      try {
        console.log('Attempting fallback to simplified map...');
        this.countries = await this.mapDataLoader.loadMapData(
          '/maps/world-countries-simplified.json',
          {
            enableCache: false,
            timeout: 5000,
          }
        );

        this.registry.set('countries', this.countries);
        console.log(`✅ Loaded simplified map with ${this.countries.length} countries`);

        // Trigger initialization
        if (this.scene.isActive()) {
          this.initializeMapRenderer();
          this.renderWorld();
        }
      } catch (fallbackError) {
        console.error('❌ Fallback map load also failed:', fallbackError);
        // Continue with empty map - old territory system will be used
      }
    }
  }

  create(): void {
    console.log('🎬 WorldScene.create() called');

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

    console.log('📷 Camera initialized:', {
      bounds: camera.getBounds(),
      scroll: { x: camera.scrollX, y: camera.scrollY },
      zoom: camera.zoom,
      viewport: { width: camera.width, height: camera.height },
    });

    // Wait for map data to load (async operation from preload)
    // Check periodically until countries are loaded
    const checkInterval = 100; // Check every 100ms
    const maxWaitTime = 5000; // Max wait 5 seconds
    let elapsedTime = 0;

    const waitForMapData = () => {
      elapsedTime += checkInterval;

      if (this.countries.length > 0) {
        console.log(`✅ Map data ready (waited ${elapsedTime}ms), initializing renderer...`);
        this.initializeMapRenderer();
        this.initializeCameraController();
        this.setupStateSubscription();
        this.renderWorld();
        this.events.on('postupdate', this.onUpdate, this);
      } else if (elapsedTime < maxWaitTime) {
        console.log(`⏳ Waiting for map data... (${elapsedTime}ms)`);
        this.time.delayedCall(checkInterval, waitForMapData);
      } else {
        console.warn('⚠️  Map data not loaded after 5s, falling back to old system');
        this.initializeCameraController();
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

  private setupStateSubscription(): void {
    // 在实际应用中，这里应该订阅 Zustand store 的变化
    // 由于 Phaser 场景的生命周期，我们在 update 中轮询状态
  }

  private initializeMapRenderer(): void {
    try {
      console.log('🎨 Initializing MapRenderer...');
      this.mapRenderer = new MapRenderer();
      this.mapRenderer.initialize(this, {
        useWebGL: true,
        fillAlpha: 0.7,
        enableTransition: true,
        transitionDuration: 500,
        useObjectPool: true,
        poolSize: 200,
      });

      console.log('✅ MapRenderer initialized successfully');

      // Map countries to commanders
      this.mapCountriesToCommanders();
    } catch (error) {
      console.error('❌ Failed to initialize MapRenderer:', error);
      this.mapRenderer = null as any;
    }
  }

  /**
   * Map real-world countries to commanders based on region configuration
   *
   * This method performs the core mapping logic:
   * 1. Loads region-to-country mappings from configuration
   * 2. Validates mappings (dev mode only)
   * 3. Creates territory states for each mapped country
   * 4. Updates the global store with new states
   *
   * @performance
   * - Target: < 50ms for 200 countries
   * - Uses Map data structure for O(1) lookups
   * - Includes performance.mark/measure instrumentation
   *
   * @sideEffects
   * - Updates `useGameStore.territoryStates`
   * - Logs mapping details to console
   * - Triggers map re-render
   *
   * @see {@link createRegionCountryMap} for mapping configuration
   * @see {@link MappingValidator} for validation logic
   */
  private mapCountriesToCommanders(): void {
    performance.mark('mapping-start');

    const state = useGameStore.getState();
    const { commanders } = state;

    console.log('🔍 Starting country-to-commander mapping...');
    console.log(
      '   Commanders:',
      commanders.map((c) => `${c.name} (${c.id}): ${c.controlledTerritories.join(', ')}`)
    );

    // Use new mapping configuration
    const regionCountryMap = createRegionCountryMap();

    // Validate mappings in development mode
    if (process.env.NODE_ENV === 'development') {
      const validator = new MappingValidator();
      const validationResult = validator.validate(REGION_COUNTRY_MAPPINGS, this.countries);

      if (!validationResult.valid) {
        console.error('❌ Mapping validation failed:', validationResult.errors);
      }

      if (validationResult.warnings.length > 0) {
        console.warn('⚠️  Mapping warnings:', validationResult.warnings);
      }

      console.log('   Validation summary:', validationResult.summary);
    }

    // Create a map of which countries belong to which commander
    const countryOwnership = new Map<string, string>();

    commanders.forEach((commander) => {
      commander.controlledTerritories.forEach((regionId) => {
        // Get the list of countries for this region using new config
        const countryIds = regionCountryMap.get(regionId);

        if (countryIds) {
          console.log(`   Mapping ${regionId} -> [${countryIds.join(', ')}]`);
          countryIds.forEach((countryId) => {
            countryOwnership.set(countryId, commander.id);
          });
        } else {
          console.warn(`⚠️  Region "${regionId}" not found in mapping table`);
        }
      });
    });

    console.log(`   Country ownership map size: ${countryOwnership.size}`);

    // Create territory states for real countries
    const territoryStates = new Map();
    this.countries.forEach((country) => {
      const ownerId = countryOwnership.get(country.id);

      if (ownerId) {
        territoryStates.set(country.id, {
          countryId: country.id,
          countryName: country.name, // NEW: Add country name for display
          ownerId,
          troops: 50,
          resources: 0,
          defense: 70,
          updatedAt: Date.now(),
          conqueredAt: Date.now(),
          previousOwnerId: null,
          transitionProgress: null,
          isHighlighted: false,
        });
      }
    });

    // Update the store with country-based territory states
    state.setTerritoryStates(territoryStates);

    performance.mark('mapping-end');
    performance.measure('mapping-duration', 'mapping-start', 'mapping-end');
    const duration = performance.getEntriesByName('mapping-duration')[0]?.duration || 0;

    console.log(`🗺️  Mapped ${territoryStates.size} countries to ${commanders.length} commanders`);
    console.log(`⏱️  Mapping completed in ${duration.toFixed(2)}ms`);

    // Log mapping details
    if (process.env.NODE_ENV === 'development') {
      const mappedCommanderIds = new Set<string>();
      territoryStates.forEach((ts) => mappedCommanderIds.add(ts.ownerId));
      console.log(
        `   Commanders with territories: ${mappedCommanderIds.size}/${commanders.length}`
      );

      // Log sample mappings with commander names
      const samples = Array.from(territoryStates.entries()).slice(0, 3);
      console.log(
        '   Sample mappings:',
        samples.map(([countryId, ts]) => {
          const country = this.countries.find((c) => c.id === countryId);
          const commander = commanders.find((c) => c.id === ts.ownerId);
          return `${country?.name || countryId} -> ${commander?.name || ts.ownerId}`;
        })
      );
    }
  }

  private renderWorld(): void {
    const state = useGameStore.getState();
    const { territories, commanders, territoryStates, colorMappings } = state;

    console.log('🔄 renderWorld() called:', {
      hasMapRenderer: !!this.mapRenderer,
      countriesCount: this.countries.length,
      territoryStatesSize: territoryStates.size,
      colorMappingsSize: colorMappings.size,
    });

    // Use new map renderer if available
    if (this.mapRenderer && this.countries.length > 0 && territoryStates.size > 0) {
      this.performanceMonitor.startMeasure('mapRender');

      const stats = this.mapRenderer.render(
        this.countries,
        territoryStates,
        colorMappings,
        commanders // Pass commanders for label rendering
      );

      this.performanceMonitor.endMeasure('mapRender');

      // Log rendering stats for debugging
      console.log('🗺️  Map render stats:', {
        countries: this.countries.length,
        rendered: stats.countriesRendered,
        renderTime: Math.round(stats.renderTime * 100) / 100 + 'ms',
        drawCalls: stats.drawCalls,
      });

      // Update performance metrics
      useGameStore.getState().updatePerformance({
        fps: this.performanceMonitor.getAverageFps(),
        tickMs: stats.renderTime,
      });

      return;
    }

    console.log('⚠️  Falling back to old rendering system');

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
      // Find all countries controlled by this commander
      const controlledCountries = this.countries.filter((country) => {
        return commander.controlledTerritories.some((regionId) => {
          // Check if this country is in this region
          const regionCountryMap = createRegionCountryMap();
          const countryIds = regionCountryMap.get(regionId);
          return countryIds?.includes(country.id);
        });
      });

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
      const state = useGameStore.getState();
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
      const activeTransitions = this.mapRenderer.updateTransitions(delta);

      // Disable animations if performance is poor
      const fps = this.performanceMonitor.getAverageFps();
      if (fps < 30 && this.mapRenderer) {
        console.warn(`⚠️  Low FPS detected (${fps.toFixed(1)}), disabling animations`);
        this.mapRenderer.setEnableAnimation(false);
      }
    }

    // Track territory state changes for map updates
    const state = useGameStore.getState();

    // Update territory states from territory entities
    if (this.mapRenderer && this.countries.length > 0) {
      state.territories.forEach((territory) => {
        const existingState = state.territoryStates.get(territory.id);

        // Check if territory owner changed
        if (existingState && existingState.ownerId !== territory.ownerId) {
          // Territory changed hands
          const newState = {
            ...existingState,
            previousOwnerId: existingState.ownerId,
            ownerId: territory.ownerId,
            troops: territory.garrison,
            defense: territory.stability || 50,
            updatedAt: Date.now(),
            conqueredAt: Date.now(),
            transitionProgress: 0, // Start color transition animation
          };

          state.updateTerritoryState(territory.id, newState);

          // Update the visual rendering
          const colorMapping = territory.ownerId
            ? state.colorMappings.get(territory.ownerId)
            : null;

          if (colorMapping) {
            this.mapRenderer.updateCountry(territory.id, newState, colorMapping);
          }

          console.log(
            `🎨 Territory ${territory.id} changed owner: ${existingState.ownerId} -> ${territory.ownerId}`
          );
        } else if (existingState) {
          // Update troops/defense without owner change
          state.updateTerritoryState(territory.id, {
            troops: territory.garrison,
            defense: territory.stability || 50,
            updatedAt: Date.now(),
          });
        } else if (territory.ownerId) {
          // New territory state (shouldn't happen often)
          const newState = {
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
          };

          state.setTerritoryStates(new Map(state.territoryStates).set(territory.id, newState));
        }
      });
    }

    // 每30 tick 重新渲染一次完整地图（降低渲染频率以提升性能）
    if (state.tick % 30 === 0) {
      this.renderWorld();
    }

    // Check performance and adjust animation settings
    const fps = this.performanceMonitor.getAverageFps();
    if (this.mapRenderer && fps < 30) {
      console.warn(`⚠️  Low FPS detected: ${fps}, disabling animations`);
      this.mapRenderer.setEnableAnimation(false);
    }
  }

  cleanup(): void {
    this.events.off('postupdate', this.onUpdate, this);

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
      (
        pointer: Phaser.Input.Pointer,
        _gameObjects: unknown[],
        _deltaX: number,
        deltaY: number
      ) => {
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

    console.log('🎮 Camera controls initialized (drag: left/right click, zoom: mouse wheel 0.3x-3.0x)');
  }
}

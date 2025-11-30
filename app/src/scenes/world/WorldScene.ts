import Phaser from 'phaser';
import { useGameStore } from '@core/state/store';
import type { Territory, HistoricalCommander } from '@core/types';
import { MapDataLoader } from './data/MapDataLoader';
import { MapRenderer } from './rendering/MapRenderer';
import { PerformanceMonitor } from './utils/PerformanceMonitor';
import type { Country } from './types/mapTypes';

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

  async preload(): Promise<void> {
    console.log('🗺️  Loading map data...');

    // Initialize map data loader
    this.mapDataLoader = new MapDataLoader();

    try {
      // Load map data with caching
      this.countries = await this.mapDataLoader.loadMapData(
        '/maps/world-countries.json',
        {
          enableCache: true,
          cacheDuration: 7,
          useWorker: false, // Disable for now, can enable later
          timeout: 10000,
        }
      );

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
      } catch (fallbackError) {
        console.error('❌ Fallback map load also failed:', fallbackError);
        // Continue with empty map - old territory system will be used
      }
    }
  }

  create(): void {
    console.log('🎬 WorldScene.create() called, countries loaded:', this.countries.length);
    
    this.territoriesGroup = this.add.group();
    this.commandersGroup = this.add.group();

    // Initialize performance monitor
    this.performanceMonitor = new PerformanceMonitor(60);

    // Set up camera bounds for world map
    const camera = this.cameras.main;
    // Set a large world bounds to allow panning around the map
    camera.setBounds(-1000, -1000, 4000, 3000);
    // Start camera at (0, 0) to show the center of the map
    camera.setScroll(0, 0);
    camera.setZoom(1);
    
    console.log('📷 Camera initialized:', {
      bounds: camera.getBounds(),
      scroll: { x: camera.scrollX, y: camera.scrollY },
      zoom: camera.zoom,
      viewport: { width: camera.width, height: camera.height }
    });

    // Initialize map renderer if countries loaded
    // Note: countries might still be loading if this is called before preload completes
    if (this.countries.length > 0) {
      this.initializeMapRenderer();
    } else {
      console.warn('⚠️  Countries not loaded yet in create(), will initialize when loaded');
      // Set up a delayed check
      this.time.delayedCall(100, () => {
        if (this.countries.length > 0) {
          console.log('✅ Countries loaded, initializing map renderer now');
          this.initializeMapRenderer();
          this.renderWorld();
        }
      });
    }

    // 初始化相机控制
    this.cameraController = new CameraController(this);

    // 订阅状态变化
    this.setupStateSubscription();

    // 初始渲染
    this.renderWorld();

    // 更新循环
    this.events.on('postupdate', this.onUpdate, this);
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

  private setupStateSubscription(): void {
    // 在实际应用中，这里应该订阅 Zustand store 的变化
    // 由于 Phaser 场景的生命周期，我们在 update 中轮询状态
  }

  /**
   * Map real-world countries to commanders based on region proximity
   */
  private mapCountriesToCommanders(): void {
    const state = useGameStore.getState();
    const { commanders } = state;

    console.log('🔍 Starting country-to-commander mapping...');
    console.log('   Commanders:', commanders.map(c => `${c.name} (${c.id}): ${c.controlledTerritories.join(', ')}`));
    console.log('   Countries sample IDs:', this.countries.slice(0, 10).map(c => `${c.name}: ${c.id}`));

    // Region mapping from old territory IDs to country IDs
    const regionCountryMap: Record<string, string[]> = {
      'western-europe': ['250', '276', '380', '528', '56', '442'], // France, Germany, Italy, Netherlands, Belgium, Luxembourg
      'eastern-europe': ['616', '643', '804'], // Poland, Russia (part), Ukraine
      'russia': ['643'], // Russia
      'middle-east': ['682', '760', '784', '792'], // Saudi Arabia, Syria, UAE, Turkey
      'india': ['356'], // India
      'china': ['156'], // China
      'southeast-asia': ['704', '764', '360', '458'], // Vietnam, Thailand, Indonesia, Malaysia
      'japan': ['392'], // Japan
      'north-africa': ['818', '434', '012'], // Egypt, Libya, Algeria
      'central-africa': ['178', '180', '408'], // Congo, DR Congo, Kenya
      'south-africa': ['710'], // South Africa
      'north-america': ['840', '124'], // USA, Canada
      'central-america': ['484'], // Mexico
      'south-america': ['076', '032'], // Brazil, Argentina
      'australia': ['036'], // Australia
    };

    // Create a map of which countries belong to which commander
    const countryOwnership = new Map<string, string>();
    
    commanders.forEach((commander) => {
      commander.controlledTerritories.forEach((territoryId) => {
        // Get the list of countries for this old territory
        const countryIds = regionCountryMap[territoryId] || [];
        console.log(`   Mapping ${territoryId} -> [${countryIds.join(', ')}]`);
        countryIds.forEach((countryId) => {
          countryOwnership.set(countryId, commander.id);
        });
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
    
    console.log(`🗺️  Mapped ${territoryStates.size} countries to ${commanders.length} commanders`);
    
    // Log mapping details
    const mappedCommanderIds = new Set<string>();
    territoryStates.forEach((ts) => mappedCommanderIds.add(ts.ownerId));
    console.log(`   Commanders with territories: ${mappedCommanderIds.size}/${commanders.length}`);
    
    // Log sample mappings
    const samples = Array.from(territoryStates.entries()).slice(0, 3);
    console.log('   Sample mappings:', samples.map(([countryId, ts]) => {
      const country = this.countries.find(c => c.id === countryId);
      return `${country?.name || countryId} -> ${ts.ownerId}`;
    }));
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
        colorMappings
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

    // 渲染指挥官标记
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

    const firstTerritory = territories.find(
      (t) => t.id === commander.controlledTerritories[0]
    );
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
          
          console.log(`🎨 Territory ${territory.id} changed owner: ${existingState.ownerId} -> ${territory.ownerId}`);
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
  private dragStartX = 0;
  private dragStartY = 0;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.setupControls();
  }

  private setupControls(): void {
    const camera = this.scene.cameras.main;

    // 鼠标拖拽
    this.scene.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      if (pointer.rightButtonDown()) {
        this.isDragging = true;
        this.dragStartX = pointer.x;
        this.dragStartY = pointer.y;
      }
    });

    this.scene.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
      if (this.isDragging) {
        const deltaX = pointer.x - this.dragStartX;
        const deltaY = pointer.y - this.dragStartY;
        camera.scrollX -= deltaX;
        camera.scrollY -= deltaY;
        this.dragStartX = pointer.x;
        this.dragStartY = pointer.y;
      }
    });

    this.scene.input.on('pointerup', () => {
      this.isDragging = false;
    });

    // 缩放
    this.scene.input.on('wheel', (_pointer: Phaser.Input.Pointer, _gameObjects: unknown[], _deltaX: number, deltaY: number) => {
      const zoomFactor = deltaY > 0 ? 0.9 : 1.1;
      const newZoom = Phaser.Math.Clamp(camera.zoom * zoomFactor, 0.5, 2);
      camera.setZoom(newZoom);
    });
  }
}

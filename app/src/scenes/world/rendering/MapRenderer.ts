/**
 * Map Renderer
 *
 * Renders countries on the Phaser canvas using Graphics API.
 * Supports viewport culling, LOD, and performance optimization.
 */

import type {
  Country,
  TerritoryState,
  CommanderColor,
  RenderConfig,
  RenderStats,
} from '../types/mapTypes';
import { GraphicsPool } from './GraphicsPool';
import { bboxIntersects } from '../utils/geoUtils';
import { CoordinateTransformer } from '../utils/CoordinateTransformer';
import { ColorTransitionManager, type IColorTransitionManager } from './ColorTransitionManager';

export class MapRenderer {
  private scene!: Phaser.Scene;
  private config: Required<RenderConfig>;
  private graphicsPool!: GraphicsPool;
  private transformer!: CoordinateTransformer;
  private transitionManager!: IColorTransitionManager;
  private countryGraphics: Map<string, Phaser.GameObjects.Graphics> = new Map();
  private previousColors: Map<string, number> = new Map(); // Track previous colors for transitions
  private stats: RenderStats = {
    countriesRendered: 0,
    renderTime: 0,
    fps: 60,
    drawCalls: 0,
    vertices: 0,
    memoryUsage: 0,
  };

  constructor() {
    this.config = {
      useWebGL: true,
      borderWidth: 2,
      borderColor: 0x666666, // 灰色边框
      fillAlpha: 0.9,
      antiAlias: true,
      enableTransition: true,
      transitionDuration: 500,
      highlightBorderWidth: 3,
      highlightGlowColor: 0xffff00,
      useObjectPool: true,
      poolSize: 200,
    };
  }

  /**
   * Initialize renderer
   */
  initialize(scene: Phaser.Scene, config: RenderConfig = {}): void {
    try {
      this.scene = scene;
      this.config = { ...this.config, ...config };

      // Initialize coordinate transformer with game dimensions
      const camera = scene.cameras.main;
      console.log(
        '📐 Initializing CoordinateTransformer with dimensions:',
        camera.width,
        'x',
        camera.height
      );

      this.transformer = new CoordinateTransformer(camera.width, camera.height);
      console.log('✅ CoordinateTransformer created');

      // Initialize color transition manager
      console.log('🎨 Initializing ColorTransitionManager...');
      this.transitionManager = new ColorTransitionManager(this.config.transitionDuration);
      console.log('✅ ColorTransitionManager initialized');

      if (this.config.useObjectPool) {
        console.log('🎱 Initializing GraphicsPool...');
        this.graphicsPool = new GraphicsPool(scene, this.config.poolSize);
        this.graphicsPool.prewarm(50); // Pre-create 50 objects
        console.log('✅ GraphicsPool initialized');
      }

      console.log('✅ MapRenderer initialized with dimensions:', camera.width, 'x', camera.height);

      // Test coordinate transformation
      const testPoints = [
        [0, 0], // Prime meridian, equator
        [-100, 40], // North America
        [105, 35], // China
      ];

      console.log('📍 Test coordinate transformations:');
      testPoints.forEach(([lon, lat]) => {
        const screen = this.transformer.geoToScreen(lon, lat);
        console.log(`  [${lon}, ${lat}] -> [${Math.round(screen.x)}, ${Math.round(screen.y)}]`);
      });

      console.log('✅ MapRenderer initialization complete');
    } catch (error) {
      console.error('❌ Error during MapRenderer initialization:', error);
      throw error;
    }
  }

  /**
   * Render countries (main rendering method)
   */
  render(
    countries: Country[],
    territoryStates: Map<string, TerritoryState>,
    colorMappings: Map<string, CommanderColor>
  ): RenderStats {
    const startTime = performance.now();

    this.stats.countriesRendered = 0;
    this.stats.drawCalls = 0;
    this.stats.vertices = 0;

    // Get camera viewport for culling
    const camera = this.scene.cameras.main;
    const viewport = {
      minX: camera.scrollX,
      minY: camera.scrollY,
      maxX: camera.scrollX + camera.width,
      maxY: camera.scrollY + camera.height,
    };

    console.log('📷 Camera viewport:', viewport);

    // Render visible countries
    let culledCount = 0;
    let renderedWithOwner = 0;
    let renderedWithoutOwner = 0;

    countries.forEach((country) => {
      // Transform bbox to screen coordinates for culling
      const topLeft = this.transformer.geoToScreen(country.bbox.minX, country.bbox.maxY);
      const bottomRight = this.transformer.geoToScreen(country.bbox.maxX, country.bbox.minY);

      const screenBbox = {
        minX: topLeft.x,
        minY: topLeft.y,
        maxX: bottomRight.x,
        maxY: bottomRight.y,
      };

      // TEMPORARY: Disable viewport culling for debugging
      // TODO: Fix culling after coordinate system is verified
      const shouldRender = true; // bboxIntersects(screenBbox, viewport);

      if (!shouldRender) {
        culledCount++;
        return;
      }

      const state = territoryStates.get(country.id);
      const colorMapping = state?.ownerId ? colorMappings.get(state.ownerId) : null;

      this.renderCountry(country, state, colorMapping);
      this.stats.countriesRendered++;

      if (state?.ownerId && colorMapping) {
        renderedWithOwner++;
      } else {
        renderedWithoutOwner++;
      }
    });

    // Log first render details
    if (this.stats.countriesRendered === 0 && countries.length > 0) {
      console.error('❌ No countries rendered!', {
        totalCountries: countries.length,
        culled: culledCount,
        viewport,
        territoryStatesSize: territoryStates.size,
        colorMappingsSize: colorMappings.size,
        sampleCountry: countries[0]
          ? {
              id: countries[0].id,
              name: countries[0].name,
              bbox: countries[0].bbox,
            }
          : 'none',
      });
    } else if (this.stats.countriesRendered > 0) {
      console.log(
        `🎨 Rendered ${this.stats.countriesRendered}/${countries.length} countries (${renderedWithOwner} with owner, ${renderedWithoutOwner} without owner, ${culledCount} culled)`
      );
    }

    this.stats.renderTime = performance.now() - startTime;
    return this.stats;
  }

  /**
   * Render a single country
   */
  private renderCountry(
    country: Country,
    state: TerritoryState | undefined,
    colorMapping: CommanderColor | null
  ): void {
    // Get or create graphics object
    let graphics = this.countryGraphics.get(country.id);

    if (!graphics) {
      graphics = this.config.useObjectPool
        ? this.graphicsPool.acquire()
        : this.scene.add.graphics();

      this.countryGraphics.set(country.id, graphics);
    }

    graphics.clear();

    // Draw filled polygon if owner exists
    if (state?.ownerId && colorMapping) {
      this.fillCountry(graphics, country, colorMapping);
    }

    // Draw border
    this.drawCountryBorder(graphics, country, state);

    // Apply highlight if needed
    if (state?.isHighlighted) {
      this.applyHighlight(graphics, country);
    }

    this.stats.drawCalls++;
    this.stats.vertices += this.countVertices(country);
  }

  /**
   * Fill country with commander color (with transition support)
   */
  private fillCountry(
    graphics: Phaser.GameObjects.Graphics,
    country: Country,
    colorMapping: CommanderColor
  ): void {
    // Check if there's an active transition for this country
    let fillColor = colorMapping.primary;

    if (this.config.enableTransition) {
      const transitionColor = this.transitionManager.getCurrentColor(country.id);
      if (transitionColor !== null) {
        fillColor = transitionColor;
      } else {
        // Check if color changed since last render
        const prevColor = this.previousColors.get(country.id);
        if (prevColor !== undefined && prevColor !== fillColor) {
          // Start transition animation
          this.transitionManager.startTransition(
            country.id,
            prevColor,
            fillColor,
            this.config.transitionDuration,
            'easeInOut'
          );
          fillColor = prevColor; // Start from previous color
        }
      }
    }

    // Store current color for next frame
    this.previousColors.set(country.id, colorMapping.primary);

    graphics.fillStyle(fillColor, colorMapping.alpha);

    // Draw all polygons with coordinate transformation
    country.geometry.coordinates.forEach((polygon) => {
      polygon.forEach((ring) => {
        graphics.beginPath();

        ring.forEach(([lon, lat], index) => {
          // Transform geographic coordinates to screen coordinates
          const point = this.transformer.geoToScreen(lon, lat);

          if (index === 0) {
            graphics.moveTo(point.x, point.y);
          } else {
            graphics.lineTo(point.x, point.y);
          }
        });

        graphics.closePath();
        graphics.fillPath();
      });
    });
  }

  /**
   * Draw country border
   */
  private drawCountryBorder(
    graphics: Phaser.GameObjects.Graphics,
    country: Country,
    state: TerritoryState | undefined
  ): void {
    const borderColor = state?.isHighlighted
      ? this.config.highlightGlowColor
      : this.config.borderColor;

    const borderWidth = state?.isHighlighted
      ? this.config.highlightBorderWidth
      : this.config.borderWidth;

    graphics.lineStyle(borderWidth, borderColor, 1);

    country.geometry.coordinates.forEach((polygon) => {
      polygon.forEach((ring) => {
        graphics.beginPath();

        ring.forEach(([lon, lat], index) => {
          // Transform geographic coordinates to screen coordinates
          const point = this.transformer.geoToScreen(lon, lat);

          if (index === 0) {
            graphics.moveTo(point.x, point.y);
          } else {
            graphics.lineTo(point.x, point.y);
          }
        });

        graphics.closePath();
        graphics.strokePath();
      });
    });
  }

  /**
   * Apply highlight effect
   */
  private applyHighlight(graphics: Phaser.GameObjects.Graphics, country: Country): void {
    // Add glow effect using lineStyle
    graphics.lineStyle(this.config.highlightBorderWidth, this.config.highlightGlowColor, 0.5);

    country.geometry.coordinates.forEach((polygon) => {
      polygon[0].forEach(([lon, lat], index) => {
        // Transform geographic coordinates to screen coordinates
        const point = this.transformer.geoToScreen(lon, lat);

        if (index === 0) {
          graphics.moveTo(point.x, point.y);
        } else {
          graphics.lineTo(point.x, point.y);
        }
      });
    });

    graphics.strokePath();
  }

  /**
   * Update a single country's rendering
   */
  updateCountry(countryId: string, state: TerritoryState, colorMapping: CommanderColor): void {
    // Re-render this country
    const countries = this.scene.registry.get('countries') as Country[] | undefined;
    const country = countries?.find((c) => c.id === countryId);

    if (!country) {
      console.warn(`Country ${countryId} not found in registry`);
      return;
    }

    this.renderCountry(country, state, colorMapping);
  }

  /**
   * Highlight a country
   */
  highlightCountry(countryId: string | null, type: 'hover' | 'select'): void {
    // Remove previous highlights of this type
    this.countryGraphics.forEach((graphics, id) => {
      // This is a simplified implementation
      // In production, you'd track highlight states separately
    });

    // Apply new highlight
    if (countryId) {
      const countries = this.scene.registry.get('countries') as Country[] | undefined;
      const country = countries?.find((c) => c.id === countryId);

      if (country && this.countryGraphics.has(countryId)) {
        // Trigger a re-render with highlight
        // This would be handled by state updates in practice
      }
    }
  }

  /**
   * Clear all renderings
   */
  clear(): void {
    this.countryGraphics.forEach((graphics) => {
      if (this.config.useObjectPool) {
        this.graphicsPool.release(graphics);
      } else {
        graphics.destroy();
      }
    });

    this.countryGraphics.clear();
  }

  /**
   * Destroy renderer
   */
  destroy(): void {
    this.clear();

    if (this.graphicsPool) {
      this.graphicsPool.clear();
    }
  }

  /**
   * Get rendering statistics
   */
  getStats(): RenderStats {
    return { ...this.stats };
  }

  /**
   * Count vertices in a country
   */
  private countVertices(country: Country): number {
    let count = 0;

    country.geometry.coordinates.forEach((polygon) => {
      polygon.forEach((ring) => {
        count += ring.length;
      });
    });

    return count;
  }

  /**
   * Enable/disable animations based on performance
   */
  setEnableAnimation(enabled: boolean): void {
    this.config.enableTransition = enabled;
    if (!enabled && this.transitionManager) {
      this.transitionManager.clear();
    }
  }

  /**
   * Update transitions (called every frame)
   *
   * @param deltaTime - Time since last frame (ms)
   * @returns Number of active transitions
   */
  updateTransitions(deltaTime: number): number {
    if (!this.config.enableTransition || !this.transitionManager) {
      return 0;
    }

    this.transitionManager.update(deltaTime);
    return this.transitionManager.hasActiveTransitions() ? 1 : 0;
  }

  /**
   * Trigger color transition for territory change
   *
   * @param countryId - Country ID
   * @param newColor - New commander color
   */
  triggerTerritoryTransition(countryId: string, newColor: number): void {
    if (!this.config.enableTransition || !this.transitionManager) {
      return;
    }

    const prevColor = this.previousColors.get(countryId);
    if (prevColor !== undefined && prevColor !== newColor) {
      this.transitionManager.startTransition(
        countryId,
        prevColor,
        newColor,
        this.config.transitionDuration,
        'easeInOut'
      );
    }

    this.previousColors.set(countryId, newColor);
  }

  /**
   * Fade territories to neutral on commander elimination
   *
   * @param countryIds - Array of country IDs to fade
   * @param neutralColor - Neutral color (default gray)
   */
  fadeToNeutral(countryIds: string[], neutralColor: number = 0x808080): void {
    if (!this.transitionManager) {
      return;
    }

    countryIds.forEach((countryId) => {
      const prevColor = this.previousColors.get(countryId);
      if (prevColor !== undefined) {
        // Use longer duration for elimination effect
        this.transitionManager.startTransition(
          countryId,
          prevColor,
          neutralColor,
          this.config.transitionDuration * 2, // 1000ms for dramatic effect
          'easeOut'
        );
        this.previousColors.set(countryId, neutralColor);
      }
    });

    console.log(`💀 Fading ${countryIds.length} territories to neutral`);
  }
}

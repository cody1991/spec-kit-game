/**
 * Map Renderer
 *
 * Renders countries on the Phaser canvas using Graphics API.
 * Supports viewport culling, LOD, and performance optimization.
 * 
 * @performance
 * - 支持增量渲染（只渲染脏区域）
 * - 使用对象池减少 GC 压力
 * - 颜色过渡动画可选禁用
 */

import type {
  Country,
  TerritoryState,
  CommanderColor,
  RenderConfig,
  RenderStats,
} from '../types/mapTypes';
import { GraphicsPool } from './GraphicsPool';
import { CoordinateTransformer } from '../utils/CoordinateTransformer';
import { ColorTransitionManager, type IColorTransitionManager } from './ColorTransitionManager';
import { logger } from '@/config/debug.config';

export class MapRenderer {
  private scene!: Phaser.Scene;
  private config: Required<RenderConfig>;
  private graphicsPool!: GraphicsPool;
  private transformer!: CoordinateTransformer;
  private transitionManager!: IColorTransitionManager;
  private countryGraphics: Map<string, Phaser.GameObjects.Graphics> = new Map();
  private countryLabels: Map<string, Phaser.GameObjects.Text> = new Map();
  private previousColors: Map<string, number> = new Map();
  private commanders: Array<{ id: string; name: string }> = [];
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
      borderColor: 0x666666,
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
      logger.log('MAP_RENDERER_INIT', '📐 Initializing CoordinateTransformer');

      this.transformer = new CoordinateTransformer(camera.width, camera.height);

      // Initialize color transition manager
      this.transitionManager = new ColorTransitionManager(this.config.transitionDuration);

      if (this.config.useObjectPool) {
        this.graphicsPool = new GraphicsPool(scene, this.config.poolSize);
        this.graphicsPool.prewarm(50);
      }

      logger.log('MAP_RENDERER_INIT', '✅ MapRenderer initialized');
    } catch (error) {
      logger.error('❌ Error during MapRenderer initialization:', error);
      throw error;
    }
  }

  /**
   * Render countries (main rendering method)
   * 
   * @param countries - 所有国家数据
   * @param territoryStates - 领土状态
   * @param colorMappings - 颜色映射
   * @param commanders - 指挥官列表
   * @param dirtyTerritories - 可选：只渲染这些脏领土（增量渲染）
   */
  render(
    countries: Country[],
    territoryStates: Map<string, TerritoryState>,
    colorMappings: Map<string, CommanderColor>,
    commanders: Array<{ id: string; name: string }> = [],
    dirtyTerritories?: Set<string>
  ): RenderStats {
    const startTime = performance.now();

    this.stats.countriesRendered = 0;
    this.stats.drawCalls = 0;
    this.stats.vertices = 0;

    // Cache commanders for incremental updates
    this.commanders = commanders;

    // 增量渲染模式：只渲染脏领土
    if (dirtyTerritories && dirtyTerritories.size > 0) {
      dirtyTerritories.forEach((countryId) => {
        const country = countries.find(c => c.id === countryId);
        if (!country) return;

        const state = territoryStates.get(country.id);
        const colorMapping = state?.ownerId ? colorMappings.get(state.ownerId) ?? null : null;

        this.renderCountry(country, state, colorMapping);
        this.renderCountryLabel(country, state, commanders);
        this.stats.countriesRendered++;
      });

      this.stats.renderTime = performance.now() - startTime;
      logger.log('MAP_RENDERING', `🎨 Incremental render: ${this.stats.countriesRendered} countries in ${this.stats.renderTime.toFixed(2)}ms`);
      return this.stats;
    }

    // 全量渲染
    countries.forEach((country) => {
      const state = territoryStates.get(country.id);
      const colorMapping = state?.ownerId ? colorMappings.get(state.ownerId) ?? null : null;

      this.renderCountry(country, state, colorMapping);
      this.renderCountryLabel(country, state, commanders);
      this.stats.countriesRendered++;
    });

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

    // Draw filled polygon
    if (state?.ownerId && colorMapping) {
      // 有owner的国家：使用指挥官颜色
      this.fillCountry(graphics, country, colorMapping);
    } else {
      // 中立国家：使用灰色填充，让它们可见
      this.fillNeutralCountry(graphics, country);
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
   * Render country label with commander name
   */
  private renderCountryLabel(
    country: Country,
    state: TerritoryState | undefined,
    commanders: Array<{ id: string; name: string }>
  ): void {
    // Only show labels for countries with owners
    if (!state?.ownerId) {
      // Remove label if exists
      const existingLabel = this.countryLabels.get(country.id);
      if (existingLabel) {
        existingLabel.setVisible(false);
      }
      return;
    }

    // Find commander name
    const commander = commanders.find((c) => c.id === state.ownerId);
    if (!commander) {
      const existingLabel = this.countryLabels.get(country.id);
      if (existingLabel) {
        existingLabel.setVisible(false);
      }
      return;
    }

    // Get or create text label
    let label = this.countryLabels.get(country.id);
    
    if (!label) {
      label = this.scene.add.text(0, 0, '', {
        fontSize: '12px',
        color: '#ffffff',
        stroke: '#000000',
        strokeThickness: 3,
        fontStyle: 'bold',
        align: 'center',
      });
      label.setOrigin(0.5);
      label.setDepth(1000); // Render on top of countries
      this.countryLabels.set(country.id, label);
    }

    // Transform centroid to screen coordinates
    const screenPos = this.transformer.geoToScreen(country.centroid.x, country.centroid.y);
    
    // Update label position and text (show commander name)
    label.setPosition(screenPos.x, screenPos.y);
    label.setText(commander.name);
    label.setVisible(true);

    // Adjust font size based on zoom level
    const camera = this.scene.cameras.main;
    const zoom = camera.zoom;
    const fontSize = Math.max(8, Math.min(18, 12 * zoom));
    label.setFontSize(fontSize);
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
   * Fill neutral country with gray color
   */
  private fillNeutralCountry(
    graphics: Phaser.GameObjects.Graphics,
    country: Country
  ): void {
    // 中立国家使用深灰色，alpha稍低
    const neutralColor = 0x3a3a3a; // 深灰色
    const neutralAlpha = 0.6;
    
    graphics.fillStyle(neutralColor, neutralAlpha);

    country.geometry.coordinates.forEach((polygon) => {
      polygon.forEach((ring) => {
        graphics.beginPath();

        ring.forEach(([lon, lat], index) => {
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
      logger.warn('WARNINGS', `❌ [MapRenderer] Country ${countryId} not found in registry`);
      return;
    }

    this.renderCountry(country, state, colorMapping);

    // Also update label to reflect new owner
    this.renderCountryLabel(country, state, this.commanders);
  }

  /**
   * Highlight a country
   */
  highlightCountry(countryId: string | null, _type: 'hover' | 'select'): void {
    // Remove previous highlights of this type
    this.countryGraphics.forEach((_graphics, _id) => {
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

    // Clear labels
    this.countryLabels.forEach((label) => {
      label.destroy();
    });
    this.countryLabels.clear();
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
  }
}

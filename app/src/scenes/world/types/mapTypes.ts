/**
 * Map Types for Real World Map Visualization
 * 
 * This module contains all type definitions specific to the map rendering system.
 * For core game types, see @core/types.ts
 */

import type {
  Point,
  BoundingBox,
  MultiPolygon,
  Country,
  TerritoryState,
  CommanderColor,
  MapRenderState,
} from '@core/types';

// Re-export core types for convenience
export type {
  Point,
  BoundingBox,
  MultiPolygon,
  Country,
  TerritoryState,
  CommanderColor,
  MapRenderState,
};

// ============================================================================
// Event Types
// ============================================================================

export interface MapLoadedEvent {
  type: 'map:loaded';
  payload: {
    countries: Country[];
    loadTime: number;
    source: 'network' | 'cache';
  };
}

export interface TerritoryUpdatedEvent {
  type: 'territory:updated';
  payload: {
    countryId: string;
    oldOwnerId: string | null;
    newOwnerId: string | null;
    timestamp: number;
  };
}

export interface MapInteractionEvent {
  type: 'map:hover' | 'map:click' | 'map:select';
  payload: {
    countryId: string | null;
    position: Point;
    geoPosition: Point;
  };
}

export interface RenderPerformanceEvent {
  type: 'render:performance';
  payload: {
    fps: number;
    renderTime: number;
    countriesRendered: number;
    memoryUsage: number;
  };
}

export type MapEvent =
  | MapLoadedEvent
  | TerritoryUpdatedEvent
  | MapInteractionEvent
  | RenderPerformanceEvent;

// ============================================================================
// Auxiliary Types
// ============================================================================

export interface SpatialGrid {
  cols: number;
  rows: number;
  cellWidth: number;
  cellHeight: number;
  cells: Map<number, Set<string>>;
}

export interface ColorLerpState {
  countryId: string;
  fromColor: number;
  toColor: number;
  startTime: number;
  duration: number;
  easing: 'linear' | 'easeInOut';
}

export enum LODLevel {
  FULL = 0,
  SIMPLIFIED = 1,
  REGIONS = 2,
}

export enum PerformanceTier {
  HIGH = 'high',
  MEDIUM = 'medium',
  LOW = 'low',
}

// ============================================================================
// Configuration Types
// ============================================================================

export interface LoadOptions {
  useWorker?: boolean;
  enableCache?: boolean;
  cacheDuration?: number;
  simplified?: boolean;
  timeout?: number;
}

export interface ConversionOptions {
  calculateCentroid?: boolean;
  calculateBbox?: boolean;
  generateSimplified?: boolean;
  simplificationTolerance?: number;
}

export interface RenderConfig {
  useWebGL?: boolean;
  borderWidth?: number;
  borderColor?: number;
  fillAlpha?: number;
  antiAlias?: boolean;
  enableTransition?: boolean;
  transitionDuration?: number;
  highlightBorderWidth?: number;
  highlightGlowColor?: number;
  useObjectPool?: boolean;
  poolSize?: number;
}

export interface RenderStats {
  countriesRendered: number;
  renderTime: number;
  fps: number;
  drawCalls: number;
  vertices: number;
  memoryUsage: number;
}

export interface InteractionConfig {
  enableClick?: boolean;
  enableHover?: boolean;
  enableZoom?: boolean;
  enableDrag?: boolean;
  hoverDelay?: number;
  zoomSensitivity?: number;
  dragDamping?: number;
  clickThreshold?: number;
}

// ============================================================================
// Constants
// ============================================================================

export const MAP_CONSTANTS = {
  GRID: {
    COLS: 16,
    ROWS: 8,
    TOTAL_CELLS: 128,
  },
  ZOOM: {
    MIN: 0.5,
    MAX: 5.0,
    DEFAULT: 1.0,
  },
  LOD_THRESHOLDS: {
    FULL: 2.0,
    SIMPLIFIED: 0.5,
  },
  PERFORMANCE: {
    TARGET_FPS: 60,
    MIN_FPS: 30,
    HIGH_TIER_THRESHOLD: 55,
    MEDIUM_TIER_THRESHOLD: 45,
  },
  RENDER: {
    DEFAULT_BORDER_WIDTH: 1,
    DEFAULT_BORDER_COLOR: 0x333333,
    DEFAULT_FILL_ALPHA: 0.7,
    HIGHLIGHT_BORDER_WIDTH: 3,
    HIGHLIGHT_GLOW_COLOR: 0xffffff,
  },
  ANIMATION: {
    TRANSITION_DURATION: 500,
    FADE_DURATION: 300,
    PULSE_SPEED: 1000,
  },
} as const;

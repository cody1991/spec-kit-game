export type GameEventType =
  | 'game:start'
  | 'game:pause'
  | 'game:resume'
  | 'game:victory'
  | 'battle:attack'
  | 'battle:result'
  | 'territory:captured'
  | 'commander:eliminated'
  | 'alliance:formed'
  | 'alliance:broken'
  // Feature: 010-gradual-conquest - 占领进度事件
  | 'conquest:progress-changed'
  | 'conquest:territory-transferred'
  | 'conquest:decay-applied';

export interface GameEvent<T = unknown> {
  type: GameEventType;
  timestamp: string;
  payload: T;
}

export class EventBus {
  private listeners: Map<GameEventType, Array<(event: GameEvent) => void>> = new Map();

  on(type: GameEventType, callback: (event: GameEvent) => void): () => void {
    if (!this.listeners.has(type)) {
      this.listeners.set(type, []);
    }
    this.listeners.get(type)!.push(callback);

    return () => {
      const callbacks = this.listeners.get(type);
      if (callbacks) {
        const index = callbacks.indexOf(callback);
        if (index > -1) {
          callbacks.splice(index, 1);
        }
      }
    };
  }

  emit(event: GameEvent): void {
    const callbacks = this.listeners.get(event.type);
    if (callbacks) {
      callbacks.forEach((callback) => callback(event));
    }
  }

  clear(): void {
    this.listeners.clear();
  }
}

export const globalEventBus = new EventBus();

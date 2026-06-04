import { EventEmitter as NodeEventEmitter } from 'events';
import type { GameEvents, IEventBus } from '../types/index.js';

// Typed EventEmitter — publish/subscribe for game systems
export class TypedEventEmitter implements IEventBus {
  private emitter = new NodeEventEmitter();

  on<K extends keyof GameEvents>(event: K, listener: GameEvents[K]): this {
    this.emitter.on(event as string, listener);
    return this;
  }

  off<K extends keyof GameEvents>(event: K, listener: GameEvents[K]): this {
    this.emitter.off(event as string, listener);
    return this;
  }

  emit<K extends keyof GameEvents>(event: K, ...args: Parameters<GameEvents[K]>): boolean {
    return this.emitter.emit(event as string, ...args);
  }

  removeAllListeners(): this {
    this.emitter.removeAllListeners();
    return this;
  }
}

import { WorldImpl } from './ecs.js';
import { TypedEventEmitter } from './event-bus.js';
import type { IEventBus } from '../types/index.js';

export type EngineState = 'running' | 'paused' | 'stopped';

export class GameEngine {
  world: WorldImpl;
  events: IEventBus;
  state: EngineState = 'stopped';
  tickCount = 0;

  constructor() {
    this.world = new WorldImpl();
    this.events = new TypedEventEmitter();
  }

  start(): void {
    if (this.state !== 'stopped') return;
    this.state = 'running';
    this.events.emit('engine:play');
  }

  pause(): void {
    if (this.state !== 'running') return;
    this.state = 'paused';
    this.events.emit('engine:pause');
  }

  resume(): void {
    if (this.state !== 'paused') return;
    this.state = 'running';
    this.events.emit('engine:play');
  }

  toggle(): void {
    if (this.state === 'running') this.pause();
    else if (this.state === 'paused') this.resume();
    else this.start();
  }

  // Advance one tick — called from user input or auto-loop
  tick(): void {
    if (this.state !== 'running') return;
    this.tickCount++;
    this.world.tick(1);
    this.events.emit('engine:tick', this.tickCount);
  }

  // Run ticks continuously until paused externally
  async runLoop(tickIntervalMs: number, signal: AbortSignal): Promise<void> {
    while (!signal.aborted) {
      if (this.state === 'running') {
        this.tick();
      }
      await new Promise(resolve => setTimeout(resolve, tickIntervalMs));
    }
  }
}

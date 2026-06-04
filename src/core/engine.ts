import { WorldImpl } from './ecs.js';
import { TypedEventEmitter } from './event-bus.js';
import { GameClock } from './game-clock.js';
import type { IEventBus } from '../types/index.js';

export type EngineState = 'running' | 'paused' | 'stopped';

export class GameEngine {
  world: WorldImpl;
  events: IEventBus;
  clock: GameClock;
  state: EngineState = 'stopped';
  tickCount = 0;

  constructor() {
    this.world = new WorldImpl();
    this.events = new TypedEventEmitter();
    this.clock = new GameClock();
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

  /** Advance game time by N minutes. Decays needs, runs systems, fires events. */
  advanceTime(minutes: number): void {
    if (minutes <= 0) return;
    this.tickCount++;
    this.clock.advance(minutes);
    this.world.tick(minutes / 60);  // Pass delta in hours
    this.events.emit('engine:tick', this.tickCount);
    this.events.emit('engine:time_advanced', this.clock.toJSON(), minutes);
  }

  // Legacy tick for manual step — advances 5 minutes (1 game tick)
  tick(): void {
    if (this.state !== 'running') return;
    this.advanceTime(5);
  }
}

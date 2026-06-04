import fs from 'fs';
import type { SaveData, World } from '../types/index.js';
import type { GameClock } from './game-clock.js';

export function saveWorld(world: World, tick: number, clock: GameClock, filePath: string): void {
  const data: SaveData = {
    version: '0.1.0',
    timestamp: Date.now(),
    entities: Array.from(world.entities.values()).map(e => ({
      id: e.id,
      components: Object.fromEntries(
        Array.from(e.components.entries()).map(([key, val]) => [key, val])
      ),
    })),
    tick,
    gameTime: clock.toJSON(),
  };
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
}

export function loadSaveData(filePath: string): SaveData {
  const raw = fs.readFileSync(filePath, 'utf-8');
  return JSON.parse(raw) as SaveData;
}

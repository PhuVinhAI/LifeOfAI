import type { World, IEventBus } from '../../../types/index.js';
import type { Needs } from '../components/needs.js';

// Decay rates per hour (realistic)
const DECAY_PER_HOUR: Record<keyof Omit<Needs, 'type'>, number> = {
  hunger: 6,     // Đói sau ~16 tiếng không ăn
  thirst: 10,    // Khát sau ~10 tiếng không uống
  energy: 5,     // Mệt sau ~20 tiếng không ngủ
  bladder: 15,   // Cần đi vệ sinh sau ~6-7 tiếng
  hygiene: 3,    // Bẩn sau ~33 tiếng
  fun: 4,        // Chán sau ~25 tiếng
};

const NEED_LABELS: Record<string, string> = {
  hunger: 'Đói', thirst: 'Khát', energy: 'Năng lượng',
  bladder: 'Vệ sinh', hygiene: 'Vệ sinh thân thể', fun: 'Giải trí',
};

const CRITICAL_THRESHOLD = 20;

export function needDecaySystem(world: World, deltaHours: number, events: IEventBus): void {
  const agents = world.query(['needs']);
  for (const agent of agents) {
    const needs = agent.components.get('needs') as Needs | undefined;
    if (!needs) continue;

    for (const [key, ratePerHour] of Object.entries(DECAY_PER_HOUR) as [keyof Omit<Needs, 'type'>, number][]) {
      const oldValue = needs[key];
      const decay = ratePerHour * deltaHours;
      needs[key] = Math.max(0, oldValue - decay);

      if (oldValue > CRITICAL_THRESHOLD && needs[key] <= CRITICAL_THRESHOLD) {
        events.emit('needs:critical', agent.id, key, needs[key]);
      }
    }
  }
}

export function getNeedLabel(need: string): string {
  return NEED_LABELS[need] ?? need;
}

export { DECAY_PER_HOUR, CRITICAL_THRESHOLD };

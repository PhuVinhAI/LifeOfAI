import type { World, IEventBus } from '../../../types/index.js';
import type { Needs } from '../components/needs.js';

const DECAY_RATES: Record<keyof Omit<Needs, 'type'>, number> = {
  hunger: 0.5,
  thirst: 0.7,
  energy: 0.6,
  bladder: 0.8,
  hygiene: 0.3,
  fun: 0.4,
};

const NEED_LABELS: Record<string, string> = {
  hunger: 'Đói', thirst: 'Khát', energy: 'Năng lượng',
  bladder: 'Vệ sinh', hygiene: 'Vệ sinh thân thể', fun: 'Giải trí',
};

const CRITICAL_THRESHOLD = 20;

export function needDecaySystem(world: World, _delta: number, events: IEventBus): void {
  const agents = world.query(['needs']);
  for (const agent of agents) {
    const needs = agent.components.get('needs') as Needs | undefined;
    if (!needs) continue;

    for (const [key, rate] of Object.entries(DECAY_RATES) as [keyof Omit<Needs, 'type'>, number][]) {
      const oldValue = needs[key];
      needs[key] = Math.max(0, oldValue - rate);

      // Emit warning if need goes critical
      if (oldValue > CRITICAL_THRESHOLD && needs[key] <= CRITICAL_THRESHOLD) {
        events.emit('needs:critical', agent.id, key, needs[key]);
      }
    }
  }
}

export function getNeedLabel(need: string): string {
  return NEED_LABELS[need] ?? need;
}

export { DECAY_RATES, CRITICAL_THRESHOLD };

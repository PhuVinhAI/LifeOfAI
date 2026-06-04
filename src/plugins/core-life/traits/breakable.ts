import type { TraitDefinition, InteractionResult, Entity, World } from '../../../types/index.js';

interface BreakableConfig {
  durability: number;
  decayRate: number;
}

export const BreakableTrait: TraitDefinition = {
  name: 'breakable',
  capabilities: ['use', 'repair'],
  initialState: 'working',

  transitions: {
    working: { damage: 'damaged', break: 'broken' },
    damaged: { use: 'damaged', break: 'broken', repair: 'working' },
    broken:  { repair: 'working' },
  },

  onInteract(entity: Entity, action: string, _user: Entity, _params: Record<string, unknown> | undefined, _world: World): InteractionResult {
    const state = getState(entity);
    if (action === 'repair') {
      if (state === 'working') {
        return { success: true, message: `${entity.id} vẫn còn tốt, không cần sửa.`, duration: 5 };
      }
      setState(entity, 'working');
      return { success: true, message: `Đã sửa ${entity.id}.`, duration: 30 };
    }
    // 'use' — check if broken
    if (state === 'broken') {
      return { success: false, message: `${entity.id} đã hỏng, cần sửa chữa.` };
    }
    return { success: true, message: `${entity.id} hoạt động bình thường.`, duration: 5 };
  },

  tick(entity: Entity, _world: World, _delta: number): void {
    const config = getConfig(entity);
    if (Math.random() < config.decayRate) {
      const currentState = getState(entity);
      const transitions = this.transitions[currentState];
      if (transitions?.['damage']) {
        setState(entity, transitions['damage']!);
      } else if (transitions?.['break']) {
        setState(entity, transitions['break']!);
      }
    }
  },
};

function getState(entity: Entity): string {
  const os = entity.components.get('object_state');
  if (os && 'traits' in os) return (os as any).traits['breakable'] ?? 'working';
  return 'working';
}

function setState(entity: Entity, s: string): void {
  const os = entity.components.get('object_state');
  if (os && 'traits' in os) (os as any).traits['breakable'] = s;
}

function getConfig(entity: Entity): BreakableConfig {
  const os = entity.components.get('object_state');
  if (os && 'traitConfig' in os) return (os as any).traitConfig?.breakable ?? { durability: 100, decayRate: 0.005 };
  return { durability: 100, decayRate: 0.005 };
}

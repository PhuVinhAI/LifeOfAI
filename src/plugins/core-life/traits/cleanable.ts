import type { TraitDefinition, InteractionResult, Entity, World } from '../../../types/index.js';

interface CleanableConfig {
  cleanliness: number;
  decayRate: number;
}

export const CleanableTrait: TraitDefinition = {
  name: 'cleanable',
  capabilities: ['clean', 'use'],
  initialState: 'clean',

  transitions: {
    clean:  { decay: 'dirty', use: 'dirty' },
    dirty:  { clean: 'clean', decay: 'filthy', use: 'filthy' },
    filthy: { clean: 'dirty' },
  },

  onInteract(entity: Entity, action: string, _user: Entity, _params: Record<string, unknown> | undefined, _world: World): InteractionResult {
    if (action === 'clean') {
      return { success: true, message: `Đã dọn dẹp ${entity.id}.` };
    }
    // 'use' action — just report current state, the usable trait handles the actual use
    const state = getState(entity);
    if (state === 'filthy') {
      return { success: false, message: `${entity.id} quá bẩn để dùng. Cần dọn dẹp trước.` };
    }
    return { success: true, message: `Đã dùng ${entity.id}.` };
  },

  tick(entity: Entity, _world: World, _delta: number): void {
    // Each tick, randomly decay cleanliness
    const config = getConfig(entity);
    if (Math.random() < config.decayRate) {
      const currentState = getState(entity);
      const transitions = this.transitions[currentState];
      if (transitions?.['decay']) {
        setState(entity, transitions['decay']!);
      } else if (transitions?.['use']) {
        setState(entity, transitions['use']!);
      }
    }
  },
};

function getState(entity: Entity): string {
  const os = entity.components.get('object_state');
  if (os && 'traits' in os) {
    return (os as any).traits['cleanable'] ?? 'clean';
  }
  return 'clean';
}

function setState(entity: Entity, newState: string): void {
  const os = entity.components.get('object_state');
  if (os && 'traits' in os) {
    (os as any).traits['cleanable'] = newState;
  }
}

function getConfig(entity: Entity): CleanableConfig {
  const os = entity.components.get('object_state');
  if (os && 'traitConfig' in os) {
    return (os as any).traitConfig?.cleanable ?? { cleanliness: 100, decayRate: 0.01 };
  }
  return { cleanliness: 100, decayRate: 0.01 };
}

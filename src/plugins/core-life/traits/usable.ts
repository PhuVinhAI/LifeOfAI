import type { TraitDefinition, InteractionResult, Entity, World } from '../../../types/index.js';
import type { ObjectState } from '../components/object-state.js';

export const UsableTrait: TraitDefinition = {
  name: 'usable',
  capabilities: ['use'],
  initialState: 'idle',

  transitions: {
    idle:    { use: 'in_use' },
    in_use:  { finish: 'idle' },
  },

  onInteract(entity: Entity, action: string, _user: Entity, _params: Record<string, unknown> | undefined, _world: World): InteractionResult {
    const state = entity.components.get('object_state') as ObjectState | undefined;
    const currentState = state?.traits['usable'] ?? 'idle';

    if (currentState !== 'idle') {
      return { success: false, message: `${entity.id} đang được sử dụng.` };
    }

    // Transition to in_use
    if (state) {
      state.traits['usable'] = 'in_use';
    }

    return { success: true, message: `Đã dùng ${entity.id}.` };
  },
};

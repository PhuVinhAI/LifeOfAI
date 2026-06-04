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
      // Auto-reset and allow re-use (for objects that don't have meaningful cooldown like chairs, tables)
      if (state) state.traits['usable'] = 'idle';
    }

    // Mark in_use, then auto-finish on next tick
    if (state) {
      state.traits['usable'] = 'in_use';
    }

    return { success: true, message: `Đã dùng ${entity.id}.` };
  },

  tick(entity: Entity, _world: World, _delta: number): void {
    // Auto-finish usable state each tick so the object is reusable next time
    const state = entity.components.get('object_state') as ObjectState | undefined;
    if (state && state.traits['usable'] === 'in_use') {
      state.traits['usable'] = 'idle';
    }
  },
};

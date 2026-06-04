import { describe, it, expect } from 'vitest';
import { UsableTrait } from '../../../src/plugins/core-life/traits/usable.js';
import type { Entity, World } from '../../../src/types/index.js';

function makeEntity(traitState: string): Entity {
  return {
    id: 'test_obj',
    components: new Map(Object.entries({
      object_state: {
        type: 'object_state',
        objectName: 'Test Object',
        traits: { usable: traitState },
      },
    })),
  };
}

describe('UsableTrait', () => {
  it('allows use when idle', () => {
    const entity = makeEntity('idle');
    const result = UsableTrait.onInteract(entity, 'use', {} as Entity, {}, {} as World);
    expect(result.success).toBe(true);
  });

  it('auto-resets and allows use even when in_use', () => {
    // Objects like chairs/tables can be used by multiple agents without blocking
    const entity = makeEntity('in_use');
    const result = UsableTrait.onInteract(entity, 'use', {} as Entity, {}, {} as World);
    expect(result.success).toBe(true);
  });

  it('has use capability', () => {
    expect(UsableTrait.capabilities).toContain('use');
  });

  it('has correct initial state', () => {
    expect(UsableTrait.initialState).toBe('idle');
  });

  it('tick auto-resets in_use to idle', () => {
    const entity = makeEntity('in_use');
    UsableTrait.tick!(entity, {} as World, 1);
    const state = entity.components.get('object_state') as any;
    expect(state.traits.usable).toBe('idle');
  });
});

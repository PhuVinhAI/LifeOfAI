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

  it('rejects use when in_use', () => {
    const entity = makeEntity('in_use');
    const result = UsableTrait.onInteract(entity, 'use', {} as Entity, {}, {} as World);
    expect(result.success).toBe(false);
  });

  it('has use capability', () => {
    expect(UsableTrait.capabilities).toContain('use');
  });

  it('has correct initial state', () => {
    expect(UsableTrait.initialState).toBe('idle');
  });
});

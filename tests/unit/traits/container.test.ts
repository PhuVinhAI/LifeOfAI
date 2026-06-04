import { describe, it, expect } from 'vitest';
import { ContainerTrait } from '../../../src/plugins/core-life/traits/container.js';
import type { Entity } from '../../../src/types/index.js';

function makeEntity(items: Array<{ name: string; quantity: number }> = [], state = 'closed'): Entity {
  const comps: Record<string, any> = {
    object_state: {
      type: 'object_state',
      objectName: 'Tủ lạnh',
      traits: { container: state, breakable: 'working', usable: 'idle' },
      traitConfig: { container: { slots: 10, accepts: ['food', 'drink'] } },
      containerData: { items: [...items] },
    },
  };
  return { id: 'test_obj', components: new Map(Object.entries(comps)) };
}

describe('ContainerTrait', () => {
  it('opens and lists items', () => {
    const entity = makeEntity([{ name: 'Pizza', quantity: 2 }]);
    const result = ContainerTrait.onInteract(entity, 'open', {} as Entity, {}, {} as any);
    expect(result.success).toBe(true);
    expect(result.message).toContain('Pizza');
    expect(result.message).toContain('x2');
  });

  it('shows empty when no items', () => {
    const entity = makeEntity([]);
    const result = ContainerTrait.onInteract(entity, 'open', {} as Entity, {}, {} as any);
    expect(result.success).toBe(true);
    expect(result.message).toContain('trống');
  });

  it('rejects take when closed', () => {
    const entity = makeEntity([{ name: 'Pizza', quantity: 1 }], 'closed');
    const result = ContainerTrait.onInteract(entity, 'take', {} as Entity, { item: 'Pizza' }, {} as any);
    expect(result.success).toBe(false);
  });

  it('allows put when open', () => {
    const entity = makeEntity([], 'open');
    const result = ContainerTrait.onInteract(entity, 'put', {} as Entity, { item: 'food_pizza' }, {} as any);
    expect(result.success).toBe(true);
  });

  it('has open, take, put capabilities', () => {
    expect(ContainerTrait.capabilities).toContain('open');
    expect(ContainerTrait.capabilities).toContain('take');
    expect(ContainerTrait.capabilities).toContain('put');
  });
});

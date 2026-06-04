import { describe, it, expect } from 'vitest';
import { TraitRegistry } from '../../src/core/trait-registry.js';
import { UsableTrait } from '../../src/plugins/core-life/traits/usable.js';
import { NeedProviderTrait } from '../../src/plugins/core-life/traits/need-provider.js';
import { ContainerTrait } from '../../src/plugins/core-life/traits/container.js';
import { BreakableTrait } from '../../src/plugins/core-life/traits/breakable.js';
import { CleanableTrait } from '../../src/plugins/core-life/traits/cleanable.js';

describe('TraitRegistry', () => {
  it('prioritizes need_provider over usable for "use" capability', () => {
    const registry = new TraitRegistry();
    registry.register(UsableTrait);
    registry.register(NeedProviderTrait);
    registry.register(ContainerTrait);

    const match = registry.findCapable('use', ['usable', 'need_provider']);
    expect(match).not.toBeNull();
    expect(match!.traitName).toBe('need_provider');
  });

  it('prioritizes need_provider over breakable and cleanable for "use"', () => {
    const registry = new TraitRegistry();
    registry.register(UsableTrait);
    registry.register(BreakableTrait);
    registry.register(CleanableTrait);
    registry.register(NeedProviderTrait);

    // Simulate Giường: [usable, cleanable, need_provider]
    const match1 = registry.findCapable('use', ['usable', 'cleanable', 'need_provider']);
    expect(match1!.traitName).toBe('need_provider');

    // Simulate TV: [usable, breakable, need_provider]
    const match2 = registry.findCapable('use', ['usable', 'breakable', 'need_provider']);
    expect(match2!.traitName).toBe('need_provider');
  });

  it('falls back to usable when it is the only match', () => {
    const registry = new TraitRegistry();
    registry.register(UsableTrait);

    const match = registry.findCapable('use', ['usable']);
    expect(match).not.toBeNull();
    expect(match!.traitName).toBe('usable');
  });

  it('finds container for container-specific actions', () => {
    const registry = new TraitRegistry();
    registry.register(UsableTrait);
    registry.register(ContainerTrait);

    const match = registry.findCapable('open', ['usable', 'container']);
    expect(match).not.toBeNull();
    expect(match!.traitName).toBe('container');
  });
});

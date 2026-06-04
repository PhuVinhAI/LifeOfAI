import { describe, it, expect } from 'vitest';
import { WorldImpl } from '../../src/core/ecs.js';
import { TraitRegistry } from '../../src/core/trait-registry.js';
import { CapabilityResolver } from '../../src/core/capability-resolver.js';
import { coreLifePlugin } from '../../src/plugins/core-life/index.js';
import { createNeeds } from '../../src/plugins/core-life/components/needs.js';
import { createIdentity } from '../../src/plugins/core-life/components/identity.js';
import { createPosition } from '../../src/plugins/core-life/components/position.js';
import { createObjectState } from '../../src/plugins/core-life/components/object-state.js';
import { selectGoal } from '../../src/ai/goal-selector.js';
import { buildSystemPrompt } from '../../src/ai/prompts/system.js';
import { TypedEventEmitter } from '../../src/core/event-bus.js';

describe('Agent Loop Integration', () => {
  it('builds system prompt with room description', () => {
    const world = new WorldImpl();
    const events = new TypedEventEmitter();

    // Register traits
    const registry = new TraitRegistry();
    for (const t of coreLifePlugin.traitDefs) {
      registry.register(t);
    }

    // Spawn some objects
    const resolver = new CapabilityResolver(registry);
    const state1 = createObjectState('Tủ lạnh', ['usable', 'container', 'breakable'], {
      usable: 'idle', container: 'closed', breakable: 'working',
    }, { container: { slots: 10, accepts: ['food', 'drink'] } });
    world.spawnEntity('obj_fridge', [createPosition(0, 0, 'room_01'), state1]);

    // Spawn agent
    const needs = createNeeds({ hunger: 75, thirst: 80, energy: 60, bladder: 70, hygiene: 85, fun: 40 });
    const identity = createIdentity('Minh', 25, 'Lập trình viên');
    const pos = createPosition(5, 4, 'room_01');
    world.spawnEntity('agent_1', [needs, identity, pos]);

    // Goal selection
    const goal = selectGoal(needs);
    expect(goal.goal).toBeDefined();
    expect(goal.urgency).toBeGreaterThan(0);

    // Room description
    const roomDesc = resolver.describeRoom(world);
    expect(roomDesc).toContain('Tủ lạnh');

    // System prompt builds without errors
    const prompt = buildSystemPrompt(identity, needs, roomDesc, 0);
    expect(prompt).toContain('Minh');
    expect(prompt).toContain('Tủ lạnh');
  });

  it('resolves interactions through capability resolver', () => {
    const registry = new TraitRegistry();
    for (const t of coreLifePlugin.traitDefs) {
      registry.register(t);
    }

    const world = new WorldImpl();
    const state = createObjectState('Tủ lạnh', ['usable', 'container', 'breakable'], {
      usable: 'idle', container: 'closed', breakable: 'working',
    });
    world.spawnEntity('obj_fridge', [createPosition(0, 0, 'room_01'), state]);
    world.spawnEntity('agent_1', [createNeeds(), createIdentity('Test', 20, ''), createPosition(0, 0, 'room_01')]);

    const resolver = new CapabilityResolver(registry);
    const agent = world.getEntity('agent_1')!;

    // Open fridge
    const result = resolver.resolve('Tủ lạnh', 'open', agent, {}, world);
    expect(result.success).toBe(true);
    expect(result.message).toContain('Mở');
  });

  it('returns error for unknown object', () => {
    const registry = new TraitRegistry();
    const world = new WorldImpl();
    world.spawnEntity('agent_1', [createNeeds(), createIdentity('Test', 20, ''), createPosition(0, 0, 'room_01')]);

    const resolver = new CapabilityResolver(registry);
    const agent = world.getEntity('agent_1')!;

    const result = resolver.resolve('Máy bay', 'use', agent, {}, world);
    expect(result.success).toBe(false);
    expect(result.message).toContain('Không tìm thấy');
  });
});

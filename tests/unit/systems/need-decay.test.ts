import { describe, it, expect } from 'vitest';
import { needDecaySystem } from '../../../src/plugins/core-life/systems/need-decay.js';
import { WorldImpl } from '../../../src/core/ecs.js';
import { createNeeds } from '../../../src/plugins/core-life/components/needs.js';
import { TypedEventEmitter } from '../../../src/core/event-bus.js';

describe('needDecaySystem', () => {
  it('decreases all needs each tick', () => {
    const world = new WorldImpl();
    const events = new TypedEventEmitter();
    world.spawnEntity('agent_1', [createNeeds({ hunger: 80, thirst: 80, energy: 80, bladder: 80, hygiene: 80, fun: 80 })]);

    needDecaySystem(world, 1, events);

    const agent = world.getEntity('agent_1');
    const needs = agent?.components.get('needs') as any;
    expect(needs.hunger).toBeLessThan(80);
    expect(needs.thirst).toBeLessThan(80);
    expect(needs.energy).toBeLessThan(80);
    expect(needs.bladder).toBeLessThan(80);
    expect(needs.hygiene).toBeLessThan(80);
    expect(needs.fun).toBeLessThan(80);
  });

  it('does not go below 0', () => {
    const world = new WorldImpl();
    const events = new TypedEventEmitter();
    world.spawnEntity('agent_1', [createNeeds({ hunger: 0.1, thirst: 0.1, energy: 0.1, bladder: 0.1, hygiene: 0.1, fun: 0.1 })]);

    needDecaySystem(world, 1, events);

    const agent = world.getEntity('agent_1');
    const needs = agent?.components.get('needs') as any;
    expect(needs.hunger).toBe(0);
    expect(needs.thirst).toBe(0);
  });

  it('emits critical event when need drops below threshold', () => {
    const world = new WorldImpl();
    const events = new TypedEventEmitter();
    const criticals: string[] = [];
    events.on('needs:critical', (_agent, need) => criticals.push(need));

    // Set hunger just above critical threshold (20)
    world.spawnEntity('agent_1', [createNeeds({ hunger: 20.5, thirst: 80, energy: 80, bladder: 80, hygiene: 80, fun: 80 })]);

    needDecaySystem(world, 1, events);

    // Hunger dropped from 20.5 to ~20 (decay 0.5), so it crosses below 20
    expect(criticals.length).toBeGreaterThan(0);
    expect(criticals).toContain('hunger');
  });
});

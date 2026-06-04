import { describe, it, expect } from 'vitest';
import { selectGoal } from '../../../src/ai/goal-selector.js';
import { createNeeds } from '../../../src/plugins/core-life/components/needs.js';

describe('selectGoal', () => {
  it('selects hunger when starving', () => {
    const needs = createNeeds({ hunger: 10, thirst: 80, energy: 80, bladder: 80, hygiene: 80, fun: 80 });
    const goal = selectGoal(needs);
    expect(goal.goal).toBe('satisfy_hunger');
    expect(goal.urgency).toBeGreaterThan(50);
  });

  it('selects bladder when urgent', () => {
    const needs = createNeeds({ hunger: 90, thirst: 90, energy: 90, bladder: 5, hygiene: 90, fun: 90 });
    const goal = selectGoal(needs);
    expect(goal.goal).toBe('relieve_bladder');
  });

  it('selects fun when all needs satisfied', () => {
    const needs = createNeeds({ hunger: 100, thirst: 100, energy: 100, bladder: 100, hygiene: 100, fun: 100 });
    const goal = selectGoal(needs);
    expect(goal.goal).toBe('have_fun');
    expect(goal.urgency).toBe(0);
  });

  it('returns Vietnamese label', () => {
    const needs = createNeeds({ hunger: 10, thirst: 80, energy: 80, bladder: 80, hygiene: 80, fun: 80 });
    const goal = selectGoal(needs);
    expect(goal.label).toBe('Ăn uống');
  });
});

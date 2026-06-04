import type { Component } from '../../../types/index.js';

export interface Needs extends Component {
  type: 'needs';
  hunger: number;
  thirst: number;
  energy: number;
  bladder: number;
  hygiene: number;
  fun: number;
}

export const DEFAULT_NEEDS: Omit<Needs, 'type'> = {
  hunger: 80,
  thirst: 80,
  energy: 80,
  bladder: 80,
  hygiene: 80,
  fun: 80,
};

export function createNeeds(overrides?: Partial<Omit<Needs, 'type'>>): Needs {
  return { type: 'needs', ...DEFAULT_NEEDS, ...overrides };
}

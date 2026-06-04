import type { Component, FSMState } from '../../../types/index.js';

export interface ObjectState extends Component {
  type: 'object_state';
  objectName: string;
  traits: Record<string, FSMState>;       // traitName → current FSM state
  traitConfig?: Record<string, Record<string, unknown>>;  // per-trait config values
  containerData?: { items: Array<{ name: string; quantity: number }> };
}

export function createObjectState(
  objectName: string,
  traitNames: string[],
  initialStateMap: Record<string, string>,
  traitConfig?: Record<string, Record<string, unknown>>
): ObjectState {
  const traits: Record<string, string> = {};
  for (const t of traitNames) {
    traits[t] = initialStateMap[t] ?? 'idle';
  }
  return { type: 'object_state', objectName, traits, traitConfig };
}

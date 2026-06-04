import type { Component } from '../../../types/index.js';

export interface GoalData {
  description: string;
  createdAt: number;   // Date.now()
  completedAt?: number;
  abandonedAt?: number;
}

export interface GoalComponent extends Component {
  type: 'goal';
  current: GoalData | null;
  history: GoalData[];
}

export function createGoalComponent(): GoalComponent {
  return { type: 'goal', current: null, history: [] };
}

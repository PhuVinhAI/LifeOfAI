import type { Needs } from '../plugins/core-life/components/needs.js';

export interface GoalResult {
  goal: string;         // goal ID
  label: string;        // human-readable in Vietnamese
  urgency: number;      // 0-100
}

// Urgency weights: how much each need contributes to urgency when low
const NEED_IMPORTANCE: Record<keyof Omit<Needs, 'type'>, number> = {
  hunger: 1.2,
  bladder: 1.0,
  energy: 0.9,
  thirst: 0.8,
  hygiene: 0.6,
  fun: 0.4,
};

const GOAL_MAP: Record<string, string> = {
  hunger: 'satisfy_hunger',
  thirst: 'satisfy_thirst',
  energy: 'rest',
  bladder: 'relieve_bladder',
  hygiene: 'clean_self',
  fun: 'have_fun',
};

const GOAL_LABELS: Record<string, string> = {
  satisfy_hunger: 'Ăn uống',
  satisfy_thirst: 'Uống nước',
  rest: 'Nghỉ ngơi',
  relieve_bladder: 'Đi vệ sinh',
  clean_self: 'Tắm rửa',
  have_fun: 'Giải trí',
};

/**
 * Select the highest urgency goal based on current needs.
 * Returns null if all needs are satisfied (no urgency > 0).
 */
export function selectGoal(needs: Needs): GoalResult {
  let bestGoal = 'have_fun';
  let bestUrgency = 0;
  let bestLabel = GOAL_LABELS['have_fun']!;

  for (const [needKey, importance] of Object.entries(NEED_IMPORTANCE) as [keyof Omit<Needs, 'type'>, number][]) {
    const currentValue = needs[needKey];
    // Urgency = how low the need is (0 = emergency, 100 = satisfied)
    // Scale: 0 → urgency 100, 100 → urgency 0
    const urgency = Math.round((100 - currentValue) * importance);
    if (urgency > bestUrgency) {
      bestUrgency = urgency;
      bestGoal = GOAL_MAP[needKey] ?? 'have_fun';
      bestLabel = GOAL_LABELS[bestGoal] ?? 'Giải trí';
    }
  }

  return { goal: bestGoal, label: bestLabel, urgency: Math.min(100, bestUrgency) };
}

export function getGoalLabel(goal: string): string {
  return GOAL_LABELS[goal] ?? goal;
}

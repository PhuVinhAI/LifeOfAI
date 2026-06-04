import type { Component } from '../../../types/index.js';

export type TaskStatus = 'pending' | 'in_progress' | 'done';

export interface Task {
  description: string;
  status: TaskStatus;
  createdAt: number;
  completedAt?: number;
}

export interface TaskListComponent extends Component {
  type: 'task_list';
  tasks: Task[];
}

export function createTaskListComponent(): TaskListComponent {
  return { type: 'task_list', tasks: [] };
}

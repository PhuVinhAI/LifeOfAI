import { zodFunction } from 'openai/helpers/zod';
import { z } from 'zod/v4';
import type { World } from '../../types/index.js';
import type { TaskListComponent, Task, TaskStatus } from '../../plugins/core-life/components/task-list.js';

function getTaskList(world: World, agentId: string): TaskListComponent | undefined {
  return world.getEntity(agentId)?.components.get('task_list') as TaskListComponent | undefined;
}

export function createAddTaskTool(world: World, agentId: string) {
  return zodFunction({
    name: 'add_task',
    description: 'Thêm một việc cần làm vào danh sách công việc. Dùng khi bạn muốn lên kế hoạch nhiều bước (vd: nấu ăn cần: 1. lấy đồ 2. nấu 3. dọn). Không bắt buộc.',
    parameters: z.object({
      task: z.string().describe('Mô tả công việc cần làm, ngắn gọn bằng tiếng Việt.'),
    }),
    function: async (input) => {
      const tl = getTaskList(world, agentId);
      if (!tl) return { success: false, message: 'Không tìm thấy task list.' };
      const newTask: Task = { description: input.task, status: 'pending', createdAt: Date.now() };
      tl.tasks.push(newTask);
      return { success: true, message: `Đã thêm việc: "${input.task}". Tổng: ${tl.tasks.length} việc.` };
    },
  });
}

export function createStartTaskTool(world: World, agentId: string) {
  return zodFunction({
    name: 'start_task',
    description: 'Bắt đầu làm một việc trong danh sách. Đánh dấu việc đó là đang làm.',
    parameters: z.object({
      task: z.string().describe('Tên hoặc một phần tên của việc muốn bắt đầu.'),
    }),
    function: async (input) => {
      const tl = getTaskList(world, agentId);
      if (!tl) return { success: false, message: 'Không tìm thấy task list.' };
      const found = tl.tasks.find(t => t.description.includes(input.task) && t.status === 'pending');
      if (!found) return { success: false, message: `Không tìm thấy việc "${input.task}" đang chờ.` };
      found.status = 'in_progress';
      return { success: true, message: `Bắt đầu làm: "${found.description}".` };
    },
  });
}

export function createCompleteTaskTool(world: World, agentId: string) {
  return zodFunction({
    name: 'complete_task',
    description: 'Đánh dấu một việc đã hoàn thành.',
    parameters: z.object({
      task: z.string().describe('Tên hoặc một phần tên của việc đã làm xong.'),
    }),
    function: async (input) => {
      const tl = getTaskList(world, agentId);
      if (!tl) return { success: false, message: 'Không tìm thấy task list.' };
      const found = tl.tasks.find(t => t.description.includes(input.task) && t.status !== 'done');
      if (!found) return { success: false, message: `Không tìm thấy việc "${input.task}" đang làm/dở.` };
      found.status = 'done';
      found.completedAt = Date.now();
      // Remove done tasks older than N to keep list clean
      const doneTasks = tl.tasks.filter(t => t.status === 'done');
      if (doneTasks.length > 10) {
        const oldest = doneTasks.sort((a, b) => (a.completedAt ?? 0) - (b.completedAt ?? 0));
        tl.tasks = tl.tasks.filter(t => !oldest.slice(0, oldest.length - 10).includes(t));
      }
      return { success: true, message: `Đã hoàn thành: "${found.description}".` };
    },
  });
}

export function createListTasksTool(world: World, agentId: string) {
  return zodFunction({
    name: 'list_tasks',
    description: 'Xem danh sách công việc hiện tại.',
    parameters: z.object({}),
    function: async () => {
      const tl = getTaskList(world, agentId);
      if (!tl) return { success: false, message: 'Không tìm thấy task list.' };
      if (tl.tasks.length === 0) return { success: true, message: 'Danh sách công việc trống.' };
      const statusLabel: Record<TaskStatus, string> = { pending: '⏳', in_progress: '▶', done: '✓' };
      const lines = tl.tasks.map(t => `${statusLabel[t.status]} ${t.description}`);
      return { success: true, message: `Danh sách công việc:\n${lines.join('\n')}` };
    },
  });
}

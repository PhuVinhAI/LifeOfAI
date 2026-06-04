import { zodFunction } from 'openai/helpers/zod';
import { z } from 'zod/v4';
import type { World } from '../../types/index.js';
import type { GoalComponent } from '../../plugins/core-life/components/goal.js';

function getGoal(world: World, agentId: string): GoalComponent | undefined {
  return world.getEntity(agentId)?.components.get('goal') as GoalComponent | undefined;
}

export function createSetGoalTool(world: World, agentId: string) {
  return zodFunction({
    name: 'set_goal',
    description: 'Đặt mục tiêu hiện tại bạn muốn làm. Dùng khi bạn quyết định theo đuổi một việc cụ thể (vd: "nấu và ăn bữa trưa", "dọn dẹp phòng", "đi ngủ"). Không bắt buộc — chỉ dùng khi bạn muốn ghi nhớ mục tiêu.',
    parameters: z.object({
      goal: z.string().describe('Mục tiêu bạn muốn đặt ra, mô tả ngắn gọn bằng tiếng Việt.'),
    }),
    function: async (input) => {
      const g = getGoal(world, agentId);
      if (!g) return { success: false, message: 'Không tìm thấy goal component.' };
      const goalData = { description: input.goal, createdAt: Date.now() };
      // Move current to history if exists
      if (g.current) g.history.push(g.current);
      g.current = goalData;
      return { success: true, message: `Đã đặt mục tiêu: "${input.goal}".` };
    },
  });
}

export function createCompleteGoalTool(world: World, agentId: string) {
  return zodFunction({
    name: 'complete_goal',
    description: 'Đánh dấu mục tiêu hiện tại đã hoàn thành. Dùng khi bạn đã làm xong việc mình đặt ra.',
    parameters: z.object({}),
    function: async () => {
      const g = getGoal(world, agentId);
      if (!g) return { success: false, message: 'Không tìm thấy goal component.' };
      if (!g.current) return { success: false, message: 'Không có mục tiêu nào đang active.' };
      g.current.completedAt = Date.now();
      g.history.push(g.current);
      const done = g.current;
      g.current = null;
      return { success: true, message: `Đã hoàn thành mục tiêu: "${done.description}".` };
    },
  });
}

export function createAbandonGoalTool(world: World, agentId: string) {
  return zodFunction({
    name: 'abandon_goal',
    description: 'Từ bỏ mục tiêu hiện tại vì lý do nào đó (có việc gấp hơn, đổi ý...). Mục tiêu sẽ được lưu vào lịch sử.',
    parameters: z.object({
      reason: z.string().nullable().describe('Lý do từ bỏ mục tiêu (tùy chọn).'),
    }),
    function: async (input) => {
      const g = getGoal(world, agentId);
      if (!g) return { success: false, message: 'Không tìm thấy goal component.' };
      if (!g.current) return { success: false, message: 'Không có mục tiêu nào đang active.' };
      g.current.abandonedAt = Date.now();
      g.history.push(g.current);
      const dropped = g.current;
      g.current = null;
      const reason = input.reason ? ` Lý do: ${input.reason}` : '';
      return { success: true, message: `Đã từ bỏ mục tiêu: "${dropped.description}".${reason}` };
    },
  });
}

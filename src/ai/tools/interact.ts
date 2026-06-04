import { zodFunction } from 'openai/helpers/zod';
import { z } from 'zod/v4';
import type { World } from '../../types/index.js';
import { CapabilityResolver } from '../../core/capability-resolver.js';

export const InteractParams = z.object({
  object: z.string().describe('Tên đồ vật muốn tương tác (ví dụ: "Tủ lạnh", "Toilet", "Giường")'),
  action: z.string().describe('Hành động muốn thực hiện. Khả dụng: use, open, close, take, put, clean, repair'),
  item: z.string().nullable().describe('Tên món đồ cụ thể khi cần (chỉ dùng cho action take/put, ví dụ: "Pizza"). Để null nếu không cần.'),
});

export function createInteractTool(resolver: CapabilityResolver, world: World, agentId: string) {
  return zodFunction({
    name: 'interact',
    description:
      'Tương tác với đồ vật trong phòng. Dùng để sử dụng (use), mở/đóng (open/close), lấy/để đồ (take/put), dọn dẹp (clean), sửa chữa (repair).',
    parameters: InteractParams,
    function: async (input) => {
      const agent = world.getEntity(agentId);
      if (!agent) return { success: false, message: 'Agent không tồn tại.' };

      const params = input.item ? { item: input.item } : undefined;
      const result = resolver.resolve(input.object, input.action, agent, params, world);
      return result;
    },
  });
}

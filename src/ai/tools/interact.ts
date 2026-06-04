import { zodFunction } from 'openai/helpers/zod';
import { z } from 'zod/v4';
import type { World } from '../../types/index.js';
import { CapabilityResolver } from '../../core/capability-resolver.js';

export const InteractParams = z.object({
  object: z.string().describe('Tên đồ vật muốn tương tác'),
  action: z.string().describe('Hành động muốn thực hiện (use, open, take, put, clean, repair, close, eat, drink)'),
  params: z.record(z.string(), z.unknown()).optional().describe('Tham số bổ sung (ví dụ: {item: "Pizza"})'),
});

export function createInteractTool(resolver: CapabilityResolver, world: World, agentId: string) {
  return zodFunction({
    name: 'interact',
    description:
      'Tương tác với đồ vật trong phòng. Dùng để sử dụng, mở, lấy đồ, dọn dẹp, sửa chữa đồ vật.',
    parameters: InteractParams,
    function: async (input) => {
      const agent = world.getEntity(agentId);
      if (!agent) return { success: false, message: 'Agent không tồn tại.' };

      const result = resolver.resolve(input.object, input.action, agent, input.params ?? {}, world);
      return result;
    },
  });
}

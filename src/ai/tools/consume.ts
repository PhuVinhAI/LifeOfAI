import { zodFunction } from 'openai/helpers/zod';
import { z } from 'zod/v4';
import type { World } from '../../types/index.js';
import type { Needs } from '../../plugins/core-life/components/needs.js';
import type { Inventory } from '../../plugins/core-life/components/inventory.js';

export const ConsumeParams = z.object({
  item: z.string().describe('Tên món ăn/đồ uống muốn tiêu thụ (phải có trong túi đồ).'),
});

export function createConsumeTool(world: World, agentId: string) {
  return zodFunction({
    name: 'consume',
    description: 'Ăn hoặc uống một món đồ đang có trong túi đồ. Restore need tương ứng (đói/khát).',
    parameters: ConsumeParams,
    function: async (input) => {
      const agent = world.getEntity(agentId);
      if (!agent) return { success: false, message: 'Agent không tồn tại.' };

      const inv = agent.components.get('inventory') as Inventory | undefined;
      const needs = agent.components.get('needs') as Needs | undefined;
      if (!inv || !needs) return { success: false, message: 'Thiếu inventory hoặc needs.' };

      const idx = inv.items.findIndex(i => i.name === input.item);
      if (idx === -1) {
        const have = inv.items.map(i => `${i.name} (x${i.quantity})`).join(', ') || 'trống';
        return { success: false, message: `Không có "${input.item}" trong túi. Túi đồ: ${have}.` };
      }

      const item = inv.items[idx]!;
      if (item.type !== 'food' && item.type !== 'drink') {
        return { success: false, message: `"${input.item}" không thể ăn/uống được.` };
      }

      // Apply need restoration
      if (item.needRestore) {
        const key = item.needRestore.need as keyof Omit<Needs, 'type'>;
        if (key in needs) {
          const oldVal = needs[key];
          (needs as any)[key] = Math.min(100, oldVal + item.needRestore.value);
        }
      }

      // Consume one
      item.quantity--;
      if (item.quantity <= 0) inv.items.splice(idx, 1);

      const verb = item.type === 'food' ? 'ăn' : 'uống';
      const duration = item.type === 'food' ? 20 : 10;
      return {
        success: true,
        message: `Đã ${verb} ${input.item}. ${item.type === 'food' ? 'Đỡ đói hơn' : 'Đỡ khát hơn'}.`,
        duration,
      };
    },
  });
}

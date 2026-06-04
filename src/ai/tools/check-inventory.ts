import { zodFunction } from 'openai/helpers/zod';
import { z } from 'zod/v4';
import type { World } from '../../types/index.js';
import type { Inventory } from '../../plugins/core-life/components/inventory.js';

export function createCheckInventoryTool(world: World, agentId: string) {
  return zodFunction({
    name: 'check_inventory',
    description: 'Xem những món đồ đang có trong túi đồ.',
    parameters: z.object({}),
    function: async () => {
      const agent = world.getEntity(agentId);
      if (!agent) return { error: 'Agent không tồn tại.' };

      const inv = agent.components.get('inventory') as Inventory | undefined;
      if (!inv) return { items: [], message: 'Không có inventory.' };

      if (inv.items.length === 0) {
        return { items: [], message: 'Túi đồ trống.' };
      }

      return {
        items: inv.items.map(i => ({
          name: i.name,
          quantity: i.quantity,
          type: i.type,
          ...(i.needRestore && { restore: i.needRestore }),
        })),
        capacity: `${inv.items.length}/${inv.capacity}`,
      };
    },
  });
}

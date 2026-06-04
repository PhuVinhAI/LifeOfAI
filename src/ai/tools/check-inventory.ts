import { zodFunction } from 'openai/helpers/zod';
import { z } from 'zod/v4';
import type { World } from '../../types/index.js';
import type { Inventory } from '../../plugins/core-life/components/inventory.js';

interface TurnContext {
  getElapsedMinutes: () => number;
}

const CACHE_WINDOW_MIN = 5;
const lastCall = new Map<string, number>();

export function createCheckInventoryTool(world: World, agentId: string, ctx?: TurnContext) {
  return zodFunction({
    name: 'check_inventory',
    description: 'Xem những món đồ đang có trong túi đồ.',
    parameters: z.object({}),
    function: async () => {
      const agent = world.getEntity(agentId);
      if (!agent) return { error: 'Agent không tồn tại.' };

      const inv = agent.components.get('inventory') as Inventory | undefined;
      if (!inv) return { items: [], message: 'Không có inventory.' };

      const elapsed = ctx?.getElapsedMinutes?.() ?? 0;
      const prev = lastCall.get(agentId);
      const veryRecent = prev !== undefined && elapsed - prev < CACHE_WINDOW_MIN;
      lastCall.set(agentId, elapsed);

      if (inv.items.length === 0) {
        return {
          items: [],
          message: veryRecent ? 'Túi đồ vẫn trống (vừa kiểm tra).' : 'Túi đồ trống.',
        };
      }

      return {
        message: veryRecent ? 'Túi đồ (vừa kiểm tra):' : undefined,
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

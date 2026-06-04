import { zodFunction } from 'openai/helpers/zod';
import { z } from 'zod/v4';
import type { World } from '../../types/index.js';
import { CapabilityResolver } from '../../core/capability-resolver.js';

export function createLookAroundTool(resolver: CapabilityResolver, world: World, agentId: string) {
  return zodFunction({
    name: 'look_around',
    description: 'Quan sát căn phòng, xem có những đồ vật gì và vị trí của chúng.',
    parameters: z.object({}),
    function: async () => {
      const agent = world.getEntity(agentId);
      const posComp = agent?.components.get('position');
      const posAny = posComp as any;
      const agentPos = posComp && posComp.type === 'position'
        ? { x: posAny.x, y: posAny.y }
        : undefined;

      const description = resolver.describeRoom(world, agentPos);
      return { objects: description || 'Không thấy gì trong phòng.' };
    },
  });
}

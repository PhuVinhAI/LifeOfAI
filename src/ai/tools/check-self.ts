import { zodFunction } from 'openai/helpers/zod';
import { z } from 'zod/v4';
import type { World } from '../../types/index.js';
import type { Needs } from '../../plugins/core-life/components/needs.js';
import { getNeedLabel } from '../../plugins/core-life/systems/need-decay.js';

export function createCheckSelfTool(world: World, agentId: string) {
  return zodFunction({
    name: 'check_self',
    description: 'Kiểm tra tình trạng cơ thể hiện tại (đói, khát, năng lượng, vệ sinh, giải trí).',
    parameters: z.object({}),
    function: async () => {
      const agent = world.getEntity(agentId);
      if (!agent) return { error: 'Agent không tồn tại.' };

      const needs = agent.components.get('needs') as Needs | undefined;
      if (!needs) return { error: 'Không có dữ liệu chỉ số.' };

      const status: Record<string, number> = {};
      for (const key of ['hunger', 'thirst', 'energy', 'bladder', 'hygiene', 'fun'] as const) {
        status[getNeedLabel(key)] = Math.round(needs[key]);
      }
      return status;
    },
  });
}

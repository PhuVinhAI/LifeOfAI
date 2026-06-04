import { zodFunction } from 'openai/helpers/zod';
import { z } from 'zod/v4';
import type { World } from '../../types/index.js';
import type { Needs } from '../../plugins/core-life/components/needs.js';
import { getNeedLabel } from '../../plugins/core-life/systems/need-decay.js';

function describeLevel(value: number): string {
  if (value >= 80) return 'tốt';
  if (value >= 60) return 'hơi kém';
  if (value >= 40) return 'cần chú ý';
  if (value >= 20) return 'tệ';
  return 'rất tệ, cần giải quyết gấp';
}

export function createCheckSelfTool(world: World, agentId: string) {
  return zodFunction({
    name: 'check_self',
    description: 'Cảm nhận tình trạng cơ thể hiện tại. Kết quả trả về bằng mô tả tự nhiên, không phải con số.',
    parameters: z.object({}),
    function: async () => {
      const agent = world.getEntity(agentId);
      if (!agent) return { error: 'Agent không tồn tại.' };

      const needs = agent.components.get('needs') as Needs | undefined;
      if (!needs) return { error: 'Không có dữ liệu chỉ số.' };

      const status: Record<string, string> = {};
      for (const key of ['hunger', 'thirst', 'energy', 'bladder', 'hygiene', 'fun'] as const) {
        status[getNeedLabel(key)] = describeLevel(needs[key]);
      }
      return { message: 'Cảm nhận cơ thể hiện tại:', status };
    },
  });
}

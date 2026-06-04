import type { World } from '../../types/index.js';
import { CapabilityResolver } from '../../core/capability-resolver.js';
import { createInteractTool } from './interact.js';
import { createLookAroundTool } from './look-around.js';
import { createCheckSelfTool } from './check-self.js';
import { createConsumeTool } from './consume.js';
import { createCheckInventoryTool } from './check-inventory.js';
import { createSetGoalTool, createCompleteGoalTool } from './goals.js';
import { createAddTaskTool, createCompleteTaskTool, createListTasksTool } from './tasks.js';

export function createToolRegistry(
  resolver: CapabilityResolver,
  world: World,
  agentId: string
) {
  return [
    createInteractTool(resolver, world, agentId),
    createLookAroundTool(resolver, world, agentId),
    createCheckSelfTool(world, agentId),
    createConsumeTool(world, agentId),
    createCheckInventoryTool(world, agentId),
    createSetGoalTool(world, agentId),
    createCompleteGoalTool(world, agentId),
    createAddTaskTool(world, agentId),
    createCompleteTaskTool(world, agentId),
    createListTasksTool(world, agentId),
  ] as any;
}

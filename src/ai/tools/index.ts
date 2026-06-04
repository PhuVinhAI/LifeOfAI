import type { World } from '../../types/index.js';
import { CapabilityResolver } from '../../core/capability-resolver.js';
import { createInteractTool } from './interact.js';
import { createLookAroundTool } from './look-around.js';
import { createCheckSelfTool } from './check-self.js';
import { createConsumeTool } from './consume.js';
import { createCheckInventoryTool } from './check-inventory.js';
import { createSetGoalTool, createCompleteGoalTool } from './goals.js';
import { createAddTaskTool, createCompleteTaskTool, createListTasksTool } from './tasks.js';

export interface ToolContext {
  /** Total minutes elapsed since the start of the world (used by cache-aware tools). */
  getElapsedMinutes: () => number;
}

export function createToolRegistry(
  resolver: CapabilityResolver,
  world: World,
  agentId: string,
  ctx?: ToolContext
) {
  return [
    createInteractTool(resolver, world, agentId),
    createLookAroundTool(resolver, world, agentId),
    createCheckSelfTool(world, agentId, ctx),
    createConsumeTool(world, agentId),
    createCheckInventoryTool(world, agentId, ctx),
    createSetGoalTool(world, agentId),
    createCompleteGoalTool(world, agentId),
    createAddTaskTool(world, agentId),
    createCompleteTaskTool(world, agentId),
    createListTasksTool(world, agentId),
  ] as any;
}

import type { World } from '../../types/index.js';
import { CapabilityResolver } from '../../core/capability-resolver.js';
import { createInteractTool } from './interact.js';
import { createLookAroundTool } from './look-around.js';
import { createCheckSelfTool } from './check-self.js';

export function createToolRegistry(
  resolver: CapabilityResolver,
  world: World,
  agentId: string
) {
  return [
    createInteractTool(resolver, world, agentId),
    createLookAroundTool(resolver, world, agentId),
    createCheckSelfTool(world, agentId),
  ] as any; // openai SDK zodFunction types are complex — cast for MVP
}

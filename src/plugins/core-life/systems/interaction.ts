import type { World, IEventBus } from '../../../types/index.js';
import type { Needs } from '../components/needs.js';

/**
 * Interaction system — processes queued interactions each tick.
 * In MVP, most interactions are handled synchronously via the CapabilityResolver
 * inside the agent loop. This system handles post-interaction effects.
 */
export function interactionSystem(world: World, _delta: number, events: IEventBus): void {
  // Tick all traits on all object entities
  const objects = world.query(['object_state']);
  for (const obj of objects) {
    const os = obj.components.get('object_state');
    if (!os || os.type !== 'object_state') continue;

    // Apply trait tick logic
    // In MVP, this is handled by TraitRegistry.tickEntity called from the agent loop.
    // This system is a placeholder for future expansion (e.g., queued interactions).
  }
}

/**
 * Apply need effects from an interaction result.
 */
export function applyEffects(
  world: World,
  effects: Array<{ entityId: string; component: string; changes: Record<string, number> }>
): void {
  for (const effect of effects) {
    const entity = world.getEntity(effect.entityId);
    if (!entity) continue;

    if (effect.component === 'needs') {
      const needs = entity.components.get('needs') as Needs | undefined;
      if (!needs) continue;
      for (const [key, value] of Object.entries(effect.changes)) {
        if (key in needs) {
          (needs as any)[key] = Math.min(100, Math.max(0, (needs as any)[key] + value));
        }
      }
    }
  }
}

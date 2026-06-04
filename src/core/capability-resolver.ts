import type { World, Entity, InteractionResult } from '../types/index.js';
import type { TraitRegistry } from './trait-registry.js';
import type { ObjectState } from '../plugins/core-life/components/object-state.js';

export class CapabilityResolver {
  constructor(private registry: TraitRegistry) {}

  /**
   * Resolve and execute an interaction.
   * AI calls: interact("fridge", "open")
   * → find fridge entity → get its traits → find trait with "open" capability → execute
   */
  resolve(
    objectName: string,
    action: string,
    user: Entity,
    params: Record<string, unknown> | undefined,
    world: World
  ): InteractionResult {
    // Find the target object entity by name
    const target = this.findObjectByName(world, objectName);
    if (!target) {
      return { success: false, message: `Không tìm thấy "${objectName}" trong phòng.` };
    }

    const objectState = target.components.get('object_state') as ObjectState | undefined;
    if (!objectState) {
      return { success: false, message: `"${objectName}" không thể tương tác.` };
    }

    const traitNames = Object.keys(objectState.traits);
    if (traitNames.length === 0) {
      return { success: false, message: `"${objectName}" không có khả năng tương tác.` };
    }

    // Find a trait that supports this action
    const match = this.registry.findCapable(action, traitNames);
    if (!match) {
      const allCapabilities = traitNames
        .flatMap(n => this.registry.get(n)?.capabilities ?? []);
      return {
        success: false,
        message: `"${objectName}" không hỗ trợ hành động "${action}". Khả dụng: ${[...new Set(allCapabilities)].join(', ')}.`,
      };
    }

    // Execute the interaction through the trait
    const result = this.registry.executeInteraction(match.traitName, target, action, user, params, world);

    // Transition FSM state based on result
    if (result.success) {
      const fsm = match.trait;
      const currentState = objectState.traits[match.traitName] ?? fsm.initialState;
      const transitions = fsm.transitions[currentState];
      if (transitions?.[action]) {
        objectState.traits[match.traitName] = transitions[action]!;
      }
    }

    return result;
  }

  /**
   * Get a description of all objects with their capabilities — used to build AI context.
   */
  describeRoom(world: World, agentPos?: { x: number; y: number }): string {
    const objects = world.query(['object_state', 'position']);
    return objects
      .map(e => {
        const os = e.components.get('object_state') as ObjectState | undefined;
        const pos = e.components.get('position');
        if (!os || !pos || pos.type !== 'position') return null;
        const posComp = pos as any as { x: number; y: number };
        const capabilities = Object.keys(os.traits)
          .flatMap(t => this.registry.get(t)?.capabilities ?? []);
        const uniqueCaps = [...new Set(capabilities)];
        const traitStates = Object.entries(os.traits)
          .map(([t, s]) => `${t}:${s}`).join(', ');
        return `- ${os.objectName} (id: ${e.id}) tại (${posComp.x},${posComp.y}) [${traitStates}] — có thể: ${uniqueCaps.join(', ')}`;
      })
      .filter(Boolean)
      .join('\n');
  }

  private findObjectByName(world: World, name: string): Entity | undefined {
    const objects = world.query(['object_state']);
    return objects.find(e => {
      const os = e.components.get('object_state') as ObjectState | undefined;
      return os?.objectName === name;
    });
  }
}

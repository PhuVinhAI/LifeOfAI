import type { TraitDefinition, Entity, World, InteractionResult } from '../types/index.js';

export class TraitRegistry {
  private traits = new Map<string, TraitDefinition>();

  register(trait: TraitDefinition): void {
    if (this.traits.has(trait.name)) {
      throw new Error(`Trait "${trait.name}" is already registered`);
    }
    this.traits.set(trait.name, trait);
  }

  get(name: string): TraitDefinition | undefined {
    return this.traits.get(name);
  }

  getAll(): TraitDefinition[] {
    return Array.from(this.traits.values());
  }

  /**
   * Find a trait that supports the given capability.
   * Returns the FIRST trait that lists the action in its capabilities.
   */
  findCapable(action: string, traitNames: string[]): { trait: TraitDefinition; traitName: string } | null {
    for (const name of traitNames) {
      const trait = this.traits.get(name);
      if (trait && trait.capabilities.includes(action)) {
        return { trait, traitName: name };
      }
    }
    return null;
  }

  /**
   * Apply trait's onInteract — used by capability resolver.
   */
  executeInteraction(
    traitName: string,
    entity: Entity,
    action: string,
    user: Entity,
    params: Record<string, unknown> | undefined,
    world: World
  ): InteractionResult {
    const trait = this.traits.get(traitName);
    if (!trait) {
      return { success: false, message: `Trait "${traitName}" not found.` };
    }
    return trait.onInteract(entity, action, user, params, world);
  }

  /**
   * Tick all traits on an entity.
   */
  tickEntity(entity: Entity, world: World, delta: number): void {
    const comp = entity.components.get('object_state');
    if (!comp || comp.type !== 'object_state') return;
    const objectState = comp as any as { traits: Record<string, string> };

    for (const traitName of Object.keys(objectState.traits)) {
      const trait = this.traits.get(traitName);
      if (trait?.tick) {
        trait.tick(entity, world, delta);
      }
    }
  }
}

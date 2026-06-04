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
   * Priority: need_provider > other specific traits > usable (generic fallback).
   * need_provider must always win for "use" since it's the only trait that modifies agent needs.
   */
  findCapable(action: string, traitNames: string[]): { trait: TraitDefinition; traitName: string } | null {
    const matches: { trait: TraitDefinition; traitName: string }[] = [];
    for (const name of traitNames) {
      const trait = this.traits.get(name);
      if (trait && trait.capabilities.includes(action)) {
        matches.push({ trait, traitName: name });
      }
    }
    if (matches.length === 0) return null;
    const needProvider = matches.find(m => m.traitName === 'need_provider');
    if (needProvider) return needProvider;
    const specific = matches.find(m => m.traitName !== 'usable');
    return specific ?? matches[0]!;
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

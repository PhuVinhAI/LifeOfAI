import type { World, Entity, Component } from '../types/index.js';

// Simple ECS World implementation — can swap to sim-ecs later if needed.
// MVP uses this to avoid sim-ecs complexity while keeping the same interface.

type SystemFn = (world: WorldImpl, delta: number) => void;

export class WorldImpl implements World {
  entities = new Map<string, Entity>();
  private systems: SystemFn[] = [];

  spawnEntity(id: string, components: Component[]): Entity {
    const compMap = new Map<string, Component>();
    for (const c of components) {
      compMap.set(c.type, c);
    }
    const entity: Entity = { id, components: compMap };
    this.entities.set(id, entity);
    return entity;
  }

  removeEntity(id: string): void {
    this.entities.delete(id);
  }

  getEntity(id: string): Entity | undefined {
    return this.entities.get(id);
  }

  query(componentTypes: string[]): Entity[] {
    const result: Entity[] = [];
    for (const entity of this.entities.values()) {
      if (componentTypes.every(t => entity.components.has(t))) {
        result.push(entity);
      }
    }
    return result;
  }

  addSystem(fn: SystemFn): void {
    this.systems.push(fn);
  }

  tick(delta: number): void {
    for (const system of this.systems) {
      system(this, delta);
    }
  }

  // Serialize world to plain object
  toJSON(): object {
    const entities = Array.from(this.entities.values()).map(e => ({
      id: e.id,
      components: Object.fromEntries(
        Array.from(e.components.entries()).map(([k, v]) => [k, { ...v }])
      ),
    }));
    return { entities };
  }
}

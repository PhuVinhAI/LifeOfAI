import type { Plugin, World, IEventBus } from '../types/index.js';
import { TraitRegistry } from './trait-registry.js';
import { WorldImpl } from './ecs.js';

export class PluginLoader {
  private plugins = new Map<string, Plugin>();
  private traitRegistry = new TraitRegistry();

  load(plugin: Plugin): void {
    for (const dep of plugin.dependencies) {
      if (!this.plugins.has(dep)) {
        throw new Error(`Plugin "${plugin.name}" requires "${dep}" which is not loaded.`);
      }
    }

    for (const trait of plugin.traitDefs) {
      this.traitRegistry.register(trait);
    }

    this.plugins.set(plugin.name, plugin);
  }

  installSystems(world: WorldImpl, events: IEventBus): void {
    // Trait FSM tick system — advances all object traits each tick
    const registry = this.traitRegistry;
    world.addSystem((w, delta) => {
      const objects = w.query(['object_state']);
      for (const obj of objects) {
        registry.tickEntity(obj, w, delta);
      }
    });

    // Plugin-defined systems
    for (const plugin of this.plugins.values()) {
      for (const fn of plugin.systemFns) {
        world.addSystem((w, delta) => fn(w, delta, events));
      }
    }
  }

  getTraitRegistry(): TraitRegistry {
    return this.traitRegistry;
  }

  getPlugins(): Plugin[] {
    return Array.from(this.plugins.values());
  }
}

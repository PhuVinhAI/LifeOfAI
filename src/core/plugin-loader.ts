import type { Plugin, World } from '../types/index.js';
import { TraitRegistry } from './trait-registry.js';
import { WorldImpl } from './ecs.js';
import { TypedEventEmitter } from './event-bus.js';

export class PluginLoader {
  private plugins = new Map<string, Plugin>();
  private traitRegistry = new TraitRegistry();

  load(plugin: Plugin): void {
    // Check deps
    for (const dep of plugin.dependencies) {
      if (!this.plugins.has(dep)) {
        throw new Error(`Plugin "${plugin.name}" requires "${dep}" which is not loaded.`);
      }
    }

    // Register traits
    for (const trait of plugin.traitDefs) {
      this.traitRegistry.register(trait);
    }

    // Register systems
    // (systems are added to the world later via installSystems)

    this.plugins.set(plugin.name, plugin);
  }

  installSystems(world: WorldImpl): void {
    const events = new TypedEventEmitter();
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

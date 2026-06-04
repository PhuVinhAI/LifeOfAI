import type { Plugin } from '../../types/index.js';
import { UsableTrait } from './traits/usable.js';
import { CleanableTrait } from './traits/cleanable.js';
import { BreakableTrait } from './traits/breakable.js';
import { ContainerTrait } from './traits/container.js';
import { NeedProviderTrait } from './traits/need-provider.js';
import { CookableTrait } from './traits/cookable.js';
import { WashableTrait } from './traits/washable.js';
import { needDecaySystem } from './systems/need-decay.js';
import { interactionSystem } from './systems/interaction.js';

export const coreLifePlugin: Plugin = {
  name: 'core-life',
  version: '0.1.0',
  dependencies: [],
  traitDefs: [
    UsableTrait,
    CleanableTrait,
    BreakableTrait,
    ContainerTrait,
    NeedProviderTrait,
    CookableTrait,
    WashableTrait,
  ],
  components: [
    { name: 'needs', schema: {} },
    { name: 'position', schema: {} },
    { name: 'identity', schema: {} },
    { name: 'object_state', schema: {} },
    { name: 'goal', schema: {} },
    { name: 'task_list', schema: {} },
    { name: 'container_memory', schema: {} },
  ],
  systemFns: [needDecaySystem, interactionSystem],
};

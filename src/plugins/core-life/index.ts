import type { Plugin } from '../../types/index.js';
import { UsableTrait } from './traits/usable.js';
import { CleanableTrait } from './traits/cleanable.js';
import { BreakableTrait } from './traits/breakable.js';
import { ContainerTrait } from './traits/container.js';
import { NeedProviderTrait } from './traits/need-provider.js';
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
  ],
  components: [
    { name: 'needs', schema: {} },
    { name: 'position', schema: {} },
    { name: 'identity', schema: {} },
    { name: 'object_state', schema: {} },
    { name: 'goal', schema: {} },
    { name: 'task_list', schema: {} },
  ],
  systemFns: [needDecaySystem, interactionSystem],
};

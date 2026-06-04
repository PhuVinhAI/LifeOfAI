import type { TraitDefinition, InteractionResult, Entity, World } from '../../../types/index.js';
import type { Needs } from '../../../types/index.js';

interface NeedProviderConfig {
  need: keyof Omit<Needs, 'type'>;
  value: number;
  duration: number;   // tick count
  cooldown: number;   // tick count before reuse
}

export const NeedProviderTrait: TraitDefinition = {
  name: 'need_provider',
  capabilities: ['use'],
  initialState: 'ready',

  transitions: {
    ready:    { use: 'in_use' },
    in_use:   { finish: 'cooldown', cancel: 'ready' },
    cooldown: { tick: 'ready' },
  },

  onInteract(entity: Entity, action: string, user: Entity, _params: Record<string, unknown> | undefined, _world: World): InteractionResult {
    if (action !== 'use') {
      return { success: false, message: `Hành động "${action}" không khả dụng.` };
    }

    const state = getState(entity);
    if (state === 'in_use') {
      return { success: false, message: `${entity.id} đang được dùng.` };
    }
    if (state === 'cooldown') {
      return { success: false, message: `${entity.id} chưa sẵn sàng, đợi một chút.` };
    }

    const config = getConfig(entity);
    const needs = user.components.get('needs') as Needs | undefined;

    if (needs) {
      const key = config.need as string;
      if (key in needs) {
        (needs as any)[key] = Math.min(100, (needs as any)[key] + config.value);
      }
    }

    setState(entity, 'in_use');
    return {
      success: true,
      message: `Đã dùng ${entity.id}. ${getNeedLabel(config.need)} +${config.value}.`,
      effects: [
        { entityId: user.id, component: 'needs', changes: { [config.need]: config.value } },
      ],
    };
  },

  tick(entity: Entity, _world: World, _delta: number): void {
    const state = getState(entity);
    if (state === 'in_use') {
      // Auto-finish after 1 tick for MVP (can be extended with duration tracking)
      setState(entity, 'cooldown');
    } else if (state === 'cooldown') {
      // Toggle back to ready next tick
      setState(entity, 'ready');
    }
  },
};

function getState(entity: Entity): string {
  const os = entity.components.get('object_state');
  if (os && 'traits' in os) return (os as any).traits['need_provider'] ?? 'ready';
  return 'ready';
}

function setState(entity: Entity, s: string): void {
  const os = entity.components.get('object_state');
  if (os && 'traits' in os) (os as any).traits['need_provider'] = s;
}

function getConfig(entity: Entity): NeedProviderConfig {
  const os = entity.components.get('object_state');
  if (os && 'traitConfig' in os) return (os as any).traitConfig?.need_provider ?? { need: 'fun', value: 20, duration: 1, cooldown: 2 };
  return { need: 'fun', value: 20, duration: 1, cooldown: 2 };
}

function getNeedLabel(need: string): string {
  const labels: Record<string, string> = {
    hunger: 'Đói', thirst: 'Khát', energy: 'Năng lượng',
    bladder: 'Vệ sinh', hygiene: 'Vệ sinh thân thể', fun: 'Giải trí',
  };
  return labels[need] ?? need;
}

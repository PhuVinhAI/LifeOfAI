import type { TraitDefinition, InteractionResult, Entity, World } from '../../../types/index.js';
import type { Needs } from '../../../types/index.js';

interface NeedProviderConfig {
  need: keyof Omit<Needs, 'type'>;
  value: number;
  duration: number;   // minutes
}

export const NeedProviderTrait: TraitDefinition = {
  name: 'need_provider',
  capabilities: ['use'],
  initialState: 'ready',

  // No cooldown — AI có thể dùng lại ngay sau khi xong.
  transitions: {
    ready: { use: 'ready' },
  },

  onInteract(entity: Entity, action: string, user: Entity, _params: Record<string, unknown> | undefined, _world: World): InteractionResult {
    if (action !== 'use') {
      return { success: false, message: `Hành động "${action}" không khả dụng.` };
    }

    const config = getConfig(entity);
    const needs = user.components.get('needs') as Needs | undefined;

    if (needs) {
      const key = config.need as string;
      if (key in needs) {
        (needs as any)[key] = Math.min(100, (needs as any)[key] + config.value);
      }
    }

    return {
      success: true,
      message: `Đã dùng ${entity.id}. Cảm thấy ${getNeedLabel(config.need).toLowerCase()} đã được cải thiện.`,
      duration: config.duration,
      effects: [
        { entityId: user.id, component: 'needs', changes: { [config.need]: config.value } },
      ],
    };
  },

  // No tick logic needed — state always 'ready'.
};

function getConfig(entity: Entity): NeedProviderConfig {
  const os = entity.components.get('object_state');
  if (os && 'traitConfig' in os) return (os as any).traitConfig?.need_provider ?? { need: 'fun', value: 20, duration: 1 };
  return { need: 'fun', value: 20, duration: 1 };
}

function getNeedLabel(need: string): string {
  const labels: Record<string, string> = {
    hunger: 'Đói', thirst: 'Khát', energy: 'Năng lượng',
    bladder: 'Vệ sinh', hygiene: 'Vệ sinh thân thể', fun: 'Giải trí',
  };
  return labels[need] ?? need;
}

import type { TraitDefinition, InteractionResult, Entity, World } from '../../../types/index.js';

interface ContainerConfig {
  slots: number;
  accepts: string[];
}

interface ContainerData {
  items: Array<{ name: string; quantity: number }>;
}

export const ContainerTrait: TraitDefinition = {
  name: 'container',
  capabilities: ['open', 'take', 'put'],
  initialState: 'closed',

  transitions: {
    closed: { open: 'open' },
    open:   { close: 'closed' },
  },

  onInteract(entity: Entity, action: string, _user: Entity, params: Record<string, unknown> | undefined, _world: World): InteractionResult {
    const items = getItems(entity);
    const config = getConfig(entity);

    switch (action) {
      case 'open': {
        setState(entity, 'open');
        const itemList = items.map(i => `${i.name} (x${i.quantity})`).join(', ') || 'trống';
        return { success: true, message: `Mở ${entity.id}. Bên trong: ${itemList}.` };
      }
      case 'take': {
        if (getState(entity) !== 'open') {
          return { success: false, message: `Phải mở ${entity.id} trước.` };
        }
        const itemName = params?.item as string | undefined;
        if (!itemName) {
          return { success: false, message: 'Phải chỉ định món đồ muốn lấy.' };
        }
        const idx = items.findIndex(i => i.name === itemName);
        if (idx === -1) {
          return { success: false, message: `Không có "${itemName}" trong ${entity.id}.` };
        }
        items[idx]!.quantity--;
        if (items[idx]!.quantity <= 0) items.splice(idx, 1);
        saveItems(entity, items);
        return { success: true, message: `Lấy "${itemName}" từ ${entity.id}.` };
      }
      case 'put': {
        if (getState(entity) !== 'open') {
          return { success: false, message: `Phải mở ${entity.id} trước.` };
        }
        const putName = params?.item as string | undefined;
        if (!putName) {
          return { success: false, message: 'Phải chỉ định món đồ muốn để vào.' };
        }
        if (config.accepts.length > 0 && !config.accepts.some(a => putName.includes(a))) {
          return { success: false, message: `Không thể để "${putName}" vào ${entity.id}.` };
        }
        if (items.length >= config.slots) {
          return { success: false, message: `${entity.id} đã đầy.` };
        }
        const existing = items.find(i => i.name === putName);
        if (existing) existing.quantity++;
        else items.push({ name: putName, quantity: 1 });
        saveItems(entity, items);
        return { success: true, message: `Để "${putName}" vào ${entity.id}.` };
      }
      default:
        return { success: false, message: `Hành động "${action}" không khả dụng với ${entity.id}.` };
    }
  },
};

function getState(entity: Entity): string {
  const os = entity.components.get('object_state');
  if (os && 'traits' in os) return (os as any).traits['container'] ?? 'closed';
  return 'closed';
}

function setState(entity: Entity, s: string): void {
  const os = entity.components.get('object_state');
  if (os && 'traits' in os) (os as any).traits['container'] = s;
}

function getItems(entity: Entity): ContainerData['items'] {
  const os = entity.components.get('object_state');
  if (os && 'containerData' in os) return (os as any).containerData?.items ?? [];
  return [];
}

function saveItems(entity: Entity, items: ContainerData['items']): void {
  const os = entity.components.get('object_state');
  if (os && 'containerData' in os) {
    (os as any).containerData = { items };
  }
}

function getConfig(entity: Entity): ContainerConfig {
  const os = entity.components.get('object_state');
  if (os && 'traitConfig' in os) return (os as any).traitConfig?.container ?? { slots: 20, accepts: ['food', 'drink'] };
  return { slots: 20, accepts: ['food', 'drink'] };
}

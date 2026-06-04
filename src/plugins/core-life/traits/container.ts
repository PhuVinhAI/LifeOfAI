import type { TraitDefinition, InteractionResult, Entity, World } from '../../../types/index.js';
import { buildInventoryItem, getItemType } from '../items.js';
import { recordSeen, type ContainerMemory } from '../components/container-memory.js';

interface ContainerConfig {
  slots: number;
  accepts: string[];   // có thể là tên item ("Mì gói") hoặc type ("food")
}

interface ContainerData {
  items: Array<{ name: string; quantity: number }>;
}

export const ContainerTrait: TraitDefinition = {
  name: 'container',
  capabilities: ['open', 'close', 'take', 'put'],
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
        rememberContents(_user, entity.id, items);
        return { success: true, message: `Mở ${entity.id}. Bên trong: ${itemList}.`, duration: 1 };
      }
      case 'close': {
        setState(entity, 'closed');
        return { success: true, message: `Đã đóng ${entity.id}.`, duration: 1 };
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
        rememberContents(_user, entity.id, items);

        // Add to user's inventory
        const inv = _user.components.get('inventory');
        if (inv && inv.type === 'inventory') {
          const invAny = inv as any;
          if (invAny.items.length >= invAny.capacity) {
            // Roll back
            const existing = items.find(i => i.name === itemName);
            if (existing) existing.quantity++;
            else items.push({ name: itemName, quantity: 1 });
            saveItems(entity, items);
            return { success: false, message: `Túi đồ đã đầy, không thể lấy "${itemName}".` };
          }
          const existingInv = invAny.items.find((i: any) => i.name === itemName);
          if (existingInv) existingInv.quantity++;
          else invAny.items.push(buildInventoryItem(itemName));
        }

        return { success: true, message: `Đã lấy "${itemName}" từ ${entity.id} và bỏ vào túi.`, duration: 2 };
      }
      case 'put': {
        if (getState(entity) !== 'open') {
          return { success: false, message: `Phải mở ${entity.id} trước.` };
        }
        const putName = params?.item as string | undefined;
        if (!putName) {
          return { success: false, message: 'Phải chỉ định món đồ muốn để vào.' };
        }
        if (!accepts(config.accepts, putName)) {
          return { success: false, message: `Không thể để "${putName}" vào ${entity.id}.` };
        }
        if (items.length >= config.slots) {
          return { success: false, message: `${entity.id} đã đầy.` };
        }
        const existing = items.find(i => i.name === putName);
        if (existing) existing.quantity++;
        else items.push({ name: putName, quantity: 1 });
        saveItems(entity, items);
        rememberContents(_user, entity.id, items);

        // Remove from user inventory
        const inv = _user.components.get('inventory');
        if (inv && inv.type === 'inventory') {
          const invAny = inv as any;
          const idx = invAny.items.findIndex((i: any) => i.name === putName);
          if (idx !== -1) {
            invAny.items[idx].quantity--;
            if (invAny.items[idx].quantity <= 0) invAny.items.splice(idx, 1);
          }
        }
        return { success: true, message: `Để "${putName}" vào ${entity.id}.`, duration: 2 };
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

/**
 * `accepts` list can mix item TYPES ("food", "drink", "dishware") with specific
 * item names. Match wins if either applies. Empty list = accept anything.
 */
function rememberContents(user: Entity, containerId: string, items: Array<{ name: string; quantity: number }>): void {
  const mem = user.components.get('container_memory') as ContainerMemory | undefined;
  if (mem) recordSeen(mem, containerId, items);
}

function accepts(rules: string[], itemName: string): boolean {
  if (!rules || rules.length === 0) return true;
  const itemType = getItemType(itemName);
  for (const rule of rules) {
    if (rule === itemName) return true;
    if (rule === itemType) return true;
  }
  return false;
}

import type { TraitDefinition, InteractionResult, Entity, World } from '../../../types/index.js';
import { getItem } from '../items.js';

/**
 * Washable trait — bồn rửa, cho phép `wash` các đồ bẩn (Chén bẩn → Chén).
 */
export const WashableTrait: TraitDefinition = {
  name: 'washable',
  capabilities: ['wash'],
  initialState: 'idle',

  transitions: {
    idle: { wash: 'idle' },
  },

  onInteract(entity: Entity, action: string, user: Entity, params: Record<string, unknown> | undefined, _world: World): InteractionResult {
    if (action !== 'wash') {
      return { success: false, message: `Hành động "${action}" không khả dụng với ${entity.id}.` };
    }

    const itemName = params?.item as string | undefined;
    if (!itemName) {
      return { success: false, message: 'Phải chỉ định món đồ muốn rửa (item).' };
    }

    const meta = getItem(itemName);
    if (!meta || !meta.clean_to) {
      return { success: false, message: `"${itemName}" không cần/không thể rửa.` };
    }

    const inv = user.components.get('inventory') as { items: Array<{ name: string; quantity: number; type: string }> } | undefined;
    if (!inv) return { success: false, message: 'Không có inventory.' };

    const idx = inv.items.findIndex(i => i.name === itemName);
    if (idx === -1) {
      return { success: false, message: `Bạn không có "${itemName}" trong túi.` };
    }

    // Decrement dirty version
    inv.items[idx]!.quantity--;
    if (inv.items[idx]!.quantity <= 0) inv.items.splice(idx, 1);

    // Increment clean version
    const cleanName = meta.clean_to;
    const existing = inv.items.find(i => i.name === cleanName);
    if (existing) existing.quantity++;
    else {
      const cleanMeta = getItem(cleanName);
      inv.items.push({
        name: cleanName,
        quantity: 1,
        type: cleanMeta?.type ?? 'dishware',
      });
    }

    return {
      success: true,
      message: `Đã rửa "${itemName}" tại ${entity.id}. Bây giờ là "${cleanName}" sạch sẽ.`,
      duration: 5,
    };
  },
};

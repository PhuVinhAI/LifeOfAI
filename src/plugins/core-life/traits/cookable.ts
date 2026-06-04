import type { TraitDefinition, InteractionResult, Entity, World } from '../../../types/index.js';
import { getItem, buildInventoryItem } from '../items.js';

/**
 * Cookable trait — đại diện một bề mặt nấu nướng (Bếp).
 *
 * Khi AI gọi `interact("Bếp", "cook", item="Mì gói")`:
 *   1. Kiểm tra trong túi có nguyên liệu (Mì gói) + cookware (Nồi) + dishware (Chén)
 *   2. Trừ nguyên liệu, giữ lại cookware
 *   3. Đổi Chén → Mì nóng (food) vào túi
 *   4. Tốn 10 phút
 */
export const CookableTrait: TraitDefinition = {
  name: 'cookable',
  capabilities: ['cook'],
  initialState: 'idle',

  transitions: {
    idle: { cook: 'idle' },
  },

  onInteract(entity: Entity, action: string, user: Entity, params: Record<string, unknown> | undefined, _world: World): InteractionResult {
    if (action !== 'cook') {
      return { success: false, message: `Hành động "${action}" không khả dụng với ${entity.id}.` };
    }

    const ingredientName = params?.item as string | undefined;
    if (!ingredientName) {
      return { success: false, message: 'Phải chỉ định nguyên liệu muốn nấu (item).' };
    }

    const ingredient = getItem(ingredientName);
    if (!ingredient || ingredient.type !== 'ingredient' || !ingredient.cooked_form) {
      return { success: false, message: `"${ingredientName}" không thể nấu.` };
    }

    const inv = user.components.get('inventory') as { items: Array<{ name: string; quantity: number; type: string }>; capacity: number } | undefined;
    if (!inv) return { success: false, message: 'Không có inventory.' };

    // Find ingredient in pocket
    const ingIdx = inv.items.findIndex(i => i.name === ingredientName);
    if (ingIdx === -1) {
      return { success: false, message: `Bạn không có "${ingredientName}" trong túi.` };
    }

    // Find cookware
    const cookware = inv.items.find(i => i.type === 'cookware');
    if (!cookware) {
      return { success: false, message: `Cần một dụng cụ nấu (nồi/chảo) trong túi.` };
    }

    // Find dishware to serve into
    const dishIdx = inv.items.findIndex(i => i.type === 'dishware' && i.name === 'Chén');
    if (dishIdx === -1) {
      return { success: false, message: `Cần một cái Chén sạch trong túi để đựng món ăn.` };
    }

    // Consume one ingredient
    inv.items[ingIdx]!.quantity--;
    if (inv.items[ingIdx]!.quantity <= 0) inv.items.splice(ingIdx, 1);

    // Consume one Chén → replace with cooked food
    // Recompute dishIdx because splice may have shifted indices
    const dishIdx2 = inv.items.findIndex(i => i.type === 'dishware' && i.name === 'Chén');
    if (dishIdx2 !== -1) {
      inv.items[dishIdx2]!.quantity--;
      if (inv.items[dishIdx2]!.quantity <= 0) inv.items.splice(dishIdx2, 1);
    }

    // Add cooked food to inventory
    const cooked = buildInventoryItem(ingredient.cooked_form);
    const existing = inv.items.find(i => i.name === cooked.name);
    if (existing) existing.quantity++;
    else inv.items.push(cooked);

    return {
      success: true,
      message: `Đã nấu "${ingredientName}" thành "${ingredient.cooked_form}" trên ${entity.id}. Mùi thơm bốc lên.`,
      duration: 10,
    };
  },
};

import type { Component } from '../../../types/index.js';
import type { ItemType } from '../items.js';

export interface InventoryItem {
  name: string;
  quantity: number;
  type: ItemType;
  needRestore?: { need: string; value: number };
}

export interface Inventory extends Component {
  type: 'inventory';
  items: InventoryItem[];
  capacity: number;
}

export function createInventory(capacity = 10): Inventory {
  return { type: 'inventory', items: [], capacity };
}

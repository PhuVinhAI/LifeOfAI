import type { Component } from '../../../types/index.js';

export interface InventoryItem {
  name: string;
  quantity: number;
  type: 'food' | 'drink' | 'misc';   // category for consumption
  needRestore?: { need: string; value: number };  // when eaten/drunk
}

export interface Inventory extends Component {
  type: 'inventory';
  items: InventoryItem[];
  capacity: number;
}

export function createInventory(capacity = 10): Inventory {
  return { type: 'inventory', items: [], capacity };
}

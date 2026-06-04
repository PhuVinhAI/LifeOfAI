import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import YAML from 'yaml';

export type ItemType = 'food' | 'drink' | 'ingredient' | 'cookware' | 'dishware' | 'misc';

export interface ItemDef {
  type: ItemType;
  needRestore?: { need: string; value: number };
  cooked_form?: string;
  clean_to?: string;
}

let DB: Record<string, ItemDef> | null = null;

function loadDB(): Record<string, ItemDef> {
  if (DB) return DB;
  const __dirname = path.dirname(fileURLToPath(import.meta.url));
  // src/plugins/core-life → ../../../data/items.yaml
  const file = path.resolve(__dirname, '..', '..', '..', 'data', 'items.yaml');
  const raw = fs.readFileSync(file, 'utf-8');
  const parsed = YAML.parse(raw) as { items: Record<string, ItemDef> };
  DB = parsed.items ?? {};
  return DB;
}

export function getItem(name: string): ItemDef | undefined {
  return loadDB()[name];
}

export function getItemType(name: string): ItemType {
  return getItem(name)?.type ?? 'misc';
}

export function buildInventoryItem(name: string): {
  name: string;
  quantity: number;
  type: ItemType;
  needRestore?: { need: string; value: number };
} {
  const meta = getItem(name);
  if (meta) {
    return {
      name,
      quantity: 1,
      type: meta.type,
      ...(meta.needRestore && { needRestore: meta.needRestore }),
    };
  }
  return { name, quantity: 1, type: 'misc' };
}

/** Reset cache — only for testing. */
export function _resetItemCache(): void {
  DB = null;
}

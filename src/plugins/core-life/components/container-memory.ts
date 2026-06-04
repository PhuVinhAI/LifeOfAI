import type { Component } from '../../../types/index.js';

/**
 * Lưu lại snapshot nội dung của các container mà agent đã `open`.
 * Mỗi lần open/take/put thì đồng bộ lại entry tương ứng.
 * Dùng để AI nhớ "tủ lạnh có gì" thay vì đoán mò.
 */
export interface ContainerMemory extends Component {
  type: 'container_memory';
  // key = entity id (vd: "obj_Tủ_lạnh") → snapshot list
  seen: Record<string, Array<{ name: string; quantity: number }>>;
}

export function createContainerMemory(): ContainerMemory {
  return { type: 'container_memory', seen: {} };
}

export function recordSeen(
  mem: ContainerMemory,
  entityId: string,
  items: Array<{ name: string; quantity: number }>
): void {
  mem.seen[entityId] = items.map(i => ({ name: i.name, quantity: i.quantity }));
}

export function forgetContainer(mem: ContainerMemory, entityId: string): void {
  delete mem.seen[entityId];
}

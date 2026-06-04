import type { Component } from '../../../types/index.js';

export interface Position extends Component {
  type: 'position';
  x: number;
  y: number;
  roomId: string;
}

export function createPosition(x: number, y: number, roomId: string): Position {
  return { type: 'position', x, y, roomId };
}

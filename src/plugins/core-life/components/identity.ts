import type { Component } from '../../../types/index.js';

export interface Identity extends Component {
  type: 'identity';
  name: string;
  age: number;
  bio: string;
}

export function createIdentity(name: string, age: number, bio: string): Identity {
  return { type: 'identity', name, age, bio };
}

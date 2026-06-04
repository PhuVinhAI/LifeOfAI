import React from 'react';
import { Box, Text } from 'ink';
import type { Entity } from '../../types/index.js';
import type { Position } from '../../plugins/core-life/components/position.js';
import type { ObjectState } from '../../plugins/core-life/components/object-state.js';
import type { Needs } from '../../plugins/core-life/components/needs.js';

interface RoomProps {
  width: number;
  height: number;
  objects: Entity[];
  agent: Entity | undefined;
  agentPos: Position | undefined;
}

const OBJECT_SYMBOLS: Record<string, string> = {
  'Tủ lạnh': '█',
  'Bếp': '█',
  'Bàn ăn': '▤',
  'Ghế': '▦',
  'Giường': '▨',
  'Toilet': '○',
  'Vòi sen': '◎',
  'TV': '▣',
};

const AGENT_SYMBOL = '☺';

export const Room: React.FC<RoomProps> = ({ width, height, objects, agentPos }) => {
  // Build grid
  const grid: string[][] = Array.from({ length: height }, () =>
    Array.from({ length: width }, () => ' ')
  );

  // Place objects
  for (const obj of objects) {
    const pos = obj.components.get('position') as Position | undefined;
    if (pos && pos.x >= 0 && pos.x < width && pos.y >= 0 && pos.y < height) {
      const os = obj.components.get('object_state') as ObjectState | undefined;
      const symbol = os ? (OBJECT_SYMBOLS[os.objectName] ?? '?') : '?';
      grid[pos.y]![pos.x] = symbol;
    }
  }

  // Place agent
  if (agentPos) {
    const { x, y } = agentPos;
    if (x >= 0 && x < width && y >= 0 && y < height) {
      grid[y]![x] = AGENT_SYMBOL;
    }
  }

  const legend = `☺ = Agent | ${Object.entries(OBJECT_SYMBOLS)
    .map(([name, sym]) => `${sym}=${name}`)
    .join(' | ')}`;

  return (
    <Box flexDirection="column" borderStyle="single" padding={1}>
      <Text bold>Phòng</Text>
      {grid.map((row, y) => (
        <Text key={y}>{row.join('')}</Text>
      ))}
      <Text dimColor>{legend}</Text>
    </Box>
  );
};

import React from 'react';
import { Box, Text } from 'ink';

interface ToolCallEntry {
  tool: string;
  args: Record<string, unknown>;
  result: unknown;
  timestamp: number;
}

interface ToolCallLogProps {
  entries: ToolCallEntry[];
  maxEntries?: number;
}

export const ToolCallLog: React.FC<ToolCallLogProps> = ({ entries, maxEntries = 5 }) => {
  const visible = entries.slice(-maxEntries);
  return (
    <Box flexDirection="column" borderStyle="single" padding={1}>
      <Text bold>🔧 Hoạt động</Text>
      {visible.length === 0 && (
        <Text dimColor>Chưa có hành động nào</Text>
      )}
      {visible.map((entry, i) => (
        <Box key={i} flexDirection="column" marginTop={i > 0 ? 1 : 0}>
          <Text color="blue">
            → {entry.tool}({JSON.stringify(entry.args)})
          </Text>
          <Text dimColor>
            {typeof entry.result === 'string'
              ? entry.result
              : JSON.stringify(entry.result)}
          </Text>
        </Box>
      ))}
    </Box>
  );
};

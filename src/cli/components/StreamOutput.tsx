import React from 'react';
import { Box, Text } from 'ink';

interface StreamOutputProps {
  lines: string[];
  maxLines?: number;
}

export const StreamOutput: React.FC<StreamOutputProps> = ({ lines, maxLines = 10 }) => {
  const visible = lines.slice(-maxLines);
  return (
    <Box flexDirection="column" borderStyle="single" padding={1} minHeight={maxLines + 2}>
      <Text bold>💭 Suy nghĩ</Text>
      {visible.length === 0 && (
        <Text dimColor>Đang chờ AI...</Text>
      )}
      {visible.map((line, i) => (
        <Text key={i}>{line}</Text>
      ))}
    </Box>
  );
};

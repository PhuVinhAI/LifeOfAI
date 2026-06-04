import React from 'react';
import { Box, Text } from 'ink';

interface StreamOutputProps {
  lines: string[];
  maxLines?: number;
}

export const StreamOutput: React.FC<StreamOutputProps> = ({ lines, maxLines = 8 }) => {
  const visible = lines.slice(-maxLines);
  const isStreaming = lines.length > 0 && lines[lines.length - 1]!.length > 0;

  return (
    <Box flexDirection="column" borderStyle="single" padding={1}>
      <Text bold>💭 Suy nghĩ</Text>
      {lines.length === 0 && (
        <Text dimColor>Đang chờ AI...</Text>
      )}
      {visible.map((line, i) => {
        const isLast = i === visible.length - 1;
        const display = isLast && isStreaming ? `${line}▌` : line;
        return (
          <Text key={i} dimColor={line.length === 0 && !isLast}>
            {display || ' '}
          </Text>
        );
      })}
    </Box>
  );
};

import React from 'react';
import { Box, Text } from 'ink';

interface ControlsProps {
  engineState: string;
}

export const Controls: React.FC<ControlsProps> = ({ engineState }) => {
  return (
    <Box borderStyle="single" padding={1} justifyContent="space-between">
      <Text>
        <Text bold>[Space]</Text>{' '}
        {engineState === 'running' ? 'Tạm dừng' : 'Tiếp tục'}
      </Text>
      <Text>
        <Text bold>[T]</Text> Tick | <Text bold>[Q]</Text> Thoát |{' '}
        <Text bold>[S]</Text> Lưu
      </Text>
    </Box>
  );
};

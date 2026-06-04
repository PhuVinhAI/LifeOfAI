import React from 'react';
import { Box, Text } from 'ink';
import type { Needs } from '../../plugins/core-life/components/needs.js';
import type { GoalComponent } from '../../plugins/core-life/components/goal.js';
import { getNeedLabel } from '../../plugins/core-life/systems/need-decay.js';

interface AgentStatusProps {
  identity: { name: string; age: number } | undefined;
  needs: Needs | undefined;
  goalComponent: GoalComponent | undefined;
  timeDisplay: string;
  engineState: string;
}

const BAR_WIDTH = 20;

function NeedBar({ value, label }: { value: number; label: string }) {
  const filled = Math.round((value / 100) * BAR_WIDTH);
  const color = value < 20 ? 'red' : value < 40 ? 'yellow' : 'green';
  const bar = '█'.repeat(filled) + '░'.repeat(BAR_WIDTH - filled);
  return (
    <Text color={color}>
      {label.padEnd(10)} [{bar}] {Math.round(value)}%
    </Text>
  );
}

export const AgentStatus: React.FC<AgentStatusProps> = ({
  identity,
  needs,
  goalComponent,
  timeDisplay,
  engineState,
}) => {
  const currentGoal = goalComponent?.current;
  return (
    <Box flexDirection="column" borderStyle="single" padding={1}>
      <Text bold>
        {identity?.name ?? '???'} — {identity?.age ?? '?'} tuổi
      </Text>
      <Text>
        🕐 {timeDisplay}
      </Text>
      <Text>
        Trạng thái:{' '}
        <Text color={engineState === 'running' ? 'green' : 'yellow'}>
          {engineState === 'running' ? '▶ ĐANG SỐNG' : '⏸ TẠM DỪNG'}
        </Text>
      </Text>
      {currentGoal && (
        <Text color="cyan">
          🎯 {currentGoal.description}
        </Text>
      )}
      <Box marginTop={1} flexDirection="column">
        {needs &&
          (['hunger', 'thirst', 'energy', 'bladder', 'hygiene', 'fun'] as const).map((key) => (
            <NeedBar key={key} value={needs[key]} label={getNeedLabel(key)} />
          ))}
      </Box>
    </Box>
  );
};

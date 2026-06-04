import React, { useEffect } from 'react';
import { Box, Text, useInput, useApp } from 'ink';
import { GameEngine } from '../core/engine.js';
import { AgentLoop } from '../ai/agent-loop.js';
import { Room } from './components/Room.js';
import { AgentStatus } from './components/AgentStatus.js';
import { StreamOutput } from './components/StreamOutput.js';
import { ToolCallLog } from './components/ToolCallLog.js';
import { Controls } from './components/Controls.js';
import { useEngine } from './hooks/useEngine.js';
import type { GoalComponent } from '../plugins/core-life/components/goal.js';

interface AppProps {
  engine: GameEngine;
  agentLoop: AgentLoop;
  roomWidth: number;
  roomHeight: number;
}

export const App: React.FC<AppProps> = ({ engine, agentLoop, roomWidth, roomHeight }) => {
  const { exit } = useApp();
  const {
    timeDisplay,
    engineState,
    streamLines,
    toolCalls,
    toggle,
    step,
    getAgentData,
    getObjects,
  } = useEngine(engine, agentLoop);

  // Auto-start on mount
  useEffect(() => {
    engine.start();
    agentLoop.start();
    return () => {
      agentLoop.pause();
    };
  }, []);

  useInput((input, key) => {
    if (input === ' ') {
      toggle();
    } else if (input === 't') {
      step();
    } else if (input === 'q') {
      agentLoop.pause();
      exit();
    } else if (input === 's') {
      // Save state — dynamic import for ESM
      import('../core/serializer.js').then(({ saveWorld }) => {
        saveWorld(engine.world, engine.tickCount, engine.clock, 'save.json');
      });
    }
  });

  const { identity, needs, pos } = getAgentData();
  const objects = getObjects();
  const agent = engine.world.getEntity('agent_1');
  const goalComponent = agent?.components.get('goal') as GoalComponent | undefined;

  return (
    <Box flexDirection="column" padding={1}>
      <Text bold backgroundColor="blue" color="white">
        LifeOfAI v0.1.0 — Mô phỏng cuộc sống AI
      </Text>

      <Box flexDirection="row" marginTop={1} gap={1}>
        {/* Left column: room map */}
        <Box flexDirection="column" width={40}>
          <Room
            width={roomWidth}
            height={roomHeight}
            objects={objects}
            agent={undefined}
            agentPos={pos}
          />
        </Box>

        {/* Right column: agent status */}
        <Box flexDirection="column" flexGrow={1}>
          <AgentStatus
            identity={identity}
            needs={needs}
            goalComponent={goalComponent}
            timeDisplay={timeDisplay}
            engineState={engineState}
          />
        </Box>
      </Box>

      {/* AI Stream output */}
      <StreamOutput lines={streamLines} maxLines={8} />

      {/* Tool call log */}
      <ToolCallLog entries={toolCalls} maxEntries={4} />

      {/* Controls */}
      <Controls engineState={engineState} />
    </Box>
  );
};

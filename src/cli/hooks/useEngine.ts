import { useState, useEffect, useCallback, useRef } from 'react';
import { GameEngine } from '../../core/engine.js';
import { AgentLoop } from '../../ai/agent-loop.js';
import type { Identity } from '../../plugins/core-life/components/identity.js';
import type { Needs } from '../../plugins/core-life/components/needs.js';
import type { ObjectState } from '../../plugins/core-life/components/object-state.js';
import type { Position } from '../../plugins/core-life/components/position.js';

export interface ToolCallEntry {
  tool: string;
  args: Record<string, unknown>;
  result: unknown;
  timestamp: number;
}

export function useEngine(engine: GameEngine, agentLoop: AgentLoop) {
  const [tickCount, setTickCount] = useState(0);
  const [engineState, setEngineState] = useState(engine.state);
  const [streamLines, setStreamLines] = useState<string[]>([]);
  const [toolCalls, setToolCalls] = useState<ToolCallEntry[]>([]);
  const streamBuffer = useRef('');

  useEffect(() => {
    const onTick = (t: number) => setTickCount(t);
    const onPlay = () => setEngineState('running');
    const onPause = () => setEngineState('paused');
    const onStream = (_agentId: string, text: string) => {
      streamBuffer.current += text;
      setStreamLines(streamBuffer.current.split('\n'));
    };
    const onToolResult = (_agentId: string, toolName: string, result: unknown) => {
      setToolCalls(prev => [
        ...prev,
        { tool: toolName, args: {}, result, timestamp: Date.now() },
      ]);
    };

    engine.events.on('engine:tick', onTick);
    engine.events.on('engine:play', onPlay);
    engine.events.on('engine:pause', onPause);
    engine.events.on('ai:stream', onStream);
    engine.events.on('ai:tool_result', onToolResult);

    return () => {
      engine.events.off('engine:tick', onTick);
      engine.events.off('engine:play', onPlay);
      engine.events.off('engine:pause', onPause);
      engine.events.off('ai:stream', onStream);
      engine.events.off('ai:tool_result', onToolResult);
    };
  }, [engine]);

  const toggle = useCallback(() => {
    if (engine.state === 'running') {
      engine.pause();
      agentLoop.pause();
    } else if (engine.state === 'paused') {
      engine.resume();
      // Restart agent loop
      agentLoop.pause();
      setTimeout(() => {
        const newLoop = agentLoop;
        newLoop.start();
      }, 100);
    } else {
      engine.start();
      agentLoop.start();
    }
  }, [engine, agentLoop]);

  const step = useCallback(() => {
    if (engine.state !== 'running') {
      engine.start();
    }
    engine.tick();
    engine.pause();
  }, [engine]);

  const getAgentData = useCallback(() => {
    const agent = engine.world.getEntity('agent_1');
    const identity = agent?.components.get('identity') as Identity | undefined;
    const needs = agent?.components.get('needs') as Needs | undefined;
    const pos = agent?.components.get('position') as Position | undefined;
    return { identity, needs, pos };
  }, [engine]);

  const getObjects = useCallback(() => {
    return engine.world.query(['object_state', 'position']);
  }, [engine]);

  return {
    tickCount,
    engineState,
    streamLines,
    toolCalls,
    toggle,
    step,
    getAgentData,
    getObjects,
  };
}

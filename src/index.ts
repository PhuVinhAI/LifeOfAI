#!/usr/bin/env node
import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import YAML from 'yaml';
import OpenAI from 'openai';
import { render } from 'ink';
import React from 'react';

import { GameEngine } from './core/engine.js';
import { CapabilityResolver } from './core/capability-resolver.js';
import { AgentLoop } from './ai/agent-loop.js';
import { PluginLoader } from './core/plugin-loader.js';
import { coreLifePlugin } from './plugins/core-life/index.js';
import { App } from './cli/app.js';
import { initLogger } from './core/logger.js';

import { createNeeds } from './plugins/core-life/components/needs.js';
import { createIdentity } from './plugins/core-life/components/identity.js';
import { createPosition } from './plugins/core-life/components/position.js';
import { createObjectState } from './plugins/core-life/components/object-state.js';
import { createInventory } from './plugins/core-life/components/inventory.js';
import { createGoalComponent } from './plugins/core-life/components/goal.js';
import { createTaskListComponent } from './plugins/core-life/components/task-list.js';

import type { RoomConfig, AgentConfig } from './types/index.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.resolve(__dirname, '..', 'data');

function loadYaml<T>(filename: string): T {
  const raw = fs.readFileSync(path.join(DATA_DIR, filename), 'utf-8');
  return YAML.parse(raw) as T;
}

async function main() {
  // 0. Init logger first — must be before everything else
  const logger = initLogger('logs');
  logger.info('startup', 'LifeOfAI starting', {
    version: '0.1.0',
    node: process.version,
    cwd: process.cwd(),
  });

  // 1. Load configs
  const roomConfig = loadYaml<RoomConfig>('room.yaml');
  const agentConfig = loadYaml<AgentConfig>('agent.yaml');
  logger.info('startup', 'Configs loaded', { room: roomConfig.id, agent: agentConfig.name });

  // 2. Init engine
  const engine = new GameEngine();

  // Pipe engine events to log
  engine.events.on('engine:tick', (t) => logger.debug('engine', `Tick ${t}`));
  engine.events.on('engine:time_advanced', (time, mins) => logger.debug('engine', `Time advanced ${mins} min`, { time }));
  engine.events.on('engine:play', () => logger.info('engine', 'Resumed'));
  engine.events.on('engine:pause', () => logger.info('engine', 'Paused'));
  engine.events.on('needs:critical', (agentId, need, value) => {
    logger.warn('needs', `Critical need: ${need}`, { agentId, need, value });
  });

  // 3. Load plugins
  const pluginLoader = new PluginLoader();
  pluginLoader.load(coreLifePlugin);
  pluginLoader.installSystems(engine.world, engine.events);

  // 4. Spawn room objects
  const traitRegistry = pluginLoader.getTraitRegistry();
  const traits = traitRegistry.getAll();

  for (const obj of roomConfig.objects) {
    // Build initial state map for each trait
    const stateMap: Record<string, string> = {};
    for (const traitName of obj.traits) {
      const trait = traitRegistry.get(traitName);
      stateMap[traitName] = trait?.initialState ?? 'idle';
    }

    const objectState = createObjectState(obj.name, obj.traits, stateMap, obj.traitConfig);

    // Inject container data if present
    if (obj.traitConfig?.containerData) {
      (objectState as any).containerData = obj.traitConfig.containerData;
    }

    engine.world.spawnEntity(`obj_${obj.name.replace(/\s+/g, '_')}`, [
      createPosition(obj.x, obj.y, roomConfig.id),
      objectState,
    ]);
  }

  // 5. Spawn agent
  const agentId = 'agent_1';
  const needs = createNeeds({
    hunger: agentConfig.needs?.hunger ?? 80,
    thirst: agentConfig.needs?.thirst ?? 80,
    energy: agentConfig.needs?.energy ?? 80,
    bladder: agentConfig.needs?.bladder ?? 80,
    hygiene: agentConfig.needs?.hygiene ?? 80,
    fun: agentConfig.needs?.fun ?? 80,
  });
  const identity = createIdentity(agentConfig.name, agentConfig.age, agentConfig.bio);
  const pos = createPosition(agentConfig.startX, agentConfig.startY, roomConfig.id);

  engine.world.spawnEntity(agentId, [needs, identity, pos, createInventory(10), createGoalComponent(), createTaskListComponent()]);

  // 6. Init AI — supports any OpenAI-compatible provider via OPENAI_BASE_URL
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    logger.error('startup', 'OPENAI_API_KEY missing');
    console.error('Lỗi: OPENAI_API_KEY chưa được set. Tạo file .env (copy từ .env.example).');
    process.exit(1);
  }
  const baseURL = process.env.OPENAI_BASE_URL;
  const model = process.env.OPENAI_MODEL ?? 'gpt-4o';
  logger.info('startup', 'OpenAI client configured', { baseURL: baseURL ?? '(default)', model });

  const openai = new OpenAI({
    apiKey,
    baseURL,
  });
  const resolver = new CapabilityResolver(traitRegistry);

  const agentLoop = new AgentLoop({
    agentId,
    openai,
    world: engine.world,
    resolver,
    events: engine.events,
    model,
    advanceTime: (minutes: number) => {
      engine.advanceTime(minutes);
      return engine.clock.formatTime();
    },
    getTimeString: () => engine.clock.formatFull(),
  });

  // 7. Render CLI
  const { waitUntilExit } = render(
    React.createElement(App, {
      engine,
      agentLoop,
      roomWidth: roomConfig.width,
      roomHeight: roomConfig.height,
    })
  );

  await waitUntilExit();
  agentLoop.pause();
  logger.info('shutdown', 'App exited');
  logger.close();
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});

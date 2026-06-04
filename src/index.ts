#!/usr/bin/env node
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

import { createNeeds } from './plugins/core-life/components/needs.js';
import { createIdentity } from './plugins/core-life/components/identity.js';
import { createPosition } from './plugins/core-life/components/position.js';
import { createObjectState } from './plugins/core-life/components/object-state.js';

import type { RoomConfig, AgentConfig } from './types/index.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.resolve(__dirname, '..', 'data');

function loadYaml<T>(filename: string): T {
  const raw = fs.readFileSync(path.join(DATA_DIR, filename), 'utf-8');
  return YAML.parse(raw) as T;
}

async function main() {
  // 1. Load configs
  const roomConfig = loadYaml<RoomConfig>('room.yaml');
  const agentConfig = loadYaml<AgentConfig>('agent.yaml');

  // 2. Init engine
  const engine = new GameEngine();

  // 3. Load plugins
  const pluginLoader = new PluginLoader();
  pluginLoader.load(coreLifePlugin);
  pluginLoader.installSystems(engine.world);

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

  engine.world.spawnEntity(agentId, [needs, identity, pos]);

  // 6. Init AI
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const resolver = new CapabilityResolver(traitRegistry);

  const agentLoop = new AgentLoop({
    agentId,
    openai,
    world: engine.world,
    resolver,
    events: engine.events,
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
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});

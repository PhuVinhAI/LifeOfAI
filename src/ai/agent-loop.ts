import OpenAI from 'openai';
import { CapabilityResolver } from '../core/capability-resolver.js';
import { WorldImpl } from '../core/ecs.js';
import { MemoryManager } from './memory.js';
import { selectGoal } from './goal-selector.js';
import { buildSystemPrompt } from './prompts/system.js';
import { createToolRegistry } from './tools/index.js';
import type { Needs } from '../plugins/core-life/components/needs.js';
import type { Identity } from '../plugins/core-life/components/identity.js';
import type { ObjectState } from '../plugins/core-life/components/object-state.js';
import type { IEventBus } from '../types/index.js';

export interface AgentConfig {
  agentId: string;
  openai: OpenAI;
  world: WorldImpl;
  resolver: CapabilityResolver;
  events: IEventBus;
  model?: string;
}

export class AgentLoop {
  private agentId: string;
  private openai: OpenAI;
  private world: WorldImpl;
  private resolver: CapabilityResolver;
  private events: IEventBus;
  private memory: MemoryManager;
  private model: string;
  private running = false;
  private abortController: AbortController | null = null;

  constructor(config: AgentConfig) {
    this.agentId = config.agentId;
    this.openai = config.openai;
    this.world = config.world;
    this.resolver = config.resolver;
    this.events = config.events;
    this.memory = new MemoryManager();
    this.model = config.model ?? 'gpt-4o';
  }

  /**
   * Start the never-ending agent loop.
   * Runs until pause() is called.
   */
  async start(): Promise<void> {
    if (this.running) return;
    this.running = true;
    this.abortController = new AbortController();

    while (this.running) {
      try {
        await this.runOneTurn();
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        this.events.emit('ai:stream', this.agentId, `[Lỗi: ${msg}]`);
        // Brief pause on error, then continue
        await new Promise(r => setTimeout(r, 1000));
      }
    }
  }

  /**
   * Run a single turn: build context → runTools → handle results → repeat.
   */
  private async runOneTurn(): Promise<void> {
    const agent = this.world.getEntity(this.agentId);
    if (!agent) {
      this.events.emit('ai:stream', this.agentId, '[Agent không tồn tại]');
      this.running = false;
      return;
    }

    const identity = agent.components.get('identity') as Identity | undefined;
    const needs = agent.components.get('needs') as Needs | undefined;

    if (!identity || !needs) {
      this.events.emit('ai:stream', this.agentId, '[Thiếu identity hoặc needs]');
      this.running = false;
      return;
    }

    // Select goal based on current needs
    const goal = selectGoal(needs);

    // Build room description
    const roomDesc = this.resolver.describeRoom(this.world);
    const tickCount = (this.world as any).tickCount ?? 0;

    // Build context
    const systemPrompt = buildSystemPrompt(identity, needs, roomDesc, tickCount);

    // Prepare messages — if first run, add system prompt. Otherwise reuse history.
    const messages = this.memory.getAll();
    if (messages.length === 0) {
      messages.push({ role: 'system', content: systemPrompt });
    } else {
      // Update system prompt with latest state
      messages[0] = { role: 'system', content: systemPrompt };
    }

    // Add current context as user message (simulation tick notification)
    const contextMsg = buildContextMessage(needs, goal, tickCount);
    messages.push({ role: 'user', content: contextMsg });

    // Run tools loop
    const tools = createToolRegistry(this.resolver, this.world, this.agentId);

    try {
      const runner = this.openai.chat.completions
        .runTools({
          model: this.model,
          stream: true,
          tools,
          messages,
        })
        .on('content', (diff) => {
          this.events.emit('ai:stream', this.agentId, diff);
        })
        .on('functionToolCallResult', (result: any) => {
          this.events.emit('ai:tool_result', this.agentId,
            result?.name ?? 'unknown',
            result?.result ?? {});
        });

      const final = await runner.finalChatCompletion();
      const allMessages = runner.messages;

      // Store all messages in memory
      this.memory.reset();
      for (const msg of allMessages) {
        this.memory.push(msg);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      this.events.emit('ai:stream', this.agentId, `\n[Lỗi OpenAI: ${msg}]\n`);
    }
  }

  /**
   * Pause the agent loop.
   */
  pause(): void {
    this.running = false;
    this.abortController?.abort();
  }

  isRunning(): boolean {
    return this.running;
  }
}

function buildContextMessage(needs: Needs, goal: { label: string; urgency: number }, tick: number): string {
  const criticals: string[] = [];
  if (needs.hunger < 20) criticals.push('ĐÓI TRẦM TRỌNG');
  if (needs.thirst < 20) criticals.push('KHÁT NGHIÊM TRỌNG');
  if (needs.bladder < 15) criticals.push('CẦN ĐI VỆ SINH GẤP');
  if (needs.energy < 10) criticals.push('KIỆT SỨC');

  let msg = `[Tick ${tick}] Ưu tiên: ${goal.label} (${goal.urgency}/100).`;
  if (criticals.length > 0) {
    msg += ` CẢNH BÁO: ${criticals.join(', ')}!`;
  }
  msg += ' Bạn muốn làm gì tiếp theo?';
  return msg;
}

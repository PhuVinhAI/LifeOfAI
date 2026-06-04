import OpenAI from 'openai';
import { CapabilityResolver } from '../core/capability-resolver.js';
import { WorldImpl } from '../core/ecs.js';
import { MemoryManager } from './memory.js';
import { buildSystemPrompt } from './prompts/system.js';
import { createToolRegistry } from './tools/index.js';
import { getLogger } from '../core/logger.js';
import type { Needs } from '../plugins/core-life/components/needs.js';
import type { Identity } from '../plugins/core-life/components/identity.js';
import type { IEventBus } from '../types/index.js';

export interface AgentConfig {
  agentId: string;
  openai: OpenAI;
  world: WorldImpl;
  resolver: CapabilityResolver;
  events: IEventBus;
  model?: string;
  advanceTime: (minutes: number) => string;
  getTimeString: () => string;
}

export class AgentLoop {
  private agentId: string;
  private openai: OpenAI;
  private world: WorldImpl;
  private resolver: CapabilityResolver;
  private events: IEventBus;
  private memory: MemoryManager;
  private model: string;
  private advanceTime: (minutes: number) => string;
  private getTimeString: () => string;
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
    this.advanceTime = config.advanceTime;
    this.getTimeString = config.getTimeString;
  }

  async start(): Promise<void> {
    if (this.running) return;
    this.running = true;
    this.abortController = new AbortController();
    const log = getLogger();
    log.info('agent-loop', 'Agent loop started', { agentId: this.agentId, model: this.model });

    let consecutiveErrors = 0;
    const MAX_ERRORS = 5;

    while (this.running) {
      try {
        await this.runOneTurn();
        consecutiveErrors = 0;
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        consecutiveErrors++;
        log.error('agent-loop', 'Turn failed', { agentId: this.agentId, error: msg, attempt: consecutiveErrors });
        this.events.emit('ai:stream', this.agentId, `\n[Lỗi ${consecutiveErrors}/${MAX_ERRORS}: ${msg}]\n`);

        if (consecutiveErrors >= MAX_ERRORS) {
          log.error('agent-loop', 'Max errors reached, stopping', { agentId: this.agentId });
          this.events.emit('ai:stream', this.agentId, `\n[Đã dừng vì lỗi liên tiếp quá nhiều]\n`);
          this.running = false;
          break;
        }

        const backoff = Math.min(16000, 1000 * Math.pow(2, consecutiveErrors - 1));
        await new Promise(r => setTimeout(r, backoff));
      }
    }
    log.info('agent-loop', 'Agent loop stopped', { agentId: this.agentId });
  }

  private async runOneTurn(): Promise<void> {
    const log = getLogger();
    const agent = this.world.getEntity(this.agentId);
    if (!agent) {
      log.error('agent-loop', 'Agent entity not found', { agentId: this.agentId });
      this.events.emit('ai:stream', this.agentId, '[Agent không tồn tại]');
      this.running = false;
      return;
    }

    const identity = agent.components.get('identity') as Identity | undefined;
    const needs = agent.components.get('needs') as Needs | undefined;

    if (!identity || !needs) {
      log.error('agent-loop', 'Missing required components', { agentId: this.agentId, hasIdentity: !!identity, hasNeeds: !!needs });
      this.events.emit('ai:stream', this.agentId, '[Thiếu identity hoặc needs]');
      this.running = false;
      return;
    }

    const timeStr = this.getTimeString();
    log.debug('agent-loop', 'Turn started', {
      agentId: this.agentId,
      time: timeStr,
      needs: { ...needs, type: undefined },
    });

    const roomDesc = this.resolver.describeRoom(this.world);

    const systemPrompt = buildSystemPrompt(identity, needs, roomDesc, timeStr);

    const messages = this.memory.getAll();
    if (messages.length === 0) {
      messages.push({ role: 'system', content: systemPrompt });
    } else {
      messages[0] = { role: 'system', content: systemPrompt };
    }

    const contextMsg = `[${timeStr}] Bạn cảm thấy thế nào? Bạn muốn làm gì lúc này?`;
    messages.push({ role: 'user', content: contextMsg });

    log.debug('agent-loop', 'Sending request to model', {
      agentId: this.agentId,
      model: this.model,
      messageCount: messages.length,
      contextMsg,
    });

    const tools = createToolRegistry(this.resolver, this.world, this.agentId);

    // Separator between turns so streamed thoughts don't stick together
    if (this.memory.getAll().length > 0) {
      this.events.emit('ai:stream', this.agentId, '\n───\n');
    }

    try {
      const toolCallMap = new Map<string, { name: string; args: Record<string, unknown> }>();
      let streamBuffer = '';
      let totalActionDuration = 0;
      let hadToolCall = false;  // Track tool calls to insert space when stream resumes

      const runner = this.openai.chat.completions
        .runTools({
          model: this.model,
          stream: true,
          tools,
          messages,
        })
        .on('content', (diff) => {
          // After a tool call, the model's next text chunk may lack a leading space.
          // Insert one if the buffer doesn't end with whitespace and delta is a word.
          if (hadToolCall && !/[\s\n]$/.test(streamBuffer) && /^[a-zA-ZÀ-ỹ]/.test(diff)) {
            streamBuffer += ' ';
            this.events.emit('ai:stream', this.agentId, ' ');
          }
          hadToolCall = false;
          streamBuffer += diff;
          this.events.emit('ai:stream', this.agentId, diff);
        })
        .on('functionToolCall', (call: any) => {
          hadToolCall = true;
          const id = call?.id ?? '';
          const name = call?.name ?? call?.function?.name ?? 'unknown';
          let args: Record<string, unknown> = {};
          try {
            const rawArgs = call?.arguments ?? call?.function?.arguments ?? '{}';
            args = typeof rawArgs === 'string' ? JSON.parse(rawArgs) : rawArgs;
          } catch (e) {
            log.warn('agent-loop', 'Failed to parse tool arguments', { rawArgs: call?.arguments, error: String(e) });
            args = {};
          }
          toolCallMap.set(id, { name, args });
          log.info('tool-call', `${name} invoked`, { agentId: this.agentId, tool: name, args });
          this.events.emit('ai:tool_call', this.agentId, name, args);
        })
        .on('functionToolCallResult', (result: any) => {
          const callId = result?.tool_call_id ?? result?.id ?? '';
          const tracked = toolCallMap.get(callId);
          const name = tracked?.name ?? result?.name ?? 'unknown';
          let rawResult = result?.result ?? result?.content ?? result;

          // Parse result to extract duration and message
          let parsed: any = rawResult;
          if (typeof rawResult === 'string') {
            try { parsed = JSON.parse(rawResult); } catch {}
          }
          const duration = parsed?.duration ?? 0;

          // Advance game time by the action's duration
          if (duration > 0) {
            totalActionDuration += duration;
            const newTime = this.advanceTime(duration);
            if (parsed?.message) {
              parsed.message = `${parsed.message} (⏱ ${duration} phút → ${newTime})`;
            }
          }

          // Only send natural message to AI — strip internal data
          const aiMessage = parsed?.message ?? (typeof parsed === 'string' ? parsed : JSON.stringify(parsed));
          const fullResult = typeof parsed === 'object' ? JSON.stringify(parsed) : String(rawResult);

          log.info('tool-result', `${name} returned`, { agentId: this.agentId, tool: name, result: fullResult });
          this.events.emit('ai:tool_result', this.agentId, name, aiMessage);
        });

      const final = await runner.finalChatCompletion();
      const allMessages = runner.messages;

      log.debug('agent-loop', 'Turn completed', {
        agentId: this.agentId,
        streamLength: streamBuffer.length,
        finalMessageCount: allMessages.length,
        actionDuration: totalActionDuration,
        usage: final.usage,
      });

      this.memory.reset();
      for (const msg of allMessages) {
        this.memory.push(msg);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      log.error('agent-loop', 'OpenAI request failed', { agentId: this.agentId, error: msg, stack: err instanceof Error ? err.stack : undefined });
      this.events.emit('ai:stream', this.agentId, `\n[Lỗi OpenAI: ${msg}]\n`);
    }
  }

  pause(): void {
    this.running = false;
    this.abortController?.abort();
  }

  isRunning(): boolean {
    return this.running;
  }
}


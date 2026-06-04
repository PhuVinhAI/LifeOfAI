import type { ChatCompletionMessageParam } from 'openai/resources/chat';

const DEFAULT_MAX_TOKENS = 8000;   // Conservative limit for MVP
const AVG_CHARS_PER_TOKEN = 4;

export class MemoryManager {
  private history: ChatCompletionMessageParam[] = [];
  private maxTokens: number;

  constructor(maxTokens = DEFAULT_MAX_TOKENS) {
    this.maxTokens = maxTokens;
  }

  /**
   * Add a message to memory and trim if needed.
   */
  push(message: ChatCompletionMessageParam): void {
    this.history.push(message);
    this.trim();
  }

  /**
   * Get all stored messages.
   */
  getAll(): ChatCompletionMessageParam[] {
    return [...this.history];
  }

  /**
   * Estimate token count from message content strings.
   */
  estimateTokens(): number {
    let chars = 0;
    for (const msg of this.history) {
      if (typeof msg.content === 'string') chars += msg.content.length;
      else if (Array.isArray(msg.content)) {
        for (const part of msg.content) {
          if ('text' in part) chars += part.text.length;
        }
      }
    }
    return Math.ceil(chars / AVG_CHARS_PER_TOKEN);
  }

  /**
   * Trim oldest messages until under token limit.
   * Always keeps the first message (system prompt).
   */
  private trim(): void {
    const keepFirst = this.history.length > 0 && this.history[0]?.role === 'system' ? 1 : 0;
    while (this.history.length > keepFirst + 4 && this.estimateTokens() > this.maxTokens) {
      // Remove message at index keepFirst (first non-system)
      this.history.splice(keepFirst, 1);
    }
  }

  /**
   * Reset all memory.
   */
  reset(): void {
    this.history = [];
  }

  /**
   * Returns summary stats for debugging.
   */
  getStats(): { messageCount: number; estimatedTokens: number } {
    return {
      messageCount: this.history.length,
      estimatedTokens: this.estimateTokens(),
    };
  }
}

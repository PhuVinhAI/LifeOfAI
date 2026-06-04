import { describe, it, expect } from 'vitest';
import { MemoryManager } from '../../../src/ai/memory.js';

describe('MemoryManager', () => {
  it('stores and retrieves messages', () => {
    const mem = new MemoryManager();
    mem.push({ role: 'system', content: 'You are an AI.' });
    mem.push({ role: 'user', content: 'Hello' });
    expect(mem.getAll()).toHaveLength(2);
  });

  it('estimates token count', () => {
    const mem = new MemoryManager();
    mem.push({ role: 'user', content: 'Hello world' });
    const tokens = mem.estimateTokens();
    expect(tokens).toBeGreaterThan(0);
    expect(tokens).toBeLessThan(50);
  });

  it('resets memory', () => {
    const mem = new MemoryManager();
    mem.push({ role: 'user', content: 'test' });
    mem.reset();
    expect(mem.getAll()).toHaveLength(0);
  });

  it('trims old messages when over limit', () => {
    const mem = new MemoryManager(50); // Very small limit
    mem.push({ role: 'user', content: 'A'.repeat(200) });
    mem.push({ role: 'user', content: 'B'.repeat(200) });
    mem.push({ role: 'user', content: 'C'.repeat(200) });
    // Should have trimmed some
    const stats = mem.getStats();
    expect(stats.messageCount).toBeLessThanOrEqual(5); // system + 4 kept
  });
});

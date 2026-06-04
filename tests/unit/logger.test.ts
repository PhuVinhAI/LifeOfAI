import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { Logger } from '../../src/core/logger.js';

function makeTempDir(): string {
  const dir = path.join(os.tmpdir(), `lifeofai-test-${Date.now()}-${Math.floor(Math.random() * 10000)}`);
  fs.mkdirSync(dir, { recursive: true });
  return dir;
}

async function closeAndRead(logger: Logger): Promise<string> {
  const file = logger.getLogFile();
  logger.close();
  // Give the write stream a moment to flush
  await new Promise(r => setTimeout(r, 50));
  return fs.readFileSync(file, 'utf-8');
}

describe('Logger', () => {
  it('creates logs directory and session file', async () => {
    const dir = makeTempDir();
    const logger = new Logger(dir);
    expect(fs.existsSync(dir)).toBe(true);
    // File is created lazily on first write — logger init already writes one entry, give it a moment to flush
    await new Promise(r => setTimeout(r, 100));
    expect(fs.existsSync(logger.getLogFile())).toBe(true);
    await closeAndRead(logger);
  });

  it('writes JSONL entries', async () => {
    const dir = makeTempDir();
    const logger = new Logger(dir);
    logger.info('test', 'hello world', { foo: 'bar' });
    const content = await closeAndRead(logger);
    const lines = content.trim().split('\n');
    const infoEntry = lines.map(l => JSON.parse(l)).find(e => e.message === 'hello world');
    expect(infoEntry).toBeDefined();
    expect(infoEntry.level).toBe('info');
    expect(infoEntry.category).toBe('test');
    expect(infoEntry.data).toEqual({ foo: 'bar' });
  });

  it('supports all log levels', async () => {
    const dir = makeTempDir();
    const logger = new Logger(dir);
    logger.debug('cat', 'debug msg');
    logger.info('cat', 'info msg');
    logger.warn('cat', 'warn msg');
    logger.error('cat', 'error msg');
    const content = await closeAndRead(logger);
    const lines = content.trim().split('\n').map(l => JSON.parse(l));
    const levels = lines.map(l => l.level);
    expect(levels).toContain('debug');
    expect(levels).toContain('info');
    expect(levels).toContain('warn');
    expect(levels).toContain('error');
  });

  it('generates session IDs', () => {
    const dir = makeTempDir();
    const logger = new Logger(dir);
    expect(logger.getSessionId()).toMatch(/^\d{8}-\d{6}$/);
    logger.close();
  });
});

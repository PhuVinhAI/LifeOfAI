import fs from 'fs';
import path from 'path';

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  category: string;
  message: string;
  data?: Record<string, unknown>;
}

export class Logger {
  private logFilePath: string;
  private stream: fs.WriteStream | null = null;
  private sessionId: string;
  private startTime: number;

  constructor(logsDir = 'logs') {
    this.startTime = Date.now();
    this.sessionId = this.formatSessionId(this.startTime);

    // Ensure logs directory exists
    if (!fs.existsSync(logsDir)) {
      fs.mkdirSync(logsDir, { recursive: true });
    }

    this.logFilePath = path.join(logsDir, `session-${this.sessionId}.jsonl`);
    this.stream = fs.createWriteStream(this.logFilePath, { flags: 'a', encoding: 'utf-8' });

    this.info('logger', 'Logger initialized', { sessionId: this.sessionId, file: this.logFilePath });
  }

  private formatSessionId(timestamp: number): string {
    const d = new Date(timestamp);
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}-${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`;
  }

  private write(entry: LogEntry): void {
    if (!this.stream) return;
    try {
      this.stream.write(JSON.stringify(entry) + '\n');
    } catch {
      // Don't crash the app if logging fails
    }
  }

  log(level: LogLevel, category: string, message: string, data?: Record<string, unknown>): void {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      category,
      message,
      ...(data && { data }),
    };
    this.write(entry);
  }

  debug(category: string, message: string, data?: Record<string, unknown>): void {
    this.log('debug', category, message, data);
  }

  info(category: string, message: string, data?: Record<string, unknown>): void {
    this.log('info', category, message, data);
  }

  warn(category: string, message: string, data?: Record<string, unknown>): void {
    this.log('warn', category, message, data);
  }

  error(category: string, message: string, data?: Record<string, unknown>): void {
    this.log('error', category, message, data);
  }

  getLogFile(): string {
    return this.logFilePath;
  }

  getSessionId(): string {
    return this.sessionId;
  }

  close(): void {
    if (this.stream) {
      this.info('logger', 'Logger closing', { uptime: Date.now() - this.startTime });
      this.stream.end();
      this.stream = null;
    }
  }
}

// Singleton — set once on app startup
let globalLogger: Logger | null = null;

export function initLogger(logsDir?: string): Logger {
  if (globalLogger) return globalLogger;
  globalLogger = new Logger(logsDir);
  return globalLogger;
}

export function getLogger(): Logger {
  if (!globalLogger) {
    globalLogger = new Logger();
  }
  return globalLogger;
}

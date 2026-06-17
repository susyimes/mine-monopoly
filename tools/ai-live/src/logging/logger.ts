import { mkdir, appendFile } from "node:fs/promises";
import { dirname } from "node:path";
import { inspect } from "node:util";

export type LogLevel = "debug" | "info" | "warn" | "error" | "silent";

export type LogPayload = Record<string, unknown> | string | number | boolean | null | undefined;

export interface LogRecord {
  ts: string;
  level: Exclude<LogLevel, "silent">;
  scope: string;
  message: string;
  data?: unknown;
}

export interface LoggerOptions {
  level?: LogLevel;
  scope?: string;
  jsonlPath?: string;
  console?: Pick<Console, "debug" | "info" | "warn" | "error">;
}

const levelWeight: Record<LogLevel, number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
  silent: 99,
};

export class Logger {
  private readonly level: LogLevel;
  private readonly scope: string;
  private readonly jsonlPath?: string;
  private readonly output: Pick<Console, "debug" | "info" | "warn" | "error">;

  constructor(options: LoggerOptions = {}) {
    this.level = options.level ?? envLogLevel() ?? "info";
    this.scope = options.scope ?? "ai-live";
    this.jsonlPath = options.jsonlPath;
    this.output = options.console ?? console;
  }

  child(scope: string): Logger {
    return new Logger({
      level: this.level,
      scope: `${this.scope}:${scope}`,
      jsonlPath: this.jsonlPath,
      console: this.output,
    });
  }

  debug(message: string, data?: LogPayload): Promise<void> {
    return this.write("debug", message, data);
  }

  info(message: string, data?: LogPayload): Promise<void> {
    return this.write("info", message, data);
  }

  warn(message: string, data?: LogPayload): Promise<void> {
    return this.write("warn", message, data);
  }

  error(message: string, data?: LogPayload): Promise<void> {
    return this.write("error", message, data);
  }

  private async write(level: Exclude<LogLevel, "silent">, message: string, data?: LogPayload): Promise<void> {
    if (levelWeight[level] < levelWeight[this.level]) {
      return;
    }

    const record: LogRecord = {
      ts: new Date().toISOString(),
      level,
      scope: this.scope,
      message,
    };

    if (data !== undefined) {
      record.data = normalizeForJson(data);
    }

    const line = `[${record.ts}] ${level.toUpperCase()} ${this.scope} ${message}`;
    const dataText = data === undefined ? "" : ` ${inspect(data, { depth: 5, colors: false, compact: true })}`;
    this.output[level](line + dataText);

    if (this.jsonlPath) {
      await mkdir(dirname(this.jsonlPath), { recursive: true });
      await appendFile(this.jsonlPath, `${safeJsonStringify(record)}\n`, "utf8");
    }
  }
}

export function createLogger(options: LoggerOptions = {}): Logger {
  return new Logger(options);
}

export function normalizeError(error: unknown): Record<string, unknown> {
  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
      stack: error.stack,
    };
  }

  return {
    name: "UnknownError",
    message: typeof error === "string" ? error : safeJsonStringify(normalizeForJson(error)),
  };
}

export function safeJsonStringify(value: unknown): string {
  const seen = new WeakSet<object>();

  return JSON.stringify(value, (_key, item) => {
    if (typeof item === "bigint") {
      return item.toString();
    }

    if (typeof item === "object" && item !== null) {
      if (seen.has(item)) {
        return "[Circular]";
      }
      seen.add(item);
    }

    if (item instanceof Error) {
      return normalizeError(item);
    }

    return item;
  });
}

function normalizeForJson(value: unknown): unknown {
  try {
    return JSON.parse(safeJsonStringify(value));
  } catch {
    return inspect(value, { depth: 5, colors: false, compact: true });
  }
}

function envLogLevel(): LogLevel | undefined {
  const raw = process.env.AI_LIVE_LOG_LEVEL?.toLowerCase();
  if (raw === "debug" || raw === "info" || raw === "warn" || raw === "error" || raw === "silent") {
    return raw;
  }

  return undefined;
}

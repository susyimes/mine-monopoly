import { mkdir, writeFile, appendFile } from "node:fs/promises";
import path from "node:path";
import { normalizeError, safeJsonStringify } from "../logging/logger";

export type RunStatus = "running" | "passed" | "failed" | "skipped";

export interface RunMetadata {
  roomId: string;
  runId: string;
  startedAt: string;
  logRoot: string;
  runDir: string;
  metadata: Record<string, unknown>;
}

export interface AiLiveRunEvent {
  type: string;
  actor?: string;
  phase?: string;
  message?: string;
  data?: unknown;
}

export interface AiLiveDecision {
  actor: string;
  decision: string;
  reason?: string;
  data?: unknown;
  latencyMs?: number;
}

export interface BrowserConsoleEvent {
  page: string;
  type: string;
  text: string;
  location?: unknown;
}

export interface ErrorRecord {
  phase?: string;
  page?: string;
  error: unknown;
  data?: unknown;
}

export interface ScreenshotRecord {
  label: string;
  path: string;
  relativePath: string;
  page?: string;
  ts: string;
}

export type RecorderChannel = "events" | "decisions" | "browserConsole" | "errors" | "screenshots";

export type RecorderRecord =
  | { channel: "events"; value: AiLiveRunEvent & { ts: string; runId: string; roomId: string } }
  | { channel: "decisions"; value: AiLiveDecision & { ts: string; runId: string; roomId: string } }
  | { channel: "browserConsole"; value: BrowserConsoleEvent & { ts: string; runId: string; roomId: string } }
  | { channel: "errors"; value: ErrorRecord & { ts: string; runId: string; roomId: string } }
  | { channel: "screenshots"; value: ScreenshotRecord };

export type RecorderListener = (record: RecorderRecord) => void | Promise<void>;

export interface EventRecorderOptions {
  roomId: string;
  logsRoot?: string;
  runId?: string;
  now?: Date;
  metadata?: Record<string, unknown>;
}

export interface RunSummary {
  runId: string;
  roomId: string;
  status: RunStatus;
  startedAt: string;
  endedAt?: string;
  durationMs?: number;
  paths: {
    logRoot: string;
    runDir: string;
    events: string;
    decisions: string;
    browserConsole: string;
    errors: string;
    summary: string;
    screenshotsDir: string;
    tracesDir: string;
  };
  counters: {
    events: number;
    decisions: number;
    browserConsole: number;
    errors: number;
    screenshots: number;
  };
  eventTypes: Record<string, number>;
  screenshots: ScreenshotRecord[];
  metadata: Record<string, unknown>;
}

type JsonlName = "events" | "decisions" | "browserConsole" | "errors";

const MAX_BROWSER_CONSOLE_RECORDS = readPositiveIntEnv("AI_LIVE_BROWSER_CONSOLE_LIMIT", 5000);
const MAX_BROWSER_CONSOLE_TEXT_LENGTH = readPositiveIntEnv("AI_LIVE_BROWSER_CONSOLE_TEXT_LIMIT", 2000);

const jsonlFiles: Record<JsonlName, string> = {
  events: "events.jsonl",
  decisions: "decisions.jsonl",
  browserConsole: "browser-console.jsonl",
  errors: "errors.jsonl",
};

export class EventRecorder {
  readonly roomId: string;
  readonly runId: string;
  readonly logsRoot: string;
  readonly runDir: string;
  readonly screenshotsDir: string;
  readonly tracesDir: string;

  private readonly startedAt: Date;
  private readonly metadata: Record<string, unknown>;
  private readonly screenshots: ScreenshotRecord[] = [];
  private readonly listeners = new Set<RecorderListener>();
  private readonly eventTypes: Record<string, number> = {};
  private readonly counters = {
    events: 0,
    decisions: 0,
    browserConsole: 0,
    errors: 0,
    screenshots: 0,
  };
  private status: RunStatus = "running";
  private endedAt?: Date;

  private constructor(options: Required<Omit<EventRecorderOptions, "metadata">> & { metadata: Record<string, unknown> }) {
    this.roomId = sanitizeSegment(options.roomId);
    this.startedAt = options.now;
    this.runId = options.runId;
    this.logsRoot = path.resolve(options.logsRoot);
    this.runDir = path.join(this.logsRoot, this.runId);
    this.screenshotsDir = path.join(this.runDir, "screenshots");
    this.tracesDir = path.join(this.runDir, "traces");
    this.metadata = options.metadata;
  }

  static async create(options: EventRecorderOptions): Promise<EventRecorder> {
    const now = options.now ?? new Date();
    const roomId = sanitizeSegment(options.roomId);
    const logsRoot = options.logsRoot ?? path.resolve(process.cwd(), "logs");
    const runId = options.runId ? sanitizeSegment(options.runId) : `${formatTimestamp(now)}-${roomId}`;

    const recorder = new EventRecorder({
      roomId,
      logsRoot,
      runId,
      now,
      metadata: options.metadata ?? {},
    });

    await recorder.init();
    return recorder;
  }

  get metadataSnapshot(): RunMetadata {
    return {
      roomId: this.roomId,
      runId: this.runId,
      startedAt: this.startedAt.toISOString(),
      logRoot: this.logsRoot,
      runDir: this.runDir,
      metadata: this.metadata,
    };
  }

  getPath(name: JsonlName | "summary"): string {
    if (name === "summary") {
      return path.join(this.runDir, "summary.json");
    }

    return path.join(this.runDir, jsonlFiles[name]);
  }

  addListener(listener: RecorderListener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  getScreenshotPath(label: string, extension = "png"): string {
    const index = String(this.counters.screenshots + 1).padStart(3, "0");
    return path.join(this.screenshotsDir, `${index}-${sanitizeSegment(label)}.${sanitizeSegment(extension)}`);
  }

  async recordEvent(event: AiLiveRunEvent): Promise<void> {
    const type = event.type || "event";
    this.counters.events += 1;
    this.eventTypes[type] = (this.eventTypes[type] ?? 0) + 1;

    const value = {
      ts: new Date().toISOString(),
      runId: this.runId,
      roomId: this.roomId,
      ...event,
      type,
    };
    await this.appendJsonl("events", value);
    this.emitRecord({ channel: "events", value });
    await this.writeSummary();
  }

  record(event: { type: string; source?: string; data?: unknown }): void {
    void this.recordEvent({
      type: event.type,
      actor: event.source,
      data: event.data,
    });
  }

  screenshotPath(label: string): string {
    return this.getScreenshotPath(label);
  }

  count(): number {
    return this.counters.events;
  }

  async recordDecision(decision: AiLiveDecision): Promise<void> {
    this.counters.decisions += 1;
    const value = {
      ts: new Date().toISOString(),
      runId: this.runId,
      roomId: this.roomId,
      ...decision,
    };
    await this.appendJsonl("decisions", value);
    this.emitRecord({ channel: "decisions", value });
    await this.writeSummary();
  }

  async recordBrowserConsole(event: BrowserConsoleEvent): Promise<void> {
    if (shouldSkipBrowserConsole(event)) return;
    if (this.counters.browserConsole >= MAX_BROWSER_CONSOLE_RECORDS) return;
    this.counters.browserConsole += 1;
    const value = {
      ts: new Date().toISOString(),
      runId: this.runId,
      roomId: this.roomId,
      ...event,
      text: trimConsoleText(event.text),
    };
    await this.appendJsonl("browserConsole", value);
    this.emitRecord({ channel: "browserConsole", value });
    await this.writeSummary();
  }

  async recordError(record: ErrorRecord): Promise<void> {
    this.counters.errors += 1;
    const value = {
      ts: new Date().toISOString(),
      runId: this.runId,
      roomId: this.roomId,
      phase: record.phase,
      page: record.page,
      error: normalizeError(record.error),
      data: record.data,
    };
    await this.appendJsonl("errors", value);
    this.emitRecord({ channel: "errors", value });
    await this.writeSummary();
  }

  async recordScreenshot(input: { label: string; path: string; page?: string }): Promise<ScreenshotRecord> {
    const absolutePath = path.resolve(input.path);
    const item: ScreenshotRecord = {
      label: input.label,
      page: input.page,
      path: absolutePath,
      relativePath: toPosix(path.relative(this.runDir, absolutePath)),
      ts: new Date().toISOString(),
    };

    this.counters.screenshots += 1;
    this.screenshots.push(item);
    this.emitRecord({ channel: "screenshots", value: item });
    await this.writeSummary();
    return item;
  }

  async close(status: RunStatus): Promise<RunSummary> {
    this.status = status;
    this.endedAt = new Date();
    return this.writeSummary();
  }

  async writeSummary(): Promise<RunSummary> {
    const summary = this.summary();
    await writeFile(this.getPath("summary"), `${JSON.stringify(summary, null, 2)}\n`, "utf8");
    return summary;
  }

  private async init(): Promise<void> {
    await mkdir(this.runDir, { recursive: true });
    await mkdir(this.screenshotsDir, { recursive: true });
    await mkdir(this.tracesDir, { recursive: true });

    await Promise.all(
      Object.values(jsonlFiles).map((fileName) => writeFile(path.join(this.runDir, fileName), "", { flag: "a" }))
    );
    await this.writeSummary();
  }

  private async appendJsonl(name: JsonlName, value: unknown): Promise<void> {
    await appendFile(this.getPath(name), `${safeJsonStringify(value)}\n`, "utf8");
  }

  private emitRecord(record: RecorderRecord): void {
    for (const listener of this.listeners) {
      void Promise.resolve(listener(record)).catch(() => undefined);
    }
  }

  private summary(): RunSummary {
    const endedAt = this.endedAt?.toISOString();
    const durationMs = this.endedAt ? this.endedAt.getTime() - this.startedAt.getTime() : Date.now() - this.startedAt.getTime();

    return {
      runId: this.runId,
      roomId: this.roomId,
      status: this.status,
      startedAt: this.startedAt.toISOString(),
      endedAt,
      durationMs,
      paths: {
        logRoot: this.logsRoot,
        runDir: this.runDir,
        events: this.getPath("events"),
        decisions: this.getPath("decisions"),
        browserConsole: this.getPath("browserConsole"),
        errors: this.getPath("errors"),
        summary: this.getPath("summary"),
        screenshotsDir: this.screenshotsDir,
        tracesDir: this.tracesDir,
      },
      counters: { ...this.counters },
      eventTypes: { ...this.eventTypes },
      screenshots: [...this.screenshots],
      metadata: { ...this.metadata },
    };
  }
}

export function sanitizeSegment(value: string): string {
  const sanitized = String(value)
    .trim()
    .replace(/[^a-zA-Z0-9_.-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);

  return sanitized || "run";
}

export function formatTimestamp(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return [
    date.getFullYear(),
    pad(date.getMonth() + 1),
    pad(date.getDate()),
    "-",
    pad(date.getHours()),
    pad(date.getMinutes()),
    pad(date.getSeconds()),
  ].join("");
}

function shouldSkipBrowserConsole(event: BrowserConsoleEvent): boolean {
  const text = event.text ?? "";
  if (event.type === "debug" && /\[vite\]/i.test(text)) return true;
  if (/\[AudioManager\]|音效系统|浏览器环境不支持自动更新|^\[Platform\]/.test(text)) return true;
  return false;
}

function trimConsoleText(text: string): string {
  if (text.length <= MAX_BROWSER_CONSOLE_TEXT_LENGTH) return text;
  return `${text.slice(0, MAX_BROWSER_CONSOLE_TEXT_LENGTH)}...[truncated ${text.length - MAX_BROWSER_CONSOLE_TEXT_LENGTH} chars]`;
}

function readPositiveIntEnv(name: string, fallback: number): number {
  const value = Number(process.env[name]);
  return Number.isInteger(value) && value > 0 ? value : fallback;
}

function toPosix(value: string): string {
  return value.split(path.sep).join("/");
}

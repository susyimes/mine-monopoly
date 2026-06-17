import { existsSync } from "node:fs";
import { readdir, readFile, stat } from "node:fs/promises";
import path from "node:path";
import type { RunSummary } from "./event-recorder";

export interface RunSummaryReport {
  logsRoot: string;
  runDir?: string;
  summary?: RunSummary;
  recentEvents: unknown[];
  recentErrors: unknown[];
}

export interface ReadLastOptions {
  logsRoot?: string;
  tail?: number;
}

export function defaultLogsRoot(): string {
  return path.resolve(process.cwd(), "logs");
}

export async function listRunDirs(logsRoot = defaultLogsRoot()): Promise<string[]> {
  const absoluteRoot = path.resolve(logsRoot);
  if (!existsSync(absoluteRoot)) {
    return [];
  }

  const entries = await readdir(absoluteRoot, { withFileTypes: true });
  const dirs = await Promise.all(
    entries
      .filter((entry) => entry.isDirectory())
      .map(async (entry) => {
        const runDir = path.join(absoluteRoot, entry.name);
        const runStat = await stat(runDir);
        return { runDir, mtimeMs: runStat.mtimeMs };
      })
  );

  return dirs.sort((a, b) => b.mtimeMs - a.mtimeMs).map((item) => item.runDir);
}

export async function readLastRunSummary(options: ReadLastOptions = {}): Promise<RunSummaryReport> {
  const logsRoot = path.resolve(options.logsRoot ?? defaultLogsRoot());
  const tail = options.tail ?? 8;
  const runDirs = await listRunDirs(logsRoot);

  for (const runDir of runDirs) {
    const summaryPath = path.join(runDir, "summary.json");
    if (!existsSync(summaryPath)) {
      continue;
    }

    const summary = JSON.parse(await readFile(summaryPath, "utf8")) as RunSummary;
    return {
      logsRoot,
      runDir,
      summary,
      recentEvents: await readJsonlTail(path.join(runDir, "events.jsonl"), tail),
      recentErrors: await readJsonlTail(path.join(runDir, "errors.jsonl"), tail),
    };
  }

  return {
    logsRoot,
    recentEvents: [],
    recentErrors: [],
  };
}

export function formatRunSummary(report: RunSummaryReport): string {
  if (!report.summary) {
    return [
      "AI live report:last",
      `No run summary found under: ${report.logsRoot}`,
      "Run test:smoke or run:rules first so logs/<timestamp-room>/summary.json exists.",
    ].join("\n");
  }

  const summary = report.summary;
  const lines = [
    "AI live report:last",
    `Run: ${summary.runId}`,
    `Room: ${summary.roomId}`,
    `Status: ${summary.status}`,
    `Started: ${summary.startedAt}`,
    `Ended: ${summary.endedAt ?? "running"}`,
    `Duration: ${formatDuration(summary.durationMs ?? 0)}`,
    `Events: ${summary.counters.events}`,
    `Decisions: ${summary.counters.decisions}`,
    `Browser console: ${summary.counters.browserConsole}`,
    `Errors: ${summary.counters.errors}`,
    `Screenshots: ${summary.counters.screenshots}`,
    "",
    "Artifacts:",
    `- summary: ${summary.paths.summary}`,
    `- events: ${summary.paths.events}`,
    `- decisions: ${summary.paths.decisions}`,
    `- browser console: ${summary.paths.browserConsole}`,
    `- errors: ${summary.paths.errors}`,
    `- screenshots: ${summary.paths.screenshotsDir}`,
    `- traces: ${summary.paths.tracesDir}`,
  ];

  if (summary.screenshots.length > 0) {
    lines.push("", "Screenshots:");
    for (const screenshot of summary.screenshots) {
      lines.push(`- ${screenshot.label}${screenshot.page ? ` (${screenshot.page})` : ""}: ${screenshot.path}`);
    }
  }

  if (report.recentErrors.length > 0) {
    lines.push("", "Recent errors:");
    for (const item of report.recentErrors) {
      lines.push(`- ${formatJsonlItem(item)}`);
    }
  }

  if (report.recentEvents.length > 0) {
    lines.push("", "Recent events:");
    for (const item of report.recentEvents) {
      lines.push(`- ${formatJsonlItem(item)}`);
    }
  }

  return lines.join("\n");
}

async function readJsonlTail(filePath: string, tail: number): Promise<unknown[]> {
  if (!existsSync(filePath)) {
    return [];
  }

  const content = await readFile(filePath, "utf8");
  const lines = content
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .slice(-tail);

  return lines.map((line) => {
    try {
      return JSON.parse(line);
    } catch {
      return { raw: line };
    }
  });
}

function formatDuration(durationMs: number): string {
  const seconds = Math.round(durationMs / 1000);
  const minutes = Math.floor(seconds / 60);
  const rest = seconds % 60;
  return minutes > 0 ? `${minutes}m ${rest}s` : `${rest}s`;
}

function formatJsonlItem(item: unknown): string {
  if (item && typeof item === "object") {
    const record = item as Record<string, unknown>;
    const ts = typeof record.ts === "string" ? `${record.ts} ` : "";
    const type = typeof record.type === "string" ? `${record.type}` : "";
    const phase = typeof record.phase === "string" ? ` phase=${record.phase}` : "";
    const actor = typeof record.actor === "string" ? ` actor=${record.actor}` : "";
    const message = typeof record.message === "string" ? ` ${record.message}` : "";
    if (type || phase || actor || message) {
      return `${ts}${type}${phase}${actor}${message}`.trim();
    }
  }

  return JSON.stringify(item);
}

function parseArgs(argv: string[]): { logsRoot?: string; json: boolean; tail?: number } {
  const result: { logsRoot?: string; json: boolean; tail?: number } = { json: false };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--json") {
      result.json = true;
    } else if (arg === "--logs-root") {
      result.logsRoot = argv[index + 1];
      index += 1;
    } else if (arg === "--tail") {
      const tail = Number(argv[index + 1]);
      if (Number.isFinite(tail) && tail >= 0) {
        result.tail = tail;
      }
      index += 1;
    }
  }

  return result;
}

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));
  const report = await readLastRunSummary({ logsRoot: args.logsRoot, tail: args.tail });

  if (args.json) {
    console.log(JSON.stringify(report, null, 2));
  } else {
    console.log(formatRunSummary(report));
  }

  if (!report.summary) {
    process.exitCode = 1;
  }
}

if (require.main === module) {
  main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}

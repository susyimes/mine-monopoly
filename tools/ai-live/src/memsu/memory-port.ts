import { mkdir, appendFile, readFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import type { RunSummary } from "../recorder/event-recorder";

export interface MemsuAgentProfile {
  id: string;
  label?: string;
  personaId?: string;
  memoryRef?: string;
  traits?: Record<string, unknown>;
}

export interface MemsuMemoryPortOptions {
  memsuRoot: string;
  now?: () => Date;
}

export interface MemsuRunReflection {
  kind: "proposed_memory";
  source: "game-agent-colony";
  game: "monopoly";
  runId: string;
  roomId: string;
  status: string;
  at: string;
  summary: {
    durationMs?: number;
    events: number;
    decisions: number;
    errors: number;
    eventTypes: Record<string, number>;
  };
  memoryBoundary: string;
}

export class MemsuMemoryPort {
  private readonly memsuRoot: string;
  private readonly now: () => Date;

  constructor(options: MemsuMemoryPortOptions) {
    this.memsuRoot = path.resolve(options.memsuRoot);
    this.now = options.now ?? (() => new Date());
  }

  async loadAgentProfiles(): Promise<MemsuAgentProfile[]> {
    const filePath = path.join(this.memsuRoot, ".memsuos", "game-agent-profiles.local.json");
    if (!existsSync(filePath)) return [];
    const decoded = JSON.parse(await readFile(filePath, "utf8")) as { agents?: MemsuAgentProfile[] } | MemsuAgentProfile[];
    return Array.isArray(decoded) ? decoded : decoded.agents ?? [];
  }

  async appendRunReflection(summary: RunSummary): Promise<string> {
    const filePath = path.join(this.memsuRoot, ".memsuos", "game-agent-memory.jsonl");
    await mkdir(path.dirname(filePath), { recursive: true });
    const reflection = this.toRunReflection(summary);
    await appendFile(filePath, `${JSON.stringify(reflection)}\n`, "utf8");
    return filePath;
  }

  private toRunReflection(summary: RunSummary): MemsuRunReflection {
    return {
      kind: "proposed_memory",
      source: "game-agent-colony",
      game: "monopoly",
      runId: summary.runId,
      roomId: summary.roomId,
      status: summary.status,
      at: this.now().toISOString(),
      summary: {
        durationMs: summary.durationMs,
        events: summary.counters.events,
        decisions: summary.counters.decisions,
        errors: summary.counters.errors,
        eventTypes: summary.eventTypes
      },
      memoryBoundary:
        "Candidate memory only. It may inform future prompts or retrospectives, but cannot grant authorization, lower safety thresholds, or replace a game adapter decision."
    };
  }
}

export function createMemsuMemoryPort(options: MemsuMemoryPortOptions): MemsuMemoryPort {
  return new MemsuMemoryPort(options);
}

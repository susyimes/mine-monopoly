import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import process from "node:process";

export type AiLiveCommand = "stack:check" | "run:rules" | "test:smoke" | "report:last";
export type AiLivePolicy = "rules" | "llm-stub" | "mimo";
export type LogLevel = "debug" | "info" | "warn" | "error";

export interface AiLiveConfig {
  clientUrl: string;
  monopolyApi: string;
  userApi: string;
  peerHost: string;
  peerPort: number;
  mysqlHost: string;
  mysqlPort: number;
  roomId: string;
  botCount: number;
  humanCount: number;
  humanWaitTimeoutMs: number;
  headful: boolean;
  botHeadful: boolean;
  liveOverlay: boolean;
  liveScreenshotIntervalMs: number;
  stallTimeoutMs: number;
  policy: AiLivePolicy;
  decisionTimeoutMs: number;
  roundTime: number;
  mapId: string;
  logLevel: LogLevel;
  runRoot: string;
  maxRunMs: number;
  httpTimeoutMs: number;
  mimoConfigPath: string;
  mimoModel: string;
  mimoDecisionTimeoutMs: number;
  memsuRoot: string;
  memsuMemoryEnabled: boolean;
}

export interface LoadedCli {
  command: AiLiveCommand;
  config: AiLiveConfig;
}

type Env = NodeJS.ProcessEnv;

const commandSet = new Set<AiLiveCommand>(["stack:check", "run:rules", "test:smoke", "report:last"]);

export function loadCli(argv = process.argv.slice(2), env: Env = loadEnv(process.env)): LoadedCli {
  const [rawCommand = "stack:check", ...rest] = argv;
  if (!commandSet.has(rawCommand as AiLiveCommand)) {
    throw new Error(`Unknown command "${rawCommand}". Expected one of ${Array.from(commandSet).join(", ")}.`);
  }

  const args = parseArgs(rest);
  const config = loadConfig(args, env);
  return { command: rawCommand as AiLiveCommand, config };
}

export function loadConfig(args: Record<string, string | boolean> = {}, env: Env = process.env): AiLiveConfig {
  const clientUrl = readString(args, env, "client-url", "AI_LIVE_CLIENT_URL", "http://localhost:5173/");
  const defaultRunRoot = path.resolve(process.cwd(), "logs");

  return {
    clientUrl: normalizeBaseUrl(clientUrl),
    monopolyApi: normalizeBaseUrl(readString(args, env, "monopoly-api", "AI_LIVE_MONOPOLY_API", "http://localhost:8181")).replace(/\/$/, ""),
    userApi: normalizeBaseUrl(readString(args, env, "user-api", "AI_LIVE_USER_API", "http://localhost:8181")).replace(/\/$/, ""),
    peerHost: readString(args, env, "peer-host", "AI_LIVE_PEER_HOST", "localhost"),
    peerPort: readNumber(args, env, "peer-port", "AI_LIVE_PEER_PORT", 8182),
    mysqlHost: readString(args, env, "mysql-host", "AI_LIVE_MYSQL_HOST", "localhost"),
    mysqlPort: readNumber(args, env, "mysql-port", "AI_LIVE_MYSQL_PORT", 3307),
    roomId: readString(args, env, "room", "AI_LIVE_ROOM_ID", "ai001"),
    botCount: readNumber(args, env, "bots", "AI_LIVE_BOT_COUNT", 4),
    humanCount: readNumber(args, env, "humans", "AI_LIVE_HUMAN_COUNT", 0),
    humanWaitTimeoutMs: readNumber(args, env, "human-wait-timeout-ms", "AI_LIVE_HUMAN_WAIT_TIMEOUT_MS", 120000),
    headful: readBoolean(args, env, "headful", "AI_LIVE_HEADFUL", true),
    botHeadful: readBoolean(args, env, "bot-headful", "AI_LIVE_BOT_HEADFUL", false),
    liveOverlay: readBoolean(args, env, "live-overlay", "AI_LIVE_LIVE_OVERLAY", true),
    liveScreenshotIntervalMs: readNumber(args, env, "live-screenshot-interval-ms", "AI_LIVE_LIVE_SCREENSHOT_INTERVAL_MS", 60000),
    stallTimeoutMs: readNumber(args, env, "stall-timeout-ms", "AI_LIVE_STALL_TIMEOUT_MS", 90000),
    policy: readString(args, env, "policy", "AI_LIVE_POLICY", "rules") as AiLivePolicy,
    decisionTimeoutMs: readNumber(args, env, "decision-timeout-ms", "AI_LIVE_DECISION_TIMEOUT_MS", 3000),
    roundTime: readNumber(args, env, "round-time", "AI_LIVE_ROUND_TIME", 8),
    mapId: readString(args, env, "map", "AI_LIVE_MAP_ID", "auto"),
    logLevel: readString(args, env, "log-level", "AI_LIVE_LOG_LEVEL", "info") as LogLevel,
    runRoot: path.resolve(readString(args, env, "run-root", "AI_LIVE_RUN_ROOT", defaultRunRoot)),
    maxRunMs: readNumber(args, env, "max-run-ms", "AI_LIVE_MAX_RUN_MS", 300000),
    httpTimeoutMs: readNumber(args, env, "http-timeout-ms", "AI_LIVE_HTTP_TIMEOUT_MS", 5000),
    mimoConfigPath: path.resolve(
      readString(args, env, "mimo-config", "AI_LIVE_MIMO_CONFIG_PATH", "D:\\memsuOS\\.memsuos\\model-providers.local.json")
    ),
    mimoModel: readString(args, env, "mimo-model", "AI_LIVE_MIMO_MODEL", "mimo-v2.5-pro"),
    mimoDecisionTimeoutMs: readNumber(args, env, "mimo-timeout-ms", "AI_LIVE_MIMO_DECISION_TIMEOUT_MS", 20000),
    memsuRoot: path.resolve(readString(args, env, "memsu-root", "AI_LIVE_MEMSU_ROOT", "D:\\memsuOS")),
    memsuMemoryEnabled: readBoolean(args, env, "memsu-memory", "AI_LIVE_MEMSU_MEMORY", false)
  };
}

function loadEnv(env: Env): Env {
  const cwdEnv = readDotEnv(path.resolve(process.cwd(), ".env"));
  return { ...cwdEnv, ...env };
}

function readDotEnv(filePath: string): Env {
  if (!existsSync(filePath)) return {};
  const result: Env = {};
  const content = readFileSync(filePath, "utf8");
  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const separator = trimmed.indexOf("=");
    if (separator < 0) continue;
    const key = trimmed.slice(0, separator).trim();
    const value = trimmed.slice(separator + 1).trim().replace(/^['"]|['"]$/g, "");
    if (key) result[key] = value;
  }
  return result;
}

function parseArgs(argv: string[]): Record<string, string | boolean> {
  const result: Record<string, string | boolean> = {};
  for (let i = 0; i < argv.length; i += 1) {
    const item = argv[i];
    if (!item.startsWith("--")) continue;
    const [rawKey, inlineValue] = item.slice(2).split("=", 2);
    if (!rawKey) continue;
    if (inlineValue !== undefined) {
      result[rawKey] = inlineValue;
      continue;
    }
    const next = argv[i + 1];
    if (!next || next.startsWith("--")) {
      result[rawKey] = true;
      continue;
    }
    result[rawKey] = next;
    i += 1;
  }
  return result;
}

function readString(args: Record<string, string | boolean>, env: Env, argName: string, envName: string, fallback: string) {
  const value = args[argName] ?? env[envName] ?? fallback;
  return String(value);
}

function readNumber(args: Record<string, string | boolean>, env: Env, argName: string, envName: string, fallback: number) {
  const value = Number(args[argName] ?? env[envName] ?? fallback);
  if (!Number.isFinite(value)) throw new Error(`${envName} must be a number.`);
  return value;
}

function readBoolean(args: Record<string, string | boolean>, env: Env, argName: string, envName: string, fallback: boolean) {
  const value = args[argName] ?? env[envName];
  if (value === undefined) return fallback;
  if (typeof value === "boolean") return value;
  return ["1", "true", "yes", "y", "on"].includes(String(value).toLowerCase());
}

function normalizeBaseUrl(value: string) {
  const url = new URL(value);
  return url.toString();
}

import net from "node:net";
import type { AiLiveConfig } from "../config";

export interface StackCheck {
  name: string;
  ok: boolean;
  detail: string;
  durationMs: number;
}

export async function checkLocalStack(config: AiLiveConfig): Promise<StackCheck[]> {
  const checks: StackCheck[] = [];
  const probeRoomId = checkRoomId(config.roomId);
  checks.push(await checkTcp(`client:${portFromUrl(config.clientUrl, 5173)}`, hostFromUrl(config.clientUrl), portFromUrl(config.clientUrl, 5173), config.httpTimeoutMs));
  checks.push(await checkTcp(`server-api:${portFromUrl(config.monopolyApi, 8181)}`, hostFromUrl(config.monopolyApi), portFromUrl(config.monopolyApi, 8181), config.httpTimeoutMs));
  checks.push(await checkTcp(`peer-server:${config.peerPort}`, config.peerHost, config.peerPort, config.httpTimeoutMs));
  checks.push(await checkTcp(`mysql:${config.mysqlPort}`, config.mysqlHost, config.mysqlPort, config.httpTimeoutMs));
  checks.push(await checkHttp("client root", config.clientUrl, undefined, config.httpTimeoutMs));
  checks.push(await checkHttp("user health", `${config.userApi}/health`, undefined, config.httpTimeoutMs));
  checks.push(await checkHttp("monopoly health", `${config.monopolyApi}/health`, undefined, config.httpTimeoutMs));
  checks.push(await checkHttp("map list", `${config.monopolyApi}/game-map/list?page=1&size=1`, (status, body) => {
    return status === 200 && body.includes("gameMapList");
  }, config.httpTimeoutMs));
  checks.push(await checkHttp("room-router random-public-room", `${config.monopolyApi}/room-router/random-public-room`, (status, body) => {
    return status === 200 && body.includes("roomId");
  }, config.httpTimeoutMs));
  checks.push(await checkHttp("room-router join", `${config.monopolyApi}/room-router/join?roomId=${encodeURIComponent(probeRoomId)}`, (status, body) => {
    return status === 200 && body.includes("needCreate");
  }, config.httpTimeoutMs));
  checks.push(await checkHttp("room-router delete", `${config.monopolyApi}/room-router/delete?roomId=${encodeURIComponent(probeRoomId)}`, (status) => {
    return status === 200;
  }, config.httpTimeoutMs, { method: "POST" }));
  return checks;
}

export async function checkTcp(name: string, host: string, port: number, timeoutMs = 2500): Promise<StackCheck> {
  const started = Date.now();
  return new Promise((resolve) => {
    const socket = net.createConnection({ host, port });
    const finish = (ok: boolean, detail: string) => {
      socket.removeAllListeners();
      socket.destroy();
      resolve({ name, ok, detail, durationMs: Date.now() - started });
    };
    socket.setTimeout(timeoutMs);
    socket.once("connect", () => finish(true, `${host}:${port} reachable`));
    socket.once("timeout", () => finish(false, `${host}:${port} timeout after ${timeoutMs}ms`));
    socket.once("error", (error: NodeJS.ErrnoException) => finish(false, `${host}:${port} ${error.code ?? error.message}`.trim()));
  });
}

export async function checkHttp(
  name: string,
  url: string,
  validate: (status: number, body: string) => boolean = (status) => status >= 200 && status < 300,
  timeoutMs = 5000,
  init: RequestInit = {}
): Promise<StackCheck> {
  const started = Date.now();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { ...init, signal: controller.signal });
    const body = await res.text();
    const ok = validate(res.status, body);
    return {
      name,
      ok,
      detail: `${res.status} ${ok ? "ok" : trimBody(body)}`,
      durationMs: Date.now() - started
    };
  } catch (error) {
    return {
      name,
      ok: false,
      detail: error instanceof Error ? error.message : String(error),
      durationMs: Date.now() - started
    };
  } finally {
    clearTimeout(timer);
  }
}

function hostFromUrl(value: string) {
  return new URL(value).hostname;
}

function portFromUrl(value: string, fallback: number) {
  const url = new URL(value);
  return url.port ? Number(url.port) : fallback;
}

function checkRoomId(roomId: string) {
  const suffix = Math.random().toString(36).slice(2, 6);
  return `${roomId.replace(/[^a-z0-9]/gi, "").slice(0, 7)}${suffix}`.slice(0, 12) || `ai${suffix}`;
}

function trimBody(body: string) {
  return body.replace(/\s+/g, " ").slice(0, 160);
}

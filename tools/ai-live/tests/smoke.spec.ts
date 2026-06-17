import net from "node:net";
import { URL } from "node:url";
import { test, expect, type Browser, type BrowserContext, type Page } from "@playwright/test";
import { EventRecorder } from "../src/recorder/event-recorder";
import { createLogger } from "../src/logging/logger";

interface SmokeConfig {
  clientUrl: string;
  userServerUrl: string;
  monopolyApiUrl: string;
  peerHost: string;
  peerPort: number;
  mysqlHost: string;
  mysqlPort: number;
  roomId: string;
  logsRoot?: string;
}

interface ServiceCheck {
  name: string;
  target: string;
  ok: boolean;
  detail: string;
}

const config = readSmokeConfig();
const logger = createLogger({ scope: "smoke" });
const browserChannel = process.env.AI_LIVE_BROWSER_CHANNEL ?? "chrome";

test.setTimeout(90_000);
if (browserChannel !== "bundled") {
  test.use({ channel: browserChannel as "chrome" });
}

test("auto room entry and guest ready path", async ({ browser }, testInfo) => {
  const preflight = await checkStack(config);
  if (!preflight.ok) {
    test.skip(true, formatSkipMessage(preflight.checks));
  }

  const recorder = await EventRecorder.create({
    roomId: config.roomId,
    logsRoot: config.logsRoot,
    metadata: {
      suite: "smoke",
      clientUrl: config.clientUrl,
      monopolyApiUrl: config.monopolyApiUrl,
      peer: `${config.peerHost}:${config.peerPort}`,
    },
  });

  await recorder.recordEvent({ type: "smoke.start", data: config });
  await logger.info("smoke run started", { runDir: recorder.runDir, roomId: config.roomId });

  const contexts: BrowserContext[] = [];

  try {
    const host = await openSeededPage(browser, recorder, contexts, {
      pageName: "host",
      username: "AI Host",
      color: "#f59e0b",
    });

    await enterLobby(host.page, "host", recorder);
    await joinRoom(host.page, "host", config.roomId, recorder);
    await expect(host.page.getByText("房间ID:")).toBeVisible({ timeout: 20_000 });
    await capture(host.page, recorder, "host-room", "host", testInfo);
    await recorder.recordEvent({ type: "host.room.entered", actor: "host", data: { roomId: config.roomId } });

    const guest = await openSeededPage(browser, recorder, contexts, {
      pageName: "guest",
      username: "AI Guest",
      color: "#22c55e",
    });

    await enterLobby(guest.page, "guest", recorder);
    await joinRoom(guest.page, "guest", config.roomId, recorder);
    await expect(guest.page.getByText("房间ID:")).toBeVisible({ timeout: 20_000 });

    const readyButton = guest.page.getByRole("button", { name: /^准备$/ });
    await expect(readyButton).toBeVisible({ timeout: 15_000 });
    await readyButton.click();
    await expect(guest.page.getByRole("button", { name: /取消准备/ })).toBeVisible({ timeout: 10_000 });

    await capture(guest.page, recorder, "guest-ready", "guest", testInfo);
    await recorder.recordEvent({ type: "guest.ready.confirmed", actor: "guest", data: { roomId: config.roomId } });
    await recorder.close("passed");
  } catch (error) {
    await recorder.recordError({ phase: "smoke", error });
    await Promise.allSettled(
      contexts.flatMap((context, index) =>
        context.pages().map(async (page, pageIndex) => {
          const label = `failure-${index + 1}-${pageIndex + 1}`;
          await capture(page, recorder, label, label, testInfo).catch(() => undefined);
        })
      )
    );
    await recorder.close("failed");
    throw error;
  } finally {
    await Promise.allSettled(contexts.map((context) => context.close()));
  }
});

async function openSeededPage(
  browser: Browser,
  recorder: EventRecorder,
  contexts: BrowserContext[],
  options: { pageName: string; username: string; color: string }
): Promise<{ context: BrowserContext; page: Page }> {
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    locale: "zh-CN",
  });
  contexts.push(context);

  const user = {
    userId: `temp-${options.pageName}-${Date.now().toString(36)}`,
    useraccount: "",
    username: options.username,
    avatar: "",
    color: options.color,
  };

  await context.addInitScript((seedUser) => {
    window.localStorage.setItem("user", JSON.stringify(seedUser));
    window.localStorage.removeItem("token");
  }, user);

  const page = await context.newPage();
  page.on("console", (message) => {
    void recorder.recordBrowserConsole({
      page: options.pageName,
      type: message.type(),
      text: message.text(),
      location: message.location(),
    });
  });
  page.on("pageerror", (error) => {
    void recorder.recordError({ phase: "pageerror", page: options.pageName, error });
  });

  await recorder.recordEvent({ type: "page.created", actor: options.pageName, data: user });
  return { context, page };
}

async function enterLobby(page: Page, pageName: string, recorder: EventRecorder): Promise<void> {
  await page.goto(config.clientUrl, { waitUntil: "domcontentloaded", timeout: 15_000 });
  await page.getByText("点击任意位置继续").click({ timeout: 10_000 });
  await expect(page.getByPlaceholder(/房间号/)).toBeVisible({ timeout: 15_000 });
  await recorder.recordEvent({ type: "lobby.visible", actor: pageName });
}

async function joinRoom(page: Page, pageName: string, roomId: string, recorder: EventRecorder): Promise<void> {
  await page.getByPlaceholder(/房间号/).fill(roomId);
  await page.getByRole("button", { name: "加入/创建房间" }).click();
  await recorder.recordEvent({ type: "room.join.submitted", actor: pageName, data: { roomId } });
}

async function capture(
  page: Page,
  recorder: EventRecorder,
  label: string,
  pageName: string,
  testInfo: { attach: (name: string, options: { path: string; contentType?: string }) => Promise<void> }
): Promise<void> {
  const screenshotPath = recorder.getScreenshotPath(label);
  await page.screenshot({ path: screenshotPath, fullPage: true });
  await recorder.recordScreenshot({ label, path: screenshotPath, page: pageName });
  await testInfo.attach(label, { path: screenshotPath, contentType: "image/png" });
}

async function checkStack(smokeConfig: SmokeConfig): Promise<{ ok: boolean; checks: ServiceCheck[] }> {
  const checks = await Promise.all([
    checkHttp("client", smokeConfig.clientUrl),
    checkHttp("user-server", new URL("/health", smokeConfig.userServerUrl).toString()),
    checkHttp("monopoly-api", new URL("/health", smokeConfig.monopolyApiUrl).toString()),
    checkHttp("map-list", new URL("/game-map/list?page=1&size=1", smokeConfig.monopolyApiUrl).toString()),
    checkTcp("peer-server", smokeConfig.peerHost, smokeConfig.peerPort),
    checkTcp("mysql", smokeConfig.mysqlHost, smokeConfig.mysqlPort),
  ]);

  return {
    ok: checks.every((item) => item.ok),
    checks,
  };
}

async function checkHttp(name: string, target: string): Promise<ServiceCheck> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 4_000);

  try {
    const response = await fetch(target, { signal: controller.signal });
    return {
      name,
      target,
      ok: response.ok,
      detail: `${response.status} ${response.statusText}`,
    };
  } catch (error) {
    return {
      name,
      target,
      ok: false,
      detail: error instanceof Error ? error.message : String(error),
    };
  } finally {
    clearTimeout(timeout);
  }
}

function checkTcp(name: string, host: string, port: number): Promise<ServiceCheck> {
  return new Promise((resolve) => {
    const socket = net.connect({ host, port });
    const target = `${host}:${port}`;
    const done = (ok: boolean, detail: string) => {
      socket.removeAllListeners();
      socket.destroy();
      resolve({ name, target, ok, detail });
    };

    socket.setTimeout(4_000);
    socket.once("connect", () => done(true, "tcp connect ok"));
    socket.once("timeout", () => done(false, "tcp connect timeout"));
    socket.once("error", (error) => done(false, error.message));
  });
}

function formatSkipMessage(checks: ServiceCheck[]): string {
  const details = checks.map((item) => `- ${item.name} ${item.target}: ${item.ok ? "ok" : item.detail}`).join("\n");
  return [
    "AI live smoke skipped: required local stack is not fully available.",
    details,
    "Start local services for 5173/8181/8182/3307, then run test:smoke again.",
  ].join("\n");
}

function readSmokeConfig(): SmokeConfig {
  const clientUrl = normalizeBaseUrl(process.env.AI_LIVE_CLIENT_URL ?? "http://localhost:5173/");
  const userServerUrl = normalizeBaseUrl(process.env.AI_LIVE_USER_SERVER ?? process.env.AI_LIVE_USER_API ?? "http://localhost:8181");
  const monopolyApiUrl = normalizeBaseUrl(process.env.AI_LIVE_MONOPOLY_API ?? "http://localhost:8181");
  const peerHost = process.env.AI_LIVE_PEER_HOST ?? "localhost";
  const mysqlHost = process.env.AI_LIVE_MYSQL_HOST ?? "localhost";

  return {
    clientUrl,
    userServerUrl,
    monopolyApiUrl,
    peerHost,
    peerPort: Number(process.env.AI_LIVE_PEER_PORT ?? 8182),
    mysqlHost,
    mysqlPort: Number(process.env.AI_LIVE_MYSQL_PORT ?? 3307),
    roomId: normalizeRoomId(process.env.AI_LIVE_ROOM_ID ?? `sm${Date.now().toString(36).slice(-8)}`),
    logsRoot: process.env.AI_LIVE_LOG_ROOT ?? process.env.AI_LIVE_RUN_ROOT,
  };
}

function normalizeBaseUrl(value: string): string {
  const url = new URL(value);
  if (!url.pathname.endsWith("/")) {
    url.pathname += "/";
  }
  return url.toString();
}

function normalizeRoomId(value: string): string {
  return value.replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 12) || "smoke";
}

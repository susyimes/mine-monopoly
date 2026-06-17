import { chromium, type Browser, type BrowserContext, type Page } from "playwright";
import type { AiLiveConfig } from "../config";
import type { GuestUser } from "../protocol/socket-types";
import { classifyConsoleAssetIssue, classifyPageErrorAssetIssue, type AssetIssue } from "./asset-issues";

export interface BrowserSlot {
  user: GuestUser;
  context: BrowserContext;
  page: Page;
  close: () => Promise<void>;
}

export interface BrowserPoolOptions {
  headful?: boolean;
  label?: string;
  viewport?: { width: number; height: number } | null;
  windowPosition?: { x: number; y: number };
  onConsole?: (event: { user: GuestUser; type: string; text: string; location: unknown; at: string }) => void | Promise<void>;
  onPageError?: (event: { user: GuestUser; message: string; stack?: string; at: string }) => void | Promise<void>;
  onAssetIssue?: (event: AssetIssue & { user: GuestUser }) => void | Promise<void>;
  onPageClose?: (event: { user: GuestUser; at: string }) => void | Promise<void>;
}

export class BrowserPool {
  private browser: Browser | null = null;
  private readonly slots: BrowserSlot[] = [];

  constructor(private readonly config: AiLiveConfig, private readonly options: BrowserPoolOptions = {}) {}

  async launch() {
    if (this.browser) return;
    const headful = this.options.headful ?? this.config.headful;
    const windowSize = this.options.viewport === null ? { width: 1440, height: 900 } : this.options.viewport ?? { width: 1440, height: 900 };
    this.browser = await chromium.launch({
      headless: !headful,
      channel: resolveBrowserChannel(),
      args: headful
        ? [
            `--window-size=${windowSize.width},${windowSize.height}`,
            `--window-position=${this.options.windowPosition?.x ?? 0},${this.options.windowPosition?.y ?? 0}`,
            "--force-device-scale-factor=1"
          ]
        : undefined
    });
  }

  async createSlot(user: GuestUser): Promise<BrowserSlot> {
    if (!this.browser) throw new Error("BrowserPool.launch() must be called first.");
    const viewport = this.options.viewport === undefined ? { width: 1440, height: 900 } : this.options.viewport;
    const context = await this.browser.newContext({
      viewport,
      locale: "zh-CN",
      timezoneId: "Asia/Shanghai",
      ignoreHTTPSErrors: true
    });
    await context.addInitScript(({ guest, peerHost, peerPort, monopolyApi }) => {
      window.localStorage.removeItem("token");
      window.localStorage.setItem("user", JSON.stringify(guest));
      (window as typeof window & { __AI_LIVE_AUTOMATION__?: { user: GuestUser; peerHost?: string; peerPort?: number; monopolyApi?: string } }).__AI_LIVE_AUTOMATION__ = {
        user: guest,
        peerHost,
        peerPort,
        monopolyApi
      };
    }, { guest: user, peerHost: this.config.peerHost, peerPort: this.config.peerPort, monopolyApi: this.config.monopolyApi });
    const page = await context.newPage();
    page.setDefaultTimeout(30000);
    page.setDefaultNavigationTimeout(30000);
    page.on("console", (message) => {
      const location = message.location();
      if (shouldSkipConsoleByLocation(message.type(), location)) return;
      const event = {
        user,
        type: message.type(),
        text: message.text(),
        location,
        at: new Date().toISOString()
      };
      const assetIssue = classifyConsoleAssetIssue(user.username, event);
      if (assetIssue) {
        void this.options.onAssetIssue?.({ ...assetIssue, user });
        return;
      }
      void this.options.onConsole?.({
        ...event
      });
    });
    page.on("pageerror", (error) => {
      const event = {
        user,
        message: error.message,
        stack: error.stack,
        at: new Date().toISOString()
      };
      const assetIssue = classifyPageErrorAssetIssue(user.username, event);
      if (assetIssue) {
        void this.options.onAssetIssue?.({ ...assetIssue, user });
        return;
      }
      void this.options.onPageError?.({
        ...event
      });
    });
    page.on("close", () => {
      void this.options.onPageClose?.({ user, at: new Date().toISOString() });
    });

    const slot: BrowserSlot = {
      user,
      context,
      page,
      close: async () => {
        const index = this.slots.indexOf(slot);
        if (index >= 0) this.slots.splice(index, 1);
        await context.close();
      }
    };
    this.slots.push(slot);
    return slot;
  }

  async close() {
    await Promise.allSettled(this.slots.splice(0).map((slot) => slot.context.close()));
    await this.browser?.close();
    this.browser = null;
  }
}

function shouldSkipConsoleByLocation(type: string, location: { url?: string; lineNumber?: number }) {
  if (type !== "error") return false;
  return Boolean(location.url?.includes("/src/main.ts") && location.lineNumber === 357);
}

function resolveBrowserChannel(): "chrome" | "msedge" | undefined {
  const channel = process.env.AI_LIVE_BROWSER_CHANNEL ?? "chrome";
  if (channel === "bundled") return undefined;
  if (channel === "msedge") return "msedge";
  return "chrome";
}

export function createGuestUser(prefix: string, index: number): GuestUser {
  const id = `${prefix}-${index}-${Math.random().toString(36).slice(2, 8)}`;
  const colors = ["#e15f41", "#3c6382", "#78e08f", "#f6b93b", "#8854d0", "#0fb9b1"];
  return {
    userId: id,
    useraccount: "",
    username: `${prefix}${index + 1}`,
    avatar: "",
    color: colors[index % colors.length]
  };
}

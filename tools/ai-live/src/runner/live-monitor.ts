import type { Page } from "playwright";
import type { AiLiveConfig } from "../config";
import type { Logger } from "../logging/logger";
import type { PlayerInfo } from "../protocol/socket-types";
import type { EventRecorder, RecorderRecord } from "../recorder/event-recorder";

interface LiveRunMonitorOptions {
  page: Page;
  config: AiLiveConfig;
  recorder: EventRecorder;
  logger: Logger;
  pageName?: string;
  startedAt?: number;
}

interface HostSnapshot {
  roomId?: string;
  currentPlayerIdInRound?: string;
  currentRound?: number;
  currentMultiplier?: number;
  isGameOver?: boolean;
  players?: PlayerInfo[];
  selfPlayer?: PlayerInfo;
  waitingFor?: { eventMsg?: string; remainingTime?: number };
}

interface OverlayState {
  roomId: string;
  policy: string;
  elapsed: string;
  round?: number;
  multiplier?: number;
  waiting?: string;
  remainingTime?: number;
  currentAction: string;
  recent: string[];
  leaders: Array<{ name: string; money: number; isSelf: boolean; isBankrupted: boolean }>;
}

export class RunStallError extends Error {
  readonly code = "AI_LIVE_STALL";

  constructor(message: string, readonly data: Record<string, unknown>) {
    super(message);
    this.name = "RunStallError";
  }
}

export class LiveRunMonitor {
  private readonly startedAt: number;
  private lastMeaningfulAt: number;
  private lastMeaningfulLabel = "run started";
  private lastOverlayUpdateAt = 0;
  private lastScreenshotAt = 0;
  private currentAction = "warming up";
  private readonly recent: string[] = [];
  private unsubscribe?: () => void;
  private overlayInstalled = false;
  private stallRecorded = false;

  constructor(private readonly options: LiveRunMonitorOptions) {
    this.startedAt = options.startedAt ?? Date.now();
    this.lastMeaningfulAt = this.startedAt;
  }

  async start(): Promise<void> {
    this.unsubscribe = this.options.recorder.addListener((record) => this.handleRecord(record));
    if (this.options.config.liveOverlay) {
      await this.installOverlay();
      await this.updateOverlay();
    }
  }

  stop(): void {
    this.unsubscribe?.();
    this.unsubscribe = undefined;
  }

  async afterTick(): Promise<void> {
    const now = Date.now();

    if (this.options.config.liveOverlay && now - this.lastOverlayUpdateAt >= 2000) {
      await this.updateOverlay();
    }

    const screenshotInterval = this.options.config.liveScreenshotIntervalMs;
    if (screenshotInterval > 0 && now - this.lastScreenshotAt >= screenshotInterval) {
      await this.captureScreenshot(`live-${formatMinutes(now - this.startedAt)}`);
      this.lastScreenshotAt = now;
    }

    const stallTimeout = this.options.config.stallTimeoutMs;
    if (stallTimeout <= 0 || this.stallRecorded) return;
    const quietMs = now - this.lastMeaningfulAt;
    if (quietMs < stallTimeout) return;

    this.stallRecorded = true;
    const screenshot = await this.captureScreenshot(`stall-${formatMinutes(now - this.startedAt)}`).catch(() => undefined);
    const snapshot = await this.readHostSnapshot().catch(() => undefined);
    await this.options.recorder.recordEvent({
      type: "run.stalled",
      phase: "decision-loop",
      message: `no meaningful activity for ${Math.round(quietMs / 1000)}s`,
      data: {
        quietMs,
        lastMeaningfulAt: new Date(this.lastMeaningfulAt).toISOString(),
        lastMeaningfulLabel: this.lastMeaningfulLabel,
        screenshot,
        snapshot: summarizeSnapshot(snapshot)
      }
    });
    await this.options.logger.warn("run stalled", {
      quietMs,
      lastMeaningfulLabel: this.lastMeaningfulLabel,
      screenshot
    });
    throw new RunStallError(`No meaningful game activity for ${Math.round(quietMs / 1000)}s`, {
      quietMs,
      lastMeaningfulLabel: this.lastMeaningfulLabel,
      screenshot
    });
  }

  private handleRecord(record: RecorderRecord): void {
    if (record.channel === "decisions") {
      const summary = formatDecision(record.value);
      this.markMeaningful(summary);
      this.pushRecent(summary);
      return;
    }

    if (record.channel === "events") {
      const eventType = record.value.type;
      if (eventType === "decision-loop.tick") return;
      const summary = formatEvent(record.value);
      this.markMeaningful(summary);
      this.pushRecent(summary);
      return;
    }

    if (record.channel === "errors") {
      const summary = `error ${record.value.phase ?? ""} ${record.value.page ?? ""}`.trim();
      this.markMeaningful(summary);
      this.pushRecent(summary);
    }
  }

  private markMeaningful(label: string): void {
    this.lastMeaningfulAt = Date.now();
    this.lastMeaningfulLabel = label;
    this.currentAction = label;
  }

  private pushRecent(label: string): void {
    const compact = truncate(label, 72);
    if (this.recent[0] === compact) return;
    this.recent.unshift(compact);
    this.recent.splice(6);
  }

  private async captureScreenshot(label: string): Promise<string> {
    const page = this.options.page;
    if (page.isClosed()) throw new Error("host page is closed");
    const screenshot = this.options.recorder.getScreenshotPath(label);
    await page.screenshot({ path: screenshot, fullPage: false });
    await this.options.recorder.recordScreenshot({ label, path: screenshot, page: this.options.pageName ?? "Bot1" });
    return screenshot;
  }

  private async installOverlay(): Promise<void> {
    const page = this.options.page;
    if (page.isClosed() || this.overlayInstalled) return;
    await page.evaluate(() => {
      const styleId = "ai-live-overlay-style";
      if (!document.getElementById(styleId)) {
        const style = document.createElement("style");
        style.id = styleId;
        style.textContent = `
          #ai-live-overlay {
            position: fixed;
            inset: 0;
            z-index: 2147483647;
            pointer-events: none;
            font-family: Inter, "Microsoft YaHei", Arial, sans-serif;
            color: #f8fafc;
          }
          #ai-live-overlay .ai-live-panel {
            position: absolute;
            background: rgba(12, 18, 28, 0.78);
            border: 1px solid rgba(255, 255, 255, 0.16);
            border-radius: 8px;
            box-shadow: 0 10px 28px rgba(0, 0, 0, 0.22);
            backdrop-filter: blur(8px);
          }
          #ai-live-overlay .ai-live-status {
            left: 14px;
            top: 14px;
            width: min(380px, calc(100vw - 28px));
            padding: 10px 12px;
          }
          #ai-live-overlay .ai-live-leaders {
            right: 14px;
            top: 14px;
            width: 230px;
            padding: 10px 12px;
          }
          #ai-live-overlay .ai-live-recent {
            left: 14px;
            bottom: 14px;
            width: min(560px, calc(100vw - 28px));
            padding: 9px 12px;
          }
          #ai-live-overlay .ai-live-kicker {
            font-size: 11px;
            line-height: 1.2;
            opacity: 0.72;
            text-transform: uppercase;
            letter-spacing: 0;
          }
          #ai-live-overlay .ai-live-main {
            margin-top: 5px;
            font-size: 16px;
            line-height: 1.25;
            font-weight: 700;
            overflow-wrap: anywhere;
          }
          #ai-live-overlay .ai-live-meta,
          #ai-live-overlay .ai-live-row,
          #ai-live-overlay .ai-live-event {
            font-size: 12px;
            line-height: 1.35;
          }
          #ai-live-overlay .ai-live-meta {
            display: flex;
            flex-wrap: wrap;
            gap: 8px;
            margin-top: 7px;
            opacity: 0.86;
          }
          #ai-live-overlay .ai-live-row {
            display: grid;
            grid-template-columns: 1fr auto;
            gap: 8px;
            margin-top: 6px;
            align-items: center;
          }
          #ai-live-overlay .ai-live-row span:first-child,
          #ai-live-overlay .ai-live-event {
            min-width: 0;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
          }
          #ai-live-overlay .ai-live-row.is-self span:first-child {
            color: #86efac;
            font-weight: 700;
          }
          #ai-live-overlay .ai-live-row.is-out {
            opacity: 0.5;
          }
          #ai-live-overlay .ai-live-event + .ai-live-event {
            margin-top: 4px;
          }
        `;
        document.head.appendChild(style);
      }

      if (!document.getElementById("ai-live-overlay")) {
        const root = document.createElement("div");
        root.id = "ai-live-overlay";
        root.innerHTML = `
          <section class="ai-live-panel ai-live-status">
            <div class="ai-live-kicker" data-ai-live="room"></div>
            <div class="ai-live-main" data-ai-live="action"></div>
            <div class="ai-live-meta" data-ai-live="meta"></div>
          </section>
          <section class="ai-live-panel ai-live-leaders">
            <div class="ai-live-kicker">Leaderboard</div>
            <div data-ai-live="leaders"></div>
          </section>
          <section class="ai-live-panel ai-live-recent">
            <div class="ai-live-kicker">Recent</div>
            <div data-ai-live="recent"></div>
          </section>
        `;
        document.body.appendChild(root);
      }
    });
    this.overlayInstalled = true;
  }

  private async updateOverlay(): Promise<void> {
    const page = this.options.page;
    if (page.isClosed()) return;
    if (!this.overlayInstalled) await this.installOverlay();

    const snapshot = await this.readHostSnapshot().catch(() => undefined);
    const state: OverlayState = {
      roomId: snapshot?.roomId ?? this.options.config.roomId,
      policy: this.options.config.policy,
      elapsed: formatElapsed(Date.now() - this.startedAt),
      round: snapshot?.currentRound,
      multiplier: snapshot?.currentMultiplier,
      waiting: snapshot?.waitingFor?.eventMsg,
      remainingTime: snapshot?.waitingFor?.remainingTime,
      currentAction: this.currentAction,
      recent: this.recent.length > 0 ? this.recent : ["waiting for first game action"],
      leaders: (snapshot?.players ?? [])
        .map((player) => ({
          name: player.user.username,
          money: player.money,
          isSelf: player.id === snapshot?.selfPlayer?.id,
          isBankrupted: player.isBankrupted
        }))
        .sort((a, b) => b.money - a.money)
        .slice(0, 6)
    };

    await page.evaluate((overlayState) => {
      const root = document.getElementById("ai-live-overlay");
      if (!root) return;

      const room = root.querySelector<HTMLElement>("[data-ai-live='room']");
      const action = root.querySelector<HTMLElement>("[data-ai-live='action']");
      const meta = root.querySelector<HTMLElement>("[data-ai-live='meta']");
      const leaders = root.querySelector<HTMLElement>("[data-ai-live='leaders']");
      const recent = root.querySelector<HTMLElement>("[data-ai-live='recent']");

      if (room) room.textContent = `${overlayState.roomId} / ${overlayState.policy} / ${overlayState.elapsed}`;
      if (action) action.textContent = overlayState.currentAction;
      if (meta) {
        const parts = [
          overlayState.round === undefined ? undefined : `Round ${overlayState.round}`,
          overlayState.multiplier === undefined ? undefined : `x${overlayState.multiplier}`,
          overlayState.remainingTime === undefined ? undefined : `${overlayState.remainingTime}s`,
          overlayState.waiting
        ].filter(Boolean);
        meta.textContent = parts.join("  ");
      }
      if (leaders) {
        leaders.replaceChildren(
          ...overlayState.leaders.map((player) => {
            const row = document.createElement("div");
            row.className = `ai-live-row${player.isSelf ? " is-self" : ""}${player.isBankrupted ? " is-out" : ""}`;
            const name = document.createElement("span");
            name.textContent = player.name;
            const money = document.createElement("span");
            money.textContent = String(Math.round(player.money));
            row.append(name, money);
            return row;
          })
        );
      }
      if (recent) {
        recent.replaceChildren(
          ...overlayState.recent.map((item) => {
            const line = document.createElement("div");
            line.className = "ai-live-event";
            line.textContent = item;
            return line;
          })
        );
      }
    }, state);
    this.lastOverlayUpdateAt = Date.now();
  }

  private async readHostSnapshot(): Promise<HostSnapshot | undefined> {
    const page = this.options.page;
    if (page.isClosed()) return undefined;
    return await page.evaluate(() => {
      const bridge = (window as typeof window & {
        __AI_LIVE_CLIENT_BRIDGE__?: { getSnapshot?: () => unknown };
      }).__AI_LIVE_CLIENT_BRIDGE__;
      return bridge?.getSnapshot?.() as HostSnapshot | undefined;
    });
  }
}

function formatDecision(value: Extract<RecorderRecord, { channel: "decisions" }>["value"]): string {
  const data = value.data && typeof value.data === "object" ? (value.data as Record<string, unknown>) : {};
  const cardName = typeof data.cardName === "string" ? ` ${data.cardName}` : "";
  const targetName = typeof data.targetName === "string" ? ` -> ${data.targetName}` : "";
  const propertyName = typeof data.propertyName === "string" ? ` ${data.propertyName}` : "";
  return `${value.actor}: ${value.decision}${cardName}${propertyName}${targetName}`;
}

function formatEvent(value: Extract<RecorderRecord, { channel: "events" }>["value"]): string {
  const data = value.data && typeof value.data === "object" ? (value.data as Record<string, unknown>) : {};
  if (value.type === "bot.player-movement") {
    const playerName = typeof data.playerName === "string" ? data.playerName : value.actor ?? "player";
    const targetName = typeof data.targetName === "string" ? ` -> ${data.targetName}` : "";
    return `${playerName} moving${targetName}`;
  }
  if (value.type === "bot.page-closed") return `${value.actor ?? "bot"} page closed`;
  if (value.type === "game.started") return "game started";
  if (value.type === "game.ended") return "game ended";
  if (value.message) return `${value.type}: ${value.message}`;
  return value.actor ? `${value.type} ${value.actor}` : value.type;
}

function summarizeSnapshot(snapshot?: HostSnapshot) {
  if (!snapshot) return undefined;
  return {
    round: snapshot.currentRound,
    currentPlayerIdInRound: snapshot.currentPlayerIdInRound,
    waitingFor: snapshot.waitingFor,
    isGameOver: snapshot.isGameOver,
    players: snapshot.players?.map((player) => ({
      id: player.id,
      name: player.user.username,
      money: player.money,
      positionIndex: player.positionIndex,
      cards: player.chanceCards.length,
      properties: player.properties.length,
      isBankrupted: player.isBankrupted
    }))
  };
}

function truncate(value: string, max: number): string {
  return value.length <= max ? value : `${value.slice(0, Math.max(0, max - 3))}...`;
}

function formatElapsed(ms: number): string {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

function formatMinutes(ms: number): string {
  return `${String(Math.max(0, Math.floor(ms / 60000))).padStart(2, "0")}m`;
}

import type { Page } from "playwright";
import type { AiLiveConfig } from "../config";
import type { Logger } from "../logging/logger";
import { BotPlayer } from "../bot/bot-player";
import { runDecisionLoop } from "../bot/decision-loop";
import { personalityById, personalityForIndex, type BotPersonality } from "../bot/personalities";
import { createBotPolicy } from "../policy/policy-factory";
import type { EventRecorder } from "../recorder/event-recorder";
import { createMemsuMemoryPort, type MemsuAgentProfile } from "../memsu/memory-port";
import { BrowserPool, createGuestUser, type BrowserPoolOptions } from "./browser-pool";
import { LiveRunMonitor } from "./live-monitor";
import {
  configureHostRoom,
  ensureOwnRole,
  gotoClientRoute,
  joinRoomFromRouter,
  startGame as clickStartGame,
  waitForHumanReadyCount,
  waitForReadyUsers,
  waitForRoomPage
} from "./automation-ui";

const MAX_NON_OWNER_PLAYERS = 5;

interface HumanWaitResult {
  readyHumans: number;
  timedOut: boolean;
  missingFilledByBots: number;
}

export async function runRulesRoom(config: AiLiveConfig, logger: Logger, recorder: EventRecorder) {
  const poolOptions: BrowserPoolOptions = {
    onConsole: (event) =>
      recorder.recordBrowserConsole({
        page: event.user.username,
        type: event.type,
        text: event.text,
        location: event.location
      }),
    onPageError: (event) => recorder.recordError({ phase: "pageerror", page: event.user.username, error: event }),
    onPageClose: (event) =>
      recorder.recordEvent({
        type: "browser.page-closed",
        actor: event.user.username,
        data: { at: event.at }
      }),
    onAssetIssue: (event) =>
      recorder.recordEvent({
        type: "asset.issue",
        actor: event.user.username,
        data: {
          kind: event.kind,
          severity: event.severity,
          text: event.text,
          url: event.url
        }
      })
  };
  const hostPool = new BrowserPool(config, {
    ...poolOptions,
    headful: config.headful,
    label: "host-live",
    viewport: config.headful ? null : undefined,
    windowPosition: { x: 0, y: 0 }
  });
  const botPool = new BrowserPool(config, {
    ...poolOptions,
    headful: config.botHeadful,
    label: "bot-control",
    windowPosition: { x: 1480, y: 0 }
  });
  const abortController = new AbortController();
  const notes: string[] = [];
  let status: "ok" | "failed" | "skipped" = "failed";
  let liveMonitor: LiveRunMonitor | undefined;

  try {
    await Promise.all([hostPool.launch(), botPool.launch()]);
    await recorder.recordEvent({
      type: "browser.layout",
      data: {
        hostHeadful: config.headful,
        botHeadful: config.botHeadful,
        liveOverlay: config.liveOverlay
      }
    });

    const memsuProfiles = await loadMemsuProfiles(config, recorder, logger);
    const hostProfile = memsuProfiles[0];
    const hostPersonality = personalityFromMemsuProfile(hostProfile, 0);
    const host = await hostPool.createSlot(createGuestUserFromMemsuProfile(hostProfile, 0));
    const hostActor = host.user.username;
    const bots: BotPlayer[] = [
      new BotPlayer({
        participant: {
          userId: host.user.userId,
          username: host.user.username,
          controller: "bot",
          personaId: hostPersonality.id,
          memoryRef: hostProfile.memoryRef,
          metadata: memsuAgentMetadata(hostProfile, 0)
        },
        page: host.page,
        personality: hostPersonality,
        policy: createBotPolicy(config, hostPersonality),
        recorder
      })
    ];

    await createOrJoinRoom(host.page, config, logger, recorder, true, hostActor);
    await configureRoom(host.page, config, logger, recorder, hostActor);
    const hostRole = await ensureOwnRole(host.page, 0);
    await recorder.recordEvent({ type: "bot.role-selected", actor: hostActor, data: { userId: host.user.userId, ...hostRole } });

    let humanWait: HumanWaitResult = { readyHumans: 0, timedOut: false, missingFilledByBots: 0 };
    if (config.humanCount > 0) {
      notes.push(`waiting for ${config.humanCount} human player(s) to ready`);
      humanWait = await waitForHumans(host.page, config, logger, recorder);
    }

    const guestBots: BotPlayer[] = [];
    const requestedGuestBotCount = Math.max(0, config.botCount - 1) + humanWait.missingFilledByBots;
    const guestBotCount = Math.min(requestedGuestBotCount, Math.max(0, MAX_NON_OWNER_PLAYERS - humanWait.readyHumans));
    if (guestBotCount < requestedGuestBotCount) {
      notes.push(
        `guest bot count capped from ${requestedGuestBotCount} to ${guestBotCount} because the room has ${MAX_NON_OWNER_PLAYERS} non-owner slots`
      );
    }

    for (let i = 0; i < guestBotCount; i += 1) {
      const botIndex = i + 1;
      const profile = memsuProfiles[botIndex] ?? defaultMemsuProfile(botIndex);
      const slot = await botPool.createSlot(createGuestUserFromMemsuProfile(profile, botIndex));
      await createOrJoinRoom(slot.page, config, logger, recorder, false, slot.user.username);
      const personality = personalityFromMemsuProfile(profile, botIndex);
      const bot = new BotPlayer({
        participant: {
          userId: slot.user.userId,
          username: slot.user.username,
          controller: "bot",
          personaId: personality.id,
          memoryRef: profile.memoryRef,
          metadata: memsuAgentMetadata(profile, botIndex)
        },
        page: slot.page,
        personality,
        policy: createBotPolicy(config, personality),
        recorder
      });
      const role = await ensureOwnRole(slot.page, botIndex);
      await recorder.recordEvent({ type: "bot.role-selected", actor: slot.user.username, data: { userId: slot.user.userId, ...role } });
      await bot.ready();
      bots.push(bot);
      guestBots.push(bot);
    }

    const lobbyUsers = await waitForReadyUsers(host.page, {
      minReadyNonOwner: humanWait.readyHumans + guestBots.length,
      expectedUsernames: guestBots.map((bot) => bot.actorName),
      timeoutMs: 60000
    });
    await recorder.recordEvent({
      type: "room.ready-state",
      actor: hostActor,
      data: { users: lobbyUsers, hostBot: { userId: host.user.userId, username: host.user.username } }
    });
    await startGame(host.page, logger, recorder, hostActor);
    liveMonitor = new LiveRunMonitor({ page: host.page, config, recorder, logger, pageName: hostActor });
    await liveMonitor.start();
    const endReason = await runUntilEndCondition(host.page, config, bots, recorder, logger, abortController, liveMonitor, hostActor);
    await recorder.recordEvent({ type: "run.end-condition", data: { reason: endReason } });
    status = "ok";
  } catch (error) {
    notes.push(error instanceof Error ? error.message : String(error));
    throw error;
  } finally {
    abortController.abort();
    liveMonitor?.stop();
    const summary = await recorder.close(status === "ok" ? "passed" : status);
    if (config.memsuMemoryEnabled) {
      const memoryPath = await createMemsuMemoryPort({ memsuRoot: config.memsuRoot }).appendRunReflection(summary);
      await logger.info("memsuOS candidate run memory written", { memoryPath });
    }
    void logger.info("run summary written", { status, notes, summary: summary.paths.summary });
    await Promise.allSettled([hostPool.close(), botPool.close()]);
  }
}

async function loadMemsuProfiles(config: AiLiveConfig, recorder: EventRecorder, logger: Logger): Promise<MemsuAgentProfile[]> {
  const memoryPort = createMemsuMemoryPort({ memsuRoot: config.memsuRoot });
  const loaded = await memoryPort.loadAgentProfiles();
  const needed = Math.max(1, config.botCount);
  const profiles = Array.from({ length: needed }, (_, index) => loaded[index] ?? defaultMemsuProfile(index));
  await recorder.recordEvent({
    type: "memsuOS.agent-profiles.loaded",
    data: {
      memsuRoot: config.memsuRoot,
      loaded: loaded.length,
      needed,
      agents: profiles.map((profile, index) => ({
        index,
        id: profile.id,
        label: profile.label,
        personaId: profile.personaId,
        memoryRef: profile.memoryRef,
        generated: index >= loaded.length
      }))
    }
  });
  void logger.info("memsuOS agent profiles resolved", { memsuRoot: config.memsuRoot, loaded: loaded.length, needed });
  return profiles;
}

function defaultMemsuProfile(index: number): MemsuAgentProfile {
  const personality = personalityForIndex(index);
  const agentNumber = index + 1;
  return {
    id: `memsu-monopoly-agent-${agentNumber}`,
    label: `MemsuBot${agentNumber}`,
    personaId: personality.id,
    memoryRef: `memsuOS://game-agent/monopoly/${agentNumber}`,
    traits: {
      source: "generated-default",
      buyBias: personality.buyBias,
      buildBias: personality.buildBias,
      cashReserve: personality.cashReserve,
      riskTolerance: personality.riskTolerance
    }
  };
}

function personalityFromMemsuProfile(profile: MemsuAgentProfile | undefined, index: number): BotPersonality {
  const base = profile?.personaId ? personalityById(profile.personaId) : personalityForIndex(index);
  const traits = profile?.traits ?? {};
  return {
    ...base,
    label: profile?.label ?? base.label,
    buyBias: readTraitNumber(traits.buyBias, base.buyBias),
    buildBias: readTraitNumber(traits.buildBias, base.buildBias),
    cashReserve: readTraitNumber(traits.cashReserve, base.cashReserve),
    riskTolerance: readTraitNumber(traits.riskTolerance, base.riskTolerance),
    randomness: readTraitNumber(traits.randomness, base.randomness),
    disruptiveBias: readTraitNumber(traits.disruptiveBias, base.disruptiveBias),
    preferUpgradeOverBuy:
      typeof traits.preferUpgradeOverBuy === "boolean" ? traits.preferUpgradeOverBuy : base.preferUpgradeOverBuy
  };
}

function createGuestUserFromMemsuProfile(profile: MemsuAgentProfile | undefined, index: number) {
  const guest = createGuestUser("Bot", index);
  if (!profile) return guest;
  const traits = profile.traits ?? {};
  return {
    ...guest,
    userId: profile.id || guest.userId,
    username: profile.label || profile.id || guest.username,
    color: typeof traits.color === "string" ? traits.color : guest.color
  };
}

function memsuAgentMetadata(profile: MemsuAgentProfile | undefined, index: number): Record<string, unknown> {
  return {
    memsuOS: true,
    profileIndex: index,
    profileId: profile?.id,
    memoryRef: profile?.memoryRef,
    traits: profile?.traits
  };
}

function readTraitNumber(value: unknown, fallback: number) {
  const decoded = Number(value);
  return Number.isFinite(decoded) ? decoded : fallback;
}

async function createOrJoinRoom(
  page: Page,
  config: AiLiveConfig,
  logger: Logger,
  recorder: EventRecorder,
  owner: boolean,
  actorName: string
) {
  await gotoClientRoute(page, config.clientUrl, "/room-router");
  await joinRoomFromRouter(page, config.roomId);
  await recorder.recordEvent({ type: owner ? "host.room.created" : "bot.room.joined", actor: actorName });
  void logger.info(owner ? "host bot entered room" : "guest bot entered room", { roomId: config.roomId, actor: actorName });
}

async function configureRoom(page: Page, config: AiLiveConfig, logger: Logger, recorder: EventRecorder, actorName: string) {
  await waitForRoomPage(page);
  const mapSelection = await configureHostRoom(page, {
    mapId: config.mapId,
    roundTimeSeconds: config.roundTime,
    makePublic: config.humanCount > 0
  });

  const screenshot = recorder.getScreenshotPath("room-configured");
  await page.screenshot({ path: screenshot, fullPage: true });
  await recorder.recordScreenshot({ label: "room-configured", path: screenshot, page: actorName });
  await recorder.recordEvent({
    type: "host.room.configured",
    actor: actorName,
    data: { roundTime: config.roundTime, mapId: config.mapId, mapSelection, screenshot }
  });
  void logger.info("room configured", { roomId: config.roomId, roundTime: config.roundTime });
}

async function waitForHumans(page: Page, config: AiLiveConfig, logger: Logger, recorder: EventRecorder): Promise<HumanWaitResult> {
  const result = await waitForHumanReadyCount(page, {
    humanCount: config.humanCount,
    timeoutMs: config.humanWaitTimeoutMs
  });
  const missingHumans = Math.max(0, config.humanCount - result.readyHumans);
  const missingFilledByBots = result.timedOut ? missingHumans : 0;
  if (result.timedOut) {
    logger.warn("human wait timed out; missing human slots will be filled by bots", {
      requested: config.humanCount,
      ready: result.readyHumans,
      missingFilledByBots
    });
    await recorder.recordEvent({
      type: "human.wait.timeout",
      data: { requested: config.humanCount, ready: result.readyHumans, missingFilledByBots, users: result.users }
    });
    return { readyHumans: result.readyHumans, timedOut: true, missingFilledByBots };
  }
  await recorder.recordEvent({ type: "human.ready", data: result });
  return { readyHumans: result.readyHumans, timedOut: false, missingFilledByBots: 0 };
}

async function startGame(page: Page, logger: Logger, recorder: EventRecorder, actorName: string) {
  await clickStartGame(page);
  const screenshot = recorder.getScreenshotPath("game-started");
  await page.screenshot({ path: screenshot, fullPage: true }).catch(() => undefined);
  await recorder.recordScreenshot({ label: "game-started", path: screenshot, page: actorName });
  await recorder.recordEvent({ type: "game.started", actor: actorName, data: { screenshot } });
  void logger.info("game start requested");
}

type RunEndReason = "game-over" | "timeout" | "decision-loop-complete";

async function runUntilEndCondition(
  hostPage: Page,
  config: AiLiveConfig,
  bots: BotPlayer[],
  recorder: EventRecorder,
  logger: Logger,
  abortController: AbortController,
  liveMonitor?: LiveRunMonitor,
  hostActor = "Bot1"
): Promise<RunEndReason> {
  const loopPromise = runDecisionLoop(config, bots, recorder, logger, abortController.signal, {
    afterTick: () => liveMonitor?.afterTick()
  }).then((): RunEndReason => "decision-loop-complete");
  const endPromise = waitForGameEndOrTimeout(hostPage, config.maxRunMs);
  const endReason = await Promise.race([loopPromise, endPromise]);

  if (endReason !== "decision-loop-complete") {
    abortController.abort();
    await loopPromise;
  }

  if (endReason === "game-over") {
    await recorder.recordEvent({ type: "game.ended", actor: hostActor, data: { reason: endReason } });
  }

  return endReason;
}

async function waitForGameEndOrTimeout(page: Page, maxRunMs: number): Promise<"game-over" | "timeout"> {
  const gameOver = page
    .waitForFunction(
      () => {
        const bridge = (window as typeof window & {
          __AI_LIVE_CLIENT_BRIDGE__?: { getSnapshot?: () => { isGameOver?: boolean } };
        }).__AI_LIVE_CLIENT_BRIDGE__;
        return Boolean(bridge?.getSnapshot?.()?.isGameOver);
      },
      undefined,
      { timeout: maxRunMs }
    )
    .then((): "game-over" => "game-over")
    .catch((error) => {
      if (isClosedPageError(error)) {
        throw new Error("host page closed before game over or timeout");
      }
      return "timeout" as const;
    });

  const timeout = delay(maxRunMs).then((): "timeout" => "timeout");
  return await Promise.race([gameOver, timeout]);
}

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isClosedPageError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);
  return /Target page, context or browser has been closed|Page closed|Browser has been closed/i.test(message);
}

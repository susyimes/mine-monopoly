import type { AiLiveConfig } from "../config";
import type { Logger } from "../logging/logger";
import {
  animationCompleteAction,
  buildHouseAction,
  buyPropertyAction,
  dispatchAction,
  gameInitFinishedAction,
  readyToggleAction,
  rollDiceAction,
  useChanceCardAction,
  type BotAction,
  type BotSocketBridge
} from "../protocol/actions";
import {
  findPlayer,
  findRoomUser,
  parseSocketMessage,
  SocketMsgType,
  type GameInfo,
  type GameInitInfo,
  type PlayerTpData,
  type PlayerWalkData,
  type PropertyInfo,
  type RemainingTimeData,
  type RoomInfo,
  type SocketMessage
} from "../protocol/socket-types";
import type { EventRecorder } from "../recorder/event-recorder";
import type { BotPlayer } from "./bot-player";
import type { BotPersonality } from "./personalities";
import { RulesPolicy } from "../policy/rules-policy";
import {
  createTimeoutDecision,
  type BotPolicy,
  type BotRuntimeState,
  type BotSnapshot,
  type PolicyContext,
  type PolicyDecision
} from "../policy/types";

export async function runDecisionLoop(
  config: AiLiveConfig,
  bots: BotPlayer[],
  recorder: EventRecorder,
  logger: Logger,
  signal: AbortSignal,
  options: { afterTick?: () => Promise<void> | void } = {}
) {
  logger.info("starting bot decision loop", { bots: bots.length, maxRunMs: config.maxRunMs });
  const started = Date.now();
  const tickTimeoutMs = Math.max(config.decisionTimeoutMs * 10, 30000);
  const activeTicks = new Map<BotPlayer, { promise: Promise<TickResult>; startedAt: number; timeoutRecorded: boolean }>();
  while (!signal.aborted && Date.now() - started < config.maxRunMs) {
    await Promise.all(
      bots.map(async (bot) => {
        const active = activeTicks.get(bot);
        if (active) {
          const durationMs = Date.now() - active.startedAt;
          if (durationMs >= tickTimeoutMs && !active.timeoutRecorded) {
            active.timeoutRecorded = true;
            await recorder.recordEvent({ type: "bot.tick.timeout", actor: bot.actorName, data: { durationMs, timeoutMs: tickTimeoutMs } });
            logger.warn("bot tick still running; skipping overlapping tick", { actor: bot.actorName, durationMs, timeoutMs: tickTimeoutMs });
          }
          return;
        }

        const tracked = Promise.resolve()
          .then(() => bot.tick())
          .then((): TickResult => ({ ok: true }))
          .catch(async (error): Promise<TickResult> => {
            await recorder.recordError({ phase: "bot.tick", page: bot.actorName, error });
            return { ok: false, error };
          })
          .finally(() => {
            activeTicks.delete(bot);
          });
        activeTicks.set(bot, { promise: tracked, startedAt: Date.now(), timeoutRecorded: false });

        const timeoutMessage = `bot tick timed out: ${bot.actorName}`;
        try {
          const result = await withTimeout(tracked, tickTimeoutMs, timeoutMessage);
          if (!result.ok) throw result.error;
        } catch (error) {
          if (error instanceof Error && error.message === timeoutMessage) {
            const item = activeTicks.get(bot);
            if (item) item.timeoutRecorded = true;
            await recorder.recordEvent({ type: "bot.tick.timeout", actor: bot.actorName, data: { timeoutMs: tickTimeoutMs } });
            logger.warn(timeoutMessage, { timeoutMs: tickTimeoutMs });
            return;
          }
          throw error;
        }
      })
    );
    await recorder.recordEvent({ type: "decision-loop.tick", data: { bots: bots.length } });
    await options.afterTick?.();
    await delay(config.decisionTimeoutMs);
  }
}

type TickResult = { ok: true } | { ok: false; error: unknown };

export interface DecisionLoopLogger {
  debug?(message: string, meta?: unknown): void;
  info?(message: string, meta?: unknown): void;
  warn?(message: string, meta?: unknown): void;
  error?(message: string, meta?: unknown): void;
}

export interface BotDecisionLoopOptions {
  userId: string;
  roomId?: string;
  persona: BotPersonality;
  bridge: BotSocketBridge;
  policy?: BotPolicy;
  decisionTimeoutMs?: number;
  now?: () => number;
  logger?: DecisionLoopLogger;
}

export class BotDecisionLoop {
  private readonly userId: string;
  private readonly persona: BotPersonality;
  private readonly bridge: BotSocketBridge;
  private readonly policy: BotPolicy;
  private readonly decisionTimeoutMs: number;
  private readonly now: () => number;
  private readonly logger?: DecisionLoopLogger;
  private pendingDecision: Promise<void> = Promise.resolve();
  private state: BotRuntimeState = "Idle";
  private snapshot: BotSnapshot;

  constructor(options: BotDecisionLoopOptions) {
    this.userId = options.userId;
    this.persona = options.persona;
    this.bridge = options.bridge;
    this.policy = options.policy ?? new RulesPolicy(options.persona);
    this.decisionTimeoutMs = options.decisionTimeoutMs ?? 3000;
    this.now = options.now ?? Date.now;
    this.logger = options.logger;
    this.snapshot = {
      selfUserId: options.userId,
      roomId: options.roomId,
      state: this.state,
      isGameOver: false
    };
  }

  getSnapshot(): BotSnapshot {
    return { ...this.snapshot, state: this.state };
  }

  async handleIncoming(raw: string | SocketMessage): Promise<void> {
    const message = parseSocketMessage(raw);
    this.snapshot.lastMessage = message;
    if (message.roomId) this.snapshot.roomId = message.roomId;

    switch (message.type) {
      case SocketMsgType.RoomInfo:
        await this.handleRoomInfo(message as SocketMessage<RoomInfo>);
        break;
      case SocketMsgType.GameStart:
        this.transition("LoadingGame", "game start received");
        break;
      case SocketMsgType.GameInit:
        await this.handleGameInit(message as SocketMessage<GameInitInfo>);
        break;
      case SocketMsgType.GameInitFinished:
        this.transition("Playing", "all clients reported game init finished");
        break;
      case SocketMsgType.GameInfo:
        this.handleGameInfo(message as SocketMessage<GameInfo>);
        break;
      case SocketMsgType.RemainingTime:
        this.snapshot.remainingTime = message.data as RemainingTimeData;
        break;
      case SocketMsgType.RoundTurn:
        await this.enqueueDecision(() => this.handleRoundTurn());
        break;
      case SocketMsgType.PlayerWalk:
        await this.handlePlayerMovement(message.data as PlayerWalkData);
        break;
      case SocketMsgType.PlayerTp:
        await this.handlePlayerMovement(message.data as PlayerTpData);
        break;
      case SocketMsgType.BuyProperty:
        await this.enqueueDecision(() => this.handlePropertyPrompt("BuyProperty", message.data as PropertyInfo));
        break;
      case SocketMsgType.BuildHouse:
        await this.enqueueDecision(() => this.handlePropertyPrompt("BuildHouse", message.data as PropertyInfo));
        break;
      case SocketMsgType.GameOver:
        this.snapshot.isGameOver = true;
        this.transition("Ended", "game over received");
        break;
    }
  }

  private async handleRoomInfo(message: SocketMessage<RoomInfo>): Promise<void> {
    this.snapshot.roomInfo = message.data;
    this.snapshot.roomId = message.data.roomId;
    const self = findRoomUser(message.data, this.userId);
    if (!self) {
      this.transition("JoiningRoom", "waiting for self in room info");
      return;
    }

    if (message.data.isStarted) {
      this.transition("LoadingGame", "room already started");
      return;
    }

    if (self.isReady) {
      this.transition("Ready", "self is ready");
      return;
    }

    this.transition("Lobby", "self joined lobby");
    await this.dispatch(readyToggleAction(this.actionContext()));
    this.transition("Ready", "ready toggle sent");
  }

  private async handleGameInit(message: SocketMessage<GameInitInfo>): Promise<void> {
    this.snapshot.gameInitInfo = message.data;
    this.snapshot.selfPlayer = findPlayer(message.data, this.userId);
    this.transition("LoadingGame", "game init payload received");
    await this.dispatch(gameInitFinishedAction(this.actionContext()));
  }

  private handleGameInfo(message: SocketMessage<GameInfo>): void {
    this.snapshot.gameInfo = message.data;
    this.snapshot.selfPlayer = findPlayer(message.data, this.userId);
    if (!this.snapshot.isGameOver && this.state !== "WaitingArriveDecision" && this.state !== "WaitingDiceResult") {
      this.transition("Playing", "game info updated");
    }
  }

  private async handleRoundTurn(): Promise<void> {
    if (this.snapshot.isGameOver) return;
    this.transition("MyTurnDeciding", "round turn prompt received");
    const decision = await this.decide(this.policyContext("RoundTurn"));
    await this.dispatchDecision(decision);
    this.snapshot.lastRollRound = this.snapshot.gameInfo?.currentRound;
    this.transition("WaitingDiceResult", decision.reason);
  }

  private async handlePropertyPrompt(eventType: "BuyProperty" | "BuildHouse", property: PropertyInfo): Promise<void> {
    if (this.snapshot.isGameOver) return;
    this.transition("WaitingArriveDecision", `${eventType} prompt received`);
    const decision = await this.decide(this.policyContext(eventType, property));
    await this.dispatchDecision(decision);
    this.transition("Playing", decision.reason);
  }

  private async handlePlayerMovement(data: PlayerWalkData | PlayerTpData): Promise<void> {
    if (data.playerId !== this.userId) return;
    await this.dispatch(animationCompleteAction(this.actionContext(), data.walkId));
  }

  private async decide(context: PolicyContext): Promise<PolicyDecision> {
    this.snapshot.lastDecisionAt = this.now();
    const timeout = new Promise<PolicyDecision>((resolve) => {
      setTimeout(() => resolve(createTimeoutDecision(context)), this.decisionTimeoutMs);
    });
    return Promise.race([Promise.resolve(this.policy.decide(context)), timeout]);
  }

  private async dispatchDecision(decision: PolicyDecision): Promise<void> {
    if (decision.kind === "roll-dice") {
      await this.dispatch(rollDiceAction(this.actionContext(), decision.reason));
      return;
    }
    if (decision.kind === "buy-property") {
      await this.dispatch(buyPropertyAction(this.actionContext(), Boolean(decision.accept), decision.reason));
      return;
    }
    if (decision.kind === "build-house") {
      await this.dispatch(buildHouseAction(this.actionContext(), Boolean(decision.accept), decision.reason));
      return;
    }
    if (decision.kind === "use-chance-card" && decision.cardId) {
      await this.dispatch(useChanceCardAction(this.actionContext(), decision.cardId, decision.targetIds ?? decision.targetId, decision.reason));
    }
  }

  private async dispatch(action: BotAction): Promise<void> {
    this.logger?.debug?.("bot action dispatch", { action: action.name, reason: action.reason });
    await dispatchAction(this.bridge, action);
  }

  private enqueueDecision(fn: () => Promise<void>): Promise<void> {
    this.pendingDecision = this.pendingDecision.then(fn, fn);
    return this.pendingDecision;
  }

  private policyContext(eventType: string, property?: PropertyInfo): PolicyContext {
    return {
      botId: this.userId,
      personaId: this.persona.id,
      eventType,
      cash: this.snapshot.selfPlayer?.money,
      property,
      propertyCost: property?.sellCost,
      buildCost: property?.buildCost,
      chanceCards: this.snapshot.selfPlayer?.chanceCards,
      players: this.snapshot.gameInfo?.playerList,
      properties: this.snapshot.gameInfo?.properties,
      round: this.snapshot.gameInfo?.currentRound,
      remainingMs: this.remainingMs(),
      decisionTimeoutMs: this.decisionTimeoutMs,
      now: this.now(),
      snapshot: this.getSnapshot()
    };
  }

  private actionContext() {
    return {
      userId: this.userId,
      roomId: this.snapshot.roomId,
      now: this.now
    };
  }

  private remainingMs(): number | undefined {
    if (typeof this.snapshot.remainingTime?.remainingTime !== "number") return undefined;
    return this.snapshot.remainingTime.remainingTime * 1000;
  }

  private transition(next: BotRuntimeState, reason: string): void {
    if (this.state === next) return;
    const previous = this.state;
    this.state = next;
    this.snapshot.state = next;
    this.logger?.info?.("bot state transition", { from: previous, to: next, reason });
  }
}

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function withTimeout<T>(promise: Promise<T>, timeoutMs: number, message: string): Promise<T> {
  let timeoutId: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => reject(new Error(message)), timeoutMs);
  });
  return Promise.race([promise, timeout]).finally(() => {
    if (timeoutId) clearTimeout(timeoutId);
  });
}

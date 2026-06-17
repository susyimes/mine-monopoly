import type { Page } from "playwright";
import {
  MonopolyActionType,
  MonopolyAutomationBridgeAdapter,
  MonopolyEventType,
  type MonopolyAnimationData,
  type MonopolyChanceCardPromptData,
  type MonopolyMovementData,
  type MonopolyPropertyPromptData
} from "../adapters/monopoly/automation-bridge-adapter";
import { AgentColonyRuntime, type ColonyDispatchInput, type ColonyEventInput } from "../colony";
import type { BotSocketBridge } from "../protocol/actions";
import type { SocketMessage } from "../protocol/socket-types";
import type { EventRecorder } from "../recorder/event-recorder";
import type { BotPolicy, BotSnapshot, ParticipantDescriptor } from "../policy/types";
import { shouldRunBotDecisionLoop } from "../policy/types";
import { personalityById, type BotPersonality } from "./personalities";
import { BotDecisionLoop, type DecisionLoopLogger } from "./decision-loop";

export interface BotPlayerOptions {
  participant: ParticipantDescriptor;
  bridge?: BotSocketBridge;
  page?: Page;
  roomId?: string;
  personality?: BotPersonality | string;
  policy?: BotPolicy;
  decisionTimeoutMs?: number;
  logger?: DecisionLoopLogger;
  recorder?: EventRecorder;
}

export class BotPlayer {
  readonly id: string;
  readonly actorName: string;
  readonly page?: Page;
  readonly personality: BotPersonality;
  readonly policy: BotPolicy;
  private readonly recorder?: EventRecorder;
  private readonly bridge?: BotSocketBridge;
  private readonly agentMemoryRef?: string;
  private readonly agentMetadata?: Record<string, unknown>;
  private readonly loop?: BotDecisionLoop;
  private readonly colonyRuntime?: AgentColonyRuntime;
  private gameInitFinishedSent = false;
  private pageClosedRecorded = false;
  private unsubscribe?: () => void | Promise<void>;

  constructor(id: string, page: Page, personality: BotPersonality, policy: BotPolicy, recorder: EventRecorder);
  constructor(options: BotPlayerOptions);
  constructor(
    idOrOptions: string | BotPlayerOptions,
    page?: Page,
    personality?: BotPersonality,
    policy?: BotPolicy,
    recorder?: EventRecorder
  ) {
    if (typeof idOrOptions === "string") {
      this.id = idOrOptions;
      this.actorName = idOrOptions;
      this.page = page;
      this.personality = personality ?? personalityById("aggressive");
      this.policy = policy ?? fallbackPolicy(this.personality);
      this.recorder = recorder;
      this.agentMetadata = { source: "legacy-constructor" };
      this.colonyRuntime = this.page ? this.createMonopolyColonyRuntime(this.page) : undefined;
      return;
    }

    const options = idOrOptions;
    if (!shouldRunBotDecisionLoop(options.participant)) {
      throw new Error(`participant ${options.participant.userId} is human-controlled and must not enter bot decision-loop`);
    }

    this.id = options.participant.userId;
    this.actorName = options.participant.username ?? options.participant.userId;
    this.page = options.page;
    this.personality =
      typeof options.personality === "string"
        ? personalityById(options.personality)
        : options.personality ?? personalityById(options.participant.personaId ?? "aggressive");
    this.policy = options.policy ?? fallbackPolicy(this.personality);
    this.recorder = options.recorder;
    this.bridge = options.bridge;
    this.agentMemoryRef = options.participant.memoryRef;
    this.agentMetadata = options.participant.metadata;

    if (options.bridge) {
      this.loop = new BotDecisionLoop({
        userId: options.participant.userId,
        roomId: options.roomId,
        persona: this.personality,
        bridge: options.bridge,
        policy: this.policy,
        decisionTimeoutMs: options.decisionTimeoutMs,
        logger: options.logger
      });
    }
    this.colonyRuntime = this.page ? this.createMonopolyColonyRuntime(this.page) : undefined;
  }

  async start(): Promise<void> {
    if (!this.bridge?.onMessage || !this.loop) return;
    this.unsubscribe = await this.bridge.onMessage((message) => this.handleMessage(message));
  }

  async stop(): Promise<void> {
    if (this.unsubscribe) await this.unsubscribe();
    await this.bridge?.close?.();
  }

  async handleMessage(message: SocketMessage | string): Promise<void> {
    await this.loop?.handleIncoming(message);
  }

  async ready() {
    if (!this.page) return;
    await this.page.getByRole("button", { name: /^准备$/ }).click({ timeout: 15000 });
    await this.recorder?.recordEvent({ type: "bot.ready", actor: this.actorName, data: { userId: this.id, persona: this.personality.id } });
  }

  async tick() {
    if (!this.page) return;
    if (this.page.isClosed()) {
      await this.recordClosedPageOnce("tick skipped because page is closed");
      return;
    }

    try {
      const automationHandled = await this.colonyRuntime?.tick();
      if (typeof automationHandled === "boolean") return;

      const modalDecision = await this.handleVisibleDecisionModal();
      if (modalDecision) return;

      if (await this.clickDiceIfPolicyAllows()) return;
    } catch (error) {
      if (isClosedPageError(error)) {
        await this.recordClosedPageOnce(error instanceof Error ? error.message : String(error));
        return;
      }
      throw error;
    }
  }

  getSnapshot(): BotSnapshot | undefined {
    return this.loop?.getSnapshot();
  }

  private async clickDiceIfPolicyAllows() {
    const dice = this.page?.locator("#game_dice_canvas.canroll").first();
    if (!dice || (await dice.count()) === 0 || !(await dice.isVisible().catch(() => false))) return false;

    const decision = await this.policy.decide({
      botId: this.id,
      personaId: this.personality.id,
      eventType: "RoundTurn",
      cash: await this.readVisibleCash()
    });
    if (decision.kind !== "roll-dice") return false;

    await dice.click({ timeout: 1000 }).catch(() => undefined);
    await this.recorder?.recordDecision({
      actor: this.actorName,
      decision: "roll-dice",
      reason: decision.reason,
      data: { eventType: "RoundTurn", source: "ui", clicked: true, userId: this.id }
    });
    return true;
  }

  private async recordClosedPageOnce(message: string) {
    if (this.pageClosedRecorded) return;
    this.pageClosedRecorded = true;
    await this.recorder?.recordEvent({
      type: "bot.page-closed",
      actor: this.actorName,
      message
    });
  }

  private createMonopolyColonyRuntime(page: Page) {
    return new AgentColonyRuntime({
      agent: {
        id: this.id,
        name: this.actorName,
        personaId: this.personality.id,
        controller: "bot",
        memoryRef: this.agentMemoryRef,
        metadata: { label: this.personality.label, ...this.agentMetadata }
      },
      adapter: new MonopolyAutomationBridgeAdapter(page),
      handler: {
        observeEvent: (input) => this.observeMonopolyColonyEvent(input),
        decideAction: (input) => this.decideMonopolyColonyAction(input),
        afterDispatch: (input) => this.afterMonopolyColonyDispatch(input)
      }
    });
  }

  private async observeMonopolyColonyEvent(input: ColonyEventInput) {
    if (input.event.type === MonopolyEventType.PlayerMovement) {
      const data = input.event.data as MonopolyMovementData | undefined;
      if (!data?.walkId) return;
      await this.recorder?.recordEvent({
        type: "bot.player-movement",
        actor: this.actorName,
        data: {
          userId: this.id,
          eventType: data.eventType,
          walkId: data.walkId,
          playerId: data.playerId,
          playerName: data.playerName,
          step: data.step,
          positionIndex: data.positionIndex,
          targetId: data.targetId,
          targetName: data.targetName
        }
      });
      return;
    }

    if (input.event.type === MonopolyEventType.AnimationCompleted) {
      const data = input.event.data as MonopolyAnimationData | undefined;
      if (!data?.walkId) return;
      await this.recorder?.recordEvent({
        type: "bot.animation-complete",
        actor: this.actorName,
        data: { userId: this.id, walkId: data.walkId, source: data.source, dispatched: true }
      });
      return;
    }

    if (input.event.type === MonopolyEventType.GameOver) {
      await this.recorder?.recordEvent({
        type: "bot.game-over-seen",
        actor: this.actorName,
        data: input.event.data
      });
    }
  }

  private async decideMonopolyColonyAction(input: ColonyEventInput) {
    if (input.event.type === MonopolyEventType.GameInit) {
      if (this.gameInitFinishedSent) return undefined;
      this.gameInitFinishedSent = true;
      return { type: MonopolyActionType.GameInitFinished };
    }

    if (input.event.type === MonopolyEventType.TurnPrompt) {
      const decision = await this.policy.decide({
        botId: this.id,
        personaId: this.personality.id,
        eventType: "RoundTurn",
        cash: input.snapshot?.agentCash,
        round: input.snapshot?.currentRound,
        remainingMs: input.snapshot?.remainingMs
      });
      if (decision.kind !== "roll-dice") return undefined;
      return {
        type: MonopolyActionType.RollDice,
        reason: decision.reason,
        metadata: { policyDecision: decision }
      };
    }

    if (input.event.type === MonopolyEventType.ChanceCardPrompt) {
      const data = input.event.data as MonopolyChanceCardPromptData | undefined;
      const decision = await this.policy.decide({
        botId: this.id,
        personaId: this.personality.id,
        eventType: "ChanceCard",
        cash: input.snapshot?.agentCash,
        chanceCards: data?.chanceCards,
        players: data?.players,
        properties: data?.properties,
        mapItems: data?.mapItems,
        round: input.snapshot?.currentRound,
        remainingMs: input.snapshot?.remainingMs
      });
      if (decision.kind !== "use-chance-card" || !decision.cardId) return undefined;
      return {
        type: MonopolyActionType.UseChanceCard,
        payload: { cardId: decision.cardId, targetId: decision.targetId, targetIds: decision.targetIds },
        reason: decision.reason,
        metadata: { policyDecision: decision }
      };
    }

    if (input.event.type === MonopolyEventType.PropertyPrompt) {
      const data = input.event.data as MonopolyPropertyPromptData | undefined;
      const eventType = data?.eventType ?? "BuyProperty";
      const property = data?.property;
      const decision = await this.policy.decide({
        botId: this.id,
        personaId: this.personality.id,
        eventType,
        cash: input.snapshot?.agentCash,
        property,
        propertyCost: eventType === "BuyProperty" ? property?.sellCost : undefined,
        buildCost: eventType === "BuildHouse" ? property?.buildCost : undefined,
        round: input.snapshot?.currentRound,
        remainingMs: input.snapshot?.remainingMs
      });
      const accept = Boolean(decision.accept);
      return {
        type: eventType === "BuyProperty" ? MonopolyActionType.BuyProperty : MonopolyActionType.BuildHouse,
        payload: { accept },
        reason: decision.reason,
        metadata: { policyDecision: decision }
      };
    }

    if (input.event.type === MonopolyEventType.AnimationStale) {
      const data = input.event.data as MonopolyAnimationData | undefined;
      if (!data?.walkId) return undefined;
      return {
        type: MonopolyActionType.AnimationComplete,
        payload: { walkId: data.walkId },
        metadata: { eventType: data.eventType, source: data.source }
      };
    }

    return undefined;
  }

  private async afterMonopolyColonyDispatch(input: ColonyDispatchInput) {
    if (input.action.type === MonopolyActionType.GameInitFinished) {
      await this.recorder?.recordEvent({
        type: "bot.game-init-finished",
        actor: this.actorName,
        data: { userId: this.id, source: "automation-bridge", dispatched: input.result.ok }
      });
      return;
    }

    if (input.action.type === MonopolyActionType.RollDice) {
      await this.recorder?.recordDecision({
        actor: this.actorName,
        decision: "roll-dice",
        reason: input.action.reason,
        data: { userId: this.id, eventType: "RoundTurn", source: "automation-bridge", dispatched: input.result.ok }
      });
      return;
    }

    if (input.action.type === MonopolyActionType.UseChanceCard) {
      const prompt = input.event.data as MonopolyChanceCardPromptData | undefined;
      const payload = input.action.payload as { cardId?: string; targetId?: string; targetIds?: string[] } | undefined;
      const card = prompt?.chanceCards.find((item) => item.id === payload?.cardId);
      const target = describeChanceCardTarget(payload, prompt);
      await this.recorder?.recordDecision({
        actor: this.actorName,
        decision: "use-chance-card",
        reason: input.action.reason,
        data: {
          userId: this.id,
          eventType: "ChanceCard",
          source: "automation-bridge",
          dispatched: input.result.ok,
          cardId: payload?.cardId,
          cardName: card?.name,
          cardType: card?.type,
          targetId: payload?.targetId,
          targetIds: payload?.targetIds,
          targetName: target.targetName,
          targetNames: target.targetNames,
          targetType: target.targetType,
          targetOwnerName: target.targetOwnerName
        }
      });
      return;
    }

    if (input.action.type === MonopolyActionType.BuyProperty || input.action.type === MonopolyActionType.BuildHouse) {
      const eventData = input.event.data as MonopolyPropertyPromptData | undefined;
      const property = eventData?.property;
      const eventType = eventData?.eventType ?? "BuyProperty";
      const accept = Boolean((input.action.payload as { accept?: boolean } | undefined)?.accept);
      await this.recorder?.recordDecision({
        actor: this.actorName,
        decision: accept ? "accept" : "decline",
        reason: input.action.reason,
        data: {
          userId: this.id,
          eventType,
          source: "automation-bridge",
          dispatched: input.result.ok,
          propertyId: property?.id,
          propertyName: property?.name,
          cost: eventType === "BuyProperty" ? property?.sellCost : property?.buildCost
        }
      });
      return;
    }

    if (input.action.type === MonopolyActionType.AnimationComplete) {
      const data = input.event.data as MonopolyAnimationData | undefined;
      await this.recorder?.recordEvent({
        type: "bot.animation-complete",
        actor: this.actorName,
        data: {
          userId: this.id,
          walkId: data?.walkId,
          source: data?.source ?? "automation-fallback",
          eventType: data?.eventType,
          dispatched: input.result.ok
        }
      });
    }
  }

  private async handleVisibleDecisionModal() {
    const page = this.page;
    if (!page) return false;

    const isBuy = await page.getByText("购买地皮").first().isVisible().catch(() => false);
    const isBuild = await page.getByText("升级房子").first().isVisible().catch(() => false);
    if (!isBuy && !isBuild) return false;

    const eventType = isBuy ? "BuyProperty" : "BuildHouse";
    const bodyText = await page.locator("body").innerText({ timeout: 500 }).catch(() => "");
    const cost = readLikelyCost(bodyText);
    const decision = await this.policy.decide({
      botId: this.id,
      personaId: this.personality.id,
      eventType,
      cash: await this.readVisibleCash(bodyText),
      propertyCost: isBuy ? cost : undefined,
      buildCost: isBuild ? cost : undefined
    });
    const accept = Boolean(decision.accept);
    const selector = accept ? "button.confirm__btn" : "button.cancle__btn";
    const clicked = await this.clickIfVisible(selector);
    await this.recorder?.recordDecision({
      actor: this.actorName,
      decision: accept ? "accept" : "decline",
      reason: decision.reason,
      data: { userId: this.id, eventType, cost, clicked }
    });
    return clicked;
  }

  private async readVisibleCash(bodyText?: string) {
    const text = bodyText ?? (await this.page?.locator("body").innerText({ timeout: 500 }).catch(() => "")) ?? "";
    const cashMatch = text.match(/(?:现金|金钱|money|cash|￥)\s*[:：]?\s*(-?\d+)/i);
    return cashMatch?.[1] ? Number(cashMatch[1]) : undefined;
  }

  private async clickIfVisible(selector: string) {
    const locator = this.page?.locator(selector).first();
    if (!locator || (await locator.count()) === 0) return false;
    if (!(await locator.isVisible().catch(() => false))) return false;
    await locator.click({ timeout: 1000 }).catch(() => undefined);
    return true;
  }
}

export function createBotPlayer(options: BotPlayerOptions): BotPlayer {
  return new BotPlayer(options);
}

function readLikelyCost(text: string) {
  const matches = [...text.matchAll(/(?:价格|费用|售价|升级|￥)\D{0,8}(\d+)/g)].map((match) => Number(match[1]));
  const fallback = [...text.matchAll(/\b(\d{2,})\b/g)].map((match) => Number(match[1]));
  return matches.find(Number.isFinite) ?? fallback.find(Number.isFinite) ?? 0;
}

function fallbackPolicy(personality: BotPersonality): BotPolicy {
  return {
    async decide(context) {
      if (context.eventType === "RoundTurn") return { kind: "roll-dice", reason: `${personality.label}: default roll` };
      return { kind: "wait", reason: `${personality.label}: no fallback action` };
    }
  };
}

function isClosedPageError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);
  return /Target page, context or browser has been closed|Page closed|Browser has been closed/i.test(message);
}

function describeChanceCardTarget(
  payload: { targetId?: string; targetIds?: string[] } | undefined,
  prompt: MonopolyChanceCardPromptData | undefined
): { targetName?: string; targetNames?: string[]; targetType?: string; targetOwnerName?: string } {
  const ids = payload?.targetIds ?? (payload?.targetId ? [payload.targetId] : []);
  const targets = ids.map((id) => describeTargetId(id, prompt)).filter((item): item is NonNullable<typeof item> => Boolean(item));
  const first = targets[0];
  return {
    targetName: first?.name,
    targetNames: targets.length > 1 ? targets.map((item) => item.name) : undefined,
    targetType: first?.type,
    targetOwnerName: first?.ownerName
  };
}

function describeTargetId(
  id: string,
  prompt: MonopolyChanceCardPromptData | undefined
): { name: string; type: string; ownerName?: string } | undefined {
  const player = prompt?.players.find((item) => item.id === id);
  if (player) return { name: player.user.username, type: "player" };

  const property = prompt?.properties.find((item) => item.id === id);
  if (property) return { name: property.name, type: "property", ownerName: property.owner?.name };

  const mapItem = prompt?.mapItems.find((item) => item.id === id);
  if (mapItem) return { name: mapItem.property?.name ?? mapItem.id, type: "mapItem", ownerName: mapItem.property?.owner?.name };

  return id ? { name: id, type: "unknown" } : undefined;
}

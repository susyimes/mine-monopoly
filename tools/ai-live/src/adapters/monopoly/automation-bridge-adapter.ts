import type { Page } from "playwright";
import {
  ChanceCardType,
  OperateType,
  SocketMsgType,
  type ChanceCardInfo,
  type MapItemInfo,
  type PlayerInfo,
  type PropertyInfo
} from "../../protocol/socket-types";
import type { ActionDispatchResult, GameAction, GameAdapter, GameEvent, GameSnapshot } from "../../colony";

export const MonopolyActionType = {
  GameInitFinished: "monopoly.game-init-finished",
  RollDice: "monopoly.roll-dice",
  UseChanceCard: "monopoly.use-chance-card",
  BuyProperty: "monopoly.buy-property",
  BuildHouse: "monopoly.build-house",
  AnimationComplete: "monopoly.animation-complete"
} as const;

export const MonopolyEventType = {
  GameInit: "monopoly.game-init",
  ChanceCardPrompt: "monopoly.chance-card.prompt",
  TurnPrompt: "monopoly.turn.prompt",
  PropertyPrompt: "monopoly.property.prompt",
  PlayerMovement: "monopoly.player-movement",
  AnimationCompleted: "monopoly.animation.completed",
  AnimationStale: "monopoly.animation.stale",
  GameOver: "monopoly.game-over"
} as const;

export interface MonopolyPropertyPromptData {
  eventType: "BuyProperty" | "BuildHouse";
  property?: PropertyInfo;
}

export interface MonopolyChanceCardPromptData {
  chanceCards: ChanceCardInfo[];
  selfPlayer?: PlayerInfo;
  players: PlayerInfo[];
  properties: PropertyInfo[];
  mapItems: MapItemInfo[];
  canUseCard: boolean;
  canRoll: boolean;
}

export interface MonopolyMovementData {
  eventType: "PlayerWalk" | "PlayerTp";
  walkId: string;
  playerId?: string;
  playerName?: string;
  step?: number;
  positionIndex?: number;
  targetId?: string;
  targetName?: string;
}

export interface MonopolyAnimationData {
  walkId: string;
  source: "client-renderer" | "automation-fallback";
  eventType?: "PlayerWalk" | "PlayerTp";
  dispatched?: boolean;
}

type AutomationBridgeAction =
  | "gameInitFinished"
  | "rollDice"
  | "useChanceCard"
  | "buyProperty"
  | "buildHouse"
  | "animationComplete";

interface AutomationBridgeMessage {
  index: number;
  at: number;
  direction: "in" | "out";
  type: SocketMsgType;
  typeName?: string;
  source?: string;
  roomId?: string;
  data?: unknown;
  extra?: unknown;
  msg?: unknown;
}

interface AutomationBridgeSnapshot {
  userId?: string;
  username?: string;
  roomId?: string;
  currentPlayerIdInRound?: string;
  currentRound?: number;
  currentMultiplier?: number;
  cash?: number;
  isGameOver?: boolean;
  canRoll?: boolean;
  canUseCard?: boolean;
  chanceCards?: ChanceCardInfo[];
  selfPlayer?: PlayerInfo;
  players?: PlayerInfo[];
  properties?: PropertyInfo[];
  mapItems?: MapItemInfo[];
  mapIndexList?: string[];
  waitingFor?: { eventMsg?: string; remainingTime?: number };
}

interface AutomationBridgeRead {
  cursor: number;
  messages: AutomationBridgeMessage[];
  snapshot?: AutomationBridgeSnapshot;
}

export class MonopolyAutomationBridgeAdapter implements GameAdapter {
  readonly id = "monopoly-automation-bridge";
  readonly gameName = "monopoly";

  private readonly pendingAnimations = new Map<string, { seenAt: number; eventType: "PlayerWalk" | "PlayerTp" }>();
  private readonly recordedAnimationAcks = new Set<string>();
  private cursor = 0;
  private lastSnapshot?: GameSnapshot;

  constructor(private readonly page: Page, private readonly options: { staleAnimationMs?: number } = {}) {}

  async readEvents(): Promise<GameEvent[] | undefined> {
    const bridgeRead = await this.readBridge();
    if (!bridgeRead) return undefined;

    this.lastSnapshot = toGameSnapshot(bridgeRead.snapshot);
    const events = bridgeRead.messages.flatMap((message) => this.toEvents(message, this.lastSnapshot));
    if (!events.some((event) => event.type === MonopolyEventType.TurnPrompt || event.type === MonopolyEventType.PropertyPrompt)) {
      events.push(...this.readSyntheticPromptEvents(this.lastSnapshot));
    }
    const stale = this.readStaleAnimationEvent(this.lastSnapshot);
    if (stale) events.push(stale);
    return events;
  }

  async readSnapshot(): Promise<GameSnapshot | undefined> {
    return this.lastSnapshot;
  }

  listLegalActions(event: GameEvent): GameAction[] {
    switch (event.type) {
      case MonopolyEventType.GameInit:
        return [{ type: MonopolyActionType.GameInitFinished }];
      case MonopolyEventType.ChanceCardPrompt:
        return chanceCardPromptActions(event.data as MonopolyChanceCardPromptData | undefined);
      case MonopolyEventType.TurnPrompt:
        return [{ type: MonopolyActionType.RollDice }];
      case MonopolyEventType.PropertyPrompt:
        return propertyPromptActions(event.data as MonopolyPropertyPromptData | undefined);
      case MonopolyEventType.AnimationStale:
        return [{ type: MonopolyActionType.AnimationComplete, payload: event.data }];
      default:
        return [];
    }
  }

  async dispatchAction(action: GameAction): Promise<ActionDispatchResult> {
    const bridgeAction = toBridgeAction(action.type);
    if (!bridgeAction) return { ok: false, action, error: `unsupported monopoly action: ${action.type}` };

    const payload = (action.payload ?? {}) as {
      accept?: boolean;
      walkId?: string;
      cardId?: string;
      targetId?: string;
      targetIds?: string[];
    };
    const ok = await this.page
      .evaluate(
        async ({ bridgeAction, accept, walkId, cardId, target }) => {
          const bridge = (window as typeof window & {
            __AI_LIVE_CLIENT_BRIDGE__?: Record<string, unknown>;
          }).__AI_LIVE_CLIENT_BRIDGE__;
          const fn = bridge?.[bridgeAction];
          if (typeof fn !== "function") return false;
          if (bridgeAction === "buyProperty" || bridgeAction === "buildHouse") {
            await (fn as (accept: boolean) => unknown)(Boolean(accept));
          } else if (bridgeAction === "useChanceCard") {
            if (!cardId) return false;
            await (fn as (cardId: string, target?: string | string[]) => unknown)(cardId, target);
          } else if (bridgeAction === "animationComplete") {
            await (fn as (walkId?: string) => unknown)(walkId);
          } else {
            await (fn as () => unknown)();
          }
          return true;
        },
        { bridgeAction, accept: payload.accept, walkId: payload.walkId, cardId: payload.cardId, target: payload.targetIds ?? payload.targetId }
      )
      .catch(() => false);

    return { ok, action };
  }

  private async readBridge(): Promise<AutomationBridgeRead | undefined> {
    const result = await this.page
      .evaluate((cursor) => {
        const bridge = (window as typeof window & {
          __AI_LIVE_CLIENT_BRIDGE__?: {
            getMessages?: (cursor: number) => { cursor: number; messages: unknown[] };
            getSnapshot?: () => unknown;
          };
        }).__AI_LIVE_CLIENT_BRIDGE__;
        if (!bridge?.getMessages) return undefined;
        const messages = bridge.getMessages(cursor);
        return {
          cursor: messages.cursor,
          messages: messages.messages,
          snapshot: bridge.getSnapshot?.()
        };
      }, this.cursor)
      .catch(() => undefined);

    if (!result) return undefined;
    const typed = result as AutomationBridgeRead;
    this.cursor = typed.cursor;
    return typed;
  }

  private toEvents(message: AutomationBridgeMessage, snapshot?: GameSnapshot): GameEvent[] {
    if (message.direction === "out") return this.outgoingToEvents(message, snapshot);
    switch (message.type) {
      case SocketMsgType.GameInit:
        return [this.event(MonopolyEventType.GameInit, message, undefined, snapshot)];
      case SocketMsgType.RoundTurn:
        return this.roundTurnToEvents(message, snapshot);
      case SocketMsgType.ConfirmDialog:
        return this.confirmDialogToEvents(message, snapshot);
      case SocketMsgType.BuyProperty:
        return [
          this.event<MonopolyPropertyPromptData>(
            MonopolyEventType.PropertyPrompt,
            message,
            { eventType: "BuyProperty", property: asPropertyInfo(message.data) },
            snapshot
          )
        ];
      case SocketMsgType.BuildHouse:
        return [
          this.event<MonopolyPropertyPromptData>(
            MonopolyEventType.PropertyPrompt,
            message,
            { eventType: "BuildHouse", property: asPropertyInfo(message.data) },
            snapshot
          )
        ];
      case SocketMsgType.PlayerWalk:
      case SocketMsgType.PlayerTp:
        return this.playerMovementToEvents(message, snapshot);
      case SocketMsgType.GameOver:
        return [this.event(MonopolyEventType.GameOver, message, message.data, snapshot)];
      default:
        return [];
    }
  }

  private roundTurnToEvents(message: AutomationBridgeMessage, snapshot?: GameSnapshot): GameEvent[] {
    const events: GameEvent[] = [];
    const chanceCardPrompt = this.createChanceCardPromptEvent(message, snapshot);
    if (chanceCardPrompt) events.push(chanceCardPrompt);
    events.push(this.event(MonopolyEventType.TurnPrompt, message, undefined, snapshot));
    return events;
  }

  private outgoingToEvents(message: AutomationBridgeMessage, snapshot?: GameSnapshot): GameEvent[] {
    if (message.type !== SocketMsgType.Animation && message.type !== SocketMsgType.Operation) return [];
    const walkId = readAnimationAckId(message.data);
    if (!walkId || this.recordedAnimationAcks.has(walkId)) return [];
    this.recordedAnimationAcks.add(walkId);
    this.pendingAnimations.delete(walkId);
    return [
      this.event<MonopolyAnimationData>(
        MonopolyEventType.AnimationCompleted,
        message,
        { walkId, source: "client-renderer", dispatched: true },
        snapshot
      )
    ];
  }

  private confirmDialogToEvents(message: AutomationBridgeMessage, snapshot?: GameSnapshot): GameEvent[] {
    const prompt = readConfirmDialogPrompt(message.data, snapshot);
    if (!prompt) return [];
    return [this.event<MonopolyPropertyPromptData>(MonopolyEventType.PropertyPrompt, message, prompt, snapshot)];
  }

  private playerMovementToEvents(message: AutomationBridgeMessage, snapshot?: GameSnapshot): GameEvent[] {
    const movement = readMovement(message.data);
    if (!movement?.walkId || this.recordedAnimationAcks.has(movement.walkId)) return [];
    const eventType = message.type === SocketMsgType.PlayerWalk ? "PlayerWalk" : "PlayerTp";
    if (!this.pendingAnimations.has(movement.walkId)) {
      this.pendingAnimations.set(movement.walkId, { seenAt: Date.now(), eventType });
      return [
        this.event<MonopolyMovementData>(
          MonopolyEventType.PlayerMovement,
          message,
          movementData(eventType, movement, snapshot),
          snapshot
        )
      ];
    }
    return [];
  }

  private readStaleAnimationEvent(snapshot?: GameSnapshot): GameEvent<MonopolyAnimationData> | undefined {
    const now = Date.now();
    const staleAnimationMs = this.options.staleAnimationMs ?? 8000;
    for (const [walkId, pending] of this.pendingAnimations) {
      if (now - pending.seenAt < staleAnimationMs) continue;
      this.pendingAnimations.delete(walkId);
      this.recordedAnimationAcks.add(walkId);
      return {
        type: MonopolyEventType.AnimationStale,
        source: this.id,
        at: now,
        data: { walkId, source: "automation-fallback", eventType: pending.eventType },
        snapshot
      };
    }
    return undefined;
  }

  private readSyntheticPromptEvents(snapshot?: GameSnapshot): GameEvent[] {
    const raw = snapshot?.raw as AutomationBridgeSnapshot | undefined;
    if (!raw || raw.isGameOver || raw.currentPlayerIdInRound !== raw.userId) return [];
    if (!raw.canRoll && !raw.canUseCard) return [];

    const message: AutomationBridgeMessage = {
      index: this.cursor,
      at: Date.now(),
      direction: "in",
      type: SocketMsgType.RoundTurn,
      typeName: "SyntheticRoundTurn",
      source: "automation-snapshot",
      roomId: raw.roomId
    };
    return this.roundTurnToEvents(message, snapshot);
  }

  private createChanceCardPromptEvent(
    message: AutomationBridgeMessage,
    snapshot?: GameSnapshot
  ): GameEvent<MonopolyChanceCardPromptData> | undefined {
    const raw = snapshot?.raw as AutomationBridgeSnapshot | undefined;
    const chanceCards = raw?.chanceCards ?? [];
    if (!raw?.canUseCard || chanceCards.length === 0) return undefined;
    return this.event<MonopolyChanceCardPromptData>(
      MonopolyEventType.ChanceCardPrompt,
      message,
      {
        chanceCards,
        selfPlayer: raw.selfPlayer,
        players: raw.players ?? [],
        properties: raw.properties ?? [],
        mapItems: raw.mapItems ?? [],
        canUseCard: Boolean(raw.canUseCard),
        canRoll: Boolean(raw.canRoll)
      },
      snapshot
    );
  }

  private event<TData>(
    type: string,
    message: AutomationBridgeMessage,
    data?: TData,
    snapshot?: GameSnapshot
  ): GameEvent<TData> {
    return {
      id: `${message.index}`,
      type,
      source: this.id,
      roomId: message.roomId,
      at: message.at,
      data,
      snapshot,
      raw: message
    };
  }
}

function propertyPromptActions(data?: MonopolyPropertyPromptData): GameAction[] {
  const type = data?.eventType === "BuildHouse" ? MonopolyActionType.BuildHouse : MonopolyActionType.BuyProperty;
  return [
    { type, payload: { accept: true } },
    { type, payload: { accept: false } }
  ];
}

function chanceCardPromptActions(data?: MonopolyChanceCardPromptData): GameAction[] {
  if (!data?.canUseCard) return [];
  return data.chanceCards.flatMap((card) =>
    chanceCardTargets(card, data).map((targetId) => ({
      type: MonopolyActionType.UseChanceCard,
      payload: { cardId: card.id, targetId }
    }))
  );
}

function toBridgeAction(actionType: string): AutomationBridgeAction | undefined {
  if (actionType === MonopolyActionType.GameInitFinished) return "gameInitFinished";
  if (actionType === MonopolyActionType.RollDice) return "rollDice";
  if (actionType === MonopolyActionType.UseChanceCard) return "useChanceCard";
  if (actionType === MonopolyActionType.BuyProperty) return "buyProperty";
  if (actionType === MonopolyActionType.BuildHouse) return "buildHouse";
  if (actionType === MonopolyActionType.AnimationComplete) return "animationComplete";
  return undefined;
}

function toGameSnapshot(snapshot?: AutomationBridgeSnapshot): GameSnapshot | undefined {
  if (!snapshot) return undefined;
  return {
    gameId: "monopoly",
    roomId: snapshot.roomId,
    currentRound: snapshot.currentRound,
    agentCash: snapshot.cash,
    remainingMs: remainingMs(snapshot),
    isGameOver: snapshot.isGameOver,
    raw: snapshot
  };
}

function chanceCardTargets(card: ChanceCardInfo, data: MonopolyChanceCardPromptData): string[] {
  const selfId = data.selfPlayer?.id;
  switch (card.type) {
    case ChanceCardType.ToSelf:
      return selfId ? [selfId] : [];
    case ChanceCardType.ToPlayer:
      if (looksSelfPositive(cardText(card))) return selfId ? [selfId] : [];
      return data.players.filter((player) => !player.isBankrupted).map((player) => player.id);
    case ChanceCardType.ToOtherPlayer:
      return data.players.filter((player) => !player.isBankrupted && player.id !== selfId).map((player) => player.id);
    case ChanceCardType.ToProperty:
      return chanceCardPropertyTargets(card, data, selfId);
    case ChanceCardType.ToMapItem:
      return data.mapItems.map((mapItem) => mapItem.id);
    default:
      return [];
  }
}

function chanceCardPropertyTargets(card: ChanceCardInfo, data: MonopolyChanceCardPromptData, selfId?: string): string[] {
  const text = cardText(card);
  if (looksPropertyUpgrade(text)) {
    return data.properties.filter((property) => property.owner?.id === selfId && property.buildingLevel < 2).map((property) => property.id);
  }
  if (looksPropertySteal(text)) {
    return data.properties.filter((property) => property.owner && property.owner.id !== selfId).map((property) => property.id);
  }
  if (looksPropertyDemolish(text)) {
    return data.properties
      .filter((property) => property.owner && property.owner.id !== selfId && property.buildingLevel > 0)
      .map((property) => property.id);
  }
  return data.properties.map((property) => property.id);
}

function asPropertyInfo(value: unknown): PropertyInfo | undefined {
  if (!value || typeof value !== "object") return undefined;
  return value as PropertyInfo;
}

function readConfirmDialogPrompt(value: unknown, snapshot?: GameSnapshot): MonopolyPropertyPromptData | undefined {
  if (!value || typeof value !== "object") return undefined;
  const data = value as {
    playerId?: unknown;
    option?: { title?: unknown; content?: unknown };
  };
  const raw = snapshot?.raw as AutomationBridgeSnapshot | undefined;
  if (typeof data.playerId === "string" && raw?.userId && data.playerId !== raw.userId) return undefined;

  const title = typeof data.option?.title === "string" ? data.option.title : "";
  const eventType = /购买/.test(title) ? "BuyProperty" : /升级|升/.test(title) ? "BuildHouse" : undefined;
  if (!eventType) return undefined;

  return {
    eventType,
    property: findPropertyForDialog(title, raw),
  };
}

function findPropertyForDialog(title: string, snapshot?: AutomationBridgeSnapshot): PropertyInfo | undefined {
  const propertyName = title.replace(/^(购买|升级)\s*/, "").trim();
  if (!propertyName) return undefined;
  return snapshot?.properties?.find((property) => property.name === propertyName);
}

function remainingMs(snapshot?: AutomationBridgeSnapshot): number | undefined {
  const remainingTime = snapshot?.waitingFor?.remainingTime;
  return typeof remainingTime === "number" && remainingTime > 0 ? remainingTime * 1000 : undefined;
}

function readMovement(value: unknown):
  | { walkId: string; playerId?: string; step?: number; positionIndex?: number }
  | undefined {
  if (!value || typeof value !== "object") return undefined;
  const data = value as {
    walkId?: unknown;
    playerId?: unknown;
    step?: unknown;
    positionIndex?: unknown;
  };
  if (typeof data.walkId !== "string" || !data.walkId) return undefined;
  return {
    walkId: data.walkId,
    playerId: typeof data.playerId === "string" ? data.playerId : undefined,
    step: typeof data.step === "number" ? data.step : undefined,
    positionIndex: typeof data.positionIndex === "number" ? data.positionIndex : undefined
  };
}

function readAnimationAckId(value: unknown): string | undefined {
  if (typeof value === "string") {
    return value.startsWith(OperateType.Animation) ? value.slice(OperateType.Animation.length) : undefined;
  }
  if (!value || typeof value !== "object") return undefined;
  const operation = value as { operateType?: unknown; data?: unknown };
  if (operation.operateType !== OperateType.Animation || typeof operation.data !== "string") return undefined;
  return operation.data;
}

function cardText(card: ChanceCardInfo): string {
  return `${card.name} ${card.describe}`.toLowerCase();
}

function looksSelfPositive(text: string): boolean {
  return /中奖|获得|免费|减少|免疫|保护|保佑|金苹果|不死|回溯|优惠|施舍/.test(text);
}

function looksPropertyUpgrade(text: string): boolean {
  return /build up|提升|升级/.test(text);
}

function looksPropertySteal(text: string): boolean {
  return /抢夺|我的地|拥有权/.test(text);
}

function looksPropertyDemolish(text: string): boolean {
  return /拆迁|降低|降级/.test(text);
}

function movementData(
  eventType: "PlayerWalk" | "PlayerTp",
  movement: { walkId: string; playerId?: string; step?: number; positionIndex?: number },
  snapshot?: GameSnapshot
): MonopolyMovementData {
  const raw = snapshot?.raw as AutomationBridgeSnapshot | undefined;
  const player = raw?.players?.find((item) => item.id === movement.playerId);
  const positionIndex = movement.positionIndex ?? player?.positionIndex;
  const targetId =
    typeof positionIndex === "number" && positionIndex >= 0
      ? raw?.mapIndexList?.[positionIndex]
      : undefined;
  const targetItem = targetId ? raw?.mapItems?.find((item) => item.id === targetId) : undefined;
  return {
    eventType,
    walkId: movement.walkId,
    playerId: movement.playerId,
    playerName: player?.user.username,
    step: movement.step,
    positionIndex,
    targetId,
    targetName: targetItem?.property?.name ?? targetId
  };
}

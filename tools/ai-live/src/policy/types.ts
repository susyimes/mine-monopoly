import type {
  ChanceCardInfo,
  GameInfo,
  GameInitInfo,
  MapItemInfo,
  PlayerInfo,
  PropertyInfo,
  RemainingTimeData,
  RoomInfo,
  SocketMessage
} from "../protocol/socket-types";

export type DecisionKind = "roll-dice" | "buy-property" | "build-house" | "use-chance-card" | "skip" | "wait";
export type PolicyEventType = "RoundTurn" | "RollDiceStart" | "BuyProperty" | "BuildHouse" | "ChanceCard" | "Timeout" | string;

export interface PolicyContext {
  botId: string;
  personaId: string;
  eventType?: PolicyEventType;
  cash?: number;
  propertyCost?: number;
  buildCost?: number;
  round?: number;
  property?: PropertyInfo;
  chanceCards?: ChanceCardInfo[];
  players?: PlayerInfo[];
  properties?: PropertyInfo[];
  mapItems?: MapItemInfo[];
  remainingMs?: number;
  decisionTimeoutMs?: number;
  now?: number;
  snapshot?: BotSnapshot;
}

export interface PolicyDecision {
  kind: DecisionKind;
  accept?: boolean;
  cardId?: string;
  targetId?: string;
  targetIds?: string[];
  reason: string;
  confidence?: number;
  fallback?: boolean;
}

export interface BotPolicy {
  decide(context: PolicyContext): Promise<PolicyDecision> | PolicyDecision;
}

export type BotDecisionPolicy = BotPolicy;
export type ParticipantController = "bot" | "human";

export interface ParticipantDescriptor {
  userId: string;
  username?: string;
  controller: ParticipantController;
  personaId?: string;
  memoryRef?: string;
  metadata?: Record<string, unknown>;
}

export type BotRuntimeState =
  | "Idle"
  | "Routing"
  | "ConnectingPeer"
  | "JoiningRoom"
  | "Lobby"
  | "Ready"
  | "LoadingGame"
  | "Playing"
  | "MyTurnDeciding"
  | "WaitingDiceResult"
  | "WaitingArriveDecision"
  | "Ended";

export interface BotSnapshot {
  selfUserId: string;
  roomId?: string;
  state: BotRuntimeState;
  roomInfo?: RoomInfo;
  gameInitInfo?: GameInitInfo;
  gameInfo?: GameInfo;
  selfPlayer?: PlayerInfo;
  remainingTime?: RemainingTimeData;
  lastMessage?: SocketMessage;
  lastDecisionAt?: number;
  lastRollRound?: number;
  isGameOver: boolean;
}

export function shouldRunBotDecisionLoop(participant: ParticipantDescriptor): boolean {
  return participant.controller === "bot";
}

export function createTimeoutDecision(context: PolicyContext): PolicyDecision {
  if (context.eventType === "RoundTurn" || context.eventType === "RollDiceStart") {
    return {
      kind: "roll-dice",
      reason: "timeout fallback: roll dice immediately",
      confidence: 1,
      fallback: true
    };
  }

  if (context.eventType === "BuyProperty") {
    return {
      kind: "buy-property",
      accept: false,
      reason: "timeout fallback: decline property purchase",
      confidence: 1,
      fallback: true
    };
  }

  if (context.eventType === "BuildHouse") {
    return {
      kind: "build-house",
      accept: false,
      reason: "timeout fallback: decline house upgrade",
      confidence: 1,
      fallback: true
    };
  }

  if (context.eventType === "ChanceCard") {
    return {
      kind: "skip",
      reason: "timeout fallback: skip chance card",
      confidence: 1,
      fallback: true
    };
  }

  return {
    kind: "wait",
    reason: "timeout fallback: no supported action",
    confidence: 1,
    fallback: true
  };
}

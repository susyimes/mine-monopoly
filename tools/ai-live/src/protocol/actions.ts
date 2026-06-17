import { OperateType, SocketMsgType, type SocketMessage } from "./socket-types";

export type BotActionName =
  | "heart"
  | "ready-toggle"
  | "game-init-finished"
  | "roll-dice"
  | "use-chance-card"
  | "animation-complete"
  | "buy-property"
  | "build-house";

export interface ActionContext {
  userId: string;
  roomId?: string;
  now?: () => number;
}

export interface BotAction<TData = unknown, TExtra = unknown> {
  name: BotActionName;
  message: SocketMessage<TData, TExtra>;
  reason: string;
  createdAt: number;
}

export type BridgeMessageHandler = (message: SocketMessage | string) => void | Promise<void>;
export type BridgeUnsubscribe = () => void | Promise<void>;

export interface BotSocketBridge {
  send(message: SocketMessage | string): void | Promise<void>;
  onMessage?(handler: BridgeMessageHandler): BridgeUnsubscribe | Promise<BridgeUnsubscribe>;
  close?(): void | Promise<void>;
}

export function createSocketMessage<TData = unknown, TExtra = unknown>(
  type: SocketMsgType,
  data: TData,
  context: ActionContext,
  extra?: TExtra
): SocketMessage<TData, TExtra> {
  return {
    type,
    source: context.userId,
    roomId: context.roomId,
    data,
    extra
  };
}

export function createBotAction<TData = unknown, TExtra = unknown>(
  name: BotActionName,
  type: SocketMsgType,
  data: TData,
  context: ActionContext,
  reason: string,
  extra?: TExtra
): BotAction<TData, TExtra> {
  return {
    name,
    message: createSocketMessage(type, data, context, extra),
    reason,
    createdAt: context.now?.() ?? Date.now()
  };
}

export function heartAction(context: ActionContext): BotAction<string> {
  return createBotAction("heart", SocketMsgType.Heart, "", context, "keep peer connection alive");
}

export function readyToggleAction(context: ActionContext): BotAction<string> {
  return createBotAction("ready-toggle", SocketMsgType.ReadyToggle, "", context, "ready in lobby");
}

export function gameInitFinishedAction(context: ActionContext): BotAction<string> {
  return createBotAction("game-init-finished", SocketMsgType.GameInitFinished, "", context, "client scene loaded");
}

export function rollDiceAction(context: ActionContext, reason = "current bot turn"): BotAction<OperateType> {
  return createBotAction("roll-dice", SocketMsgType.RollDiceResult, OperateType.RollDice, context, reason);
}

export function useChanceCardAction(
  context: ActionContext,
  cardId: string,
  target?: string | string[],
  reason = "policy used chance card"
): BotAction<string, string | string[] | undefined> {
  return createBotAction("use-chance-card", SocketMsgType.UseChanceCard, cardId, context, reason, target);
}

export function animationCompleteAction(
  context: ActionContext,
  walkId: string | undefined,
  reason = "player movement animation acknowledged"
): BotAction<string> {
  return createBotAction(
    "animation-complete",
    SocketMsgType.Animation,
    `${OperateType.Animation}${walkId ?? ""}`,
    context,
    reason
  );
}

export function buyPropertyAction(
  context: ActionContext,
  accept: boolean,
  reason = accept ? "policy accepted property purchase" : "policy declined property purchase"
): BotAction<OperateType, boolean> {
  return createBotAction("buy-property", SocketMsgType.BuyProperty, OperateType.BuyProperty, context, reason, accept);
}

export function buildHouseAction(
  context: ActionContext,
  accept: boolean,
  reason = accept ? "policy accepted house upgrade" : "policy declined house upgrade"
): BotAction<OperateType, boolean> {
  return createBotAction("build-house", SocketMsgType.BuildHouse, OperateType.BuildHouse, context, reason, accept);
}

export async function dispatchAction(bridge: BotSocketBridge, action: BotAction): Promise<void> {
  await bridge.send(action.message);
}

export function readyToggle(source: string, roomId: string): SocketMessage {
  return readyToggleAction({ userId: source, roomId }).message;
}

export function gameInitFinished(source: string, roomId: string): SocketMessage {
  return gameInitFinishedAction({ userId: source, roomId }).message;
}

export function rollDice(source: string, roomId: string): SocketMessage {
  return rollDiceAction({ userId: source, roomId }).message;
}

export function useChanceCard(source: string, roomId: string, cardId: string, target?: string | string[]): SocketMessage {
  return useChanceCardAction({ userId: source, roomId }, cardId, target).message;
}

export function animationComplete(source: string, roomId: string, walkId = ""): SocketMessage {
  return animationCompleteAction({ userId: source, roomId }, walkId).message;
}

export function buyProperty(source: string, roomId: string, shouldBuy: boolean): SocketMessage {
  return buyPropertyAction({ userId: source, roomId }, shouldBuy).message;
}

export function buildHouse(source: string, roomId: string, shouldBuild: boolean): SocketMessage {
  return buildHouseAction({ userId: source, roomId }, shouldBuild).message;
}

import { existsSync, readFileSync } from "node:fs";
import { ChanceCardType, type ChanceCardInfo, type MapItemInfo, type PlayerInfo, type PropertyInfo } from "../protocol/socket-types";
import type { BotPersonality } from "../bot/personalities";
import type { BotPolicy, PolicyContext, PolicyDecision } from "./types";
import { createTimeoutDecision } from "./types";

export interface MimoPolicyOptions {
  configPath: string;
  model: string;
  timeoutMs: number;
  fallback: BotPolicy;
}

interface MimoProviderConfig {
  api_key: string;
  base_url: string;
  model?: string;
}

interface ChanceCardTarget {
  id: string;
  type: "player" | "property" | "mapItem";
  name?: string;
  money?: number;
  ownerId?: string;
  ownerName?: string;
  buildingLevel?: number;
  isSelf?: boolean;
  isBankrupted?: boolean;
}

type MimoActionJson = {
  action?: "roll-dice" | "buy-property" | "build-house" | "use-chance-card" | "wait";
  accept?: boolean;
  cardId?: string;
  card_id?: string;
  targetId?: string;
  target_id?: string;
  targetIds?: string[];
  target_ids?: string[];
  reason?: string;
  confidence?: number;
};

export class MimoPolicy implements BotPolicy {
  private readonly provider: MimoProviderConfig;

  constructor(private readonly personality: BotPersonality, private readonly options: MimoPolicyOptions) {
    this.provider = readMimoProvider(options.configPath);
  }

  async decide(context: PolicyContext): Promise<PolicyDecision> {
    if (!isMimoDecisionEvent(context.eventType)) {
      return this.options.fallback.decide(context);
    }

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.options.timeoutMs);
    try {
      const action = await this.requestDecision(context, controller.signal);
      const decision = normalizeMimoAction(action, context, this.personality.label);
      if (decision.kind === "skip" && decision.fallback && context.eventType === "ChanceCard") {
        const fallback = await this.options.fallback.decide(context);
        return {
          ...fallback,
          fallback: true,
          reason: `${decision.reason}; fallback to rules: ${fallback.reason}`
        };
      }
      return decision;
    } catch (error) {
      const fallback = await this.options.fallback.decide(context);
      return {
        ...fallback,
        fallback: true,
        reason: `mimo fallback: ${error instanceof Error ? error.message : String(error)}; ${fallback.reason}`
      };
    } finally {
      clearTimeout(timer);
    }
  }

  private async requestDecision(context: PolicyContext, signal: AbortSignal): Promise<MimoActionJson> {
    const response = await fetch(`${this.provider.base_url.replace(/\/$/, "")}/chat/completions`, {
      method: "POST",
      signal,
      headers: {
        "Content-Type": "application/json",
        "api-key": this.provider.api_key
      },
      body: JSON.stringify({
        model: this.options.model || this.provider.model || "mimo-v2.5-pro",
        temperature: 0.2,
        max_tokens: 220,
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content:
              "You are a Monopoly-like game bot. Return strict JSON only: " +
              "{\"action\":\"roll-dice|buy-property|build-house|use-chance-card|wait\",\"accept\":true|false,\"cardId\":\"id\",\"targetId\":\"id\",\"reason\":\"short Chinese reason\",\"confidence\":0..1}. " +
              "Never invent unsupported actions, card ids, or target ids. For chance cards, choose cardId from chanceCards[].id and targetId from that card's legalTargets[].id. " +
              "Follow cardGuidance exactly; if no safe legal target exists, return wait."
          },
          {
            role: "user",
            content: JSON.stringify(buildDecisionPayload(context, this.personality), null, 2)
          }
        ]
      })
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`mimo ${response.status}: ${text.slice(0, 160)}`);
    }

    const decoded = (await response.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const content = decoded.choices?.[0]?.message?.content;
    if (!content) throw new Error("mimo returned empty content");

    try {
      return JSON.parse(content) as MimoActionJson;
    } catch (error) {
      throw new Error(`mimo returned non-json decision: ${content.slice(0, 160)}`);
    }
  }
}

function readMimoProvider(configPath: string): MimoProviderConfig {
  if (!existsSync(configPath)) {
    throw new Error(`mimo config not found: ${configPath}`);
  }
  const decoded = JSON.parse(readFileSync(configPath, "utf8")) as {
    providers?: Record<string, Partial<MimoProviderConfig>>;
  };
  const provider = decoded.providers?.mimo;
  if (!provider?.api_key || !provider.base_url) {
    throw new Error(`mimo config missing api_key/base_url: ${configPath}`);
  }
  return {
    api_key: provider.api_key,
    base_url: provider.base_url,
    model: provider.model
  };
}

function buildDecisionPayload(context: PolicyContext, personality: BotPersonality) {
  const chanceCards = context.chanceCards ?? context.snapshot?.selfPlayer?.chanceCards ?? [];
  const players = context.players ?? context.snapshot?.gameInfo?.playerList ?? [];
  const self = context.snapshot?.selfPlayer ?? players.find((player) => player.id === context.botId);
  const properties = context.properties ?? context.snapshot?.gameInfo?.properties ?? [];
  const mapItems = context.mapItems ?? [];

  return {
    eventType: context.eventType,
    botId: context.botId,
    persona: {
      id: personality.id,
      label: personality.label,
      cashReserve: personality.cashReserve,
      buyBias: personality.buyBias,
      buildBias: personality.buildBias,
      riskTolerance: personality.riskTolerance
    },
    cash: context.cash ?? context.snapshot?.selfPlayer?.money,
    round: context.round ?? context.snapshot?.gameInfo?.currentRound,
    remainingMs: context.remainingMs,
    chanceCardRules:
      "For Build Up/upgrades target only self-owned properties below max level. For property stealing target opponent-owned properties. For demolition/downgrade target opponent-owned built properties. Positive player cards should target self unless the card text says otherwise.",
    property: context.property
      ? {
          id: context.property.id,
          name: context.property.name,
          sellCost: context.property.sellCost,
          buildCost: context.property.buildCost,
          buildingLevel: context.property.buildingLevel,
          ownerId: context.property.owner?.id,
          ownerName: context.property.owner?.name,
          isOwnedBySelf: context.property.owner?.id === context.botId
        }
      : undefined,
    chanceCards: chanceCards.map((card) => ({
      id: card.id,
      sourceId: card.sourceId,
      name: card.name,
      describe: card.describe,
      type: card.type,
      cardGuidance: chanceCardGuidance(card, context),
      legalTargets: legalTargetsForChanceCard(card, context)
    })),
    players: players.map((player) => ({
      id: player.id,
      name: player.user.username,
      money: player.money,
      isSelf: player.id === self?.id,
      isBankrupted: player.isBankrupted,
      positionIndex: player.positionIndex,
      chanceCardCount: player.chanceCards.length,
      propertyCount: player.properties.length
    })),
    properties: properties.map((property) => ({
      id: property.id,
      name: property.name,
      sellCost: property.sellCost,
      buildCost: property.buildCost,
      buildingLevel: property.buildingLevel,
      ownerId: property.owner?.id,
      ownerName: property.owner?.name,
      isOwnedBySelf: property.owner?.id === context.botId
    })),
    mapItems: mapItems.map((mapItem) => ({
      id: mapItem.id,
      propertyId: mapItem.property?.id,
      propertyName: mapItem.property?.name
    })),
    legalActions: legalActionsForEvent(context.eventType)
  };
}

function normalizeMimoAction(action: MimoActionJson, context: PolicyContext, personaLabel: string): PolicyDecision {
  const confidence = clamp01(Number(action.confidence ?? 0.7));
  const reason = `mimo ${personaLabel}: ${action.reason || "模型给出决策"}`;
  if (context.eventType === "RoundTurn" || context.eventType === "RollDiceStart") {
    return { kind: "roll-dice", reason, confidence, fallback: false };
  }
  if (context.eventType === "BuyProperty") {
    return { kind: "buy-property", accept: Boolean(action.accept), reason, confidence, fallback: false };
  }
  if (context.eventType === "BuildHouse") {
    return { kind: "build-house", accept: Boolean(action.accept), reason, confidence, fallback: false };
  }
  if (context.eventType === "ChanceCard" && action.action === "use-chance-card") {
    const cardId = action.cardId ?? action.card_id;
    if (!cardId) {
      return { kind: "skip", reason: `${reason}; missing cardId`, confidence, fallback: true };
    }

    const card = availableChanceCards(context).find((item) => item.id === cardId);
    if (!card) {
      return { kind: "skip", reason: `${reason}; unknown cardId ${cardId}`, confidence, fallback: true };
    }

    const legalTargets = legalTargetsForChanceCard(card, context);
    const legalTargetIds = new Set(legalTargets.map((target) => target.id));
    const rawTargetIds = action.targetIds ?? action.target_ids;
    const requestedTargetIds =
      rawTargetIds && rawTargetIds.length > 0
        ? rawTargetIds
        : action.targetId ?? action.target_id
          ? [action.targetId ?? action.target_id ?? ""]
          : legalTargets.length === 1
            ? [legalTargets[0].id]
            : [];

    if (requestedTargetIds.length === 0) {
      return { kind: "skip", reason: `${reason}; missing targetId`, confidence, fallback: true };
    }

    const invalidTargets = requestedTargetIds.filter((targetId) => !legalTargetIds.has(targetId));
    if (invalidTargets.length > 0) {
      return {
        kind: "skip",
        reason: `${reason}; invalid targetId ${invalidTargets.join(",")} for card ${card.name}`,
        confidence,
        fallback: true
      };
    }

    const targetIds = rawTargetIds && rawTargetIds.length > 0 ? requestedTargetIds : undefined;
    return {
      kind: "use-chance-card",
      cardId,
      targetId: requestedTargetIds[0],
      targetIds,
      reason,
      confidence,
      fallback: false
    };
  }
  if (context.eventType === "ChanceCard") {
    return { kind: "skip", reason, confidence, fallback: false };
  }
  return createTimeoutDecision(context);
}

function legalActionsForEvent(eventType?: string) {
  if (eventType === "RoundTurn" || eventType === "RollDiceStart") return ["roll-dice"];
  if (eventType === "BuyProperty") return ["buy-property"];
  if (eventType === "BuildHouse") return ["build-house"];
  if (eventType === "ChanceCard") return ["use-chance-card", "wait"];
  return ["wait"];
}

function availableChanceCards(context: PolicyContext): ChanceCardInfo[] {
  return context.chanceCards ?? context.snapshot?.selfPlayer?.chanceCards ?? [];
}

function legalTargetsForChanceCard(card: ChanceCardInfo, context: PolicyContext): ChanceCardTarget[] {
  const players = context.players ?? context.snapshot?.gameInfo?.playerList ?? [];
  const properties = context.properties ?? context.snapshot?.gameInfo?.properties ?? [];
  const mapItems = context.mapItems ?? [];
  const text = cardText(card);

  if (card.type === ChanceCardType.ToSelf || card.type === "ToSelf") {
    const self = players.find((player) => player.id === context.botId);
    return self ? [playerTarget(self, context.botId)] : [{ id: context.botId, type: "player", isSelf: true }];
  }
  if (card.type === ChanceCardType.ToPlayer || card.type === "ToPlayer") {
    const targetPlayers = looksSelfPositive(text)
      ? players.filter((player) => !player.isBankrupted && player.id === context.botId)
      : players.filter((player) => !player.isBankrupted);
    return targetPlayers.map((player) => playerTarget(player, context.botId));
  }
  if (card.type === ChanceCardType.ToOtherPlayer || card.type === "ToOtherPlayer") {
    return players.filter((player) => !player.isBankrupted && player.id !== context.botId).map((player) => playerTarget(player, context.botId));
  }
  if (card.type === ChanceCardType.ToProperty || card.type === "ToProperty") {
    let targetProperties = properties;
    if (looksPropertyUpgrade(text)) {
      targetProperties = properties.filter((property) => property.owner?.id === context.botId && property.buildingLevel < 2);
    } else if (looksPropertySteal(text)) {
      targetProperties = properties.filter((property) => property.owner && property.owner.id !== context.botId);
    } else if (looksPropertyDemolish(text)) {
      targetProperties = properties.filter((property) => property.owner && property.owner.id !== context.botId && property.buildingLevel > 0);
    }
    return targetProperties.map((property) => propertyTarget(property, context.botId));
  }
  if (card.type === ChanceCardType.ToMapItem || card.type === "ToMapItem") {
    return mapItems.map(mapItemTarget);
  }
  return [];
}

function playerTarget(player: PlayerInfo, selfId: string): ChanceCardTarget {
  return {
    id: player.id,
    type: "player",
    name: player.user.username,
    money: player.money,
    isSelf: player.id === selfId,
    isBankrupted: player.isBankrupted
  };
}

function propertyTarget(property: PropertyInfo, selfId: string): ChanceCardTarget {
  return {
    id: property.id,
    type: "property",
    name: property.name,
    ownerId: property.owner?.id,
    ownerName: property.owner?.name,
    buildingLevel: property.buildingLevel,
    isSelf: property.owner?.id === selfId
  };
}

function mapItemTarget(mapItem: MapItemInfo): ChanceCardTarget {
  return {
    id: mapItem.id,
    type: "mapItem",
    name: mapItem.property?.name ?? mapItem.id,
    ownerId: mapItem.property?.owner?.id,
    ownerName: mapItem.property?.owner?.name,
    buildingLevel: mapItem.property?.buildingLevel
  };
}

function chanceCardGuidance(card: ChanceCardInfo, context: PolicyContext): string {
  const text = cardText(card);
  if (card.type === ChanceCardType.ToProperty || card.type === "ToProperty") {
    if (looksPropertyUpgrade(text)) return "Upgrade only your own property with buildingLevel below 2.";
    if (looksPropertySteal(text)) return "Steal only an opponent-owned property.";
    if (looksPropertyDemolish(text)) return "Downgrade only an opponent-owned property that already has buildings.";
  }
  if ((card.type === ChanceCardType.ToPlayer || card.type === "ToPlayer") && looksSelfPositive(text)) {
    return "Positive player-targeted card: target yourself.";
  }
  if (card.type === ChanceCardType.ToOtherPlayer || card.type === "ToOtherPlayer") {
    return "Opponent-targeted card: prefer the richest non-bankrupt opponent.";
  }
  if (card.type === ChanceCardType.ToSelf || card.type === "ToSelf") return `Target yourself (${context.botId}).`;
  return "Pick one listed legal target only.";
}

function isMimoDecisionEvent(eventType?: string) {
  return (
    eventType === "RoundTurn" ||
    eventType === "RollDiceStart" ||
    eventType === "BuyProperty" ||
    eventType === "BuildHouse" ||
    eventType === "ChanceCard"
  );
}

function clamp01(value: number): number {
  if (!Number.isFinite(value)) return 0.7;
  return Math.max(0, Math.min(1, value));
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

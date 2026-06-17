import { ChanceCardType, type ChanceCardInfo, type PlayerInfo, type PropertyInfo } from "../protocol/socket-types";
import type { BotPersonality } from "../bot/personalities";
import { personalityForIndex } from "../bot/personalities";
import type { BotPolicy, PolicyContext, PolicyDecision } from "./types";
import { createTimeoutDecision } from "./types";

export interface RulesPolicyOptions {
  random?: () => number;
  lowTimeMs?: number;
}

export class RulesPolicy implements BotPolicy {
  private readonly random: () => number;
  private readonly lowTimeMs: number;

  constructor(private readonly personality: BotPersonality = personalityForIndex(0), options: RulesPolicyOptions = {}) {
    this.random = options.random ?? Math.random;
    this.lowTimeMs = options.lowTimeMs ?? 2000;
  }

  async decide(context: PolicyContext): Promise<PolicyDecision> {
    if (this.shouldUseTimeoutFallback(context)) return createTimeoutDecision(context);

    switch (context.eventType) {
      case "RoundTurn":
      case "RollDiceStart":
        return {
          kind: "roll-dice",
          reason: `${this.personality.label}: roll immediately`,
          confidence: 0.95,
          fallback: false
        };
      case "BuyProperty":
        return this.decideMoneyAction("buy-property", context, propertyBuyCost(context), this.personality.buyBias);
      case "BuildHouse":
        return this.decideMoneyAction("build-house", context, propertyBuildCost(context), this.personality.buildBias);
      case "ChanceCard":
        return this.decideChanceCard(context);
      default:
        return {
          kind: "wait",
          reason: `${this.personality.label}: no action for ${context.eventType ?? "unknown"}`,
          confidence: 1,
          fallback: false
        };
    }
  }

  private shouldUseTimeoutFallback(context: PolicyContext) {
    if (typeof context.remainingMs === "number" && context.remainingMs <= this.lowTimeMs) return true;
    if (!context.now || !context.snapshot?.lastDecisionAt || !context.decisionTimeoutMs) return false;
    return context.now - context.snapshot.lastDecisionAt > context.decisionTimeoutMs;
  }

  private decideMoneyAction(
    kind: "buy-property" | "build-house",
    context: PolicyContext,
    cost: number,
    bias: number
  ): PolicyDecision {
    const cash = context.cash ?? context.snapshot?.selfPlayer?.money ?? 0;
    const reserve = kind === "build-house" && this.personality.preferUpgradeOverBuy
      ? this.personality.cashReserve * 0.75
      : this.personality.cashReserve;
    const spare = cash - cost - reserve;
    const pressure = cost > 0 ? spare / cost : 0;
    const score = bias + this.personality.riskTolerance * 0.25 + pressure * 0.3 + this.jitter();
    const maxLevel = kind === "build-house" && typeof context.property?.buildingLevel === "number" && context.property.buildingLevel >= 2;
    const threshold = kind === "build-house" ? 0.58 : 0.62;
    const accept = !maxLevel && cost > 0 && spare >= 0 && score >= threshold;

    return {
      kind,
      accept,
      reason: `${this.personality.label}: ${accept ? "accept" : "decline"} ${kind}, cash=${cash}, cost=${cost}, reserve=${Math.round(reserve)}, score=${score.toFixed(2)}`,
      confidence: clamp01(Math.abs(score - threshold) + 0.55),
      fallback: false
    };
  }

  private jitter() {
    return (this.random() - 0.5) * this.personality.randomness;
  }

  private decideChanceCard(context: PolicyContext): PolicyDecision {
    const cards = context.chanceCards ?? context.snapshot?.selfPlayer?.chanceCards ?? [];
    if (cards.length === 0) {
      return {
        kind: "skip",
        reason: `${this.personality.label}: no chance cards available`,
        confidence: 1,
        fallback: false
      };
    }

    const players = context.players ?? context.snapshot?.gameInfo?.playerList ?? [];
    const self = context.snapshot?.selfPlayer ?? players.find((player) => player.id === context.botId);
    const properties = context.properties ?? context.snapshot?.gameInfo?.properties ?? [];
    const candidates = cards
      .map((card) => this.scoreChanceCard(card, self, players, properties))
      .filter((item): item is { card: ChanceCardInfo; targetId: string; score: number; reason: string } => Boolean(item))
      .sort((a, b) => b.score - a.score);
    const best = candidates[0];

    if (!best || best.score < 0.55) {
      return {
        kind: "skip",
        reason: `${this.personality.label}: no safe chance-card target found`,
        confidence: 0.8,
        fallback: false
      };
    }

    return {
      kind: "use-chance-card",
      cardId: best.card.id,
      targetId: best.targetId,
      reason: `${this.personality.label}: use chance card "${best.card.name}" on ${best.targetId}; ${best.reason}`,
      confidence: clamp01(best.score),
      fallback: false
    };
  }

  private scoreChanceCard(
    card: ChanceCardInfo,
    self: PlayerInfo | undefined,
    players: PlayerInfo[],
    properties: PropertyInfo[]
  ): { card: ChanceCardInfo; targetId: string; score: number; reason: string } | undefined {
    if (!self || self.isBankrupted) return undefined;

    const text = `${card.name} ${card.describe}`.toLowerCase();
    const opponents = players.filter((player) => player.id !== self.id && !player.isBankrupted);
    const richestOpponent = opponents.sort((a, b) => b.money - a.money)[0];
    const ownUpgradeableProperty = properties
      .filter((property) => property.owner?.id === self.id && property.buildingLevel < 2)
      .sort((a, b) => b.sellCost + b.buildCost - (a.sellCost + a.buildCost))[0];
    const opponentProperty = properties
      .filter((property) => property.owner && property.owner.id !== self.id)
      .sort((a, b) => b.sellCost + b.buildCost + b.buildingLevel * 1000 - (a.sellCost + a.buildCost + a.buildingLevel * 1000))[0];
    const opponentBuiltProperty = properties
      .filter((property) => property.owner && property.owner.id !== self.id && property.buildingLevel > 0)
      .sort((a, b) => b.buildingLevel - a.buildingLevel || b.sellCost - a.sellCost)[0];

    if (card.type === ChanceCardType.ToSelf) {
      if (!looksSelfPositive(text)) return undefined;
      return { card, targetId: self.id, score: 0.78 + this.personality.riskTolerance * 0.08, reason: "self-benefit card" };
    }

    if (card.type === ChanceCardType.ToPlayer) {
      if (looksSelfPositive(text)) {
        return { card, targetId: self.id, score: 0.7, reason: "positive player-targeted card" };
      }
      if (richestOpponent && this.personality.disruptiveBias > 0.5 && looksDisruptive(text)) {
        return { card, targetId: richestOpponent.id, score: 0.58 + this.personality.disruptiveBias * 0.12, reason: "disruptive player-targeted card" };
      }
      return undefined;
    }

    if (card.type === ChanceCardType.ToOtherPlayer) {
      if (!richestOpponent) return undefined;
      if (!looksDisruptive(text) && this.personality.disruptiveBias < 0.7) return undefined;
      return { card, targetId: richestOpponent.id, score: 0.62 + this.personality.disruptiveBias * 0.2, reason: "target richest opponent" };
    }

    if (card.type === ChanceCardType.ToProperty) {
      if (looksPropertyUpgrade(text) && ownUpgradeableProperty) {
        return { card, targetId: ownUpgradeableProperty.id, score: 0.8 + this.personality.buildBias * 0.12, reason: "upgrade owned property" };
      }
      if (looksPropertySteal(text) && opponentProperty) {
        return { card, targetId: opponentProperty.id, score: 0.85, reason: "steal opponent property" };
      }
      if (looksPropertyDemolish(text) && opponentBuiltProperty) {
        return { card, targetId: opponentBuiltProperty.id, score: 0.72 + this.personality.disruptiveBias * 0.12, reason: "downgrade opponent property" };
      }
    }

    return undefined;
  }
}

export function propertyBuyCost(context: PolicyContext): number {
  return Number(context.propertyCost ?? context.property?.sellCost ?? 0);
}

export function propertyBuildCost(context: PolicyContext): number {
  return Number(context.buildCost ?? context.property?.buildCost ?? 0);
}

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value));
}

function looksSelfPositive(text: string): boolean {
  return /中奖|获得|免费|减少|免疫|保护|保佑|金苹果|不死|回溯|优惠/.test(text);
}

function looksDisruptive(text: string): boolean {
  return /pua|跳过|倒霉|抢夺|拆迁|降低|给你|收入|复制|传送|交换|触发/.test(text);
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

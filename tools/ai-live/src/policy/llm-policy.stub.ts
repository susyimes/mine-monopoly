import { personalityForIndex } from "../bot/personalities";
import { RulesPolicy } from "./rules-policy";
import type { BotPolicy, PolicyContext, PolicyDecision } from "./types";

export class LlmPolicyStub implements BotPolicy {
  constructor(private readonly fallback: BotPolicy = new RulesPolicy(personalityForIndex(0))) {}

  async decide(context: PolicyContext): Promise<PolicyDecision> {
    const decision = await this.fallback.decide(context);
    return {
      ...decision,
      fallback: true,
      reason: `llm policy stub delegated to fallback: ${decision.reason}`
    };
  }
}


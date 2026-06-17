import type { AiLiveConfig } from "../config";
import type { BotPersonality } from "../bot/personalities";
import type { BotPolicy } from "./types";
import { LlmPolicyStub } from "./llm-policy.stub";
import { MimoPolicy } from "./mimo-policy";
import { RulesPolicy } from "./rules-policy";

export function createBotPolicy(config: AiLiveConfig, personality: BotPersonality): BotPolicy {
  const rules = new RulesPolicy(personality);
  if (config.policy === "mimo") {
    return new MimoPolicy(personality, {
      configPath: config.mimoConfigPath,
      model: config.mimoModel,
      timeoutMs: config.mimoDecisionTimeoutMs,
      fallback: rules
    });
  }
  if (config.policy === "llm-stub") {
    return new LlmPolicyStub(rules);
  }
  return rules;
}


import { writeFileSync } from "node:fs";
import { test, expect } from "@playwright/test";
import { personalityForIndex } from "../src/bot/personalities";
import { MimoPolicy } from "../src/policy/mimo-policy";
import type { BotPolicy } from "../src/policy/types";
import { ChanceCardType, type ChanceCardInfo, type PlayerInfo, type PropertyInfo } from "../src/protocol/socket-types";

test("mimo chance-card decisions fall back when the target violates card guidance", async ({}, testInfo) => {
  const configPath = testInfo.outputPath("mimo-provider.json");
  writeFileSync(
    configPath,
    JSON.stringify({
      providers: {
        mimo: {
          api_key: "test-key",
          base_url: "https://mimo.test",
          model: "mimo-test"
        }
      }
    }),
    "utf8"
  );

  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () =>
    new Response(
      JSON.stringify({
        choices: [
          {
            message: {
              content: JSON.stringify({
                action: "use-chance-card",
                cardId: "card-build-up",
                targetId: "opponent-property",
                reason: "想升级高价值地块",
                confidence: 0.9
              })
            }
          }
        ]
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );

  try {
    const chanceCard: ChanceCardInfo = {
      id: "card-build-up",
      sourceId: "source-build-up",
      name: "Build Up!",
      describe: "提升一块自己的地皮等级",
      color: "#facc15",
      type: ChanceCardType.ToProperty,
      icon: ""
    };
    const self = createPlayer("bot-1", "Bot1", [chanceCard]);
    const opponent = createPlayer("bot-2", "Bot2");
    const ownProperty = createProperty("own-property", "自家地块", self.id, self.user.username, 0);
    const opponentProperty = createProperty("opponent-property", "别人地块", opponent.id, opponent.user.username, 1);

    const fallback: BotPolicy = {
      decide() {
        return {
          kind: "use-chance-card",
          cardId: chanceCard.id,
          targetId: ownProperty.id,
          reason: "rules fallback picks own upgradeable property"
        };
      }
    };

    const policy = new MimoPolicy(personalityForIndex(0), {
      configPath,
      model: "mimo-test",
      timeoutMs: 1000,
      fallback
    });

    const decision = await policy.decide({
      botId: self.id,
      personaId: "aggressive",
      eventType: "ChanceCard",
      chanceCards: [chanceCard],
      players: [self, opponent],
      properties: [ownProperty, opponentProperty]
    });

    expect(decision.kind).toBe("use-chance-card");
    expect(decision.cardId).toBe(chanceCard.id);
    expect(decision.targetId).toBe(ownProperty.id);
    expect(decision.fallback).toBe(true);
    expect(decision.reason).toContain("invalid targetId opponent-property");
  } finally {
    globalThis.fetch = originalFetch;
  }
});

function createPlayer(id: string, username: string, chanceCards: ChanceCardInfo[] = []): PlayerInfo {
  return {
    id,
    user: {
      userId: id,
      useraccount: "",
      username,
      avatar: "",
      color: "#22c55e",
      isReady: true
    },
    money: 12000,
    properties: [],
    chanceCards,
    buff: [],
    positionIndex: 0,
    stop: 0,
    isBankrupted: false,
    isOffline: false
  };
}

function createProperty(id: string, name: string, ownerId: string, ownerName: string, buildingLevel: number): PropertyInfo {
  return {
    id,
    name,
    buildingLevel,
    buildCost: 1200,
    sellCost: 1800,
    cost_lv0: 100,
    cost_lv1: 200,
    cost_lv2: 300,
    owner: {
      id: ownerId,
      name: ownerName,
      color: "#22c55e",
      avatar: ""
    }
  };
}

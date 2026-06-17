import { test, expect } from "@playwright/test";
import { BotPlayer } from "../src/bot/bot-player";
import { ChanceCardType, SocketMsgType, type ChanceCardInfo, type PlayerInfo, type PropertyInfo } from "../src/protocol/socket-types";
import type { BotPolicy } from "../src/policy/types";

const browserChannel = process.env.AI_LIVE_BROWSER_CHANNEL ?? "chrome";

if (browserChannel !== "bundled") {
  test.use({ channel: browserChannel as "chrome" });
}

test("agent colony dispatches monopoly BuildHouse prompts through the automation bridge", async ({ page }) => {
  const property: PropertyInfo = {
    id: "property-build-target",
    name: "定向升级地块",
    buildingLevel: 1,
    buildCost: 1200,
    sellCost: 1800,
    cost_lv0: 100,
    cost_lv1: 200,
    cost_lv2: 300
  };

  await page.goto("about:blank");
  await page.evaluate(
    ({ buildHouseType, property }) => {
      const calls: Array<{ action: string; accept?: boolean }> = [];
      const messages = [
        {
          index: 0,
          at: Date.now(),
          direction: "in",
          type: buildHouseType,
          typeName: "BuildHouse",
          roomId: "build-house-test",
          source: "host",
          data: property
        }
      ];

      (window as typeof window & {
        __AI_LIVE_CLIENT_BRIDGE__?: Record<string, unknown>;
        __AI_LIVE_BUILD_HOUSE_CALLS__?: Array<{ action: string; accept?: boolean }>;
      }).__AI_LIVE_BUILD_HOUSE_CALLS__ = calls;

      (window as typeof window & {
        __AI_LIVE_CLIENT_BRIDGE__?: Record<string, unknown>;
      }).__AI_LIVE_CLIENT_BRIDGE__ = {
        getMessages: (cursor = 0) => ({
          cursor: messages.length,
          messages: messages.slice(cursor)
        }),
        getSnapshot: () => ({
          roomId: "build-house-test",
          currentRound: 3,
          cash: 20000,
          waitingFor: { eventMsg: "BuildHouse", remainingTime: 8 }
        }),
        buildHouse: (accept: boolean) => {
          calls.push({ action: "buildHouse", accept });
        }
      };
    },
    { buildHouseType: SocketMsgType.BuildHouse, property }
  );

  const policy: BotPolicy = {
    decide(context) {
      expect(context.eventType).toBe("BuildHouse");
      expect(context.property?.id).toBe(property.id);
      return {
        kind: "build-house",
        accept: true,
        reason: "directed test accepts upgrade"
      };
    }
  };

  const bot = new BotPlayer({
    participant: { userId: "bot-build", controller: "bot", personaId: "upgrader" },
    page,
    policy
  });

  await expect(bot.tick()).resolves.toBeUndefined();
  const calls = await page.evaluate(
    () =>
      (window as typeof window & {
        __AI_LIVE_BUILD_HOUSE_CALLS__?: Array<{ action: string; accept?: boolean }>;
      }).__AI_LIVE_BUILD_HOUSE_CALLS__ ?? []
  );
  expect(calls).toEqual([{ action: "buildHouse", accept: true }]);
});

test("agent colony dispatches chance-card use through the automation bridge", async ({ page }) => {
  const chanceCard: ChanceCardInfo = {
    id: "card-instance-self",
    sourceId: "card-source-self",
    name: "中奖啦!!!",
    describe: "从管理员的钱包里拿到了钱",
    color: "rgb(231, 195, 57)",
    type: ChanceCardType.ToSelf,
    icon: ""
  };
  const player: PlayerInfo = {
    id: "bot-card",
    user: {
      userId: "bot-card",
      useraccount: "",
      username: "Bot Card",
      avatar: "",
      color: "#22c55e",
      isReady: true
    },
    money: 12000,
    properties: [],
    chanceCards: [chanceCard],
    buff: [],
    positionIndex: 0,
    stop: 0,
    isBankrupted: false,
    isOffline: false
  };

  await page.goto("about:blank");
  await page.evaluate(
    ({ roundTurnType, chanceCard, player }) => {
      const calls: Array<{ action: string; cardId?: string; target?: string | string[] }> = [];
      const messages = [
        {
          index: 0,
          at: Date.now(),
          direction: "in",
          type: roundTurnType,
          typeName: "RoundTurn",
          roomId: "chance-card-test",
          source: "host",
          data: ""
        }
      ];

      (window as typeof window & {
        __AI_LIVE_CHANCE_CARD_CALLS__?: Array<{ action: string; cardId?: string; target?: string | string[] }>;
        __AI_LIVE_CLIENT_BRIDGE__?: Record<string, unknown>;
      }).__AI_LIVE_CHANCE_CARD_CALLS__ = calls;

      (window as typeof window & {
        __AI_LIVE_CLIENT_BRIDGE__?: Record<string, unknown>;
      }).__AI_LIVE_CLIENT_BRIDGE__ = {
        getMessages: (cursor = 0) => ({
          cursor: messages.length,
          messages: messages.slice(cursor)
        }),
        getSnapshot: () => ({
          userId: "bot-card",
          roomId: "chance-card-test",
          currentPlayerIdInRound: "bot-card",
          currentRound: 1,
          cash: 12000,
          canUseCard: true,
          canRoll: true,
          chanceCards: [chanceCard],
          selfPlayer: player,
          players: [player],
          properties: [],
          mapItems: [],
          waitingFor: { eventMsg: "RoundTurn", remainingTime: 8 }
        }),
        useChanceCard: (cardId: string, target?: string | string[]) => {
          calls.push({ action: "useChanceCard", cardId, target });
        }
      };
    },
    { roundTurnType: SocketMsgType.RoundTurn, chanceCard, player }
  );

  const policy: BotPolicy = {
    decide(context) {
      expect(context.eventType).toBe("ChanceCard");
      expect(context.chanceCards?.[0]?.id).toBe(chanceCard.id);
      return {
        kind: "use-chance-card",
        cardId: chanceCard.id,
        targetId: player.id,
        reason: "directed test uses self card"
      };
    }
  };

  const bot = new BotPlayer({
    participant: { userId: "bot-card", controller: "bot", personaId: "aggressive" },
    page,
    policy
  });

  await expect(bot.tick()).resolves.toBeUndefined();
  const calls = await page.evaluate(
    () =>
      (window as typeof window & {
        __AI_LIVE_CHANCE_CARD_CALLS__?: Array<{ action: string; cardId?: string; target?: string | string[] }>;
      }).__AI_LIVE_CHANCE_CARD_CALLS__ ?? []
  );
  expect(calls).toEqual([{ action: "useChanceCard", cardId: chanceCard.id, target: player.id }]);
});

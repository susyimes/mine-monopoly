export interface BotPersonality {
  id: string;
  label: string;
  description: string;
  buyBias: number;
  buildBias: number;
  cashReserve: number;
  riskTolerance: number;
  randomness: number;
  preferUpgradeOverBuy: boolean;
  disruptiveBias: number;
}

export const personalities: BotPersonality[] = [
  {
    id: "aggressive",
    label: "Aggressive buyer",
    description: "Buys early, keeps a small reserve, and upgrades when affordable.",
    buyBias: 0.95,
    buildBias: 0.7,
    cashReserve: 600,
    riskTolerance: 0.85,
    randomness: 0.08,
    preferUpgradeOverBuy: false,
    disruptiveBias: 0.2
  },
  {
    id: "conservative",
    label: "Cash conservative",
    description: "Keeps a larger reserve and only buys or upgrades with comfortable cash.",
    buyBias: 0.35,
    buildBias: 0.45,
    cashReserve: 3200,
    riskTolerance: 0.2,
    randomness: 0.03,
    preferUpgradeOverBuy: false,
    disruptiveBias: 0.05
  },
  {
    id: "upgrader",
    label: "Upgrade first",
    description: "Prefers strengthening owned property over buying every empty plot.",
    buyBias: 0.55,
    buildBias: 0.95,
    cashReserve: 1600,
    riskTolerance: 0.55,
    randomness: 0.05,
    preferUpgradeOverBuy: true,
    disruptiveBias: 0.1
  },
  {
    id: "disruptor",
    label: "Disruptive tempo",
    description: "Uses more jitter to avoid identical choices and is the future chance-card test persona.",
    buyBias: 0.65,
    buildBias: 0.35,
    cashReserve: 1800,
    riskTolerance: 0.65,
    randomness: 0.28,
    preferUpgradeOverBuy: false,
    disruptiveBias: 0.9
  }
];

export function personalityForIndex(index: number): BotPersonality {
  const fallback = personalities[0];
  if (!fallback) throw new Error("No bot personalities configured.");
  const normalized = ((index % personalities.length) + personalities.length) % personalities.length;
  return personalities[normalized] ?? fallback;
}

export function personalityById(id: string): BotPersonality {
  return personalities.find((personality) => personality.id === id) ?? personalityForIndex(0);
}


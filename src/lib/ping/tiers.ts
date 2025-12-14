import { z } from "zod";

export const PingTierSchema = z.enum(["standard", "priority", "vip"]);
export type PingTier = z.infer<typeof PingTierSchema>;

export type PingTierConfig = {
  tier: PingTier;
  label: string;
  priceUsd: string;
  priceCents: number;
  description: string;
};

export const PING_TIER_CONFIG: Record<PingTier, PingTierConfig> = {
  standard: {
    tier: "standard",
    label: "Standard",
    priceUsd: "$0.01",
    priceCents: 1,
    description: "A normal paid ping.",
  },
  priority: {
    tier: "priority",
    label: "Priority",
    priceUsd: "$0.05",
    priceCents: 5,
    description: "Gets noticed faster.",
  },
  vip: {
    tier: "vip",
    label: "VIP",
    priceUsd: "$0.25",
    priceCents: 25,
    description: "Top-tier attention.",
  },
};

export const PING_TIER_ORDER: PingTier[] = ["standard", "priority", "vip"];

export function getPingTierConfig(tier: PingTier): PingTierConfig {
  return PING_TIER_CONFIG[tier];
}


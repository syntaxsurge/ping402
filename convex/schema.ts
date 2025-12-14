import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

const Tier = v.union(v.literal("standard"), v.literal("priority"), v.literal("vip"));
const MessageStatus = v.union(v.literal("new"), v.literal("replied"), v.literal("archived"));

export default defineSchema({
  profiles: defineTable({
    handle: v.string(),
    displayName: v.string(),
    ownerWallet: v.string(),
    bio: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.optional(v.number()),
  })
    .index("by_handle", ["handle"])
    .index("by_ownerWallet", ["ownerWallet"]),

  messages: defineTable({
    toProfileId: v.id("profiles"),
    tier: Tier,
    body: v.string(),
    senderName: v.optional(v.string()),
    senderContact: v.optional(v.string()),
    payer: v.string(),
    paymentTxSig: v.string(),
    xPaymentB64: v.string(),
    x402Network: v.optional(v.string()),
    x402Scheme: v.optional(v.string()),
    x402Version: v.optional(v.number()),
    priceCents: v.number(),
    status: MessageStatus,
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_profile_createdAt", ["toProfileId", "createdAt"])
    .index("by_profile_status_createdAt", ["toProfileId", "status", "createdAt"])
    .index("by_paymentTxSig", ["paymentTxSig"])
    .index("by_payer_createdAt", ["payer", "createdAt"]),

  inboxStats: defineTable({
    toProfileId: v.id("profiles"),
    totalMessages: v.number(),
    totalRevenueCents: v.number(),
    newCount: v.number(),
    repliedCount: v.number(),
    archivedCount: v.number(),
    updatedAt: v.number(),
  }).index("by_profile", ["toProfileId"]),

  authNonces: defineTable({
    nonce: v.string(),
    createdAt: v.number(),
  }).index("by_nonce", ["nonce"]),
});

import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

const Tier = v.union(v.literal("standard"), v.literal("priority"), v.literal("vip"));
const MessageStatus = v.union(
  v.literal("pending"),
  v.literal("new"),
  v.literal("replied"),
  v.literal("archived"),
);

const SolanaPayIntentStatus = v.union(v.literal("pending"), v.literal("confirmed"), v.literal("consumed"));

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
    paymentSignatureB64: v.string(),
    paymentTxSig: v.optional(v.string()),
    badgeTxSig: v.optional(v.string()),
    x402Network: v.optional(v.string()),
    x402Scheme: v.optional(v.string()),
    x402Version: v.optional(v.number()),
    x402Asset: v.optional(v.string()),
    x402Amount: v.optional(v.string()),
    x402PayTo: v.optional(v.string()),
    priceCents: v.number(),
    status: MessageStatus,
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_profile_createdAt", ["toProfileId", "createdAt"])
    .index("by_profile_status_createdAt", ["toProfileId", "status", "createdAt"])
    .index("by_paymentSignatureB64", ["paymentSignatureB64"])
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

  solanaPayIntents: defineTable({
    toHandle: v.string(),
    tier: Tier,
    body: v.string(),
    senderName: v.optional(v.string()),
    senderContact: v.optional(v.string()),
    reference: v.string(),
    status: SolanaPayIntentStatus,
    payer: v.optional(v.string()),
    paymentTxSig: v.optional(v.string()),
    paymentSignatureB64: v.optional(v.string()),
    assetDecimals: v.number(),
    x402Network: v.string(),
    x402Scheme: v.string(),
    x402Version: v.number(),
    x402Asset: v.string(),
    x402Amount: v.string(),
    x402PayTo: v.string(),
    createdAt: v.number(),
    updatedAt: v.number(),
    consumedMessageId: v.optional(v.id("messages")),
  })
    .index("by_reference", ["reference"])
    .index("by_status_createdAt", ["status", "createdAt"]),
});

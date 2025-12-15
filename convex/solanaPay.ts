import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { ConvexError } from "convex/values";

import { assertValidHandle, normalizeHandle } from "./lib/handles";
import { enforcePingPolicy } from "./lib/messagePolicy";

const Tier = v.union(v.literal("standard"), v.literal("priority"), v.literal("vip"));

function priceCentsForTier(tier: "standard" | "priority" | "vip"): number {
  switch (tier) {
    case "standard":
      return 1;
    case "priority":
      return 5;
    case "vip":
      return 25;
  }
}

export const createPingIntent = mutation({
  args: {
    toHandle: v.string(),
    tier: Tier,
    body: v.string(),
    senderName: v.optional(v.string()),
    senderContact: v.optional(v.string()),
    reference: v.string(),
    assetDecimals: v.number(),
    x402Network: v.string(),
    x402Scheme: v.string(),
    x402Version: v.number(),
    x402Asset: v.string(),
    x402Amount: v.string(),
    x402PayTo: v.string(),
  },
  handler: async (ctx, args) => {
    const toHandle = normalizeHandle(args.toHandle);
    assertValidHandle(toHandle);

    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_handle", (q) => q.eq("handle", toHandle))
      .unique();

    if (!profile) {
      throw new ConvexError("Recipient not found.");
    }

    const existing = await ctx.db
      .query("solanaPayIntents")
      .withIndex("by_reference", (q) => q.eq("reference", args.reference))
      .unique();

    if (existing) {
      return { intentId: existing._id };
    }

    const policy = enforcePingPolicy(args.body);
    if (!policy.ok) {
      throw new ConvexError({ code: policy.code, reason: policy.reason });
    }

    const senderName = args.senderName?.trim() || undefined;
    if (senderName && senderName.length > 80) {
      throw new ConvexError("Sender name too long.");
    }

    const senderContact = args.senderContact?.trim() || undefined;
    if (senderContact && senderContact.length > 120) {
      throw new ConvexError("Sender contact too long.");
    }

    const now = Date.now();
    const intentId = await ctx.db.insert("solanaPayIntents", {
      toHandle,
      tier: args.tier,
      body: policy.normalized,
      senderName,
      senderContact,
      reference: args.reference,
      status: "pending",
      assetDecimals: args.assetDecimals,
      x402Network: args.x402Network,
      x402Scheme: args.x402Scheme,
      x402Version: args.x402Version,
      x402Asset: args.x402Asset,
      x402Amount: args.x402Amount,
      x402PayTo: args.x402PayTo,
      createdAt: now,
      updatedAt: now,
    });

    return { intentId };
  },
});

export const getPingIntent = query({
  args: { intentId: v.id("solanaPayIntents") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.intentId);
  },
});

export const markPingIntentConfirmed = mutation({
  args: {
    intentId: v.id("solanaPayIntents"),
    payer: v.string(),
    paymentTxSig: v.string(),
    paymentSignatureB64: v.string(),
  },
  handler: async (ctx, args) => {
    const intent = await ctx.db.get(args.intentId);
    if (!intent) {
      throw new ConvexError("Payment intent not found.");
    }

    if (intent.status === "consumed") {
      return { updated: false, status: intent.status };
    }

    if (intent.status === "confirmed") {
      return { updated: false, status: intent.status };
    }

    const now = Date.now();
    await ctx.db.patch(intent._id, {
      status: "confirmed",
      payer: args.payer,
      paymentTxSig: args.paymentTxSig,
      paymentSignatureB64: args.paymentSignatureB64,
      updatedAt: now,
    });

    return { updated: true, status: "confirmed" as const };
  },
});

export const consumePingIntent = mutation({
  args: {
    intentId: v.id("solanaPayIntents"),
  },
  handler: async (ctx, args) => {
    const intent = await ctx.db.get(args.intentId);
    if (!intent) {
      throw new ConvexError("Payment intent not found.");
    }

    if (intent.status !== "confirmed") {
      throw new ConvexError("Payment has not been confirmed yet.");
    }

    if (intent.consumedMessageId) {
      return { messageId: intent.consumedMessageId, deduped: true };
    }

    if (!intent.payer || !intent.paymentTxSig || !intent.paymentSignatureB64) {
      throw new ConvexError("Payment intent is missing confirmation fields.");
    }

    const existing = await ctx.db
      .query("messages")
      .withIndex("by_paymentSignatureB64", (q) =>
        q.eq("paymentSignatureB64", intent.paymentSignatureB64!),
      )
      .unique();

    if (existing) {
      await ctx.db.patch(intent._id, {
        status: "consumed",
        consumedMessageId: existing._id,
        updatedAt: Date.now(),
      });
      return { messageId: existing._id, deduped: true };
    }

    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_handle", (q) => q.eq("handle", intent.toHandle))
      .unique();

    if (!profile) {
      throw new ConvexError("Recipient not found.");
    }

    const now = Date.now();
    const priceCents = priceCentsForTier(intent.tier);

    const messageId = await ctx.db.insert("messages", {
      toProfileId: profile._id,
      tier: intent.tier,
      body: intent.body,
      senderName: intent.senderName,
      senderContact: intent.senderContact,
      payer: intent.payer,
      paymentSignatureB64: intent.paymentSignatureB64,
      paymentTxSig: intent.paymentTxSig,
      x402Network: intent.x402Network,
      x402Scheme: intent.x402Scheme,
      x402Version: intent.x402Version,
      x402Asset: intent.x402Asset,
      x402Amount: intent.x402Amount,
      x402PayTo: intent.x402PayTo,
      priceCents,
      status: "new",
      createdAt: now,
      updatedAt: now,
    });

    const stats = await ctx.db
      .query("inboxStats")
      .withIndex("by_profile", (q) => q.eq("toProfileId", profile._id))
      .unique();

    if (!stats) {
      await ctx.db.insert("inboxStats", {
        toProfileId: profile._id,
        totalMessages: 1,
        totalRevenueCents: priceCents,
        newCount: 1,
        repliedCount: 0,
        archivedCount: 0,
        updatedAt: now,
      });
    } else {
      await ctx.db.patch(stats._id, {
        totalMessages: stats.totalMessages + 1,
        totalRevenueCents: stats.totalRevenueCents + priceCents,
        newCount: stats.newCount + 1,
        updatedAt: now,
      });
    }

    await ctx.db.patch(intent._id, {
      status: "consumed",
      consumedMessageId: messageId,
      updatedAt: now,
    });

    return { messageId, deduped: false };
  },
});

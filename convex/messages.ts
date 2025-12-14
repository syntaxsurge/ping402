import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { ConvexError } from "convex/values";
import { assertValidHandle, normalizeHandle } from "./lib/handles";
import { rateLimiter } from "./lib/rateLimiter";
import { enforcePingPolicy } from "./lib/messagePolicy";

const Tier = v.union(v.literal("standard"), v.literal("priority"), v.literal("vip"));
const MessageStatus = v.union(v.literal("new"), v.literal("replied"), v.literal("archived"));

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

export const createPaidForHandle = mutation({
  args: {
    toHandle: v.string(),
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
      .query("messages")
      .withIndex("by_paymentTxSig", (q) => q.eq("paymentTxSig", args.paymentTxSig))
      .unique();

    if (existing) {
      return { messageId: existing._id, deduped: true };
    }

    const payerLimit = await rateLimiter.limit(ctx, "sendPing", { key: args.payer });
    if (!payerLimit.ok) {
      throw new ConvexError({
        code: "RATE_LIMITED",
        scope: "payer",
        retryAfterMs: payerLimit.retryAfter,
      });
    }

    const pairKey = `${args.payer}:${profile.ownerWallet}`;
    const pairLimit = await rateLimiter.limit(ctx, "sendPingToRecipient", { key: pairKey });
    if (!pairLimit.ok) {
      throw new ConvexError({
        code: "RATE_LIMITED",
        scope: "pair",
        retryAfterMs: pairLimit.retryAfter,
      });
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
    const priceCents = priceCentsForTier(args.tier);

    const messageId = await ctx.db.insert("messages", {
      toProfileId: profile._id,
      tier: args.tier,
      body: policy.normalized,
      senderName,
      senderContact,
      payer: args.payer,
      paymentTxSig: args.paymentTxSig,
      xPaymentB64: args.xPaymentB64,
      x402Network: args.x402Network,
      x402Scheme: args.x402Scheme,
      x402Version: args.x402Version,
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

    return { messageId, deduped: false };
  },
});

export const listForHandleByStatus = query({
  args: {
    handle: v.string(),
    status: MessageStatus,
    cursor: v.union(v.null(), v.string()),
    numItems: v.number(),
  },
  handler: async (ctx, args) => {
    const handle = normalizeHandle(args.handle);
    assertValidHandle(handle);

    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_handle", (q) => q.eq("handle", handle))
      .unique();

    if (!profile) {
      return {
        page: [],
        continueCursor: null,
        isDone: true,
      };
    }

    const numItems = Math.max(1, Math.min(args.numItems, 200));
    return await ctx.db
      .query("messages")
      .withIndex("by_profile_status_createdAt", (q) =>
        q.eq("toProfileId", profile._id).eq("status", args.status),
      )
      .order("desc")
      .paginate({ cursor: args.cursor, numItems });
  },
});

export const getForHandleById = query({
  args: { handle: v.string(), messageId: v.id("messages") },
  handler: async (ctx, args) => {
    const handle = normalizeHandle(args.handle);
    assertValidHandle(handle);

    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_handle", (q) => q.eq("handle", handle))
      .unique();

    if (!profile) return null;

    const message = await ctx.db.get(args.messageId);
    if (!message) return null;
    if (message.toProfileId !== profile._id) return null;

    return message;
  },
});

export const getStatsForHandle = query({
  args: { handle: v.string() },
  handler: async (ctx, args) => {
    const handle = normalizeHandle(args.handle);
    assertValidHandle(handle);

    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_handle", (q) => q.eq("handle", handle))
      .unique();

    if (!profile) return null;

    return await ctx.db
      .query("inboxStats")
      .withIndex("by_profile", (q) => q.eq("toProfileId", profile._id))
      .unique();
  },
});

export const setStatusForHandle = mutation({
  args: {
    handle: v.string(),
    messageId: v.id("messages"),
    status: MessageStatus,
  },
  handler: async (ctx, args) => {
    const handle = normalizeHandle(args.handle);
    assertValidHandle(handle);

    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_handle", (q) => q.eq("handle", handle))
      .unique();

    if (!profile) {
      throw new ConvexError("Recipient not found.");
    }

    const message = await ctx.db.get(args.messageId);
    if (!message) {
      throw new ConvexError("Message not found.");
    }

    if (message.toProfileId !== profile._id) {
      throw new ConvexError("Message not found.");
    }

    if (message.status === args.status) return;

    const now = Date.now();
    const prevStatus = message.status;

    await ctx.db.patch(message._id, { status: args.status, updatedAt: now });

    const stats = await ctx.db
      .query("inboxStats")
      .withIndex("by_profile", (q) => q.eq("toProfileId", profile._id))
      .unique();
    if (!stats) return;

    const dec = (n: number) => Math.max(0, n - 1);
    const inc = (n: number) => n + 1;

    const next = {
      newCount: stats.newCount,
      repliedCount: stats.repliedCount,
      archivedCount: stats.archivedCount,
    };

    if (prevStatus === "new") next.newCount = dec(next.newCount);
    if (prevStatus === "replied") next.repliedCount = dec(next.repliedCount);
    if (prevStatus === "archived") next.archivedCount = dec(next.archivedCount);

    if (args.status === "new") next.newCount = inc(next.newCount);
    if (args.status === "replied") next.repliedCount = inc(next.repliedCount);
    if (args.status === "archived") next.archivedCount = inc(next.archivedCount);

    await ctx.db.patch(stats._id, {
      ...next,
      updatedAt: now,
    });
  },
});

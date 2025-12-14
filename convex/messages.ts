import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { ConvexError } from "convex/values";
import { assertValidHandle, normalizeHandle } from "./lib/handles";
import { rateLimiter } from "./lib/rateLimiter";
import { enforcePingPolicy } from "./lib/messagePolicy";

const Tier = v.union(v.literal("standard"), v.literal("priority"), v.literal("vip"));
const InboxStatus = v.union(v.literal("new"), v.literal("replied"), v.literal("archived"));

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
    paymentSignatureB64: v.string(),
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
      .query("messages")
      .withIndex("by_paymentSignatureB64", (q) =>
        q.eq("paymentSignatureB64", args.paymentSignatureB64),
      )
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
      paymentSignatureB64: args.paymentSignatureB64,
      x402Network: args.x402Network,
      x402Scheme: args.x402Scheme,
      x402Version: args.x402Version,
      x402Asset: args.x402Asset,
      x402Amount: args.x402Amount,
      x402PayTo: args.x402PayTo,
      priceCents,
      status: "pending",
      createdAt: now,
      updatedAt: now,
    });

    return { messageId, deduped: false };
  },
});

export const markPaidForHandleSettled = mutation({
  args: {
    handle: v.string(),
    messageId: v.id("messages"),
    paymentTxSig: v.string(),
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

    if (message.paymentTxSig) {
      return { updated: false };
    }

    const now = Date.now();
    const shouldUpdateStats = message.status === "pending";
    const nextStatus = shouldUpdateStats ? "new" : message.status;

    await ctx.db.patch(message._id, {
      paymentTxSig: args.paymentTxSig,
      status: nextStatus,
      updatedAt: now,
    });

    if (!shouldUpdateStats) {
      return { updated: true };
    }

    const stats = await ctx.db
      .query("inboxStats")
      .withIndex("by_profile", (q) => q.eq("toProfileId", profile._id))
      .unique();

    const inc = (n: number) => n + 1;

    if (!stats) {
      await ctx.db.insert("inboxStats", {
        toProfileId: profile._id,
        totalMessages: 1,
        totalRevenueCents: message.priceCents,
        newCount: 1,
        repliedCount: 0,
        archivedCount: 0,
        updatedAt: now,
      });
      return { updated: true };
    }

    await ctx.db.patch(stats._id, {
      totalMessages: stats.totalMessages + 1,
      totalRevenueCents: stats.totalRevenueCents + message.priceCents,
      newCount: inc(stats.newCount),
      updatedAt: now,
    });

    return { updated: true };
  },
});

export const listForHandleByStatus = query({
  args: {
    handle: v.string(),
    status: InboxStatus,
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
    status: InboxStatus,
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

    if (message.status === "pending") {
      throw new ConvexError("Message is awaiting payment settlement.");
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

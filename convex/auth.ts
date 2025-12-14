import { ConvexError, v } from "convex/values";
import { mutation } from "./_generated/server";
import { rateLimiter } from "./lib/rateLimiter";

const NONCE_TTL_MS = 10 * 60 * 1000;

export const storeNonce = mutation({
  args: { nonce: v.string(), createdAt: v.number() },
  handler: async (ctx, args) => {
    const status = await rateLimiter.limit(ctx, "authNonce");
    if (!status.ok) {
      throw new ConvexError({
        code: "RATE_LIMITED",
        retryAfterMs: status.retryAfter,
      });
    }

    await ctx.db.insert("authNonces", { nonce: args.nonce, createdAt: args.createdAt });
  },
});

export const consumeNonce = mutation({
  args: { nonce: v.string() },
  handler: async (ctx, args) => {
    const status = await rateLimiter.limit(ctx, "authVerify");
    if (!status.ok) {
      throw new ConvexError({
        code: "RATE_LIMITED",
        retryAfterMs: status.retryAfter,
      });
    }

    const row = await ctx.db
      .query("authNonces")
      .withIndex("by_nonce", (q) => q.eq("nonce", args.nonce))
      .unique();

    if (!row) {
      throw new ConvexError({ code: "NONCE_NOT_FOUND" });
    }

    const ageMs = Date.now() - row.createdAt;
    if (ageMs > NONCE_TTL_MS) {
      await ctx.db.delete(row._id);
      throw new ConvexError({ code: "NONCE_EXPIRED" });
    }

    await ctx.db.delete(row._id);
  },
});


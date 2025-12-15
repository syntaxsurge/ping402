import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { ConvexError } from "convex/values";
import { assertValidHandle, normalizeHandle } from "./lib/handles";

export const byHandle = query({
  args: { handle: v.string() },
  handler: async (ctx, args) => {
    const handle = normalizeHandle(args.handle);
    assertValidHandle(handle);

    return await ctx.db
      .query("profiles")
      .withIndex("by_handle", (q) => q.eq("handle", handle))
      .unique();
  },
});

export const byOwnerWallet = query({
  args: { ownerWallet: v.string() },
  handler: async (ctx, args) => {
    const ownerWallet = args.ownerWallet.trim();
    if (ownerWallet.length < 20) {
      throw new ConvexError("Invalid owner wallet.");
    }

    return await ctx.db
      .query("profiles")
      .withIndex("by_ownerWallet", (q) => q.eq("ownerWallet", ownerWallet))
      .unique();
  },
});

export const claimHandle = mutation({
  args: {
    handle: v.string(),
    displayName: v.string(),
    ownerWallet: v.string(),
    bio: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const handle = normalizeHandle(args.handle);
    assertValidHandle(handle);

    const displayName = args.displayName.trim();
    if (displayName.length < 2 || displayName.length > 64) {
      throw new ConvexError("Invalid display name.");
    }

    const ownerWallet = args.ownerWallet.trim();
    if (ownerWallet.length < 20) {
      throw new ConvexError("Invalid owner wallet.");
    }

    const bio = args.bio?.trim() || undefined;
    if (bio && bio.length > 280) {
      throw new ConvexError("Bio too long.");
    }

    const existing = await ctx.db
      .query("profiles")
      .withIndex("by_handle", (q) => q.eq("handle", handle))
      .unique();

    if (existing) {
      if (existing.ownerWallet !== ownerWallet) {
        throw new ConvexError({ code: "HANDLE_TAKEN" });
      }

      const now = Date.now();
      await ctx.db.patch(existing._id, {
        displayName,
        bio,
        updatedAt: now,
      });
      return existing._id;
    }

    const now = Date.now();
    return await ctx.db.insert("profiles", {
      handle,
      displayName,
      ownerWallet,
      bio,
      createdAt: now,
      updatedAt: now,
    });
  },
});

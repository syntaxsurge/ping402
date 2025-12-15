import { v } from "convex/values";
import { mutation } from "./_generated/server";

const TABLES = ["profiles", "messages", "inboxStats", "authNonces", "solanaPayIntents"] as const;
type TableName = (typeof TABLES)[number];

export const truncateAll = mutation({
  args: {
    secret: v.string(),
    batchSize: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const expected = process.env.CONVEX_RESET_TOKEN;
    if (!expected) {
      throw new Error("CONVEX_RESET_TOKEN is not configured for this deployment.");
    }

    if (args.secret !== expected) {
      throw new Error("Invalid reset token provided.");
    }

    const batchSize = Math.min(Math.max(args.batchSize ?? 200, 1), 500);
    const summary: Record<string, number> = {};

    for (const table of TABLES) {
      let deleted = 0;
      while (true) {
        const rows = await ctx.db.query(table as TableName).take(batchSize);
        if (!rows.length) break;
        for (const row of rows) {
          await ctx.db.delete(row._id);
        }
        deleted += rows.length;
      }
      summary[table] = deleted;
    }

    return summary;
  },
});

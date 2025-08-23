import { query } from "./_generated/server";
import { v } from "convex/values";

export const get = query({
  args: { id: v.id("vendors") },
  returns: v.union(
    v.object({
      _id: v.id("vendors"),
      _creationTime: v.number(),
      userId: v.id("app_users"),
      name: v.string(),
      contactEmail: v.optional(v.string()),
      contactPhone: v.optional(v.string()),
      doNotCall: v.boolean(),
      preferredChannel: v.union(v.literal("voice"), v.literal("email")),
      vendorMinPctBps: v.optional(v.number()),
      contactWindowStartLocal: v.optional(v.string()),
      contactWindowEndLocal: v.optional(v.string()),
      notes: v.optional(v.string()),
      createdAt: v.number(),
      updatedAt: v.number(),
    }),
    v.null()
  ),
  handler: async (ctx, { id }) => {
    return await ctx.db.get(id);
  },
});

export const getByUser = query({
  args: { userId: v.id("app_users"), limit: v.optional(v.number()) },
  returns: v.array(
    v.object({
      _id: v.id("vendors"),
      _creationTime: v.number(),
      userId: v.id("app_users"),
      name: v.string(),
      contactEmail: v.optional(v.string()),
      contactPhone: v.optional(v.string()),
      doNotCall: v.boolean(),
      preferredChannel: v.union(v.literal("voice"), v.literal("email")),
      vendorMinPctBps: v.optional(v.number()),
      contactWindowStartLocal: v.optional(v.string()),
      contactWindowEndLocal: v.optional(v.string()),
      notes: v.optional(v.string()),
      createdAt: v.number(),
      updatedAt: v.number(),
    })
  ),
  handler: async (ctx, { userId, limit = 50 }) => {
    return await ctx.db
      .query("vendors")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .order("desc")
      .take(limit);
  },
});
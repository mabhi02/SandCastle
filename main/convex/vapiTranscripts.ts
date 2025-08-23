import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const insert = mutation({
  args: {
    callId: v.string(),
    role: v.string(),
    transcriptType: v.string(),
    text: v.string(),
    timestamp: v.number(),
  },
  returns: v.id("vapi_transcripts"),
  handler: async (ctx, args) => {
    return await ctx.db.insert("vapi_transcripts", {
      callId: args.callId,
      role: args.role,
      transcriptType: args.transcriptType,
      text: args.text,
      timestamp: args.timestamp,
      createdAt: Date.now(),
    });
  },
});

export const byCall = query({
  args: { callId: v.string() },
  returns: v.array(
    v.object({
      _id: v.id("vapi_transcripts"),
      _creationTime: v.number(),
      callId: v.string(),
      role: v.string(),
      transcriptType: v.string(),
      text: v.string(),
      timestamp: v.number(),
      createdAt: v.number(),
    })
  ),
  handler: async (ctx, { callId }) => {
    return await ctx.db
      .query("vapi_transcripts")
      .withIndex("by_call", (q) => q.eq("callId", callId))
      .order("asc")
      .collect();
  },
});

export const latestByCall = query({
  args: { callId: v.string(), limit: v.optional(v.number()) },
  returns: v.array(
    v.object({
      _id: v.id("vapi_transcripts"),
      _creationTime: v.number(),
      callId: v.string(),
      role: v.string(),
      transcriptType: v.string(),
      text: v.string(),
      timestamp: v.number(),
      createdAt: v.number(),
    })
  ),
  handler: async (ctx, { callId, limit = 10 }) => {
    return await ctx.db
      .query("vapi_transcripts")
      .withIndex("by_call", (q) => q.eq("callId", callId))
      .order("desc")
      .take(limit);
  },
});
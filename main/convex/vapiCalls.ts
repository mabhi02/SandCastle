import { mutation, query, action } from "./_generated/server";
import { v } from "convex/values";
import { api } from "./_generated/api";

export const create = mutation({
  args: {
    callId: v.string(),
    status: v.string(),
    phoneNumber: v.optional(v.string()),
    assistantId: v.optional(v.string()),
    createdAt: v.number(),
  },
  returns: v.id("vapi_calls"),
  handler: async (ctx, args) => {
    // Check if call already exists
    const existing = await ctx.db
      .query("vapi_calls")
      .withIndex("by_callId", (q) => q.eq("callId", args.callId))
      .unique();

    if (existing) {
      // Update existing record
      await ctx.db.patch(existing._id, {
        status: args.status,
        phoneNumber: args.phoneNumber || existing.phoneNumber,
        assistantId: args.assistantId || existing.assistantId,
        updatedAt: Date.now(),
      });
      return existing._id;
    } else {
      // Create new record
      return await ctx.db.insert("vapi_calls", {
        callId: args.callId,
        status: args.status,
        phoneNumber: args.phoneNumber,
        assistantId: args.assistantId,
        startedAt: args.createdAt,
        createdAt: args.createdAt,
        updatedAt: args.createdAt,
      });
    }
  },
});

export const upsertReport = mutation({
  args: {
    callId: v.string(),
    artifact: v.optional(v.any()),
    endedReason: v.optional(v.string()),
    timestamp: v.number(),
    phoneNumber: v.optional(v.string()),
    assistantId: v.optional(v.string()),
    recordingUrl: v.optional(v.string()),
    stereoRecordingUrl: v.optional(v.string()),
    cost: v.optional(v.number()),
    costBreakdown: v.optional(v.any()),
  },
  returns: v.id("vapi_calls"),
  handler: async (ctx, args) => {
    // Check if call already exists
    const existing = await ctx.db
      .query("vapi_calls")
      .withIndex("by_callId", (q) => q.eq("callId", args.callId))
      .unique();

    if (existing) {
      await ctx.db.patch(existing._id, {
        artifact: args.artifact,
        endedReason: args.endedReason,
        endedAt: args.timestamp,
        phoneNumber: args.phoneNumber ?? existing.phoneNumber,
        assistantId: args.assistantId ?? existing.assistantId,
        recordingUrl: args.recordingUrl,
        stereoRecordingUrl: args.stereoRecordingUrl,
        cost: args.cost,
        costBreakdown: args.costBreakdown,
        updatedAt: Date.now(),
      });
      return existing._id;
    } else {
      return await ctx.db.insert("vapi_calls", {
        callId: args.callId,
        status: "ended",
        artifact: args.artifact,
        endedReason: args.endedReason,
        startedAt: args.timestamp,
        endedAt: args.timestamp,
        phoneNumber: args.phoneNumber,
        assistantId: args.assistantId,
        recordingUrl: args.recordingUrl,
        stereoRecordingUrl: args.stereoRecordingUrl,
        cost: args.cost,
        costBreakdown: args.costBreakdown,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
    }
  },
});

export const updateStatus = mutation({
  args: {
    callId: v.string(),
    status: v.string(),
    timestamp: v.number(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("vapi_calls")
      .withIndex("by_callId", (q) => q.eq("callId", args.callId))
      .unique();

    if (existing) {
      await ctx.db.patch(existing._id, {
        status: args.status,
        updatedAt: Date.now(),
      });
    } else {
      await ctx.db.insert("vapi_calls", {
        callId: args.callId,
        status: args.status,
        startedAt: args.timestamp,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
    }
    return null;
  },
});

export const getCall = query({
  args: { callId: v.string() },
  returns: v.union(
    v.object({
      _id: v.id("vapi_calls"),
      _creationTime: v.number(),
      callId: v.string(),
      status: v.string(),
      artifact: v.optional(v.any()),
      endedReason: v.optional(v.string()),
      startedAt: v.optional(v.number()),
      endedAt: v.optional(v.number()),
      phoneNumber: v.optional(v.string()),
      assistantId: v.optional(v.string()),
      recordingUrl: v.optional(v.string()),
      stereoRecordingUrl: v.optional(v.string()),
      cost: v.optional(v.number()),
      costBreakdown: v.optional(v.any()),
      createdAt: v.number(),
      updatedAt: v.number(),
    }),
    v.null()
  ),
  handler: async (ctx, { callId }) => {
    return await ctx.db
      .query("vapi_calls")
      .withIndex("by_callId", (q) => q.eq("callId", callId))
      .unique();
  },
});

export const listCalls = query({
  args: { 
    limit: v.optional(v.number()),
    phoneNumber: v.optional(v.string()),
  },
  returns: v.array(
    v.object({
      _id: v.id("vapi_calls"),
      _creationTime: v.number(),
      callId: v.string(),
      status: v.string(),
      artifact: v.optional(v.any()),
      endedReason: v.optional(v.string()),
      startedAt: v.optional(v.number()),
      endedAt: v.optional(v.number()),
      phoneNumber: v.optional(v.string()),
      assistantId: v.optional(v.string()),
      recordingUrl: v.optional(v.string()),
      stereoRecordingUrl: v.optional(v.string()),
      cost: v.optional(v.number()),
      costBreakdown: v.optional(v.any()),
      createdAt: v.number(),
      updatedAt: v.number(),
    })
  ),
  handler: async (ctx, { limit = 50, phoneNumber }) => {
    if (phoneNumber) {
      return await ctx.db
        .query("vapi_calls")
        .withIndex("by_phone", (q) => q.eq("phoneNumber", phoneNumber))
        .order("desc")
        .take(limit);
    }
    
    return await ctx.db
      .query("vapi_calls")
      .order("desc")
      .take(limit);
  },
});

// Get the latest call for a specific phone number
export const getLatestCallForPhone = query({
  args: { phoneNumber: v.string() },
  returns: v.union(
    v.object({
      _id: v.id("vapi_calls"),
      callId: v.string(),
      status: v.string(),
      startedAt: v.optional(v.number()),
    }),
    v.null()
  ),
  handler: async (ctx, { phoneNumber }) => {
    const call = await ctx.db
      .query("vapi_calls")
      .withIndex("by_phone", (q) => q.eq("phoneNumber", phoneNumber))
      .order("desc")
      .first();
    
    if (!call) return null;
    
    return {
      _id: call._id,
      callId: call.callId,
      status: call.status,
      startedAt: call.startedAt,
    };
  },
});
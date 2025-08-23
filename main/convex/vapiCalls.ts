import { mutation, query, action } from "./_generated/server";
import { v } from "convex/values";
import { api } from "./_generated/api";

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

// Action to initiate a VAPI call through the Python API server
export const initiateCall = action({
  args: {
    phoneNumber: v.string(),
    vendorId: v.optional(v.id("vendors")),
    invoiceId: v.optional(v.id("invoices")),
    invoiceNo: v.string(),
    invoiceAmountCents: v.number(),
    invoiceDueDate: v.string(),
    vendorName: v.string(),
    vendorEmail: v.string(),
    companyName: v.optional(v.string()),
  },
  returns: v.object({
    success: v.boolean(),
    callId: v.optional(v.string()),
    status: v.optional(v.string()),
    error: v.optional(v.string()),
  }),
  handler: async (ctx, args) => {
    try {
      // Call the Python API server to initiate VAPI call
      const response = await fetch("http://localhost:5001/api/initiate-call", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          phoneNumber: args.phoneNumber,
          vendorId: args.vendorId,
          vendorName: args.vendorName,
          vendorEmail: args.vendorEmail,
          invoiceNo: args.invoiceNo,
          invoiceAmountCents: args.invoiceAmountCents,
          invoiceDueDate: args.invoiceDueDate,
          companyName: args.companyName ?? "TechFlow Solutions",
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`API call failed: ${response.statusText} - ${errorText}`);
      }

      const result = await response.json();

      // Store the call initiation in our database
      if (result.success && result.callId) {
        await ctx.runMutation(api.vapiCalls.updateStatus, {
          callId: result.callId,
          status: result.status ?? "initiated",
          timestamp: Date.now(),
        });

        // Update vendor state if we have a vendor
        if (args.vendorId) {
          await ctx.runMutation(api.vendorState.updateFromCall, {
            vendorId: args.vendorId,
            outcome: "initiated",
            callId: result.callId,
          });
        }
      }

      return {
        success: result.success,
        callId: result.callId,
        status: result.status,
        error: result.error,
      };
    } catch (error) {
      console.error("Error initiating VAPI call:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  },
});
import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const scheduleFollowUp = mutation({
  args: {
    vendorId: v.id("vendors"),
    followUpDate: v.string(),
    reason: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    // Get vendor to find user
    const vendor = await ctx.db.get(args.vendorId);
    if (!vendor) {
      throw new Error("Vendor not found");
    }

    // Parse follow-up date
    const followUpAt = new Date(args.followUpDate).getTime();
    if (isNaN(followUpAt)) {
      throw new Error("Invalid follow-up date");
    }

    // Get or create vendor state
    const vendorState = await ctx.db
      .query("vendor_state")
      .withIndex("by_vendor", (q) => q.eq("vendorId", args.vendorId))
      .unique();

    if (vendorState) {
      await ctx.db.patch(vendorState._id, {
        nextFollowUpAt: followUpAt,
        scheduledBy: "vapi",
        lastOutcome: args.reason,
        updatedAt: Date.now(),
      });
    } else {
      await ctx.db.insert("vendor_state", {
        userId: vendor.userId,
        vendorId: args.vendorId,
        historicalMode: null,
        attemptsThisWeek: 0,
        nextFollowUpAt: followUpAt,
        scheduledBy: "vapi",
        lastOutcome: args.reason,
        totalRecoveredCents: 0,
        totalOutstandingCents: 0,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
    }

    return null;
  },
});

export const updatePaymentReceived = mutation({
  args: {
    vendorId: v.id("vendors"),
    amountCents: v.number(),
    promiseDate: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    // Get vendor to find user
    const vendor = await ctx.db.get(args.vendorId);
    if (!vendor) {
      throw new Error("Vendor not found");
    }

    // Get or create vendor state
    const vendorState = await ctx.db
      .query("vendor_state")
      .withIndex("by_vendor", (q) => q.eq("vendorId", args.vendorId))
      .unique();

    if (vendorState) {
      await ctx.db.patch(vendorState._id, {
        lastPaidAmountCents: args.amountCents,
        lastPromiseDate: args.promiseDate,
        totalRecoveredCents: vendorState.totalRecoveredCents + args.amountCents,
        totalOutstandingCents: Math.max(0, vendorState.totalOutstandingCents - args.amountCents),
        historicalMode: args.amountCents > 0 ? "partial_today" : vendorState.historicalMode,
        updatedAt: Date.now(),
      });
    } else {
      await ctx.db.insert("vendor_state", {
        userId: vendor.userId,
        vendorId: args.vendorId,
        historicalMode: "partial_today",
        attemptsThisWeek: 0,
        lastPaidAmountCents: args.amountCents,
        lastPromiseDate: args.promiseDate,
        totalRecoveredCents: args.amountCents,
        totalOutstandingCents: 0,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
    }

    return null;
  },
});

export const getByVendor = query({
  args: { vendorId: v.id("vendors") },
  returns: v.union(
    v.object({
      _id: v.id("vendor_state"),
      _creationTime: v.number(),
      userId: v.id("app_users"),
      vendorId: v.id("vendors"),
      historicalMode: v.union(
        v.literal("full_today"),
        v.literal("partial_today"),
        v.literal("promise"),
        v.null()
      ),
      attemptsThisWeek: v.number(),
      lastAttemptAt: v.optional(v.number()),
      nextFollowUpAt: v.optional(v.number()),
      scheduledBy: v.optional(v.string()),
      lastOutcome: v.optional(v.string()),
      lastPaidAmountCents: v.optional(v.number()),
      lastPromiseDate: v.optional(v.string()),
      totalRecoveredCents: v.number(),
      totalOutstandingCents: v.number(),
      createdAt: v.number(),
      updatedAt: v.number(),
    }),
    v.null()
  ),
  handler: async (ctx, { vendorId }) => {
    return await ctx.db
      .query("vendor_state")
      .withIndex("by_vendor", (q) => q.eq("vendorId", vendorId))
      .unique();
  },
});

export const updateFromCall = mutation({
  args: {
    vendorId: v.id("vendors"),
    outcome: v.string(),
    callId: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    // Get vendor to find user
    const vendor = await ctx.db.get(args.vendorId);
    if (!vendor) {
      console.error(`Vendor not found: ${args.vendorId}`);
      return null;
    }

    // Get or create vendor state
    const vendorState = await ctx.db
      .query("vendor_state")
      .withIndex("by_vendor", (q) => q.eq("vendorId", args.vendorId))
      .unique();

    if (vendorState) {
      await ctx.db.patch(vendorState._id, {
        lastAttemptAt: Date.now(),
        lastOutcome: args.outcome,
        attemptsThisWeek: vendorState.attemptsThisWeek + 1,
        updatedAt: Date.now(),
      });
    } else {
      await ctx.db.insert("vendor_state", {
        userId: vendor.userId,
        vendorId: args.vendorId,
        historicalMode: null,
        attemptsThisWeek: 1,
        lastAttemptAt: Date.now(),
        lastOutcome: args.outcome,
        totalRecoveredCents: 0,
        totalOutstandingCents: 0,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
    }

    return null;
  },
});

export const resetWeeklyAttempts = mutation({
  args: {},
  returns: v.object({ reset: v.number() }),
  handler: async (ctx, args) => {
    // Reset all vendor states' weekly attempt counts
    const allStates = await ctx.db.query("vendor_state").collect();
    let resetCount = 0;

    for (const state of allStates) {
      if (state.attemptsThisWeek > 0) {
        await ctx.db.patch(state._id, {
          attemptsThisWeek: 0,
          updatedAt: Date.now(),
        });
        resetCount++;
      }
    }

    return { reset: resetCount };
  },
});
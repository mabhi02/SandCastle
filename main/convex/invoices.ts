import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

const invoiceState = v.union(
  v.literal("Overdue"),
  v.literal("InProgress"),
  v.literal("PromiseToPay"),
  v.literal("PartialPaid"),
  v.literal("Paid"),
  v.literal("Dispute"),
  v.literal("Reassign"),
  v.literal("Callback"),
  v.literal("DNC")
);

export const updateState = mutation({
  args: {
    invoiceId: v.id("invoices"),
    state: invoiceState,
    memo: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const invoice = await ctx.db.get(args.invoiceId);
    if (!invoice) {
      throw new Error("Invoice not found");
    }

    await ctx.db.patch(args.invoiceId, {
      state: args.state,
      memo: args.memo ?? invoice.memo,
      lastStateChangeAt: Date.now(),
      updatedAt: Date.now(),
    });

    // If marked as PromiseToPay, update vendor state
    if (args.state === "PromiseToPay") {
      const vendorState = await ctx.db
        .query("vendor_state")
        .withIndex("by_vendor", (q) => q.eq("vendorId", invoice.vendorId))
        .unique();

      if (vendorState) {
        await ctx.db.patch(vendorState._id, {
          historicalMode: "promise",
          updatedAt: Date.now(),
        });
      }
    }

    return null;
  },
});

export const updatePayment = mutation({
  args: {
    invoiceId: v.id("invoices"),
    paidCents: v.number(),
    promiseDateISO: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const invoice = await ctx.db.get(args.invoiceId);
    if (!invoice) {
      throw new Error("Invoice not found");
    }

    const totalPaid = invoice.paidCents + args.paidCents;
    const isFullyPaid = totalPaid >= invoice.amountCents;
    const isPartiallyPaid = totalPaid > 0 && totalPaid < invoice.amountCents;

    const newState = isFullyPaid ? "Paid" : isPartiallyPaid ? "PartialPaid" : invoice.state;

    await ctx.db.patch(args.invoiceId, {
      paidCents: totalPaid,
      state: newState,
      promiseDateISO: args.promiseDateISO ?? invoice.promiseDateISO,
      lastStateChangeAt: Date.now(),
      updatedAt: Date.now(),
    });

    // Update vendor state
    const vendorState = await ctx.db
      .query("vendor_state")
      .withIndex("by_vendor", (q) => q.eq("vendorId", invoice.vendorId))
      .unique();

    if (vendorState) {
      await ctx.db.patch(vendorState._id, {
        lastPaidAmountCents: args.paidCents,
        totalRecoveredCents: vendorState.totalRecoveredCents + args.paidCents,
        totalOutstandingCents: Math.max(0, vendorState.totalOutstandingCents - args.paidCents),
        historicalMode: isFullyPaid ? "full_today" : "partial_today",
        updatedAt: Date.now(),
      });
    }

    return null;
  },
});

export const get = query({
  args: { id: v.id("invoices") },
  returns: v.union(
    v.object({
      _id: v.id("invoices"),
      _creationTime: v.number(),
      userId: v.id("app_users"),
      vendorId: v.id("vendors"),
      invoiceNo: v.string(),
      amountCents: v.number(),
      dueDateISO: v.string(),
      state: invoiceState,
      promiseDateISO: v.optional(v.string()),
      paidCents: v.number(),
      lastStateChangeAt: v.number(),
      memo: v.optional(v.string()),
      createdAt: v.number(),
      updatedAt: v.number(),
    }),
    v.null()
  ),
  handler: async (ctx, { id }) => {
    return await ctx.db.get(id);
  },
});

export const getByVendor = query({
  args: { vendorId: v.id("vendors") },
  returns: v.array(
    v.object({
      _id: v.id("invoices"),
      _creationTime: v.number(),
      userId: v.id("app_users"),
      vendorId: v.id("vendors"),
      invoiceNo: v.string(),
      amountCents: v.number(),
      dueDateISO: v.string(),
      state: invoiceState,
      promiseDateISO: v.optional(v.string()),
      paidCents: v.number(),
      lastStateChangeAt: v.number(),
      memo: v.optional(v.string()),
      createdAt: v.number(),
      updatedAt: v.number(),
    })
  ),
  handler: async (ctx, { vendorId }) => {
    return await ctx.db
      .query("invoices")
      .withIndex("by_vendor", (q) => q.eq("vendorId", vendorId))
      .order("desc")
      .collect();
  },
});

export const getOverdueByUser = query({
  args: { userId: v.id("app_users"), limit: v.optional(v.number()) },
  returns: v.array(
    v.object({
      _id: v.id("invoices"),
      _creationTime: v.number(),
      userId: v.id("app_users"),
      vendorId: v.id("vendors"),
      invoiceNo: v.string(),
      amountCents: v.number(),
      dueDateISO: v.string(),
      state: invoiceState,
      promiseDateISO: v.optional(v.string()),
      paidCents: v.number(),
      lastStateChangeAt: v.number(),
      memo: v.optional(v.string()),
      createdAt: v.number(),
      updatedAt: v.number(),
    })
  ),
  handler: async (ctx, { userId, limit = 50 }) => {
    return await ctx.db
      .query("invoices")
      .withIndex("by_user_state", (q) => 
        q.eq("userId", userId).eq("state", "Overdue")
      )
      .order("desc")
      .take(limit);
  },
});
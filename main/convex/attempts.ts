import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const create = mutation({
  args: {
    vendorId: v.id("vendors"),
    invoiceId: v.id("invoices"),
    channel: v.union(v.literal("voice"), v.literal("email")),
    callId: v.optional(v.string()),
  },
  returns: v.id("attempts"),
  handler: async (ctx, args) => {
    // Get vendor to find user
    const vendor = await ctx.db.get(args.vendorId);
    if (!vendor) {
      throw new Error("Vendor not found");
    }
    
    const attemptId = await ctx.db.insert("attempts", {
      userId: vendor.userId,
      vendorId: args.vendorId,
      invoiceId: args.invoiceId,
      channel: args.channel,
      at: Date.now(),
      result: "initiated",
      transcriptRef: args.callId,
      createdBy: "system",
    });
    
    return attemptId;
  },
});

export const updateResult = mutation({
  args: {
    attemptId: v.id("attempts"),
    result: v.string(),
    transcriptRef: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const attempt = await ctx.db.get(args.attemptId);
    if (!attempt) {
      throw new Error("Attempt not found");
    }
    
    await ctx.db.patch(args.attemptId, {
      result: args.result,
      transcriptRef: args.transcriptRef || attempt.transcriptRef,
    });
  },
});

export const getByInvoice = query({
  args: { invoiceId: v.id("invoices") },
  returns: v.array(
    v.object({
      _id: v.id("attempts"),
      _creationTime: v.number(),
      userId: v.id("app_users"),
      vendorId: v.id("vendors"),
      invoiceId: v.id("invoices"),
      channel: v.union(v.literal("voice"), v.literal("email")),
      at: v.number(),
      result: v.string(),
      transcriptRef: v.optional(v.string()),
      createdBy: v.string(),
    })
  ),
  handler: async (ctx, args) => {
    const attempts = await ctx.db
      .query("attempts")
      .withIndex("by_invoice_time", (q) => q.eq("invoiceId", args.invoiceId))
      .order("desc")
      .collect();
    
    return attempts;
  },
});

export const getByVendor = query({
  args: { vendorId: v.id("vendors") },
  returns: v.array(
    v.object({
      _id: v.id("attempts"),
      _creationTime: v.number(),
      userId: v.id("app_users"),
      vendorId: v.id("vendors"),
      invoiceId: v.id("invoices"),
      channel: v.union(v.literal("voice"), v.literal("email")),
      at: v.number(),
      result: v.string(),
      transcriptRef: v.optional(v.string()),
      createdBy: v.string(),
    })
  ),
  handler: async (ctx, args) => {
    const attempts = await ctx.db
      .query("attempts")
      .withIndex("by_vendor_time", (q) => q.eq("vendorId", args.vendorId))
      .order("desc")
      .collect();
    
    return attempts;
  },
});

export const getRecentAttempts = query({
  args: {
    userId: v.id("app_users"),
    limit: v.optional(v.number()),
  },
  returns: v.array(
    v.object({
      _id: v.id("attempts"),
      vendorName: v.string(),
      invoiceNo: v.string(),
      channel: v.union(v.literal("voice"), v.literal("email")),
      at: v.number(),
      result: v.string(),
      transcriptRef: v.optional(v.string()),
    })
  ),
  handler: async (ctx, args) => {
    const limit = args.limit || 10;
    
    // Get recent attempts for this user
    const attempts = await ctx.db
      .query("attempts")
      .filter((q) => q.eq(q.field("userId"), args.userId))
      .order("desc")
      .take(limit);
    
    // Enrich with vendor and invoice info
    const enriched = await Promise.all(
      attempts.map(async (attempt) => {
        const vendor = await ctx.db.get(attempt.vendorId);
        const invoice = await ctx.db.get(attempt.invoiceId);
        
        return {
          _id: attempt._id,
          vendorName: vendor?.name || "Unknown",
          invoiceNo: invoice?.invoiceNo || "Unknown",
          channel: attempt.channel,
          at: attempt.at,
          result: attempt.result,
          transcriptRef: attempt.transcriptRef,
        };
      })
    );
    
    return enriched;
  },
});
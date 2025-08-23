import { query } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

export const getCurrentAppUser = query({
  args: {},
  returns: v.union(v.null(), v.object({ _id: v.id("app_users"), email: v.string() })),
  handler: async (ctx) => {
    const authUserId = await getAuthUserId(ctx);
    
    // For development: if no auth user, try to get the seeded user
    let user;
    if (authUserId) {
      user = await ctx.db
        .query("app_users")
        .withIndex("by_authUserId", (q) => q.eq("authUserId", authUserId))
        .unique();
    }
    
    // Fallback to seeded user for development
    if (!user) {
      user = await ctx.db
        .query("app_users")
        .filter((q) => q.eq(q.field("authUserId"), "seed_user_001"))
        .unique();
    }
    
    if (!user) return null;
    return { _id: user._id, email: user.email };
  },
});

export const getInvoiceById = query({
  args: { invoiceId: v.id("invoices") },
  returns: v.union(
    v.null(),
    v.object({
      _id: v.id("invoices"),
      userId: v.id("app_users"),
      vendorId: v.id("vendors"),
      invoiceNo: v.string(),
      amountCents: v.number(),
      dueDateISO: v.string(),
      state: v.string(),
      paidCents: v.number(),
    })
  ),
  handler: async (ctx, args) => {
    const inv = await ctx.db.get(args.invoiceId);
    if (!inv) return null;
    return {
      _id: inv._id,
      userId: inv.userId,
      vendorId: inv.vendorId,
      invoiceNo: inv.invoiceNo,
      amountCents: inv.amountCents,
      dueDateISO: inv.dueDateISO,
      state: inv.state,
      paidCents: inv.paidCents,
    };
  },
});



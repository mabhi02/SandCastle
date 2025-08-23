import { query } from "./_generated/server";
import { v } from "convex/values";

export const getInvoiceMetrics = query({
  args: { userId: v.id("app_users") },
  handler: async (ctx, args) => {
    const invoices = await ctx.db
      .query("invoices")
      .withIndex("by_user_state", (q) => q.eq("userId", args.userId))
      .collect();

    const overdue = invoices.filter((i) => i.state === "Overdue").length;
    const inProgress = invoices.filter((i) => i.state === "InProgress").length;
    const paid = invoices.filter((i) => i.state === "Paid" || i.state === "PartialPaid").length;
    const totalOutstandingCents = invoices
      .filter((i) => i.state === "Overdue")
      .reduce((sum, i) => sum + (i.amountCents - i.paidCents), 0);

    return {
      overdue,
      inProgress,
      paid,
      totalOutstandingCents,
    };
  },
});

export const getOverdueInvoices = query({
  args: { userId: v.id("app_users") },
  handler: async (ctx, args) => {
    const invoices = await ctx.db
      .query("invoices")
      .withIndex("by_user_state", (q) =>
        q.eq("userId", args.userId).eq("state", "Overdue")
      )
      .collect();

    const enriched = await Promise.all(
      invoices.map(async (inv) => {
        const vendor = await ctx.db.get(inv.vendorId);
        const vendorState = await ctx.db
          .query("vendor_state")
          .withIndex("by_vendor", (q) => q.eq("vendorId", inv.vendorId))
          .unique();

        const today = new Date().toISOString().split("T")[0];
        const daysLate = Math.floor(
          (Date.parse(today) - Date.parse(inv.dueDateISO)) / (1000 * 60 * 60 * 24)
        );

        return {
          ...inv,
          vendorName: vendor?.name ?? "Unknown",
          vendorPhone: vendor?.contactPhone,
          daysLate,
          attemptsThisWeek: vendorState?.attemptsThisWeek ?? 0,
          lastOutcome: vendorState?.lastOutcome,
        } as const;
      })
    );

    return enriched.sort((a, b) => b.daysLate - a.daysLate);
  },
});



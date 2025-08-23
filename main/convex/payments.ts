import { query } from "./_generated/server";
import { v } from "convex/values";

export const getPaymentStatus = query({
  args: { invoiceId: v.id("invoices") },
  handler: async (ctx, args) => {
    const payments = await ctx.db
      .query("payments")
      .withIndex("by_invoice", (q) => q.eq("invoiceId", args.invoiceId))
      .collect();

    const totalPaidCents = payments
      .filter((p) => p.status === "succeeded")
      .reduce((sum, p) => sum + p.amountCents, 0);

    const pendingPayments = payments.filter(
      (p) => p.status === "created" || p.status === "sent"
    );

    return {
      totalPaidCents,
      pendingPayments,
      lastPaymentAt: payments.length > 0
        ? Math.max(...payments.map((p) => p.createdAt))
        : null,
    } as const;
  },
});

export const getNegotiationContext = query({
  args: {
    vendorId: v.id("vendors"),
    invoiceId: v.id("invoices"),
  },
  handler: async (ctx, args) => {
    const vendor = await ctx.db.get(args.vendorId);
    const invoice = await ctx.db.get(args.invoiceId);
    const vendorState = await ctx.db
      .query("vendor_state")
      .withIndex("by_vendor", (q) => q.eq("vendorId", args.vendorId))
      .unique();

    const user = invoice ? await ctx.db.get(invoice.userId) : null;

    const minPartialBps = Math.max(
      user?.globalMinPctBps ?? 4000,
      vendor?.vendorMinPctBps ?? 0
    );

    const minPartialCents = Math.floor(
      ((invoice?.amountCents ?? 0) * minPartialBps) / 10000
    );

    return {
      vendorName: vendor?.name,
      preferredChannel: vendor?.preferredChannel ?? "voice",
      historicalMode: vendorState?.historicalMode ?? null,
      lastOutcome: vendorState?.lastOutcome ?? null,
      minPartialCents,
      maxInstallments: user?.maxInstallments ?? 2,
      maxDaysToSettle: user?.maxDaysToSettle ?? 14,
      invoiceAmountCents: invoice?.amountCents ?? null,
      invoiceNo: invoice?.invoiceNo ?? null,
    } as const;
  },
});



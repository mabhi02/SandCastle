import { query } from "./_generated/server";
import { v } from "convex/values";

export const getPaymentStatus = query({
  args: { invoiceId: v.id("invoices") },
  returns: v.object({
    totalPaidCents: v.number(),
    pendingPayments: v.array(
      v.object({
        provider: v.string(),
        providerRef: v.string(),
        amountCents: v.number(),
        status: v.union(
          v.literal("created"),
          v.literal("sent"),
          v.literal("succeeded"),
          v.literal("failed")
        ),
        createdAt: v.number(),
      })
    ),
    lastPaymentAt: v.union(v.number(), v.null()),
  }),
  handler: async (ctx, args) => {
    const payments = await ctx.db
      .query("payments")
      .withIndex("by_invoice", (q) => q.eq("invoiceId", args.invoiceId))
      .collect();

    const totalPaidCents = payments
      .filter((p) => p.status === "succeeded")
      .reduce((sum, p) => sum + p.amountCents, 0);

    const pendingPayments = payments
      .filter((p) => p.status === "created" || p.status === "sent")
      .map((p) => ({
        provider: p.provider,
        providerRef: p.providerRef,
        amountCents: p.amountCents,
        status: p.status,
        createdAt: p.createdAt,
      }));

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
  returns: v.object({
    vendorName: v.union(v.string(), v.null()),
    preferredChannel: v.union(v.literal("voice"), v.literal("email")),
    historicalMode: v.union(v.literal("full_today"), v.literal("partial_today"), v.literal("promise"), v.null()),
    lastOutcome: v.union(v.string(), v.null()),
    minPartialCents: v.number(),
    maxInstallments: v.number(),
    maxDaysToSettle: v.number(),
    invoiceAmountCents: v.union(v.number(), v.null()),
    invoiceNo: v.union(v.string(), v.null()),
  }),
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
      vendorName: vendor?.name ?? null,
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

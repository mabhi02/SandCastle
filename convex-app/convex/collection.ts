import { query } from "./_generated/server";
import { v } from "convex/values";

function formatToolSummary(tool: string, input: any, output: any): string {
  switch (tool) {
    case "vapi.call":
      return `Calling ${input?.phone ?? "customer"}`;
    case "payments.link":
      return `Created payment link for $${((input?.amountCents ?? 0) / 100).toFixed(2)}`;
    case "agentmail.send":
      return `Sent email to ${input?.to}`;
    case "state.transition":
      return `Updated to ${input?.newState}`;
    default:
      return tool;
  }
}

export const getActiveRun = query({
  args: { invoiceId: v.id("invoices") },
  handler: async (ctx, args) => {
    const run = await ctx.db
      .query("runs")
      .withIndex("by_invoice", (q) => q.eq("invoiceId", args.invoiceId))
      .order("desc")
      .first();

    if (!run) return null;

    const traceItems = await ctx.db
      .query("trace_items")
      .withIndex("by_run_ts", (q) => q.eq("runId", run._id))
      .collect();

    return {
      run,
      trace: traceItems.map((t) => ({
        time: new Date(t.ts).toLocaleTimeString(),
        tool: t.tool,
        status: t.status,
        summary: formatToolSummary(t.tool, t.input, t.output),
      })),
    } as const;
  },
});

export const canCollect = query({
  args: {
    userId: v.id("app_users"),
    vendorId: v.id("vendors"),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    const vendor = await ctx.db.get(args.vendorId);
    const vendorState = await ctx.db
      .query("vendor_state")
      .withIndex("by_vendor", (q) => q.eq("vendorId", args.vendorId))
      .unique();

    if (!user || !vendor) return { canCollect: false, reason: "Invalid data" } as const;

    if (vendor.doNotCall) {
      return { canCollect: false, reason: "Vendor on Do Not Call list" } as const;
    }

    const attemptsThisWeek = vendorState?.attemptsThisWeek ?? 0;
    if (attemptsThisWeek >= user.maxAttemptsPerWeek) {
      return {
        canCollect: false,
        reason: `Already attempted ${attemptsThisWeek} times this week`,
      } as const;
    }

    const now = new Date();
    const hour = now.getHours();
    const startHour = parseInt(user.contactWindowStartLocal.split(":")[0]);
    const endHour = parseInt(user.contactWindowEndLocal.split(":")[0]);

    if (hour < startHour || hour >= endHour) {
      return {
        canCollect: false,
        reason: `Outside contact hours (${user.contactWindowStartLocal}-${user.contactWindowEndLocal})`,
      } as const;
    }

    return {
      canCollect: true,
      reason: null,
      attemptsRemaining: user.maxAttemptsPerWeek - attemptsThisWeek,
    } as const;
  },
});



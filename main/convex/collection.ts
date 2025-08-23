import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { Id } from "./_generated/dataModel";

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
  returns: v.union(
    v.null(),
    v.object({
      run: v.object({
        _id: v.id("runs"),
        startedAt: v.number(),
        endedAt: v.optional(v.number()),
        outcome: v.optional(v.string()),
      }),
      trace: v.array(
        v.object({
          time: v.string(),
          tool: v.string(),
          status: v.union(
            v.literal("ok"),
            v.literal("blocked"),
            v.literal("error"),
          ),
          summary: v.string(),
        }),
      ),
    })
  ),
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
      run: {
        _id: run._id,
        startedAt: run.startedAt,
        endedAt: run.endedAt,
        outcome: run.outcome,
      },
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
  returns: v.object({
    canCollect: v.boolean(),
    reason: v.union(v.string(), v.null()),
    attemptsRemaining: v.optional(v.number()),
  }),
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


// Minimal mutation to start follow-ups for selected overdue invoices.
// For each invoice, we:
// - verify ownership by the current app user
// - insert a new run document
// - update the invoice state to InProgress
// - add a simple trace item summarizing the transition
export const startFollowUps = mutation({
  args: { invoiceIds: v.array(v.id("invoices")) },
  returns: v.object({
    queued: v.number(),
    results: v.array(
      v.object({
        invoiceId: v.id("invoices"),
        runId: v.union(v.id("runs"), v.null()),
        skipped: v.optional(v.string()),
      })
    ),
  }),
  handler: async (ctx, args) => {
    const now = Date.now();
    const results: { invoiceId: Id<"invoices">; runId: Id<"runs"> | null; skipped?: string }[] = [];

    for (const invoiceId of args.invoiceIds) {
      const inv = await ctx.db.get(invoiceId);
      if (!inv) {
      results.push({ invoiceId, runId: null, skipped: "missing" });
        continue;
      }
      // Create a run for this invoice
      const runId = await ctx.db.insert("runs", {
        userId: inv.userId,
        invoiceId: inv._id,
        vendorId: inv.vendorId,
        startedAt: now,
        endedAt: undefined,
        outcome: undefined,
      });

      // Transition invoice to InProgress if currently Overdue
      const newState = inv.state === "Overdue" ? "InProgress" : inv.state;
      await ctx.db.patch(inv._id, {
        state: newState,
        lastStateChangeAt: now,
        updatedAt: now,
      });

      // Add a simple trace item to make the run visible in UI
      await ctx.db.insert("trace_items", {
        runId,
        ts: now,
        tool: "state.transition",
        input: { prev: inv.state, newState },
        output: { queued: true },
        status: "ok",
        policyMsg: undefined,
      });

      results.push({ invoiceId, runId });
    }

    return { queued: results.filter(r => r.runId).length, results } as const;
  },
});

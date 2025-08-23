import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { getOrCreateAppUser } from "./users";

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

export const getInvoiceMetrics = query({
  args: { userId: v.id("app_users") },
  returns: v.object({
    overdue: v.number(),
    inProgress: v.number(),
    paid: v.number(),
    totalOutstandingCents: v.number(),
  }),
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

export const addVendors = mutation({
  args: {
    vendors: v.array(
      v.object({
        customer: v.optional(v.string()),
        contact_email: v.optional(v.string()),
        contact_phone: v.optional(v.string()),
        invoice_id: v.optional(v.string()),
        amount_due: v.optional(v.string()),
        due_date: v.optional(v.string()),
        days_late: v.optional(v.string()),
        notes: v.optional(v.string()),
      })
    ),
  },
  returns: v.object({ vendorsAdded: v.number(), invoicesAdded: v.number() }),
  handler: async (ctx, args) => {
    // Get or create app user (handles both auth and demo scenarios)
    const appUser = await getOrCreateAppUser(ctx);
    if (!appUser) throw new Error("Could not get or create app user");
    
    const vendorIds = [];
    const invoiceIds = [];
    
    for (const row of args.vendors) {
      // First, create or find the vendor
      const existingVendor = await ctx.db
        .query("vendors")
        .withIndex("by_user_name", (q) => 
          q.eq("userId", appUser._id).eq("name", row.customer || "Unknown")
        )
        .first();
      
      let vendorId;
      if (existingVendor) {
        vendorId = existingVendor._id;
      } else {
        vendorId = await ctx.db.insert("vendors", {
          userId: appUser._id,
          name: row.customer || "Unknown",
          contactEmail: row.contact_email || undefined,
          contactPhone: row.contact_phone || undefined,
          doNotCall: false,
          preferredChannel: "voice" as const,
          notes: row.notes || undefined,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        });
        vendorIds.push(vendorId);
      }
      
      // Then create the invoice if invoice data exists
      if (row.invoice_id) {
        const invoiceId = await ctx.db.insert("invoices", {
          userId: appUser._id,
          vendorId,
          invoiceNo: row.invoice_id,
          amountCents: Math.round(parseFloat(row.amount_due || "0") * 100), // Convert to cents
          dueDateISO: row.due_date || new Date().toISOString().split("T")[0],
          state: parseInt(row.days_late || "0") > 0 ? "Overdue" : "InProgress",
          paidCents: 0,
          lastStateChangeAt: Date.now(),
          memo: row.notes,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        });
        invoiceIds.push(invoiceId);
      }
    }
    
    return { 
      vendorsAdded: vendorIds.length,
      invoicesAdded: invoiceIds.length 
    };
  },
});

export const getVendors = query({
  args: {},
  returns: v.array(
    v.object({
      _id: v.id("vendors"),
      customer: v.string(),
      contact_email: v.optional(v.string()),
      contact_phone: v.optional(v.string()),
      notes: v.optional(v.string()),
      _creationTime: v.number(),
    })
  ),
  handler: async (ctx) => {
    // For development, just get all vendors regardless of user
    // In production, you'd filter by authenticated user
    const vendors = await ctx.db
      .query("vendors")
      .collect();
    
    return vendors.map(v => ({
      _id: v._id,
      customer: v.name,
      contact_email: v.contactEmail,
      contact_phone: v.contactPhone,
      notes: v.notes,
      _creationTime: v.createdAt,
    }));
  },
});

export const getOverdueInvoices = query({
  args: { userId: v.id("app_users") },
  returns: v.array(
    v.object({
      _id: v.id("invoices"),
      vendorName: v.string(),
      vendorPhone: v.optional(v.string()),
      daysLate: v.number(),
      attemptsThisWeek: v.number(),
      lastOutcome: v.optional(v.string()),
      userId: v.id("app_users"),
      vendorId: v.id("vendors"),
      invoiceNo: v.string(),
      amountCents: v.number(),
      dueDateISO: v.string(),
      state: invoiceState,
      paidCents: v.number(),
      lastStateChangeAt: v.number(),
      memo: v.optional(v.string()),
      createdAt: v.number(),
      updatedAt: v.number(),
    })
  ),
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
          _id: inv._id,
          userId: inv.userId,
          vendorId: inv.vendorId,
          invoiceNo: inv.invoiceNo,
          amountCents: inv.amountCents,
          dueDateISO: inv.dueDateISO,
          state: inv.state,
          paidCents: inv.paidCents,
          lastStateChangeAt: inv.lastStateChangeAt,
          memo: inv.memo,
          createdAt: inv.createdAt,
          updatedAt: inv.updatedAt,
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

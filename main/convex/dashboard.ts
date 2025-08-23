import { mutation, query, action } from "./_generated/server";
import { v } from "convex/values";
import { getOrCreateAppUser } from "./users";
import { api } from "./_generated/api";

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

export const getInvoices = query({
  args: {},
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
      paidCents: v.number(),
      lastStateChangeAt: v.number(),
      promiseDateISO: v.optional(v.string()),
      memo: v.optional(v.string()),
      createdAt: v.number(),
      updatedAt: v.number(),
    })
  ),
  handler: async (ctx) => {
    // For demo: just get ALL invoices regardless of user
    const invoices = await ctx.db
      .query("invoices")
      .collect();
    
    return invoices;
  },
});

export const getVendors = query({
  args: {},
  returns: v.array(
    v.object({
      _id: v.id("vendors"),
      _creationTime: v.number(),
      userId: v.id("app_users"),
      name: v.string(),
      contactEmail: v.optional(v.string()),
      contactPhone: v.optional(v.string()),
      doNotCall: v.boolean(),
      preferredChannel: v.union(v.literal("voice"), v.literal("email")),
      vendorMinPctBps: v.optional(v.number()),
      contactWindowStartLocal: v.optional(v.string()),
      contactWindowEndLocal: v.optional(v.string()),
      notes: v.optional(v.string()),
      createdAt: v.number(),
      updatedAt: v.number(),
    })
  ),
  handler: async (ctx) => {
    // For demo: just get ALL vendors regardless of user
    const vendors = await ctx.db
      .query("vendors")
      .collect();
    
    return vendors;
  },
});

export const getVendorStates = query({
  args: {},
  returns: v.array(
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
    })
  ),
  handler: async (ctx) => {
    // For demo: just get ALL vendor states regardless of user
    const vendorStates = await ctx.db
      .query("vendor_state")
      .collect();
    
    return vendorStates;
  },
});

export const getStats = query({
  args: {},
  returns: v.object({
    totalOutstanding: v.number(),
    overdueCount: v.number(),
    promiseAmount: v.number(),
    recoveredToday: v.number(),
    activeCalls: v.number(),
    successRate: v.number(),
  }),
  handler: async (ctx) => {
    // For demo: just get ALL data regardless of user
    const invoices = await ctx.db
      .query("invoices")
      .collect();
    
    const vendorStates = await ctx.db
      .query("vendor_state")
      .collect();
    
    const totalOutstanding = invoices.reduce((sum, inv) => 
      sum + (inv.amountCents - inv.paidCents), 0
    );
    
    const overdueCount = invoices.filter(inv => inv.state === "Overdue").length;
    
    const promiseAmount = invoices
      .filter(inv => inv.state === "PromiseToPay")
      .reduce((sum, inv) => sum + (inv.amountCents - inv.paidCents), 0);
    
    // Calculate today's recovered amount (simplified - in production would track by date)
    const recoveredToday = vendorStates.reduce((sum, vs) => 
      sum + (vs.lastPaidAmountCents || 0), 0
    );
    
    // Count active calls (simplified - in production would track actual call status)
    const activeCalls = 0;
    
    // Calculate success rate
    const totalAttempts = vendorStates.reduce((sum, vs) => 
      sum + vs.attemptsThisWeek, 0
    );
    const successfulAttempts = vendorStates.filter(vs => 
      vs.lastOutcome === "promise" || vs.lastOutcome === "paid"
    ).length;
    const successRate = totalAttempts > 0 
      ? Math.round((successfulAttempts / totalAttempts) * 100) 
      : 0;
    
    return {
      totalOutstanding,
      overdueCount,
      promiseAmount,
      recoveredToday,
      activeCalls,
      successRate,
    };
  },
});

export const startCall = mutation({
  args: { vendorId: v.id("vendors") },
  returns: v.object({ 
    success: v.boolean(),
    callId: v.optional(v.string())
  }),
  handler: async (ctx, args) => {
    const appUser = await getOrCreateAppUser(ctx);
    if (!appUser) throw new Error("User not found");
    
    // Get vendor and invoice details
    const vendor = await ctx.db.get(args.vendorId);
    if (!vendor) throw new Error("Vendor not found");
    
    // For demo: Just get any overdue invoice since auth is not properly linked
    let invoice = await ctx.db
      .query("invoices")
      .filter((q) => q.eq(q.field("vendorId"), args.vendorId))
      .first();
    
    if (!invoice) {
      // Just grab the first overdue invoice for demo purposes
      invoice = await ctx.db
        .query("invoices")
        .filter((q) => q.eq(q.field("state"), "Overdue"))
        .first();
      
      if (!invoice) {
        throw new Error("No invoice found for demo");
      }
    }
    
    // Update vendor state to track the call attempt
    const vendorState = await ctx.db
      .query("vendor_state")
      .withIndex("by_vendor", (q) => q.eq("vendorId", args.vendorId))
      .unique();
    
    if (vendorState) {
      await ctx.db.patch(vendorState._id, {
        lastAttemptAt: Date.now(),
        attemptsThisWeek: vendorState.attemptsThisWeek + 1,
        updatedAt: Date.now(),
      });
    } else {
      await ctx.db.insert("vendor_state", {
        userId: appUser._id,
        vendorId: args.vendorId,
        historicalMode: null,
        attemptsThisWeek: 1,
        lastAttemptAt: Date.now(),
        totalRecoveredCents: 0,
        totalOutstandingCents: invoice.amountCents - invoice.paidCents,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
    }
    
    // Schedule the action to make the actual call
    await ctx.scheduler.runAfter(0, api.dashboard.initiateVapiCall, {
      vendorId: args.vendorId,
      vendorName: vendor.name,
      vendorEmail: vendor.contactEmail || "ap@vendor.com",
      vendorPhone: vendor.contactPhone || undefined,  // Pass undefined if no phone
      invoiceNo: invoice.invoiceNo,
      invoiceAmountCents: invoice.amountCents,
      invoiceDueDate: invoice.dueDateISO,
      companyName: "TechFlow Solutions"
    });
    
    return { 
      success: true,
      callId: undefined // We can't get the call ID synchronously when scheduling
    };
  },
});

export const sendEmail = mutation({
  args: { vendorId: v.id("vendors") },
  returns: v.object({ success: v.boolean() }),
  handler: async (ctx, args) => {
    const appUser = await getOrCreateAppUser(ctx);
    if (!appUser) throw new Error("User not found");
    
    // Track email attempt (simplified)
    const vendorState = await ctx.db
      .query("vendor_state")
      .withIndex("by_vendor", (q) => q.eq("vendorId", args.vendorId))
      .unique();
    
    if (vendorState) {
      await ctx.db.patch(vendorState._id, {
        lastAttemptAt: Date.now(),
        updatedAt: Date.now(),
      });
    }
    
    return { success: true };
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

// Action to call the Flask API
export const initiateVapiCall = action({
  args: {
    vendorId: v.id("vendors"),
    vendorName: v.string(),
    vendorEmail: v.string(),
    vendorPhone: v.optional(v.string()),
    invoiceNo: v.string(),
    invoiceAmountCents: v.number(),
    invoiceDueDate: v.string(),
    companyName: v.string(),
  },
  returns: v.object({
    success: v.boolean(),
    callId: v.optional(v.string()),
    error: v.optional(v.string())
  }),
  handler: async (ctx, args) => {
    // Call the Flask API server via Tailscale funnel
    const API_URL = process.env.VAPI_API_URL || "https://darins-macbook-pro.tail4869a0.ts.net";
    
    try {
      const response = await fetch(`${API_URL}/api/initiate-call`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          phoneNumber: args.vendorPhone || "+17657469771", // Use test number if no vendor phone
          vendorId: args.vendorId,
          vendorName: args.vendorName,
          vendorEmail: args.vendorEmail,
          invoiceNo: args.invoiceNo,
          invoiceAmountCents: args.invoiceAmountCents,
          invoiceDueDate: args.invoiceDueDate,
          companyName: args.companyName,
        }),
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`API call failed: ${response.status} - ${errorText}`);
      }
      
      const data = await response.json();
      
      return {
        success: data.success,
        callId: data.callId,
        error: data.error
      };
    } catch (error: any) {
      console.error("Failed to initiate Vapi call:", error);
      return {
        success: false,
        callId: undefined,
        error: error.message || "Failed to initiate call"
      };
    }
  },
});
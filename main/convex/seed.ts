import { internalMutation } from "./_generated/server";
import { v } from "convex/values";

export const seedData = internalMutation({
  args: {},
  returns: v.object({
    message: v.string(),
    stats: v.object({
      users: v.number(),
      vendors: v.number(),
      invoices: v.number(),
      overdueInvoices: v.number(),
    }),
  }),
  handler: async (ctx) => {
    // Check if we already have data
    const existingInvoices = await ctx.db.query("invoices").first();
    if (existingInvoices) {
      console.log("Data already exists, skipping seed");
      return { message: "Data already exists", stats: { users: 0, vendors: 0, invoices: 0, overdueInvoices: 0 } };
    }

    // Create a test user with all required fields
    const userId = await ctx.db.insert("app_users", {
      authUserId: "seed_user_001",
      email: "test@example.com",
      companyName: "Test Company",
      timezone: "America/Los_Angeles",
      currency: "USD",
      
      // Negotiation defaults (in basis points)
      globalMinPctBps: 5000, // 50%
      maxInstallments: 3,
      maxDaysToSettle: 30,
      allowZeroTodayIfDaysLateLt: 7,
      
      // Optional carrots
      discountIfFullTodayBps: 200, // 2% discount
      lateFeeWaive: true,
      
      // Guardrails
      contactWindowStartLocal: "09:00",
      contactWindowEndLocal: "17:00",
      maxAttemptsPerWeek: 5,
      neverCollectCardOnCall: false,
      
      // Identities
      agentMailFrom: "collections@testcompany.com",
      voiceNumber: "+1-555-0000",
      
      // Tooling
      allowedTools: ["voice", "email", "sms"],
      
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    // Create vendors with required fields only
    const vendor1 = await ctx.db.insert("vendors", {
      userId,
      name: "ABC Supply Co.",
      contactPhone: "+1-555-0100",
      contactEmail: "ap@abcsupply.com",
      doNotCall: false,
      preferredChannel: "voice",
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    const vendor2 = await ctx.db.insert("vendors", {
      userId,
      name: "Tech Solutions Inc.",
      contactPhone: "+1-555-0101",
      contactEmail: "billing@techsolutions.com",
      doNotCall: false,
      preferredChannel: "email",
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    const vendor3 = await ctx.db.insert("vendors", {
      userId,
      name: "Global Logistics LLC",
      contactPhone: "+1-555-0102",
      contactEmail: "accounts@globallogistics.com",
      doNotCall: false,
      preferredChannel: "voice",
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    const vendor4 = await ctx.db.insert("vendors", {
      userId,
      name: "Prime Materials Corp",
      contactPhone: "+1-555-0103",
      contactEmail: "finance@primematerials.com",
      doNotCall: false,
      preferredChannel: "voice",
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    const vendor5 = await ctx.db.insert("vendors", {
      userId,
      name: "Metro Services",
      contactPhone: "+1-555-0104",
      contactEmail: "billing@metroservices.com",
      doNotCall: false,
      preferredChannel: "email",
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    // Create vendor states with correct schema
    await ctx.db.insert("vendor_state", {
      userId,
      vendorId: vendor1,
      historicalMode: "partial_today",
      attemptsThisWeek: 2,
      lastAttemptAt: Date.now() - 86400000 * 2, // 2 days ago
      lastOutcome: "Left voicemail",
      totalRecoveredCents: 50000,
      totalOutstandingCents: 425000,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    await ctx.db.insert("vendor_state", {
      userId,
      vendorId: vendor2,
      historicalMode: "promise",
      attemptsThisWeek: 1,
      lastAttemptAt: Date.now() - 86400000, // 1 day ago
      lastOutcome: "Promised payment by Friday",
      totalRecoveredCents: 100000,
      totalOutstandingCents: 870000,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    await ctx.db.insert("vendor_state", {
      userId,
      vendorId: vendor3,
      historicalMode: null,
      attemptsThisWeek: 3,
      lastAttemptAt: Date.now() - 86400000 * 5, // 5 days ago
      lastOutcome: "Dispute - reviewing invoice",
      totalRecoveredCents: 0,
      totalOutstandingCents: 1115000,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    // Helper to calculate due date
    const getDueDateISO = (daysOverdue: number) => {
      const date = new Date();
      date.setDate(date.getDate() - daysOverdue);
      return date.toISOString().split('T')[0];
    };

    const now = Date.now();

    // Create invoices with all required fields
    const invoices = [
      {
        userId,
        vendorId: vendor1,
        invoiceNo: "INV-2024-001",
        amountCents: 250000, // $2,500
        paidCents: 0,
        dueDateISO: getDueDateISO(45),
        state: "Overdue" as const,
        lastStateChangeAt: now - 86400000 * 45,
        createdAt: now,
        updatedAt: now,
      },
      {
        userId,
        vendorId: vendor2,
        invoiceNo: "INV-2024-002",
        amountCents: 420000, // $4,200
        paidCents: 100000, // $1,000 partial payment
        dueDateISO: getDueDateISO(30),
        state: "Overdue" as const,
        lastStateChangeAt: now - 86400000 * 30,
        createdAt: now,
        updatedAt: now,
      },
      {
        userId,
        vendorId: vendor3,
        invoiceNo: "INV-2024-003",
        amountCents: 890000, // $8,900
        paidCents: 0,
        dueDateISO: getDueDateISO(60),
        state: "Overdue" as const,
        lastStateChangeAt: now - 86400000 * 60,
        createdAt: now,
        updatedAt: now,
      },
      {
        userId,
        vendorId: vendor4,
        invoiceNo: "INV-2024-004",
        amountCents: 150000, // $1,500
        paidCents: 0,
        dueDateISO: getDueDateISO(15),
        state: "Overdue" as const,
        lastStateChangeAt: now - 86400000 * 15,
        createdAt: now,
        updatedAt: now,
      },
      {
        userId,
        vendorId: vendor5,
        invoiceNo: "INV-2024-005",
        amountCents: 320000, // $3,200
        paidCents: 0,
        dueDateISO: getDueDateISO(22),
        state: "Overdue" as const,
        lastStateChangeAt: now - 86400000 * 22,
        createdAt: now,
        updatedAt: now,
      },
      {
        userId,
        vendorId: vendor1,
        invoiceNo: "INV-2024-006",
        amountCents: 175000, // $1,750
        paidCents: 0,
        dueDateISO: getDueDateISO(10),
        state: "Overdue" as const,
        lastStateChangeAt: now - 86400000 * 10,
        createdAt: now,
        updatedAt: now,
      },
      {
        userId,
        vendorId: vendor2,
        invoiceNo: "INV-2024-007",
        amountCents: 550000, // $5,500
        paidCents: 0,
        dueDateISO: getDueDateISO(35),
        state: "Overdue" as const,
        lastStateChangeAt: now - 86400000 * 35,
        createdAt: now,
        updatedAt: now,
      },
      {
        userId,
        vendorId: vendor3,
        invoiceNo: "INV-2024-008",
        amountCents: 225000, // $2,250
        paidCents: 50000, // $500 partial
        dueDateISO: getDueDateISO(8),
        state: "Overdue" as const,
        lastStateChangeAt: now - 86400000 * 8,
        createdAt: now,
        updatedAt: now,
      },
      // Add some paid/in-progress invoices for variety
      {
        userId,
        vendorId: vendor4,
        invoiceNo: "INV-2024-009",
        amountCents: 300000, // $3,000
        paidCents: 300000, // Fully paid
        dueDateISO: getDueDateISO(-5), // Not overdue
        state: "Paid" as const,
        lastStateChangeAt: now - 86400000 * 2,
        createdAt: now,
        updatedAt: now,
      },
      {
        userId,
        vendorId: vendor5,
        invoiceNo: "INV-2024-010",
        amountCents: 125000, // $1,250
        paidCents: 0,
        dueDateISO: getDueDateISO(3),
        state: "InProgress" as const,
        lastStateChangeAt: now - 86400000,
        createdAt: now,
        updatedAt: now,
      },
    ];

    // Insert all invoices
    for (const invoice of invoices) {
      await ctx.db.insert("invoices", invoice);
    }

    return {
      message: "Successfully seeded database",
      stats: {
        users: 1,
        vendors: 5,
        invoices: invoices.length,
        overdueInvoices: invoices.filter(i => i.state === "Overdue").length,
      }
    };
  },
});

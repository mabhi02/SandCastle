import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { authTables } from "@convex-dev/auth/server";

// Reusable enums
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

const channel = v.union(v.literal("voice"), v.literal("email"));

export default defineSchema({
  // Keep Convex Auth tables
  ...authTables,

  // Demo table retained for existing sample functions
  numbers: defineTable({
    value: v.number(),
  }),

  // 1) APP USERS (renamed from `users` to avoid conflict with Convex Auth)
  app_users: defineTable({
    authUserId: v.string(),
    email: v.string(),
    companyName: v.optional(v.string()),
    timezone: v.string(),
    currency: v.string(),

    // Global negotiation defaults (basis points for exact math)
    globalMinPctBps: v.number(),
    maxInstallments: v.number(),
    maxDaysToSettle: v.number(),
    allowZeroTodayIfDaysLateLt: v.number(),

    // Optional carrots
    discountIfFullTodayBps: v.optional(v.number()),
    lateFeeWaive: v.optional(v.boolean()),

    // Guardrails
    contactWindowStartLocal: v.string(),
    contactWindowEndLocal: v.string(),
    maxAttemptsPerWeek: v.number(),
    neverCollectCardOnCall: v.boolean(),

    // Identities (agent-owned)
    agentMailFrom: v.string(),
    voiceNumber: v.optional(v.string()),

    // Tooling/flags
    allowedTools: v.array(v.string()),

    // Bookkeeping
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_authUserId", ["authUserId"]),

  // 2) VENDORS (profile: rarely changes)
  vendors: defineTable({
    userId: v.id("app_users"),
    name: v.string(),
    contactEmail: v.optional(v.string()),
    contactPhone: v.optional(v.string()),

    // Preferences/constraints
    doNotCall: v.boolean(),
    preferredChannel: channel,
    vendorMinPctBps: v.optional(v.number()),

    // Optional per-vendor window override
    contactWindowStartLocal: v.optional(v.string()),
    contactWindowEndLocal: v.optional(v.string()),

    notes: v.optional(v.string()),

    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_user", ["userId"]) 
    .index("by_user_name", ["userId", "name"]) 
    .index("by_user_doNotCall", ["userId", "doNotCall"]),

  // 3) VENDOR STATE (operational memory: updates often)
  vendor_state: defineTable({
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
    .index("by_vendor", ["vendorId"]) 
    .index("followups", ["userId", "nextFollowUpAt"]),

  // 4) INVOICES
  invoices: defineTable({
    userId: v.id("app_users"),
    vendorId: v.id("vendors"),
    invoiceNo: v.string(),
    amountCents: v.number(),
    dueDateISO: v.string(),
    state: invoiceState,

    // Live bookkeeping
    promiseDateISO: v.optional(v.string()),
    paidCents: v.number(),
    lastStateChangeAt: v.number(),

    memo: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_vendor", ["vendorId"]) 
    .index("by_user_state", ["userId", "state"]) 
    .index("overdue_by_due", ["userId", "state", "dueDateISO"]),

  // 5) PAYMENTS (from Autumn/Stripe test mode etc.)
  payments: defineTable({
    userId: v.id("app_users"),
    vendorId: v.id("vendors"),
    invoiceId: v.id("invoices"),

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
    updatedAt: v.number(),
  })
    .index("by_invoice", ["invoiceId"]) 
    .index("by_vendor", ["vendorId"]),

  // 6) ATTEMPTS (calls/emails with outcomes)
  attempts: defineTable({
    userId: v.id("app_users"),
    vendorId: v.id("vendors"),
    invoiceId: v.id("invoices"),
    channel: channel,
    at: v.number(),
    result: v.string(),
    transcriptRef: v.optional(v.string()),
    createdBy: v.string(),
  })
    .index("by_vendor_time", ["vendorId", "at"]) 
    .index("by_invoice_time", ["invoiceId", "at"]),

  // 7) RUNS & TRACE (auditable tool calls)
  runs: defineTable({
    userId: v.id("app_users"),
    invoiceId: v.id("invoices"),
    vendorId: v.id("vendors"),
    startedAt: v.number(),
    endedAt: v.optional(v.number()),
    outcome: v.optional(v.string()),
  })
    .index("by_invoice", ["invoiceId"]),

  trace_items: defineTable({
    runId: v.id("runs"),
    ts: v.number(),
    tool: v.string(),
    input: v.any(),
    output: v.any(),
    status: v.union(v.literal("ok"), v.literal("blocked"), v.literal("error")),
    policyMsg: v.optional(v.string()),
  })
    .index("by_run_ts", ["runId", "ts"]) 
    .index("by_run_tool_ts", ["runId", "tool", "ts"]),

  // 8) VAPI TRANSCRIPTS (real-time call transcripts)
  vapi_transcripts: defineTable({
    callId: v.string(),
    role: v.string(),
    transcriptType: v.string(),
    text: v.string(),
    timestamp: v.number(),
    createdAt: v.number(),
  })
    .index("by_call", ["callId"])
    .index("by_call_timestamp", ["callId", "timestamp"]),

  // 9) ACTIVITY (real-time activity feed)
  activity: defineTable({
    userId: v.id("app_users"),
    type: v.string(), // "call_assessment", "payment_received", "email_sent", etc.
    description: v.string(),
    metadata: v.optional(v.any()),
    at: v.number(),
  })
    .index("by_user_time", ["userId", "at"])
    .index("by_type", ["type"]),

  // 10) VAPI CALLS (call metadata and reports)
  vapi_calls: defineTable({
    callId: v.string(),
    status: v.string(),
    artifact: v.optional(v.any()),
    endedReason: v.optional(v.string()),
    startedAt: v.optional(v.number()),
    endedAt: v.optional(v.number()),
    phoneNumber: v.optional(v.string()),
    assistantId: v.optional(v.string()),
    recordingUrl: v.optional(v.string()),
    stereoRecordingUrl: v.optional(v.string()),
    cost: v.optional(v.number()),
    costBreakdown: v.optional(v.any()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_callId", ["callId"])
    .index("by_phone", ["phoneNumber"])
    .index("by_status", ["status"])
    .index("by_created", ["createdAt"]),

  // 11) SETTLEMENT PROPOSALS (live negotiation during calls)
  settlement_proposals: defineTable({
    callId: v.string(),
    vendorId: v.id("vendors"),
    invoiceId: v.id("invoices"),
    proposedCents: v.number(),
    discountPct: v.number(),
    savingsCents: v.number(),
    meetsMinimum: v.boolean(),
    accepted: v.boolean(),
    acceptedAt: v.optional(v.number()),
    paymentLinkUrl: v.optional(v.string()),
    timestamp: v.number(),
  })
    .index("by_call", ["callId"])
    .index("by_vendor", ["vendorId"])
    .index("by_accepted", ["accepted"]),
});

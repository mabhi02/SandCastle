import { query, QueryCtx, MutationCtx } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";
import { Id } from "./_generated/dataModel";

export async function getAuthenticatedUser(ctx: QueryCtx | MutationCtx) {
  const authUserId = await getAuthUserId(ctx);
  if (!authUserId) {
    // No authenticated user
    return null;
  }
  
  // authUserId is the ID from the users table (Convex Auth)
  const user = await ctx.db.get(authUserId as Id<"users">);
  return user;
}

export async function getOrCreateAppUser(ctx: QueryCtx | MutationCtx) {
  const authUser = await getAuthenticatedUser(ctx);
  
  if (!authUser) {
    // For development/demo, use or create a demo user
    let appUser = await ctx.db
      .query("app_users")
      .withIndex("by_authUserId", (q) => q.eq("authUserId", "demo_user"))
      .first();
    
    if (!appUser && 'insert' in ctx.db) {
      // Only mutations can insert
      const mutableCtx = ctx as MutationCtx;
      const userId = await mutableCtx.db.insert("app_users", {
        authUserId: "demo_user",
        email: "demo@sandcastle.ai",
        companyName: "Demo Company",
        timezone: "America/New_York",
        currency: "USD",
        globalMinPctBps: 2500,
        maxInstallments: 6,
        maxDaysToSettle: 90,
        allowZeroTodayIfDaysLateLt: 7,
        contactWindowStartLocal: "09:00",
        contactWindowEndLocal: "17:00",
        maxAttemptsPerWeek: 3,
        neverCollectCardOnCall: false,
        agentMailFrom: "collections@demo.com",
        allowedTools: ["voice", "email"],
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
      appUser = await mutableCtx.db.get(userId);
    }
    
    return appUser;
  }
  
  // Get or create app_user for authenticated user
  let appUser = await ctx.db
    .query("app_users")
    .withIndex("by_authUserId", (q) => q.eq("authUserId", authUser._id))
    .first();
  
  if (!appUser && 'insert' in ctx.db) {
    // Only mutations can insert
    const mutableCtx = ctx as MutationCtx;
    const userId = await mutableCtx.db.insert("app_users", {
      authUserId: authUser._id,
      email: (authUser as any).email || "user@example.com",
      companyName: (authUser as any).name || "User Company",
      timezone: "America/New_York",
      currency: "USD",
      globalMinPctBps: 2500,
      maxInstallments: 6,
      maxDaysToSettle: 90,
      allowZeroTodayIfDaysLateLt: 7,
      contactWindowStartLocal: "09:00",
      contactWindowEndLocal: "17:00",
      maxAttemptsPerWeek: 3,
      neverCollectCardOnCall: false,
      agentMailFrom: "collections@company.com",
      allowedTools: ["voice", "email"],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
    appUser = await mutableCtx.db.get(userId);
  }
  
  return appUser;
}

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
        .withIndex("by_authUserId", (q) => q.eq("authUserId", "seed_user_001"))
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

export const getAppUserById = query({
  args: { userId: v.id("app_users") },
  returns: v.union(
    v.null(),
    v.object({
      _id: v.id("app_users"),
      email: v.string(),
      companyName: v.optional(v.string()),
      agentMailFrom: v.string(),
    })
  ),
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) return null;
    return {
      _id: user._id,
      email: user.email,
      companyName: user.companyName,
      agentMailFrom: user.agentMailFrom,
    };
  },
});


import { query } from "./_generated/server";
import { v } from "convex/values";

export const checkData = query({
  args: {},
  handler: async (ctx) => {
    const appUsers = await ctx.db.query("app_users").collect();
    const vendors = await ctx.db.query("vendors").collect();
    
    return {
      appUsersCount: appUsers.length,
      appUserIds: appUsers.map(u => ({ id: u._id, authUserId: u.authUserId })),
      vendorsCount: vendors.length,
      vendorSample: vendors.slice(0, 3).map(v => ({
        id: v._id,
        userId: v.userId,
        name: v.name
      }))
    };
  },
});
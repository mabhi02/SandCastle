import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const updateVendorPhones = mutation({
  args: {},
  returns: v.null(),
  handler: async (ctx) => {
    // Update all vendors to have a valid phone number for testing
    const vendors = await ctx.db.query("vendors").collect();
    
    for (const vendor of vendors) {
      await ctx.db.patch(vendor._id, {
        contactPhone: "+17657469771", // Valid test phone number
        updatedAt: Date.now(),
      });
    }
    
    console.log(`Updated ${vendors.length} vendors with valid phone number`);
    return null;
  },
});

export const checkData = query({
  args: {},
  returns: v.object({
    appUsersCount: v.number(),
    appUserIds: v.array(v.object({ id: v.id("app_users"), authUserId: v.union(v.string(), v.id("users")) })),
    vendorsCount: v.number(),
    vendorSample: v.array(v.object({ id: v.id("vendors"), userId: v.id("app_users"), name: v.string() })),
  }),
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

import { action } from "./_generated/server";
import { v } from "convex/values";
import { api } from "./_generated/api";

/**
 * Test function to verify the post-call email integration with payment link
 * This can be called manually to test the email flow
 */
export const testPostCallEmail = action({
  args: {
    vendorId: v.id("vendors"),
    callOutcome: v.optional(v.string()),
    mockTranscript: v.optional(v.string()),
  },
  handler: async (ctx, args): Promise<any> => {
    console.log("🧪 Testing post-call email integration with payment link...");
    
    try {
      // If mockTranscript is provided, create some test transcript data
      const testCallId = `test_call_${Date.now()}`;
      
      if (args.mockTranscript) {
        // Insert mock transcript for testing OpenAI extraction
        await ctx.runMutation(api.vapiTranscripts.insert, {
          callId: testCallId,
          role: "user",
          transcriptType: "final",
          text: args.mockTranscript,
          timestamp: Date.now()
        });
        console.log("📝 Inserted mock transcript for testing");
      }

      const result: any = await ctx.runAction(api.email.sendPostCallEmail, {
        vendorId: args.vendorId,
        callId: testCallId,
        callOutcome: args.callOutcome || "assistant-ended-call",
        callDuration: 120 // 2 minutes
      });

      console.log("✅ Test email result:", result);
      console.log(`💰 Extracted amount: ${result.extractedAmount ? '$' + (result.extractedAmount / 100).toFixed(2) : 'None'}`);
      console.log(`🔗 Payment link: ${result.paymentLink}`);
      console.log(`📧 Email sent to: sandcastleyc@gmail.com`);
      
      return result;

    } catch (error: any) {
      console.error("❌ Test email failed:", error);
      return {
        success: false,
        error: error.message,
        message: `Test failed: ${error.message}`
      };
    }
  }
});

/**
 * List vendors for testing purposes
 */
export const listVendorsForTesting = action({
  args: {},
  handler: async (ctx): Promise<any> => {
    // Get current app user
    const currentUser: any = await ctx.runQuery(api.users.getCurrentAppUser, {});
    if (!currentUser) {
      return { error: "No current user found" };
    }

    // Get vendors for this user
    const vendors: any = await ctx.runQuery(api.vendors.getByUser, {
      userId: currentUser._id,
      limit: 10
    });

    return {
      currentUser,
      vendors: vendors.map((v: any) => ({
        _id: v._id,
        name: v.name,
        contactEmail: v.contactEmail,
        contactPhone: v.contactPhone
      }))
    };
  }
});

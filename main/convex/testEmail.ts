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
      } else {
        // Create a default rich transcript with all information
        const defaultTranscript = `
Agent: Hello, am I speaking with someone from ABC Supply Company?
Customer: Yes, this is John from ABC Supply Company.
Agent: Great! I'm calling about invoice INV-2024-001 for $5,000 that's overdue.
Customer: Yes, I know about that invoice. We've been having some cash flow issues.
Agent: I understand. Would you be able to make a partial payment today?
Customer: Yes, I can pay $1,500 today as the first installment.
Agent: That sounds good. Where should I send the payment link?
Customer: Please send it to john.doe@abcsupply.com
Agent: Perfect, I'll send the payment link to john.doe@abcsupply.com right away.
Customer: Thank you.
`;
        await ctx.runMutation(api.vapiTranscripts.insert, {
          callId: testCallId,
          role: "assistant",
          transcriptType: "final",
          text: "Hello, am I speaking with someone from ABC Supply Company?",
          timestamp: Date.now()
        });
        await ctx.runMutation(api.vapiTranscripts.insert, {
          callId: testCallId,
          role: "user",
          transcriptType: "final",
          text: "Yes, this is John from ABC Supply Company.",
          timestamp: Date.now() + 1000
        });
        await ctx.runMutation(api.vapiTranscripts.insert, {
          callId: testCallId,
          role: "assistant",
          transcriptType: "final",
          text: "Great! I'm calling about invoice INV-2024-001 for $5,000 that's overdue.",
          timestamp: Date.now() + 2000
        });
        await ctx.runMutation(api.vapiTranscripts.insert, {
          callId: testCallId,
          role: "user",
          transcriptType: "final",
          text: "Yes, I know about that invoice. We've been having some cash flow issues.",
          timestamp: Date.now() + 3000
        });
        await ctx.runMutation(api.vapiTranscripts.insert, {
          callId: testCallId,
          role: "assistant",
          transcriptType: "final",
          text: "I understand. Would you be able to make a partial payment today?",
          timestamp: Date.now() + 4000
        });
        await ctx.runMutation(api.vapiTranscripts.insert, {
          callId: testCallId,
          role: "user",
          transcriptType: "final",
          text: "Yes, I can pay $1,500 today as the first installment.",
          timestamp: Date.now() + 5000
        });
        await ctx.runMutation(api.vapiTranscripts.insert, {
          callId: testCallId,
          role: "assistant",
          transcriptType: "final",
          text: "That sounds good. Where should I send the payment link?",
          timestamp: Date.now() + 6000
        });
        await ctx.runMutation(api.vapiTranscripts.insert, {
          callId: testCallId,
          role: "user",
          transcriptType: "final",
          text: "Please send it to john.doe@abcsupply.com",
          timestamp: Date.now() + 7000
        });
        console.log("📝 Inserted rich default transcript for comprehensive testing");
      }

      const result: any = await ctx.runAction(api.email.sendPostCallEmail, {
        vendorId: args.vendorId,
        callId: testCallId,
        callOutcome: args.callOutcome || "assistant-ended-call",
        callDuration: 120 // 2 minutes
      });

      console.log("✅ Test email result:", result);
      console.log(`💰 Extracted amount: ${result.extractedAmount ? '$' + (result.extractedAmount / 100).toFixed(2) : 'None'}`);
      console.log(`🏢 Extracted company: ${result.extractedCompanyName || 'None'}`);
      console.log(`📧 Extracted email: ${result.extractedEmail || 'None'}`);
      console.log(`🔗 Payment link: ${result.paymentLink}`);
      console.log(`📨 Email sent to: ${result.emailSent?.to || 'Failed'}`);
      console.log(`📬 Email subject: ${result.emailSent?.subject || 'N/A'}`);
      
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

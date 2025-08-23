import { action } from "./_generated/server";
import { v } from "convex/values";
import { api } from "./_generated/api";

/**
 * Example test scenarios for the enhanced post-call email system
 */

export const runFullEmailTest = action({
  args: {},
  handler: async (ctx): Promise<any> => {
    console.log("🚀 Running full email integration test...");
    
    try {
      // First, get a vendor to test with
      const vendorsList = await ctx.runAction(api.testEmail.listVendorsForTesting, {});
      
      if (!vendorsList.vendors || vendorsList.vendors.length === 0) {
        return {
          success: false,
          error: "No vendors found for testing. Please create a vendor first."
        };
      }

      const testVendor = vendorsList.vendors[0];
      console.log(`📋 Testing with vendor: ${testVendor.name} (${testVendor._id})`);

      // Test scenarios with different payment amounts
      const testScenarios = [
        {
          name: "Successful call with payment agreement",
          callOutcome: "assistant-ended-call",
          mockTranscript: "Customer: I can pay $150 today to settle this invoice. Agent: Great, I'll send you a payment link for $150."
        },
        {
          name: "Customer hung up",
          callOutcome: "customer-ended-call", 
          mockTranscript: "Agent: Hello, this is regarding your outstanding invoice. Customer: [call ended]"
        },
        {
          name: "Payment plan discussed",
          callOutcome: "assistant-ended-call",
          mockTranscript: "Agent: Can you pay $75 now and $75 next month? Customer: Yes, I'll pay $75 today."
        }
      ];

      const results = [];

      for (const scenario of testScenarios) {
        console.log(`\n🧪 Testing scenario: ${scenario.name}`);
        
        const result = await ctx.runAction(api.testEmail.testPostCallEmail, {
          vendorId: testVendor._id,
          callOutcome: scenario.callOutcome,
          mockTranscript: scenario.mockTranscript
        });

        results.push({
          scenario: scenario.name,
          result: result
        });

        console.log(`✅ Result: ${result.success ? 'SUCCESS' : 'FAILED'}`);
        if (result.extractedAmount) {
          console.log(`💰 Extracted: $${(result.extractedAmount / 100).toFixed(2)}`);
        }
      }

      console.log("\n🎯 Test Summary:");
      console.log("- All emails sent to: sandcastleyc@gmail.com");
      console.log("- Payment link: https://buy.stripe.com/test_3cI14peBf5NqePJ6ss6EU02");
      console.log("- OpenAI extracted payment amounts from transcripts");
      console.log("- Test card: 4242 4242 4242 4242");

      return {
        success: true,
        message: "Full email test completed",
        testVendor: testVendor,
        results: results
      };

    } catch (error: any) {
      console.error("❌ Full test failed:", error);
      return {
        success: false,
        error: error.message
      };
    }
  }
});

/**
 * Quick test with a specific payment amount
 */
export const quickPaymentTest = action({
  args: {
    paymentAmount: v.string(), // e.g., "$50", "$125.50"
  },
  handler: async (ctx, args): Promise<any> => {
    console.log(`🚀 Quick test: extracting payment amount from "${args.paymentAmount}"`);
    
    try {
      const vendorsList = await ctx.runAction(api.testEmail.listVendorsForTesting, {});
      
      if (!vendorsList.vendors || vendorsList.vendors.length === 0) {
        return { success: false, error: "No vendors found" };
      }

      const testVendor = vendorsList.vendors[0];
      const mockTranscript = `Agent: Can you pay ${args.paymentAmount} today? Customer: Yes, I'll pay ${args.paymentAmount} right now.`;

      const result = await ctx.runAction(api.testEmail.testPostCallEmail, {
        vendorId: testVendor._id,
        callOutcome: "assistant-ended-call",
        mockTranscript: mockTranscript
      });

      console.log(`✅ Quick test result:`);
      console.log(`- Input: "${args.paymentAmount}"`);
      console.log(`- Extracted: ${result.extractedAmount ? '$' + (result.extractedAmount / 100).toFixed(2) : 'None'}`);
      console.log(`- Email sent: ${result.success}`);

      return result;

    } catch (error: any) {
      return {
        success: false,
        error: error.message
      };
    }
  }
});

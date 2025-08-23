import { action } from "./_generated/server";
import { v } from "convex/values";
import { api } from "./_generated/api";

export const initiateCall = action({
  args: {
    phoneNumber: v.string(),
    vendorId: v.id("vendors"),
    invoiceId: v.id("invoices"),
    vendorName: v.string(),
    vendorEmail: v.string(),
    invoiceNo: v.string(),
    invoiceAmountCents: v.number(),
    invoiceDueDate: v.string(),
    companyName: v.string(),
  },
  handler: async (ctx, args) => {
    // VAPI credentials from environment - updated with latest values
    const VAPI_API_KEY = process.env.VAPI_API_KEY || "7bbc83c3-a229-45dd-b667-10e53cb7b252";
    const VAPI_ASSISTANT_ID = process.env.VAPI_ASSISTANT_ID || "f46020f1-db66-4a0b-8cb4-956d94454110";
    const VAPI_PHONE_NUMBER_ID = process.env.VAPI_PHONE_NUMBER_ID || "5f95b4e2-ecfc-4733-8d3e-8ce6d216baf6";
    
    // Format the amount for display
    const formattedAmount = `$${(args.invoiceAmountCents / 100).toFixed(2)}`;
    const minPaymentAmount = `$${(args.invoiceAmountCents * 0.25 / 100).toFixed(2)}`;
    
    // Ensure phone number is in E.164 format
    let phoneNumber = args.phoneNumber;
    if (!phoneNumber.startsWith('+')) {
      phoneNumber = '+' + phoneNumber;
    }
    
    console.log(`Initiating VAPI call to ${phoneNumber} for invoice ${args.invoiceNo}`);
    
    // Build the VAPI call request
    // Compute current datetime values for the assistant
    const timeZone = "America/New_York";
    const now = new Date();
    const datetimeISO = now.toISOString();
    const datetimeHuman = new Intl.DateTimeFormat("en-US", {
      timeZone,
      weekday: "short",
      month: "short",
      day: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    }).format(now);

    const vapiRequest = {
      assistantId: VAPI_ASSISTANT_ID,
      phoneNumberId: VAPI_PHONE_NUMBER_ID,
      customer: {
        number: phoneNumber,
        name: args.vendorName,
        email: args.vendorEmail,
      },
      assistantOverrides: {
        variableValues: {
          // Invoice details
          companyName: args.companyName,
          invoiceNo: args.invoiceNo,
          formattedAmount: formattedAmount,
          formattedDueDate: args.invoiceDueDate,
          invoiceAmountCents: args.invoiceAmountCents,
          
          // Negotiation parameters
          minPaymentPercentage: 25,
          minPaymentAmount: minPaymentAmount,
          maxInstallments: 3,
          maxDaysToSettle: 30,
          allowZeroTodayIfDaysLateLt: 7,
          discountPercentage: 2.0,
          discountIfFullTodayBps: 200,
          lateFeeWaive: true,
          
          // Vendor info
          vendorName: args.vendorName,
          vendorId: args.vendorId,
          invoiceId: args.invoiceId,
          vendorEmail: args.vendorEmail,
          
          // System info
          currentAttemptNumber: 1,
          maxAttemptsPerWeek: 3,
          neverCollectCardOnCall: true,
          contactWindowStart: "09:00",
          contactWindowEnd: "17:00",
          timezone: timeZone,
          // Datetime values expected by the assistant prompt
          // `datetime` is a human-readable local time string; `datetimeISO` is UTC ISO-8601.
          datetime: datetimeHuman,
          datetimeISO,
          
          // Additional context
          email: args.vendorEmail,
          historicalMode: "standard",
          lastOutcome: "n/a",
          lastPromiseDate: "n/a",
          totalRecovered: "0.00",
          totalOutstanding: formattedAmount,
          suggestedDate: "within 7 days",
          allowedTools: ["payments", "email"],
          allowedToolsList: "payments, email",
          agentMailFrom: "collections@techflow.com",
          vendorNotes: "",
          vendorDoNotCall: false,
          vendorMinPaymentPercentage: 30,
        },
        // Configure webhook to receive call updates
        serverMessages: [
          "transcript",
          "end-of-call-report",
          "function-call",
          "status-update",
          "speech-update"
        ],
        server: {
          url: "https://scintillating-sturgeon-599.convex.site/vapi",
          timeoutSeconds: 20
        },
        // Don't override voice - use assistant's configured voice
        // Set max call duration
        maxDurationSeconds: 600, // 10 minutes max
        
        // Enable call recording
        artifactPlan: {
          recordingEnabled: true,
          transcriptPlan: {
            enabled: true,
            assistantName: "Collections Agent",
            userName: args.vendorName
          }
        },
        // Add metadata for tracking
        metadata: {
          vendorId: args.vendorId,
          invoiceId: args.invoiceId,
          invoiceNo: args.invoiceNo,
          companyName: args.companyName
        }
      }
    };
    
    try {
      // Make the API call to VAPI
      const response = await fetch("https://api.vapi.ai/call", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${VAPI_API_KEY}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(vapiRequest)
      });
      
      if (!response.ok) {
        const error = await response.text();
        console.error("VAPI error response:", error);
        throw new Error(`VAPI call failed: ${response.status} - ${error}`);
      }
      
      const result = await response.json();
      console.log("VAPI call initiated successfully:", result);
      
      // Store call record in Convex
      await ctx.runMutation(api.vapiCalls.create, {
        callId: result.id,
        status: result.status || "queued",
        phoneNumber: phoneNumber,
        assistantId: VAPI_ASSISTANT_ID,
        createdAt: Date.now()
      });
      
      // Create an attempt record
      await ctx.runMutation(api.attempts.create, {
        vendorId: args.vendorId,
        invoiceId: args.invoiceId,
        channel: "voice",
        callId: result.id
      });
      
      return {
        success: true,
        callId: result.id,
        status: result.status,
        phoneNumber: phoneNumber
      };
      
    } catch (error: any) {
      console.error("Failed to initiate VAPI call:", error);
      throw new Error(`Failed to initiate call: ${error.message}`);
    }
  }
});

// Get call status
export const getCallStatus = action({
  args: { callId: v.string() },
  handler: async (ctx, args) => {
    const VAPI_API_KEY = process.env.VAPI_API_KEY || "7bbc83c3-a229-45dd-b667-10e53cb7b252";
    
    try {
      const response = await fetch(`https://api.vapi.ai/call/${args.callId}`, {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${VAPI_API_KEY}`
        }
      });
      
      if (!response.ok) {
        throw new Error(`Failed to get call status: ${response.status}`);
      }
      
      const data = await response.json();
      
      return {
        success: true,
        callId: args.callId,
        status: data.status,
        startedAt: data.startedAt,
        endedAt: data.endedAt,
        duration: data.duration,
        transcript: data.transcript || []
      };
    } catch (error: any) {
      console.error("Failed to get call status:", error);
      return {
        success: false,
        error: error.message
      };
    }
  }
});

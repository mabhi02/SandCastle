import { httpAction } from "./_generated/server";
import { api } from "./_generated/api";
import { v } from "convex/values";

function safeEqual(a: string, b: string) {
  if (a.length !== b.length) return false;
  let r = 0;
  for (let i = 0; i < a.length; i++) r |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return r === 0;
}

export const vapiWebhook = httpAction(async (ctx, request) => {
  // 1) Optional signature verification - only check if secret is configured
  const sig = request.headers.get("X-Vapi-Signature");
  const expected = process.env.VAPI_WEBHOOK_SECRET;
  
  // Only verify if a secret is configured
  if (expected && expected !== "" && expected !== "none") {
    if (!sig || !safeEqual(sig, expected)) {
      console.error("Unauthorized VAPI webhook attempt");
      return new Response("unauthorized", { status: 401 });
    }
  } else {
    console.log("VAPI webhook received (no auth required)");
  }

  // 2) Parse the request body
  const body = await request.json().catch(() => null);
  if (!body) {
    return new Response("invalid body", { status: 400 });
  }

  const msg = body?.message;
  if (!msg?.type) {
    console.log("No message type in VAPI webhook");
    return new Response(null, { status: 200 });
  }

  const callId = msg.call?.id ?? "unknown";
  const timestamp = msg.timestamp ?? Date.now();

  console.log(`VAPI webhook received: ${msg.type} for call ${callId}`);

  try {
    // Handle different VAPI event types
    switch (msg.type) {
      case "transcript":
      case 'transcript[transcriptType="final"]':
        // Store transcript data
        await ctx.runMutation(api.vapiTranscripts.insert, {
          callId,
          role: msg.role,
          transcriptType: msg.transcriptType ?? "final",
          text: msg.transcript,
          timestamp,
        });
        break;

      case "end-of-call-report":
        // Store end of call report
        await ctx.runMutation(api.vapiCalls.upsertReport, {
          callId,
          artifact: msg.artifact,
          endedReason: msg.endedReason,
          timestamp,
          phoneNumber: msg.customer?.number,
          assistantId: msg.assistant?.id,
          recordingUrl: msg.recordingUrl,
          stereoRecordingUrl: msg.stereoRecordingUrl,
          cost: msg.cost,
          costBreakdown: msg.costBreakdown,
        });

        // Update vendor state if there's an associated vendor
        if (msg.metadata?.vendorId) {
          await ctx.runMutation(api.vendorState.updateFromCall, {
            vendorId: msg.metadata.vendorId,
            outcome: msg.endedReason,
            callId,
          });
        }
        break;

      case "status-update":
        // Update call status
        await ctx.runMutation(api.vapiCalls.updateStatus, {
          callId,
          status: msg.status,
          timestamp,
        });
        break;

      case "function-call":
        // Handle function calls from VAPI assistant
        const functionName = msg.functionCall?.name;
        const functionArgs = msg.functionCall?.parameters;
        
        console.log(`VAPI function call: ${functionName}`, functionArgs);
        
        // Route to appropriate handler based on function name
        let result = null;
        
        switch (functionName) {
          case "send_payment_link":
            result = await ctx.runMutation(api.payments.createPaymentLink, {
              vendorId: functionArgs.vendorId,
              invoiceId: functionArgs.invoiceId,
              amountCents: functionArgs.amountCents,
              email: functionArgs.email,
            });
            break;
          
          case "schedule_callback":
            result = await ctx.runMutation(api.vendorState.scheduleFollowUp, {
              vendorId: functionArgs.vendorId,
              followUpDate: functionArgs.date,
              reason: functionArgs.reason,
            });
            break;
          
          case "update_invoice_state":
            result = await ctx.runMutation(api.invoices.updateState, {
              invoiceId: functionArgs.invoiceId,
              state: functionArgs.state,
              memo: functionArgs.memo,
            });
            break;
        }
        
        // Return function result to VAPI
        return new Response(JSON.stringify({ result }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });

      case "tool-calls":
        // Handle tool calls (similar to function calls but for external tools)
        console.log("VAPI tool calls:", msg.toolCalls);
        break;

      case "speech-update":
        // Real-time speech updates (optional to store)
        if (msg.role === "assistant") {
          console.log("Assistant speech:", msg.transcript);
        }
        break;

      default:
        console.log(`Unhandled VAPI event type: ${msg.type}`);
    }

    return new Response(null, { status: 200 });
  } catch (error) {
    console.error("Error processing VAPI webhook:", error);
    return new Response("internal error", { status: 500 });
  }
});
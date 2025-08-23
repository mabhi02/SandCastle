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
  }

  // 2) Parse the request body
  const body = await request.json().catch(() => null);
  if (!body) {
    return new Response("invalid body", { status: 400 });
  }

  const msg = body?.message;
  if (!msg?.type) {
    console.log("VAPI webhook - no message type, raw body:", JSON.stringify(body).slice(0, 200));
    return new Response(null, { status: 200 });
  }

  const callId = msg.call?.id ?? msg.callId ?? "unknown";
  const timestamp = msg.timestamp ?? Date.now();

  console.log(`VAPI webhook: ${msg.type} for call ${callId}`);
  
  // Log more details for debugging
  if (msg.type === "status-update") {
    console.log(`Call status: ${msg.status}, reason: ${msg.endedReason || 'N/A'}`);
  }
  if (msg.type === "end-of-call-report") {
    const duration = msg.call?.endedAt && msg.call?.startedAt 
      ? Math.round((new Date(msg.call.endedAt).getTime() - new Date(msg.call.startedAt).getTime()) / 1000)
      : msg.duration || 0;
    console.log(`Call ended. Reason: ${msg.endedReason}, Duration: ${duration}s`);
    if (msg.error) {
      console.error(`Call error: ${msg.error}`);
    }
  }

  try {
    // Handle different VAPI event types
    switch (msg.type) {
      case "transcript":
      case 'transcript[transcriptType="final"]':
      case "transcript-final":
        // VAPI sends transcript in msg.transcript and role in msg.role
        const transcriptText = msg.transcript;
        const transcriptRole = msg.role || "assistant";
        
        if (transcriptText) {
          await ctx.runMutation(api.vapiTranscripts.insert, {
            callId,
            role: transcriptRole,
            transcriptType: msg.transcriptType ?? "final",
            text: transcriptText,
            timestamp,
          });
          console.log(`✅ Stored transcript: [${transcriptRole}] ${transcriptText}`);
        }
        break;

      case "end-of-call-report":
        // Store end of call report with all available data
        const reportData: any = {
          callId,
          timestamp,
          endedReason: msg.endedReason,
        };
        
        // Add optional fields if they exist
        if (msg.artifact) reportData.artifact = msg.artifact;
        if (msg.customer?.number) reportData.phoneNumber = msg.customer.number;
        if (msg.assistant?.id) reportData.assistantId = msg.assistant.id;
        if (msg.recordingUrl) reportData.recordingUrl = msg.recordingUrl;
        if (msg.stereoRecordingUrl) reportData.stereoRecordingUrl = msg.stereoRecordingUrl;
        if (msg.cost !== undefined) reportData.cost = msg.cost;
        if (msg.costBreakdown) reportData.costBreakdown = msg.costBreakdown;
        
        await ctx.runMutation(api.vapiCalls.upsertReport, reportData);

        // Update vendor state if there's an associated vendor
        const metadata = msg.metadata || msg.assistant?.metadata;
        if (metadata?.vendorId) {
          await ctx.runMutation(api.vendorState.updateFromCall, {
            vendorId: metadata.vendorId,
            outcome: msg.endedReason || "completed",
            callId,
          });
          
          // Update invoice state based on call outcome
          if (metadata.invoiceId && msg.endedReason === "assistant-ended-call") {
            // Check if payment was promised in the transcript
            const transcripts = msg.artifact?.messages || [];
            const hasPaymentPromise = transcripts.some((t: any) => 
              t.message?.toLowerCase().includes("payment") && 
              t.message?.toLowerCase().includes("send")
            );
            
            if (hasPaymentPromise) {
              await ctx.runMutation(api.invoices.updateState, {
                invoiceId: metadata.invoiceId,
                state: "PromiseToPay",
                memo: "Customer agreed to payment during call"
              });
            }
          }

          // Send post-call follow-up email via AgentMail
          try {
            const callDuration = msg.call?.endedAt && msg.call?.startedAt 
              ? Math.round((new Date(msg.call.endedAt).getTime() - new Date(msg.call.startedAt).getTime()) / 1000)
              : msg.duration || 0;

            await ctx.scheduler.runAfter(0, api.email.sendPostCallEmail, {
              vendorId: metadata.vendorId,
              callId,
              callOutcome: msg.endedReason,
              callDuration
            });

            console.log(`✅ Scheduled post-call email for vendor ${metadata.vendorId}`);
          } catch (emailError: any) {
            console.error("Failed to schedule post-call email:", emailError);
            // Don't throw - we don't want email failures to break call processing
          }
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
        const functionArgs = msg.functionCall?.parameters || {};
        
        console.log(`VAPI function call: ${functionName}`, functionArgs);
        
        // Get metadata from the call
        const callMetadata = msg.call?.assistantOverrides?.metadata || msg.metadata || {};
        
        // Route to appropriate handler based on function name
        let result: any = { success: false, message: "Unknown function" };
        
        switch (functionName) {
          case "send_payment_link":
            try {
              // Create payment link
              const paymentResult = await ctx.runMutation(api.payments.createPaymentLink, {
                vendorId: callMetadata.vendorId || functionArgs.vendorId,
                invoiceId: callMetadata.invoiceId || functionArgs.invoiceId,
                amountCents: functionArgs.amountCents || callMetadata.invoiceAmountCents,
                email: functionArgs.email || callMetadata.vendorEmail,
              });
              
              // Send email with payment link (schedule as action)
              await ctx.scheduler.runAfter(0, api.email.sendPaymentEmail, {
                email: functionArgs.email || callMetadata.vendorEmail,
                vendorName: callMetadata.vendorName || "Valued Customer",
                invoiceNo: callMetadata.invoiceNo || "INV-001",
                amount: functionArgs.amountCents || callMetadata.invoiceAmountCents,
                paymentUrl: paymentResult.linkUrl,
                discount: functionArgs.discount || 0,
              });
              
              result = {
                success: true,
                message: "Payment link sent successfully",
                paymentUrl: paymentResult.linkUrl
              };
            } catch (error: any) {
              console.error("Error sending payment link:", error);
              result = {
                success: false,
                message: "Failed to send payment link",
                error: error.message
              };
            }
            break;
          
          case "schedule_callback":
            try {
              await ctx.runMutation(api.vendorState.scheduleFollowUp, {
                vendorId: callMetadata.vendorId || functionArgs.vendorId,
                followUpDate: functionArgs.date || functionArgs.followUpDate,
                reason: functionArgs.reason || "Follow-up scheduled by AI",
              });
              
              result = {
                success: true,
                message: `Callback scheduled for ${functionArgs.date}`
              };
            } catch (error: any) {
              console.error("Error scheduling callback:", error);
              result = {
                success: false,
                message: "Failed to schedule callback",
                error: error.message
              };
            }
            break;
          
          case "update_invoice_state":
            try {
              await ctx.runMutation(api.invoices.updateState, {
                invoiceId: callMetadata.invoiceId || functionArgs.invoiceId,
                state: functionArgs.state || "InProgress",
                memo: functionArgs.memo || "Updated by AI during call",
              });
              
              result = {
                success: true,
                message: `Invoice state updated to ${functionArgs.state}`
              };
            } catch (error: any) {
              console.error("Error updating invoice state:", error);
              result = {
                success: false,
                message: "Failed to update invoice state",
                error: error.message
              };
            }
            break;
            
          case "get_payment_options":
            // Provide payment options to the AI
            const amountCents = callMetadata.invoiceAmountCents || 10000;
            const fullAmount = amountCents / 100;
            const discountAmount = fullAmount * 0.98; // 2% discount
            const installmentAmount = fullAmount / 3;
            
            result = {
              success: true,
              options: [
                {
                  type: "full_payment_discount",
                  amount: discountAmount,
                  description: `Pay $${discountAmount.toFixed(2)} today (2% discount)`,
                  savings: fullAmount - discountAmount
                },
                {
                  type: "full_payment",
                  amount: fullAmount,
                  description: `Pay $${fullAmount.toFixed(2)} today`
                },
                {
                  type: "installments",
                  amount: installmentAmount,
                  description: `3 monthly payments of $${installmentAmount.toFixed(2)}`,
                  totalAmount: fullAmount
                }
              ]
            };
            break;
            
          default:
            console.log(`Unknown function: ${functionName}`);
            result = {
              success: false,
              message: `Unknown function: ${functionName}`
            };
        }
        
        // Return function result to VAPI
        return new Response(JSON.stringify({ result }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });

      case "tool-calls":
        // Handle tool calls (similar to function calls but for external tools)
        console.log("VAPI tool calls:", msg.toolCalls);
        
        // Process each tool call
        const results = [];
        for (const toolCall of msg.toolCalls || []) {
          // Handle based on tool type
          console.log(`Processing tool: ${toolCall.name || toolCall.type}`);
          results.push({ success: true });
        }
        
        return new Response(JSON.stringify({ results }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });

      case "speech-update":
        // Store real-time speech updates for live transcription
        if (msg.transcript) {
          await ctx.runMutation(api.vapiTranscripts.insert, {
            callId,
            role: msg.role || "assistant",
            transcriptType: "speech",
            text: msg.transcript,
            timestamp,
          });
          console.log(`🎤 Live speech: [${msg.role}] ${msg.transcript}`);
        }
        break;
        
      case "conversation-update":
        // VAPI sends messages in msg.conversation.messages array
        const messages = msg.conversation?.messages || [];
          
        if (Array.isArray(messages) && messages.length > 0) {
          // Only store the latest message to avoid duplicates
          const latestMessage = messages[messages.length - 1];
          if (latestMessage && latestMessage.content) {
            await ctx.runMutation(api.vapiTranscripts.insert, {
              callId,
              role: latestMessage.role || "assistant",
              transcriptType: "conversation",
              text: latestMessage.content,
              timestamp: latestMessage.timestamp || timestamp,
            });
            console.log(`✅ Stored conversation: [${latestMessage.role}] ${latestMessage.content}`);
          }
        }
        break;

      default:
        console.log(`Unhandled VAPI event: ${msg.type}`);
    }

    return new Response(null, { status: 200 });
  } catch (error) {
    console.error("Error processing VAPI webhook:", error);
    return new Response("internal error", { status: 500 });
  }
});
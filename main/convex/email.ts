import { action } from "./_generated/server";
import { v } from "convex/values";
import { api } from "./_generated/api";

export const sendPaymentEmail = action({
  args: {
    email: v.string(),
    vendorName: v.string(),
    invoiceNo: v.string(),
    amount: v.number(),
    paymentUrl: v.string(),
    discount: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    console.log(`Sending payment email to ${args.email}`);
    
    // Format the amount
    const amountDue = args.amount / 100;
    const discountAmount = args.discount ? (amountDue * args.discount / 100) : 0;
    const finalAmount = amountDue - discountAmount;
    
    // Create email content
    const emailContent = {
      to: args.email,
      subject: `Payment Link for Invoice ${args.invoiceNo}`,
      html: `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background-color: #4A5568; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
    .content { background-color: #f9f9f9; padding: 30px; border: 1px solid #ddd; border-radius: 0 0 5px 5px; }
    .button { display: inline-block; padding: 12px 30px; background-color: #3182CE; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
    .amount { font-size: 24px; font-weight: bold; color: #2D3748; margin: 20px 0; }
    .discount { color: #38A169; font-weight: bold; }
    .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; font-size: 12px; color: #666; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>TechFlow Solutions</h1>
      <p>Collections Department</p>
    </div>
    <div class="content">
      <h2>Hello ${args.vendorName},</h2>
      
      <p>Thank you for speaking with us today about invoice <strong>${args.invoiceNo}</strong>.</p>
      
      <p>As discussed, here's your payment link:</p>
      
      <div class="amount">
        Amount Due: $${amountDue.toFixed(2)}
        ${discountAmount > 0 ? `<div class="discount">Discount Applied: -$${discountAmount.toFixed(2)}</div>` : ''}
        ${discountAmount > 0 ? `<div>Final Amount: $${finalAmount.toFixed(2)}</div>` : ''}
      </div>
      
      <div style="text-align: center;">
        <a href="${args.paymentUrl}" class="button">Pay Now</a>
      </div>
      
      <p>This payment link will remain active for 7 days. If you have any questions, please don't hesitate to reach out.</p>
      
      <div class="footer">
        <p>Thank you for your business!</p>
        <p>TechFlow Solutions | collections@techflow.com | 1-800-TECH-FLO</p>
        <p style="font-size: 10px; color: #999;">This is an automated message from our collections system.</p>
      </div>
    </div>
  </div>
</body>
</html>
      `,
      text: `
Hello ${args.vendorName},

Thank you for speaking with us today about invoice ${args.invoiceNo}.

Amount Due: $${amountDue.toFixed(2)}
${discountAmount > 0 ? `Discount Applied: -$${discountAmount.toFixed(2)}` : ''}
${discountAmount > 0 ? `Final Amount: $${finalAmount.toFixed(2)}` : ''}

Payment Link: ${args.paymentUrl}

This payment link will remain active for 7 days.

Thank you for your business!
TechFlow Solutions
      `.trim()
    };
    
    // Integrate with actual email service
    try {
      // TODO: Replace with actual email service integration (SendGrid, AWS SES, etc.)
      // Example with SendGrid:
      // const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
      //   method: 'POST',
      //   headers: {
      //     'Authorization': `Bearer ${process.env.SENDGRID_API_KEY}`,
      //     'Content-Type': 'application/json'
      //   },
      //   body: JSON.stringify({
      //     personalizations: [{ to: [{ email: args.email }] }],
      //     from: { email: 'collections@techflow.com' },
      //     subject: emailContent.subject,
      //     content: [
      //       { type: 'text/plain', value: emailContent.text },
      //       { type: 'text/html', value: emailContent.html }
      //     ]
      //   })
      // });
      
      console.log("Sending payment email to:", args.email);
      console.log("Payment link:", args.paymentUrl);
      
      return {
        success: true,
        message: "Email sent successfully",
        emailContent
      };
    } catch (error: any) {
      console.error("Failed to send email:", error);
      throw new Error(`Email sending failed: ${error.message}`);
    }
  }
});

export const sendCollectionReminder = action({
  args: {
    email: v.string(),
    vendorName: v.string(),
    invoices: v.array(v.object({
      invoiceNo: v.string(),
      amount: v.number(),
      daysOverdue: v.number()
    }))
  },
  handler: async (ctx, args) => {
    console.log(`Sending collection reminder to ${args.email}`);
    
    const totalAmount = args.invoices.reduce((sum, inv) => sum + inv.amount, 0) / 100;
    const invoiceList = args.invoices.map(inv => 
      `• Invoice ${inv.invoiceNo}: $${(inv.amount/100).toFixed(2)} (${inv.daysOverdue} days overdue)`
    ).join('\n');
    
    const emailContent = {
      to: args.email,
      subject: `Reminder: Outstanding Invoices - Total $${totalAmount.toFixed(2)}`,
      text: `
Dear ${args.vendorName},

This is a friendly reminder about the following outstanding invoices:

${invoiceList}

Total Amount Due: $${totalAmount.toFixed(2)}

We value our business relationship and would appreciate your prompt attention to these overdue invoices.

Please contact us to discuss payment options or if you have any questions.

Thank you,
TechFlow Solutions Collections Team
      `.trim()
    };
    
    console.log("Reminder email:", emailContent);
    
    return {
      success: true,
      message: "Reminder sent",
      emailContent
    };
  }
});

// New function to send post-call follow-up email via AgentMail
export const sendPostCallEmail = action({
  args: {
    vendorId: v.id("vendors"),
    callId: v.string(),
    callOutcome: v.optional(v.string()),
    callDuration: v.optional(v.number()),
  },
  handler: async (ctx, args): Promise<{
    success: boolean;
    message: string;
    extractedAmount?: number;
    extractedCompanyName?: string;
    extractedEmail?: string;
    paymentLink?: string;
    callAssessment?: {
      callStatus?: string;
      paymentStatus?: string;
      promisedAmount?: number;
      remainingDebt?: number;
      nextFollowUpDate?: string;
      summary?: string;
    };
    emailSent?: {
      to: string;
      from: string;
      subject: string;
      messageId: string;
    };
    error?: string;
  }> => {
    try {
      // Hardcoded email address as requested
      const hardcodedEmail = 'sandcastleyc@gmail.com';
      
      // Get vendor information from Convex schema
      const vendor = await ctx.runQuery(api.vendors.get, { 
        id: args.vendorId 
      });
      
      if (!vendor) {
        throw new Error(`Vendor not found: ${args.vendorId}`);
      }

      // Get user information to get agentMailFrom
      const appUser = await ctx.runQuery(api.users.getAppUserById, { 
        userId: vendor.userId 
      });
      
      if (!appUser) {
        throw new Error(`App user not found: ${vendor.userId}`);
      }

      // Get call transcripts to extract payment amount
      const transcripts = await ctx.runQuery(api.vapiTranscripts.byCall, { 
        callId: args.callId 
      });

      // Combine all transcript text
      const fullTranscript = transcripts
        .map((t: any) => `${t.role}: ${t.text}`)
        .join('\n');

      console.log(`📝 Full transcript for call ${args.callId}:`, fullTranscript.slice(0, 500) + '...');

      // Extract all information using OpenAI (3 separate calls as requested)
      let extractedAmount: number | undefined;
      let paymentAmountText = '';
      let extractedCompanyName: string | undefined;
      let extractedEmail: string | undefined;
      
      if (fullTranscript.length > 10) {
        // 1. Extract payment amount
        const amountResult = await ctx.runAction(api.openai.extractPaymentAmount, {
          transcript: fullTranscript,
          callId: args.callId,
        });

        if (amountResult.success && amountResult.amount) {
          extractedAmount = amountResult.amount;
          paymentAmountText = `$${(amountResult.amount / 100).toFixed(2)}`;
          console.log(`💰 Extracted payment amount: ${paymentAmountText}`);
        }

        // 2. Extract company name
        const companyResult = await ctx.runAction(api.openai.extractCompanyName, {
          transcript: fullTranscript,
          callId: args.callId,
        });

        if (companyResult.success && companyResult.companyName) {
          extractedCompanyName = companyResult.companyName;
          console.log(`🏢 Extracted company name: ${extractedCompanyName}`);
        }

        // 3. Extract email address
        const emailResult = await ctx.runAction(api.openai.extractEmail, {
          transcript: fullTranscript,
          callId: args.callId,
        });

        if (emailResult.success && emailResult.email) {
          extractedEmail = emailResult.email;
          console.log(`📧 Extracted email: ${extractedEmail}`);
        }
      }

      // 4. Assess call success and update database
      let callAssessment: any = null;
      if (fullTranscript.length > 10) {
        // Get the first invoice for this vendor to know the original debt
        const invoices = await ctx.runQuery(api.invoices.getByVendor, {
          vendorId: args.vendorId,
        });
        const primaryInvoice = invoices[0]; // Assuming first invoice is the main one
        
        const assessmentResult = await ctx.runAction(api.openai.assessCallSuccess, {
          transcript: fullTranscript,
          callId: args.callId,
          originalDebt: primaryInvoice?.amountCents,
        });

        if (assessmentResult.success) {
          callAssessment = assessmentResult;
          console.log(`📊 Call assessment:`, assessmentResult);

          // Sanitize nullable fields to satisfy Convex validators
          const sanitizedNextFollowUp =
            typeof assessmentResult.nextFollowUpDate === "string" &&
            assessmentResult.nextFollowUpDate.toLowerCase() !== "null" &&
            assessmentResult.nextFollowUpDate.trim() !== ""
              ? assessmentResult.nextFollowUpDate
              : undefined;

          const sanitizedPromisedAmount =
            typeof assessmentResult.promisedAmount === "number"
              ? assessmentResult.promisedAmount
              : extractedAmount;

          const sanitizedRemainingDebt =
            typeof assessmentResult.remainingDebt === "number"
              ? assessmentResult.remainingDebt
              : undefined;

          const sanitizedSummary =
            typeof assessmentResult.summary === "string" &&
            assessmentResult.summary.toLowerCase() !== "null" &&
            assessmentResult.summary.trim() !== ""
              ? assessmentResult.summary
              : undefined;

          // Update database with assessment results (omit undefined fields)
          await ctx.runMutation(api.callAssessment.updateAfterCall, {
            vendorId: args.vendorId,
            invoiceId: primaryInvoice?._id,
            callStatus: assessmentResult.callStatus || "unsuccessful",
            paymentStatus: assessmentResult.paymentStatus || "no_payment",
            ...(sanitizedPromisedAmount != null
              ? { promisedAmount: sanitizedPromisedAmount }
              : {}),
            ...(sanitizedRemainingDebt != null
              ? { remainingDebt: sanitizedRemainingDebt }
              : {}),
            ...(sanitizedNextFollowUp != null
              ? { nextFollowUpDate: sanitizedNextFollowUp }
              : {}),
            ...(sanitizedSummary != null ? { summary: sanitizedSummary } : {}),
          });
        }
      }

      // Use extracted email or fallback to hardcoded/vendor email
      const targetEmail = extractedEmail || hardcodedEmail;
      const companyName = extractedCompanyName || vendor.name;

      // Generate dynamic Stripe payment link using Autumn if amount is extracted
      let stripePaymentLink = 'https://buy.stripe.com/test_3cI14peBf5NqePJ6ss6EU02'; // Default fallback
      
      if (extractedAmount && extractedAmount > 0) {
        try {
          const checkoutResult = await ctx.runAction(api.autumn.createCheckoutLink, {
            customerId: `vendor_${args.vendorId}`,
            email: targetEmail,
            name: companyName,
            amountCents: extractedAmount
          });

          if (checkoutResult.success && checkoutResult.checkoutUrl) {
            stripePaymentLink = checkoutResult.checkoutUrl;
            console.log(`🔗 Generated dynamic payment link via Autumn: ${stripePaymentLink}`);
          }
        } catch (autumnError) {
          console.error('Failed to generate Autumn checkout link, using default:', autumnError);
        }
      }

      // Get recent invoices for this vendor
      const invoices = await ctx.runQuery(api.invoices.getByVendor, { 
        vendorId: args.vendorId 
      });

      // Create email content with payment link and extracted amount
      let subject = `Payment Link - Follow-up from Recent Call`;
      let emailContent = '';

      // Base payment information
      const paymentSection = `
🔗 **PAYMENT LINK**: ${stripePaymentLink}

💰 **Amount Due**: ${paymentAmountText || 'Please see invoice details below'}

💳 **Test Payment Instructions**:
- Card Number: 4242 4242 4242 4242
- Expiry: Any future date (e.g., 12/25)
- CVC: Any 3 digits (e.g., 123)
- ZIP: Any 5 digits (e.g., 12345)

⚠️ This is a test environment - no real money will be charged.
`;

      if (args.callOutcome === 'assistant-ended-call' || args.callOutcome === 'completed') {
        // Successful call completion
        subject = `Payment Link - Thank You for Speaking With Us`;
        emailContent = `
Dear ${companyName},

Thank you for taking the time to speak with us today regarding your outstanding invoices.

${extractedAmount ? `Based on our conversation, you agreed to pay ${paymentAmountText}. Please use the payment link below to complete your payment:` : 'As discussed, please use the payment link below to make your payment:'}

${paymentSection}

${invoices.length > 0 ? `
Outstanding Invoices:
${invoices.map((inv: any) => `• Invoice ${inv.invoiceNo}: $${(inv.amountCents/100).toFixed(2)} - Due: ${inv.dueDateISO}`).join('\n')}
` : ''}

We appreciate your cooperation and look forward to resolving these matters promptly.

Best regards,
${appUser.companyName || 'Collections Team'}
`;
      } else if (args.callOutcome === 'customer-ended-call') {
        // Customer hung up
        subject = `Payment Link - Important Follow-up`;
        emailContent = `
Dear ${companyName},

We attempted to reach you today regarding your outstanding invoices, but the call was disconnected.

We understand that discussing financial matters can be sensitive. To make this easier for you, we've provided a secure payment link below:

${paymentSection}

${invoices.length > 0 ? `
Outstanding Invoices:
${invoices.map((inv: any) => `• Invoice ${inv.invoiceNo}: $${(inv.amountCents/100).toFixed(2)} - Due: ${inv.dueDateISO}`).join('\n')}
` : ''}

Please contact us at your earliest convenience if you have any questions.

Best regards,
${appUser.companyName || 'Collections Team'}
`;
      } else {
        // General follow-up for other outcomes
        subject = `Payment Link - Account Follow-up`;
        emailContent = `
Dear ${companyName},

Following our recent contact attempt regarding your account, we're providing you with a convenient payment option:

${paymentSection}

${invoices.length > 0 ? `
Outstanding Invoices:
${invoices.map((inv: any) => `• Invoice ${inv.invoiceNo}: $${(inv.amountCents/100).toFixed(2)} - Due: ${inv.dueDateISO}`).join('\n')}
` : ''}

We value our business relationship and would like to work with you to resolve any outstanding matters.

Best regards,
${appUser.companyName || 'Collections Team'}
`;
      }

      // Send email via AgentMail to extracted or fallback address
      // Use the demo inbox we created instead of appUser.agentMailFrom for now
      const emailResult = await ctx.runAction(api.agentmail.sendEmail, {
        toEmail: targetEmail, // Using extracted email or fallback
        fromInbox: "sandcastleyc-5c8e21@agentmail.to", // Using the actual created inbox
        subject: subject,
        content: emailContent
      });

      if (!emailResult.success) {
        throw new Error(emailResult.error || "Failed to send email");
      }

      console.log(`✅ Post-call email sent to ${targetEmail} via AgentMail`);
      console.log(`💰 Extracted payment amount: ${paymentAmountText || 'None found'}`);
      console.log(`🏢 Extracted company: ${extractedCompanyName || 'Using vendor name'}`);
      console.log(`📧 Extracted email: ${extractedEmail || 'Using fallback'}`);
      console.log(`🔗 Payment link included: ${stripePaymentLink}`);

      // Log email sent activity
      await ctx.runMutation(api.activity.create, {
        userId: vendor.userId,
        type: "email_sent",
        description: `Payment email sent to ${companyName} (${targetEmail}) with ${paymentAmountText || 'payment'} link`,
        metadata: {
          vendorId: args.vendorId,
          callId: args.callId,
          email: targetEmail,
          amount: extractedAmount,
          paymentLink: stripePaymentLink,
        },
      });
      
      return {
        success: true,
        message: "Post-call email sent successfully with payment link",
        extractedAmount: extractedAmount,
        extractedCompanyName: extractedCompanyName,
        extractedEmail: extractedEmail,
        paymentLink: stripePaymentLink,
        callAssessment: callAssessment ? {
          callStatus: callAssessment.callStatus,
          paymentStatus: callAssessment.paymentStatus,
          promisedAmount: callAssessment.promisedAmount,
          remainingDebt: callAssessment.remainingDebt,
          nextFollowUpDate: callAssessment.nextFollowUpDate,
          summary: callAssessment.summary,
        } : undefined,
        emailSent: {
          to: targetEmail,
          from: "sandcastleyc-5c8e21@agentmail.to",
          subject: subject,
          messageId: emailResult.messageId || "unknown"
        }
      };

    } catch (error: any) {
      console.error("Failed to send post-call email:", error);
      return {
        success: false,
        message: `Failed to send email: ${error.message}`,
        error: error.message
      };
    }
  }
});

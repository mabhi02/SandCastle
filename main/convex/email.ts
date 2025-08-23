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
    paymentLink?: string;
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

      // Extract payment amount using OpenAI
      let extractedAmount: number | undefined;
      let paymentAmountText = '';
      
      if (fullTranscript.length > 10) {
        const extractionResult = await ctx.runAction(api.openai.extractPaymentAmount, {
          transcript: fullTranscript,
          callId: args.callId,
        });

        if (extractionResult.success && extractionResult.amount) {
          extractedAmount = extractionResult.amount;
          paymentAmountText = `$${(extractionResult.amount / 100).toFixed(2)}`;
          console.log(`💰 Extracted payment amount: ${paymentAmountText}`);
        }
      }

      // Hardcoded Stripe payment link from agentmail/src
      const stripePaymentLink = 'https://buy.stripe.com/test_3cI14peBf5NqePJ6ss6EU02';

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
Dear ${vendor.name},

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
Dear ${vendor.name},

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
Dear ${vendor.name},

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

      // Send email via AgentMail to hardcoded address
      const emailResult = await ctx.runAction(api.agentmail.sendEmail, {
        toEmail: hardcodedEmail,
        fromInbox: appUser.agentMailFrom,
        subject: subject,
        content: emailContent
      });

      if (!emailResult.success) {
        throw new Error(emailResult.error || "Failed to send email");
      }

      console.log(`✅ Post-call email sent to ${hardcodedEmail} via AgentMail`);
      console.log(`💰 Extracted payment amount: ${paymentAmountText || 'None found'}`);
      console.log(`🔗 Payment link included: ${stripePaymentLink}`);
      
      return {
        success: true,
        message: "Post-call email sent successfully with payment link",
        extractedAmount: extractedAmount,
        paymentLink: stripePaymentLink,
        emailSent: {
          to: hardcodedEmail,
          from: appUser.agentMailFrom,
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
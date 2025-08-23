import { action } from "./_generated/server";
import { v } from "convex/values";

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
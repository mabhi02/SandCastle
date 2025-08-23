import { action } from "./_generated/server";
import { v } from "convex/values";

/**
 * Send an email via AgentMail service
 * This is a wrapper around the agentmail functionality for use in Convex actions
 */
export const sendEmail = action({
  args: {
    toEmail: v.string(),
    fromInbox: v.string(),
    subject: v.string(),
    content: v.string(),
  },
  handler: async (ctx, args) => {
    try {
      // Get AgentMail API key from environment
      const apiKey = process.env.AGENTMAIL_API_KEY;
      if (!apiKey) {
        throw new Error('AGENTMAIL_API_KEY is not set');
      }

      // Determine if content is HTML or plain text
      const looksHtml = /<[^>]+>/.test(args.content);
      const text = looksHtml ? args.content.replace(/<[^>]+>/g, '') : args.content;
      const html = looksHtml ? args.content : `<p>${escapeHtml(args.content)}</p>`;

      // Make API call to AgentMail
      const response = await fetch('https://api.agentmail.to/v1/inboxes/messages', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          inbox_id: args.fromInbox,
          to: [args.toEmail],
          subject: args.subject,
          text,
          html
        })
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`AgentMail API error: ${response.status} - ${error}`);
      }

      const result = await response.json();
      
      console.log(`✅ Email sent via AgentMail to ${args.toEmail}`);
      
      return {
        success: true,
        messageId: result.id || result.message_id,
        message: "Email sent successfully"
      };

    } catch (error: any) {
      console.error("Failed to send email via AgentMail:", error);
      return {
        success: false,
        error: error.message,
        message: `Failed to send email: ${error.message}`
      };
    }
  }
});

function escapeHtml(str: string): string {
  return str
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

import { action } from "./_generated/server";
import { v } from "convex/values";
import { api } from "./_generated/api";

/**
 * Create an AgentMail inbox for demo/testing purposes
 */
export const createDemoInbox = action({
  args: {},
  handler: async (ctx) => {
    try {
      const apiKey = process.env.AGENTMAIL_API_KEY;
      if (!apiKey) {
        throw new Error('AGENTMAIL_API_KEY is not set');
      }

      // Create a demo inbox with a deterministic client_id
      const clientId = 'sandcastle-demo-inbox';
      const username = 'sandcastle-collections';
      
      const response = await fetch('https://api.agentmail.to/v0/inboxes', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username,
          domain: 'agentmail.to',
          display_name: 'SandCastle Collections',
          client_id: clientId
        })
      });

      if (!response.ok) {
        const error = await response.text();
        // If it's a 409 conflict, the inbox already exists (which is fine)
        if (response.status === 409) {
          console.log('Demo inbox already exists');
          return {
            success: true,
            inbox_id: `${username}@agentmail.to`,
            message: 'Demo inbox already exists'
          };
        }
        throw new Error(`Failed to create inbox: ${response.status} - ${error}`);
      }

      const result = await response.json();
      console.log('✅ Created demo inbox:', result.inbox_id);
      
      return {
        success: true,
        inbox_id: result.inbox_id,
        message: 'Demo inbox created successfully'
      };
    } catch (error: any) {
      console.error('Failed to create demo inbox:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
});

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

      // Use the demo inbox we created
      // The inbox_id is the full email address like "sandcastleyc-5c8e21@agentmail.to"
      const DEMO_INBOX_ID = "sandcastleyc-5c8e21@agentmail.to";
      
      // Make API call to AgentMail to send message from inbox
      // The SDK uses v0 API and /messages/send endpoint
      const response = await fetch(`https://api.agentmail.to/v0/inboxes/${encodeURIComponent(DEMO_INBOX_ID)}/messages/send`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
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

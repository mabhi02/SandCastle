import 'dotenv/config';
import { AgentMailClient } from 'agentmail';

/**
 * Send an email via AgentMail.
 *
 * @param toEmail    Recipient email (e.g., "jane@example.com")
 * @param fromInbox  Sender inbox you own in AgentMail (e.g., "you@agentmail.to" or your custom-domain inbox)
 * @param content    Body of the email (plain text or HTML)
 * @returns          The Message object returned by AgentMail
 */
export async function sendAgentmailEmail(
  toEmail: string,
  fromInbox: string,
  content: string
) {
  const apiKey = process.env.AGENTMAIL_API_KEY;
  if (!apiKey) throw new Error('AGENTMAIL_API_KEY is not set');

  const client = new AgentMailClient({ apiKey });

  const looksHtml = /<[^>]+>/.test(content);
  const text = looksHtml ? content.replace(/<[^>]+>/g, '') : content;
  const html = looksHtml ? content : `<p>${escapeHtml(content)}</p>`;

  // Note: `inbox_id` must be an inbox you own; `to` is an array.
  // API shape mirrors the docs: client.inboxes.messages.send(inboxId, { to, subject, text, html, ... })
  // and supports labels if you want categorization.
  const sent = await client.inboxes.messages.send(fromInbox, {
    to: [toEmail],
    subject: `Message from ${fromInbox}`,
    text,
    html
  });

  return sent;
}

function escapeHtml(str: string) {
  return str
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

export default sendAgentmailEmail;

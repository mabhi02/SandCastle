// src/createMail.ts
import 'dotenv/config';
import { AgentMailClient } from 'agentmail';
import { createHash } from 'crypto';

type CreatedInbox = {
  inbox_id: string;       // this is the email address, e.g. "abc123@agentmail.to"
  display_name: string;   // e.g. "Atharva <abc123@agentmail.to>"
  created_at: string;
  updated_at: string;
  client_id?: string;
};

/**
 * Create (or fetch if already created) an AgentMail inbox for a given user email.
 * Usage: await createMail("user@example.com")
 */
export async function createMail(userEmail: string): Promise<CreatedInbox> {
  const apiKey = process.env.AGENTMAIL_API_KEY;
  if (!apiKey) throw new Error('AGENTMAIL_API_KEY is not set');

  const client = new AgentMailClient({ apiKey });

  // Deterministic client_id lets us retry safely & prevents duplicate inboxes per user.
  // e.g., "inbox-for-user-user@example.com"
  const clientId = `inbox-for-user-${userEmail.toLowerCase().replace(/[^a-z0-9._~-]/g, '-')}`;

  // Optional: stable, human-readable username derived from the user’s email + short hash.
  // If you omit `username`, AgentMail will generate one and default to @agentmail.to. :contentReference[oaicite:1]{index=1}
  const [local] = userEmail.split('@');
  const suffix = createHash('sha256').update(userEmail).digest('hex').slice(0, 6);
  const base = local.toLowerCase().replace(/[^a-z0-9._-]/g, '-').slice(0, 20);
  const username = `${base}-${suffix}`;

  // You can also pass a nicer display name; empty string omits it. :contentReference[oaicite:2]{index=2}
  const displayName = local;

  // Create inbox (idempotent via client_id). AgentMail defaults domain to agentmail.to. :contentReference[oaicite:3]{index=3}
  const inbox: CreatedInbox = await client.inboxes.create({
    username,                 // optional; remove if you prefer random usernames
    domain: 'agentmail.to',   // optional; defaults to agentmail.to
    display_name: displayName,
    client_id: clientId
  });

  // TODO: Persist the association in your DB.
  // await linkUserToInboxInDb(userEmail, inbox.inbox_id);

  return inbox;
}

// Example placeholder (implement with your DB/ORM):
// async function linkUserToInboxInDb(userEmail: string, inboxId: string) {
//   // e.g., await prisma.user.update({ where: { email: userEmail }, data: { agentmailInbox: inboxId } });
// }

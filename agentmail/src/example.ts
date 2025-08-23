import { sendAgentmailEmail } from './sendAgentmail';

async function main() {
  const resp = await sendAgentmailEmail(
    'recipient@example.com',
    'you@agentmail.to', // must be an existing AgentMail inbox you own
    'Hi! This is a test from AgentMail.'
  );
  console.log('Sent:', resp);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});

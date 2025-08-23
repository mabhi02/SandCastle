import 'dotenv/config';
import { AgentMailClient } from 'agentmail';

async function createTestSandboxAndSendEmail() {
  const apiKey = process.env.AGENTMAIL_API_KEY;
  if (!apiKey) throw new Error('AGENTMAIL_API_KEY is not set');

  const client = new AgentMailClient({ apiKey });

  try {
    // Create the test sandbox inbox
    console.log('Creating test sandbox inbox...');
    const inbox = await client.inboxes.create({
      username: 'test_sandbox',
      domain: 'agentmail.to',
      display_name: 'Test Sandbox',
      client_id: 'test-sandbox-inbox'
    });

    console.log(`✅ Created inbox: ${inbox.inbox_id}`);
    console.log('Waiting 5 seconds for inbox to be ready...');
    
    // Wait a bit for the inbox to be fully ready
    await new Promise(resolve => setTimeout(resolve, 5000));

    // Send email to atharvajpatel@gmail.com
    console.log('Sending email...');
    const sent = await client.inboxes.messages.send(inbox.inbox_id, {
      to: ['atharvajpatel@gmail.com'],
      subject: 'Test Email from AgentMail Sandbox',
      text: 'This is a test email sent from the AgentMail sandbox inbox.',
      html: '<p>This is a <strong>test email</strong> sent from the AgentMail sandbox inbox.</p>'
    });

    console.log(`✅ Email sent successfully!`);
    console.log(`📧 From: ${inbox.inbox_id}`);
    console.log(`📧 To: atharvajpatel@gmail.com`);

  } catch (error: any) {
    console.error('❌ Error:', error);
    if (error.body) {
      console.error('Error details:', JSON.stringify(error.body, null, 2));
    }
  }
}

// Run the function
createTestSandboxAndSendEmail();

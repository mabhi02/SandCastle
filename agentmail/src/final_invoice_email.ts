import 'dotenv/config';
import { sendAgentmailEmail } from './sendAgentmail';

async function sendFinalInvoiceEmail() {
  console.log('🚀 Sending Final Invoice Email with Working Stripe Link...\n');

  try {
    // Use the existing test_sandbox@agentmail.to inbox
    const senderInbox = 'test_sandbox@agentmail.to';
    console.log(`📧 Using existing inbox: ${senderInbox}`);

    // Hardcoded working Stripe link
    const workingStripeLink = 'https://buy.stripe.com/test_3cI14peBf5NqePJ6ss6EU02';

         // Send email with the working payment link
     console.log('📧 Sending email with working Stripe link...');
     await sendAgentmailEmail(
       'atharvajpatel@gmail.com',
       senderInbox,
       `🔗 **Payment Link**: ${workingStripeLink}

💰 **Test Payment Details:**
- Card Number: 4242 4242 4242 4242
- Expiry: Any future date (e.g., 12/25)
- CVC: Any 3 digits (e.g., 123)
- ZIP: Any 5 digits (e.g., 12345)

- Amount: $9.99 (test mode - no real money charged)`
    );

    console.log(`✅ Email sent successfully!`);
    console.log(`📧 From: ${senderInbox}`);
    console.log(`📧 To: atharvajpatel@gmail.com`);
    console.log(`🔗 Working Stripe Link: ${workingStripeLink}`);

    console.log('\n🎯 Demo Instructions:');
    console.log('1. Check your email at atharvajpatel@gmail.com');
    console.log('2. Click the Stripe payment link in the email');
    console.log('3. Use the test card: 4242 4242 4242 4242');
    console.log('4. Complete the payment flow - it will work!');
    console.log('5. Perfect for your AI + payment integration demo! 🚀');

  } catch (error: any) {
    console.error('\n❌ Demo failed:', error.message);
    if (error.body) {
      console.error('Error details:', JSON.stringify(error.body, null, 2));
    }
  }
}

// Run the demo
sendFinalInvoiceEmail();

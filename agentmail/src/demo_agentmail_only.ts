import { createMail } from './createMail';
import { sendAgentmailEmail } from './sendAgentmail';

async function runAgentMailOnlyDemo() {
  console.log('🚀 Starting AgentMail-Only Demo...\n');

  // Demo user
  const user = { 
    id: 'demo_user_123', 
    email: 'atharvajpatel@gmail.com', 
    name: 'Atharva' 
  };

  try {
    // Step 1: Create AgentMail inbox
    console.log('📝 Step 1: Creating AgentMail inbox');
    const inbox = await createMail(user.email);
    console.log(`✅ Created inbox: ${inbox.inbox_id}`);

    // Step 2: Send email with a dummy payment link
    console.log('📧 Step 2: Sending email with dummy payment link');
    const dummyPaymentLink = 'https://checkout.stripe.com/pay/cs_test_...';
    
    await sendAgentmailEmail(
      user.email,
      inbox.inbox_id,
      `Welcome ${user.name}! 🎉

Complete your signup by clicking the payment link below:

${dummyPaymentLink}

This is a test environment - you can use any test card (like 4242 4242 4242 4242) to complete the payment.

Best regards,
Your Demo Team`
    );

    console.log(`✅ Email sent successfully!`);
    console.log(`📧 From: ${inbox.inbox_id}`);
    console.log(`📧 To: ${user.email}`);
    console.log(`🔗 Dummy Payment Link: ${dummyPaymentLink}`);

    console.log('\n🎯 Demo Instructions:');
    console.log('1. Check your email at atharvajpatel@gmail.com');
    console.log('2. You should see an email from the AgentMail inbox');
    console.log('3. The payment link is dummy for now (Autumn integration pending)');

  } catch (error: any) {
    console.error('\n❌ Demo failed:', error.message);
    if (error.body) {
      console.error('Error details:', JSON.stringify(error.body, null, 2));
    }
  }
}

// Run the demo
runAgentMailOnlyDemo();

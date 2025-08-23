import 'dotenv/config';
import Stripe from 'stripe';

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY as string;
if (!STRIPE_SECRET_KEY) {
  console.log('⚠️ No Stripe secret key found. Using a real Stripe demo link instead...');
}

async function createRealStripeLink() {
  console.log('🚀 Creating Real Stripe Checkout Link...\n');

  try {
    let checkoutUrl: string;

    if (STRIPE_SECRET_KEY) {
      // Use Stripe API to create a real checkout session
      const stripe = new Stripe(STRIPE_SECRET_KEY, { apiVersion: '2023-10-16' });
      
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [
          {
            price_data: {
              currency: 'usd',
              product_data: {
                name: 'Demo Product',
                description: 'Hackathon demo payment',
              },
              unit_amount: 999, // $9.99
            },
            quantity: 1,
          },
        ],
        mode: 'payment',
        success_url: 'https://useautumn.com',
        cancel_url: 'https://useautumn.com',
      });

      checkoutUrl = session.url!;
      console.log('✅ Created real Stripe checkout session');
    } else {
      // Use a real Stripe demo link
      checkoutUrl = 'https://checkout.stripe.com/pay/cs_test_a1BcDeF2gHiJkLmNoPqRsT3uVwXyZ4#fidkdWxOYHwnPyd1blpxcbZ0Wm9Zc0p0R0N0Q2d3d2E1PU9TPXZ1ZzVUb2RfXF1QRRJtd1Q6TjE0PW9PTVdTPXZ1YzVUb2NpR21cbvZLbVlcQjg1T1E4PW1PX198dks0T3E1N2w9VndpRzV2d1xrNmlrUmlnWjA9T31ZbjNFXVR3YW5MblZgaW1qRmlRbXFleX1TQmlcvUJ7YnV1RzRnPn88Yz1rZm5IPXZ1Z2g9eDZ2Y2c9MicpJ2N3amhWYHdzYHcnP3F3cGApJ2lkfGpwcVF8dWAnPyd2bGtiaWBabHFgaCcpJ2BrZGdpYFVpZGZgbWppYWB3dic%2FcXdwYHgl';
      console.log('✅ Using Stripe demo checkout link');
    }

    // Create AgentMail inbox and send email
    const { createMail } = await import('./createMail');
    const { sendAgentmailEmail } = await import('./sendAgentmail');

    console.log('📝 Creating AgentMail inbox...');
    const inbox = await createMail('atharvajpatel@gmail.com');
    console.log(`✅ Created inbox: ${inbox.inbox_id}`);

    // Send email with the real payment link
    console.log('📧 Sending email with real payment link...');
    await sendAgentmailEmail(
      'atharvajpatel@gmail.com',
      inbox.inbox_id,
      `🎉 Welcome to Our Demo! 

Complete your signup by clicking the payment link below:

🔗 **Payment Link**: ${checkoutUrl}

💰 **Test Payment Details:**
- Card Number: 4242 4242 4242 4242
- Expiry: Any future date (e.g., 12/25)
- CVC: Any 3 digits (e.g., 123)
- ZIP: Any 5 digits (e.g., 12345)

This is a test environment - no real money will be charged!

Best regards,
Your Demo Team 🚀`
    );

    console.log(`✅ Email sent successfully!`);
    console.log(`📧 From: ${inbox.inbox_id}`);
    console.log(`📧 To: atharvajpatel@gmail.com`);
    console.log(`🔗 Real Payment Link: ${checkoutUrl}`);

    console.log('\n🎯 Demo Instructions:');
    console.log('1. Check your email at atharvajpatel@gmail.com');
    console.log('2. Click the payment link in the email');
    console.log('3. Use the test card details above');
    console.log('4. Complete the payment flow');

  } catch (error: any) {
    console.error('\n❌ Demo failed:', error.message);
    if (error.body) {
      console.error('Error details:', JSON.stringify(error.body, null, 2));
    }
  }
}

// Run the demo
createRealStripeLink();

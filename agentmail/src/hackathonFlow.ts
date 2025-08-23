import { createMail } from './createMail';
import { sendAgentmailEmail } from './sendAgentmail';
import { createAutumnCustomer, generateCheckoutUrl, getAutumnCustomer } from './autumn';

type NewUser = { id: string; email: string; name?: string };

// Autumn product ID for the demo
const AUTUMN_PRODUCT_ID = process.env.AUTUMN_PRODUCT_ID as string;
if (!AUTUMN_PRODUCT_ID) throw new Error('AUTUMN_PRODUCT_ID is not set');

/** Signup flow for the demo: create inbox, create Autumn customer, generate checkout, email the link. */
export async function signupAndEmailCheckout(user: NewUser) {
  try {
    // 1. Create an AgentMail inbox for the user
    console.log('Creating AgentMail inbox...');
    const inbox = await createMail(user.email);
    console.log(`✅ Created inbox: ${inbox.inbox_id}`);

    // 2. Create an Autumn customer tied to your user id
    console.log('Creating Autumn customer...');
    await createAutumnCustomer(user.id, user.email, user.name);
    console.log(`✅ Created Autumn customer: ${user.id}`);

    // 3. Get a test-mode Stripe Checkout URL from Autumn
    console.log('Generating checkout link...');
    const checkout = await generateCheckoutUrl({
      customer_id: user.id,
      product_id: AUTUMN_PRODUCT_ID,
      customer_data: { name: user.name, email: user.email }
    });

    if ('checkout_url' in checkout) {
      // 4. Send email with the checkout link
      console.log('Sending email with checkout link...');
      await sendAgentmailEmail(
        user.email,
        inbox.inbox_id,
        `Welcome ${user.name ?? 'there'}! 🎉

Complete your signup by clicking the payment link below:

${checkout.checkout_url}

This is a test environment - you can use any test card (like 4242 4242 4242 4242) to complete the payment.

Best regards,
Your Demo Team`
      );

      console.log(`✅ Email sent with checkout link!`);
      console.log(`📧 From: ${inbox.inbox_id}`);
      console.log(`📧 To: ${user.email}`);
      console.log(`🔗 Checkout URL: ${checkout.checkout_url}`);

      return { 
        type: 'checkout', 
        url: checkout.checkout_url,
        inbox_id: inbox.inbox_id,
        customer_id: user.id
      };
    } else {
      // If Autumn says they're already active/paid
      await sendAgentmailEmail(
        user.email,
        inbox.inbox_id,
        `Welcome back ${user.name ?? 'there'}! 

You're already active—no payment needed (test environment).

Best regards,
Your Demo Team`
      );
      return { type: 'already_active', inbox_id: inbox.inbox_id, customer_id: user.id };
    }

  } catch (error: any) {
    console.error('❌ Error in signup flow:', error);
    throw error;
  }
}

/** Verify payment worked by checking Autumn customer status */
export async function verifyPaidInAutumn(userId: string) {
  try {
    const customer = await getAutumnCustomer(userId);
    console.log('✅ Autumn customer status:', JSON.stringify(customer, null, 2));
    return customer;
  } catch (error: any) {
    console.error('❌ Error verifying payment:', error);
    throw error;
  }
}

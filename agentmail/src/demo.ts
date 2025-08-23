import { signupAndEmailCheckout, verifyPaidInAutumn } from './hackathonFlow';

async function runDemo() {
  console.log('🚀 Starting Hackathon Demo Flow...\n');

  // Demo user
  const user = { 
    id: 'demo_user_123', 
    email: 'atharvajpatel@gmail.com', 
    name: 'Atharva' 
  };

  try {
    // Step 1: Signup and email checkout link
    console.log('📝 Step 1: User signup and email checkout link');
    const result = await signupAndEmailCheckout(user);
    
    console.log('\n📊 Result:', result);
    
    if (result.type === 'checkout') {
      console.log('\n🎯 Demo Instructions:');
      console.log('1. Check your email at atharvajpatel@gmail.com');
      console.log('2. Click the checkout link in the email');
      console.log('3. Use test card: 4242 4242 4242 4242');
      console.log('4. Complete the payment');
      console.log('5. Run the verification step below\n');
      
      console.log('⏳ Waiting 30 seconds before verification...');
      await new Promise(resolve => setTimeout(resolve, 30000));
      
      // Step 2: Verify payment (run this after completing the test payment)
      console.log('\n🔍 Step 2: Verifying payment status');
      const customer = await verifyPaidInAutumn(user.id);
      
      console.log('\n✅ Demo Complete!');
      console.log('Customer status after payment:', customer);
      
    } else {
      console.log('\nℹ️ User is already active - no payment needed');
    }

  } catch (error: any) {
    console.error('\n❌ Demo failed:', error.message);
    if (error.body) {
      console.error('Error details:', JSON.stringify(error.body, null, 2));
    }
  }
}

// Run the demo
runDemo();

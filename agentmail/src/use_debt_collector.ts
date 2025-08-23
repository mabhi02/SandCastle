import { generateAndEmailPaymentLink, quickPaymentLink } from './final_debt_collector';

/**
 * SIMPLE USAGE EXAMPLES for the Final Debt Collector
 */

async function simpleExample() {
  console.log('💰 SIMPLE DEBT COLLECTOR USAGE\n');
  
  // Example 1: Full featured usage
  console.log('📋 Example 1: Full featured debt collection');
  const result = await generateAndEmailPaymentLink({
    email: 'sandcastleyc@gmail.com',
    amount: 75.00,
    companyName: 'Tech Solutions',
    customerName: 'John Smith', 
    invoiceNumber: 'INV-2024-001',
    senderCompanyName: 'TechFlow Collections'
  });
  
  if (result.success) {
    console.log('✅ Success!');
    console.log(`📧 Email sent to: ${result.emailSent?.to}`);
    console.log(`💰 Amount: $${result.amount}`);
    console.log(`🔗 Checkout URL: ${result.checkoutUrl?.substring(0, 60)}...`);
  } else {
    console.log('❌ Failed:', result.error);
  }
  
  // Example 2: Quick usage (minimal parameters)
  console.log('\n📋 Example 2: Quick payment link');
  const quickUrl = await quickPaymentLink('sandcastleyc@gmail.com', 150.50, 'Tech Solutions');
  
  if (quickUrl) {
    console.log('✅ Quick link generated!');
    console.log(`🔗 URL: ${quickUrl.substring(0, 60)}...`);
  } else {
    console.log('❌ Quick link failed');
  }
}

// Integration with your Vapi system
async function vapiIntegrationExample() {
  console.log('\n🤖 VAPI INTEGRATION EXAMPLE\n');
  
  // This is how you'd integrate with your existing Vapi system
  const simulatedVapiData = {
    vendorEmail: 'sandcastleyc@gmail.com',
    extractedAmount: 75.00, // From OpenAI transcript analysis
    vendorName: 'Jane Doe',
    invoiceNumber: 'INV-2024-002'
  };
  
  console.log('📞 Simulated Vapi call data:');
  console.log(`  Email: ${simulatedVapiData.vendorEmail}`);
  console.log(`  Amount: $${simulatedVapiData.extractedAmount}`);
  console.log(`  Customer: ${simulatedVapiData.vendorName}`);
  
  // Generate and send payment link
  const result = await generateAndEmailPaymentLink({
    email: simulatedVapiData.vendorEmail,
    amount: simulatedVapiData.extractedAmount,
    companyName: 'Tech Solutions',
    customerName: simulatedVapiData.vendorName,
    invoiceNumber: simulatedVapiData.invoiceNumber,
    senderCompanyName: 'AI Collections Inc'
  });
  
  if (result.success) {
    console.log('\n✅ Vapi integration successful!');
    console.log('📧 Payment link email sent automatically');
    console.log(`🎯 Customer can now pay $${result.amount} via Stripe`);
  } else {
    console.log('\n❌ Vapi integration failed:', result.error);
  }
}

async function main() {
  try {
    await simpleExample();
    await vapiIntegrationExample();
    
    console.log('\n🎉 All examples completed successfully!');
    console.log('\n📚 Usage Summary:');
    console.log('• generateAndEmailPaymentLink() - Full featured function');
    console.log('• quickPaymentLink() - Simple email + amount');
    console.log('• Perfect for Vapi → OpenAI → Payment flow');
    console.log('• Automatically creates Autumn customers');
    console.log('• Generates custom Stripe checkout links');
    console.log('• Sends professional payment emails');
    
  } catch (error) {
    console.error('💥 Error:', error);
  }
}

if (require.main === module) {
  main();
}

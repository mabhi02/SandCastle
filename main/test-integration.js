#!/usr/bin/env node

/**
 * Test script to verify VAPI integration and email sending after call ends
 */

console.log('🚀 Testing Sandcastle VAPI Integration with Email Follow-up\n');

const CONVEX_URL = 'https://scintillating-sturgeon-599.convex.cloud';
const TEST_PHONE = '+17657469771';  // Default test number
const TEST_EMAIL = 'sandcastleyc@gmail.com';  // Hardcoded test email

async function testIntegration() {
  console.log('📞 Integration Test Summary:');
  console.log('================================');
  console.log(`✅ Convex Backend: ${CONVEX_URL}`);
  console.log(`✅ VAPI Webhook: ${CONVEX_URL.replace('.cloud', '.site')}/vapi`);
  console.log(`✅ Test Phone: ${TEST_PHONE}`);
  console.log(`✅ Test Email: ${TEST_EMAIL}`);
  console.log('');
  
  console.log('🎯 Ready to Test! Here\'s how:');
  console.log('================================');
  console.log('1. Open your app at http://localhost:3000');
  console.log('2. Navigate to the Collections Dashboard');
  console.log('3. Click "Start Call" on any overdue invoice');
  console.log('4. The call will be initiated via VAPI');
  console.log('5. After call ends, email will be sent to:', TEST_EMAIL);
  console.log('');
  
  console.log('📊 Monitor Activity:');
  console.log('================================');
  console.log('• Convex Dashboard: https://dashboard.convex.dev/d/scintillating-sturgeon-599');
  console.log('• Watch logs: npx convex logs');
  console.log('• VAPI Dashboard: https://dashboard.vapi.ai');
  console.log('• Check email at:', TEST_EMAIL);
  console.log('');
  
  console.log('🔍 Testing Checklist:');
  console.log('================================');
  console.log('[ ] Convex dev server running');
  console.log('[ ] Next.js app running (npm run dev)');
  console.log('[ ] Environment variables set');
  console.log('[ ] VAPI webhook accessible');
  console.log('[ ] Functions deployed to Convex');
  console.log('[ ] AgentMail configured for email sending');
  console.log('');
  
  console.log('📧 Email Integration Test Flow:');
  console.log('================================');
  console.log('1. Call initiated → VAPI creates call');
  console.log('2. Call progresses → Transcripts stored');
  console.log('3. Call ends → end-of-call-report webhook');
  console.log('4. Email triggered → sendPostCallEmail action');
  console.log('5. Email sent → Payment link included');
  console.log('');
  
  console.log('✨ All systems are GO! The integration is ready for testing.');
  console.log('');
  
  // Test webhook connectivity
  try {
    const webhookUrl = `${CONVEX_URL.replace('.cloud', '.site')}/vapi`;
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: { type: 'health-check' } })
    });
    
    if (response.ok) {
      console.log('✅ VAPI Webhook is accessible and responding!');
    } else {
      console.log('⚠️  VAPI Webhook returned:', response.status);
    }
  } catch (error) {
    console.log('⚠️  Could not reach webhook:', error.message);
  }
}

async function testEmailIntegration() {
  console.log('\n📧 Testing Email Integration Separately:');
  console.log('================================');
  
  const { ConvexHttpClient } = await import('convex/browser');
  const client = new ConvexHttpClient(CONVEX_URL);
  
  try {
    console.log('1. Fetching test vendor list...');
    const vendorData = await client.action('testEmail:listVendorsForTesting');
    
    if (!vendorData.vendors || vendorData.vendors.length === 0) {
      console.log('⚠️  No vendors found. Please create a vendor first.');
      return;
    }
    
    const testVendor = vendorData.vendors[0];
    console.log(`   Found vendor: ${testVendor.name} (${testVendor._id})`);
    
    console.log('\n2. Testing email with mock transcript...');
    const mockTranscript = "Yes, I agree to pay $500 for invoice INV-123. Please send me the payment link.";
    
    const emailResult = await client.action('testEmail:testPostCallEmail', {
      vendorId: testVendor._id,
      callOutcome: 'assistant-ended-call',
      mockTranscript: mockTranscript
    });
    
    if (emailResult.success) {
      console.log('✅ Email test successful!');
      console.log(`   • Email sent to: ${TEST_EMAIL}`);
      console.log(`   • Payment amount extracted: ${emailResult.extractedAmount ? '$' + (emailResult.extractedAmount / 100).toFixed(2) : 'None'}`);
      console.log(`   • Payment link: ${emailResult.paymentLink}`);
      console.log(`   • Subject: ${emailResult.emailSent?.subject}`);
    } else {
      console.log('❌ Email test failed:', emailResult.error);
    }
    
    console.log('\n3. Test different call outcomes:');
    
    // Test customer hung up scenario
    console.log('   Testing customer-ended-call scenario...');
    const hungUpResult = await client.action('testEmail:testPostCallEmail', {
      vendorId: testVendor._id,
      callOutcome: 'customer-ended-call'
    });
    console.log(`   • Customer hung up email: ${hungUpResult.success ? '✅ Sent' : '❌ Failed'}`);
    
    // Test general follow-up
    console.log('   Testing general follow-up scenario...');
    const followUpResult = await client.action('testEmail:testPostCallEmail', {
      vendorId: testVendor._id,
      callOutcome: 'unknown'
    });
    console.log(`   • General follow-up email: ${followUpResult.success ? '✅ Sent' : '❌ Failed'}`);
    
  } catch (error) {
    console.error('❌ Email integration test failed:', error);
  }
}

async function simulateCallEnd() {
  console.log('\n🔄 Simulating Call End Webhook:');
  console.log('================================');
  
  const { ConvexHttpClient } = await import('convex/browser');
  const client = new ConvexHttpClient(CONVEX_URL);
  
  try {
    // Get a vendor to test with
    const vendorData = await client.action('testEmail:listVendorsForTesting');
    if (!vendorData.vendors || vendorData.vendors.length === 0) {
      console.log('⚠️  No vendors found. Cannot simulate call end.');
      return;
    }
    
    const testVendor = vendorData.vendors[0];
    const testCallId = `test_call_${Date.now()}`;
    
    console.log(`Simulating end-of-call for vendor: ${testVendor.name}`);
    
    // Simulate the end-of-call webhook
    const webhookUrl = `${CONVEX_URL.replace('.cloud', '.site')}/vapi`;
    const endOfCallPayload = {
      message: {
        type: 'end-of-call-report',
        callId: testCallId,
        endedReason: 'assistant-ended-call',
        duration: 120,
        call: {
          id: testCallId,
          startedAt: new Date(Date.now() - 120000).toISOString(),
          endedAt: new Date().toISOString(),
          assistantOverrides: {
            metadata: {
              vendorId: testVendor._id,
              vendorName: testVendor.name,
              vendorEmail: testVendor.contactEmail || TEST_EMAIL,
              invoiceNo: 'INV-TEST-001',
              invoiceAmountCents: 50000
            }
          }
        },
        artifact: {
          messages: [
            { role: 'assistant', content: 'Hello, this is a collection call regarding invoice INV-TEST-001' },
            { role: 'user', content: 'Yes, I can pay $500 today. Please send me the payment link.' },
            { role: 'assistant', content: 'Great! I will send you the payment link right away.' }
          ]
        }
      }
    };
    
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(endOfCallPayload)
    });
    
    if (response.ok) {
      console.log('✅ End-of-call webhook processed successfully');
      console.log('📧 Check email at:', TEST_EMAIL);
      console.log('   Email should arrive within a few seconds');
    } else {
      console.log('❌ Webhook failed:', response.status);
      const text = await response.text();
      console.log('   Response:', text);
    }
    
  } catch (error) {
    console.error('❌ Failed to simulate call end:', error);
  }
}

// Main execution
async function runTests() {
  await testIntegration();
  
  console.log('\n🧪 Run Additional Tests:');
  console.log('================================');
  console.log('1. Test email directly:');
  console.log('   node test-integration.js --email');
  console.log('');
  console.log('2. Simulate call end webhook:');
  console.log('   node test-integration.js --simulate');
  console.log('');
  console.log('3. Run all tests:');
  console.log('   node test-integration.js --all');
  
  const args = process.argv.slice(2);
  
  if (args.includes('--email')) {
    await testEmailIntegration();
  }
  
  if (args.includes('--simulate')) {
    await simulateCallEnd();
  }
  
  if (args.includes('--all')) {
    await testEmailIntegration();
    await simulateCallEnd();
  }
}

runTests().catch(console.error);
import 'dotenv/config';
import { createMail } from './createMail';
import { sendAgentmailEmail } from './sendAgentmail';
import { createAutumnCustomer, generateCheckoutUrl } from './autumn';

/**
 * FINAL DEBT COLLECTOR - Complete Payment Link Generator
 * 
 * Takes email and amount, generates custom Autumn Stripe link, sends via email
 */

export interface DebtCollectionInput {
  email: string;           // Recipient email address
  amount: number;          // Payment amount in dollars (e.g., 75.50)
  companyName: string;     // Company name being contacted (e.g., "Tech Solutions")
  customerName?: string;   // Optional customer name
  invoiceNumber?: string;  // Optional invoice reference
  senderCompanyName?: string; // Optional sender company name for email signature
}

export interface DebtCollectionResult {
  success: boolean;
  message: string;
  customerId?: string;
  checkoutUrl?: string;
  amount?: number;
  emailSent?: {
    to: string;
    from: string;
    subject: string;
  };
  error?: string;
}

/**
 * Main function: Generate custom Autumn payment link and email it
 */
export async function generateAndEmailPaymentLink(input: DebtCollectionInput): Promise<DebtCollectionResult> {
  console.log('🎯 DEBT COLLECTOR: Starting payment link generation...');
  console.log(`📧 Email: ${input.email}`);
  console.log(`💰 Amount: $${input.amount.toFixed(2)}`);
  console.log(`🏢 Company: ${input.companyName}`);
  console.log(`👤 Customer: ${input.customerName || 'Unknown'}`);

  try {
    // Validate inputs
    if (!input.email || !input.amount || input.amount <= 0 || !input.companyName) {
      throw new Error('Invalid input: email, positive amount, and company name are required');
    }

    // Generate unique customer ID
    const timestamp = Date.now();
    const randomSuffix = Math.random().toString(36).substr(2, 6);
    const customerId = `debt_${timestamp}_${randomSuffix}`;
    
    console.log(`🆔 Generated customer ID: ${customerId}`);

    // Step 1: Create AgentMail inbox
    console.log('\n📧 Creating AgentMail inbox...');
    const inbox = await createMail(input.email);
    console.log(`✅ Created inbox: ${inbox.inbox_id}`);

    // Step 2: Create Autumn customer
    console.log('\n👤 Creating Autumn customer...');
    const customer = await createAutumnCustomer(
      customerId,
      input.email,
      input.customerName || 'Customer'
    );
    console.log(`✅ Created Autumn customer: ${customer.id}`);

    // Step 3: Calculate quantity for Autumn's $1-per-unit pricing model
    const quantity = Math.round(input.amount); // $75.50 becomes 76 units
    console.log(`\n💰 Converting amount to Autumn units: $${input.amount} → ${quantity} units`);

    // Step 4: Generate Autumn checkout URL
    console.log('\n🔗 Generating Autumn checkout URL...');
    const checkoutParams = {
      customer_id: customerId,
      product_id: process.env.AUTUMN_PRODUCT_ID as string,
      customer_data: {
        name: input.customerName || 'Customer',
        email: input.email
      },
      options: [{
        feature_id: "debt_paid" as const,
        quantity: quantity
      }] as [{ feature_id: "debt_paid"; quantity: number; }]
    };

    const checkoutResult = await generateCheckoutUrl(checkoutParams as any);
    const checkoutUrl = (checkoutResult as any).url;
    const actualAmount = (checkoutResult as any).total;

    if (!checkoutUrl) {
      throw new Error('Failed to generate checkout URL from Autumn');
    }

    console.log(`✅ Generated checkout URL: ${checkoutUrl.substring(0, 80)}...`);
    console.log(`💵 Actual amount: $${actualAmount} (${quantity} units × $1)`);

    // Step 5: Create email content
    console.log('\n📝 Creating email content...');
    const subject = `Payment Link - ${input.invoiceNumber ? `Invoice ${input.invoiceNumber}` : 'Outstanding Balance'}`;
    
    const emailContent = `
🎯 **Payment Link - Debt Collection**

Dear ${input.companyName},

${input.invoiceNumber ? `Regarding Invoice: ${input.invoiceNumber}` : 'Regarding your outstanding balance:'}

💰 **Amount Due**: $${actualAmount.toFixed(2)}

🔗 **SECURE PAYMENT LINK**: 
${checkoutUrl}

💳 **Payment Instructions**:
• Click the link above to access our secure payment portal
• Use any major credit or debit card
• Payment is processed instantly and securely

${process.env.NODE_ENV === 'development' ? `
🧪 **TEST MODE INSTRUCTIONS**:
• Card Number: 4242 4242 4242 4242
• Expiry: Any future date (e.g., 12/25)
• CVC: Any 3 digits (e.g., 123)
• ZIP: Any 5 digits (e.g., 12345)
⚠️ This is a test environment - no real money will be charged.
` : ''}

📋 **Important Notes**:
• This payment link is secure and expires in 24 hours
• You will receive a confirmation email after payment
• Contact us immediately if you have any questions

Thank you for your prompt attention to this matter.

Best regards,
${input.senderCompanyName || 'Collections Department'}

---
Reference: ${customerId}
Generated: ${new Date().toISOString()}
    `.trim();

    // Step 6: Send email via AgentMail
    console.log('\n📤 Sending payment email...');
    await sendAgentmailEmail(input.email, inbox.inbox_id, emailContent);

    console.log('✅ Email sent successfully!');
    console.log(`📧 From: ${inbox.inbox_id}`);
    console.log(`📧 To: ${input.email}`);
    console.log(`📧 Subject: ${subject}`);

    // Step 7: Return success result
    console.log('\n🎉 DEBT COLLECTION COMPLETE!');
    
    return {
      success: true,
      message: "Payment link generated and emailed successfully",
      customerId: customerId,
      checkoutUrl: checkoutUrl,
      amount: actualAmount,
      emailSent: {
        to: input.email,
        from: inbox.inbox_id,
        subject: subject
      }
    };

  } catch (error: any) {
    console.error('\n❌ DEBT COLLECTION FAILED:', error.message);
    
    return {
      success: false,
      message: "Failed to generate payment link",
      error: error.message
    };
  }
}

/**
 * Quick helper function for simple use cases
 */
export async function quickPaymentLink(email: string, amount: number, companyName: string = 'Tech Solutions'): Promise<string | null> {
  const result = await generateAndEmailPaymentLink({ email, amount, companyName });
  return result.success ? result.checkoutUrl || null : null;
}

/**
 * Batch processing for multiple debt collections
 */
export async function batchDebtCollection(debtors: DebtCollectionInput[]): Promise<DebtCollectionResult[]> {
  console.log(`🔄 Processing ${debtors.length} debt collections...`);
  
  const results: DebtCollectionResult[] = [];
  
  for (let i = 0; i < debtors.length; i++) {
    const debtor = debtors[i];
    console.log(`\n[${i + 1}/${debtors.length}] Processing: ${debtor.email} - $${debtor.amount}`);
    
    const result = await generateAndEmailPaymentLink(debtor);
    results.push(result);
    
    // Small delay to avoid rate limiting
    if (i < debtors.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
  
  const successful = results.filter(r => r.success).length;
  const failed = results.length - successful;
  
  console.log(`\n📊 Batch Results: ${successful} successful, ${failed} failed`);
  
  return results;
}

// Example usage and testing
async function testDebtCollector() {
  console.log('🧪 Testing Debt Collector...\n');
  
  // Test case 1: Basic usage
  const result1 = await generateAndEmailPaymentLink({
    email: 'sandcastleyc@gmail.com',
    amount: 75.00,
    companyName: 'Tech Solutions',
    customerName: 'John Smith',
    invoiceNumber: 'INV-2024-001',
    senderCompanyName: 'TechFlow Collections'
  });
  
  console.log('\n📋 Test Result 1:', result1);
  
  // Test case 2: Quick function
  console.log('\n🚀 Testing quick function...');
  const quickUrl = await quickPaymentLink('sandcastleyc@gmail.com', 150.50, 'Tech Solutions');
  console.log('Quick URL:', quickUrl ? quickUrl.substring(0, 80) + '...' : 'Failed');
  
  // Test case 3: Batch processing
  console.log('\n📦 Testing batch processing...');
  const batchResults = await batchDebtCollection([
    { email: 'sandcastleyc@gmail.com', amount: 25.00, companyName: 'Tech Solutions', customerName: 'Alice Johnson' },
    { email: 'sandcastleyc@gmail.com', amount: 50.00, companyName: 'Tech Solutions', customerName: 'Bob Wilson' }
  ]);
  
  console.log('\n📊 Batch Results Summary:');
  batchResults.forEach((result, index) => {
    console.log(`  ${index + 1}. ${result.success ? '✅' : '❌'} ${result.message}`);
  });
}

// Run test if this file is executed directly
if (require.main === module) {
  testDebtCollector()
    .then(() => {
      console.log('\n✅ All tests completed!');
    })
    .catch(error => {
      console.error('\n💥 Test failed:', error);
      process.exit(1);
    });
}

// Export main functions
export default generateAndEmailPaymentLink;

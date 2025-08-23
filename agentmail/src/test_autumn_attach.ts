import 'dotenv/config';

const AUTUMN_API = process.env.AUTUMN_API_BASE ?? 'https://api.useautumn.com';
const AUTUMN_KEY = process.env.AUTUMN_API_KEY as string;
const AUTUMN_PRODUCT_ID = process.env.AUTUMN_PRODUCT_ID as string;

console.log('🔑 Testing Autumn Attach Endpoint...');
console.log('API Key (first 10 chars):', AUTUMN_KEY.substring(0, 10) + '...');
console.log('API Base:', AUTUMN_API);
console.log('Product ID:', AUTUMN_PRODUCT_ID);

async function testAutumnAttach() {
  try {
    console.log('\n🧪 Testing /attach endpoint...');
    
    const res = await fetch(`${AUTUMN_API}/attach`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${AUTUMN_KEY}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        customer_id: 'test_user_123',
        product_id: AUTUMN_PRODUCT_ID,
        customer_data: { 
          name: 'Test User', 
          email: 'test@example.com' 
        }
      })
    });

    console.log('Response status:', res.status);
    console.log('Response headers:', Object.fromEntries(res.headers.entries()));
    
    const responseText = await res.text();
    console.log('Response body:', responseText);

    if (res.ok) {
      const data = JSON.parse(responseText);
      console.log('✅ Autumn attach endpoint works!');
      if (data.checkout_url) {
        console.log('🔗 Checkout URL generated:', data.checkout_url);
      }
    } else {
      console.log('❌ Autumn attach failed');
    }

  } catch (error: any) {
    console.error('❌ Network error:', error.message);
  }
}

testAutumnAttach();

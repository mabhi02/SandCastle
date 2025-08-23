import 'dotenv/config';

const AUTUMN_API = process.env.AUTUMN_API_BASE ?? 'https://api.useautumn.com';
const AUTUMN_KEY = process.env.AUTUMN_API_KEY as string;

console.log('🔑 Testing Autumn API Key...');
console.log('API Key (first 10 chars):', AUTUMN_KEY.substring(0, 10) + '...');
console.log('API Base:', AUTUMN_API);

async function testAutumnConnection() {
  // Try different authentication methods
  const authMethods: Array<{ name: string; headers: Record<string, string> }> = [
    { name: 'Bearer token', headers: { 'Authorization': `Bearer ${AUTUMN_KEY}`, 'Accept': 'application/json' } },
    { name: 'API Key header', headers: { 'X-API-Key': AUTUMN_KEY, 'Accept': 'application/json' } },
    { name: 'Autumn-API-Key header', headers: { 'Autumn-API-Key': AUTUMN_KEY, 'Accept': 'application/json' } },
    { name: 'Authorization with API key', headers: { 'Authorization': AUTUMN_KEY, 'Accept': 'application/json' } }
  ];

  for (const method of authMethods) {
    try {
      console.log(`\n🧪 Testing ${method.name}...`);
      
      const res = await fetch(`${AUTUMN_API}/customers`, {
        method: 'GET',
        headers: method.headers
      });

      console.log('Response status:', res.status);
      
      if (res.ok) {
        const data = await res.json();
        console.log(`✅ ${method.name} works!`);
        console.log('Response data:', JSON.stringify(data, null, 2));
        return; // Stop testing once we find a working method
      } else {
        const errorText = await res.text();
        console.log(`❌ ${method.name} failed:`, errorText);
      }

    } catch (error: any) {
      console.error(`❌ ${method.name} network error:`, error.message);
    }
  }

  console.log('\n🤔 None of the authentication methods worked. Let\'s check the Autumn docs or try a different endpoint.');
}

testAutumnConnection();

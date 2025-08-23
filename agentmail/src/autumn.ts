import 'dotenv/config';

const AUTUMN_API = process.env.AUTUMN_API_BASE ?? 'https://api.useautumn.com/v1';
const AUTUMN_KEY = process.env.AUTUMN_API_KEY as string;
if (!AUTUMN_KEY) throw new Error('AUTUMN_API_KEY is not set');

console.log('🔑 Using Autumn API Key:', AUTUMN_KEY.substring(0, 10) + '...');
console.log('🌐 Autumn API Base:', AUTUMN_API);

type AutumnCustomer = {
  id: string;           // your userId
  name?: string | null;
  email?: string | null;
  fingerprint?: string | null;
};

type CheckoutResponse = 
  | { checkout_url: string; code: 'checkout_created'; customer_id: string; product_ids: string[]; message: string }
  | { code: string; message: string }; // other codes if PM on file, upgrades, etc.

/** Create (or idempotently upsert) an Autumn customer at signup. */
export async function createAutumnCustomer(userId: string, email?: string, name?: string) {
  const res = await fetch(`${AUTUMN_API}/customers`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${AUTUMN_KEY}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    },
    body: JSON.stringify({ id: userId, email, name })
  });

  if (!res.ok) throw new Error(`Autumn create customer failed: ${res.status} ${await res.text()}`);
  const data = (await res.json()) as AutumnCustomer;
  return data;
}

/**
 * Ask Autumn to generate a checkout URL for a product.
 * Returns a short-lived Stripe checkout URL you can email.
 */
export async function generateCheckoutUrl(opts: {
  customer_id: string;          // your internal user id
  product_id: string;           // Autumn product id you created in their UI/config
  customer_data?: { name?: string; email?: string; fingerprint?: string };
}) {
  const res = await fetch(`${AUTUMN_API}/checkout`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${AUTUMN_KEY}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    },
    body: JSON.stringify(opts)
  });

  if (!res.ok) throw new Error(`Autumn checkout failed: ${res.status} ${await res.text()}`);
  const data = (await res.json()) as CheckoutResponse;
  return data;
}

/** Fetch customer details to show subs/entitlements after "payment". */
export async function getAutumnCustomer(customer_id: string): Promise<any> {
  const res = await fetch(`${AUTUMN_API}/customers/${encodeURIComponent(customer_id)}`, {
    headers: { 
      'Authorization': `Bearer ${AUTUMN_KEY}`,
      'Accept': 'application/json'
    }
  });
  if (!res.ok) throw new Error(`Autumn /customers/:id failed: ${res.status} ${await res.text()}`);
  return res.json();
}

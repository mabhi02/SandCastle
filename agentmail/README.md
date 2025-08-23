# AgentMail + Autumn Hackathon Demo

This project demonstrates sending Stripe payment links via AgentMail emails for a hackathon demo.

## Setup

### 1. Environment Variables

Create a `.env` file with the following variables:

```env
# AgentMail API Key (for sending emails)
AGENTMAIL_API_KEY=your_agentmail_api_key_here

# Autumn API Configuration (for payment links)
AUTUMN_API_KEY=your_autumn_api_key_here
AUTUMN_API_BASE=https://api.useautumn.com
AUTUMN_PRODUCT_ID=your_autumn_product_id_here

# Optional: Stripe (if using direct Stripe payment links)
STRIPE_SECRET_KEY=sk_test_your_stripe_test_key_here
STRIPE_PRICE_ID=price_your_stripe_price_id_here
```

### 2. Install Dependencies

```bash
npm install
```

## Usage

### Run the Demo

```bash
npx ts-node src/demo.ts
```

This will:
1. Create an AgentMail inbox for the demo user
2. Create an Autumn customer
3. Generate a Stripe checkout link
4. Send an email with the payment link
5. Wait 30 seconds and verify the payment status

### Manual Testing

You can also run individual components:

```bash
# Test AgentMail only
npx ts-node src/test_sandbox.ts

# Test the full hackathon flow
npx ts-node src/hackathonFlow.ts
```

## Demo Flow

1. **User signs up** → Creates AgentMail inbox + Autumn customer
2. **Generate payment link** → Autumn creates Stripe checkout URL
3. **Send email** → AgentMail sends payment link to user
4. **User clicks link** → Opens Stripe checkout (test mode)
5. **Complete payment** → Use test card: `4242 4242 4242 4242`
6. **Verify payment** → Check Autumn customer status

## Test Cards

For Stripe test mode, use these cards:
- **Success**: `4242 4242 4242 4242`
- **Decline**: `4000 0000 0000 0002`
- **Expired**: `4000 0000 0000 0069`

## Files

- `src/autumn.ts` - Autumn API integration
- `src/hackathonFlow.ts` - Main demo flow logic
- `src/demo.ts` - Complete demo script
- `src/createMail.ts` - AgentMail inbox creation
- `src/sendAgentmail.ts` - Email sending functionality

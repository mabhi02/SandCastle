import { action } from "./_generated/server";
import { v } from "convex/values";

/**
 * Extract payment amount from call transcript using OpenAI
 */
export const extractPaymentAmount = action({
  args: {
    transcript: v.string(),
    callId: v.optional(v.string()),
  },
  handler: async (ctx, args): Promise<{
    success: boolean;
    amount?: number;
    amountText?: string;
    confidence?: string;
    error?: string;
  }> => {
    try {
      const openaiApiKey = process.env.OPENAI_API_KEY;
      if (!openaiApiKey) {
        throw new Error('OPENAI_API_KEY is not set');
      }

      const prompt = `
Please analyze this call transcript and extract the payment amount that the person who was called agreed to pay.

Transcript:
${args.transcript}

Instructions:
1. Look for any mention of payment amounts, dollar figures, or financial commitments
2. Focus on what the CUSTOMER (person who was called) agreed to pay
3. Extract the specific dollar amount they committed to
4. If multiple amounts are mentioned, prioritize the final agreed amount
5. If no clear payment amount is found, return null

Respond with a JSON object in this exact format:
{
  "amount": <number in cents, e.g. 1250 for $12.50, or null if no amount found>,
  "amountText": "<the exact text from transcript mentioning the amount, or null>",
  "confidence": "<high|medium|low based on how clear the agreement was>"
}

Examples:
- If customer says "I'll pay $50 today" → {"amount": 5000, "amountText": "I'll pay $50 today", "confidence": "high"}
- If agent says "Can you pay $25?" and customer says "Yes" → {"amount": 2500, "amountText": "Can you pay $25? Yes", "confidence": "high"}
- If no clear payment amount → {"amount": null, "amountText": null, "confidence": "low"}
`;

      console.log(`🤖 Calling OpenAI to extract payment amount from call ${args.callId || 'unknown'}`);

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openaiApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini', // Using the latest efficient model
          messages: [
            {
              role: 'system',
              content: 'You are an expert at analyzing call transcripts to extract payment commitments. Always respond with valid JSON only.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.1, // Low temperature for consistent extraction
          max_tokens: 500,
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`OpenAI API error: ${response.status} - ${error}`);
      }

      const result = await response.json();
      const content = result.choices?.[0]?.message?.content;

      if (!content) {
        throw new Error('No content received from OpenAI');
      }

      // Parse the JSON response
      let parsedResult;
      try {
        parsedResult = JSON.parse(content);
      } catch (parseError) {
        console.error('Failed to parse OpenAI response:', content);
        throw new Error('Invalid JSON response from OpenAI');
      }

      console.log(`✅ OpenAI extracted payment info:`, parsedResult);

      return {
        success: true,
        amount: parsedResult.amount,
        amountText: parsedResult.amountText,
        confidence: parsedResult.confidence,
      };

    } catch (error: any) {
      console.error("Failed to extract payment amount:", error);
      return {
        success: false,
        error: error.message,
      };
    }
  }
});

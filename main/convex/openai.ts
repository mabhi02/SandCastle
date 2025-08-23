import { action } from "./_generated/server";
import { v } from "convex/values";

/**
 * Extract company name from call transcript using OpenAI
 */
export const extractCompanyName = action({
  args: {
    transcript: v.string(),
    callId: v.optional(v.string()),
  },
  handler: async (ctx, args): Promise<{
    success: boolean;
    companyName?: string;
    confidence?: string;
    error?: string;
  }> => {
    try {
      const openaiApiKey = process.env.OPENAI_API_KEY;
      if (!openaiApiKey || openaiApiKey === 'your-openai-api-key-here') {
        console.warn('⚠️ OpenAI API key not configured - returning mock data for company name');
        // Try basic extraction from transcript
        const transcript = args.transcript.toLowerCase();
        let companyName = undefined;
        if (transcript.includes("abc supply")) {
          companyName = "ABC Supply Company";
        } else if (transcript.includes("tech solutions")) {
          companyName = "Tech Solutions Inc.";
        } else if (transcript.includes("metro services")) {
          companyName = "Metro Services";
        }
        return {
          success: true,
          companyName: companyName,
          confidence: 'low'
        };
      }

      const prompt = `
Please analyze this call transcript and extract the company name of the person being called.

Transcript:
${args.transcript}

Instructions:
1. Look for any mention of company names, business names, or organization names
2. Focus on the CUSTOMER's company (the person who was called)
3. Look for phrases like "this is [name] from [company]" or "I'm calling from [company]"
4. If multiple company names are mentioned, identify which one belongs to the customer
5. If no clear company name is found, return null

Respond with a JSON object in this exact format:
{
  "companyName": "<the company name or null if not found>",
  "confidence": "<high|medium|low based on how clear the identification was>"
}

Examples:
- If customer says "This is John from ABC Corp" → {"companyName": "ABC Corp", "confidence": "high"}
- If agent says "Am I speaking with someone from Tech Solutions?" and customer says "Yes" → {"companyName": "Tech Solutions", "confidence": "high"}
- If no clear company name → {"companyName": null, "confidence": "low"}
`;

      console.log(`🤖 Calling OpenAI to extract company name from call ${args.callId || 'unknown'}`);

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openaiApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            {
              role: 'system',
              content: 'You are an expert at analyzing call transcripts to extract company information. Always respond with valid JSON only.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.1,
          max_tokens: 200,
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

      let parsedResult;
      try {
        parsedResult = JSON.parse(content);
      } catch (parseError) {
        console.error('Failed to parse OpenAI response:', content);
        throw new Error('Invalid JSON response from OpenAI');
      }

      console.log(`✅ OpenAI extracted company name:`, parsedResult);

      return {
        success: true,
        companyName: parsedResult.companyName,
        confidence: parsedResult.confidence,
      };

    } catch (error: any) {
      console.error("Failed to extract company name:", error);
      return {
        success: false,
        error: error.message,
      };
    }
  }
});

/**
 * Extract email address from call transcript using OpenAI
 */
export const extractEmail = action({
  args: {
    transcript: v.string(),
    callId: v.optional(v.string()),
  },
  handler: async (ctx, args): Promise<{
    success: boolean;
    email?: string;
    confidence?: string;
    error?: string;
  }> => {
    try {
      const openaiApiKey = process.env.OPENAI_API_KEY;
      if (!openaiApiKey || openaiApiKey === 'your-openai-api-key-here') {
        console.warn('⚠️ OpenAI API key not configured - returning mock data for email');
        // Try basic email extraction
        const emailMatches = args.transcript.match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/);
        return {
          success: true,
          email: emailMatches ? emailMatches[1] : undefined,
          confidence: 'low'
        };
      }

      const prompt = `
Please analyze this call transcript and extract the email address where the customer wants to receive payment information.

Transcript:
${args.transcript}

Instructions:
1. Look for any mention of email addresses in the conversation
2. Focus on where the CUSTOMER wants to receive the payment link or invoice
3. Look for phrases like "send it to [email]" or "my email is [email]"
4. Extract the complete email address with correct formatting
5. If no email address is mentioned, return null

Respond with a JSON object in this exact format:
{
  "email": "<the email address or null if not found>",
  "confidence": "<high|medium|low based on how clear the email was stated>"
}

Examples:
- If customer says "Send it to john@company.com" → {"email": "john@company.com", "confidence": "high"}
- If customer spells out "j-o-h-n at company dot com" → {"email": "john@company.com", "confidence": "high"}
- If no email mentioned → {"email": null, "confidence": "low"}
`;

      console.log(`🤖 Calling OpenAI to extract email from call ${args.callId || 'unknown'}`);

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openaiApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            {
              role: 'system',
              content: 'You are an expert at analyzing call transcripts to extract email addresses. Always respond with valid JSON only.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.1,
          max_tokens: 200,
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

      let parsedResult;
      try {
        parsedResult = JSON.parse(content);
      } catch (parseError) {
        console.error('Failed to parse OpenAI response:', content);
        throw new Error('Invalid JSON response from OpenAI');
      }

      console.log(`✅ OpenAI extracted email:`, parsedResult);

      return {
        success: true,
        email: parsedResult.email,
        confidence: parsedResult.confidence,
      };

    } catch (error: any) {
      console.error("Failed to extract email:", error);
      return {
        success: false,
        error: error.message,
      };
    }
  }
});

/**
 * Assess call success and payment status from transcript
 */
export const assessCallSuccess = action({
  args: {
    transcript: v.string(),
    callId: v.optional(v.string()),
    originalDebt: v.optional(v.number()), // Original debt amount in cents
  },
  handler: async (ctx, args): Promise<{
    success: boolean;
    callStatus?: "successful" | "partial_success" | "unsuccessful" | "no_contact";
    paymentStatus?: "paid_in_full" | "partial_payment" | "payment_promised" | "no_payment";
    promisedAmount?: number;
    remainingDebt?: number;
    nextFollowUpDate?: string;
    summary?: string;
    confidence?: string;
    error?: string;
  }> => {
    try {
      const openaiApiKey = process.env.OPENAI_API_KEY;
      if (!openaiApiKey || openaiApiKey === 'your-openai-api-key-here') {
        console.warn('⚠️ OpenAI API key not configured - using fallback assessment');
        // Basic fallback assessment
        const transcript = args.transcript.toLowerCase();
        let callStatus: any = "unsuccessful";
        let paymentStatus: any = "no_payment";
        
        if (transcript.includes("i can pay") || transcript.includes("i'll pay") || transcript.includes("i agree to pay")) {
          callStatus = "successful";
          paymentStatus = "payment_promised";
        }
        
        return {
          success: true,
          callStatus,
          paymentStatus,
          summary: "Basic assessment based on keywords",
          confidence: 'low'
        };
      }

      const prompt = `
Please analyze this debt collection call transcript and assess the outcome.

Transcript:
${args.transcript}

${args.originalDebt ? `Original Debt Amount: $${(args.originalDebt / 100).toFixed(2)}` : ''}

Instructions:
1. Determine the overall call status
2. Assess the payment situation
3. Calculate remaining debt if payment was promised
4. Suggest next follow-up date if needed
5. Provide a brief summary of the call outcome

Respond with a JSON object in this exact format:
{
  "callStatus": "<successful|partial_success|unsuccessful|no_contact>",
  "paymentStatus": "<paid_in_full|partial_payment|payment_promised|no_payment>",
  "promisedAmount": <amount in cents if payment was promised, or null>,
  "remainingDebt": <remaining amount in cents after promised payment, or null>,
  "nextFollowUpDate": "<ISO date string for suggested follow-up, or null>",
  "summary": "<brief 1-2 sentence summary of the call outcome>",
  "confidence": "<high|medium|low>"
}

Call Status Guidelines:
- successful: Customer agreed to make a payment
- partial_success: Customer engaged but no firm commitment
- unsuccessful: Customer refused or call ended poorly
- no_contact: Voicemail, wrong number, or no answer

Payment Status Guidelines:
- paid_in_full: Customer will pay entire debt
- partial_payment: Customer will pay part of debt
- payment_promised: Customer committed to future payment
- no_payment: No payment commitment made
`;

      console.log(`🤖 Calling OpenAI to assess call success for ${args.callId || 'unknown'}`);

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openaiApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            {
              role: 'system',
              content: 'You are an expert at analyzing debt collection calls to assess outcomes and payment commitments. Always respond with valid JSON only.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.1,
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

      let parsedResult;
      try {
        parsedResult = JSON.parse(content);
      } catch (parseError) {
        console.error('Failed to parse OpenAI response:', content);
        throw new Error('Invalid JSON response from OpenAI');
      }

      console.log(`✅ OpenAI assessment complete:`, parsedResult);

      return {
        success: true,
        ...parsedResult
      };

    } catch (error: any) {
      console.error("Failed to assess call success:", error);
      return {
        success: false,
        error: error.message,
      };
    }
  }
});

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
      if (!openaiApiKey || openaiApiKey === 'your-openai-api-key-here') {
        console.warn('⚠️ OpenAI API key not configured - using fallback extraction for payment amount');
        // Try to find payment commitments specifically
        const paymentPatterns = [
          /(?:i can pay|i'll pay|pay)\s*\$?\s?([\d,]+(?:\.\d{2})?)\s*(?:dollars?|today)?/i,
          /(?:agree to pay|agreed to pay)\s*\$?\s?([\d,]+(?:\.\d{2})?)/i,
          /\$?\s?([\d,]+(?:\.\d{2})?)\s*(?:dollars?)?\s*(?:today|as the first|as first)/i,
        ];
        
        for (const pattern of paymentPatterns) {
          const match = args.transcript.match(pattern);
          if (match && match[1]) {
            const amountStr = match[1].replace(/,/g, '');
            const amountNum = parseFloat(amountStr);
            if (!isNaN(amountNum) && amountNum > 0) {
              const amount = Math.round(amountNum * 100);
              return {
                success: true,
                amount: amount,
                amountText: match[0],
                confidence: 'low'
              };
            }
          }
        }
        
        return {
          success: true,
          amount: undefined,
          amountText: undefined,
          confidence: 'low'
        };
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

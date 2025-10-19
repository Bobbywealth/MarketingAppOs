import OpenAI from 'openai';

let openai: OpenAI | null = null;

export function initializeEmailParser() {
  if (!process.env.OPENAI_API_KEY) {
    console.warn("⚠️ OPENAI_API_KEY not set. Email parsing will be disabled.");
    return;
  }
  openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  console.log("✅ Email parser initialized.");
}

export interface ParsedEmailData {
  type: string; // 'order', 'invoice', 'receipt', 'shipping', 'other'
  orderNumber?: string;
  total?: number;
  currency?: string;
  items?: Array<{ name: string; quantity?: number; price?: number }>;
  date?: string;
  vendor?: string;
  status?: string;
  trackingNumber?: string;
  extractedData?: Record<string, any>;
}

export async function parseEmailContent(emailSubject: string, emailBody: string): Promise<ParsedEmailData> {
  if (!openai) {
    throw new Error("Email parser not initialized. Please set OPENAI_API_KEY.");
  }

  const systemPrompt = `You are an email parsing assistant. Extract structured data from emails.

Common email types:
- Restaurant/food delivery orders (Uber Eats, DoorDash, GrubHub, etc.)
- Invoices
- Receipts
- Shipping notifications
- Payment confirmations

Extract ALL relevant data including:
- Type of email
- Order/Invoice/Transaction number
- Total amount and currency
- Items ordered (with quantities and prices if available)
- Date/timestamp
- Vendor/merchant name
- Status
- Tracking numbers (if shipping)
- Any other relevant data

Respond ONLY with valid JSON in this format:
{
  "type": "order|invoice|receipt|shipping|payment|other",
  "orderNumber": "order or transaction ID",
  "total": 123.45,
  "currency": "USD",
  "items": [{"name": "item name", "quantity": 2, "price": 10.50}],
  "date": "YYYY-MM-DD or timestamp",
  "vendor": "company name",
  "status": "confirmed|pending|delivered|etc",
  "trackingNumber": "tracking ID if available",
  "extractedData": {
    "any_other_key": "any_other_value"
  }
}

If data is missing, omit the field or set to null. Extract as much as possible.`;

  const userPrompt = `Subject: ${emailSubject}

Body:
${emailBody}`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      temperature: 0.1,
      response_format: { type: "json_object" }
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error("No response from AI");
    }

    const parsed: ParsedEmailData = JSON.parse(content);
    return parsed;
  } catch (error) {
    console.error("Email parsing error:", error);
    throw error;
  }
}


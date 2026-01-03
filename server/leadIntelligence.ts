import OpenAI from "openai";
import { storage } from "./storage";
import { Lead } from "@shared/schema";

let openai: OpenAI | null = null;

function getOpenAIClient() {
  if (openai) return openai;
  
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    console.warn("⚠️ OPENAI_API_KEY is not set. AI features will be disabled.");
    return null;
  }
  
  openai = new OpenAI({ apiKey });
  return openai;
}

/**
 * Uses AI to analyze a lead based on their company and website
 */
export async function analyzeLeadWithAI(leadId: string) {
  try {
    const client = getOpenAIClient();
    if (!client) {
      console.error("Cannot analyze lead: OpenAI client not initialized (missing API key)");
      return null;
    }

    const lead = await storage.getLead(leadId);
    if (!lead) throw new Error("Lead not found");

    const systemPrompt = `You are a Lead Intelligence Specialist for a marketing agency.
Your goal is to analyze a lead's business and provide strategic insights.

Based on the provided company name and website, determine:
1. Industry (e.g., HVAC, Real Estate, E-commerce, Software)
2. Needs (What marketing services might they need? Choose from: social_media, content, website, ads, branding, google_optimization, crm)
3. Score (How good of a fit are they for a premium marketing service? hot, warm, cold)
4. Notes (A brief strategic summary of why you gave that score and what their main pain point might be)

Return your findings in a JSON format:
{
  "industry": "string",
  "needs": ["string", "string"],
  "score": "hot" | "warm" | "cold",
  "notes": "string"
}`;

    const userPrompt = `Analyze this lead:
Company: ${lead.company}
Website: ${lead.website || "Not provided"}
Current Industry: ${lead.industry || "Not provided"}
Current Needs: ${lead.needs?.join(", ") || "Not provided"}`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      response_format: { type: "json_object" },
      temperature: 0.2,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) throw new Error("AI returned no content");

    const analysis = JSON.parse(content);

    // Update the lead with AI insights
    const updatedLead = await storage.updateLead(leadId, {
      industry: lead.industry || analysis.industry,
      needs: Array.from(new Set([...(lead.needs || []), ...(analysis.needs || [])])),
      score: analysis.score || lead.score,
      notes: `${lead.notes || ""}\n\n--- AI Analysis (${new Date().toLocaleDateString()}) ---\n${analysis.notes}`.trim(),
    });

    return updatedLead;
  } catch (error) {
    console.error("Error in analyzeLeadWithAI:", error);
    throw error;
  }
}





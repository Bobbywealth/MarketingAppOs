import { Request, Response } from "express";
import { storage } from "../storage";
import { db } from "../db";
import { leads as leadsSchema } from "@shared/schema";
import { eq } from "drizzle-orm";
import OpenAI from "openai";
import { analyzeLeadWithAI } from "../leadIntelligence";
import {
  getAccessibleLeadOr404
} from "../routes/utils";

interface CreateOutreachDraftProps {
    leadId: string;
    goal: string;
    type?: 'email' | 'sms' | 'social';
    actorUserId: string;
}

export const handleAIAnalyze = async (req: Request, res: Response) => {
  try {
    const lead = await getAccessibleLeadOr404(req, res, req.params.id);
    if (!lead) return;
    
    const updatedLead = await analyzeLeadWithAI(req.params.id);
    res.json(updatedLead);
  } catch (error: any) {
    console.error("AI Analysis error:", error);
    res.status(500).json({ message: "Failed to analyze lead with AI", error: error.message });
  }
};

export const handleDraftOutreach = async (req: Request, res: Response) => {
  try {
    const lead = await getAccessibleLeadOr404(req, res, req.params.id);
    if (!lead) return;

    const { goal, type = 'email' } = req.body;
    if (!goal) return res.status(400).json({ message: "Outreach goal is required" });

    // Fetch context
    const activities = await storage.getLeadActivities(req.params.id);
    // Note: storage.getEmails(undefined) is a generic call. If lead emails are fetched by lead.email, consider adding a specific method to storage or handling email filtering here.
    const userEmails = await storage.getEmails(undefined); 
    const leadEmails = userEmails.filter(e => e.from === lead.email || (Array.isArray(e.to) && e.to.includes(lead.email as any)));

    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    const systemPrompt = `You are a Sales Outreach Specialist. Generate a personalized ${type} draft for a lead.\nUse the provided lead context and interaction history to make the message highly relevant and authentic.\nTone: Professional, helpful, and not pushy.\nGoal: ${goal}`;

    const contextPrompt = `Lead Context:\nCompany: ${lead.company}\nName: ${lead.name || "Not provided"}\nIndustry: ${lead.industry}\nNotes: ${lead.notes}\n\nInteraction History:\n${activities.slice(0, 5).map(a => `- ${a.createdAt}: ${a.type} - ${a.description}`).join("\n")}\n\nRecent Emails:\n${leadEmails.slice(0, 3).map(e => `- ${e.receivedAt}: ${e.subject}`).join("\n")}\n\nGenerate a draft ${type} message. Include a subject line if it's an email.`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: contextPrompt }
      ],
      temperature: 0.7,
    });

    res.json({ draft: response.choices[0]?.message?.content });

  } catch (error: any) {
    console.error("Outreach drafting error:", error);
    res.status(500).json({ message: "Failed to generate outreach draft", error: error.message });
  }
};

export const analyzeLeadInBackground = async (leadId: string): Promise<void> => {
  analyzeLeadWithAI(leadId).catch(err => console.error("Background AI analysis failed:", err));
};

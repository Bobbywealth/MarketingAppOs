import { Router, Request, Response } from "express";
import { storage } from "../storage";
import { db } from "../db";
import { leads } from "@shared/schema";
import { eq, sql } from "drizzle-orm";
import { isAuthenticated } from "../auth";
import { requirePermission } from "../rbac";
import { UserRole } from "@shared/roles";
import { 
  getCurrentUserContext, 
  getAccessibleLeadOr404 
} from "./utils";
import { 
  handleValidationError, 
  notifyAdminsAboutAction, 
  autoConvertLeadToClient, 
  getMissingFieldsForStage,
  upload
} from "./common";
import { insertLeadSchema, subscriptionPackages } from "@shared/schema";
import { ZodError } from "zod";
import fs from "fs/promises";
import OpenAI from "openai";
import { analyzeLeadWithAI } from "../leadIntelligence";
import { notifyAboutLeadAction } from "../leadNotifications";
import { createCheckoutSession } from "../stripeService";

const router = Router();

router.get("/", isAuthenticated, requirePermission("canManageLeads"), async (_req: Request, res: Response) => {
  try {
    const user = _req.user as any;
    const all = await storage.getLeads(user);
    console.log("DEBUG: API /api/leads returning", all.length, "leads");
    res.json(all);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to fetch leads" });
  }
});

router.get("/:id", isAuthenticated, requirePermission("canManageLeads"), async (req: Request, res: Response) => {
  try {
    const lead = await getAccessibleLeadOr404(req, res, req.params.id);
    if (!lead) return;
    res.json(lead);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to fetch lead" });
  }
});

router.post("/", isAuthenticated, requirePermission("canManageLeads"), async (req: Request, res: Response) => {
  try {
    const { userId, role } = getCurrentUserContext(req);
    const validatedData = insertLeadSchema.parse(req.body);
    // Sales agents can only create leads assigned to themselves
    if (role === UserRole.SALES_AGENT && userId) {
      (validatedData as any).assignedToId = userId;
    }
    const lead = await storage.createLead(validatedData);
    
    // Trigger AI analysis in the background
    analyzeLeadWithAI(lead.id).catch(err => console.error("Background AI analysis failed:", err));
    
    // Notify relevant parties
    notifyAboutLeadAction({
      lead,
      action: 'created',
      actorId: userId
    }).catch(err => console.error("Failed to send lead creation notifications:", err));
    
    res.status(201).json(lead);
  } catch (error) {
    handleValidationError(error, res);
  }
});

router.patch("/:id", isAuthenticated, requirePermission("canManageLeads"), async (req: Request, res: Response) => {
  try {
    const existing = await getAccessibleLeadOr404(req, res, req.params.id);
    if (!existing) return;
    const validatedData = insertLeadSchema.partial().strip().parse(req.body);
    const { userId, role } = getCurrentUserContext(req);

    // Sales agents cannot re-assign leads away from themselves
    if (role === UserRole.SALES_AGENT && (validatedData as any).assignedToId && Number((validatedData as any).assignedToId) !== Number(userId)) {
      return res.status(403).json({ message: "Forbidden: sales agents cannot reassign leads" });
    }

    // Stage required-field validation
    const nextStage = (validatedData as any).stage as string | undefined;
    if (nextStage && nextStage !== (existing as any).stage) {
      const merged = { ...(existing as any), ...(validatedData as any) };
      const missingFields = getMissingFieldsForStage(nextStage, merged);
      if (missingFields.length > 0) {
        return res.status(400).json({
          message: `Cannot move lead to '${nextStage}': missing required field(s)`,
          missingFields,
        });
      }
    }

    const lead = await storage.updateLead(req.params.id, validatedData);
    
    // Check for significant changes to notify about
    const assignedChanged = (validatedData as any).assignedToId && Number((validatedData as any).assignedToId) !== Number((existing as any).assignedToId);
    const stageChanged = nextStage && nextStage !== (existing as any).stage;

    if (assignedChanged) {
      notifyAboutLeadAction({
        lead,
        action: 'assigned',
        actorId: userId
      }).catch(err => console.error("Failed to send lead assignment notifications:", err));
    } else if (stageChanged && nextStage !== "closed_won") {
      // closed_won is handled by autoConvertLeadToClient
      notifyAboutLeadAction({
        lead,
        action: 'stage_changed',
        actorId: userId,
        oldStage: (existing as any).stage,
        newStage: nextStage
      }).catch(err => console.error("Failed to send lead stage notifications:", err));
    }
    
    // Auto-convert Closed Won -> Client + Onboarding + Commission
    if (nextStage === "closed_won" && (existing as any).stage !== "closed_won") {
      try {
        await autoConvertLeadToClient({ leadId: lead.id, actorUserId: userId });
        const refreshed = await db.select().from(leads).where(eq(leads.id, lead.id));
        return res.json(refreshed[0] ?? lead);
      } catch (e: any) {
        console.error("Auto-convert failed:", e);
        return res.status(500).json({ message: "Lead updated but auto-conversion failed", error: e?.message || String(e) });
      }
    }

    res.json(lead);
  } catch (error: any) {
    if (error instanceof ZodError) {
      return res.status(400).json({ message: "Validation error", errors: error.errors });
    }
    if (error.message?.includes("not found")) {
      return res.status(404).json({ message: error.message });
    }
    console.error(error);
    res.status(500).json({ message: "Failed to update lead" });
  }
});

router.delete("/:id", isAuthenticated, requirePermission("canManageLeads"), async (req: Request, res: Response) => {
  try {
    const existing = await getAccessibleLeadOr404(req, res, req.params.id);
    if (!existing) return;
    await storage.deleteLead(req.params.id);
    res.status(204).send();
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to delete lead" });
  }
});

// Lead Activities Routes
router.post("/:id/activities", isAuthenticated, requirePermission("canManageLeads"), async (req: Request, res: Response) => {
  try {
    const lead = await getAccessibleLeadOr404(req, res, req.params.id);
    if (!lead) return;
    const user = req.user as any;
    const userId = user?.id || user?.claims?.sub;
    const leadId = req.params.id;
    const { type, subject, description, outcome } = req.body;

    // Create activity
    const activity = await storage.createLeadActivity({
      leadId,
      userId,
      type,
      subject,
      description,
      outcome,
      metadata: {},
    });

    // Notify assigned agent if someone else added an activity
    if (lead.assignedToId && Number(lead.assignedToId) !== Number(userId)) {
      storage.createNotification({
        userId: lead.assignedToId,
        type: 'info',
        title: `💬 New ${type} Activity`,
        message: `A new ${type} was added to lead ${lead.company} by another team member.`,
        category: 'lead',
        actionUrl: `/leads?leadId=${lead.id}`,
        isRead: false,
      }).catch(err => console.error("Failed to notify agent about activity:", err));
    }

    // Update lead's last contact info if it's a contact activity
    if (['call', 'email', 'sms', 'meeting'].includes(type)) {
      await storage.updateLead(leadId, {
        lastContactMethod: type,
        lastContactDate: new Date().toISOString(),
        lastContactNotes: description?.substring(0, 500) || null,
      });
    }

    res.status(201).json(activity);
  } catch (error) {
    console.error("Error creating lead activity:", error);
    res.status(500).json({ message: "Failed to create activity" });
  }
});

router.get("/:id/activities", isAuthenticated, requirePermission("canManageLeads"), async (req: Request, res: Response) => {
  try {
    const lead = await getAccessibleLeadOr404(req, res, req.params.id);
    if (!lead) return;
    const activities = await storage.getLeadActivities(req.params.id);
    res.json(activities);
  } catch (error) {
    console.error("Error fetching lead activities:", error);
    res.status(500).json({ message: "Failed to fetch activities" });
  }
});

// Parse CSV or PDF file for lead import
router.post("/parse-file", isAuthenticated, requirePermission("canManageLeads"), upload.single('file'), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    const file = req.file;
    const leadsList: any[] = [];

    if (file.mimetype === 'text/csv' || file.mimetype === 'application/csv' || file.originalname.endsWith('.csv')) {
      const content = await fs.readFile(file.path, 'utf-8');
      const lines = content.split('\n').filter(line => line.trim());
      
      if (lines.length === 0) {
        return res.status(400).json({ message: "CSV file is empty" });
      }

      function parseCSVLine(line: string): string[] {
        const result: string[] = [];
        let current = '';
        let inQuotes = false;
        
        for (let i = 0; i < line.length; i++) {
          const char = line[i];
          const nextChar = line[i + 1];
          
          if (char === '"' && nextChar === '"') {
            current += '"';
            i++;
          } else if (char === '"') {
            inQuotes = !inQuotes;
          } else if (char === ',' && !inQuotes) {
            result.push(current.trim());
            current = '';
          } else {
            current += char;
          }
        }
        result.push(current.trim());
        return result;
      }

      const headers = parseCSVLine(lines[0]).map(h => h.toLowerCase());
      
      for (let i = 1; i < lines.length; i++) {
        const values = parseCSVLine(lines[i]);
        const lead: any = {
          stage: 'prospect',
          score: 'warm',
          source: 'import'
        };

        headers.forEach((header, index) => {
          const value = values[index];
          if (!value) return;

          if (header.includes('name') || header.includes('contact')) {
            lead.name = value;
          } else if (header.includes('email') || header.includes('e-mail')) {
            lead.email = value;
          } else if (header.includes('phone') || header.includes('mobile') || header.includes('tel')) {
            lead.phone = value;
          } else if (header.includes('company') || header.includes('organization')) {
            lead.company = value;
          } else if (header.includes('website') || header.includes('url')) {
            lead.website = value;
          } else if (header.includes('industry') || header.includes('vertical') || header.includes('sector')) {
            lead.industry = value;
          } else if (header.includes('tag') || header.includes('categor') || header.includes('label')) {
            if (value) {
              lead.tags = value.split(',').map((t: string) => t.trim()).filter((t: string) => t);
            }
          } else if (header.includes('address') || header.includes('location')) {
            lead.address = value;
          } else if (header.includes('city')) {
            lead.city = value;
          } else if (header.includes('state') || header.includes('province')) {
            lead.state = value;
          } else if (header.includes('zip') || header.includes('postal')) {
            lead.zipCode = value;
          } else if (header.includes('value') || header.includes('amount')) {
            lead.value = Math.round(parseFloat(value) * 100) || null;
          } else if (header.includes('note') || header.includes('description') || header.includes('comment')) {
            lead.notes = value;
          }
        });

        if (!lead.company && lead.name) {
          lead.company = lead.name;
          lead.name = null;
        }
        
        if (lead.company) {
          leadsList.push(lead);
        }
      }

    } else if (file.mimetype === 'application/pdf') {
      const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
      const pdfBuffer = await fs.readFile(file.path);
      const pdfText = pdfBuffer.toString('utf-8');
      
      const systemPrompt = `You are a lead extraction assistant. Extract contact/lead information from the provided text.
      
Return a JSON array of leads with these fields:
- name (required)
- email
- phone
- company
- website
- address
- city
- state
- zipCode
- estimatedValue (number)
- notes

Only extract actual leads/contacts. Skip headers, footers, and non-contact information.`;

      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Extract leads from this text:\n\n${pdfText}` }
        ],
        temperature: 0.1,
        response_format: { type: "json_object" }
      });

      const content = response.choices[0]?.message?.content;
      if (content) {
        const parsed = JSON.parse(content);
        leadsList.push(...(parsed.leads || []));
      }
    } else {
      return res.status(400).json({ message: "Invalid file type. Please upload CSV or PDF." });
    }

    try {
      await fs.unlink(file.path);
    } catch (cleanupError) {
      console.error("Failed to delete uploaded file:", cleanupError);
    }

    res.json({ leads: leadsList, count: leadsList.length });
  } catch (error: any) {
    console.error("File parsing error:", error);
    if (req.file?.path) {
      try {
        await fs.unlink(req.file.path);
      } catch (cleanupError) {
        console.error("Failed to delete uploaded file after error:", cleanupError);
      }
    }
    res.status(500).json({ message: "Failed to parse file", error: error.message });
  }
});

// Bulk import leads
router.post("/bulk-import", isAuthenticated, requirePermission("canManageLeads"), async (req: Request, res: Response) => {
  try {
    const { leads: leadsToImport } = req.body;
    
    if (!Array.isArray(leadsToImport) || leadsToImport.length === 0) {
      return res.status(400).json({ message: "No leads provided" });
    }

    let imported = 0;
    let skipped = 0;
    const existingLeads = await storage.getLeads();

    for (const leadData of leadsToImport) {
      try {
        if (leadData.email && existingLeads.some(l => l.email === leadData.email)) {
          skipped++;
          continue;
        }

        const validatedData = insertLeadSchema.parse({
          ...leadData,
          stage: leadData.stage || 'prospect',
          score: leadData.score || 'warm',
          source: leadData.source || 'import',
          createdAt: new Date(),
        });
        
        await storage.createLead(validatedData);
        imported++;
      } catch (error) {
        console.error("Failed to import lead:", leadData, error);
        skipped++;
      }
    }

    res.json({ imported, skipped, total: leadsToImport.length });
  } catch (error: any) {
    console.error("Bulk import error:", error);
    res.status(500).json({ message: "Failed to import leads", error: error.message });
  }
});

// AI Intelligence & Copilot Routes
router.post("/:id/ai-analyze", isAuthenticated, requirePermission("canManageLeads"), async (req: Request, res: Response) => {
  try {
    const lead = await getAccessibleLeadOr404(req, res, req.params.id);
    if (!lead) return;
    
    const updatedLead = await analyzeLeadWithAI(req.params.id);
    res.json(updatedLead);
  } catch (error: any) {
    console.error("AI Analysis error:", error);
    res.status(500).json({ message: "Failed to analyze lead with AI", error: error.message });
  }
});

router.post("/:id/draft-outreach", isAuthenticated, requirePermission("canManageLeads"), async (req: Request, res: Response) => {
  try {
    const lead = await getAccessibleLeadOr404(req, res, req.params.id);
    if (!lead) return;

    const { goal, type = 'email' } = req.body;
    if (!goal) return res.status(400).json({ message: "Outreach goal is required" });

    // Fetch context
    const activities = await storage.getLeadActivities(req.params.id);
    const userEmails = await storage.getEmails(undefined); // Generic for now, ideally filtered by lead email
    const leadEmails = userEmails.filter(e => e.from === lead.email || (Array.isArray(e.to) && e.to.includes(lead.email as any)));

    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    const systemPrompt = `You are a Sales Outreach Specialist. Generate a personalized ${type} draft for a lead.
Use the provided lead context and interaction history to make the message highly relevant and authentic.
Tone: Professional, helpful, and not pushy.
Goal: ${goal}`;

    const contextPrompt = `Lead Context:
Company: ${lead.company}
Name: ${lead.name || "Not provided"}
Industry: ${lead.industry}
Notes: ${lead.notes}

Interaction History:
${activities.slice(0, 5).map(a => `- ${a.createdAt}: ${a.type} - ${a.description}`).join("\n")}

Recent Emails:
${leadEmails.slice(0, 3).map(e => `- ${e.receivedAt}: ${e.subject}`).join("\n")}

Generate a draft ${type} message. Include a subject line if it's an email.`;

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
});

router.post("/:id/payment-link", isAuthenticated, requirePermission("canManageLeads"), async (req: Request, res: Response) => {
  try {
    const lead = await getAccessibleLeadOr404(req, res, req.params.id);
    if (!lead) return;

    if (!lead.email) {
      return res.status(400).json({ message: "Lead email is required to generate a payment link" });
    }

    if (!lead.packageId) {
      return res.status(400).json({ message: "Please assign a subscription package to this lead before generating a payment link" });
    }

    // Fetch package details
    const [pkg] = await db.select().from(subscriptionPackages).where(eq(subscriptionPackages.id, lead.packageId)).limit(1);
    if (!pkg) {
      return res.status(404).json({ message: "Subscription package not found" });
    }

    const appUrl = process.env.APP_URL || `${req.protocol}://${req.get("host")}`;
    
    const session = await createCheckoutSession({
      packageId: pkg.id,
      packageName: pkg.name,
      packagePrice: pkg.price,
      clientEmail: lead.email,
      clientName: lead.company || lead.name || "Valued Client",
      leadId: lead.id,
      successUrl: `${appUrl}/payment-success?sessionId={CHECKOUT_SESSION_ID}`,
      cancelUrl: `${appUrl}/leads?leadId=${lead.id}`,
    });

    // Log activity
    await storage.createLeadActivity({
      leadId: lead.id,
      userId: (req.user as any).id,
      type: 'email',
      subject: 'Payment Link Generated',
      description: `Generated a payment link for ${pkg.name} ($${(pkg.price / 100).toFixed(2)}/mo).`,
      outcome: 'neutral',
      metadata: { checkoutUrl: session.checkoutUrl },
    });

    res.json({ checkoutUrl: session.checkoutUrl });
  } catch (error: any) {
    console.error("Payment link generation error:", error);
    res.status(500).json({ message: "Failed to generate payment link", error: error.message });
  }
});

export default router;


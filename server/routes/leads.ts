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
  getMissingFieldsForStage
} from "./common";
import { insertLeadSchema, subscriptionPackages } from "@shared/schema";
import { ZodError } from "zod";
import { notifyAboutLeadAction } from "../leadNotifications";
import { createCheckoutSession } from "../stripeService";
import { handleParseFile, handleBulkImport, upload } from "../services/LeadImportService";
import { handleAIAnalyze, handleDraftOutreach, analyzeLeadInBackground } from "../services/LeadAIService";
import { handleCreateLeadActivity, handleGetLeadActivities } from "../services/LeadActivityService";
import { convertLeadToClient } from "../services/LeadClientConversionService";

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
    analyzeLeadInBackground(lead.id).catch(err => console.error("Background AI analysis failed:", err));
    
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
      // closed_won is handled by convertLeadToClient
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
        const { refreshedLead } = await convertLeadToClient({ leadId: lead.id, actorUserId: userId });
        return res.json(refreshedLead ?? lead);
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
router.post("/:id/activities", isAuthenticated, requirePermission("canManageLeads"), handleCreateLeadActivity);

router.get("/:id/activities", isAuthenticated, requirePermission("canManageLeads"), handleGetLeadActivities);

// Parse CSV or PDF file for lead import
router.post("/parse-file", isAuthenticated, requirePermission("canManageLeads"), upload.single('file'), handleParseFile);

// Bulk import leads
router.post("/bulk-import", isAuthenticated, requirePermission("canManageLeads"), handleBulkImport);

// AI Intelligence & Copilot Routes
router.post("/:id/ai-analyze", isAuthenticated, requirePermission("canManageLeads"), handleAIAnalyze);

router.post("/:id/draft-outreach", isAuthenticated, requirePermission("canManageLeads"), handleDraftOutreach);

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

import { Router, Request, Response } from "express";
import { storage } from "../storage";
import { db, pool } from "../db";
import { clients, creators, clientCreators, creatorVisits, onboardingTasks, clientSocialStats } from "@shared/schema";
import { eq, and, or, sql } from "drizzle-orm";
import { isAuthenticated } from "../auth";
import { requirePermission, requireRole } from "../rbac";
import { UserRole } from "@shared/roles";
import { 
  getCurrentUserContext, 
  getAccessibleClientOr404 
} from "./utils";
import { 
  handleValidationError, 
  notifyAdminsAboutAction 
} from "./common";
import { insertClientSchema, insertClientSocialStatsSchema } from "@shared/schema";
import { z, ZodError } from "zod";
import OpenAI from "openai";

const router = Router();

// Internal roles for creators/visits
const internalRoles = [UserRole.ADMIN, UserRole.MANAGER, UserRole.STAFF, UserRole.CREATOR_MANAGER] as const;

router.get("/", isAuthenticated, requirePermission("canManageClients"), async (_req: Request, res: Response) => {
  try {
    const user = _req.user as any;
    const all = await storage.getClients(user);
    res.json(all);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to fetch clients" });
  }
});

router.get("/:id", isAuthenticated, requirePermission("canManageClients"), async (req: Request, res: Response) => {
  try {
    const client = await getAccessibleClientOr404(req, res, req.params.id);
    if (!client) return;
    res.json(client);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to fetch client" });
  }
});

router.post("/", isAuthenticated, requirePermission("canManageClients"), async (req: Request, res: Response) => {
  try {
    const validatedData = insertClientSchema.parse(req.body);
    const client = await storage.createClient(validatedData);
    
    // Get actor information
    const user = req.user as any;
    const actorName = user?.firstName || user?.username || 'A team member';
    const actorRole = user?.role || 'staff';
    
    // Notify admins if staff/manager created the client
    if (actorRole !== 'admin') {
      await notifyAdminsAboutAction(
        user?.id,
        actorName,
        '🎉 New Client Added',
        `${actorName} added new client: ${client.name}`,
        'client',
        `/clients?clientId=${client.id}`,
        'success'
      );
    }

    // Email alert to admins
    try {
      const allUsers = await storage.getUsers();
      const admins = allUsers.filter(u => u.role === UserRole.ADMIN && u.email);

      if (admins.length > 0) {
        const { emailNotifications } = await import('../emailService');

        // Batch fetch notification preferences for all admins
        const adminIds = admins.map(a => a.id);
        const allPrefs = await Promise.all(
          adminIds.map(id => storage.getUserNotificationPreferences(id).catch(() => null))
        );
        const prefsMap = new Map(adminIds.map((id, i) => [id, allPrefs[i]]));

        // Filter admins who have email notifications enabled
        const adminsToNotify = admins
          .filter(admin => prefsMap.get(admin.id)?.emailNotifications !== false)
          .map(admin => admin.email as string);

        if (adminsToNotify.length > 0) {
          void emailNotifications.sendNewClientAlert(
            adminsToNotify,
            client.name,
            client.company || '',
            client.email || ''
          ).catch(err => console.error('Failed to send new client email alert:', err));
        }
      }
    } catch (notifError) {
      console.error('Failed to notify admins about new client via email:', notifError);
    }
    
    res.status(201).json(client);
  } catch (error) {
    handleValidationError(error, res);
  }
});

router.patch("/:id", isAuthenticated, requirePermission("canManageClients"), async (req: Request, res: Response) => {
  try {
    const existing = await getAccessibleClientOr404(req, res, req.params.id);
    if (!existing) return;
    const validatedData = insertClientSchema.partial().strip().parse(req.body);
    // Gate "active" on onboarding completion
    if ((validatedData as any).status === "active") {
      const rows = await db
        .select({ count: sql<number>`count(*)` })
        .from(onboardingTasks)
        .where(and(eq(onboardingTasks.clientId, req.params.id), eq(onboardingTasks.completed, false)));
      const remaining = Number(rows?.[0]?.count ?? 0);
      if (remaining > 0) {
        return res.status(400).json({
          message: `Cannot set client to active: ${remaining} onboarding task(s) still incomplete`,
          remainingTasks: remaining,
        });
      }
    }
    const client = await storage.updateClient(req.params.id, validatedData);
    
    // Get actor information
    const user = req.user as any;
    const actorName = user?.firstName || user?.username || 'A team member';
    const actorRole = user?.role || 'staff';
    
    // Notify admins if staff/manager updated the client
    if (actorRole !== 'admin') {
      await notifyAdminsAboutAction(
        user?.id,
        actorName,
        '📝 Client Updated',
        `${actorName} updated client: ${client.name}`,
        'client',
        `/clients?clientId=${client.id}`,
        'info'
      );
    }
    
    res.json(client);
  } catch (error: any) {
    if (error instanceof ZodError) {
      return res.status(400).json({ message: "Validation error", errors: error.errors });
    }
    if (error.message?.includes("not found")) {
      return res.status(404).json({ message: error.message });
    }
    console.error(error);
    res.status(500).json({ message: "Failed to update client" });
  }
});

router.delete("/:id", isAuthenticated, requirePermission("canManageClients"), async (req: Request, res: Response) => {
  try {
    const existing = await getAccessibleClientOr404(req, res, req.params.id);
    if (!existing) return;
    await storage.deleteClient(req.params.id);
    res.status(204).send();
  } catch (error: any) {
    console.error(`❌ Error deleting client ${req.params.id}:`, error);
    
    // Provide more specific error message for foreign key constraints if they still happen
    if (error.code === '23503' || error.message?.includes('foreign key')) {
      return res.status(400).json({ 
        message: "Cannot delete client: This client has related records that prevent deletion.",
        detail: error.detail || error.message
      });
    }
    
    res.status(500).json({ message: "Failed to delete client", error: error.message });
  }
});

// Social Stats
router.get("/:clientId/social-stats", isAuthenticated, async (req: Request, res: Response) => {
  try {
    const client = await getAccessibleClientOr404(req, res, req.params.clientId);
    if (!client) return;
    const stats = await db.select().from(clientSocialStats).where(eq(clientSocialStats.clientId, req.params.clientId));
    res.json(stats);
  } catch (error) {
    console.error("Error fetching social stats:", error);
    res.status(500).json({ message: "Failed to fetch social stats" });
  }
});

router.post("/:clientId/social-stats", isAuthenticated, requirePermission("canManageClients"), async (req: Request, res: Response) => {
  try {
    const client = await getAccessibleClientOr404(req, res, req.params.clientId);
    if (!client) return;
    const user = req.user as any;
    const validatedData = insertClientSocialStatsSchema.parse({
      ...req.body,
      clientId: req.params.clientId,
      updatedBy: user.id,
      lastUpdated: new Date(),
    });
    
    const existing = await db.select().from(clientSocialStats)
      .where(
        and(
          eq(clientSocialStats.clientId, req.params.clientId),
          eq(clientSocialStats.platform, validatedData.platform)
        )
      )
      .limit(1);

    if (existing.length > 0) {
      const [updated] = await db.update(clientSocialStats)
        .set({
          ...validatedData,
          lastUpdated: new Date(),
        })
        .where(eq(clientSocialStats.id, existing[0].id))
        .returning();
      return res.json(updated);
    }

    const [created] = await db.insert(clientSocialStats).values(validatedData).returning();
    res.status(201).json(created);
  } catch (error) {
    handleValidationError(error, res);
  }
});

// Creators & Visits
router.get("/:clientId/creators", isAuthenticated, requireRole(...internalRoles), async (req: Request, res: Response) => {
  try {
    const rows = await db
      .select({
        id: clientCreators.id,
        clientId: clientCreators.clientId,
        creatorId: clientCreators.creatorId,
        role: clientCreators.role,
        active: clientCreators.active,
        assignedAt: clientCreators.assignedAt,
        unassignedAt: clientCreators.unassignedAt,
        creatorName: creators.fullName,
        creatorStatus: creators.status,
        ratePerVisitCents: creators.ratePerVisitCents,
        performanceScore: creators.performanceScore,
      })
      .from(clientCreators)
      .innerJoin(creators, eq(clientCreators.creatorId, creators.id))
      .where(and(eq(clientCreators.clientId, req.params.clientId), eq(clientCreators.active, true)))
      .orderBy(sql`${clientCreators.role} ASC, ${clientCreators.assignedAt} DESC`);
    res.json(rows);
  } catch (error: any) {
    res.status(500).json({ message: error.message || "Failed to fetch client creators" });
  }
});

export default router;


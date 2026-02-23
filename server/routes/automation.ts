/**
 * /api/automation — REST endpoints for Marketing Automation workflows.
 *
 * Lead Workflows:
 *   GET    /api/automation/workflows            list lead automations (filter: leadId, status)
 *   POST   /api/automation/workflows            create lead automation
 *   GET    /api/automation/workflows/:id        get single automation
 *   PATCH  /api/automation/workflows/:id        update automation
 *   DELETE /api/automation/workflows/:id        delete automation
 *
 * Marketing Series (drip sequences):
 *   GET    /api/automation/series               list series
 *   POST   /api/automation/series               create series
 *   GET    /api/automation/series/:id           get series with steps
 *   PATCH  /api/automation/series/:id           update series
 *   DELETE /api/automation/series/:id           delete series
 *   POST   /api/automation/series/:id/steps     add step to series
 *   PATCH  /api/automation/series-steps/:id     update step
 *   DELETE /api/automation/series-steps/:id     delete step
 *   POST   /api/automation/series/:id/enroll    enroll leads/clients in series
 *
 * Broadcasts:
 *   GET    /api/automation/broadcasts           list broadcasts
 *   POST   /api/automation/broadcasts           create & trigger broadcast
 *   GET    /api/automation/broadcasts/:id       get broadcast with recipient summary
 *   DELETE /api/automation/broadcasts/:id       delete broadcast
 */

import { Router, Request, Response } from "express";
import { db } from "../db";
import { storage } from "../storage";
import { isAuthenticated } from "../auth";
import { requireRole } from "../rbac";
import { UserRole } from "@shared/roles";
import {
  leadAutomations,
  insertLeadAutomationSchema,
  insertMarketingBroadcastSchema,
} from "@shared/schema";
import { eq, desc } from "drizzle-orm";
import { ZodError } from "zod";
import { processMarketingBroadcast } from "../marketingBroadcastProcessor";
import { ensureMarketingCenterSchema } from "./marketing-center";

const router = Router();

// All endpoints require authentication (session or API key).
router.use(isAuthenticated);

// Ensure marketing-center schema exists before any request.
router.use(async (_req, _res, next) => {
  try {
    await ensureMarketingCenterSchema();
    next();
  } catch (err) {
    console.error("[automation api] schema ensure failed:", err);
    next(err);
  }
});

// ─── Utility ─────────────────────────────────────────────────────────────────

function handleError(err: unknown, res: Response) {
  if (err instanceof ZodError) {
    return res.status(400).json({ message: "Validation error", errors: err.errors });
  }
  const msg = err instanceof Error ? err.message : "Internal server error";
  console.error("[automation api]", err);
  return res.status(500).json({ message: msg });
}

const requireStaff = requireRole(UserRole.ADMIN, UserRole.MANAGER, UserRole.STAFF, UserRole.SALES_AGENT);

// ─── Lead Workflows ──────────────────────────────────────────────────────────

/**
 * GET /api/automation/workflows
 * Query params: leadId (required unless admin listing all), status
 */
router.get("/workflows", requireStaff, async (req: Request, res: Response) => {
  try {
    const { leadId, status } = req.query as Record<string, string>;

    if (!leadId) {
      // Return all automations across leads (admin view)
      const all = await db.select().from(leadAutomations).orderBy(desc(leadAutomations.createdAt));
      const filtered = status ? all.filter((a) => a.status === status) : all;
      return res.json({
        data: filtered,
        meta: { total: filtered.length },
      });
    }

    let automations = await storage.getLeadAutomations(leadId);
    if (status) {
      automations = automations.filter((a) => a.status === status);
    }
    return res.json({
      data: automations,
      meta: { total: automations.length },
    });
  } catch (err) {
    return handleError(err, res);
  }
});

/**
 * POST /api/automation/workflows
 */
router.post("/workflows", requireStaff, async (req: Request, res: Response) => {
  try {
    const validated = insertLeadAutomationSchema.parse(req.body);
    const automation = await storage.createLeadAutomation(validated);
    return res.status(201).json(automation);
  } catch (err) {
    return handleError(err, res);
  }
});

/**
 * GET /api/automation/workflows/:id
 */
router.get("/workflows/:id", requireStaff, async (req: Request, res: Response) => {
  try {
    const [automation] = await db
      .select()
      .from(leadAutomations)
      .where(eq(leadAutomations.id, req.params.id))
      .limit(1);

    if (!automation) return res.status(404).json({ message: "Automation not found" });
    return res.json(automation);
  } catch (err) {
    return handleError(err, res);
  }
});

/**
 * PATCH /api/automation/workflows/:id
 */
router.patch("/workflows/:id", requireStaff, async (req: Request, res: Response) => {
  try {
    const partial = insertLeadAutomationSchema.partial().parse(req.body);
    const automation = await storage.updateLeadAutomation(req.params.id, partial);
    return res.json(automation);
  } catch (err) {
    return handleError(err, res);
  }
});

/**
 * DELETE /api/automation/workflows/:id
 */
router.delete("/workflows/:id", requireRole(UserRole.ADMIN, UserRole.MANAGER), async (req: Request, res: Response) => {
  try {
    await storage.deleteLeadAutomation(req.params.id);
    return res.status(204).end();
  } catch (err) {
    return handleError(err, res);
  }
});

// ─── Marketing Series ─────────────────────────────────────────────────────────

/**
 * GET /api/automation/series
 * Query params: channel, isActive
 */
router.get("/series", requireStaff, async (req: Request, res: Response) => {
  try {
    let series = await storage.getMarketingSeries();
    const { channel, isActive } = req.query as Record<string, string>;
    if (channel) series = series.filter((s) => s.channel === channel);
    if (isActive !== undefined) {
      const active = isActive === "true";
      series = series.filter((s) => s.isActive === active);
    }
    return res.json({
      data: series,
      meta: { total: series.length },
    });
  } catch (err) {
    return handleError(err, res);
  }
});

/**
 * POST /api/automation/series
 */
router.post("/series", requireRole(UserRole.ADMIN, UserRole.MANAGER), async (req: Request, res: Response) => {
  try {
    const user = req.user as any;
    const series = await storage.createMarketingSeries({
      ...req.body,
      createdBy: req.body.createdBy ?? user.id,
    });
    return res.status(201).json(series);
  } catch (err) {
    return handleError(err, res);
  }
});

/**
 * GET /api/automation/series/:id
 */
router.get("/series/:id", requireStaff, async (req: Request, res: Response) => {
  try {
    const series = await storage.getMarketingSeriesWithSteps(req.params.id);
    if (!series) return res.status(404).json({ message: "Series not found" });
    return res.json(series);
  } catch (err) {
    return handleError(err, res);
  }
});

/**
 * PATCH /api/automation/series/:id
 */
router.patch("/series/:id", requireRole(UserRole.ADMIN, UserRole.MANAGER), async (req: Request, res: Response) => {
  try {
    const series = await storage.updateMarketingSeries(req.params.id, req.body);
    return res.json(series);
  } catch (err) {
    return handleError(err, res);
  }
});

/**
 * DELETE /api/automation/series/:id
 */
router.delete("/series/:id", requireRole(UserRole.ADMIN, UserRole.MANAGER), async (req: Request, res: Response) => {
  try {
    await storage.deleteMarketingSeries(req.params.id);
    return res.status(204).end();
  } catch (err) {
    return handleError(err, res);
  }
});

/**
 * POST /api/automation/series/:id/steps
 */
router.post("/series/:id/steps", requireRole(UserRole.ADMIN, UserRole.MANAGER), async (req: Request, res: Response) => {
  try {
    const step = await storage.createMarketingSeriesStep({
      ...req.body,
      seriesId: req.params.id,
    });
    return res.status(201).json(step);
  } catch (err) {
    return handleError(err, res);
  }
});

/**
 * PATCH /api/automation/series-steps/:id
 */
router.patch("/series-steps/:id", requireRole(UserRole.ADMIN, UserRole.MANAGER), async (req: Request, res: Response) => {
  try {
    const step = await storage.updateMarketingSeriesStep(req.params.id, req.body);
    return res.json(step);
  } catch (err) {
    return handleError(err, res);
  }
});

/**
 * DELETE /api/automation/series-steps/:id
 */
router.delete("/series-steps/:id", requireRole(UserRole.ADMIN, UserRole.MANAGER), async (req: Request, res: Response) => {
  try {
    await storage.deleteMarketingSeriesStep(req.params.id);
    return res.status(204).end();
  } catch (err) {
    return handleError(err, res);
  }
});

/**
 * POST /api/automation/series/:id/enroll
 * Body: { leadIds?: string[], clientIds?: string[], groupIds?: string[] }
 */
router.post("/series/:id/enroll", requireRole(UserRole.ADMIN, UserRole.MANAGER), async (req: Request, res: Response) => {
  try {
    const { leadIds, clientIds, groupIds } = req.body;
    const seriesId = req.params.id;

    const steps = await storage.getMarketingSeriesSteps(seriesId);
    if (steps.length === 0) {
      return res.status(400).json({ message: "Series has no steps" });
    }

    const firstStep = steps[0];
    const nextStepAt = new Date();
    nextStepAt.setDate(nextStepAt.getDate() + (firstStep.delayDays || 0));
    nextStepAt.setHours(nextStepAt.getHours() + (firstStep.delayHours || 0));

    const enrollments: any[] = [];

    if (Array.isArray(leadIds)) {
      for (const leadId of leadIds) {
        enrollments.push(
          await storage.createMarketingSeriesEnrollment({
            seriesId,
            recipientId: leadId,
            recipientType: "lead",
            leadId,
            currentStep: 0,
            status: "active",
            nextStepAt,
          })
        );
      }
    }

    if (Array.isArray(clientIds)) {
      for (const clientId of clientIds) {
        enrollments.push(
          await storage.createMarketingSeriesEnrollment({
            seriesId,
            recipientId: clientId,
            recipientType: "client",
            clientId,
            currentStep: 0,
            status: "active",
            nextStepAt,
          })
        );
      }
    }

    if (Array.isArray(groupIds)) {
      for (const groupId of groupIds) {
        const members = await storage.getMarketingGroupMembers(groupId);
        for (const member of members) {
          if (member.leadId || member.clientId) {
            const recipientId = (member.leadId || member.clientId)!;
            enrollments.push(
              await storage.createMarketingSeriesEnrollment({
                seriesId,
                recipientId,
                recipientType: member.leadId ? "lead" : "client",
                leadId: member.leadId || undefined,
                clientId: member.clientId || undefined,
                currentStep: 0,
                status: "active",
                nextStepAt,
              })
            );
          }
        }
      }
    }

    return res.json({
      message: `Enrolled ${enrollments.length} recipients`,
      count: enrollments.length,
    });
  } catch (err) {
    return handleError(err, res);
  }
});

// ─── Broadcasts ───────────────────────────────────────────────────────────────

/**
 * GET /api/automation/broadcasts
 * Query params: status, channel, limit, offset
 */
router.get("/broadcasts", requireStaff, async (req: Request, res: Response) => {
  try {
    let broadcasts = await storage.getMarketingBroadcasts();
    const { status, channel, limit = "50", offset = "0" } = req.query as Record<string, string>;
    if (status) broadcasts = broadcasts.filter((b) => b.status === status);
    if (channel) broadcasts = broadcasts.filter((b) => b.channel === channel);

    const total = broadcasts.length;
    const page = broadcasts.slice(parseInt(offset, 10), parseInt(offset, 10) + parseInt(limit, 10));
    return res.json({
      data: page,
      meta: { total, limit: parseInt(limit, 10), offset: parseInt(offset, 10) },
    });
  } catch (err) {
    return handleError(err, res);
  }
});

/**
 * POST /api/automation/broadcasts
 * Creates and optionally immediately triggers a broadcast.
 */
router.post("/broadcasts", requireRole(UserRole.ADMIN, UserRole.MANAGER), async (req: Request, res: Response) => {
  try {
    const user = req.user as any;
    const { scheduledAt: scheduledAtRaw, isRecurring } = req.body;

    const scheduledAt = scheduledAtRaw ? new Date(scheduledAtRaw) : undefined;
    if (scheduledAtRaw && (!scheduledAt || Number.isNaN(scheduledAt.getTime()))) {
      return res.status(400).json({ message: "Invalid scheduledAt" });
    }

    const now = new Date();
    const nextRunAt = isRecurring ? (scheduledAt || now) : null;
    const status =
      isRecurring
        ? "pending"
        : scheduledAt && scheduledAt.getTime() > now.getTime()
        ? "pending"
        : "sending";

    const validated = insertMarketingBroadcastSchema.parse({
      ...req.body,
      scheduledAt: scheduledAt ?? null,
      nextRunAt,
      createdBy: req.body.createdBy ?? user.id,
      status,
    });

    const broadcast = await storage.createMarketingBroadcast(validated);

    if (!isRecurring && broadcast.status === "sending") {
      processMarketingBroadcast(broadcast.id).catch((err) =>
        console.error(`[automation api] broadcast ${broadcast.id} background error:`, err)
      );
    }

    return res.status(202).json(broadcast);
  } catch (err) {
    return handleError(err, res);
  }
});

/**
 * GET /api/automation/broadcasts/:id
 */
router.get("/broadcasts/:id", requireStaff, async (req: Request, res: Response) => {
  try {
    const broadcast = await storage.getMarketingBroadcast(req.params.id);
    if (!broadcast) return res.status(404).json({ message: "Broadcast not found" });

    const recipients = await storage.getMarketingBroadcastRecipients(req.params.id);
    return res.json({
      ...broadcast,
      recipients: {
        total: recipients.length,
        pending: recipients.filter((r) => r.status === "pending").length,
        sent: recipients.filter((r) => r.status === "sent").length,
        failed: recipients.filter((r) => r.status === "failed").length,
      },
    });
  } catch (err) {
    return handleError(err, res);
  }
});

/**
 * DELETE /api/automation/broadcasts/:id
 */
router.delete("/broadcasts/:id", requireRole(UserRole.ADMIN, UserRole.MANAGER), async (req: Request, res: Response) => {
  try {
    const broadcast = await storage.getMarketingBroadcast(req.params.id);
    if (!broadcast) return res.status(404).json({ message: "Broadcast not found" });
    if (broadcast.status === "sending") {
      return res.status(400).json({ message: "Cannot delete a broadcast that is currently sending" });
    }
    await storage.deleteMarketingBroadcast(req.params.id);
    return res.status(204).end();
  } catch (err) {
    return handleError(err, res);
  }
});

export default router;

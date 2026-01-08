import { Router, Request, Response } from "express";
import { storage } from "../storage";
import { isAuthenticated } from "../auth";
import { requireRole } from "../rbac";
import { UserRole } from "@shared/roles";
import { insertMarketingBroadcastSchema } from "@shared/schema";
import { processMarketingBroadcast } from "../marketingBroadcastProcessor";
import { pool } from "../db";

const router = Router();

// Secure all marketing center routes to Admin Only
router.use(isAuthenticated, requireRole(UserRole.ADMIN));

// Get audience statistics for targeting
router.get("/stats", async (_req: Request, res: Response) => {
  try {
    const allLeads = await storage.getLeads();
    const allClients = await storage.getClients();

    const stats = {
      leads: {
        total: allLeads.length,
        optedIn: allLeads.filter(l => l.optInEmail || l.optInSms).length,
        industries: Array.from(new Set(allLeads.map(l => l.industry).filter(Boolean))),
        tags: Array.from(new Set(allLeads.flatMap(l => l.tags || []))),
      },
      clients: {
        total: allClients.length,
        optedIn: allClients.filter(c => c.optInEmail || c.optInSms).length,
      },
    };

    res.json(stats);
  } catch (error) {
    console.error("Error fetching marketing stats:", error);
    res.status(500).json({ message: "Failed to fetch audience statistics" });
  }
});

// Get broadcast history
router.get("/broadcasts", async (_req: Request, res: Response) => {
  try {
    const broadcasts = await storage.getMarketingBroadcasts();
    res.json(broadcasts);
  } catch (error) {
    console.error("Error fetching broadcast history:", error);
    res.status(500).json({ message: "Failed to fetch broadcast history" });
  }
});

// Admin SMS inbox (Twilio inbound + anything else stored in sms_messages)
router.get("/sms-inbox", async (req: Request, res: Response) => {
  try {
    const limit = Math.min(Math.max(parseInt(String(req.query.limit || "100"), 10) || 100, 1), 500);

    const result = await pool.query(
      `
      SELECT
        sm.id,
        sm.dialpad_id,
        sm.direction,
        sm.from_number,
        sm.to_number,
        sm.text,
        sm.status,
        sm.user_id,
        sm.lead_id,
        sm.timestamp,
        sm.created_at,
        l.company AS lead_company,
        l.name AS lead_name
      FROM sms_messages sm
      LEFT JOIN leads l ON l.id = sm.lead_id
      WHERE sm.direction = 'inbound'
      ORDER BY sm.timestamp DESC
      LIMIT $1
      `,
      [limit]
    );

    res.json(result.rows);
  } catch (error: any) {
    console.error("Error fetching SMS inbox:", error);
    res.status(500).json({ message: error.message || "Failed to fetch SMS inbox" });
  }
});

// Create and trigger a new broadcast
router.post("/broadcast", async (req: Request, res: Response) => {
  try {
    const user = req.user as any;
    const scheduledAtRaw = (req.body as any)?.scheduledAt;
    const scheduledAt =
      scheduledAtRaw ? new Date(scheduledAtRaw) : undefined;

    if (scheduledAtRaw && (Number.isNaN(scheduledAt?.getTime()) || !scheduledAt)) {
      return res.status(400).json({ message: "Invalid scheduledAt" });
    }

    const now = new Date();
    const status =
      scheduledAt && scheduledAt.getTime() > now.getTime() ? "pending" : "sending";

    const validatedData = insertMarketingBroadcastSchema.parse({
      ...req.body,
      scheduledAt: scheduledAt ?? null,
      createdBy: user.id,
      status,
    });

    // Create the broadcast record
    const broadcast = await storage.createMarketingBroadcast(validatedData);

    // Start background sending process if immediate
    if (broadcast.status === "sending") {
      processMarketingBroadcast(broadcast.id).catch((err) =>
        console.error(`Broadcast ${broadcast.id} background error:`, err)
      );
    }

    res.status(202).json(broadcast);
  } catch (error: any) {
    console.error("Error creating broadcast:", error);
    res.status(400).json({ message: error.message || "Failed to create broadcast" });
  }
});

export default router;


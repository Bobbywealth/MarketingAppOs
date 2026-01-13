import { Router, Request, Response } from "express";
import { storage } from "../storage";
import { isAuthenticated } from "../auth";
import { requireRole } from "../rbac";
import { UserRole } from "@shared/roles";
import { insertMarketingBroadcastSchema } from "@shared/schema";
import { processMarketingBroadcast } from "../marketingBroadcastProcessor";
import { pool } from "../db";
import { sendSms, sendWhatsApp } from "../twilioService";

const router = Router();

// Secure all marketing center routes to Admin Only
router.use(isAuthenticated, requireRole(UserRole.ADMIN));

// Get audience statistics for targeting
router.get("/stats", async (_req: Request, res: Response) => {
  try {
    const allLeads = await storage.getLeads();
    const allClients = await storage.getClients();
    const allGroups = await storage.getMarketingGroups();

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
      groups: allGroups.map(g => ({
        id: g.id,
        name: g.name,
      })),
    };

    res.json(stats);
  } catch (error) {
    console.error("Error fetching marketing stats:", error);
    res.status(500).json({ message: "Failed to fetch audience statistics" });
  }
});

// Marketing Group Routes
router.get("/groups", async (_req: Request, res: Response) => {
  try {
    const groups = await storage.getMarketingGroups();
    res.json(groups);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

router.post("/groups", async (req: Request, res: Response) => {
  try {
    const user = req.user as any;
    const group = await storage.createMarketingGroup({
      ...req.body,
      createdBy: user.id,
    });
    res.status(201).json(group);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
});

router.get("/groups/:id/members", async (req: Request, res: Response) => {
  try {
    const members = await storage.getMarketingGroupMembers(req.params.id);
    res.json(members);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

router.post("/groups/:id/members", async (req: Request, res: Response) => {
  try {
    const member = await storage.addMarketingGroupMember({
      groupId: req.params.id,
      ...req.body,
    });
    res.status(201).json(member);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
});

router.delete("/groups/members/:memberId", async (req: Request, res: Response) => {
  try {
    await storage.removeMarketingGroupMember(parseInt(req.params.memberId));
    res.status(204).end();
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

router.delete("/groups/:id", async (req: Request, res: Response) => {
  try {
    await storage.deleteMarketingGroup(req.params.id);
    res.status(204).end();
  } catch (error: any) {
    res.status(500).json({ message: error.message });
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

// Get recipient status/error details for a broadcast (useful for debugging failures)
router.get("/broadcasts/:id/recipients", async (req: Request, res: Response) => {
  try {
    const id = String(req.params.id || "").trim();
    if (!id) return res.status(400).json({ message: "Missing broadcast id" });

    const result = await pool.query(
      `
      SELECT
        r.id,
        r.broadcast_id,
        r.lead_id,
        r.client_id,
        r.custom_recipient,
        r.status,
        r.error_message,
        r.sent_at,
        l.company AS lead_company,
        l.name AS lead_name,
        l.phone AS lead_phone,
        c.name AS client_name,
        c.phone AS client_phone
      FROM marketing_broadcast_recipients r
      LEFT JOIN leads l ON l.id::text = r.lead_id::text
      LEFT JOIN clients c ON c.id::text = r.client_id::text
      WHERE r.broadcast_id = $1
      ORDER BY r.id ASC
      `,
      [id]
    );

    return res.json(result.rows);
  } catch (error: any) {
    console.error("Error fetching broadcast recipients:", error);
    return res.status(500).json({ message: error.message || "Failed to fetch broadcast recipients" });
  }
});

// Twilio outbound SMS diagnostics (admin-only)
// - /twilio/status: confirms which env vars are present (no secrets)
// - /twilio/test-sms: sends a single SMS and returns Twilio error details
router.get("/twilio/status", async (_req: Request, res: Response) => {
  try {
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const from = process.env.TWILIO_PHONE_NUMBER;
    const messagingServiceSid = process.env.TWILIO_MESSAGING_SERVICE_SID;

    return res.json({
      configured: Boolean(accountSid && process.env.TWILIO_AUTH_TOKEN),
      accountSidLast4: accountSid ? accountSid.slice(-4) : null,
      hasFromNumber: Boolean(from),
      fromNumberLast4: from ? from.replace(/[^\d]/g, "").slice(-4) : null,
      hasMessagingServiceSid: Boolean(messagingServiceSid),
      messagingServiceSidLast4: messagingServiceSid ? messagingServiceSid.slice(-4) : null,
      notes:
        "If configured=false, Render env vars are missing. If configured=true but sends fail, use /twilio/test-sms or /twilio/test-whatsapp to see Twilio error code.",
    });
  } catch (error: any) {
    console.error("Error getting Twilio status:", error);
    return res.status(500).json({ message: error.message || "Failed to get Twilio status" });
  }
});

router.post("/twilio/test-sms", async (req: Request, res: Response) => {
  try {
    const to = String((req.body as any)?.to ?? "").trim();
    const body = String((req.body as any)?.body ?? "Test message from Marketing Center").trim();
    if (!to) return res.status(400).json({ message: "Missing 'to' phone number" });
    if (!body) return res.status(400).json({ message: "Missing 'body' message" });

    const result = await sendSms(to, body);
    // Always return 200 so you can see Twilio error details in response body.
    return res.json(result);
  } catch (error: any) {
    console.error("Error sending Twilio test SMS:", error);
    return res.status(500).json({ message: error.message || "Failed to send test SMS" });
  }
});

router.post("/twilio/test-whatsapp", async (req: Request, res: Response) => {
  try {
    const to = String((req.body as any)?.to ?? "").trim();
    const body = String((req.body as any)?.body ?? "Test WhatsApp message from Marketing Center").trim();
    if (!to) return res.status(400).json({ message: "Missing 'to' phone number" });
    if (!body) return res.status(400).json({ message: "Missing 'body' message" });

    const result = await sendWhatsApp(to, body);
    // Always return 200 so you can see Twilio error details in response body.
    return res.json(result);
  } catch (error: any) {
    console.error("Error sending Twilio test WhatsApp:", error);
    return res.status(500).json({ message: error.message || "Failed to send test WhatsApp" });
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
      LEFT JOIN leads l ON l.id::text = sm.lead_id::text
      WHERE sm.direction::text = 'inbound'
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
    const { scheduledAt: scheduledAtRaw, isRecurring, recurringPattern, recurringEndDate } = req.body;
    
    const scheduledAt = scheduledAtRaw ? new Date(scheduledAtRaw) : undefined;

    if (scheduledAtRaw && (Number.isNaN(scheduledAt?.getTime()) || !scheduledAt)) {
      return res.status(400).json({ message: "Invalid scheduledAt" });
    }

    const now = new Date();
    
    // If it's recurring and not scheduled for later, set nextRunAt to now
    let nextRunAt = null;
    if (isRecurring) {
      nextRunAt = scheduledAt || now;
    }

    const status =
      scheduledAt && scheduledAt.getTime() > now.getTime() ? "pending" : "sending";

    const validatedData = insertMarketingBroadcastSchema.parse({
      ...req.body,
      scheduledAt: scheduledAt ?? null,
      nextRunAt,
      createdBy: user.id,
      status: isRecurring ? "pending" : status, // Recurring broadcasts always start as pending
    });

    // Create the broadcast record
    const broadcast = await storage.createMarketingBroadcast(validatedData);

    // Start background sending process if immediate and not recurring
    if (!isRecurring && broadcast.status === "sending") {
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


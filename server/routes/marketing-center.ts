import { Router, Request, Response } from "express";
import { storage } from "../storage";
import { isAuthenticated } from "../auth";
import { requireRole } from "../rbac";
import { UserRole } from "@shared/roles";
import { insertMarketingBroadcastSchema } from "@shared/schema";
import { processMarketingBroadcast } from "../marketingBroadcastProcessor";
import { pool } from "../db";
import { sendSms, sendWhatsApp } from "../twilioService";
import { sendTelegramMessage, sendTelegramBulk, sendTelegramAsUser, resolveUsernameToChatId, handleTelegramWebhookUpdate, setupTelegramWebhook, getTelegramWebhookInfo, getTelegramBotInfo } from "../telegramService";
import { listVapiAssistants, getVapiCall } from "../vapiService";
import { generateMarketingContent, analyzeSmsSentiment, parseAiGroupQuery } from "../aiManager";
import { upload } from "./common";

const router = Router();

// Ensure Marketing Center schema exists in production.
// This guards against schema drift when startup migrations fail to run.
let marketingSchemaEnsured: Promise<void> | null = null;
export async function ensureMarketingCenterSchema() {
  if (marketingSchemaEnsured) return marketingSchemaEnsured;
  marketingSchemaEnsured = (async () => {
    // Tables
    await pool.query(`
      CREATE TABLE IF NOT EXISTS marketing_groups (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR NOT NULL,
        description TEXT,
        created_by INTEGER NOT NULL REFERENCES users(id),
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS marketing_group_members (
        id SERIAL PRIMARY KEY,
        group_id VARCHAR NOT NULL REFERENCES marketing_groups(id) ON DELETE CASCADE,
        lead_id VARCHAR REFERENCES leads(id) ON DELETE CASCADE,
        client_id VARCHAR REFERENCES clients(id) ON DELETE CASCADE,
        custom_recipient TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS marketing_broadcasts (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
        channel VARCHAR NOT NULL,
        type VARCHAR NOT NULL,
        status VARCHAR NOT NULL DEFAULT 'pending',
        subject VARCHAR,
        content TEXT NOT NULL,
        audience VARCHAR NOT NULL,
        group_id VARCHAR REFERENCES marketing_groups(id),
        custom_recipient TEXT,
        filters JSONB,
        total_recipients INTEGER DEFAULT 0,
        success_count INTEGER DEFAULT 0,
        failed_count INTEGER DEFAULT 0,
        created_by INTEGER NOT NULL REFERENCES users(id),
        scheduled_at TIMESTAMP,
        sent_at TIMESTAMP,
        completed_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW(),
        is_recurring BOOLEAN DEFAULT false,
        is_active BOOLEAN DEFAULT true,
        recurring_pattern VARCHAR,
        recurring_interval INTEGER DEFAULT 1,
        recurring_end_date TIMESTAMP,
        next_run_at TIMESTAMP,
        parent_broadcast_id VARCHAR,
        media_urls TEXT[],
        use_ai_personalization BOOLEAN DEFAULT false
      );
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS marketing_broadcast_recipients (
        id SERIAL PRIMARY KEY,
        broadcast_id VARCHAR NOT NULL REFERENCES marketing_broadcasts(id) ON DELETE CASCADE,
        lead_id VARCHAR REFERENCES leads(id),
        client_id VARCHAR REFERENCES clients(id),
        custom_recipient TEXT,
        status VARCHAR NOT NULL DEFAULT 'pending',
        error_message TEXT,
        sent_at TIMESTAMP
      );
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS marketing_templates (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR NOT NULL,
        type VARCHAR NOT NULL,
        subject VARCHAR,
        content TEXT NOT NULL,
        created_by INTEGER NOT NULL REFERENCES users(id),
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);

    // Add missing columns (schema drift fix for existing tables)
    await pool.query(`ALTER TABLE marketing_broadcasts ADD COLUMN IF NOT EXISTS channel VARCHAR NOT NULL DEFAULT 'email';`);
    await pool.query(`ALTER TABLE marketing_broadcasts ADD COLUMN IF NOT EXISTS sent_at TIMESTAMP;`);
    await pool.query(`ALTER TABLE marketing_broadcasts ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;`);
    await pool.query(`ALTER TABLE marketing_broadcasts ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW();`);

    // Marketing Series tables
    await pool.query(`
      CREATE TABLE IF NOT EXISTS marketing_series (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR NOT NULL,
        description TEXT,
        channel VARCHAR NOT NULL,
        is_active BOOLEAN DEFAULT true,
        created_by INTEGER NOT NULL REFERENCES users(id),
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS marketing_series_steps (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
        series_id VARCHAR NOT NULL REFERENCES marketing_series(id) ON DELETE CASCADE,
        step_order INTEGER NOT NULL,
        delay_days INTEGER DEFAULT 0,
        delay_hours INTEGER DEFAULT 0,
        subject VARCHAR,
        content TEXT NOT NULL,
        media_urls TEXT[],
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS marketing_series_enrollments (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
        series_id VARCHAR NOT NULL REFERENCES marketing_series(id) ON DELETE CASCADE,
        recipient_id VARCHAR(255) NOT NULL,
        lead_id VARCHAR REFERENCES leads(id) ON DELETE CASCADE,
        client_id VARCHAR REFERENCES clients(id) ON DELETE CASCADE,
        current_step INTEGER DEFAULT 0,
        status VARCHAR NOT NULL DEFAULT 'active',
        last_step_sent_at TIMESTAMP,
        next_step_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);

    // Add missing columns (schema drift fix for existing tables)
    await pool.query(`ALTER TABLE marketing_group_members ADD COLUMN IF NOT EXISTS custom_recipient TEXT;`);
    await pool.query(`ALTER TABLE marketing_broadcasts ADD COLUMN IF NOT EXISTS group_id VARCHAR REFERENCES marketing_groups(id);`);
    await pool.query(`ALTER TABLE marketing_broadcasts ADD COLUMN IF NOT EXISTS custom_recipient TEXT;`);
    await pool.query(`ALTER TABLE marketing_broadcasts ADD COLUMN IF NOT EXISTS filters JSONB;`);
    await pool.query(`ALTER TABLE marketing_broadcasts ADD COLUMN IF NOT EXISTS scheduled_at TIMESTAMP;`);
    await pool.query(`ALTER TABLE marketing_broadcasts ADD COLUMN IF NOT EXISTS completed_at TIMESTAMP;`);
    await pool.query(`ALTER TABLE marketing_broadcasts ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT NOW();`);
    await pool.query(`ALTER TABLE marketing_broadcasts ADD COLUMN IF NOT EXISTS is_recurring BOOLEAN DEFAULT false;`);
    await pool.query(`ALTER TABLE marketing_broadcasts ADD COLUMN IF NOT EXISTS recurring_pattern VARCHAR;`);
    await pool.query(`ALTER TABLE marketing_broadcasts ADD COLUMN IF NOT EXISTS recurring_interval INTEGER DEFAULT 1;`);
    await pool.query(`ALTER TABLE marketing_broadcasts ADD COLUMN IF NOT EXISTS recurring_end_date TIMESTAMP;`);
    await pool.query(`ALTER TABLE marketing_broadcasts ADD COLUMN IF NOT EXISTS next_run_at TIMESTAMP;`);
    await pool.query(`ALTER TABLE marketing_broadcasts ADD COLUMN IF NOT EXISTS parent_broadcast_id VARCHAR;`);
    await pool.query(`ALTER TABLE marketing_broadcasts ADD COLUMN IF NOT EXISTS media_urls TEXT[];`);
    await pool.query(`ALTER TABLE marketing_broadcasts ADD COLUMN IF NOT EXISTS use_ai_personalization BOOLEAN DEFAULT false;`);
    await pool.query(`ALTER TABLE marketing_broadcast_recipients ADD COLUMN IF NOT EXISTS provider_call_id VARCHAR;`);
    await pool.query(`ALTER TABLE marketing_series ADD COLUMN IF NOT EXISTS channel VARCHAR;`);
    await pool.query(`UPDATE marketing_series SET channel = 'email' WHERE channel IS NULL;`);
    await pool.query(`ALTER TABLE marketing_series ALTER COLUMN channel SET DEFAULT 'email';`);
    await pool.query(`ALTER TABLE marketing_series ALTER COLUMN channel SET NOT NULL;`);
    await pool.query(`ALTER TABLE marketing_series ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;`);
    await pool.query(`ALTER TABLE marketing_series ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW();`);
    await pool.query(`ALTER TABLE marketing_series_enrollments ADD COLUMN IF NOT EXISTS recipient_id VARCHAR(255);`);
    await pool.query(`UPDATE marketing_series_enrollments SET recipient_id = COALESCE(lead_id, client_id) WHERE recipient_id IS NULL;`);
    await pool.query(`ALTER TABLE marketing_series_enrollments ALTER COLUMN recipient_id SET NOT NULL;`);

    // Telegram Subscribers table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS telegram_subscribers (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
        chat_id VARCHAR NOT NULL UNIQUE,
        username VARCHAR,
        first_name VARCHAR,
        last_name VARCHAR,
        is_active BOOLEAN NOT NULL DEFAULT true,
        is_blocked BOOLEAN NOT NULL DEFAULT false,
        lead_id VARCHAR REFERENCES leads(id) ON DELETE SET NULL,
        tags JSONB,
        last_interaction TIMESTAMP DEFAULT NOW(),
        subscribed_at TIMESTAMP DEFAULT NOW(),
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);

    // Telegram Automated Messages table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS telegram_automated_messages (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR NOT NULL,
        content TEXT NOT NULL,
        audience VARCHAR NOT NULL DEFAULT 'all_subscribers',
        target_tags JSONB,
        target_chat_id VARCHAR,
        status VARCHAR NOT NULL DEFAULT 'active',
        is_recurring BOOLEAN NOT NULL DEFAULT false,
        recurring_pattern VARCHAR,
        recurring_interval INTEGER DEFAULT 1,
        scheduled_at TIMESTAMP,
        next_run_at TIMESTAMP,
        recurring_end_date TIMESTAMP,
        last_run_at TIMESTAMP,
        total_sent INTEGER DEFAULT 0,
        total_failed INTEGER DEFAULT 0,
        welcome_message BOOLEAN NOT NULL DEFAULT false,
        created_by INTEGER REFERENCES users(id),
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);
  })().catch((err) => {
    // Allow retry on next request if this fails.
    marketingSchemaEnsured = null;
    throw err;
  });

  return marketingSchemaEnsured;
}

// Secure all marketing center routes to Admin Only
router.use(isAuthenticated, requireRole(UserRole.ADMIN), async (_req, _res, next) => {
  try {
    await ensureMarketingCenterSchema();
    return next();
  } catch (err) {
    console.error("Marketing Center schema ensure failed:", err);
    return next(err);
  }
});


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
      groups: await Promise.all(allGroups.map(async (g) => {
        const members = await storage.getMarketingGroupMembers(g.id);
        return {
          id: g.id,
          name: g.name,
          memberCount: members.length,
        };
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

// Marketing Template Routes
router.get("/templates", async (req: Request, res: Response) => {
  try {
    let templates = await storage.getMarketingTemplates();
    
    // Seed default templates if empty
    if (templates.length === 0) {
      const user = req.user as any;
      const defaults = [
        {
          name: "Welcome Email",
          type: "email",
          subject: "Welcome to our community!",
          content: "Hello,\n\nWe're excited to have you with us. Explore our latest offerings and let us know if you have any questions.\n\nBest,\nThe Team",
          createdBy: user.id
        },
        {
          name: "Promotional SMS",
          type: "sms",
          content: "Flash Sale! Get 20% off your next purchase with code FLASH20. Valid for 24h only! marketingteam.app",
          createdBy: user.id
        }
      ];
      for (const d of defaults) {
        await storage.createMarketingTemplate(d as any);
      }
      templates = await storage.getMarketingTemplates();
    }
    
    res.json(templates);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

router.post("/templates", async (req: Request, res: Response) => {
  try {
    const user = req.user as any;
    const template = await storage.createMarketingTemplate({
      ...req.body,
      createdBy: user.id,
    });
    res.status(201).json(template);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
});

router.patch("/templates/:id", async (req: Request, res: Response) => {
  try {
    const template = await storage.updateMarketingTemplate(req.params.id, req.body);
    res.json(template);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
});

router.delete("/templates/:id", async (req: Request, res: Response) => {
  try {
    await storage.deleteMarketingTemplate(req.params.id);
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

router.delete("/broadcasts/:id", async (req: Request, res: Response) => {
  try {
    const broadcast = await storage.getMarketingBroadcast(req.params.id);
    if (!broadcast) return res.status(404).json({ message: "Broadcast not found" });
    
    // Only allow deleting pending or failed broadcasts
    if (broadcast.status === "sending") {
      return res.status(400).json({ message: "Cannot delete a broadcast that is currently sending" });
    }

    await storage.deleteMarketingBroadcast(req.params.id);
    res.status(204).end();
  } catch (error: any) {
    console.error("Error deleting broadcast:", error);
    res.status(500).json({ message: error.message });
  }
});

// Database status diagnostics (admin-only)
// Helps determine whether "0 recipients" is real data or a DB/schema issue.
router.get("/db-status", async (_req: Request, res: Response) => {
  try {
    async function tableExists(table: string): Promise<boolean> {
      const r = await pool.query(`SELECT to_regclass($1) AS reg`, [`public.${table}`]);
      return Boolean(r.rows?.[0]?.reg);
    }

    async function hasColumns(table: string, columns: string[]): Promise<Record<string, boolean>> {
      const out: Record<string, boolean> = {};
      for (const c of columns) out[c] = false;
      const r = await pool.query(
        `
        SELECT column_name
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = $1
          AND column_name = ANY($2::text[])
        `,
        [table, columns]
      );
      for (const row of r.rows ?? []) {
        if (row?.column_name) out[row.column_name] = true;
      }
      return out;
    }

    async function safeCountsForAudienceTable(table: string) {
      const exists = await tableExists(table);
      if (!exists) {
        return { exists: false, total: null as number | null, optedIn: null as number | null, optedInSupported: false, error: null as string | null };
      }

      const col = await hasColumns(table, ["opt_in_email", "opt_in_sms"]);
      const optedInSupported = Boolean(col.opt_in_email && col.opt_in_sms);

      const totalRes = await pool.query(`SELECT COUNT(*)::int AS n FROM ${table}`);
      const total = Number(totalRes.rows?.[0]?.n ?? 0);

      if (!optedInSupported) {
        return { exists: true, total, optedIn: null as number | null, optedInSupported: false, error: null as string | null };
      }

      const optedRes = await pool.query(
        `SELECT COUNT(*)::int AS n FROM ${table} WHERE opt_in_email = true OR opt_in_sms = true`
      );
      const optedIn = Number(optedRes.rows?.[0]?.n ?? 0);

      return { exists: true, total, optedIn, optedInSupported: true, error: null as string | null };
    }

    const [dbNameRes, nowRes] = await Promise.all([
      pool.query(`SELECT current_database() AS name`),
      pool.query(`SELECT NOW() AS now`),
    ]);

    const leadsInfo = await safeCountsForAudienceTable("leads");
    const clientsInfo = await safeCountsForAudienceTable("clients");

    const groupsExists = await tableExists("marketing_groups");
    const broadcastsExists = await tableExists("marketing_broadcasts");
    const recipientsExists = await tableExists("marketing_broadcast_recipients");
    const broadcastsTotal = broadcastsExists
      ? Number((await pool.query(`SELECT COUNT(*)::int AS n FROM marketing_broadcasts`)).rows?.[0]?.n ?? 0)
      : null;
    const recipientsTotal = recipientsExists
      ? Number((await pool.query(`SELECT COUNT(*)::int AS n FROM marketing_broadcast_recipients`)).rows?.[0]?.n ?? 0)
      : null;

    const broadcastColumns = broadcastsExists
      ? await hasColumns("marketing_broadcasts", ["group_id", "custom_recipient", "filters"])
      : { group_id: false, custom_recipient: false, filters: false };

    return res.json({
      ok: true,
      database: dbNameRes.rows?.[0]?.name ?? null,
      serverTime: nowRes.rows?.[0]?.now ?? null,
      env: {
        hasDatabaseUrl: Boolean(process.env.DATABASE_URL),
        nodeEnv: process.env.NODE_ENV ?? null,
      },
      tables: {
        leads: leadsInfo,
        clients: clientsInfo,
        marketing_groups: { exists: groupsExists },
        marketing_broadcasts: { exists: broadcastsExists, total: broadcastsTotal },
        marketing_broadcast_recipients: { exists: recipientsExists, total: recipientsTotal },
        marketing_broadcasts_columns: broadcastColumns,
      },
    });
  } catch (error: any) {
    console.error("Error fetching DB status:", error);
    return res.status(500).json({
      ok: false,
      message: error?.message || "Failed to fetch DB status",
    });
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
        r.provider_call_id,
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

// Telegram Bot Webhook (unauthenticated - called by Telegram servers)
router.post("/telegram/webhook", async (req: Request, res: Response) => {
  try {
    await handleTelegramWebhookUpdate(req.body);
    res.status(200).json({ ok: true });
  } catch (error: any) {
    console.error("Telegram webhook error:", error);
    res.status(200).json({ ok: true }); // Always 200 to avoid Telegram retries
  }
});

// Telegram send message (supports chat_id or @username, with optional sender name)
router.post("/telegram/test", async (req: Request, res: Response) => {
  try {
    let chatId = String((req.body as any)?.chatId ?? (req.body as any)?.to ?? "").trim();
    const text = String((req.body as any)?.text ?? (req.body as any)?.body ?? "").trim();
    const senderName = String((req.body as any)?.senderName ?? "").trim();

    // If chatId looks like a @username, resolve it from subscriber DB
    if (chatId.startsWith("@")) {
      const resolved = await resolveUsernameToChatId(chatId);
      if (!resolved) {
        return res.status(400).json({
          success: false,
          error: `Username ${chatId} not found. They need to send /start to your bot first.`
        });
      }
      chatId = resolved;
    }

    if (!chatId) return res.status(400).json({ message: "Missing 'chatId' or '@username'" });
    if (!text) return res.status(400).json({ message: "Missing 'text' message" });

    const result = await sendTelegramAsUser(chatId, text, senderName || undefined);
    return res.json(result);
  } catch (error: any) {
    console.error("Error sending Telegram message:", error);
    return res.status(500).json({ message: error.message || "Failed to send Telegram message" });
  }
});

// Resolve a @username to a chat_id
router.get("/telegram/resolve-username/:username", async (req: Request, res: Response) => {
  try {
    const username = req.params.username;
    const chatId = await resolveUsernameToChatId(username);
    if (chatId) {
      res.json({ found: true, chatId, username });
    } else {
      res.json({ found: false, username, message: "User not found. They need to send /start to your bot first." });
    }
  } catch (error: any) {
    res.status(500).json({ message: error.message });
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

// File upload route for marketing media
router.post("/upload", upload.array("files", 10), async (req: Request, res: Response) => {
  try {
    const files = req.files as Express.Multer.File[];
    if (!files || files.length === 0) {
      return res.status(400).json({ message: "No files uploaded" });
    }

    const appUrl = process.env.APP_URL || `${req.protocol}://${req.get("host")}`;
    const mediaUrls = files.map((file) => `${appUrl}/uploads/${file.filename}`);

    res.json({ mediaUrls });
  } catch (error: any) {
    console.error("Marketing media upload error:", error);
    res.status(500).json({ message: error.message || "Failed to upload files" });
  }
});

// Vapi Proxy Routes
router.get("/vapi/assistants", isAuthenticated, async (_req: Request, res: Response) => {
  try {
    const assistants = await listVapiAssistants();
    res.json(assistants);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

router.get("/vapi/call/:callId", isAuthenticated, async (req: Request, res: Response) => {
  try {
    const call = await getVapiCall(req.params.callId);
    if (!call) return res.status(404).json({ message: "Call not found in Vapi" });
    res.json(call);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// Vapi Webhook (Placed BEFORE authentication middleware)
router.post("/vapi/webhook", async (req: Request, res: Response) => {
  try {
    const { message } = req.body;
    const type = message?.type;
    const callId = message?.call?.id;

    console.log(`📞 Vapi Webhook Received: ${type} for call ${callId}`);

    if (callId) {
      const recipient = await storage.getMarketingBroadcastRecipientByProviderCallId(callId);
      
      if (recipient) {
        if (type === 'end-of-call-report') {
          const { analysis, transcript, duration, status } = message.call;
          
          // Update recipient status
          await storage.updateMarketingBroadcastRecipient(recipient.id, {
            status: status === 'ended' ? 'completed' : 'failed',
            errorMessage: analysis?.summary || status,
          });

          // Log activity for lead
          if (recipient.leadId) {
            await storage.createLeadActivity({
              leadId: recipient.leadId,
              type: 'call',
              subject: 'AI Voice Call Completed',
              description: analysis?.summary || 'AI voice call finished.',
              outcome: analysis?.success ? 'positive' : 'neutral',
              metadata: {
                vapiCallId: callId,
                duration,
                transcript,
                summary: analysis?.summary,
                recordingUrl: message.call.recordingUrl
              },
            });
          }
        } else if (type === 'call-status-changed') {
          await storage.updateMarketingBroadcastRecipient(recipient.id, {
            status: message.call.status,
          });
        }
      }
    }

    res.status(200).json({ success: true });
  } catch (error: any) {
    console.error("Vapi webhook error:", error);
    res.status(500).json({ message: error.message });
  }
});

// AI Content Generation Route
router.post("/generate-content", isAuthenticated, requireRole(UserRole.ADMIN), async (req: Request, res: Response) => {
  try {
    const { prompt, channel, audience, context } = req.body;
    if (!prompt || !channel) {
      return res.status(400).json({ message: "Prompt and channel are required" });
    }

    const content = await generateMarketingContent(prompt, channel, audience, context);
    res.json({ content });
  } catch (error: any) {
    console.error("AI Content Generation error:", error);
    res.status(500).json({ message: error.message || "Failed to generate AI content" });
  }
});

// Analyze SMS sentiment/intent
router.post("/sms-inbox/:id/analyze", isAuthenticated, requireRole(UserRole.ADMIN), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const result = await pool.query("SELECT text FROM sms_messages WHERE id = $1", [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Message not found" });
    }

    const analysis = await analyzeSmsSentiment(result.rows[0].text);
    res.json(analysis);
  } catch (error: any) {
    console.error("SMS Analysis error:", error);
    res.status(500).json({ message: error.message || "Failed to analyze SMS" });
  }
});

// AI Group Builder
router.post("/groups/ai-builder", isAuthenticated, requireRole(UserRole.ADMIN), async (req: Request, res: Response) => {
  try {
    const { query } = req.body;
    if (!query) return res.status(400).json({ message: "Query is required" });

    const { filters, explanation } = await parseAiGroupQuery(query);
    
    // Now find matching leads/clients to show a preview
    const allLeads = await storage.getLeads();
    const allClients = await storage.getClients();

    const matchesLeads = allLeads.filter(l => {
      if (filters.industry && l.industry?.toLowerCase() !== filters.industry.toLowerCase()) return false;
      if (filters.score && l.score !== filters.score) return false;
      if (filters.stage && l.stage !== filters.stage) return false;
      if (filters.state && l.state?.toLowerCase() !== filters.state.toLowerCase()) return false;
      if (filters.tags && !filters.tags.some((t: string) => l.tags?.includes(t))) return false;
      if (filters.opt_in_email === true && !l.optInEmail) return false;
      if (filters.opt_in_sms === true && !l.optInSms) return false;
      return true;
    });

    const matchesClients = allClients.filter(c => {
      if (filters.state && c.state?.toLowerCase() !== filters.state.toLowerCase()) return false;
      if (filters.opt_in_email === true && !c.optInEmail) return false;
      if (filters.opt_in_sms === true && !c.optInSms) return false;
      return true;
    });

    res.json({
      filters,
      explanation,
      preview: {
        leads: matchesLeads.map(l => ({ id: l.id, name: l.name, company: l.company })),
        clients: matchesClients.map(c => ({ id: c.id, name: c.name })),
        totalCount: matchesLeads.length + matchesClients.length
      }
    });
  } catch (error: any) {
    console.error("AI Group Builder error:", error);
    res.status(500).json({ message: error.message || "Failed to build group with AI" });
  }
});

// Secure all other marketing center routes to Admin Only
router.use(isAuthenticated, requireRole(UserRole.ADMIN), async (_req, _res, next) => {
  try {
    await ensureMarketingCenterSchema();
    return next();
  } catch (err) {
    console.error("Marketing Center schema ensure failed:", err);
    return next(err);
  }
});

// Marketing Series (Sequences) Routes
router.get("/series", isAuthenticated, requireRole(UserRole.ADMIN), async (req: Request, res: Response) => {
  try {
    const series = await storage.getMarketingSeries();
    res.json(series);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

router.post("/series", isAuthenticated, requireRole(UserRole.ADMIN), async (req: Request, res: Response) => {
  try {
    const series = await storage.createMarketingSeries({
      ...req.body,
      createdBy: (req.user as any).id,
    });
    res.status(201).json(series);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

router.get("/series/:id", isAuthenticated, requireRole(UserRole.ADMIN), async (req: Request, res: Response) => {
  try {
    const series = await storage.getMarketingSeriesWithSteps(req.params.id);
    if (!series) return res.status(404).json({ message: "Series not found" });
    res.json(series);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

router.patch("/series/:id", isAuthenticated, requireRole(UserRole.ADMIN), async (req: Request, res: Response) => {
  try {
    const series = await storage.updateMarketingSeries(req.params.id, req.body);
    res.json(series);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

router.delete("/series/:id", isAuthenticated, requireRole(UserRole.ADMIN), async (req: Request, res: Response) => {
  try {
    await storage.deleteMarketingSeries(req.params.id);
    res.status(204).end();
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// Series Steps
router.post("/series/:id/steps", isAuthenticated, requireRole(UserRole.ADMIN), async (req: Request, res: Response) => {
  try {
    const step = await storage.createMarketingSeriesStep({
      ...req.body,
      seriesId: req.params.id,
    });
    res.status(201).json(step);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

router.patch("/series-steps/:id", isAuthenticated, requireRole(UserRole.ADMIN), async (req: Request, res: Response) => {
  try {
    const step = await storage.updateMarketingSeriesStep(req.params.id, req.body);
    res.json(step);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

router.delete("/series-steps/:id", isAuthenticated, requireRole(UserRole.ADMIN), async (req: Request, res: Response) => {
  try {
    await storage.deleteMarketingSeriesStep(req.params.id);
    res.status(204).end();
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// Series Enrollment
router.post("/series/:id/enroll", isAuthenticated, requireRole(UserRole.ADMIN), async (req: Request, res: Response) => {
  try {
    const { leadIds, clientIds, groupIds } = req.body;
    const seriesId = req.params.id;
    
    // Get the first step to set initial nextStepDueAt
    const steps = await storage.getMarketingSeriesSteps(seriesId);
    if (steps.length === 0) {
      return res.status(400).json({ message: "Series has no steps" });
    }
    
    const firstStep = steps[0];
    const nextStepDueAt = new Date();
    nextStepDueAt.setDate(nextStepDueAt.getDate() + (firstStep.delayDays || 0));
    nextStepDueAt.setHours(nextStepDueAt.getHours() + (firstStep.delayHours || 0));

    const enrollments = [];
    
    // Enroll leads
    if (leadIds && Array.isArray(leadIds)) {
      for (const leadId of leadIds) {
        enrollments.push(await storage.createMarketingSeriesEnrollment({
          seriesId,
          leadId,
          currentStep: 0,
          status: "active",
          nextStepDueAt,
        }));
      }
    }
    
    // Enroll clients
    if (clientIds && Array.isArray(clientIds)) {
      for (const clientId of clientIds) {
        enrollments.push(await storage.createMarketingSeriesEnrollment({
          seriesId,
          clientId,
          currentStep: 0,
          status: "active",
          nextStepDueAt,
        }));
      }
    }
    
    // Enroll from groups
    if (groupIds && Array.isArray(groupIds)) {
      for (const groupId of groupIds) {
        const members = await storage.getMarketingGroupMembers(groupId);
        for (const member of members) {
          if (member.leadId || member.clientId) {
            enrollments.push(await storage.createMarketingSeriesEnrollment({
              seriesId,
              leadId: member.leadId || undefined,
              clientId: member.clientId || undefined,
              currentStep: 0,
              status: "active",
              nextStepDueAt,
            }));
          }
        }
      }
    }

    res.json({ message: `Enrolled ${enrollments.length} recipients`, count: enrollments.length });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// ========================
// Telegram Subscribers & Automated Messages
// ========================

// Get all Telegram subscribers
router.get("/telegram/subscribers", async (_req: Request, res: Response) => {
  try {
    const result = await pool.query(
      `SELECT * FROM telegram_subscribers ORDER BY subscribed_at DESC`
    );
    res.json(result.rows);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// Get Telegram subscriber stats
router.get("/telegram/subscribers/stats", async (_req: Request, res: Response) => {
  try {
    const result = await pool.query(`
      SELECT
        COUNT(*)::int AS total,
        COUNT(*) FILTER (WHERE is_active = true AND is_blocked = false)::int AS active,
        COUNT(*) FILTER (WHERE is_blocked = true)::int AS blocked,
        COUNT(*) FILTER (WHERE is_active = false AND is_blocked = false)::int AS unsubscribed
      FROM telegram_subscribers
    `);
    res.json(result.rows[0] || { total: 0, active: 0, blocked: 0, unsubscribed: 0 });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// Delete a Telegram subscriber
router.delete("/telegram/subscribers/:id", async (req: Request, res: Response) => {
  try {
    await pool.query(`DELETE FROM telegram_subscribers WHERE id = $1`, [req.params.id]);
    res.status(204).end();
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// Update subscriber tags
router.patch("/telegram/subscribers/:id", async (req: Request, res: Response) => {
  try {
    const { tags, isActive, leadId } = req.body;
    const sets: string[] = [];
    const params: any[] = [];
    let idx = 1;

    if (tags !== undefined) { sets.push(`tags = $${idx++}`); params.push(JSON.stringify(tags)); }
    if (isActive !== undefined) { sets.push(`is_active = $${idx++}`); params.push(isActive); }
    if (leadId !== undefined) { sets.push(`lead_id = $${idx++}`); params.push(leadId || null); }
    sets.push(`updated_at = NOW()`);

    params.push(req.params.id);
    const result = await pool.query(
      `UPDATE telegram_subscribers SET ${sets.join(", ")} WHERE id = $${idx} RETURNING *`,
      params
    );
    res.json(result.rows[0]);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// Get all Telegram automated messages
router.get("/telegram/automated-messages", async (_req: Request, res: Response) => {
  try {
    const result = await pool.query(
      `SELECT * FROM telegram_automated_messages ORDER BY created_at DESC`
    );
    res.json(result.rows);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// Create a Telegram automated message
router.post("/telegram/automated-messages", async (req: Request, res: Response) => {
  try {
    const user = req.user as any;
    const {
      name, content, audience, targetTags, targetChatId, status,
      isRecurring, recurringPattern, recurringInterval,
      scheduledAt, recurringEndDate, welcomeMessage,
    } = req.body;

    if (!name || !content) {
      return res.status(400).json({ message: "Name and content are required" });
    }

    let nextRunAt = null;
    if (scheduledAt) {
      nextRunAt = new Date(scheduledAt);
    } else if (isRecurring) {
      nextRunAt = new Date();
    }

    const result = await pool.query(
      `INSERT INTO telegram_automated_messages
       (id, name, content, audience, target_tags, target_chat_id, status,
        is_recurring, recurring_pattern, recurring_interval, scheduled_at,
        next_run_at, recurring_end_date, welcome_message, created_by)
       VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
       RETURNING *`,
      [
        name, content, audience || "all_subscribers",
        targetTags ? JSON.stringify(targetTags) : null,
        targetChatId || null,
        status || "active",
        isRecurring || false,
        recurringPattern || null,
        recurringInterval || 1,
        scheduledAt ? new Date(scheduledAt) : null,
        nextRunAt,
        recurringEndDate ? new Date(recurringEndDate) : null,
        welcomeMessage || false,
        user.id,
      ]
    );

    res.status(201).json(result.rows[0]);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// Update a Telegram automated message
router.patch("/telegram/automated-messages/:id", async (req: Request, res: Response) => {
  try {
    const { name, content, audience, targetTags, targetChatId, status, isRecurring, recurringPattern, recurringInterval, scheduledAt, recurringEndDate, welcomeMessage } = req.body;
    const sets: string[] = [];
    const params: any[] = [];
    let idx = 1;

    if (name !== undefined) { sets.push(`name = $${idx++}`); params.push(name); }
    if (content !== undefined) { sets.push(`content = $${idx++}`); params.push(content); }
    if (audience !== undefined) { sets.push(`audience = $${idx++}`); params.push(audience); }
    if (targetTags !== undefined) { sets.push(`target_tags = $${idx++}`); params.push(JSON.stringify(targetTags)); }
    if (targetChatId !== undefined) { sets.push(`target_chat_id = $${idx++}`); params.push(targetChatId || null); }
    if (status !== undefined) { sets.push(`status = $${idx++}`); params.push(status); }
    if (isRecurring !== undefined) { sets.push(`is_recurring = $${idx++}`); params.push(isRecurring); }
    if (recurringPattern !== undefined) { sets.push(`recurring_pattern = $${idx++}`); params.push(recurringPattern); }
    if (recurringInterval !== undefined) { sets.push(`recurring_interval = $${idx++}`); params.push(recurringInterval); }
    if (scheduledAt !== undefined) { sets.push(`scheduled_at = $${idx++}`); params.push(scheduledAt ? new Date(scheduledAt) : null); }
    if (recurringEndDate !== undefined) { sets.push(`recurring_end_date = $${idx++}`); params.push(recurringEndDate ? new Date(recurringEndDate) : null); }
    if (welcomeMessage !== undefined) { sets.push(`welcome_message = $${idx++}`); params.push(welcomeMessage); }
    sets.push(`updated_at = NOW()`);

    if (sets.length <= 1) return res.status(400).json({ message: "Nothing to update" });

    params.push(req.params.id);
    const result = await pool.query(
      `UPDATE telegram_automated_messages SET ${sets.join(", ")} WHERE id = $${idx} RETURNING *`,
      params
    );
    if (result.rows.length === 0) return res.status(404).json({ message: "Not found" });
    res.json(result.rows[0]);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// Delete a Telegram automated message
router.delete("/telegram/automated-messages/:id", async (req: Request, res: Response) => {
  try {
    await pool.query(`DELETE FROM telegram_automated_messages WHERE id = $1`, [req.params.id]);
    res.status(204).end();
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// Send a Telegram automated message immediately (manual trigger)
router.post("/telegram/automated-messages/:id/send", async (req: Request, res: Response) => {
  try {
    const msg = await pool.query(`SELECT * FROM telegram_automated_messages WHERE id = $1`, [req.params.id]);
    if (msg.rows.length === 0) return res.status(404).json({ message: "Not found" });

    const autoMsg = msg.rows[0];
    let subscribers;

    if (autoMsg.audience === "individual" && autoMsg.target_chat_id) {
      subscribers = [{ chat_id: autoMsg.target_chat_id }];
    } else if (autoMsg.audience === "tagged" && autoMsg.target_tags) {
      const tags = typeof autoMsg.target_tags === "string" ? JSON.parse(autoMsg.target_tags) : autoMsg.target_tags;
      const tagResult = await pool.query(
        `SELECT chat_id FROM telegram_subscribers WHERE is_active = true AND is_blocked = false AND tags ?| $1`,
        [tags]
      );
      subscribers = tagResult.rows;
    } else {
      const allResult = await pool.query(
        `SELECT chat_id FROM telegram_subscribers WHERE is_active = true AND is_blocked = false`
      );
      subscribers = allResult.rows;
    }

    const chatIds = subscribers.map((s: any) => s.chat_id);
    if (chatIds.length === 0) {
      return res.json({ sent: 0, failed: 0, message: "No active subscribers found" });
    }

    const results = await sendTelegramBulk(chatIds, autoMsg.content);
    const sent = results.filter((r) => r.result.success).length;
    const failed = results.filter((r) => !r.result.success).length;

    await pool.query(
      `UPDATE telegram_automated_messages SET total_sent = total_sent + $1, total_failed = total_failed + $2, last_run_at = NOW(), updated_at = NOW() WHERE id = $3`,
      [sent, failed, req.params.id]
    );

    res.json({ sent, failed, total: chatIds.length });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// Telegram bot setup & diagnostics
router.get("/telegram/bot-info", async (_req: Request, res: Response) => {
  try {
    const [botInfo, webhookInfo] = await Promise.all([
      getTelegramBotInfo(),
      getTelegramWebhookInfo(),
    ]);
    res.json({ bot: botInfo, webhook: webhookInfo });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// Set up Telegram webhook
router.post("/telegram/setup-webhook", async (req: Request, res: Response) => {
  try {
    const appUrl = req.body.appUrl || process.env.APP_URL || `${req.protocol}://${req.get("host")}`;
    const result = await setupTelegramWebhook(appUrl);
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// Send broadcast to all Telegram subscribers (from marketing center)
router.post("/telegram/broadcast", async (req: Request, res: Response) => {
  try {
    const { content, audience, targetTags } = req.body;
    if (!content) return res.status(400).json({ message: "Message content is required" });

    let subscribers;
    if (audience === "tagged" && targetTags?.length) {
      const tagResult = await pool.query(
        `SELECT chat_id FROM telegram_subscribers WHERE is_active = true AND is_blocked = false AND tags ?| $1`,
        [targetTags]
      );
      subscribers = tagResult.rows;
    } else {
      const allResult = await pool.query(
        `SELECT chat_id FROM telegram_subscribers WHERE is_active = true AND is_blocked = false`
      );
      subscribers = allResult.rows;
    }

    const chatIds = subscribers.map((s: any) => s.chat_id);
    if (chatIds.length === 0) {
      return res.json({ sent: 0, failed: 0, message: "No active subscribers found" });
    }

    const results = await sendTelegramBulk(chatIds, content);
    const sent = results.filter((r) => r.result.success).length;
    const failed = results.filter((r) => !r.result.success).length;

    res.json({ sent, failed, total: chatIds.length });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

export default router;

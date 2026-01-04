import { Router, Request, Response } from "express";
import { storage } from "../storage";
import { isAuthenticated } from "../auth";
import { requireRole, UserRole } from "../rbac";
import { sendEmail, marketingTemplates } from "../emailService";
import { sendSms } from "../twilioService";
import { insertMarketingBroadcastSchema } from "@shared/schema";
import { db } from "../db";
import { leads, clients } from "@shared/schema";
import { eq, and, or, sql, inArray } from "drizzle-orm";

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

// Create and trigger a new broadcast
router.post("/broadcast", async (req: Request, res: Response) => {
  try {
    const user = req.user as any;
    const validatedData = insertMarketingBroadcastSchema.parse({
      ...req.body,
      createdBy: user.id,
      status: 'sending',
    });

    // Create the broadcast record
    const broadcast = await storage.createMarketingBroadcast(validatedData);

    // Start background sending process
    processBroadcast(broadcast.id).catch(err => 
      console.error(`Broadcast ${broadcast.id} background error:`, err)
    );

    res.status(202).json(broadcast);
  } catch (error: any) {
    console.error("Error creating broadcast:", error);
    res.status(400).json({ message: error.message || "Failed to create broadcast" });
  }
});

/**
 * Background process to handle bulk sending
 */
async function processBroadcast(broadcastId: string) {
  const broadcast = await storage.getMarketingBroadcast(broadcastId);
  if (!broadcast) return;

  try {
    let targetLeads: any[] = [];
    let targetClients: any[] = [];

    // 1. Fetch targets based on audience selection
    if (broadcast.audience === 'all' || broadcast.audience === 'leads') {
      const allLeads = await storage.getLeads();
      targetLeads = allLeads.filter(l => {
        if (broadcast.type === 'email' && !l.optInEmail) return false;
        if (broadcast.type === 'sms' && !l.optInSms) return false;
        if (!l.email && broadcast.type === 'email') return false;
        if (!l.phone && broadcast.type === 'sms') return false;
        
        // Apply filters if specific
        if (broadcast.audience === 'specific' && broadcast.filters) {
          const filters = broadcast.filters as any;
          if (filters.industries?.length && !filters.industries.includes(l.industry)) return false;
          if (filters.tags?.length && !l.tags?.some((t: string) => filters.tags.includes(t))) return false;
        }
        return true;
      });
    }

    if (broadcast.audience === 'all' || broadcast.audience === 'clients') {
      const allClients = await storage.getClients();
      targetClients = allClients.filter(c => {
        if (broadcast.type === 'email' && !c.optInEmail) return false;
        if (broadcast.type === 'sms' && !c.optInSms) return false;
        if (!c.email && broadcast.type === 'email') return false;
        if (!c.phone && broadcast.type === 'sms') return false;
        return true;
      });
    }

    // 1.5 Handle Individual Recipient
    const individualRecipients: { email?: string; phone?: string; type: 'individual' }[] = [];
    if (broadcast.audience === 'individual' && broadcast.customRecipient) {
      if (broadcast.type === 'email') {
        individualRecipients.push({ email: broadcast.customRecipient, type: 'individual' });
      } else {
        individualRecipients.push({ phone: broadcast.customRecipient, type: 'individual' });
      }
    }

    const total = targetLeads.length + targetClients.length + individualRecipients.length;
    await storage.updateMarketingBroadcast(broadcastId, { totalRecipients: total });

    let successCount = 0;
    let failedCount = 0;

    // 2. Loop and send
    const recipients = [
      ...targetLeads.map(l => ({ ...l, type: 'lead' })), 
      ...targetClients.map(c => ({ ...c, type: 'client' })),
      ...individualRecipients
    ];

    for (const recipient of recipients) {
      try {
        let result;
        if (broadcast.type === 'email') {
          const { subject, html } = marketingTemplates.broadcast(broadcast.subject || 'Wolfpaq Marketing', broadcast.content);
          result = await sendEmail((recipient as any).email!, subject, html);
        } else {
          result = await sendSms((recipient as any).phone!, broadcast.content);
        }

        if (result.success) {
          successCount++;
          await storage.createMarketingBroadcastRecipient({
            broadcastId,
            leadId: recipient.type === 'lead' ? (recipient as any).id : null,
            clientId: recipient.type === 'client' ? (recipient as any).id : null,
            customRecipient: recipient.type === 'individual' ? (broadcast.type === 'email' ? (recipient as any).email : (recipient as any).phone) : null,
            status: 'sent',
            sentAt: new Date(),
          });
        } else {
          failedCount++;
          await storage.createMarketingBroadcastRecipient({
            broadcastId,
            leadId: recipient.type === 'lead' ? (recipient as any).id : null,
            clientId: recipient.type === 'client' ? (recipient as any).id : null,
            customRecipient: recipient.type === 'individual' ? (broadcast.type === 'email' ? (recipient as any).email : (recipient as any).phone) : null,
            status: 'failed',
            errorMessage: result.error || result.message,
          });
        }
      } catch (err: any) {
        failedCount++;
        await storage.createMarketingBroadcastRecipient({
          broadcastId,
          leadId: recipient.type === 'lead' ? (recipient as any).id : null,
          clientId: recipient.type === 'client' ? (recipient as any).id : null,
          customRecipient: recipient.type === 'individual' ? (broadcast.type === 'email' ? (recipient as any).email : (recipient as any).phone) : null,
          status: 'failed',
          errorMessage: err.message,
        });
      }

      // Update progress incrementally
      await storage.updateMarketingBroadcast(broadcastId, { successCount, failedCount });
    }

    // 3. Mark completed
    await storage.updateMarketingBroadcast(broadcastId, { 
      status: 'completed', 
      completedAt: new Date() 
    });

  } catch (error: any) {
    console.error(`Error processing broadcast ${broadcastId}:`, error);
    await storage.updateMarketingBroadcast(broadcastId, { 
      status: 'failed',
      completedAt: new Date()
    });
  }
}

export default router;


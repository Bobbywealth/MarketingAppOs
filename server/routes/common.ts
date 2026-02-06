import { Response } from "express";
import { ZodError } from "zod";
import { storage } from "../storage";
import { db } from "../db";
import { clients, leads, onboardingTasks, commissions, subscriptionPackages } from "@shared/schema";
import { UserRole } from "@shared/roles";
import { eq, sql } from "drizzle-orm";
import multer from "multer";
import path from "path";
import fs from "fs/promises";
import { existsSync } from "fs";

// Multer configuration
export const UPLOAD_DIR = path.join(process.cwd(), 'uploads');

const storage_config = multer.diskStorage({
  destination: async function (_req, _file, cb) {
    if (!existsSync(UPLOAD_DIR)) {
      await fs.mkdir(UPLOAD_DIR, { recursive: true });
    }
    cb(null, UPLOAD_DIR);
  },
  filename: function (_req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

export const upload = multer({ 
  storage: storage_config,
  limits: {
    fileSize: 200 * 1024 * 1024 // 200MB limit
  },
  fileFilter: (_req, file, cb) => {
    // Accept images, videos, audio, PDFs, and CSVs
    const allowedMimes = [
      // Images
      'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp',
      // Videos
      'video/mp4', 'video/webm', 'video/ogg', 'video/quicktime',
      // Audio
      'audio/mpeg', 'audio/webm', 'audio/ogg', 'audio/wav', 'audio/mp4', 'audio/aac', 'audio/x-m4a',
      // Documents
      'text/csv', 'application/csv', 'application/pdf', 
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ];
    
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Allowed: images, videos, audio, PDF, CSV'));
    }
  }
});

export async function notifyAdminsAboutSecurityEvent(title: string, message: string, category: string = 'security') {
  try {
    const users = await storage.getUsers();
    const admins = users.filter(u => u.role === UserRole.ADMIN);
    const { sendPushToUser } = await import('../push');
    const { emailNotifications } = await import('../emailService');

    // OPTIMIZED: Batch fetch notification preferences using single query with IN clause
    const adminIds = admins.map(a => a.id);
    const { userViewPreferences } = await import('@shared/schema');
    const { inArray } = await import('drizzle-orm');
    const { db } = await import('../db');
    
    // Single query to get all admin preferences at once
    const prefs = await db.select()
      .from(userViewPreferences)
      .where(inArray(userViewPreferences.userId, adminIds));
    
    const prefsMap = new Map(prefs.map(p => [p.userId, p]));

    // Prepare all notifications and push notifications
    const notifications = [];
    const pushNotifications = [];

    for (const admin of admins) {
      notifications.push({
        userId: admin.id,
        type: 'error',
        title,
        message,
        category,
        actionUrl: '/settings',
        isRead: false,
      });

      pushNotifications.push({
        userId: admin.id,
        title,
        body: message,
        url: '/settings',
      });
    }

    // OPTIMIZED: Batch create notifications using Promise.all
    await Promise.all(notifications.map(notif => storage.createNotification(notif)));

    // OPTIMIZED: Send push notifications in parallel
    await Promise.all(pushNotifications.map(pushNotif =>
      sendPushToUser(pushNotif.userId, pushNotif).catch(err =>
        console.error(`Failed to send push to admin ${pushNotif.userId}:`, err)
      )
    ));

    // OPTIMIZED: Send email alerts to admins in parallel
    const emailPromises = admins
      .filter(admin => admin.email)
      .map(admin => {
        const prefs = prefsMap.get(admin.id);
        if (prefs?.emailNotifications !== false) {
          return emailNotifications.sendSecurityAlertEmail(admin.email, title, message).catch(err =>
            console.error(`Failed to send security email to admin ${admin.id}:`, err)
          );
        }
        return Promise.resolve();
      });
    
    await Promise.all(emailPromises);
  } catch (error) {
    console.error('Failed to notify admins about security event:', error);
  }
}

export function handleValidationError(error: any, res: Response) {
  if (error instanceof ZodError) {
    return res.status(400).json({ 
      message: "Validation error", 
      errors: error.errors.map(e => ({
        path: e.path.join('.'),
        message: e.message
      }))
    });
  }
  console.error(error);
  res.status(500).json({ message: "Internal server error" });
}

export async function notifyAdminsAboutAction(
  actorId: number | undefined,
  actorName: string,
  title: string,
  message: string,
  category: string = 'general',
  actionUrl?: string,
  type: 'info' | 'success' | 'warning' | 'error' = 'info'
) {
  try {
    const allUsers = await storage.getUsers();
    const admins = allUsers.filter(u => u.role === 'admin');

    // Batch fetch notification preferences for all admins
    const adminIds = admins.map(a => a.id);
    const allPrefs = await Promise.all(
      adminIds.map(id => storage.getUserNotificationPreferences(id).catch(() => null))
    );
    const prefsMap = new Map(adminIds.map((id, i) => [id, allPrefs[i]]));

    const { sendPushToUser } = await import('../push');
    const { emailNotifications } = await import('../emailService');
    const appUrl = process.env.APP_URL || 'https://www.marketingteam.app';
    const fullActionUrl = actionUrl?.startsWith('http') ? actionUrl : `${appUrl}${actionUrl || '/dashboard'}`;

    // Prepare all notifications and push notifications
    const notifications = [];
    const pushNotifications = [];
    const emailSends = [];

    for (const admin of admins) {
      if (admin.id === actorId) continue;

      notifications.push({
        userId: admin.id,
        type,
        title,
        message,
        category,
        actionUrl,
        isRead: false,
      });

      pushNotifications.push({
        userId: admin.id,
        title,
        body: message,
        url: actionUrl,
      });

      // Email notification (respect preferences)
      if (admin.email) {
        const prefs = prefsMap.get(admin.id);
        if (prefs?.emailNotifications !== false) {
          emailSends.push(
            emailNotifications.sendActionAlertEmail(
              admin.email,
              title,
              message,
              fullActionUrl,
              type
            ).catch(err => console.error(`Failed to send action email to admin ${admin.id}:`, err))
          );
        }
      }
    }

    // Batch create notifications
    for (const notif of notifications) {
      await storage.createNotification(notif);
    }

    // Send push notifications
    for (const pushNotif of pushNotifications) {
      await sendPushToUser(pushNotif.userId, pushNotif).catch(err =>
        console.error(`Failed to send push to admin ${pushNotif.userId}:`, err)
      );
    }

    // Send email notifications in parallel
    await Promise.all(emailSends);
  } catch (error) {
    console.error('Failed to notify admins:', error);
  }
}

export function getMissingFieldsForStage(stage: string, lead: any): string[] {
  const missing: string[] = [];
  if (stage === "closed_won") {
    if (!lead.company) missing.push("Company Name");
    if (!lead.primaryLocationAddress) missing.push("Primary Location Address");
    if (!lead.packageId) missing.push("Subscription Package");
    if (!lead.expectedStartDate) missing.push("Expected Start Date");
  }
  return missing;
}

export async function autoConvertLeadToClient(params: { leadId: string; actorUserId?: number | null }) {
  const { leadId, actorUserId } = params;
  
  return await db.transaction(async (tx) => {
    const [lead] = await tx.select().from(leads).where(eq(leads.id, leadId));
    if (!lead) throw new Error("Lead not found");
    
    if (lead.convertedToClientId) return lead.convertedToClientId; // Already converted

    const [newClient] = await tx.insert(clients).values({
      name: lead.company || lead.name || "New Client",
      email: lead.email,
      phone: lead.phone,
      company: lead.company,
      website: lead.website,
      packageId: lead.packageId,
      startDate: lead.expectedStartDate || new Date(),
      salesAgentId: lead.assignedToId,
      status: 'active',
      billingStatus: 'current',
      notes: lead.notes,
      socialLinks: {
        instagram: lead.instagram,
        tiktok: lead.tiktok,
        facebook: lead.facebook,
        youtube: lead.youtube
      }
    }).returning();

    await tx.update(leads).set({
      stage: 'closed_won',
      convertedToClientId: newClient.id,
      convertedAt: new Date(),
      status: 'converted'
    }).where(eq(leads.id, leadId));

    const standardTasks = [
      { title: "Review business goals and target audience", dueDay: 1 },
      { title: "Access social media accounts", dueDay: 2 },
      { title: "Setup communication channels", dueDay: 3 },
      { title: "Schedule first strategy call", dueDay: 5 },
      { title: "Content calendar draft review", dueDay: 10 },
    ];

    for (const task of standardTasks) {
      await tx.insert(onboardingTasks).values({
        clientId: newClient.id,
        title: task.title,
        dueDay: task.dueDay,
        completed: false
      });
    }

    if (lead.dealValue && lead.assignedToId) {
      const dealVal = Number(lead.dealValue);
      const rate = Number(lead.commissionRate || 10);
      const amount = (dealVal * rate) / 100;

      await tx.insert(commissions).values({
        agentId: lead.assignedToId,
        leadId: lead.id,
        clientId: newClient.id,
        dealValue: sql`${dealVal}`,
        commissionRate: sql`${rate}`,
        commissionAmount: sql`${amount}`,
        status: 'pending',
        notes: `Auto-generated from lead conversion: ${lead.company}`
      });
    }

    // Notify relevant parties about conversion (outside tx for performance if needed, but here it's fine)
    try {
      const { notifyAboutLeadAction } = await import('../leadNotifications');
      notifyAboutLeadAction({
        lead: {
          ...lead,
          stage: 'closed_won',
          convertedToClientId: newClient.id,
          convertedAt: new Date(),
          status: 'converted'
        } as any,
        action: 'converted',
        actorId: actorUserId || undefined
      }).catch(err => console.error("Failed to send lead conversion notifications:", err));
    } catch (e) {
      console.error("Notification failed but conversion succeeded", e);
    }

    return newClient;
  });
}


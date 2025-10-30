import type { Express, Request, Response } from "express";
import { storage } from "./storage";
import { pool, db } from "./db";
import { sql } from "drizzle-orm";
import { isAuthenticated } from "./auth";
import { ObjectStorageService } from "./objectStorage";
import { requireRole, requirePermission, UserRole, rolePermissions } from "./rbac";
import { AuditService } from "./auditService";
import { InstagramService } from "./instagramService";
import { createCheckoutSession } from "./stripeService";
import { dialpadService } from "./dialpadService";
import {
  insertClientSchema,
  insertCampaignSchema,
  insertTaskSchema,
  insertTaskCommentSchema,
  insertLeadSchema,
  insertContentPostSchema,
  insertInvoiceSchema,
  insertTicketSchema,
  insertMessageSchema,
  insertClientDocumentSchema,
  insertWebsiteProjectSchema,
  insertProjectFeedbackSchema,
  insertAnalyticsMetricSchema,
  insertLeadActivitySchema,
  insertLeadAutomationSchema,
} from "@shared/schema";
import { z, ZodError } from "zod";
import Stripe from "stripe";
import * as microsoftAuth from "./microsoftAuth";
import multer from "multer";
import path from "path";
import fs from "fs/promises";
import { existsSync } from "fs";

const objectStorageService = new ObjectStorageService();

// Ensure new message columns exist (safe to run multiple times)
async function ensureMessageColumns() {
  try {
    await pool.query(`ALTER TABLE messages ADD COLUMN IF NOT EXISTS delivered_at TIMESTAMP;`);
  } catch {}
  try {
    await pool.query(`ALTER TABLE messages ADD COLUMN IF NOT EXISTS read_at TIMESTAMP;`);
  } catch {}
  try {
    await pool.query(`ALTER TABLE messages ADD COLUMN IF NOT EXISTS media_url VARCHAR;`);
  } catch {}
  try {
    await pool.query(`ALTER TABLE messages ADD COLUMN IF NOT EXISTS media_type VARCHAR;`);
  } catch {}
  try {
    await pool.query(`ALTER TABLE messages ADD COLUMN IF NOT EXISTS duration_ms INTEGER;`);
  } catch {}
}

// Initialize Stripe if keys are present
let stripe: Stripe | null = null;
if (process.env.STRIPE_SECRET_KEY) {
  stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: "2024-11-20.acacia" as any,
  });
}

function handleValidationError(error: unknown, res: Response) {
  if (error instanceof ZodError) {
    return res.status(400).json({ message: "Validation error", errors: error.errors });
  }
  console.error(error);
  return res.status(500).json({ message: "Internal server error" });
}

// Configure multer for file uploads
const uploadDir = path.join(process.cwd(), 'uploads');

// Ensure upload directory exists
if (!existsSync(uploadDir)) {
  fs.mkdir(uploadDir, { recursive: true }).catch(console.error);
}

const storage_multer = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    const nameWithoutExt = path.basename(file.originalname, ext);
    cb(null, nameWithoutExt + '-' + uniqueSuffix + ext);
  }
});

const upload = multer({
  storage: storage_multer,
  limits: {
    fileSize: 200 * 1024 * 1024, // 200MB limit
  },
  fileFilter: (req, file, cb) => {
    // Accept images, videos, and audio (for voice messages)
    const allowedMimes = [
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/gif',
      'image/webp',
      'video/mp4',
      'video/webm',
      'video/ogg',
      'video/quicktime',
      'audio/mpeg',
      'audio/webm',
      'audio/ogg',
      'audio/wav',
      'audio/mp4',
      'audio/aac',
      'audio/x-m4a'
    ];
    
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only images, videos, and audio are allowed.'));
    }
  }
});

  // Helper function to notify admins about security events
async function notifyAdminsAboutSecurityEvent(title: string, message: string, category: string = 'security') {
  try {
    const users = await storage.getUsers();
    const admins = users.filter(u => u.role === UserRole.ADMIN);
    const { sendPushToUser } = await import('./push.js');
    
    for (const admin of admins) {
      await storage.createNotification({
        userId: admin.id,
        type: 'error',
        title,
        message,
        category,
        actionUrl: '/settings',
        isRead: false,
      });
      
      await sendPushToUser(admin.id, {
        title,
        body: message,
        url: '/settings',
      }).catch(err => console.error('Failed to send push notification:', err));
    }
    
    console.log(`✅ Notified ${admins.length} admin(s) about security event: ${title}`);
  } catch (error) {
    console.error('Failed to send security notifications:', error);
  }
}

// Helper function to check for overdue invoices and send reminders
async function checkOverdueInvoices() {
  try {
    const invoices = await storage.getInvoices();
    const now = new Date();
    const overdueInvoices = invoices.filter(invoice => 
      invoice.status === 'sent' && 
      invoice.dueDate && 
      new Date(invoice.dueDate) < now
    );
    
    for (const invoice of overdueInvoices) {
      // Notify client users about overdue invoice
      if (invoice.clientId) {
        const clientUsers = await storage.getUsersByClientId(invoice.clientId);
        const { sendPushToUser } = await import('./push.js');
        
        for (const clientUser of clientUsers) {
          await storage.createNotification({
            userId: clientUser.id,
            type: 'error',
            title: '💰 Invoice Overdue',
            message: `Invoice #${invoice.invoiceNumber} is overdue. Please pay immediately.`,
            category: 'financial',
            actionUrl: '/client-billing',
            isRead: false,
          });
          
          await sendPushToUser(clientUser.id, {
            title: '💰 Invoice Overdue',
            body: `Invoice #${invoice.invoiceNumber} is overdue. Please pay immediately.`,
            url: '/client-billing',
          }).catch(err => console.error('Failed to send push notification:', err));
        }
      }
      
      // Notify admins about overdue invoice
      const users = await storage.getUsers();
      const admins = users.filter(u => u.role === UserRole.ADMIN);
      const { sendPushToUser: sendPushToAdmin } = await import('./push.js');
      
      for (const admin of admins) {
        await storage.createNotification({
          userId: admin.id,
          type: 'warning',
          title: '💰 Invoice Overdue',
          message: `Invoice #${invoice.invoiceNumber} is overdue for client ${invoice.clientId}`,
          category: 'financial',
          actionUrl: `/invoices?invoiceId=${invoice.id}`,
          isRead: false,
        });
        
        await sendPushToAdmin(admin.id, {
          title: '💰 Invoice Overdue',
          body: `Invoice #${invoice.invoiceNumber} is overdue for client ${invoice.clientId}`,
          url: '/invoices',
        }).catch(err => console.error('Failed to send push notification:', err));
      }
    }
    
    if (overdueInvoices.length > 0) {
      console.log(`✅ Checked ${overdueInvoices.length} overdue invoices and sent notifications`);
    }
  } catch (error) {
    console.error('Failed to check overdue invoices:', error);
  }
}

// Helper function to notify admins about analytics and performance events
async function notifyAdminsAboutAnalytics(title: string, message: string, category: string = 'analytics') {
  try {
    const users = await storage.getUsers();
    const admins = users.filter(u => u.role === UserRole.ADMIN);
    const { sendPushToUser } = await import('./push.js');
    
    for (const admin of admins) {
      await storage.createNotification({
        userId: admin.id,
        type: 'info',
        title,
        message,
        category,
        actionUrl: '/analytics',
        isRead: false,
      });
      
      await sendPushToUser(admin.id, {
        title,
        body: message,
        url: '/analytics',
      }).catch(err => console.error('Failed to send push notification:', err));
    }
    
    console.log(`✅ Notified ${admins.length} admin(s) about analytics event: ${title}`);
  } catch (error) {
    console.error('Failed to send analytics notifications:', error);
  }
}

// Helper function to check for significant metric changes
async function checkSignificantMetricChanges() {
  try {
    const stats = await storage.getDashboardStats();
    
    // Check for significant changes (more than 50% increase/decrease)
    const significantChanges = [];
    
    if (stats.clientsChange && Math.abs(stats.clientsChange) > 50) {
      significantChanges.push({
        metric: 'Clients',
        change: stats.clientsChange,
        message: `Client count ${stats.clientsChange > 0 ? 'increased' : 'decreased'} by ${Math.abs(stats.clientsChange)}%`
      });
    }
    
    if (stats.campaignsChange && Math.abs(stats.campaignsChange) > 50) {
      significantChanges.push({
        metric: 'Campaigns',
        change: stats.campaignsChange,
        message: `Campaign count ${stats.campaignsChange > 0 ? 'increased' : 'decreased'} by ${Math.abs(stats.campaignsChange)}%`
      });
    }
    
    if (stats.revenueChange && Math.abs(stats.revenueChange) > 50) {
      significantChanges.push({
        metric: 'Revenue',
        change: stats.revenueChange,
        message: `Revenue ${stats.revenueChange > 0 ? 'increased' : 'decreased'} by ${Math.abs(stats.revenueChange)}%`
      });
    }
    
    if (stats.pipelineChange && Math.abs(stats.pipelineChange) > 50) {
      significantChanges.push({
        metric: 'Pipeline',
        change: stats.pipelineChange,
        message: `Pipeline value ${stats.pipelineChange > 0 ? 'increased' : 'decreased'} by ${Math.abs(stats.pipelineChange)}%`
      });
    }
    
    // Send notifications for significant changes
    for (const change of significantChanges) {
      await notifyAdminsAboutAnalytics(
        `📊 Significant ${change.metric} Change`,
        change.message,
        'analytics'
      );
    }
    
    if (significantChanges.length > 0) {
      console.log(`✅ Detected ${significantChanges.length} significant metric changes`);
    }
  } catch (error) {
    console.error('Failed to check metric changes:', error);
  }
}

// Run overdue invoice check every hour
setInterval(checkOverdueInvoices, 60 * 60 * 1000); // 1 hour

// Helper function to notify admins about integration and external service events
async function notifyAdminsAboutIntegration(title: string, message: string, category: string = 'integration') {
  try {
    const users = await storage.getUsers();
    const admins = users.filter(u => u.role === UserRole.ADMIN);
    const { sendPushToUser } = await import('./push.js');
    
    for (const admin of admins) {
      await storage.createNotification({
        userId: admin.id,
        type: 'warning',
        title,
        message,
        category,
        actionUrl: '/settings',
        isRead: false,
      });
      
      await sendPushToUser(admin.id, {
        title,
        body: message,
        url: '/settings',
      }).catch(err => console.error('Failed to send push notification:', err));
    }
    
    console.log(`✅ Notified ${admins.length} admin(s) about integration event: ${title}`);
  } catch (error) {
    console.error('Failed to send integration notifications:', error);
  }
}

// Helper: meeting reminders for bookings/events in next 60 mins
async function runMeetingReminders() {
  const results: any[] = [];
  try {
    const now = new Date();
    const inOneHour = new Date(now.getTime() + 60 * 60 * 1000);
    if (!('getCalendarEvents' in storage)) {
      console.warn('Storage has no getCalendarEvents; skipping reminders');
      return results;
    }
    // @ts-ignore - optional API on storage
    const events = await storage.getCalendarEvents();
    const upcoming = (events || []).filter((e: any) => {
      const start = e.start || e.datetime || e.date;
      if (!start) return false;
      const when = new Date(start);
      return when >= now && when <= inOneHour;
    });
    if (upcoming.length === 0) return results;

    const users = await storage.getUsers();
    const admins = users.filter(u => u.role === UserRole.ADMIN);
    const { sendPushToUser } = await import('./push.js');

    for (const ev of upcoming) {
      for (const admin of admins) {
        await storage.createNotification({
          userId: admin.id,
          type: 'warning',
          title: '📅 Upcoming Meeting',
          message: `${ev.title || 'Scheduled meeting'} at ${new Date(ev.start || ev.datetime).toLocaleTimeString()}`,
          category: 'communication',
          actionUrl: '/company-calendar',
          isRead: false,
        });
        await sendPushToUser(admin.id, {
          title: '📅 Upcoming Meeting',
          body: `${ev.title || 'Scheduled meeting'} in less than 1 hour`,
          url: '/company-calendar',
        }).catch(err => console.error('Failed to send push notification:', err));
      }
      results.push({ id: ev.id, title: ev.title, notifiedAdmins: admins.length });
    }
    console.log(`✅ Meeting reminders sent for ${upcoming.length} event(s)`);
  } catch (error) {
    console.error('Meeting reminders error:', error);
  }
  return results;
}

// Schedule meeting reminders every 15 minutes
setInterval(() => { runMeetingReminders().catch(() => {}); }, 15 * 60 * 1000);

// Run analytics check every 6 hours
setInterval(checkSignificantMetricChanges, 6 * 60 * 60 * 1000); // 6 hours

export function registerRoutes(app: Express) {
  // File upload endpoint
  app.post("/api/upload", isAuthenticated, upload.single('file'), async (req: Request, res: Response) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      // Generate URL for the uploaded file
      const fileUrl = `/uploads/${req.file.filename}`;
      
      // Notify user about successful file upload
      try {
        const currentUser = req.user as any;
        const currentUserId = currentUser?.id || currentUser?.claims?.sub;
        
        await storage.createNotification({
          userId: currentUserId,
          type: 'success',
          title: '📁 File Uploaded',
          message: `File "${req.file.originalname}" has been uploaded successfully`,
          category: 'file_management',
          actionUrl: '/content',
          isRead: false,
        });
        
        // Notify admins about file upload
        const users = await storage.getUsers();
        const admins = users.filter(u => u.role === UserRole.ADMIN);
        const { sendPushToUser } = await import('./push.js');
        
        for (const admin of admins) {
          if (admin.id !== currentUserId) {
            await storage.createNotification({
              userId: admin.id,
              type: 'info',
              title: '📁 File Uploaded',
              message: `User uploaded file: "${req.file.originalname}"`,
              category: 'file_management',
              actionUrl: '/content',
              isRead: false,
            });
            
            await sendPushToUser(admin.id, {
              title: '📁 File Uploaded',
              body: `User uploaded file: "${req.file.originalname}"`,
              url: '/content',
            }).catch(err => console.error('Failed to send push notification:', err));
          }
        }
        
        console.log(`✅ File upload notifications sent for: ${req.file.originalname}`);
      } catch (notifError) {
        console.error('Failed to send file upload notifications:', notifError);
      }
      
      res.json({
        success: true,
        url: fileUrl,
        filename: req.file.filename,
        originalName: req.file.originalname,
        mimetype: req.file.mimetype,
        size: req.file.size
      });
    } catch (error: any) {
      console.error('Upload error:', error);
      res.status(500).json({ 
        message: "Upload failed", 
        error: error.message 
      });
    }
  });

  // Email config test endpoint
  app.get("/api/email/test", isAuthenticated, requireRole(UserRole.ADMIN), async (_req: Request, res: Response) => {
    try {
      const ok = Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);
      res.json({ configured: ok, host: process.env.SMTP_HOST || null, from: process.env.SMTP_USER || null, secure: process.env.SMTP_SECURE === 'true' });
    } catch (e: any) {
      res.status(500).json({ configured: false, error: e?.message || 'Unknown error' });
    }
  });

  // Announcements (admin-only): send company-wide announcement
  app.post("/api/announcements", isAuthenticated, requireRole(UserRole.ADMIN), async (req: Request, res: Response) => {
    try {
      const { title, message } = req.body as { title: string; message: string };
      if (!title || !message) {
        return res.status(400).json({ message: 'Title and message are required' });
      }
      const users = await storage.getUsers();
      const { sendPushToUser } = await import('./push.js');
      let count = 0;
      for (const user of users) {
        await storage.createNotification({
          userId: user.id,
          type: 'info',
          title: `📣 ${title}`,
          message,
          category: 'announcement',
          actionUrl: '/dashboard',
          isRead: false,
        });
        await sendPushToUser(user.id, {
          title: `📣 ${title}`,
          body: message.substring(0, 120),
          url: '/dashboard',
        }).catch(err => console.error('Failed to send push notification:', err));
        count++;
      }
      res.status(201).json({ message: 'Announcement sent', recipients: count });
    } catch (error) {
      console.error('Failed to send announcement:', error);
      res.status(500).json({ message: 'Failed to send announcement' });
    }
  });

  // Booking meeting reminders: notify admins for meetings in next 60 minutes
  app.post("/api/system/run-meeting-reminders", isAuthenticated, requireRole(UserRole.ADMIN), async (_req: Request, res: Response) => {
    try {
      // Optional manual trigger
      const reminders = await runMeetingReminders();
      res.json({ message: 'Meeting reminders processed', reminders });
    } catch (error) {
      console.error('Failed to run meeting reminders:', error);
      res.status(500).json({ message: 'Failed to run meeting reminders' });
    }
  });

  // Create Stripe Checkout Session for package purchase
  app.post("/api/create-checkout-session", async (req: Request, res: Response) => {
    try {
      const { packageId, leadId, email, name } = req.body;

      if (!packageId || !email || !name) {
        return res.status(400).json({ message: "Missing required fields: packageId, email, name" });
      }

      // Get the package details
      const pkg = await storage.getSubscriptionPackage(packageId);
      if (!pkg) {
        return res.status(404).json({ message: "Package not found" });
      }

      // Get the app's base URL
      const baseUrl = process.env.APP_URL || `${req.protocol}://${req.get('host')}`;

      // Create Stripe checkout session
      const session = await createCheckoutSession({
        packageId: pkg.id,
        packageName: pkg.name,
        packagePrice: pkg.price,
        clientEmail: email,
        clientName: name,
        leadId,
        successUrl: `${baseUrl}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
        cancelUrl: `${baseUrl}/signup?canceled=true`,
      });

      res.json({
        success: true,
        checkoutUrl: session.checkoutUrl,
        sessionId: session.sessionId,
      });
    } catch (error: any) {
      console.error('Checkout session creation error:', error);
      res.status(500).json({
        success: false,
        message: error.message || "Failed to create checkout session",
      });
    }
  });

  // Confirm Stripe payment and convert lead to client
  app.post("/api/stripe/confirm", async (req: Request, res: Response) => {
    try {
      const { sessionId } = req.body as { sessionId?: string };
      if (!sessionId) {
        return res.status(400).json({ success: false, message: "Missing sessionId" });
      }

      const { getStripeInstance } = await import("./stripeService.js");
      const stripe = getStripeInstance();
      if (!stripe) {
        return res.status(500).json({ success: false, message: "Stripe not configured" });
      }

      // Retrieve the checkout session
      const session = await stripe.checkout.sessions.retrieve(sessionId, {
        expand: ["subscription", "customer"],
      });

      if (!session || (session.status !== "complete" && session.payment_status !== "paid")) {
        return res.status(400).json({ success: false, message: "Payment not completed" });
      }

      // Pull metadata
      const leadId = (session.metadata?.leadId || session.client_reference_id || "").toString() || null;
      const packageId = session.metadata?.packageId || null;
      const email = (session.customer_details?.email || (typeof session.customer === 'object' ? session.customer?.email : undefined) || "").toString();
      const name = (session.metadata?.clientName || (typeof session.customer === 'object' ? session.customer?.name : undefined) || "New Client").toString();

      // Attempt to find existing lead by id or email
      let matchedLead: any = null;
      try {
        const allLeads = await storage.getLeads();
        matchedLead = allLeads.find((l: any) => (leadId && l.id === leadId) || (email && l.email === email));
      } catch (e) {
        console.warn("⚠️ Unable to fetch leads while confirming Stripe payment:", e);
      }

      // Create client if one with same email doesn't already exist
      let createdClient = null as any;
      try {
        const allClients = await storage.getClients();
        const existing = allClients.find((c: any) => email && c.email === email);
        if (existing) {
          createdClient = existing;
        } else {
          createdClient = await storage.createClient({
            name,
            email: email || undefined,
            status: "onboarding",
            notes: `Created from Stripe session ${sessionId}${packageId ? ` for package ${packageId}` : ""}`,
          } as any);
        }
      } catch (e) {
        console.error("❌ Failed creating client from Stripe confirm:", e);
        return res.status(500).json({ success: false, message: "Failed to create client" });
      }

      // Update lead as converted
      if (matchedLead) {
        try {
          await storage.updateLead(matchedLead.id, {
            stage: "converted",
            notes: `${matchedLead.notes || ""}\nConverted via Stripe payment on ${new Date().toISOString()} (session ${sessionId})`,
            value: createdClient?.id || null,
          } as any);
        } catch (e) {
          console.warn("⚠️ Failed to update lead as converted:", e);
        }
      }

      // Notify admins/managers
      try {
        const users = await storage.getUsers();
        const notifyUsers = users.filter((u: any) => u.role === UserRole.ADMIN || u.role === UserRole.MANAGER);
        const { sendPushToUser } = await import('./push.js');
        for (const u of notifyUsers) {
          await storage.createNotification({
            userId: u.id,
            type: 'success',
            title: '🧾 Payment Successful - New Client',
            message: `${name} just subscribed${packageId ? ` to package ${packageId}` : ""}.`,
            category: 'general',
            actionUrl: `/clients?search=${encodeURIComponent(name)}`,
            isRead: false,
          });
          await sendPushToUser(u.id, {
            title: '🧾 New Paying Client',
            body: `${name} completed checkout${packageId ? ` (${packageId})` : ''}`,
            url: '/clients',
          }).catch(() => {});
        }
      } catch (e) {
        console.warn("⚠️ Failed sending notifications for Stripe confirm:", e);
      }

      return res.json({ success: true, clientId: createdClient?.id || null });
    } catch (error: any) {
      console.error('Stripe confirm error:', error);
      return res.status(500).json({ success: false, message: error?.message || 'Stripe confirm failed' });
    }
  });

  // File download/serve endpoint
  app.get("/uploads/:filename", async (req: Request, res: Response) => {
    try {
      const filename = req.params.filename;
      const filePath = path.join(uploadDir, filename);

      // Check if file exists
      if (!existsSync(filePath)) {
        return res.status(404).json({ message: "File not found" });
      }

      // Get file stats for size and modified date
      const stats = await fs.stat(filePath);
      
      // Set appropriate headers
      const ext = path.extname(filename).toLowerCase();
      const mimeTypes: Record<string, string> = {
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.png': 'image/png',
        '.gif': 'image/gif',
        '.webp': 'image/webp',
        '.mp4': 'video/mp4',
        '.webm': 'video/webm',
        '.ogg': 'video/ogg',
        '.mov': 'video/quicktime'
      };

      const contentType = mimeTypes[ext] || 'application/octet-stream';
      
      res.setHeader('Content-Type', contentType);
      res.setHeader('Content-Length', stats.size);
      res.setHeader('Cache-Control', 'public, max-age=31536000'); // Cache for 1 year
      
      // If download query param is present, force download
      if (req.query.download === 'true') {
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      }

      // Stream the file
      res.sendFile(filePath);
    } catch (error: any) {
      console.error('Download error:', error);
      res.status(500).json({ 
        message: "Failed to download file", 
        error: error.message 
      });
    }
  });

  // Early lead capture endpoint (captures lead after step 2)
  app.post("/api/early-lead", async (req: Request, res: Response) => {
    try {
      const earlyLeadSchema = z.object({
        name: z.string().min(1),
        email: z.string().email(),
        phone: z.string().min(1),
        company: z.string().min(1),
        website: z.string().optional(),
        industry: z.string().optional(),
      });

      const data = earlyLeadSchema.parse(req.body);

      // Check if lead with this email already exists
      let existingLead = null;
      try {
        const existingLeads = await storage.getLeads();
        existingLead = existingLeads.find(l => l.email === data.email);
      } catch (getLeadsError) {
        console.error('⚠️ Error fetching existing leads, continuing with creation:', getLeadsError);
        // Continue anyway - we'll handle duplicates if they occur
      }

      if (existingLead) {
        // Lead already exists, don't create duplicate
        return res.json({ success: true, leadId: existingLead.id, duplicate: true });
      }

      // Create early lead capture
      const leadData: any = {
        name: data.name,
        email: data.email,
        phone: data.phone,
        company: data.company,
        website: data.website || null,
        source: "website",
        stage: "prospect",
        score: "warm", // warm lead since they started signup
        value: null,
        notes: `⏳ EARLY LEAD CAPTURE (Step 2/3)

🎯 Source: Website Signup Form - IN PROGRESS
Lead started the account creation process but hasn't completed yet.

📋 COMPANY INFO:
• Website: ${data.website || 'Not provided'}
• Industry: ${data.industry || 'Not specified'}

⚠️ This lead is in progress - follow up to encourage completion!
🎯 They're interested in marketing services.

---
This lead will be updated if they complete the full signup process.`,
        assignedToId: null,
        sourceMetadata: { type: "signup_early_capture", step: 2 },
        nextFollowUp: null,
      };

      // Only add clientId if the column exists (for backwards compatibility)
      // This will be handled by the migration eventually
      try {
        leadData.clientId = null;
      } catch (e) {
        // clientId column doesn't exist yet, skip it
      }

      console.log('📝 Creating early lead with data:', leadData);
      const lead = await storage.createLead(leadData);
      console.log('✅ Early lead created successfully:', lead.id);
      
      // Notify all admins and managers about new early lead
      try {
        const users = await storage.getUsers();
        const adminsAndManagers = users.filter(u => 
          u.role === UserRole.ADMIN || u.role === UserRole.MANAGER
        );
        
        const { sendPushToUser } = await import('./push.js');
        
        for (const user of adminsAndManagers) {
          // In-app notification
          await storage.createNotification({
            userId: user.id,
            type: 'info',
            title: '🎯 New Early Lead',
            message: `${lead.name}${lead.company ? ` from ${lead.company}` : ''} - Started signup process`,
            category: 'general',
            actionUrl: `/leads?leadId=${lead.id}`,
            isRead: false,
          });
          
          // Push notification
          await sendPushToUser(user.id, {
            title: '🎯 New Early Lead',
            body: `${lead.name}${lead.company ? ` from ${lead.company}` : ''} - Started signup process`,
            url: '/leads',
          }).catch(err => console.error('Failed to send push notification:', err));
        }
        console.log(`✅ Notifications sent to ${adminsAndManagers.length} admins/managers`);
      } catch (notifError) {
        console.error('⚠️ Failed to send notifications for early lead:', notifError);
        // Don't fail the request if notification fails
      }
      
      res.json({ success: true, leadId: lead.id });
    } catch (error: any) {
      console.error('❌ Early lead capture error:', error);
      console.error('Error details:', {
        message: error?.message,
        stack: error?.stack,
      });
      return res.status(500).json({ 
        success: false, 
        message: "Failed to create lead. Please try again." 
      });
    }
  });

  // Public social media audit endpoint (no authentication required)
  app.post("/api/social-audit", async (req: Request, res: Response) => {
    try {
      const auditSchema = z.object({
        website: z.string().url("Must be a valid URL"),
        instagramUrl: z.string().optional(),
        tiktokUrl: z.string().optional(),
        facebookUrl: z.string().optional(),
      });

      const data = auditSchema.parse(req.body);
      console.log('🔍 Running social media audit for:', data.website);

      // Generate audit report using existing AuditService
      const auditReport = await AuditService.generateAuditReport({
        website: data.website,
        socialPlatforms: [],
        instagramUrl: data.instagramUrl,
        facebookUrl: data.facebookUrl,
        tiktokUrl: data.tiktokUrl,
        linkedinUrl: "",
        twitterUrl: "",
        youtubeUrl: "",
      });

      console.log('✅ Social media audit completed');
      res.json({
        success: true,
        ...auditReport,
      });
    } catch (error) {
      console.error('❌ Social media audit error:', error);
      if (error instanceof ZodError) {
        return res.status(400).json({
          success: false,
          message: "Invalid input data",
          errors: error.errors,
        });
      }
      return res.status(500).json({
        success: false,
        message: "Failed to complete audit. Please try again.",
      });
    }
  });

  // Simplified signup endpoint (no audit, direct to package selection)
  app.post("/api/signup-simple", async (req: Request, res: Response) => {
    try {
      const signupSchema = z.object({
        company: z.string().min(1),
        website: z.string().optional(),
        industry: z.string().optional(),
        companySize: z.string().optional(),
        name: z.string().min(1),
        email: z.string().email(),
        phone: z.string().min(1),
        services: z.array(z.string()).min(1),
        budget: z.string().optional(),
        webDevType: z.string().optional(),
        webDevFeatures: z.array(z.string()).optional(),
        webDevTimeline: z.string().optional(),
        webDevBudget: z.string().optional(),
        appPlatforms: z.array(z.string()).optional(),
        appType: z.string().optional(),
        appFeatures: z.array(z.string()).optional(),
        appTimeline: z.string().optional(),
        appBudget: z.string().optional(),
        notes: z.string().optional(),
      });

      const data = signupSchema.parse(req.body);
      console.log('📝 Processing simplified signup for:', data.email);

      // Check for existing lead and update it
      const existingLeads = await storage.getLeads();
      const existingLead = existingLeads.find(l => l.email === data.email);

      if (existingLead) {
        // Update existing lead with complete information
        const updatedNotes = `${existingLead.notes || ''}

🎯 COMPLETED SIGNUP PROCESS
Services Interested: ${data.services.join(', ')}
Budget: ${data.budget || 'Not specified'}

${data.webDevType ? `
🌐 WEB DEVELOPMENT DETAILS:
• Type: ${data.webDevType}
• Features: ${data.webDevFeatures?.join(', ') || 'None specified'}
• Timeline: ${data.webDevTimeline || 'Not specified'}
• Budget: ${data.webDevBudget || 'Not specified'}
` : ''}

${data.appType ? `
📱 MOBILE APP DETAILS:
• Platforms: ${data.appPlatforms?.join(', ') || 'Not specified'}
• Type: ${data.appType}
• Features: ${data.appFeatures?.join(', ') || 'None specified'}
• Timeline: ${data.appTimeline || 'Not specified'}
• Budget: ${data.appBudget || 'Not specified'}
` : ''}

${data.notes ? `
💬 ADDITIONAL NOTES:
${data.notes}
` : ''}

---
Lead completed signup process and is ready for package selection.`;

        await storage.updateLead(existingLead.id, {
          stage: "qualified",
          score: "hot",
          notes: updatedNotes,
          sourceMetadata: { 
            ...(existingLead.sourceMetadata as object || {}),
            completedSignup: true,
            services: data.services,
            webDev: data.webDevType ? {
              type: data.webDevType,
              features: data.webDevFeatures,
              timeline: data.webDevTimeline,
              budget: data.webDevBudget
            } : undefined,
            mobileDev: data.appType ? {
              platforms: data.appPlatforms,
              type: data.appType,
              features: data.appFeatures,
              timeline: data.appTimeline,
              budget: data.appBudget
            } : undefined
          },
        });

        console.log('✅ Updated existing lead with complete signup data');
        res.json({ success: true, leadId: existingLead.id, message: "Account created successfully!" });
      } else {
        // Create new lead if none exists
        const leadData = {
        name: data.name,
        email: data.email,
        phone: data.phone,
        company: data.company,
        website: data.website || null,
          source: "website",
          stage: "qualified",
          score: "hot",
          value: null,
          notes: `🎯 NEW SIGNUP - QUALIFIED LEAD

📋 COMPANY INFO:
• Website: ${data.website || 'Not provided'}
• Industry: ${data.industry || 'Not specified'}
• Company Size: ${data.companySize || 'Not specified'}

🎯 SERVICES INTERESTED:
${data.services.join(', ')}
Budget: ${data.budget || 'Not specified'}

${data.webDevType ? `
🌐 WEB DEVELOPMENT DETAILS:
• Type: ${data.webDevType}
• Features: ${data.webDevFeatures?.join(', ') || 'None specified'}
• Timeline: ${data.webDevTimeline || 'Not specified'}
• Budget: ${data.webDevBudget || 'Not specified'}
` : ''}

${data.appType ? `
📱 MOBILE APP DETAILS:
• Platforms: ${data.appPlatforms?.join(', ') || 'Not specified'}
• Type: ${data.appType}
• Features: ${data.appFeatures?.join(', ') || 'None specified'}
• Timeline: ${data.appTimeline || 'Not specified'}
• Budget: ${data.appBudget || 'Not specified'}
` : ''}

${data.notes ? `
💬 ADDITIONAL NOTES:
${data.notes}
` : ''}

---
This lead completed the full signup process and is ready for package selection.`,
          clientId: null,
        assignedToId: null,
          sourceMetadata: { 
            type: "signup_complete",
            services: data.services,
            webDev: data.webDevType ? {
              type: data.webDevType,
              features: data.webDevFeatures,
              timeline: data.webDevTimeline,
              budget: data.webDevBudget
            } : undefined,
            mobileDev: data.appType ? {
              platforms: data.appPlatforms,
              type: data.appType,
              features: data.appFeatures,
              timeline: data.appTimeline,
              budget: data.appBudget
            } : undefined
          },
          nextFollowUp: null,
        };

        const lead = await storage.createLead(leadData);
        console.log('✅ Created new qualified lead from complete signup');
        res.json({ success: true, leadId: lead.id, message: "Account created successfully!" });
      }
    } catch (error) {
      console.error('❌ Simplified signup error:', error);
      if (error instanceof ZodError) {
        return res.status(400).json({
          success: false,
          message: "Invalid input data",
          errors: error.errors,
        });
      }
      return res.status(500).json({
        success: false,
        message: "Failed to create account. Please try again.",
      });
    }
  });

  // Public signup endpoint (no authentication required)
  app.post("/api/signup", async (req: Request, res: Response) => {
    try {
      const signupSchema = z.object({
        company: z.string().min(1),
        website: z.string().optional(),
        industry: z.string().optional(),
        companySize: z.string().optional(),
        name: z.string().min(1),
        email: z.string().email(),
        phone: z.string().min(1),
        services: z.array(z.string()),
        budget: z.string().optional(),
        socialPlatforms: z.array(z.string()).optional(),
        instagramUrl: z.string().optional(),
        facebookUrl: z.string().optional(),
        tiktokUrl: z.string().optional(),
        linkedinUrl: z.string().optional(),
        twitterUrl: z.string().optional(),
        youtubeUrl: z.string().optional(),
        notes: z.string().optional(),
      });

      const data = signupSchema.parse(req.body);

      // Generate automated audit report in background
      let auditReport: any = null;
      try {
        auditReport = await AuditService.generateAuditReport({
          website: data.website,
          socialPlatforms: data.socialPlatforms,
          instagramUrl: data.instagramUrl,
          facebookUrl: data.facebookUrl,
          tiktokUrl: data.tiktokUrl,
          linkedinUrl: data.linkedinUrl,
          twitterUrl: data.twitterUrl,
          youtubeUrl: data.youtubeUrl,
        });
      } catch (auditError) {
        console.error('Audit generation failed:', auditError);
        // Continue with signup even if audit fails
      }

      // Create or update lead for sales follow-up
      // NOTE: We DO NOT create a client here - they're just a lead until they convert!
      try {
        const leadNotes = `🎯 AUTO-CREATED FROM FREE AUDIT SIGNUP - ✅ COMPLETED

📋 COMPANY INFO:
• Website: ${data.website || 'Not provided'}
• Industry: ${data.industry || 'Not specified'}
• Company Size: ${data.companySize || 'Not specified'}
• Budget: ${data.budget || 'Not specified'}
• Services Interested: ${data.services.join(', ')}

📱 SOCIAL MEDIA:
${data.instagramUrl ? `• Instagram: ${data.instagramUrl}` : ''}
${data.facebookUrl ? `• Facebook: ${data.facebookUrl}` : ''}
${data.tiktokUrl ? `• TikTok: ${data.tiktokUrl}` : ''}
${data.linkedinUrl ? `• LinkedIn: ${data.linkedinUrl}` : ''}
${data.twitterUrl ? `• Twitter: ${data.twitterUrl}` : ''}
${data.youtubeUrl ? `• YouTube: ${data.youtubeUrl}` : ''}

📊 AUDIT RESULTS ($2,500 VALUE):
• Total Issues Found: ${auditReport?.summary.totalIssues || 0}
• Critical Issues: ${auditReport?.summary.criticalIssues || 0}
${auditReport?.website ? '\n🌐 WEBSITE ISSUES:\n' + auditReport.website.recommendations.slice(0, 5).map((r: any) => `  ${r}`).join('\n') : ''}
${auditReport?.socialMedia && auditReport.socialMedia.length > 0 ? '\n\n📱 SOCIAL MEDIA AUDIT:\n' + auditReport.socialMedia.map((s: any) => `  ${s.platform}: ${s.isValid ? '✅ Valid' : '❌ Invalid'} ${s.stats?.followers ? `(${s.stats.followers.toLocaleString()} followers)` : ''}`).join('\n') : ''}

🔥 This lead is HOT - they completed the full audit process!

${data.notes ? `\n💬 ADDITIONAL NOTES:\n${data.notes}` : ''}`;

        // Check if early lead capture exists
        const existingLeads = await storage.getLeads();
        const existingLead = existingLeads.find(l => l.email === data.email);

        let leadId: string;
        
        if (existingLead) {
          // Update existing lead with complete information
          const leadScore = auditReport ? (auditReport.summary.totalIssues >= 5 ? "hot" : "warm") : "warm";
          await storage.updateLead(existingLead.id, {
            source: "website",
            stage: "qualified", // Upgrade stage since they completed
            score: leadScore,
            value: auditReport ? auditReport.summary.estimatedValue * 100 : 250000, // Convert to cents
            notes: leadNotes,
            sourceMetadata: { 
              type: "signup_completed", 
              services: data.services,
              auditIssues: auditReport?.summary.totalIssues || 0,
            },
          });
          leadId = existingLead.id;
          console.log(`✅ Updated existing lead ${existingLead.id} with complete audit data`);
        } else {
          // Create new lead if somehow early capture didn't work
          const leadScore = auditReport ? (auditReport.summary.totalIssues >= 5 ? "hot" : "warm") : "warm";
          const leadData = {
            name: data.name,
            email: data.email,
            phone: data.phone,
            company: data.company,
            website: data.website || null,
            source: "website",
            stage: "qualified",
            score: leadScore,
            value: auditReport ? auditReport.summary.estimatedValue * 100 : 250000, // Convert to cents
            notes: leadNotes,
            clientId: null,
            assignedToId: null,
            sourceMetadata: { 
              type: "signup_completed", 
              services: data.services,
              auditIssues: auditReport?.summary.totalIssues || 0,
            },
            nextFollowUp: null,
          };
          const newLead = await storage.createLead(leadData);
          leadId = newLead.id;
          console.log(`✅ Created new lead ${newLead.id} with complete audit data`);
        }
        
        res.json({ 
          success: true, 
          leadId: leadId,
          audit: auditReport,
        });
      } catch (leadError) {
        console.error('Failed to create/update lead:', leadError);
        // Return error since lead creation is critical now
        return res.status(500).json({ 
          success: false, 
          message: "Failed to create lead. Please try again." 
        });
      }
    } catch (error) {
      return handleValidationError(error, res);
    }
  });

  // Microsoft OAuth routes for email integration
  app.get("/api/auth/microsoft", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const user = req.user as any;
      const userId = user?.id || user?.claims?.sub;
      
      // Generate auth URL with state containing user ID
      const state = Buffer.from(JSON.stringify({ userId })).toString('base64');
      const authUrl = await microsoftAuth.getAuthUrl(state);
      
      res.redirect(authUrl);
    } catch (error) {
      console.error('Error initiating Microsoft auth:', error);
      res.status(500).json({ message: "Failed to initiate Microsoft authentication" });
    }
  });

  app.get("/api/auth/microsoft/callback", async (req: Request, res: Response) => {
    try {
      const { code, state } = req.query;
      
      if (!code || typeof code !== 'string') {
        return res.status(400).send('Missing authorization code');
      }

      // Get tokens from Microsoft
      const tokenData = await microsoftAuth.getTokenFromCode(code);
      
      // Get user profile
      const profile = await microsoftAuth.getUserProfile(tokenData.accessToken);
      
      // Decode state to get user ID
      const stateData = JSON.parse(Buffer.from(state as string, 'base64').toString());
      const userId = stateData.userId;

      // Save or update email account in database
      const existingAccount = await storage.getEmailAccountByUserId(userId);
      
      if (existingAccount) {
        await storage.updateEmailAccount(existingAccount.id, {
          accessToken: tokenData.accessToken,
          refreshToken: tokenData.refreshToken,
          tokenExpiresAt: tokenData.expiresOn,
          lastSyncedAt: new Date(),
          isActive: true,
        });
      } else {
        await storage.createEmailAccount({
          userId,
          email: profile.mail || profile.userPrincipalName,
          provider: 'microsoft',
          accessToken: tokenData.accessToken,
          refreshToken: tokenData.refreshToken,
          tokenExpiresAt: tokenData.expiresOn,
          isActive: true,
          lastSyncedAt: new Date(),
        });
      }

      // Redirect back to emails page with success message
      res.redirect('/emails?connected=true');
    } catch (error) {
      console.error('Error in Microsoft callback:', error);
      res.redirect('/emails?error=auth_failed');
    }
  });

  // Email account routes
  app.get("/api/email-accounts", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const user = req.user as any;
      const userId = user?.id || user?.claims?.sub;
      
      const accounts = await storage.getEmailAccounts(userId);
      // Don't send tokens to frontend
      const safeAccounts = accounts.map(acc => ({
        id: acc.id,
        email: acc.email,
        provider: acc.provider,
        isActive: acc.isActive,
        lastSyncedAt: acc.lastSyncedAt,
      }));
      
      res.json(safeAccounts);
    } catch (error) {
      console.error('Error fetching email accounts:', error);
      res.status(500).json({ message: "Failed to fetch email accounts" });
    }
  });

  app.delete("/api/email-accounts/:id", isAuthenticated, async (req: Request, res: Response) => {
    try {
      await storage.deleteEmailAccount(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error('Error deleting email account:', error);
      res.status(500).json({ message: "Failed to delete email account" });
    }
  });

  // Validate and refresh token if needed (prevents timeout issues)
  app.post("/api/emails/validate-token", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const user = req.user as any;
      const userId = user?.id || user?.claims?.sub;
      
      const account = await storage.getEmailAccountByUserId(userId);
      
      if (!account || !account.isActive) {
        return res.status(404).json({ valid: false, message: "No active email account found" });
      }

      // Check if token is expired or will expire soon (within 5 minutes)
      const expiresAt = account.tokenExpiresAt ? new Date(account.tokenExpiresAt) : null;
      const now = new Date();
      const fiveMinutesFromNow = new Date(now.getTime() + 5 * 60 * 1000);
      
      if (expiresAt && expiresAt < fiveMinutesFromNow) {
        console.log(`🔄 Token expired or expiring soon, refreshing...`);
        try {
          const refreshed = await microsoftAuth.refreshAccessToken(account.refreshToken!);
          await storage.updateEmailAccount(account.id, {
            accessToken: refreshed.accessToken,
            refreshToken: refreshed.refreshToken,
            tokenExpiresAt: refreshed.expiresOn,
          });
          console.log(`✓ Token refreshed successfully`);
          return res.json({ valid: true, refreshed: true });
        } catch (error) {
          console.error(`❌ Token refresh failed:`, error);
          return res.status(401).json({ valid: false, message: "Token refresh failed, please reconnect" });
        }
      }

      res.json({ valid: true, refreshed: false });
    } catch (error: any) {
      console.error('Error validating token:', error);
      res.status(500).json({ valid: false, message: "Failed to validate token" });
    }
  });

  // Sync emails from Microsoft
  app.post("/api/emails/sync", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const user = req.user as any;
      const userId = user?.id || user?.claims?.sub;
      
      console.log(`📧 Starting email sync for user ${userId}...`);
      
      const account = await storage.getEmailAccountByUserId(userId);
      
      if (!account || !account.isActive) {
        console.error(`❌ No active email account found for user ${userId}`);
        return res.status(404).json({ message: "No active email account found" });
      }

      console.log(`✓ Found email account: ${account.email}`);

      // Check if token is expired and refresh if needed
      let accessToken = account.accessToken;
      if (account.tokenExpiresAt && new Date(account.tokenExpiresAt) < new Date()) {
        console.log(`🔄 Token expired, refreshing...`);
        const refreshed = await microsoftAuth.refreshAccessToken(account.refreshToken!);
        accessToken = refreshed.accessToken;
        
        await storage.updateEmailAccount(account.id, {
          accessToken: refreshed.accessToken,
          refreshToken: refreshed.refreshToken,
          tokenExpiresAt: refreshed.expiresOn,
        });
        console.log(`✓ Token refreshed successfully`);
      }

      // Fetch emails from Microsoft
      const folders = ['inbox', 'sent', 'spam'];
      let syncedCount = 0;

      for (const folder of folders) {
        console.log(`📥 Fetching emails from ${folder}...`);
        const messages = await microsoftAuth.getEmails(accessToken!, folder, 50);
        console.log(`✓ Fetched ${messages.length} emails from ${folder}`);
        
        for (const msg of messages) {
          // Check if email already exists
          const existing = await storage.getEmailByMessageId(msg.id);
          
          if (!existing) {
            await storage.createEmail({
              messageId: msg.id,
              from: msg.from?.emailAddress?.address || '',
              fromName: msg.from?.emailAddress?.name || '',
              to: msg.toRecipients?.map((r: any) => r.emailAddress.address) || [],
              cc: msg.ccRecipients?.map((r: any) => r.emailAddress.address) || [],
              subject: msg.subject || '(No Subject)',
              body: '', // We don't store full body on initial sync
              bodyPreview: msg.bodyPreview || '',
              folder,
              isRead: msg.isRead || false,
              hasAttachments: msg.hasAttachments || false,
              receivedAt: new Date(msg.receivedDateTime),
              userId,
            });
            syncedCount++;
          }
        }
      }

      await storage.updateEmailAccount(account.id, {
        lastSyncedAt: new Date(),
      });

      console.log(`✅ Email sync completed: ${syncedCount} new emails synced`);
      res.json({ success: true, syncedCount });
    } catch (error: any) {
      console.error('❌ Error syncing emails:', error);
      console.error('Error details:', {
        name: error?.name,
        message: error?.message,
        stack: error?.stack,
        code: error?.code,
        statusCode: error?.statusCode,
      });
      res.status(500).json({ 
        message: "Failed to sync emails", 
        error: error?.message || 'Unknown error'
      });
    }
  });

  // Get emails from database
  app.get("/api/emails", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const user = req.user as any;
      const userId = user?.id || user?.claims?.sub;
      const { folder } = req.query;
      
      const emails = await storage.getEmails(userId, folder as string);
      res.json(emails);
    } catch (error) {
      console.error('Error fetching emails:', error);
      res.status(500).json({ message: "Failed to fetch emails" });
    }
  });

  // Delete email
  app.delete("/api/emails/:id", isAuthenticated, async (req: Request, res: Response) => {
    try {
      await storage.deleteEmail(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error('Error deleting email:', error);
      res.status(500).json({ message: "Failed to delete email" });
    }
  });

  // Parse email for structured data extraction
  app.post("/api/emails/:id/parse", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const emailId = req.params.id;
      const user = req.user as any;
      const userId = user?.id || user?.claims?.sub;
      
      const email = await storage.getEmail(emailId);
      
      if (!email || email.userId !== userId) {
        return res.status(404).json({ message: "Email not found" });
      }

      // Get full body if not already loaded
      let emailBody = email.body;
      if (!emailBody || emailBody.length === 0) {
        const account = await storage.getEmailAccountByUserId(userId);
        if (account && account.isActive && email.messageId) {
          let accessToken = account.accessToken;
          if (account.tokenExpiresAt && new Date(account.tokenExpiresAt) < new Date()) {
            const refreshed = await microsoftAuth.refreshAccessToken(account.refreshToken!);
            accessToken = refreshed.accessToken;
            await storage.updateEmailAccount(account.id, {
              accessToken: refreshed.accessToken,
              refreshToken: refreshed.refreshToken,
              tokenExpiresAt: refreshed.expiresOn,
            });
          }
          const fullEmail = await microsoftAuth.getEmailById(accessToken!, email.messageId);
          emailBody = fullEmail.body?.content || email.bodyPreview || '';
        } else {
          emailBody = email.bodyPreview || '';
        }
      }

      // Use email parser
      const { parseEmailContent } = await import('./emailParser');
      const parsedData = await parseEmailContent(email.subject, emailBody);

      res.json(parsedData);
    } catch (error: any) {
      console.error('Email parsing error:', error);
      res.status(500).json({ 
        message: "Failed to parse email",
        error: error.message 
      });
    }
  });

  // Analyze email with AI
  app.post("/api/emails/:id/analyze", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const emailId = req.params.id;
      const user = req.user as any;
      const userId = user?.id || user?.claims?.sub;
      
      const email = await storage.getEmail(emailId);
      
      if (!email || email.userId !== userId) {
        return res.status(404).json({ message: "Email not found" });
      }

      // Get full body if not already loaded
      let emailBody = email.body;
      if (!emailBody || emailBody.length === 0) {
        const account = await storage.getEmailAccountByUserId(userId);
        if (account && account.isActive && email.messageId) {
          let accessToken = account.accessToken;
          if (account.tokenExpiresAt && new Date(account.tokenExpiresAt) < new Date()) {
            const refreshed = await microsoftAuth.refreshAccessToken(account.refreshToken!);
            accessToken = refreshed.accessToken;
            await storage.updateEmailAccount(account.id, {
              accessToken: refreshed.accessToken,
              refreshToken: refreshed.refreshToken,
              tokenExpiresAt: refreshed.expiresOn,
            });
          }
          const fullEmail = await microsoftAuth.getEmailById(accessToken!, email.messageId);
          emailBody = fullEmail.body?.content || email.bodyPreview || '';
        } else {
          emailBody = email.bodyPreview || '';
        }
      }

      // Use OpenAI to analyze
      if (!process.env.OPENAI_API_KEY) {
        return res.status(503).json({ message: "AI analysis not configured" });
      }

      const OpenAI = (await import('openai')).default;
      const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

      const systemPrompt = `You are an email analysis assistant. Analyze the email and provide:
1. A brief summary (2-3 sentences)
2. Sentiment (positive, neutral, or negative)
3. Action items (if any)
4. Categories/tags (e.g., finance, support, marketing, sales, urgent)
5. Priority (low, normal, high, urgent)
6. Key points (bullet list)

Respond ONLY with valid JSON in this exact format:
{
  "summary": "Brief summary here",
  "sentiment": "positive|neutral|negative",
  "actionItems": ["action 1", "action 2"],
  "categories": ["category1", "category2"],
  "priority": "low|normal|high|urgent",
  "keyPoints": ["point 1", "point 2"]
}`;

      const userPrompt = `Subject: ${email.subject}
From: ${email.from}
Body: ${emailBody.replace(/<[^>]*>/g, '').substring(0, 3000)}`;

      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        response_format: { type: "json_object" },
        temperature: 0.3,
      });

      const analysis = JSON.parse(completion.choices[0].message.content || '{}');
      
      res.json({
        success: true,
        analysis,
        email: {
          id: email.id,
          subject: email.subject,
          from: email.from,
        }
      });
    } catch (error: any) {
      console.error('Error analyzing email:', error);
      res.status(500).json({ 
        message: "Failed to analyze email",
        error: error?.message || 'Unknown error'
      });
    }
  });

  // Fetch full email body from Microsoft
  app.get("/api/emails/:id/body", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const user = req.user as any;
      const userId = user?.id || user?.claims?.sub;
      const emailId = req.params.id;
      
      // Get the email from database
      const email = await storage.getEmail(emailId);
      
      if (!email || email.userId !== userId) {
        return res.status(404).json({ message: "Email not found" });
      }
      
      // If body already exists, return it
      if (email.body && email.body.length > 0) {
        return res.json({ body: email.body });
      }
      
      // Fetch from Microsoft Graph API
      const account = await storage.getEmailAccountByUserId(userId);
      
      if (!account || !account.isActive || !email.messageId) {
        return res.status(404).json({ message: "Cannot fetch email body" });
      }
      
      // Check token expiry
      let accessToken = account.accessToken;
      if (account.tokenExpiresAt && new Date(account.tokenExpiresAt) < new Date()) {
        const refreshed = await microsoftAuth.refreshAccessToken(account.refreshToken!);
        accessToken = refreshed.accessToken;
        
        await storage.updateEmailAccount(account.id, {
          accessToken: refreshed.accessToken,
          refreshToken: refreshed.refreshToken,
          tokenExpiresAt: refreshed.expiresOn,
        });
      }
      
      // Fetch full email from Microsoft
      const fullEmail = await microsoftAuth.getEmailById(accessToken!, email.messageId);
      const bodyContent = fullEmail.body?.content || email.bodyPreview || '';
      
      // Store the body in database
      await storage.updateEmail(emailId, {
        body: bodyContent,
      });
      
      res.json({ body: bodyContent });
    } catch (error) {
      console.error('Error fetching email body:', error);
      res.status(500).json({ message: "Failed to fetch email body" });
    }
  });

  // Send email via Microsoft
  app.post("/api/emails/send", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const user = req.user as any;
      const userId = user?.id || user?.claims?.sub;
      
      const account = await storage.getEmailAccountByUserId(userId);
      
      if (!account || !account.isActive) {
        return res.status(404).json({ message: "No active email account found" });
      }

      // Check token expiry
      let accessToken = account.accessToken;
      if (account.tokenExpiresAt && new Date(account.tokenExpiresAt) < new Date()) {
        const refreshed = await microsoftAuth.refreshAccessToken(account.refreshToken!);
        accessToken = refreshed.accessToken;
        
        await storage.updateEmailAccount(account.id, {
          accessToken: refreshed.accessToken,
          refreshToken: refreshed.refreshToken,
          tokenExpiresAt: refreshed.expiresOn,
        });
      }

      const emailData = req.body;
      await microsoftAuth.sendEmail(accessToken!, emailData);

      // Store sent email in database
      const now = new Date();
      await storage.createEmail({
        from: account.email,
        fromName: account.email,
        to: emailData.to,
        cc: emailData.cc || [],
        bcc: emailData.bcc || [],
        subject: emailData.subject,
        body: emailData.body,
        bodyPreview: emailData.body.substring(0, 150),
        folder: 'sent',
        isRead: true,
        hasAttachments: false,
        receivedAt: now, // For sent emails, use send time
        sentAt: now,
        userId,
      });

      res.json({ success: true });
    } catch (error) {
      console.error('Error sending email:', error);
      res.status(500).json({ message: "Failed to send email" });
    }
  });

  // Dashboard stats - OPTIMIZED
  app.get("/api/dashboard/stats", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const currentUser = req.user;
      console.log("🔍 Dashboard API called - fetching data for user:", currentUser?.username, "role:", currentUser?.role);
      
      // Only fetch lightweight data and minimal records for activity feed
      const [clients, campaigns, leads, allTasks] = await Promise.all([
        storage.getClients(), // Small dataset, usually < 100 records
        storage.getCampaigns(), // Small dataset
        storage.getLeads(), // Could be large, but we need value calc
        storage.getTasks(), // Could be large
        // storage.getActivityLogs(15), // DISABLED - causing database errors
      ]);
      
      // Filter tasks based on user role
      let tasks = allTasks;
      if (currentUser?.role !== UserRole.ADMIN) {
        // For managers, staff, and clients: only show tasks assigned to them
        tasks = allTasks.filter((t) => t.assignedToId === currentUser?.id);
        console.log(`🔒 Filtered tasks for ${currentUser?.role}: ${tasks.length} assigned to user (out of ${allTasks.length} total)`);
      }
      
      // Create empty activity logs to prevent errors
      const activityLogs: any[] = [];

      console.log("📊 Dashboard Stats (Optimized):");
      console.log("  - Total Clients:", clients.length);
      console.log("  - Total Campaigns:", campaigns.length);
      console.log("  - Total Leads:", leads.length);
      console.log("  - Total Tasks (filtered):", tasks.length);

      // Quick counts and aggregates
      const activeCampaigns = campaigns.filter((c) => c.status === "active").length;
      const pipelineValue = leads.reduce((sum, lead) => sum + (lead.value || 0), 0);
      
      // Skip invoices for now - not critical for dashboard load
      const monthlyRevenue = 0; // Will be replaced by Stripe data if available

      // Calculate percentage changes (compare with last month)
      const now = new Date();
      const firstDayOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const firstDayOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const lastDayOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

      // Last month's data
      const clientsLastMonth = clients.filter(c => {
        const createdAt = new Date(c.createdAt);
        return createdAt < firstDayOfThisMonth;
      }).length;

      const campaignsLastMonth = campaigns.filter(c => {
        const createdAt = new Date(c.createdAt);
        return createdAt >= firstDayOfLastMonth && createdAt <= lastDayOfLastMonth && c.status === "active";
      }).length;

      const leadsLastMonth = leads.filter(l => {
        const createdAt = new Date(l.createdAt);
        return createdAt < firstDayOfThisMonth;
      });
      const pipelineValueLastMonth = leadsLastMonth.reduce((sum, lead) => sum + (lead.value || 0), 0);

      // Calculate percentage changes
      const calculateChange = (current: number, previous: number): string => {
        if (previous === 0) return current > 0 ? "+100" : "0";
        const change = ((current - previous) / previous) * 100;
        const rounded = Math.round(change);
        return rounded > 0 ? `+${rounded}` : `${rounded}`;
      };

      const clientsChange = calculateChange(clients.length, clientsLastMonth);
      const campaignsChange = calculateChange(activeCampaigns, campaignsLastMonth);
      const pipelineChange = calculateChange(pipelineValue, pipelineValueLastMonth);
      
      // For revenue, we'll use 0 for now since it's not implemented
      const revenueChange = "0";

      // Task metrics
      const totalTasks = tasks.length;
      const completedTasks = tasks.filter((t) => t.status === "completed").length;
      const pendingTasks = tasks.filter((t) => t.status === "todo").length;
      const inProgressTasks = tasks.filter((t) => t.status === "in_progress").length;
      const reviewTasks = tasks.filter((t) => t.status === "review").length;
      const completionPercentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

      // Today's task metrics
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      const tasksToday = tasks.filter((t) => {
        if (!t.dueDate) return false;
        const dueDate = new Date(t.dueDate);
        // Set to start of day for comparison
        dueDate.setHours(0, 0, 0, 0);
        return dueDate.getTime() === today.getTime();
      });

      const totalTasksToday = tasksToday.length;
      const completedTasksToday = tasksToday.filter((t) => t.status === "completed").length;
      const todoTasksToday = tasksToday.filter((t) => t.status === "todo").length;
      const inProgressTasksToday = tasksToday.filter((t) => t.status === "in_progress").length;
      const reviewTasksToday = tasksToday.filter((t) => t.status === "review").length;

      // Recent Activity Feed - OPTIMIZED: Only use most recent data to avoid slow sorting
      const recentActivity: any[] = [];

      // Quick recent items only (first 3 of each)

      // Simplified activity feed - only most recent items (reduced from sorting everything)
      clients.slice(0, 2).forEach(client => {
          recentActivity.push({
            type: 'success',
          title: `Client: ${client.name}`,
            time: formatActivityTime(client.createdAt),
            timestamp: client.createdAt,
          });
        });

      campaigns.slice(0, 2).forEach(campaign => {
          recentActivity.push({
            type: 'info',
          title: `Campaign: ${campaign.name}`,
          time: formatActivityTime(campaign.createdAt),
          timestamp: campaign.createdAt,
          });
        });

      tasks.filter(t => t.status === 'completed').slice(0, 2).forEach(task => {
          recentActivity.push({
            type: 'success',
            title: `Task completed: ${task.title}`,
          time: formatActivityTime(task.updatedAt),
          timestamp: task.updatedAt,
          });
        });

      // Activity logs (logins, payments, etc.)
      activityLogs.forEach(log => {
        const typeMap: any = {
          'login': 'success',
          'logout': 'info',
          'payment': 'success',
          'client_added': 'success',
          'task_completed': 'success',
        };
          recentActivity.push({
          type: typeMap[log.activityType] || 'info',
          title: log.description,
          time: formatActivityTime(log.createdAt),
          timestamp: log.createdAt,
          });
        });

      // Sort by timestamp (most recent first) and limit to 10
      const sortedActivity = recentActivity
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        .slice(0, 10);

      // Upcoming Deadlines
      const upcomingDeadlines: any[] = [];
      
      // Tasks with due dates
      tasks
        .filter(t => t.dueDate && t.status !== 'completed')
        .forEach(task => {
          const daysUntil = Math.floor((new Date(task.dueDate!).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
          upcomingDeadlines.push({
            title: task.title,
            date: formatDeadlineDate(task.dueDate),
            urgent: daysUntil <= 3,
            timestamp: task.dueDate,
          });
        });

      // Sort deadlines by date and limit to 5
      const sortedDeadlines = upcomingDeadlines
        .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
        .slice(0, 5);

      console.log("🔍 TOTAL CLIENTS DEBUG:");
      console.log("   clients array length:", clients.length);
      console.log("   clients array:", clients.map(c => ({ id: c.id, name: c.name })));

      const responseData = {
        totalClients: clients.length,
        activeCampaigns,
        pipelineValue,
        monthlyRevenue,
        // Percentage changes (live calculated)
        clientsChange,
        campaignsChange,
        pipelineChange,
        revenueChange,
        recentActivity: sortedActivity,
        upcomingDeadlines: sortedDeadlines,
        taskMetrics: {
          total: totalTasks,
          completed: completedTasks,
          pending: pendingTasks,
          inProgress: inProgressTasks,
          review: reviewTasks,
          completionPercentage,
        },
        // Today's task metrics
        totalTasksToday,
        completedTasksToday,
        todoTasksToday,
        inProgressTasksToday,
        reviewTasksToday,
      };

      console.log("✅ Sending dashboard response with:", {
        totalClients: responseData.totalClients,
        activeCampaigns: responseData.activeCampaigns,
        pipelineValue: responseData.pipelineValue,
      });

      res.json(responseData);
    } catch (error: any) {
      console.error("❌ Dashboard API error:", error);
      console.error("Error details:", error.message, error.stack);
      res.status(500).json({ message: "Failed to fetch dashboard stats", error: error.message });
    }
  });

  // Helper functions for formatting
  function formatActivityTime(date: Date | null | undefined): string {
    if (!date) return 'Just now';
    const now = new Date();
    const activityDate = new Date(date);
    const diffMs = now.getTime() - activityDate.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} minute${diffMins !== 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
    return activityDate.toLocaleDateString();
  }

  function formatDeadlineDate(date: Date | null | undefined): string {
    if (!date) return '';
    const deadline = new Date(date);
    const now = new Date();
    const diffDays = Math.floor((deadline.getTime() - now.getTime()) / 86400000);

    if (diffDays < 0) return `Overdue by ${Math.abs(diffDays)} day${Math.abs(diffDays) !== 1 ? 's' : ''}`;
    if (diffDays === 0) return 'Due today';
    if (diffDays === 1) return 'Due tomorrow';
    if (diffDays < 7) return `Due in ${diffDays} days`;
    return `Due ${deadline.toLocaleDateString()}`;
  }

  // Stripe subscription stats
  app.get("/api/stripe/subscriptions", isAuthenticated, requireRole(UserRole.ADMIN, UserRole.STAFF), async (_req: Request, res: Response) => {
    try {
      if (!stripe) {
        return res.status(503).json({ message: "Stripe is not configured" });
      }

      // Fetch all subscriptions from Stripe (without expanding to avoid PII leaks)
      const subscriptions = await stripe.subscriptions.list({
        limit: 100,
      });

      // Calculate metrics
      const activeSubscriptions = subscriptions.data.filter(sub => sub.status === 'active');
      
      // Calculate MRR properly: sum all items, account for quantity and interval
      const mrr = activeSubscriptions.reduce((sum, sub) => {
        const subscriptionMrr = sub.items.data.reduce((itemSum, item) => {
          const unitAmount = (item.price.unit_amount || 0) / 100;
          const quantity = item.quantity || 1;
          const interval = item.price.recurring?.interval;
          
          // Convert to monthly
          let monthlyAmount = unitAmount * quantity;
          if (interval === 'year') {
            monthlyAmount = monthlyAmount / 12;
          } else if (interval !== 'month') {
            monthlyAmount = 0; // Ignore non-monthly/yearly intervals
          }
          
          return itemSum + monthlyAmount;
        }, 0);
        
        return sum + subscriptionMrr;
      }, 0);

      res.json({
        totalSubscriptions: subscriptions.data.length,
        activeSubscriptions: activeSubscriptions.length,
        mrr,
        subscriptions: subscriptions.data.map(sub => {
          const firstItem = sub.items.data[0];
          return {
            id: sub.id,
            customerId: typeof sub.customer === 'string' ? sub.customer : sub.customer?.id || '',
            status: sub.status,
            amount: (firstItem?.price?.unit_amount || 0) / 100,
            interval: firstItem?.price?.recurring?.interval,
            currentPeriodEnd: (sub as any).current_period_end,
            cancelAtPeriodEnd: sub.cancel_at_period_end,
          };
        }),
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Failed to fetch Stripe subscriptions" });
    }
  });

  // Get subscription for a specific client
  app.get("/api/stripe/client/:clientId/subscription", isAuthenticated, requirePermission("canManageInvoices"), async (req: Request, res: Response) => {
    try {
      if (!stripe) {
        return res.status(503).json({ message: "Stripe is not configured" });
      }

      const client = await storage.getClient(req.params.clientId);
      if (!client) {
        return res.status(404).json({ message: "Client not found" });
      }

      if (!client.stripeSubscriptionId) {
        return res.json({ subscription: null });
      }

      const subscription = await stripe.subscriptions.retrieve(client.stripeSubscriptionId, {
        expand: ['customer', 'latest_invoice'],
      });

      res.json({
        subscription: {
          id: subscription.id,
          status: subscription.status,
          amount: (subscription.items.data[0]?.price?.unit_amount || 0) / 100,
          interval: subscription.items.data[0]?.price?.recurring?.interval,
          currentPeriodEnd: (subscription as any).current_period_end,
          cancelAtPeriodEnd: subscription.cancel_at_period_end,
          customer: subscription.customer,
        },
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Failed to fetch client subscription" });
    }
  });

  // Client routes
  app.get("/api/clients", isAuthenticated, requirePermission("canManageClients"), async (_req: Request, res: Response) => {
    try {
      const clients = await storage.getClients();
      res.json(clients);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Failed to fetch clients" });
    }
  });

  app.get("/api/clients/:id", isAuthenticated, requirePermission("canManageClients"), async (req: Request, res: Response) => {
    try {
      const client = await storage.getClient(req.params.id);
      if (!client) {
        return res.status(404).json({ message: "Client not found" });
      }
      res.json(client);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Failed to fetch client" });
    }
  });

  app.post("/api/clients", isAuthenticated, requirePermission("canManageClients"), async (req: Request, res: Response) => {
    try {
      console.log("Received client data:", JSON.stringify(req.body, null, 2));
      const validatedData = insertClientSchema.parse(req.body);
      console.log("Validated client data:", JSON.stringify(validatedData, null, 2));
      const client = await storage.createClient(validatedData);
      
      // Notify all admins and managers about new client
      const users = await storage.getUsers();
      const adminsAndManagers = users.filter(u => 
        u.role === UserRole.ADMIN || u.role === UserRole.MANAGER
      );
      
      const { sendPushToUser } = await import('./push.js');
      
      for (const user of adminsAndManagers) {
        // In-app notification
        await storage.createNotification({
          userId: user.id,
          type: 'success',
          title: '🎉 New Client Added',
          message: `${client.name} has been added to the system`,
          category: 'general',
          actionUrl: `/clients?clientId=${client.id}`,
          isRead: false,
        });
        
        // Push notification
        await sendPushToUser(user.id, {
          title: '🎉 New Client Added',
          body: `${client.name} has been added to the system`,
          url: '/clients',
        }).catch(err => console.error('Failed to send push notification:', err));
      }
      console.log(`📬 Notified ${adminsAndManagers.length} admins/managers about new client`);
      
      res.status(201).json(client);
    } catch (error) {
      console.error("Error creating client:", error);
      handleValidationError(error, res);
    }
  });

  app.patch("/api/clients/:id", isAuthenticated, requirePermission("canManageClients"), async (req: Request, res: Response) => {
    try {
      const validatedData = insertClientSchema.partial().strip().parse(req.body);
      const client = await storage.updateClient(req.params.id, validatedData);
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

  app.delete("/api/clients/:id", isAuthenticated, requirePermission("canManageClients"), async (req: Request, res: Response) => {
    try {
      await storage.deleteClient(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Failed to delete client" });
    }
  });

  // Campaign routes
  app.get("/api/campaigns", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const currentUser = req.user;
      const allCampaigns = await storage.getCampaigns();
      
      // Filter campaigns based on user role
      let campaigns = allCampaigns;
      
      if (currentUser?.role === UserRole.CLIENT) {
        // For clients: only show campaigns assigned to their client record
        const clientId = currentUser?.clientId;
        if (clientId) {
          campaigns = allCampaigns.filter((c) => c.clientId === clientId);
          console.log(`🔒 Campaigns filtered for client: ${campaigns.length} for clientId ${clientId} (out of ${allCampaigns.length} total)`);
        } else {
          campaigns = []; // No clientId means no campaigns
          console.log(`🔒 Client has no clientId, showing 0 campaigns`);
        }
      } else if (currentUser?.role !== UserRole.ADMIN) {
        // For managers and staff: only show campaigns they created
        campaigns = allCampaigns.filter((c) => c.createdBy === currentUser?.id);
        console.log(`🔒 Campaigns filtered for ${currentUser?.role}: ${campaigns.length} created by user (out of ${allCampaigns.length} total)`);
      }
      
      res.json(campaigns);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Failed to fetch campaigns" });
    }
  });

  app.post("/api/campaigns", isAuthenticated, requirePermission("canManageCampaigns"), async (req: Request, res: Response) => {
    try {
      const currentUser = req.user;
      const validatedData = insertCampaignSchema.parse(req.body);
      
      // Automatically set createdBy to current user
      const campaignData = {
        ...validatedData,
        createdBy: currentUser?.id,
      };
      
      const campaign = await storage.createCampaign(campaignData);
      console.log(`📣 Campaign created by ${currentUser?.username} (${currentUser?.role}):`, campaign.name);
      
      // Notify client users if campaign is assigned to a client
      if (campaign.clientId) {
        try {
          const clientUsers = await storage.getUsersByClientId(campaign.clientId);
          const { sendPushToUser } = await import('./push.js');
          
          for (const clientUser of clientUsers) {
            // In-app notification
            await storage.createNotification({
              userId: clientUser.id,
              type: 'success',
              title: '🎯 New Campaign Created',
              message: `A new campaign "${campaign.name}" has been created for you`,
              category: 'general',
              actionUrl: `/client-campaigns?campaignId=${campaign.id}`,
              isRead: false,
            });
            
            // Push notification
            await sendPushToUser(clientUser.id, {
              title: '🎯 New Campaign Created',
              body: `"${campaign.name}" has been created for you`,
              url: '/client-campaigns',
            }).catch(err => console.error('Failed to send push notification:', err));
          }
          console.log(`📬 Notified ${clientUsers.length} client user(s) about new campaign`);
        } catch (notifError) {
          console.error('Failed to notify client about campaign:', notifError);
          // Don't fail campaign creation if notification fails
        }
      }
      
      res.status(201).json(campaign);
    } catch (error) {
      handleValidationError(error, res);
    }
  });

  app.patch("/api/campaigns/:id", isAuthenticated, requirePermission("canManageCampaigns"), async (req: Request, res: Response) => {
    try {
      const validatedData = insertCampaignSchema.partial().strip().parse(req.body);
      const campaign = await storage.updateCampaign(req.params.id, validatedData);
      res.json(campaign);
    } catch (error: any) {
      if (error instanceof ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      if (error.message?.includes("not found")) {
        return res.status(404).json({ message: error.message });
      }
      console.error(error);
      res.status(500).json({ message: "Failed to update campaign" });
    }
  });

  app.delete("/api/campaigns/:id", isAuthenticated, requirePermission("canManageCampaigns"), async (req: Request, res: Response) => {
    try {
      await storage.deleteCampaign(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Failed to delete campaign" });
    }
  });

  // Task Spaces routes
  app.get("/api/task-spaces", isAuthenticated, requireRole(UserRole.ADMIN, UserRole.MANAGER, UserRole.STAFF), async (_req: Request, res: Response) => {
    try {
      const spaces = await storage.getTaskSpaces();
      res.json(spaces);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Failed to fetch task spaces" });
    }
  });

  app.post("/api/task-spaces", isAuthenticated, requireRole(UserRole.ADMIN, UserRole.MANAGER, UserRole.STAFF), async (req: Request, res: Response) => {
    try {
      const user = req.user as any;
      const userId = user?.id || user?.claims?.sub;
      
      // Ensure userId is a valid integer
      const parsedUserId = typeof userId === 'number' ? userId : parseInt(userId);
      if (isNaN(parsedUserId)) {
        return res.status(400).json({ message: "Invalid user ID" });
      }
      
      const spaceData = { ...req.body, createdBy: parsedUserId };
      console.log("Creating task space:", spaceData);
      const space = await storage.createTaskSpace(spaceData);
      res.status(201).json(space);
    } catch (error) {
      console.error("Task space creation error:", error);
      res.status(500).json({ message: "Failed to create task space" });
    }
  });

  app.patch("/api/task-spaces/:id", isAuthenticated, requireRole(UserRole.ADMIN, UserRole.MANAGER, UserRole.STAFF), async (req: Request, res: Response) => {
    try {
      const space = await storage.updateTaskSpace(req.params.id, req.body);
      res.json(space);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Failed to update task space" });
    }
  });

  app.delete("/api/task-spaces/:id", isAuthenticated, requireRole(UserRole.ADMIN, UserRole.MANAGER, UserRole.STAFF), async (req: Request, res: Response) => {
    try {
      await storage.deleteTaskSpace(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Failed to delete task space" });
    }
  });

  // Get tasks by space
  app.get("/api/task-spaces/:id/tasks", isAuthenticated, requireRole(UserRole.ADMIN, UserRole.MANAGER, UserRole.STAFF), async (req: Request, res: Response) => {
    try {
      const tasks = await storage.getTasksBySpace(req.params.id);
      res.json(tasks);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Failed to fetch tasks for space" });
    }
  });

  // User View Preferences routes
  app.get("/api/user-preferences", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const user = req.user as any;
      const userId = user?.id || user?.claims?.sub;
      const preferences = await storage.getUserViewPreferences(userId);
      res.json(preferences || null);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Failed to fetch user preferences" });
    }
  });

  app.put("/api/user-preferences", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const user = req.user as any;
      const userId = user?.id || user?.claims?.sub;
      const preferences = await storage.upsertUserViewPreferences(userId, req.body);
      res.json(preferences);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Failed to save user preferences" });
    }
  });

  // User notification preferences routes
  app.get("/api/user/notification-preferences", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: "User not authenticated" });
      }

      const preferences = await storage.getUserNotificationPreferences(userId);
      
      // Return default preferences if none exist
      if (!preferences) {
        return res.json({
          emailNotifications: true,
          taskUpdates: true,
          clientMessages: true,
          dueDateReminders: true,
          projectUpdates: true,
          systemAlerts: true,
        });
      }

      res.json(preferences);
    } catch (error) {
      console.error("Error fetching notification preferences:", error);
      res.status(500).json({ error: "Failed to fetch notification preferences" });
    }
  });

  app.put("/api/user/notification-preferences", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: "User not authenticated" });
      }

      const {
        emailNotifications,
        taskUpdates,
        clientMessages,
        dueDateReminders,
        projectUpdates,
        systemAlerts,
      } = req.body;

      const preferences = await storage.upsertUserNotificationPreferences(userId, {
        emailNotifications,
        taskUpdates,
        clientMessages,
        dueDateReminders,
        projectUpdates,
        systemAlerts,
      });

      res.json(preferences);
    } catch (error) {
      console.error("Error updating notification preferences:", error);
      res.status(500).json({ error: "Failed to update notification preferences" });
    }
  });

  // Task routes (admin, manager, and staff)
  app.get("/api/tasks", isAuthenticated, requireRole(UserRole.ADMIN, UserRole.MANAGER, UserRole.STAFF), async (req: Request, res: Response) => {
    try {
      const currentUser = req.user;
      const allTasks = await storage.getTasks();
      
      // Filter tasks based on user role
      let tasks = allTasks;
      if (currentUser?.role === UserRole.STAFF) {
        // Staff: only tasks assigned to them
        tasks = allTasks.filter((t) => t.assignedToId === currentUser?.id);
        console.log(`🔒 Tasks filtered for STAFF: ${tasks.length} assigned to user (out of ${allTasks.length} total)`);
      } else if (currentUser?.role === UserRole.MANAGER) {
        // Managers: see all team tasks
        console.log(`🔓 Manager access: showing all ${allTasks.length} tasks`);
      }
      
      res.json(tasks);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Failed to fetch tasks" });
    }
  });

  app.post("/api/tasks", isAuthenticated, requireRole(UserRole.ADMIN, UserRole.MANAGER, UserRole.STAFF), async (req: Request, res: Response) => {
    try {
      console.log("📥 Backend received task data:", JSON.stringify(req.body, null, 2));
      const validatedData = insertTaskSchema.parse(req.body);
      console.log("✅ Validation passed, creating task:", validatedData);
      const task = await storage.createTask(validatedData);
      
      const { sendPushToUser } = await import('./push.js');
      
      // Enhanced task creation notifications
      const user = req.user as any;
      const creatorName = user?.firstName || user?.username || 'Someone';
      
      // Notify assignee if task is assigned to someone
      if (task.assignedToId) {
        // In-app notification
        await storage.createNotification({
          userId: task.assignedToId,
          type: 'info',
          title: '📋 New Task Assigned',
          message: `${creatorName} assigned you: "${task.title}"`,
          category: 'task',
          actionUrl: `/tasks?taskId=${task.id}`,
          isRead: false,
        });
        
        // Push notification
        await sendPushToUser(task.assignedToId, {
          title: '📋 New Task Assigned',
          body: `${creatorName} assigned you: "${task.title}"`,
          url: `/tasks?taskId=${task.id}`,
        }).catch(err => console.error('Failed to send push notification:', err));
      }
      
      // Notify all team members (admin, manager, staff) about new task
      try {
        const users = await storage.getUsers();
        const teamMembers = users.filter(u => 
          u.role === 'admin' || u.role === 'manager' || u.role === 'staff'
        );
        
        for (const teamMember of teamMembers) {
          // Skip if team member is the creator or assignee
          if (teamMember.id === user?.id || teamMember.id === task.assignedToId) {
            continue;
          }
          
          await storage.createNotification({
            userId: teamMember.id,
            type: 'info',
            title: '📋 New Task Created',
            message: `${creatorName} created: "${task.title}"`,
            category: 'task',
            actionUrl: `/tasks?taskId=${task.id}`,
            isRead: false,
          });
          
          await sendPushToUser(teamMember.id, {
            title: '📋 New Task Created',
            body: `${creatorName} created: "${task.title}"`,
            url: `/tasks?taskId=${task.id}`,
          }).catch(err => console.error('Failed to send push notification:', err));
        }
        
        console.log(`📬 Notified ${teamMembers.length} team member(s) about new task`);
      } catch (teamNotifError) {
        console.error('Failed to notify team about task:', teamNotifError);
      }
      
      // Notify client users if task is related to their client
      if (task.clientId) {
        try {
          const clientUsers = await storage.getUsersByClientId(task.clientId);
          
          for (const clientUser of clientUsers) {
            // Skip if client user is the assignee
            if (clientUser.id === task.assignedToId) {
              continue;
            }
            
            // In-app notification
            await storage.createNotification({
              userId: clientUser.id,
              type: 'success',
              title: '📋 New Task Created',
              message: `New task "${task.title}" has been created for your project`,
              category: 'task',
              actionUrl: '/client-dashboard',
              isRead: false,
            });
            
            // Push notification
            await sendPushToUser(clientUser.id, {
              title: '📋 New Task Created',
              body: `New task "${task.title}" has been created for your project`,
              url: '/client-dashboard',
            }).catch(err => console.error('Failed to send push notification:', err));
          }
          console.log(`📬 Notified ${clientUsers.length} client user(s) about new task`);
        } catch (notifError) {
          console.error('Failed to notify client about task:', notifError);
          // Don't fail task creation if notification fails
        }
      }
      
      res.status(201).json(task);
    } catch (error) {
      console.error("❌ Task creation error:", error);
      handleValidationError(error, res);
    }
  });

  // AI-powered task parsing from natural language
  app.post("/api/tasks/parse-ai", isAuthenticated, requireRole(UserRole.ADMIN, UserRole.MANAGER, UserRole.STAFF), async (req: Request, res: Response) => {
    try {
      const { input } = req.body;
      
      if (!input || typeof input !== 'string') {
        return res.status(400).json({ message: "Input text is required" });
      }

      // Check if OpenAI API key is configured
      if (!process.env.OPENAI_API_KEY) {
        return res.status(503).json({ 
          message: "AI assistant not configured. Please add OPENAI_API_KEY to environment variables." 
        });
      }

      const OpenAI = (await import('openai')).default;
      const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

      // Get clients and users for context
      const [clients, users] = await Promise.all([
        storage.getClients(),
        storage.getUsers(),
      ]);

      const systemPrompt = `You are a task parsing assistant. Extract task details from natural language.

Available clients: ${clients.map(c => `${c.name} (ID: ${c.id})`).join(', ')}
Available users: ${users.map(u => `${u.username} (ID: ${u.id})`).join(', ')}

Return JSON with:
- title: string (required)
- description: string (optional)
- priority: "low" | "normal" | "high" | "urgent" (default: "normal")
- status: "todo" | "in_progress" | "review" | "completed" (default: "todo")
- dueDate: ISO date string (optional, parse relative dates like "tomorrow", "next Friday", etc.)
- clientId: string (optional, match from available clients)
- assignedToId: string (optional, match from available users)

Examples:
"Call Bobby tomorrow about website" -> {"title":"Call Bobby about website","dueDate":"2025-10-16","priority":"normal"}
"High priority: Fix login bug ASAP" -> {"title":"Fix login bug","priority":"urgent","status":"todo"}
`;

      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: input }
        ],
        response_format: { type: "json_object" },
        temperature: 0.3,
      });

      const parsed = JSON.parse(completion.choices[0].message.content || '{}');
      
      // Transform the parsed data - convert date string to Date object if present
      const transformedData = {
        ...parsed,
        dueDate: parsed.dueDate ? new Date(parsed.dueDate) : undefined,
        assignedToId: parsed.assignedToId ? parseInt(parsed.assignedToId) : undefined,
      };
      
      // Validate the transformed data
      const taskData = insertTaskSchema.parse(transformedData);
      
      res.json({
        success: true,
        taskData,
        originalInput: input,
      });

    } catch (error: any) {
      console.error("AI parsing error:", error);
      if (error.message?.includes('API key')) {
        return res.status(503).json({ message: "OpenAI API configuration error" });
      }
      res.status(500).json({ 
        message: "Failed to parse task with AI", 
        error: error.message 
      });
    }
  });

  app.patch("/api/tasks/:id", isAuthenticated, requireRole(UserRole.ADMIN, UserRole.MANAGER, UserRole.STAFF), async (req: Request, res: Response) => {
    try {
      const validatedData = insertTaskSchema.partial().strip().parse(req.body);
      
      // Check if task is being marked as completed and is recurring
      const existingTask = await storage.getTask(req.params.id);
      if (!existingTask) {
        return res.status(404).json({ message: "Task not found" });
      }

      // Automatically set completedAt when status changes to completed
      if (validatedData.status === "completed" && existingTask.status !== "completed") {
        validatedData.completedAt = new Date();
      } else if (validatedData.status && validatedData.status !== "completed") {
        // Clear completedAt if status is changed away from completed
        validatedData.completedAt = null;
      }

      const task = await storage.updateTask(req.params.id, validatedData);
      
      // Enhanced task update notifications
      const currentUser = req.user as any;
      const currentUserId = currentUser?.id || currentUser?.claims?.sub;
      const { sendPushToUser } = await import('./push.js');
      
      try {
        // Notify about status changes
        if (validatedData.status && validatedData.status !== existingTask.status) {
          const statusMessages = {
            'pending': '📋 Task Status: Pending',
            'in_progress': '🔄 Task Status: In Progress', 
            'completed': '✅ Task Completed!',
            'cancelled': '❌ Task Cancelled',
            'on_hold': '⏸️ Task On Hold'
          };
          
          const statusMessage = statusMessages[validatedData.status as keyof typeof statusMessages] || '📋 Task Status Updated';
          
          // Notify assignee if different from updater
          if (task.assignedToId && task.assignedToId !== currentUserId) {
            await storage.createNotification({
              userId: task.assignedToId,
              type: validatedData.status === 'completed' ? 'success' : 'info',
              title: statusMessage,
              message: `"${task.title}" status changed to ${validatedData.status}`,
              category: 'task',
              actionUrl: `/tasks?taskId=${task.id}`,
              isRead: false,
            });
            
            await sendPushToUser(task.assignedToId, {
              title: statusMessage,
              body: `"${task.title}" status changed to ${validatedData.status}`,
              url: `/tasks?taskId=${task.id}`,
            }).catch(err => console.error('Failed to send push notification:', err));
          }
          
          // Notify creator if different from updater and assignee
          if (task.createdBy && task.createdBy !== currentUserId && task.createdBy !== task.assignedToId) {
            await storage.createNotification({
              userId: task.createdBy,
              type: validatedData.status === 'completed' ? 'success' : 'info',
              title: statusMessage,
              message: `"${task.title}" status changed to ${validatedData.status}`,
              category: 'task',
              actionUrl: `/tasks?taskId=${task.id}`,
              isRead: false,
            });
            
            await sendPushToUser(task.createdBy, {
              title: statusMessage,
              body: `"${task.title}" status changed to ${validatedData.status}`,
              url: `/tasks?taskId=${task.id}`,
            }).catch(err => console.error('Failed to send push notification:', err));
          }
        }
        
        // Notify about priority changes
        if (validatedData.priority && validatedData.priority !== existingTask.priority) {
          const priorityMessages = {
            'low': '🟢 Priority: Low',
            'medium': '🟡 Priority: Medium',
            'high': '🟠 Priority: High',
            'urgent': '🔴 Priority: Urgent'
          };
          
          const priorityMessage = priorityMessages[validatedData.priority as keyof typeof priorityMessages] || '📋 Priority Updated';
          
          if (task.assignedToId && task.assignedToId !== currentUserId) {
            await storage.createNotification({
              userId: task.assignedToId,
              type: validatedData.priority === 'urgent' ? 'error' : 'warning',
              title: priorityMessage,
              message: `"${task.title}" priority changed to ${validatedData.priority}`,
              category: 'task',
              actionUrl: `/tasks?taskId=${task.id}`,
              isRead: false,
            });
            
            await sendPushToUser(task.assignedToId, {
              title: priorityMessage,
              body: `"${task.title}" priority changed to ${validatedData.priority}`,
              url: `/tasks?taskId=${task.id}`,
            }).catch(err => console.error('Failed to send push notification:', err));
          }
        }
        
        // Notify about due date changes
        if (validatedData.dueDate && validatedData.dueDate !== existingTask.dueDate) {
          const newDueDate = new Date(validatedData.dueDate).toLocaleDateString();
          
          if (task.assignedToId && task.assignedToId !== currentUserId) {
            await storage.createNotification({
              userId: task.assignedToId,
              type: 'info',
              title: '📅 Due Date Updated',
              message: `"${task.title}" due date changed to ${newDueDate}`,
              category: 'deadline',
              actionUrl: `/tasks?taskId=${task.id}`,
              isRead: false,
            });
            
            await sendPushToUser(task.assignedToId, {
              title: '📅 Due Date Updated',
              body: `"${task.title}" due date changed to ${newDueDate}`,
              url: `/tasks?taskId=${task.id}`,
            }).catch(err => console.error('Failed to send push notification:', err));
          }
        }
        
        // Notify about assignment changes
        if (validatedData.assignedToId && validatedData.assignedToId !== existingTask.assignedToId) {
          const users = await storage.getUsers();
          const newAssignee = users.find(u => u.id === validatedData.assignedToId);
          const oldAssignee = users.find(u => u.id === existingTask.assignedToId);
          
          // Notify new assignee
          if (newAssignee && newAssignee.id !== currentUserId) {
            await storage.createNotification({
              userId: newAssignee.id,
              type: 'info',
              title: '📋 Task Assigned to You',
              message: `"${task.title}" has been assigned to you`,
              category: 'task',
              actionUrl: `/tasks?taskId=${task.id}`,
              isRead: false,
            });
            
            await sendPushToUser(newAssignee.id, {
              title: '📋 New Task Assigned',
              body: `"${task.title}" has been assigned to you`,
              url: `/tasks?taskId=${task.id}`,
            }).catch(err => console.error('Failed to send push notification:', err));
          }
          
          // Notify old assignee if different from new assignee and updater
          if (oldAssignee && oldAssignee.id !== validatedData.assignedToId && oldAssignee.id !== currentUserId) {
            await storage.createNotification({
              userId: oldAssignee.id,
              type: 'info',
              title: '📋 Task Reassigned',
              message: `"${task.title}" has been reassigned from you`,
              category: 'task',
              actionUrl: `/tasks?taskId=${task.id}`,
              isRead: false,
            });
            
            await sendPushToUser(oldAssignee.id, {
              title: '📋 Task Reassigned',
              body: `"${task.title}" has been reassigned from you`,
              url: `/tasks?taskId=${task.id}`,
            }).catch(err => console.error('Failed to send push notification:', err));
          }
        }
        
        console.log(`✅ Task update notifications sent for task: ${task.title}`);
      } catch (notifError) {
        console.error('Failed to send task update notifications:', notifError);
        // Don't fail the task update if notification fails
      }

      // If task is recurring and was just completed, create next instance
      if (
        existingTask.isRecurring && 
        validatedData.status === "completed" && 
        existingTask.status !== "completed"
      ) {
        console.log("🔄 Creating recurring task instance for:", existingTask.title);
        
        // Calculate next due date based on recurrence pattern
        let nextDueDate: Date | null = null;
        if (existingTask.dueDate && existingTask.recurringPattern && existingTask.recurringInterval) {
          // Determine base date: use completion date or original due date
          const now = new Date();
          const baseDate = existingTask.scheduleFrom === "completion_date" ? now : new Date(existingTask.dueDate);
          nextDueDate = new Date(baseDate);
          
          console.log(`📅 Calculating next due date from: ${existingTask.scheduleFrom || 'due_date'} (${baseDate.toDateString()})`);
          
          switch (existingTask.recurringPattern) {
            case "daily":
              nextDueDate.setDate(baseDate.getDate() + existingTask.recurringInterval);
              break;
            case "weekly":
              nextDueDate.setDate(baseDate.getDate() + (existingTask.recurringInterval * 7));
              break;
            case "monthly":
              nextDueDate.setMonth(baseDate.getMonth() + existingTask.recurringInterval);
              break;
            case "yearly":
              nextDueDate.setFullYear(baseDate.getFullYear() + existingTask.recurringInterval);
              break;
          }

          console.log(`🎯 Next due date calculated: ${nextDueDate.toDateString()}`);

          // Check if we've exceeded the recurring end date
          if (existingTask.recurringEndDate && nextDueDate > new Date(existingTask.recurringEndDate)) {
            console.log("⏸️ Recurring task has reached end date, not creating new instance");
          } else {
            // Create new task instance
            const newTask = await storage.createTask({
              title: existingTask.title,
              description: existingTask.description,
              status: "todo",
              priority: existingTask.priority,
              dueDate: nextDueDate,
              campaignId: existingTask.campaignId,
              clientId: existingTask.clientId,
              assignedToId: existingTask.assignedToId,
              spaceId: existingTask.spaceId,
              isRecurring: true,
              recurringPattern: existingTask.recurringPattern,
              recurringInterval: existingTask.recurringInterval,
              recurringEndDate: existingTask.recurringEndDate,
              scheduleFrom: existingTask.scheduleFrom,
            });
            console.log("✅ New recurring task instance created for:", nextDueDate.toDateString());
            console.log("   Task ID:", newTask.id);

            // Create notification for the new recurring task
            if (existingTask.assignedToId) {
              await storage.createNotification({
                userId: existingTask.assignedToId,
                type: 'info',
                title: '🔄 Recurring Task Created',
                message: `New instance of "${existingTask.title}" is due on ${nextDueDate.toLocaleDateString()}`,
                category: 'task',
                actionUrl: `/tasks`,
                isRead: false,
              });
              console.log("📬 Notification created for new recurring task");
            }
          }
        }
      }

      res.json(task);
    } catch (error: any) {
      if (error instanceof ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      if (error.message?.includes("not found")) {
        return res.status(404).json({ message: error.message });
      }
      console.error(error);
      res.status(500).json({ message: "Failed to update task" });
    }
  });

  app.delete("/api/tasks/:id", isAuthenticated, requireRole(UserRole.ADMIN, UserRole.MANAGER, UserRole.STAFF), async (req: Request, res: Response) => {
    try {
      await storage.deleteTask(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Failed to delete task" });
    }
  });

  // Calendar Events routes
  app.get("/api/calendar/events", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const events = await storage.getCalendarEvents();
      res.json(events);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Failed to fetch calendar events" });
    }
  });

  app.post("/api/calendar/events", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const user = req.user as any;
      const userId = user?.id || user?.claims?.sub;

      const eventData = {
        ...req.body,
        createdBy: userId,
        start: new Date(req.body.start),
        end: new Date(req.body.end),
      };

      const event = await storage.createCalendarEvent(eventData);
      res.status(201).json(event);
    } catch (error: any) {
      console.error(error);
      res.status(500).json({ message: error.message || "Failed to create calendar event" });
    }
  });

  app.patch("/api/calendar/events/:id", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const event = await storage.updateCalendarEvent(req.params.id, req.body);
      res.json(event);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Failed to update calendar event" });
    }
  });

  app.delete("/api/calendar/events/:id", isAuthenticated, async (req: Request, res: Response) => {
    try {
      await storage.deleteCalendarEvent(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Failed to delete calendar event" });
    }
  });

  // Public booking endpoint (no authentication required)
  app.post("/api/bookings", async (req: Request, res: Response) => {
    try {
      console.log("📅 Booking request received:", req.body);
      const { name, email, phone, company, message, datetime, date, time } = req.body;

      if (!name || !email || !phone || !datetime) {
        console.error("❌ Missing required fields:", { name: !!name, email: !!email, phone: !!phone, datetime: !!datetime });
        return res.status(400).json({ message: "Missing required fields" });
      }

      // Get admin users first
      const adminUsers = await storage.getAdminUsers();
      console.log(`📋 Found ${adminUsers.length} admin users`);
      
      if (adminUsers.length === 0) {
        console.error("❌ No admin users found!");
        return res.status(500).json({ message: "System configuration error: No admin users found" });
      }

      // Use first admin's ID for createdBy
      const firstAdminId = adminUsers[0].id;
      console.log(`✅ Using admin ID ${firstAdminId} for createdBy`);

      // Create calendar event for admin
      console.log("📅 Creating calendar event...");
      const event = await storage.createCalendarEvent({
        title: `📞 Strategy Call: ${name}${company ? ` (${company})` : ''}`,
        description: `Strategy call booking from website\n\n` +
          `Contact: ${name}\n` +
          `Email: ${email}\n` +
          `Phone: ${phone}\n` +
          `${company ? `Company: ${company}\n` : ''}` +
          `\nMessage:\n${message || 'No additional message'}`,
        start: new Date(datetime),
        end: new Date(new Date(datetime).getTime() + 30 * 60000), // 30 minutes
        type: "booking",
        location: phone,
        createdBy: firstAdminId,
      });
      console.log("✅ Calendar event created:", event.id);

      // Create a notification for all admins
      try {
        console.log("📬 Creating notifications for admins...");
        const { sendPushToUser } = await import('./push.js');
        
        for (const admin of adminUsers) {
          // In-app notification
          await storage.createNotification({
            userId: admin.id,
            title: "📞 New Strategy Call Booked",
            message: `${name} booked a strategy call for ${new Date(datetime).toLocaleString('en-US', { 
              dateStyle: 'long', 
              timeStyle: 'short',
              timeZone: 'America/New_York'
            })}`,
            type: "info",
            category: "general",
            actionUrl: `/company-calendar?date=${new Date(datetime).toISOString().split('T')[0]}`,
            isRead: false,
          });
          
          // Push notification
          await sendPushToUser(admin.id, {
            title: "📞 New Strategy Call Booked",
            body: `${name} booked a strategy call for ${new Date(datetime).toLocaleString('en-US', { 
              dateStyle: 'long', 
              timeStyle: 'short',
              timeZone: 'America/New_York'
            })}`,
            url: "/company-calendar",
          }).catch(err => console.error('Failed to send push notification to admin:', err));
        }
        console.log(`✅ Notifications sent to ${adminUsers.length} admins`);
      } catch (notifError) {
        console.error("⚠️ Failed to create notification:", notifError);
        // Don't fail the whole request if notification fails
      }

      console.log("🎉 Booking completed successfully!");
      res.status(201).json({
        success: true,
        eventId: event.id,
        message: "Booking confirmed!",
      });
    } catch (error: any) {
      console.error("❌ Booking error:");
      console.error("Error type:", error?.constructor?.name);
      console.error("Error message:", error?.message);
      console.error("Error stack:", error?.stack);
      res.status(500).json({ 
        message: "Failed to create booking",
        error: process.env.NODE_ENV === 'development' ? error?.message : undefined
      });
    }
  });

  // Public contact form endpoint (no authentication required)
  app.post("/api/contact", async (req: Request, res: Response) => {
    try {
      const { name, email, phone, company, message } = req.body;

      // Create a notification for all admins
      try {
        const adminUsers = await storage.getAdminUsers();
        for (const admin of adminUsers) {
          await storage.createNotification({
            userId: admin.id,
            title: "📧 New Contact Form Submission",
            message: `${name}${company ? ` from ${company}` : ''} sent a message`,
            type: "info",
            category: "general",
            actionUrl: "/messages",
            isRead: false,
          });
        }
      } catch (notifError) {
        console.error("Failed to create notification:", notifError);
      }

      // TODO: Send email notification to admin
      // TODO: Send confirmation email to customer
      // TODO: Store contact form submission in database

      res.json({ 
        success: true, 
        message: "Thank you for your message. We'll get back to you soon!" 
      });
    } catch (error) {
      console.error("Contact form error:", error);
      res.status(500).json({ message: "Failed to send message" });
    }
  });

  // Task comment routes
  app.get("/api/tasks/:taskId/comments", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const comments = await storage.getTaskComments(req.params.taskId);
      res.json(comments);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Failed to fetch task comments" });
    }
  });

  app.post("/api/tasks/:taskId/comments", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const user = req.user as any;
      const currentUserId = user?.id || user?.claims?.sub;
      const validatedData = insertTaskCommentSchema.parse({
        ...req.body,
        taskId: req.params.taskId,
        userId: currentUserId,
      });
      const comment = await storage.createTaskComment(validatedData);
      
      // Enhanced task comment notifications
      try {
        const task = await storage.getTask(req.params.taskId);
        if (!task) {
          console.log('Task not found for comment notification');
          return res.status(201).json(comment);
        }
        
        const { sendPushToUser } = await import('./push.js');
        const users = await storage.getUsers();
        const commenter = users.find(u => u.id === currentUserId);
        const commenterName = commenter?.firstName || commenter?.username || 'Someone';
        
        // Notify task assignee if different from commenter
        if (task.assignedToId && task.assignedToId !== currentUserId) {
          await storage.createNotification({
            userId: task.assignedToId,
            type: 'info',
            title: '💬 New Task Comment',
            message: `${commenterName} commented on "${task.title}"`,
            category: 'task',
            actionUrl: `/tasks?taskId=${task.id}`,
            isRead: false,
          });
          
          await sendPushToUser(task.assignedToId, {
            title: '💬 New Task Comment',
            body: `${commenterName}: ${validatedData.content?.substring(0, 100) || 'Added a comment'}`,
            url: `/tasks?taskId=${task.id}`,
          }).catch(err => console.error('Failed to send push notification:', err));
        }
        
        // Notify task creator if different from commenter and assignee
        if (task.createdBy && task.createdBy !== currentUserId && task.createdBy !== task.assignedToId) {
          await storage.createNotification({
            userId: task.createdBy,
            type: 'info',
            title: '💬 New Task Comment',
            message: `${commenterName} commented on "${task.title}"`,
            category: 'task',
            actionUrl: `/tasks?taskId=${task.id}`,
            isRead: false,
          });
          
          await sendPushToUser(task.createdBy, {
            title: '💬 New Task Comment',
            body: `${commenterName}: ${validatedData.content?.substring(0, 100) || 'Added a comment'}`,
            url: `/tasks?taskId=${task.id}`,
          }).catch(err => console.error('Failed to send push notification:', err));
        }
        
        // Notify client users if task is related to their client
        if (task.clientId) {
          const clientUsers = await storage.getUsersByClientId(task.clientId);
          
          for (const clientUser of clientUsers) {
            // Skip if client user is the commenter, assignee, or creator
            if (clientUser.id === currentUserId || clientUser.id === task.assignedToId || clientUser.id === task.createdBy) {
              continue;
            }
            
            await storage.createNotification({
              userId: clientUser.id,
              type: 'info',
              title: '💬 Task Comment Added',
              message: `${commenterName} commented on "${task.title}"`,
              category: 'task',
              actionUrl: '/client-dashboard',
              isRead: false,
            });
            
            await sendPushToUser(clientUser.id, {
              title: '💬 Task Comment Added',
              body: `${commenterName}: ${validatedData.content?.substring(0, 100) || 'Added a comment'}`,
              url: '/client-dashboard',
            }).catch(err => console.error('Failed to send push notification:', err));
          }
        }
        
              // Detect @mentions in comment content and notify mentioned users + admins
              try {
                const contentText = String(validatedData.content || "");
                const mentionUsernames = Array.from(new Set((contentText.match(/@([a-zA-Z0-9_\.\-]+)/g) || []).map(m => m.slice(1))))
                  .filter(Boolean);
                if (mentionUsernames.length > 0) {
                  const allUsers = await storage.getUsers();
                  const mentionedUsers = allUsers.filter(u => mentionUsernames.includes(u.username));
                  for (const mentioned of mentionedUsers) {
                    if (mentioned.id === currentUserId) continue;
                    await storage.createNotification({
                      userId: mentioned.id,
                      type: 'info',
                      title: '🔔 You were mentioned',
                      message: `${commenterName} mentioned you on "${task.title}"`,
                      category: 'communication',
                      actionUrl: `/tasks?taskId=${task.id}`,
                      isRead: false,
                    });
                    await sendPushToUser(mentioned.id, {
                      title: '🔔 You were mentioned',
                      body: `${commenterName}: ${contentText.substring(0, 100)}`,
                      url: `/tasks?taskId=${task.id}`,
                    }).catch(err => console.error('Failed to send push notification:', err));
                  }
                  // Also notify admins about mentions
                  const admins = allUsers.filter(u => u.role === UserRole.ADMIN);
                  for (const admin of admins) {
                    if (mentionedUsers.some(mu => mu.id === admin.id)) continue;
                    await storage.createNotification({
                      userId: admin.id,
                      type: 'info',
                      title: '💬 Team Mention',
                      message: `${commenterName} mentioned ${mentionUsernames.join(', ')} on "${task.title}"`,
                      category: 'communication',
                      actionUrl: `/tasks?taskId=${task.id}`,
                      isRead: false,
                    });
                    await sendPushToUser(admin.id, {
                      title: '💬 Team Mention',
                      body: `${commenterName} mentioned ${mentionUsernames.join(', ')}`,
                      url: `/tasks?taskId=${task.id}`,
                    }).catch(err => console.error('Failed to send push notification:', err));
                  }
                  console.log(`✅ Mention notifications sent for task comment: ${task.title}`);
                }
              } catch (mentionErr) {
                console.error('Failed to process task comment mentions:', mentionErr);
              }

              console.log(`✅ Task comment notifications sent for task: ${task.title}`);
      } catch (notifError) {
        console.error('Failed to send task comment notifications:', notifError);
        // Don't fail the comment creation if notification fails
      }
      
      res.status(201).json(comment);
    } catch (error) {
      handleValidationError(error, res);
    }
  });

  // Lead routes
  app.get("/api/leads", isAuthenticated, requirePermission("canManageLeads"), async (_req: Request, res: Response) => {
    try {
      const leads = await storage.getLeads();
      res.json(leads);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Failed to fetch leads" });
    }
  });

  app.post("/api/leads", isAuthenticated, requirePermission("canManageLeads"), async (req: Request, res: Response) => {
    try {
      const validatedData = insertLeadSchema.parse(req.body);
      const lead = await storage.createLead(validatedData);
      
      // Notify all admins and managers about new lead
      const users = await storage.getUsers();
      const adminsAndManagers = users.filter(u => 
        u.role === UserRole.ADMIN || u.role === UserRole.MANAGER
      );
      
      const { sendPushToUser } = await import('./push.js');
      
      for (const user of adminsAndManagers) {
        // In-app notification
        await storage.createNotification({
          userId: user.id,
          type: 'info',
          title: '🎯 New Lead',
          message: `${lead.name}${lead.company ? ` from ${lead.company}` : ''}`,
          category: 'general',
          actionUrl: `/leads?leadId=${lead.id}`,
          isRead: false,
        });
        
        // Push notification
        await sendPushToUser(user.id, {
          title: '🎯 New Lead',
          body: `${lead.name}${lead.company ? ` from ${lead.company}` : ''}`,
          url: '/leads',
        }).catch(err => console.error('Failed to send push notification:', err));
      }
      console.log(`📬 Notified ${adminsAndManagers.length} admins/managers about new lead`);
      
      res.status(201).json(lead);
    } catch (error) {
      handleValidationError(error, res);
    }
  });

  app.patch("/api/leads/:id", isAuthenticated, requirePermission("canManageLeads"), async (req: Request, res: Response) => {
    try {
      const validatedData = insertLeadSchema.partial().strip().parse(req.body);
      const lead = await storage.updateLead(req.params.id, validatedData);
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

  app.delete("/api/leads/:id", isAuthenticated, requirePermission("canManageLeads"), async (req: Request, res: Response) => {
    try {
      await storage.deleteLead(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Failed to delete lead" });
    }
  });

  // Lead activity routes
  app.get("/api/leads/:leadId/activities", isAuthenticated, requirePermission("canManageLeads"), async (req: Request, res: Response) => {
    try {
      const activities = await storage.getLeadActivities(req.params.leadId);
      res.json(activities);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Failed to fetch lead activities" });
    }
  });

  app.post("/api/leads/:leadId/activities", isAuthenticated, requirePermission("canManageLeads"), async (req: Request, res: Response) => {
    try {
      const { insertLeadActivitySchema } = await import("@shared/schema");
      const validatedData = insertLeadActivitySchema.parse({
        ...req.body,
        leadId: req.params.leadId,
      });
      const activity = await storage.createLeadActivity(validatedData);
      res.status(201).json(activity);
    } catch (error) {
      handleValidationError(error, res);
    }
  });

  // Lead automation routes
  app.get("/api/leads/:leadId/automations", isAuthenticated, requirePermission("canManageLeads"), async (req: Request, res: Response) => {
    try {
      const automations = await storage.getLeadAutomations(req.params.leadId);
      res.json(automations);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Failed to fetch lead automations" });
    }
  });

  app.post("/api/leads/:leadId/automations", isAuthenticated, requirePermission("canManageLeads"), async (req: Request, res: Response) => {
    try {
      const { insertLeadAutomationSchema } = await import("@shared/schema");
      const validatedData = insertLeadAutomationSchema.parse({
        ...req.body,
        leadId: req.params.leadId,
      });
      const automation = await storage.createLeadAutomation(validatedData);
      res.status(201).json(automation);
    } catch (error) {
      handleValidationError(error, res);
    }
  });

  app.patch("/api/automations/:id", isAuthenticated, requirePermission("canManageLeads"), async (req: Request, res: Response) => {
    try {
      const { insertLeadAutomationSchema } = await import("@shared/schema");
      const validatedData = insertLeadAutomationSchema.partial().strip().parse(req.body);
      const automation = await storage.updateLeadAutomation(req.params.id, validatedData);
      res.json(automation);
    } catch (error: any) {
      if (error instanceof ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      if (error.message?.includes("not found")) {
        return res.status(404).json({ message: error.message });
      }
      console.error(error);
      res.status(500).json({ message: "Failed to update automation" });
    }
  });

  app.delete("/api/automations/:id", isAuthenticated, requirePermission("canManageLeads"), async (req: Request, res: Response) => {
    try {
      await storage.deleteLeadAutomation(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Failed to delete automation" });
    }
  });

  // Content post routes
  app.get("/api/content-posts", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const user = req.user as any;
      const userRole = user?.role || 'staff';
      const clientId = user?.clientId;
      
      // If user is a client, only show their assigned content
      if (userRole === 'client' && clientId) {
        const posts = await storage.getContentPostsByClient(clientId);
        return res.json(posts);
      }
      
      // For non-clients, require permission and show all posts
      if (!user || !rolePermissions[userRole as UserRole]?.canManageContent) {
        return res.status(403).json({ message: "Permission denied" });
      }
      
      const posts = await storage.getContentPosts();
      res.json(posts);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Failed to fetch content posts" });
    }
  });

  app.post("/api/content-posts", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const user = req.user as any;
      console.log("🎨 Creating content post");
      console.log("👤 User:", user?.username, "Role:", user?.role);
      console.log("📦 Request body:", JSON.stringify(req.body, null, 2));
      
      // If user is a client, they can only create content for themselves (pending approval)
      if (user.role === 'client') {
        const validatedData = insertContentPostSchema.parse({
          ...req.body,
          clientId: String(user.clientId || user.id), // Client can only create content for themselves
          approvalStatus: 'pending', // Client uploads always start as pending
        });
        console.log("✅ Client validated data:", validatedData);
        const post = await storage.createContentPost(validatedData);
        return res.status(201).json(post);
      }
      
      // Admin/manager/staff can create content for any client
      // Get user role to check permissions
      const userRecord = await storage.getUser(String(user.id));
      if (!userRecord) {
        console.log("❌ User not found:", user.id);
        return res.status(401).json({ message: "User not found" });
      }
      
      // Check if user has permission to manage content
      const { hasPermission } = await import('./rbac.js');
      if (!hasPermission(userRecord.role as any, "canManageContent")) {
        console.log("❌ Permission denied for user:", user.id, "role:", userRecord.role);
        return res.status(403).json({ message: "You don't have permission to manage content" });
      }
      
      // Ensure clientId is present
      if (!req.body.clientId) {
        console.log("❌ Missing clientId in request");
        return res.status(400).json({ message: "clientId is required" });
      }
      
      const validatedData = insertContentPostSchema.parse(req.body);
      console.log("✅ Validated data:", JSON.stringify(validatedData, null, 2));
      const post = await storage.createContentPost(validatedData);
      console.log("✅ Content post created:", post.id);
      
      // Notify client users about new content post
      if (post.clientId) {
        try {
          const clientUsers = await storage.getUsersByClientId(post.clientId);
          const { sendPushToUser } = await import('./push.js');
          
          for (const clientUser of clientUsers) {
            // In-app notification
            await storage.createNotification({
              userId: clientUser.id,
              type: 'success',
              title: '📝 New Content Posted',
              message: `New content has been scheduled${post.scheduledFor ? ` for ${new Date(post.scheduledFor).toLocaleDateString()}` : ''}`,
              category: 'general',
              actionUrl: `/client-content?postId=${post.id}`,
              isRead: false,
            });
            
            // Push notification
            await sendPushToUser(clientUser.id, {
              title: '📝 New Content Posted',
              body: 'New content has been scheduled for you',
              url: '/client-content',
            }).catch(err => console.error('Failed to send push notification:', err));
          }
          console.log(`📬 Notified ${clientUsers.length} client user(s) about new content`);
        } catch (notifError) {
          console.error('Failed to notify client about content:', notifError);
        }
      }
      
      res.status(201).json(post);
    } catch (error: any) {
      console.error("❌ Content post creation error:");
      console.error("Error type:", error.constructor.name);
      console.error("Error message:", error.message);
      console.error("Error stack:", error.stack);
      
      if (error instanceof ZodError) {
        console.error("Validation errors:", error.errors);
        return res.status(400).json({ 
          message: "Validation error", 
          errors: error.errors 
        });
      }
      
      return res.status(500).json({ 
        message: "Internal server error",
        error: error.message || "Unknown error"
      });
    }
  });

  app.patch("/api/content-posts/:id", isAuthenticated, requirePermission("canManageContent"), async (req: Request, res: Response) => {
    try {
      const validatedData = insertContentPostSchema.partial().strip().parse(req.body);
      const post = await storage.updateContentPost(req.params.id, validatedData);
      res.json(post);
    } catch (error: any) {
      if (error instanceof ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      if (error.message?.includes("not found")) {
        return res.status(404).json({ message: error.message });
      }
      console.error(error);
      res.status(500).json({ message: "Failed to update content post" });
    }
  });

  app.patch("/api/content-posts/:id/approval", isAuthenticated, requirePermission("canManageContent"), async (req: Request, res: Response) => {
    try {
      const approvalSchema = z.object({
        approvalStatus: z.enum(["pending", "approved", "rejected"])
      });
      const validatedData = approvalSchema.parse(req.body);
      const post = await storage.updateContentPost(req.params.id, validatedData);
      
      // Enhanced content approval notifications
      try {
        const { sendPushToUser } = await import('./push.js');
        const users = await storage.getUsers();
        const currentUser = req.user as any;
        const currentUserId = currentUser?.id || currentUser?.claims?.sub;
        
        // Notify content creator about approval status change
        if (post.createdBy && post.createdBy !== currentUserId) {
          const creator = users.find(u => u.id === post.createdBy);
          if (creator) {
            const statusMessages = {
              'approved': '✅ Content Approved',
              'rejected': '❌ Content Rejected',
              'pending': '⏳ Content Pending Review'
            };
            
            const statusMessage = statusMessages[validatedData.approvalStatus as keyof typeof statusMessages];
            
            await storage.createNotification({
              userId: creator.id,
              type: validatedData.approvalStatus === 'approved' ? 'success' : 
                    validatedData.approvalStatus === 'rejected' ? 'error' : 'warning',
              title: statusMessage,
              message: `Your content "${post.title}" has been ${validatedData.approvalStatus}`,
              category: 'content_approval',
              actionUrl: '/client-content',
              isRead: false,
            });
            
            await sendPushToUser(creator.id, {
              title: statusMessage,
              body: `Your content "${post.title}" has been ${validatedData.approvalStatus}`,
              url: '/client-content',
            }).catch(err => console.error('Failed to send push notification:', err));
          }
        }
        
        // Notify client users if content is related to their client
        if (post.clientId) {
          const clientUsers = await storage.getUsersByClientId(post.clientId);
          
          for (const clientUser of clientUsers) {
            // Skip if client user is the creator
            if (clientUser.id === post.createdBy) continue;
            
            const statusMessages = {
              'approved': '✅ Content Approved',
              'rejected': '❌ Content Rejected',
              'pending': '⏳ Content Pending Review'
            };
            
            const statusMessage = statusMessages[validatedData.approvalStatus as keyof typeof statusMessages];
            
            await storage.createNotification({
              userId: clientUser.id,
              type: validatedData.approvalStatus === 'approved' ? 'success' : 
                    validatedData.approvalStatus === 'rejected' ? 'error' : 'warning',
              title: statusMessage,
              message: `Content "${post.title}" for your project has been ${validatedData.approvalStatus}`,
              category: 'content_approval',
              actionUrl: '/client-content',
              isRead: false,
            });
            
            await sendPushToUser(clientUser.id, {
              title: statusMessage,
              body: `Content "${post.title}" for your project has been ${validatedData.approvalStatus}`,
              url: '/client-content',
            }).catch(err => console.error('Failed to send push notification:', err));
          }
        }
        
        console.log(`✅ Content approval notifications sent for: ${post.title}`);
      } catch (notifError) {
        console.error('Failed to send content approval notifications:', notifError);
      }
      
      res.json(post);
    } catch (error: any) {
      if (error instanceof ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      if (error.message?.includes("not found")) {
        return res.status(404).json({ message: error.message });
      }
      console.error(error);
      res.status(500).json({ message: "Failed to update approval status" });
    }
  });

  app.delete("/api/content-posts/:id", isAuthenticated, requirePermission("canManageContent"), async (req: Request, res: Response) => {
    try {
      await storage.deleteContentPost(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Failed to delete content post" });
    }
  });

  // Invoice routes
  app.get("/api/invoices", isAuthenticated, requirePermission("canManageInvoices"), async (_req: Request, res: Response) => {
    try {
      const invoices = await storage.getInvoices();
      res.json(invoices);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Failed to fetch invoices" });
    }
  });

  app.post("/api/invoices", isAuthenticated, requirePermission("canManageInvoices"), async (req: Request, res: Response) => {
    try {
      const validatedData = insertInvoiceSchema.parse(req.body);
      const invoice = await storage.createInvoice(validatedData);
      
      // Notify client users about new invoice
      if (invoice.clientId) {
        try {
          const clientUsers = await storage.getUsersByClientId(invoice.clientId);
          const { sendPushToUser } = await import('./push.js');
          
          for (const clientUser of clientUsers) {
            // In-app notification
            await storage.createNotification({
              userId: clientUser.id,
              type: 'info',
              title: '💰 New Invoice',
              message: `Invoice #${invoice.invoiceNumber} for $${invoice.amount} is now available`,
              category: 'general',
              actionUrl: '/client-billing',
              isRead: false,
            });
            
            // Push notification
            await sendPushToUser(clientUser.id, {
              title: '💰 New Invoice',
              body: `Invoice #${invoice.invoiceNumber} for $${invoice.amount}`,
              url: '/client-billing',
            }).catch(err => console.error('Failed to send push notification:', err));
          }
          console.log(`📬 Notified ${clientUsers.length} client user(s) about new invoice`);
        } catch (notifError) {
          console.error('Failed to notify client about invoice:', notifError);
        }
      }
      
      res.status(201).json(invoice);
    } catch (error) {
      handleValidationError(error, res);
    }
  });

  app.patch("/api/invoices/:id", isAuthenticated, requirePermission("canManageInvoices"), async (req: Request, res: Response) => {
    try {
      const validatedData = insertInvoiceSchema.partial().strip().parse(req.body);
      const invoice = await storage.updateInvoice(req.params.id, validatedData);
      res.json(invoice);
    } catch (error: any) {
      if (error instanceof ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      if (error.message?.includes("not found")) {
        return res.status(404).json({ message: error.message });
      }
      console.error(error);
      res.status(500).json({ message: "Failed to update invoice" });
    }
  });

  app.delete("/api/invoices/:id", isAuthenticated, requirePermission("canManageInvoices"), async (req: Request, res: Response) => {
    try {
      await storage.deleteInvoice(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Failed to delete invoice" });
    }
  });

  // Ticket routes
  app.get("/api/tickets", isAuthenticated, requirePermission("canManageTickets"), async (req: Request, res: Response) => {
    try {
      const tickets = await storage.getTickets();
      const userRole = (req as any).userRole;
      const userId = (req as any).userId;
      
      // Clients can only see their own tickets (based on clientId)
      if (userRole === "client") {
        const user = req.user as any;
        const clientId = user?.clientId;
        const filteredTickets = tickets.filter(t => t.clientId === clientId);
        return res.json(filteredTickets);
      }
      
      res.json(tickets);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Failed to fetch tickets" });
    }
  });

  app.post("/api/tickets", isAuthenticated, requirePermission("canManageTickets"), async (req: Request, res: Response) => {
    try {
      const validatedData = insertTicketSchema.parse(req.body);
      const userRole = (req as any).userRole;
      const user = req.user as any;
      
      // For clients: ensure they can only create tickets with their own clientId
      let ticketData: any = { ...validatedData };
      
      if (userRole === "client") {
        // Clients cannot set arbitrary assignedTo
        delete ticketData.assignedToId;
        
        // Get clientId from user record
        if (!user?.clientId) {
          return res.status(400).json({ 
            message: "Your account is not linked to a client record. Please contact support." 
          });
        }
        
        // Force use of user's own clientId
        ticketData.clientId = user.clientId;
      }
      
      const ticket = await storage.createTicket(ticketData);
      res.status(201).json(ticket);
    } catch (error) {
      console.error("Error creating ticket:", error);
      handleValidationError(error, res);
    }
  });

  app.patch("/api/tickets/:id", isAuthenticated, requirePermission("canManageTickets"), async (req: Request, res: Response) => {
    try {
      const validatedData = insertTicketSchema.partial().strip().parse(req.body);
      const userRole = (req as any).userRole;
      const userId = (req as any).userId;
      
      // Clients can only update their own tickets
      if (userRole === "client") {
        const user = req.user as any;
        const clientId = user?.clientId;
        const tickets = await storage.getTickets();
        const ticket = tickets.find(t => t.id === req.params.id);
        if (!ticket || ticket.clientId !== clientId) {
          return res.status(403).json({ message: "Cannot update tickets from other clients" });
        }
      }
      
      const ticket = await storage.updateTicket(req.params.id, validatedData);
      res.json(ticket);
    } catch (error: any) {
      if (error instanceof ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      if (error.message?.includes("not found")) {
        return res.status(404).json({ message: error.message });
      }
      console.error(error);
      res.status(500).json({ message: "Failed to update ticket" });
    }
  });

  app.delete("/api/tickets/:id", isAuthenticated, requirePermission("canManageTickets"), async (req: Request, res: Response) => {
    try {
      const userRole = (req as any).userRole;
      const userId = (req as any).userId;
      
      // Clients can only delete their own tickets
      if (userRole === "client") {
        const user = req.user as any;
        const clientId = user?.clientId;
        const tickets = await storage.getTickets();
        const ticket = tickets.find(t => t.id === req.params.id);
        if (!ticket || ticket.clientId !== clientId) {
          return res.status(403).json({ message: "Cannot delete tickets from other clients" });
        }
      }
      
      await storage.deleteTicket(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Failed to delete ticket" });
    }
  });

  // Message routes (all authenticated users)
  app.get("/api/messages", isAuthenticated, requireRole(UserRole.ADMIN, UserRole.STAFF), async (req: Request, res: Response) => {
    try {
      const clientId = req.query.clientId as string | undefined;
      const messages = await storage.getMessages(clientId);
      res.json(messages);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Failed to fetch messages" });
    }
  });

  // Get unread message counts per user (for badges)
  app.get("/api/messages/unread-counts", isAuthenticated, requireRole(UserRole.ADMIN, UserRole.MANAGER, UserRole.STAFF), async (req: Request, res: Response) => {
    try {
      const currentUserId = (req.user as any).id;
      const result = await pool.query(
        `SELECT user_id, COUNT(*) as count 
         FROM messages 
         WHERE recipient_id = $1 AND is_read = false 
         GROUP BY user_id`,
        [currentUserId]
      );
      
      // Convert to object { userId: count }
      const counts: Record<number, number> = {};
      result.rows.forEach((row: any) => {
        counts[row.user_id] = parseInt(row.count);
      });
      
      res.json(counts);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Failed to fetch unread counts" });
    }
  });

  // Get conversation between two users (for internal team messaging)
  app.get("/api/messages/conversation/:userId", isAuthenticated, requireRole(UserRole.ADMIN, UserRole.MANAGER, UserRole.STAFF), async (req: Request, res: Response) => {
    try {
      const currentUserId = (req.user as any).id;
      const otherUserId = parseInt(req.params.userId);
      
      if (!otherUserId || isNaN(otherUserId)) {
        return res.status(400).json({ message: "Invalid user ID" });
      }

      const messages = await storage.getConversation(currentUserId, otherUserId);
      
      // Mark messages delivered when fetched
      try {
        await pool.query(
          `UPDATE messages 
           SET delivered_at = NOW() 
           WHERE recipient_id = $1 AND user_id = $2 AND delivered_at IS NULL`,
          [currentUserId, otherUserId]
        );
      } catch (e: any) {
        if (String(e?.message || '').includes('delivered_at')) {
          await ensureMessageColumns();
          await pool.query(
            `UPDATE messages SET delivered_at = NOW() WHERE recipient_id = $1 AND user_id = $2 AND delivered_at IS NULL`,
            [currentUserId, otherUserId]
          );
        } else {
          throw e;
        }
      }
      
      // Mark all messages from this user as read
      try {
        await pool.query(
          `UPDATE messages 
           SET is_read = true, read_at = NOW() 
           WHERE recipient_id = $1 AND user_id = $2 AND is_read = false`,
          [currentUserId, otherUserId]
        );
      } catch (e: any) {
        if (String(e?.message || '').includes('read_at')) {
          await ensureMessageColumns();
          await pool.query(
            `UPDATE messages SET is_read = true, read_at = NOW() WHERE recipient_id = $1 AND user_id = $2 AND is_read = false`,
            [currentUserId, otherUserId]
          );
        } else {
          throw e;
        }
      }
      
      res.json(messages);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Failed to fetch conversation" });
    }
  });

  app.post("/api/messages", isAuthenticated, requireRole(UserRole.ADMIN, UserRole.MANAGER, UserRole.STAFF), async (req: Request, res: Response) => {
    try {
      const currentUserId = (req.user as any).id;
      console.log("📨 Creating message:", { 
        userId: currentUserId, 
        recipientId: req.body.recipientId,
        content: req.body.content?.substring(0, 50),
        isInternal: req.body.isInternal 
      });
      
      const validatedData = insertMessageSchema.parse({
        ...req.body,
        userId: currentUserId, // Set sender as current user
      });
      
      let message;
      try {
        message = await storage.createMessage(validatedData);
      } catch (e: any) {
        if (String(e?.message || '').includes('column') && String(e?.message || '').includes('does not exist')) {
          await ensureMessageColumns();
          message = await storage.createMessage(validatedData);
        } else {
          throw e;
        }
      }
      console.log("✅ Message created successfully:", message.id);
      
      // Detect @mentions in message content and notify mentioned users and admins
      try {
        const content = String(validatedData.content || "");
        const mentionUsernames = Array.from(new Set((content.match(/@([a-zA-Z0-9_\.\-]+)/g) || []).map(m => m.slice(1))))
          .filter(Boolean);
        if (mentionUsernames.length > 0) {
          const users = await storage.getUsers();
          const mentionedUsers = users.filter(u => mentionUsernames.includes(u.username));
          const { sendPushToUser } = await import('./push.js');
          const sender = await storage.getUser(String(currentUserId));
          const senderName = sender?.firstName || sender?.username || 'Someone';

          for (const mentioned of mentionedUsers) {
            // In-app notification for mentioned user
            await storage.createNotification({
              userId: mentioned.id,
              type: 'info',
              title: '🔔 You were mentioned',
              message: `${senderName} mentioned you in a message`,
              category: 'communication',
              actionUrl: `/messages?userId=${currentUserId}`,
              isRead: false,
            });

            await sendPushToUser(mentioned.id, {
              title: '🔔 You were mentioned',
              body: `${senderName}: ${content.substring(0, 100)}`,
              url: `/messages?userId=${currentUserId}`,
            }).catch(err => console.error('Failed to send push notification:', err));
          }

          // Also notify admins about mentions (admin-only visibility)
          const admins = users.filter(u => u.role === UserRole.ADMIN);
          for (const admin of admins) {
            if (!mentionedUsers.some(mu => mu.id === admin.id)) {
              await storage.createNotification({
                userId: admin.id,
                type: 'info',
                title: '💬 Team Mention',
                message: `${senderName} mentioned ${mentionUsernames.join(', ')} in messages`,
                category: 'communication',
                actionUrl: '/messages',
                isRead: false,
              });

              await sendPushToUser(admin.id, {
                title: '💬 Team Mention',
                body: `${senderName} mentioned ${mentionUsernames.join(', ')}`,
                url: '/messages',
              }).catch(err => console.error('Failed to send push notification:', err));
            }
          }

          console.log(`✅ Mention notifications sent for usernames: ${mentionUsernames.join(', ')}`);
        }
      } catch (mentionError) {
        console.error('Failed to process mentions:', mentionError);
      }

      // Create notification for recipient (don't let this fail the message creation)
      if (validatedData.recipientId) {
        try {
          console.log("🔍 Creating notification for recipient:", validatedData.recipientId);
          
          const sender = await storage.getUser(String(currentUserId));
          const senderName = sender?.firstName || sender?.username || 'Someone';
          console.log("👤 Sender info:", { id: currentUserId, name: senderName, role: sender?.role });
          
          // Check if recipient exists
          const recipient = await storage.getUser(String(validatedData.recipientId));
          console.log("👤 Recipient info:", { id: validatedData.recipientId, name: recipient?.firstName || recipient?.username, role: recipient?.role });
          
          if (!recipient) {
            console.error("❌ Recipient user not found:", validatedData.recipientId);
            return res.status(201).json(message); // Still return success for message
          }
          
          // In-app notification
          const notification = await storage.createNotification({
            userId: validatedData.recipientId,
            type: 'info',
            title: '💬 New Message',
            message: `${senderName} sent you a message`,
            category: 'general',
            actionUrl: `/messages?userId=${currentUserId}`,
            isRead: false,
          });
          console.log("📬 In-app notification created:", notification.id);
          
          // Push notification
          const { sendPushToUser } = await import('./push.js');
          await sendPushToUser(validatedData.recipientId, {
            title: '💬 New Message',
            body: `${senderName}: ${validatedData.content?.substring(0, 100) || 'Sent you a message'}`,
            url: `/messages?userId=${currentUserId}`,
          }).catch(err => console.error('Failed to send push notification:', err));
          console.log("📱 Push notification sent to:", validatedData.recipientId);
        } catch (notifError) {
          console.error("⚠️ Failed to create notification (non-critical):", notifError);
          console.error("Notification error details:", {
            message: notifError?.message,
            stack: notifError?.stack,
            recipientId: validatedData.recipientId
          });
          // Don't fail the message creation if notification fails
        }
      } else {
        console.log("⚠️ No recipientId provided, skipping notification");
      }
      
      res.status(201).json(message);
    } catch (error: any) {
      console.error("❌ Failed to create message:", error);
      console.error("Error name:", error?.name);
      console.error("Error message:", error?.message);
      console.error("Error stack:", error?.stack);
      console.error("Request body:", req.body);
      console.error("User ID:", (req.user as any)?.id);
      
      if (error instanceof ZodError) {
        console.error("Validation errors:", JSON.stringify(error.errors, null, 2));
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      
      res.status(500).json({ message: error?.message || "Internal server error" });
    }
  });

  app.patch("/api/messages/:id", isAuthenticated, requireRole(UserRole.ADMIN, UserRole.STAFF), async (req: Request, res: Response) => {
    try {
      const validatedData = insertMessageSchema.partial().strip().parse(req.body);
      const message = await storage.updateMessage(req.params.id, validatedData);
      res.json(message);
    } catch (error: any) {
      if (error instanceof ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      if (error.message?.includes("not found")) {
        return res.status(404).json({ message: error.message });
      }
      console.error(error);
      res.status(500).json({ message: "Failed to update message" });
    }
  });

  app.delete("/api/messages/:id", isAuthenticated, requireRole(UserRole.ADMIN, UserRole.STAFF), async (req: Request, res: Response) => {
    try {
      await storage.deleteMessage(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Failed to delete message" });
    }
  });

  // Mark a single message as read (sets is_read and read_at)
  app.post("/api/messages/:id/read", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const currentUserId = (req.user as any).id;
      const messageId = req.params.id;
      await pool.query(
        `UPDATE messages SET is_read = true, read_at = NOW() WHERE id = $1 AND recipient_id = $2`,
        [messageId, currentUserId]
      );
      res.json({ success: true });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Failed to mark as read' });
    }
  });

  // Presence: heartbeat updates last_seen
  app.post("/api/presence/heartbeat", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const currentUserId = (req.user as any).id;
      try {
        await pool.query(`UPDATE users SET last_seen = NOW() WHERE id = $1`, [currentUserId]);
      } catch (e: any) {
        // Tolerate missing column on older DB, will be added by migration/bootstrapping
        if (String(e?.message || '').includes('last_seen')) {
          await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS last_seen TIMESTAMP;`).catch(() => {});
          await pool.query(`UPDATE users SET last_seen = NOW() WHERE id = $1`, [currentUserId]).catch(() => {});
        } else {
          throw e;
        }
      }
      res.json({ success: true, lastSeen: new Date().toISOString() });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Failed to update presence' });
    }
  });

  // Presence: get online/offline for a user
  app.get("/api/presence/:userId", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.params.userId);
      let result;
      try {
        result = await pool.query(`SELECT last_seen FROM users WHERE id = $1`, [userId]);
      } catch (e: any) {
        if (String(e?.message || '').includes('last_seen')) {
          await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS last_seen TIMESTAMP;`).catch(() => {});
          result = await pool.query(`SELECT last_seen FROM users WHERE id = $1`, [userId]);
        } else {
          throw e;
        }
      }
      const lastSeen: Date | null = result.rows[0]?.last_seen ? new Date(result.rows[0].last_seen) : null;
      const now = new Date();
      const online = lastSeen ? (now.getTime() - lastSeen.getTime()) <= 2 * 60 * 1000 : false; // 2 minutes
      res.json({ online, lastSeen });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Failed to fetch presence' });
    }
  });

  // Onboarding task routes (admin and staff only)
  app.get("/api/onboarding-tasks", isAuthenticated, requireRole(UserRole.ADMIN, UserRole.STAFF), async (_req: Request, res: Response) => {
    try {
      const tasks = await storage.getOnboardingTasks();
      res.json(tasks);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Failed to fetch onboarding tasks" });
    }
  });

  // User management routes (admin, manager, and staff)
  app.get("/api/users", isAuthenticated, requireRole(UserRole.ADMIN, UserRole.MANAGER, UserRole.STAFF), async (_req: Request, res: Response) => {
    try {
      const users = await storage.getAllUsers();
      // Filter out clients - they should only appear in /clients page, not team management
      const teamMembers = users.filter(user => user.role !== 'client');
      res.json(teamMembers);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  app.patch("/api/users/:id/role", isAuthenticated, requireRole(UserRole.ADMIN), async (req: Request, res: Response) => {
    try {
      const roleSchema = z.object({
        role: z.enum(["admin", "staff", "client"])
      });
      const { role } = roleSchema.parse(req.body);
      const user = await storage.updateUserRole(req.params.id, role);
      res.json(user);
    } catch (error: any) {
      if (error instanceof ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      if (error.message?.includes("not found")) {
        return res.status(404).json({ message: error.message });
      }
      console.error(error);
      res.status(500).json({ message: "Failed to update user role" });
    }
  });

  // Global search route
  app.get("/api/search", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const currentUser = req.user;
      const query = req.query.q as string;
      
      if (!query || query.trim().length < 2) {
        return res.json({
          clients: [],
          campaigns: [],
          leads: [],
          contentPosts: [],
          invoices: [],
          tickets: [],
        });
      }
      
      const results = await storage.globalSearch(query.trim());
      
      // Filter results based on user role
      if (currentUser?.role !== UserRole.ADMIN) {
        // For managers and staff: only show campaigns they created
        results.campaigns = results.campaigns.filter((c: any) => c.createdBy === currentUser?.id);
        // Tasks are already filtered by the tasks endpoint
      }
      
      res.json(results);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Search failed" });
    }
  });

  // Client Document routes
  app.get("/api/clients/:clientId/documents", isAuthenticated, requirePermission("canManageClients"), async (req: Request, res: Response) => {
    try {
      const documents = await storage.getClientDocuments(req.params.clientId);
      res.json(documents);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Failed to fetch documents" });
    }
  });

  app.post("/api/clients/:clientId/documents", isAuthenticated, requirePermission("canManageClients"), async (req: Request, res: Response) => {
    try {
      const userId = (req as any).userId;
      
      const requestSchema = z.object({
        name: z.string(),
        description: z.string().optional(),
        fileType: z.string().optional(),
        fileSize: z.number().optional(),
        uploadUrl: z.string(),
      });
      
      const validatedData = requestSchema.parse(req.body);
      
      const objectPath = await objectStorageService.trySetObjectEntityAclPolicy(
        validatedData.uploadUrl,
        {
          owner: userId,
          visibility: "private",
        }
      );

      const documentData = insertClientDocumentSchema.parse({
        clientId: req.params.clientId,
        name: validatedData.name,
        description: validatedData.description,
        objectPath: objectPath,
        fileType: validatedData.fileType,
        fileSize: validatedData.fileSize,
        uploadedBy: userId.toString(),
      });

      const document = await storage.createClientDocument(documentData);
      res.status(201).json(document);
    } catch (error) {
      handleValidationError(error, res);
    }
  });

  app.delete("/api/clients/:clientId/documents/:documentId", isAuthenticated, requirePermission("canManageClients"), async (req: Request, res: Response) => {
    try {
      await storage.deleteClientDocument(req.params.documentId);
      res.status(204).send();
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Failed to delete document" });
    }
  });

  // Website project routes
  app.get("/api/website-projects", isAuthenticated, async (_req: Request, res: Response) => {
    try {
      const projects = await storage.getWebsiteProjects();
      res.json(projects);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Failed to fetch website projects" });
    }
  });

  app.get("/api/website-projects/:id", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const project = await storage.getWebsiteProject(req.params.id);
      if (!project) {
        return res.status(404).json({ message: "Website project not found" });
      }
      res.json(project);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Failed to fetch website project" });
    }
  });

  app.post("/api/website-projects", isAuthenticated, requirePermission("canManageClients"), async (req: Request, res: Response) => {
    try {
      const validatedData = insertWebsiteProjectSchema.parse(req.body);
      const project = await storage.createWebsiteProject(validatedData);
      res.status(201).json(project);
    } catch (error) {
      handleValidationError(error, res);
    }
  });

  app.patch("/api/website-projects/:id", isAuthenticated, requirePermission("canManageClients"), async (req: Request, res: Response) => {
    try {
      const validatedData = insertWebsiteProjectSchema.partial().parse(req.body);
      const project = await storage.updateWebsiteProject(req.params.id, validatedData);
      res.json(project);
    } catch (error) {
      if (error instanceof Error && error.message === "Website project not found") {
        return res.status(404).json({ message: error.message });
      }
      handleValidationError(error, res);
    }
  });

  app.delete("/api/website-projects/:id", isAuthenticated, requirePermission("canManageClients"), async (req: Request, res: Response) => {
    try {
      await storage.deleteWebsiteProject(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Failed to delete website project" });
    }
  });

  // Project feedback routes
  app.get("/api/website-projects/:projectId/feedback", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const feedback = await storage.getProjectFeedback(req.params.projectId);
      res.json(feedback);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Failed to fetch project feedback" });
    }
  });

  app.post("/api/website-projects/:projectId/feedback", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = (req as any).userId;
      const validatedData = insertProjectFeedbackSchema.parse({
        ...req.body,
        projectId: req.params.projectId,
        userId,
      });
      const feedback = await storage.createProjectFeedback(validatedData);
      res.status(201).json(feedback);
    } catch (error) {
      handleValidationError(error, res);
    }
  });

  app.patch("/api/project-feedback/:id", isAuthenticated, requirePermission("canManageClients"), async (req: Request, res: Response) => {
    try {
      const validatedData = insertProjectFeedbackSchema.partial().parse(req.body);
      const feedback = await storage.updateProjectFeedback(req.params.id, validatedData);
      res.json(feedback);
    } catch (error) {
      if (error instanceof Error && error.message === "Project feedback not found") {
        return res.status(404).json({ message: error.message });
      }
      handleValidationError(error, res);
    }
  });

  app.delete("/api/project-feedback/:id", isAuthenticated, requirePermission("canManageClients"), async (req: Request, res: Response) => {
    try {
      await storage.deleteProjectFeedback(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Failed to delete project feedback" });
    }
  });

  // Public tracking endpoint (no auth required for website tracking)
  app.post("/api/track/pageview", async (req: Request, res: Response) => {
    try {
      const { page, referrer, userAgent, sessionId } = req.body;
      
      // Parse user agent to extract device info
      const ua = userAgent || '';
      const deviceType = /mobile/i.test(ua) ? 'mobile' : /tablet/i.test(ua) ? 'tablet' : 'desktop';
      const browser = /chrome/i.test(ua) ? 'Chrome' : /firefox/i.test(ua) ? 'Firefox' : /safari/i.test(ua) ? 'Safari' : 'Other';
      
      // Store pageview data in database
      await storage.trackPageView({
        page,
        referrer,
        userAgent: ua,
        ip: req.ip || 'unknown',
        deviceType,
        browser,
        sessionId: sessionId || req.ip || 'unknown',
      });
      
      console.log('📊 Page view tracked:', page);
      
      res.status(200).json({ success: true });
    } catch (error) {
      console.error('Error tracking pageview:', error);
      res.status(500).json({ message: "Failed to track pageview" });
    }
  });

  // Get website analytics summary
  app.get("/api/analytics/website", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const days = parseInt(req.query.days as string) || 30;
      
      // Fetch real data from database
      const pageViewsCount = await storage.getPageViewsCount(days);
      const uniqueVisitors = await storage.getUniqueVisitors(days);
      const topPagesData = await storage.getTopPages(days, 5);
      
      // Format top pages with titles
      const topPages = topPagesData.map((page: any) => ({
        path: page.page,
        views: Number(page.views),
        title: page.page === '/' ? 'Home' : 
               page.page.split('/').filter(Boolean).join(' > ').replace(/-/g, ' ')
      }));
      
      // Calculate estimated bounce rate and session duration
      // These would need more sophisticated tracking in production
      const bounceRate = pageViewsCount > 0 ? 42.5 : 0; // Placeholder
      const avgSessionDuration = 180; // Placeholder
      
      // Get traffic sources from referrer data
      const pageViews = await storage.getPageViews(days);
      const referrerCounts: Record<string, number> = {};
      
      pageViews.forEach(pv => {
        const referrer = pv.referrer || 'Direct';
        const source = referrer === 'Direct' ? 'Direct' :
                      referrer.includes('google') ? 'Google' :
                      referrer.includes('facebook') || referrer.includes('twitter') || referrer.includes('instagram') ? 'Social Media' :
                      'Referral';
        referrerCounts[source] = (referrerCounts[source] || 0) + 1;
      });
      
      const trafficSources = Object.entries(referrerCounts).map(([source, visits]) => ({
        source,
        visits,
        percentage: pageViewsCount > 0 ? Math.round((visits / pageViewsCount) * 100) : 0
      })).sort((a, b) => b.visits - a.visits);
      
      const stats = {
        pageViews: pageViewsCount,
        uniqueVisitors,
        bounceRate,
        avgSessionDuration,
        topPages,
        trafficSources,
      };
      
      res.json(stats);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Failed to fetch website analytics" });
    }
  });

  // Analytics metrics routes
  app.get("/api/analytics/metrics", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const clientId = req.query.clientId as string | undefined;
      const metrics = await storage.getAnalyticsMetrics(clientId);
      res.json(metrics);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Failed to fetch analytics metrics" });
    }
  });

  app.post("/api/analytics/metrics", isAuthenticated, requirePermission("canManageClients"), async (req: Request, res: Response) => {
    try {
      const validatedData = insertAnalyticsMetricSchema.parse(req.body);
      const metric = await storage.createAnalyticsMetric(validatedData);
      res.status(201).json(metric);
    } catch (error) {
      handleValidationError(error, res);
    }
  });

  app.delete("/api/analytics/metrics/:id", isAuthenticated, requirePermission("canManageClients"), async (req: Request, res: Response) => {
    try {
      await storage.deleteAnalyticsMetric(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Failed to delete analytics metric" });
    }
  });

  // Lead activity routes
  app.get("/api/leads/:leadId/activities", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const activities = await storage.getLeadActivities(req.params.leadId);
      res.json(activities);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Failed to fetch lead activities" });
    }
  });

  app.post("/api/leads/:leadId/activities", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = (req as any).userId;
      const validatedData = insertLeadActivitySchema.parse({
        ...req.body,
        leadId: req.params.leadId,
        userId,
      });
      const activity = await storage.createLeadActivity(validatedData);
      res.status(201).json(activity);
    } catch (error) {
      handleValidationError(error, res);
    }
  });

  // Lead automation routes
  app.get("/api/leads/:leadId/automations", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const automations = await storage.getLeadAutomations(req.params.leadId);
      res.json(automations);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Failed to fetch lead automations" });
    }
  });

  app.post("/api/leads/:leadId/automations", isAuthenticated, requirePermission("canManageLeads"), async (req: Request, res: Response) => {
    try {
      const validatedData = insertLeadAutomationSchema.parse({
        ...req.body,
        leadId: req.params.leadId,
      });
      const automation = await storage.createLeadAutomation(validatedData);
      res.status(201).json(automation);
    } catch (error) {
      handleValidationError(error, res);
    }
  });

  app.patch("/api/lead-automations/:id", isAuthenticated, requirePermission("canManageLeads"), async (req: Request, res: Response) => {
    try {
      const validatedData = insertLeadAutomationSchema.partial().parse(req.body);
      const automation = await storage.updateLeadAutomation(req.params.id, validatedData);
      res.json(automation);
    } catch (error) {
      handleValidationError(error, res);
    }
  });

  app.delete("/api/lead-automations/:id", isAuthenticated, requirePermission("canManageLeads"), async (req: Request, res: Response) => {
    try {
      await storage.deleteLeadAutomation(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Failed to delete lead automation" });
    }
  });

  // Duplicate /api/users route removed - already defined at line 2550

  app.post("/api/users", isAuthenticated, requirePermission("canManageUsers"), async (req: Request, res: Response) => {
    try {
      console.log("Creating user with data:", { username: req.body.username, role: req.body.role });
      
      const { hashPassword } = await import("./auth.js");
      const userData = {
        username: req.body.username,
        password: await hashPassword(req.body.password),
        role: req.body.role || "staff",
      };
      
      console.log("Hashed password, calling storage.createUser...");
      const user = await storage.createUser(userData);
      console.log("User created successfully:", user.id);
      
      // Notify all admins about new user registration
      try {
        const users = await storage.getUsers();
        const admins = users.filter(u => u.role === UserRole.ADMIN);
        const { sendPushToUser } = await import('./push.js');
        
        for (const admin of admins) {
          // In-app notification
          await storage.createNotification({
            userId: admin.id,
            type: 'info',
            title: '👤 New User Registered',
            message: `New user "${user.username}" (${user.role}) has been created`,
            category: 'user_management',
            actionUrl: '/team',
            isRead: false,
          });
          
          // Push notification
          await sendPushToUser(admin.id, {
            title: '👤 New User Registered',
            body: `New user "${user.username}" (${user.role}) has been created`,
            url: '/team',
          }).catch(err => console.error('Failed to send push notification:', err));
        }
        
        console.log(`✅ Notified ${admins.length} admin(s) about new user registration`);
      } catch (notifError) {
        console.error('Failed to send user registration notifications:', notifError);
      }
      
      // Don't send password hash
      const { password, ...sanitizedUser } = user;
      res.status(201).json(sanitizedUser);
    } catch (error: any) {
      console.error("User creation error:", error);
      console.error("Error details:", error?.message, error?.code);
      res.status(500).json({ message: error?.message || "Failed to create user" });
    }
  });

  app.patch("/api/users/:id", isAuthenticated, requirePermission("canManageUsers"), async (req: Request, res: Response) => {
    try {
      const { role } = req.body;
      const userId = parseInt(req.params.id);
      
      if (!role) {
        return res.status(400).json({ message: "Role is required" });
      }

      await storage.updateUser(userId, { role });
      res.json({ message: "User updated successfully" });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Failed to update user" });
    }
  });

  app.delete("/api/users/:id", isAuthenticated, requirePermission("canManageUsers"), async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.params.id);
      await storage.deleteUser(userId);
      res.status(204).send();
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Failed to delete user" });
    }
  });

  // Update own profile (any authenticated user can update their own profile)
  app.patch("/api/user/profile", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const currentUserId = (req.user as any).id;
      const { firstName, lastName, email, username } = req.body;
      
      // Check if username is being changed and if it's already taken
      if (username !== undefined) {
        const existingUser = await storage.getUserByUsername(username);
        if (existingUser && existingUser.id !== currentUserId) {
          return res.status(400).json({ message: "Username already taken" });
        }
      }
      
      const updateData: any = {};
      if (firstName !== undefined) updateData.firstName = firstName;
      if (lastName !== undefined) updateData.lastName = lastName;
      if (email !== undefined) updateData.email = email;
      if (username !== undefined) updateData.username = username;

      await storage.updateUser(currentUserId, updateData);
      
      // Fetch updated user
      const updatedUser = await storage.getUsers();
      const user = updatedUser.find(u => u.id === currentUserId);
      
      // Notify user about profile update
      try {
        await storage.createNotification({
          userId: currentUserId,
          type: 'success',
          title: '👤 Profile Updated',
          message: 'Your profile information has been successfully updated',
          category: 'user_management',
          actionUrl: '/settings',
          isRead: false,
        });
        
        // Notify all admins about profile update
        const users = await storage.getUsers();
        const admins = users.filter(u => u.role === UserRole.ADMIN);
        const { sendPushToUser } = await import('./push.js');
        
        for (const admin of admins) {
          await storage.createNotification({
            userId: admin.id,
            type: 'info',
            title: '👤 Profile Updated',
            message: `User "${user?.username}" updated their profile information`,
            category: 'user_management',
            actionUrl: '/team',
            isRead: false,
          });
          
          await sendPushToUser(admin.id, {
            title: '👤 Profile Updated',
            body: `User "${user?.username}" updated their profile information`,
            url: '/team',
          }).catch(err => console.error('Failed to send push notification:', err));
        }
        
        console.log(`✅ Notified user and ${admins.length} admin(s) about profile update`);
      } catch (notifError) {
        console.error('Failed to send profile update notifications:', notifError);
      }
      
      res.json({ message: "Profile updated successfully", user });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Failed to update profile" });
    }
  });

  // Change password endpoint
  app.post("/api/user/change-password", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const { comparePasswords } = await import('./auth.js');
      const { hashPassword } = await import('./auth.js');
      const currentUserId = (req.user as any).id;
      const { currentPassword, newPassword, confirmPassword } = req.body;

      // Validation
      if (!currentPassword || !newPassword || !confirmPassword) {
        return res.status(400).json({ message: "All fields are required" });
      }

      if (newPassword !== confirmPassword) {
        return res.status(400).json({ message: "New passwords do not match" });
      }

      if (newPassword.length < 6) {
        return res.status(400).json({ message: "Password must be at least 6 characters long" });
      }

      if (currentPassword === newPassword) {
        return res.status(400).json({ message: "New password must be different from current password" });
      }

      // Get current user
      const users = await storage.getUsers();
      const user = users.find(u => u.id === currentUserId);

      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Verify current password
      const isValid = await comparePasswords(currentPassword, user.password);
      if (!isValid) {
        return res.status(401).json({ message: "Current password is incorrect" });
      }

      // Hash new password
      const hashedPassword = await hashPassword(newPassword);

      // Update password
      await storage.updateUser(currentUserId, { password: hashedPassword });

      console.log(`✅ Password changed successfully for user: ${user.username}`);

      // Notify user about password change
      try {
        await storage.createNotification({
          userId: currentUserId,
          type: 'success',
          title: '🔐 Password Changed',
          message: 'Your password has been successfully changed',
          category: 'user_management',
          actionUrl: '/settings',
          isRead: false,
        });
        
        // Notify all admins about password change
        const users = await storage.getUsers();
        const admins = users.filter(u => u.role === UserRole.ADMIN);
        const { sendPushToUser } = await import('./push.js');
        
        for (const admin of admins) {
          await storage.createNotification({
            userId: admin.id,
            type: 'info',
            title: '🔐 Password Changed',
            message: `User "${user.username}" changed their password`,
            category: 'user_management',
            actionUrl: '/team',
            isRead: false,
          });
          
          await sendPushToUser(admin.id, {
            title: '🔐 Password Changed',
            body: `User "${user.username}" changed their password`,
            url: '/team',
          }).catch(err => console.error('Failed to send push notification:', err));
        }
        
        console.log(`✅ Notified user and ${admins.length} admin(s) about password change`);
      } catch (notifError) {
        console.error('Failed to send password change notifications:', notifError);
      }

      res.json({ message: "Password changed successfully" });
    } catch (error) {
      console.error("Password change error:", error);
      res.status(500).json({ message: "Failed to change password" });
    }
  });

  // Notifications routes
  app.get("/api/notifications", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const user = req.user as any;
      const userId = user?.id || user?.claims?.sub;
      
      console.log("🔔 Fetching notifications for user:", userId);
      
      const notifications = await storage.getNotifications(userId);
      console.log(`   Found ${notifications.length} notifications`);
      
      res.json(notifications);
    } catch (error: any) {
      console.error("❌ Error fetching notifications:", error);
      res.status(500).json({ message: "Failed to fetch notifications" });
    }
  });

  // Check and create notifications for due/overdue tasks
  app.post("/api/notifications/check-tasks", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const user = req.user as any;
      const userId = user?.id || user?.claims?.sub;
      
      const tasks = await storage.getTasks();
      const now = new Date();
      let notificationsCreated = 0;

      for (const task of tasks) {
        // Check tasks assigned to current user, created by them, or related to their client
        const isAssignedToUser = task.assignedToId === userId;
        const isCreatedByUser = task.createdBy === userId;
        const isClientTask = task.clientId && task.clientId === userId;
        
        if (!isAssignedToUser && !isCreatedByUser && !isClientTask) continue;
        
        // Skip completed tasks
        if (task.status === 'completed') continue;
        
        // Check if task has a due date
        if (!task.dueDate) continue;
        
        const dueDate = new Date(task.dueDate);
        const hoursDiff = (dueDate.getTime() - now.getTime()) / (1000 * 60 * 60);
        
        // Check if notification already exists for this task
        const existingNotifications = await storage.getNotifications(userId);
        const hasNotification = existingNotifications.some(
          n => n.message.includes(task.title) && !n.isRead
        );
        
        if (hasNotification) continue;
        
        // Past due (overdue)
        if (hoursDiff < 0) {
          const targetUserId = task.assignedToId || userId;
          
          // In-app notification
          await storage.createNotification({
            userId: targetUserId,
            type: 'error',
            title: '⏰ Task Overdue!',
            message: `Task "${task.title}" is overdue!`,
            category: 'deadline',
            actionUrl: `/tasks?taskId=${task.id}`,
          });
          
          // Push notification
          const { sendPushToUser } = await import('./push.js');
          await sendPushToUser(targetUserId, {
            title: '🚨 Task Overdue!',
            body: `"${task.title}" is overdue!`,
            url: `/tasks?taskId=${task.id}`,
          }).catch(err => console.error('Failed to send push notification:', err));
          
          notificationsCreated++;
        }
        // Due within 24 hours
        else if (hoursDiff <= 24 && hoursDiff > 0) {
          const targetUserId = task.assignedToId || userId;
          
          // In-app notification
          await storage.createNotification({
            userId: targetUserId,
            type: 'warning',
            title: '⚠️ Task Due Soon',
            message: `Task "${task.title}" is due in ${Math.round(hoursDiff)} hours`,
            category: 'deadline',
            actionUrl: `/tasks?taskId=${task.id}`,
          });
          
          // Push notification
          const { sendPushToUser } = await import('./push.js');
          await sendPushToUser(targetUserId, {
            title: '⏰ Task Due Soon',
            body: `"${task.title}" is due in ${Math.round(hoursDiff)} hours`,
            url: `/tasks?taskId=${task.id}`,
          }).catch(err => console.error('Failed to send push notification:', err));
          
          notificationsCreated++;
        }
      }
      
      res.json({ 
        message: "Task notifications checked", 
        notificationsCreated
      });
    } catch (error) {
      console.error('Error checking task notifications:', error);
      res.status(500).json({ message: "Failed to check task notifications" });
    }
  });

  app.patch("/api/notifications/:id/read", isAuthenticated, async (req: Request, res: Response) => {
    try {
      await storage.markNotificationAsRead(req.params.id);
      res.json({ message: "Notification marked as read" });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Failed to mark notification as read" });
    }
  });

  app.patch("/api/notifications/read-all", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = (req as any).userId;
      await storage.markAllNotificationsAsRead(userId);
      res.json({ message: "All notifications marked as read" });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Failed to mark all notifications as read" });
    }
  });

  // Create a test notification (for testing purposes)
  app.post("/api/notifications/test", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const user = req.user as any;
      const userId = user?.id || user?.claims?.sub;
      
      await storage.createNotification({
        userId,
        type: 'info',
        title: '🎉 Test Notification',
        message: 'This is a test notification to verify the system is working!',
        category: 'general',
      });
      
      res.json({ message: "Test notification created" });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Failed to create test notification" });
    }
  });

  app.delete("/api/notifications/:id", isAuthenticated, async (req: Request, res: Response) => {
    try {
      await storage.deleteNotification(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Failed to delete notification" });
    }
  });

  // Push Subscription routes
  app.get("/api/push/vapid-public-key", (_req: Request, res: Response) => {
    const publicKey = process.env.VAPID_PUBLIC_KEY;
    console.log('🔑 VAPID Public Key requested:', publicKey ? 'Present' : 'Missing');
    res.json({ publicKey: publicKey || '' });
  });

  // Debug endpoint for checking user's push notification status
  app.get("/api/push/debug-status", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = (req.user as any).id;
      const user = await storage.getUser(String(userId));
      
      // Get push subscriptions
      const subscriptions = await pool.query(
        'SELECT id, endpoint, created_at FROM push_subscriptions WHERE user_id = $1',
        [userId]
      );
      
      // Get notification preferences
      const preferences = await pool.query(
        'SELECT * FROM user_notification_preferences WHERE user_id = $1',
        [userId]
      );
      
      // Get recent notifications
      const recentNotifications = await pool.query(
        `SELECT title, message, type, category, created_at, is_read 
         FROM notifications 
         WHERE user_id = $1 
         ORDER BY created_at DESC 
         LIMIT 5`,
        [userId]
      );
      
      res.json({
        user: {
          id: user?.id,
          username: user?.username,
          role: user?.role,
          name: `${user?.firstName || ''} ${user?.lastName || ''}`.trim()
        },
        pushSubscriptions: {
          count: subscriptions.rows.length,
          subscriptions: subscriptions.rows.map(sub => ({
            id: sub.id,
            endpoint: sub.endpoint.substring(0, 50) + '...',
            created: sub.created_at
          }))
        },
        notificationPreferences: preferences.rows[0] || 'using_defaults',
        recentNotifications: recentNotifications.rows,
        vapidConfigured: !!(process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY),
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error in debug-status:', error);
      res.status(500).json({ error: 'Failed to get debug status' });
    }
  });

  // Emergency push subscription cleanup endpoint
  app.post("/api/push/emergency-cleanup", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = (req.user as any).id;
      const user = await storage.getUser(String(userId));

      console.log(`🚨 Emergency cleanup for user ${userId} (${user?.username})`);

      // Delete ALL push subscriptions for this user
      const deleteResult = await pool.query(
        'DELETE FROM push_subscriptions WHERE user_id = $1',
        [userId]
      );

      console.log(`🗑️ Deleted ${deleteResult.rowCount} subscriptions for user ${userId}`);

      // Also clean up any orphaned subscriptions (optional - be careful)
      const orphanedResult = await pool.query(
        'DELETE FROM push_subscriptions WHERE user_id NOT IN (SELECT id FROM users)'
      );

      console.log(`🧹 Cleaned up ${orphanedResult.rowCount} orphaned subscriptions`);

      res.json({
        success: true,
        deletedSubscriptions: deleteResult.rowCount,
        cleanedOrphaned: orphanedResult.rowCount,
        message: "All push subscriptions cleared. Please re-subscribe."
      });
    } catch (error) {
      console.error('Emergency cleanup error:', error);
      res.status(500).json({ message: "Failed to cleanup subscriptions", error: error.message });
    }
  });

  app.post("/api/push/subscribe", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const user = req.user as any;
      const userId = user?.id || user?.claims?.sub;
      const { subscription } = req.body;

      if (!subscription || !subscription.endpoint) {
        return res.status(400).json({ message: "Invalid subscription" });
      }

      // Check if this endpoint is already registered to a DIFFERENT user
      const existingSubscription = await pool.query(
        'SELECT user_id FROM push_subscriptions WHERE endpoint = $1',
        [subscription.endpoint]
      );

      if (existingSubscription.rows.length > 0) {
        const existingUserId = existingSubscription.rows[0].user_id;
        
        if (existingUserId !== userId) {
          // Account switch detected! Delete the old subscription first
          console.log(`⚠️ Account switch detected: endpoint was for user ${existingUserId}, now subscribing for user ${userId}`);
          await pool.query('DELETE FROM push_subscriptions WHERE endpoint = $1', [subscription.endpoint]);
        }
      }

      // Store subscription in database
      await pool.query(
        `INSERT INTO push_subscriptions (user_id, endpoint, p256dh, auth)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (endpoint) DO UPDATE
         SET user_id = $1, p256dh = $3, auth = $4, updated_at = NOW()`,
        [userId, subscription.endpoint, subscription.keys.p256dh, subscription.keys.auth]
      );

      console.log(`✅ Push subscription saved for user ${userId}`);
      res.json({ success: true });
    } catch (error) {
      console.error('Error saving push subscription:', error);
      res.status(500).json({ message: "Failed to save subscription" });
    }
  });

  app.post("/api/push/unsubscribe", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const { endpoint } = req.body;

      if (!endpoint) {
        return res.status(400).json({ message: "Endpoint required" });
      }

      await pool.query('DELETE FROM push_subscriptions WHERE endpoint = $1', [endpoint]);

      res.json({ success: true });
    } catch (error) {
      console.error('Error removing push subscription:', error);
      res.status(500).json({ message: "Failed to remove subscription" });
    }
  });

  // Send push notification (Admin only)
  app.post("/api/push/send", isAuthenticated, requireRole(UserRole.ADMIN), async (req: Request, res: Response) => {
    try {
      const { sendPushToUser, sendPushToRole, broadcastPush } = await import('./push.js');
      const { userId, role, title, body, url, broadcast } = req.body;
      const user = req.user as any;

      if (!title || !body) {
        return res.status(400).json({ message: "Title and body required" });
      }

      let targetType: string;
      let targetValue: string | null = null;
      let recipientCount = 0;

      // Determine target type and count recipients
      if (broadcast) {
        targetType = "broadcast";
        // Count all users with push subscriptions
        const result = await db.execute(sql`SELECT COUNT(DISTINCT user_id) as count FROM push_subscriptions`);
        recipientCount = Number(result.rows[0]?.count || 0);
        await broadcastPush({ title, body, url });
      } else if (userId) {
        targetType = "user";
        targetValue = String(userId);
        // Count subscriptions for this user
        const result = await db.execute(sql`SELECT COUNT(*) as count FROM push_subscriptions WHERE user_id = ${userId}`);
        recipientCount = Number(result.rows[0]?.count || 0);
        await sendPushToUser(userId, { title, body, url });
      } else if (role) {
        targetType = "role";
        targetValue = role;
        // Count users with this role that have push subscriptions
        const result = await db.execute(sql`
          SELECT COUNT(DISTINCT ps.user_id) as count 
          FROM push_subscriptions ps
          JOIN users u ON u.id = ps.user_id
          WHERE u.role = ${role}
        `);
        recipientCount = Number(result.rows[0]?.count || 0);
        await sendPushToRole(role, { title, body, url });
      } else {
        return res.status(400).json({ message: "Must specify userId, role, or broadcast" });
      }

      // Save to push notification history
      try {
        console.log('💾 Saving push notification history:', {
          title,
          body,
          url: url || null,
          targetType,
          targetValue,
          sentBy: user?.id || user?.claims?.sub || null,
          recipientCount,
          successful: true,
        });
        
        const historyRecord = await storage.createPushNotificationHistory({
          title,
          body,
          url: url || null,
          targetType,
          targetValue,
          sentBy: user?.id || user?.claims?.sub || null,
          recipientCount,
          successful: true,
        });
        
        console.log('✅ Push notification history saved:', historyRecord);
      } catch (historyError) {
        console.error('❌ Failed to save push notification history:', historyError);
        console.error('History error details:', {
          message: historyError?.message,
          stack: historyError?.stack,
        });
        // Don't fail the request if history saving fails
      }

      res.json({ success: true, recipientCount });
    } catch (error: any) {
      console.error('❌ Error sending push notification:', error);
      console.error('Error details:', {
        message: error?.message,
        stack: error?.stack,
      });
      
      // Try to save failed notification to history
      try {
        const { userId, role, title, body, url, broadcast } = req.body;
        const user = req.user as any;
        
        let targetType: string = broadcast ? "broadcast" : (userId ? "user" : "role");
        let targetValue: string | null = userId ? String(userId) : (role || null);
        
        await storage.createPushNotificationHistory({
          title: title || "Unknown",
          body: body || "Unknown",
          url: url || null,
          targetType,
          targetValue,
          sentBy: user?.id || user?.claims?.sub || null,
          recipientCount: 0,
          successful: false,
          errorMessage: error instanceof Error ? error.message : "Unknown error",
        });
      } catch (historyError) {
        console.error('Failed to save push notification history:', historyError);
      }
      
      const errorMessage = error?.message || "Failed to send push notification";
      res.status(500).json({ 
        message: errorMessage,
        error: process.env.NODE_ENV === 'development' ? error?.stack : undefined
      });
    }
  });

  // Get push notification history (Admin only)
  app.get("/api/push/history", isAuthenticated, requireRole(UserRole.ADMIN, UserRole.MANAGER, UserRole.STAFF), async (_req: Request, res: Response) => {
    try {
      console.log('📋 Fetching push notification history...');
      const history = await storage.getPushNotificationHistory();
      console.log('📋 History fetched:', history.length, 'records');
      res.json(history);
    } catch (error) {
      console.error('❌ Error fetching push notification history:', error);
      res.status(500).json({ message: "Failed to fetch push notification history" });
    }
  });

  // Test push notification history table
  app.get("/api/push/test-history", isAuthenticated, requireRole(UserRole.ADMIN), async (req: Request, res: Response) => {
    try {
      console.log('🧪 Testing push notification history table...');
      
      // Try to create a test record
      const testRecord = await storage.createPushNotificationHistory({
        title: "Test Notification",
        body: "This is a test to verify the history table works",
        url: "/test",
        targetType: "broadcast",
        targetValue: null,
        sentBy: (req.user as any)?.id || 1,
        recipientCount: 1,
        successful: true,
      });
      
      console.log('✅ Test record created:', testRecord);
      
      // Try to fetch all records
      const allRecords = await storage.getPushNotificationHistory();
      console.log('✅ All records fetched:', allRecords.length);
      
      res.json({ 
        success: true, 
        testRecord, 
        totalRecords: allRecords.length,
        message: "Push notification history table is working correctly"
      });
    } catch (error) {
      console.error('❌ Error testing push notification history:', error);
      res.status(500).json({ 
        success: false, 
        error: error.message,
        message: "Push notification history table test failed"
      });
    }
  });

  // Activity logs routes (Admin only) - DISABLED DUE TO DATABASE ISSUES
  app.get("/api/activity-logs", isAuthenticated, requirePermission("canViewReports"), async (req: Request, res: Response) => {
    try {
      // Return empty array instead of querying broken notifications table
      const activityLogs: any[] = [];
      res.json(activityLogs);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Failed to fetch activity logs" });
    }
  });

  // One-time database migration endpoint (Admin only)
  app.post("/api/admin/run-migration", isAuthenticated, requireRole(UserRole.ADMIN), async (_req: Request, res: Response) => {
    try {
      const { db } = await import("./db.js");
      
      // Add missing columns
      await db.execute(`ALTER TABLE users ADD COLUMN IF NOT EXISTS email TEXT`);
      await db.execute(`ALTER TABLE users ADD COLUMN IF NOT EXISTS first_name TEXT`);
      await db.execute(`ALTER TABLE users ADD COLUMN IF NOT EXISTS last_name TEXT`);
      await db.execute(`ALTER TABLE clients ADD COLUMN IF NOT EXISTS display_order INTEGER DEFAULT 0`);
      
      res.json({ 
        success: true, 
        message: "Database migration completed successfully! Added email, first_name, last_name to users and display_order to clients." 
      });
    } catch (error: any) {
      console.error("Migration error:", error);
      res.status(500).json({ 
        success: false, 
        message: "Migration failed", 
        error: error?.message 
      });
    }
  });

  // Role Permissions routes
  app.get("/api/role-permissions", isAuthenticated, requireRole(UserRole.ADMIN), async (_req: Request, res: Response) => {
    try {
      const permissions = await storage.getAllRolePermissions();
      res.json(permissions);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Failed to fetch role permissions" });
    }
  });

  app.get("/api/role-permissions/:role", isAuthenticated, requireRole(UserRole.ADMIN), async (req: Request, res: Response) => {
    try {
      const permissions = await storage.getRolePermissions(req.params.role);
      res.json(permissions);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Failed to fetch role permissions" });
    }
  });

  app.put("/api/role-permissions/:role", isAuthenticated, requireRole(UserRole.ADMIN), async (req: Request, res: Response) => {
    try {
      const permissions = await storage.updateRolePermissions(req.params.role, req.body.permissions);
      res.json(permissions);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Failed to update role permissions" });
    }
  });

  // Stripe routes
  app.get("/api/stripe/dashboard", isAuthenticated, requireRole(UserRole.ADMIN), async (req: Request, res: Response) => {
    try {
      const { startDate, endDate } = req.query;
      const start = startDate ? new Date(startDate as string) : undefined;
      const end = endDate ? new Date(endDate as string) : undefined;
      
      const { getStripeDashboardMetrics } = await import("./stripeService.js");
      const metrics = await getStripeDashboardMetrics(start, end);
      res.json(metrics);
    } catch (error: any) {
      console.error("Stripe dashboard error:", error);
      res.status(500).json({ message: error.message || "Failed to fetch Stripe data" });
    }
  });

  app.get("/api/stripe/customers", isAuthenticated, requireRole(UserRole.ADMIN), async (_req: Request, res: Response) => {
    try {
      const { getStripeCustomers } = await import("./stripeService.js");
      const customers = await getStripeCustomers();
      res.json(customers);
    } catch (error: any) {
      console.error("Stripe customers error:", error);
      res.status(500).json({ message: error.message || "Failed to fetch Stripe customers" });
    }
  });

  app.post("/api/stripe/invoices", isAuthenticated, requireRole(UserRole.ADMIN), async (req: Request, res: Response) => {
    try {
      const { customerId, items } = req.body;
      const { createStripeInvoice } = await import("./stripeService.js");
      const invoice = await createStripeInvoice(customerId, items);
      res.json(invoice);
    } catch (error: any) {
      console.error("Stripe invoice creation error:", error);
      res.status(500).json({ message: error.message || "Failed to create invoice" });
    }
  });

  app.get("/api/stripe/balance", isAuthenticated, requireRole(UserRole.ADMIN), async (_req: Request, res: Response) => {
    try {
      const { getStripeBalance } = await import("./stripeService.js");
      const balance = await getStripeBalance();
      res.json(balance);
    } catch (error: any) {
      console.error("Stripe balance error:", error);
      res.status(500).json({ message: error.message || "Failed to fetch Stripe balance" });
    }
  });

  // Subscription Packages routes
  app.get("/api/subscription-packages", async (_req: Request, res: Response) => {
    try {
      const packages = await storage.getActiveSubscriptionPackages();
      res.json(packages);
    } catch (error) {
      console.error("Error fetching packages:", error);
      res.status(500).json({ message: "Failed to fetch subscription packages" });
    }
  });

  // Instagram Analytics endpoints
  app.get("/api/instagram/analytics", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const user = req.user as any;
      const clientId = user?.clientId;

      if (!clientId) {
        return res.status(400).json({ message: "Client ID required" });
      }

      // Get client's Instagram connection info
      const client = await storage.getClient(clientId);
      if (!client) {
        return res.status(404).json({ message: "Client not found" });
      }

      let instagramData = null;

      // Try to get data from connected Instagram account first
      // Note: Instagram OAuth integration would require additional schema fields:
      // instagramAccessToken, instagramUserId, instagramConnectedAt
      // For now, we'll use public scraping only

      // Fallback to scraping public data
      const socialLinks = client.socialLinks as any;
      if (socialLinks?.instagram) {
        try {
          const username = socialLinks.instagram.split('/').pop()?.replace('@', '');
          if (username) {
            console.log(`🔍 Scraping public Instagram data for @${username}`);
            instagramData = await InstagramService.scrapePublicData(username);
          }
        } catch (error) {
          console.error('Failed to scrape Instagram data:', error);
        }
      }

      // Return mock data if no Instagram connection
      if (!instagramData) {
        instagramData = {
          followers: 0,
          following: 0,
          posts: 0,
          engagement_rate: 0,
          reach: 0,
          impressions: 0,
          profile_views: 0,
          website_clicks: 0,
          email_contacts: 0,
          phone_calls: 0,
          direction_clicks: 0,
          text_message_clicks: 0,
        };
      }

      const clientSocialLinks = client.socialLinks as any;
      res.json({
        platform: 'instagram',
        connected: false, // OAuth not implemented
        username: clientSocialLinks?.instagram?.split('/').pop()?.replace('@', '') || null,
        metrics: instagramData,
        lastUpdated: new Date().toISOString(),
      });
    } catch (error) {
      console.error("Error fetching Instagram analytics:", error);
      res.status(500).json({ message: "Failed to fetch Instagram analytics" });
    }
  });

  app.get("/api/instagram/posts", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const user = req.user as any;
      const clientId = user?.clientId;
      const limit = parseInt(req.query.limit as string) || 12;

      if (!clientId) {
        return res.status(400).json({ message: "Client ID required" });
      }

      const client = await storage.getClient(clientId);
      if (!client) {
        return res.status(404).json({ message: "Client not found" });
      }

      let posts: any[] = [];

      // Try to get posts from connected Instagram account
      // Note: Instagram OAuth integration not yet implemented
      // Would require instagramAccessToken and instagramUserId fields in schema
      const postsSocialLinks = client.socialLinks as any;
      if (postsSocialLinks?.instagram) {
        // Future: Implement OAuth flow to get posts
        // For now, return empty posts array
      }

      res.json({
        platform: 'instagram',
        connected: false, // OAuth not yet implemented
        posts,
        total: posts.length,
      });
    } catch (error) {
      console.error("Error fetching Instagram posts:", error);
      res.status(500).json({ message: "Failed to fetch Instagram posts" });
    }
  });

  // Instagram OAuth endpoints
  app.get("/api/instagram/auth", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const user = req.user as any;
      const clientId = user?.clientId;

      if (!clientId) {
        return res.status(400).json({ message: "Client ID required" });
      }

      const instagramClientId = process.env.INSTAGRAM_CLIENT_ID;
      const redirectUri = `${req.protocol}://${req.get('host')}/api/instagram/callback`;

      if (!instagramClientId) {
        console.log("⚠️ Instagram OAuth not configured - missing INSTAGRAM_CLIENT_ID");
        return res.redirect('/client-analytics?error=instagram_not_configured');
      }

      const authUrl = InstagramService.getAuthUrl(
        instagramClientId,
        redirectUri,
        clientId // Use clientId as state
      );

      res.redirect(authUrl);
    } catch (error) {
      console.error("Error initiating Instagram auth:", error);
      res.redirect('/client-analytics?error=instagram_auth_failed');
    }
  });

  app.get("/api/instagram/callback", async (req: Request, res: Response) => {
    try {
      const { code, state } = req.query;
      
      if (!code || !state) {
        console.log("⚠️ Instagram callback missing code or state");
        return res.redirect('/client-analytics?error=missing_params');
      }

      const clientId = state as string;
      const instagramClientId = process.env.INSTAGRAM_CLIENT_ID;
      const instagramClientSecret = process.env.INSTAGRAM_CLIENT_SECRET;
      const redirectUri = `${req.protocol}://${req.get('host')}/api/instagram/callback`;

      if (!instagramClientId || !instagramClientSecret) {
        console.log("⚠️ Instagram OAuth not configured - missing credentials");
        return res.redirect('/client-analytics?error=instagram_not_configured');
      }

      // Exchange code for access token
      const tokenData = await InstagramService.getAccessToken(
        instagramClientId,
        instagramClientSecret,
        code as string,
        redirectUri
      );

      // Update client with Instagram connection
      // Note: Instagram OAuth fields not yet in schema (instagramAccessToken, instagramUserId, instagramConnectedAt)
      // For now, just log the successful connection
      // TODO: Add these fields to the clients table schema if needed:
      // - instagramAccessToken (text)
      // - instagramUserId (text)
      // - instagramConnectedAt (timestamp)

      console.log(`✅ Instagram connected successfully for client ${clientId}`, {
        userId: tokenData.user_id,
        // Token stored in memory only for now
      });
      // Redirect back to analytics page with success message
      res.redirect('/client-analytics?instagram=connected');
    } catch (error) {
      console.error("Error in Instagram callback:", error);
      res.redirect('/client-analytics?error=instagram_auth_failed');
    }
  });

  app.get("/api/admin/subscription-packages", isAuthenticated, requireRole(UserRole.ADMIN), async (_req: Request, res: Response) => {
    try {
      const packages = await storage.getSubscriptionPackages();
      res.json(packages);
    } catch (error) {
      console.error("Error fetching packages:", error);
      res.status(500).json({ message: "Failed to fetch subscription packages" });
    }
  });

  app.post("/api/admin/subscription-packages", isAuthenticated, requireRole(UserRole.ADMIN), async (req: Request, res: Response) => {
    try {
      const pkg = await storage.createSubscriptionPackage(req.body);
      res.status(201).json(pkg);
    } catch (error) {
      console.error("Error creating package:", error);
      res.status(500).json({ message: "Failed to create subscription package" });
    }
  });

  app.patch("/api/admin/subscription-packages/:id", isAuthenticated, requireRole(UserRole.ADMIN), async (req: Request, res: Response) => {
    try {
      const pkg = await storage.updateSubscriptionPackage(req.params.id, req.body);
      res.json(pkg);
    } catch (error) {
      console.error("Error updating package:", error);
      res.status(500).json({ message: "Failed to update subscription package" });
    }
  });

  app.delete("/api/admin/subscription-packages/:id", isAuthenticated, requireRole(UserRole.ADMIN), async (req: Request, res: Response) => {
    try {
      await storage.deleteSubscriptionPackage(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting package:", error);
      res.status(500).json({ message: "Failed to delete subscription package" });
    }
  });

  // Object storage routes
  app.get("/api/upload-url", isAuthenticated, async (_req: Request, res: Response) => {
    try {
      const uploadUrl = await objectStorageService.getObjectEntityUploadURL();
      res.json({ uploadUrl });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Failed to generate upload URL" });
    }
  });

  app.get("/objects/*", async (req: Request, res: Response) => {
    try {
      const objectPath = `/${req.params[0]}`;
      const objectFile = await objectStorageService.getObjectEntityFile(objectPath);
      
      const user = req.user as any;
      const userId = user?.claims?.sub;

      const canAccess = await objectStorageService.canAccessObjectEntity({
        userId,
        objectFile,
      });

      if (!canAccess) {
        return res.status(403).json({ message: "Access denied" });
      }

      await objectStorageService.downloadObject(objectFile, res);
    } catch (error) {
      console.error(error);
      res.status(404).json({ message: "Object not found" });
    }
  });

  // ====================================
  // Second Me Routes
  // ====================================

  // Client: Get their Second Me status
  app.get("/api/second-me", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const user = req.user as any;
      const userId = user?.id || user?.claims?.sub;

      // Get user to find clientId
      const userRecord = await storage.getUser(userId.toString());
      if (!userRecord || !userRecord.clientId) {
        return res.status(404).json({ message: "No client record found" });
      }

      const secondMeRecord = await storage.getSecondMe(userRecord.clientId);
      res.json(secondMeRecord || null);
    } catch (error) {
      console.error('Second Me fetch error:', error);
      // Return null if table doesn't exist yet (during migration)
      res.json(null);
    }
  });

  // Client: Create Second Me request (onboarding with character data)
  app.post("/api/second-me", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const user = req.user as any;
      const userId = user?.id || user?.claims?.sub;

      // Get user to find clientId
      const userRecord = await storage.getUser(userId.toString());
      if (!userRecord || !userRecord.clientId) {
        return res.status(400).json({ message: "No client record found" });
      }

      const { 
        photos, 
        characterName, 
        vibe, 
        mission, 
        storyWords, 
        topics, 
        personalityType,
        dreamCollab,
        catchphrase,
        targetAudience,
        contentStyle,
        bio
      } = req.body;

      // Allow test data for quick onboarding
      if (!characterName) {
        return res.status(400).json({ message: "Character name is required" });
      }

      const secondMeRecord = await storage.createSecondMe({
        clientId: userRecord.clientId,
        photoUrls: photos, // Use photos from form
        characterName,
        vibe,
        mission,
        storyWords,
        topics: JSON.stringify(topics || []),
        personalityType,
        dreamCollab,
        catchphrase,
        targetAudience,
        contentStyle,
        bio,
        status: "pending",
        setupPaid: true, // FREE FOR TESTING
        weeklySubscriptionActive: true, // FREE FOR TESTING
      });

      res.status(201).json(secondMeRecord);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Failed to create Second Me request" });
    }
  });

  // Client: Get character profile
  app.get("/api/second-me/character", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const user = req.user as any;
      const userId = user?.id || user?.claims?.sub;

      // Get user to find clientId
      const userRecord = await storage.getUser(userId.toString());
      if (!userRecord || !userRecord.clientId) {
        return res.status(404).json({ message: "No client record found" });
      }

      const secondMeRecord = await storage.getSecondMe(userRecord.clientId);
      
      if (!secondMeRecord) {
        return res.json(null);
      }

      // Parse topics if stored as JSON string
      const character = {
        ...secondMeRecord,
        topics: typeof secondMeRecord.topics === 'string' 
          ? JSON.parse(secondMeRecord.topics) 
          : secondMeRecord.topics || [],
        photos: secondMeRecord.photoUrls || [],
      };

      res.json(character);
    } catch (error) {
      console.error('Character fetch error:', error);
      res.json(null);
    }
  });

  // Client: Get AI-generated content
  app.get("/api/second-me/content", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const user = req.user as any;
      const userId = user?.id || user?.claims?.sub;

      // Get user to find clientId
      const userRecord = await storage.getUser(userId.toString());
      if (!userRecord || !userRecord.clientId) {
        return res.status(404).json({ message: "No client record found" });
      }

      const content = await storage.getSecondMeContentByClientId(userRecord.clientId.toString());
      
      // Transform to match frontend interface
      const transformedContent = content.map(item => ({
        id: item.id,
        title: item.caption || `AI Content ${item.id}`,
        type: item.contentType as "image" | "video",
        url: item.mediaUrl,
        thumbnail: item.mediaUrl, // Use same URL for thumbnail for now
        createdAt: item.createdAt,
        description: item.caption,
      }));
      
      res.json(transformedContent);
    } catch (error) {
      console.error('Content fetch error:', error);
      res.json([]);
    }
  });

  // Admin: Get all Second Me requests
  app.get("/api/admin/second-me/requests", isAuthenticated, requireRole(UserRole.ADMIN, UserRole.STAFF), async (_req: Request, res: Response) => {
    try {
      const requests = await storage.getAllSecondMeRequests();
      
      // Join with client data to get client names
      const requestsWithClientNames = await Promise.all(
        requests.map(async (request) => {
          const client = await storage.getClient(request.clientId);
          return {
            ...request,
            clientName: client?.name || "Unknown Client",
          };
        })
      );

      res.json(requestsWithClientNames);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Failed to fetch Second Me requests" });
    }
  });

  // Admin: Update Second Me request (set avatar, status, etc.)
  app.patch("/api/admin/second-me/:id", isAuthenticated, requireRole(UserRole.ADMIN, UserRole.STAFF), async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { status, avatarUrl, notes, setupPaid, weeklySubscriptionActive } = req.body;

      const updateData: any = {};
      if (status) updateData.status = status;
      if (avatarUrl !== undefined) updateData.avatarUrl = avatarUrl;
      if (notes !== undefined) updateData.notes = notes;
      if (setupPaid !== undefined) updateData.setupPaid = setupPaid;
      if (weeklySubscriptionActive !== undefined) updateData.weeklySubscriptionActive = weeklySubscriptionActive;

      const updated = await storage.updateSecondMe(id, updateData);
      res.json(updated);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Failed to update Second Me request" });
    }
  });

  // Admin: Upload weekly content for a Second Me avatar
  app.post("/api/admin/second-me/content", isAuthenticated, requireRole(UserRole.ADMIN, UserRole.STAFF), async (req: Request, res: Response) => {
    try {
      const { secondMeId, content } = req.body;

      if (!secondMeId || !content || !Array.isArray(content)) {
        return res.status(400).json({ message: "Invalid request data" });
      }

      // Get the Second Me record to find clientId
      const secondMeRecord = await storage.getSecondMeById(secondMeId);
      if (!secondMeRecord) {
        return res.status(404).json({ message: "Second Me record not found" });
      }

      // Determine the week number (simple increment based on existing content)
      const existingContent = await storage.getSecondMeContent(secondMeId);
      const maxWeek = existingContent.reduce((max, item) => Math.max(max, item.weekNumber || 0), 0);
      const nextWeek = maxWeek + 1;

      // Create content entries
      const contentToInsert = content.map((item: any) => ({
        secondMeId,
        clientId: secondMeRecord.clientId,
        contentType: item.contentType || "image",
        mediaUrl: item.mediaUrl,
        caption: item.caption || "",
        weekNumber: nextWeek,
        status: "pending",
      }));

      const created = await storage.createBulkSecondMeContent(contentToInsert);
      res.status(201).json(created);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Failed to upload content" });
    }
  });

  // Client: Get their Second Me content
  app.get("/api/second-me/content", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const user = req.user as any;
      const userId = user?.id || user?.claims?.sub;

      // Get user to find clientId
      const userRecord = await storage.getUser(userId.toString());
      if (!userRecord || !userRecord.clientId) {
        return res.status(404).json({ message: "No client record found" });
      }

      const secondMeRecord = await storage.getSecondMe(userRecord.clientId);
      if (!secondMeRecord) {
        return res.json([]);
      }

      const content = await storage.getSecondMeContent(secondMeRecord.id);
      res.json(content);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Failed to fetch Second Me content" });
    }
  });

  // ============================================
  // DIALPAD API ROUTES
  // ============================================

  // Test Dialpad connection
  // Manual database fix endpoint (ADMIN ONLY)
  app.post("/api/admin/fix-database", isAuthenticated, requireRole(UserRole.ADMIN), async (req: Request, res: Response) => {
    try {
      const pg = await import('pg');
      const { Pool } = pg.default;
      
      console.log('🔧 Running manual database fixes with raw PostgreSQL...');
      
      const pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
      });
      
      const client = await pool.connect();
      
      try {
        // Execute raw SQL to add missing columns
        await client.query(`ALTER TABLE notifications ADD COLUMN IF NOT EXISTS type VARCHAR DEFAULT 'info'`);
        console.log('✅ Added type column');
        
        await client.query(`ALTER TABLE notifications ADD COLUMN IF NOT EXISTS category VARCHAR DEFAULT 'general'`);
        console.log('✅ Added category column');
        
        await client.query(`ALTER TABLE notifications ADD COLUMN IF NOT EXISTS action_url VARCHAR`);
        console.log('✅ Added action_url column');
        
        client.release();
        await pool.end();
        
        console.log('✅ Database fixes applied successfully!');
        
        res.json({ 
          success: true, 
          message: 'Database columns added successfully. Refresh your dashboard now!' 
        });
      } catch (error: any) {
        client.release();
        await pool.end();
        throw error;
      }
    } catch (error: any) {
      console.error('❌ Database fix failed:', error);
      res.status(500).json({ 
        success: false, 
        message: error.message,
        details: error.toString()
      });
    }
  });

  app.get("/api/test-dialpad", async (req: Request, res: Response) => {
    try {
      if (!process.env.DIALPAD_API_KEY) {
        console.log("❌ DIALPAD_API_KEY not found in environment");
        return res.status(503).json({ 
          success: false,
          connected: false,
          message: "Dialpad API is not configured. Please add DIALPAD_API_KEY to your environment variables." 
        });
      }

      console.log("🔍 Testing Dialpad connection...");
      console.log("🔑 API Key present: Yes (length:", process.env.DIALPAD_API_KEY.length, ")");
      console.log("🔑 API Key starts with:", process.env.DIALPAD_API_KEY.substring(0, 10) + "...");

      // Test with a simple calls endpoint (we know this exists)
      const response = await fetch("https://api.dialpad.com/v2/calls?limit=1", {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.DIALPAD_API_KEY}`,
        },
      });

      const responseText = await response.text();
      console.log("📡 Dialpad API Response Status:", response.status);
      console.log("📡 Dialpad API Response Headers:", Object.fromEntries(response.headers.entries()));
      console.log("📡 Dialpad API Response Body:", responseText.substring(0, 500));

      if (!response.ok) {
        console.error("❌ Dialpad connection failed:", response.status);
        
        // Notify admins about Dialpad connection failure
        try {
          await notifyAdminsAboutIntegration(
            '📞 Dialpad Connection Failed',
            `Dialpad API connection failed with status ${response.status}. ${response.status === 401 ? 'API Key may be invalid or expired.' : 'Unknown error occurred.'}`,
            'integration'
          );
        } catch (notifError) {
          console.error('Failed to send integration notification:', notifError);
        }
        
        return res.status(response.status).json({ 
          success: false,
          connected: false,
          message: "Dialpad connection failed", 
          error: responseText,
          status: response.status,
          hint: response.status === 401 ? "API Key is invalid or expired. Please check your Dialpad API key." : "Unknown error",
        });
      }

      const data = JSON.parse(responseText);
      console.log("✅ Connected to Dialpad! Retrieved", data.items?.length || 0, "call records");

      res.json({
        success: true,
        connected: true,
        message: "✅ Connected to Dialpad successfully!",
        endpoint: "/api/v2/calls",
        recordsRetrieved: data.items?.length || 0,
        apiKeyValid: true,
        timestamp: new Date().toISOString(),
      });
    } catch (error: any) {
      console.error("❌ Dialpad connection error:", error.message);
      console.error("❌ Full error:", error);
      res.status(500).json({ 
        success: false, 
        connected: false,
        error: error.message,
        details: error.toString(),
      });
    }
  });

  // Get call logs
  app.get("/api/dialpad/calls", isAuthenticated, async (req: Request, res: Response) => {
    try {
      if (!dialpadService) {
        return res.status(503).json({ message: "Dialpad API is not configured. Please add DIALPAD_API_KEY to your environment variables." });
      }

      const { start_time, end_time, limit, offset } = req.query;
      const callLogs = await dialpadService.getCallLogs({
        start_time: start_time as string,
        end_time: end_time as string,
        limit: limit ? parseInt(limit as string) : undefined,
        offset: offset ? parseInt(offset as string) : undefined,
      });

      res.json(callLogs);
    } catch (error: any) {
      console.error('Error fetching Dialpad calls:', error);
      res.status(500).json({ message: error.message || "Failed to fetch call logs" });
    }
  });

  // Get specific call details
  app.get("/api/dialpad/calls/:callId", isAuthenticated, async (req: Request, res: Response) => {
    try {
      if (!dialpadService) {
        return res.status(503).json({ message: "Dialpad API is not configured" });
      }

      const callDetails = await dialpadService.getCallDetails(req.params.callId);
      res.json(callDetails);
    } catch (error: any) {
      console.error('Error fetching call details:', error);
      res.status(500).json({ message: error.message || "Failed to fetch call details" });
    }
  });

  // Make an outbound call
  app.post("/api/dialpad/calls", isAuthenticated, async (req: Request, res: Response) => {
    try {
      if (!dialpadService) {
        return res.status(503).json({ message: "Dialpad API is not configured" });
      }

      const { to_number, from_number, from_extension_id } = req.body;
      
      if (!to_number) {
        return res.status(400).json({ message: "to_number is required" });
      }

      const result = await dialpadService.makeCall({
        to_number,
        from_number,
        from_extension_id,
      });

      res.json(result);
    } catch (error: any) {
      console.error('Error making call:', error);
      res.status(500).json({ message: error.message || "Failed to make call" });
    }
  });

  // Get SMS messages
  app.get("/api/dialpad/sms", isAuthenticated, async (req: Request, res: Response) => {
    try {
      if (!dialpadService) {
        return res.status(503).json({ message: "Dialpad API is not configured" });
      }

      const { start_time, end_time, limit, offset } = req.query;
      const messages = await dialpadService.getSmsMessages({
        start_time: start_time as string,
        end_time: end_time as string,
        limit: limit ? parseInt(limit as string) : undefined,
        offset: offset ? parseInt(offset as string) : undefined,
      });

      res.json(messages);
    } catch (error: any) {
      console.error('Error fetching SMS messages:', error);
      res.status(500).json({ message: error.message || "Failed to fetch SMS messages" });
    }
  });

  // Send SMS
  app.post("/api/dialpad/sms", isAuthenticated, async (req: Request, res: Response) => {
    try {
      if (!dialpadService) {
        return res.status(503).json({ message: "Dialpad API is not configured" });
      }

      const { to_numbers, text, from_number } = req.body;
      
      if (!to_numbers || !Array.isArray(to_numbers) || to_numbers.length === 0) {
        return res.status(400).json({ message: "to_numbers array is required" });
      }
      
      if (!text) {
        return res.status(400).json({ message: "text message is required" });
      }

      const result = await dialpadService.sendSms({
        to_numbers,
        text,
        from_number,
      });

      res.json(result);
    } catch (error: any) {
      console.error('Error sending SMS:', error);
      res.status(500).json({ message: error.message || "Failed to send SMS" });
    }
  });

  // Get contacts
  app.get("/api/dialpad/contacts", isAuthenticated, async (req: Request, res: Response) => {
    try {
      if (!dialpadService) {
        return res.status(503).json({ message: "Dialpad API is not configured" });
      }

      const { limit, offset, search } = req.query;
      const contacts = await dialpadService.getContacts({
        limit: limit ? parseInt(limit as string) : undefined,
        offset: offset ? parseInt(offset as string) : undefined,
        search: search as string,
      });

      res.json(contacts);
    } catch (error: any) {
      console.error('Error fetching contacts:', error);
      res.status(500).json({ message: error.message || "Failed to fetch contacts" });
    }
  });

  // Create contact
  app.post("/api/dialpad/contacts", isAuthenticated, async (req: Request, res: Response) => {
    try {
      if (!dialpadService) {
        return res.status(503).json({ message: "Dialpad API is not configured" });
      }

      const { name, phones, emails, company } = req.body;
      
      if (!name) {
        return res.status(400).json({ message: "name is required" });
      }

      const result = await dialpadService.createContact({
        name,
        phones,
        emails,
        company,
      });

      res.json(result);
    } catch (error: any) {
      console.error('Error creating contact:', error);
      res.status(500).json({ message: error.message || "Failed to create contact" });
    }
  });

  // Get voicemails
  app.get("/api/dialpad/voicemails", isAuthenticated, async (req: Request, res: Response) => {
    try {
      if (!dialpadService) {
        return res.status(503).json({ message: "Dialpad API is not configured" });
      }

      const { start_time, end_time, limit, offset } = req.query;
      const voicemails = await dialpadService.getVoicemails({
        start_time: start_time as string,
        end_time: end_time as string,
        limit: limit ? parseInt(limit as string) : undefined,
        offset: offset ? parseInt(offset as string) : undefined,
      });

      res.json(voicemails);
    } catch (error: any) {
      console.error('Error fetching voicemails:', error);
      res.status(500).json({ message: error.message || "Failed to fetch voicemails" });
    }
  });

  // Get call recording
  app.get("/api/dialpad/calls/:callId/recording", isAuthenticated, async (req: Request, res: Response) => {
    try {
      if (!dialpadService) {
        return res.status(503).json({ message: "Dialpad API is not configured" });
      }

      const recording = await dialpadService.getRecordingUrl(req.params.callId);
      res.json(recording);
    } catch (error: any) {
      console.error('Error fetching recording:', error);
      res.status(500).json({ message: error.message || "Failed to fetch recording" });
    }
  });

  // Get call stats
  app.get("/api/dialpad/stats/calls", isAuthenticated, async (req: Request, res: Response) => {
    try {
      if (!dialpadService) {
        return res.status(503).json({ message: "Dialpad API is not configured" });
      }

      const { start_time, end_time, target_type, target_id } = req.query;
      
      if (!start_time || !end_time) {
        return res.status(400).json({ message: "start_time and end_time are required" });
      }

      const stats = await dialpadService.getCallStats({
        start_time: start_time as string,
        end_time: end_time as string,
        target_type: target_type as any,
        target_id: target_id as string,
      });

      res.json(stats);
    } catch (error: any) {
      console.error('Error fetching call stats:', error);
      res.status(500).json({ message: error.message || "Failed to fetch call stats" });
    }
  });

  // Get current Dialpad user info
  app.get("/api/dialpad/user/me", isAuthenticated, async (req: Request, res: Response) => {
    try {
      if (!dialpadService) {
        return res.status(503).json({ message: "Dialpad API is not configured" });
      }

      // Note: Dialpad API doesn't have a getCurrentUser endpoint
      // Test the connection instead
      const result = await dialpadService.testConnection();
      res.json(result);
    } catch (error: any) {
      console.error('Error fetching Dialpad user info:', error);
      res.status(500).json({ message: error.message || "Failed to fetch user info" });
    }
  });
}

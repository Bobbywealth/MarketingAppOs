import type { Express, Request, Response } from "express";
import { storage } from "./storage";
import { isAuthenticated } from "./auth";
import { ObjectStorageService } from "./objectStorage";
import { requireRole, requirePermission, UserRole, rolePermissions } from "./rbac";
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

const objectStorageService = new ObjectStorageService();

// Initialize Stripe if keys are present
let stripe: Stripe | null = null;
if (process.env.STRIPE_SECRET_KEY) {
  stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: "2024-11-20.acacia",
  });
}

function handleValidationError(error: unknown, res: Response) {
  if (error instanceof ZodError) {
    return res.status(400).json({ message: "Validation error", errors: error.errors });
  }
  console.error(error);
  return res.status(500).json({ message: "Internal server error" });
}

export function registerRoutes(app: Express) {
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
        notes: z.string().optional(),
      });

      const data = signupSchema.parse(req.body);

      const clientData = {
        name: data.name,
        email: data.email,
        phone: data.phone,
        company: data.company,
        website: data.website || null,
        serviceTags: data.services,
        status: "onboarding" as const,
        notes: `Industry: ${data.industry || 'Not specified'}
Company Size: ${data.companySize || 'Not specified'}
Budget: ${data.budget || 'Not specified'}

Additional Notes:
${data.notes || 'None'}`,
        assignedToId: null,
        logoUrl: null,
        socialLinks: null,
        stripeCustomerId: null,
        stripeSubscriptionId: null,
      };

      const client = await storage.createClient(clientData);
      
      res.json({ success: true, clientId: client.id });
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

  // Sync emails from Microsoft
  app.post("/api/emails/sync", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const user = req.user as any;
      const userId = user?.id || user?.claims?.sub;
      
      const account = await storage.getEmailAccountByUserId(userId);
      
      if (!account || !account.isActive) {
        return res.status(404).json({ message: "No active email account found" });
      }

      // Check if token is expired and refresh if needed
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

      // Fetch emails from Microsoft
      const folders = ['inbox', 'sent', 'spam'];
      let syncedCount = 0;

      for (const folder of folders) {
        const messages = await microsoftAuth.getEmails(accessToken!, folder, 50);
        
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

      res.json({ success: true, syncedCount });
    } catch (error) {
      console.error('Error syncing emails:', error);
      res.status(500).json({ message: "Failed to sync emails" });
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
        sentAt: new Date(),
        userId,
      });

      res.json({ success: true });
    } catch (error) {
      console.error('Error sending email:', error);
      res.status(500).json({ message: "Failed to send email" });
    }
  });

  // Dashboard stats
  app.get("/api/dashboard/stats", isAuthenticated, async (_req: Request, res: Response) => {
    try {
      // Batch all data fetches in parallel for performance
      const [clients, campaigns, leads, invoices, tasks, tickets, contentPosts, websiteProjects, activityLogs] = await Promise.all([
        storage.getClients(),
        storage.getCampaigns(),
        storage.getLeads(),
        storage.getInvoices(),
        storage.getTasks(),
        storage.getTickets(),
        storage.getContentPosts(),
        storage.getWebsiteProjects(),
        storage.getActivityLogs(20), // Get recent 20 activity logs
      ]);

      const activeCampaigns = campaigns.filter((c) => c.status === "active").length;
      const pipelineValue = leads.reduce((sum, lead) => sum + (lead.value || 0), 0);
      const monthlyRevenue = invoices
        .filter((inv) => inv.status === "paid")
        .reduce((sum, inv) => sum + inv.amount, 0);

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
        return dueDate >= today && dueDate < tomorrow;
      });

      const totalTasksToday = tasksToday.length;
      const completedTasksToday = tasksToday.filter((t) => t.status === "completed").length;
      const todoTasksToday = tasksToday.filter((t) => t.status === "todo").length;
      const inProgressTasksToday = tasksToday.filter((t) => t.status === "in_progress").length;
      const reviewTasksToday = tasksToday.filter((t) => t.status === "review").length;

      // Recent Activity Feed - collect activities from all sources
      const recentActivity: any[] = [];

      // Client activities (sort by timestamp, then take most recent)
      [...clients]
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 5)
        .forEach(client => {
          recentActivity.push({
            type: 'success',
            title: `New client added: ${client.name}`,
            time: formatActivityTime(client.createdAt),
            timestamp: client.createdAt,
          });
        });

      // Campaign activities
      [...campaigns]
        .sort((a, b) => new Date(b.updatedAt || b.createdAt).getTime() - new Date(a.updatedAt || a.createdAt).getTime())
        .slice(0, 5)
        .forEach(campaign => {
          const client = clients.find(c => c.id === campaign.clientId);
          recentActivity.push({
            type: 'info',
            title: `Campaign ${campaign.status}: ${campaign.name}${client ? ` for ${client.name}` : ''}`,
            time: formatActivityTime(campaign.updatedAt || campaign.createdAt),
            timestamp: campaign.updatedAt || campaign.createdAt,
          });
        });

      // Task activities (completed tasks)
      [...tasks]
        .filter(t => t.status === 'completed')
        .sort((a, b) => new Date(b.completedAt || b.updatedAt).getTime() - new Date(a.completedAt || a.updatedAt).getTime())
        .slice(0, 5)
        .forEach(task => {
          recentActivity.push({
            type: 'success',
            title: `Task completed: ${task.title}`,
            time: formatActivityTime(task.completedAt || task.updatedAt),
            timestamp: task.completedAt || task.updatedAt,
          });
        });

      // Lead activities
      [...leads]
        .sort((a, b) => new Date(b.updatedAt || b.createdAt).getTime() - new Date(a.updatedAt || a.createdAt).getTime())
        .slice(0, 5)
        .forEach(lead => {
          const statusColors: any = { 'prospect': 'info', 'qualified': 'warning', 'proposal': 'warning', 'closed': 'success', 'lost': 'error' };
          recentActivity.push({
            type: statusColors[lead.stage] || 'info',
            title: `Lead ${lead.stage}: ${lead.name} - $${lead.value || 0}`,
            time: formatActivityTime(lead.updatedAt || lead.createdAt),
            timestamp: lead.updatedAt || lead.createdAt,
          });
        });

      // Invoice activities
      [...invoices]
        .filter(inv => inv.status === 'paid')
        .sort((a, b) => new Date(b.updatedAt || b.createdAt).getTime() - new Date(a.updatedAt || a.createdAt).getTime())
        .slice(0, 3)
        .forEach(invoice => {
          const client = clients.find(c => c.id === invoice.clientId);
          recentActivity.push({
            type: 'success',
            title: `Invoice paid: $${invoice.amount}${client ? ` from ${client.name}` : ''}`,
            time: formatActivityTime(invoice.updatedAt || invoice.createdAt),
            timestamp: invoice.updatedAt || invoice.createdAt,
          });
        });

      // Ticket activities
      [...tickets]
        .sort((a, b) => new Date(b.updatedAt || b.createdAt).getTime() - new Date(a.updatedAt || a.createdAt).getTime())
        .slice(0, 5)
        .forEach(ticket => {
          const statusColors: any = { 'open': 'warning', 'in_progress': 'info', 'resolved': 'success', 'closed': 'info' };
          recentActivity.push({
            type: statusColors[ticket.status] || 'info',
            title: `Support ticket ${ticket.status}: ${ticket.subject}`,
            time: formatActivityTime(ticket.updatedAt || ticket.createdAt),
            timestamp: ticket.updatedAt || ticket.createdAt,
          });
        });

      // Content activities
      [...contentPosts]
        .sort((a, b) => new Date(b.updatedAt || b.createdAt).getTime() - new Date(a.updatedAt || a.createdAt).getTime())
        .slice(0, 3)
        .forEach(post => {
          const statusColors: any = { 'draft': 'info', 'pending': 'warning', 'approved': 'success', 'published': 'success', 'rejected': 'error' };
          recentActivity.push({
            type: statusColors[post.status] || 'info',
            title: `Content ${post.status}: ${post.title}`,
            time: formatActivityTime(post.updatedAt || post.createdAt),
            timestamp: post.updatedAt || post.createdAt,
          });
        });

      // Website project activities
      [...websiteProjects]
        .sort((a, b) => new Date(b.updatedAt || b.createdAt).getTime() - new Date(a.updatedAt || a.createdAt).getTime())
        .slice(0, 3)
        .forEach(project => {
          const client = clients.find(c => c.id === project.clientId);
          recentActivity.push({
            type: 'info',
            title: `Website project ${project.stage}: ${project.name}${client ? ` for ${client.name}` : ''}`,
            time: formatActivityTime(project.updatedAt || project.createdAt),
            timestamp: project.updatedAt || project.createdAt,
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
          const daysUntil = Math.floor((new Date(task.dueDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
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

      res.json({
        totalClients: clients.length,
        activeCampaigns,
        pipelineValue,
        monthlyRevenue,
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
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Failed to fetch dashboard stats" });
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
            currentPeriodEnd: sub.current_period_end,
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
          currentPeriodEnd: subscription.current_period_end,
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
  app.get("/api/campaigns", isAuthenticated, requirePermission("canManageCampaigns"), async (_req: Request, res: Response) => {
    try {
      const campaigns = await storage.getCampaigns();
      res.json(campaigns);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Failed to fetch campaigns" });
    }
  });

  app.post("/api/campaigns", isAuthenticated, requirePermission("canManageCampaigns"), async (req: Request, res: Response) => {
    try {
      const validatedData = insertCampaignSchema.parse(req.body);
      const campaign = await storage.createCampaign(validatedData);
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

  // Task routes (admin and staff only)
  app.get("/api/tasks", isAuthenticated, requireRole(UserRole.ADMIN, UserRole.STAFF), async (_req: Request, res: Response) => {
    try {
      const tasks = await storage.getTasks();
      res.json(tasks);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Failed to fetch tasks" });
    }
  });

  app.post("/api/tasks", isAuthenticated, requireRole(UserRole.ADMIN, UserRole.STAFF), async (req: Request, res: Response) => {
    try {
      const validatedData = insertTaskSchema.parse(req.body);
      const task = await storage.createTask(validatedData);
      res.status(201).json(task);
    } catch (error) {
      handleValidationError(error, res);
    }
  });

  // AI-powered task parsing from natural language
  app.post("/api/tasks/parse-ai", isAuthenticated, requireRole(UserRole.ADMIN, UserRole.STAFF), async (req: Request, res: Response) => {
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

  app.patch("/api/tasks/:id", isAuthenticated, requireRole(UserRole.ADMIN, UserRole.STAFF), async (req: Request, res: Response) => {
    try {
      const validatedData = insertTaskSchema.partial().strip().parse(req.body);
      const task = await storage.updateTask(req.params.id, validatedData);
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

  app.delete("/api/tasks/:id", isAuthenticated, requireRole(UserRole.ADMIN, UserRole.STAFF), async (req: Request, res: Response) => {
    try {
      await storage.deleteTask(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Failed to delete task" });
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
      const validatedData = insertTaskCommentSchema.parse({
        ...req.body,
        taskId: req.params.taskId,
        userId: user.claims.sub,
      });
      const comment = await storage.createTaskComment(validatedData);
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
  app.get("/api/content-posts", isAuthenticated, requirePermission("canManageContent"), async (_req: Request, res: Response) => {
    try {
      const posts = await storage.getContentPosts();
      res.json(posts);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Failed to fetch content posts" });
    }
  });

  app.post("/api/content-posts", isAuthenticated, requirePermission("canManageContent"), async (req: Request, res: Response) => {
    try {
      console.log("Creating content post with data:", req.body);
      const validatedData = insertContentPostSchema.parse(req.body);
      console.log("Validated data:", validatedData);
      const post = await storage.createContentPost(validatedData);
      res.status(201).json(post);
    } catch (error) {
      console.error("Content post creation error:", error);
      return handleValidationError(error, res);
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
      
      // Clients can only see their own tickets
      if (userRole === "client") {
        const filteredTickets = tickets.filter(t => t.createdBy === userId);
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
      const userId = (req as any).userId;
      const userRole = (req as any).userRole;
      
      // For clients: ensure they can only create tickets with their own clientId
      let ticketData = { ...validatedData, createdBy: userId };
      
      if (userRole === "client") {
        // Clients cannot set arbitrary clientId or assignedTo
        delete (ticketData as any).assignedTo;
        // Note: In production, you'd link user to their client record to set clientId correctly
      }
      
      const ticket = await storage.createTicket(ticketData);
      res.status(201).json(ticket);
    } catch (error) {
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
        const tickets = await storage.getTickets();
        const ticket = tickets.find(t => t.id === req.params.id);
        if (!ticket || ticket.createdBy !== userId) {
          return res.status(403).json({ message: "Cannot update tickets created by others" });
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
        const tickets = await storage.getTickets();
        const ticket = tickets.find(t => t.id === req.params.id);
        if (!ticket || ticket.createdBy !== userId) {
          return res.status(403).json({ message: "Cannot delete tickets created by others" });
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

  // Get conversation between two users (for internal team messaging)
  app.get("/api/messages/conversation/:userId", isAuthenticated, requireRole(UserRole.ADMIN, UserRole.STAFF), async (req: Request, res: Response) => {
    try {
      const currentUserId = (req.user as any).id;
      const otherUserId = parseInt(req.params.userId);
      
      if (!otherUserId || isNaN(otherUserId)) {
        return res.status(400).json({ message: "Invalid user ID" });
      }

      const messages = await storage.getConversation(currentUserId, otherUserId);
      res.json(messages);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Failed to fetch conversation" });
    }
  });

  app.post("/api/messages", isAuthenticated, requireRole(UserRole.ADMIN, UserRole.STAFF), async (req: Request, res: Response) => {
    try {
      const currentUserId = (req.user as any).id;
      const validatedData = insertMessageSchema.parse({
        ...req.body,
        userId: currentUserId, // Set sender as current user
      });
      const message = await storage.createMessage(validatedData);
      res.status(201).json(message);
    } catch (error) {
      handleValidationError(error, res);
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

  // User management routes (staff and admin only)
  app.get("/api/users", isAuthenticated, requireRole(UserRole.ADMIN, UserRole.STAFF), async (_req: Request, res: Response) => {
    try {
      const users = await storage.getAllUsers();
      res.json(users);
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
      
      const requestSchema = insertClientDocumentSchema.omit({ 
        id: true, 
        createdAt: true, 
        objectPath: true, 
        uploadedBy: true,
        clientId: true,
      }).extend({
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
        uploadedBy: userId,
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

  // User management routes (Admin only)
  app.get("/api/users", isAuthenticated, requirePermission("canManageUsers"), async (_req: Request, res: Response) => {
    try {
      const users = await storage.getUsers();
      // Don't send password hashes to frontend
      const sanitizedUsers = users.map(({ id, username, role, createdAt }) => ({
        id,
        username,
        role,
        createdAt,
      }));
      res.json(sanitizedUsers);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  app.post("/api/users", isAuthenticated, requirePermission("canManageUsers"), async (req: Request, res: Response) => {
    try {
      const { hashPassword } = await import("./auth.js");
      const userData = {
        username: req.body.username,
        password: await hashPassword(req.body.password),
        role: req.body.role || "staff",
      };
      
      const user = await storage.createUser(userData);
      // Don't send password hash
      const { password, ...sanitizedUser } = user;
      res.status(201).json(sanitizedUser);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Failed to create user" });
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

  // Notifications routes
  app.get("/api/notifications", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = (req as any).userId;
      const notifications = await storage.getNotifications(userId);
      res.json(notifications);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Failed to fetch notifications" });
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

  app.delete("/api/notifications/:id", isAuthenticated, async (req: Request, res: Response) => {
    try {
      await storage.deleteNotification(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Failed to delete notification" });
    }
  });

  // Activity logs routes (Admin only)
  app.get("/api/activity-logs", isAuthenticated, requirePermission("canViewReports"), async (req: Request, res: Response) => {
    try {
      const limit = parseInt(req.query.limit as string) || 50;
      const activityLogs = await storage.getActivityLogs(limit);
      res.json(activityLogs);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Failed to fetch activity logs" });
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
}

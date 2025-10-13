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
  // Dashboard stats
  app.get("/api/dashboard/stats", isAuthenticated, async (_req: Request, res: Response) => {
    try {
      const clients = await storage.getClients();
      const campaigns = await storage.getCampaigns();
      const leads = await storage.getLeads();
      const invoices = await storage.getInvoices();

      const activeCampaigns = campaigns.filter((c) => c.status === "active").length;
      const pipelineValue = leads.reduce((sum, lead) => sum + (lead.value || 0), 0);
      const monthlyRevenue = invoices
        .filter((inv) => inv.status === "paid")
        .reduce((sum, inv) => sum + inv.amount, 0);

      res.json({
        totalClients: clients.length,
        activeCampaigns,
        pipelineValue,
        monthlyRevenue,
        recentActivity: [],
        upcomingDeadlines: [],
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Failed to fetch dashboard stats" });
    }
  });

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
      const validatedData = insertClientSchema.parse(req.body);
      const client = await storage.createClient(validatedData);
      res.status(201).json(client);
    } catch (error) {
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
      const validatedData = insertContentPostSchema.parse(req.body);
      const post = await storage.createContentPost(validatedData);
      res.status(201).json(post);
    } catch (error) {
      handleValidationError(error, res);
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

  app.post("/api/messages", isAuthenticated, requireRole(UserRole.ADMIN, UserRole.STAFF), async (req: Request, res: Response) => {
    try {
      const validatedData = insertMessageSchema.parse(req.body);
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

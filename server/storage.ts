import {
  users,
  clients,
  campaigns,
  tasks,
  taskSpaces,
  userViewPreferences,
  taskComments,
  leads,
  leadActivities,
  leadAutomations,
  contentPosts,
  invoices,
  tickets,
  messages,
  onboardingTasks,
  clientDocuments,
  websiteProjects,
  projectFeedback,
  analyticsMetrics,
  notifications,
  activityLogs,
  emails,
  emailAccounts,
  rolePermissions,
  subscriptionPackages,
  type User,
  type UpsertUser,
  type InsertUser,
  type Client,
  type InsertClient,
  type Campaign,
  type InsertCampaign,
  type Task,
  type InsertTask,
  type TaskSpace,
  type InsertTaskSpace,
  type UserViewPreferences,
  type InsertUserViewPreferences,
  type TaskComment,
  type InsertTaskComment,
  type Lead,
  type InsertLead,
  type LeadActivity,
  type InsertLeadActivity,
  type LeadAutomation,
  type InsertLeadAutomation,
  type ContentPost,
  type InsertContentPost,
  type Invoice,
  type InsertInvoice,
  type Ticket,
  type InsertTicket,
  type Message,
  type InsertMessage,
  type OnboardingTask,
  type InsertOnboardingTask,
  type ClientDocument,
  type InsertClientDocument,
  type WebsiteProject,
  type InsertWebsiteProject,
  type ProjectFeedback,
  type InsertProjectFeedback,
  type AnalyticsMetric,
  type InsertAnalyticsMetric,
  type Notification,
  type InsertNotification,
  type ActivityLog,
  type InsertActivityLog,
  type Email,
  type InsertEmail,
  type EmailAccount,
  type InsertEmailAccount,
  type RolePermissions,
  type InsertRolePermissions,
  type SubscriptionPackage,
  type InsertSubscriptionPackage,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, or, and } from "drizzle-orm";

export interface IStorage {
  // User operations
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getAllUsers(): Promise<User[]>;
  upsertUser(user: UpsertUser): Promise<User>;
  createUser(user: InsertUser): Promise<User>;
  updateUserRole(userId: string, role: string): Promise<User>;

  // Client operations
  getClients(): Promise<Client[]>;
  getClient(id: string): Promise<Client | undefined>;
  createClient(client: InsertClient): Promise<Client>;
  updateClient(id: string, data: Partial<InsertClient>): Promise<Client>;
  deleteClient(id: string): Promise<void>;

  // Campaign operations
  getCampaigns(): Promise<Campaign[]>;
  getCampaign(id: string): Promise<Campaign | undefined>;
  createCampaign(campaign: InsertCampaign): Promise<Campaign>;
  updateCampaign(id: string, data: Partial<InsertCampaign>): Promise<Campaign>;
  deleteCampaign(id: string): Promise<void>;

  // Task Spaces operations
  getTaskSpaces(): Promise<TaskSpace[]>;
  getTaskSpace(id: string): Promise<TaskSpace | undefined>;
  createTaskSpace(space: InsertTaskSpace): Promise<TaskSpace>;
  updateTaskSpace(id: string, data: Partial<InsertTaskSpace>): Promise<TaskSpace>;
  deleteTaskSpace(id: string): Promise<void>;
  
  // Task operations
  getTasks(): Promise<Task[]>;
  getTask(id: string): Promise<Task | undefined>;
  getTasksBySpace(spaceId: string): Promise<Task[]>;
  createTask(task: InsertTask): Promise<Task>;
  updateTask(id: string, data: Partial<InsertTask>): Promise<Task>;
  deleteTask(id: string): Promise<void>;
  
  // Task comment operations
  getTaskComments(taskId: string): Promise<TaskComment[]>;
  createTaskComment(comment: InsertTaskComment): Promise<TaskComment>;
  
  // User View Preferences operations
  getUserViewPreferences(userId: number): Promise<UserViewPreferences | undefined>;
  upsertUserViewPreferences(userId: number, preferences: Partial<InsertUserViewPreferences>): Promise<UserViewPreferences>;

  // Lead operations
  getLeads(): Promise<Lead[]>;
  createLead(lead: InsertLead): Promise<Lead>;
  updateLead(id: string, data: Partial<InsertLead>): Promise<Lead>;
  deleteLead(id: string): Promise<void>;

  // Lead activity operations
  getLeadActivities(leadId: string): Promise<LeadActivity[]>;
  createLeadActivity(activity: InsertLeadActivity): Promise<LeadActivity>;

  // Lead automation operations
  getLeadAutomations(leadId: string): Promise<LeadAutomation[]>;
  createLeadAutomation(automation: InsertLeadAutomation): Promise<LeadAutomation>;
  updateLeadAutomation(id: string, data: Partial<InsertLeadAutomation>): Promise<LeadAutomation>;
  deleteLeadAutomation(id: string): Promise<void>;

  // Content post operations
  getContentPosts(): Promise<ContentPost[]>;
  createContentPost(post: InsertContentPost): Promise<ContentPost>;
  updateContentPost(id: string, data: Partial<InsertContentPost>): Promise<ContentPost>;
  deleteContentPost(id: string): Promise<void>;

  // Invoice operations
  getInvoices(): Promise<Invoice[]>;
  createInvoice(invoice: InsertInvoice): Promise<Invoice>;
  updateInvoice(id: string, data: Partial<InsertInvoice>): Promise<Invoice>;
  deleteInvoice(id: string): Promise<void>;

  // Ticket operations
  getTickets(): Promise<Ticket[]>;
  createTicket(ticket: InsertTicket): Promise<Ticket>;
  updateTicket(id: string, data: Partial<InsertTicket>): Promise<Ticket>;
  deleteTicket(id: string): Promise<void>;

  // Message operations
  getMessages(clientId?: string): Promise<Message[]>;
  createMessage(message: InsertMessage): Promise<Message>;
  updateMessage(id: string, data: Partial<InsertMessage>): Promise<Message>;
  deleteMessage(id: string): Promise<void>;

  // Onboarding task operations
  getOnboardingTasks(): Promise<OnboardingTask[]>;

  // Client document operations
  getClientDocuments(clientId: string): Promise<ClientDocument[]>;
  createClientDocument(document: InsertClientDocument): Promise<ClientDocument>;
  deleteClientDocument(id: string): Promise<void>;

  // Website project operations
  getWebsiteProjects(): Promise<WebsiteProject[]>;
  getWebsiteProject(id: string): Promise<WebsiteProject | undefined>;
  createWebsiteProject(project: InsertWebsiteProject): Promise<WebsiteProject>;
  updateWebsiteProject(id: string, data: Partial<InsertWebsiteProject>): Promise<WebsiteProject>;
  deleteWebsiteProject(id: string): Promise<void>;

  // Project feedback operations
  getProjectFeedback(projectId: string): Promise<ProjectFeedback[]>;
  createProjectFeedback(feedback: InsertProjectFeedback): Promise<ProjectFeedback>;
  updateProjectFeedback(id: string, data: Partial<InsertProjectFeedback>): Promise<ProjectFeedback>;
  deleteProjectFeedback(id: string): Promise<void>;

  // Analytics metrics operations
  getAnalyticsMetrics(clientId?: string): Promise<AnalyticsMetric[]>;
  createAnalyticsMetric(metric: InsertAnalyticsMetric): Promise<AnalyticsMetric>;
  deleteAnalyticsMetric(id: string): Promise<void>;

  // Global search
  globalSearch(query: string): Promise<{
    clients: Client[];
    campaigns: Campaign[];
    leads: Lead[];
    contentPosts: ContentPost[];
    invoices: Invoice[];
    tickets: Ticket[];
  }>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users).orderBy(desc(users.createdAt));
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  async updateUserRole(userId: string, role: string): Promise<User> {
    const [user] = await db
      .update(users)
      .set({ role, updatedAt: new Date() })
      .where(eq(users.id, userId))
      .returning();
    if (!user) {
      throw new Error("User not found");
    }
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async createUser(userData: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .returning();
    return user;
  }

  async getUsers(): Promise<User[]> {
    return await db.select().from(users).orderBy(desc(users.createdAt));
  }

  async updateUser(userId: number, updates: Partial<InsertUser>): Promise<User> {
    const [user] = await db
      .update(users)
      .set(updates)
      .where(eq(users.id, userId))
      .returning();
    if (!user) {
      throw new Error("User not found");
    }
    return user;
  }

  async deleteUser(userId: number): Promise<void> {
    await db.delete(users).where(eq(users.id, userId));
  }

  // Client operations
  async getClients(): Promise<Client[]> {
    const clientList = await db.select().from(clients).orderBy(desc(clients.createdAt));
    console.log("🔍 getClients() called - Found", clientList.length, "clients");
    console.log("   Client IDs:", clientList.map(c => c.id).join(", "));
    return clientList;
  }

  async getClient(id: string): Promise<Client | undefined> {
    const [client] = await db.select().from(clients).where(eq(clients.id, id));
    return client;
  }

  async createClient(clientData: InsertClient): Promise<Client> {
    const [client] = await db.insert(clients).values(clientData).returning();
    return client;
  }

  async updateClient(id: string, data: Partial<InsertClient>): Promise<Client> {
    const [client] = await db
      .update(clients)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(clients.id, id))
      .returning();
    if (!client) {
      throw new Error("Client not found");
    }
    return client;
  }

  async deleteClient(id: string): Promise<void> {
    await db.delete(clients).where(eq(clients.id, id));
  }

  // Campaign operations
  async getCampaigns(): Promise<Campaign[]> {
    return await db.select().from(campaigns).orderBy(desc(campaigns.createdAt));
  }

  async getCampaign(id: string): Promise<Campaign | undefined> {
    const [campaign] = await db.select().from(campaigns).where(eq(campaigns.id, id));
    return campaign;
  }

  async createCampaign(campaignData: InsertCampaign): Promise<Campaign> {
    const [campaign] = await db.insert(campaigns).values(campaignData).returning();
    return campaign;
  }

  async updateCampaign(id: string, data: Partial<InsertCampaign>): Promise<Campaign> {
    const [campaign] = await db
      .update(campaigns)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(campaigns.id, id))
      .returning();
    if (!campaign) {
      throw new Error("Campaign not found");
    }
    return campaign;
  }

  async deleteCampaign(id: string): Promise<void> {
    await db.delete(campaigns).where(eq(campaigns.id, id));
  }

  // Task Spaces operations
  async getTaskSpaces(): Promise<TaskSpace[]> {
    return await db.select().from(taskSpaces).orderBy(taskSpaces.order, taskSpaces.name);
  }

  async getTaskSpace(id: string): Promise<TaskSpace | undefined> {
    const [space] = await db.select().from(taskSpaces).where(eq(taskSpaces.id, id));
    return space;
  }

  async createTaskSpace(spaceData: InsertTaskSpace): Promise<TaskSpace> {
    const [space] = await db.insert(taskSpaces).values(spaceData).returning();
    return space;
  }

  async updateTaskSpace(id: string, data: Partial<InsertTaskSpace>): Promise<TaskSpace> {
    const [space] = await db
      .update(taskSpaces)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(taskSpaces.id, id))
      .returning();
    if (!space) throw new Error("Task space not found");
    return space;
  }

  async deleteTaskSpace(id: string): Promise<void> {
    // Note: This will cascade delete or set null on tasks depending on your FK constraint
    await db.delete(taskSpaces).where(eq(taskSpaces.id, id));
  }

  // Task operations
  async getTasks(): Promise<Task[]> {
    return await db.select().from(tasks).orderBy(desc(tasks.createdAt));
  }

  async getTask(id: string): Promise<Task | undefined> {
    const [task] = await db.select().from(tasks).where(eq(tasks.id, id));
    return task;
  }

  async getTasksBySpace(spaceId: string): Promise<Task[]> {
    return await db.select().from(tasks).where(eq(tasks.spaceId, spaceId)).orderBy(desc(tasks.createdAt));
  }

  async createTask(taskData: InsertTask): Promise<Task> {
    const [task] = await db.insert(tasks).values(taskData).returning();
    return task;
  }

  async updateTask(id: string, data: Partial<InsertTask>): Promise<Task> {
    const [task] = await db
      .update(tasks)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(tasks.id, id))
      .returning();
    if (!task) {
      throw new Error("Task not found");
    }
    return task;
  }

  async deleteTask(id: string): Promise<void> {
    await db.delete(tasks).where(eq(tasks.id, id));
  }

  // Task comment operations
  async getTaskComments(taskId: string): Promise<TaskComment[]> {
    return await db
      .select()
      .from(taskComments)
      .where(eq(taskComments.taskId, taskId))
      .orderBy(desc(taskComments.createdAt));
  }

  async createTaskComment(commentData: InsertTaskComment): Promise<TaskComment> {
    const [comment] = await db.insert(taskComments).values(commentData).returning();
    return comment;
  }

  // Lead operations
  async getLeads(): Promise<Lead[]> {
    return await db.select().from(leads).orderBy(desc(leads.createdAt));
  }

  async createLead(leadData: InsertLead): Promise<Lead> {
    const [lead] = await db.insert(leads).values(leadData).returning();
    return lead;
  }

  async updateLead(id: string, data: Partial<InsertLead>): Promise<Lead> {
    const [lead] = await db
      .update(leads)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(leads.id, id))
      .returning();
    if (!lead) {
      throw new Error("Lead not found");
    }
    return lead;
  }

  async deleteLead(id: string): Promise<void> {
    await db.delete(leads).where(eq(leads.id, id));
  }

  // Lead activity operations
  async getLeadActivities(leadId: string): Promise<LeadActivity[]> {
    return await db
      .select()
      .from(leadActivities)
      .where(eq(leadActivities.leadId, leadId))
      .orderBy(desc(leadActivities.createdAt));
  }

  async createLeadActivity(activityData: InsertLeadActivity): Promise<LeadActivity> {
    const [activity] = await db.insert(leadActivities).values(activityData).returning();
    return activity;
  }

  // Lead automation operations
  async getLeadAutomations(leadId: string): Promise<LeadAutomation[]> {
    return await db
      .select()
      .from(leadAutomations)
      .where(eq(leadAutomations.leadId, leadId))
      .orderBy(desc(leadAutomations.createdAt));
  }

  async createLeadAutomation(automationData: InsertLeadAutomation): Promise<LeadAutomation> {
    const [automation] = await db.insert(leadAutomations).values(automationData).returning();
    return automation;
  }

  async updateLeadAutomation(id: string, data: Partial<InsertLeadAutomation>): Promise<LeadAutomation> {
    const [automation] = await db
      .update(leadAutomations)
      .set(data)
      .where(eq(leadAutomations.id, id))
      .returning();
    if (!automation) {
      throw new Error("Lead automation not found");
    }
    return automation;
  }

  async deleteLeadAutomation(id: string): Promise<void> {
    await db.delete(leadAutomations).where(eq(leadAutomations.id, id));
  }

  // Content post operations
  async getContentPosts(): Promise<ContentPost[]> {
    return await db.select().from(contentPosts).orderBy(desc(contentPosts.createdAt));
  }

  async createContentPost(postData: InsertContentPost): Promise<ContentPost> {
    const [post] = await db.insert(contentPosts).values(postData).returning();
    return post;
  }

  async updateContentPost(id: string, data: Partial<InsertContentPost>): Promise<ContentPost> {
    const [post] = await db
      .update(contentPosts)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(contentPosts.id, id))
      .returning();
    if (!post) {
      throw new Error("Content post not found");
    }
    return post;
  }

  async deleteContentPost(id: string): Promise<void> {
    await db.delete(contentPosts).where(eq(contentPosts.id, id));
  }

  // Invoice operations
  async getInvoices(): Promise<Invoice[]> {
    return await db.select().from(invoices).orderBy(desc(invoices.createdAt));
  }

  async createInvoice(invoiceData: InsertInvoice): Promise<Invoice> {
    const [invoice] = await db.insert(invoices).values(invoiceData).returning();
    return invoice;
  }

  async updateInvoice(id: string, data: Partial<InsertInvoice>): Promise<Invoice> {
    const [invoice] = await db
      .update(invoices)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(invoices.id, id))
      .returning();
    if (!invoice) {
      throw new Error("Invoice not found");
    }
    return invoice;
  }

  async deleteInvoice(id: string): Promise<void> {
    await db.delete(invoices).where(eq(invoices.id, id));
  }

  // Ticket operations
  async getTickets(): Promise<Ticket[]> {
    return await db.select().from(tickets).orderBy(desc(tickets.createdAt));
  }

  async createTicket(ticketData: InsertTicket): Promise<Ticket> {
    const [ticket] = await db.insert(tickets).values(ticketData).returning();
    return ticket;
  }

  async updateTicket(id: string, data: Partial<InsertTicket>): Promise<Ticket> {
    const [ticket] = await db
      .update(tickets)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(tickets.id, id))
      .returning();
    if (!ticket) {
      throw new Error("Ticket not found");
    }
    return ticket;
  }

  async deleteTicket(id: string): Promise<void> {
    await db.delete(tickets).where(eq(tickets.id, id));
  }

  // Message operations
  async getMessages(clientId?: string): Promise<Message[]> {
    if (clientId) {
      return await db.select().from(messages).where(eq(messages.clientId, clientId)).orderBy(messages.createdAt);
    }
    return await db.select().from(messages).orderBy(messages.createdAt);
  }

  // Get conversation between two users (for internal team messaging)
  async getConversation(userId1: number, userId2: number): Promise<Message[]> {
    const conversation = await db
      .select()
      .from(messages)
      .where(
        or(
          and(eq(messages.userId, userId1), eq(messages.recipientId, userId2)),
          and(eq(messages.userId, userId2), eq(messages.recipientId, userId1))
        )
      )
      .orderBy(messages.createdAt);
    return conversation;
  }

  async createMessage(messageData: InsertMessage): Promise<Message> {
    const [message] = await db.insert(messages).values(messageData).returning();
    return message;
  }

  async updateMessage(id: string, data: Partial<InsertMessage>): Promise<Message> {
    const [message] = await db
      .update(messages)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(messages.id, id))
      .returning();
    if (!message) {
      throw new Error("Message not found");
    }
    return message;
  }

  async deleteMessage(id: string): Promise<void> {
    await db.delete(messages).where(eq(messages.id, id));
  }

  // Onboarding task operations
  async getOnboardingTasks(): Promise<OnboardingTask[]> {
    return await db.select().from(onboardingTasks).orderBy(onboardingTasks.dueDay);
  }

  // Client document operations
  async getClientDocuments(clientId: string): Promise<ClientDocument[]> {
    return await db.select().from(clientDocuments).where(eq(clientDocuments.clientId, clientId)).orderBy(desc(clientDocuments.createdAt));
  }

  async createClientDocument(document: InsertClientDocument): Promise<ClientDocument> {
    const [doc] = await db.insert(clientDocuments).values(document).returning();
    return doc;
  }

  async deleteClientDocument(id: string): Promise<void> {
    await db.delete(clientDocuments).where(eq(clientDocuments.id, id));
  }

  // Website project operations
  async getWebsiteProjects(): Promise<WebsiteProject[]> {
    return await db.select().from(websiteProjects).orderBy(desc(websiteProjects.createdAt));
  }

  async getWebsiteProject(id: string): Promise<WebsiteProject | undefined> {
    const [project] = await db.select().from(websiteProjects).where(eq(websiteProjects.id, id));
    return project;
  }

  async createWebsiteProject(projectData: InsertWebsiteProject): Promise<WebsiteProject> {
    const [project] = await db.insert(websiteProjects).values(projectData).returning();
    return project;
  }

  async updateWebsiteProject(id: string, data: Partial<InsertWebsiteProject>): Promise<WebsiteProject> {
    const [project] = await db
      .update(websiteProjects)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(websiteProjects.id, id))
      .returning();
    if (!project) {
      throw new Error("Website project not found");
    }
    return project;
  }

  async deleteWebsiteProject(id: string): Promise<void> {
    await db.delete(websiteProjects).where(eq(websiteProjects.id, id));
  }

  // Project feedback operations
  async getProjectFeedback(projectId: string): Promise<ProjectFeedback[]> {
    return await db.select().from(projectFeedback).where(eq(projectFeedback.projectId, projectId)).orderBy(desc(projectFeedback.createdAt));
  }

  async createProjectFeedback(feedbackData: InsertProjectFeedback): Promise<ProjectFeedback> {
    const [feedback] = await db.insert(projectFeedback).values(feedbackData).returning();
    return feedback;
  }

  async updateProjectFeedback(id: string, data: Partial<InsertProjectFeedback>): Promise<ProjectFeedback> {
    const [feedback] = await db
      .update(projectFeedback)
      .set(data)
      .where(eq(projectFeedback.id, id))
      .returning();
    if (!feedback) {
      throw new Error("Project feedback not found");
    }
    return feedback;
  }

  async deleteProjectFeedback(id: string): Promise<void> {
    await db.delete(projectFeedback).where(eq(projectFeedback.id, id));
  }

  // Analytics metrics operations
  async getAnalyticsMetrics(clientId?: string): Promise<AnalyticsMetric[]> {
    if (clientId) {
      return await db.select().from(analyticsMetrics).where(eq(analyticsMetrics.clientId, clientId)).orderBy(desc(analyticsMetrics.date));
    }
    return await db.select().from(analyticsMetrics).orderBy(desc(analyticsMetrics.date));
  }

  async createAnalyticsMetric(metricData: InsertAnalyticsMetric): Promise<AnalyticsMetric> {
    const [metric] = await db.insert(analyticsMetrics).values(metricData).returning();
    return metric;
  }

  async deleteAnalyticsMetric(id: string): Promise<void> {
    await db.delete(analyticsMetrics).where(eq(analyticsMetrics.id, id));
  }

  // Global search
  async globalSearch(query: string) {
    const searchTerm = `%${query.toLowerCase()}%`;

    const [clientResults, campaignResults, leadResults, contentResults, invoiceResults, ticketResults] = await Promise.all([
      db.select().from(clients).where(
        sql`LOWER(${clients.name}) LIKE ${searchTerm} OR LOWER(${clients.email}) LIKE ${searchTerm} OR LOWER(${clients.company}) LIKE ${searchTerm}`
      ).limit(5),
      db.select().from(campaigns).where(
        sql`LOWER(${campaigns.name}) LIKE ${searchTerm} OR LOWER(${campaigns.description}) LIKE ${searchTerm}`
      ).limit(5),
      db.select().from(leads).where(
        sql`LOWER(${leads.name}) LIKE ${searchTerm} OR LOWER(${leads.email}) LIKE ${searchTerm} OR LOWER(${leads.company}) LIKE ${searchTerm}`
      ).limit(5),
      db.select().from(contentPosts).where(
        sql`LOWER(${contentPosts.title}) LIKE ${searchTerm}`
      ).limit(5),
      db.select().from(invoices).where(
        sql`LOWER(${invoices.invoiceNumber}) LIKE ${searchTerm}`
      ).limit(5),
      db.select().from(tickets).where(
        sql`LOWER(${tickets.subject}) LIKE ${searchTerm} OR LOWER(${tickets.description}) LIKE ${searchTerm}`
      ).limit(5)
    ]);

    return {
      clients: clientResults,
      campaigns: campaignResults,
      leads: leadResults,
      contentPosts: contentResults,
      invoices: invoiceResults,
      tickets: ticketResults,
    };
  }

  // Notifications operations
  async getNotifications(userId: number) {
    return await db
      .select()
      .from(notifications)
      .where(eq(notifications.userId, userId))
      .orderBy(desc(notifications.createdAt))
      .limit(50);
  }

  async createNotification(notificationData: InsertNotification) {
    const [notification] = await db
      .insert(notifications)
      .values(notificationData)
      .returning();
    return notification;
  }

  async markNotificationAsRead(notificationId: string) {
    await db
      .update(notifications)
      .set({ isRead: true })
      .where(eq(notifications.id, notificationId));
  }

  async markAllNotificationsAsRead(userId: number) {
    await db
      .update(notifications)
      .set({ isRead: true })
      .where(eq(notifications.userId, userId));
  }

  async deleteNotification(notificationId: string) {
    await db.delete(notifications).where(eq(notifications.id, notificationId));
  }

  // Activity logs operations
  async createActivityLog(logData: InsertActivityLog) {
    const [log] = await db.insert(activityLogs).values(logData).returning();
    return log;
  }

  async getActivityLogs(limit: number = 50) {
    return await db
      .select()
      .from(activityLogs)
      .orderBy(desc(activityLogs.createdAt))
      .limit(limit);
  }

  // Email operations
  async getEmails(userId?: number, folder?: string) {
    const conditions = [];
    
    if (userId) {
      conditions.push(eq(emails.userId, userId));
    }
    
    if (folder) {
      conditions.push(eq(emails.folder, folder));
    }
    
    let query = db.select().from(emails);
    
    if (conditions.length > 0) {
      query = query.where(and(...conditions)) as any;
    }
    
    return await query.orderBy(desc(emails.receivedAt));
  }

  async getEmail(id: string) {
    const [email] = await db.select().from(emails).where(eq(emails.id, id));
    return email;
  }

  async createEmail(emailData: InsertEmail) {
    const [email] = await db.insert(emails).values(emailData).returning();
    return email;
  }

  async getEmailByMessageId(messageId: string) {
    const [email] = await db.select().from(emails).where(eq(emails.messageId, messageId)).limit(1);
    return email;
  }

  async updateEmail(id: string, updates: Partial<InsertEmail>) {
    const [email] = await db
      .update(emails)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(emails.id, id))
      .returning();
    return email;
  }

  async deleteEmail(id: string) {
    await db.delete(emails).where(eq(emails.id, id));
  }

  async markEmailAsRead(id: string) {
    return await this.updateEmail(id, { isRead: true });
  }

  async moveEmailToFolder(id: string, folder: string) {
    return await this.updateEmail(id, { folder });
  }

  async toggleEmailStar(id: string, isStarred: boolean) {
    return await this.updateEmail(id, { isStarred });
  }

  // Email account operations (for OAuth tokens)
  async getEmailAccounts(userId: number) {
    return await db.select().from(emailAccounts).where(eq(emailAccounts.userId, userId));
  }

  async getEmailAccountByUserId(userId: number) {
    const [account] = await db.select().from(emailAccounts).where(eq(emailAccounts.userId, userId)).limit(1);
    return account;
  }

  async getEmailAccount(id: string) {
    const [account] = await db.select().from(emailAccounts).where(eq(emailAccounts.id, id));
    return account;
  }

  async createEmailAccount(accountData: InsertEmailAccount) {
    const [account] = await db.insert(emailAccounts).values(accountData).returning();
    return account;
  }

  async updateEmailAccount(id: string, updates: Partial<InsertEmailAccount>) {
    const [account] = await db
      .update(emailAccounts)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(emailAccounts.id, id))
      .returning();
    return account;
  }

  async deleteEmailAccount(id: string) {
    await db.delete(emailAccounts).where(eq(emailAccounts.id, id));
  }

  // User View Preferences operations
  async getUserViewPreferences(userId: number): Promise<UserViewPreferences | undefined> {
    const [preferences] = await db
      .select()
      .from(userViewPreferences)
      .where(eq(userViewPreferences.userId, userId));
    return preferences;
  }

  async upsertUserViewPreferences(userId: number, prefsData: Partial<InsertUserViewPreferences>): Promise<UserViewPreferences> {
    // Check if preferences exist
    const existing = await this.getUserViewPreferences(userId);
    
    if (existing) {
      // Update existing
      const [updated] = await db
        .update(userViewPreferences)
        .set({ ...prefsData, updatedAt: new Date() })
        .where(eq(userViewPreferences.userId, userId))
        .returning();
      return updated;
    } else {
      // Create new
      const [created] = await db
        .insert(userViewPreferences)
        .values({ userId, ...prefsData } as InsertUserViewPreferences)
        .returning();
      return created;
    }
  }

  // Role Permissions operations
  async getAllRolePermissions(): Promise<RolePermissions[]> {
    return await db.select().from(rolePermissions);
  }

  async getRolePermissions(role: string): Promise<RolePermissions | undefined> {
    const [perms] = await db
      .select()
      .from(rolePermissions)
      .where(eq(rolePermissions.role, role));
    return perms;
  }

  async updateRolePermissions(role: string, permissions: any): Promise<RolePermissions> {
    // Check if permissions exist for this role
    const existing = await this.getRolePermissions(role);
    
    if (existing) {
      // Update existing
      const [updated] = await db
        .update(rolePermissions)
        .set({ permissions, updatedAt: new Date() })
        .where(eq(rolePermissions.role, role))
        .returning();
      return updated;
    } else {
      // Create new
      const [created] = await db
        .insert(rolePermissions)
        .values({ role, permissions })
        .returning();
      return created;
    }
  }

  // Subscription Package operations
  async getSubscriptionPackages(): Promise<SubscriptionPackage[]> {
    return await db
      .select()
      .from(subscriptionPackages)
      .orderBy(subscriptionPackages.displayOrder, subscriptionPackages.createdAt);
  }

  async getActiveSubscriptionPackages(): Promise<SubscriptionPackage[]> {
    return await db
      .select()
      .from(subscriptionPackages)
      .where(eq(subscriptionPackages.isActive, true))
      .orderBy(subscriptionPackages.displayOrder, subscriptionPackages.createdAt);
  }

  async getSubscriptionPackage(id: string): Promise<SubscriptionPackage | undefined> {
    const [pkg] = await db
      .select()
      .from(subscriptionPackages)
      .where(eq(subscriptionPackages.id, id));
    return pkg;
  }

  async createSubscriptionPackage(data: InsertSubscriptionPackage): Promise<SubscriptionPackage> {
    const [pkg] = await db
      .insert(subscriptionPackages)
      .values(data)
      .returning();
    return pkg;
  }

  async updateSubscriptionPackage(id: string, data: Partial<InsertSubscriptionPackage>): Promise<SubscriptionPackage> {
    const [pkg] = await db
      .update(subscriptionPackages)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(subscriptionPackages.id, id))
      .returning();
    return pkg;
  }

  async deleteSubscriptionPackage(id: string): Promise<void> {
    await db
      .delete(subscriptionPackages)
      .where(eq(subscriptionPackages.id, id));
  }
}

export const storage = new DatabaseStorage();

import {
  users,
  clients,
  campaigns,
  tasks,
  taskSpaces,
  userViewPreferences,
  taskComments,
  taskTemplates,
  taskDependencies,
  taskActivity,
  taskAttachments,
  taskAnalyticsSnapshot,
  savedTaskSearches,
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
  calendarEvents,
  secondMe,
  secondMeContent,
  pageViews,
  scheduledAiCommands,
  marketingSeries,
  marketingSeriesSteps,
  marketingSeriesEnrollments,
  commissions,
  marketingBroadcasts,
  marketingBroadcastRecipients,
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
  type TaskTemplate,
  type InsertTaskTemplate,
  type TaskDependency,
  type InsertTaskDependency,
  type TaskActivity,
  type InsertTaskActivity,
  type TaskAttachment,
  type InsertTaskAttachment,
  type TaskAnalyticsSnapshot,
  type SavedTaskSearch,
  type InsertSavedTaskSearch,
  type Lead,
  type InsertLead,
  type LeadActivity,
  type InsertLeadActivity,
  type LeadAutomation,
  type InsertLeadAutomation,
  type ContentPost,
  type InsertContentPost,
  type Invoice,
  type CalendarEvent,
  type InsertCalendarEvent,
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
  type PageView,
  type InsertPageView,
  type SecondMe,
  type InsertSecondMe,
  type SecondMeContent,
  type InsertSecondMeContent,
  type ScheduledAiCommand,
  type InsertScheduledAiCommand,
  type MarketingSeries,
  type InsertMarketingSeries,
  type MarketingSeriesStep,
  type InsertMarketingSeriesStep,
  type MarketingSeriesEnrollment,
  type InsertMarketingSeriesEnrollment,
  type MarketingBroadcast,
  type InsertMarketingBroadcast,
  type MarketingBroadcastRecipient,
  type InsertMarketingBroadcastRecipient,
} from "@shared/schema";
import { db, pool } from "./db";
import { eq, desc, or, and, gte, count, sql } from "drizzle-orm";

export interface IStorage {
  // User operations
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getAllUsers(): Promise<User[]>;
  upsertUser(user: UpsertUser): Promise<User>;
  createUser(user: InsertUser): Promise<User>;
  updateUserRole(userId: string, role: string): Promise<User>;

  // Client operations
  getClients(options?: { limit?: number; offset?: number }): Promise<Client[]>;
  getClient(id: string): Promise<Client | undefined>;
  createClient(client: InsertClient): Promise<Client>;
  updateClient(id: string, data: Partial<InsertClient>): Promise<Client>;
  deleteClient(id: string): Promise<void>;

  // Campaign operations
  getCampaigns(options?: { limit?: number; offset?: number }): Promise<Campaign[]>;
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
  getTasks(options?: { limit?: number; offset?: number }): Promise<Task[]>;
  getTask(id: string): Promise<Task | undefined>;
  getTasksBySpace(spaceId: string): Promise<Task[]>;
  createTask(task: InsertTask): Promise<Task>;
  updateTask(id: string, data: Partial<InsertTask>): Promise<Task>;
  deleteTask(id: string): Promise<void>;
  
  // Task comment operations
  getTaskComments(taskId: string): Promise<TaskComment[]>;
  createTaskComment(comment: InsertTaskComment): Promise<TaskComment>;

  // Task template operations
  getTaskTemplates(): Promise<TaskTemplate[]>;
  getTaskTemplate(id: string): Promise<TaskTemplate | undefined>;
  createTaskTemplate(template: InsertTaskTemplate): Promise<TaskTemplate>;
  updateTaskTemplate(id: string, data: Partial<InsertTaskTemplate>): Promise<TaskTemplate>;
  deleteTaskTemplate(id: string): Promise<void>;

  // Task dependency operations
  getTaskDependencies(taskId: string): Promise<TaskDependency[]>;
  getDependentTasks(taskId: string): Promise<TaskDependency[]>;
  createTaskDependency(dependency: InsertTaskDependency): Promise<TaskDependency>;
  deleteTaskDependency(id: string): Promise<void>;
  validateTaskDependencies(taskId: string): Promise<{ valid: boolean; blockedBy: Task[] }>;

  // Task activity operations
  getTaskActivity(taskId: string, limit?: number): Promise<TaskActivity[]>;
  getUserActivity(userId: number, limit?: number): Promise<TaskActivity[]>;
  createTaskActivity(activity: InsertTaskActivity): Promise<TaskActivity>;

  // Task attachment operations
  getTaskAttachments(taskId: string): Promise<TaskAttachment[]>;
  createTaskAttachment(attachment: InsertTaskAttachment): Promise<TaskAttachment>;
  deleteTaskAttachment(id: string): Promise<void>;

  // User workload operations
  getUserWorkload(userId: number): Promise<{
    activeTasks: number;
    overdueTasks: number;
    estimatedHoursTotal: number;
    tasksByPriority: Record<string, number>;
    upcomingDeadlines: Task[];
  }>;

  // Task analytics operations
  getTaskAnalytics(dateFrom: Date, dateTo: Date): Promise<TaskAnalyticsSnapshot[]>;
  createTaskAnalyticsSnapshot(snapshot: TaskAnalyticsSnapshot): Promise<TaskAnalyticsSnapshot>;

  // Saved search operations
  getSavedTaskSearches(userId: number): Promise<SavedTaskSearch[]>;
  saveTaskSearch(search: InsertSavedTaskSearch): Promise<SavedTaskSearch>;
  deleteSavedTaskSearch(id: string): Promise<void>;

  // Advanced task search
  searchTasks(filters: {
    status?: string[];
    priority?: string[];
    assigneeId?: number;
    spaceId?: string;
    clientId?: string;
    dueDateFrom?: Date;
    dueDateTo?: Date;
    tags?: string[];
    searchText?: string;
  }): Promise<Task[]>;

  // Calendar Events operations
  getCalendarEvents(): Promise<CalendarEvent[]>;
  getCalendarEvent(id: string): Promise<CalendarEvent | undefined>;
  createCalendarEvent(event: InsertCalendarEvent): Promise<CalendarEvent>;
  updateCalendarEvent(id: string, data: Partial<InsertCalendarEvent>): Promise<CalendarEvent>;
  deleteCalendarEvent(id: string): Promise<void>;
  
  // User View Preferences operations
  getUserViewPreferences(userId: number): Promise<UserViewPreferences | undefined>;
  upsertUserViewPreferences(userId: number, preferences: Partial<InsertUserViewPreferences>): Promise<UserViewPreferences>;

  // User Notification Preferences operations
  getUserNotificationPreferences(userId: number): Promise<{
    emailNotifications: boolean;
    taskUpdates: boolean;
    dueDateReminders: boolean;
  }>;

  // Lead operations
  getLead(id: string): Promise<Lead | undefined>;
  getLeads(options?: { limit?: number; offset?: number }): Promise<Lead[]>;
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
  getContentPostsByClient(clientId: string): Promise<ContentPost[]>;
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

  // Scheduled AI Commands operations
  getDueScheduledAiCommands(): Promise<ScheduledAiCommand[]>;
  createScheduledAiCommand(command: InsertScheduledAiCommand): Promise<ScheduledAiCommand>;
  updateScheduledAiCommand(id: string, data: Partial<InsertScheduledAiCommand>): Promise<ScheduledAiCommand>;

  // Marketing Series operations
  getMarketingSeriesWithSteps(id: string): Promise<(MarketingSeries & { steps: MarketingSeriesStep[] }) | undefined>;
  getDueSeriesEnrollments(): Promise<MarketingSeriesEnrollment[]>;
  createMarketingSeries(series: InsertMarketingSeries): Promise<MarketingSeries>;
  createMarketingSeriesStep(step: InsertMarketingSeriesStep): Promise<MarketingSeriesStep>;
  createMarketingSeriesEnrollment(enrollment: InsertMarketingSeriesEnrollment): Promise<MarketingSeriesEnrollment>;
  updateMarketingSeriesEnrollment(id: string, data: Partial<InsertMarketingSeriesEnrollment>): Promise<MarketingSeriesEnrollment>;

  // Task automation operations
  getDueTasksForAllAssignees(): Promise<Task[]>;
  updateTaskAssignee(taskId: string, assigneeId: number | null): Promise<Task>;

  // Lead automation operations
  getDueLeadAutomations(): Promise<LeadAutomation[]>;

  // Marketing Broadcast operations
  getMarketingBroadcasts(): Promise<MarketingBroadcast[]>;
  getMarketingBroadcast(id: string): Promise<MarketingBroadcast | undefined>;
  createMarketingBroadcast(broadcast: InsertMarketingBroadcast): Promise<MarketingBroadcast>;
  updateMarketingBroadcast(id: string, data: Partial<InsertMarketingBroadcast>): Promise<MarketingBroadcast>;
  deleteMarketingBroadcast(id: string): Promise<void>;

  // Marketing Broadcast Recipient operations
  getMarketingBroadcastRecipients(broadcastId: string): Promise<MarketingBroadcastRecipient[]>;
  createMarketingBroadcastRecipient(recipient: InsertMarketingBroadcastRecipient): Promise<MarketingBroadcastRecipient>;
  updateMarketingBroadcastRecipient(id: string, data: Partial<InsertMarketingBroadcastRecipient>): Promise<MarketingBroadcastRecipient>;
  getMarketingBroadcastRecipientByProviderCallId(providerCallId: string): Promise<MarketingBroadcastRecipient | undefined>;

  // Marketing Groups operations (legacy raw SQL tables)
  getMarketingGroups(): Promise<any[]>;
  getMarketingGroupMembers(groupId: string): Promise<any[]>;
  createMarketingGroup(group: { name: string; description?: string; createdBy: number }): Promise<any>;
  addMarketingGroupMember(data: { groupId: string; leadId?: string; clientId?: string; customRecipient?: string }): Promise<any>;
  removeMarketingGroupMember(id: number): Promise<void>;
  deleteMarketingGroup(id: string): Promise<void>;
  
  // Marketing Templates operations (legacy raw SQL tables)
  getMarketingTemplates(): Promise<any[]>;
  createMarketingTemplate(template: { name: string; type: string; subject?: string; content: string; createdBy: number }): Promise<any>;
  updateMarketingTemplate(id: string, data: Partial<{ name: string; type: string; subject: string; content: string }>): Promise<any>;
  deleteMarketingTemplate(id: string): Promise<void>;
  
  // Marketing Series operations
  getMarketingSeries(): Promise<any[]>;
  getMarketingSeriesSteps(seriesId: string): Promise<any[]>;
  updateMarketingSeries(id: string, data: Partial<{ name: string; description: string; isActive: boolean }>): Promise<any>;
  deleteMarketingSeries(id: string): Promise<void>;
  updateMarketingSeriesStep(id: string, data: Partial<{ subject: string; content: string; delayDays: number }>): Promise<any>;
  deleteMarketingSeriesStep(id: string): Promise<void>;
  
  getMarketingStats(): Promise<{
    totalBroadcasts: number;
    totalGroups: number;
    totalTemplates: number;
    totalSeries: number;
    recentBroadcasts: any[];
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

  async clearUserTasks(userId: number): Promise<void> {
    await db.update(tasks)
      .set({ assignedToId: null })
      .where(eq(tasks.assignedToId, userId));
  }

  // Client operations
  async getClients(options?: { limit?: number; offset?: number }): Promise<Client[]> {
    let query = db.select().from(clients).orderBy(desc(clients.createdAt));
    
    if (options?.limit) {
      query = query.limit(options.limit) as any;
    }
    if (options?.offset) {
      query = query.offset(options.offset) as any;
    }
    
    const clientList = await query;
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
  async getCampaigns(options?: { limit?: number; offset?: number }): Promise<Campaign[]> {
    let query = db.select().from(campaigns).orderBy(desc(campaigns.createdAt));
    
    if (options?.limit) {
      query = query.limit(options.limit) as any;
    }
    if (options?.offset) {
      query = query.offset(options.offset) as any;
    }
    
    return await query;
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
  async getTasks(options?: { limit?: number; offset?: number }): Promise<Task[]> {
    let query = db.select().from(tasks).orderBy(desc(tasks.createdAt));
    
    if (options?.limit) {
      query = query.limit(options.limit) as any;
    }
    if (options?.offset) {
      query = query.offset(options.offset) as any;
    }
    
    return await query;
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

  // Task template operations
  async getTaskTemplates(): Promise<TaskTemplate[]> {
    return await db.select().from(taskTemplates).orderBy(taskTemplates.createdAt);
  }

  async getTaskTemplate(id: string): Promise<TaskTemplate | undefined> {
    const [template] = await db.select().from(taskTemplates).where(eq(taskTemplates.id, id));
    return template;
  }

  async createTaskTemplate(templateData: InsertTaskTemplate): Promise<TaskTemplate> {
    const [template] = await db.insert(taskTemplates).values(templateData).returning();
    return template;
  }

  async updateTaskTemplate(id: string, data: Partial<InsertTaskTemplate>): Promise<TaskTemplate> {
    const [template] = await db
      .update(taskTemplates)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(taskTemplates.id, id))
      .returning();
    return template;
  }

  async deleteTaskTemplate(id: string): Promise<void> {
    await db.delete(taskTemplates).where(eq(taskTemplates.id, id));
  }

  // Task dependency operations
  async getTaskDependencies(taskId: string): Promise<TaskDependency[]> {
    return await db
      .select()
      .from(taskDependencies)
      .where(eq(taskDependencies.taskId, taskId));
  }

  async getDependentTasks(taskId: string): Promise<TaskDependency[]> {
    return await db
      .select()
      .from(taskDependencies)
      .where(eq(taskDependencies.prerequisiteTaskId, taskId));
  }

  async createTaskDependency(dependencyData: InsertTaskDependency): Promise<TaskDependency> {
    const [dependency] = await db.insert(taskDependencies).values(dependencyData).returning();
    return dependency;
  }

  async deleteTaskDependency(id: string): Promise<void> {
    await db.delete(taskDependencies).where(eq(taskDependencies.id, id));
  }

  async validateTaskDependencies(taskId: string): Promise<{ valid: boolean; blockedBy: Task[] }> {
    const dependencies = await this.getTaskDependencies(taskId);
    const blockedBy: Task[] = [];

    for (const dep of dependencies) {
      const prerequisiteTask = await this.getTask(dep.prerequisiteTaskId);
      if (prerequisiteTask && prerequisiteTask.status !== 'completed') {
        blockedBy.push(prerequisiteTask);
      }
    }

    return {
      valid: blockedBy.length === 0,
      blockedBy,
    };
  }

  // Task activity operations
  async getTaskActivity(taskId: string, limit: number = 50): Promise<TaskActivity[]> {
    return await db
      .select()
      .from(taskActivity)
      .where(eq(taskActivity.taskId, taskId))
      .orderBy(desc(taskActivity.createdAt))
      .limit(limit);
  }

  async getUserActivity(userId: number, limit: number = 100): Promise<TaskActivity[]> {
    return await db
      .select()
      .from(taskActivity)
      .where(eq(taskActivity.userId, userId))
      .orderBy(desc(taskActivity.createdAt))
      .limit(limit);
  }

  async createTaskActivity(activityData: InsertTaskActivity): Promise<TaskActivity> {
    const [activity] = await db.insert(taskActivity).values(activityData).returning();
    return activity;
  }

  // Task attachment operations
  async getTaskAttachments(taskId: string): Promise<TaskAttachment[]> {
    return await db
      .select()
      .from(taskAttachments)
      .where(eq(taskAttachments.taskId, taskId))
      .orderBy(desc(taskAttachments.createdAt));
  }

  async createTaskAttachment(attachmentData: InsertTaskAttachment): Promise<TaskAttachment> {
    const [attachment] = await db.insert(taskAttachments).values(attachmentData).returning();
    return attachment;
  }

  async deleteTaskAttachment(id: string): Promise<void> {
    await db.delete(taskAttachments).where(eq(taskAttachments.id, id));
  }

  // User workload operations
  async getUserWorkload(userId: number): Promise<{
    activeTasks: number;
    overdueTasks: number;
    estimatedHoursTotal: number;
    tasksByPriority: Record<string, number>;
    upcomingDeadlines: Task[];
  }> {
    const allTasks = await db
      .select()
      .from(tasks)
      .where(eq(tasks.assignedToId, userId));

    const now = new Date();
    const activeTasks = allTasks.filter(t => t.status !== 'completed');
    const overdueTasks = activeTasks.filter(t => t.dueDate && new Date(t.dueDate) < now);
    const upcomingDeadlines = activeTasks
      .filter(t => t.dueDate && new Date(t.dueDate) > now)
      .sort((a, b) => new Date(a.dueDate!).getTime() - new Date(b.dueDate!).getTime())
      .slice(0, 5);

    const tasksByPriority: Record<string, number> = {};
    for (const task of activeTasks) {
      tasksByPriority[task.priority] = (tasksByPriority[task.priority] || 0) + 1;
    }

    const estimatedHoursTotal = activeTasks.reduce((sum, task) => sum + (task.estimatedHours || 0), 0);

    return {
      activeTasks: activeTasks.length,
      overdueTasks: overdueTasks.length,
      estimatedHoursTotal,
      tasksByPriority,
      upcomingDeadlines,
    };
  }

  // Task analytics operations
  async getTaskAnalytics(dateFrom: Date, dateTo: Date): Promise<TaskAnalyticsSnapshot[]> {
    return await db
      .select()
      .from(taskAnalyticsSnapshot)
      .where(
        and(
          gte(taskAnalyticsSnapshot.snapshotDate, dateFrom),
          gte(taskAnalyticsSnapshot.snapshotDate, dateTo)
        )
      )
      .orderBy(desc(taskAnalyticsSnapshot.snapshotDate));
  }

  async createTaskAnalyticsSnapshot(snapshot: TaskAnalyticsSnapshot): Promise<TaskAnalyticsSnapshot> {
    const [result] = await db.insert(taskAnalyticsSnapshot).values(snapshot).returning();
    return result;
  }

  // Saved search operations
  async getSavedTaskSearches(userId: number): Promise<SavedTaskSearch[]> {
    return await db
      .select()
      .from(savedTaskSearches)
      .where(eq(savedTaskSearches.userId, userId))
      .orderBy(desc(savedTaskSearches.createdAt));
  }

  async saveTaskSearch(search: InsertSavedTaskSearch): Promise<SavedTaskSearch> {
    const [result] = await db.insert(savedTaskSearches).values(search).returning();
    return result;
  }

  async deleteSavedTaskSearch(id: string): Promise<void> {
    await db.delete(savedTaskSearches).where(eq(savedTaskSearches.id, id));
  }

  // Advanced task search
  async searchTasks(filters: {
    status?: string[];
    priority?: string[];
    assigneeId?: number;
    spaceId?: string;
    clientId?: string;
    dueDateFrom?: Date;
    dueDateTo?: Date;
    tags?: string[];
    searchText?: string;
  }): Promise<Task[]> {
    let query = db.select().from(tasks);
    const conditions = [];

    if (filters.status?.length) {
      conditions.push(sql`${tasks.status} = ANY(${filters.status})`);
    }
    if (filters.priority?.length) {
      conditions.push(sql`${tasks.priority} = ANY(${filters.priority})`);
    }
    if (filters.assigneeId) {
      conditions.push(eq(tasks.assignedToId, filters.assigneeId));
    }
    if (filters.spaceId) {
      conditions.push(eq(tasks.spaceId, filters.spaceId));
    }
    if (filters.clientId) {
      conditions.push(eq(tasks.clientId, filters.clientId));
    }
    if (filters.dueDateFrom) {
      conditions.push(gte(tasks.dueDate, filters.dueDateFrom));
    }
    if (filters.dueDateTo) {
      conditions.push(gte(tasks.dueDate, filters.dueDateTo));
    }
    if (filters.tags?.length) {
      conditions.push(sql`${tasks.tags} && ${filters.tags}`);
    }
    if (filters.searchText) {
      conditions.push(
        or(
          sql`${tasks.title} ILIKE ${'%' + filters.searchText + '%'}`,
          sql`${tasks.description} ILIKE ${'%' + filters.searchText + '%'}:`
        )
      );
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions)) as typeof query;
    }

    return await query.orderBy(desc(tasks.createdAt));
  }

  // Calendar Events operations
  async getCalendarEvents(): Promise<CalendarEvent[]> {
    return await db.select().from(calendarEvents).orderBy(desc(calendarEvents.start));
  }

  async getCalendarEvent(id: string): Promise<CalendarEvent | undefined> {
    const [event] = await db.select().from(calendarEvents).where(eq(calendarEvents.id, id));
    return event;
  }

  async createCalendarEvent(eventData: InsertCalendarEvent): Promise<CalendarEvent> {
    const [event] = await db.insert(calendarEvents).values(eventData).returning();
    return event;
  }

  async updateCalendarEvent(id: string, data: Partial<InsertCalendarEvent>): Promise<CalendarEvent> {
    const [event] = await db
      .update(calendarEvents)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(calendarEvents.id, id))
      .returning();
    
    if (!event) {
      throw new Error("Calendar event not found");
    }
    return event;
  }

  async deleteCalendarEvent(id: string): Promise<void> {
    await db.delete(calendarEvents).where(eq(calendarEvents.id, id));
  }

  // Lead operations
  async getLead(id: string): Promise<Lead | undefined> {
    const [lead] = await db.select().from(leads).where(eq(leads.id, id));
    return lead;
  }

  async getLeads(options?: { limit?: number; offset?: number }): Promise<Lead[]> {
    let query = db.select().from(leads).orderBy(desc(leads.createdAt));
    
    if (options?.limit) {
      query = query.limit(options.limit) as any;
    }
    if (options?.offset) {
      query = query.offset(options.offset) as any;
    }
    
    return await query;
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

  async getContentPostsByClient(clientId: string): Promise<ContentPost[]> {
    return await db
      .select()
      .from(contentPosts)
      .where(eq(contentPosts.clientId, clientId))
      .orderBy(desc(contentPosts.createdAt));
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

  // Global search - OPTIMIZED with ILIKE for case-insensitive search
  async globalSearch(query: string) {
    // Use ILIKE for case-insensitive search (PostgreSQL specific)
    const searchTerm = `%${query}%`; // Prefix match is faster than contains

    const [clientResults, campaignResults, leadResults, contentResults, invoiceResults, ticketResults] = await Promise.all([
      // Clients: search name, email, company
      db.select().from(clients).where(
        sql`${clients.name} ILIKE ${searchTerm} OR ${clients.email} ILIKE ${searchTerm} OR ${clients.company} ILIKE ${searchTerm}`
      ).limit(5),
      // Campaigns: search name, description
      db.select().from(campaigns).where(
        sql`${campaigns.name} ILIKE ${searchTerm} OR ${campaigns.description} ILIKE ${searchTerm}`
      ).limit(5),
      // Leads: search name, email, company
      db.select().from(leads).where(
        sql`${leads.name} ILIKE ${searchTerm} OR ${leads.email} ILIKE ${searchTerm} OR ${leads.company} ILIKE ${searchTerm}`
      ).limit(5),
      // Content posts: search title
      db.select().from(contentPosts).where(
        sql`${contentPosts.caption} ILIKE ${searchTerm}`
      ).limit(5),
      // Invoices: search invoice number
      db.select().from(invoices).where(
        sql`${invoices.invoiceNumber} ILIKE ${searchTerm}`
      ).limit(5),
      // Tickets: search subject, description
      db.select().from(tickets).where(
        sql`${tickets.subject} ILIKE ${searchTerm} OR ${tickets.description} ILIKE ${searchTerm}`
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

  // User Notification Preferences operations
  // Returns default enabled preferences for all users
  // TODO: Create notification_preferences table to store user-specific settings
  async getUserNotificationPreferences(userId: number): Promise<{
    emailNotifications: boolean;
    taskUpdates: boolean;
    dueDateReminders: boolean;
  }> {
    // For now, return default preferences (all enabled)
    // In the future, this should query a notification_preferences table
    console.log(`📧 Getting notification preferences for user ${userId} - returning defaults (all enabled)`);
    return {
      emailNotifications: true,
      taskUpdates: true,
      dueDateReminders: true,
    };
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

  // Second Me operations
  async getSecondMe(clientId: string): Promise<SecondMe | undefined> {
    const [record] = await db
      .select()
      .from(secondMe)
      .where(eq(secondMe.clientId, clientId))
      .limit(1);
    return record;
  }

  async getAllSecondMeRequests(): Promise<SecondMe[]> {
    return await db
      .select()
      .from(secondMe)
      .orderBy(desc(secondMe.createdAt));
  }

  async createSecondMe(data: InsertSecondMe): Promise<SecondMe> {
    const [record] = await db
      .insert(secondMe)
      .values(data)
      .returning();
    return record;
  }

  async updateSecondMe(id: string, data: Partial<InsertSecondMe>): Promise<SecondMe> {
    const [record] = await db
      .update(secondMe)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(secondMe.id, id))
      .returning();
    return record;
  }

  async getSecondMeContent(secondMeId: string): Promise<SecondMeContent[]> {
    return await db
      .select()
      .from(secondMeContent)
      .where(eq(secondMeContent.secondMeId, secondMeId))
      .orderBy(desc(secondMeContent.createdAt));
  }

  async createSecondMeContent(data: InsertSecondMeContent): Promise<SecondMeContent> {
    const [record] = await db
      .insert(secondMeContent)
      .values(data)
      .returning();
    return record;
  }

  async createBulkSecondMeContent(content: InsertSecondMeContent[]): Promise<SecondMeContent[]> {
    return await db
      .insert(secondMeContent)
      .values(content)
      .returning();
  }

  // Page Views operations (Website Analytics Tracking)
  async trackPageView(data: InsertPageView): Promise<PageView> {
    const [record] = await db
      .insert(pageViews)
      .values(data)
      .returning();
    return record;
  }

  async getPageViews(days: number = 30): Promise<PageView[]> {
    const dateLimit = new Date();
    dateLimit.setDate(dateLimit.getDate() - days);
    
    return await db
      .select()
      .from(pageViews)
      .where(gte(pageViews.createdAt, dateLimit))
      .orderBy(desc(pageViews.createdAt));
  }

  async getPageViewsCount(days: number = 30): Promise<number> {
    const dateLimit = new Date();
    dateLimit.setDate(dateLimit.getDate() - days);
    
    const result = await db
      .select({ count: count() })
      .from(pageViews)
      .where(gte(pageViews.createdAt, dateLimit));
    
    return result[0]?.count || 0;
  }

  async getUniqueVisitors(days: number = 30): Promise<number> {
    const dateLimit = new Date();
    dateLimit.setDate(dateLimit.getDate() - days);
    
    const result = await db
      .selectDistinct({ sessionId: pageViews.sessionId })
      .from(pageViews)
      .where(gte(pageViews.createdAt, dateLimit));
    
    return result.length;
  }

  async getTopPages(days: number = 30, limit: number = 10) {
    const dateLimit = new Date();
    dateLimit.setDate(dateLimit.getDate() - days);
    
    const result = await db
      .select({
        page: pageViews.page,
        views: count(pageViews.id)
      })
      .from(pageViews)
      .where(gte(pageViews.createdAt, dateLimit))
      .groupBy(pageViews.page)
      .orderBy(desc(count(pageViews.id)))
      .limit(limit);
    
    return result;
  }

  // Scheduled AI Commands operations
  async getDueScheduledAiCommands(): Promise<ScheduledAiCommand[]> {
    return await db
      .select()
      .from(scheduledAiCommands)
      .where(and(
        eq(scheduledAiCommands.status, "pending"),
        sql`${scheduledAiCommands.nextRunAt} <= NOW()`
      ))
      .orderBy(scheduledAiCommands.nextRunAt)
      .limit(10);
  }

  async createScheduledAiCommand(commandData: InsertScheduledAiCommand): Promise<ScheduledAiCommand> {
    const [command] = await db.insert(scheduledAiCommands).values(commandData).returning();
    return command;
  }

  async updateScheduledAiCommand(id: string, data: Partial<InsertScheduledAiCommand>): Promise<ScheduledAiCommand> {
    const [command] = await db
      .update(scheduledAiCommands)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(scheduledAiCommands.id, id))
      .returning();
    return command;
  }

  // Marketing Series operations
  async getMarketingSeriesWithSteps(id: string): Promise<(MarketingSeries & { steps: MarketingSeriesStep[] }) | undefined> {
    const [series] = await db.select().from(marketingSeries).where(eq(marketingSeries.id, id));
    if (!series) return undefined;
    const steps = await db
      .select()
      .from(marketingSeriesSteps)
      .where(eq(marketingSeriesSteps.seriesId, id))
      .orderBy(marketingSeriesSteps.stepOrder);
    return { ...series, steps };
  }

  async getDueSeriesEnrollments(): Promise<MarketingSeriesEnrollment[]> {
    return await db
      .select()
      .from(marketingSeriesEnrollments)
      .where(and(
        eq(marketingSeriesEnrollments.status, "active"),
        sql`${marketingSeriesEnrollments.nextStepAt} <= NOW()`
      ))
      .orderBy(marketingSeriesEnrollments.nextStepAt)
      .limit(20);
  }

  async createMarketingSeries(seriesData: InsertMarketingSeries): Promise<MarketingSeries> {
    const [series] = await db.insert(marketingSeries).values(seriesData).returning();
    return series;
  }

  async createMarketingSeriesStep(stepData: InsertMarketingSeriesStep): Promise<MarketingSeriesStep> {
    const [step] = await db.insert(marketingSeriesSteps).values(stepData).returning();
    return step;
  }

  async createMarketingSeriesEnrollment(enrollmentData: InsertMarketingSeriesEnrollment): Promise<MarketingSeriesEnrollment> {
    const [enrollment] = await db.insert(marketingSeriesEnrollments).values(enrollmentData).returning();
    return enrollment;
  }

  async updateMarketingSeriesEnrollment(id: string, data: Partial<InsertMarketingSeriesEnrollment>): Promise<MarketingSeriesEnrollment> {
    const [enrollment] = await db
      .update(marketingSeriesEnrollments)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(marketingSeriesEnrollments.id, id))
      .returning();
    return enrollment;
  }

  // Task automation operations
  async getDueTasksForAllAssignees(): Promise<Task[]> {
    return await db
      .select()
      .from(tasks)
      .where(and(
        eq(tasks.status, "pending"),
        sql`${tasks.dueDate} <= NOW()`
      ))
      .orderBy(tasks.dueDate)
      .limit(50);
  }

  async updateTaskAssignee(taskId: string, assigneeId: number | null): Promise<Task> {
    const [task] = await db
      .update(tasks)
      .set({ assigneeId, updatedAt: new Date() })
      .where(eq(tasks.id, taskId))
      .returning();
    return task;
  }

  // Lead automation operations
  async getDueLeadAutomations(): Promise<LeadAutomation[]> {
    return await db
      .select()
      .from(leadAutomations)
      .where(and(
        eq(leadAutomations.isActive, true),
        sql`${leadAutomations.nextRunAt} <= NOW()`
      ))
      .orderBy(leadAutomations.nextRunAt)
      .limit(20);
  }

  // Marketing Broadcast operations
  async getMarketingBroadcasts(): Promise<MarketingBroadcast[]> {
    return await db.select().from(marketingBroadcasts).orderBy(desc(marketingBroadcasts.createdAt));
  }

  async getMarketingBroadcast(id: string): Promise<MarketingBroadcast | undefined> {
    const [broadcast] = await db.select().from(marketingBroadcasts).where(eq(marketingBroadcasts.id, id));
    return broadcast;
  }

  async createMarketingBroadcast(broadcast: InsertMarketingBroadcast): Promise<MarketingBroadcast> {
    const [created] = await db.insert(marketingBroadcasts).values(broadcast).returning();
    return created;
  }

  async updateMarketingBroadcast(id: string, data: Partial<InsertMarketingBroadcast>): Promise<MarketingBroadcast> {
    const [updated] = await db
      .update(marketingBroadcasts)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(marketingBroadcasts.id, id))
      .returning();
    return updated;
  }

  async deleteMarketingBroadcast(id: string): Promise<void> {
    await db.delete(marketingBroadcasts).where(eq(marketingBroadcasts.id, id));
  }

  // Marketing Broadcast Recipient operations
  async getMarketingBroadcastRecipients(broadcastId: string): Promise<MarketingBroadcastRecipient[]> {
    return await db
      .select()
      .from(marketingBroadcastRecipients)
      .where(eq(marketingBroadcastRecipients.broadcastId, broadcastId))
      .orderBy(desc(marketingBroadcastRecipients.createdAt));
  }

  async createMarketingBroadcastRecipient(recipient: InsertMarketingBroadcastRecipient): Promise<MarketingBroadcastRecipient> {
    const [created] = await db.insert(marketingBroadcastRecipients).values(recipient).returning();
    return created;
  }

  async updateMarketingBroadcastRecipient(id: string, data: Partial<InsertMarketingBroadcastRecipient>): Promise<MarketingBroadcastRecipient> {
    const [updated] = await db
      .update(marketingBroadcastRecipients)
      .set(data)
      .where(eq(marketingBroadcastRecipients.id, id))
      .returning();
    return updated;
  }

  async getMarketingBroadcastRecipientByProviderCallId(providerCallId: string): Promise<MarketingBroadcastRecipient | undefined> {
    const [recipient] = await db
      .select()
      .from(marketingBroadcastRecipients)
      .where(eq(marketingBroadcastRecipients.providerCallId, providerCallId));
    return recipient;
  }

  // Marketing Groups operations (legacy raw SQL tables)
  async getMarketingGroups(): Promise<any[]> {
    const result = await pool.query(`
      SELECT g.*, 
        (SELECT COUNT(*) FROM marketing_group_members WHERE group_id = g.id) as member_count
      FROM marketing_groups g
      ORDER BY g.created_at DESC
    `);
    return result.rows;
  }

  async getMarketingTemplates(): Promise<any[]> {
    const result = await pool.query(`
      SELECT * FROM marketing_templates
      ORDER BY created_at DESC
    `);
    return result.rows;
  }

  async getMarketingSeries(): Promise<any[]> {
    const result = await pool.query(`
      SELECT * FROM marketing_series
      ORDER BY created_at DESC
    `);
    return result.rows;
  }

  async getMarketingStats(): Promise<{
    totalBroadcasts: number;
    totalGroups: number;
    totalTemplates: number;
    totalSeries: number;
    recentBroadcasts: any[];
  }> {
    const [broadcastsResult] = await db.select({ count: count() }).from(marketingBroadcasts);
    const groupsResult = await pool.query(`SELECT COUNT(*) as count FROM marketing_groups`);
    const templatesResult = await pool.query(`SELECT COUNT(*) as count FROM marketing_templates`);
    const seriesResult = await pool.query(`SELECT COUNT(*) as count FROM marketing_series`);
    const recentBroadcasts = await db
      .select()
      .from(marketingBroadcasts)
      .orderBy(desc(marketingBroadcasts.createdAt))
      .limit(5);
    
    return {
      totalBroadcasts: Number(broadcastsResult.count) || 0,
      totalGroups: parseInt(groupsResult.rows[0]?.count || '0'),
      totalTemplates: parseInt(templatesResult.rows[0]?.count || '0'),
      totalSeries: parseInt(seriesResult.rows[0]?.count || '0'),
      recentBroadcasts,
    };
  }

  // Marketing Group Members operations
  async getMarketingGroupMembers(groupId: string): Promise<any[]> {
    const result = await pool.query(`
      SELECT m.*, 
        CASE 
          WHEN m.lead_id IS NOT NULL THEN l.name
          WHEN m.client_id IS NOT NULL THEN c.name
          ELSE m.custom_recipient
        END as member_name,
        l.email as lead_email, l.phone as lead_phone,
        c.email as client_email, c.phone as client_phone
      FROM marketing_group_members m
      LEFT JOIN leads l ON m.lead_id = l.id
      LEFT JOIN clients c ON m.client_id = c.id
      WHERE m.group_id = $1
      ORDER BY m.created_at DESC
    `, [groupId]);
    return result.rows;
  }

  async createMarketingGroup(group: { name: string; description?: string; createdBy: number }): Promise<any> {
    const result = await pool.query(`
      INSERT INTO marketing_groups (name, description, created_by)
      VALUES ($1, $2, $3)
      RETURNING *
    `, [group.name, group.description, group.createdBy]);
    return result.rows[0];
  }

  async addMarketingGroupMember(data: { groupId: string; leadId?: string; clientId?: string; customRecipient?: string }): Promise<any> {
    const result = await pool.query(`
      INSERT INTO marketing_group_members (group_id, lead_id, client_id, custom_recipient)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `, [data.groupId, data.leadId, data.clientId, data.customRecipient]);
    return result.rows[0];
  }

  async removeMarketingGroupMember(id: number): Promise<void> {
    await pool.query(`DELETE FROM marketing_group_members WHERE id = $1`, [id]);
  }

  async deleteMarketingGroup(id: string): Promise<void> {
    await pool.query(`DELETE FROM marketing_groups WHERE id = $1`, [id]);
  }

  // Marketing Template operations
  async createMarketingTemplate(template: { name: string; type: string; subject?: string; content: string; createdBy: number }): Promise<any> {
    const result = await pool.query(`
      INSERT INTO marketing_templates (name, type, subject, content, created_by)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `, [template.name, template.type, template.subject, template.content, template.createdBy]);
    return result.rows[0];
  }

  async updateMarketingTemplate(id: string, data: Partial<{ name: string; type: string; subject: string; content: string }>): Promise<any> {
    const updates: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;
    
    if (data.name !== undefined) {
      updates.push(`name = ${paramIndex++}`);
      values.push(data.name);
    }
    if (data.type !== undefined) {
      updates.push(`type = ${paramIndex++}`);
      values.push(data.type);
    }
    if (data.subject !== undefined) {
      updates.push(`subject = ${paramIndex++}`);
      values.push(data.subject);
    }
    if (data.content !== undefined) {
      updates.push(`content = ${paramIndex++}`);
      values.push(data.content);
    }
    
    if (updates.length === 0) return { id };
    
    values.push(id);
    const result = await pool.query(`
      UPDATE marketing_templates
      SET ${updates.join(', ')}, updated_at = NOW()
      WHERE id = ${paramIndex}
      RETURNING *
    `, values);
    return result.rows[0];
  }

  async deleteMarketingTemplate(id: string): Promise<void> {
    await pool.query(`DELETE FROM marketing_templates WHERE id = $1`, [id]);
  }

  // Marketing Series operations
  async getMarketingSeriesSteps(seriesId: string): Promise<any[]> {
    const result = await pool.query(`
      SELECT * FROM marketing_series_steps
      WHERE series_id = $1
      ORDER BY step_order ASC
    `, [seriesId]);
    return result.rows;
  }

  async updateMarketingSeries(id: string, data: Partial<{ name: string; description: string; isActive: boolean }>): Promise<any> {
    const updates: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;
    
    if (data.name !== undefined) {
      updates.push(`name = ${paramIndex++}`);
      values.push(data.name);
    }
    if (data.description !== undefined) {
      updates.push(`description = ${paramIndex++}`);
      values.push(data.description);
    }
    if (data.isActive !== undefined) {
      updates.push(`is_active = ${paramIndex++}`);
      values.push(data.isActive);
    }
    
    if (updates.length === 0) return { id };
    
    values.push(id);
    const result = await pool.query(`
      UPDATE marketing_series
      SET ${updates.join(', ')}, updated_at = NOW()
      WHERE id = ${paramIndex}
      RETURNING *
    `, values);
    return result.rows[0];
  }

  async deleteMarketingSeries(id: string): Promise<void> {
    await pool.query(`DELETE FROM marketing_series WHERE id = $1`, [id]);
  }

  async updateMarketingSeriesStep(id: string, data: Partial<{ subject: string; content: string; delayDays: number }>): Promise<any> {
    const updates: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;
    
    if (data.subject !== undefined) {
      updates.push(`subject = ${paramIndex++}`);
      values.push(data.subject);
    }
    if (data.content !== undefined) {
      updates.push(`content = ${paramIndex++}`);
      values.push(data.content);
    }
    if (data.delayDays !== undefined) {
      updates.push(`delay_days = ${paramIndex++}`);
      values.push(data.delayDays);
    }
    
    if (updates.length === 0) return { id };
    
    values.push(id);
    const result = await pool.query(`
      UPDATE marketing_series_steps
      SET ${updates.join(', ')}
      WHERE id = ${paramIndex}
      RETURNING *
    `, values);
    return result.rows[0];
  }

  async deleteMarketingSeriesStep(id: string): Promise<void> {
    await pool.query(`DELETE FROM marketing_series_steps WHERE id = $1`, [id]);
  }
}

export const storage = new DatabaseStorage();

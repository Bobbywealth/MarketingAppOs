import {
  users,
  clients,
  campaigns,
  tasks,
  taskSpaces,
  userViewPreferences,
  userNotificationPreferences,
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
  pushNotificationHistory,
  activityLogs,
  emails,
  emailAccounts,
  rolePermissions,
  subscriptionPackages,
  calendarEvents,
  secondMe,
  secondMeContent,
  pageViews,
  marketingBroadcasts,
  marketingBroadcastRecipients,
  marketingGroups,
  marketingGroupMembers,
  courses,
  courseModules,
  courseLessons,
  courseEnrollments,
  clientSocialStats,
  socialAccounts,
  socialAccountMetricsSnapshots,
  clientCreators,
  creatorVisits,
  commissions,
  discountRedemptions,
  smsMessages,
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
  type UserNotificationPreferences,
  type InsertUserNotificationPreferences,
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
  type PushNotificationHistory,
  type InsertPushNotificationHistory,
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
  type Course,
  type InsertCourse,
  type CourseModule,
  type InsertCourseModule,
  type CourseLesson,
  type InsertCourseLesson,
  type CourseEnrollment,
  type InsertCourseEnrollment,
  groupConversations,
  groupConversationMembers,
  groupMessages,
  type GroupConversation,
  type GroupMessage,
  type MarketingBroadcast,
  type InsertMarketingBroadcast,
  type MarketingBroadcastRecipient,
  type InsertMarketingBroadcastRecipient,
  type MarketingGroup,
  type InsertMarketingGroup,
  type MarketingGroupMember,
  type InsertMarketingGroupMember,
} from "@shared/schema";
import { db, pool } from "./db";
import { eq, desc, or, and, gte, lt, lte, count, inArray, sum, sql, isNotNull } from "drizzle-orm";

export interface GroupConversationWithParticipants extends GroupConversation {
  participants: Array<{ id: number; username: string; role: string }>;
}

export interface GroupMessageWithAuthor extends GroupMessage {
  authorName: string;
  authorRole: string;
}

export interface IStorage {
  // User operations
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserByResetToken(token: string): Promise<User | undefined>;
  getUserByEmailVerificationToken(token: string): Promise<User | undefined>;
  updateUserResetToken(userId: number, token: string | null, expires: Date | null): Promise<void>;
  updateUserEmailVerification(userId: number, verified: boolean, token: string | null): Promise<void>;
  updateUserPassword(userId: number, password: string): Promise<void>;
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
  getTaskSpacesForAssignee(userId: number): Promise<TaskSpace[]>;
  getTaskSpace(id: string): Promise<TaskSpace | undefined>;
  createTaskSpace(space: InsertTaskSpace): Promise<TaskSpace>;
  updateTaskSpace(id: string, data: Partial<InsertTaskSpace>): Promise<TaskSpace>;
  deleteTaskSpace(id: string): Promise<void>;
  
  // Task operations
  getTasks(): Promise<Task[]>;
  getTask(id: string): Promise<Task | undefined>;
  getTasksAssignedToUser(userId: number): Promise<Task[]>;
  getTasksBySpace(spaceId: string): Promise<Task[]>;
  getTasksByClient(clientId: string): Promise<Task[]>;
  getDueTasksForAssignee(
    userId: number,
    dueBy: Date
  ): Promise<Array<Pick<Task, "id" | "title" | "dueDate" | "assignedToId" | "status">>>;
  getDueTasksForAllAssignees(
    dueBy: Date
  ): Promise<Array<Pick<Task, "id" | "title" | "dueDate" | "assignedToId" | "status">>>;
  createTask(task: InsertTask): Promise<Task>;
  updateTask(id: string, data: Partial<InsertTask>): Promise<Task>;
  deleteTask(id: string): Promise<void>;
  
  // Task comment operations
  getTaskComments(taskId: string): Promise<TaskComment[]>;
  createTaskComment(comment: InsertTaskComment): Promise<TaskComment>;
  
  // Calendar Events operations
  getCalendarEvents(): Promise<CalendarEvent[]>;
  getCalendarEvent(id: string): Promise<CalendarEvent | undefined>;
  createCalendarEvent(event: InsertCalendarEvent): Promise<CalendarEvent>;
  updateCalendarEvent(id: string, data: Partial<InsertCalendarEvent>): Promise<CalendarEvent>;
  deleteCalendarEvent(id: string): Promise<void>;
  
  // User View Preferences operations
  getUserViewPreferences(userId: number): Promise<UserViewPreferences | undefined>;
  upsertUserViewPreferences(userId: number, preferences: Partial<InsertUserViewPreferences>): Promise<UserViewPreferences>;

  // Lead operations
  getLeads(): Promise<Lead[]>;
  getLead(id: string): Promise<Lead | undefined>;
  getLeadByEmail(email: string): Promise<Lead | undefined>;
  createLead(lead: InsertLead): Promise<Lead>;
  updateLead(id: string, data: Partial<InsertLead>): Promise<Lead>;
  deleteLead(id: string): Promise<void>;

  // Lead activity operations
  getLeadActivities(leadId: string): Promise<LeadActivity[]>;
  getAllLeadActivities(): Promise<LeadActivity[]>;
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

  // Group conversation operations
  getGroupConversations(userId: number): Promise<GroupConversationWithParticipants[]>;
  createGroupConversation(data: { name: string; createdBy: number; memberIds: number[] }): Promise<GroupConversationWithParticipants>;
  isGroupConversationMember(conversationId: string, userId: number): Promise<boolean>;
  getGroupMessages(conversationId: string): Promise<GroupMessageWithAuthor[]>;
  createGroupMessage(data: { conversationId: string; userId: number; content: string; mediaUrl?: string | null; mediaType?: string | null; durationMs?: number | null }): Promise<GroupMessage>;

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

  // Push notification history operations
  getPushNotificationHistory(): Promise<PushNotificationHistory[]>;
  createPushNotificationHistory(history: InsertPushNotificationHistory): Promise<PushNotificationHistory>;

  // Notifications operations
  getNotifications(userId: number): Promise<Notification[]>;
  getNotificationsByActionUrls(userId: number, actionUrls: string[]): Promise<Notification[]>;
  getUnreadNotificationsByActionUrls(userId: number, actionUrls: string[]): Promise<Notification[]>;
  createNotification(notification: InsertNotification): Promise<Notification>;
  markNotificationAsRead(notificationId: string): Promise<void>;
  markAllNotificationsAsRead(userId: number): Promise<void>;
  deleteNotification(notificationId: string): Promise<void>;

  // Global search
  globalSearch(query: string): Promise<{
    clients: Client[];
    campaigns: Campaign[];
    leads: Lead[];
    contentPosts: ContentPost[];
    invoices: Invoice[];
    tickets: Ticket[];
  }>;

  // Optimized dashboard stats
  getDashboardStats(userId?: number, role?: string): Promise<any>;

  // Marketing Broadcast operations
  getMarketingBroadcasts(): Promise<MarketingBroadcast[]>;
  getMarketingBroadcast(id: string): Promise<MarketingBroadcast | undefined>;
  createMarketingBroadcast(data: InsertMarketingBroadcast): Promise<MarketingBroadcast>;
  updateMarketingBroadcast(id: string, data: Partial<InsertMarketingBroadcast>): Promise<MarketingBroadcast>;
  getMarketingBroadcastRecipients(broadcastId: string): Promise<MarketingBroadcastRecipient[]>;
  createMarketingBroadcastRecipient(data: InsertMarketingBroadcastRecipient): Promise<MarketingBroadcastRecipient>;
  updateMarketingBroadcastRecipient(id: number, data: Partial<InsertMarketingBroadcastRecipient>): Promise<MarketingBroadcastRecipient>;

  // Marketing Group operations
  getMarketingGroups(): Promise<MarketingGroup[]>;
  getMarketingGroup(id: string): Promise<MarketingGroup | undefined>;
  createMarketingGroup(data: InsertMarketingGroup): Promise<MarketingGroup>;
  updateMarketingGroup(id: string, data: Partial<InsertMarketingGroup>): Promise<MarketingGroup>;
  deleteMarketingGroup(id: string): Promise<void>;
  getMarketingGroupMembers(groupId: string): Promise<MarketingGroupMember[]>;
  addMarketingGroupMember(data: InsertMarketingGroupMember): Promise<MarketingGroupMember>;
  removeMarketingGroupMember(id: number): Promise<void>;

  // Course operations
  getCourses(creatorId?: string): Promise<Course[]>;
  getCourse(id: string): Promise<Course | undefined>;
  getCourseWithContent(id: string): Promise<Course & { modules: (CourseModule & { lessons: CourseLesson[] })[] }>;
  createCourse(course: InsertCourse): Promise<Course>;
  updateCourse(id: string, data: Partial<InsertCourse>): Promise<Course>;
  deleteCourse(id: string): Promise<void>;

  // Course Module operations
  getCourseModules(courseId: string): Promise<CourseModule[]>;
  createCourseModule(module: InsertCourseModule): Promise<CourseModule>;
  updateCourseModule(id: string, data: Partial<InsertCourseModule>): Promise<CourseModule>;
  deleteCourseModule(id: string): Promise<void>;

  // Course Lesson operations
  getCourseLessons(moduleId: string): Promise<CourseLesson[]>;
  createCourseLesson(lesson: InsertCourseLesson): Promise<CourseLesson>;
  updateCourseLesson(id: string, data: Partial<InsertCourseLesson>): Promise<CourseLesson>;
  deleteCourseLesson(id: string): Promise<void>;

  // Course Enrollment operations
  getCourseEnrollment(courseId: string, userId: number): Promise<CourseEnrollment | undefined>;
  getUserEnrollments(userId: number): Promise<(CourseEnrollment & { course: Course })[]>;
  enrollInCourse(enrollment: InsertCourseEnrollment): Promise<CourseEnrollment>;
  updateCourseEnrollment(id: string, data: Partial<InsertCourseEnrollment>): Promise<CourseEnrollment>;

  // Creator operations
  getCreators(): Promise<Creator[]>;
  getCreator(id: string): Promise<Creator | undefined>;
  getCreatorByEmail(email: string): Promise<Creator | undefined>;
  getCreatorByUserId(userId: number): Promise<Creator | undefined>;
  createCreator(creator: InsertCreator): Promise<Creator>;
  updateCreator(id: string, data: Partial<InsertCreator>): Promise<Creator>;
  deleteCreator(id: string): Promise<void>;
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

  async getAdminUsers(): Promise<User[]> {
    return await db.select().from(users).where(eq(users.role, "admin"));
  }

  async getUsersByClientId(clientId: string): Promise<User[]> {
    return await db.select().from(users).where(eq(users.clientId, clientId));
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

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async getUserByResetToken(token: string): Promise<User | undefined> {
    const [user] = await db
      .select()
      .from(users)
      .where(
        and(
          eq(users.resetPasswordToken, token),
          gte(users.resetPasswordExpires, new Date())
        )
      );
    return user;
  }

  async getUserByEmailVerificationToken(token: string): Promise<User | undefined> {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.emailVerificationToken, token));
    return user;
  }

  async updateUserResetToken(userId: number, token: string | null, expires: Date | null): Promise<void> {
    await db
      .update(users)
      .set({
        resetPasswordToken: token,
        resetPasswordExpires: expires,
      })
      .where(eq(users.id, userId));
  }

  async updateUserEmailVerification(userId: number, verified: boolean, token: string | null): Promise<void> {
    await db
      .update(users)
      .set({
        emailVerified: verified,
        emailVerificationToken: token,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId));
  }

  async updateUserPassword(userId: number, password: string): Promise<void> {
    await db
      .update(users)
      .set({
        password,
        resetPasswordToken: null,
        resetPasswordExpires: null,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId));
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

  async updateUser(
    userId: number,
    updates: Partial<InsertUser> & { customPermissions?: Record<string, boolean> | null }
  ): Promise<User> {
    const payload = {
      ...updates,
      updatedAt: new Date(),
    };
    const [user] = await db
      .update(users)
      .set(payload)
      .where(eq(users.id, userId))
      .returning();
    if (!user) {
      throw new Error("User not found");
    }
    return user;
  }

  async deleteUser(userId: number): Promise<void> {
    // Delete all related records first to avoid foreign key constraint violations
    try {
      console.log(`🗑️ Starting deletion process for user ${userId}`);
      
      // Delete push notification history (sentBy references users) - optional table
      try {
        await db.delete(pushNotificationHistory).where(eq(pushNotificationHistory.sentBy, userId));
        console.log(`   ✓ Deleted push notification history records`);
      } catch (err: any) {
        if (!err.message?.includes('does not exist')) {
          console.warn(`   ⚠ Warning deleting push notification history:`, err.message);
        }
      }
      
      // Delete notifications
      await db.delete(notifications).where(eq(notifications.userId, userId));
      console.log(`   ✓ Deleted notifications`);
      
      // Delete messages (both as sender and recipient)
      await db.delete(messages).where(or(eq(messages.userId, userId), eq(messages.recipientId, userId)));
      console.log(`   ✓ Deleted messages`);

      // Delete group chat data
      await db.delete(groupMessages).where(eq(groupMessages.userId, userId));
      await db.delete(groupConversationMembers).where(eq(groupConversationMembers.userId, userId));
      await db.delete(groupConversations).where(eq(groupConversations.createdBy, userId));
      console.log(`   ✓ Cleaned up group conversations`);
      
      // Delete task comments by this user
      await db.delete(taskComments).where(eq(taskComments.userId, userId));
      console.log(`   ✓ Deleted task comments`);
      
      // Update tasks - set assignedToId to null
      await db.update(tasks).set({ assignedToId: null }).where(eq(tasks.assignedToId, userId));
      console.log(`   ✓ Updated tasks (unassigned)`);
      
      // Update tickets - set assignedToId to null
      await db.update(tickets).set({ assignedToId: null }).where(eq(tickets.assignedToId, userId));
      console.log(`   ✓ Updated tickets (unassigned)`);
      
      // Update clients - set assignedToId to null
      await db.update(clients).set({ assignedToId: null }).where(eq(clients.assignedToId, userId));
      console.log(`   ✓ Updated clients (unassigned)`);
      
      // Update users - set clientId to null
      await db.update(users).set({ clientId: null }).where(eq(users.clientId, String(userId)));
      console.log(`   ✓ Updated users (unlinked from client)`);
      
      // Update leads - set assignedToId to null
      await db.update(leads).set({ assignedToId: null }).where(eq(leads.assignedToId, userId));
      console.log(`   ✓ Updated leads (unassigned)`);
      
      // Delete or update lead activities (userId column might not exist in older databases)
      try {
        await db.delete(leadActivities).where(eq(leadActivities.userId, userId));
        console.log(`   ✓ Deleted lead activities`);
      } catch (err: any) {
        if (!err.message?.includes('does not exist')) {
          console.warn(`   ⚠ Warning deleting lead activities:`, err.message);
        }
      }
      
      // Delete campaigns created by this user (since createdBy might not allow null)
      try {
        await db.delete(campaigns).where(eq(campaigns.createdBy, userId));
        console.log(`   ✓ Deleted campaigns`);
      } catch (err: any) {
        // If delete fails, try to set to null (in case createdBy allows null)
        try {
          await db.update(campaigns).set({ createdBy: null }).where(eq(campaigns.createdBy, userId));
          console.log(`   ✓ Updated campaigns (set createdBy to null)`);
        } catch (err2: any) {
          console.warn(`   ⚠ Warning handling campaigns:`, err2.message);
        }
      }
      
      // Delete task spaces created by this user (since createdBy is notNull)
      try {
        await db.delete(taskSpaces).where(eq(taskSpaces.createdBy, userId));
        console.log(`   ✓ Deleted task spaces`);
      } catch (err: any) {
        console.warn(`   ⚠ Warning deleting task spaces:`, err.message);
      }
      
      // Delete or update project feedback (userId column might not exist in older databases)
      try {
        await db.delete(projectFeedback).where(eq(projectFeedback.userId, userId));
        console.log(`   ✓ Deleted project feedback`);
      } catch (err: any) {
        if (!err.message?.includes('does not exist')) {
          console.warn(`   ⚠ Warning deleting project feedback:`, err.message);
        }
      }
      
      // Delete calendar events created by this user (optional table)
      try {
        await db.delete(calendarEvents).where(eq(calendarEvents.createdBy, userId));
        console.log(`   ✓ Deleted calendar events`);
      } catch (err: any) {
        if (!err.message?.includes('does not exist')) {
          console.warn(`   ⚠ Warning deleting calendar events:`, err.message);
        }
      }
      
      // Delete emails (optional table)
      try {
        await db.delete(emails).where(eq(emails.userId, userId));
        console.log(`   ✓ Deleted emails`);
      } catch (err: any) {
        if (!err.message?.includes('does not exist')) {
          console.warn(`   ⚠ Warning deleting emails:`, err.message);
        }
      }
      
      // Delete email accounts (optional table)
      try {
        await db.delete(emailAccounts).where(eq(emailAccounts.userId, userId));
        console.log(`   ✓ Deleted email accounts`);
      } catch (err: any) {
        if (!err.message?.includes('does not exist')) {
          console.warn(`   ⚠ Warning deleting email accounts:`, err.message);
        }
      }
      
      // Delete activity logs (optional table)
      try {
        await db.delete(activityLogs).where(eq(activityLogs.userId, userId));
        console.log(`   ✓ Deleted activity logs`);
      } catch (err: any) {
        if (!err.message?.includes('does not exist')) {
          console.warn(`   ⚠ Warning deleting activity logs:`, err.message);
        }
      }
      
      // Delete user view preferences (optional table)
      try {
        await db.delete(userViewPreferences).where(eq(userViewPreferences.userId, userId));
        console.log(`   ✓ Deleted user view preferences`);
      } catch (err: any) {
        if (!err.message?.includes('does not exist')) {
          console.warn(`   ⚠ Warning deleting user view preferences:`, err.message);
        }
      }
      
      // Delete user notification preferences (optional table)
      try {
        await db.delete(userNotificationPreferences).where(eq(userNotificationPreferences.userId, userId));
        console.log(`   ✓ Deleted user notification preferences`);
      } catch (err: any) {
        if (!err.message?.includes('does not exist')) {
          console.warn(`   ⚠ Warning deleting user notification preferences:`, err.message);
        }
      }
      
      // Update client documents - set uploadedBy to null (it's varchar, so we'll use SQL)
      try {
        await pool.query('UPDATE client_documents SET uploaded_by = NULL WHERE uploaded_by = $1', [String(userId)]);
        console.log(`   ✓ Updated client documents`);
      } catch (err: any) {
        console.warn(`   ⚠ Warning updating client documents:`, err.message);
      }
      
      // Delete SMS messages associated with this user
      try {
        await pool.query('DELETE FROM sms_messages WHERE user_id = $1', [userId]);
        console.log(`   ✓ Deleted SMS messages`);
      } catch (err: any) {
        if (!err.message?.includes('does not exist')) {
          console.warn(`   ⚠ Warning deleting SMS messages:`, err.message);
        }
      }

      // Delete push subscriptions (if table exists)
      try {
        await pool.query('DELETE FROM push_subscriptions WHERE user_id = $1', [userId]);
        console.log(`   ✓ Deleted push subscriptions`);
      } catch (err: any) {
        // Ignore if table doesn't exist or column doesn't exist
        if (!err.message?.includes('does not exist')) {
          console.warn(`   ⚠ Warning deleting push subscriptions:`, err.message);
        }
      }
      
      // Delete sessions that might reference this user (sessions store user ID in JSON)
      try {
        await pool.query(`DELETE FROM sessions WHERE sess->>'passport'->>'user' = $1`, [String(userId)]);
        console.log(`   ✓ Deleted user sessions`);
      } catch (err: any) {
        // Ignore if this fails - sessions will expire anyway
        console.warn(`   ⚠ Warning deleting sessions:`, err.message);
      }
      
      // Finally, delete the user
      await db.delete(users).where(eq(users.id, userId));
      console.log(`✅ User ${userId} deleted successfully`);
    } catch (error: any) {
      console.error(`❌ Error deleting user ${userId}:`, error);
      console.error('Error details:', {
        message: error.message,
        code: error.code,
        detail: error.detail,
        constraint: error.constraint,
        table: error.table,
        stack: error.stack?.split('\n').slice(0, 5).join('\n'),
      });
      // If it's a foreign key constraint error, provide more details
      if (error.code === '23503' || error.message?.includes('foreign key') || error.message?.includes('violates foreign key')) {
        throw new Error(`Cannot delete user: This user has related records that prevent deletion. Table: ${error.table || 'unknown'}, Constraint: ${error.constraint || 'unknown'}. Details: ${error.detail || error.message}`);
      }
      throw error;
    }
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
    try {
      console.log(`🗑️ Starting deletion process for client ${id}`);

      // 1. Social & Stats
      try {
        await db.delete(clientSocialStats).where(eq(clientSocialStats.clientId, id));
        console.log(`   ✓ Deleted social stats`);
      } catch (err: any) {
        console.warn(`   ⚠ Warning deleting social stats:`, err.message);
      }

      try {
        const accounts = await db.select().from(socialAccounts).where(eq(socialAccounts.clientId, id));
        for (const acc of accounts) {
          await db.delete(socialAccountMetricsSnapshots).where(eq(socialAccountMetricsSnapshots.socialAccountId, acc.id));
        }
        await db.delete(socialAccounts).where(eq(socialAccounts.clientId, id));
        console.log(`   ✓ Deleted social accounts and snapshots`);
      } catch (err: any) {
        console.warn(`   ⚠ Warning deleting social accounts:`, err.message);
      }

      try {
        await db.delete(analyticsMetrics).where(eq(analyticsMetrics.clientId, id));
        console.log(`   ✓ Deleted analytics metrics`);
      } catch (err: any) {
        console.warn(`   ⚠ Warning deleting analytics metrics:`, err.message);
      }

      // 2. Campaigns & Tasks
      try {
        const clientTasks = await db.select().from(tasks).where(eq(tasks.clientId, id));
        if (clientTasks.length > 0) {
          await db.delete(taskComments).where(inArray(taskComments.taskId, clientTasks.map(t => t.id)));
        }
        await db.delete(tasks).where(eq(tasks.clientId, id));
        console.log(`   ✓ Deleted tasks and comments`);
      } catch (err: any) {
        console.warn(`   ⚠ Warning deleting tasks:`, err.message);
      }

      try {
        await db.delete(campaigns).where(eq(campaigns.clientId, id));
        console.log(`   ✓ Deleted campaigns`);
      } catch (err: any) {
        console.warn(`   ⚠ Warning deleting campaigns:`, err.message);
      }

      // 3. Leads
      try {
        await db.update(leads).set({ clientId: null }).where(eq(leads.clientId, id));
        await db.update(leads).set({ convertedToClientId: null }).where(eq(leads.convertedToClientId, id));
        console.log(`   ✓ Updated leads (unlinked)`);
      } catch (err: any) {
        console.warn(`   ⚠ Warning updating leads:`, err.message);
      }

      // 3.1 Users
      try {
        await db.update(users).set({ clientId: null }).where(eq(users.clientId, id));
        console.log(`   ✓ Updated users (unlinked)`);
      } catch (err: any) {
        console.warn(`   ⚠ Warning updating users:`, err.message);
      }

      // 4. Content & Marketing
      try {
        await db.delete(contentPosts).where(eq(contentPosts.clientId, id));
        console.log(`   ✓ Deleted content posts`);
      } catch (err: any) {
        console.warn(`   ⚠ Warning deleting content posts:`, err.message);
      }

      try {
        await db.delete(marketingBroadcastRecipients).where(eq(marketingBroadcastRecipients.clientId, id));
        console.log(`   ✓ Deleted marketing broadcast recipients`);
      } catch (err: any) {
        console.warn(`   ⚠ Warning deleting marketing broadcast recipients:`, err.message);
      }

      // 5. Billing & Support
      try {
        await db.delete(invoices).where(eq(invoices.clientId, id));
        console.log(`   ✓ Deleted invoices`);
      } catch (err: any) {
        console.warn(`   ⚠ Warning deleting invoices:`, err.message);
      }

      try {
        await db.delete(tickets).where(eq(tickets.clientId, id));
        console.log(`   ✓ Deleted tickets`);
      } catch (err: any) {
        console.warn(`   ⚠ Warning deleting tickets:`, err.message);
      }

      try {
        await db.update(commissions).set({ clientId: null }).where(eq(commissions.clientId, id));
        console.log(`   ✓ Updated commissions (unlinked)`);
      } catch (err: any) {
        console.warn(`   ⚠ Warning updating commissions:`, err.message);
      }

      try {
        await db.delete(discountRedemptions).where(eq(discountRedemptions.clientId, id));
        console.log(`   ✓ Deleted discount redemptions`);
      } catch (err: any) {
        console.warn(`   ⚠ Warning deleting discount redemptions:`, err.message);
      }

      // 6. Operations
      try {
        await db.delete(messages).where(eq(messages.clientId, id));
        console.log(`   ✓ Deleted messages`);
      } catch (err: any) {
        console.warn(`   ⚠ Warning deleting messages:`, err.message);
      }

      try {
        await db.delete(onboardingTasks).where(eq(onboardingTasks.clientId, id));
        console.log(`   ✓ Deleted onboarding tasks`);
      } catch (err: any) {
        console.warn(`   ⚠ Warning deleting onboarding tasks:`, err.message);
      }

      try {
        await db.delete(clientDocuments).where(eq(clientDocuments.clientId, id));
        console.log(`   ✓ Deleted client documents`);
      } catch (err: any) {
        console.warn(`   ⚠ Warning deleting client documents:`, err.message);
      }

      // 7. Projects
      try {
        const projects = await db.select().from(websiteProjects).where(eq(websiteProjects.clientId, id));
        for (const p of projects) {
          await db.delete(projectFeedback).where(eq(projectFeedback.projectId, p.id));
        }
        await db.delete(websiteProjects).where(eq(websiteProjects.clientId, id));
        console.log(`   ✓ Deleted website projects and feedback`);
      } catch (err: any) {
        console.warn(`   ⚠ Warning deleting website projects:`, err.message);
      }

      // 8. AI / Second Me
      try {
        await db.delete(secondMeContent).where(eq(secondMeContent.clientId, id));
        await db.delete(secondMe).where(eq(secondMe.clientId, id));
        console.log(`   ✓ Deleted AI/Second Me data`);
      } catch (err: any) {
        console.warn(`   ⚠ Warning deleting AI/Second Me data:`, err.message);
      }

      // 9. Creators
      try {
        await db.delete(clientCreators).where(eq(clientCreators.clientId, id));
        await db.delete(creatorVisits).where(eq(creatorVisits.clientId, id));
        console.log(`   ✓ Deleted creator assignments and visits`);
      } catch (err: any) {
        console.warn(`   ⚠ Warning deleting creator data:`, err.message);
      }

      // 10. Finally delete the client
      const [deletedClient] = await db.delete(clients).where(eq(clients.id, id)).returning();
      if (!deletedClient) {
        throw new Error(`Client ${id} not found`);
      }
      console.log(`✅ Client ${id} deleted successfully`);
    } catch (error: any) {
      console.error(`❌ Error deleting client ${id}:`, error);
      throw error;
    }
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

  async getTaskSpacesForAssignee(userId: number): Promise<TaskSpace[]> {
    // Fetch all spaces once, then filter by spaces that have tasks assigned to this user.
    // Also include parent spaces so nested sidebar groups still render.
    const allSpaces = await this.getTaskSpaces();

    const assignedSpaceRows = await db
      .select({ spaceId: tasks.spaceId })
      .from(tasks)
      .where(and(eq(tasks.assignedToId, userId), isNotNull(tasks.spaceId)))
      .groupBy(tasks.spaceId);

    const assignedSpaceIds = new Set(
      assignedSpaceRows.map((r) => r.spaceId).filter((id): id is string => Boolean(id))
    );

    if (assignedSpaceIds.size === 0) return [];

    const byId = new Map(allSpaces.map((s) => [s.id, s] as const));
    const includeIds = new Set<string>();

    const includeWithParents = (spaceId: string) => {
      let current: TaskSpace | undefined = byId.get(spaceId);
      while (current) {
        if (includeIds.has(current.id)) break;
        includeIds.add(current.id);
        const parentId = current.parentSpaceId ?? null;
        if (!parentId) break;
        current = byId.get(parentId);
      }
    };

    for (const id of assignedSpaceIds) includeWithParents(id);

    return allSpaces.filter((s) => includeIds.has(s.id));
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

  async getTasksAssignedToUser(userId: number): Promise<Task[]> {
    return await db
      .select()
      .from(tasks)
      .where(eq(tasks.assignedToId, userId))
      .orderBy(desc(tasks.createdAt));
  }

  async getTasksBySpace(spaceId: string): Promise<Task[]> {
    return await db.select().from(tasks).where(eq(tasks.spaceId, spaceId)).orderBy(desc(tasks.createdAt));
  }

  async getTasksByClient(clientId: string): Promise<Task[]> {
    return await db.select().from(tasks).where(eq(tasks.clientId, clientId)).orderBy(desc(tasks.createdAt));
  }

  async getDueTasksForAssignee(
    userId: number,
    dueBy: Date
  ): Promise<Array<Pick<Task, "id" | "title" | "dueDate" | "assignedToId" | "status">>> {
    return await db
      .select({
        id: tasks.id,
        title: tasks.title,
        dueDate: tasks.dueDate,
        assignedToId: tasks.assignedToId,
        status: tasks.status,
      })
      .from(tasks)
      .where(
        and(
          eq(tasks.assignedToId, userId),
          isNotNull(tasks.dueDate),
          lte(tasks.dueDate, dueBy),
          sql`${tasks.status} != 'completed'`
        )
      )
      .orderBy(tasks.dueDate);
  }

  async getDueTasksForAllAssignees(
    dueBy: Date
  ): Promise<Array<Pick<Task, "id" | "title" | "dueDate" | "assignedToId" | "status">>> {
    return await db
      .select({
        id: tasks.id,
        title: tasks.title,
        dueDate: tasks.dueDate,
        assignedToId: tasks.assignedToId,
        status: tasks.status,
      })
      .from(tasks)
      .where(
        and(
          isNotNull(tasks.assignedToId),
          isNotNull(tasks.dueDate),
          lte(tasks.dueDate, dueBy),
          sql`${tasks.status} != 'completed'`
        )
      )
      .orderBy(tasks.dueDate);
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
  async getLeads(): Promise<Lead[]> {
    const leadsList = await db.select().from(leads).orderBy(desc(leads.createdAt));
    console.log("🔍 getLeads() called - Found", leadsList.length, "leads");
    return leadsList;
  }

  async getLead(id: string): Promise<Lead | undefined> {
    const [lead] = await db.select().from(leads).where(eq(leads.id, id));
    return lead;
  }

  async getLeadByEmail(email: string): Promise<Lead | undefined> {
    const normalized = email.trim().toLowerCase();
    if (!normalized) return undefined;
    const [lead] = await db
      .select()
      .from(leads)
      .where(sql`LOWER(${leads.email}) = ${normalized}`)
      .limit(1);
    return lead;
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

  async getAllLeadActivities(): Promise<LeadActivity[]> {
    return await db
      .select()
      .from(leadActivities)
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
    try {
      return await db.select().from(contentPosts).orderBy(desc(contentPosts.createdAt));
    } catch (error: any) {
      // If visit_id column doesn't exist, try to add it and retry
      if (error?.code === '42703' && error?.message?.includes('visit_id')) {
        console.log('⚠️ visit_id column missing, attempting to add it...');
        try {
          await pool.query(`ALTER TABLE content_posts ADD COLUMN IF NOT EXISTS visit_id VARCHAR;`).catch(() => {});
          // Retry the query
          return await db.select().from(contentPosts).orderBy(desc(contentPosts.createdAt));
        } catch (retryError) {
          console.error('❌ Failed to add visit_id column:', retryError);
          throw error; // Throw original error
        }
      }
      throw error;
    }
  }

  async getContentPostsByClient(clientId: string): Promise<ContentPost[]> {
    try {
      return await db
        .select()
        .from(contentPosts)
        .where(eq(contentPosts.clientId, clientId))
        .orderBy(desc(contentPosts.createdAt));
    } catch (error: any) {
      // If visit_id column doesn't exist, try to add it and retry
      if (error?.code === '42703' && error?.message?.includes('visit_id')) {
        console.log('⚠️ visit_id column missing, attempting to add it...');
        try {
          await pool.query(`ALTER TABLE content_posts ADD COLUMN IF NOT EXISTS visit_id VARCHAR;`).catch(() => {});
          // Retry the query
          return await db
            .select()
            .from(contentPosts)
            .where(eq(contentPosts.clientId, clientId))
            .orderBy(desc(contentPosts.createdAt));
        } catch (retryError) {
          console.error('❌ Failed to add visit_id column:', retryError);
          throw error; // Throw original error
        }
      }
      throw error;
    }
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

  async getGroupConversations(userId: number): Promise<GroupConversationWithParticipants[]> {
    const membershipRows = await db
      .select({ conversationId: groupConversationMembers.conversationId })
      .from(groupConversationMembers)
      .where(eq(groupConversationMembers.userId, userId));

    if (membershipRows.length === 0) {
      return [];
    }

    const conversationIds = membershipRows.map((row) => row.conversationId);

    const conversationList = await db
      .select()
      .from(groupConversations)
      .where(inArray(groupConversations.id, conversationIds))
      .orderBy(desc(groupConversations.createdAt));

    const participantRows = await db
      .select({
        conversationId: groupConversationMembers.conversationId,
        userId: users.id,
        username: users.username,
        role: users.role,
      })
      .from(groupConversationMembers)
      .innerJoin(users, eq(groupConversationMembers.userId, users.id))
      .where(inArray(groupConversationMembers.conversationId, conversationIds));

    const participantMap = new Map<string, Array<{ id: number; username: string; role: string }>>();
    participantRows.forEach((row) => {
      const participants = participantMap.get(row.conversationId) || [];
      participants.push({ id: row.userId, username: row.username, role: row.role });
      participantMap.set(row.conversationId, participants);
    });

    return conversationList.map((conversation) => ({
      ...conversation,
      participants: participantMap.get(conversation.id) || [],
    }));
  }

  async createGroupConversation(data: { name: string; createdBy: number; memberIds: number[] }): Promise<GroupConversationWithParticipants> {
    const uniqueMemberIds = Array.from(new Set([data.createdBy, ...data.memberIds]));

    const [conversation] = await db
      .insert(groupConversations)
      .values({
        name: data.name,
        createdBy: data.createdBy,
      })
      .returning();

    await db
      .insert(groupConversationMembers)
      .values(
        uniqueMemberIds.map((memberId) => ({
          conversationId: conversation.id,
          userId: memberId,
          role: memberId === data.createdBy ? "owner" : "member",
        }))
      );

    const participants = await db
      .select({
        userId: users.id,
        username: users.username,
        role: users.role,
      })
      .from(groupConversationMembers)
      .innerJoin(users, eq(groupConversationMembers.userId, users.id))
      .where(eq(groupConversationMembers.conversationId, conversation.id));

    return {
      ...conversation,
      participants: participants.map((p) => ({
        id: p.userId,
        username: p.username,
        role: p.role,
      })),
    };
  }

  async isGroupConversationMember(conversationId: string, userId: number): Promise<boolean> {
    const [membership] = await db
      .select({ id: groupConversationMembers.id })
      .from(groupConversationMembers)
      .where(and(eq(groupConversationMembers.conversationId, conversationId), eq(groupConversationMembers.userId, userId)))
      .limit(1);
    return Boolean(membership);
  }

  async getGroupMessages(conversationId: string): Promise<GroupMessageWithAuthor[]> {
    return await db
      .select({
        id: groupMessages.id,
        conversationId: groupMessages.conversationId,
        userId: groupMessages.userId,
        content: groupMessages.content,
        mediaUrl: groupMessages.mediaUrl,
        mediaType: groupMessages.mediaType,
        createdAt: groupMessages.createdAt,
        authorName: users.username,
        authorRole: users.role,
      })
      .from(groupMessages)
      .innerJoin(users, eq(groupMessages.userId, users.id))
      .where(eq(groupMessages.conversationId, conversationId))
      .orderBy(groupMessages.createdAt);
  }

  async createGroupMessage(data: { conversationId: string; userId: number; content: string; mediaUrl?: string | null; mediaType?: string | null; durationMs?: number | null }): Promise<GroupMessage> {
    const [message] = await db
      .insert(groupMessages)
      .values({
        conversationId: data.conversationId,
        userId: data.userId,
        content: data.content,
        mediaUrl: data.mediaUrl ?? null,
        mediaType: data.mediaType ?? null,
        durationMs: data.durationMs ?? null,
      })
      .returning();
    return message;
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

  // Push notification history operations
  async getPushNotificationHistory(): Promise<PushNotificationHistory[]> {
    return await db.select().from(pushNotificationHistory).orderBy(desc(pushNotificationHistory.createdAt)).limit(100);
  }

  async createPushNotificationHistory(historyData: InsertPushNotificationHistory): Promise<PushNotificationHistory> {
    const [history] = await db.insert(pushNotificationHistory).values(historyData).returning();
    return history;
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

  async getNotificationsByActionUrls(userId: number, actionUrls: string[]) {
    if (!actionUrls.length) return [];
    return await db
      .select()
      .from(notifications)
      .where(
        and(
          eq(notifications.userId, userId),
          inArray(notifications.actionUrl, actionUrls)
        )
      )
      .orderBy(desc(notifications.createdAt))
      .limit(200);
  }

  async getUnreadNotificationsByActionUrls(userId: number, actionUrls: string[]) {
    if (!actionUrls.length) return [];
    return await db
      .select()
      .from(notifications)
      .where(
        and(
          eq(notifications.userId, userId),
          eq(notifications.isRead, false),
          inArray(notifications.actionUrl, actionUrls)
        )
      )
      .orderBy(desc(notifications.createdAt))
      .limit(200);
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

  // Optimized dashboard stats
  async getDashboardStats(userId?: number, role?: string) {
    const normalizeRole = (value: unknown) =>
      String(value ?? "")
        .trim()
        .toLowerCase();

    const normalizedRole = normalizeRole(role);
    const isStaff = normalizedRole === "staff";
    const isSalesAgent = normalizedRole === "sales_agent";
    const restrictToAssignee = (isStaff || isSalesAgent) && Boolean(userId);

    const now = new Date();
    const firstDayOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const firstDayOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastDayOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

    // Filter for tasks based on role
    const taskCondition = (restrictToAssignee && userId) 
      ? eq(tasks.assignedToId, userId) 
      : undefined;

    // Filter for leads based on role
    const leadCondition = (restrictToAssignee && userId)
      ? eq(leads.assignedToId, userId)
      : undefined;

    const [
      clientsRes,
      clientsLastMonthRes,
      activeCampaignsRes,
      campaignsLastMonthRes,
      leadsRes,
      leadsLastMonthRes,
      taskMetricsRes,
      tasksTodayRes,
      unreadMessagesRes,
      upcomingDeadlinesRes,
      recentActivityClients,
      recentActivityCampaigns,
      recentActivityTasks,
    ] = await Promise.all([
      // Total Clients
      db.select({ count: count() }).from(clients),
      db.select({ count: count() }).from(clients).where(lt(clients.createdAt, firstDayOfThisMonth)),
      
      // Active Campaigns
      db.select({ count: count() }).from(campaigns).where(eq(campaigns.status, "active")),
      db.select({ count: count() }).from(campaigns).where(
        and(
          eq(campaigns.status, "active"),
          gte(campaigns.createdAt, firstDayOfLastMonth),
          lt(campaigns.createdAt, firstDayOfThisMonth)
        )
      ),

      // Leads and Pipeline
      db.select({ 
        count: count(),
        pipelineValue: sum(leads.value)
      }).from(leads).where(leadCondition),
      db.select({ 
        count: count(),
        pipelineValue: sum(leads.value)
      }).from(leads).where(
        and(
          leadCondition || sql`TRUE`,
          lt(leads.createdAt, firstDayOfThisMonth)
        )
      ),

      // Task Metrics
      db.select({
        total: count(),
        completed: sql`count(*) FILTER (WHERE ${tasks.status} = 'completed')`,
        pending: sql`count(*) FILTER (WHERE ${tasks.status} = 'todo')`,
        inProgress: sql`count(*) FILTER (WHERE ${tasks.status} = 'in_progress')`,
        review: sql`count(*) FILTER (WHERE ${tasks.status} = 'review')`
      }).from(tasks).where(taskCondition),

      // Tasks Today
      db.select({
        total: count(),
        completed: sql`count(*) FILTER (WHERE ${tasks.status} = 'completed')`,
        todo: sql`count(*) FILTER (WHERE ${tasks.status} = 'todo')`,
        inProgress: sql`count(*) FILTER (WHERE ${tasks.status} = 'in_progress')`,
        review: sql`count(*) FILTER (WHERE ${tasks.status} = 'review')`
      }).from(tasks).where(
        and(
          taskCondition || sql`TRUE`,
          sql`CAST(${tasks.dueDate} AS DATE) = CURRENT_DATE`
        )
      ),

      // Unread Messages
      userId ? db.select({ count: count() }).from(messages).where(
        and(
          eq(messages.recipientId, userId),
          eq(messages.isRead, false)
        )
      ) : Promise.resolve([{ count: 0 }]),

      // Upcoming Deadlines (for the specific user if staff)
      db.select({
        id: tasks.id,
        title: tasks.title,
        dueDate: tasks.dueDate
      }).from(tasks).where(
        and(
          taskCondition || sql`TRUE`,
          gte(tasks.dueDate, now),
          sql`${tasks.status} != 'completed'`
        )
      ).orderBy(tasks.dueDate).limit(5),

      // Recent Activity - Clients
      db.select({
        id: clients.id,
        name: clients.name,
        createdAt: clients.createdAt
      }).from(clients).orderBy(desc(clients.createdAt)).limit(3),

      // Recent Activity - Campaigns
      db.select({
        id: campaigns.id,
        name: campaigns.name,
        createdAt: campaigns.createdAt
      }).from(campaigns).orderBy(desc(campaigns.createdAt)).limit(3),

      // Recent Activity - Completed Tasks
      db.select({
        id: tasks.id,
        title: tasks.title,
        updatedAt: tasks.updatedAt
      }).from(tasks).where(
        and(taskCondition || sql`TRUE`, eq(tasks.status, "completed"))
      ).orderBy(desc(tasks.updatedAt)).limit(3),
    ]);

    // Aggregate values
    const totalClients = Number(clientsRes[0]?.count || 0);
    const clientsLastMonth = Number(clientsLastMonthRes[0]?.count || 0);
    const activeCampaigns = Number(activeCampaignsRes[0]?.count || 0);
    const campaignsLastMonth = Number(campaignsLastMonthRes[0]?.count || 0);
    const totalLeads = Number(leadsRes[0]?.count || 0);
    const pipelineValue = Number(leadsRes[0]?.pipelineValue || 0);
    const leadsLastMonth = Number(leadsLastMonthRes[0]?.count || 0);
    const pipelineValueLastMonth = Number(leadsLastMonthRes[0]?.pipelineValue || 0);

    const taskMetrics = {
      total: Number(taskMetricsRes[0]?.total || 0),
      completed: Number(taskMetricsRes[0]?.completed || 0),
      pending: Number(taskMetricsRes[0]?.pending || 0),
      inProgress: Number(taskMetricsRes[0]?.inProgress || 0),
      review: Number(taskMetricsRes[0]?.review || 0),
      completionPercentage: taskMetricsRes[0]?.total ? Math.round((Number(taskMetricsRes[0]?.completed) / Number(taskMetricsRes[0]?.total)) * 100) : 0
    };

    const todayTaskMetrics = {
      total: Number(tasksTodayRes[0]?.total || 0),
      completed: Number(tasksTodayRes[0]?.completed || 0),
      todo: Number(tasksTodayRes[0]?.todo || 0),
      inProgress: Number(tasksTodayRes[0]?.inProgress || 0),
      review: Number(tasksTodayRes[0]?.review || 0)
    };

    // Calculate percentage changes
    const calculateChange = (current: number, previous: number): string => {
      if (previous === 0) return current > 0 ? "+100" : "0";
      const change = ((current - previous) / previous) * 100;
      const rounded = Math.round(change);
      return rounded > 0 ? `+${rounded}` : `${rounded}`;
    };

    // Format recent activity
    const formatActivityTime = (date: Date | null) => {
      if (!date) return 'Recently';
      const now = new Date();
      const diffMs = now.getTime() - new Date(date).getTime();
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMins / 60);
      const diffDays = Math.floor(diffHours / 24);

      if (diffMins < 60) return `${diffMins}m ago`;
      if (diffHours < 24) return `${diffHours}h ago`;
      return `${diffDays}d ago`;
    };

    const recentActivity: any[] = [];
    
    recentActivityClients.forEach(c => {
      recentActivity.push({
        type: 'success',
        title: `Client: ${c.name}`,
        time: formatActivityTime(c.createdAt),
        timestamp: c.createdAt
      });
    });

    recentActivityCampaigns.forEach(c => {
      recentActivity.push({
        type: 'info',
        title: `Campaign: ${c.name}`,
        time: formatActivityTime(c.createdAt),
        timestamp: c.createdAt
      });
    });

    recentActivityTasks.forEach(t => {
      recentActivity.push({
        type: 'success',
        title: `Task completed: ${t.title}`,
        time: formatActivityTime(t.updatedAt),
        timestamp: t.updatedAt
      });
    });

    const sortedActivity = recentActivity
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 10);

    // Format deadlines
    const upcomingDeadlines = upcomingDeadlinesRes.map(t => {
      const daysUntil = t.dueDate ? Math.floor((new Date(t.dueDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)) : 999;
      return {
        title: t.title,
        date: t.dueDate ? new Date(t.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'No date',
        urgent: daysUntil <= 3,
        timestamp: t.dueDate
      };
    });

    const unreadMessagesCount = Number(unreadMessagesRes[0]?.count || 0);
    const deadLinesThisWeek = upcomingDeadlines.filter(d => {
      if (!d.timestamp) return false;
      const dueDate = new Date(d.timestamp);
      const oneWeekFromNow = new Date();
      oneWeekFromNow.setDate(oneWeekFromNow.getDate() + 7);
      return dueDate <= oneWeekFromNow;
    }).length;

    // Staff should never receive company-wide / financial metrics (even if UI bugs).
    if (isStaff) {
      return {
        totalClients: 0,
        activeCampaigns: 0,
        totalLeads,
        pipelineValue: 0,
        monthlyRevenue: 0,
        clientsChange: "0",
        campaignsChange: "0",
        pipelineChange: "0",
        revenueChange: "0",
        recentActivity: [], // avoid leaking client/campaign activity
        upcomingDeadlines,
        taskMetrics,
        todayTaskMetrics,
        unreadMessagesCount,
        deadLinesThisWeek,
      };
    }

    return {
      totalClients,
      activeCampaigns,
      totalLeads,
      pipelineValue,
      monthlyRevenue: 0, // Filled by Stripe on frontend
      clientsChange: calculateChange(totalClients, clientsLastMonth),
      campaignsChange: calculateChange(activeCampaigns, campaignsLastMonth),
      pipelineChange: calculateChange(pipelineValue, pipelineValueLastMonth),
      revenueChange: "0",
      recentActivity: sortedActivity,
      upcomingDeadlines,
      taskMetrics,
      todayTaskMetrics,
      unreadMessagesCount,
      deadLinesThisWeek,
    };
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
  async getUserNotificationPreferences(userId: number): Promise<UserNotificationPreferences | undefined> {
    const [preferences] = await db
      .select()
      .from(userNotificationPreferences)
      .where(eq(userNotificationPreferences.userId, userId));
    return preferences;
  }

  async upsertUserNotificationPreferences(userId: number, prefsData: Partial<InsertUserNotificationPreferences>): Promise<UserNotificationPreferences> {
    // Check if preferences exist
    const existing = await this.getUserNotificationPreferences(userId);
    
    if (existing) {
      // Update existing
      const [updated] = await db
        .update(userNotificationPreferences)
        .set({ ...prefsData, updatedAt: new Date() })
        .where(eq(userNotificationPreferences.userId, userId))
        .returning();
      return updated;
    } else {
      // Create new
      const [created] = await db
        .insert(userNotificationPreferences)
        .values({ userId, ...prefsData } as InsertUserNotificationPreferences)
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

  // Second Me operations
  async getSecondMe(clientId: string): Promise<SecondMe | undefined> {
    const [record] = await db
      .select()
      .from(secondMe)
      .where(eq(secondMe.clientId, clientId))
      .limit(1);
    return record;
  }

  async getSecondMeById(id: string): Promise<SecondMe | undefined> {
    const [record] = await db
      .select()
      .from(secondMe)
      .where(eq(secondMe.id, id))
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

  async getSecondMeContentByClientId(clientId: string): Promise<SecondMeContent[]> {
    return await db
      .select()
      .from(secondMeContent)
      .where(eq(secondMeContent.clientId, clientId))
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

  // Marketing Broadcast operations
  async getMarketingBroadcasts(): Promise<MarketingBroadcast[]> {
    return await db.select().from(marketingBroadcasts).orderBy(desc(marketingBroadcasts.createdAt));
  }

  async getMarketingBroadcast(id: string): Promise<MarketingBroadcast | undefined> {
    const [broadcast] = await db.select().from(marketingBroadcasts).where(eq(marketingBroadcasts.id, id));
    return broadcast;
  }

  async createMarketingBroadcast(data: InsertMarketingBroadcast): Promise<MarketingBroadcast> {
    const [broadcast] = await db.insert(marketingBroadcasts).values(data).returning();
    return broadcast;
  }

  async updateMarketingBroadcast(id: string, data: Partial<InsertMarketingBroadcast>): Promise<MarketingBroadcast> {
    const [broadcast] = await db
      .update(marketingBroadcasts)
      .set(data)
      .where(eq(marketingBroadcasts.id, id))
      .returning();
    if (!broadcast) throw new Error("Marketing broadcast not found");
    return broadcast;
  }

  async getMarketingBroadcastRecipients(broadcastId: string): Promise<MarketingBroadcastRecipient[]> {
    return await db.select().from(marketingBroadcastRecipients).where(eq(marketingBroadcastRecipients.broadcastId, broadcastId));
  }

  async createMarketingBroadcastRecipient(data: InsertMarketingBroadcastRecipient): Promise<MarketingBroadcastRecipient> {
    const [recipient] = await db.insert(marketingBroadcastRecipients).values(data).returning();
    return recipient;
  }

  async updateMarketingBroadcastRecipient(id: number, data: Partial<InsertMarketingBroadcastRecipient>): Promise<MarketingBroadcastRecipient> {
    const [recipient] = await db
      .update(marketingBroadcastRecipients)
      .set(data)
      .where(eq(marketingBroadcastRecipients.id, id))
      .returning();
    if (!recipient) throw new Error("Marketing broadcast recipient not found");
    return recipient;
  }

  // Marketing Group operations
  async getMarketingGroups(): Promise<MarketingGroup[]> {
    return await db.select().from(marketingGroups).orderBy(desc(marketingGroups.createdAt));
  }

  async getMarketingGroup(id: string): Promise<MarketingGroup | undefined> {
    const [group] = await db.select().from(marketingGroups).where(eq(marketingGroups.id, id));
    return group;
  }

  async createMarketingGroup(data: InsertMarketingGroup): Promise<MarketingGroup> {
    const [group] = await db.insert(marketingGroups).values(data).returning();
    return group;
  }

  async updateMarketingGroup(id: string, data: Partial<InsertMarketingGroup>): Promise<MarketingGroup> {
    const [group] = await db
      .update(marketingGroups)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(marketingGroups.id, id))
      .returning();
    if (!group) throw new Error("Marketing group not found");
    return group;
  }

  async deleteMarketingGroup(id: string): Promise<void> {
    await db.delete(marketingGroups).where(eq(marketingGroups.id, id));
  }

  async getMarketingGroupMembers(groupId: string): Promise<MarketingGroupMember[]> {
    return await db.select().from(marketingGroupMembers).where(eq(marketingGroupMembers.groupId, groupId));
  }

  async addMarketingGroupMember(data: InsertMarketingGroupMember): Promise<MarketingGroupMember> {
    const [member] = await db.insert(marketingGroupMembers).values(data).returning();
    return member;
  }

  async removeMarketingGroupMember(id: number): Promise<void> {
    await db.delete(marketingGroupMembers).where(eq(marketingGroupMembers.id, id));
  }

  // Course operations
  async getCourses(creatorId?: string): Promise<Course[]> {
    if (creatorId) {
      return await db.select().from(courses).where(eq(courses.creatorId, creatorId)).orderBy(desc(courses.createdAt));
    }
    return await db.select().from(courses).orderBy(desc(courses.createdAt));
  }

  async getCourse(id: string): Promise<Course | undefined> {
    const [course] = await db.select().from(courses).where(eq(courses.id, id));
    return course;
  }

  async getCourseWithContent(id: string): Promise<Course & { modules: (CourseModule & { lessons: CourseLesson[] })[] }> {
    const [course] = await db.select().from(courses).where(eq(courses.id, id));
    if (!course) throw new Error("Course not found");

    const [modules, lessons] = await Promise.all([
      db.select().from(courseModules).where(eq(courseModules.courseId, id)).orderBy(courseModules.order),
      db.select()
        .from(courseLessons)
        .innerJoin(courseModules, eq(courseLessons.moduleId, courseModules.id))
        .where(eq(courseModules.courseId, id))
        .orderBy(courseLessons.order)
    ]);
    
    const modulesWithLessons = modules.map(module => ({
      ...module,
      lessons: lessons
        .filter(l => l.course_lessons.moduleId === module.id)
        .map(l => l.course_lessons)
    }));

    return { ...course, modules: modulesWithLessons };
  }

  async createCourse(courseData: InsertCourse): Promise<Course> {
    const [course] = await db.insert(courses).values(courseData).returning();
    return course;
  }

  async updateCourse(id: string, data: Partial<InsertCourse>): Promise<Course> {
    const [course] = await db
      .update(courses)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(courses.id, id))
      .returning();
    if (!course) throw new Error("Course not found");
    return course;
  }

  async deleteCourse(id: string): Promise<void> {
    await db.delete(courses).where(eq(courses.id, id));
  }

  // Course Module operations
  async getCourseModules(courseId: string): Promise<CourseModule[]> {
    return await db.select().from(courseModules).where(eq(courseModules.courseId, courseId)).orderBy(courseModules.order);
  }

  async createCourseModule(moduleData: InsertCourseModule): Promise<CourseModule> {
    const [module] = await db.insert(courseModules).values(moduleData).returning();
    return module;
  }

  async updateCourseModule(id: string, data: Partial<InsertCourseModule>): Promise<CourseModule> {
    const [module] = await db
      .update(courseModules)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(courseModules.id, id))
      .returning();
    if (!module) throw new Error("Course module not found");
    return module;
  }

  async deleteCourseModule(id: string): Promise<void> {
    await db.delete(courseModules).where(eq(courseModules.id, id));
  }

  // Course Lesson operations
  async getCourseLessons(moduleId: string): Promise<CourseLesson[]> {
    return await db.select().from(courseLessons).where(eq(courseLessons.moduleId, moduleId)).orderBy(courseLessons.order);
  }

  async createCourseLesson(lessonData: InsertCourseLesson): Promise<CourseLesson> {
    const [lesson] = await db.insert(courseLessons).values(lessonData).returning();
    return lesson;
  }

  async updateCourseLesson(id: string, data: Partial<InsertCourseLesson>): Promise<CourseLesson> {
    const [lesson] = await db
      .update(courseLessons)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(courseLessons.id, id))
      .returning();
    if (!lesson) throw new Error("Course lesson not found");
    return lesson;
  }

  async deleteCourseLesson(id: string): Promise<void> {
    await db.delete(courseLessons).where(eq(courseLessons.id, id));
  }

  // Course Enrollment operations
  async getCourseEnrollment(courseId: string, userId: number): Promise<CourseEnrollment | undefined> {
    const [enrollment] = await db
      .select()
      .from(courseEnrollments)
      .where(and(eq(courseEnrollments.courseId, courseId), eq(courseEnrollments.userId, userId)));
    return enrollment;
  }

  async getUserEnrollments(userId: number): Promise<(CourseEnrollment & { course: Course })[]> {
    const enrollmentsList = await db
      .select({
        enrollment: courseEnrollments,
        course: courses
      })
      .from(courseEnrollments)
      .innerJoin(courses, eq(courseEnrollments.courseId, courses.id))
      .where(eq(courseEnrollments.userId, userId));
    
    return enrollmentsList.map(item => ({
      ...item.enrollment,
      course: item.course
    }));
  }

  async enrollInCourse(enrollmentData: InsertCourseEnrollment): Promise<CourseEnrollment> {
    const [enrollment] = await db.insert(courseEnrollments).values(enrollmentData).returning();
    return enrollment;
  }

  async updateCourseEnrollment(id: string, data: Partial<InsertCourseEnrollment>): Promise<CourseEnrollment> {
    const [enrollment] = await db
      .update(courseEnrollments)
      .set(data)
      .where(eq(courseEnrollments.id, id))
      .returning();
    if (!enrollment) throw new Error("Enrollment not found");
    return enrollment;
  }

  // Creator operations
  async getCreators(): Promise<Creator[]> {
    return await db.select().from(creators).orderBy(desc(creators.createdAt));
  }

  async getCreator(id: string): Promise<Creator | undefined> {
    const [row] = await db.select().from(creators).where(eq(creators.id, id));
    return row;
  }

  async getCreatorByEmail(email: string): Promise<Creator | undefined> {
    const [row] = await db.select().from(creators).where(eq(creators.email, email.toLowerCase().trim()));
    return row;
  }

  async getCreatorByUserId(userId: number): Promise<Creator | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, userId));
    if (!user || !user.creatorId) return undefined;
    return this.getCreator(user.creatorId);
  }

  async createCreator(creatorData: InsertCreator): Promise<Creator> {
    const [row] = await db.insert(creators).values(creatorData).returning();
    return row;
  }

  async updateCreator(id: string, data: Partial<InsertCreator>): Promise<Creator> {
    const [row] = await db.update(creators).set(data).where(eq(creators.id, id)).returning();
    if (!row) throw new Error("Creator not found");
    return row;
  }

  async deleteCreator(id: string): Promise<void> {
    await db.delete(creators).where(eq(creators.id, id));
  }
}

export const storage = new DatabaseStorage();

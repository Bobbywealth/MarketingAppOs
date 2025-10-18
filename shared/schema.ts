import { sql } from "drizzle-orm";
import { relations } from "drizzle-orm";
import {
  index,
  jsonb,
  pgTable,
  timestamp,
  varchar,
  text,
  integer,
  boolean,
  serial,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table (required for Replit Auth)
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)]
);

// User storage table
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").unique().notNull(),
  password: text("password").notNull(),
  email: text("email"),
  firstName: text("first_name"),
  lastName: text("last_name"),
  role: text("role").notNull().default("staff"), // admin, staff, client
  createdAt: timestamp("created_at").defaultNow(),
});

export const usersRelations = relations(users, ({ many }) => ({
  assignedClients: many(clients),
  assignedTasks: many(tasks),
  messages: many(messages),
  tickets: many(tickets),
}));

// Clients table
export const clients = pgTable("clients", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name").notNull(),
  email: varchar("email"),
  phone: varchar("phone"),
  company: varchar("company"),
  website: varchar("website"),
  logoUrl: varchar("logo_url"),
  serviceTags: text("service_tags").array(), // social media, lead gen, design, etc.
  status: varchar("status").notNull().default("active"), // active, inactive, onboarding
  assignedToId: integer("assigned_to_id").references(() => users.id),
  notes: text("notes"),
  socialLinks: jsonb("social_links"), // {twitter, facebook, instagram, linkedin}
  stripeCustomerId: varchar("stripe_customer_id"),
  stripeSubscriptionId: varchar("stripe_subscription_id"),
  displayOrder: integer("display_order").default(0), // For drag-and-drop ordering
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const clientsRelations = relations(clients, ({ one, many }) => ({
  assignedTo: one(users, {
    fields: [clients.assignedToId],
    references: [users.id],
  }),
  campaigns: many(campaigns),
  leads: many(leads),
  invoices: many(invoices),
  tickets: many(tickets),
  contentPosts: many(contentPosts),
  onboardingTasks: many(onboardingTasks),
}));

// Campaigns table
export const campaigns = pgTable("campaigns", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  clientId: varchar("client_id").references(() => clients.id).notNull(),
  name: varchar("name").notNull(),
  type: varchar("type").notNull(), // social, ads, content, email
  status: varchar("status").notNull().default("planning"), // planning, active, paused, completed
  startDate: timestamp("start_date"),
  endDate: timestamp("end_date"),
  budget: integer("budget"),
  description: text("description"),
  goals: text("goals"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const campaignsRelations = relations(campaigns, ({ one, many }) => ({
  client: one(clients, {
    fields: [campaigns.clientId],
    references: [clients.id],
  }),
  tasks: many(tasks),
}));

// Task Spaces table (for organizing tasks into groups/projects)
export const taskSpaces = pgTable("task_spaces", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name").notNull(),
  icon: varchar("icon").default("📁"), // Emoji or icon name
  color: varchar("color").default("#3B82F6"), // Hex color
  parentSpaceId: varchar("parent_space_id"), // For nested spaces
  order: integer("order").default(0), // Display order
  createdBy: integer("created_by").notNull().references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const taskSpacesRelations = relations(taskSpaces, ({ one, many }) => ({
  createdByUser: one(users, {
    fields: [taskSpaces.createdBy],
    references: [users.id],
  }),
  parentSpace: one(taskSpaces, {
    fields: [taskSpaces.parentSpaceId],
    references: [taskSpaces.id],
  }),
  tasks: many(tasks),
  subSpaces: many(taskSpaces),
}));

// Tasks table
export const tasks = pgTable("tasks", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  campaignId: varchar("campaign_id").references(() => campaigns.id),
  clientId: varchar("client_id").references(() => clients.id),
  assignedToId: integer("assigned_to_id").references(() => users.id),
  spaceId: varchar("space_id").references(() => taskSpaces.id), // NEW: Link to space
  title: varchar("title").notNull(),
  description: text("description"),
  status: varchar("status").notNull().default("todo"), // todo, in_progress, review, completed
  priority: varchar("priority").notNull().default("normal"), // low, normal, high, urgent
  dueDate: timestamp("due_date"),
  completedAt: timestamp("completed_at"),
  // Recurring task fields
  isRecurring: boolean("is_recurring").default(false),
  recurringPattern: varchar("recurring_pattern"), // daily, weekly, monthly, yearly
  recurringInterval: integer("recurring_interval").default(1), // e.g., every 2 weeks
  recurringEndDate: timestamp("recurring_end_date"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const tasksRelations = relations(tasks, ({ one, many }) => ({
  campaign: one(campaigns, {
    fields: [tasks.campaignId],
    references: [campaigns.id],
  }),
  client: one(clients, {
    fields: [tasks.clientId],
    references: [clients.id],
  }),
  assignedTo: one(users, {
    fields: [tasks.assignedToId],
    references: [users.id],
  }),
  space: one(taskSpaces, {
    fields: [tasks.spaceId],
    references: [taskSpaces.id],
  }),
  comments: many(taskComments),
}));

// User View Preferences table (for customizing task views)
export const userViewPreferences = pgTable("user_view_preferences", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: integer("user_id").notNull().references(() => users.id),
  viewType: varchar("view_type").notNull().default("list"), // list, board, calendar
  cardSize: varchar("card_size").notNull().default("compact"), // compact, medium, large
  showEmptyFields: boolean("show_empty_fields").default(false),
  groupBy: varchar("group_by").default("status"), // status, priority, assignee, space, client
  sortBy: varchar("sort_by").default("dueDate"), // dueDate, priority, createdAt, title
  sortDirection: varchar("sort_direction").default("asc"), // asc, desc
  filters: jsonb("filters"), // { status: ['todo', 'in_progress'], priority: ['high', 'urgent'] }
  hiddenFields: jsonb("hidden_fields"), // ['description', 'client']
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const userViewPreferencesRelations = relations(userViewPreferences, ({ one }) => ({
  user: one(users, {
    fields: [userViewPreferences.userId],
    references: [users.id],
  }),
}));

// Task Comments table (for collaboration)
export const taskComments = pgTable("task_comments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  taskId: varchar("task_id").references(() => tasks.id).notNull(),
  userId: integer("user_id").references(() => users.id).notNull(),
  comment: text("comment").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const taskCommentsRelations = relations(taskComments, ({ one }) => ({
  task: one(tasks, {
    fields: [taskComments.taskId],
    references: [tasks.id],
  }),
  user: one(users, {
    fields: [taskComments.userId],
    references: [users.id],
  }),
}));

// Leads table (Sales Pipeline)
export const leads = pgTable("leads", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  clientId: varchar("client_id").references(() => clients.id),
  assignedToId: integer("assigned_to_id").references(() => users.id),
  name: varchar("name").notNull(),
  email: varchar("email"),
  phone: varchar("phone"),
  company: varchar("company"),
  website: varchar("website"),
  stage: varchar("stage").notNull().default("prospect"), // prospect, qualified, proposal, closed_won, closed_lost
  score: varchar("score").notNull().default("warm"), // hot, warm, cold
  value: integer("value"), // potential deal value in cents
  source: varchar("source").notNull().default("website"), // website, ads, form, call, referral, social
  sourceMetadata: jsonb("source_metadata"), // {campaign_id, ad_id, form_name, etc.}
  notes: text("notes"),
  nextFollowUp: timestamp("next_follow_up"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const leadsRelations = relations(leads, ({ one, many }) => ({
  client: one(clients, {
    fields: [leads.clientId],
    references: [clients.id],
  }),
  assignedTo: one(users, {
    fields: [leads.assignedToId],
    references: [users.id],
  }),
  activities: many(leadActivities),
  automations: many(leadAutomations),
}));

// Lead Activities table (Interaction History)
export const leadActivities = pgTable("lead_activities", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  leadId: varchar("lead_id").references(() => leads.id).notNull(),
  userId: integer("user_id").references(() => users.id),
  type: varchar("type").notNull(), // note, call, email, sms, meeting, stage_change
  subject: varchar("subject"),
  description: text("description"),
  metadata: jsonb("metadata"), // {duration, email_id, sms_id, previous_stage, new_stage}
  createdAt: timestamp("created_at").defaultNow(),
});

export const leadActivitiesRelations = relations(leadActivities, ({ one }) => ({
  lead: one(leads, {
    fields: [leadActivities.leadId],
    references: [leads.id],
  }),
  user: one(users, {
    fields: [leadActivities.userId],
    references: [users.id],
  }),
}));

// Lead Automation Workflows table
export const leadAutomations = pgTable("lead_automations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  leadId: varchar("lead_id").references(() => leads.id).notNull(),
  type: varchar("type").notNull(), // email, sms
  trigger: varchar("trigger").notNull(), // stage_change, time_delay, manual
  triggerConditions: jsonb("trigger_conditions"), // {stage: 'qualified', delay_days: 2}
  actionType: varchar("action_type").notNull(), // send_email, send_sms
  actionData: jsonb("action_data"), // {template_id, message, subject}
  status: varchar("status").notNull().default("pending"), // pending, sent, failed
  scheduledFor: timestamp("scheduled_for"),
  executedAt: timestamp("executed_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const leadAutomationsRelations = relations(leadAutomations, ({ one }) => ({
  lead: one(leads, {
    fields: [leadAutomations.leadId],
    references: [leads.id],
  }),
}));

// Content Posts table (Content Calendar)
export const contentPosts = pgTable("content_posts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  clientId: varchar("client_id").references(() => clients.id).notNull(),
  platforms: jsonb("platforms").notNull(), // Array of: facebook, instagram, twitter, linkedin, tiktok, youtube
  caption: text("caption"),
  mediaUrl: varchar("media_url"),
  scheduledFor: timestamp("scheduled_for"),
  approvalStatus: varchar("approval_status").notNull().default("draft"), // draft, pending, approved, rejected, published
  approvedBy: varchar("approved_by"),
  publishedAt: timestamp("published_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const contentPostsRelations = relations(contentPosts, ({ one }) => ({
  client: one(clients, {
    fields: [contentPosts.clientId],
    references: [clients.id],
  }),
}));

// Invoices table
export const invoices = pgTable("invoices", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  clientId: varchar("client_id").references(() => clients.id).notNull(),
  invoiceNumber: varchar("invoice_number").notNull().unique(),
  amount: integer("amount").notNull(),
  status: varchar("status").notNull().default("draft"), // draft, sent, paid, overdue
  dueDate: timestamp("due_date"),
  paidAt: timestamp("paid_at"),
  stripePaymentIntentId: varchar("stripe_payment_intent_id"),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const invoicesRelations = relations(invoices, ({ one }) => ({
  client: one(clients, {
    fields: [invoices.clientId],
    references: [clients.id],
  }),
}));

// Support Tickets table
export const tickets = pgTable("tickets", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  clientId: varchar("client_id").references(() => clients.id).notNull(),
  assignedToId: integer("assigned_to_id").references(() => users.id),
  subject: varchar("subject").notNull(),
  description: text("description"),
  priority: varchar("priority").notNull().default("normal"), // normal, urgent
  status: varchar("status").notNull().default("open"), // open, in_progress, resolved, closed
  createdAt: timestamp("created_at").defaultNow(),
  resolvedAt: timestamp("resolved_at"),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const ticketsRelations = relations(tickets, ({ one }) => ({
  client: one(clients, {
    fields: [tickets.clientId],
    references: [clients.id],
  }),
  assignedTo: one(users, {
    fields: [tickets.assignedToId],
    references: [users.id],
  }),
}));

// Messages table (Team Communication)
export const messages = pgTable("messages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  clientId: varchar("client_id").references(() => clients.id),
  campaignId: varchar("campaign_id").references(() => campaigns.id),
  userId: integer("user_id").references(() => users.id).notNull(), // Sender
  recipientId: integer("recipient_id").references(() => users.id), // For direct user messages
  content: text("content").notNull(),
  isInternal: boolean("is_internal").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export const messagesRelations = relations(messages, ({ one }) => ({
  client: one(clients, {
    fields: [messages.clientId],
    references: [clients.id],
  }),
  campaign: one(campaigns, {
    fields: [messages.campaignId],
    references: [campaigns.id],
  }),
  user: one(users, {
    fields: [messages.userId],
    references: [users.id],
  }),
}));

// Onboarding Tasks table
export const onboardingTasks = pgTable("onboarding_tasks", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  clientId: varchar("client_id").references(() => clients.id).notNull(),
  title: varchar("title").notNull(),
  description: text("description"),
  dueDay: integer("due_day").notNull(), // day number in the 30-day onboarding
  completed: boolean("completed").notNull().default(false),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const onboardingTasksRelations = relations(onboardingTasks, ({ one }) => ({
  client: one(clients, {
    fields: [onboardingTasks.clientId],
    references: [clients.id],
  }),
}));

// Client Documents table
export const clientDocuments = pgTable("client_documents", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  clientId: varchar("client_id").references(() => clients.id).notNull(),
  name: varchar("name").notNull(),
  description: text("description"),
  objectPath: varchar("object_path").notNull(), // Path to object in storage
  fileType: varchar("file_type"), // pdf, doc, image, etc
  fileSize: integer("file_size"), // in bytes
  uploadedBy: varchar("uploaded_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
});

export const clientDocumentsRelations = relations(clientDocuments, ({ one }) => ({
  client: one(clients, {
    fields: [clientDocuments.clientId],
    references: [clients.id],
  }),
  uploader: one(users, {
    fields: [clientDocuments.uploadedBy],
    references: [users.id],
  }),
}));

// Website Projects table (Development Tracker)
export const websiteProjects = pgTable("website_projects", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  clientId: varchar("client_id").references(() => clients.id).notNull(),
  name: varchar("name").notNull(),
  stage: varchar("stage").notNull().default("design"), // design, dev, qa, launch
  url: varchar("url"),
  domain: varchar("domain"),
  hostingProvider: varchar("hosting_provider"),
  hostingExpiry: timestamp("hosting_expiry"),
  sslStatus: varchar("ssl_status").default("active"), // active, expiring_soon, expired
  sslExpiry: timestamp("ssl_expiry"),
  dnsStatus: varchar("dns_status").default("verified"), // verified, pending, failed
  dnsLastChecked: timestamp("dns_last_checked"),
  progress: integer("progress").default(0), // 0-100
  launchDate: timestamp("launch_date"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const websiteProjectsRelations = relations(websiteProjects, ({ one, many }) => ({
  client: one(clients, {
    fields: [websiteProjects.clientId],
    references: [clients.id],
  }),
  feedback: many(projectFeedback),
}));

// Project Feedback table (Client Feedback Log)
export const projectFeedback = pgTable("project_feedback", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  projectId: varchar("project_id").references(() => websiteProjects.id).notNull(),
  userId: integer("user_id").references(() => users.id),
  type: varchar("type").notNull().default("comment"), // comment, revision, approval, deadline
  subject: varchar("subject"),
  message: text("message").notNull(),
  priority: varchar("priority").default("normal"), // low, normal, high, urgent
  status: varchar("status").default("open"), // open, in_progress, completed
  deadline: timestamp("deadline"),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const projectFeedbackRelations = relations(projectFeedback, ({ one }) => ({
  project: one(websiteProjects, {
    fields: [projectFeedback.projectId],
    references: [websiteProjects.id],
  }),
  user: one(users, {
    fields: [projectFeedback.userId],
    references: [users.id],
  }),
}));

// Analytics Metrics table (Social, Ads, Website Analytics)
export const analyticsMetrics = pgTable("analytics_metrics", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  clientId: varchar("client_id").references(() => clients.id).notNull(),
  campaignId: varchar("campaign_id").references(() => campaigns.id),
  metricType: varchar("metric_type").notNull(), // social, ads, website
  platform: varchar("platform"), // facebook, instagram, google_ads, google_analytics
  date: timestamp("date").notNull(),
  metrics: jsonb("metrics").notNull(), // {followers, engagement_rate, reach, clicks, ctr, spend, roas, conversions, page_views, bounce_rate, etc}
  createdAt: timestamp("created_at").defaultNow(),
});

export const analyticsMetricsRelations = relations(analyticsMetrics, ({ one }) => ({
  client: one(clients, {
    fields: [analyticsMetrics.clientId],
    references: [clients.id],
  }),
  campaign: one(campaigns, {
    fields: [analyticsMetrics.campaignId],
    references: [campaigns.id],
  }),
}));

// Activity Logs table (for tracking logins, payments, important events)
export const activityLogs = pgTable("activity_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: integer("user_id").references(() => users.id),
  activityType: varchar("activity_type").notNull(), // login, logout, payment, task_completed, client_added, etc
  description: text("description").notNull(),
  metadata: jsonb("metadata"), // Additional data like IP address, payment amount, etc
  createdAt: timestamp("created_at").defaultNow(),
});

export const activityLogsRelations = relations(activityLogs, ({ one }) => ({
  user: one(users, {
    fields: [activityLogs.userId],
    references: [users.id],
  }),
}));

// Notifications table
export const notifications = pgTable("notifications", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: integer("user_id").references(() => users.id).notNull(),
  title: varchar("title").notNull(),
  message: text("message").notNull(),
  type: varchar("type").notNull(), // info, success, warning, error
  category: varchar("category").notNull(), // task, payment, deadline, login, general
  isRead: boolean("is_read").default(false),
  actionUrl: varchar("action_url"), // Optional link to relevant page
  createdAt: timestamp("created_at").defaultNow(),
});

export const notificationsRelations = relations(notifications, ({ one }) => ({
  user: one(users, {
    fields: [notifications.userId],
    references: [users.id],
  }),
}));

// Emails table (for tracking company emails via GoDaddy Outlook)
export const emails = pgTable("emails", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  messageId: varchar("message_id"), // External email ID from provider
  from: varchar("from").notNull(),
  fromName: varchar("from_name"),
  to: jsonb("to").notNull(), // Array of email addresses
  cc: jsonb("cc"), // Array of CC addresses
  bcc: jsonb("bcc"), // Array of BCC addresses
  subject: text("subject").notNull(),
  body: text("body").notNull(),
  bodyPreview: text("body_preview"), // First 150 chars for listing
  folder: varchar("folder").notNull().default("inbox"), // inbox, sent, spam, trash, archive
  isRead: boolean("is_read").default(false),
  isStarred: boolean("is_starred").default(false),
  hasAttachments: boolean("has_attachments").default(false),
  attachments: jsonb("attachments"), // Array of attachment metadata
  labels: jsonb("labels"), // Array of custom labels
  inReplyTo: varchar("in_reply_to"), // Message ID this is replying to
  threadId: varchar("thread_id"), // For grouping conversation threads
  receivedAt: timestamp("received_at").notNull(),
  sentAt: timestamp("sent_at"),
  userId: integer("user_id").references(() => users.id), // Which user this email belongs to
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const emailsRelations = relations(emails, ({ one }) => ({
  user: one(users, {
    fields: [emails.userId],
    references: [users.id],
  }),
}));

// Email OAuth tokens (for Microsoft Graph API integration)
export const emailAccounts = pgTable("email_accounts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: integer("user_id").references(() => users.id).notNull(),
  email: varchar("email").notNull(),
  provider: varchar("provider").notNull().default("microsoft"), // microsoft, google, etc.
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  tokenExpiresAt: timestamp("token_expires_at"),
  isActive: boolean("is_active").default(true),
  lastSyncedAt: timestamp("last_synced_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const emailAccountsRelations = relations(emailAccounts, ({ one }) => ({
  user: one(users, {
    fields: [emailAccounts.userId],
    references: [users.id],
  }),
}));

// Zod schemas for validation
export const upsertUserSchema = createInsertSchema(users).omit({ id: true, createdAt: true });
export const insertUserSchema = createInsertSchema(users).omit({ id: true, createdAt: true }).extend({
  password: z.string().min(6, "Password must be at least 6 characters"),
});
export const insertClientSchema = createInsertSchema(clients).omit({ id: true, createdAt: true, updatedAt: true });
export const insertCampaignSchema = createInsertSchema(campaigns).omit({ id: true, createdAt: true, updatedAt: true });
export const insertTaskSchema = createInsertSchema(tasks)
  .omit({ id: true, createdAt: true, updatedAt: true })
  .extend({
    dueDate: z.union([z.string(), z.date()]).optional().nullable().transform(val => {
      if (!val) return null;
      if (typeof val === 'string') return new Date(val);
      return val;
    }),
    recurringEndDate: z.union([z.string(), z.date()]).optional().nullable().transform(val => {
      if (!val) return null;
      if (typeof val === 'string') return new Date(val);
      return val;
    }),
  });
export const insertTaskSpaceSchema = createInsertSchema(taskSpaces).omit({ id: true, createdAt: true, updatedAt: true });
export const insertUserViewPreferencesSchema = createInsertSchema(userViewPreferences).omit({ id: true, createdAt: true, updatedAt: true });
export const insertTaskCommentSchema = createInsertSchema(taskComments).omit({ id: true, createdAt: true });
export const insertLeadSchema = createInsertSchema(leads).omit({ id: true, createdAt: true, updatedAt: true });
export const insertContentPostSchema = createInsertSchema(contentPosts)
  .omit({ id: true, createdAt: true, updatedAt: true })
  .extend({
    platforms: z.array(z.enum(['facebook', 'instagram', 'twitter', 'linkedin', 'tiktok', 'youtube'])).min(1, "Select at least one platform"),
    scheduledFor: z.preprocess(
      (val) => {
        if (val === null || val === undefined || val === '') return null;
        if (val instanceof Date) return val;
        if (typeof val === 'string') return new Date(val);
        return val;
      },
      z.date().nullable().optional()
    ),
  });
export const insertInvoiceSchema = createInsertSchema(invoices).omit({ id: true, createdAt: true, updatedAt: true });
export const insertTicketSchema = createInsertSchema(tickets).omit({ id: true, createdAt: true, updatedAt: true });
export const insertMessageSchema = createInsertSchema(messages).omit({ id: true, createdAt: true });
export const insertOnboardingTaskSchema = createInsertSchema(onboardingTasks).omit({ id: true, createdAt: true });
export const insertClientDocumentSchema = createInsertSchema(clientDocuments).omit({ id: true, createdAt: true });
export const insertLeadActivitySchema = createInsertSchema(leadActivities).omit({ id: true, createdAt: true });
export const insertLeadAutomationSchema = createInsertSchema(leadAutomations).omit({ id: true, createdAt: true });
export const insertWebsiteProjectSchema = createInsertSchema(websiteProjects).omit({ id: true, createdAt: true, updatedAt: true });
export const insertProjectFeedbackSchema = createInsertSchema(projectFeedback).omit({ id: true, createdAt: true });
export const insertAnalyticsMetricSchema = createInsertSchema(analyticsMetrics).omit({ id: true, createdAt: true });

// TypeScript types
export type UpsertUser = z.infer<typeof upsertUserSchema>;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertClient = z.infer<typeof insertClientSchema>;
export type Client = typeof clients.$inferSelect;

export type InsertCampaign = z.infer<typeof insertCampaignSchema>;
export type Campaign = typeof campaigns.$inferSelect;

export type InsertTask = z.infer<typeof insertTaskSchema>;
export type Task = typeof tasks.$inferSelect;

export type InsertTaskSpace = z.infer<typeof insertTaskSpaceSchema>;
export type TaskSpace = typeof taskSpaces.$inferSelect;

export type InsertUserViewPreferences = z.infer<typeof insertUserViewPreferencesSchema>;
export type UserViewPreferences = typeof userViewPreferences.$inferSelect;

export type InsertLead = z.infer<typeof insertLeadSchema>;
export type Lead = typeof leads.$inferSelect;

export type InsertContentPost = z.infer<typeof insertContentPostSchema>;
export type ContentPost = typeof contentPosts.$inferSelect;

export type InsertInvoice = z.infer<typeof insertInvoiceSchema>;
export type Invoice = typeof invoices.$inferSelect;

export type InsertTicket = z.infer<typeof insertTicketSchema>;
export type Ticket = typeof tickets.$inferSelect;

export type InsertMessage = z.infer<typeof insertMessageSchema>;
export type Message = typeof messages.$inferSelect;

export type InsertOnboardingTask = z.infer<typeof insertOnboardingTaskSchema>;
export type OnboardingTask = typeof onboardingTasks.$inferSelect;

export type InsertClientDocument = z.infer<typeof insertClientDocumentSchema>;
export type ClientDocument = typeof clientDocuments.$inferSelect;

export type InsertTaskComment = z.infer<typeof insertTaskCommentSchema>;
export type TaskComment = typeof taskComments.$inferSelect;

export type InsertLeadActivity = z.infer<typeof insertLeadActivitySchema>;
export type LeadActivity = typeof leadActivities.$inferSelect;

export type InsertLeadAutomation = z.infer<typeof insertLeadAutomationSchema>;
export type LeadAutomation = typeof leadAutomations.$inferSelect;

export type InsertWebsiteProject = z.infer<typeof insertWebsiteProjectSchema>;
export type WebsiteProject = typeof websiteProjects.$inferSelect;

export type InsertProjectFeedback = z.infer<typeof insertProjectFeedbackSchema>;
export type ProjectFeedback = typeof projectFeedback.$inferSelect;

export type InsertAnalyticsMetric = z.infer<typeof insertAnalyticsMetricSchema>;
export type AnalyticsMetric = typeof analyticsMetrics.$inferSelect;

export const insertActivityLogSchema = createInsertSchema(activityLogs).omit({ id: true, createdAt: true });
export type InsertActivityLog = z.infer<typeof insertActivityLogSchema>;
export type ActivityLog = typeof activityLogs.$inferSelect;

export const insertNotificationSchema = createInsertSchema(notifications).omit({ id: true, createdAt: true });
export type InsertNotification = z.infer<typeof insertNotificationSchema>;
export type Notification = typeof notifications.$inferSelect;

export const insertEmailSchema = createInsertSchema(emails).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertEmail = z.infer<typeof insertEmailSchema>;
export type Email = typeof emails.$inferSelect;

export const insertEmailAccountSchema = createInsertSchema(emailAccounts).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertEmailAccount = z.infer<typeof insertEmailAccountSchema>;
export type EmailAccount = typeof emailAccounts.$inferSelect;

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
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: varchar("username").unique().notNull(),
  password: varchar("password").notNull(),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  role: varchar("role").notNull().default("staff"), // admin, staff, client
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
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
  assignedToId: varchar("assigned_to_id").references(() => users.id),
  notes: text("notes"),
  socialLinks: jsonb("social_links"), // {twitter, facebook, instagram, linkedin}
  stripeCustomerId: varchar("stripe_customer_id"),
  stripeSubscriptionId: varchar("stripe_subscription_id"),
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

// Tasks table
export const tasks = pgTable("tasks", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  campaignId: varchar("campaign_id").references(() => campaigns.id),
  clientId: varchar("client_id").references(() => clients.id),
  assignedToId: varchar("assigned_to_id").references(() => users.id),
  title: varchar("title").notNull(),
  description: text("description"),
  status: varchar("status").notNull().default("todo"), // todo, in_progress, review, completed
  priority: varchar("priority").notNull().default("normal"), // low, normal, high, urgent
  dueDate: timestamp("due_date"),
  completedAt: timestamp("completed_at"),
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
  comments: many(taskComments),
}));

// Task Comments table (for collaboration)
export const taskComments = pgTable("task_comments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  taskId: varchar("task_id").references(() => tasks.id).notNull(),
  userId: varchar("user_id").references(() => users.id).notNull(),
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
  assignedToId: varchar("assigned_to_id").references(() => users.id),
  name: varchar("name").notNull(),
  email: varchar("email"),
  phone: varchar("phone"),
  company: varchar("company"),
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
  userId: varchar("user_id").references(() => users.id),
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
  platform: varchar("platform").notNull(), // facebook, instagram, twitter, linkedin
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
  assignedToId: varchar("assigned_to_id").references(() => users.id),
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
  userId: varchar("user_id").references(() => users.id).notNull(),
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
  userId: varchar("user_id").references(() => users.id),
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

// Zod schemas for validation
export const upsertUserSchema = createInsertSchema(users).omit({ id: true, createdAt: true, updatedAt: true });
export const insertUserSchema = createInsertSchema(users).omit({ id: true, createdAt: true, updatedAt: true }).extend({
  password: z.string().min(6, "Password must be at least 6 characters"),
});
export const insertClientSchema = createInsertSchema(clients).omit({ id: true, createdAt: true, updatedAt: true });
export const insertCampaignSchema = createInsertSchema(campaigns).omit({ id: true, createdAt: true, updatedAt: true });
export const insertTaskSchema = createInsertSchema(tasks).omit({ id: true, createdAt: true, updatedAt: true });
export const insertLeadSchema = createInsertSchema(leads).omit({ id: true, createdAt: true, updatedAt: true });
export const insertContentPostSchema = createInsertSchema(contentPosts).omit({ id: true, createdAt: true, updatedAt: true });
export const insertInvoiceSchema = createInsertSchema(invoices).omit({ id: true, createdAt: true, updatedAt: true });
export const insertTicketSchema = createInsertSchema(tickets).omit({ id: true, createdAt: true, updatedAt: true });
export const insertMessageSchema = createInsertSchema(messages).omit({ id: true, createdAt: true });
export const insertOnboardingTaskSchema = createInsertSchema(onboardingTasks).omit({ id: true, createdAt: true });
export const insertClientDocumentSchema = createInsertSchema(clientDocuments).omit({ id: true, createdAt: true });
export const insertTaskCommentSchema = createInsertSchema(taskComments).omit({ id: true, createdAt: true });
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

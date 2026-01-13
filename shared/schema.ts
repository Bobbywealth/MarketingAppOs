import { sql } from "drizzle-orm";
import { relations } from "drizzle-orm";
import {
  index,
  uniqueIndex,
  jsonb,
  pgTable,
  timestamp,
  varchar,
  text,
  integer,
  boolean,
  serial,
  decimal,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { UserRole } from "./roles";

export { UserRole };

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
  role: text("role").notNull().default("staff"), // admin, staff, client, sales_agent, creator
  clientId: varchar("client_id"), // Links to clients table for client role users
  creatorId: varchar("creator_id"), // Links to creators table for creator role users
  customPermissions: jsonb("custom_permissions"), // Individual sidebar permissions: { dashboard: true, clients: false, etc. }
  // Google Calendar OAuth (used for Company Calendar sync)
  googleAccessToken: text("google_access_token"),
  googleRefreshToken: text("google_refresh_token"),
  googleTokenExpiry: timestamp("google_token_expiry"),
  googleCalendarConnected: boolean("google_calendar_connected").default(false),
  lastSeen: timestamp("last_seen"),
  emailVerified: boolean("email_verified").default(false),
  emailVerificationToken: text("email_verification_token"),
  resetPasswordToken: text("reset_password_token"),
  resetPasswordExpires: timestamp("reset_password_expires"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  profileImageUrl: text("profile_image_url"),
}, (table) => [
  index("IDX_users_client_id").on(table.clientId),
  index("IDX_users_creator_id").on(table.creatorId),
  index("IDX_users_username").on(table.username),
]);

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
  status: varchar("status").notNull().default("active"), // active, inactive, onboarding, at_risk, paused, cancelled
  assignedToId: integer("assigned_to_id").references(() => users.id),
  // Sprint 1: sales + onboarding cleanup fields
  packageId: varchar("package_id"), // FK to subscription_packages.id (kept as string for flexibility)
  startDate: timestamp("start_date"),
  salesAgentId: integer("sales_agent_id").references(() => users.id),
  accountManagerId: integer("account_manager_id").references(() => users.id),
  billingStatus: varchar("billing_status").default("current"), // current | overdue | paused | cancelled
  lastPostDate: timestamp("last_post_date"),
  lastVisitDate: timestamp("last_visit_date"),
  notes: text("notes"),
  socialLinks: jsonb("social_links"), // {twitter, facebook, instagram, linkedin}
  socialCredentials: jsonb("social_credentials"), // {platform: {username, password}}
  brandAssets: jsonb("brand_assets"), // {primaryColor, secondaryColor, logoUrl, brandVoice}
  stripeCustomerId: varchar("stripe_customer_id"),
  stripeSubscriptionId: varchar("stripe_subscription_id"),
  displayOrder: integer("display_order").default(0),
  optInEmail: boolean("opt_in_email").default(true),
  optInSms: boolean("opt_in_sms").default(true),
  requiresBrandInfo: boolean("requires_brand_info").default(false),
  lastMarketingReceived: timestamp("last_marketing_received"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("IDX_clients_created_at").on(table.createdAt),
  index("IDX_clients_assigned_to").on(table.assignedToId),
  index("IDX_clients_sales_agent").on(table.salesAgentId),
  index("IDX_clients_account_manager").on(table.accountManagerId),
  index("IDX_clients_status").on(table.status),
]);

export const clientsRelations = relations(clients, ({ one, many }) => ({
  assignedTo: one(users, {
    fields: [clients.assignedToId],
    references: [users.id],
  }),
  salesAgent: one(users, {
    fields: [clients.salesAgentId],
    references: [users.id],
  }),
  accountManager: one(users, {
    fields: [clients.accountManagerId],
    references: [users.id],
  }),
  campaigns: many(campaigns),
  leads: many(leads),
  invoices: many(invoices),
  tickets: many(tickets),
  contentPosts: many(contentPosts),
  onboardingTasks: many(onboardingTasks),
}));

// Client Social Media Stats (Manual Entry)
export const clientSocialStats = pgTable("client_social_stats", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  clientId: varchar("client_id").references(() => clients.id).notNull(),
  platform: varchar("platform").notNull(), // instagram, facebook, tiktok, youtube, twitter, linkedin
  followers: integer("followers"),
  posts: integer("posts"),
  engagement: decimal("engagement", { precision: 5, scale: 2 }), // percentage like 3.2%
  reach: integer("reach"),
  views: integer("views"),
  growthRate: decimal("growth_rate", { precision: 5, scale: 2 }), // percentage like +12%
  lastUpdated: timestamp("last_updated").defaultNow(),
  updatedBy: integer("updated_by").references(() => users.id),
  notes: text("notes"), // Any additional context
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("IDX_social_stats_client").on(table.clientId),
  index("IDX_social_stats_platform").on(table.platform),
]);

export const clientSocialStatsRelations = relations(clientSocialStats, ({ one }) => ({
  client: one(clients, {
    fields: [clientSocialStats.clientId],
    references: [clients.id],
  }),
  updater: one(users, {
    fields: [clientSocialStats.updatedBy],
    references: [users.id],
  }),
}));

// ScrapeCreators Social Accounts
export const socialAccounts = pgTable("social_accounts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  clientId: varchar("client_id").references(() => clients.id).notNull(),
  platform: varchar("platform").notNull(), // instagram, tiktok, youtube
  handle: varchar("handle").notNull(),
  profileUrl: text("profile_url"),
  displayName: text("display_name"),
  status: varchar("status").notNull().default("active"), // active, paused, error
  lastScrapedAt: timestamp("last_scraped_at"),
  lastError: text("last_error"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("IDX_social_accounts_client").on(table.clientId),
  index("IDX_social_accounts_status").on(table.status),
]);

export const socialAccountMetricsSnapshots = pgTable("social_account_metrics_snapshots", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  socialAccountId: varchar("social_account_id").references(() => socialAccounts.id).notNull(),
  capturedAt: timestamp("captured_at").notNull(),
  followers: integer("followers"),
  following: integer("following"),
  postsCount: integer("posts_count"),
  likesCount: integer("likes_count"),
  viewsCount: integer("views_count"),
  rawPayload: jsonb("raw_payload"),
}, (table) => [
  index("IDX_social_snapshots_account_captured").on(table.socialAccountId, table.capturedAt)
]);

export const socialAccountsRelations = relations(socialAccounts, ({ one, many }) => ({
  client: one(clients, {
    fields: [socialAccounts.clientId],
    references: [clients.id],
  }),
  snapshots: many(socialAccountMetricsSnapshots),
}));

export const socialAccountMetricsSnapshotsRelations = relations(socialAccountMetricsSnapshots, ({ one }) => ({
  account: one(socialAccounts, {
    fields: [socialAccountMetricsSnapshots.socialAccountId],
    references: [socialAccounts.id],
  }),
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
  createdBy: integer("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("IDX_campaigns_status").on(table.status),
  index("IDX_campaigns_created_at").on(table.createdAt),
  index("IDX_campaigns_client").on(table.clientId),
]);

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
  scheduleFrom: varchar("schedule_from").default("due_date"), // "due_date" or "completion_date"
  // Robust recurrence instance tracking (prevents duplicates across retries/schedulers)
  recurrenceSeriesId: varchar("recurrence_series_id"), // UUID-like string linking all instances
  recurrenceInstanceDate: varchar("recurrence_instance_date", { length: 10 }), // YYYY-MM-DD in America/New_York
  checklist: jsonb("checklist").$type<Array<{ id: string; text: string; completed: boolean }>>().default([]),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("IDX_tasks_assigned_to_id").on(table.assignedToId),
  index("IDX_tasks_status").on(table.status),
  index("IDX_tasks_due_date").on(table.dueDate),
  index("IDX_tasks_created_at").on(table.createdAt),
  index("IDX_tasks_client_id").on(table.clientId),
  index("IDX_tasks_campaign_id").on(table.campaignId),
  index("IDX_tasks_space_id").on(table.spaceId),
  index("IDX_tasks_recurrence_series").on(table.recurrenceSeriesId),
  uniqueIndex("UQ_tasks_recurrence_series_instance").on(table.recurrenceSeriesId, table.recurrenceInstanceDate),
]);

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
  name: varchar("name"), // Optional - person's name
  email: varchar("email"),
  phone: varchar("phone"),
  phoneType: varchar("phone_type").default("business"), // business, personal, mobile
  company: varchar("company").notNull(), // Required - company name
  // Sprint 1: pipeline required fields
  decisionMakerName: varchar("decision_maker_name"),
  location: varchar("location"), // City, State or full address
  primaryLocationAddress: text("primary_location_address"), // Full address (preferred over location for Closed Won validation)
  website: varchar("website"),
  // Social media links
  instagram: varchar("instagram"),
  tiktok: varchar("tiktok"),
  facebook: varchar("facebook"),
  youtube: varchar("youtube"),
  // Google Business Profile
  googleBusinessProfile: varchar("google_business_profile"),
  rating: integer("rating"), // 1-5 star rating for the business
  industry: varchar("industry"), // Industry vertical (Technology, Healthcare, Finance, etc.)
  tags: jsonb("tags").$type<string[]>().default([]), // Flexible tags for custom organization
  stage: varchar("stage").notNull().default("prospect"), // prospect, qualified, proposal, closed_won, closed_lost
  closeReason: varchar("close_reason"), // required when stage = closed_lost
  score: varchar("score").notNull().default("warm"), // hot, warm, cold
  value: integer("value"), // potential deal value in cents
  source: varchar("source").notNull().default("google_extract"), // google_extract, instagram, facebook, website_form, referral, tiktok, other
  needs: jsonb("needs").$type<string[]>().default([]), // What the business needs: social_media, content, website, ads, branding, google_optimization, crm, not_sure
  status: varchar("status").default("research_completed"), // research_completed, missing_info, needs_review, ready_for_outreach
  sourceMetadata: jsonb("source_metadata"), // {campaign_id, ad_id, form_name, etc.}
  socialCredentials: jsonb("social_credentials"), // {platform: {username, password}}
  brandAssets: jsonb("brand_assets"), // {primaryColor, secondaryColor, logoUrl, brandVoice}
  notes: text("notes"),
  nextFollowUp: timestamp("next_follow_up"),
  // Contact tracking fields
  lastContactMethod: varchar("last_contact_method"), // email, sms, call, meeting, social, other
  lastContactDate: timestamp("last_contact_date"),
  lastContactNotes: text("last_contact_notes"),
  nextFollowUpDate: timestamp("next_follow_up_date"),
  nextFollowUpType: varchar("next_follow_up_type"), // call, email, meeting, proposal
  contactStatus: varchar("contact_status").default("not_contacted"), // not_contacted, contacted, in_discussion, proposal_sent, follow_up_needed, no_response
  // Conversion tracking
  convertedToClientId: varchar("converted_to_client_id").references(() => clients.id), // Links to client if converted
  convertedAt: timestamp("converted_at"), // When the lead was converted to client
  // Sales agent features
  dealValue: decimal("deal_value", { precision: 10, scale: 2 }), // Potential deal value
  commissionRate: decimal("commission_rate", { precision: 5, scale: 2 }).default("10.00"), // Commission percentage
  expectedCloseDate: timestamp("expected_close_date"), // Expected closing date
  // Sprint 1: Closed Won required fields
  packageId: varchar("package_id"), // Selected subscription package (string/FK)
  expectedStartDate: timestamp("expected_start_date"),
  optInEmail: boolean("opt_in_email").default(true),
  optInSms: boolean("opt_in_sms").default(true),
  lastMarketingReceived: timestamp("last_marketing_received"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("IDX_leads_created_at").on(table.createdAt),
  index("IDX_leads_stage").on(table.stage),
  index("IDX_leads_client_id").on(table.clientId),
  index("IDX_leads_assigned_to").on(table.assignedToId),
  index("IDX_leads_converted_client").on(table.convertedToClientId),
  index("IDX_leads_email").on(table.email),
  index("IDX_leads_company").on(table.company),
]);

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
  type: varchar("type").notNull(), // call, email, sms, meeting, note, stage_change, status_change
  subject: varchar("subject"),
  description: text("description"),
  outcome: varchar("outcome"), // positive, neutral, negative, no_answer, left_voicemail
  metadata: jsonb("metadata"), // {duration, email_id, sms_id, previous_stage, new_stage, call_duration}
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("IDX_lead_activities_lead").on(table.leadId),
  index("IDX_lead_activities_user").on(table.userId),
]);

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

// ===== Creators + Visits (Fulfillment Model) =====

export const creators = pgTable("creators", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  fullName: text("full_name").notNull(),
  phone: text("phone"),
  email: text("email"),
  homeCity: text("home_city"),
  homeCities: text("home_cities").array(), // Multiple cities
  baseZip: text("base_zip"),
  serviceZipCodes: text("service_zip_codes").array(),
  serviceRadiusMiles: integer("service_radius_miles"),
  industries: text("industries").array(), // Industries the creator works with
  ratePerVisitCents: integer("rate_per_visit_cents").notNull(),
  availabilityNotes: text("availability_notes"),
  availability: jsonb("availability").$type<Record<string, "available" | "unavailable">>(), // Date-based availability
  status: varchar("status").notNull().default("active"), // active | backup | inactive
  applicationStatus: varchar("application_status").notNull().default("pending"), // pending | accepted | declined
  instagramUsername: text("instagram_username"),
  tiktokUsername: text("tiktok_username"),
  youtubeHandle: text("youtube_handle"),
  portfolioUrl: text("portfolio_url"),
  termsSigned: boolean("terms_signed").default(false),
  waiverSigned: boolean("waiver_signed").default(false),
  termsSignedAt: timestamp("terms_signed_at"),
  waiverSignedAt: timestamp("waiver_signed_at"),
  termsVersion: text("terms_version"),
  ipAddress: text("ip_address"),
  approvedAt: timestamp("approved_at"),
  approvedByAdmin: integer("approved_by_admin").references(() => users.id),
  performanceScore: decimal("performance_score", { precision: 2, scale: 1 }).default("5.0"), // 1.0 - 5.0
  payoutMethod: text("payout_method").default("manual"), // e.g., 'paypal', 'venmo', 'stripe', 'zelle', 'bank_transfer'
  payoutStatus: varchar("payout_status", { length: 50 }).default("pending"),
  payoutDetails: jsonb("payout_details"), // e.g., { email: '...' } or { account: '...', routing: '...' }
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const clientCreators = pgTable("client_creators", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  clientId: varchar("client_id").references(() => clients.id, { onDelete: "cascade" }).notNull(),
  creatorId: varchar("creator_id").references(() => creators.id, { onDelete: "cascade" }).notNull(),
  role: varchar("role").notNull(), // primary | backup
  active: boolean("active").notNull().default(true),
  assignedAt: timestamp("assigned_at").defaultNow(),
  unassignedAt: timestamp("unassigned_at"),
});

export const creatorVisits = pgTable("creator_visits", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  clientId: varchar("client_id").references(() => clients.id, { onDelete: "cascade" }).notNull(),
  creatorId: varchar("creator_id").references(() => creators.id, { onDelete: "cascade" }).notNull(),
  scheduledStart: timestamp("scheduled_start").notNull(),
  scheduledEnd: timestamp("scheduled_end").notNull(),
  status: varchar("status").notNull().default("scheduled"), // pending | scheduled | completed | missed | cancelled
  completedAt: timestamp("completed_at"),
  uploadReceived: boolean("upload_received").notNull().default(false),
  uploadTimestamp: timestamp("upload_timestamp"),
  uploadLinks: jsonb("upload_links").$type<string[]>().default([]),
  uploadDueAt: timestamp("upload_due_at"),
  uploadOverdue: boolean("upload_overdue").notNull().default(false),
  approved: boolean("approved").notNull().default(false),
  approvedBy: integer("approved_by").references(() => users.id),
  qualityScore: integer("quality_score"), // 1-5
  qualityDetailedScore: jsonb("quality_detailed_score"), // { lighting: 5, framing: 4, content: 5 }
  revisionRequested: boolean("revision_requested").default(false),
  revisionNotes: text("revision_notes"),
  disputeStatus: varchar("dispute_status"), // pending, resolved, none
  paymentReleased: boolean("payment_released").notNull().default(false),
  paymentReleasedAt: timestamp("payment_released_at"),
  payoutId: varchar("payout_id"), // Link to creator_payouts
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const creatorPayouts = pgTable("creator_payouts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  creatorId: varchar("creator_id").references(() => creators.id).notNull(),
  amountCents: integer("amount_cents").notNull(),
  payoutMethod: text("payout_method").notNull(),
  payoutDetails: jsonb("payout_details"),
  transactionId: text("transaction_id"),
  receiptUrl: text("receipt_url"),
  status: varchar("status").notNull().default("completed"), // completed, processing, failed
  notes: text("notes"),
  processedBy: integer("processed_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
});

export const creatorsRelations = relations(creators, ({ many }) => ({
  assignments: many(clientCreators),
  visits: many(creatorVisits),
  payouts: many(creatorPayouts),
}));

export const creatorPayoutsRelations = relations(creatorPayouts, ({ one, many }) => ({
  creator: one(creators, { fields: [creatorPayouts.creatorId], references: [creators.id] }),
  visits: many(creatorVisits),
  processor: one(users, { fields: [creatorPayouts.processedBy], references: [users.id] }),
}));

export const clientCreatorsRelations = relations(clientCreators, ({ one }) => ({
  client: one(clients, { fields: [clientCreators.clientId], references: [clients.id] }),
  creator: one(creators, { fields: [clientCreators.creatorId], references: [creators.id] }),
}));

export const creatorVisitsRelations = relations(creatorVisits, ({ one }) => ({
  client: one(clients, { fields: [creatorVisits.clientId], references: [clients.id] }),
  creator: one(creators, { fields: [creatorVisits.creatorId], references: [creators.id] }),
  approver: one(users, { fields: [creatorVisits.approvedBy], references: [users.id] }),
  payout: one(creatorPayouts, { fields: [creatorVisits.payoutId], references: [creatorPayouts.id] }),
}));

// ===== Courses + Learning Management =====

export const courses = pgTable("courses", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  creatorId: varchar("creator_id").references(() => creators.id).notNull(),
  title: varchar("title").notNull(),
  description: text("description"),
  thumbnailUrl: varchar("thumbnail_url"),
  status: varchar("status").notNull().default("draft"), // draft | published | archived
  category: varchar("category"),
  difficulty: varchar("difficulty").default("beginner"), // beginner | intermediate | advanced
  price: integer("price").default(0), // in cents
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const courseModules = pgTable("course_modules", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  courseId: varchar("course_id").references(() => courses.id, { onDelete: "cascade" }).notNull(),
  title: varchar("title").notNull(),
  description: text("description"),
  order: integer("order").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const courseLessons = pgTable("course_lessons", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  moduleId: varchar("module_id").references(() => courseModules.id, { onDelete: "cascade" }).notNull(),
  title: varchar("title").notNull(),
  description: text("description"),
  contentUrl: varchar("content_url"), // video URL or document path
  contentType: varchar("content_type").notNull().default("video"), // video | document | quiz | text
  textContent: text("text_content"), // For text-based lessons
  order: integer("order").notNull().default(0),
  duration: integer("duration"), // estimated time in minutes
  isFree: boolean("is_free").default(false), // Preview lesson
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const courseEnrollments = pgTable("course_enrollments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  courseId: varchar("course_id").references(() => courses.id, { onDelete: "cascade" }).notNull(),
  userId: integer("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  progress: jsonb("progress").$type<Record<string, boolean>>().default({}), // { lessonId: true }
  status: varchar("status").notNull().default("enrolled"), // enrolled | completed | dropped
  enrolledAt: timestamp("enrolled_at").defaultNow(),
  completedAt: timestamp("completed_at"),
});

export const coursesRelations = relations(courses, ({ one, many }) => ({
  creator: one(creators, { fields: [courses.creatorId], references: [creators.id] }),
  modules: many(courseModules),
  enrollments: many(courseEnrollments),
}));

export const courseModulesRelations = relations(courseModules, ({ one, many }) => ({
  course: one(courses, { fields: [courseModules.courseId], references: [courses.id] }),
  lessons: many(courseLessons),
}));

export const courseLessonsRelations = relations(courseLessons, ({ one }) => ({
  module: one(courseModules, { fields: [courseLessons.moduleId], references: [courseModules.id] }),
}));

export const courseEnrollmentsRelations = relations(courseEnrollments, ({ one }) => ({
  course: one(courses, { fields: [courseEnrollments.courseId], references: [courses.id] }),
  user: one(users, { fields: [courseEnrollments.userId], references: [users.id] }),
}));

// Zod schemas for validation
export const insertCourseSchema = createInsertSchema(courses).omit({ id: true, createdAt: true, updatedAt: true });
export const insertCourseModuleSchema = createInsertSchema(courseModules).omit({ id: true, createdAt: true, updatedAt: true });
export const insertCourseLessonSchema = createInsertSchema(courseLessons).omit({ id: true, createdAt: true, updatedAt: true });
export const insertCourseEnrollmentSchema = createInsertSchema(courseEnrollments).omit({ id: true, enrolledAt: true });

// TypeScript types
export type Course = typeof courses.$inferSelect;
export type InsertCourse = z.infer<typeof insertCourseSchema>;

export type CourseModule = typeof courseModules.$inferSelect;
export type InsertCourseModule = z.infer<typeof insertCourseModuleSchema>;

export type CourseLesson = typeof courseLessons.$inferSelect;
export type InsertCourseLesson = z.infer<typeof insertCourseLessonSchema>;

export type CourseEnrollment = typeof courseEnrollments.$inferSelect;
export type InsertCourseEnrollment = z.infer<typeof insertCourseEnrollmentSchema>;

// Marketing Groups table
export const marketingGroups = pgTable("marketing_groups", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name").notNull(),
  description: text("description"),
  createdBy: integer("created_by").references(() => users.id).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const marketingGroupMembers = pgTable("marketing_group_members", {
  id: serial("id").primaryKey(),
  groupId: varchar("group_id")
    .references(() => marketingGroups.id, { onDelete: "cascade" })
    .notNull(),
  leadId: varchar("lead_id").references(() => leads.id, { onDelete: "cascade" }),
  clientId: varchar("client_id").references(() => clients.id, { onDelete: "cascade" }),
  customRecipient: text("custom_recipient"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const marketingGroupsRelations = relations(marketingGroups, ({ one, many }) => ({
  author: one(users, {
    fields: [marketingGroups.createdBy],
    references: [users.id],
  }),
  members: many(marketingGroupMembers),
}));

export const marketingGroupMembersRelations = relations(marketingGroupMembers, ({ one }) => ({
  group: one(marketingGroups, {
    fields: [marketingGroupMembers.groupId],
    references: [marketingGroups.id],
  }),
  lead: one(leads, {
    fields: [marketingGroupMembers.leadId],
    references: [leads.id],
  }),
  client: one(clients, {
    fields: [marketingGroupMembers.clientId],
    references: [clients.id],
  }),
}));

// Marketing Broadcasts table
export const marketingBroadcasts = pgTable("marketing_broadcasts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  type: varchar("type").notNull(), // 'email', 'sms'
  status: varchar("status").notNull().default("pending"), // 'pending', 'sending', 'completed', 'failed'
  subject: varchar("subject"),
  content: text("content").notNull(),
  mediaUrls: text("media_urls").array(), // For images/videos
  audience: varchar("audience").notNull(), // 'all', 'leads', 'clients', 'specific', 'individual', 'group'
  groupId: varchar("group_id").references(() => marketingGroups.id), // Added for custom groups
  customRecipient: text("custom_recipient"), // Specific email or phone number for 'individual' audience
  filters: jsonb("filters"), // { tags: [], industries: [] }
  totalRecipients: integer("total_recipients").default(0),
  successCount: integer("success_count").default(0),
  failedCount: integer("failed_count").default(0),
  createdBy: integer("created_by").references(() => users.id).notNull(),
  scheduledAt: timestamp("scheduled_at"),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").defaultNow(),
  // Recurrence fields
  isRecurring: boolean("is_recurring").default(false),
  recurringPattern: varchar("recurring_pattern"), // 'daily', 'weekly', 'monthly'
  recurringInterval: integer("recurring_interval").default(1),
  recurringEndDate: timestamp("recurring_end_date"),
  nextRunAt: timestamp("next_run_at"),
  parentBroadcastId: varchar("parent_broadcast_id"), // Link to original recurring template
});

export const marketingBroadcastsRelations = relations(marketingBroadcasts, ({ one, many }) => ({
  author: one(users, {
    fields: [marketingBroadcasts.createdBy],
    references: [users.id],
  }),
  recipients: many(marketingBroadcastRecipients),
}));

export const marketingBroadcastRecipients = pgTable("marketing_broadcast_recipients", {
  id: serial("id").primaryKey(),
  broadcastId: varchar("broadcast_id")
    .references(() => marketingBroadcasts.id, { onDelete: "cascade" })
    .notNull(),
  leadId: varchar("lead_id").references(() => leads.id),
  clientId: varchar("client_id").references(() => clients.id),
  customRecipient: text("custom_recipient"),
  status: varchar("status").notNull().default("pending"), // 'pending', 'sent', 'failed'
  errorMessage: text("error_message"),
  sentAt: timestamp("sent_at"),
});

export const marketingBroadcastRecipientsRelations = relations(marketingBroadcastRecipients, ({ one }) => ({
  broadcast: one(marketingBroadcasts, {
    fields: [marketingBroadcastRecipients.broadcastId],
    references: [marketingBroadcasts.id],
  }),
  lead: one(leads, {
    fields: [marketingBroadcastRecipients.leadId],
    references: [leads.id],
  }),
  client: one(clients, {
    fields: [marketingBroadcastRecipients.clientId],
    references: [clients.id],
  }),
}));

// Marketing Templates table
export const marketingTemplatesTable = pgTable("marketing_templates", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name").notNull(),
  type: varchar("type").notNull(), // 'email', 'sms', 'whatsapp', 'telegram'
  subject: varchar("subject"),
  content: text("content").notNull(),
  mediaUrls: text("media_urls").array(), // For images/videos
  createdBy: integer("created_by").references(() => users.id).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const marketingTemplatesRelations = relations(marketingTemplatesTable, ({ one }) => ({
  author: one(users, {
    fields: [marketingTemplatesTable.createdBy],
    references: [users.id],
  }),
}));

export const insertMarketingTemplateSchema = createInsertSchema(marketingTemplatesTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertMarketingTemplate = z.infer<typeof insertMarketingTemplateSchema>;
export type MarketingTemplate = typeof marketingTemplatesTable.$inferSelect;

// Content Posts table (Content Calendar)
export const contentPosts = pgTable("content_posts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  clientId: varchar("client_id").references(() => clients.id).notNull(),
  visitId: varchar("visit_id").references(() => creatorVisits.id, { onDelete: "set null" }),
  platforms: jsonb("platforms").notNull(), // Array of: facebook, instagram, twitter, linkedin, tiktok, youtube
  title: varchar("title").notNull(),
  content: text("content").notNull(),
  mediaUrls: text("media_urls").array(),
  contentLink: text("content_link"),
  scheduledFor: timestamp("scheduled_for"),
  approvalStatus: varchar("approval_status").notNull().default("pending"), // draft, pending, approved, rejected, published
  approvedBy: varchar("approved_by"),
  platformPostId: varchar("platform_post_id"),
  publishedAt: timestamp("published_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("IDX_content_posts_client").on(table.clientId),
  index("IDX_content_posts_visit").on(table.visitId),
  index("IDX_content_posts_scheduled").on(table.scheduledFor),
]);

export const contentPostsRelations = relations(contentPosts, ({ one }) => ({
  client: one(clients, {
    fields: [contentPosts.clientId],
    references: [clients.id],
  }),
  visit: one(creatorVisits, {
    fields: [contentPosts.visitId],
    references: [creatorVisits.id],
  }),
}));

// Blog Posts table (public website blog / CMS)
export const blogPosts = pgTable("blog_posts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  slug: varchar("slug").notNull(),
  title: varchar("title").notNull(),
  excerpt: text("excerpt"),
  content: text("content").notNull(), // markdown/plaintext
  author: varchar("author"),
  category: varchar("category"),
  tags: text("tags").array(),
  readTime: varchar("read_time"),
  featured: boolean("featured").default(false),
  imageUrl: text("image_url"),
  status: varchar("status").notNull().default("draft"), // draft | published | archived
  publishedAt: timestamp("published_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  uniqueIndex("UQ_blog_posts_slug").on(table.slug),
  index("IDX_blog_posts_status").on(table.status),
  index("IDX_blog_posts_published_at").on(table.publishedAt),
]);

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
  isRead: boolean("is_read").notNull().default(false), // Track read status
  deliveredAt: timestamp("delivered_at"),
  readAt: timestamp("read_at"),
  mediaUrl: varchar("media_url"),
  mediaType: varchar("media_type"), // e.g. audio/webm, audio/mpeg
  durationMs: integer("duration_ms"),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("IDX_messages_client").on(table.clientId),
  index("IDX_messages_user").on(table.userId),
  index("IDX_messages_recipient").on(table.recipientId),
  index("IDX_messages_created_at").on(table.createdAt),
]);

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
  type: varchar("type").notNull().default('info'), // info, success, warning, error
  category: varchar("category").notNull().default('general'), // task, payment, deadline, login, general
  isRead: boolean("is_read").default(false),
  actionUrl: varchar("action_url"), // Optional link to relevant page
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("IDX_notifications_user").on(table.userId),
  index("IDX_notifications_is_read").on(table.isRead),
  index("IDX_notifications_created_at").on(table.createdAt),
]);

export const notificationsRelations = relations(notifications, ({ one }) => ({
  user: one(users, {
    fields: [notifications.userId],
    references: [users.id],
  }),
}));

// User Notification Preferences table
export const userNotificationPreferences = pgTable("user_notification_preferences", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: integer("user_id").notNull().references(() => users.id),
  emailNotifications: boolean("email_notifications").default(true),
  taskUpdates: boolean("task_updates").default(true),
  clientMessages: boolean("client_messages").default(true),
  dueDateReminders: boolean("due_date_reminders").default(true),
  projectUpdates: boolean("project_updates").default(true),
  systemAlerts: boolean("system_alerts").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const userNotificationPreferencesRelations = relations(userNotificationPreferences, ({ one }) => ({
  user: one(users, {
    fields: [userNotificationPreferences.userId],
    references: [users.id],
  }),
}));

// Push Notification History table (for tracking sent push notifications)
export const pushNotificationHistory = pgTable("push_notification_history", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: varchar("title").notNull(),
  body: text("body").notNull(),
  url: varchar("url"), // Optional action URL
  targetType: varchar("target_type").notNull(), // broadcast, role, user
  targetValue: varchar("target_value"), // Role name or user ID if targeted
  sentBy: integer("sent_by").references(() => users.id), // Admin who sent it
  recipientCount: integer("recipient_count").default(0), // Number of recipients
  successful: boolean("successful").default(true),
  errorMessage: text("error_message"), // If sending failed
  createdAt: timestamp("created_at").defaultNow(),
});

export const pushNotificationHistoryRelations = relations(pushNotificationHistory, ({ one }) => ({
  sender: one(users, {
    fields: [pushNotificationHistory.sentBy],
    references: [users.id],
  }),
}));

export const groupConversations = pgTable("group_conversations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  createdBy: integer("created_by").references(() => users.id).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const groupConversationMembers = pgTable("group_conversation_members", {
  id: serial("id").primaryKey(),
  conversationId: varchar("conversation_id")
    .references(() => groupConversations.id, { onDelete: "cascade" })
    .notNull(),
  userId: integer("user_id")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),
  role: text("role").default("member"),
  joinedAt: timestamp("joined_at").defaultNow(),
});

export const groupMessages = pgTable("group_messages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  conversationId: varchar("conversation_id")
    .references(() => groupConversations.id, { onDelete: "cascade" })
    .notNull(),
  userId: integer("user_id")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),
  content: text("content").notNull(),
  mediaUrl: varchar("media_url"),
  mediaType: text("media_type"),
  durationMs: integer("duration_ms"),
  createdAt: timestamp("created_at").defaultNow(),
});

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
}, (table) => [
  index("IDX_emails_user").on(table.userId),
  index("IDX_emails_thread").on(table.threadId),
  index("IDX_emails_received_at").on(table.receivedAt),
]);

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

// SMS Messages table (for Dialpad webhook)
export const smsMessages = pgTable("sms_messages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  dialpadId: varchar("dialpad_id").unique(), // Unique ID from Dialpad
  direction: varchar("direction").notNull(), // 'inbound' or 'outbound'
  fromNumber: varchar("from_number").notNull(),
  toNumber: varchar("to_number").notNull(),
  text: text("text").notNull(),
  status: varchar("status"), // 'sent', 'delivered', 'failed', etc.
  userId: integer("user_id").references(() => users.id),
  leadId: integer("lead_id").references(() => leads.id),
  timestamp: timestamp("timestamp").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("IDX_sms_messages_user").on(table.userId),
  index("IDX_sms_messages_lead").on(table.leadId),
  index("IDX_sms_messages_dialpad").on(table.dialpadId),
]);

export const smsMessagesRelations = relations(smsMessages, ({ one }) => ({
  user: one(users, {
    fields: [smsMessages.userId],
    references: [users.id],
  }),
  lead: one(leads, {
    fields: [smsMessages.leadId],
    references: [leads.id],
  }),
}));

export const insertSmsMessageSchema = createInsertSchema(smsMessages);
export type InsertSmsMessage = z.infer<typeof insertSmsMessageSchema>;
export type SmsMessage = typeof smsMessages.$inferSelect;

// Role Permissions table
export const rolePermissions = pgTable("role_permissions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  role: varchar("role").notNull().unique(), // admin, manager, staff, client
  permissions: jsonb("permissions").notNull(), // { canManageUsers: true, canManageClients: false, ... }
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Password Vault (Admin-only secret storage; encrypted at rest by server)
export const passwordVaultItems = pgTable("password_vault_items", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name").notNull(), // e.g. "Google Ads", "Meta Business", "Client FTP"
  username: varchar("username"),
  url: text("url"),
  passwordEncrypted: text("password_encrypted").notNull(),
  notesEncrypted: text("notes_encrypted"),
  createdBy: integer("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("IDX_password_vault_items_created_at").on(table.createdAt),
  index("IDX_password_vault_items_created_by").on(table.createdBy),
  index("IDX_password_vault_items_name").on(table.name),
]);

export const insertPasswordVaultItemSchema = createInsertSchema(passwordVaultItems).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertPasswordVaultItem = z.infer<typeof insertPasswordVaultItemSchema>;
export type PasswordVaultItem = typeof passwordVaultItems.$inferSelect;

// Subscription Packages table
export const subscriptionPackages = pgTable("subscription_packages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name").notNull(), // e.g., "Starter", "Professional", "Enterprise"
  description: text("description"), // Short description
  price: integer("price").notNull(), // Price in cents
  billingPeriod: varchar("billing_period").notNull().default("month"), // month, year
  features: jsonb("features").notNull(), // Array of features
  stripePriceId: varchar("stripe_price_id"), // Stripe Price ID for integration
  stripeProductId: varchar("stripe_product_id"), // Stripe Product ID
  isActive: boolean("is_active").default(true),
  isFeatured: boolean("is_featured").default(false), // Highlight as "Most Popular"
  displayOrder: integer("display_order").default(0), // Order on homepage
  buttonText: varchar("button_text").default("Get Started"), // CTA button text
  buttonLink: varchar("button_link"), // Where button links to
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Zod schemas for validation
export const upsertUserSchema = createInsertSchema(users).omit({ id: true, createdAt: true });
export const insertUserSchema = createInsertSchema(users).omit({ id: true, createdAt: true }).extend({
  password: z.string().min(8, "Password must be at least 8 characters"),
});
export const insertClientSchema = createInsertSchema(clients)
  .omit({ id: true, createdAt: true, updatedAt: true })
  .extend({
    startDate: z.union([z.string(), z.date()]).optional().nullable().transform((val) => {
      if (!val) return null;
      return val instanceof Date ? val : new Date(val);
    }),
    lastPostDate: z.union([z.string(), z.date()]).optional().nullable().transform((val) => {
      if (!val) return null;
      return val instanceof Date ? val : new Date(val);
    }),
    lastVisitDate: z.union([z.string(), z.date()]).optional().nullable().transform((val) => {
      if (!val) return null;
      return val instanceof Date ? val : new Date(val);
    }),
  });
export const insertClientSocialStatsSchema = createInsertSchema(clientSocialStats).omit({ id: true, createdAt: true });
export const insertCampaignSchema = createInsertSchema(campaigns)
  .omit({ id: true, createdAt: true, updatedAt: true })
  .extend({
    startDate: z.union([z.string(), z.date()]).optional().nullable().transform(val => {
      if (!val) return null;
      return val instanceof Date ? val : new Date(val);
    }),
    endDate: z.union([z.string(), z.date()]).optional().nullable().transform(val => {
      if (!val) return null;
      return val instanceof Date ? val : new Date(val);
    }),
  });
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
export const insertLeadSchema = createInsertSchema(leads)
  .omit({ id: true, createdAt: true, updatedAt: true })
  .extend({
    expectedStartDate: z.union([z.string(), z.date()]).optional().nullable().transform((val) => {
      if (!val) return null;
      return val instanceof Date ? val : new Date(val);
    }),
    expectedCloseDate: z.union([z.string(), z.date()]).optional().nullable().transform((val) => {
      if (!val) return null;
      return val instanceof Date ? val : new Date(val);
    }),
  });
export const insertContentPostSchema = createInsertSchema(contentPosts)
  .omit({ id: true, createdAt: true, updatedAt: true })
  .extend({
    platforms: z.array(z.enum(['facebook', 'instagram', 'twitter', 'linkedin', 'tiktok', 'youtube'])).min(1, "Select at least one platform"),
    mediaUrls: z.array(z.string()).optional(),
    contentLink: z.string().url("Must be a valid URL").optional().nullable().or(z.literal("")),
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

export const insertBlogPostSchema = createInsertSchema(blogPosts)
  .omit({ id: true, createdAt: true, updatedAt: true })
  .extend({
    tags: z.array(z.string().min(1)).optional().nullable(),
    publishedAt: z
      .union([z.string(), z.date()])
      .optional()
      .nullable()
      .transform((val) => (val ? new Date(val) : null))
      .refine((d) => d == null || !Number.isNaN(d.getTime()), "Invalid publishedAt"),
  });
export const insertInvoiceSchema = createInsertSchema(invoices).omit({ id: true, createdAt: true, updatedAt: true });
export const insertTicketSchema = createInsertSchema(tickets).omit({ id: true, createdAt: true, updatedAt: true });
export const insertMessageSchema = createInsertSchema(messages)
  .omit({ id: true, createdAt: true })
  .extend({
    // Accept relative paths from our uploader or absolute URLs
    mediaUrl: z.string().min(1).optional().nullable(),
    mediaType: z.string().optional().nullable(),
    durationMs: z.number().int().min(0).optional().nullable(),
  });
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

export type InsertClientSocialStats = z.infer<typeof insertClientSocialStatsSchema>;
export type ClientSocialStats = typeof clientSocialStats.$inferSelect;

export type InsertCampaign = z.infer<typeof insertCampaignSchema>;
export type Campaign = typeof campaigns.$inferSelect;

export type InsertTask = z.infer<typeof insertTaskSchema>;
export type Task = typeof tasks.$inferSelect;

export type InsertTaskSpace = z.infer<typeof insertTaskSpaceSchema>;
export type TaskSpace = typeof taskSpaces.$inferSelect;

export type InsertUserViewPreferences = z.infer<typeof insertUserViewPreferencesSchema>;
export type UserNotificationPreferences = typeof userNotificationPreferences.$inferSelect;
export type InsertUserNotificationPreferences = typeof userNotificationPreferences.$inferInsert;
export type UserViewPreferences = typeof userViewPreferences.$inferSelect;

export type InsertLead = z.infer<typeof insertLeadSchema>;
export type Lead = typeof leads.$inferSelect;

export type InsertContentPost = z.infer<typeof insertContentPostSchema>;
export type ContentPost = typeof contentPosts.$inferSelect;

export type InsertBlogPost = z.infer<typeof insertBlogPostSchema>;
export type BlogPost = typeof blogPosts.$inferSelect;

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

export const insertPushNotificationHistorySchema = createInsertSchema(pushNotificationHistory).omit({ id: true, createdAt: true });
export type InsertPushNotificationHistory = z.infer<typeof insertPushNotificationHistorySchema>;
export type PushNotificationHistory = typeof pushNotificationHistory.$inferSelect;

export type GroupConversation = typeof groupConversations.$inferSelect;
export type GroupConversationMember = typeof groupConversationMembers.$inferSelect;
export type GroupMessage = typeof groupMessages.$inferSelect;

export const insertEmailSchema = createInsertSchema(emails).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertEmail = z.infer<typeof insertEmailSchema>;
export type Email = typeof emails.$inferSelect;

export const insertEmailAccountSchema = createInsertSchema(emailAccounts).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertEmailAccount = z.infer<typeof insertEmailAccountSchema>;
export type EmailAccount = typeof emailAccounts.$inferSelect;

export const insertRolePermissionsSchema = createInsertSchema(rolePermissions).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertRolePermissions = z.infer<typeof insertRolePermissionsSchema>;
export type RolePermissions = typeof rolePermissions.$inferSelect;

export const insertSubscriptionPackageSchema = createInsertSchema(subscriptionPackages).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertSubscriptionPackage = z.infer<typeof insertSubscriptionPackageSchema>;
export type SubscriptionPackage = typeof subscriptionPackages.$inferSelect;

// Page Views table for website analytics tracking
export const pageViews = pgTable("page_views", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  page: varchar("page").notNull(), // URL path
  referrer: varchar("referrer"),
  userAgent: text("user_agent"),
  ip: varchar("ip"),
  country: varchar("country"),
  city: varchar("city"),
  deviceType: varchar("device_type"), // mobile, desktop, tablet
  browser: varchar("browser"),
  sessionId: varchar("session_id"), // To track unique sessions
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertPageViewSchema = createInsertSchema(pageViews).omit({ id: true, createdAt: true });
export type InsertPageView = z.infer<typeof insertPageViewSchema>;
export type PageView = typeof pageViews.$inferSelect;

// Calendar Events table
export const calendarEvents = pgTable("calendar_events", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: varchar("title").notNull(),
  description: text("description"),
  start: timestamp("start").notNull(),
  end: timestamp("end").notNull(),
  location: varchar("location"),
  type: varchar("type").notNull().default("event"), // meeting, call, deadline, reminder, event
  attendees: text("attendees").array(),
  googleEventId: varchar("google_event_id"),
  meetLink: varchar("meet_link"),
  createdBy: integer("created_by").notNull().references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertCalendarEventSchema = createInsertSchema(calendarEvents).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertCalendarEvent = z.infer<typeof insertCalendarEventSchema>;
export type CalendarEvent = typeof calendarEvents.$inferSelect;

// Second Me (AI Avatar) table
export const secondMe = pgTable("second_me", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  clientId: varchar("client_id").notNull().references(() => clients.id),
  status: varchar("status").notNull().default("pending"), // pending, processing, ready, active, paused
  photoUrls: text("photo_urls").array(), // Array of uploaded photo URLs
  avatarUrl: varchar("avatar_url"), // Final AI avatar/character URL from Higgsfield
  setupPaid: boolean("setup_paid").default(false),
  weeklySubscriptionActive: boolean("weekly_subscription_active").default(false),
  stripeSetupPaymentId: varchar("stripe_setup_payment_id"),
  stripeWeeklySubscriptionId: varchar("stripe_weekly_subscription_id"),
  notes: text("notes"), // Admin notes about the avatar
  // Character fields
  characterName: varchar("character_name", { length: 255 }),
  vibe: varchar("vibe", { length: 100 }),
  mission: text("mission"),
  storyWords: varchar("story_words", { length: 255 }),
  topics: text("topics"), // JSON array stored as text
  personalityType: varchar("personality_type", { length: 100 }),
  dreamCollab: varchar("dream_collab", { length: 255 }),
  catchphrase: text("catchphrase"),
  targetAudience: text("target_audience"),
  contentStyle: varchar("content_style", { length: 100 }),
  bio: text("bio"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertSecondMeSchema = createInsertSchema(secondMe).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertSecondMe = z.infer<typeof insertSecondMeSchema>;
export type SecondMe = typeof secondMe.$inferSelect;

// Second Me Content (AI-generated weekly content)
export const secondMeContent = pgTable("second_me_content", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  secondMeId: varchar("second_me_id").notNull().references(() => secondMe.id),
  clientId: varchar("client_id").notNull().references(() => clients.id),
  contentType: varchar("content_type").notNull(), // video, image
  mediaUrl: varchar("media_url").notNull(),
  caption: text("caption"),
  weekNumber: integer("week_number"), // Track which week this content is for
  status: varchar("status").notNull().default("pending"), // pending, approved, scheduled, published
  scheduledFor: timestamp("scheduled_for"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertSecondMeContentSchema = createInsertSchema(secondMeContent).omit({ id: true, createdAt: true });
export type InsertSecondMeContent = z.infer<typeof insertSecondMeContentSchema>;
export type SecondMeContent = typeof secondMeContent.$inferSelect;

// Sales Agent Features

// Commissions table - tracks earnings for sales agents
export const commissions = pgTable("commissions", {
  id: serial("id").primaryKey(),
  agentId: integer("agent_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  leadId: varchar("lead_id").references(() => leads.id, { onDelete: "set null" }),
  clientId: varchar("client_id").references(() => clients.id, { onDelete: "set null" }),
  dealValue: decimal("deal_value", { precision: 10, scale: 2 }).notNull(),
  commissionRate: decimal("commission_rate", { precision: 5, scale: 2 }).notNull(),
  commissionAmount: decimal("commission_amount", { precision: 10, scale: 2 }).notNull(),
  status: varchar("status").default("pending"), // pending, approved, paid
  notes: text("notes"),
  approvedBy: integer("approved_by").references(() => users.id),
  approvedAt: timestamp("approved_at"),
  paidAt: timestamp("paid_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("IDX_commissions_agent").on(table.agentId),
  index("IDX_commissions_lead").on(table.leadId),
  index("IDX_commissions_client").on(table.clientId),
  index("IDX_commissions_status").on(table.status),
]);

export const commissionsRelations = relations(commissions, ({ one }) => ({
  agent: one(users, {
    fields: [commissions.agentId],
    references: [users.id],
  }),
  lead: one(leads, {
    fields: [commissions.leadId],
    references: [leads.id],
  }),
  client: one(clients, {
    fields: [commissions.clientId],
    references: [clients.id],
  }),
  approver: one(users, {
    fields: [commissions.approvedBy],
    references: [users.id],
  }),
}));

export const insertCommissionSchema = createInsertSchema(commissions).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertCommission = z.infer<typeof insertCommissionSchema>;
export type Commission = typeof commissions.$inferSelect;

// Sales Quotas table - defines targets for sales agents
export const salesQuotas = pgTable("sales_quotas", {
  id: serial("id").primaryKey(),
  agentId: integer("agent_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  periodType: varchar("period_type").default("monthly"), // monthly, quarterly, yearly
  periodStart: timestamp("period_start").notNull(),
  periodEnd: timestamp("period_end").notNull(),
  targetAmount: decimal("target_amount", { precision: 10, scale: 2 }).notNull(),
  achievedAmount: decimal("achieved_amount", { precision: 10, scale: 2 }).default("0"),
  targetLeads: integer("target_leads"),
  convertedLeads: integer("converted_leads").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const salesQuotasRelations = relations(salesQuotas, ({ one }) => ({
  agent: one(users, {
    fields: [salesQuotas.agentId],
    references: [users.id],
  }),
}));

export const insertSalesQuotaSchema = createInsertSchema(salesQuotas).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertSalesQuota = z.infer<typeof insertSalesQuotaSchema>;
export type SalesQuota = typeof salesQuotas.$inferSelect;

// Lead Assignments table - tracks assignment history
export const leadAssignments = pgTable("lead_assignments", {
  id: serial("id").primaryKey(),
  leadId: varchar("lead_id").notNull().references(() => leads.id, { onDelete: "cascade" }),
  agentId: integer("agent_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  assignedBy: integer("assigned_by").references(() => users.id),
  assignedAt: timestamp("assigned_at").defaultNow(),
  unassignedAt: timestamp("unassigned_at"),
  reason: text("reason"),
  isActive: boolean("is_active").default(true),
}, (table) => [
  index("IDX_lead_assignments_lead").on(table.leadId),
  index("IDX_lead_assignments_agent").on(table.agentId),
  index("IDX_lead_assignments_active").on(table.isActive),
]);

export const leadAssignmentsRelations = relations(leadAssignments, ({ one }) => ({
  lead: one(leads, {
    fields: [leadAssignments.leadId],
    references: [leads.id],
  }),
  agent: one(users, {
    fields: [leadAssignments.agentId],
    references: [users.id],
  }),
  assigner: one(users, {
    fields: [leadAssignments.assignedBy],
    references: [users.id],
  }),
}));

export const insertLeadAssignmentSchema = createInsertSchema(leadAssignments).omit({ id: true, assignedAt: true });
export type InsertLeadAssignment = z.infer<typeof insertLeadAssignmentSchema>;
export type LeadAssignment = typeof leadAssignments.$inferSelect;

// Discount Codes table
export const discountCodes = pgTable("discount_codes", {
  id: serial("id").primaryKey(),
  code: varchar("code", { length: 50 }).unique().notNull(),
  description: text("description"),
  discountPercentage: decimal("discount_percentage", { precision: 5, scale: 2 }).notNull(),
  durationMonths: integer("duration_months"), // null = one-time discount
  stripeCouponId: varchar("stripe_coupon_id", { length: 100 }),
  maxUses: integer("max_uses"),
  usesCount: integer("uses_count").default(0),
  expiresAt: timestamp("expires_at"),
  isActive: boolean("is_active").default(true),
  appliesToPackages: jsonb("applies_to_packages").$type<string[]>(), // null = all packages
  createdBy: integer("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const discountCodesRelations = relations(discountCodes, ({ one, many }) => ({
  creator: one(users, {
    fields: [discountCodes.createdBy],
    references: [users.id],
  }),
  redemptions: many(discountRedemptions),
}));

export const insertDiscountCodeSchema = createInsertSchema(discountCodes).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertDiscountCode = z.infer<typeof insertDiscountCodeSchema>;
export type DiscountCode = typeof discountCodes.$inferSelect;

// Discount Redemptions table
export const discountRedemptions = pgTable("discount_redemptions", {
  id: serial("id").primaryKey(),
  codeId: integer("code_id").references(() => discountCodes.id),
  discountCode: varchar("discount_code", { length: 50 }).notNull(),
  userEmail: varchar("user_email").notNull(),
  clientId: varchar("client_id").references(() => clients.id),
  packageId: varchar("package_id").references(() => subscriptionPackages.id),
  originalPrice: decimal("original_price", { precision: 10, scale: 2 }).notNull(),
  discountAmount: decimal("discount_amount", { precision: 10, scale: 2 }).notNull(),
  finalPrice: decimal("final_price", { precision: 10, scale: 2 }).notNull(),
  stripeSessionId: varchar("stripe_session_id"),
  redeemedAt: timestamp("redeemed_at").defaultNow(),
});

export const discountRedemptionsRelations = relations(discountRedemptions, ({ one }) => ({
  code: one(discountCodes, {
    fields: [discountRedemptions.codeId],
    references: [discountCodes.id],
  }),
  client: one(clients, {
    fields: [discountRedemptions.clientId],
    references: [clients.id],
  }),
  package: one(subscriptionPackages, {
    fields: [discountRedemptions.packageId],
    references: [subscriptionPackages.id],
  }),
}));

export const insertDiscountRedemptionSchema = createInsertSchema(discountRedemptions).omit({ id: true, redeemedAt: true });
export type InsertDiscountRedemption = z.infer<typeof insertDiscountRedemptionSchema>;
export type DiscountRedemption = typeof discountRedemptions.$inferSelect;

// Creators + Visits schemas/types
export const insertCreatorSchema = createInsertSchema(creators).omit({ id: true, createdAt: true }).extend({
  serviceZipCodes: z.array(z.string()).optional().nullable(),
  industries: z.array(z.string()).optional().nullable(),
  homeCities: z.array(z.string()).optional().nullable(),
  availability: z.record(z.enum(["available", "unavailable"])).optional().nullable(),
  termsSigned: z.boolean().optional(),
  waiverSigned: z.boolean().optional(),
  termsSignedAt: z.union([z.string(), z.date()]).optional().nullable().transform(val => val ? new Date(val) : null),
  waiverSignedAt: z.union([z.string(), z.date()]).optional().nullable().transform(val => val ? new Date(val) : null),
  approvedAt: z.union([z.string(), z.date()]).optional().nullable().transform(val => val ? new Date(val) : null),
  payoutMethod: z.string().optional().nullable(),
  payoutDetails: z.any().optional().nullable(),
});
export type InsertCreator = z.infer<typeof insertCreatorSchema>;
export type Creator = typeof creators.$inferSelect;

export const insertClientCreatorSchema = createInsertSchema(clientCreators).omit({ id: true, assignedAt: true });
export type InsertClientCreator = z.infer<typeof insertClientCreatorSchema>;
export type ClientCreator = typeof clientCreators.$inferSelect;

export const insertCreatorVisitSchema = createInsertSchema(creatorVisits)
  .omit({ id: true, createdAt: true })
  .extend({
    // Allow API clients to send ISO strings for timestamps
    scheduledStart: z
      .union([z.string(), z.date()])
      .transform((val) => new Date(val))
      .refine((d) => !Number.isNaN(d.getTime()), "Invalid scheduledStart"),
    scheduledEnd: z
      .union([z.string(), z.date()])
      .transform((val) => new Date(val))
      .refine((d) => !Number.isNaN(d.getTime()), "Invalid scheduledEnd"),

    completedAt: z
      .union([z.string(), z.date()])
      .optional()
      .nullable()
      .transform((val) => (val ? new Date(val) : null))
      .refine((d) => d == null || !Number.isNaN(d.getTime()), "Invalid completedAt"),
    uploadTimestamp: z
      .union([z.string(), z.date()])
      .optional()
      .nullable()
      .transform((val) => (val ? new Date(val) : null))
      .refine((d) => d == null || !Number.isNaN(d.getTime()), "Invalid uploadTimestamp"),
    uploadDueAt: z
      .union([z.string(), z.date()])
      .optional()
      .nullable()
      .transform((val) => (val ? new Date(val) : null))
      .refine((d) => d == null || !Number.isNaN(d.getTime()), "Invalid uploadDueAt"),
    paymentReleasedAt: z
      .union([z.string(), z.date()])
      .optional()
      .nullable()
      .transform((val) => (val ? new Date(val) : null))
      .refine((d) => d == null || !Number.isNaN(d.getTime()), "Invalid paymentReleasedAt"),
  });
export type InsertCreatorVisit = z.infer<typeof insertCreatorVisitSchema>;
export type CreatorVisit = typeof creatorVisits.$inferSelect;

export const insertCreatorPayoutSchema = createInsertSchema(creatorPayouts).omit({ id: true, createdAt: true });
export type InsertCreatorPayout = z.infer<typeof insertCreatorPayoutSchema>;
export type CreatorPayout = typeof creatorPayouts.$inferSelect;

export const insertMarketingBroadcastSchema = createInsertSchema(marketingBroadcasts)
  .omit({ id: true, createdAt: true })
  .extend({
    scheduledAt: z.union([z.string(), z.date()]).optional().nullable().transform(val => val ? new Date(val) : null),
    recurringEndDate: z.union([z.string(), z.date()]).optional().nullable().transform(val => val ? new Date(val) : null),
    nextRunAt: z.union([z.string(), z.date()]).optional().nullable().transform(val => val ? new Date(val) : null),
  });
export type InsertMarketingBroadcast = z.infer<typeof insertMarketingBroadcastSchema>;
export type MarketingBroadcast = typeof marketingBroadcasts.$inferSelect;

export const insertMarketingGroupSchema = createInsertSchema(marketingGroups).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertMarketingGroup = z.infer<typeof insertMarketingGroupSchema>;
export type MarketingGroup = typeof marketingGroups.$inferSelect;

export const insertMarketingGroupMemberSchema = createInsertSchema(marketingGroupMembers).omit({ id: true, createdAt: true });
export type InsertMarketingGroupMember = z.infer<typeof insertMarketingGroupMemberSchema>;
export type MarketingGroupMember = typeof marketingGroupMembers.$inferSelect;

export const insertMarketingBroadcastRecipientSchema = createInsertSchema(marketingBroadcastRecipients).omit({ id: true });
export type InsertMarketingBroadcastRecipient = z.infer<typeof insertMarketingBroadcastRecipientSchema>;
export type MarketingBroadcastRecipient = typeof marketingBroadcastRecipients.$inferSelect;

export const insertSocialAccountSchema = createInsertSchema(socialAccounts).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertSocialAccount = z.infer<typeof insertSocialAccountSchema>;
export type SocialAccount = typeof socialAccounts.$inferSelect;

export const insertSocialAccountMetricsSnapshotSchema = createInsertSchema(socialAccountMetricsSnapshots).omit({ id: true });
export type InsertSocialAccountMetricsSnapshot = z.infer<typeof insertSocialAccountMetricsSnapshotSchema>;
export type SocialAccountMetricsSnapshot = typeof socialAccountMetricsSnapshots.$inferSelect;

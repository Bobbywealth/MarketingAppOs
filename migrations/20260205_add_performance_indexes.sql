-- Performance Optimization: Add Composite Indexes
-- Created: 2026-02-05
-- Description: Add composite indexes for frequently queried columns to improve query performance

-- Clients table composite indexes
CREATE INDEX IF NOT EXISTS IDX_clients_status_assigned ON clients(status, assigned_to_id);
CREATE INDEX IF NOT EXISTS IDX_clients_created_at ON clients(created_at DESC);

-- Campaigns table composite indexes
CREATE INDEX IF NOT EXISTS IDX_campaigns_status_created ON campaigns(status, created_at DESC);

-- Tasks table composite indexes
CREATE INDEX IF NOT EXISTS IDX_tasks_status_due ON tasks(status, due_date);
CREATE INDEX IF NOT EXISTS IDX_tasks_status_assigned ON tasks(status, assigned_to_id);
CREATE INDEX IF NOT EXISTS IDX_tasks_created_at ON tasks(created_at DESC);

-- Leads table composite indexes
CREATE INDEX IF NOT EXISTS IDX_leads_stage_created ON leads(stage, created_at DESC);
CREATE INDEX IF NOT EXISTS IDX_leads_score_stage ON leads(score, stage);
CREATE INDEX IF NOT EXISTS IDX_leads_created_at ON leads(created_at DESC);

-- Notifications table composite index for faster user notification queries
CREATE INDEX IF NOT EXISTS IDX_notifications_user_read ON notifications(user_id, is_read);

-- Emails table composite index for folder-based queries
CREATE INDEX IF NOT EXISTS IDX_emails_user_folder ON emails(user_id, folder);
CREATE INDEX IF NOT EXISTS IDX_emails_folder_received ON emails(folder, received_at DESC);

-- Tasks by space composite index
CREATE INDEX IF NOT EXISTS IDX_tasks_space_status ON tasks(space_id, status);

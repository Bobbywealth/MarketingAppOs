-- Migration: Add missing marketing tables and columns
-- Generated: 2026-01-27

-- Create marketing_broadcasts table if it doesn't exist
CREATE TABLE IF NOT EXISTS marketing_broadcasts (
  id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL DEFAULT 'Untitled Broadcast',
  content TEXT NOT NULL,
  type VARCHAR(50) NOT NULL DEFAULT 'sms',
  audience VARCHAR(50) NOT NULL DEFAULT 'all',
  group_id VARCHAR(255),
  custom_recipient VARCHAR(255),
  subject VARCHAR(500),
  filters JSONB,
  media_urls JSONB,
  media_url VARCHAR(500),
  media_type VARCHAR(50),
  status VARCHAR(50) NOT NULL DEFAULT 'pending',
  scheduled_at TIMESTAMP,
  sent_at TIMESTAMP,
  completed_at TIMESTAMP,
  total_recipients INTEGER DEFAULT 0,
  success_count INTEGER DEFAULT 0,
  failed_count INTEGER DEFAULT 0,
  is_recurring BOOLEAN DEFAULT false,
  recurring_pattern VARCHAR(50),
  recurring_interval INTEGER DEFAULT 1,
  next_run_at TIMESTAMP,
  recurring_end_date TIMESTAMP,
  parent_broadcast_id VARCHAR(255),
  use_ai_personalization BOOLEAN DEFAULT false,
  created_by INTEGER REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create marketing_broadcast_recipients table if it doesn't exist
CREATE TABLE IF NOT EXISTS marketing_broadcast_recipients (
  id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid(),
  broadcast_id VARCHAR(255) NOT NULL REFERENCES marketing_broadcasts(id) ON DELETE CASCADE,
  recipient_id VARCHAR(255),
  recipient_type VARCHAR(50),
  custom_recipient VARCHAR(255),
  status VARCHAR(50) NOT NULL DEFAULT 'pending',
  sent_at TIMESTAMP,
  delivered_at TIMESTAMP,
  error_message TEXT,
  provider_call_id VARCHAR(255),
  lead_id VARCHAR REFERENCES leads(id) ON DELETE SET NULL,
  client_id VARCHAR REFERENCES clients(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create scheduled_ai_commands table if it doesn't exist
CREATE TABLE IF NOT EXISTS scheduled_ai_commands (
  id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id INTEGER NOT NULL REFERENCES users(id),
  command TEXT NOT NULL,
  parameters JSONB,
  status VARCHAR(50) NOT NULL DEFAULT 'pending',
  next_run_at TIMESTAMP,
  last_run_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create marketing_series table if it doesn't exist
CREATE TABLE IF NOT EXISTS marketing_series (
  id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  channel VARCHAR(50) NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'draft',
  created_by INTEGER REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create marketing_series_steps table if it doesn't exist
CREATE TABLE IF NOT EXISTS marketing_series_steps (
  id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid(),
  series_id VARCHAR(255) NOT NULL REFERENCES marketing_series(id) ON DELETE CASCADE,
  step_order INTEGER NOT NULL,
  name VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  delay_hours INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create marketing_series_enrollments table if it doesn't exist
CREATE TABLE IF NOT EXISTS marketing_series_enrollments (
  id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid(),
  series_id VARCHAR(255) NOT NULL REFERENCES marketing_series(id) ON DELETE CASCADE,
  recipient_id VARCHAR(255) NOT NULL,
  recipient_type VARCHAR(50) NOT NULL,
  current_step INTEGER DEFAULT 1,
  status VARCHAR(50) NOT NULL DEFAULT 'active',
  next_step_at TIMESTAMP,
  completed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create commissions table if it doesn't exist
CREATE TABLE IF NOT EXISTS commissions (
  id SERIAL PRIMARY KEY,
  agent_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  lead_id VARCHAR REFERENCES leads(id) ON DELETE SET NULL,
  client_id VARCHAR REFERENCES clients(id) ON DELETE SET NULL,
  deal_value DECIMAL(10,2) NOT NULL,
  commission_rate DECIMAL(5,2) NOT NULL,
  commission_amount DECIMAL(10,2) NOT NULL,
  status VARCHAR(50) DEFAULT 'pending',
  notes TEXT,
  approved_by INTEGER REFERENCES users(id),
  approved_at TIMESTAMP,
  paid_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Add indexes for new tables
CREATE INDEX IF NOT EXISTS idx_scheduled_ai_commands_user_id ON scheduled_ai_commands(user_id);
CREATE INDEX IF NOT EXISTS idx_scheduled_ai_commands_status ON scheduled_ai_commands(status);
CREATE INDEX IF NOT EXISTS idx_scheduled_ai_commands_next_run_at ON scheduled_ai_commands(next_run_at);
CREATE INDEX IF NOT EXISTS idx_marketing_series_enrollments_next_step ON marketing_series_enrollments(next_step_at);
CREATE INDEX IF NOT EXISTS idx_marketing_broadcast_recipients_broadcast_id ON marketing_broadcast_recipients(broadcast_id);
CREATE INDEX IF NOT EXISTS idx_commissions_agent_id ON commissions(agent_id);
CREATE INDEX IF NOT EXISTS idx_commissions_status ON commissions(status);

-- Add missing columns to marketing_broadcasts if they don't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'marketing_broadcasts' AND column_name = 'title'
  ) THEN
    ALTER TABLE marketing_broadcasts ADD COLUMN title VARCHAR(255) NOT NULL DEFAULT 'Untitled Broadcast';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'marketing_broadcasts' AND column_name = 'content'
  ) THEN
    ALTER TABLE marketing_broadcasts ADD COLUMN content TEXT NOT NULL DEFAULT '';
  END IF;
END $$;

-- ========== COMPREHENSIVE DATABASE SCHEMA FIX ==========
-- Add all potentially missing columns and tables
-- Safe to run multiple times (uses IF NOT EXISTS)

-- 1. USERS TABLE
ALTER TABLE users ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS first_name TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_name TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_seen TIMESTAMP;
ALTER TABLE users ADD COLUMN IF NOT EXISTS google_access_token TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS google_refresh_token TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS google_calendar_connected BOOLEAN DEFAULT false;

-- 2. CLIENTS TABLE
ALTER TABLE clients ADD COLUMN IF NOT EXISTS display_order INTEGER DEFAULT 0;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS instagram_access_token TEXT;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS instagram_user_id VARCHAR;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS instagram_connected_at TIMESTAMP;

-- 3. LEADS TABLE
ALTER TABLE leads ADD COLUMN IF NOT EXISTS client_id VARCHAR REFERENCES clients(id);

-- 4. LEAD_ACTIVITIES TABLE
ALTER TABLE lead_activities ADD COLUMN IF NOT EXISTS user_id INTEGER REFERENCES users(id);

-- 5. CONTENT_POSTS TABLE
ALTER TABLE content_posts ADD COLUMN IF NOT EXISTS client_id VARCHAR REFERENCES clients(id);
ALTER TABLE content_posts ADD COLUMN IF NOT EXISTS platform_post_id VARCHAR;
ALTER TABLE content_posts ADD COLUMN IF NOT EXISTS media_urls TEXT[];
ALTER TABLE content_posts ADD COLUMN IF NOT EXISTS approved_by VARCHAR;
ALTER TABLE content_posts ADD COLUMN IF NOT EXISTS published_at TIMESTAMP;

-- 6. NOTIFICATIONS TABLE
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS type VARCHAR DEFAULT 'info';
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS category VARCHAR DEFAULT 'general';

-- 7. INVOICES TABLE
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS notes TEXT;

-- 8. MESSAGES TABLE
ALTER TABLE messages ADD COLUMN IF NOT EXISTS delivered_at TIMESTAMP;
ALTER TABLE messages ADD COLUMN IF NOT EXISTS read_at TIMESTAMP;
ALTER TABLE messages ADD COLUMN IF NOT EXISTS media_url VARCHAR;
ALTER TABLE messages ADD COLUMN IF NOT EXISTS media_type VARCHAR;
ALTER TABLE messages ADD COLUMN IF NOT EXISTS duration_ms INTEGER;

-- 9. TASKS TABLE
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS space_id VARCHAR REFERENCES task_spaces(id);

-- 10. CREATE OPTIONAL TABLES
CREATE TABLE IF NOT EXISTS push_notification_history (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR NOT NULL,
  body TEXT NOT NULL,
  url VARCHAR,
  target_type VARCHAR NOT NULL,
  target_value VARCHAR,
  sent_by INTEGER REFERENCES users(id),
  recipient_count INTEGER DEFAULT 0,
  successful BOOLEAN DEFAULT true,
  error_message TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS sms_messages (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  dialpad_id VARCHAR UNIQUE,
  direction VARCHAR NOT NULL,
  from_number VARCHAR NOT NULL,
  to_number VARCHAR NOT NULL,
  text TEXT NOT NULL,
  status VARCHAR,
  user_id INTEGER REFERENCES users(id),
  lead_id INTEGER,
  timestamp TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS page_views (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  page VARCHAR NOT NULL,
  referrer VARCHAR,
  user_agent TEXT,
  ip VARCHAR,
  country VARCHAR,
  city VARCHAR,
  device_type VARCHAR,
  browser VARCHAR,
  session_id VARCHAR,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS calendar_events (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR NOT NULL,
  description TEXT,
  start TIMESTAMP NOT NULL,
  "end" TIMESTAMP NOT NULL,
  location VARCHAR,
  type VARCHAR NOT NULL DEFAULT 'event',
  attendees TEXT[],
  google_event_id VARCHAR,
  meet_link VARCHAR,
  created_by INTEGER NOT NULL REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS user_notification_preferences (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  email_notifications BOOLEAN DEFAULT true,
  task_updates BOOLEAN DEFAULT true,
  client_messages BOOLEAN DEFAULT true,
  due_date_reminders BOOLEAN DEFAULT true,
  project_updates BOOLEAN DEFAULT true,
  system_alerts BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id)
);

-- ========== DONE ==========


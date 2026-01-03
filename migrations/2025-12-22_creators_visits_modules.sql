-- Creators + Visits Modules (required)
-- Safe to run multiple times (IF NOT EXISTS guards).

-- ===== Creators =====
CREATE TABLE IF NOT EXISTS creators (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  home_city TEXT,
  base_zip TEXT,
  service_zip_codes TEXT[],
  service_radius_miles INTEGER,
  rate_per_visit_cents INTEGER NOT NULL,
  availability_notes TEXT,
  status VARCHAR NOT NULL DEFAULT 'active', -- active | backup | inactive
  performance_score NUMERIC(2,1) DEFAULT 5.0,
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_creators_home_city ON creators(home_city);
CREATE INDEX IF NOT EXISTS idx_creators_base_zip ON creators(base_zip);
CREATE INDEX IF NOT EXISTS idx_creators_status ON creators(status);

-- ===== Client ↔ Creator Assignments =====
CREATE TABLE IF NOT EXISTS client_creators (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  creator_id UUID NOT NULL REFERENCES creators(id) ON DELETE CASCADE,
  role VARCHAR NOT NULL, -- primary | backup
  active BOOLEAN NOT NULL DEFAULT TRUE,
  assigned_at TIMESTAMP DEFAULT NOW(),
  unassigned_at TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_client_creators_client ON client_creators(client_id);
CREATE INDEX IF NOT EXISTS idx_client_creators_creator ON client_creators(creator_id);
CREATE INDEX IF NOT EXISTS idx_client_creators_active_role ON client_creators(client_id, role, active);

-- ===== Visits =====
CREATE TABLE IF NOT EXISTS creator_visits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  creator_id UUID NOT NULL REFERENCES creators(id) ON DELETE CASCADE,
  scheduled_start TIMESTAMP NOT NULL,
  scheduled_end TIMESTAMP NOT NULL,
  status VARCHAR NOT NULL DEFAULT 'scheduled', -- scheduled | completed | missed | cancelled
  completed_at TIMESTAMP,
  upload_received BOOLEAN NOT NULL DEFAULT FALSE,
  upload_timestamp TIMESTAMP,
  upload_links JSONB DEFAULT '[]'::jsonb,
  upload_due_at TIMESTAMP,
  upload_overdue BOOLEAN NOT NULL DEFAULT FALSE,
  approved BOOLEAN NOT NULL DEFAULT FALSE,
  approved_by INTEGER REFERENCES users(id),
  quality_score INTEGER,
  payment_released BOOLEAN NOT NULL DEFAULT FALSE,
  payment_released_at TIMESTAMP,
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_creator_visits_creator_time ON creator_visits(creator_id, scheduled_start, scheduled_end);
CREATE INDEX IF NOT EXISTS idx_creator_visits_client_time ON creator_visits(client_id, scheduled_start, scheduled_end);
CREATE INDEX IF NOT EXISTS idx_creator_visits_upload_overdue ON creator_visits(upload_overdue);

-- ===== Link content posts to visits =====
ALTER TABLE content_posts ADD COLUMN IF NOT EXISTS visit_id UUID REFERENCES creator_visits(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_content_posts_visit_id ON content_posts(visit_id);






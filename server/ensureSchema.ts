import { pool } from "./db";

async function safeQuery(label: string, query: string) {
  try {
    await pool.query(query);
    console.log(`✅ ensureSchema: ${label}`);
  } catch (e: any) {
    // Keep startup resilient; log minimal info.
    console.log(`⚠️ ensureSchema: ${label} skipped: ${e?.message ?? e}`);
  }
}

export async function ensureMinimumSchema() {
  // Tasks: checklist column (used by tasks API + notifications)
  await safeQuery(
    "tasks.checklist column",
    `ALTER TABLE IF EXISTS tasks ADD COLUMN IF NOT EXISTS checklist JSONB DEFAULT '[]'::jsonb;`
  );

  // User columns: creator_id and client_id (critical for role-based access)
  await safeQuery(
    "users.creator_id column",
    `ALTER TABLE IF EXISTS users ADD COLUMN IF NOT EXISTS creator_id VARCHAR;`
  );
  await safeQuery(
    "users.client_id column",
    `ALTER TABLE IF EXISTS users ADD COLUMN IF NOT EXISTS client_id VARCHAR;`
  );

  // Google Calendar OAuth columns (Company Calendar sync)
  await safeQuery(
    "users.google_access_token column",
    `ALTER TABLE IF EXISTS users ADD COLUMN IF NOT EXISTS google_access_token TEXT;`
  );
  await safeQuery(
    "users.google_refresh_token column",
    `ALTER TABLE IF EXISTS users ADD COLUMN IF NOT EXISTS google_refresh_token TEXT;`
  );
  await safeQuery(
    "users.google_token_expiry column",
    `ALTER TABLE IF EXISTS users ADD COLUMN IF NOT EXISTS google_token_expiry TIMESTAMP;`
  );
  await safeQuery(
    "users.google_calendar_connected column",
    `ALTER TABLE IF EXISTS users ADD COLUMN IF NOT EXISTS google_calendar_connected BOOLEAN DEFAULT FALSE;`
  );

  // These are referenced widely in the app; ensure they exist to prevent runtime errors on older DBs.
  await safeQuery(
    "users.updated_at column",
    `ALTER TABLE IF EXISTS users ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW();`
  );
  await safeQuery(
    "users.profile_image_url column",
    `ALTER TABLE IF EXISTS users ADD COLUMN IF NOT EXISTS profile_image_url TEXT;`
  );

  // Creators table (required for visits module)
  await safeQuery(
    "creators table",
    `
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
      status VARCHAR NOT NULL DEFAULT 'active',
      performance_score NUMERIC(2,1) DEFAULT 5.0,
      notes TEXT,
      created_at TIMESTAMP DEFAULT NOW()
    );
    `
  );
  await safeQuery("idx_creators_home_city", `CREATE INDEX IF NOT EXISTS idx_creators_home_city ON creators(home_city);`);
  await safeQuery("idx_creators_base_zip", `CREATE INDEX IF NOT EXISTS idx_creators_base_zip ON creators(base_zip);`);
  await safeQuery("idx_creators_status", `CREATE INDEX IF NOT EXISTS idx_creators_status ON creators(status);`);

  // Client ↔ Creator assignments
  await safeQuery(
    "client_creators table",
    `
    CREATE TABLE IF NOT EXISTS client_creators (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      client_id VARCHAR NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
      creator_id UUID NOT NULL REFERENCES creators(id) ON DELETE CASCADE,
      role VARCHAR NOT NULL,
      active BOOLEAN NOT NULL DEFAULT TRUE,
      assigned_at TIMESTAMP DEFAULT NOW(),
      unassigned_at TIMESTAMP
    );
    `
  );
  await safeQuery("idx_client_creators_client", `CREATE INDEX IF NOT EXISTS idx_client_creators_client ON client_creators(client_id);`);
  await safeQuery("idx_client_creators_creator", `CREATE INDEX IF NOT EXISTS idx_client_creators_creator ON client_creators(creator_id);`);
  await safeQuery(
    "idx_client_creators_active_role",
    `CREATE INDEX IF NOT EXISTS idx_client_creators_active_role ON client_creators(client_id, role, active);`
  );

  // Visits module
  await safeQuery(
    "creator_visits table",
    `
    CREATE TABLE IF NOT EXISTS creator_visits (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      client_id VARCHAR NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
      creator_id UUID NOT NULL REFERENCES creators(id) ON DELETE CASCADE,
      scheduled_start TIMESTAMP NOT NULL,
      scheduled_end TIMESTAMP NOT NULL,
      status VARCHAR NOT NULL DEFAULT 'scheduled',
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
    `
  );
  await safeQuery(
    "idx_creator_visits_creator_time",
    `CREATE INDEX IF NOT EXISTS idx_creator_visits_creator_time ON creator_visits(creator_id, scheduled_start, scheduled_end);`
  );
  await safeQuery(
    "idx_creator_visits_client_time",
    `CREATE INDEX IF NOT EXISTS idx_creator_visits_client_time ON creator_visits(client_id, scheduled_start, scheduled_end);`
  );
  await safeQuery(
    "idx_creator_visits_upload_overdue",
    `CREATE INDEX IF NOT EXISTS idx_creator_visits_upload_overdue ON creator_visits(upload_overdue);`
  );

  // Link content posts to visits
  await safeQuery(
    "content_posts.visit_id column",
    `ALTER TABLE IF EXISTS content_posts ADD COLUMN IF NOT EXISTS visit_id UUID REFERENCES creator_visits(id) ON DELETE SET NULL;`
  );
  await safeQuery("idx_content_posts_visit_id", `CREATE INDEX IF NOT EXISTS idx_content_posts_visit_id ON content_posts(visit_id);`);

  // Marketing opt-in columns
  await safeQuery(
    "clients.opt_in_email column",
    `ALTER TABLE IF EXISTS clients ADD COLUMN IF NOT EXISTS opt_in_email BOOLEAN DEFAULT TRUE;`
  );
  await safeQuery(
    "clients.opt_in_sms column",
    `ALTER TABLE IF EXISTS clients ADD COLUMN IF NOT EXISTS opt_in_sms BOOLEAN DEFAULT TRUE;`
  );
  await safeQuery(
    "clients.last_marketing_received column",
    `ALTER TABLE IF EXISTS clients ADD COLUMN IF NOT EXISTS last_marketing_received TIMESTAMP;`
  );
  await safeQuery(
    "leads.opt_in_email column",
    `ALTER TABLE IF EXISTS leads ADD COLUMN IF NOT EXISTS opt_in_email BOOLEAN DEFAULT TRUE;`
  );
  await safeQuery(
    "leads.opt_in_sms column",
    `ALTER TABLE IF EXISTS leads ADD COLUMN IF NOT EXISTS opt_in_sms BOOLEAN DEFAULT TRUE;`
  );
  await safeQuery(
    "leads.last_marketing_received column",
    `ALTER TABLE IF EXISTS leads ADD COLUMN IF NOT EXISTS last_marketing_received TIMESTAMP;`
  );

  // Creator visits dispute status
  await safeQuery(
    "creator_visits.dispute_status column",
    `ALTER TABLE IF EXISTS creator_visits ADD COLUMN IF NOT EXISTS dispute_status VARCHAR DEFAULT 'none';`
  );

  await safeQuery(
    "creator_visits.payout_id column",
    `ALTER TABLE IF EXISTS creator_visits ADD COLUMN IF NOT EXISTS payout_id VARCHAR;`
  );

  // Creator Payouts table
  await safeQuery(
    "creator_payouts table",
    `
    CREATE TABLE IF NOT EXISTS creator_payouts (
      id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid()::text,
      creator_id UUID NOT NULL REFERENCES creators(id),
      amount_cents INTEGER NOT NULL,
      payout_method TEXT NOT NULL,
      payout_details JSONB DEFAULT '{}'::jsonb,
      transaction_id TEXT,
      receipt_url TEXT,
      status VARCHAR NOT NULL DEFAULT 'completed',
      notes TEXT,
      processed_by INTEGER REFERENCES users(id),
      created_at TIMESTAMP DEFAULT NOW()
    );
    `
  );
  await safeQuery("idx_creator_payouts_creator", `CREATE INDEX IF NOT EXISTS idx_creator_payouts_creator ON creator_payouts(creator_id);`);
  await safeQuery("idx_creator_payouts_status", `CREATE INDEX IF NOT EXISTS idx_creator_payouts_status ON creator_payouts(status);`);

  // Tickets: resolved_at column (fix for runtime error)
  await safeQuery(
    "tickets.resolved_at column",
    `ALTER TABLE IF EXISTS tickets ADD COLUMN IF NOT EXISTS resolved_at TIMESTAMP;`
  );

  // Leads & Clients: missing branding and credentials columns
  await safeQuery(
    "leads.social_credentials column",
    `ALTER TABLE IF EXISTS leads ADD COLUMN IF NOT EXISTS social_credentials JSONB DEFAULT '{}'::jsonb;`
  );
  await safeQuery(
    "leads.brand_assets column",
    `ALTER TABLE IF EXISTS leads ADD COLUMN IF NOT EXISTS brand_assets JSONB DEFAULT '{}'::jsonb;`
  );
  await safeQuery(
    "clients.social_credentials column",
    `ALTER TABLE IF EXISTS clients ADD COLUMN IF NOT EXISTS social_credentials JSONB DEFAULT '{}'::jsonb;`
  );
  await safeQuery(
    "clients.brand_assets column",
    `ALTER TABLE IF EXISTS clients ADD COLUMN IF NOT EXISTS brand_assets JSONB DEFAULT '{}'::jsonb;`
  );

  // Creators: new fields for multi-industry and multi-city support
  await safeQuery(
    "creators.home_cities column",
    `ALTER TABLE IF EXISTS creators ADD COLUMN IF NOT EXISTS home_cities TEXT[];`
  );
  await safeQuery(
    "creators.industries column",
    `ALTER TABLE IF EXISTS creators ADD COLUMN IF NOT EXISTS industries TEXT[];`
  );
  await safeQuery(
    "creators.availability column",
    `ALTER TABLE IF EXISTS creators ADD COLUMN IF NOT EXISTS availability JSONB;`
  );

  // Creator application and legal columns
  await safeQuery(
    "creators.application_status column",
    `ALTER TABLE IF EXISTS creators ADD COLUMN IF NOT EXISTS application_status VARCHAR DEFAULT 'pending';`
  );
  await safeQuery(
    "creators.instagram_username column",
    `ALTER TABLE IF EXISTS creators ADD COLUMN IF NOT EXISTS instagram_username TEXT;`
  );
  await safeQuery(
    "creators.tiktok_username column",
    `ALTER TABLE IF EXISTS creators ADD COLUMN IF NOT EXISTS tiktok_username TEXT;`
  );
  await safeQuery(
    "creators.youtube_handle column",
    `ALTER TABLE IF EXISTS creators ADD COLUMN IF NOT EXISTS youtube_handle TEXT;`
  );
  await safeQuery(
    "creators.portfolio_url column",
    `ALTER TABLE IF EXISTS creators ADD COLUMN IF NOT EXISTS portfolio_url TEXT;`
  );
  await safeQuery(
    "creators.terms_signed column",
    `ALTER TABLE IF EXISTS creators ADD COLUMN IF NOT EXISTS terms_signed BOOLEAN DEFAULT FALSE;`
  );
  await safeQuery(
    "creators.waiver_signed column",
    `ALTER TABLE IF EXISTS creators ADD COLUMN IF NOT EXISTS waiver_signed BOOLEAN DEFAULT FALSE;`
  );
  await safeQuery(
    "creators.terms_signed_at column",
    `ALTER TABLE IF EXISTS creators ADD COLUMN IF NOT EXISTS terms_signed_at TIMESTAMP;`
  );
  await safeQuery(
    "creators.waiver_signed_at column",
    `ALTER TABLE IF EXISTS creators ADD COLUMN IF NOT EXISTS waiver_signed_at TIMESTAMP;`
  );
  await safeQuery(
    "creators.terms_version column",
    `ALTER TABLE IF EXISTS creators ADD COLUMN IF NOT EXISTS terms_version TEXT;`
  );
  await safeQuery(
    "creators.ip_address column",
    `ALTER TABLE IF EXISTS creators ADD COLUMN IF NOT EXISTS ip_address TEXT;`
  );
  await safeQuery(
    "creators.approved_at column",
    `ALTER TABLE IF EXISTS creators ADD COLUMN IF NOT EXISTS approved_at TIMESTAMP;`
  );
  await safeQuery(
    "creators.approved_by_admin column",
    `ALTER TABLE IF EXISTS creators ADD COLUMN IF NOT EXISTS approved_by_admin INTEGER REFERENCES users(id);`
  );

  // Data integrity constraints
  await safeQuery(
    "users.email unique constraint",
    `ALTER TABLE users ADD CONSTRAINT users_email_unique UNIQUE (email);`
  );
  await safeQuery(
    "creators.email unique constraint",
    `ALTER TABLE creators ADD CONSTRAINT creators_email_unique UNIQUE (email);`
  );
}



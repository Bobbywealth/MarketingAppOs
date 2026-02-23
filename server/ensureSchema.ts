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
  // Tasks: recurrence instance tracking (robust de-dupe for recurring tasks)
  await safeQuery(
    "tasks.recurrence_series_id column",
    `ALTER TABLE IF EXISTS tasks ADD COLUMN IF NOT EXISTS recurrence_series_id VARCHAR;`
  );
  await safeQuery(
    "tasks.recurrence_instance_date column",
    `ALTER TABLE IF EXISTS tasks ADD COLUMN IF NOT EXISTS recurrence_instance_date VARCHAR(10);`
  );
  await safeQuery(
    "uq_tasks_recurrence_series_instance index",
    `CREATE UNIQUE INDEX IF NOT EXISTS uq_tasks_recurrence_series_instance ON tasks(recurrence_series_id, recurrence_instance_date);`
  );
  await safeQuery(
    "idx_tasks_recurrence_series_id index",
    `CREATE INDEX IF NOT EXISTS idx_tasks_recurrence_series_id ON tasks(recurrence_series_id);`
  );
  // Tasks: is_recurring column
  await safeQuery(
    "tasks.is_recurring column",
    `ALTER TABLE IF EXISTS tasks ADD COLUMN IF NOT EXISTS is_recurring BOOLEAN DEFAULT FALSE;`
  );
  // Tasks: task_progress column
  await safeQuery(
    "tasks.task_progress column",
    `ALTER TABLE IF EXISTS tasks ADD COLUMN IF NOT EXISTS task_progress INTEGER DEFAULT 0;`
  );

  // Tasks: timeline/dependency columns used by task and dashboard queries
  await safeQuery(
    "tasks.start_date column",
    `ALTER TABLE IF EXISTS tasks ADD COLUMN IF NOT EXISTS start_date TIMESTAMP;`
  );
  await safeQuery(
    "tasks.blocks_completion column",
    `ALTER TABLE IF EXISTS tasks ADD COLUMN IF NOT EXISTS blocks_completion BOOLEAN DEFAULT FALSE;`
  );

  // Tasks: estimated_hours column
  await safeQuery(
    "tasks.estimated_hours column",
    `ALTER TABLE IF EXISTS tasks ADD COLUMN IF NOT EXISTS estimated_hours INTEGER DEFAULT 0;`
  );

  // Emails: recipient_type column
  await safeQuery(
    "emails.recipient_type column",
    `ALTER TABLE IF EXISTS emails ADD COLUMN IF NOT EXISTS recipient_type VARCHAR DEFAULT 'primary';`
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

  // Calendar events: is_recurring column
  await safeQuery(
    "calendar_events.is_recurring column",
    `ALTER TABLE IF EXISTS calendar_events ADD COLUMN IF NOT EXISTS is_recurring BOOLEAN DEFAULT FALSE;`
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
      application_status VARCHAR DEFAULT 'pending',
      payout_method TEXT DEFAULT 'manual',
      payout_status VARCHAR(50) DEFAULT 'pending',
      payout_details JSONB DEFAULT '{}'::jsonb,
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
    "creators.payout_method column",
    `ALTER TABLE IF EXISTS creators ADD COLUMN IF NOT EXISTS payout_method TEXT DEFAULT 'manual';`
  );
  await safeQuery(
    "creators.payout_status column",
    `ALTER TABLE IF EXISTS creators ADD COLUMN IF NOT EXISTS payout_status VARCHAR(50) DEFAULT 'pending';`
  );
  await safeQuery(
    "creators.payout_details column",
    `ALTER TABLE IF EXISTS creators ADD COLUMN IF NOT EXISTS payout_details JSONB DEFAULT '{}'::jsonb;`
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

  // Public website contact submissions (for SMS opt-in proof + audit trail)
  await safeQuery(
    "contact_submissions table",
    `
    CREATE TABLE IF NOT EXISTS contact_submissions (
      id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid()::text,
      name TEXT,
      email TEXT,
      phone TEXT,
      company TEXT,
      message TEXT,
      sms_opt_in BOOLEAN NOT NULL DEFAULT FALSE,
      ip VARCHAR,
      user_agent TEXT,
      created_at TIMESTAMP DEFAULT NOW()
    );
    `
  );
  await safeQuery(
    "idx_contact_submissions_created_at",
    `CREATE INDEX IF NOT EXISTS idx_contact_submissions_created_at ON contact_submissions(created_at);`
  );
  await safeQuery(
    "idx_contact_submissions_email",
    `CREATE INDEX IF NOT EXISTS idx_contact_submissions_email ON contact_submissions(email);`
  );

  // Blog Posts table (CMS for public website)
  await safeQuery(
    "blog_posts table",
    `
    CREATE TABLE IF NOT EXISTS blog_posts (
      id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid()::text,
      slug TEXT NOT NULL,
      title TEXT NOT NULL,
      excerpt TEXT,
      content TEXT NOT NULL,
      author TEXT,
      category TEXT,
      tags TEXT[],
      read_time TEXT,
      featured BOOLEAN DEFAULT FALSE,
      image_url TEXT,
      status TEXT NOT NULL DEFAULT 'draft',
      published_at TIMESTAMP,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    );
    `
  );
  await safeQuery("uq_blog_posts_slug", `CREATE UNIQUE INDEX IF NOT EXISTS uq_blog_posts_slug ON blog_posts(slug);`);
  await safeQuery("idx_blog_posts_status", `CREATE INDEX IF NOT EXISTS idx_blog_posts_status ON blog_posts(status);`);
  await safeQuery("idx_blog_posts_published_at", `CREATE INDEX IF NOT EXISTS idx_blog_posts_published_at ON blog_posts(published_at);`);

  // Lead Automations table (Required for abandoned cart reminders and workflow engine)
  await safeQuery(
    "lead_automations table",
    `
    CREATE TABLE IF NOT EXISTS lead_automations (
      id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid()::text,
      lead_id VARCHAR NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
      type VARCHAR NOT NULL,
      trigger VARCHAR NOT NULL,
      trigger_conditions JSONB,
      action_type VARCHAR NOT NULL,
      action_data JSONB,
      status VARCHAR NOT NULL DEFAULT 'pending',
      scheduled_for TIMESTAMP,
      executed_at TIMESTAMP,
      created_at TIMESTAMP DEFAULT NOW()
    );
    `
  );
  await safeQuery(
    "idx_lead_automations_lead_id",
    `CREATE INDEX IF NOT EXISTS idx_lead_automations_lead_id ON lead_automations(lead_id);`
  );
  await safeQuery(
    "idx_lead_automations_status",
    `CREATE INDEX IF NOT EXISTS idx_lead_automations_status ON lead_automations(status);`
  );
  await safeQuery(
    "idx_lead_automations_scheduled_for",
    `CREATE INDEX IF NOT EXISTS idx_lead_automations_scheduled_for ON lead_automations(scheduled_for);`
  );

  // Ensure columns exist in case table was created partially (Fix for "column lead_id does not exist")
  await safeQuery("lead_automations.lead_id column", `ALTER TABLE IF EXISTS lead_automations ADD COLUMN IF NOT EXISTS lead_id VARCHAR NOT NULL REFERENCES leads(id) ON DELETE CASCADE;`);
  await safeQuery("lead_automations.type column", `ALTER TABLE IF EXISTS lead_automations ADD COLUMN IF NOT EXISTS type VARCHAR NOT NULL;`);
  await safeQuery("lead_automations.trigger column", `ALTER TABLE IF EXISTS lead_automations ADD COLUMN IF NOT EXISTS trigger VARCHAR NOT NULL;`);
  await safeQuery("lead_automations.trigger_conditions column", `ALTER TABLE IF EXISTS lead_automations ADD COLUMN IF NOT EXISTS trigger_conditions JSONB;`);
  await safeQuery("lead_automations.action_type column", `ALTER TABLE IF EXISTS lead_automations ADD COLUMN IF NOT EXISTS action_type VARCHAR NOT NULL;`);
  await safeQuery("lead_automations.action_data column", `ALTER TABLE IF EXISTS lead_automations ADD COLUMN IF NOT EXISTS action_data JSONB;`);
  await safeQuery("lead_automations.status column", `ALTER TABLE IF EXISTS lead_automations ADD COLUMN IF NOT EXISTS status VARCHAR NOT NULL DEFAULT 'pending';`);
  await safeQuery("lead_automations.scheduled_for column", `ALTER TABLE IF EXISTS lead_automations ADD COLUMN IF NOT EXISTS scheduled_for TIMESTAMP;`);
  await safeQuery("lead_automations.executed_at column", `ALTER TABLE IF EXISTS lead_automations ADD COLUMN IF NOT EXISTS executed_at TIMESTAMP;`);
  await safeQuery("lead_automations.created_at column", `ALTER TABLE IF EXISTS lead_automations ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT NOW();`);
  await safeQuery("lead_automations.is_active column", `ALTER TABLE IF EXISTS lead_automations ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT true;`);
  await safeQuery("lead_automations.next_run_at column", `ALTER TABLE IF EXISTS lead_automations ADD COLUMN IF NOT EXISTS next_run_at TIMESTAMP;`);
  await safeQuery("idx_lead_automations_next_run_at", `CREATE INDEX IF NOT EXISTS idx_lead_automations_next_run_at ON lead_automations(next_run_at);`);

  // Marketing Series tables
  await safeQuery("marketing_series table", `
    CREATE TABLE IF NOT EXISTS marketing_series (
      id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
      name VARCHAR NOT NULL,
      description TEXT,
      channel VARCHAR NOT NULL,
      is_active BOOLEAN DEFAULT true,
      created_by INTEGER NOT NULL REFERENCES users(id),
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    );
  `);

  await safeQuery("marketing_series_steps table", `
    CREATE TABLE IF NOT EXISTS marketing_series_steps (
      id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
      series_id VARCHAR NOT NULL REFERENCES marketing_series(id) ON DELETE CASCADE,
      step_order INTEGER NOT NULL,
      delay_days INTEGER DEFAULT 0,
      delay_hours INTEGER DEFAULT 0,
      subject VARCHAR,
      content TEXT NOT NULL,
      media_urls TEXT[],
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    );
  `);

  await safeQuery("marketing_series_enrollments table", `
    CREATE TABLE IF NOT EXISTS marketing_series_enrollments (
      id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
      series_id VARCHAR NOT NULL REFERENCES marketing_series(id) ON DELETE CASCADE,
      lead_id VARCHAR REFERENCES leads(id) ON DELETE CASCADE,
      client_id VARCHAR REFERENCES clients(id) ON DELETE CASCADE,
      current_step INTEGER DEFAULT 0,
      status VARCHAR NOT NULL DEFAULT 'active',
      last_step_sent_at TIMESTAMP,
      next_step_due_at TIMESTAMP,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    );
    CREATE INDEX IF NOT EXISTS idx_series_enrollments_series ON marketing_series_enrollments(series_id);
    CREATE INDEX IF NOT EXISTS idx_series_enrollments_lead ON marketing_series_enrollments(lead_id);
    CREATE INDEX IF NOT EXISTS idx_series_enrollments_client ON marketing_series_enrollments(client_id);
    CREATE INDEX IF NOT EXISTS idx_series_enrollments_status ON marketing_series_enrollments(status);
    CREATE INDEX IF NOT EXISTS idx_series_enrollments_due ON marketing_series_enrollments(next_step_due_at);
  `);

  // Marketing: provider_call_id for AI Voice calls
  await safeQuery(
    "marketing_broadcast_recipients.provider_call_id column",
    `ALTER TABLE IF EXISTS marketing_broadcast_recipients ADD COLUMN IF NOT EXISTS provider_call_id VARCHAR;`
  );

  // Marketing Series: Fix column names and add missing columns
  await safeQuery(
    "marketing_series.channel column",
    `ALTER TABLE IF EXISTS marketing_series ADD COLUMN IF NOT EXISTS channel VARCHAR;`
  );
  await safeQuery(
    "marketing_series.channel backfill",
    `UPDATE marketing_series SET channel = 'email' WHERE channel IS NULL;`
  );
  await safeQuery(
    "marketing_series.channel default",
    `ALTER TABLE IF EXISTS marketing_series ALTER COLUMN channel SET DEFAULT 'email';`
  );
  await safeQuery(
    "marketing_series.channel not null",
    `ALTER TABLE IF EXISTS marketing_series ALTER COLUMN channel SET NOT NULL;`
  );
  await safeQuery(
    "marketing_series.updated_at column",
    `ALTER TABLE IF EXISTS marketing_series ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW();`
  );
  await safeQuery(
    "marketing_series_enrollments.recipient_id column",
    `ALTER TABLE IF EXISTS marketing_series_enrollments ADD COLUMN IF NOT EXISTS recipient_id VARCHAR(255);`
  );
  await safeQuery(
    "marketing_series_enrollments.recipient_id backfill",
    `UPDATE marketing_series_enrollments SET recipient_id = COALESCE(lead_id, client_id) WHERE recipient_id IS NULL;`
  );
  await safeQuery(
    "marketing_series_enrollments.recipient_id not null",
    `ALTER TABLE IF EXISTS marketing_series_enrollments ALTER COLUMN recipient_id SET NOT NULL;`
  );
  await safeQuery(
    "idx_series_enrollments_recipient",
    `CREATE INDEX IF NOT EXISTS idx_series_enrollments_recipient ON marketing_series_enrollments(recipient_id);`
  );
  await safeQuery(
    "marketing_series_enrollments.recipient_type column",
    `ALTER TABLE IF EXISTS marketing_series_enrollments ADD COLUMN IF NOT EXISTS recipient_type VARCHAR NOT NULL DEFAULT 'lead';`
  );
  await safeQuery(
    "marketing_series_enrollments.next_step_at column",
    `ALTER TABLE IF EXISTS marketing_series_enrollments ADD COLUMN IF NOT EXISTS next_step_at TIMESTAMP;`
  );
  await safeQuery(
    "marketing_series_enrollments.completed_at column",
    `ALTER TABLE IF EXISTS marketing_series_enrollments ADD COLUMN IF NOT EXISTS completed_at TIMESTAMP;`
  );
  await safeQuery(
    "marketing_series_enrollments.last_step_sent_at column",
    `ALTER TABLE IF EXISTS marketing_series_enrollments ADD COLUMN IF NOT EXISTS last_step_sent_at TIMESTAMP;`
  );

  // Marketing series steps: subject and delay_days columns
  await safeQuery(
    "marketing_series_steps.subject column",
    `ALTER TABLE IF EXISTS marketing_series_steps ADD COLUMN IF NOT EXISTS subject VARCHAR;`
  );
  await safeQuery(
    "marketing_series_steps.delay_days column",
    `ALTER TABLE IF EXISTS marketing_series_steps ADD COLUMN IF NOT EXISTS delay_days INTEGER DEFAULT 0;`
  );


  // API keys table (hashed-at-rest keys for programmatic access)
  await safeQuery(
    "api_keys table",
    `
    CREATE TABLE IF NOT EXISTS api_keys (
      id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      name VARCHAR NOT NULL,
      key_prefix VARCHAR(24) NOT NULL UNIQUE,
      key_hash TEXT NOT NULL UNIQUE,
      scopes TEXT[] NOT NULL DEFAULT ARRAY['api:full']::text[],
      expires_at TIMESTAMP,
      last_used_at TIMESTAMP,
      revoked_at TIMESTAMP,
      created_at TIMESTAMP DEFAULT NOW()
    );
    `
  );
  await safeQuery(
    "idx_api_keys_user_id",
    `CREATE INDEX IF NOT EXISTS idx_api_keys_user_id ON api_keys(user_id);`
  );
  await safeQuery(
    "idx_api_keys_revoked_at",
    `CREATE INDEX IF NOT EXISTS idx_api_keys_revoked_at ON api_keys(revoked_at);`
  );
  await safeQuery(
    "idx_api_keys_expires_at",
    `CREATE INDEX IF NOT EXISTS idx_api_keys_expires_at ON api_keys(expires_at);`
  );
  // Session storage table (Critical for persistent logins)
  await safeQuery(
    "sessions table",
    `
    CREATE TABLE IF NOT EXISTS sessions (
      sid varchar NOT NULL COLLATE "default",
      sess jsonb NOT NULL,
      expire timestamp(6) NOT NULL
    ) WITH (OIDS=FALSE);
    
    DO $$ 
    BEGIN 
      IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'sessions_pkey') THEN
        ALTER TABLE sessions ADD CONSTRAINT sessions_pkey PRIMARY KEY (sid) NOT DEFERRABLE INITIALLY IMMEDIATE;
      END IF;
    END $$;

    CREATE INDEX IF NOT EXISTS "IDX_session_expire" ON sessions ("expire");
    `
  );

  // Client Documents table (for client file uploads)
  await safeQuery("client_documents table", `
    CREATE TABLE IF NOT EXISTS client_documents (
      id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
      client_id VARCHAR NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
      name VARCHAR NOT NULL,
      description TEXT,
      object_path VARCHAR NOT NULL,
      file_type VARCHAR,
      file_size INTEGER,
      uploaded_by INTEGER REFERENCES users(id),
      created_at TIMESTAMP DEFAULT NOW()
    );
  `);
  
  await safeQuery(
    "idx_client_documents_client",
    `CREATE INDEX IF NOT EXISTS idx_client_documents_client ON client_documents(client_id);`
  );
  await safeQuery(
    "idx_client_documents_type", 
    `CREATE INDEX IF NOT EXISTS idx_client_documents_type ON client_documents(file_type);`
  );
  await safeQuery(
    "idx_client_documents_created",
    `CREATE INDEX IF NOT EXISTS idx_client_documents_created ON client_documents(created_at);`
  );

  // Diagnostic: Check if table is actually accessible
  try {
    const res = await pool.query(`SELECT COUNT(*) FROM blog_posts;`);
    console.log(`✅ blog_posts table is accessible, current count: ${res.rows[0].count}`);
  } catch (e: any) {
    console.error(`❌ blog_posts table diagnostic failed: ${e.message}`);
  }

  // Scheduled AI Commands table (AI Business Manager)
  await safeQuery(
    "scheduled_ai_commands table",
    `
    CREATE TABLE IF NOT EXISTS scheduled_ai_commands (
      id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id INTEGER NOT NULL REFERENCES users(id),
      command TEXT NOT NULL,
      status VARCHAR NOT NULL DEFAULT 'pending',
      scheduled_at TIMESTAMP NOT NULL,
      last_run_at TIMESTAMP,
      next_run_at TIMESTAMP,
      is_recurring BOOLEAN DEFAULT false,
      recurring_pattern VARCHAR,
      recurring_interval INTEGER DEFAULT 1,
      recurring_end_date TIMESTAMP,
      last_response TEXT,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    );
    `
  );
  await safeQuery(
    "idx_scheduled_ai_commands_user_id",
    `CREATE INDEX IF NOT EXISTS idx_scheduled_ai_commands_user_id ON scheduled_ai_commands(user_id);`
  );
  await safeQuery(
    "idx_scheduled_ai_commands_status",
    `CREATE INDEX IF NOT EXISTS idx_scheduled_ai_commands_status ON scheduled_ai_commands(status);`
  );
  await safeQuery(
    "idx_scheduled_ai_commands_next_run_at",
    `CREATE INDEX IF NOT EXISTS idx_scheduled_ai_commands_next_run_at ON scheduled_ai_commands(next_run_at);`
  );
}

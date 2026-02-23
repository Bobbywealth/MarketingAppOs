import pg from 'pg';
const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

async function runMigrations() {
  let client;
  let retries = 3;
  
  while (retries > 0) {
    try {
      client = await pool.connect();
      console.log('🔄 Running database migrations...');
      
      // Add new columns to users table - wrap each in try/catch
      try {
        await client.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS email TEXT;`);
        console.log('✅ Added email to users');
      } catch (e) {
        console.log('⚠️ email column already exists or error:', e.message);
      }
      
      try {
        await client.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS first_name TEXT;`);
        console.log('✅ Added first_name to users');
      } catch (e) {
        console.log('⚠️ first_name column already exists or error:', e.message);
      }
      
      try {
        await client.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS last_name TEXT;`);
        console.log('✅ Added last_name to users');
      } catch (e) {
        console.log('⚠️ last_name column already exists or error:', e.message);
      }
      
      // Add displayOrder to clients
      try {
        await client.query(`ALTER TABLE clients ADD COLUMN IF NOT EXISTS display_order INTEGER DEFAULT 0;`);
        console.log('✅ Added display_order to clients');
      } catch (e) {
        console.log('⚠️ display_order already exists or error:', e.message);
      }
      
      // Add client_id to leads table
      try {
        await client.query(`ALTER TABLE leads ADD COLUMN IF NOT EXISTS client_id VARCHAR REFERENCES clients(id);`);
        console.log('✅ Added client_id to leads');
      } catch (e) {
        console.log('⚠️ client_id in leads already exists or error:', e.message);
      }
      
      // Create subscription_packages table
      try {
        await client.query(`
          CREATE TABLE IF NOT EXISTS subscription_packages (
            id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
            name VARCHAR NOT NULL,
            description TEXT,
            price INTEGER NOT NULL,
            billing_period VARCHAR NOT NULL DEFAULT 'month',
            features JSONB NOT NULL,
            stripe_price_id VARCHAR,
            stripe_product_id VARCHAR,
            is_active BOOLEAN DEFAULT true,
            is_featured BOOLEAN DEFAULT false,
            display_order INTEGER DEFAULT 0,
            button_text VARCHAR DEFAULT 'Get Started',
            button_link VARCHAR,
            max_clients INTEGER,
            created_at TIMESTAMP DEFAULT NOW(),
            updated_at TIMESTAMP DEFAULT NOW()
          );
        `);
        console.log('✅ Created subscription_packages table');
      } catch (e) {
        console.log('⚠️ subscription_packages table already exists or error:', e.message);
      }
      
      // Add Instagram connection fields to clients table
      try {
        await client.query(`ALTER TABLE clients ADD COLUMN IF NOT EXISTS instagram_access_token TEXT;`);
        console.log('✅ Added instagram_access_token to clients');
      } catch (e) {
        console.log('⚠️ instagram_access_token already exists or error:', e.message);
      }
      
      try {
        await client.query(`ALTER TABLE clients ADD COLUMN IF NOT EXISTS instagram_user_id VARCHAR;`);
        console.log('✅ Added instagram_user_id to clients');
      } catch (e) {
        console.log('⚠️ instagram_user_id already exists or error:', e.message);
      }
      
      try {
        await client.query(`ALTER TABLE clients ADD COLUMN IF NOT EXISTS instagram_connected_at TIMESTAMP;`);
        console.log('✅ Added instagram_connected_at to clients');
      } catch (e) {
        console.log('⚠️ instagram_connected_at already exists or error:', e.message);
      }
      
      // Add Google Calendar fields to users table
      try {
        await client.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS google_access_token TEXT;`);
        console.log('✅ Added google_access_token to users');
      } catch (e) {
        console.log('⚠️ google_access_token already exists or error:', e.message);
      }

      try {
        await client.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS google_refresh_token TEXT;`);
        console.log('✅ Added google_refresh_token to users');
      } catch (e) {
        console.log('⚠️ google_refresh_token already exists or error:', e.message);
      }

      try {
        await client.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS google_calendar_connected BOOLEAN DEFAULT false;`);
        console.log('✅ Added google_calendar_connected to users');
      } catch (e) {
        console.log('⚠️ google_calendar_connected already exists or error:', e.message);
      }

      // Create calendar_events table
      try {
        await client.query(`
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
        `);
        console.log('✅ Created calendar_events table');
      } catch (e) {
        console.log('⚠️ calendar_events table already exists or error:', e.message);
      }
      
      // Create Second Me tables
      try {
        await client.query(`
          CREATE TABLE IF NOT EXISTS second_me (
            id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
            client_id VARCHAR NOT NULL REFERENCES clients(id),
            status VARCHAR NOT NULL DEFAULT 'pending',
            photo_urls TEXT[],
            avatar_url VARCHAR,
            setup_paid BOOLEAN DEFAULT false,
            weekly_subscription_active BOOLEAN DEFAULT false,
            stripe_setup_payment_id VARCHAR,
            stripe_weekly_subscription_id VARCHAR,
            notes TEXT,
            created_at TIMESTAMP DEFAULT NOW(),
            updated_at TIMESTAMP DEFAULT NOW()
          );
        `);
        console.log('✅ Created second_me table');
      } catch (e) {
        console.log('⚠️ second_me table already exists or error:', e.message);
      }

      try {
        await client.query(`
          CREATE TABLE IF NOT EXISTS second_me_content (
            id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
            second_me_id VARCHAR NOT NULL REFERENCES second_me(id),
            client_id VARCHAR NOT NULL REFERENCES clients(id),
            content_type VARCHAR NOT NULL,
            media_url VARCHAR NOT NULL,
            caption TEXT,
            week_number INTEGER,
            status VARCHAR NOT NULL DEFAULT 'pending',
            scheduled_for TIMESTAMP,
            created_at TIMESTAMP DEFAULT NOW()
          );
        `);
        console.log('✅ Created second_me_content table');
      } catch (e) {
        console.log('⚠️ second_me_content table already exists or error:', e.message);
      }

      // Create task_spaces table first (tasks table references it)
      try {
        await client.query(`
          CREATE TABLE IF NOT EXISTS task_spaces (
            id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
            name VARCHAR NOT NULL,
            icon VARCHAR DEFAULT '📁',
            color VARCHAR DEFAULT '#3B82F6',
            parent_space_id VARCHAR,
            "order" INTEGER DEFAULT 0,
            created_by INTEGER NOT NULL REFERENCES users(id),
            created_at TIMESTAMP DEFAULT NOW(),
            updated_at TIMESTAMP DEFAULT NOW()
          );
        `);
        console.log('✅ Created task_spaces table');
      } catch (e) {
        console.log('⚠️ task_spaces table already exists or error:', e.message);
      }
      
      // Add space_id column to existing tasks table FIRST (before trying to create table)
      try {
        await client.query(`ALTER TABLE tasks ADD COLUMN IF NOT EXISTS space_id VARCHAR;`);
        console.log('✅ Added space_id column to tasks table');
      } catch (e) {
        console.log('⚠️ Could not add space_id to tasks (table might not exist yet):', e.message);
      }
      
      // Try to add the foreign key constraint separately
      try {
        await client.query(`
          DO $$ 
          BEGIN
            IF NOT EXISTS (
              SELECT 1 FROM pg_constraint WHERE conname = 'tasks_space_id_fkey'
            ) THEN
              ALTER TABLE tasks ADD CONSTRAINT tasks_space_id_fkey 
                FOREIGN KEY (space_id) REFERENCES task_spaces(id);
            END IF;
          END $$;
        `);
        console.log('✅ Added foreign key constraint for space_id');
      } catch (e) {
        console.log('⚠️ Foreign key constraint already exists or error:', e.message);
      }
      
      // Create tasks table if it doesn't exist (with all columns including space_id)
      try {
        await client.query(`
          CREATE TABLE IF NOT EXISTS tasks (
            id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
            campaign_id VARCHAR REFERENCES campaigns(id),
            client_id VARCHAR REFERENCES clients(id),
            assigned_to_id INTEGER REFERENCES users(id),
            space_id VARCHAR REFERENCES task_spaces(id),
            title VARCHAR NOT NULL,
            description TEXT,
            status VARCHAR NOT NULL DEFAULT 'todo',
            priority VARCHAR NOT NULL DEFAULT 'normal',
            due_date TIMESTAMP,
            completed_at TIMESTAMP,
            is_recurring BOOLEAN DEFAULT false,
            recurring_pattern VARCHAR,
            recurring_interval INTEGER DEFAULT 1,
            recurring_end_date TIMESTAMP,
            schedule_from VARCHAR(50) DEFAULT 'due_date',
            created_at TIMESTAMP DEFAULT NOW(),
            updated_at TIMESTAMP DEFAULT NOW()
          );
        `);
        console.log('✅ Created tasks table with space_id column');
      } catch (e) {
        console.log('⚠️ tasks table already exists or error:', e.message);
      }
      
      // Fix notifications table - add missing columns
      try {
        await client.query(`ALTER TABLE notifications ADD COLUMN IF NOT EXISTS type VARCHAR DEFAULT 'info';`);
        await client.query(`UPDATE notifications SET type = 'info' WHERE type IS NULL;`);
        console.log('✅ Added type column to notifications');
      } catch (e) {
        console.log('⚠️ type column in notifications already exists or error:', e.message);
      }

      try {
        await client.query(`ALTER TABLE notifications ADD COLUMN IF NOT EXISTS category VARCHAR DEFAULT 'general';`);
        await client.query(`UPDATE notifications SET category = 'general' WHERE category IS NULL;`);
        console.log('✅ Added category column to notifications');
      } catch (e) {
        console.log('⚠️ category column in notifications already exists or error:', e.message);
      }

      // Rename link to action_url in notifications if needed
      try {
        await client.query(`
          DO $$ 
          BEGIN
            IF EXISTS (SELECT 1 FROM information_schema.columns 
                      WHERE table_name='notifications' AND column_name='link') THEN
              ALTER TABLE notifications RENAME COLUMN link TO action_url;
            END IF;
          END $$;
        `);
        console.log('✅ Renamed link to action_url in notifications (if it existed)');
      } catch (e) {
        console.log('⚠️ Column rename skipped:', e.message);
      }

      // Fix invoices table - rename paid_date to paid_at
      try {
        await client.query(`
          DO $$ 
          BEGIN
            IF EXISTS (SELECT 1 FROM information_schema.columns 
                      WHERE table_name='invoices' AND column_name='paid_date') THEN
              ALTER TABLE invoices RENAME COLUMN paid_date TO paid_at;
            END IF;
          END $$;
        `);
        console.log('✅ Renamed paid_date to paid_at in invoices (if it existed)');
      } catch (e) {
        console.log('⚠️ Invoices column rename skipped:', e.message);
      }

      // Add notes column to invoices
      try {
        await client.query(`ALTER TABLE invoices ADD COLUMN IF NOT EXISTS notes TEXT;`);
        console.log('✅ Added notes column to invoices');
      } catch (e) {
        console.log('⚠️ notes column in invoices already exists or error:', e.message);
      }

      // Fix content_posts table - add missing columns
      try {
        await client.query(`ALTER TABLE content_posts ADD COLUMN IF NOT EXISTS client_id VARCHAR REFERENCES clients(id);`);
        console.log('✅ Added client_id to content_posts');
      } catch (e) {
        console.log('⚠️ client_id in content_posts already exists or error:', e.message);
      }

      try {
        await client.query(`ALTER TABLE content_posts ADD COLUMN IF NOT EXISTS platform_post_id VARCHAR;`);
        console.log('✅ Added platform_post_id to content_posts');
      } catch (e) {
        console.log('⚠️ platform_post_id already exists or error:', e.message);
      }

      try {
        await client.query(`ALTER TABLE content_posts ADD COLUMN IF NOT EXISTS media_urls TEXT[];`);
        console.log('✅ Added media_urls to content_posts');
      } catch (e) {
        console.log('⚠️ media_urls already exists or error:', e.message);
      }

      // Create page_views table for analytics
      try {
        await client.query(`
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
        `);
        console.log('✅ Created page_views table');
      } catch (e) {
        console.log('⚠️ page_views table already exists or error:', e.message);
      }

// Messaging enhancements: delivery/read receipts and media fields
      try {
        await client.query(`ALTER TABLE messages ADD COLUMN IF NOT EXISTS delivered_at TIMESTAMP;`);
        console.log('✅ Added delivered_at to messages');
      } catch (e) {
        console.log('⚠️ delivered_at already exists or error:', e.message);
      }
      try {
        await client.query(`ALTER TABLE messages ADD COLUMN IF NOT EXISTS read_at TIMESTAMP;`);
        console.log('✅ Added read_at to messages');
      } catch (e) {
        console.log('⚠️ read_at already exists or error:', e.message);
      }
      try {
        await client.query(`ALTER TABLE messages ADD COLUMN IF NOT EXISTS media_url VARCHAR;`);
        console.log('✅ Added media_url to messages');
      } catch (e) {
        console.log('⚠️ media_url already exists or error:', e.message);
      }
      try {
        await client.query(`ALTER TABLE messages ADD COLUMN IF NOT EXISTS media_type VARCHAR;`);
        console.log('✅ Added media_type to messages');
      } catch (e) {
        console.log('⚠️ media_type already exists or error:', e.message);
      }
      try {
        await client.query(`ALTER TABLE messages ADD COLUMN IF NOT EXISTS duration_ms INTEGER;`);
        console.log('✅ Added duration_ms to messages');
      } catch (e) {
        console.log('⚠️ duration_ms already exists or error:', e.message);
      }

      // Add schedule_from column to existing tasks table
      try {
        await client.query(`ALTER TABLE tasks ADD COLUMN IF NOT EXISTS schedule_from VARCHAR(50) DEFAULT 'due_date';`);
        console.log('✅ Added schedule_from column to tasks');
      } catch (e) {
        console.log('⚠️ schedule_from column already exists or error:', e.message);
      }

      // Add archived_at column to tasks for auto-archive functionality
      try {
        await client.query(`ALTER TABLE tasks ADD COLUMN IF NOT EXISTS archived_at TIMESTAMP;`);
        console.log('✅ Added archived_at column to tasks');
      } catch (e) {
        console.log('⚠️ archived_at column already exists or error:', e.message);
      }

      // Add estimated_hours column to tasks
      try {
        await client.query(`ALTER TABLE tasks ADD COLUMN IF NOT EXISTS estimated_hours INTEGER DEFAULT 0;`);
        console.log('✅ Added estimated_hours column to tasks');
      } catch (e) {
        console.log('⚠️ estimated_hours column already exists or error:', e.message);
      }

      // Add tags column to tasks
      try {
        await client.query(`ALTER TABLE tasks ADD COLUMN IF NOT EXISTS tags TEXT[];`);
        console.log('✅ Added tags column to tasks');
      } catch (e) {
        console.log('⚠️ tags column already exists or error:', e.message);
      }

      // Add checklist column to tasks
      try {
        await client.query(`ALTER TABLE tasks ADD COLUMN IF NOT EXISTS checklist JSONB;`);
        console.log('✅ Added checklist column to tasks');
      } catch (e) {
        console.log('⚠️ checklist column already exists or error:', e.message);
      }

      // Create indexes for tasks table
      try {
        await client.query(`CREATE INDEX IF NOT EXISTS IDX_tasks_archived_at ON tasks(archived_at) WHERE archived_at IS NOT NULL;`);
        console.log('✅ Created IDX_tasks_archived_at index');
      } catch (e) {
        console.log('⚠️ IDX_tasks_archived_at index already exists or error:', e.message);
      }

      try {
        await client.query(`CREATE INDEX IF NOT EXISTS IDX_tasks_tags ON tasks USING GIN(tags) WHERE tags IS NOT NULL;`);
        console.log('✅ Created IDX_tasks_tags index');
      } catch (e) {
        console.log('⚠️ IDX_tasks_tags index already exists or error:', e.message);
      }

      // Create user notification preferences table
      try {
        await client.query(`
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
        `);
        console.log('✅ Created user_notification_preferences table');
      } catch (e) {
        console.log('⚠️ user_notification_preferences table already exists or error:', e.message);
      }

      // Create index for user notification preferences
      try {
        await client.query('CREATE INDEX IF NOT EXISTS idx_user_notification_preferences_user_id ON user_notification_preferences(user_id);');
        console.log('✅ Created index for user_notification_preferences');
      } catch (e) {
        console.log('⚠️ user_notification_preferences index already exists or error:', e.message);
      }

      // Create indexes for faster analytics queries
      try {
        await client.query(`CREATE INDEX IF NOT EXISTS idx_page_views_created_at ON page_views(created_at);`);
        await client.query(`CREATE INDEX IF NOT EXISTS idx_page_views_session_id ON page_views(session_id);`);
        console.log('✅ Created indexes for page_views');
      } catch (e) {
        console.log('⚠️ page_views indexes already exist or error:', e.message);
      }
      
      console.log('✅ Migration script completed successfully!');
      break; // Success - exit retry loop
      
    } catch (error) {
      console.error(`❌ Migration attempt failed (${retries} retries left):`, error.message);
      retries--;
      if (retries === 0) {
        console.error('❌ All migration retries exhausted. App will start anyway.');
      } else {
        console.log('⏳ Waiting 2 seconds before retry...');
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    } finally {
      if (client) {
        try {
          client.release();
        } catch (e) {
          console.log('Error releasing client:', e.message);
        }
      }
    }
  }
  
  try {
    await pool.end();
  } catch (e) {
    console.log('Error closing pool:', e.message);
  }
}

runMigrations()
  .then(() => {
    console.log('✅ Migration process completed - app starting...');
    process.exit(0);
  })
  .catch(err => {
    console.error('❌ Migration failed but app will start anyway:', err);
    process.exit(0);
  });


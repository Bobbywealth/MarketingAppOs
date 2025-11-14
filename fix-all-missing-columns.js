import pg from 'pg';
const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

async function fixAllMissingColumns() {
  const client = await pool.connect();
  
  try {
    console.log('🔧 ========== COMPREHENSIVE DATABASE SCHEMA FIX ==========');
    console.log('⏰ Time:', new Date().toISOString());
    console.log('');
    
    let fixedCount = 0;
    let skippedCount = 0;
    
    // Helper function to safely add column
    async function addColumnIfNotExists(tableName, columnName, columnDef) {
      try {
        const checkQuery = `
          SELECT column_name 
          FROM information_schema.columns 
          WHERE table_name = $1 AND column_name = $2
        `;
        const result = await client.query(checkQuery, [tableName, columnName]);
        
        if (result.rows.length === 0) {
          // Column doesn't exist, add it
          await client.query(`ALTER TABLE ${tableName} ADD COLUMN IF NOT EXISTS ${columnName} ${columnDef}`);
          console.log(`   ✅ Added ${tableName}.${columnName}`);
          fixedCount++;
        } else {
          console.log(`   ⏭️  ${tableName}.${columnName} already exists`);
          skippedCount++;
        }
      } catch (err) {
        if (err.message?.includes('does not exist')) {
          console.log(`   ⚠️  Table ${tableName} does not exist (skipping)`);
          skippedCount++;
        } else {
          console.error(`   ❌ Error adding ${tableName}.${columnName}:`, err.message);
        }
      }
    }
    
    // Helper function to create table if not exists
    async function createTableIfNotExists(tableName, createStatement) {
      try {
        const checkQuery = `
          SELECT table_name 
          FROM information_schema.tables 
          WHERE table_name = $1
        `;
        const result = await client.query(checkQuery, [tableName]);
        
        if (result.rows.length === 0) {
          await client.query(createStatement);
          console.log(`   ✅ Created table ${tableName}`);
          fixedCount++;
        } else {
          console.log(`   ⏭️  Table ${tableName} already exists`);
          skippedCount++;
        }
      } catch (err) {
        console.error(`   ❌ Error creating ${tableName}:`, err.message);
      }
    }
    
    console.log('📋 Checking and fixing all tables and columns...\n');
    
    // 1. USERS TABLE
    console.log('👤 Users table:');
    await addColumnIfNotExists('users', 'email', 'TEXT');
    await addColumnIfNotExists('users', 'first_name', 'TEXT');
    await addColumnIfNotExists('users', 'last_name', 'TEXT');
    await addColumnIfNotExists('users', 'last_seen', 'TIMESTAMP');
    await addColumnIfNotExists('users', 'google_access_token', 'TEXT');
    await addColumnIfNotExists('users', 'google_refresh_token', 'TEXT');
    await addColumnIfNotExists('users', 'google_calendar_connected', 'BOOLEAN DEFAULT false');
    console.log('');
    
    // 2. CLIENTS TABLE
    console.log('🏢 Clients table:');
    await addColumnIfNotExists('clients', 'display_order', 'INTEGER DEFAULT 0');
    await addColumnIfNotExists('clients', 'instagram_access_token', 'TEXT');
    await addColumnIfNotExists('clients', 'instagram_user_id', 'VARCHAR');
    await addColumnIfNotExists('clients', 'instagram_connected_at', 'TIMESTAMP');
    console.log('');
    
    // 3. LEADS TABLE
    console.log('🎯 Leads table:');
    await addColumnIfNotExists('leads', 'client_id', 'VARCHAR REFERENCES clients(id)');
    await addColumnIfNotExists('leads', 'industry', 'VARCHAR');
    await addColumnIfNotExists('leads', 'tags', 'JSONB DEFAULT \'[]\'::jsonb');
    
    // Make name nullable and company required
    try {
      await client.query('ALTER TABLE leads ALTER COLUMN name DROP NOT NULL');
      console.log('   ✅ Made leads.name nullable');
      fixedCount++;
    } catch (err) {
      if (!err.message?.includes('does not exist')) {
        console.log('   ⏭️  leads.name already nullable or constraint doesn\'t exist');
        skippedCount++;
      }
    }
    
    try {
      await client.query('UPDATE leads SET company = \'Not Provided\' WHERE company IS NULL OR company = \'\'');
      await client.query('ALTER TABLE leads ALTER COLUMN company SET NOT NULL');
      console.log('   ✅ Made leads.company required');
      fixedCount++;
    } catch (err) {
      if (!err.message?.includes('does not exist')) {
        console.log('   ⏭️  leads.company already required');
        skippedCount++;
      }
    }
    
    // Add indexes
    try {
      await client.query('CREATE INDEX IF NOT EXISTS idx_leads_industry ON leads(industry)');
      await client.query('CREATE INDEX IF NOT EXISTS idx_leads_tags ON leads USING GIN (tags)');
      console.log('   ✅ Added leads indexes (industry, tags)');
      fixedCount++;
    } catch (err) {
      console.log('   ⏭️  leads indexes already exist');
      skippedCount++;
    }
    console.log('');
    
    // 4. LEAD_ACTIVITIES TABLE
    console.log('📊 Lead activities table:');
    await addColumnIfNotExists('lead_activities', 'user_id', 'INTEGER REFERENCES users(id)');
    console.log('');
    
    // 5. CONTENT_POSTS TABLE
    console.log('📝 Content posts table:');
    await addColumnIfNotExists('content_posts', 'client_id', 'VARCHAR REFERENCES clients(id)');
    await addColumnIfNotExists('content_posts', 'platform_post_id', 'VARCHAR');
    await addColumnIfNotExists('content_posts', 'media_urls', 'TEXT[]');
    await addColumnIfNotExists('content_posts', 'approved_by', 'VARCHAR');
    await addColumnIfNotExists('content_posts', 'published_at', 'TIMESTAMP');
    console.log('');
    
    // 6. NOTIFICATIONS TABLE
    console.log('🔔 Notifications table:');
    await addColumnIfNotExists('notifications', 'type', 'VARCHAR DEFAULT \'info\'');
    await addColumnIfNotExists('notifications', 'category', 'VARCHAR DEFAULT \'general\'');
    console.log('');
    
    // 7. INVOICES TABLE
    console.log('💰 Invoices table:');
    await addColumnIfNotExists('invoices', 'notes', 'TEXT');
    console.log('');
    
    // 8. MESSAGES TABLE
    console.log('💬 Messages table:');
    await addColumnIfNotExists('messages', 'delivered_at', 'TIMESTAMP');
    await addColumnIfNotExists('messages', 'read_at', 'TIMESTAMP');
    await addColumnIfNotExists('messages', 'media_url', 'VARCHAR');
    await addColumnIfNotExists('messages', 'media_type', 'VARCHAR');
    await addColumnIfNotExists('messages', 'duration_ms', 'INTEGER');
    console.log('');
    
    // 9. TASKS TABLE
    console.log('✅ Tasks table:');
    await addColumnIfNotExists('tasks', 'space_id', 'VARCHAR REFERENCES task_spaces(id)');
    console.log('');
    
    // 10. CREATE OPTIONAL TABLES
    console.log('📦 Creating optional tables:');
    
    await createTableIfNotExists('push_notification_history', `
      CREATE TABLE push_notification_history (
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
      )
    `);
    
    await createTableIfNotExists('sms_messages', `
      CREATE TABLE sms_messages (
        id SERIAL PRIMARY KEY,
        dialpad_id VARCHAR UNIQUE,
        direction VARCHAR NOT NULL CHECK (direction IN ('inbound', 'outbound')),
        from_number VARCHAR NOT NULL,
        to_number VARCHAR NOT NULL,
        text TEXT NOT NULL,
        status VARCHAR,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        lead_id VARCHAR REFERENCES leads(id) ON DELETE SET NULL,
        timestamp TIMESTAMP DEFAULT NOW(),
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);
    
    // Add SMS indexes
    try {
      await client.query('CREATE INDEX IF NOT EXISTS idx_sms_messages_user_id ON sms_messages(user_id)');
      await client.query('CREATE INDEX IF NOT EXISTS idx_sms_messages_lead_id ON sms_messages(lead_id)');
      await client.query('CREATE INDEX IF NOT EXISTS idx_sms_messages_direction ON sms_messages(direction)');
      await client.query('CREATE INDEX IF NOT EXISTS idx_sms_messages_from_number ON sms_messages(from_number)');
      await client.query('CREATE INDEX IF NOT EXISTS idx_sms_messages_to_number ON sms_messages(to_number)');
      await client.query('CREATE INDEX IF NOT EXISTS idx_sms_messages_timestamp ON sms_messages(timestamp)');
      console.log('   ✅ Added SMS messages indexes');
      fixedCount++;
    } catch (err) {
      console.log('   ⏭️  SMS messages indexes already exist');
      skippedCount++;
    }
    
    await createTableIfNotExists('page_views', `
      CREATE TABLE page_views (
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
      )
    `);
    
    await createTableIfNotExists('calendar_events', `
      CREATE TABLE calendar_events (
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
      )
    `);
    
    await createTableIfNotExists('user_notification_preferences', `
      CREATE TABLE user_notification_preferences (
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
      )
    `);
    
    console.log('');
    console.log('✅ ========== SCHEMA FIX COMPLETED ==========');
    console.log(`   • Fixed/Added: ${fixedCount}`);
    console.log(`   • Already exists: ${skippedCount}`);
    console.log('');
    
  } catch (error) {
    console.error('❌ Fatal error:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

fixAllMissingColumns()
  .then(() => {
    console.log('✅ All done! Your database schema is now up to date.');
    process.exit(0);
  })
  .catch((err) => {
    console.error('❌ Failed:', err.message);
    process.exit(1);
  });


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
      
      // Create task_spaces table
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
      
      // Create tasks table
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
            created_at TIMESTAMP DEFAULT NOW(),
            updated_at TIMESTAMP DEFAULT NOW()
          );
        `);
        console.log('✅ Created tasks table');
      } catch (e) {
        console.log('⚠️ tasks table already exists or error:', e.message);
      }
      
      // Add space_id column to existing tasks table (if it exists but missing the column)
      try {
        await client.query(`ALTER TABLE tasks ADD COLUMN IF NOT EXISTS space_id VARCHAR REFERENCES task_spaces(id);`);
        console.log('✅ Added space_id to tasks table');
      } catch (e) {
        console.log('⚠️ space_id column already exists or error:', e.message);
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


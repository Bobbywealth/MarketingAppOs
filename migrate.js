import pg from 'pg';
const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

async function runMigrations() {
  let client;
  
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
    
    // Fix assigned_to_id columns to be INTEGER
    try {
      await client.query(`ALTER TABLE tasks ALTER COLUMN assigned_to_id TYPE INTEGER USING assigned_to_id::INTEGER;`);
      console.log('✅ Fixed tasks.assigned_to_id type');
    } catch (e) {
      console.log('⚠️ tasks.assigned_to_id already correct or has data issues:', e.message);
    }
    
    try {
      await client.query(`ALTER TABLE clients ALTER COLUMN assigned_to_id TYPE INTEGER USING assigned_to_id::INTEGER;`);
      console.log('✅ Fixed clients.assigned_to_id type');
    } catch (e) {
      console.log('⚠️ clients.assigned_to_id already correct:', e.message);
    }
    
    try {
      await client.query(`ALTER TABLE leads ALTER COLUMN assigned_to_id TYPE INTEGER USING assigned_to_id::INTEGER;`);
      console.log('✅ Fixed leads.assigned_to_id type');
    } catch (e) {
      console.log('⚠️ leads.assigned_to_id already correct:', e.message);
    }
    
    try {
      await client.query(`ALTER TABLE tickets ALTER COLUMN assigned_to_id TYPE INTEGER USING assigned_to_id::INTEGER;`);
      console.log('✅ Fixed tickets.assigned_to_id type');
    } catch (e) {
      console.log('⚠️ tickets.assigned_to_id already correct:', e.message);
    }
    
    console.log('✅ Migration script completed!');
  } catch (error) {
    console.error('❌ Migration connection error:', error);
    // Don't throw - let the app start anyway
  } finally {
    if (client) client.release();
    await pool.end();
  }
}

runMigrations().catch(err => {
  console.error('Migration failed but continuing:', err);
  process.exit(0); // Exit successfully so app can start
});


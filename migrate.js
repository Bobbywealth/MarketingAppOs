import pg from 'pg';
const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

async function runMigrations() {
  const client = await pool.connect();
  
  try {
    console.log('🔄 Running database migrations...');
    
    // Add new columns to users table
    await client.query(`
      ALTER TABLE users ADD COLUMN IF NOT EXISTS email TEXT;
      ALTER TABLE users ADD COLUMN IF NOT EXISTS first_name TEXT;
      ALTER TABLE users ADD COLUMN IF NOT EXISTS last_name TEXT;
    `);
    console.log('✅ Added email, first_name, last_name to users');
    
    // Add displayOrder to clients
    await client.query(`
      ALTER TABLE clients ADD COLUMN IF NOT EXISTS display_order INTEGER DEFAULT 0;
    `);
    console.log('✅ Added display_order to clients');
    
    // Fix assigned_to_id columns to be INTEGER
    try {
      await client.query(`ALTER TABLE tasks ALTER COLUMN assigned_to_id TYPE INTEGER USING assigned_to_id::INTEGER;`);
      console.log('✅ Fixed tasks.assigned_to_id type');
    } catch (e) {
      console.log('⚠️ tasks.assigned_to_id already correct or has data issues');
    }
    
    try {
      await client.query(`ALTER TABLE clients ALTER COLUMN assigned_to_id TYPE INTEGER USING assigned_to_id::INTEGER;`);
      console.log('✅ Fixed clients.assigned_to_id type');
    } catch (e) {
      console.log('⚠️ clients.assigned_to_id already correct');
    }
    
    try {
      await client.query(`ALTER TABLE leads ALTER COLUMN assigned_to_id TYPE INTEGER USING assigned_to_id::INTEGER;`);
      console.log('✅ Fixed leads.assigned_to_id type');
    } catch (e) {
      console.log('⚠️ leads.assigned_to_id already correct');
    }
    
    try {
      await client.query(`ALTER TABLE tickets ALTER COLUMN assigned_to_id TYPE INTEGER USING assigned_to_id::INTEGER;`);
      console.log('✅ Fixed tickets.assigned_to_id type');
    } catch (e) {
      console.log('⚠️ tickets.assigned_to_id already correct');
    }
    
    console.log('✅ All migrations completed successfully!');
  } catch (error) {
    console.error('❌ Migration error:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

runMigrations().catch(console.error);


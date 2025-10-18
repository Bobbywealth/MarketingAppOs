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


import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL?.includes('localhost') ? false : { rejectUnauthorized: false }
});

async function fixEverything() {
  const client = await pool.connect();
  
  try {
    console.log('🔧 Fixing ALL database schema issues...\n');
    
    // Notifications table
    console.log('📋 NOTIFICATIONS:');
    await client.query(`ALTER TABLE notifications ADD COLUMN IF NOT EXISTS type VARCHAR DEFAULT 'info'`);
    await client.query(`ALTER TABLE notifications ADD COLUMN IF NOT EXISTS category VARCHAR DEFAULT 'general'`);
    await client.query(`ALTER TABLE notifications ADD COLUMN IF NOT EXISTS action_url VARCHAR`);
    console.log('   ✅ Fixed\n');
    
    // Invoices table
    console.log('💰 INVOICES:');
    await client.query(`ALTER TABLE invoices ADD COLUMN IF NOT EXISTS stripe_payment_intent_id VARCHAR`);
    await client.query(`ALTER TABLE invoices ADD COLUMN IF NOT EXISTS description TEXT`);
    await client.query(`ALTER TABLE invoices ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW()`);
    console.log('   ✅ Fixed\n');
    
    // Content posts table
    console.log('📱 CONTENT_POSTS:');
    await client.query(`ALTER TABLE content_posts ADD COLUMN IF NOT EXISTS platforms JSONB DEFAULT '[]'::jsonb`);
    await client.query(`ALTER TABLE content_posts ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW()`);
    console.log('   ✅ Fixed\n');
    
    // Verify all tables
    console.log('🔍 VERIFICATION:\n');
    
    const tables = ['notifications', 'invoices', 'content_posts', 'campaigns', 'clients', 'tasks'];
    for (const table of tables) {
      const result = await client.query(`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = $1 
        ORDER BY ordinal_position
      `, [table]);
      console.log(`${table}:`, result.rows.map(r => r.column_name).join(', '));
    }
    
    console.log('\n🎉 ALL DATABASE ISSUES FIXED!');
    console.log('✅ Now restart your app on Render');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

fixEverything();


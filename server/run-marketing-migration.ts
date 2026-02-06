import { pool } from "./db";

async function runMarketingMigration() {
  console.log('🔧 Running marketing_broadcast_recipients migration to add recipient_type column...');
  
  try {
    // Check if column already exists
    const columnCheck = await pool.query(`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'marketing_broadcast_recipients'
        AND column_name = 'recipient_type'
    `);
    
    if (columnCheck.rows.length > 0) {
      console.log('✅ Column recipient_type already exists in marketing_broadcast_recipients table');
    } else {
      // Add column
      await pool.query(`
        ALTER TABLE marketing_broadcast_recipients
        ADD COLUMN IF NOT EXISTS recipient_type VARCHAR(50) DEFAULT 'individual'
      `);
      console.log('✅ Added recipient_type column to marketing_broadcast_recipients table');
    }
    
    console.log('✅ Marketing broadcast recipients migration completed');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  }
}

runMarketingMigration().then(() => {
  console.log('🎉 Migration script finished, exiting...');
  process.exit(0);
}).catch((error) => {
  console.error('❌ Script error:', error);
  process.exit(1);
});

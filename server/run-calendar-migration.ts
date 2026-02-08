async function runCalendarMigration() {
  console.log('🔧 Running calendar_events migration to add is_recurring column...');
  
  try {
    // Check if column already exists
    const columnCheck = await pool.query(`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'calendar_events'
        AND column_name = 'is_recurring'
    `);
    
    if (columnCheck.rows.length > 0) {
      console.log('✅ Column is_recurring already exists in calendar_events table');
    } else {
      // Add the column
      await pool.query(`
        ALTER TABLE calendar_events
        ADD COLUMN IF NOT EXISTS is_recurring BOOLEAN DEFAULT FALSE
      `);
      console.log('✅ Added is_recurring column to calendar_events table');
    }
    
    console.log('✅ Calendar events migration completed');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  }
}

runCalendarMigration().then(() => {
  console.log('🎉 Migration script finished, exiting...');
  process.exit(0);
}).catch((error) => {
  console.error('❌ Script error:', error);
  process.exit(1);
});

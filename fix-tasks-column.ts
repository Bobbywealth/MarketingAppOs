import pg from 'pg';
const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

async function fixTasksColumn() {
  const client = await pool.connect();
  try {
    console.log('Adding missing columns to tasks table...');
    
    // Add archived_at column
    await client.query(`ALTER TABLE tasks ADD COLUMN IF NOT EXISTS archived_at TIMESTAMP;`);
    console.log('✅ Added archived_at column');
    
    // Add estimated_hours column
    await client.query(`ALTER TABLE tasks ADD COLUMN IF NOT EXISTS estimated_hours INTEGER DEFAULT 0;`);
    console.log('✅ Added estimated_hours column');
    
    // Add tags column
    await client.query(`ALTER TABLE tasks ADD COLUMN IF NOT EXISTS tags TEXT[];`);
    console.log('✅ Added tags column');
    
    // Add checklist column
    await client.query(`ALTER TABLE tasks ADD COLUMN IF NOT EXISTS checklist JSONB;`);
    console.log('✅ Added checklist column');
    
    // Create indexes
    await client.query(`CREATE INDEX IF NOT EXISTS IDX_tasks_archived_at ON tasks(archived_at) WHERE archived_at IS NOT NULL;`);
    console.log('✅ Created archived_at index');
    
    console.log('\n🎉 Migration completed successfully!');
  } catch (error) {
    console.error('Migration error:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

fixTasksColumn();

const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

async function addMissingContactColumns() {
  try {
    console.log('🔧 Adding missing contact tracking columns to leads table...');
    
    // Add the missing contact tracking columns to leads table
    const alterQueries = [
      `ALTER TABLE leads ADD COLUMN IF NOT EXISTS last_contact_method VARCHAR;`,
      `ALTER TABLE leads ADD COLUMN IF NOT EXISTS last_contact_date TIMESTAMP;`,
      `ALTER TABLE leads ADD COLUMN IF NOT EXISTS last_contact_notes TEXT;`,
      `ALTER TABLE leads ADD COLUMN IF NOT EXISTS next_follow_up_date TIMESTAMP;`,
      `ALTER TABLE leads ADD COLUMN IF NOT EXISTS next_follow_up_type VARCHAR;`,
      `ALTER TABLE leads ADD COLUMN IF NOT EXISTS contact_status VARCHAR DEFAULT 'not_contacted';`,
    ];

    for (const query of alterQueries) {
      console.log(`   Running: ${query}`);
      await pool.query(query);
      console.log('   ✅ Success');
    }

    console.log('\n✅ All missing contact tracking columns added successfully!');
    console.log('🎉 Your dashboard should now work properly!');
    
  } catch (error) {
    console.error('❌ Error adding columns:', error);
    console.error('Details:', error.message);
  } finally {
    await pool.end();
  }
}

addMissingContactColumns();

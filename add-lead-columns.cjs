const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : undefined
});

async function addColumns() {
  try {
    console.log('🔧 Adding missing columns to leads table...');
    
    await pool.query('ALTER TABLE leads ADD COLUMN IF NOT EXISTS deal_value DECIMAL(10,2)');
    console.log('✅ Added deal_value column');
    
    await pool.query('ALTER TABLE leads ADD COLUMN IF NOT EXISTS commission_rate DECIMAL(5,2) DEFAULT 10.00');
    console.log('✅ Added commission_rate column');
    
    await pool.query('ALTER TABLE leads ADD COLUMN IF NOT EXISTS expected_close_date TIMESTAMP');
    console.log('✅ Added expected_close_date column');
    
    console.log('\n✨ All columns added successfully! Your leads will now load.');
    
    await pool.end();
    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err.message);
    await pool.end();
    process.exit(1);
  }
}

addColumns();


const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

(async () => {
  const client = await pool.connect();
  
  try {
    console.log('🔧 Adding phone_type column to leads table...');
    
    // Check if column already exists
    const checkQuery = `
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'leads' AND column_name = 'phone_type'
    `;
    const result = await client.query(checkQuery);
    
    if (result.rows.length === 0) {
      // Column doesn't exist, add it
      await client.query(`
        ALTER TABLE leads 
        ADD COLUMN IF NOT EXISTS phone_type VARCHAR DEFAULT 'business'
      `);
      console.log('✅ Added phone_type column to leads table');
      console.log('   Default value: business');
      console.log('   Options: business, personal, mobile');
    } else {
      console.log('⏭️  phone_type column already exists');
    }
    
    // Verify the column was added
    const verifyQuery = `
      SELECT column_name, data_type, column_default
      FROM information_schema.columns 
      WHERE table_name = 'leads' AND column_name = 'phone_type'
    `;
    const verify = await client.query(verifyQuery);
    
    if (verify.rows.length > 0) {
      console.log('✅ Verification successful:');
      console.log(`   Column: ${verify.rows[0].column_name}`);
      console.log(`   Type: ${verify.rows[0].data_type}`);
      console.log(`   Default: ${verify.rows[0].column_default || 'NULL'}`);
    }
    
    console.log('');
    console.log('✅ Migration complete!');
    console.log('');
    console.log('📝 Phone Type Options:');
    console.log('   💼 business - Default for all existing leads');
    console.log('   👤 personal - Personal phone number');
    console.log('   📱 mobile  - Mobile/cell phone');
    
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
    process.exit(0);
  }
})();


const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

(async () => {
  const client = await pool.connect();
  
  try {
    console.log('🔧 Adding lead conversion tracking columns...');
    console.log('');
    
    // Check if columns already exist
    const checkQuery = `
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'leads' 
      AND column_name IN ('converted_to_client_id', 'converted_at')
    `;
    const result = await client.query(checkQuery);
    const existingColumns = result.rows.map(r => r.column_name);
    
    // Add converted_to_client_id column
    if (!existingColumns.includes('converted_to_client_id')) {
      await client.query(`
        ALTER TABLE leads 
        ADD COLUMN IF NOT EXISTS converted_to_client_id VARCHAR REFERENCES clients(id)
      `);
      console.log('✅ Added converted_to_client_id column');
      console.log('   Links leads to their corresponding client record');
    } else {
      console.log('⏭️  converted_to_client_id column already exists');
    }
    
    // Add converted_at column
    if (!existingColumns.includes('converted_at')) {
      await client.query(`
        ALTER TABLE leads 
        ADD COLUMN IF NOT EXISTS converted_at TIMESTAMP
      `);
      console.log('✅ Added converted_at column');
      console.log('   Tracks when the lead was converted to a client');
    } else {
      console.log('⏭️  converted_at column already exists');
    }
    
    console.log('');
    
    // Verify the columns were added
    const verifyQuery = `
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'leads' 
      AND column_name IN ('converted_to_client_id', 'converted_at')
      ORDER BY column_name
    `;
    const verify = await client.query(verifyQuery);
    
    if (verify.rows.length > 0) {
      console.log('✅ Verification successful:');
      verify.rows.forEach(row => {
        console.log(`   - ${row.column_name}: ${row.data_type} (nullable: ${row.is_nullable})`);
      });
    }
    
    console.log('');
    console.log('✅ Migration complete!');
    console.log('');
    console.log('📝 What this enables:');
    console.log('   🎉 Convert won leads to clients with one click');
    console.log('   🔗 Track which leads became clients');
    console.log('   📊 Calculate conversion rates');
    console.log('   ✅ Prevent duplicate conversions');
    console.log('   📅 See when leads were converted');
    console.log('');
    console.log('🚀 Ready to use! Look for the "Convert to Client" button');
    console.log('   on leads with stage = "closed_won"');
    
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
    process.exit(0);
  }
})();


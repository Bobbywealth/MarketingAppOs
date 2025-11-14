const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

(async () => {
  const client = await pool.connect();
  
  try {
    console.log('🔧 Adding industry and tags to leads table...\n');
    
    // 1. Add industry column
    await client.query(`ALTER TABLE leads ADD COLUMN IF NOT EXISTS industry VARCHAR;`);
    console.log('✅ Added industry column');
    
    // 2. Add tags column
    await client.query(`ALTER TABLE leads ADD COLUMN IF NOT EXISTS tags JSONB DEFAULT '[]'::jsonb;`);
    console.log('✅ Added tags column');
    
    // 3. Make name nullable
    try {
      await client.query(`ALTER TABLE leads ALTER COLUMN name DROP NOT NULL;`);
      console.log('✅ Made name nullable');
    } catch (err) {
      console.log('⏭️  name already nullable');
    }
    
    // 4. Fill empty companies
    await client.query(`UPDATE leads SET company = 'Not Provided' WHERE company IS NULL OR company = '';`);
    console.log('✅ Updated empty companies');
    
    // 5. Make company required
    try {
      await client.query(`ALTER TABLE leads ALTER COLUMN company SET NOT NULL;`);
      console.log('✅ Made company required');
    } catch (err) {
      console.log('⏭️  company already required');
    }
    
    // 6. Add indexes
    await client.query(`CREATE INDEX IF NOT EXISTS idx_leads_industry ON leads(industry);`);
    console.log('✅ Added industry index');
    
    await client.query(`CREATE INDEX IF NOT EXISTS idx_leads_tags ON leads USING GIN (tags);`);
    console.log('✅ Added tags GIN index');
    
    // Verify columns exist
    const result = await client.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'leads'
      AND column_name IN ('industry', 'tags', 'name', 'company')
      ORDER BY column_name;
    `);
    
    console.log('\n📋 Verification - Leads table columns:');
    result.rows.forEach(row => {
      console.log(`   ${row.column_name}: ${row.data_type} (nullable: ${row.is_nullable})`);
    });
    
    console.log('\n✅ SUCCESS! All changes applied.');
    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err.message);
    console.error(err);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
})();


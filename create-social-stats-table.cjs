const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

(async () => {
  try {
    console.log('📊 Creating client_social_stats table...');
    
    const createTableQuery = `
      CREATE TABLE IF NOT EXISTS client_social_stats (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
        client_id VARCHAR NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
        platform VARCHAR NOT NULL,
        followers INTEGER,
        posts INTEGER,
        engagement DECIMAL(5,2),
        reach INTEGER,
        views INTEGER,
        growth_rate DECIMAL(5,2),
        last_updated TIMESTAMP DEFAULT NOW(),
        updated_by INTEGER REFERENCES users(id),
        notes TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        UNIQUE(client_id, platform)
      );
    `;
    
    await pool.query(createTableQuery);
    console.log('✅ Table created successfully!');
    
    const createIndexQuery = `
      CREATE INDEX IF NOT EXISTS idx_client_social_stats_client_id 
      ON client_social_stats(client_id);
    `;
    
    await pool.query(createIndexQuery);
    console.log('✅ Index created successfully!');
    
    // Verify table exists
    const verifyQuery = `
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'client_social_stats'
      ORDER BY ordinal_position;
    `;
    
    const result = await pool.query(verifyQuery);
    console.log('✅ Table verified! Columns:', result.rows.length);
    result.rows.forEach(row => {
      console.log(`   - ${row.column_name}: ${row.data_type}`);
    });
    
    await pool.end();
    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err.message);
    console.error('Full error:', err);
    await pool.end();
    process.exit(1);
  }
})();


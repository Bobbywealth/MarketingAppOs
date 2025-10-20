const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL?.includes('localhost') ? false : { rejectUnauthorized: false }
});

async function createAnalyticsTable() {
  const client = await pool.connect();
  
  try {
    console.log('📊 Creating page_views table for analytics tracking...\n');
    
    // Create page_views table
    await client.query(`
      CREATE TABLE IF NOT EXISTS page_views (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
        page VARCHAR NOT NULL,
        referrer VARCHAR,
        user_agent TEXT,
        ip VARCHAR,
        country VARCHAR,
        city VARCHAR,
        device_type VARCHAR,
        browser VARCHAR,
        session_id VARCHAR,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);
    
    // Create index for faster queries
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_page_views_created_at ON page_views(created_at DESC);
    `);
    
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_page_views_page ON page_views(page);
    `);
    
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_page_views_session ON page_views(session_id);
    `);
    
    console.log('✅ page_views table created successfully!');
    console.log('✅ Indexes created for optimal performance');
    console.log('\n🎉 Website analytics tracking is ready!');
    console.log('\n📋 Next steps:');
    console.log('1. Add the tracking script to your website');
    console.log('2. Deploy your changes');
    console.log('3. View real-time analytics at /analytics > Website tab\n');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

createAnalyticsTable();


#!/usr/bin/env node

// Fix content_posts table
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL?.includes('localhost') ? false : { rejectUnauthorized: false }
});

async function fixContentPosts() {
  console.log('🔧 Fixing content_posts table...\n');
  const client = await pool.connect();
  
  try {
    console.log('1. Adding platforms column...');
    await client.query(`ALTER TABLE content_posts ADD COLUMN IF NOT EXISTS platforms JSONB NOT NULL DEFAULT '[]'::jsonb`);
    console.log('   ✅ Done\n');
    
    console.log('2. Adding updated_at column...');
    await client.query(`ALTER TABLE content_posts ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW()`);
    console.log('   ✅ Done\n');
    
    console.log('3. Verifying columns...');
    const result = await client.query(`
      SELECT column_name FROM information_schema.columns 
      WHERE table_name='content_posts'
      ORDER BY column_name
    `);
    console.log('   Content_posts columns:', result.rows.map(r => r.column_name).join(', '));
    
    console.log('\n🎉 All fixes completed!');
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
    process.exit(0);
  }
}

fixContentPosts();


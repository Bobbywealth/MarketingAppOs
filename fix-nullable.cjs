#!/usr/bin/env node

// Fix NOT NULL constraints that are causing issues
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL?.includes('localhost') ? false : { rejectUnauthorized: false }
});

async function fixNullConstraints() {
  console.log('🔧 Removing NOT NULL constraints...\n');
  const client = await pool.connect();
  
  try {
    console.log('1. Making type column nullable in notifications...');
    await client.query(`ALTER TABLE notifications ALTER COLUMN type DROP NOT NULL`);
    console.log('   ✅ Done\n');
    
    console.log('2. Making category column nullable in notifications...');
    await client.query(`ALTER TABLE notifications ALTER COLUMN category DROP NOT NULL`);
    console.log('   ✅ Done\n');
    
    console.log('3. Setting default values for existing rows...');
    await client.query(`UPDATE notifications SET type = 'info' WHERE type IS NULL`);
    await client.query(`UPDATE notifications SET category = 'general' WHERE category IS NULL`);
    console.log('   ✅ Done\n');
    
    console.log('🎉 All fixes completed!');
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
    process.exit(0);
  }
}

fixNullConstraints();


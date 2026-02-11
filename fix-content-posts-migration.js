#!/usr/bin/env node
/**
 * Migration script to fix content_posts table columns
 * Run this to ensure all required columns exist
 */

const { createClient } = require('@libsql/client');

async function runMigration() {
  console.log('🔧 Running content_posts table migration...');
  
  const url = process.env.DATABASE_URL || process.env.TURSO_DATABASE_URL;
  const authToken = process.env.DATABASE_AUTH_TOKEN || process.env.TURSO_DATABASE_AUTH_TOKEN;
  
  if (!url) {
    console.error('❌ DATABASE_URL environment variable not set');
    process.exit(1);
  }
  
  const client = createClient({ url, authToken });
  
  try {
    // Check if platforms column exists
    const platformsCheck = await client.execute({
      sql: "SELECT column_name FROM information_schema.columns WHERE table_name = 'content_posts' AND column_name = 'platforms'",
      args: []
    });
    
    if (platformsCheck.rows.length === 0) {
      console.log('📦 Adding platforms column...');
      await client.execute({
        sql: "ALTER TABLE content_posts ADD COLUMN platforms JSONB NOT NULL DEFAULT '[]'::jsonb",
        args: []
      });
      console.log('✅ Added platforms column');
    } else {
      console.log('✅ platforms column already exists');
    }
    
    // Check if updated_at column exists
    const updatedAtCheck = await client.execute({
      sql: "SELECT column_name FROM information_schema.columns WHERE table_name = 'content_posts' AND column_name = 'updated_at'",
      args: []
    });
    
    if (updatedAtCheck.rows.length === 0) {
      console.log('📦 Adding updated_at column...');
      await client.execute({
        sql: "ALTER TABLE content_posts ADD COLUMN updated_at TIMESTAMP DEFAULT NOW()",
        args: []
      });
      console.log('✅ Added updated_at column');
    } else {
      console.log('✅ updated_at column already exists');
    }
    
    console.log('🎉 Migration completed successfully!');
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  } finally {
    await client.close();
  }
}

runMigration();

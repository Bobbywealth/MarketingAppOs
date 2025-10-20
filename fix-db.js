#!/usr/bin/env node

// Quick database fix script - run with: node fix-db.js
import { db } from './server/db.js';
import { sql } from 'drizzle-orm';

async function fixDatabase() {
  console.log('🔧 Starting database fixes...\n');
  
  try {
    // Fix 1: Add type column to notifications
    console.log('1. Adding type column to notifications...');
    await db.execute(sql`ALTER TABLE notifications ADD COLUMN IF NOT EXISTS type VARCHAR NOT NULL DEFAULT 'info'`);
    console.log('   ✅ Done\n');
    
    // Fix 2: Add category column to notifications
    console.log('2. Adding category column to notifications...');
    await db.execute(sql`ALTER TABLE notifications ADD COLUMN IF NOT EXISTS category VARCHAR NOT NULL DEFAULT 'general'`);
    console.log('   ✅ Done\n');
    
    // Fix 3: Rename paid_date to paid_at in invoices
    console.log('3. Renaming paid_date to paid_at in invoices...');
    try {
      await db.execute(sql`ALTER TABLE invoices RENAME COLUMN paid_date TO paid_at`);
      console.log('   ✅ Done\n');
    } catch (e) {
      if (e.message.includes('does not exist')) {
        console.log('   ⚠️  Column paid_date does not exist (might already be paid_at)\n');
      } else {
        throw e;
      }
    }
    
    // Verify changes
    console.log('4. Verifying changes...');
    const result = await db.execute(sql`
      SELECT column_name, table_name 
      FROM information_schema.columns 
      WHERE (table_name = 'notifications' AND column_name IN ('type', 'category'))
         OR (table_name = 'invoices' AND column_name = 'paid_at')
      ORDER BY table_name, column_name
    `);
    
    console.log('   Columns found:', result.rows);
    console.log('   ✅ Done\n');
    
    console.log('🎉 All database fixes completed successfully!');
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Error fixing database:', error.message);
    console.error(error);
    process.exit(1);
  }
}

fixDatabase();


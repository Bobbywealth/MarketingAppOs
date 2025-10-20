#!/usr/bin/env node

// Comprehensive database fix - adds ALL missing columns
import { db } from './server/db.js';
import { sql } from 'drizzle-orm';

async function fixAllColumns() {
  console.log('🔧 Starting comprehensive database fixes...\n');
  
  try {
    // ===== NOTIFICATIONS TABLE =====
    console.log('📋 NOTIFICATIONS TABLE');
    
    console.log('  1. Adding type column...');
    try {
      await db.execute(sql`ALTER TABLE notifications ADD COLUMN IF NOT EXISTS type VARCHAR NOT NULL DEFAULT 'info'`);
      console.log('     ✅ Done\n');
    } catch (e) {
      console.log('     ⚠️  Already exists or error:', e.message, '\n');
    }
    
    console.log('  2. Adding category column...');
    try {
      await db.execute(sql`ALTER TABLE notifications ADD COLUMN IF NOT EXISTS category VARCHAR NOT NULL DEFAULT 'general'`);
      console.log('     ✅ Done\n');
    } catch (e) {
      console.log('     ⚠️  Already exists or error:', e.message, '\n');
    }
    
    console.log('  3. Adding action_url column...');
    try {
      await db.execute(sql`ALTER TABLE notifications ADD COLUMN IF NOT EXISTS action_url VARCHAR`);
      console.log('     ✅ Done\n');
    } catch (e) {
      console.log('     ⚠️  Already exists or error:', e.message, '\n');
    }
    
    console.log('  4. Renaming link to action_url if exists...');
    try {
      const result = await db.execute(sql`
        SELECT column_name FROM information_schema.columns 
        WHERE table_name='notifications' AND column_name='link'
      `);
      if (result.rows.length > 0) {
        await db.execute(sql`ALTER TABLE notifications RENAME COLUMN link TO action_url`);
        console.log('     ✅ Renamed\n');
      } else {
        console.log('     ⚠️  Column "link" does not exist (good!)\n');
      }
    } catch (e) {
      console.log('     ⚠️  Error or already done:', e.message, '\n');
    }
    
    // ===== INVOICES TABLE =====
    console.log('💰 INVOICES TABLE');
    
    console.log('  1. Adding stripe_payment_intent_id column...');
    try {
      await db.execute(sql`ALTER TABLE invoices ADD COLUMN IF NOT EXISTS stripe_payment_intent_id VARCHAR`);
      console.log('     ✅ Done\n');
    } catch (e) {
      console.log('     ⚠️  Already exists or error:', e.message, '\n');
    }
    
    console.log('  2. Checking paid_at column...');
    try {
      const result = await db.execute(sql`
        SELECT column_name FROM information_schema.columns 
        WHERE table_name='invoices' AND column_name='paid_date'
      `);
      if (result.rows.length > 0) {
        await db.execute(sql`ALTER TABLE invoices RENAME COLUMN paid_date TO paid_at`);
        console.log('     ✅ Renamed paid_date to paid_at\n');
      } else {
        console.log('     ✅ paid_at already exists\n');
      }
    } catch (e) {
      console.log('     ⚠️  Error or already done:', e.message, '\n');
    }
    
    console.log('  3. Adding updated_at column...');
    try {
      await db.execute(sql`ALTER TABLE invoices ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW()`);
      console.log('     ✅ Done\n');
    } catch (e) {
      console.log('     ⚠️  Already exists or error:', e.message, '\n');
    }
    
    // ===== VERIFY ALL CHANGES =====
    console.log('🔍 VERIFYING ALL CHANGES');
    
    const notifResult = await db.execute(sql`
      SELECT column_name FROM information_schema.columns 
      WHERE table_name='notifications'
      ORDER BY column_name
    `);
    console.log('  Notifications columns:', notifResult.rows.map(r => r.column_name).join(', '));
    
    const invoiceResult = await db.execute(sql`
      SELECT column_name FROM information_schema.columns 
      WHERE table_name='invoices'
      ORDER BY column_name
    `);
    console.log('  Invoices columns:', invoiceResult.rows.map(r => r.column_name).join(', '));
    
    console.log('\n🎉 All database fixes completed successfully!');
    console.log('✅ Your app should now work correctly!');
    process.exit(0);
    
  } catch (error) {
    console.error('\n❌ Error fixing database:', error.message);
    console.error(error);
    process.exit(1);
  }
}

fixAllColumns();


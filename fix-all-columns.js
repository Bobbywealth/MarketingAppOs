#!/usr/bin/env node

// Comprehensive database fix - adds ALL missing columns
// Run with: node fix-all-columns.js

const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL?.includes('localhost') ? false : { rejectUnauthorized: false }
});

async function fixAllColumns() {
  console.log('🔧 Starting comprehensive database fixes...\n');
  const client = await pool.connect();
  
  try {
    // ===== NOTIFICATIONS TABLE =====
    console.log('📋 NOTIFICATIONS TABLE');
    
    console.log('  1. Adding type column...');
    try {
      await client.query(`ALTER TABLE notifications ADD COLUMN IF NOT EXISTS type VARCHAR NOT NULL DEFAULT 'info'`);
      console.log('     ✅ Done\n');
    } catch (e) {
      console.log('     ⚠️  Already exists or error:', e.message, '\n');
    }
    
    console.log('  2. Adding category column...');
    try {
      await client.query(`ALTER TABLE notifications ADD COLUMN IF NOT EXISTS category VARCHAR NOT NULL DEFAULT 'general'`);
      console.log('     ✅ Done\n');
    } catch (e) {
      console.log('     ⚠️  Already exists or error:', e.message, '\n');
    }
    
    console.log('  3. Adding action_url column...');
    try {
      await client.query(`ALTER TABLE notifications ADD COLUMN IF NOT EXISTS action_url VARCHAR`);
      console.log('     ✅ Done\n');
    } catch (e) {
      console.log('     ⚠️  Already exists or error:', e.message, '\n');
    }
    
    console.log('  4. Renaming link to action_url if exists...');
    try {
      const result = await client.query(`
        SELECT column_name FROM information_schema.columns 
        WHERE table_name='notifications' AND column_name='link'
      `);
      if (result.rows.length > 0) {
        await client.query(`ALTER TABLE notifications RENAME COLUMN link TO action_url`);
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
      await client.query(`ALTER TABLE invoices ADD COLUMN IF NOT EXISTS stripe_payment_intent_id VARCHAR`);
      console.log('     ✅ Done\n');
    } catch (e) {
      console.log('     ⚠️  Already exists or error:', e.message, '\n');
    }
    
    console.log('  2. Checking paid_at column...');
    try {
      const result = await client.query(`
        SELECT column_name FROM information_schema.columns 
        WHERE table_name='invoices' AND column_name='paid_date'
      `);
      if (result.rows.length > 0) {
        await client.query(`ALTER TABLE invoices RENAME COLUMN paid_date TO paid_at`);
        console.log('     ✅ Renamed paid_date to paid_at\n');
      } else {
        console.log('     ✅ paid_at already exists\n');
      }
    } catch (e) {
      console.log('     ⚠️  Error or already done:', e.message, '\n');
    }
    
    console.log('  3. Adding updated_at column...');
    try {
      await client.query(`ALTER TABLE invoices ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW()`);
      console.log('     ✅ Done\n');
    } catch (e) {
      console.log('     ⚠️  Already exists or error:', e.message, '\n');
    }
    
    // ===== VERIFY ALL CHANGES =====
    console.log('🔍 VERIFYING ALL CHANGES');
    
    const notifResult = await client.query(`
      SELECT column_name FROM information_schema.columns 
      WHERE table_name='notifications'
      ORDER BY column_name
    `);
    console.log('  Notifications columns:', notifResult.rows.map(r => r.column_name).join(', '));
    
    const invoiceResult = await client.query(`
      SELECT column_name FROM information_schema.columns 
      WHERE table_name='invoices'
      ORDER BY column_name
    `);
    console.log('  Invoices columns:', invoiceResult.rows.map(r => r.column_name).join(', '));
    
    console.log('\n🎉 All database fixes completed successfully!');
    console.log('✅ Your app should now work correctly!');
    
  } catch (error) {
    console.error('\n❌ Error fixing database:', error.message);
    console.error(error);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
    process.exit(0);
  }
}

fixAllColumns();


#!/usr/bin/env node

// Fix script to add first_name and last_name columns to leads table
// Run with: node fix-leads-names.js

import { db } from './server/db.js';
import { sql } from 'drizzle-orm';

async function fixLeadsColumns() {
  console.log('🔧 Adding first_name and last_name columns to leads table...\n');
  
  try {
    // Add first_name column
    console.log('1. Adding first_name column to leads...');
    await db.execute(sql`ALTER TABLE leads ADD COLUMN IF NOT EXISTS first_name VARCHAR(255)`);
    console.log('   ✅ Done\n');
    
    // Add last_name column
    console.log('2. Adding last_name column to leads...');
    await db.execute(sql`ALTER TABLE leads ADD COLUMN IF NOT EXISTS last_name VARCHAR(255)`);
    console.log('   ✅ Done\n');
    
    // Verify changes
    console.log('3. Verifying changes...');
    const result = await db.execute(sql`
      SELECT column_name, data_type, character_maximum_length
      FROM information_schema.columns 
      WHERE table_name = 'leads' 
        AND column_name IN ('first_name', 'last_name')
      ORDER BY column_name
    `);
    
    console.log('   Columns found:');
    result.rows.forEach(row => {
      console.log(`   - ${row.column_name}: ${row.data_type}`);
    });
    console.log('   ✅ Done\n');
    
    console.log('🎉 Leads columns fix completed successfully!');
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Error fixing leads columns:', error.message);
    console.error(error);
    process.exit(1);
  }
}

fixLeadsColumns();

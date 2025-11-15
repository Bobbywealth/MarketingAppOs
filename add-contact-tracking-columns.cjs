const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

async function addColumnIfNotExists(tableName, columnName, columnDef) {
  const client = await pool.connect();
  try {
    const checkQuery = `
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = $1 AND column_name = $2
    `;
    const result = await client.query(checkQuery, [tableName, columnName]);
    
    if (result.rows.length === 0) {
      await client.query(`ALTER TABLE ${tableName} ADD COLUMN IF NOT EXISTS ${columnName} ${columnDef}`);
      console.log(`   ✅ Added ${tableName}.${columnName}`);
      return true;
    } else {
      console.log(`   ⏭️  ${tableName}.${columnName} already exists`);
      return false;
    }
  } catch (err) {
    if (err.message?.includes('does not exist')) {
      console.log(`   ⚠️  Table ${tableName} does not exist (skipping)`);
      return false;
    }
    throw err;
  } finally {
    client.release();
  }
}

async function runMigration() {
  console.log('🚀 CONTACT TRACKING MIGRATION - PHASE 1-3');
  console.log('='.repeat(60));
  console.log('');

  let addedCount = 0;
  let skippedCount = 0;

  try {
    // Phase 1: Add contact tracking fields to leads table
    console.log('📊 Phase 1: Contact Tracking Fields');
    console.log('-'.repeat(60));
    
    if (await addColumnIfNotExists('leads', 'last_contact_method', 'VARCHAR')) addedCount++;
    else skippedCount++;
    
    if (await addColumnIfNotExists('leads', 'last_contact_date', 'TIMESTAMP')) addedCount++;
    else skippedCount++;
    
    if (await addColumnIfNotExists('leads', 'last_contact_notes', 'TEXT')) addedCount++;
    else skippedCount++;
    
    if (await addColumnIfNotExists('leads', 'next_follow_up_type', 'VARCHAR')) addedCount++;
    else skippedCount++;
    
    if (await addColumnIfNotExists('leads', 'next_follow_up_date', 'TIMESTAMP')) addedCount++;
    else skippedCount++;
    
    if (await addColumnIfNotExists('leads', 'contact_status', 'VARCHAR DEFAULT \'not_contacted\'')) addedCount++;
    else skippedCount++;
    
    console.log('');

    // Phase 2: Update lead_activities table (add outcome column)
    console.log('📝 Phase 2: Lead Activities Enhancement');
    console.log('-'.repeat(60));
    
    if (await addColumnIfNotExists('lead_activities', 'outcome', 'VARCHAR')) addedCount++;
    else skippedCount++;
    
    console.log('');

    // Create indexes for better query performance
    console.log('🔍 Creating Indexes');
    console.log('-'.repeat(60));
    const client = await pool.connect();
    try {
      await client.query('CREATE INDEX IF NOT EXISTS idx_leads_last_contact_date ON leads(last_contact_date)');
      console.log('   ✅ Created index on leads.last_contact_date');
      
      await client.query('CREATE INDEX IF NOT EXISTS idx_leads_next_follow_up_date ON leads(next_follow_up_date)');
      console.log('   ✅ Created index on leads.next_follow_up_date');
      
      await client.query('CREATE INDEX IF NOT EXISTS idx_leads_contact_status ON leads(contact_status)');
      console.log('   ✅ Created index on leads.contact_status');
      
      await client.query('CREATE INDEX IF NOT EXISTS idx_lead_activities_type ON lead_activities(type)');
      console.log('   ✅ Created index on lead_activities.type');
      
      await client.query('CREATE INDEX IF NOT EXISTS idx_lead_activities_outcome ON lead_activities(outcome)');
      console.log('   ✅ Created index on lead_activities.outcome');
    } catch (err) {
      console.error('   ⚠️  Error creating indexes:', err.message);
    } finally {
      client.release();
    }
    
    console.log('');
    console.log('='.repeat(60));
    console.log(`✅ MIGRATION COMPLETE!`);
    console.log(`   Added: ${addedCount} columns`);
    console.log(`   Skipped: ${skippedCount} (already existed)`);
    console.log('');
    console.log('🎉 Your lead tracking system is now ready!');
    console.log('   - Contact status tracking ✅');
    console.log('   - Activity timeline ✅');
    console.log('   - Auto-logging for SMS/Calls ✅');
    console.log('');
    
    process.exit(0);
  } catch (err) {
    console.error('');
    console.error('❌ MIGRATION FAILED');
    console.error('Error:', err.message);
    console.error('');
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Run migration
runMigration();


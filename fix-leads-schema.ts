import { pool } from "./server/db";

async function fixLeadsSchema() {
  try {
    console.log("🔧 Fixing leads table schema...");
    
    // Add missing columns to leads table
    await pool.query(`
      ALTER TABLE leads 
      ADD COLUMN IF NOT EXISTS social_credentials JSONB DEFAULT '{}'::jsonb,
      ADD COLUMN IF NOT EXISTS brand_assets JSONB DEFAULT '{}'::jsonb
    `);
    
    // Add missing columns to clients table
    await pool.query(`
      ALTER TABLE clients 
      ADD COLUMN IF NOT EXISTS social_credentials JSONB DEFAULT '{}'::jsonb,
      ADD COLUMN IF NOT EXISTS brand_assets JSONB DEFAULT '{}'::jsonb
    `);
    
    console.log("✅ Added missing columns to leads and clients tables: social_credentials, brand_assets");
    
    process.exit(0);
  } catch (error) {
    console.error("❌ Error fixing leads table schema:", error);
    process.exit(1);
  }
}

fixLeadsSchema();


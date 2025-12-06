import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import pg from 'pg';
import { readFileSync } from 'fs';

const { Pool } = pg;

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function runMigration() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    console.log('🚀 Running discount codes migration...');
    
    const migrationPath = join(__dirname, 'migrations', 'add_discount_codes.sql');
    const migrationSQL = readFileSync(migrationPath, 'utf-8');
    
    await pool.query(migrationSQL);
    
    console.log('✅ Discount codes migration completed successfully!');
    console.log('');
    console.log('📊 New tables created:');
    console.log('  - discount_codes');
    console.log('  - discount_redemptions');
    console.log('');
    console.log('🎯 Next steps:');
    console.log('  1. Go to /discount-codes in your app');
    console.log('  2. Create your first discount code');
    console.log('  3. Test it on the signup page');
    
  } catch (error: any) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

runMigration().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});


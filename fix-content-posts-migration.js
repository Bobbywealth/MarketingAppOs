import { pool } from './server/db.js';
import fs from 'fs';

async function runMigration() {
  try {
    console.log('🔧 Running content_posts migration...');
    
    const migrationSQL = fs.readFileSync('./migrations/add_media_urls_to_content_posts.sql', 'utf8');
    
    await pool.query(migrationSQL);
    
    console.log('✅ Migration completed successfully!');
    console.log('✓ media_urls column added to content_posts table');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

runMigration();


import { pool } from "./server/db";
import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runMigration() {
  try {
    console.log("🚀 Running sales agent features migration...");
    
    const migrationPath = path.join(__dirname, "migrations", "add_sales_agent_features.sql");
    const migrationSQL = fs.readFileSync(migrationPath, "utf-8");
    
    await pool.query(migrationSQL);
    
    console.log("✅ Migration completed successfully!");
    console.log("\nNew tables created:");
    console.log("  - commissions");
    console.log("  - sales_quotas");
    console.log("  - lead_assignments");
    console.log("\nNew columns added to leads:");
    console.log("  - deal_value");
    console.log("  - commission_rate");
    console.log("  - expected_close_date");
    
    process.exit(0);
  } catch (error) {
    console.error("❌ Migration failed:", error);
    process.exit(1);
  }
}

runMigration();


import { pool } from "./server/db";

async function checkLeads() {
  try {
    console.log("🔍 Checking leads table...\n");
    
    // Check if leads table exists
    const tableCheck = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'leads'
      );
    `);
    
    console.log("✅ Leads table exists:", tableCheck.rows[0].exists);
    
    if (tableCheck.rows[0].exists) {
      // Count leads
      const countResult = await pool.query("SELECT COUNT(*) FROM leads");
      console.log("📊 Total leads:", countResult.rows[0].count);
      
      // Get sample leads
      const leadsResult = await pool.query("SELECT id, name, company, email, status, created_at FROM leads LIMIT 5");
      console.log("\n📋 Sample leads:");
      leadsResult.rows.forEach((lead, i) => {
        console.log(`  ${i + 1}. ${lead.name || lead.company} (${lead.email || 'no email'}) - Status: ${lead.status}`);
      });
      
      // Check for new columns
      const columnsResult = await pool.query(`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'leads' 
        AND column_name IN ('deal_value', 'commission_rate', 'expected_close_date')
      `);
      
      console.log("\n🆕 New sales columns present:", columnsResult.rows.map(r => r.column_name));
    }
    
    // Check for new tables
    const newTablesCheck = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_name IN ('commissions', 'sales_quotas', 'lead_assignments')
    `);
    
    console.log("\n📊 Sales agent tables:", newTablesCheck.rows.map(r => r.table_name));
    
    process.exit(0);
  } catch (error) {
    console.error("❌ Error:", error);
    process.exit(1);
  }
}

checkLeads();



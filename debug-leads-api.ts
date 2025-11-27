import { pool } from "./server/db";

async function debugLeadsAPI() {
  try {
    console.log("🔍 Debugging Leads API...\n");
    
    // 1. Check database connection
    console.log("1️⃣ Testing database connection...");
    const dbTest = await pool.query("SELECT NOW()");
    console.log("✅ Database connected:", dbTest.rows[0].now);
    
    // 2. Check leads table structure
    console.log("\n2️⃣ Checking leads table structure...");
    const columnsResult = await pool.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'leads'
      ORDER BY ordinal_position
    `);
    console.log(`✅ Leads table has ${columnsResult.rows.length} columns`);
    
    // 3. Count leads
    console.log("\n3️⃣ Counting leads...");
    const countResult = await pool.query("SELECT COUNT(*) FROM leads");
    console.log(`✅ Total leads in database: ${countResult.rows[0].count}`);
    
    // 4. Get sample leads with all key fields
    console.log("\n4️⃣ Sample leads data:");
    const leadsResult = await pool.query(`
      SELECT 
        id, 
        name, 
        company, 
        email, 
        status, 
        stage,
        assigned_to_id,
        created_at 
      FROM leads 
      ORDER BY created_at DESC
      LIMIT 5
    `);
    
    leadsResult.rows.forEach((lead, i) => {
      console.log(`\n  Lead ${i + 1}:`);
      console.log(`    ID: ${lead.id}`);
      console.log(`    Name: ${lead.name || 'N/A'}`);
      console.log(`    Company: ${lead.company || 'N/A'}`);
      console.log(`    Email: ${lead.email || 'N/A'}`);
      console.log(`    Status: ${lead.status}`);
      console.log(`    Stage: ${lead.stage}`);
      console.log(`    Assigned To: ${lead.assigned_to_id || 'Unassigned'}`);
    });
    
    // 5. Check new columns
    console.log("\n5️⃣ Checking new sales columns...");
    const newCols = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'leads' 
      AND column_name IN ('deal_value', 'commission_rate', 'expected_close_date')
    `);
    console.log("✅ New columns present:", newCols.rows.map(r => r.column_name).join(", ") || "NONE");
    
    // 6. Check new tables
    console.log("\n6️⃣ Checking new sales tables...");
    const newTables = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_name IN ('commissions', 'sales_quotas', 'lead_assignments')
    `);
    console.log("✅ New tables present:", newTables.rows.map(r => r.table_name).join(", ") || "NONE");
    
    // 7. Test the actual storage.getLeads() function
    console.log("\n7️⃣ Testing storage.getLeads() function...");
    const { DatabaseStorage } = await import("./server/storage");
    const storage = new DatabaseStorage();
    const leads = await storage.getLeads();
    console.log(`✅ storage.getLeads() returned: ${leads.length} leads`);
    
    if (leads.length > 0) {
      console.log("\n  First lead from storage:");
      const first = leads[0];
      console.log(`    ID: ${first.id}`);
      console.log(`    Name: ${first.name || 'N/A'}`);
      console.log(`    Company: ${first.company}`);
      console.log(`    Email: ${first.email || 'N/A'}`);
    }
    
    console.log("\n✅ All checks complete!");
    process.exit(0);
  } catch (error: any) {
    console.error("\n❌ Error:", error.message);
    console.error("Stack:", error.stack);
    process.exit(1);
  }
}

debugLeadsAPI();


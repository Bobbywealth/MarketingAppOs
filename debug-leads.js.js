import pg from 'pg';
const { Pool } = pg;

const DATABASE_URL = "postgresql://mta_database_numw_user:pinUQmpZT4B0OoTDLfpjk5ezKXYhbxoQ@dpg-d3mqutje5dus73c6u6k0-a.oregon-postgres.render.com/mta_database_numw?sslmode=require";

async function runDebug() {
  const pool = new Pool({ connectionString: DATABASE_URL });
  try {
    const res = await pool.query("SELECT COUNT(*) FROM leads");
    console.log("Total leads:", res.rows[0].count);
    
    const sample = await pool.query("SELECT id, name, company, stage, assigned_to_id FROM leads LIMIT 5");
    console.log("Sample leads:", JSON.stringify(sample.rows, null, 2));
    
    const salesAgents = await pool.query("SELECT id, username FROM users WHERE role = 'sales_agent'");
    console.log("Sales agents:", salesAgents.rows);
  } catch (err) {
    console.error(err);
  } finally {
    await pool.end();
  }
}

runDebug();


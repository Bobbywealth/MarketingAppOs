import { pool } from "./server/db";

async function checkSessionsTable() {
  try {
    const res = await pool.query("SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'sessions');");
    console.log("Sessions table exists:", res.rows[0].exists);
    if (res.rows[0].exists) {
      const countRes = await pool.query("SELECT COUNT(*) FROM sessions;");
      console.log("Session count:", countRes.rows[0].count);
    }
  } catch (err) {
    console.error("Error checking sessions table:", err);
  } finally {
    process.exit();
  }
}

checkSessionsTable();

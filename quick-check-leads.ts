import { db } from "./server/db.ts";
import { leads } from "./shared/schema.ts";
import { count } from "drizzle-orm";

async function checkLeads() {
  try {
    const result = await db.select({ value: count() }).from(leads);
    console.log("Total leads in database:", result[0].value);
    
    const allLeads = await db.select().from(leads).limit(5);
    console.log("Sample leads:", JSON.stringify(allLeads, null, 2));
  } catch (error) {
    console.error("Error checking leads:", error);
  } finally {
    process.exit();
  }
}

checkLeads();


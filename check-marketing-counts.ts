import { db } from "./server/db";
import { marketingBroadcasts, marketingBroadcastRecipients } from "./shared/schema";
import { count } from "drizzle-orm";

async function checkCounts() {
  try {
    const broadcastCount = await db.select({ value: count() }).from(marketingBroadcasts);
    const recipientCount = await db.select({ value: count() }).from(marketingBroadcastRecipients);
    console.log(`Broadcasts: ${broadcastCount[0].value}`);
    console.log(`Recipients: ${recipientCount[0].value}`);
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

checkCounts();

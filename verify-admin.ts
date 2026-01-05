import { db } from "./server/db.js";
import { users } from "./shared/schema.js";
import { eq } from "drizzle-orm";

async function verifyAdminAccounts() {
  try {
    console.log("🔍 Finding admin accounts to verify...");
    
    const admins = await db.select().from(users).where(eq(users.role, "admin"));
    
    if (admins.length === 0) {
      console.log("❌ No admin accounts found.");
      process.exit(0);
    }

    for (const admin of admins) {
      if (!admin.emailVerified) {
        await db.update(users)
          .set({ emailVerified: true, emailVerificationToken: null })
          .where(eq(users.id, admin.id));
        console.log(`✅ Verified admin: ${admin.username} (${admin.email})`);
      } else {
        console.log(`ℹ️ Admin ${admin.username} is already verified.`);
      }
    }

    console.log("✨ All admin accounts processed.");
    process.exit(0);
  } catch (error) {
    console.error("❌ Error verifying admin accounts:", error);
    process.exit(1);
  }
}

verifyAdminAccounts();


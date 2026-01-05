import { db } from "./server/db.js";
import { users } from "./shared/schema.js";
import { eq } from "drizzle-orm";
import { scrypt, randomBytes } from "crypto";
import { promisify } from "util";

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function createAdminUser() {
  try {
    const username = (process.env.ADMIN_USERNAME || "admin").trim();
    const password = process.env.ADMIN_PASSWORD;
    const email = (process.env.ADMIN_EMAIL || "admin@marketingteam.app").trim();
    const firstName = (process.env.ADMIN_FIRST_NAME || "Admin").trim();
    const lastName = (process.env.ADMIN_LAST_NAME || "User").trim();

    if (!password || password.trim().length < 8) {
      console.error("❌ ADMIN_PASSWORD is required and must be at least 8 characters.");
      console.error('   Example: ADMIN_PASSWORD="your-strong-password" node --import tsx create-admin.ts');
      process.exit(1);
    }

    const hashedPassword = await hashPassword(password.trim());

    const [existing] = await db.select().from(users).where(eq(users.username, username)).limit(1);

    if (existing) {
      await db
        .update(users)
        .set({
          password: hashedPassword,
          role: "admin",
          email,
          firstName,
          lastName,
          emailVerified: true,
        })
        .where(eq(users.username, username));

      console.log("✅ Admin user updated successfully!");
      console.log(`Username: ${username}`);
      console.log("Password: (updated)"); // do not print secrets
      process.exit(0);
    }

    await db.insert(users).values({
      username,
      password: hashedPassword,
      role: "admin",
      email,
      firstName,
      lastName,
      emailVerified: true,
    });

    console.log("✅ Admin user created successfully!");
    console.log(`Username: ${username}`);
    console.log("Password: (set)"); // do not print secrets
    process.exit(0);
  } catch (error) {
    console.error("❌ Error creating admin user:", error);
    process.exit(1);
  }
}

createAdminUser();



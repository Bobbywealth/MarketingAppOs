import { db } from "./server/db.js";
import { users } from "./shared/schema.js";
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
    const hashedPassword = await hashPassword("admin123");
    
    await db.insert(users).values({
      username: "admin",
      password: hashedPassword,
      role: "admin",
      email: "admin@marketingteam.app",
      firstName: "Admin",
      lastName: "User",
    });
    
    console.log("✅ Admin user created successfully!");
    console.log("Username: admin");
    console.log("Password: admin123");
    console.log("⚠️  Please change this password after first login!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Error creating admin user:", error);
    process.exit(1);
  }
}

createAdminUser();



import pg from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from "@shared/schema";

const { Pool } = pg;

// Get DATABASE_URL, but allow build to proceed without it (runtime check will catch missing value)
const DATABASE_URL = process.env.DATABASE_URL || "";

if (!DATABASE_URL && process.env.NODE_ENV === "production") {
  console.error(
    "WARNING: DATABASE_URL must be set. Database operations will fail.",
  );
}

export const pool = new Pool({ 
  connectionString: DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : undefined
});
export const db = drizzle(pool, { schema });

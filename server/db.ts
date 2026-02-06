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
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : undefined,
  max: 100, // Increased from 20 to 100 for better concurrency
  idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
  connectionTimeoutMillis: 2000, // Return an error after 2 seconds if connection could not be established
});
// Lazy initialization of the drizzle instance to prevent circular dependency errors
// during module loading, especially in bundled environments.
let _db: any = null;

export const db = new Proxy({} as any, {
  get(target, prop, receiver) {
    if (!_db) {
      _db = drizzle(pool, { schema });
    }
    return Reflect.get(_db, prop, receiver);
  }
});

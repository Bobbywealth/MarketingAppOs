import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "@shared/schema";

neonConfig.webSocketConstructor = ws;

// Get DATABASE_URL, but allow build to proceed without it (runtime check will catch missing value)
const DATABASE_URL = process.env.DATABASE_URL || "";

if (!DATABASE_URL && process.env.NODE_ENV === "production") {
  console.error(
    "WARNING: DATABASE_URL must be set. Database operations will fail.",
  );
}

export const pool = new Pool({ connectionString: DATABASE_URL });
export const db = drizzle({ client: pool, schema });

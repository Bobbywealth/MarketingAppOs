import { defineConfig } from "drizzle-kit";

// Allow build to proceed without DATABASE_URL (needed at runtime, not build time)
const databaseUrl = process.env.DATABASE_URL || "postgresql://placeholder";

export default defineConfig({
  out: "./migrations",
  schema: "./shared/schema.ts",
  dialect: "postgresql",
  dbCredentials: {
    url: databaseUrl,
  },
});

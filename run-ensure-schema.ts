import { ensureMinimumSchema } from "./server/ensureSchema.js";

async function main() {
  console.log("🛠️  Running ensureMinimumSchema...");
  await ensureMinimumSchema();
  console.log("✅ ensureMinimumSchema completed!");
  process.exit(0);
}

main().catch(err => {
  console.error("❌ Error running ensureMinimumSchema:", err);
  process.exit(1);
});


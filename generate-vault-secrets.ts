import { randomBytes, scrypt } from "crypto";
import { promisify } from "util";

const scryptAsync = promisify(scrypt);

async function main() {
  const password = process.argv.slice(2).join(" ").trim();
  if (!password) {
    console.error('Usage: node --import tsx generate-vault-secrets.ts "your vault password"');
    process.exit(1);
  }

  // 32-byte master key for AES-256-GCM
  const masterKey = randomBytes(32).toString("base64");

  // Match server/auth.ts format: `${hashHex}.${saltHex}` where hash is scrypt(password, salt, 64)
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  const passwordHash = `${buf.toString("hex")}.${salt}`;

  console.log("");
  console.log("# Password Vault (Admin-only)");
  console.log(`VAULT_MASTER_KEY=${masterKey}`);
  console.log(`VAULT_PASSWORD_HASH=${passwordHash}`);
  console.log("");
  console.log("# Notes:");
  console.log("# - Put these in your .env (do NOT commit).");
  console.log("# - Changing VAULT_MASTER_KEY will make existing vault entries undecryptable.");
  console.log("");
}

main().catch((e) => {
  console.error("Failed to generate secrets:", e?.message || e);
  process.exit(1);
});


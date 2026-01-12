import { randomBytes } from "crypto";
import { eq, ilike } from "drizzle-orm";
import { db } from "./server/db";
import { hashPassword } from "./server/auth";
import { clients, users } from "./shared/schema";

function getArg(name: string): string | undefined {
  const prefix = `--${name}=`;
  const hit = process.argv.find((a) => a.startsWith(prefix));
  return hit ? hit.slice(prefix.length) : undefined;
}

function required(name: string): string {
  const v = getArg(name);
  if (!v) throw new Error(`Missing required arg: --${name}=...`);
  return v;
}

async function ensureUniqueUsername(preferred: string): Promise<string> {
  const base = preferred.trim();
  if (!base) throw new Error("Username cannot be empty");

  // Try the base first; if taken, append a counter.
  let candidate = base;
  for (let i = 0; i < 50; i++) {
    const existing = await db.select({ id: users.id }).from(users).where(eq(users.username, candidate)).limit(1);
    if (existing.length === 0) return candidate;
    candidate = `${base}${i + 1}`;
  }
  throw new Error(`Unable to find unique username for base: ${base}`);
}

async function main() {
  const clientId = getArg("clientId");
  const clientEmail = getArg("clientEmail");
  const loginEmail = required("loginEmail").trim().toLowerCase();
  const stripeCustomerId = getArg("stripeCustomerId");
  const stripeSubscriptionId = getArg("stripeSubscriptionId");

  if (!clientId && !clientEmail) {
    throw new Error("Provide either --clientId=... OR --clientEmail=...");
  }
  if (!stripeCustomerId && !stripeSubscriptionId) {
    throw new Error("Provide at least one of --stripeCustomerId=... or --stripeSubscriptionId=...");
  }

  const matchedClients = clientId
    ? await db.select().from(clients).where(eq(clients.id, clientId)).limit(2)
    : await db.select().from(clients).where(ilike(clients.email, (clientEmail as string).trim())).limit(2);

  if (matchedClients.length === 0) {
    throw new Error(`Client not found (${clientId ? `id=${clientId}` : `email=${clientEmail}`})`);
  }
  if (matchedClients.length > 1) {
    throw new Error(`Multiple clients matched (${clientId ? `id=${clientId}` : `email=${clientEmail}`}); use --clientId=...`);
  }

  const client = matchedClients[0];

  // 1) Link Stripe → Client
  await db
    .update(clients)
    .set({
      stripeCustomerId: stripeCustomerId || client.stripeCustomerId,
      stripeSubscriptionId: stripeSubscriptionId || client.stripeSubscriptionId,
      updatedAt: new Date(),
    })
    .where(eq(clients.id, client.id));

  // 2) Ensure a client user exists for loginEmail and is linked to client.id
  const existingUsers = await db.select().from(users).where(eq(users.email, loginEmail)).limit(2);
  if (existingUsers.length > 1) {
    throw new Error(`Multiple users found with email=${loginEmail}. Please resolve duplicates first.`);
  }

  const existingUser = existingUsers[0];
  if (existingUser) {
    if (existingUser.role !== "client") {
      throw new Error(`User with email=${loginEmail} exists but role=${existingUser.role}. Refusing to modify.`);
    }
    await db
      .update(users)
      .set({
        clientId: client.id,
        updatedAt: new Date(),
      })
      .where(eq(users.id, existingUser.id));
  } else {
    // Make username=email so "Email or Username" login works even in older builds.
    const username = await ensureUniqueUsername(loginEmail);
    const tempPassword = `${randomBytes(12).toString("hex")}A!`;
    const hashed = await hashPassword(tempPassword);

    await db.insert(users).values({
      username,
      password: hashed,
      email: loginEmail,
      role: "client",
      clientId: client.id,
    });
  }

  console.log("✅ Linked existing paying client");
  console.log(`   Client: ${client.name} (${client.id})`);
  console.log(`   CRM Login Email: ${loginEmail}`);
  console.log(`   Stripe Customer: ${stripeCustomerId || client.stripeCustomerId || "unchanged"}`);
  console.log(`   Stripe Subscription: ${stripeSubscriptionId || client.stripeSubscriptionId || "unchanged"}`);
  console.log("");
  console.log("Next steps for the client:");
  console.log("- Go to /login and sign in with their email (or username).");
  console.log('- If they don’t know the password, click "Forgot?" and reset via email.');
}

main().catch((err) => {
  console.error("❌ Failed:", err?.message || err);
  process.exit(1);
});


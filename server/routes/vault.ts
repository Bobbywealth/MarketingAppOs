import { Router } from "express";
import { z } from "zod";
import { createCipheriv, createDecipheriv, randomBytes } from "crypto";
import { db } from "../db";
import { passwordVaultItems } from "@shared/schema";
import { desc, eq } from "drizzle-orm";
import { isAuthenticated, comparePasswords } from "../auth";
import { requireRole } from "../rbac";
import { UserRole } from "@shared/roles";

type AuthedRequest = any;

const VAULT_UNLOCK_MS = 15 * 60 * 1000; // 15 minutes

function getMasterKey(): Buffer {
  const raw = process.env.VAULT_MASTER_KEY;
  if (!raw) throw new Error("VAULT_MASTER_KEY is not set");

  // Accept 32-byte base64 or 64-char hex for convenience.
  const key =
    /^[0-9a-f]{64}$/i.test(raw.trim())
      ? Buffer.from(raw.trim(), "hex")
      : Buffer.from(raw.trim(), "base64");

  if (key.length !== 32) {
    throw new Error("VAULT_MASTER_KEY must be 32 bytes (base64) or 64 hex chars");
  }
  return key;
}

function encryptString(plaintext: string): string {
  const key = getMasterKey();
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const ciphertext = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `v1:${iv.toString("base64")}:${tag.toString("base64")}:${ciphertext.toString("base64")}`;
}

function decryptString(payload: string): string {
  const key = getMasterKey();
  const parts = String(payload || "").split(":");
  if (parts.length !== 4 || parts[0] !== "v1") {
    throw new Error("Unsupported vault ciphertext format");
  }
  const iv = Buffer.from(parts[1], "base64");
  const tag = Buffer.from(parts[2], "base64");
  const ciphertext = Buffer.from(parts[3], "base64");
  const decipher = createDecipheriv("aes-256-gcm", key, iv);
  decipher.setAuthTag(tag);
  const plaintext = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
  return plaintext.toString("utf8");
}

function requireVaultUnlocked(req: AuthedRequest, res: any, next: any) {
  const until = Number((req as any)?.session?.vaultUnlockedUntil || 0);
  if (!until || until <= Date.now()) {
    return res.status(403).json({ message: "Vault is locked", needsUnlock: true });
  }
  next();
}

const unlockSchema = z.object({
  password: z.string().min(1),
});

const createItemSchema = z.object({
  name: z.string().min(1).max(200),
  username: z.string().max(300).optional().nullable(),
  url: z.string().max(2000).optional().nullable(),
  password: z.string().min(1).max(5000),
  notes: z.string().max(20000).optional().nullable(),
});

const updateItemSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  username: z.string().max(300).optional().nullable(),
  url: z.string().max(2000).optional().nullable(),
  password: z.string().max(5000).optional(),
  notes: z.string().max(20000).optional().nullable(),
});

export const vaultRouter = Router();

// All vault routes are admin-only (and most require an additional "vault unlock")
vaultRouter.use(isAuthenticated, requireRole(UserRole.ADMIN));

vaultRouter.get("/status", (req: AuthedRequest, res) => {
  const until = Number((req as any)?.session?.vaultUnlockedUntil || 0);
  res.json({
    unlocked: !!until && until > Date.now(),
    unlockedUntil: until || null,
  });
});

vaultRouter.post("/unlock", async (req: AuthedRequest, res) => {
  try {
    const { password } = unlockSchema.parse(req.body);
    const storedHash = process.env.VAULT_PASSWORD_HASH;
    if (!storedHash) {
      return res.status(500).json({
        message: "Vault password is not configured (missing VAULT_PASSWORD_HASH)",
      });
    }

    const ok = await comparePasswords(password, storedHash);
    if (!ok) {
      return res.status(401).json({ message: "Invalid vault password" });
    }

    (req as any).session.vaultUnlockedUntil = Date.now() + VAULT_UNLOCK_MS;
    try {
      await new Promise<void>((resolve, reject) => {
        (req as any).session.save((err: any) => (err ? reject(err) : resolve()));
      });
    } catch {}

    return res.json({
      ok: true,
      unlockedUntil: (req as any).session.vaultUnlockedUntil,
    });
  } catch (e: any) {
    return res.status(400).json({ message: e?.message || "Invalid request" });
  }
});

vaultRouter.post("/lock", async (req: AuthedRequest, res) => {
  (req as any).session.vaultUnlockedUntil = 0;
  try {
    await new Promise<void>((resolve) => (req as any).session.save(() => resolve()));
  } catch {}
  res.json({ ok: true });
});

vaultRouter.get("/items", requireVaultUnlocked, async (_req: AuthedRequest, res) => {
  try {
    const rows = await db
      .select()
      .from(passwordVaultItems)
      .orderBy(desc(passwordVaultItems.updatedAt), desc(passwordVaultItems.createdAt));

    const items = rows.map((r: any) => ({
      id: r.id,
      name: r.name,
      username: r.username,
      url: r.url,
      password: decryptString(r.passwordEncrypted),
      notes: r.notesEncrypted ? decryptString(r.notesEncrypted) : "",
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
      createdBy: r.createdBy,
    }));

    res.json(items);
  } catch (e: any) {
    res.status(500).json({ message: e?.message || "Failed to load vault items" });
  }
});

vaultRouter.post("/items", requireVaultUnlocked, async (req: AuthedRequest, res) => {
  try {
    const data = createItemSchema.parse(req.body);
    const userId = (req.user as any)?.id ?? null;

    const [created] = await db
      .insert(passwordVaultItems)
      .values({
        name: data.name,
        username: data.username ?? null,
        url: data.url ?? null,
        passwordEncrypted: encryptString(data.password),
        notesEncrypted: data.notes ? encryptString(data.notes) : null,
        createdBy: typeof userId === "number" ? userId : null,
        updatedAt: new Date(),
      })
      .returning();

    res.status(201).json({ id: created.id });
  } catch (e: any) {
    res.status(400).json({ message: e?.message || "Failed to create vault item" });
  }
});

vaultRouter.patch("/items/:id", requireVaultUnlocked, async (req: AuthedRequest, res) => {
  try {
    const id = String(req.params.id || "");
    if (!id) return res.status(400).json({ message: "Missing id" });

    const patch = updateItemSchema.parse(req.body);
    const set: any = { updatedAt: new Date() };
    if (typeof patch.name === "string") set.name = patch.name;
    if (patch.username !== undefined) set.username = patch.username ?? null;
    if (patch.url !== undefined) set.url = patch.url ?? null;
    if (typeof patch.password === "string") set.passwordEncrypted = encryptString(patch.password);
    if (patch.notes !== undefined) set.notesEncrypted = patch.notes ? encryptString(patch.notes) : null;

    await db.update(passwordVaultItems).set(set).where(eq(passwordVaultItems.id, id));
    res.json({ ok: true });
  } catch (e: any) {
    res.status(400).json({ message: e?.message || "Failed to update vault item" });
  }
});

vaultRouter.delete("/items/:id", requireVaultUnlocked, async (req: AuthedRequest, res) => {
  try {
    const id = String(req.params.id || "");
    if (!id) return res.status(400).json({ message: "Missing id" });

    await db.delete(passwordVaultItems).where(eq(passwordVaultItems.id, id));
    res.json({ ok: true });
  } catch (e: any) {
    res.status(400).json({ message: e?.message || "Failed to delete vault item" });
  }
});


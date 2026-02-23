import { randomBytes, createHash, timingSafeEqual } from "crypto";
import type { Request } from "express";
import { storage } from "./storage";
import type { User } from "@shared/schema";

const API_KEY_PREFIX = "mka";

function toSha256Hex(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

export function generateApiKey(): {
  plaintextKey: string;
  keyPrefix: string;
  keyHash: string;
} {
  const publicPrefix = randomBytes(6).toString("hex");
  const secret = randomBytes(32).toString("base64url");
  const plaintextKey = `${API_KEY_PREFIX}_${publicPrefix}_${secret}`;

  return {
    plaintextKey,
    keyPrefix: `${API_KEY_PREFIX}_${publicPrefix}`,
    keyHash: toSha256Hex(plaintextKey),
  };
}

function extractApiKeyFromRequest(req: Request): string | null {
  const headerKey = req.header("x-api-key")?.trim();
  if (headerKey) return headerKey;

  const authHeader = req.header("authorization")?.trim();
  if (!authHeader) return null;

  const [scheme, token] = authHeader.split(" ");
  if (!scheme || !token) return null;
  if (scheme.toLowerCase() !== "bearer") return null;

  return token.trim();
}

function safeStringEqual(a: string, b: string): boolean {
  const aBuf = Buffer.from(a);
  const bBuf = Buffer.from(b);
  if (aBuf.length !== bBuf.length) return false;
  return timingSafeEqual(aBuf, bBuf);
}

export async function authenticateRequestWithApiKey(req: Request): Promise<User | null> {
  const suppliedApiKey = extractApiKeyFromRequest(req);
  if (!suppliedApiKey) return null;

  const suppliedHash = toSha256Hex(suppliedApiKey);
  const apiKeyRecord = await storage.getApiKeyByHash(suppliedHash);
  if (!apiKeyRecord) return null;

  if (!safeStringEqual(apiKeyRecord.keyHash, suppliedHash)) {
    return null;
  }

  if (apiKeyRecord.expiresAt && apiKeyRecord.expiresAt <= new Date()) {
    return null;
  }

  const user = await storage.getUser(String(apiKeyRecord.userId));
  if (!user) {
    return null;
  }

  await storage.touchApiKeyLastUsed(apiKeyRecord.id);

  // Populate legacy auth shape used by some handlers so API key auth can
  // access the same endpoints as session auth without special-casing.
  (user as any).claims = { ...(user as any).claims, sub: String(user.id) };
  (req as any).userId = Number(user.id);
  (req as any).userRole = user.role;

  (req as any).apiKey = {
    id: apiKeyRecord.id,
    keyPrefix: apiKeyRecord.keyPrefix,
    scopes: apiKeyRecord.scopes,
    userId: apiKeyRecord.userId,
  };

  return user;
}

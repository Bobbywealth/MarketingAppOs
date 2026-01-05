import { Router, Request, Response } from "express";
import { db } from "../db";
import { 
  socialAccounts, 
  socialAccountMetricsSnapshots, 
  insertSocialAccountSchema, 
  InsertSocialAccount 
} from "@shared/schema";
import { eq, and, desc, gte } from "drizzle-orm";
import { isAuthenticated } from "../auth";
import { fetchSocialProfile } from "../scrapeCreatorsService";
import { z } from "zod";

const router = Router();

// In-memory lock for concurrent refreshes
const refreshLocks = new Set<string>();

// Cooldown window in minutes
const SOCIAL_REFRESH_COOLDOWN_MINUTES = parseInt(process.env.SOCIAL_REFRESH_COOLDOWN_MINUTES || "30");

// Helper to check if user has access to client
async function checkClientAccess(req: Request, clientId: string) {
  const user = req.user as any;
  if (user.role === "admin") return true;
  if (user.role === "client" && user.clientId === clientId) return true;
  return false;
}

async function performRefresh(accountId: string, ignoreCooldown: boolean = false) {
  const [account] = await db.select().from(socialAccounts).where(eq(socialAccounts.id, accountId)).limit(1);
  if (!account) throw new Error("Account not found");

  // 1. Concurrency control
  if (refreshLocks.has(accountId)) {
    throw new Error("Refresh already in progress");
  }

  // 2. Rate limiting (cooldown) - unless ignored (admin)
  if (!ignoreCooldown && account.lastScrapedAt) {
    const now = new Date();
    const lastScraped = new Date(account.lastScrapedAt);
    const diffMs = now.getTime() - lastScraped.getTime();
    const diffMin = diffMs / (1000 * 60);

    if (diffMin < SOCIAL_REFRESH_COOLDOWN_MINUTES) {
      const remaining = Math.ceil(SOCIAL_REFRESH_COOLDOWN_MINUTES - diffMin);
      throw new Error(`COOLDOWN:${remaining}`);
    }
  }

  // Set lock
  refreshLocks.add(accountId);

  try {
    // 3. Fetch from ScrapeCreators
    const data = await fetchSocialProfile(account.platform, account.handle);
    const capturedAt = new Date();

    // 4. Store snapshot
    await db.insert(socialAccountMetricsSnapshots).values({
      socialAccountId: accountId,
      capturedAt,
      followers: data.followers,
      following: data.following,
      postsCount: data.postsCount,
      likesCount: data.likesCount,
      viewsCount: data.viewsCount,
      rawPayload: data.rawPayload,
    });

    // 5. Update account
    const [updated] = await db.update(socialAccounts)
      .set({
        displayName: data.displayName || account.displayName,
        profileUrl: data.profileUrl || account.profileUrl,
        lastScrapedAt: capturedAt,
        status: "active",
        lastError: null,
        updatedAt: capturedAt,
      })
      .where(eq(socialAccounts.id, accountId))
      .returning();

    return updated;
  } catch (scrapeError: any) {
    console.error(`Scrape error for account ${accountId}:`, scrapeError);
    
    await db.update(socialAccounts)
      .set({
        status: "error",
        lastError: scrapeError.message || "Failed to fetch data",
        updatedAt: new Date(),
      })
      .where(eq(socialAccounts.id, accountId));

    throw scrapeError;
  } finally {
    // Release lock
    refreshLocks.delete(accountId);
  }
}

// GET /api/social/accounts
router.get("/accounts", isAuthenticated, async (req: Request, res: Response) => {
  try {
    const user = req.user as any;
    let query = db.select().from(socialAccounts);
    
    if (user.role !== "admin") {
      if (!user.clientId) return res.json([]);
      query = query.where(eq(socialAccounts.clientId, user.clientId)) as any;
    }
    
    const accounts = await query;
    res.json(accounts);
  } catch (error) {
    console.error("Error fetching social accounts:", error);
    res.status(500).json({ message: "Failed to fetch social accounts" });
  }
});

// POST /api/social/accounts
router.post("/accounts", isAuthenticated, async (req: Request, res: Response) => {
  try {
    const user = req.user as any;
    const clientId = user.role === "admin" ? req.body.clientId : user.clientId;
    
    if (!clientId) {
      return res.status(400).json({ message: "Client ID is required" });
    }

    const validatedData = insertSocialAccountSchema.parse({
      ...req.body,
      clientId,
      handle: req.body.handle.replace(/^@/, ""), // Remove @ if present
    });

    const [account] = await db.insert(socialAccounts).values(validatedData).returning();
    res.status(201).json(account);
  } catch (error) {
    console.error("Error creating social account:", error);
    res.status(400).json({ message: "Invalid data" });
  }
});

// PATCH /api/social/accounts/:id
router.patch("/accounts/:id", isAuthenticated, async (req: Request, res: Response) => {
  try {
    const [account] = await db.select().from(socialAccounts).where(eq(socialAccounts.id, req.params.id)).limit(1);
    if (!account) return res.status(404).json({ message: "Account not found" });

    if (!await checkClientAccess(req, account.clientId)) {
      return res.status(403).json({ message: "Forbidden" });
    }

    const [updated] = await db.update(socialAccounts)
      .set({ 
        status: req.body.status,
        updatedAt: new Date()
      })
      .where(eq(socialAccounts.id, req.params.id))
      .returning();
    
    res.json(updated);
  } catch (error) {
    console.error("Error updating social account:", error);
    res.status(500).json({ message: "Failed to update social account" });
  }
});

// DELETE /api/social/accounts/:id
router.delete("/accounts/:id", isAuthenticated, async (req: Request, res: Response) => {
  try {
    const [account] = await db.select().from(socialAccounts).where(eq(socialAccounts.id, req.params.id)).limit(1);
    if (!account) return res.status(404).json({ message: "Account not found" });

    if (!await checkClientAccess(req, account.clientId)) {
      return res.status(403).json({ message: "Forbidden" });
    }

    await db.delete(socialAccountMetricsSnapshots).where(eq(socialAccountMetricsSnapshots.socialAccountId, req.params.id));
    await db.delete(socialAccounts).where(eq(socialAccounts.id, req.params.id));
    
    res.status(204).end();
  } catch (error) {
    console.error("Error deleting social account:", error);
    res.status(500).json({ message: "Failed to delete social account" });
  }
});

// GET /api/social/metrics
router.get("/metrics", isAuthenticated, async (req: Request, res: Response) => {
  try {
    const accountId = req.query.accountId as string;
    const range = (req.query.range as string) || "30d";
    
    if (!accountId) return res.status(400).json({ message: "Account ID is required" });

    const [account] = await db.select().from(socialAccounts).where(eq(socialAccounts.id, accountId)).limit(1);
    if (!account) return res.status(404).json({ message: "Account not found" });

    if (!await checkClientAccess(req, account.clientId)) {
      return res.status(403).json({ message: "Forbidden" });
    }

    const days = range === "7d" ? 7 : range === "90d" ? 90 : 30;
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);

    const snapshots = await db.select()
      .from(socialAccountMetricsSnapshots)
      .where(
        and(
          eq(socialAccountMetricsSnapshots.socialAccountId, accountId),
          gte(socialAccountMetricsSnapshots.capturedAt, cutoff)
        )
      )
      .orderBy(desc(socialAccountMetricsSnapshots.capturedAt));

    res.json({ account, snapshots });
  } catch (error) {
    console.error("Error fetching metrics:", error);
    res.status(500).json({ message: "Failed to fetch metrics" });
  }
});

// POST /api/social/accounts/:id/refresh
router.post("/accounts/:id/refresh", isAuthenticated, async (req: Request, res: Response) => {
  try {
    const updated = await performRefresh(req.params.id);
    res.json(updated);
  } catch (error: any) {
    if (error.message.startsWith("COOLDOWN:")) {
      const remaining = parseInt(error.message.split(":")[1]);
      return res.status(429).json({ 
        message: `You can update again in ${remaining} minutes.`,
        cooldownRemaining: remaining
      });
    }
    if (error.message === "Refresh already in progress") {
      return res.status(429).json({ message: error.message });
    }
    res.status(500).json({ message: error.message || "Failed to refresh social data" });
  }
});

// Admin endpoints
router.get("/admin/accounts", isAuthenticated, async (req: Request, res: Response) => {
  const user = req.user as any;
  if (user.role !== "admin") return res.status(403).json({ message: "Forbidden" });

  try {
    const clientId = req.query.clientId as string;
    let query = db.select().from(socialAccounts);
    if (clientId) {
      query = query.where(eq(socialAccounts.clientId, clientId)) as any;
    }
    const accounts = await query;
    res.json(accounts);
  } catch (error) {
    console.error("Error fetching admin social accounts:", error);
    res.status(500).json({ message: "Failed to fetch social accounts" });
  }
});

router.post("/admin/accounts/:id/refresh", isAuthenticated, async (req: Request, res: Response) => {
  const user = req.user as any;
  if (user.role !== "admin") return res.status(403).json({ message: "Forbidden" });

  try {
    const updated = await performRefresh(req.params.id, true); // Admin bypasses cooldown
    res.json(updated);
  } catch (error: any) {
    res.status(500).json({ message: error.message || "Failed to refresh social data" });
  }
});

export default router;

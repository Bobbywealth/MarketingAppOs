import { Router, Request, Response } from "express";
import { storage } from "../storage";
import { db, pool } from "../db";
import { creators, creatorVisits, clientCreators, clients, users } from "@shared/schema";
import { eq, and, or, sql } from "drizzle-orm";
import { isAuthenticated } from "../auth";
import { hashPassword } from "../auth";
import { requireRole, UserRole } from "../rbac";
import { 
  handleValidationError
} from "./common";
import { z } from "zod";
import { insertCreatorSchema, insertCreatorVisitSchema } from "@shared/schema";

const router = Router();

const internalRoles = [UserRole.ADMIN, UserRole.MANAGER, UserRole.STAFF, UserRole.CREATOR_MANAGER] as const;

// Public creator application endpoint
router.post("/creators/apply", async (req: Request, res: Response) => {
  try {
    const schema = z.object({
      fullName: z.string().min(1, "Full name is required"),
      phone: z.string().optional().nullable(),
      email: z.string().email("Valid email is required").optional().nullable(),
      homeCity: z.string().optional().nullable(),
      baseZip: z.string().optional().nullable(),
      serviceZipCodes: z.array(z.string()).optional().nullable(),
      serviceRadiusMiles: z.number().int().positive().optional().nullable(),
      ratePerVisitCents: z.number().int().positive().optional().nullable(),
      availabilityNotes: z.string().optional().nullable(),
    });
    const data = schema.parse(req.body);
    
    const [created] = await db
      .insert(creators)
      .values({
        fullName: data.fullName,
        phone: data.phone ?? null,
        email: data.email ?? null,
        homeCity: data.homeCity ?? null,
        baseZip: data.baseZip ?? null,
        serviceZipCodes: data.serviceZipCodes ?? null,
        serviceRadiusMiles: data.serviceRadiusMiles ?? null,
        ratePerVisitCents: data.ratePerVisitCents ?? 7500,
        availabilityNotes: data.availabilityNotes ?? null,
        status: "inactive",
        performanceScore: "5.0",
        notes: `[PENDING APPLICATION] Submitted via public creator signup form on ${new Date().toISOString()}.`,
      } as any)
      .returning();

    res.status(201).json({ success: true, id: created.id });
  } catch (error: any) {
    handleValidationError(error, res);
  }
});

/**
 * Public creator SIGNUP endpoint:
 * - Creates a creators row (status: inactive, pending notes)
 * - Creates a users row with role=creator and creatorId linked
 * - Logs the user in (session cookie) so they can immediately access creator dashboard
 */
router.post("/creators/signup", async (req: Request, res: Response, next: any) => {
  try {
    const schema = z.object({
      fullName: z.string().min(1, "Full name is required"),
      phone: z.string().min(1, "Phone is required"),
      email: z.string().email("Valid email is required"),
      password: z.string().min(8, "Password must be at least 8 characters"),

      homeCity: z.string().optional().nullable(),
      baseZip: z.string().optional().nullable(),
      serviceZipCodes: z.array(z.string()).optional().nullable(),
      serviceRadiusMiles: z.number().int().positive().optional().nullable(),
      ratePerVisitCents: z.number().int().positive().optional().nullable(),
      availabilityNotes: z.string().optional().nullable(),
    });

    const data = schema.parse(req.body);

    const normalizedEmail = data.email.trim().toLowerCase();
    const username = normalizedEmail; // creators log in with their email in the username field

    const nameParts = data.fullName.trim().split(/\s+/).filter(Boolean);
    const firstName = nameParts[0] || data.fullName.trim();
    const lastName = nameParts.length > 1 ? nameParts.slice(1).join(" ") : null;

    const hashedPassword = await hashPassword(data.password);

    let createdUser: any = null;
    let createdCreator: any = null;

    await db.transaction(async (tx) => {
      // Prevent duplicate accounts (by username/email).
      const existing = await tx
        .select({ id: users.id })
        .from(users)
        .where(or(eq(users.username, username), eq(users.email, normalizedEmail)))
        .limit(1);

      if (existing.length > 0) {
        const err: any = new Error("An account already exists for this email. Please log in instead.");
        err.status = 409;
        throw err;
      }

      // Create creator profile
      const [creator] = await tx
        .insert(creators)
        .values({
          fullName: data.fullName.trim(),
          phone: data.phone.trim(),
          email: normalizedEmail,
          homeCity: data.homeCity?.trim() || null,
          baseZip: data.baseZip?.trim() || null,
          serviceZipCodes: data.serviceZipCodes ?? null,
          serviceRadiusMiles: data.serviceRadiusMiles ?? null,
          ratePerVisitCents: data.ratePerVisitCents ?? 7500,
          availabilityNotes: data.availabilityNotes?.trim() || null,
          status: "inactive",
          performanceScore: "5.0",
          notes: `[PENDING APPLICATION] Creator account created via public signup on ${new Date().toISOString()}.`,
        } as any)
        .returning();

      createdCreator = creator;

      // Create login user linked to creator
      const [user] = await tx
        .insert(users)
        .values({
          username,
          password: hashedPassword,
          email: normalizedEmail,
          firstName,
          lastName,
          role: UserRole.CREATOR,
          creatorId: creator.id,
        } as any)
        .returning();

      createdUser = user;
    });

    // Auto-login creator after successful signup
    req.login(createdUser, (err: any) => {
      if (err) return next(err);
      res.status(201).json({
        id: createdUser.id,
        username: createdUser.username,
        email: createdUser.email,
        firstName: createdUser.firstName,
        lastName: createdUser.lastName,
        profileImageUrl: (createdUser as any).profileImageUrl,
        role: createdUser.role,
        customPermissions: createdUser.customPermissions,
        creatorId: createdUser.creatorId,
        createdAt: createdUser.createdAt,
        updatedAt: (createdUser as any).updatedAt,
        // Helpful metadata for client UX (not required)
        creatorProfileId: createdCreator?.id,
      });
    });
  } catch (error: any) {
    if (error?.status === 409) {
      return res.status(409).json({ message: error.message });
    }
    handleValidationError(error, res);
  }
});

// Internal creator management
router.get("/creators", isAuthenticated, requireRole(...internalRoles), async (req: Request, res: Response) => {
  try {
    const { city, zip, status, minScore } = req.query as any;
    const user = req.user as any;

    // If a creator is logged in, they can only see their own profile in a list if we allowed them, 
    // but this is an internal management route. 
    // However, if we want creators to see their own info, we might need a /me endpoint or similar.
    // For now, let's keep this internal.

    const conditions: any[] = [];
    if (city) conditions.push(eq(creators.homeCity, String(city)));
    if (zip) conditions.push(or(eq(creators.baseZip, String(zip)), sql`${creators.serviceZipCodes} @> ARRAY[${String(zip)}]::text[]`));
    if (status) conditions.push(eq(creators.status, String(status)));
    if (minScore) conditions.push(sql`${creators.performanceScore} >= ${String(minScore)}`);

    let q = db.select().from(creators);
    if (conditions.length > 0) q = (q as any).where(and(...conditions));
    const rows = await (q as any).orderBy(sql`${creators.createdAt} DESC`);
    res.json(rows);
  } catch (error: any) {
    res.status(500).json({ message: error.message || "Failed to fetch creators" });
  }
});

router.post("/creators", isAuthenticated, requireRole(...internalRoles), async (req: Request, res: Response) => {
  try {
    const data = insertCreatorSchema.parse(req.body);
    const [created] = await db.insert(creators).values(data).returning();
    res.status(201).json(created);
  } catch (error: any) {
    handleValidationError(error, res);
  }
});

router.get("/creators/:id", isAuthenticated, requireRole(...internalRoles), async (req: Request, res: Response) => {
  try {
    const [row] = await db.select().from(creators).where(eq(creators.id, req.params.id));
    if (!row) return res.status(404).json({ message: "Creator not found" });
    res.json(row);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

router.patch("/creators/:id", isAuthenticated, requireRole(...internalRoles), async (req: Request, res: Response) => {
  try {
    const data = insertCreatorSchema.partial().parse(req.body);
    const [updated] = await db.update(creators).set(data).where(eq(creators.id, req.params.id)).returning();
    if (!updated) return res.status(404).json({ message: "Creator not found" });
    res.json(updated);
  } catch (error: any) {
    handleValidationError(error, res);
  }
});

router.delete("/creators/:id", isAuthenticated, requireRole(UserRole.ADMIN), async (req: Request, res: Response) => {
  try {
    const [deleted] = await db.delete(creators).where(eq(creators.id, req.params.id)).returning();
    if (!deleted) return res.status(404).json({ message: "Creator not found" });
    res.status(204).send();
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// Visits routes
router.get("/visits", isAuthenticated, requireRole(...internalRoles, UserRole.CREATOR), async (req: Request, res: Response) => {
  try {
    const user = req.user as any;
    let { clientId, creatorId, status, from, to, uploadOverdue, approved, disputeStatus } = req.query as any;

    // Enforcement: Creators can ONLY see their own visits
    if (user.role === UserRole.CREATOR) {
      if (!user.creatorId) {
        return res.status(403).json({ message: "No creator ID associated with this user" });
      }
      creatorId = user.creatorId;
    }

    const conditions: any[] = [];
    if (clientId) conditions.push(eq(creatorVisits.clientId, String(clientId)));
    if (creatorId) conditions.push(eq(creatorVisits.creatorId, String(creatorId)));
    if (status) conditions.push(eq(creatorVisits.status, String(status)));
    if (approved !== undefined) conditions.push(eq(creatorVisits.approved, approved === "true"));
    if (disputeStatus) conditions.push(eq(creatorVisits.disputeStatus, String(disputeStatus)));
    if (uploadOverdue === "true") conditions.push(eq(creatorVisits.uploadOverdue, true));
    if (from) conditions.push(sql`${creatorVisits.scheduledStart} >= ${new Date(String(from)).toISOString()}`);
    if (to) conditions.push(sql`${creatorVisits.scheduledStart} <= ${new Date(String(to)).toISOString()}`);

    let q = db
      .select({
        id: creatorVisits.id,
        clientId: creatorVisits.clientId,
        creatorId: creatorVisits.creatorId,
        scheduledStart: creatorVisits.scheduledStart,
        scheduledEnd: creatorVisits.scheduledEnd,
        status: creatorVisits.status,
        completedAt: creatorVisits.completedAt,
        uploadReceived: creatorVisits.uploadReceived,
        uploadLinks: creatorVisits.uploadLinks,
        approved: creatorVisits.approved,
        disputeStatus: creatorVisits.disputeStatus,
        paymentReleased: creatorVisits.paymentReleased,
        clientName: clients.name,
        creatorName: creators.fullName,
      })
      .from(creatorVisits)
      .innerJoin(clients, eq(creatorVisits.clientId, clients.id))
      .innerJoin(creators, eq(creatorVisits.creatorId, creators.id));

    if (conditions.length > 0) q = (q as any).where(and(...conditions));
    const rows = await (q as any).orderBy(sql`${creatorVisits.scheduledStart} DESC`).limit(500);
    res.json(rows);
  } catch (error: any) {
    res.status(500).json({ message: error.message || "Failed to fetch visits" });
  }
});

router.post("/visits", isAuthenticated, requireRole(...internalRoles), async (req: Request, res: Response) => {
  try {
    const data = insertCreatorVisitSchema.parse(req.body);
    const [created] = await db.insert(creatorVisits).values(data).returning();
    res.status(201).json(created);
  } catch (error: any) {
    handleValidationError(error, res);
  }
});

router.get("/visits/:id", isAuthenticated, requireRole(...internalRoles), async (req: Request, res: Response) => {
  try {
    const [row] = await db
      .select({
        id: creatorVisits.id,
        clientId: creatorVisits.clientId,
        creatorId: creatorVisits.creatorId,
        scheduledStart: creatorVisits.scheduledStart,
        scheduledEnd: creatorVisits.scheduledEnd,
        status: creatorVisits.status,
        completedAt: creatorVisits.completedAt,
        uploadReceived: creatorVisits.uploadReceived,
        uploadLinks: creatorVisits.uploadLinks,
        approved: creatorVisits.approved,
        qualityScore: creatorVisits.qualityScore,
        qualityDetailedScore: creatorVisits.qualityDetailedScore,
        revisionRequested: creatorVisits.revisionRequested,
        revisionNotes: creatorVisits.revisionNotes,
        disputeStatus: creatorVisits.disputeStatus,
        paymentReleased: creatorVisits.paymentReleased,
        notes: creatorVisits.notes,
        clientName: clients.name,
        creatorName: creators.fullName,
      })
      .from(creatorVisits)
      .innerJoin(clients, eq(creatorVisits.clientId, clients.id))
      .innerJoin(creators, eq(creatorVisits.creatorId, creators.id))
      .where(eq(creatorVisits.id, req.params.id));
    
    if (!row) return res.status(404).json({ message: "Visit not found" });
    res.json(row);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

router.patch("/visits/:id", isAuthenticated, requireRole(...internalRoles), async (req: Request, res: Response) => {
  try {
    const data = insertCreatorVisitSchema.partial().parse(req.body);
    const [updated] = await db.update(creatorVisits).set(data).where(eq(creatorVisits.id, req.params.id)).returning();
    if (!updated) return res.status(404).json({ message: "Visit not found" });
    res.json(updated);
  } catch (error: any) {
    handleValidationError(error, res);
  }
});

// Visit actions
router.post("/visits/:id/complete", isAuthenticated, requireRole(...internalRoles), async (req: Request, res: Response) => {
  try {
    const [updated] = await db
      .update(creatorVisits)
      .set({ status: "completed", completedAt: new Date() })
      .where(eq(creatorVisits.id, req.params.id))
      .returning();
    res.json(updated);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

router.post("/visits/:id/upload", isAuthenticated, requireRole(...internalRoles), async (req: Request, res: Response) => {
  try {
    const { uploadLinks } = req.body;
    const [updated] = await db
      .update(creatorVisits)
      .set({ 
        uploadLinks, 
        uploadReceived: true, 
        uploadTimestamp: new Date(),
        status: "completed"
      })
      .where(eq(creatorVisits.id, req.params.id))
      .returning();
    res.json(updated);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

router.post("/visits/:id/approve", isAuthenticated, requireRole(UserRole.ADMIN, UserRole.MANAGER), async (req: Request, res: Response) => {
  try {
    const { qualityScore, qualityDetailedScore } = req.body;
    const user = req.user as any;
    const [updated] = await db
      .update(creatorVisits)
      .set({ 
        approved: true, 
        approvedBy: user.id,
        qualityScore,
        qualityDetailedScore,
        revisionRequested: false
      })
      .where(eq(creatorVisits.id, req.params.id))
      .returning();
    res.json(updated);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

router.post("/visits/:id/release-payment", isAuthenticated, requireRole(UserRole.ADMIN), async (req: Request, res: Response) => {
  try {
    const [updated] = await db
      .update(creatorVisits)
      .set({ 
        paymentReleased: true, 
        paymentReleasedAt: new Date()
      })
      .where(eq(creatorVisits.id, req.params.id))
      .returning();
    res.json(updated);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

router.post("/visits/:id/request-revision", isAuthenticated, requireRole(UserRole.ADMIN, UserRole.MANAGER), async (req: Request, res: Response) => {
  try {
    const { revisionNotes } = req.body;
    const [updated] = await db
      .update(creatorVisits)
      .set({ 
        revisionRequested: true, 
        revisionNotes,
        approved: false
      })
      .where(eq(creatorVisits.id, req.params.id))
      .returning();
    res.json(updated);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

router.post("/visits/:id/dispute", isAuthenticated, requireRole(...internalRoles), async (req: Request, res: Response) => {
  try {
    const { disputeStatus } = req.body;
    const [updated] = await db
      .update(creatorVisits)
      .set({ disputeStatus })
      .where(eq(creatorVisits.id, req.params.id))
      .returning();
    res.json(updated);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

export default router;

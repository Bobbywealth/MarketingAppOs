import { Router, Request, Response } from "express";
import { storage } from "../storage";
import { db, pool } from "../db";
import { creators, creatorVisits, clientCreators, clients, users } from "@shared/schema";
import { eq, and, or, sql } from "drizzle-orm";
import { isAuthenticated } from "../auth";
import { hashPassword } from "../auth";
import { requireRole } from "../rbac";
import { UserRole } from "@shared/roles";
import { 
  handleValidationError
} from "./common";
import { z } from "zod";
import { insertCreatorSchema, insertCreatorVisitSchema } from "@shared/schema";

const router = Router();

const internalRoles = [UserRole.ADMIN, UserRole.MANAGER, UserRole.STAFF, UserRole.CREATOR_MANAGER] as const;

/**
 * Public creator SIGNUP endpoint:
 * - Creates a creators row (status: inactive, pending notes)
 * - Creates a users row with role=creator and creatorId linked
 */
router.post("/creators/signup", async (req: Request, res: Response, next: any) => {
  try {
    const schema = z.object({
      fullName: z.string().min(1, "Full name is required"),
      phone: z.string().min(1, "Phone is required"),
      email: z.string().email("Valid email is required"),
      password: z.string().min(8, "Password must be at least 8 characters"),

      homeCities: z.array(z.string()).optional().nullable(),
      baseZip: z.string().optional().nullable(),
      serviceZipCodes: z.array(z.string()).optional().nullable(),
      serviceRadiusMiles: z.number().int().positive().optional().nullable(),
      industries: z.array(z.string()).optional().nullable(),
      ratePerVisitCents: z.number().int().positive().optional().nullable(),
      availabilityNotes: z.string().optional().nullable(),
      availability: z.record(z.enum(["available", "unavailable"])).optional().nullable(),

      instagramUsername: z.string().min(1, "Instagram username is required"),
      tiktokUsername: z.string().optional().nullable(),
      youtubeHandle: z.string().optional().nullable(),
      portfolioUrl: z.string().optional().nullable(),
      termsSigned: z.boolean().refine(v => v === true, "You must agree to the Terms"),
      waiverSigned: z.boolean().refine(v => v === true, "You must agree to the Waiver"),
      termsVersion: z.string().default("1.0"),
    });

    const data = schema.parse(req.body);

    if (!data.homeCities || data.homeCities.length === 0) {
      return res.status(400).json({ message: "At least one service city is required." });
    }
    if (!data.industries || data.industries.length === 0) {
      return res.status(400).json({ message: "At least one industry of interest is required." });
    }

    const instagramUsername = data.instagramUsername.trim().replace(/^@+/, "");
    if (!instagramUsername) {
      return res.status(400).json({ message: "A valid Instagram username is required." });
    }

    const normalizedEmail = data.email.trim().toLowerCase();
    const username = normalizedEmail; // creators log in with their email in the username field

    const nameParts = data.fullName.trim().split(/\s+/).filter(Boolean);
    const firstName = nameParts[0] || data.fullName.trim();
    const lastName = nameParts.length > 1 ? nameParts.slice(1).join(" ") : "Creator";

    const hashedPassword = await hashPassword(data.password);
    const ipAddress = req.ip || req.get('x-forwarded-for') || req.socket.remoteAddress;

    await db.transaction(async (tx) => {
      // Prevent duplicate accounts (by username/email).
      const existingUser = await tx
        .select({ id: users.id })
        .from(users)
        .where(or(eq(users.username, username), eq(users.email, normalizedEmail)))
        .limit(1);

      if (existingUser.length > 0) {
        const err: any = new Error("An account already exists for this email. Please log in instead.");
        err.status = 409;
        throw err;
      }

      const existingCreator = await tx
        .select({ id: creators.id })
        .from(creators)
        .where(eq(creators.email, normalizedEmail))
        .limit(1);

      if (existingCreator.length > 0) {
        const err: any = new Error("A creator application already exists for this email.");
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
          homeCities: data.homeCities,
          baseZip: data.baseZip?.trim() || null,
          serviceZipCodes: data.serviceZipCodes ?? null,
          serviceRadiusMiles: data.serviceRadiusMiles ?? 25,
          industries: data.industries,
          ratePerVisitCents: data.ratePerVisitCents ?? 7500,
          availabilityNotes: data.availabilityNotes?.trim() || null,
          availability: data.availability ?? null,
          status: "inactive",
          applicationStatus: "pending",
          instagramUsername: instagramUsername,
          tiktokUsername: data.tiktokUsername?.trim().replace(/^@+/, "") || null,
          youtubeHandle: data.youtubeHandle?.trim() || null,
          portfolioUrl: data.portfolioUrl?.trim() || null,
          termsSigned: data.termsSigned,
          waiverSigned: data.waiverSigned,
          termsSignedAt: new Date(),
          waiverSignedAt: new Date(),
          termsVersion: data.termsVersion,
          ipAddress: ipAddress as string,
          performanceScore: "5.0",
          notes: `[PENDING APPLICATION] Creator account created via public signup on ${new Date().toISOString()}. IP: ${ipAddress}`,
        } as any)
        .returning();

      // Create login user linked to creator
      await tx
        .insert(users)
        .values({
          username,
          password: hashedPassword,
          email: normalizedEmail,
          firstName,
          lastName,
          role: UserRole.CREATOR,
          creatorId: creator.id,
        } as any);

      // Notify admins about new creator application
      try {
        const { emailNotifications } = await import("../emailService");
        const adminUsers = await tx.select().from(users).where(eq(users.role, UserRole.ADMIN));
        const adminEmails = adminUsers.map(a => a.email).filter(Boolean) as string[];
        
        if (adminEmails.length > 0) {
          await emailNotifications.sendActionAlertEmail(
            adminEmails,
            "🆕 New Creator Application",
            `A new creator application has been submitted by ${data.fullName} (${normalizedEmail}).`,
            "/creators",
            "info"
          );
        }
      } catch (err) {
        console.error("Failed to notify admins about new creator application:", err);
      }
    });

    res.status(201).json({ 
      success: true, 
      message: "Application received. Our team reviews applications within 24–72 hours. You’ll receive an email once a decision is made." 
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
    const { city, zip, status, applicationStatus, minScore } = req.query as any;
    const user = req.user as any;

    const conditions: any[] = [];
    if (city) {
      conditions.push(or(
        eq(creators.homeCity, String(city)),
        sql`${creators.homeCities} @> ARRAY[${String(city)}]::text[]`
      ));
    }
    if (zip) conditions.push(or(eq(creators.baseZip, String(zip)), sql`${creators.serviceZipCodes} @> ARRAY[${String(zip)}]::text[]`));
    if (status) conditions.push(eq(creators.status, String(status)));
    if (applicationStatus) conditions.push(eq(creators.applicationStatus, String(applicationStatus)));
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
    const [creator] = await db.select().from(creators).where(eq(creators.id, req.params.id));
    if (!creator) return res.status(404).json({ message: "Creator not found" });

    // Fetch assignments
    const assignments = await db
      .select({
        id: clientCreators.id,
        clientId: clientCreators.clientId,
        clientName: clients.name,
        role: clientCreators.role,
        active: clientCreators.active,
        assignedAt: clientCreators.assignedAt,
      })
      .from(clientCreators)
      .innerJoin(clients, eq(clientCreators.clientId, clients.id))
      .where(eq(clientCreators.creatorId, creator.id));

    // Fetch visits
    const visits = await db
      .select()
      .from(creatorVisits)
      .where(eq(creatorVisits.creatorId, creator.id))
      .orderBy(sql`${creatorVisits.scheduledStart} DESC`);

    res.json({
      creator,
      assignments,
      visits,
    });
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

// Admin Approval/Decline routes
router.post("/creators/:id/accept", isAuthenticated, requireRole(UserRole.ADMIN, UserRole.CREATOR_MANAGER), async (req: Request, res: Response) => {
  try {
    const user = req.user as any;
    const [creator] = await db
      .update(creators)
      .set({ 
        applicationStatus: "accepted",
        status: "active",
        approvedAt: new Date(),
        approvedByAdmin: user.id
      })
      .where(eq(creators.id, req.params.id))
      .returning();

    if (!creator) return res.status(404).json({ message: "Creator not found" });

    // Send approval email
    try {
      const { emailNotifications } = await import("../emailService");
      if (creator.email) {
        await emailNotifications.sendCreatorApprovedEmail(creator.email, creator.fullName);
      }
    } catch (err) {
      console.error("Failed to send approval email:", err);
    }

    res.json({ success: true, creator });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

router.post("/creators/:id/decline", isAuthenticated, requireRole(UserRole.ADMIN, UserRole.CREATOR_MANAGER), async (req: Request, res: Response) => {
  try {
    const [creator] = await db
      .update(creators)
      .set({ 
        applicationStatus: "declined",
        status: "inactive"
      })
      .where(eq(creators.id, req.params.id))
      .returning();

    if (!creator) return res.status(404).json({ message: "Creator not found" });

    // Send decline email
    try {
      const { emailNotifications } = await import("../emailService");
      if (creator.email) {
        await emailNotifications.sendCreatorDeclinedEmail(creator.email, creator.fullName);
      }
    } catch (err) {
      console.error("Failed to send decline email:", err);
    }

    res.json({ success: true, creator });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// Creator self-service routes
router.patch("/creators/me/availability", isAuthenticated, requireRole(UserRole.CREATOR), async (req: Request, res: Response) => {
  try {
    const user = req.user as any;
    if (!user.creatorId) {
      return res.status(403).json({ message: "No creator ID associated with this user" });
    }

    const { availability } = req.body;
    const [updated] = await db
      .update(creators)
      .set({ availability })
      .where(eq(creators.id, user.creatorId))
      .returning();

    res.json(updated);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

router.patch("/creators/me/payout-info", isAuthenticated, requireRole(UserRole.CREATOR), async (req: Request, res: Response) => {
  try {
    const user = req.user as any;
    if (!user.creatorId) {
      return res.status(403).json({ message: "No creator ID associated with this user" });
    }

    const { payoutMethod, payoutDetails } = req.body;
    const [updated] = await db
      .update(creators)
      .set({ payoutMethod, payoutDetails })
      .where(eq(creators.id, user.creatorId))
      .returning();

    res.json(updated);
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

router.post("/visits/:id/upload", isAuthenticated, requireRole(...internalRoles, UserRole.CREATOR), async (req: Request, res: Response) => {
  try {
    const user = req.user as any;
    const { uploadLinks } = req.body;

    // If creator, ensure they own the visit
    if (user.role === UserRole.CREATOR) {
      const [visit] = await db.select().from(creatorVisits).where(eq(creatorVisits.id, req.params.id));
      if (!visit || visit.creatorId !== user.creatorId) {
        return res.status(403).json({ message: "You can only upload content for your own visits" });
      }
    }

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

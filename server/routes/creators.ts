import { Router, Request, Response } from "express";
import { storage } from "../storage";
import { db, pool } from "../db";
import { creators, creatorVisits, clientCreators, clients } from "@shared/schema";
import { eq, and, or, sql } from "drizzle-orm";
import { isAuthenticated } from "../auth";
import { requireRole, UserRole } from "../rbac";
import { 
  handleValidationError
} from "./common";
import { z } from "zod";

const router = Router();

const internalRoles = [UserRole.ADMIN, UserRole.MANAGER, UserRole.STAFF, UserRole.CREATOR_MANAGER] as const;

// Public creator application endpoint
router.post("/apply", async (req: Request, res: Response) => {
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

    // Notify admins... (simplified for now, logic is in routes.ts)
    res.status(201).json({ success: true, id: created.id });
  } catch (error: any) {
    handleValidationError(error, res);
  }
});

router.get("/", isAuthenticated, requireRole(...internalRoles), async (req: Request, res: Response) => {
  try {
    const { city, zip, status, minScore } = req.query as any;
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

// Visits routes
router.get("/visits", isAuthenticated, requireRole(...internalRoles), async (req: Request, res: Response) => {
  try {
    const { clientId, creatorId, status, from, to, uploadOverdue } = req.query as any;
    const conditions: any[] = [];
    if (clientId) conditions.push(eq(creatorVisits.clientId, String(clientId)));
    if (creatorId) conditions.push(eq(creatorVisits.creatorId, String(creatorId)));
    if (status) conditions.push(eq(creatorVisits.status, String(status)));
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

export default router;


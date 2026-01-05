import { Request, Response } from "express";
import { storage } from "../storage";
import { db } from "../db";
import { leads } from "@shared/schema";
import { eq } from "drizzle-orm";
import { UserRole } from "@shared/schema";

export function getCurrentUserContext(req: Request): { userId: number | null; role: string | null } {
  const anyReq = req as any;
  const user = req.user as any;
  const userIdRaw = anyReq.userId ?? user?.id ?? user?.claims?.sub ?? null;
  const roleRaw = anyReq.userRole ?? user?.role ?? null;
  const userId = userIdRaw === null || userIdRaw === undefined ? null : Number(userIdRaw);
  const role = roleRaw ? String(roleRaw) : null;
  return { userId: Number.isFinite(userId) ? userId : null, role };
}

export async function getAccessibleClientOr404(req: Request, res: Response, clientId: string) {
  const { userId, role } = getCurrentUserContext(req);
  const client = await storage.getClient(clientId);
  if (!client) {
    res.status(404).json({ message: "Client not found" });
    return null;
  }
  if (role === UserRole.SALES_AGENT) {
    const allowed =
      (client as any).salesAgentId === userId ||
      (client as any).assignedToId === userId;
    if (!allowed) {
      res.status(404).json({ message: "Client not found" });
      return null;
    }
  }
  return client;
}

export async function getAccessibleLeadOr404(req: Request, res: Response, leadId: string) {
  const { userId, role } = getCurrentUserContext(req);
  const [lead] = await db.select().from(leads).where(eq(leads.id, leadId));
  if (!lead) {
    res.status(404).json({ message: "Lead not found" });
    return null;
  }
  if (role === UserRole.SALES_AGENT) {
    const isAssigned = lead.assignedToId === userId;
    if (!isAssigned) {
      res.status(404).json({ message: "Lead not found" });
      return null;
    }
  }
  return lead;
}


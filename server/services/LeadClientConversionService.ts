import { db } from "../db";
import { clients, leads, onboardingTasks, commissions, subscriptionPackages } from "@shared/schema";
import { UserRole } from "@shared/roles";
import { eq, sql } from "drizzle-orm";
import { storage } from "../storage";
import { notifyAboutLeadAction } from "../leadNotifications";

export async function convertLeadToClient(params: { leadId: string; actorUserId?: number | null }) {
  const { leadId, actorUserId } = params;
  
  return await db.transaction(async (tx) => {
    const [lead] = await tx.select().from(leads).where(eq(leads.id, leadId));
    if (!lead) throw new Error("Lead not found");
    
    if (lead.convertedToClientId) return { clientId: lead.convertedToClientId, refreshedLead: lead }; // Already converted

    const [newClient] = await tx.insert(clients).values({
      name: lead.company || lead.name || "New Client",
      email: lead.email,
      phone: lead.phone,
      company: lead.company,
      website: lead.website,
      packageId: lead.packageId,
      startDate: lead.expectedStartDate || new Date(),
      salesAgentId: lead.assignedToId,
      status: 'active',
      billingStatus: 'current',
      notes: lead.notes,
      socialLinks: {
        instagram: lead.instagram,
        tiktok: lead.tiktok,
        facebook: lead.facebook,
        youtube: lead.youtube
      }
    }).returning();

    await tx.update(leads).set({
      stage: 'closed_won',
      convertedToClientId: newClient.id,
      convertedAt: new Date(),
      status: 'converted'
    }).where(eq(leads.id, leadId));

    const standardTasks = [
      { title: "Review business goals and target audience", dueDay: 1 },
      { title: "Access social media accounts", dueDay: 2 },
      { title: "Setup communication channels", dueDay: 3 },
      { title: "Schedule first strategy call", dueDay: 5 },
      { title: "Content calendar draft review", dueDay: 10 },
    ];

    for (const task of standardTasks) {
      await tx.insert(onboardingTasks).values({
        clientId: newClient.id,
        title: task.title,
        dueDay: task.dueDay,
        completed: false
      });
    }

    if (lead.dealValue && lead.assignedToId) {
      const dealVal = Number(lead.dealValue);
      const rate = Number(lead.commissionRate || 10);
      const amount = (dealVal * rate) / 100;

      await tx.insert(commissions).values({
        agentId: lead.assignedToId,
        leadId: lead.id,
        clientId: newClient.id,
        dealValue: sql`${dealVal}`,
        commissionRate: sql`${rate}`,
        commissionAmount: sql`${amount}`,
        status: 'pending',
        notes: `Auto-generated from lead conversion: ${lead.company}`
      });
    }

    // Notify relevant parties about conversion (outside tx for performance if needed, but here it's fine)
    try {
      notifyAboutLeadAction({
        lead: {
          ...lead,
          stage: 'closed_won',
          convertedToClientId: newClient.id,
          convertedAt: new Date(),
          status: 'converted'
        } as any,
        action: 'converted',
        actorId: actorUserId || undefined
      }).catch(err => console.error("Failed to send lead conversion notifications:", err));
    } catch (e) {
      console.error("Notification failed but conversion succeeded", e);
    }

    // After conversion logic, re-fetch the lead to ensure it reflects the latest state after updates within the transaction
    const [refreshedLead] = await tx.select().from(leads).where(eq(leads.id, leadId));

    return { clientId: newClient.id, refreshedLead: refreshedLead ?? lead };
  });
}

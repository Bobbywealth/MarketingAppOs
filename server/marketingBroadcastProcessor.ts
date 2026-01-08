import { storage } from "./storage";
import { sendEmail, marketingTemplates } from "./emailService";
import { sendSms } from "./twilioService";

/**
 * Background process to handle bulk sending for a marketing broadcast.
 * Safe to call asynchronously (it updates progress + final status in DB).
 */
export async function processMarketingBroadcast(broadcastId: string) {
  const broadcast = await storage.getMarketingBroadcast(broadcastId);
  if (!broadcast) return;

  try {
    let targetLeads: any[] = [];
    let targetClients: any[] = [];

    // 1. Fetch targets based on audience selection
    if (broadcast.audience === "all" || broadcast.audience === "leads") {
      const allLeads = await storage.getLeads();
      targetLeads = allLeads.filter((l) => {
        if (broadcast.type === "email" && !l.optInEmail) return false;
        if (broadcast.type === "sms" && !l.optInSms) return false;
        if (!l.email && broadcast.type === "email") return false;
        if (!l.phone && broadcast.type === "sms") return false;

        // Apply filters if specific
        if (broadcast.audience === "specific" && broadcast.filters) {
          const filters = broadcast.filters as any;
          if (filters.industries?.length && !filters.industries.includes(l.industry)) return false;
          if (filters.tags?.length && !l.tags?.some((t: string) => filters.tags.includes(t))) return false;
        }
        return true;
      });
    }

    if (broadcast.audience === "all" || broadcast.audience === "clients") {
      const allClients = await storage.getClients();
      targetClients = allClients.filter((c) => {
        if (broadcast.type === "email" && !c.optInEmail) return false;
        if (broadcast.type === "sms" && !c.optInSms) return false;
        if (!c.email && broadcast.type === "email") return false;
        if (!c.phone && broadcast.type === "sms") return false;
        return true;
      });
    }

    // 1.5 Handle Individual Recipient
    const individualRecipients: { email?: string; phone?: string; type: "individual" }[] = [];
    if (broadcast.audience === "individual" && broadcast.customRecipient) {
      if (broadcast.type === "email") {
        individualRecipients.push({ email: broadcast.customRecipient, type: "individual" });
      } else {
        individualRecipients.push({ phone: broadcast.customRecipient, type: "individual" });
      }
    }

    const total = targetLeads.length + targetClients.length + individualRecipients.length;
    await storage.updateMarketingBroadcast(broadcastId, { totalRecipients: total });

    let successCount = 0;
    let failedCount = 0;

    // 2. Loop and send
    const recipients = [
      ...targetLeads.map((l) => ({ ...l, type: "lead" as const })),
      ...targetClients.map((c) => ({ ...c, type: "client" as const })),
      ...individualRecipients,
    ];

    for (const recipient of recipients) {
      try {
        let result: any;
        if (broadcast.type === "email") {
          const { subject, html } = marketingTemplates.broadcast(
            broadcast.subject || "Wolfpaq Marketing",
            broadcast.content
          );
          result = await sendEmail((recipient as any).email!, subject, html);
        } else {
          result = await sendSms((recipient as any).phone!, broadcast.content);
        }

        if (result.success) {
          successCount++;
          await storage.createMarketingBroadcastRecipient({
            broadcastId,
            leadId: (recipient as any).type === "lead" ? (recipient as any).id : null,
            clientId: (recipient as any).type === "client" ? (recipient as any).id : null,
            customRecipient:
              (recipient as any).type === "individual"
                ? broadcast.type === "email"
                  ? (recipient as any).email
                  : (recipient as any).phone
                : null,
            status: "sent",
            sentAt: new Date(),
          });
        } else {
          failedCount++;
          await storage.createMarketingBroadcastRecipient({
            broadcastId,
            leadId: (recipient as any).type === "lead" ? (recipient as any).id : null,
            clientId: (recipient as any).type === "client" ? (recipient as any).id : null,
            customRecipient:
              (recipient as any).type === "individual"
                ? broadcast.type === "email"
                  ? (recipient as any).email
                  : (recipient as any).phone
                : null,
            status: "failed",
            errorMessage: result.error || result.message,
          });
        }
      } catch (err: any) {
        failedCount++;
        await storage.createMarketingBroadcastRecipient({
          broadcastId,
          leadId: (recipient as any).type === "lead" ? (recipient as any).id : null,
          clientId: (recipient as any).type === "client" ? (recipient as any).id : null,
          customRecipient:
            (recipient as any).type === "individual"
              ? broadcast.type === "email"
                ? (recipient as any).email
                : (recipient as any).phone
              : null,
          status: "failed",
          errorMessage: err.message,
        });
      }

      // Update progress incrementally
      await storage.updateMarketingBroadcast(broadcastId, { successCount, failedCount });
    }

    // 3. Mark completed
    await storage.updateMarketingBroadcast(broadcastId, {
      status: "completed",
      completedAt: new Date(),
    });
  } catch (error: any) {
    console.error(`Error processing broadcast ${broadcastId}:`, error);
    await storage.updateMarketingBroadcast(broadcastId, {
      status: "failed",
      completedAt: new Date(),
    });
  }
}


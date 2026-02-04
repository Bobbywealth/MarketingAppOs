import { storage } from "./storage";
import { sendEmail, marketingTemplates } from "./emailService";
import { sendSms, sendWhatsApp } from "./twilioService";
import { sendTelegramMessage } from "./telegramService";
import { startVapiCall } from "./vapiService";
import { generatePersonalizedHook } from "./aiManager";

/**
 * Background process to handle bulk sending for a marketing broadcast.
 * Safe to call asynchronously (it updates progress + final status in DB).
 */
export async function processMarketingBroadcast(broadcastId: string) {
  const broadcast = await storage.getMarketingBroadcast(broadcastId);
  if (!broadcast) return;

  try {
    // Telegram is a single-destination broadcast (group/channel chat_id), not per-lead/client.
    if (broadcast.type === "telegram") {
      await storage.updateMarketingBroadcast(broadcastId, { totalRecipients: 1 });

      let successCount = 0;
      let failedCount = 0;

      const result = await sendTelegramMessage(broadcast.customRecipient ?? null, broadcast.content);
      if (result.success) {
        successCount = 1;
        await storage.createMarketingBroadcastRecipient({
          broadcastId,
          leadId: null,
          clientId: null,
          customRecipient: broadcast.customRecipient ?? null,
          status: "sent",
          sentAt: new Date(),
        });
      } else {
        failedCount = 1;
        await storage.createMarketingBroadcastRecipient({
          broadcastId,
          leadId: null,
          clientId: null,
          customRecipient: broadcast.customRecipient ?? null,
          status: "failed",
          errorMessage: result.error,
        });
      }

      await storage.updateMarketingBroadcast(broadcastId, {
        successCount,
        failedCount,
        status: "completed",
        completedAt: new Date(),
      });
      return;
    }

    let targetLeads: any[] = [];
    let targetClients: any[] = [];

    // 1. Fetch targets based on audience selection
    if (broadcast.audience === "all" || broadcast.audience === "leads") {
      const allLeads = await storage.getLeads();
      targetLeads = allLeads.filter((l) => {
        if (broadcast.type === "email" && !l.optInEmail) return false;
        if ((broadcast.type === "sms" || broadcast.type === "whatsapp" || broadcast.type === "voice") && !l.optInSms) return false;
        if (!l.email && broadcast.type === "email") return false;
        if (!l.phone && (broadcast.type === "sms" || broadcast.type === "whatsapp" || broadcast.type === "voice")) return false;

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
        if ((broadcast.type === "sms" || broadcast.type === "whatsapp" || broadcast.type === "voice") && !c.optInSms) return false;
        if (!c.email && broadcast.type === "email") return false;
        if (!c.phone && (broadcast.type === "sms" || broadcast.type === "whatsapp" || broadcast.type === "voice")) return false;
        return true;
      });
    }

    // 1.2 Handle Group audience
    const individualRecipients: { email?: string; phone?: string; type: "individual" }[] = [];
    if (broadcast.audience === "group" && broadcast.groupId) {
      const members = await storage.getMarketingGroupMembers(broadcast.groupId);
      const leadIds = members.filter(m => m.leadId).map(m => m.leadId!);
      const clientIds = members.filter(m => m.clientId).map(m => m.clientId!);
      const customRecipients = members.filter(m => m.customRecipient).map(m => m.customRecipient!);

      if (leadIds.length > 0) {
        const allLeads = await storage.getLeads();
        targetLeads = [
          ...targetLeads,
          ...allLeads.filter(l => 
            leadIds.includes(l.id) && 
            !targetLeads.some(tl => tl.id === l.id) &&
            ((broadcast.type === "email" && l.optInEmail && l.email) || 
             ((broadcast.type === "sms" || broadcast.type === "whatsapp" || broadcast.type === "voice") && l.optInSms && l.phone))
          )
        ];
      }

      if (clientIds.length > 0) {
        const allClients = await storage.getClients();
        targetClients = [
          ...targetClients,
          ...allClients.filter(c => 
            clientIds.includes(c.id) && 
            !targetClients.some(tc => tc.id === c.id) &&
            ((broadcast.type === "email" && c.optInEmail && c.email) || 
             ((broadcast.type === "sms" || broadcast.type === "whatsapp" || broadcast.type === "voice") && c.optInSms && c.phone))
          )
        ];
      }

      if (customRecipients.length > 0) {
        customRecipients.forEach(r => {
          if (broadcast.type === "email") {
            individualRecipients.push({ email: r, type: "individual" });
          } else {
            individualRecipients.push({ phone: r, type: "individual" });
          }
        });
      }
    }

    // 1.5 Handle Individual Recipient
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
        let personalizedContent = broadcast.content;

        // Apply AI Personalization if enabled
        if (broadcast.useAiPersonalization && (recipient as any).type === "lead") {
          try {
            const hook = await generatePersonalizedHook(
              (recipient as any).name || "there",
              (recipient as any).company || "your company",
              (recipient as any).notes || "",
              broadcast.content
            );
            if (hook) {
              personalizedContent = `${hook}\n\n${broadcast.content}`;
            }
          } catch (aiErr) {
            console.error(`AI Personalization failed for lead ${(recipient as any).id}:`, aiErr);
            // Fallback to original content
          }
        }

        if (broadcast.type === "email") {
          const { subject, html } = marketingTemplates.broadcast(
            broadcast.subject || "Wolfpaq Marketing",
            personalizedContent
          );
          result = await sendEmail((recipient as any).email!, subject, html);
        } else if (broadcast.type === "whatsapp") {
          result = await sendWhatsApp((recipient as any).phone!, personalizedContent, broadcast.mediaUrls ?? undefined);
        } else if (broadcast.type === "voice") {
          // For Voice calls, we use broadcast.content as the assistantId
          result = await startVapiCall(
            (recipient as any).phone!, 
            broadcast.content,
            (recipient as any).company || (recipient as any).name || undefined
          );
        } else {
          result = await sendSms((recipient as any).phone!, personalizedContent, broadcast.mediaUrls ?? undefined);
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
            providerCallId: result.id || null,
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

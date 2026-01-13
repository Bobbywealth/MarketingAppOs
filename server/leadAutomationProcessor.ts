import cron from "node-cron";
import { storage } from "./storage";
import { emailNotifications } from "./emailService";
import { startVapiCall } from "./vapiService";
import { log } from "./vite";

/**
 * Lead Automation Processor
 * Handles scheduled automations like abandoned cart reminders.
 */

export async function processLeadAutomations() {
  try {
    const dueAutomations = await storage.getDueLeadAutomations();
    
    if (dueAutomations.length === 0) return;
    
    log(`🤖 Processing ${dueAutomations.length} due lead automations...`, "automations");
    
    for (const automation of dueAutomations) {
      try {
        // Mark as processing to avoid race conditions (though cron is single-threaded here)
        await storage.updateLeadAutomation(automation.id, { status: "processing" });
        
        const lead = await storage.getLead(automation.leadId);
        if (!lead) {
          await storage.updateLeadAutomation(automation.id, { 
            status: "failed", 
            executedAt: new Date(),
            // @ts-ignore - using JSON field for error
            actionData: { ...automation.actionData, error: "Lead not found" }
          });
          continue;
        }

        // Handle different action types
        if (automation.type === "abandoned_cart_reminder" || automation.actionType === "email") {
          const { checkoutUrl, packageName, clientName } = automation.actionData as any;
          
          if (lead.email && checkoutUrl && packageName) {
            const result = await emailNotifications.sendAbandonedCartReminder(
              lead.email,
              clientName || lead.name || "there",
              packageName,
              checkoutUrl
            );
            
            if (result.success) {
              await storage.updateLeadAutomation(automation.id, { 
                status: "sent", 
                executedAt: new Date() 
              });
              log(`✅ Abandoned cart reminder sent to ${lead.email}`, "automations");
            } else {
              throw new Error(result.error || "Failed to send email");
            }
          } else {
            throw new Error("Missing required data for email reminder");
          }
        } else if (automation.actionType === "voice_call") {
          const { assistantId } = automation.actionData as any;
          
          if (lead.phone && assistantId) {
            const result = await startVapiCall(
              lead.phone,
              assistantId,
              lead.company || lead.name || undefined
            );
            
            if (result.success) {
              await storage.updateLeadAutomation(automation.id, { 
                status: "sent", 
                executedAt: new Date(),
                // @ts-ignore
                actionData: { ...automation.actionData, vapiCallId: result.id }
              });
              log(`✅ AI Voice call initiated for ${lead.name || lead.phone}`, "automations");
            } else {
              throw new Error(result.error || "Failed to initiate voice call");
            }
          } else {
            throw new Error("Missing phone or assistantId for voice call");
          }
        } else {
          // Future automation types can be handled here
          await storage.updateLeadAutomation(automation.id, { 
            status: "completed", 
            executedAt: new Date() 
          });
        }
      } catch (error: any) {
        log(`❌ Error processing automation ${automation.id}: ${error.message}`, "automations");
        await storage.updateLeadAutomation(automation.id, { 
          status: "failed", 
          executedAt: new Date(),
          // @ts-ignore
          actionData: { ...automation.actionData, error: error.message }
        });
      }
    }
  } catch (error: any) {
    log(`❌ Critical error in lead automation processor: ${error.message}`, "automations");
  }
}

/**
 * Start the lead automation scheduler
 */
export function startLeadAutomationProcessor() {
  // Run every 15 minutes
  cron.schedule("*/15 * * * *", async () => {
    await processLeadAutomations();
  });
  
  log("🚀 Lead automation processor started (every 15m)", "automations");
}

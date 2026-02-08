import { storage } from "./storage";
import { sendSms } from "./twilioService";
import { emailNotifications } from "./emailService";
import { log } from "./vite";

/**
 * Marketing Series Processor
 * Handles sending multi-step email/sms sequences
 */
export async function processMarketingSeries() {
  try {
    const dueEnrollments = await storage.getDueSeriesEnrollments();
    if (dueEnrollments.length === 0) return;

    log(`🤖 Processing ${dueEnrollments.length} due series enrollments...`, "series");

    for (const enrollment of dueEnrollments) {
      try {
        const series = await storage.getMarketingSeriesWithSteps(enrollment.seriesId);
        if (!series || !series.isActive) {
          await storage.updateMarketingSeriesEnrollment(enrollment.id, { status: "cancelled" });
          continue;
        }

        const step = series.steps.find(s => s.stepOrder === enrollment.currentStep);
        if (!step) {
          await storage.updateMarketingSeriesEnrollment(enrollment.id, { status: "completed" });
          continue;
        }

        // Get recipient info
        let recipientName = "there";
        let recipientEmail = "";
        let recipientPhone = "";

        if (enrollment.recipientType === "lead") {
          const lead = await storage.getLead(enrollment.recipientId);
          if (lead) {
            recipientName = lead.name || "there";
            recipientEmail = lead.email || "";
            recipientPhone = lead.phone || "";
          }
        } else if (enrollment.recipientType === "client") {
          const client = await storage.getClient(enrollment.recipientId);
          if (client) {
            recipientName = client.name || "there";
            recipientEmail = client.email || "";
            recipientPhone = client.phone || "";
          }
        }

        // Send the message
        let sent = false;
        if (series.channel === "email" && recipientEmail) {
          try {
            await emailNotifications.sendMarketingEmail(
              recipientEmail,
              step.subject || series.name,
              step.content.replace(/{{name}}/g, recipientName)
            );
            sent = true;
          } catch (err) {
            log(`❌ Failed to send series email to ${recipientEmail}: ${err}`, "series");
          }
        } else if (series.channel === "sms" && recipientPhone) {
          try {
            await sendSms(
              recipientPhone,
              step.content.replace(/{{name}}/g, recipientName)
            );
            sent = true;
          } catch (err) {
            log(`❌ Failed to send series SMS to ${recipientPhone}: ${err}`, "series");
          }
        }

        if (sent) {
          // Calculate next step
          const nextStepOrder = enrollment.currentStep + 1;
          const nextStep = series.steps.find(s => s.stepOrder === nextStepOrder);
          
          if (nextStep) {
            const nextDue = new Date();
            nextDue.setDate(nextDue.getDate() + (nextStep.delayDays || 0));
            nextDue.setHours(nextDue.getHours() + (nextStep.delayHours || 0));
            
            await storage.updateMarketingSeriesEnrollment(enrollment.id, {
              currentStep: nextStepOrder,
              lastStepSentAt: new Date(),
              nextStepAt: nextDue,
            });
          } else {
            await storage.updateMarketingSeriesEnrollment(enrollment.id, {
              status: "completed",
              lastStepSentAt: new Date(),
              nextStepAt: null as any,
            });
          }
          log(`✅ Sent step ${enrollment.currentStep} of series "${series.name}" to ${recipientName}`, "series");
        }
      } catch (err: any) {
        log(`❌ Error processing series enrollment ${enrollment.id}: ${err.message}`, "series");
      }
    }
  } catch (error: any) {
    log(`❌ Critical error in series processor: ${error.message}`, "series");
  }
}

/**
 * Start the series scheduler
 */
export function startSeriesProcessor() {
  // Check every 15 minutes
  setInterval(processMarketingSeries, 15 * 60 * 1000);
  log("🚀 Marketing Series processor started (every 15m)", "series");
  
  // Run once on startup after a short delay
  setTimeout(processMarketingSeries, 30000);
}

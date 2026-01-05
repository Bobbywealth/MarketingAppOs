import { eq, and, lt, sql } from "drizzle-orm";
import { db } from "./db";
import { leads, leadActivities, emails, smsMessages } from "../shared/schema";
import { notifyAboutLeadAction } from "./leadNotifications";

/**
 * Lead Pipeline Automation Service
 * Automatically moves leads through pipeline stages based on triggers
 */

interface AutomationRule {
  name: string;
  fromStage: string;
  toStage: string;
  condition: () => Promise<number[]>; // Returns array of lead IDs to move
  description: string;
}

export class LeadAutomationService {
  private rules: AutomationRule[] = [];

  constructor() {
    this.initializeRules();
  }

  /**
   * Initialize all automation rules
   */
  private initializeRules() {
    // Rule 1: Prospect → Contacted (when activity recorded)
    this.rules.push({
      name: "prospect_to_contacted",
      fromStage: "prospect",
      toStage: "contacted",
      description: "Move to Contacted when first activity is logged",
      condition: async () => {
        const result = await db
          .select({ leadId: leadActivities.leadId })
          .from(leadActivities)
          .innerJoin(leads, eq(leads.id, leadActivities.leadId))
          .where(
            and(
              eq(leads.stage, "prospect"),
              sql`${leadActivities.createdAt} >= NOW() - INTERVAL '24 hours'`
            )
          )
          .groupBy(leadActivities.leadId);
        
        return result.map(r => r.leadId);
      }
    });

    // Rule 2: Contacted → Qualified (when lead responds or scores high)
    this.rules.push({
      name: "contacted_to_qualified",
      fromStage: "contacted",
      toStage: "qualified",
      description: "Move to Qualified when lead engages or score >= 70",
      condition: async () => {
        // Leads with score >= 70 (warm or hot)
        const highScoreLeads = await db
          .select({ id: leads.id })
          .from(leads)
          .where(
            and(
              eq(leads.stage, "contacted"),
              sql`${leads.score} IN ('hot', 'warm')`
            )
          );

        // Leads who have replied (have activities marked as 'meeting' or 'email_reply')
        const engagedLeads = await db
          .select({ leadId: leadActivities.leadId })
          .from(leadActivities)
          .innerJoin(leads, eq(leads.id, leadActivities.leadId))
          .where(
            and(
              eq(leads.stage, "contacted"),
              sql`${leadActivities.type} IN ('meeting', 'email', 'call')`
            )
          )
          .groupBy(leadActivities.leadId);

        const allIds = [
          ...highScoreLeads.map(l => l.id),
          ...engagedLeads.map(l => l.leadId)
        ];
        
        return [...new Set(allIds)]; // Remove duplicates
      }
    });

    // Rule 3: Qualified → Proposal (when meeting completed)
    this.rules.push({
      name: "qualified_to_proposal",
      fromStage: "qualified",
      toStage: "proposal",
      description: "Move to Proposal after meeting completion",
      condition: async () => {
        const result = await db
          .select({ leadId: leadActivities.leadId })
          .from(leadActivities)
          .innerJoin(leads, eq(leads.id, leadActivities.leadId))
          .where(
            and(
              eq(leads.stage, "qualified"),
              eq(leadActivities.type, "meeting"),
              sql`${leadActivities.createdAt} >= NOW() - INTERVAL '7 days'`
            )
          )
          .groupBy(leadActivities.leadId);
        
        return result.map(r => r.leadId);
      }
    });

    // Rule 4: Any stage → Lost (no activity in 30 days)
    this.rules.push({
      name: "inactive_to_lost",
      fromStage: "*", // Any stage
      toStage: "lost",
      description: "Move to Lost after 30 days of inactivity",
      condition: async () => {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        // Find leads with no recent activities
        const activeLeadIds = await db
          .select({ leadId: leadActivities.leadId })
          .from(leadActivities)
          .where(sql`${leadActivities.createdAt} >= ${thirtyDaysAgo}`)
          .groupBy(leadActivities.leadId);

        const activeIds = new Set(activeLeadIds.map(l => l.leadId));

        // Get all leads that are not in Won, Lost, or recently active
        const inactiveLeads = await db
          .select({ id: leads.id })
          .from(leads)
          .where(
            and(
              sql`${leads.stage} NOT IN ('won', 'lost')`,
              sql`${leads.createdAt} < ${thirtyDaysAgo}`
            )
          );

        return inactiveLeads
          .filter(lead => !activeIds.has(lead.id))
          .map(lead => lead.id);
      }
    });
  }

  /**
   * Run all automation rules
   */
  async runAutomation(): Promise<{
    totalMoved: number;
    ruleResults: Array<{ rule: string; movedCount: number; leadIds: number[] }>;
  }> {
    console.log('🤖 Starting Lead Pipeline Automation...');
    
    const results = [];
    let totalMoved = 0;

    for (const rule of this.rules) {
      try {
        console.log(`   Running rule: ${rule.name}`);
        
        // Get leads matching the condition
        const leadIds = await rule.condition();
        
        if (leadIds.length === 0) {
          console.log(`   ✓ No leads to move for ${rule.name}`);
          continue;
        }

        // Move leads to new stage
        for (const leadId of leadIds) {
          const [lead] = await db
            .update(leads)
            .set({ 
              stage: rule.toStage,
              updatedAt: new Date()
            })
            .where(eq(leads.id, leadId))
            .returning();

          if (lead) {
            // Log the activity
            await db.insert(leadActivities).values({
              leadId,
              type: 'stage_change',
              description: `Automatically moved from ${rule.fromStage} to ${rule.toStage} - ${rule.description}`,
              createdAt: new Date()
            });

            // Notify relevant parties
            notifyAboutLeadAction({
              lead,
              action: 'stage_changed',
              oldStage: rule.fromStage,
              newStage: rule.toStage
            }).catch(err => console.error(`Failed to notify about automated lead move for lead ${leadId}:`, err));
          }
        }

        console.log(`   ✅ Moved ${leadIds.length} leads: ${rule.fromStage} → ${rule.toStage}`);
        
        results.push({
          rule: rule.name,
          movedCount: leadIds.length,
          leadIds
        });

        totalMoved += leadIds.length;
      } catch (error) {
        console.error(`   ❌ Error running rule ${rule.name}:`, error);
      }
    }

    console.log(`🎉 Automation complete! Moved ${totalMoved} leads total.`);
    
    return { totalMoved, ruleResults: results };
  }

  /**
   * Get automation status/stats
   */
  async getAutomationStats() {
    const stats = await db
      .select({
        stage: leads.stage,
        count: sql<number>`count(*)::int`
      })
      .from(leads)
      .groupBy(leads.stage);

    return stats;
  }
}

// Singleton instance
export const leadAutomation = new LeadAutomationService();

/**
 * Schedule automation to run every hour
 * Call this from your server startup
 */
export function startLeadAutomation() {
  console.log('📊 Lead Pipeline Automation Started');
  
  // Run immediately on startup
  leadAutomation.runAutomation();

  // Run every hour
  setInterval(async () => {
    try {
      await leadAutomation.runAutomation();
    } catch (error) {
      console.error('Lead automation error:', error);
    }
  }, 60 * 60 * 1000); // 1 hour
}


import { db } from "./server/db";
import { clients, leads, marketingBroadcastRecipients } from "./shared/schema";
import { eq, isNull, or } from "drizzle-orm";

/**
 * Migration Script: Convert Non-Paying Clients to Leads
 * 
 * This script finds all clients who are NOT paying customers
 * (no Stripe subscription or customer ID) and converts them to leads.
 * 
 * Run with: node --env-file=.env --import tsx migrate-clients-to-leads.ts
 */

async function migrateClientsToLeads() {
  console.log("🔄 Starting migration: Converting non-paying clients to leads...\n");

  try {
    // Find all clients without Stripe IDs (not paying customers)
    const nonPayingClients = await db
      .select()
      .from(clients)
      .where(
        or(
          isNull(clients.stripeCustomerId),
          isNull(clients.stripeSubscriptionId)
        )
      );

    console.log(`📊 Found ${nonPayingClients.length} non-paying clients to migrate\n`);

    if (nonPayingClients.length === 0) {
      console.log("✅ No clients to migrate. All clients are paying customers!");
      process.exit(0);
    }

    // Get all existing leads to check for duplicates
    const existingLeads = await db.select().from(leads);
    const existingLeadEmails = new Set(existingLeads.map(l => l.email?.toLowerCase()));

    let migrated = 0;
    let skipped = 0;
    let deleted = 0;

    for (const client of nonPayingClients) {
      const emailLower = client.email?.toLowerCase();
      
      // Check if lead already exists
      if (emailLower && existingLeadEmails.has(emailLower)) {
        console.log(`⏭️  Skipping ${client.name} (${client.email}) - already exists as lead`);
        skipped++;
        
        // Find the existing lead to preserve history
        const existingLead = existingLeads.find(l => l.email?.toLowerCase() === emailLower);
        if (existingLead) {
          await db
            .update(marketingBroadcastRecipients)
            .set({ leadId: existingLead.id, clientId: null })
            .where(eq(marketingBroadcastRecipients.clientId, client.id));
        }

        // Delete the duplicate client
        await db.delete(clients).where(eq(clients.id, client.id));
        deleted++;
        continue;
      }

      // Create lead from client data
      const leadData = {
        name: client.name,
        email: client.email,
        phone: client.phone,
        company: client.company,
        website: client.website,
        source: "website",
        stage: "prospect",
        score: "warm",
        value: null,
        notes: `🔄 MIGRATED FROM CLIENTS TABLE

Original Client Data:
• Status: ${client.status}
• Service Tags: ${client.serviceTags?.join(', ') || 'None'}
• Social Links: ${client.socialLinks ? JSON.stringify(client.socialLinks) : 'None'}

${client.notes || ''}

---
This was incorrectly created as a client during signup.
Migrated to leads on ${new Date().toLocaleDateString()}.`,
        clientId: null,
        assignedToId: client.assignedToId,
        sourceMetadata: {
          migratedFromClient: true,
          originalClientId: client.id,
          serviceTags: client.serviceTags,
        },
        nextFollowUp: null,
      };

      // Create the lead
      const [newLead] = await db.insert(leads).values(leadData).returning();
      console.log(`✅ Migrated ${client.name} (${client.email}) to leads`);
      migrated++;

      if (newLead) {
        // Migrate marketing history
        const updatedRecipients = await db
          .update(marketingBroadcastRecipients)
          .set({ leadId: newLead.id, clientId: null })
          .where(eq(marketingBroadcastRecipients.clientId, client.id))
          .returning();
        
        if (updatedRecipients.length > 0) {
          console.log(`   📝 Migrated ${updatedRecipients.length} marketing history records`);
        }
      }

      // Delete the client
      await db.delete(clients).where(eq(clients.id, client.id));
      deleted++;
    }

    console.log("\n" + "=".repeat(60));
    console.log("🎉 Migration Complete!");
    console.log("=".repeat(60));
    console.log(`✅ Migrated: ${migrated} clients → leads`);
    console.log(`⏭️  Skipped: ${skipped} (already existed as leads)`);
    console.log(`🗑️  Deleted: ${deleted} non-paying clients`);
    console.log("\n💡 These leads are now in your sales pipeline!");
    console.log("   Visit /leads to see them.\n");

    process.exit(0);
  } catch (error) {
    console.error("❌ Migration failed:", error);
    process.exit(1);
  }
}

// Run the migration
migrateClientsToLeads();


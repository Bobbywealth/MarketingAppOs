import { db } from "./server/db";
import { clients, users } from "./shared/schema";
import { eq } from "drizzle-orm";

async function linkTestClient() {
  try {
    console.log('🔍 Checking testclient user...\n');
    
    // Find testclient user
    const testUser = await db
      .select()
      .from(users)
      .where(eq(users.username, 'testclient'))
      .limit(1);
    
    if (testUser.length === 0) {
      console.log('❌ testclient user not found');
      process.exit(1);
    }
    
    const user = testUser[0];
    console.log(`✅ Found testclient user (ID: ${user.id})`);
    console.log(`   Current clientId: ${user.clientId || 'NOT SET'}\n`);
    
    if (user.clientId) {
      console.log('✅ testclient already has a clientId set!');
      console.log(`   Linked to client: ${user.clientId}`);
      process.exit(0);
    }
    
    // Find or create a client for testclient
    console.log('🔍 Looking for existing clients...\n');
    const allClients = await db.select().from(clients).limit(5);
    
    if (allClients.length === 0) {
      console.log('📝 No clients found, creating one...\n');
      
      const [newClient] = await db.insert(clients).values({
        name: 'Test Client Company',
        email: user.email || 'testclient@example.com',
        phone: '555-0100',
        company: 'Test Company',
        status: 'active',
      }).returning();
      
      console.log(`✅ Created new client: ${newClient.name} (${newClient.id})\n`);
      
      // Link user to new client
      await db
        .update(users)
        .set({ clientId: newClient.id })
        .where(eq(users.id, user.id));
      
      console.log(`✅ Linked testclient user to new client!`);
      console.log(`   User: ${user.username}`);
      console.log(`   Client: ${newClient.name} (${newClient.id})\n`);
      
    } else {
      // Use first existing client
      const client = allClients[0];
      console.log(`✅ Found existing client: ${client.name} (${client.id})\n`);
      
      // Link user to existing client
      await db
        .update(users)
        .set({ clientId: client.id })
        .where(eq(users.id, user.id));
      
      console.log(`✅ Linked testclient user to existing client!`);
      console.log(`   User: ${user.username}`);
      console.log(`   Client: ${client.name} (${client.id})\n`);
    }
    
    console.log('🎉 Done! testclient can now create support tickets.\n');
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

linkTestClient();


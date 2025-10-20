import { db } from "./server/db";
import { clients, users } from "./shared/schema";
import { hashPassword } from "./server/auth";
import { eq } from "drizzle-orm";

async function createClientAccounts() {
  try {
    console.log('🔄 Starting client account creation...\n');
    
    // Get all clients
    const allClients = await db.select().from(clients);
    console.log(`📊 Found ${allClients.length} clients\n`);
    
    let created = 0;
    let skipped = 0;
    
    for (const client of allClients) {
      // Check if user already exists for this client
      const existingUser = await db
        .select()
        .from(users)
        .where(eq(users.clientId, client.id))
        .limit(1);
      
      if (existingUser.length > 0) {
        console.log(`⏭️  Skipping ${client.name} - account already exists`);
        skipped++;
        continue;
      }
      
      // Create username from email or name
      let username = '';
      if (client.email) {
        username = client.email.split('@')[0].toLowerCase();
      } else {
        username = client.name.toLowerCase().replace(/\s+/g, '');
      }
      
      // Make username unique by adding numbers if needed
      let finalUsername = username;
      let counter = 1;
      while (true) {
        const existingUsername = await db
          .select()
          .from(users)
          .where(eq(users.username, finalUsername))
          .limit(1);
        
        if (existingUsername.length === 0) break;
        
        finalUsername = `${username}${counter}`;
        counter++;
      }
      
      // Generate a temporary password (they should change this)
      const tempPassword = `Welcome${Math.floor(Math.random() * 10000)}!`;
      const hashedPassword = await hashPassword(tempPassword);
      
      // Create user account
      await db.insert(users).values({
        username: finalUsername,
        password: hashedPassword,
        email: client.email || null,
        firstName: client.name.split(' ')[0] || null,
        lastName: client.name.split(' ').slice(1).join(' ') || null,
        role: 'client',
        clientId: client.id,
      });
      
      console.log(`✅ Created account for ${client.name}`);
      console.log(`   Username: ${finalUsername}`);
      console.log(`   Temp Password: ${tempPassword}`);
      console.log(`   Email: ${client.email || 'N/A'}\n`);
      
      created++;
    }
    
    console.log('\n🎉 Summary:');
    console.log(`   ✅ Created: ${created} accounts`);
    console.log(`   ⏭️  Skipped: ${skipped} accounts (already exist)`);
    console.log(`   📊 Total: ${allClients.length} clients\n`);
    
    if (created > 0) {
      console.log('⚠️  IMPORTANT: Save the usernames and passwords above!');
      console.log('   Send these credentials to your clients so they can log in.');
      console.log('   They should change their password after first login.\n');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

createClientAccounts();


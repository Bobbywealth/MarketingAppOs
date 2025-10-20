import { db } from "./server/db";
import { clients } from "./shared/schema";

async function checkClients() {
  try {
    const allClients = await db.select().from(clients);
    console.log('\n📊 Total Clients:', allClients.length);
    console.log('\n📋 Client List:\n');
    
    allClients.forEach((client, index) => {
      console.log(`${index + 1}. ${client.name}`);
      console.log(`   Email: ${client.email || 'N/A'}`);
      console.log(`   Company: ${client.company || 'N/A'}`);
      console.log(`   Status: ${client.status}`);
      console.log(`   Created: ${client.createdAt}`);
      console.log(`   Stripe Customer ID: ${client.stripeCustomerId || 'None'}`);
      console.log('');
    });
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkClients();


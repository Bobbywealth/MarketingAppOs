import { storage } from "./server/storage";

async function addSampleData() {
  try {
    console.log('🔄 Adding sample data...');

    // Add a sample client
    const client = await storage.createClient({
      name: "ABC Company",
      email: "contact@abccompany.com",
      phone: "555-1234",
      company: "ABC Company",
      website: "https://abccompany.com",
      status: "active",
      serviceTags: ["social media", "design"],
      notes: "Sample client for testing",
    });
    console.log('✅ Added client:', client.name);

    // Add a sample campaign
    const campaign = await storage.createCampaign({
      clientId: client.id,
      name: "Holiday Marketing Campaign",
      type: "social",
      status: "active",
      description: "Q4 holiday marketing push",
      budget: 5000,
    });
    console.log('✅ Added campaign:', campaign.name);

    // Add sample leads
    const lead1 = await storage.createLead({
      clientId: client.id,
      name: "John Smith",
      email: "john@example.com",
      phone: "555-5678",
      company: "Smith Corp",
      status: "qualified",
      source: "website",
      value: 10000,
      notes: "Interested in social media management",
    });
    console.log('✅ Added lead:', lead1.name);

    const lead2 = await storage.createLead({
      clientId: client.id,
      name: "Jane Doe",
      email: "jane@example.com",
      phone: "555-9012",
      company: "Doe Industries",
      status: "new",
      source: "referral",
      value: 15000,
      notes: "Looking for full marketing package",
    });
    console.log('✅ Added lead:', lead2.name);

    // Add sample tasks
    const task1 = await storage.createTask({
      clientId: client.id,
      campaignId: campaign.id,
      title: "Design social media graphics",
      description: "Create holiday-themed graphics for Instagram and Facebook",
      status: "in_progress",
      priority: "high",
      dueDate: new Date(Date.now() + 86400000 * 3), // 3 days from now
    });
    console.log('✅ Added task:', task1.title);

    const task2 = await storage.createTask({
      clientId: client.id,
      title: "Schedule client meeting",
      description: "Quarterly review meeting",
      status: "todo",
      priority: "normal",
      dueDate: new Date(Date.now() + 86400000 * 7), // 7 days from now
    });
    console.log('✅ Added task:', task2.title);

    const task3 = await storage.createTask({
      clientId: client.id,
      title: "Review analytics report",
      description: "Monthly performance review",
      status: "completed",
      priority: "normal",
      completedAt: new Date(),
    });
    console.log('✅ Added task:', task3.title);

    console.log('\n🎉 Sample data added successfully!');
    console.log('\n📊 Summary:');
    console.log('  - 1 Client');
    console.log('  - 1 Active Campaign');
    console.log('  - 2 Leads ($25,000 pipeline value)');
    console.log('  - 3 Tasks (1 completed, 1 in progress, 1 todo)');
    console.log('\n✅ Refresh your dashboard to see the data!');

  } catch (error: any) {
    console.error('❌ Error adding sample data:', error.message);
    console.error(error);
  } finally {
    process.exit(0);
  }
}

addSampleData();


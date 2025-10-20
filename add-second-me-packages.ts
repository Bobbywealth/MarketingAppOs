import { db } from "./server/db";
import { subscriptionPackages } from "./shared/schema";

/**
 * Add Second Me AI Avatar Service Packages
 * 
 * Run with: node --env-file=.env --import tsx add-second-me-packages.ts
 */

async function addSecondMePackages() {
  console.log("✨ Adding Second Me AI Avatar Service Packages...\n");

  const packages = [
    {
      name: "✨ Second Me - Setup Fee",
      description: "One-time setup fee for creating your AI digital twin. We'll use 20+ of your professional photos to create a personalized AI avatar with Higgsfield.",
      price: 99900, // $999 one-time (adjust as needed)
      billingPeriod: "one_time" as const,
      features: [
        "Professional AI Avatar Creation",
        "Upload 20+ professional photos",
        "Higgsfield AI Character Generation",
        "Lifetime access to your AI avatar",
        "Multiple poses and expressions",
        "High-quality output for marketing use",
        "Dedicated setup support",
        "Ready in 3-5 business days"
      ],
      stripePriceId: null, // Create in Stripe Dashboard
      stripeProductId: null,
      isActive: true,
      isFeatured: false,
      displayOrder: 10, // Higher number to appear after main packages
      buttonText: "Create My Avatar",
      buttonLink: "/second-me",
      maxClients: null
    },
    {
      name: "🎬 Second Me - Weekly Content",
      description: "Get 4 AI-generated videos or images featuring your Second Me avatar every week. Perfect for consistent social media presence without constantly filming.",
      price: 8000, // $80 per week
      billingPeriod: "week" as const,
      features: [
        "4 AI-generated content pieces per week",
        "Videos or images featuring your avatar",
        "Professional editing and production",
        "Ready-to-post content",
        "Consistent social media presence",
        "Custom captions included",
        "Multiple platform formats (Instagram, TikTok, etc.)",
        "Weekly delivery schedule"
      ],
      stripePriceId: null, // Create in Stripe Dashboard
      stripeProductId: null,
      isActive: true,
      isFeatured: true, // Feature this as it's recurring revenue
      displayOrder: 11,
      buttonText: "Subscribe Now",
      buttonLink: "/second-me",
      maxClients: null
    },
    {
      name: "🌟 Second Me - Complete Bundle",
      description: "Save with the complete Second Me package! One-time avatar setup + first month of weekly content included.",
      price: 131900, // $1319 ($999 setup + $320 for 4 weeks) with slight discount
      billingPeriod: "one_time" as const,
      features: [
        "Everything from Setup Fee",
        "First 4 weeks of content included (16 pieces)",
        "Priority avatar creation",
        "Expedited 48-hour setup",
        "Dedicated account manager",
        "Save $100 vs. buying separately",
        "Option to continue weekly subscription after",
        "Perfect for quick launch"
      ],
      stripePriceId: null,
      stripeProductId: null,
      isActive: true,
      isFeatured: false,
      displayOrder: 12,
      buttonText: "🎁 Get Complete Bundle",
      buttonLink: "/second-me",
      maxClients: null
    }
  ];

  try {
    // Don't delete existing packages, just add Second Me packages
    for (const pkg of packages) {
      // Check if package already exists
      const existing = await db
        .select()
        .from(subscriptionPackages)
        .where((t) => t.name === pkg.name);

      if (existing.length > 0) {
        console.log(`⚠️  Package already exists: ${pkg.name}`);
        continue;
      }

      const [inserted] = await db.insert(subscriptionPackages).values(pkg).returning();
      console.log(`✅ Added: ${pkg.name} - $${(pkg.price / 100).toFixed(2)}/${pkg.billingPeriod === 'one_time' ? 'one-time' : pkg.billingPeriod}`);
    }

    console.log("\n" + "=".repeat(70));
    console.log("🎉 Second Me Packages Added Successfully!");
    console.log("=".repeat(70));
    console.log("📋 Next Steps:");
    console.log("1. Create corresponding Stripe products/prices:");
    console.log("   • Second Me Setup: $999 one-time payment");
    console.log("   • Second Me Weekly: $80/week recurring");
    console.log("   • Second Me Bundle: $1319 one-time payment");
    console.log("2. Update stripePriceId and stripeProductId for each package");
    console.log("3. Clients can now:");
    console.log("   ✓ View Second Me packages on /subscription-packages");
    console.log("   ✓ Purchase directly from /second-me page");
    console.log("   ✓ Subscribe to weekly content");
    console.log("\n💡 Second Me service is now ready for purchase!");

    process.exit(0);
  } catch (error) {
    console.error("❌ Failed to add Second Me packages:", error);
    process.exit(1);
  }
}

// Run the script
addSecondMePackages();


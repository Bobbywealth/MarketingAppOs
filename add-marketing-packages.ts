import { db } from "./server/db";
import { subscriptionPackages } from "./shared/schema";

/**
 * Add Marketing Team App 2025 Packages
 * 
 * Run with: node --env-file=.env --import tsx add-marketing-packages.ts
 */

async function addMarketingPackages() {
  console.log("🎯 Adding Marketing Team App 2025 Packages...\n");

  const packages = [
    {
      name: "🥇 Gold Package",
      description: "For small businesses ready to build a consistent online presence.",
      price: 24900, // $249 in cents
      billingPeriod: "month" as const,
      features: [
        "Management of 2 Social Media Platforms",
        "Tailored Strategy & Monthly Content Plan", 
        "AI-Powered Post Scheduling & Caption Optimization",
        "Virtual Assistant (3 days/week) for posting & support",
        "AI Message Automation for customer replies",
        "Monthly Growth Snapshot Report",
        "3-Page Brand Book (identity + audience overview)",
        "Add-On Option: Ad campaign setup ($99/ad)"
      ],
      stripePriceId: null, // You'll need to create these in Stripe
      stripeProductId: null,
      isActive: true,
      isFeatured: false,
      displayOrder: 1,
      buttonText: "Get Started",
      buttonLink: "/signup?package=gold",
      maxClients: null
    },
    {
      name: "💼 Business Package", 
      description: "For brands ready to grow through professional content creation and strategy.",
      price: 54900, // $549 in cents
      billingPeriod: "month" as const,
      features: [
        "Management of 3 Platforms",
        "All Gold features +",
        "Full Content Creation (12 posts per month) — photo, video, and graphic design",
        "Weekly Analytics & Optimization Report",
        "Priority Support with faster response times", 
        "AI CRM Setup for lead management",
        "SEO + Hashtag Optimization",
        "Monthly Strategy & Review Call",
        "Add-On Option: UGC / Influencer Collaboration Setup"
      ],
      stripePriceId: null,
      stripeProductId: null,
      isActive: true,
      isFeatured: false,
      displayOrder: 2,
      buttonText: "Choose Business",
      buttonLink: "/signup?package=business",
      maxClients: null
    },
    {
      name: "🚀 Digital Domination Package",
      description: "For brands scaling across multiple platforms with paid campaigns.",
      price: 150000, // $1500 in cents
      billingPeriod: "month" as const,
      features: [
        "Management of 4 Platforms",
        "All Business features +",
        "Ad Campaign Creation & Optimization (Meta, TikTok, etc.)",
        "Full Content Creation (20–28 posts per month) — advanced editing for reels & videos",
        "Monthly Strategy & Analytics Meeting (30 mins)",
        "Team Training (up to 2 hrs/month)",
        "24/7 AI Message Response",
        "Brand Engagement Campaigns (polls, stories, highlights)"
      ],
      stripePriceId: null,
      stripeProductId: null,
      isActive: true,
      isFeatured: true, // Make this the featured package
      displayOrder: 3,
      buttonText: "🚀 Scale Now",
      buttonLink: "/signup?package=domination",
      maxClients: null
    },
    {
      name: "👑 Brand Takeover Package",
      description: "Full-scale digital management with real-time support.",
      price: 250000, // $2500 in cents
      billingPeriod: "month" as const,
      features: [
        "Management of up to 6 Major Platforms (Instagram, Facebook, X, TikTok, YouTube, LinkedIn)",
        "All Digital Domination features +",
        "Full-Time Virtual Brand Assistant",
        "Ad Management + Monthly Optimization",
        "Website & Google Profile Management",
        "Customer Service Team for brand replies & inquiries",
        "Unlimited Strategy Calls (Zoom/Phone)",
        "Comprehensive Analytics Dashboard (VBMS integration)",
        "AI Campaign Automation & Lead Nurture System",
        "30+ Posts per Month",
        "Quarterly Growth Report"
      ],
      stripePriceId: null,
      stripeProductId: null,
      isActive: true,
      isFeatured: false,
      displayOrder: 4,
      buttonText: "👑 Full Takeover",
      buttonLink: "/signup?package=takeover",
      maxClients: null
    }
  ];

  try {
    // Clear existing packages first
    await db.delete(subscriptionPackages);
    console.log("🗑️  Cleared existing packages");

    // Insert new packages
    for (const pkg of packages) {
      const [inserted] = await db.insert(subscriptionPackages).values(pkg).returning();
      console.log(`✅ Added: ${pkg.name} - $${(pkg.price / 100).toFixed(2)}/month`);
    }

    console.log("\n" + "=".repeat(60));
    console.log("🎉 Marketing Packages Added Successfully!");
    console.log("=".repeat(60));
    console.log("📋 Next Steps:");
    console.log("1. Create corresponding Stripe products/prices");
    console.log("2. Update stripePriceId for each package");
    console.log("3. Test signup flow with new packages");
    console.log("4. Packages are now available in /subscription-packages");
    console.log("\n💡 Clients can now select these during signup!");

    process.exit(0);
  } catch (error) {
    console.error("❌ Failed to add packages:", error);
    process.exit(1);
  }
}

// Run the script
addMarketingPackages();

import { useState } from "react";
import { Link } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Search, Calendar, User, Tag, ArrowRight, TrendingUp, Target, DollarSign, Users, Globe, Smartphone } from "lucide-react";
import { HeaderLogo, FooterLogo } from "@/components/Logo";
import { useDocumentMeta } from "@/hooks/useDocumentMeta";

interface BlogPost {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  author: string;
  publishedAt: string;
  category: string;
  tags: string[];
  readTime: string;
  featured: boolean;
  imageUrl?: string;
}

// Sample blog posts for SEO and marketing content
const blogPosts: BlogPost[] = [
  {
    id: "7",
    slug: "converting-social-media-followers",
    title: "The Ultimate Guide to Converting Social Media Followers into Paying Customers",
    excerpt: "Learn the proven strategies to turn your social media audience into a revenue-generating asset. Discover the psychology behind social selling and actionable tactics that work.",
    content: `
# The Ultimate Guide to Converting Social Media Followers into Paying Customers

Having thousands of followers is great for your ego, but it doesn't pay the bills. The real magic happens when you transform those followers into loyal, paying customers. In this comprehensive guide, we'll show you exactly how to do it.

## The Social Media Sales Funnel: Your Roadmap to Revenue

### Stage 1: Awareness (Getting Found)
- **Optimize your bio**: Include clear value proposition and call-to-action
- **Use strategic hashtags**: Mix popular and niche-specific tags
- **Post consistently**: Maintain visibility in your audience's feed
- **Share valuable content**: 80% value, 20% promotion rule

### Stage 2: Interest (Building Relationships)
- **Engage authentically**: Respond to comments and DMs personally
- **Share behind-the-scenes content**: Build trust and relatability
- **Use storytelling**: Connect emotionally with your audience
- **Provide free value**: Tips, tutorials, and insights

### Stage 3: Consideration (Nurturing Prospects)
- **Create lead magnets**: Free resources in exchange for contact info
- **Use social proof**: Customer testimonials and case studies
- **Address objections**: FAQ posts and comparison content
- **Offer consultations**: Free strategy calls or audits

### Stage 4: Purchase (Converting to Customers)
- **Create urgency**: Limited-time offers and exclusive deals
- **Simplify the buying process**: Clear CTAs and easy checkout
- **Offer guarantees**: Reduce purchase risk
- **Follow up**: Don't let warm leads go cold

## Platform-Specific Conversion Strategies

### Instagram
- **Stories with polls and questions**: Increase engagement
- **Shoppable posts**: Direct product integration
- **IGTV tutorials**: Demonstrate expertise
- **Reels for discovery**: Reach new audiences

### LinkedIn
- **Value-driven posts**: Industry insights and tips
- **Personal messaging**: Direct outreach to prospects
- **LinkedIn articles**: Establish thought leadership
- **Group participation**: Build authority in your niche

### TikTok
- **Educational content**: Quick tips and hacks
- **Trending audio**: Increase visibility
- **Duets and collaborations**: Expand reach
- **Clear CTAs**: Direct traffic to your website

### Facebook
- **Facebook Groups**: Build community around your brand
- **Live videos**: Real-time engagement
- **Retargeting ads**: Re-engage website visitors
- **Messenger marketing**: Automated follow-up sequences

## The Psychology of Social Selling

### Trust Building Techniques
1. **Consistency**: Regular posting schedule builds reliability
2. **Transparency**: Share failures and lessons learned
3. **Social proof**: Showcase customer success stories
4. **Authority**: Share industry insights and predictions

### Emotional Triggers That Convert
- **Fear of missing out (FOMO)**: Limited availability
- **Social validation**: "Join 10,000+ satisfied customers"
- **Problem-solution fit**: Address specific pain points
- **Aspiration**: Show the transformation possible

## Measuring Your Social Media ROI

### Key Metrics to Track
- **Conversion rate**: Followers to customers percentage
- **Customer acquisition cost**: Cost per customer from social
- **Lifetime value**: Long-term revenue per social customer
- **Engagement rate**: Quality of audience interaction

### Tools for Tracking
- Google Analytics with UTM parameters
- Social media platform analytics
- CRM integration for lead tracking
- Customer surveys for attribution

## Common Mistakes That Kill Conversions

1. **Being too salesy**: 80/20 rule - mostly value, some promotion
2. **Ignoring comments**: Engagement builds relationships
3. **Inconsistent posting**: Out of sight, out of mind
4. **No clear CTA**: Tell people exactly what to do next
5. **Not following up**: Most sales happen after multiple touchpoints

## Action Plan: Your 30-Day Social Selling Challenge

### Week 1: Foundation
- Audit and optimize all social profiles
- Create content calendar with 80% value posts
- Set up tracking systems

### Week 2: Content Creation
- Develop lead magnets for each platform
- Create social proof content library
- Plan engagement strategy

### Week 3: Engagement
- Respond to every comment and DM
- Initiate conversations with prospects
- Share user-generated content

### Week 4: Conversion
- Launch first conversion campaign
- Follow up with warm leads
- Analyze and optimize results

## Conclusion

Converting social media followers into customers isn't about having the most followers—it's about building genuine relationships and providing consistent value. Focus on understanding your audience's needs, creating content that serves them, and guiding them naturally toward your solution.

Remember: People buy from people they know, like, and trust. Social media gives you the perfect platform to build all three.

**Ready to turn your social media into a revenue machine?** Start implementing these strategies today, and watch your follower-to-customer conversion rate soar.
    `,
    author: "Marketing Team",
    publishedAt: "2024-10-29",
    category: "Social Media",
    tags: ["social media", "conversion", "sales funnel", "customer acquisition", "ROI"],
    readTime: "12 min read",
    featured: true,
  },
  {
    id: "8",
    slug: "why-small-businesses-fail-digital-marketing",
    title: "Why 90% of Small Businesses Fail at Digital Marketing (And How to Be in the 10% That Succeed)",
    excerpt: "Most small businesses waste thousands on digital marketing that doesn't work. Learn the critical mistakes to avoid and the proven framework that successful businesses use.",
    content: `
# Why 90% of Small Businesses Fail at Digital Marketing (And How to Be in the 10% That Succeed)

Every day, thousands of small businesses pour money into digital marketing campaigns that fail spectacularly. They try Facebook ads, Google Ads, influencer partnerships, and content marketing—only to see minimal results and dwindling bank accounts.

But here's the thing: Digital marketing works. The problem isn't the strategy—it's the execution.

After working with hundreds of small businesses, we've identified the exact patterns that separate the winners from the losers. Today, we're sharing everything.

## The Brutal Truth: Why Most Small Businesses Fail

### Mistake #1: No Clear Strategy (The Shotgun Approach)
**What they do wrong**: Try every platform and tactic simultaneously
- Post randomly on 5+ social platforms
- Run ads without clear objectives
- Create content without a plan
- Jump from trend to trend

**The cost**: Diluted efforts, confused messaging, wasted budget

**What winners do instead**: 
- Choose 1-2 platforms and master them
- Create integrated campaigns with clear goals
- Develop consistent brand messaging
- Focus on their ideal customer profile

### Mistake #2: Targeting Everyone (And Reaching No One)
**What they do wrong**: "Our product is for everyone!"
- Generic messaging that resonates with nobody
- Broad audience targeting in ads
- One-size-fits-all content
- No customer personas

**The cost**: High acquisition costs, low conversion rates

**What winners do instead**:
- Define specific customer avatars
- Create targeted messaging for each segment
- Use precise audience targeting
- Speak directly to customer pain points

### Mistake #3: Focusing on Vanity Metrics
**What they do wrong**: Obsess over likes, followers, and impressions
- Celebrate viral posts that don't drive sales
- Buy followers and engagement
- Focus on reach over revenue
- Ignore conversion metrics

**The cost**: Impressive numbers, empty bank account

**What winners do instead**:
- Track revenue-focused metrics
- Measure customer acquisition cost
- Monitor lifetime value
- Optimize for conversions, not vanity

### Mistake #4: Impatience (The 30-Day Quit)
**What they do wrong**: Expect overnight success
- Switch strategies every month
- Stop campaigns before they mature
- Don't allow time for optimization
- Give up when results aren't immediate

**The cost**: Never building momentum or learning what works

**What winners do instead**:
- Commit to strategies for 90+ days
- Continuously optimize and improve
- Build long-term brand equity
- Understand that marketing is a marathon

### Mistake #5: DIY Everything (The Control Freak Trap)
**What they do wrong**: Try to handle all marketing in-house
- Owner manages social media between meetings
- Use nephew's friend for "cheap" design work
- Refuse to invest in professional help
- Spread themselves too thin

**The cost**: Poor execution, missed opportunities, burnout

**What winners do instead**:
- Invest in professional expertise
- Focus on their core business strengths
- Build strategic partnerships
- Understand that good marketing pays for itself

## The Winner's Framework: The SCALE Method

### S - Strategy First
Before touching any platform:
- Define your unique value proposition
- Identify your ideal customer
- Set clear, measurable goals
- Choose your primary marketing channels

### C - Content That Converts
Create content with purpose:
- Educational content (builds trust)
- Social proof content (reduces risk)
- Behind-the-scenes content (builds connection)
- Promotional content (drives action)

### A - Audience Development
Build your tribe systematically:
- Create valuable lead magnets
- Nurture email subscribers
- Engage authentically on social
- Partner with complementary businesses

### L - Lead Generation Systems
Automate your sales funnel:
- Landing pages that convert
- Email sequences that nurture
- Retargeting campaigns that re-engage
- CRM systems that track everything

### E - Evaluate and Optimize
Measure what matters:
- Track conversion rates, not just traffic
- A/B test everything
- Analyze customer feedback
- Continuously improve your approach

## Case Study: How Sarah's Bakery Went from $5K to $50K Monthly Revenue

**The Problem**: Sarah's local bakery was struggling despite having amazing products. She was posting daily on Instagram and Facebook but seeing no increase in sales.

**The Diagnosis**: 
- No clear target audience (posting for everyone)
- Generic content (just product photos)
- No lead capture system
- No way to track ROI

**The Solution (SCALE Method)**:

**Strategy**: Target busy professionals and event planners within 10 miles
**Content**: Recipe tips, behind-the-scenes videos, customer spotlights
**Audience**: Built email list with free recipe book
**Leads**: Created corporate catering inquiry system
**Evaluate**: Tracked revenue per customer, repeat orders

**Results in 6 months**:
- 300% increase in monthly revenue
- 85% of new customers from digital marketing
- 40% repeat customer rate
- $12 customer acquisition cost, $180 lifetime value

## The 90-Day Quick Start Plan

### Days 1-30: Foundation
- Complete customer avatar worksheets
- Audit current marketing efforts
- Choose primary marketing channel
- Set up tracking systems

### Days 31-60: Content & Systems
- Create content calendar
- Build lead magnets
- Set up email sequences
- Launch first campaigns

### Days 61-90: Optimize & Scale
- Analyze performance data
- A/B test key elements
- Scale what's working
- Plan expansion strategies

## Red Flags: When to Get Professional Help

You need expert help if you're experiencing:
- Spending money on ads with no clear ROI
- Posting content but not seeing engagement
- Getting traffic but no conversions
- Feeling overwhelmed by all the options
- Seeing competitors outperform you consistently

## The Investment Mindset Shift

**Failing businesses think**: "Marketing is an expense"
**Successful businesses know**: "Marketing is an investment"

When you find marketing that works, it pays for itself many times over. A $1,000 monthly marketing investment that brings in $5,000 in new revenue is a 400% ROI—better than any stock market return.

## Your Next Steps

1. **Audit your current efforts**: What's working? What isn't?
2. **Choose one strategy**: Focus beats scattered efforts every time
3. **Set clear goals**: Revenue goals, not vanity metrics
4. **Give it time**: Commit to 90 days minimum
5. **Track everything**: You can't improve what you don't measure

## Conclusion

The difference between the 10% who succeed and the 90% who fail isn't talent, luck, or budget—it's approach. Successful businesses treat marketing as a strategic investment, not a necessary evil.

They focus on their ideal customers, create valuable content, build systems that work while they sleep, and continuously optimize based on real data.

**The question isn't whether digital marketing works—it's whether you're willing to do it right.**

Ready to join the 10% who succeed? Stop making these costly mistakes and start implementing the SCALE method today. Your future self (and your bank account) will thank you.
    `,
    author: "Marketing Team",
    publishedAt: "2024-10-28",
    category: "Digital Marketing",
    tags: ["small business", "digital marketing", "strategy", "common mistakes", "success framework"],
    readTime: "15 min read",
    featured: true,
  },
  {
    id: "1",
    slug: "10-digital-marketing-strategies-2024",
    title: "10 Digital Marketing Strategies That Actually Work in 2024",
    excerpt: "Discover the most effective digital marketing strategies that are driving real results for businesses in 2024. From AI automation to social media mastery.",
    content: `
# 10 Digital Marketing Strategies That Actually Work in 2024

The digital marketing landscape is evolving faster than ever. What worked in 2023 might already be obsolete. To stay ahead of the competition, you need to adapt to the latest trends and technologies. Here are 10 proven strategies that are driving real results in 2024.

## 1. AI-Powered Marketing Automation
Artificial Intelligence is no longer a futuristic concept; it's a present-day necessity. From predictive analytics to personalized customer journeys, AI tools are helping businesses automate repetitive tasks and make data-driven decisions with unprecedented accuracy.

## 2. Short-Form Video Mastery
With the rise of TikTok, Instagram Reels, and YouTube Shorts, short-form video content has become the most engaging way to reach audiences. The key is to be authentic, entertaining, and provide value in 60 seconds or less.

## 3. Hyper-Personalized Email Marketing
Generic newsletters are dead. In 2024, success in email marketing comes from advanced segmentation and dynamic content that speaks directly to the individual recipient's needs, behaviors, and preferences.

## 4. Zero-Party Data Collection
As privacy regulations tighten and third-party cookies disappear, collecting data directly from your customers (zero-party data) through surveys, quizzes, and direct interactions is crucial for building trust and personalization.

## 5. Voice Search Optimization
As more people use smart speakers and voice assistants, optimizing your content for natural language queries is essential. Focus on long-tail keywords and answering specific questions your customers might ask.

## 6. Social Commerce Integration
Platforms like Instagram and TikTok are becoming full-fledged shopping destinations. Integrating your product catalog directly into your social media presence allows for a seamless "see-to-buy" experience for your customers.

## 7. Influencer Whitelisting
Beyond simple sponsored posts, influencer whitelisting involves brands running ads through an influencer's social media account. This combines the authenticity of the influencer with the targeting power of paid social ads.

## 8. Community-Led Growth
Building a community around your brand—whether through Facebook groups, Discord servers, or private forums—creates loyal advocates and provides invaluable feedback directly from your most engaged users.

## 9. Agile Marketing
The ability to pivot quickly is a competitive advantage. Agile marketing involves using data and analytics to continuously test, learn, and optimize your campaigns in real-time rather than sticking to a rigid annual plan.

## 10. Sustainability and Purpose-Driven Messaging
Modern consumers, especially Gen Z and Millennials, want to buy from brands that align with their values. Communicating your commitment to sustainability and social responsibility is no longer optional—it's a core part of your brand identity.

## Conclusion
Success in 2024 requires a mix of cutting-edge technology and human-centric connection. By implementing these 10 strategies, you'll be well-positioned to grow your business and outpace the competition in the year ahead.
    `,
    author: "Marketing Team",
    publishedAt: "2024-01-15",
    category: "Digital Marketing",
    tags: ["digital marketing", "strategy", "2024 trends", "ROI"],
    readTime: "8 min read",
    featured: false,
  },
  {
    id: "2",
    slug: "ai-revolutionizing-content-creation",
    title: "How AI is Revolutionizing Content Creation for Small Businesses",
    excerpt: "Learn how artificial intelligence is transforming content creation and how small businesses can leverage AI tools to compete with larger companies.",
    content: `
# How AI is Revolutionizing Content Creation for Small Businesses

For a long time, high-quality content creation was a luxury reserved for companies with large marketing budgets. That's changing. Artificial Intelligence (AI) is leveling the playing field, allowing small businesses to produce professional-grade content at a fraction of the cost and time.

## Breaking the Content Bottleneck
The biggest challenge for most small business owners is time. You're wearing ten different hats, and writing blog posts or creating social media graphics often falls to the bottom of the list. AI tools can act as your "content co-pilot," handling the heavy lifting and allowing you to focus on strategy and final polish.

## 5 Ways AI is Changing the Game

### 1. Instant Idea Generation
Staring at a blank page is the hardest part of content creation. AI tools like ChatGPT or Claude can generate hundreds of content ideas, headlines, and outlines based on your industry and target audience in seconds.

### 2. Scaling Production Without Scaling Costs
In the past, doubling your content output meant doubling your team or your freelance budget. With AI, you can take one core idea (like a blog post) and quickly repurpose it into social media captions, email newsletters, and video scripts.

### 3. Professional Visuals on a Budget
Tools like Midjourney, DALL-E, and Canva's Magic Studio are making it possible for non-designers to create stunning, unique visuals for their brand without needing a full-time graphic designer.

### 4. Personalization at Scale
AI can analyze customer data to help you create content that speaks directly to different segments of your audience, making your marketing feel more personal and relevant.

### 5. Effortless Translation and Localization
Expanding to new markets? AI-powered translation tools are now accurate enough to help you localize your content for different languages and cultures with minimal manual effort.

## The Human Factor: Why AI Can't Do It All
While AI is powerful, it's not a replacement for human creativity and judgment. The most successful businesses use AI to handle the *mechanics* of content creation while the *strategy, voice, and unique perspective* come from the humans behind the brand.

## Getting Started with AI Content Creation
1. **Start Small**: Choose one area (like social media captions) to experiment with AI.
2. **Focus on Quality**: Don't just publish what the AI gives you; always edit and add your brand's unique voice.
3. **Stay Transparent**: Be honest with your audience about how you use AI in your processes.

## Conclusion
AI is a tool, not a replacement. For small businesses, it's an incredible opportunity to compete with the "big guys" and share their story with the world more effectively than ever before.
    `,
    author: "Marketing Team",
    publishedAt: "2024-01-10",
    category: "AI & Automation",
    tags: ["AI", "content creation", "small business", "automation"],
    readTime: "6 min read",
    featured: true,
  },
  {
    id: "3",
    slug: "local-seo-guide-service-businesses",
    title: "The Complete Guide to Local SEO for Service-Based Businesses",
    excerpt: "Master local SEO with our comprehensive guide. Learn how to dominate local search results and attract more customers in your area.",
    content: `
# The Complete Guide to Local SEO for Service-Based Businesses

If you're a plumber in Phoenix or a lawyer in London, you don't need to rank globally—you need to rank for the people in your neighborhood. That's where Local SEO comes in. This guide will show you how to dominate local search results and become the "go-to" business in your area.

## What is Local SEO?
Local SEO is the practice of optimizing your online presence to attract more business from relevant local searches. These are the "near me" searches or searches that include a specific city or neighborhood name.

## The Pillars of Local SEO Success

### 1. Optimize Your Google Business Profile (GBP)
Your GBP is the single most important factor in local SEO.
- **Claim and Verify**: Make sure you own your listing.
- **Complete Every Section**: Add your hours, services, and a detailed description.
- **Add High-Quality Photos**: Show off your work, your team, and your office.
- **Post Updates Regularly**: Use GBP posts to share news and offers.

### 2. Master the Art of Review Management
Reviews are a major ranking factor and a powerful trust signal.
- **Ask for Reviews**: Don't be shy; ask your happy customers to leave feedback.
- **Respond to All Reviews**: Yes, even the bad ones. It shows you care about customer service.
- **Keyword-Rich Reviews**: While you can't control what customers say, reviews that mention your services and location can help your rankings.

### 3. Local Citations and NAP Consistency
NAP stands for Name, Address, and Phone number.
- **Be Consistent**: Ensure your NAP is identical across your website, social media, and local directories (like Yelp or Yellow Pages).
- **Audit Your Citations**: Use tools to find and fix any incorrect information about your business online.

### 4. On-Page Local Signals
Your website needs to tell search engines exactly where you are and what you do.
- **Location Pages**: If you serve multiple areas, create a dedicated page for each one.
- **Embed a Google Map**: Make it easy for people and search engines to find you.
- **Use Local Keywords**: Include your city and neighborhood names in your headers and content.

### 5. Build Local Backlinks
Links from other local businesses, newspapers, and community organizations carry a lot of weight in local search.
- **Sponsor Local Events**: Get your name (and a link) on local community websites.
- **Guest Post on Local Blogs**: Share your expertise with your local audience.

## Measuring Your Local SEO ROI
Don't just track rankings; track results.
- **Google Business Profile Insights**: See how many people are calling you or asking for directions from your listing.
- **Track Phone Calls**: Use call tracking to see which leads came from local search.
- **Monitor Local Search Traffic**: Use Google Analytics to see how many people are finding your site through local queries.

## Conclusion
Local SEO is a marathon, not a sprint. By consistently following these steps, you'll build a strong local presence that brings in more customers and helps your business thrive in your community.
    `,
    author: "Marketing Team",
    publishedAt: "2024-01-05",
    category: "SEO",
    tags: ["local SEO", "Google My Business", "local search", "service business"],
    readTime: "12 min read",
    featured: false,
  },
  {
    id: "4",
    slug: "social-media-platform-focus",
    title: "Social Media Marketing: Which Platforms Should Your Business Focus On?",
    excerpt: "Not all social media platforms are created equal. Learn which platforms will give you the best ROI for your specific business type.",
    content: `
# Social Media Marketing: Which Platforms Should Your Business Focus On?

One of the most common mistakes small businesses make is trying to be everywhere at once. The result? A scattered presence that yields little to no results. The secret to social media success is focus. Today, we'll help you identify which platforms are actually worth your time and effort.

## The Golden Rule: Go Where Your Customers Are
Before you post a single thing, you need to know who your ideal customer is and where they hang out online. Are you targeting B2B professionals, stay-at-home parents, or Gen Z fashionistas?

## Platform Breakdown: Pros and Cons

### Instagram: The Visual Powerhouse
- **Best For**: B2C brands, lifestyle businesses, e-commerce, fashion, food, and travel.
- **Pros**: High engagement, powerful visual storytelling, integrated shopping features.
- **Cons**: Requires high-quality visual content, can be time-consuming.

### LinkedIn: The Professional Network
- **Best For**: B2B companies, professional services, recruiting, and thought leadership.
- **Pros**: Direct access to decision-makers, high trust factor, great for networking.
- **Cons**: Content needs to be more "professional," lower engagement on non-business topics.

### TikTok: The Attention Magnet
- **Best For**: Brands targeting younger audiences (Gen Z and Millennials), creative B2C brands.
- **Pros**: Incredible organic reach potential, highly engaging video format.
- **Cons**: Requires consistent video production, fast-moving trends.

### Facebook: The Community Hub
- **Best For**: Local businesses, community-based brands, and targeting older demographics.
- **Pros**: Largest user base, powerful advertising platform, Facebook Groups for community building.
- **Cons**: Organic reach is very low for business pages, "pay-to-play" environment.

### Pinterest: The Discovery Engine
- **Best For**: Home decor, DIY, fashion, weddings, and anything "aspirational."
- **Pros**: Content has a long shelf life, drives high-quality traffic to websites.
- **Cons**: Requires specific "pinnable" graphics, slow to build momentum.

## How to Choose Your Primary Platforms
1. **Define Your Goals**: Do you want brand awareness, website traffic, or direct sales?
2. **Analyze Your Competition**: Where are they seeing success?
3. **Assess Your Resources**: Do you have the time to create video content daily?
4. **Start with Two**: Pick two platforms and master them before expanding.

## Conclusion
You don't need to be a social media superstar on every platform. By focusing your efforts on the channels that truly resonate with your audience, you'll see a much better return on your investment and build a more meaningful connection with your customers.
    `,
    author: "Marketing Team",
    publishedAt: "2024-01-01",
    category: "Social Media",
    tags: ["social media", "platform strategy", "ROI", "engagement"],
    readTime: "7 min read",
    featured: false,
  },
  {
    id: "5",
    slug: "email-marketing-automation-guide",
    title: "Email Marketing Automation: From Beginner to Advanced",
    excerpt: "Transform your email marketing with automation. Learn how to set up effective email sequences that convert prospects into customers.",
    content: `
# Email Marketing Automation: From Beginner to Advanced

Email marketing remains one of the highest ROI channels in digital marketing. But sending manual emails is a recipe for burnout. Automation allows you to deliver the right message to the right person at the right time—automatically. Here's how to build an email automation machine that works while you sleep.

## Level 1: The Essentials (The Beginner)
If you're just starting, focus on these three foundational sequences.
- **The Welcome Sequence**: Introduce your brand to new subscribers and deliver your lead magnet.
- **The Abandoned Cart Sequence**: Gently remind people who left items in their cart to complete their purchase.
- **The Post-Purchase Follow-up**: Thank customers for their order and provide helpful information on how to use their new product.

## Level 2: Building Momentum (The Intermediate)
Once the basics are in place, start adding more sophisticated triggers.
- **Browse Abandonment**: Email people who viewed a specific product but didn't add it to their cart.
- **Re-engagement Campaigns**: Automatically reach out to subscribers who haven't opened an email in 60-90 days.
- **Segmentation by Behavior**: Tag subscribers based on the links they click, allowing you to send more targeted offers in the future.

## Level 3: Advanced Optimization (The Pro)
This is where you truly maximize your revenue.
- **Dynamic Content**: Change the content of your emails based on a subscriber's past purchases or preferences.
- **Lead Scoring**: Assign points to subscribers based on their interactions, and automatically notify your sales team when someone becomes a "hot lead."
- **A/B Testing Automations**: Test different subject lines or CTAs within your automated sequences to see what performs best.

## 5 Best Practices for Email Automation
1. **Don't Over-Automate**: Keep your emails feeling human and personal.
2. **Watch Your Frequency**: Don't overwhelm your subscribers with too many automated messages.
3. **Monitor Your Results**: Regularly check your open and click-through rates to ensure your sequences are still effective.
4. **Keep Your List Clean**: Regularly remove inactive subscribers to maintain high deliverability.
5. **Always Provide Value**: Every email should offer something useful to the recipient, even if it's a promotional message.

## Conclusion
Email automation is the ultimate "force multiplier" for your marketing. By investing the time to set up these systems now, you'll create a repeatable revenue stream that grows along with your business.
    `,
    author: "Marketing Team",
    publishedAt: "2023-12-28",
    category: "Email Marketing",
    tags: ["email marketing", "automation", "conversion", "sequences"],
    readTime: "10 min read",
    featured: false,
  },
  {
    id: "6",
    slug: "mobile-first-marketing-strategy",
    title: "Why Your Business Needs a Mobile-First Marketing Strategy",
    excerpt: "With over 60% of web traffic coming from mobile devices, learn why a mobile-first approach is crucial for your marketing success.",
    content: `
# Why Your Business Needs a Mobile-First Marketing Strategy

The world has gone mobile. For most of your customers, their smartphone isn't just a communication device—it's their primary way of interacting with the world. If your marketing isn't optimized for mobile, you're essentially invisible to more than half of your potential audience.

## The Reality of the Mobile-First World
- **Over 60% of global web traffic** now comes from mobile devices.
- **Google uses mobile-first indexing**, meaning it primarily uses the mobile version of your site for ranking and indexing.
- **Consumers are more likely to buy** from a business whose mobile site is easy to navigate.

## Key Elements of a Mobile-First Strategy

### 1. Responsive Website Design
Your website must look and function perfectly on screens of all sizes. This isn't just about shrinking your desktop site; it's about re-thinking the user experience for touchscreens and vertical scrolling.

### 2. Speed is Everything
Mobile users are impatient. If your site takes more than 3 seconds to load, you'll lose a significant portion of your traffic. Optimize images, minimize code, and use a fast hosting provider.

### 3. SMS Marketing: The Direct Line
SMS has open rates as high as 98%. It's an incredibly powerful way to deliver urgent offers, appointment reminders, and personalized updates directly to your customers' pockets.

### 4. PWA (Progressive Web App) Advantages
A PWA gives your website app-like functionality, including offline access and push notifications, without requiring users to download anything from an app store.

### 5. Vertical Video Content
With platforms like TikTok and Instagram Reels, vertical video is the new standard. Create content specifically designed to be viewed on a smartphone.

## Common Mobile Marketing Mistakes to Avoid
- **Hard-to-Click Buttons**: Make sure your CTAs are large enough for thumbs.
- **Too Much Text**: Use concise, punchy copy that's easy to read on a small screen.
- **Intrusive Pop-ups**: Ensure your pop-ups don't block the entire screen on mobile.
- **Non-Optimized Forms**: Keep forms short and use mobile-friendly input types (like numeric keypads for phone numbers).

## Conclusion
Mobile-first marketing isn't a trend; it's the new reality. By prioritizing the mobile experience, you'll provide a better experience for your customers, improve your search rankings, and ultimately drive more conversions for your business.
    `,
    author: "Marketing Team",
    publishedAt: "2023-12-25",
    category: "Mobile Marketing",
    tags: ["mobile marketing", "responsive design", "mobile-first", "user experience"],
    readTime: "5 min read",
    featured: false,
  },
  {
    id: "9",
    slug: "building-brand-identity-guide",
    title: "Building a Brand Identity That Lasts: A Step-by-Step Guide",
    excerpt: "Your brand is more than just a logo. Learn how to build a comprehensive brand identity that resonates with your audience and stands the test of time.",
    content: `
# Building a Brand Identity That Lasts: A Step-by-Step Guide

In a crowded marketplace, your brand identity is what sets you apart. It's the personality of your business and the promise you make to your customers. Building a strong brand isn't just for big corporations; it's essential for businesses of all sizes.

## 1. Define Your Core Values
What does your business stand for? Your values are the foundation of your brand. They guide your decisions, your culture, and how you interact with your customers.

## 2. Know Your Audience
You can't build a brand for everyone. Identify your ideal customer—their needs, their pain points, and what they value. Your brand should speak directly to them.

## 3. Develop Your Brand Personality
If your brand were a person, what would they be like? Are they professional and authoritative, or fun and approachable? This personality should be consistent across all your touchpoints.

## 4. Craft Your Visual Identity
This includes your logo, color palette, typography, and imagery. These elements should work together to visually communicate your brand's personality and values.

## 5. Find Your Brand Voice
The way you speak to your audience is just as important as how you look. Develop a consistent brand voice for your website, social media, and customer communication.

## 6. Be Consistent
Consistency is the key to building brand recognition and trust. Ensure that your brand is represented uniformly across every platform and interaction.

## Conclusion
A strong brand identity is an investment in your business's future. By following these steps, you'll create a brand that not only attracts customers but builds long-term loyalty and trust.
    `,
    author: "Marketing Team",
    publishedAt: "2024-02-01",
    category: "Branding",
    tags: ["branding", "identity", "strategy", "design"],
    readTime: "9 min read",
    featured: false,
  },
  {
    id: "10",
    slug: "power-of-video-marketing",
    title: "The Power of Video Marketing: Why You Can't Afford to Ignore It",
    excerpt: "Video is no longer just an option; it's a necessity. Discover why video marketing is so effective and how you can start using it to grow your business.",
    content: `
# The Power of Video Marketing: Why You Can't Afford to Ignore It

If a picture is worth a thousand words, a video is worth a million. Video marketing has become one of the most powerful tools in a marketer's arsenal, driving higher engagement, better recall, and more conversions than any other medium.

## Why Video Works
- **High Engagement**: Video captures attention more effectively than text or images alone.
- **Improved Trust**: Seeing and hearing the people behind a brand builds trust and authenticity.
- **Better Recall**: People remember 95% of a message when they watch it in a video compared to 10% when reading it in text.
- **SEO Benefits**: Websites with video are more likely to rank higher in search results.

## Types of Video for Your Business
- **Explainer Videos**: Quickly show how your product or service works.
- **Customer Testimonials**: Let your happy customers do the talking for you.
- **Behind-the-Scenes**: Give your audience a look at the "real" side of your business.
- **Tutorials and How-Tos**: Provide value by teaching your audience something new.

## Getting Started with Video
You don't need a Hollywood budget to start with video. In fact, authentic, low-production-value videos often perform better on social media. Start with your smartphone and focus on delivering valuable content.

## Conclusion
The future of marketing is video. By incorporating video into your strategy today, you'll be better positioned to connect with your audience and achieve your business goals.
    `,
    author: "Marketing Team",
    publishedAt: "2024-02-05",
    category: "Digital Marketing",
    tags: ["video marketing", "content strategy", "engagement", "growth"],
    readTime: "7 min read",
    featured: false,
  },
  {
    id: "11",
    slug: "mastering-google-ads-tips",
    title: "Mastering Google Ads: Tips for High-Converting Campaigns",
    excerpt: "Stop wasting money on ineffective ads. Learn how to create Google Ads campaigns that actually drive leads and sales for your business.",
    content: `
# Mastering Google Ads: Tips for High-Converting Campaigns

Google Ads is one of the fastest ways to get your business in front of people who are actively looking for what you offer. But without a clear strategy, it's also a very easy way to waste a lot of money. Here are our top tips for creating high-converting campaigns.

## 1. Focus on Intent-Based Keywords
Don't just target broad terms. Focus on "long-tail" keywords that indicate a high intent to buy, such as "plumber in Chicago" or "best CRM for small business."

## 2. Write Compelling Ad Copy
Your ad needs to stand out and give people a reason to click. Highlight your unique selling points and include a clear call-to-action (CTA).

## 3. Use Ad Extensions
Ad extensions provide more information and give your ad more real estate on the search results page. Use site links, callouts, and location extensions to improve your click-through rate.

## 4. Optimize Your Landing Pages
The ad is only half the battle. Your landing page needs to be relevant to the ad, easy to navigate, and optimized for conversions.

## 5. Track Everything
You can't improve what you don't measure. Use conversion tracking to see exactly which keywords and ads are driving sales, and adjust your budget accordingly.

## Conclusion
Google Ads can be an incredible growth engine for your business when done correctly. By focusing on intent, quality, and measurement, you can create campaigns that deliver a strong return on investment.
    `,
    author: "Marketing Team",
    publishedAt: "2024-02-10",
    category: "Paid Ads",
    tags: ["Google Ads", "SEM", "PPC", "conversion optimization"],
    readTime: "11 min read",
    featured: false,
  },
  {
    id: "12",
    slug: "future-of-marketing-trends-2025",
    title: "The Future of Marketing: 5 Trends to Watch in 2025",
    excerpt: "The marketing world is changing rapidly. Stay ahead of the curve with our predictions for the top 5 marketing trends that will dominate in 2025.",
    content: `
# The Future of Marketing: 5 Trends to Watch in 2025

As we look ahead to 2025, the intersection of technology and human connection will continue to redefine how brands and consumers interact. Here are the five trends we believe will shape the future of marketing.

## 1. The Rise of "Human-Centric" AI
While AI will become even more integrated into our workflows, the focus will shift from purely automated efficiency to using AI to enhance human creativity and empathy. Brands that use AI to facilitate more meaningful human connections will win.

## 2. Privacy-First Personalization
As consumers become more protective of their data, brands will need to find new ways to provide personalized experiences without infringing on privacy. Transparent, value-driven data exchanges will become the norm.

## 3. Interactive and Immersive Experiences
From augmented reality (AR) shopping to interactive video content, consumers will expect more immersive and engaging experiences from the brands they follow.

## 4. The "Micro-Community" Revolution
Broad social media reach will continue to decline in importance compared to the depth of engagement within small, highly-targeted micro-communities. Brands will focus on building "tribes" rather than just "audiences."

## 5. Sustainable and Ethical Branding as a Default
Sustainability and ethics will move from being a "nice-to-have" or a marketing angle to a default expectation. Every part of a brand's operations will be under scrutiny.

## Conclusion
The future belongs to the brands that can balance technological innovation with a deep understanding of human needs and values. Stay curious, stay adaptable, and keep your customers at the heart of everything you do.
    `,
    author: "Marketing Team",
    publishedAt: "2024-02-15",
    category: "Digital Marketing",
    tags: ["marketing trends", "future of marketing", "2025 predictions", "AI"],
    readTime: "8 min read",
    featured: false,
  },
];

const categories = ["All", "Digital Marketing", "AI & Automation", "SEO", "Social Media", "Email Marketing", "Mobile Marketing", "Branding", "Paid Ads"];

export default function BlogPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [viewingPost, setViewingPost] = useState<BlogPost | null>(null);

  // SEO Management
  useDocumentMeta(viewingPost ? {
    title: viewingPost.title,
    description: viewingPost.excerpt,
    ogTitle: viewingPost.title,
    ogDescription: viewingPost.excerpt,
    ogType: "article",
    canonical: `https://www.marketingteam.app/blog?post=${viewingPost.slug}`
  } : {
    title: "Marketing Insights & News | Marketing Team App",
    description: "Stay ahead with expert tips on digital marketing, AI automation, SEO, social media and growth from the Marketing Team App.",
    canonical: "https://www.marketingteam.app/blog"
  });

  // JSON-LD Structured Data for SEO
  const jsonLd = viewingPost ? {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    "headline": viewingPost.title,
    "description": viewingPost.excerpt,
    "author": {
      "@type": "Organization",
      "name": "Marketing Team"
    },
    "publisher": {
      "@type": "Organization",
      "name": "Marketing Team App",
      "logo": {
        "@type": "ImageObject",
        "url": "https://www.marketingteam.app/logo.png"
      }
    },
    "datePublished": viewingPost.publishedAt,
    "mainEntityOfPage": {
      "@type": "WebPage",
      "@id": `https://www.marketingteam.app/blog?post=${viewingPost.slug}`
    }
  } : null;

  const filteredPosts = blogPosts
    .filter(post => {
      const matchesSearch = post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           post.excerpt.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           post.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchesCategory = selectedCategory === "All" || post.category === selectedCategory;
      return matchesSearch && matchesCategory;
    })
    .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());

  const featuredPosts = blogPosts
    .filter(post => post.featured)
    .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());
  const regularPosts = filteredPosts.filter(post => !post.featured);

  if (viewingPost) {
    return (
      <div className="min-h-screen bg-white">
        {jsonLd && (
          <script type="application/ld+json">
            {JSON.stringify(jsonLd)}
          </script>
        )}
        {/* Header */}
        <header className="sticky top-0 z-50 w-full border-b bg-white/80 backdrop-blur-md">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <Link href="/">
                <HeaderLogo />
              </Link>
              <div className="flex items-center gap-4">
                <Button variant="ghost" size="sm" onClick={() => setViewingPost(null)}>
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Blog
                </Button>
                <Link href="/signup">
                  <Button size="sm">Get Started</Button>
                </Link>
              </div>
            </div>
          </div>
        </header>

        <article className="container mx-auto max-w-4xl py-12 px-4">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => setViewingPost(null)}
            className="mb-8"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Articles
          </Button>

          <div className="flex items-center gap-2 mb-6">
            <Badge variant="secondary" className="bg-primary/10 text-primary px-3 py-1">
              {viewingPost.category}
            </Badge>
            <span className="text-sm text-muted-foreground">{viewingPost.readTime}</span>
          </div>

          <h1 className="text-4xl md:text-5xl font-bold mb-6 text-gray-900 leading-tight">
            {viewingPost.title}
          </h1>

          <div className="flex items-center gap-4 mb-10 pb-10 border-b">
            <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
              <User className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="font-semibold text-gray-900">{viewingPost.author}</p>
              <p className="text-sm text-muted-foreground">
                Published on {new Date(viewingPost.publishedAt).toLocaleDateString(undefined, {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </p>
            </div>
          </div>

          <div className="prose prose-lg max-w-none prose-headings:text-gray-900 prose-p:text-gray-700 prose-strong:text-gray-900 prose-a:text-primary">
            <div className="whitespace-pre-wrap leading-relaxed">
              {viewingPost.content}
            </div>
          </div>

          <div className="mt-12 pt-10 border-t">
            <h3 className="text-xl font-bold mb-4">Tags</h3>
            <div className="flex flex-wrap gap-2">
              {viewingPost.tags.map(tag => (
                <Badge key={tag} variant="outline" className="px-3 py-1">
                  <Tag className="w-3 h-3 mr-2" />
                  {tag}
                </Badge>
              ))}
            </div>
          </div>

          <div className="mt-16 bg-blue-50 rounded-2xl p-8 text-center">
            <h2 className="text-2xl font-bold mb-4">Enjoyed this article?</h2>
            <p className="text-lg text-gray-600 mb-6 max-w-2xl mx-auto">
              Get more marketing tips and expert strategies delivered to your inbox. Join 500+ businesses growing with Marketing Team App.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/signup">
                <Button size="lg">Get Started Free</Button>
              </Link>
              <Link href="/contact">
                <Button size="lg" variant="outline">Book a Strategy Call</Button>
              </Link>
            </div>
          </div>
        </article>

        {/* Footer */}
        <footer className="bg-gray-900 text-white py-12 mt-20">
          <div className="container mx-auto px-4 text-center flex flex-col items-center">
            <Link href="/">
              <FooterLogo className="mx-auto mb-4 cursor-pointer" />
            </Link>
            <p className="text-gray-400">
              © {new Date().getFullYear()} Marketing Team App. All rights reserved.
            </p>
          </div>
        </footer>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 overflow-x-hidden">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-white/80 backdrop-blur-md">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/">
              <HeaderLogo />
            </Link>
            <div className="flex items-center gap-4">
              <Link href="/">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Home
                </Button>
              </Link>
              <Link href="/login">
                <Button variant="outline" size="sm">Login</Button>
              </Link>
              <Link href="/signup">
                <Button size="sm">Get Started</Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-16 px-4 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 text-white">
        <div className="container mx-auto max-w-6xl text-center">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
            Marketing Insights & News
          </h1>
          <p className="text-xl md:text-2xl text-blue-100 max-w-3xl mx-auto mb-8">
            Stay ahead of the curve with the latest digital marketing trends, strategies, and insights from our expert team.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center max-w-md mx-auto">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search articles..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-white/90 border-white/20 text-gray-900 placeholder-gray-500"
              />
            </div>
            <Button 
              onClick={() => setSearchTerm("")}
              variant="outline"
              className="bg-white/10 border-white/20 text-white hover:bg-white/20"
            >
              Clear
            </Button>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="py-8 px-4 bg-white border-b">
        <div className="container mx-auto max-w-6xl">
          <div className="flex flex-wrap gap-2 justify-center">
            {categories.map((category) => (
              <Button
                key={category}
                variant={selectedCategory === category ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedCategory(category)}
                className="mb-2"
              >
                {category}
              </Button>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Posts */}
      {selectedCategory === "All" && (
        <section className="py-12 px-4">
          <div className="container mx-auto max-w-6xl">
            <h2 className="text-3xl font-bold text-center mb-8">Featured Articles</h2>
            <div className="grid md:grid-cols-2 gap-8">
              {featuredPosts.map((post) => (
                <Card key={post.id} className="group hover:shadow-xl transition-all duration-300 border-2 hover:border-primary/20">
                  <CardHeader>
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="secondary" className="bg-primary/10 text-primary">
                        {post.category}
                      </Badge>
                      <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                        Featured
                      </Badge>
                    </div>
                    <CardTitle className="text-xl group-hover:text-primary transition-colors">
                      {post.title}
                    </CardTitle>
                    <CardDescription className="text-base">
                      {post.excerpt}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between text-sm text-muted-foreground mb-4">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-1">
                          <User className="w-4 h-4" />
                          <span>{post.author}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          <span>{new Date(post.publishedAt).toLocaleDateString()}</span>
                        </div>
                        <span>{post.readTime}</span>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-1 mb-4">
                      {post.tags.map((tag) => (
                        <Badge key={tag} variant="outline" className="text-xs">
                          <Tag className="w-3 h-3 mr-1" />
                          {tag}
                        </Badge>
                      ))}
                    </div>
                    <Button 
                      className="w-full group-hover:bg-primary group-hover:text-white transition-colors"
                      onClick={() => setViewingPost(post)}
                    >
                      Read More
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* All Posts */}
      <section className="py-12 px-4 bg-gray-50">
        <div className="container mx-auto max-w-6xl">
          <h2 className="text-3xl font-bold text-center mb-8">
            {selectedCategory === "All" ? "All Articles" : `${selectedCategory} Articles`}
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {regularPosts.map((post) => (
              <Card key={post.id} className="group hover:shadow-lg transition-all duration-300 cursor-pointer" onClick={() => setViewingPost(post)}>
                <CardHeader>
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="secondary" className="bg-primary/10 text-primary">
                      {post.category}
                    </Badge>
                  </div>
                  <CardTitle className="text-lg group-hover:text-primary transition-colors line-clamp-2">
                    {post.title}
                  </CardTitle>
                  <CardDescription className="line-clamp-3">
                    {post.excerpt}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between text-sm text-muted-foreground mb-3">
                    <div className="flex items-center gap-1">
                      <User className="w-4 h-4" />
                      <span>{post.author}</span>
                    </div>
                    <span>{post.readTime}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm text-muted-foreground mb-4">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      <span>{new Date(post.publishedAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1 mb-4">
                    {post.tags.slice(0, 2).map((tag) => (
                      <Badge key={tag} variant="outline" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                    {post.tags.length > 2 && (
                      <Badge variant="outline" className="text-xs">
                        +{post.tags.length - 2} more
                      </Badge>
                    )}
                  </div>
                  <Button 
                    variant="outline" 
                    className="w-full group-hover:bg-primary group-hover:text-white transition-colors"
                    onClick={(e) => {
                      e.stopPropagation();
                      setViewingPost(post);
                    }}
                  >
                    Read More
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
          {regularPosts.length === 0 && (
            <div className="text-center py-12">
              <p className="text-muted-foreground text-lg">No articles found matching your criteria.</p>
              <Button 
                variant="outline" 
                onClick={() => {
                  setSearchTerm("");
                  setSelectedCategory("All");
                }}
                className="mt-4"
              >
                Clear Filters
              </Button>
            </div>
          )}
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 px-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white">
        <div className="container mx-auto max-w-4xl text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Ready to Transform Your Marketing?
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            Join 500+ businesses who are already seeing 3x results with our proven marketing strategies.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/signup">
              <Button size="lg" className="bg-white text-blue-600 hover:bg-blue-50">
                Get Started Free
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
            <Link href="/contact">
              <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10">
                Book Strategy Call
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="container mx-auto px-4 text-center flex flex-col items-center">
          <Link href="/">
            <FooterLogo className="mx-auto mb-4 cursor-pointer" />
          </Link>
          <p className="text-gray-400">
            © {new Date().getFullYear()} Marketing Team App. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}

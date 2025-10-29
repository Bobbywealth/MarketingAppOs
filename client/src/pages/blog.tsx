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
    title: "10 Digital Marketing Strategies That Actually Work in 2024",
    excerpt: "Discover the most effective digital marketing strategies that are driving real results for businesses in 2024. From AI automation to social media mastery.",
    content: "Full content here...",
    author: "Marketing Team",
    publishedAt: "2024-01-15",
    category: "Digital Marketing",
    tags: ["digital marketing", "strategy", "2024 trends", "ROI"],
    readTime: "8 min read",
    featured: false,
  },
  {
    id: "2",
    title: "How AI is Revolutionizing Content Creation for Small Businesses",
    excerpt: "Learn how artificial intelligence is transforming content creation and how small businesses can leverage AI tools to compete with larger companies.",
    content: "Full content here...",
    author: "Marketing Team",
    publishedAt: "2024-01-10",
    category: "AI & Automation",
    tags: ["AI", "content creation", "small business", "automation"],
    readTime: "6 min read",
    featured: true,
  },
  {
    id: "3",
    title: "The Complete Guide to Local SEO for Service-Based Businesses",
    excerpt: "Master local SEO with our comprehensive guide. Learn how to dominate local search results and attract more customers in your area.",
    content: "Full content here...",
    author: "Marketing Team",
    publishedAt: "2024-01-05",
    category: "SEO",
    tags: ["local SEO", "Google My Business", "local search", "service business"],
    readTime: "12 min read",
    featured: false,
  },
  {
    id: "4",
    title: "Social Media Marketing: Which Platforms Should Your Business Focus On?",
    excerpt: "Not all social media platforms are created equal. Learn which platforms will give you the best ROI for your specific business type.",
    content: "Full content here...",
    author: "Marketing Team",
    publishedAt: "2024-01-01",
    category: "Social Media",
    tags: ["social media", "platform strategy", "ROI", "engagement"],
    readTime: "7 min read",
    featured: false,
  },
  {
    id: "5",
    title: "Email Marketing Automation: From Beginner to Advanced",
    excerpt: "Transform your email marketing with automation. Learn how to set up effective email sequences that convert prospects into customers.",
    content: "Full content here...",
    author: "Marketing Team",
    publishedAt: "2023-12-28",
    category: "Email Marketing",
    tags: ["email marketing", "automation", "conversion", "sequences"],
    readTime: "10 min read",
    featured: false,
  },
  {
    id: "6",
    title: "Why Your Business Needs a Mobile-First Marketing Strategy",
    excerpt: "With over 60% of web traffic coming from mobile devices, learn why a mobile-first approach is crucial for your marketing success.",
    content: "Full content here...",
    author: "Marketing Team",
    publishedAt: "2023-12-25",
    category: "Mobile Marketing",
    tags: ["mobile marketing", "responsive design", "mobile-first", "user experience"],
    readTime: "5 min read",
    featured: false,
  },
];

const categories = ["All", "Digital Marketing", "AI & Automation", "SEO", "Social Media", "Email Marketing", "Mobile Marketing"];

export default function BlogPage() {
  useDocumentMeta(
    "Marketing Insights & News | Marketing Team App",
    "Stay ahead with expert tips on digital marketing, AI automation, SEO, social media and growth from the Marketing Team App."
  );
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");

  const filteredPosts = blogPosts.filter(post => {
    const matchesSearch = post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         post.excerpt.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         post.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCategory = selectedCategory === "All" || post.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const featuredPosts = blogPosts.filter(post => post.featured);
  const regularPosts = filteredPosts.filter(post => !post.featured);

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
                    <Button className="w-full group-hover:bg-primary group-hover:text-white transition-colors">
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
              <Card key={post.id} className="group hover:shadow-lg transition-all duration-300">
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
                  <Button variant="outline" className="w-full group-hover:bg-primary group-hover:text-white transition-colors">
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
        <div className="container mx-auto px-4 text-center">
          <FooterLogo className="mx-auto mb-4" />
          <p className="text-gray-400">
            © {new Date().getFullYear()} Marketing Team App. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}

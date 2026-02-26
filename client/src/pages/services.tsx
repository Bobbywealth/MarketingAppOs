import { Link } from "wouter";
import { ArrowRight, Rocket, PenTool, Globe, Bot, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

const services = [
  {
    icon: Rocket,
    title: "Growth Strategy",
    description: "Data-driven marketing strategies to accelerate your business growth. We analyze your market, competition, and opportunities to build a roadmap for success.",
    features: ["Market Analysis", "Competitor Research", "KPI Tracking", "Growth Roadmaps"],
  },
  {
    icon: PenTool,
    title: "Content Creation",
    description: "Engaging content that tells your brand story. From social media posts to blog articles and video content, we create content that converts.",
    features: ["Social Media Content", "Blog Writing", "Video Production", "Brand Copywriting"],
  },
  {
    icon: Globe,
    title: "Web & Apps",
    description: "Beautiful, functional websites and applications that drive results. Mobile-first design with a focus on user experience and conversions.",
    features: ["Website Design", "App Development", "Landing Pages", "E-commerce"],
  },
  {
    icon: Bot,
    title: "AI Automation",
    description: "Leverage artificial intelligence to automate your marketing workflows. Save time and increase efficiency with smart automation tools.",
    features: ["Chatbots", "Email Automation", "Lead Scoring", "Predictive Analytics"],
  },
  {
    icon: Search,
    title: "SEO & SEM",
    description: "Get found online with search engine optimization and marketing. We improve your visibility and drive qualified traffic to your business.",
    features: ["On-Page SEO", "Technical SEO", "Google Ads", "Local SEO"],
  },
];

export default function Services() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
      <header className="border-b bg-background/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/">
            <span className="text-xl font-bold bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent cursor-pointer">
              MarketingTeam.app
            </span>
          </Link>
          <div className="flex gap-3">
            <Link href="/contact">
              <Button variant="outline">Contact Us</Button>
            </Link>
            <Link href="/auth">
              <Button>Get Started</Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Our Services
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Comprehensive marketing solutions designed to grow your business. From strategy to execution, we handle it all.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {services.map((service) => (
            <Card key={service.title} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-3">
                  <service.icon className="w-6 h-6 text-primary" />
                </div>
                <CardTitle>{service.title}</CardTitle>
                <CardDescription>{service.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {service.features.map((feature) => (
                    <li key={feature} className="flex items-center gap-2 text-sm text-muted-foreground">
                      <ArrowRight className="w-4 h-4 text-primary" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="text-center mt-16">
          <h2 className="text-2xl font-bold mb-4">Ready to grow your business?</h2>
          <Link href="/contact">
            <Button size="lg">
              Book a Strategy Call <ArrowRight className="ml-2 w-4 h-4" />
            </Button>
          </Link>
        </div>
      </main>
    </div>
  );
}

import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Search,
  TrendingUp,
  Link2,
  FileText,
  BarChart3,
  Target,
  CheckCircle,
  ArrowRight,
  Award,
  Users,
  Zap,
  Globe,
} from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import mtaLogoBlue from "@assets/mta-logo-blue.png";

export default function SEOPage() {
  const services = [
    {
      icon: Search,
      title: "Keyword Research & Strategy",
      description:
        "Discover high-value keywords your customers are searching for. We analyze search intent, competition, and opportunity to build a winning keyword strategy.",
      color: "from-blue-50 to-blue-100",
      iconColor: "text-blue-600",
    },
    {
      icon: FileText,
      title: "On-Page SEO Optimization",
      description:
        "Optimize every element of your website for search engines. From meta tags to content structure, we ensure your pages are perfectly optimized for ranking.",
      color: "from-green-50 to-green-100",
      iconColor: "text-green-600",
    },
    {
      icon: Link2,
      title: "Link Building & Off-Page SEO",
      description:
        "Build authority with high-quality backlinks from reputable sites. Our white-hat link building strategies improve your domain authority and rankings.",
      color: "from-purple-50 to-purple-100",
      iconColor: "text-purple-600",
    },
    {
      icon: FileText,
      title: "Content Optimization",
      description:
        "Create and optimize content that ranks and converts. We develop SEO-friendly content that resonates with your audience and search engines alike.",
      color: "from-orange-50 to-orange-100",
      iconColor: "text-orange-600",
    },
    {
      icon: Globe,
      title: "Local SEO",
      description:
        "Dominate local search results and Google Maps. Perfect for businesses serving specific geographic areas. We optimize your Google Business Profile and local citations.",
      color: "from-red-50 to-red-100",
      iconColor: "text-red-600",
    },
    {
      icon: BarChart3,
      title: "SEO Analytics & Reporting",
      description:
        "Track your SEO performance with detailed analytics and transparent reporting. See your rankings improve and understand the ROI of your SEO investment.",
      color: "from-indigo-50 to-indigo-100",
      iconColor: "text-indigo-600",
    },
  ];

  const packages = [
    {
      name: "Local SEO",
      price: "$799",
      period: "/ month",
      features: [
        "Up to 15 Target Keywords",
        "Google Business Profile Optimization",
        "Local Citations Building",
        "Basic On-Page Optimization",
        "Monthly Progress Reports",
        "Basic Competitor Analysis",
        "3-6 Month Contract",
      ],
      color: "from-blue-500 to-blue-600",
      featured: false,
    },
    {
      name: "Growth SEO",
      price: "$1,999",
      period: "/ month",
      features: [
        "Up to 50 Target Keywords",
        "Comprehensive On-Page SEO",
        "Content Creation (4 articles/month)",
        "Quality Link Building (10 links/month)",
        "Technical SEO Audits",
        "Competitor Analysis",
        "Google Analytics & Search Console Setup",
        "Bi-weekly Progress Reports",
        "Priority Support",
        "6-12 Month Contract",
      ],
      color: "from-purple-500 to-purple-600",
      featured: true,
    },
    {
      name: "Enterprise SEO",
      price: "$4,999+",
      period: "/ month",
      features: [
        "Unlimited Target Keywords",
        "Advanced Technical SEO",
        "Content Strategy & Creation (12+ articles/month)",
        "Aggressive Link Building (25+ links/month)",
        "International/Multi-location SEO",
        "Advanced Schema Markup",
        "Core Web Vitals Optimization",
        "Weekly Strategy Calls",
        "Dedicated SEO Manager",
        "Custom Reporting Dashboard",
        "12+ Month Contract",
      ],
      color: "from-orange-500 to-red-600",
      featured: false,
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b sticky top-0 z-50 bg-white/95 backdrop-blur shadow-sm">
        <div className="container mx-auto px-4 py-3 md:py-4 flex items-center justify-between">
          <Link href="/">
            <div className="flex items-center gap-2 cursor-pointer">
              <img
                src={mtaLogoBlue}
                alt="Marketing Team App"
                className="h-10 md:h-14 w-auto"
              />
            </div>
          </Link>

          <div className="flex items-center gap-2 md:gap-4">
            <Link href="/login">
              <Button variant="ghost" className="hidden md:inline-flex">
                Login
              </Button>
            </Link>
            <Link href="/signup">
              <Button
                size="sm"
                className="gap-1 md:gap-2 text-sm bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white shadow-lg shadow-orange-500/30"
              >
                Get Started
                <ArrowRight className="w-3 h-3 md:w-4 md:h-4" />
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-16 md:py-24 px-4 bg-gradient-to-br from-green-600 via-emerald-700 to-teal-800 text-white">
        <div className="container mx-auto max-w-4xl text-center">
          <Badge className="bg-white/20 hover:bg-white/30 text-white border-0 mb-6">
            <Search className="w-4 h-4 mr-2" />
            SEO Services
          </Badge>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
            Rank Higher, Get More Traffic
          </h1>
          <p className="text-lg md:text-xl text-green-100 max-w-3xl mx-auto">
            Professional SEO services that drive organic traffic and grow your business. Dominate search results and outrank your competition.
          </p>
        </div>
      </section>

      {/* Services Section */}
      <section className="py-16 md:py-20 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Comprehensive SEO Services
            </h2>
            <p className="text-muted-foreground max-w-3xl mx-auto">
              From keyword research to link building, we cover every aspect of SEO.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {services.map((service, idx) => (
              <Card
                key={idx}
                className="p-6 hover:shadow-xl transition-all duration-300"
              >
                <div
                  className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${service.color} flex items-center justify-center mb-4 shadow-md`}
                >
                  <service.icon className={`w-8 h-8 ${service.iconColor}`} />
                </div>
                <h3 className="text-xl font-bold mb-3">{service.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  {service.description}
                </p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-16 md:py-20 px-4 bg-gradient-to-br from-green-600 via-emerald-700 to-teal-800">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              SEO Packages & Pricing
            </h2>
            <p className="text-green-100 max-w-3xl mx-auto">
              Transparent monthly pricing for proven SEO results. No contracts, cancel anytime.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {packages.map((pkg, idx) => (
              <Card
                key={idx}
                className={`p-6 hover:shadow-2xl transition-all duration-300 ${
                  pkg.featured ? "ring-2 ring-orange-500 scale-105" : ""
                }`}
              >
                {pkg.featured && (
                  <Badge className="mb-4 bg-orange-500 hover:bg-orange-600">
                    Most Popular
                  </Badge>
                )}
                <div className="text-center mb-6">
                  <h3 className="text-xl font-bold mb-4">{pkg.name}</h3>
                  <div className="mb-4">
                    <span className={`text-4xl font-bold bg-gradient-to-r bg-clip-text text-transparent ${pkg.color}`}>
                      {pkg.price}
                    </span>
                    <span className="text-lg text-muted-foreground">
                      {pkg.period}
                    </span>
                  </div>
                  <Link href="/signup">
                    <Button
                      className={`w-full bg-gradient-to-r ${pkg.color} text-white hover:opacity-90`}
                    >
                      Get Started
                    </Button>
                  </Link>
                </div>

                <ul className="space-y-3">
                  {pkg.features.map((feature, fIdx) => (
                    <li key={fIdx} className="flex gap-2 text-sm">
                      <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                      <span className="text-muted-foreground">{feature}</span>
                    </li>
                  ))}
                </ul>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="py-16 md:py-20 px-4 bg-gray-50">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Why Choose Our SEO Services?
            </h2>
          </div>

          <div className="grid md:grid-cols-4 gap-6">
            {[
              {
                icon: TrendingUp,
                title: "Proven Results",
                description: "Track record of ranking #1 for competitive keywords."
              },
              {
                icon: Target,
                title: "Data-Driven",
                description: "Every decision backed by analytics and testing."
              },
              {
                icon: Users,
                title: "White-Hat Only",
                description: "Ethical SEO practices that stand the test of time."
              },
              {
                icon: Zap,
                title: "Fast Results",
                description: "See improvements in rankings within 90 days."
              }
            ].map((benefit, idx) => (
              <Card key={idx} className="p-6 text-center hover:shadow-xl transition-all">
                <div className="w-16 h-16 mx-auto rounded-full bg-gradient-to-br from-green-50 to-green-100 flex items-center justify-center mb-4">
                  <benefit.icon className="w-8 h-8 text-green-600" />
                </div>
                <h3 className="text-lg font-bold mb-2">{benefit.title}</h3>
                <p className="text-sm text-muted-foreground">{benefit.description}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16 md:py-20 px-4">
        <div className="container mx-auto max-w-4xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Frequently Asked Questions
            </h2>
          </div>

          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="item-1">
              <AccordionTrigger className="text-left">
                How long does SEO take to show results?
              </AccordionTrigger>
              <AccordionContent>
                Most clients see improvements within 3-6 months. However, SEO is an ongoing process. Competitive keywords may take 6-12 months to rank well. We provide monthly progress reports so you can track improvements.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-2">
              <AccordionTrigger className="text-left">
                What's included in your SEO services?
              </AccordionTrigger>
              <AccordionContent">
                Our SEO services include keyword research, on-page optimization, technical SEO, content creation, link building, and monthly reporting. Specific deliverables vary by package. We customize strategies based on your industry and competition.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-3">
              <AccordionTrigger className="text-left">
                Do you guarantee #1 rankings?
              </AccordionTrigger>
              <AccordionContent>
                No ethical SEO company can guarantee #1 rankings as search algorithms constantly change. However, we have a proven track record of achieving top 3 rankings for our clients. We focus on sustainable, long-term growth.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-4">
              <AccordionTrigger className="text-left">
                What's the difference between local and national SEO?
              </AccordionTrigger>
              <AccordionContent>
                Local SEO targets customers in your geographic area (city/region) and includes Google Business Profile optimization and local citations. National SEO targets broader keywords across the country and requires more extensive content and link building.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-5">
              <AccordionTrigger className="text-left">
                Can I cancel my SEO service anytime?
              </AccordionTrigger>
              <AccordionContent>
                Our packages require an initial contract period (3-12 months depending on package) as SEO takes time to show results. After the initial period, you can cancel with 30 days notice. We're confident you'll see the value and continue!
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 md:py-20 px-4 bg-gradient-to-br from-orange-500 to-orange-600 text-white">
        <div className="container mx-auto max-w-4xl text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Ready to Dominate Search Results?
          </h2>
          <p className="text-lg md:text-xl mb-8 text-orange-100">
            Let's get your website ranking higher and driving more organic traffic.
          </p>
          <Link href="/signup">
            <Button
              size="lg"
              className="gap-2 bg-white text-orange-600 hover:bg-gray-100 border-0 shadow-xl"
            >
              Start Your SEO Campaign
              <ArrowRight className="w-5 h-5" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-12 px-4 bg-background">
        <div className="container mx-auto max-w-6xl">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <img
                src={mtaLogoBlue}
                alt="Marketing Team App"
                className="h-12 w-auto mb-4"
              />
              <p className="text-sm text-muted-foreground">
                Professional SEO services for modern businesses.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Services</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="hover:text-primary transition-colors cursor-pointer">
                  Digital Marketing
                </li>
                <li className="hover:text-primary transition-colors cursor-pointer">
                  SEO
                </li>
                <li className="hover:text-primary transition-colors cursor-pointer">
                  Web Development
                </li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Quick Links</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <Link href="/login" className="hover:text-primary transition-colors">
                    Login
                  </Link>
                </li>
                <li className="hover:text-primary transition-colors cursor-pointer">
                  About Us
                </li>
                <li className="hover:text-primary transition-colors cursor-pointer">
                  Contact
                </li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Company</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="hover:text-primary transition-colors cursor-pointer">
                  About us
                </li>
                <li className="hover:text-primary transition-colors cursor-pointer">
                  Careers
                </li>
                <li className="hover:text-primary transition-colors cursor-pointer">
                  Legal
                </li>
              </ul>
            </div>
          </div>
          <div className="border-t pt-8 text-center text-sm text-muted-foreground">
            Copyright © 2025 Marketing Team App, All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}


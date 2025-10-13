import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Brain,
  Bot,
  Zap,
  MessageSquare,
  Mail,
  Calendar,
  CheckCircle,
  ArrowRight,
  Sparkles,
  TrendingUp,
  Users,
  Award,
} from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import mtaLogoBlue from "@assets/mta-logo-blue.png";

export default function AIAutomationPage() {
  const services = [
    {
      icon: Bot,
      title: "AI Chatbots & Virtual Assistants",
      description:
        "Deploy intelligent chatbots that handle customer inquiries 24/7. Provide instant responses, qualify leads, and improve customer satisfaction automatically.",
      color: "from-purple-50 to-purple-100",
      iconColor: "text-purple-600",
    },
    {
      icon: Mail,
      title: "Email Marketing Automation",
      description:
        "Automate your email campaigns with AI-powered personalization. Send the right message to the right person at the perfect time, automatically.",
      color: "from-blue-50 to-blue-100",
      iconColor: "text-blue-600",
    },
    {
      icon: MessageSquare,
      title: "Social Media Automation",
      description:
        "Schedule posts, respond to comments, and engage with your audience automatically. AI helps you maintain an active social presence effortlessly.",
      color: "from-pink-50 to-pink-100",
      iconColor: "text-pink-600",
    },
    {
      icon: Calendar,
      title: "Appointment Scheduling",
      description:
        "Let AI handle booking and scheduling. Automatic reminders, calendar sync, and smart rescheduling reduce no-shows and save time.",
      color: "from-green-50 to-green-100",
      iconColor: "text-green-600",
    },
    {
      icon: Brain,
      title: "Lead Scoring & Qualification",
      description:
        "AI analyzes and scores leads automatically, helping your team focus on high-value opportunities. Improve conversion rates with intelligent lead prioritization.",
      color: "from-orange-50 to-orange-100",
      iconColor: "text-orange-600",
    },
    {
      icon: Zap,
      title: "Workflow Automation",
      description:
        "Automate repetitive tasks across your business. From data entry to report generation, free up your team to focus on strategic work.",
      color: "from-cyan-50 to-cyan-100",
      iconColor: "text-cyan-600",
    },
  ];

  const packages = [
    {
      name: "Starter Automation",
      price: "$299",
      period: "/ month",
      features: [
        "Basic AI Chatbot",
        "Email Automation (up to 5,000 contacts)",
        "Social Media Scheduler",
        "Basic Analytics",
        "Email Support",
      ],
      color: "from-blue-500 to-blue-600",
      featured: false,
    },
    {
      name: "Business Automation",
      price: "$799",
      period: "/ month",
      features: [
        "Advanced AI Chatbot with NLP",
        "Full Email Marketing Suite (unlimited)",
        "Multi-Platform Social Automation",
        "Appointment Scheduling System",
        "Lead Scoring & Qualification",
        "Custom Workflow Automation (up to 10)",
        "Advanced Analytics & Reporting",
        "Priority Support",
        "API Access",
      ],
      color: "from-purple-500 to-purple-600",
      featured: true,
    },
    {
      name: "Enterprise AI",
      price: "$1,999+",
      period: "/ month",
      features: [
        "White-Label AI Solutions",
        "Custom AI Model Training",
        "Unlimited Automation Workflows",
        "Advanced NLP & Machine Learning",
        "Multi-language Support",
        "Custom Integrations",
        "Dedicated AI Specialist",
        "24/7 Premium Support",
        "SLA Guarantee",
        "Custom Development",
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
      <section className="py-16 md:py-24 px-4 bg-gradient-to-br from-purple-600 via-indigo-700 to-blue-800 text-white">
        <div className="container mx-auto max-w-4xl text-center">
          <Badge className="bg-white/20 hover:bg-white/30 text-white border-0 mb-6">
            <Brain className="w-4 h-4 mr-2" />
            AI Automation Services
          </Badge>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
            Work Smarter with AI Automation
          </h1>
          <p className="text-lg md:text-xl text-purple-100 max-w-3xl mx-auto">
            Automate repetitive tasks, engage customers 24/7, and scale your business with intelligent AI solutions.
          </p>
        </div>
      </section>

      {/* Services Section */}
      <section className="py-16 md:py-20 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              AI-Powered Business Automation
            </h2>
            <p className="text-muted-foreground max-w-3xl mx-auto">
              From customer service to marketing, AI automation transforms how you work.
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
      <section className="py-16 md:py-20 px-4 bg-gradient-to-br from-purple-600 via-indigo-700 to-blue-800">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              AI Automation Pricing
            </h2>
            <p className="text-purple-100 max-w-3xl mx-auto">
              Flexible plans that scale with your business. Start automating today.
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
              Why Choose Our AI Automation?
            </h2>
          </div>

          <div className="grid md:grid-cols-4 gap-6">
            {[
              {
                icon: Sparkles,
                title: "Easy Setup",
                description: "Get started in minutes, no technical expertise required."
              },
              {
                icon: TrendingUp,
                title: "Proven ROI",
                description: "Average 300% ROI in the first year."
              },
              {
                icon: Users,
                title: "24/7 Support",
                description: "Our team is here to help whenever you need us."
              },
              {
                icon: Award,
                title: "Industry Leader",
                description: "Trusted by thousands of businesses worldwide."
              }
            ].map((benefit, idx) => (
              <Card key={idx} className="p-6 text-center hover:shadow-xl transition-all">
                <div className="w-16 h-16 mx-auto rounded-full bg-gradient-to-br from-purple-50 to-purple-100 flex items-center justify-center mb-4">
                  <benefit.icon className="w-8 h-8 text-purple-600" />
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
                What is AI automation and how does it work?
              </AccordionTrigger>
              <AccordionContent>
                AI automation uses artificial intelligence to handle repetitive tasks automatically. It learns from data patterns to make decisions, respond to customers, and complete workflows without human intervention, saving time and reducing errors.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-2">
              <AccordionTrigger className="text-left">
                How long does it take to implement?
              </AccordionTrigger>
              <AccordionContent>
                Basic automation can be set up in hours. More complex workflows typically take 1-2 weeks. We provide full onboarding support and training to ensure smooth implementation.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-3">
              <AccordionTrigger className="text-left">
                Will AI replace my team?
              </AccordionTrigger>
              <AccordionContent>
                No! AI automation handles repetitive tasks, freeing your team to focus on strategic, creative work that requires human judgment. It's designed to enhance productivity, not replace people.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-4">
              <AccordionTrigger className="text-left">
                Can I integrate with my existing tools?
              </AccordionTrigger>
              <AccordionContent>
                Yes! We integrate with popular platforms like Salesforce, HubSpot, Slack, Gmail, and hundreds more. Custom integrations available for Enterprise plans.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-5">
              <AccordionTrigger className="text-left">
                Is my data secure?
              </AccordionTrigger>
              <AccordionContent>
                Absolutely. We use enterprise-grade encryption, comply with GDPR and SOC 2 standards, and never share your data with third parties. Your information is secure and private.
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 md:py-20 px-4 bg-gradient-to-br from-orange-500 to-orange-600 text-white">
        <div className="container mx-auto max-w-4xl text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Ready to Automate Your Business?
          </h2>
          <p className="text-lg md:text-xl mb-8 text-orange-100">
            Start saving time and increasing efficiency with AI automation today.
          </p>
          <Link href="/signup">
            <Button
              size="lg"
              className="gap-2 bg-white text-orange-600 hover:bg-gray-100 border-0 shadow-xl"
            >
              Start Free Trial
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
                AI-powered automation for modern businesses.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Services</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="hover:text-primary transition-colors cursor-pointer">
                  AI Automation
                </li>
                <li className="hover:text-primary transition-colors cursor-pointer">
                  Digital Marketing
                </li>
                <li className="hover:text-primary transition-colors cursor-pointer">
                  CRM
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


import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Users,
  TrendingUp,
  MessageSquare,
  BarChart3,
  Calendar,
  FileText,
  CheckCircle,
  ArrowRight,
  Zap,
  Shield,
  Globe,
  Award,
} from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import mtaLogoBlue from "@assets/mta-logo-blue.png";

export default function CRMPage() {
  const features = [
    {
      icon: Users,
      title: "Client Management",
      description:
        "Centralize all your client information in one place. Track interactions, store documents, manage contacts, and never lose track of important client details again.",
      color: "from-blue-50 to-blue-100",
      iconColor: "text-blue-600",
    },
    {
      icon: TrendingUp,
      title: "Sales Pipeline",
      description:
        "Visual sales pipeline to track deals from lead to close. Manage opportunities, forecast revenue, and never let a potential sale slip through the cracks.",
      color: "from-green-50 to-green-100",
      iconColor: "text-green-600",
    },
    {
      icon: MessageSquare,
      title: "Communication Hub",
      description:
        "All client communications in one place. Track emails, calls, meetings, and messages. See the complete history of every client interaction instantly.",
      color: "from-purple-50 to-purple-100",
      iconColor: "text-purple-600",
    },
    {
      icon: Calendar,
      title: "Task & Project Management",
      description:
        "Assign tasks, set deadlines, and track project progress. Keep your team organized and ensure nothing falls through the cracks.",
      color: "from-orange-50 to-orange-100",
      iconColor: "text-orange-600",
    },
    {
      icon: FileText,
      title: "Invoicing & Billing",
      description:
        "Create and send professional invoices directly from the CRM. Track payments, manage subscriptions, and automate billing workflows.",
      color: "from-cyan-50 to-cyan-100",
      iconColor: "text-cyan-600",
    },
    {
      icon: BarChart3,
      title: "Analytics & Reporting",
      description:
        "Comprehensive analytics and customizable reports. Track KPIs, monitor team performance, and make data-driven decisions to grow your business.",
      color: "from-red-50 to-red-100",
      iconColor: "text-red-600",
    },
  ];

  const packages = [
    {
      name: "Starter CRM",
      price: "$49",
      period: "/ month",
      features: [
        "Up to 1,000 Contacts",
        "3 User Seats",
        "Basic Client Management",
        "Email Integration",
        "Task Management",
        "Mobile App Access",
        "Standard Support",
      ],
      color: "from-blue-500 to-blue-600",
      featured: false,
    },
    {
      name: "Professional CRM",
      price: "$149",
      period: "/ month",
      features: [
        "Unlimited Contacts",
        "10 User Seats",
        "Advanced Client Management",
        "Sales Pipeline & Forecasting",
        "Email & Calendar Integration",
        "Document Management",
        "Invoicing & Billing",
        "Custom Fields & Workflows",
        "Advanced Reporting",
        "Priority Support",
        "API Access",
      ],
      color: "from-purple-500 to-purple-600",
      featured: true,
    },
    {
      name: "Enterprise CRM",
      price: "$499",
      period: "/ month",
      features: [
        "Unlimited Everything",
        "Unlimited User Seats",
        "White-Label Option",
        "Advanced Automation",
        "Custom Integrations",
        "Multi-Brand Management",
        "Advanced Security & Permissions",
        "Dedicated Account Manager",
        "Custom Training",
        "24/7 Priority Support",
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
      <section className="py-16 md:py-24 px-4 bg-gradient-to-br from-blue-600 via-cyan-700 to-teal-800 text-white">
        <div className="container mx-auto max-w-4xl text-center">
          <Badge className="bg-white/20 hover:bg-white/30 text-white border-0 mb-6">
            <Users className="w-4 h-4 mr-2" />
            CRM Platform
          </Badge>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
            Your Complete Client Management Solution
          </h1>
          <p className="text-lg md:text-xl text-blue-100 max-w-3xl mx-auto">
            Built specifically for marketing agencies. Manage clients, projects, and team collaboration all in one powerful platform.
          </p>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 md:py-20 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Everything You Need to Manage Your Agency
            </h2>
            <p className="text-muted-foreground max-w-3xl mx-auto">
              From client onboarding to project delivery, our CRM handles it all.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, idx) => (
              <Card
                key={idx}
                className="p-6 hover:shadow-xl transition-all duration-300"
              >
                <div
                  className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${feature.color} flex items-center justify-center mb-4 shadow-md`}
                >
                  <feature.icon className={`w-8 h-8 ${feature.iconColor}`} />
                </div>
                <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  {feature.description}
                </p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-16 md:py-20 px-4 bg-gradient-to-br from-blue-600 via-cyan-700 to-teal-800">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              CRM Pricing Plans
            </h2>
            <p className="text-blue-100 max-w-3xl mx-auto">
              Choose the plan that fits your agency size. All plans include unlimited support and regular updates.
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
                      Start Free Trial
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
              Why Marketing Agencies Love Our CRM
            </h2>
          </div>

          <div className="grid md:grid-cols-4 gap-6">
            {[
              {
                icon: Zap,
                title: "Easy to Use",
                description: "Intuitive interface that your team will love using daily."
              },
              {
                icon: Shield,
                title: "Secure & Reliable",
                description: "Bank-level security with 99.9% uptime guarantee."
              },
              {
                icon: Globe,
                title: "Cloud-Based",
                description: "Access from anywhere, on any device, anytime."
              },
              {
                icon: Award,
                title: "Award-Winning",
                description: "Recognized as best CRM for marketing agencies."
              }
            ].map((benefit, idx) => (
              <Card key={idx} className="p-6 text-center hover:shadow-xl transition-all">
                <div className="w-16 h-16 mx-auto rounded-full bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center mb-4">
                  <benefit.icon className="w-8 h-8 text-blue-600" />
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
                Can I try the CRM before committing?
              </AccordionTrigger>
              <AccordionContent>
                Yes! We offer a 14-day free trial with full access to all features. No credit card required to start your trial.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-2">
              <AccordionTrigger className="text-left">
                How do I migrate from my current CRM?
              </AccordionTrigger>
              <AccordionContent>
                We provide free data migration assistance for all plans. Our team will help you import your contacts, deals, and data from any CRM platform.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-3">
              <AccordionTrigger className="text-left">
                Can I integrate with my existing tools?
              </AccordionTrigger>
              <AccordionContent>
                Absolutely! We integrate with popular tools like Gmail, Outlook, Slack, Zoom, QuickBooks, Stripe, and many more. Custom integrations available for Enterprise plans.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-4">
              <AccordionTrigger className="text-left">
                Is my data secure?
              </AccordionTrigger>
              <AccordionContent>
                Yes! We use bank-level encryption, regular security audits, and comply with GDPR and SOC 2 standards. Your data is backed up daily and stored in secure cloud servers.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-5">
              <AccordionTrigger className="text-left">
                Can I upgrade or downgrade my plan?
              </AccordionTrigger>
              <AccordionContent>
                Yes, you can change your plan anytime. Upgrades are instant, and downgrades take effect at the end of your billing cycle.
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 md:py-20 px-4 bg-gradient-to-br from-orange-500 to-orange-600 text-white">
        <div className="container mx-auto max-w-4xl text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Ready to Transform Your Agency?
          </h2>
          <p className="text-lg md:text-xl mb-8 text-orange-100">
            Join hundreds of agencies already managing their clients with our CRM.
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
                The CRM built for marketing agencies.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Services</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="hover:text-primary transition-colors cursor-pointer">
                  Digital Marketing
                </li>
                <li className="hover:text-primary transition-colors cursor-pointer">
                  CRM
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


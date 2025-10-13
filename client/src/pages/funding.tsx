import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  DollarSign,
  TrendingUp,
  Clock,
  Shield,
  FileText,
  CheckCircle2,
  CheckCircle,
  ArrowRight,
  Zap,
  Users,
  Award,
  Percent,
} from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import mtaLogoBlue from "@assets/mta-logo-blue.png";

export default function FundingPage() {
  const options = [
    {
      icon: Zap,
      title: "Quick Business Loans",
      description:
        "Fast approval process with funding in as little as 24 hours. Flexible terms from $5,000 to $500,000. Perfect for immediate business needs.",
      color: "from-blue-50 to-blue-100",
      iconColor: "text-blue-600",
    },
    {
      icon: TrendingUp,
      title: "Line of Credit",
      description:
        "Revolving credit line that gives you access to funds whenever you need them. Pay interest only on what you use. Up to $250,000 available.",
      color: "from-green-50 to-green-100",
      iconColor: "text-green-600",
    },
    {
      icon: Clock,
      title: "Revenue-Based Financing",
      description:
        "Get funding based on your monthly revenue. Repay automatically as a percentage of sales. No fixed payments, scales with your business.",
      color: "from-purple-50 to-purple-100",
      iconColor: "text-purple-600",
    },
    {
      icon: DollarSign,
      title: "Equipment Financing",
      description:
        "Finance the equipment you need to grow. Up to 100% financing available. The equipment serves as collateral, making approval easier.",
      color: "from-orange-50 to-orange-100",
      iconColor: "text-orange-600",
    },
    {
      icon: FileText,
      title: "Invoice Factoring",
      description:
        "Convert your unpaid invoices into immediate cash. Get up to 90% of invoice value within 24 hours. Perfect for improving cash flow.",
      color: "from-cyan-50 to-cyan-100",
      iconColor: "text-cyan-600",
    },
    {
      icon: CheckCircle2,
      title: "SBA Loans",
      description:
        "Government-backed loans with favorable terms and lower interest rates. Up to $5 million available. Best for established businesses.",
      color: "from-red-50 to-red-100",
      iconColor: "text-red-600",
    },
  ];

  const loanRanges = [
    {
      name: "Small Business Loan",
      amount: "$5K - $50K",
      rate: "Starting at 7.9%",
      features: [
        "24-48 hour funding",
        "6-36 month terms",
        "Minimal documentation",
        "No collateral required",
        "Credit score 600+",
      ],
      color: "from-blue-500 to-blue-600",
      featured: false,
    },
    {
      name: "Growth Capital",
      amount: "$50K - $250K",
      rate: "Starting at 6.9%",
      features: [
        "2-3 day funding",
        "12-60 month terms",
        "Flexible repayment",
        "Multiple uses allowed",
        "Credit score 650+",
        "Dedicated loan specialist",
      ],
      color: "from-purple-500 to-purple-600",
      featured: true,
    },
    {
      name: "Enterprise Funding",
      amount: "$250K - $5M",
      rate: "Starting at 5.9%",
      features: [
        "3-5 day funding",
        "Up to 10 year terms",
        "Customized structure",
        "Multiple funding options",
        "Credit score 700+",
        "Personal account manager",
        "Business consultation included",
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
            <DollarSign className="w-4 h-4 mr-2" />
            Business Funding
          </Badge>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
            Grow Your Business with Fast Funding
          </h1>
          <p className="text-lg md:text-xl text-green-100 max-w-3xl mx-auto">
            Access capital quickly to scale your business. From $5,000 to $5 million with approval in minutes.
          </p>
        </div>
      </section>

      {/* Options Section */}
      <section className="py-16 md:py-20 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Flexible Funding Options
            </h2>
            <p className="text-muted-foreground max-w-3xl mx-auto">
              Choose the funding solution that fits your business needs and growth goals.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {options.map((option, idx) => (
              <Card
                key={idx}
                className="p-6 hover:shadow-xl transition-all duration-300"
              >
                <div
                  className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${option.color} flex items-center justify-center mb-4 shadow-md`}
                >
                  <option.icon className={`w-8 h-8 ${option.iconColor}`} />
                </div>
                <h3 className="text-xl font-bold mb-3">{option.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  {option.description}
                </p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Loan Ranges Section */}
      <section className="py-16 md:py-20 px-4 bg-gradient-to-br from-green-600 via-emerald-700 to-teal-800">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Funding Amounts & Rates
            </h2>
            <p className="text-green-100 max-w-3xl mx-auto">
              Competitive rates with flexible terms. Choose the amount that's right for your business.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {loanRanges.map((loan, idx) => (
              <Card
                key={idx}
                className={`p-6 hover:shadow-2xl transition-all duration-300 ${
                  loan.featured ? "ring-2 ring-orange-500 scale-105" : ""
                }`}
              >
                {loan.featured && (
                  <Badge className="mb-4 bg-orange-500 hover:bg-orange-600">
                    Most Popular
                  </Badge>
                )}
                <div className="text-center mb-6">
                  <h3 className="text-xl font-bold mb-2">{loan.name}</h3>
                  <div className="mb-2">
                    <span className={`text-3xl font-bold bg-gradient-to-r bg-clip-text text-transparent ${loan.color}`}>
                      {loan.amount}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground mb-4">{loan.rate}</p>
                  <Link href="/signup">
                    <Button
                      className={`w-full bg-gradient-to-r ${loan.color} text-white hover:opacity-90`}
                    >
                      Apply Now
                    </Button>
                  </Link>
                </div>

                <ul className="space-y-3">
                  {loan.features.map((feature, fIdx) => (
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
              Why Businesses Choose Our Funding
            </h2>
          </div>

          <div className="grid md:grid-cols-4 gap-6">
            {[
              {
                icon: Zap,
                title: "Fast Approval",
                description: "Get approved in minutes, funded within 24-48 hours."
              },
              {
                icon: Percent,
                title: "Competitive Rates",
                description: "Among the lowest rates in the industry."
              },
              {
                icon: Shield,
                title: "Secure Process",
                description: "Bank-level security protects your information."
              },
              {
                icon: Users,
                title: "Expert Support",
                description: "Dedicated team guides you through every step."
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
                How quickly can I get funded?
              </AccordionTrigger>
              <AccordionContent>
                Most applications are approved within minutes. Once approved, funding typically arrives in 24-48 hours. Some loan types like lines of credit can be even faster.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-2">
              <AccordionTrigger className="text-left">
                What are the qualification requirements?
              </AccordionTrigger>
              <AccordionContent>
                Requirements vary by loan type, but generally you need: minimum 6 months in business, credit score of 600+, and minimum monthly revenue of $10,000. We work with businesses of all sizes and credit profiles.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-3">
              <AccordionTrigger className="text-left">
                Do I need collateral?
              </AccordionTrigger>
              <AccordionContent>
                Most of our loan options don't require collateral. Equipment financing uses the equipment as collateral. SBA loans may require collateral for larger amounts.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-4">
              <AccordionTrigger className="text-left">
                What can I use the funding for?
              </AccordionTrigger>
              <AccordionContent>
                Funding can be used for virtually any business purpose: inventory, equipment, marketing, hiring, expansion, cash flow management, or any other business need.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-5">
              <AccordionTrigger className="text-left">
                Are there any prepayment penalties?
              </AccordionTrigger>
              <AccordionContent>
                No! You can pay off your loan early without any penalties. In fact, early repayment can reduce your total interest costs.
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 md:py-20 px-4 bg-gradient-to-br from-orange-500 to-orange-600 text-white">
        <div className="container mx-auto max-w-4xl text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Ready to Fund Your Growth?
          </h2>
          <p className="text-lg md:text-xl mb-8 text-orange-100">
            Get your free quote in minutes. No obligation, no impact to your credit score.
          </p>
          <Link href="/signup">
            <Button
              size="lg"
              className="gap-2 bg-white text-orange-600 hover:bg-gray-100 border-0 shadow-xl"
            >
              Apply Now
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
                Fast, flexible business funding solutions.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Services</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="hover:text-primary transition-colors cursor-pointer">
                  Business Funding
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


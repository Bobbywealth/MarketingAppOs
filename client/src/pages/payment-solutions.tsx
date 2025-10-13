import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  CreditCard,
  DollarSign,
  Shield,
  Zap,
  Globe,
  Repeat,
  CheckCircle,
  ArrowRight,
  Lock,
  TrendingUp,
  Users,
  Award,
} from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import mtaLogoBlue from "@assets/mta-logo-blue.png";

export default function PaymentSolutionsPage() {
  const features = [
    {
      icon: CreditCard,
      title: "Accept All Payment Types",
      description:
        "Credit cards, debit cards, digital wallets (Apple Pay, Google Pay), ACH transfers, and more. Give your customers the flexibility they need.",
      color: "from-blue-50 to-blue-100",
      iconColor: "text-blue-600",
    },
    {
      icon: Repeat,
      title: "Recurring Billing & Subscriptions",
      description:
        "Automate subscription billing with flexible recurring payment options. Support monthly, quarterly, annual, and custom billing cycles.",
      color: "from-purple-50 to-purple-100",
      iconColor: "text-purple-600",
    },
    {
      icon: Globe,
      title: "International Payments",
      description:
        "Accept payments from customers worldwide in over 135 currencies. Automatic currency conversion and multi-language checkout support.",
      color: "from-green-50 to-green-100",
      iconColor: "text-green-600",
    },
    {
      icon: Shield,
      title: "Fraud Protection",
      description:
        "Advanced fraud detection powered by AI. PCI-DSS Level 1 compliance, 3D Secure authentication, and real-time risk assessment.",
      color: "from-red-50 to-red-100",
      iconColor: "text-red-600",
    },
    {
      icon: Zap,
      title: "Instant Payouts",
      description:
        "Get paid faster with instant payouts to your bank account. Access your funds immediately instead of waiting days.",
      color: "from-orange-50 to-orange-100",
      iconColor: "text-orange-600",
    },
    {
      icon: DollarSign,
      title: "Flexible Pricing",
      description:
        "No setup fees, no monthly fees, no hidden charges. Pay only for successful transactions with transparent, competitive rates.",
      color: "from-cyan-50 to-cyan-100",
      iconColor: "text-cyan-600",
    },
  ];

  const packages = [
    {
      name: "Standard",
      price: "2.9%",
      period: "+ 30¢ per transaction",
      features: [
        "Accept all major credit cards",
        "Mobile payments (Apple Pay, Google Pay)",
        "Basic fraud protection",
        "Standard payouts (2-3 days)",
        "Email support",
        "Dashboard & reporting",
      ],
      color: "from-blue-500 to-blue-600",
      featured: false,
    },
    {
      name: "Professional",
      price: "2.5%",
      period: "+ 25¢ per transaction",
      features: [
        "Everything in Standard",
        "Advanced fraud detection",
        "Recurring billing & subscriptions",
        "International payments (135+ currencies)",
        "Next-day payouts",
        "Priority email & chat support",
        "Advanced reporting & analytics",
        "API access",
      ],
      color: "from-purple-500 to-purple-600",
      featured: true,
    },
    {
      name: "Enterprise",
      price: "Custom",
      period: "volume-based pricing",
      features: [
        "Everything in Professional",
        "Volume-based discount rates",
        "Instant payouts",
        "Dedicated account manager",
        "Custom integrations",
        "Multi-currency settlements",
        "24/7 phone support",
        "SLA guarantee",
        "White-label options",
        "Custom contracts",
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
      <section className="py-16 md:py-24 px-4 bg-gradient-to-br from-blue-600 via-cyan-700 to-green-800 text-white">
        <div className="container mx-auto max-w-4xl text-center">
          <Badge className="bg-white/20 hover:bg-white/30 text-white border-0 mb-6">
            <CreditCard className="w-4 h-4 mr-2" />
            Payment Solutions
          </Badge>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
            Accept Payments Anywhere
          </h1>
          <p className="text-lg md:text-xl text-blue-100 max-w-3xl mx-auto">
            Complete payment processing solution for businesses of all sizes. Fast, secure, and easy to integrate.
          </p>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 md:py-20 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Everything You Need to Get Paid
            </h2>
            <p className="text-muted-foreground max-w-3xl mx-auto">
              Powerful payment features that help you grow your business.
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
      <section className="py-16 md:py-20 px-4 bg-gradient-to-br from-blue-600 via-cyan-700 to-green-800">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Transparent Pricing
            </h2>
            <p className="text-blue-100 max-w-3xl mx-auto">
              No setup fees. No monthly fees. No hidden costs. Pay only for successful transactions.
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
                    <p className="text-sm text-muted-foreground mt-1">
                      {pkg.period}
                    </p>
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
              Why Businesses Choose Us
            </h2>
          </div>

          <div className="grid md:grid-cols-4 gap-6">
            {[
              {
                icon: Lock,
                title: "Bank-Level Security",
                description: "PCI-DSS Level 1 certified with end-to-end encryption."
              },
              {
                icon: TrendingUp,
                title: "Higher Approval Rates",
                description: "Intelligent routing for maximum transaction success."
              },
              {
                icon: Users,
                title: "24/7 Support",
                description: "Expert support team available whenever you need help."
              },
              {
                icon: Award,
                title: "Industry Leader",
                description: "Trusted by over 50,000 businesses worldwide."
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
                How quickly can I start accepting payments?
              </AccordionTrigger>
              <AccordionContent>
                You can start accepting payments immediately after signing up. Our setup process takes just minutes. For advanced features like recurring billing, integration typically takes 1-2 hours.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-2">
              <AccordionTrigger className="text-left">
                Are there any setup or monthly fees?
              </AccordionTrigger>
              <AccordionContent>
                No! We don't charge setup fees or monthly fees. You only pay a small percentage per successful transaction. What you see in our pricing is what you pay.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-3">
              <AccordionTrigger className="text-left">
                How secure are the payments?
              </AccordionTrigger>
              <AccordionContent>
                Extremely secure. We're PCI-DSS Level 1 certified (the highest security standard), use end-to-end encryption, and employ advanced fraud detection. We never store sensitive card data.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-4">
              <AccordionTrigger className="text-left">
                Can I accept international payments?
              </AccordionTrigger>
              <AccordionContent>
                Yes! With our Professional and Enterprise plans, you can accept payments in over 135 currencies from customers worldwide. Automatic currency conversion is included.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-5">
              <AccordionTrigger className="text-left">
                How fast do I receive my money?
              </AccordionTrigger>
              <AccordionContent>
                Standard payouts take 2-3 business days. Professional plan offers next-day payouts, and Enterprise customers can access instant payouts directly to their bank account.
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 md:py-20 px-4 bg-gradient-to-br from-orange-500 to-orange-600 text-white">
        <div className="container mx-auto max-w-4xl text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Ready to Start Accepting Payments?
          </h2>
          <p className="text-lg md:text-xl mb-8 text-orange-100">
            Join thousands of businesses already processing payments with us.
          </p>
          <Link href="/signup">
            <Button
              size="lg"
              className="gap-2 bg-white text-orange-600 hover:bg-gray-100 border-0 shadow-xl"
            >
              Get Started Now
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
                Secure payment solutions for modern businesses.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Services</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="hover:text-primary transition-colors cursor-pointer">
                  Payment Solutions
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


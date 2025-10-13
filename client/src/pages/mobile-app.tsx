import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Smartphone,
  Tablet,
  Zap,
  Cloud,
  Code2,
  Shield,
  CheckCircle,
  ArrowRight,
  Star,
  TrendingUp,
  Users,
  Award,
} from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import mtaLogoBlue from "@assets/mta-logo-blue.png";

export default function MobileAppPage() {
  const services = [
    {
      icon: Smartphone,
      title: "iOS App Development",
      description:
        "Build stunning native iOS applications that leverage the full power of Apple's ecosystem. From iPhone to iPad, we create apps that users love.",
      color: "from-blue-50 to-blue-100",
      iconColor: "text-blue-600",
    },
    {
      icon: Tablet,
      title: "Android App Development",
      description:
        "Reach billions of Android users with custom apps optimized for performance and user experience. We ensure compatibility across devices and Android versions.",
      color: "from-green-50 to-green-100",
      iconColor: "text-green-600",
    },
    {
      icon: Code2,
      title: "Cross-Platform Development",
      description:
        "Build once, deploy everywhere. Using React Native and Flutter, we create apps that work seamlessly on both iOS and Android, saving time and cost.",
      color: "from-purple-50 to-purple-100",
      iconColor: "text-purple-600",
    },
    {
      icon: Cloud,
      title: "Backend & API Integration",
      description:
        "Power your app with robust backend systems and seamless API integrations. From databases to third-party services, we handle the complete infrastructure.",
      color: "from-cyan-50 to-cyan-100",
      iconColor: "text-cyan-600",
    },
    {
      icon: Zap,
      title: "App Optimization",
      description:
        "Ensure lightning-fast performance and smooth user experience. We optimize every aspect of your app for speed, battery efficiency, and resource usage.",
      color: "from-orange-50 to-orange-100",
      iconColor: "text-orange-600",
    },
    {
      icon: Shield,
      title: "Security & Maintenance",
      description:
        "Keep your app secure with regular updates, bug fixes, and security patches. We provide ongoing support to ensure your app stays current and protected.",
      color: "from-red-50 to-red-100",
      iconColor: "text-red-600",
    },
  ];

  const packages = [
    {
      name: "Starter App",
      price: "$9,999",
      period: "one-time",
      features: [
        "Single Platform (iOS or Android)",
        "Up to 10 Screens",
        "Basic User Authentication",
        "Push Notifications",
        "Basic Backend Integration",
        "App Store Submission",
        "3 Months Bug Fixes",
        "Basic Analytics",
      ],
      color: "from-blue-500 to-blue-600",
      featured: false,
    },
    {
      name: "Professional App",
      price: "$24,999",
      period: "one-time",
      features: [
        "Cross-Platform (iOS & Android)",
        "Up to 25 Screens",
        "Advanced User Management",
        "Real-time Features",
        "Full Backend Development",
        "Third-party Integrations",
        "In-App Purchases/Subscriptions",
        "Advanced Analytics & Tracking",
        "App Store Optimization",
        "6 Months Support & Updates",
        "Admin Dashboard",
      ],
      color: "from-purple-500 to-purple-600",
      featured: true,
    },
    {
      name: "Enterprise Solution",
      price: "$49,999+",
      period: "one-time",
      features: [
        "Native iOS & Android Apps",
        "Unlimited Screens & Features",
        "Complex User Hierarchies",
        "Real-time Communication",
        "Advanced Backend Architecture",
        "Scalable Cloud Infrastructure",
        "AI/ML Integration",
        "Advanced Security Features",
        "Custom API Development",
        "Admin & User Dashboards",
        "App Store Optimization",
        "12 Months Priority Support",
        "Dedicated Development Team",
        "White-label Options",
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
      <section className="py-16 md:py-24 px-4 bg-gradient-to-br from-indigo-600 via-purple-700 to-pink-800 text-white">
        <div className="container mx-auto max-w-4xl text-center">
          <Badge className="bg-white/20 hover:bg-white/30 text-white border-0 mb-6">
            <Smartphone className="w-4 h-4 mr-2" />
            Mobile App Development
          </Badge>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
            Transform Your Ideas into Mobile Apps
          </h1>
          <p className="text-lg md:text-xl text-purple-100 max-w-3xl mx-auto">
            Professional mobile app development for iOS and Android. From concept to app store, we build apps that users love.
          </p>
        </div>
      </section>

      {/* Services Section */}
      <section className="py-16 md:py-20 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Complete Mobile App Solutions
            </h2>
            <p className="text-muted-foreground max-w-3xl mx-auto">
              From native to cross-platform, we deliver mobile experiences that engage and convert.
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
      <section className="py-16 md:py-20 px-4 bg-gradient-to-br from-indigo-600 via-purple-700 to-pink-800">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              App Development Packages
            </h2>
            <p className="text-purple-100 max-w-3xl mx-auto">
              Transparent pricing for mobile app development. All packages include design, development, and app store deployment.
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
              Why Choose Our Mobile App Services?
            </h2>
          </div>

          <div className="grid md:grid-cols-4 gap-6">
            {[
              {
                icon: Star,
                title: "5-Star Apps",
                description: "We build apps that users rate highly and recommend."
              },
              {
                icon: TrendingUp,
                title: "Scalable Solutions",
                description: "Apps built to grow with your business needs."
              },
              {
                icon: Users,
                title: "User-Focused",
                description: "Designed around real user needs and behaviors."
              },
              {
                icon: Award,
                title: "Award-Winning",
                description: "Recognized for excellence in mobile development."
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
                Should I build native or cross-platform?
              </AccordionTrigger>
              <AccordionContent>
                It depends on your needs. Native apps (separate iOS and Android) offer best performance and platform-specific features. Cross-platform (React Native/Flutter) is more cost-effective and faster to market. We'll help you choose the best approach based on your requirements and budget.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-2">
              <AccordionTrigger className="text-left">
                How long does app development take?
              </AccordionTrigger>
              <AccordionContent>
                Timeline varies by complexity: Starter apps take 2-3 months, Professional apps 3-6 months, and Enterprise solutions 6-12 months. We provide detailed project timelines during planning phase.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-3">
              <AccordionTrigger className="text-left">
                Will you help with app store submission?
              </AccordionTrigger>
              <AccordionContent>
                Yes! All packages include app store submission for both Apple App Store and Google Play Store. We handle the technical requirements, screenshots, descriptions, and submission process.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-4">
              <AccordionTrigger className="text-left">
                What about ongoing maintenance?
              </AccordionTrigger>
              <AccordionContent>
                We provide support periods based on your package. After that, we offer flexible maintenance plans including bug fixes, OS updates, feature additions, and performance optimization.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-5">
              <AccordionTrigger className="text-left">
                Can you integrate with existing systems?
              </AccordionTrigger>
              <AccordionContent>
                Absolutely! We specialize in integrating mobile apps with existing websites, databases, APIs, CRMs, and other business systems. We ensure seamless data flow between all your platforms.
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 md:py-20 px-4 bg-gradient-to-br from-orange-500 to-orange-600 text-white">
        <div className="container mx-auto max-w-4xl text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Ready to Build Your Mobile App?
          </h2>
          <p className="text-lg md:text-xl mb-8 text-orange-100">
            Let's turn your app idea into reality. Schedule a free consultation today.
          </p>
          <Link href="/signup">
            <Button
              size="lg"
              className="gap-2 bg-white text-orange-600 hover:bg-gray-100 border-0 shadow-xl"
            >
              Start Your App Project
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
                Professional mobile app development services.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Services</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="hover:text-primary transition-colors cursor-pointer">
                  Digital Marketing
                </li>
                <li className="hover:text-primary transition-colors cursor-pointer">
                  Web Development
                </li>
                <li className="hover:text-primary transition-colors cursor-pointer">
                  Mobile Apps
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


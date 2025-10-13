import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Globe,
  Code,
  Smartphone,
  Zap,
  Shield,
  Search,
  CheckCircle,
  ArrowRight,
  Rocket,
  LineChart,
  Users,
  Award,
} from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import mtaLogoBlue from "@assets/mta-logo-blue.png";

export default function WebDesignPage() {
  const services = [
    {
      icon: Globe,
      title: "Custom Website Design",
      description:
        "Create stunning, user-friendly websites tailored to your brand and business goals. We design responsive sites that look amazing on all devices and convert visitors into customers.",
      color: "from-blue-50 to-blue-100",
      iconColor: "text-blue-600",
    },
    {
      icon: Code,
      title: "Web Development",
      description:
        "Build robust, scalable websites using the latest technologies. From simple landing pages to complex web applications, our developers bring your vision to life with clean, efficient code.",
      color: "from-green-50 to-green-100",
      iconColor: "text-green-600",
    },
    {
      icon: Smartphone,
      title: "Responsive Design",
      description:
        "Ensure your website looks perfect on every device. Our responsive designs adapt seamlessly to desktops, tablets, and smartphones, providing an optimal user experience everywhere.",
      color: "from-purple-50 to-purple-100",
      iconColor: "text-purple-600",
    },
    {
      icon: Zap,
      title: "Performance Optimization",
      description:
        "Speed matters. We optimize your website for lightning-fast load times, improving user experience and search engine rankings. Every millisecond counts.",
      color: "from-yellow-50 to-yellow-100",
      iconColor: "text-yellow-600",
    },
    {
      icon: Shield,
      title: "Security & Maintenance",
      description:
        "Keep your website secure and up-to-date with our ongoing maintenance services. We monitor, update, and protect your site so you can focus on your business.",
      color: "from-red-50 to-red-100",
      iconColor: "text-red-600",
    },
    {
      icon: Search,
      title: "SEO Integration",
      description:
        "Built with search engines in mind. Every website we create is optimized for SEO from the ground up, helping you rank higher and attract more organic traffic.",
      color: "from-indigo-50 to-indigo-100",
      iconColor: "text-indigo-600",
    },
  ];

  const packages = [
    {
      name: "Starter Website",
      price: "$2,499",
      period: "one-time",
      features: [
        "Up to 5 Pages",
        "Responsive Design",
        "Basic SEO Setup",
        "Contact Form Integration",
        "Social Media Integration",
        "1 Month Free Hosting",
        "Basic Analytics Setup",
        "2 Rounds of Revisions",
        "30-Day Support",
      ],
      color: "from-blue-500 to-blue-600",
      featured: false,
    },
    {
      name: "Business Website",
      price: "$4,999",
      period: "one-time",
      features: [
        "Up to 15 Pages",
        "Custom Responsive Design",
        "Advanced SEO Optimization",
        "Blog/News Section",
        "E-commerce Ready (up to 50 products)",
        "CMS Integration (WordPress/Custom)",
        "Advanced Forms & Lead Capture",
        "Email Marketing Integration",
        "Google Analytics & Tracking",
        "3 Months Free Hosting",
        "Unlimited Revisions",
        "90-Day Priority Support",
      ],
      color: "from-purple-500 to-purple-600",
      featured: true,
    },
    {
      name: "Enterprise Solution",
      price: "$12,999+",
      period: "one-time",
      features: [
        "Unlimited Pages",
        "Fully Custom Design & Development",
        "Advanced E-commerce (Unlimited Products)",
        "Custom CMS/Web Application",
        "Multi-language Support",
        "Advanced Integrations (CRM, ERP, APIs)",
        "Database Architecture",
        "Progressive Web App (PWA)",
        "Security Audits & SSL",
        "Performance Monitoring",
        "6 Months Free Hosting",
        "Dedicated Project Manager",
        "Unlimited Revisions",
        "12-Month Priority Support",
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
      <section className="py-16 md:py-24 px-4 bg-gradient-to-br from-blue-600 via-indigo-700 to-purple-800 text-white">
        <div className="container mx-auto max-w-4xl text-center">
          <Badge className="bg-white/20 hover:bg-white/30 text-white border-0 mb-6">
            <Globe className="w-4 h-4 mr-2" />
            Web Design & Development
          </Badge>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
            Build Your Digital Presence
          </h1>
          <p className="text-lg md:text-xl text-blue-100 max-w-3xl mx-auto">
            Professional websites that drive results. From concept to launch, we create digital experiences that engage, convert, and grow your business.
          </p>
        </div>
      </section>

      {/* Services Section */}
      <section className="py-16 md:py-20 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Comprehensive Web Solutions
            </h2>
            <p className="text-muted-foreground max-w-3xl mx-auto">
              From design to deployment, we handle every aspect of your web presence.
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
      <section className="py-16 md:py-20 px-4 bg-gradient-to-br from-blue-600 via-indigo-700 to-purple-800">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Website Packages & Pricing
            </h2>
            <p className="text-blue-100 max-w-3xl mx-auto">
              Choose the perfect package for your web presence. All packages include responsive design and modern development practices.
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
              Why Choose Our Web Services?
            </h2>
          </div>

          <div className="grid md:grid-cols-4 gap-6">
            {[
              {
                icon: Rocket,
                title: "Fast Delivery",
                description: "Quick turnaround times without compromising quality."
              },
              {
                icon: LineChart,
                title: "Results-Focused",
                description: "Websites built to convert visitors into customers."
              },
              {
                icon: Users,
                title: "User-Centric",
                description: "Designed with your users' needs and behaviors in mind."
              },
              {
                icon: Award,
                title: "Award-Winning",
                description: "Recognized for excellence in design and development."
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
                How long does it take to build a website?
              </AccordionTrigger>
              <AccordionContent>
                Timeline depends on complexity: Starter websites typically take 2-3 weeks, Business websites 4-6 weeks, and Enterprise solutions 8-12 weeks. We'll provide a detailed timeline during our initial consultation.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-2">
              <AccordionTrigger className="text-left">
                Will my website be mobile-friendly?
              </AccordionTrigger>
              <AccordionContent>
                Absolutely! All our websites are fully responsive and optimized for mobile devices. We test on various screen sizes to ensure perfect display across all devices.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-3">
              <AccordionTrigger className="text-left">
                Can I update the website myself after it's built?
              </AccordionTrigger>
              <AccordionContent>
                Yes! We can integrate a user-friendly CMS (Content Management System) that allows you to easily update content, add pages, upload images, and more without technical knowledge. We'll provide training on how to use it.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-4">
              <AccordionTrigger className="text-left">
                Do you provide hosting and domain services?
              </AccordionTrigger>
              <AccordionContent>
                We offer hosting recommendations and can handle setup for you. All packages include free hosting for a specified period. After that, you can either continue with our hosting recommendations or use your preferred provider.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-5">
              <AccordionTrigger className="text-left">
                What happens after my website is launched?
              </AccordionTrigger>
              <AccordionContent>
                We provide ongoing support based on your package. This includes bug fixes, security updates, and technical assistance. We also offer maintenance packages for regular updates, content changes, and optimization.
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 md:py-20 px-4 bg-gradient-to-br from-orange-500 to-orange-600 text-white">
        <div className="container mx-auto max-w-4xl text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Ready to Build Your Dream Website?
          </h2>
          <p className="text-lg md:text-xl mb-8 text-orange-100">
            Let's create a website that stands out and delivers results.
          </p>
          <Link href="/signup">
            <Button
              size="lg"
              className="gap-2 bg-white text-orange-600 hover:bg-gray-100 border-0 shadow-xl"
            >
              Start Your Project
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
                Professional web solutions for modern businesses.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Services</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="hover:text-primary transition-colors cursor-pointer">
                  Digital Marketing
                </li>
                <li className="hover:text-primary transition-colors cursor-pointer">
                  Graphic Design
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


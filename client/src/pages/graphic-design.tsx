import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Palette,
  FileImage,
  Layout,
  Package,
  Video,
  Sparkles,
  CheckCircle,
  ArrowRight,
  Target,
  Users,
  TrendingUp,
  Award,
} from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import mtaLogoBlue from "@assets/mta-logo-blue.png";

export default function GraphicDesignPage() {
  const services = [
    {
      icon: Palette,
      title: "Brand Identity Design",
      description:
        "Create a cohesive brand identity that resonates with your target audience. From logos to color palettes, we develop comprehensive brand guidelines that ensure consistency across all touchpoints.",
      color: "from-purple-50 to-purple-100",
      iconColor: "text-purple-600",
    },
    {
      icon: FileImage,
      title: "Marketing Collateral",
      description:
        "Design eye-catching marketing materials including brochures, flyers, business cards, and promotional items. Our designs combine aesthetic appeal with strategic messaging to drive results.",
      color: "from-blue-50 to-blue-100",
      iconColor: "text-blue-600",
    },
    {
      icon: Layout,
      title: "Social Media Graphics",
      description:
        "Stand out on social platforms with custom-designed posts, stories, and ads. We create thumb-stopping visuals optimized for each platform's unique requirements and audience.",
      color: "from-pink-50 to-pink-100",
      iconColor: "text-pink-600",
    },
    {
      icon: Package,
      title: "Packaging Design",
      description:
        "Transform your products with stunning packaging that attracts customers and communicates your brand values. We design packaging that's both beautiful and functional.",
      color: "from-green-50 to-green-100",
      iconColor: "text-green-600",
    },
    {
      icon: Video,
      title: "Infographics & Presentations",
      description:
        "Communicate complex information visually with compelling infographics and presentation designs. Make your data memorable and your presentations impactful.",
      color: "from-orange-50 to-orange-100",
      iconColor: "text-orange-600",
    },
    {
      icon: Sparkles,
      title: "Illustration & Custom Art",
      description:
        "Bring your ideas to life with custom illustrations, icons, and artwork. Our artists create unique visuals that set your brand apart from the competition.",
      color: "from-indigo-50 to-indigo-100",
      iconColor: "text-indigo-600",
    },
  ];

  const packages = [
    {
      name: "Starter Package",
      price: "$499",
      period: "/ project",
      features: [
        "Logo Design (3 concepts)",
        "Business Card Design",
        "Social Media Profile Graphics",
        "Brand Color Palette",
        "Basic Brand Guidelines",
        "2 Revision Rounds",
        "High-Resolution Files",
        "7-Day Delivery",
      ],
      color: "from-blue-500 to-blue-600",
      featured: false,
    },
    {
      name: "Professional Package",
      price: "$1,299",
      period: "/ project",
      features: [
        "Complete Brand Identity System",
        "Logo Design (5 concepts)",
        "Business Stationery Suite",
        "Social Media Template Pack (10 templates)",
        "Marketing Collateral (2 items)",
        "Comprehensive Brand Guidelines",
        "Unlimited Revisions",
        "Source Files Included",
        "Priority Support",
        "14-Day Delivery",
      ],
      color: "from-purple-500 to-purple-600",
      featured: true,
    },
    {
      name: "Enterprise Package",
      price: "$2,999",
      period: "/ project",
      features: [
        "Full Brand Development",
        "Logo Suite (Primary + Variations)",
        "Complete Stationery Package",
        "Social Media Template Library (30+ templates)",
        "Marketing Collateral Suite (5+ items)",
        "Brand Style Guide + Digital Handbook",
        "Packaging Design (if applicable)",
        "Presentation Templates",
        "Unlimited Revisions",
        "Dedicated Designer",
        "Source Files + Asset Library",
        "30-Day Delivery + Ongoing Support",
      ],
      color: "from-red-500 to-rose-600",
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
      <section className="py-16 md:py-24 px-4 bg-gradient-to-br from-purple-600 via-purple-700 to-indigo-800 text-white">
        <div className="container mx-auto max-w-4xl text-center">
          <Badge className="bg-white/20 hover:bg-white/30 text-white border-0 mb-6">
            <Palette className="w-4 h-4 mr-2" />
            Graphic Design Services
          </Badge>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
            Transform Your Vision into Stunning Visuals
          </h1>
          <p className="text-lg md:text-xl text-purple-100 max-w-3xl mx-auto">
            Professional graphic design services that bring your brand to life and captivate your audience.
          </p>
        </div>
      </section>

      {/* Services Section */}
      <section className="py-16 md:py-20 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Our Graphic Design Services
            </h2>
            <p className="text-muted-foreground max-w-3xl mx-auto">
              From brand identity to marketing materials, we create designs that make an impact.
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
      <section className="py-16 md:py-20 px-4 bg-gradient-to-br from-purple-600 via-purple-700 to-indigo-800">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Design Packages & Pricing
            </h2>
            <p className="text-purple-100 max-w-3xl mx-auto">
              Choose the perfect package for your design needs. All packages include unlimited revisions until you're satisfied.
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
              Why Choose Our Design Services?
            </h2>
          </div>

          <div className="grid md:grid-cols-4 gap-6">
            {[
              {
                icon: Award,
                title: "Award-Winning Designers",
                description: "Our team has won multiple design awards and recognition."
              },
              {
                icon: Users,
                title: "Client-Focused",
                description: "We work closely with you to bring your vision to life."
              },
              {
                icon: Target,
                title: "Strategic Design",
                description: "Every design decision is backed by strategy and purpose."
              },
              {
                icon: TrendingUp,
                title: "Results-Driven",
                description: "Designs that not only look great but drive business results."
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
                What file formats will I receive?
              </AccordionTrigger>
              <AccordionContent>
                You'll receive your designs in multiple formats including PNG, JPG, PDF, and vector files (AI, EPS, SVG) depending on your package. All files are provided in high resolution suitable for both print and digital use.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-2">
              <AccordionTrigger className="text-left">
                How long does a typical project take?
              </AccordionTrigger>
              <AccordionContent>
                Project timelines vary by package: Starter packages typically take 7 days, Professional packages 14 days, and Enterprise packages 30 days. Rush delivery options are available for an additional fee.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-3">
              <AccordionTrigger className="text-left">
                How many revisions do I get?
              </AccordionTrigger>
              <AccordionContent>
                Starter packages include 2 revision rounds, while Professional and Enterprise packages include unlimited revisions until you're completely satisfied with the design.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-4">
              <AccordionTrigger className="text-left">
                Do you offer ongoing design support?
              </AccordionTrigger>
              <AccordionContent>
                Yes! We offer monthly retainer packages for ongoing design needs. This is perfect for businesses that need regular design work for social media, marketing campaigns, or other materials.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-5">
              <AccordionTrigger className="text-left">
                Can you match my existing brand style?
              </AccordionTrigger>
              <AccordionContent>
                Absolutely! We can work within your existing brand guidelines or help you evolve your brand identity while maintaining consistency with your current look and feel.
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 md:py-20 px-4 bg-gradient-to-br from-orange-500 to-orange-600 text-white">
        <div className="container mx-auto max-w-4xl text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Ready to Elevate Your Brand?
          </h2>
          <p className="text-lg md:text-xl mb-8 text-orange-100">
            Let's create stunning visuals that make your brand unforgettable.
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
                Professional design services for modern businesses.
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


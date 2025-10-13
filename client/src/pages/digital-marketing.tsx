import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Search,
  Megaphone,
  Share2,
  Mail,
  Globe,
  BarChart3,
  CheckCircle,
  ArrowRight,
  Clock,
  Target,
  Users,
  TrendingUp,
  MessageCircle,
  Award,
  Sparkles,
} from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import mtaLogoBlue from "@assets/mta-logo-blue.png";

export default function DigitalMarketingPage() {
  const services = [
    {
      icon: Search,
      title: "Search Engine Optimization (SEO)",
      description:
        "Unlock the full potential of your online presence with our comprehensive SEO services. Our experts employ proven strategies to enhance your website's visibility on search engines, ensuring your target audience can easily find you. We focus on optimizing your website's structure, content, and backlink profile to drive organic growth",
      color: "from-green-50 to-green-100",
      iconColor: "text-green-600",
    },
    {
      icon: Megaphone,
      title: "Content Marketing",
      description:
        "Engage and inform your audience with our compelling content marketing services. From informative blog posts to engaging social media updates, we create content that resonates with your target demographic. Our goal is to position your brand as an industry authority, attracting and retaining your audience's attention.",
      color: "from-blue-50 to-blue-100",
      iconColor: "text-blue-600",
    },
    {
      icon: Share2,
      title: "Social Media Marketing",
      description:
        "Leverage the power of social media platforms to connect with your audience on a deeper level. Our team develops and executes impactful social media strategies tailored to your brand's unique identity. We focus on boosting brand awareness, engagement, and conversion rates through creative and data-driven campaigns.",
      color: "from-pink-50 to-pink-100",
      iconColor: "text-pink-600",
    },
    {
      icon: Mail,
      title: "Email Marketing",
      description:
        "Stay top-of-mind with your audience through strategic email campaigns. We design, send, and analyze email marketing efforts to nurture leads and drive conversions. Our personalized email strategies ensure that your messages resonate with your subscribers, encouraging them to take desired actions.",
      color: "from-purple-50 to-purple-100",
      iconColor: "text-purple-600",
    },
    {
      icon: Globe,
      title: "Web Design & Development",
      description:
        "Your website is your digital storefront. Our web design and development services ensure that your online presence not only looks impressive but also functions seamlessly. We create responsive, user-friendly websites that captivate visitors and encourage them to convert into loyal customers.",
      color: "from-orange-50 to-orange-100",
      iconColor: "text-orange-600",
    },
    {
      icon: BarChart3,
      title: "Analytics & Reporting",
      description:
        "Data-driven decisions are essential for success. Our team provides in-depth analytics and reporting, allowing you to track progress, measure return on investment, and make informed marketing decisions. We believe in transparency and will keep you informed about the performance of your digital marketing campaigns.",
      color: "from-indigo-50 to-indigo-100",
      iconColor: "text-indigo-600",
    },
  ];

  const packages = [
    {
      name: "Gold Package",
      price: "$249.00",
      period: "/ month",
      features: [
        "1 Social Media Platform (Instagram, Facebook, X, or TikTok)",
        "Custom Marketing Plan tailored to your business",
        "Brand Marketing through strategic content and engagement",
        "Virtual Marketing Assistant available 5 days a week",
        "AI Message Automation for quick responses and customer interactions",
        "Social Media Marketing Guide to help you understand best practices",
        "3-Page Brand Book with a breakdown of your brand identity and messaging",
      ],
      color: "from-yellow-500 to-amber-600",
      featured: false,
    },
    {
      name: "Business Package",
      price: "$549.00",
      period: "/ month",
      features: [
        "1 Social Media Platform (Instagram, Facebook, X, or TikTok)",
        "Custom Marketing Plan tailored to your business",
        "Brand Marketing through strategic content and engagement",
        "Virtual Marketing Assistant available 5 days a week",
        "AI Message Automation for quick responses and customer interactions",
        "Social Media Marketing Guide to help you understand best practices",
        "3-Page Brand Book with a breakdown of your brand identity and messaging",
        "Priority Support with faster response times and dedicated assistance",
        "Monthly Performance Analytics report with insights to track progress",
      ],
      color: "from-blue-500 to-blue-700",
      featured: true,
    },
    {
      name: "Digital Domination Package",
      price: "$1500",
      period: "/ month",
      features: [
        "Management of 3 Social Media Platforms (Instagram, Facebook, X, TikTok)",
        "Custom Marketing Plan tailored to your business",
        "Brand Marketing through strategic content and engagement",
        "Virtual Marketing Assistant available 5 days a week",
        "AI Message Automation for quick responses and customer interactions",
        "Social Media Marketing Guide to help you understand best practices",
        "3-Page Brand Book with a breakdown of your brand identity and messaging",
        "Consultation & Team Training with up to 2 hours of monthly support",
        "Priority Support with faster response times and dedicated assistance",
        "5-7 Posts per Week | 20-28 Posts per Month",
        "Monthly Performance Analytics report with detailed insights and growth tracking",
        "1-2 Phone or Video Call Support Sessions with the team for 30 minutes",
      ],
      color: "from-purple-500 to-purple-700",
      featured: false,
    },
    {
      name: "Brand Takeover Package",
      price: "$2500",
      period: "/ month",
      features: [
        "Management of 4 Social Media Platforms (Instagram, Facebook, X, TikTok)",
        "Custom Marketing Plan tailored to your business",
        "Brand Marketing through strategic content and engagement",
        "Website and Google Profile Management",
        "Full-Time Virtual Assistant available for real-time brand support",
        "AI Message Automation for quick responses and customer interactions",
        "Social Media Marketing Guide to help you understand best practices",
        "3-Page Brand Book with a breakdown of your brand identity and messaging",
        "Consultation & Team Training with up to 3 hours of monthly support",
        "7 Posts per Week | 30 Posts per Month",
        "Monthly Performance Analytics report with detailed insights and growth tracking",
        "Unlimited Phone or Video Call Support Sessions with the team",
        "Online Customer Service Team to manage brand inquiries and customer engagement",
      ],
      color: "from-red-500 to-rose-700",
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
      <section className="py-16 md:py-24 px-4 bg-gradient-to-br from-blue-600 via-blue-700 to-blue-800 text-white">
        <div className="container mx-auto max-w-4xl text-center">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
            Digital Marketing Services
          </h1>
          <p className="text-lg md:text-xl text-blue-100 max-w-3xl mx-auto">
            Elevate Your Online Presence with Marketing Team App
          </p>
        </div>
      </section>

      {/* Introduction */}
      <section className="py-12 md:py-16 px-4 bg-gray-50">
        <div className="container mx-auto max-w-4xl text-center">
          <p className="text-base md:text-lg text-muted-foreground leading-relaxed">
            Welcome to Marketing Team App's Digital Marketing Services page. We're here to transform your online presence
            and drive unparalleled success in the digital landscape. Discover how our expert team can help you achieve your
            digital marketing goals.
          </p>
        </div>
      </section>

      {/* Services Section */}
      <section className="py-16 md:py-20 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Our Digital Marketing Services:
            </h2>
          </div>

          <div className="space-y-8">
            {services.map((service, idx) => (
              <Card
                key={idx}
                className="p-6 md:p-8 hover:shadow-xl transition-all duration-300 border-l-4 border-l-blue-500"
              >
                <div className="flex gap-6 items-start">
                  <div
                    className={`w-16 h-16 md:w-20 md:h-20 rounded-2xl bg-gradient-to-br ${service.color} flex items-center justify-center flex-shrink-0 shadow-md`}
                  >
                    <service.icon className={`w-8 h-8 md:w-10 md:h-10 ${service.iconColor}`} />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl md:text-2xl font-bold mb-3">
                      {idx + 1}. {service.title}
                    </h3>
                    <p className="text-muted-foreground leading-relaxed">
                      {service.description}
                    </p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-16 md:py-20 px-4 bg-gradient-to-br from-blue-600 via-blue-700 to-blue-800">
        <div className="container mx-auto max-w-7xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Price & Packages
            </h2>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {packages.map((pkg, idx) => (
              <Card
                key={idx}
                className={`p-6 hover:shadow-2xl transition-all duration-300 ${
                  pkg.featured ? "ring-2 ring-orange-500 scale-105" : ""
                }`}
              >
                <div className="text-center mb-6">
                  <h3 className="text-xl font-bold mb-4">{pkg.name}</h3>
                  <div className="mb-4">
                    <span className="text-4xl font-bold bg-gradient-to-r bg-clip-text text-transparent ${pkg.color}">
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

                <div className="space-y-4">
                  <p className="font-semibold text-sm">All features</p>
                  <ul className="space-y-3">
                    {pkg.features.map((feature, fIdx) => (
                      <li key={fIdx} className="flex gap-2 text-sm">
                        <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                        <span className="text-muted-foreground">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Why Choose Us Section */}
      <section className="py-16 md:py-20 px-4 bg-gray-50">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Why Choose Marketing Team App?
            </h2>
            <p className="text-muted-foreground max-w-3xl mx-auto">
              Partner with a team that's dedicated to delivering exceptional results and driving your business forward.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                icon: Award,
                title: "Proven Track Record",
                description: "15+ years of experience delivering measurable results for over 1,000 clients worldwide."
              },
              {
                icon: Users,
                title: "Expert Team",
                description: "Dedicated marketing professionals who stay ahead of industry trends and best practices."
              },
              {
                icon: Target,
                title: "Customized Strategies",
                description: "Tailored marketing plans designed specifically for your business goals and audience."
              },
              {
                icon: TrendingUp,
                title: "Data-Driven Results",
                description: "Transparent reporting and analytics to track ROI and optimize campaign performance."
              }
            ].map((benefit, idx) => (
              <Card key={idx} className="p-6 text-center hover:shadow-xl transition-all duration-300">
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

      {/* Our Process Section */}
      <section className="py-16 md:py-20 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Our Proven Process
            </h2>
            <p className="text-muted-foreground max-w-3xl mx-auto">
              We follow a structured approach to ensure your digital marketing success from strategy to execution.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {
                step: "01",
                title: "Discovery & Strategy",
                description: "We analyze your business, competitors, and target audience to create a customized marketing strategy.",
                icon: Search,
                color: "from-blue-500 to-blue-600"
              },
              {
                step: "02",
                title: "Planning & Setup",
                description: "Develop comprehensive campaigns, set up tracking systems, and prepare all marketing materials.",
                icon: Clock,
                color: "from-purple-500 to-purple-600"
              },
              {
                step: "03",
                title: "Execution & Launch",
                description: "Launch campaigns across all channels with precision timing and coordinated messaging.",
                icon: Sparkles,
                color: "from-orange-500 to-orange-600"
              },
              {
                step: "04",
                title: "Monitor & Optimize",
                description: "Continuous monitoring, testing, and optimization to maximize ROI and campaign performance.",
                icon: TrendingUp,
                color: "from-green-500 to-green-600"
              }
            ].map((step, idx) => (
              <div key={idx} className="relative">
                <div className="text-center">
                  <div className={`w-16 h-16 mx-auto rounded-full bg-gradient-to-br ${step.color} flex items-center justify-center mb-4 shadow-lg`}>
                    <step.icon className="w-8 h-8 text-white" />
                  </div>
                  <div className={`text-5xl font-bold mb-2 bg-gradient-to-r ${step.color} bg-clip-text text-transparent`}>
                    {step.step}
                  </div>
                  <h3 className="text-xl font-bold mb-2">{step.title}</h3>
                  <p className="text-sm text-muted-foreground">{step.description}</p>
                </div>
                {idx < 3 && (
                  <div className="hidden lg:block absolute top-8 left-full w-full h-0.5 bg-gradient-to-r from-gray-300 to-transparent -z-10"></div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-16 md:py-20 px-4 bg-gray-50">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              What Our Clients Say
            </h2>
            <p className="text-muted-foreground max-w-3xl mx-auto">
              Don't just take our word for it - hear from businesses that have transformed their digital presence with us.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                quote: "Marketing Team App's digital marketing strategy increased our website traffic by 250% in just 3 months. Their SEO expertise is unmatched!",
                name: "Jennifer K.",
                role: "CEO, Tech Startup",
                rating: 5
              },
              {
                quote: "The social media campaigns they created for us generated more leads than we ever imagined. Our engagement rates tripled!",
                name: "Marcus T.",
                role: "Marketing Director, E-commerce",
                rating: 5
              },
              {
                quote: "Their email marketing strategies and automation helped us achieve a 45% increase in conversions. Outstanding ROI!",
                name: "Sarah L.",
                role: "Founder, Online Retailer",
                rating: 5
              }
            ].map((testimonial, idx) => (
              <Card key={idx} className="p-6 hover:shadow-xl transition-all duration-300">
                <div className="flex gap-1 mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <svg key={i} className="w-5 h-5 fill-orange-500 text-orange-500" viewBox="0 0 20 20">
                      <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
                    </svg>
                  ))}
                </div>
                <p className="text-muted-foreground mb-6 italic">"{testimonial.quote}"</p>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-semibold">
                    {testimonial.name.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div>
                    <p className="font-semibold">{testimonial.name}</p>
                    <p className="text-sm text-muted-foreground">{testimonial.role}</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16 md:py-20 px-4">
        <div className="container mx-auto max-w-4xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Frequently Asked Questions
            </h2>
            <p className="text-muted-foreground">
              Get answers to common questions about our digital marketing services.
            </p>
          </div>

          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="item-1">
              <AccordionTrigger className="text-left">
                How long does it take to see results from digital marketing?
              </AccordionTrigger>
              <AccordionContent>
                Results vary depending on the service. SEO typically shows significant improvements within 3-6 months, 
                while paid advertising and social media campaigns can generate results within weeks. We provide monthly 
                reports so you can track progress every step of the way.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-2">
              <AccordionTrigger className="text-left">
                What's included in the monthly packages?
              </AccordionTrigger>
              <AccordionContent>
                Each package includes social media management, content creation, analytics reporting, and dedicated support. 
                Higher-tier packages include additional platforms, more posts per week, team training, and priority support. 
                All packages come with our AI message automation and custom marketing strategy.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-3">
              <AccordionTrigger className="text-left">
                Can I customize a package to fit my specific needs?
              </AccordionTrigger>
              <AccordionContent>
                Absolutely! While our packages provide a great starting point, we understand every business is unique. 
                Contact us to discuss your specific requirements, and we'll create a customized plan that aligns with 
                your goals and budget.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-4">
              <AccordionTrigger className="text-left">
                Do you require a long-term contract?
              </AccordionTrigger>
              <AccordionContent>
                We offer flexible month-to-month agreements for most packages. However, we recommend a minimum 3-month 
                commitment for best results, as digital marketing strategies need time to show their full potential. 
                We're confident you'll see the value and want to continue!
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-5">
              <AccordionTrigger className="text-left">
                What industries do you specialize in?
              </AccordionTrigger>
              <AccordionContent>
                We've successfully worked with businesses across various industries including e-commerce, technology, 
                healthcare, real estate, hospitality, professional services, and more. Our team adapts strategies to 
                fit your industry's unique requirements and target audience.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-6">
              <AccordionTrigger className="text-left">
                How do I get started?
              </AccordionTrigger>
              <AccordionContent>
                Getting started is easy! Click the "Get Started" button to sign up, or contact us directly for a 
                free consultation. We'll discuss your goals, recommend the best package for your needs, and can 
                typically have your campaigns launched within 1-2 weeks.
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 md:py-20 px-4 bg-gradient-to-br from-orange-500 to-orange-600 text-white">
        <div className="container mx-auto max-w-4xl text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Ready to Transform Your Digital Presence?
          </h2>
          <p className="text-lg md:text-xl mb-8 text-orange-100">
            Let's discuss your project and create a customized strategy that aligns with your business goals.
          </p>
          <Link href="/signup">
            <Button
              size="lg"
              className="gap-2 bg-white text-orange-600 hover:bg-gray-100 border-0 shadow-xl"
            >
              Get Started Today
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
                Navigate the digital landscape with Marketing Team App, the
                epitome of sophistication in digital marketing services.
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
                  Mobile App Development
                </li>
                <li className="hover:text-primary transition-colors cursor-pointer">
                  Graphic Design
                </li>
                <li className="hover:text-primary transition-colors cursor-pointer">
                  AI Automation
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
                  Contact Us
                </li>
                <li className="hover:text-primary transition-colors cursor-pointer">
                  Privacy Policy
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
                  Leadership
                </li>
                <li className="hover:text-primary transition-colors cursor-pointer">
                  Careers
                </li>
                <li className="hover:text-primary transition-colors cursor-pointer">
                  Legal Notice
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


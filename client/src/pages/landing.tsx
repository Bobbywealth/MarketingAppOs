import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu";
import { ArrowRight, CheckCircle, Star, TrendingUp, Globe, Smartphone, Palette, Brain, CreditCard, Lightbulb, Users, Target, Zap, ChevronDown, Pencil, FileText, Sparkles, Bot } from "lucide-react";
import mtaLogoBlue from "@assets/mta-logo-blue.png";
import heroImage from "@assets/hero-header-image.png";
import resultsImage from "@assets/stock_images/woman_working_on_lap_e8e31683.jpg";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b sticky top-0 z-50 bg-white/95 backdrop-blur shadow-sm">
        <div className="container mx-auto px-4 py-3 md:py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img src={mtaLogoBlue} alt="Marketing Team App" className="h-14 md:h-20 w-auto" data-testid="img-logo" />
          </div>
          
          <nav className="hidden md:flex items-center gap-8">
            <a href="#home" className="text-base font-medium text-foreground hover:text-primary transition-colors" data-testid="nav-home">
              Home
            </a>
            
            <NavigationMenu>
              <NavigationMenuList>
                <NavigationMenuItem>
                  <NavigationMenuTrigger className="text-base font-medium bg-transparent hover:bg-transparent data-[state=open]:bg-transparent" data-testid="nav-services">
                    Services
                  </NavigationMenuTrigger>
                  <NavigationMenuContent>
                    <div className="w-64 p-2">
                      <a href="#digital-marketing" className="block px-4 py-3 text-sm font-medium hover:bg-accent rounded-md transition-colors" data-testid="nav-digital-marketing">
                        Digital Marketing
                      </a>
                      <a href="#ai-automation" className="block px-4 py-3 text-sm font-medium hover:bg-accent rounded-md transition-colors" data-testid="nav-ai-automation">
                        AI Automation
                      </a>
                      <a href="#web-design" className="block px-4 py-3 text-sm font-medium hover:bg-accent rounded-md transition-colors" data-testid="nav-web-design">
                        Web Design & Development
                      </a>
                      <a href="#content-creation" className="block px-4 py-3 text-sm font-medium hover:bg-accent rounded-md transition-colors" data-testid="nav-content-creation">
                        Content Creation
                      </a>
                      <a href="#seo" className="block px-4 py-3 text-sm font-medium hover:bg-accent rounded-md transition-colors" data-testid="nav-seo">
                        SEO
                      </a>
                      <a href="#crm" className="block px-4 py-3 text-sm font-medium hover:bg-accent rounded-md transition-colors" data-testid="nav-crm">
                        CRM & Mobile Apps
                      </a>
                      <a href="#payment-solutions" className="block px-4 py-3 text-sm font-medium hover:bg-accent rounded-md transition-colors" data-testid="nav-payment-solutions">
                        Payment Solutions
                      </a>
                      <a href="#funding" className="block px-4 py-3 text-sm font-medium hover:bg-accent rounded-md transition-colors" data-testid="nav-funding">
                        Funding
                      </a>
                    </div>
                  </NavigationMenuContent>
                </NavigationMenuItem>
              </NavigationMenuList>
            </NavigationMenu>
            
            <a href="#blog" className="text-base font-medium text-foreground hover:text-primary transition-colors" data-testid="nav-blog">
              Blog
            </a>
            <a href="#about" className="text-base font-medium text-foreground hover:text-primary transition-colors" data-testid="nav-about">
              About Us
            </a>
            <a href="#contact" className="text-base font-medium text-foreground hover:text-primary transition-colors" data-testid="nav-contact">
              Contact Us
            </a>
          </nav>

          <div className="flex items-center gap-2 md:gap-4">
            <Link href="/login">
              <Button className="hidden md:inline-flex bg-blue-600 hover:bg-blue-700 text-white" data-testid="button-login-header">Login</Button>
            </Link>
            <Link href="/signup">
              <Button size="sm" className="gap-1 md:gap-2 text-sm bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white shadow-lg shadow-orange-500/30" data-testid="button-get-started-header">
                Get Started
                <ArrowRight className="w-3 h-3 md:w-4 md:h-4" />
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative py-12 md:py-24 px-4 overflow-hidden gradient-animate-hero hero-glow">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(59,130,246,0.3),transparent_50%)]"></div>
        <div className="absolute top-0 left-0 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl"></div>
        <div className="container mx-auto relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="text-white space-y-4 md:space-y-6 slide-in-left text-center lg:text-left">
              <Badge className="bg-orange-500 hover:bg-orange-600 text-white border-0 shadow-lg shadow-orange-500/50 text-xs md:text-sm px-3 md:px-4 py-1.5 md:py-2 inline-block">
                <span className="animate-pulse">● </span>
                Wolfpaq Marketing
              </Badge>
              <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold leading-tight text-shadow-soft">
                Your Dedicated Remote <br />
                <span className="bg-gradient-to-r from-green-400 to-emerald-500 bg-clip-text text-transparent">Marketing Team</span>
              </h1>
              <p className="text-xl sm:text-2xl font-semibold text-white mb-2">
                Get Results Without the Overhead
              </p>
              <p className="text-base sm:text-lg md:text-xl text-blue-50 leading-relaxed max-w-xl mx-auto lg:mx-0">
                Access a full-stack marketing team for less than the cost of one employee. From strategy to execution, we handle everything.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 md:gap-4 pt-2 md:pt-4 justify-center lg:justify-start items-center lg:items-start">
                <Link href="/signup">
                  <Button size="lg" className="gap-2 w-full sm:w-auto bg-white hover:bg-gray-100 text-blue-700 border-0 shadow-xl hover:shadow-2xl transition-all px-6 md:px-8 font-semibold" data-testid="button-get-started-hero">
                    Start Free Trial
                    <ArrowRight className="w-4 h-4 md:w-5 md:h-5" />
                  </Button>
                </Link>
                <Link href="/login">
                  <Button size="lg" variant="outline" className="w-full sm:w-auto glass-effect border-white/30 text-white hover:bg-white/20 hover:border-white/40 shadow-lg px-6 md:px-8" data-testid="button-login-hero">
                    Watch Demo
                  </Button>
                </Link>
              </div>
              <div className="flex flex-col sm:flex-row items-center gap-4 text-sm text-blue-100 pt-4">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-400" />
                  <span>Free 14-day trial</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-400" />
                  <span>No credit card required</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-400" />
                  <span>Cancel anytime</span>
                </div>
              </div>
            </div>
            <div className="hidden lg:block relative slide-in-right">
              <div className="relative animate-float">
                <div className="absolute -top-4 -right-4 w-72 h-72 bg-gradient-to-br from-blue-400/30 to-purple-600/30 rounded-full blur-3xl"></div>
                <div className="absolute -bottom-4 -left-4 w-72 h-72 bg-gradient-to-tr from-purple-400/30 to-pink-600/30 rounded-full blur-3xl"></div>
                <div className="relative z-10 rounded-2xl overflow-hidden shadow-2xl ring-1 ring-white/10">
                  <img 
                    src={heroImage} 
                    alt="Marketing Dashboard Analytics" 
                    className="w-full h-auto transform hover:scale-105 transition-transform duration-700"
                    data-testid="img-hero-dashboard"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Platform Features */}
      <section className="py-12 md:py-16 px-4 -mt-12 md:-mt-20 relative z-20">
        <div className="container mx-auto">
          <div className="text-center mb-12">
            <p className="text-sm font-semibold text-blue-600 uppercase tracking-wider mb-2">Platform Features</p>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Everything You Need to Manage Your Marketing Business
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Powerful tools designed for marketing teams to deliver exceptional client service and grow your business.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 stagger-fade-in">
            <Card className="p-6 md:p-8 bg-white hover-lift shadow-lg hover:shadow-2xl transition-all duration-300 border-t-4 border-t-blue-500">
              <div className="w-16 h-16 md:w-20 md:h-20 rounded-2xl bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center mb-4 md:mb-6 shadow-md">
                <Users className="w-8 h-8 md:w-10 md:h-10 text-blue-600" />
              </div>
              <h3 className="text-lg md:text-xl font-bold mb-2 md:mb-3">Client Management</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Centralize all client information, communications, and project history in one place.
              </p>
            </Card>
            <Card className="p-6 md:p-8 bg-white hover-lift shadow-lg hover:shadow-2xl transition-all duration-300 border-t-4 border-t-purple-500">
              <div className="w-16 h-16 md:w-20 md:h-20 rounded-2xl bg-gradient-to-br from-purple-50 to-purple-100 flex items-center justify-center mb-4 md:mb-6 shadow-md">
                <Target className="w-8 h-8 md:w-10 md:h-10 text-purple-600" />
              </div>
              <h3 className="text-lg md:text-xl font-bold mb-2 md:mb-3">Campaign Tracking</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Monitor campaign performance, deadlines, and deliverables with visual pipelines.
              </p>
            </Card>
            <Card className="p-6 md:p-8 bg-white hover-lift shadow-lg hover:shadow-2xl transition-all duration-300 border-t-4 border-t-emerald-500">
              <div className="w-16 h-16 md:w-20 md:h-20 rounded-2xl bg-gradient-to-br from-emerald-50 to-emerald-100 flex items-center justify-center mb-4 md:mb-6 shadow-md">
                <TrendingUp className="w-8 h-8 md:w-10 md:h-10 text-emerald-600" />
              </div>
              <h3 className="text-lg md:text-xl font-bold mb-2 md:mb-3">Analytics Dashboard</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Real-time insights and reporting to measure campaign performance and client ROI.
              </p>
            </Card>
            <Card className="p-6 md:p-8 bg-white hover-lift shadow-lg hover:shadow-2xl transition-all duration-300 border-t-4 border-t-orange-500">
              <div className="w-16 h-16 md:w-20 md:h-20 rounded-2xl bg-gradient-to-br from-orange-50 to-orange-100 flex items-center justify-center mb-4 md:mb-6 shadow-md">
                <Bot className="w-8 h-8 md:w-10 md:h-10 text-orange-600" />
              </div>
              <h3 className="text-lg md:text-xl font-bold mb-2 md:mb-3">AI Automation</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Automate repetitive tasks and workflows to focus on what matters most.
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-20 px-4 bg-gradient-to-b from-gray-50 to-white">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-12">
            <p className="text-sm font-semibold text-blue-600 uppercase tracking-wider mb-2">Pricing</p>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Simple, Transparent Pricing
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Choose the perfect plan for your business. All plans include 14-day free trial.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {/* Starter Plan */}
            <Card className="p-8 hover-lift transition-all duration-300">
              <div className="mb-6">
                <h3 className="text-2xl font-bold mb-2">Starter</h3>
                <p className="text-muted-foreground text-sm">Perfect for small teams</p>
              </div>
              <div className="mb-6">
                <span className="text-4xl font-bold">$49</span>
                <span className="text-muted-foreground">/month</span>
              </div>
              <ul className="space-y-3 mb-8">
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  <span>Up to 50 clients</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  <span>5 team members</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  <span>Basic analytics</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  <span>Email support</span>
                </li>
              </ul>
              <Link href="/signup">
                <Button className="w-full" variant="outline">Start Free Trial</Button>
              </Link>
            </Card>

            {/* Professional Plan */}
            <Card className="p-8 border-2 border-blue-500 relative hover-lift transition-all duration-300 shadow-xl">
              <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                <Badge className="bg-blue-600 text-white">Most Popular</Badge>
              </div>
              <div className="mb-6">
                <h3 className="text-2xl font-bold mb-2">Professional</h3>
                <p className="text-muted-foreground text-sm">For growing businesses</p>
              </div>
              <div className="mb-6">
                <span className="text-4xl font-bold">$149</span>
                <span className="text-muted-foreground">/month</span>
              </div>
              <ul className="space-y-3 mb-8">
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  <span>Unlimited clients</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  <span>15 team members</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  <span>Advanced analytics</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  <span>Priority support</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  <span>API access</span>
                </li>
              </ul>
              <Link href="/signup">
                <Button className="w-full bg-blue-600 hover:bg-blue-700">Start Free Trial</Button>
              </Link>
            </Card>

            {/* Enterprise Plan */}
            <Card className="p-8 hover-lift transition-all duration-300">
              <div className="mb-6">
                <h3 className="text-2xl font-bold mb-2">Enterprise</h3>
                <p className="text-muted-foreground text-sm">For large organizations</p>
              </div>
              <div className="mb-6">
                <span className="text-4xl font-bold">Custom</span>
              </div>
              <ul className="space-y-3 mb-8">
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  <span>Unlimited everything</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  <span>Custom integrations</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  <span>Dedicated support</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  <span>Custom training</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  <span>SLA guarantee</span>
                </li>
              </ul>
              <Link href="/contact">
                <Button className="w-full" variant="outline">Contact Sales</Button>
              </Link>
            </Card>
          </div>
        </div>
      </section>

      {/* Social Proof / Testimonials */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-12">
            <p className="text-sm font-semibold text-blue-600 uppercase tracking-wider mb-2">Testimonials</p>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Loved by Marketing Teams Worldwide
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              See what our customers have to say about their experience with our platform.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <Card className="p-8 hover-lift">
              <div className="flex gap-1 mb-4">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                ))}
              </div>
              <p className="text-muted-foreground mb-6 italic">
                "This platform transformed how we manage our clients. We've increased productivity by 40% and our clients love the transparency."
              </p>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold">
                  SM
                </div>
                <div>
                  <p className="font-semibold">Sarah Miller</p>
                  <p className="text-sm text-muted-foreground">Marketing Director</p>
                </div>
              </div>
            </Card>

            <Card className="p-8 hover-lift">
              <div className="flex gap-1 mb-4">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                ))}
              </div>
              <p className="text-muted-foreground mb-6 italic">
                "Finally, a CRM that actually makes sense for marketing teams. The campaign tracking features alone are worth the price."
              </p>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center text-white font-bold">
                  JD
                </div>
                <div>
                  <p className="font-semibold">John Davis</p>
                  <p className="text-sm text-muted-foreground">Agency Owner</p>
                </div>
              </div>
            </Card>

            <Card className="p-8 hover-lift">
              <div className="flex gap-1 mb-4">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                ))}
              </div>
              <p className="text-muted-foreground mb-6 italic">
                "The best investment we've made. Our team collaboration has improved dramatically and clients are happier than ever."
              </p>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center text-white font-bold">
                  EC
                </div>
                <div>
                  <p className="font-semibold">Emily Chen</p>
                  <p className="text-sm text-muted-foreground">Operations Manager</p>
                </div>
              </div>
            </Card>
          </div>

          {/* Trust Badges */}
          <div className="mt-16 pt-12 border-t">
            <p className="text-center text-muted-foreground mb-8 text-sm uppercase tracking-wider">Trusted By Leading Brands</p>
            <div className="flex flex-wrap justify-center items-center gap-12 opacity-60 grayscale hover:opacity-100 hover:grayscale-0 transition-all">
              <div className="text-2xl font-bold">Company A</div>
              <div className="text-2xl font-bold">Company B</div>
              <div className="text-2xl font-bold">Company C</div>
              <div className="text-2xl font-bold">Company D</div>
              <div className="text-2xl font-bold">Company E</div>
            </div>
          </div>
        </div>
      </section>

      {/* Amplify Section - Blue Background */}
      <section className="py-20 px-4 bg-gradient-to-br from-blue-600 to-blue-800 text-white">
        <div className="container mx-auto max-w-6xl">
          <h2 className="text-4xl md:text-5xl font-bold mb-8 text-center">Amplify Your Brand's Impact</h2>
          <p className="text-lg text-blue-100 text-center max-w-3xl mx-auto mb-12">
            Let's give your brand a digital makeover! At Marketing Team App, we use smart strategies in Digital Marketing, 
            powerful Web Development (including mobile apps & CRMs), compelling Content Creation, and cutting-edge AI Automation to make your brand shine online.
          </p>

          <div className="grid md:grid-cols-4 gap-8 mb-16">
            <div className="text-center">
              <div className="text-5xl font-bold mb-2">60%+</div>
              <p className="text-blue-100">Hours of Expertise</p>
            </div>
            <div className="text-center">
              <div className="text-5xl font-bold mb-2">90%+</div>
              <p className="text-blue-100">Retention Rate</p>
            </div>
            <div className="text-center">
              <div className="text-5xl font-bold mb-2">31%+</div>
              <p className="text-blue-100">Average Traffic Increase</p>
            </div>
            <div className="text-center">
              <div className="text-5xl font-bold mb-2">7M+</div>
              <p className="text-blue-100">Calls Generated</p>
            </div>
          </div>

          <Card className="p-12 bg-white text-foreground">
            <div className="text-center">
              <h3 className="text-3xl font-bold mb-4">Your vision, our platform</h3>
              <p className="text-muted-foreground mb-8 max-w-2xl mx-auto">
                Join us in transforming ideas into digital excellence, and together, we'll rock the online world.
              </p>
              <Link href="/signup">
                <Button size="lg" className="gap-2 bg-blue-600 hover:bg-blue-700 text-white">
                  Get Started
                  <ArrowRight className="w-5 h-5" />
                </Button>
              </Link>
            </div>
          </Card>
        </div>
      </section>

      {/* Services Detailed */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-12">
            <p className="text-sm font-semibold text-red-500 uppercase tracking-wider mb-2">What We Offer</p>
            <h2 className="text-3xl md:text-4xl font-bold">
              Helping you deliver a better customer experience
            </h2>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { icon: TrendingUp, title: "Digital Marketing", desc: "Elevate your online presence with strategic and result-driven solutions.", color: "red" },
              { icon: Globe, title: "Web Design & Development", desc: "Craft visually appealing and functional websites that resonate with your brand.", color: "orange" },
              { icon: Smartphone, title: "Mobile App Development", desc: "Transform ideas into reality with user-friendly and innovative mobile apps.", color: "blue" },
              { icon: Palette, title: "Graphic Design", desc: "Bring your brand to life with captivating visual elements and designs.", color: "green" },
              { icon: Brain, title: "AI Automation", desc: "Harness AI to streamline processes and enhance efficiency.", color: "purple" },
              { icon: CreditCard, title: "Payment Solution", desc: "Comprehensive payment solutions tailored to your business needs.", color: "indigo" },
            ].map((service, idx) => (
              <Card key={idx} className="p-6 hover-elevate transition-all duration-300 transform hover:-translate-y-1">
                <div className={`w-12 h-12 rounded-full bg-${service.color}-100 flex items-center justify-center mb-4`}>
                  <service.icon className={`w-6 h-6 text-${service.color}-600`} />
                </div>
                <h3 className="text-lg font-semibold mb-2">{service.title}</h3>
                <p className="text-sm text-muted-foreground mb-4">{service.desc}</p>
                <Link href="/login">
                  <Button variant="ghost" size="sm" className="gap-2 text-blue-600" data-testid={`button-learn-more-${idx}`}>
                    Learn more
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </Link>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Getting Real Results */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="relative">
              <img 
                src={resultsImage} 
                alt="Remote Team Digital Marketing" 
                className="w-full h-auto rounded-lg shadow-xl"
                data-testid="img-results-illustration"
              />
            </div>
            <div className="space-y-6">
              <h2 className="text-3xl md:text-4xl font-bold">Getting you those real results</h2>
              <p className="text-muted-foreground">
                Skyrocketing your results through expert Digital Marketing, cutting-edge Web Development (with mobile apps & CRMs), 
                compelling Content Creation, and powerful AI Automation. Let's bring your vision to life!
              </p>
              <div className="space-y-4">
                {[
                  { icon: Lightbulb, title: "Proven Expertise", desc: "Choose Marketing Team App for seasoned professionals delivering tangible results in digital marketing, showcasing a commitment to excellence and navigating diverse trends." },
                  { icon: Users, title: "Comprehensive Services", desc: "Opt for Marketing Team App's one-stop solution, providing Digital Marketing, Web Development (including mobile apps & CRMs), Content Creation, and AI Automation services for a cohesive and impactful brand identity." },
                  { icon: Target, title: "Client-Centric Approach", desc: "Partner with Marketing Team App for a client-centric philosophy, tailoring strategies to align with your specific business objectives and fostering long-term partnerships built on trust and transparency." },
                  { icon: Zap, title: "Innovation and Adaptability", desc: "Select Marketing Team App for a commitment to innovation and adaptability in the ever-evolving digital landscape, ensuring your business stays ahead in the competitive online environment." },
                ].map((item, idx) => (
                  <div key={idx} className="flex gap-4">
                    <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                      <item.icon className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold mb-1">{item.title}</h3>
                      <p className="text-sm text-muted-foreground">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 px-4 bg-muted/30">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-12">
            <p className="text-sm font-semibold text-red-500 uppercase tracking-wider mb-2">Testimonial</p>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">What our customers say about us</h2>
            <div className="flex items-center justify-center gap-2">
              <span className="text-lg font-semibold">4.7 (Client Reviews)</span>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Star key={i} className="w-5 h-5 fill-orange-500 text-orange-500" />
                ))}
              </div>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {[
              {
                quote: "Marketing Team App turned my small business into an online sensation! Their digital marketing strategies were spot-on, and the website they developed perfectly encapsulated our brand. Grateful for their expertise!",
                name: "John D.",
                role: "Small Business Owner",
                initial: "JD"
              },
              {
                quote: "Choosing Marketing Team App for my startup's digital needs was a game-changer. The personalized support and user-friendly mobile app they crafted exceeded my expectations. Highly recommended!",
                name: "Emily M.",
                role: "Startup Enthusiast",
                initial: "EM"
              },
              {
                quote: "Marketing Team App took my e-commerce venture to new heights! Their comprehensive digital marketing strategies significantly boosted sales, and the sleek web development work transformed our online store. Truly impressed!",
                name: "Sarah L.",
                role: "E-commerce Entrepreneur",
                initial: "SL"
              },
              {
                quote: "Impressed by Marketing Team App's professionalism! Their personalized approach to digital marketing significantly boosted our online visibility. The mobile app they developed is user-friendly and innovative. Highly satisfied!",
                name: "Michael R.",
                role: "Tech Startup Founder",
                initial: "MR"
              },
            ].map((testimonial, idx) => (
              <Card key={idx} className="p-6 hover-elevate transition-all">
                <p className="text-muted-foreground mb-6 italic">"{testimonial.quote}"</p>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                    <span className="font-semibold text-blue-600">{testimonial.initial}</span>
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

      {/* CTA Section */}
      <section className="py-20 px-4 bg-gradient-to-br from-blue-600 to-blue-800 text-white">
        <div className="container mx-auto text-center max-w-3xl">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">Share Your Project Details!</h2>
          <p className="text-lg mb-8 text-blue-100">
            Initiate a conversation about your vision and goals with Marketing Team App, where our experts 
            are eager to discuss your project and tailor a strategy that aligns with your business objectives.
          </p>
          <Link href="/signup">
            <Button size="lg" className="gap-2 bg-orange-500 hover:bg-orange-600 text-white border-0" data-testid="button-cta-get-started">
              Get Started
              <ArrowRight className="w-5 h-5" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Newsletter Section */}
      <section className="py-16 px-4 bg-gradient-to-br from-blue-600 to-blue-800 text-white">
        <div className="container mx-auto max-w-4xl">
          <div className="text-center mb-8">
            <h2 className="text-2xl md:text-3xl font-bold mb-2">
              Subscribe to our newsletter to get latest news on your inbox.
            </h2>
          </div>
          <div className="flex gap-4 max-w-md mx-auto">
            <Input 
              type="text" 
              placeholder="Name" 
              className="bg-white text-foreground"
              data-testid="input-newsletter-name"
            />
            <Input 
              type="email" 
              placeholder="Email" 
              className="bg-white text-foreground"
              data-testid="input-newsletter-email"
            />
            <Button className="bg-orange-500 hover:bg-orange-600 text-white border-0 whitespace-nowrap" data-testid="button-newsletter-submit">
              Submit
            </Button>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 px-4 bg-gradient-to-b from-white to-gray-50">
        <div className="container mx-auto max-w-4xl">
          <div className="text-center mb-12">
            <p className="text-sm font-semibold text-blue-600 uppercase tracking-wider mb-2">FAQ</p>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Frequently Asked Questions
            </h2>
            <p className="text-muted-foreground">
              Everything you need to know about our platform
            </p>
          </div>

          <div className="space-y-4">
            <Card className="p-6 hover-lift">
              <h3 className="font-bold text-lg mb-2">How does the free trial work?</h3>
              <p className="text-muted-foreground">
                Start your 14-day free trial with full access to all features. No credit card required. You can cancel anytime during the trial period with no charges.
              </p>
            </Card>

            <Card className="p-6 hover-lift">
              <h3 className="font-bold text-lg mb-2">Can I change plans later?</h3>
              <p className="text-muted-foreground">
                Yes! You can upgrade or downgrade your plan at any time. Changes take effect immediately and we'll prorate any charges.
              </p>
            </Card>

            <Card className="p-6 hover-lift">
              <h3 className="font-bold text-lg mb-2">What payment methods do you accept?</h3>
              <p className="text-muted-foreground">
                We accept all major credit cards (Visa, MasterCard, American Express) and PayPal. Enterprise customers can also pay via invoice.
              </p>
            </Card>

            <Card className="p-6 hover-lift">
              <h3 className="font-bold text-lg mb-2">Is my data secure?</h3>
              <p className="text-muted-foreground">
                Absolutely. We use bank-level 256-bit SSL encryption and your data is backed up daily. We're GDPR and SOC 2 compliant.
              </p>
            </Card>

            <Card className="p-6 hover-lift">
              <h3 className="font-bold text-lg mb-2">Do you offer training and support?</h3>
              <p className="text-muted-foreground">
                Yes! All plans include email support. Professional and Enterprise plans get priority support, and Enterprise includes dedicated onboarding and training sessions.
              </p>
            </Card>

            <Card className="p-6 hover-lift">
              <h3 className="font-bold text-lg mb-2">Can I import my existing client data?</h3>
              <p className="text-muted-foreground">
                Yes, we offer data import tools and can help you migrate from your current system. Enterprise customers get white-glove migration support.
              </p>
            </Card>
          </div>

          <div className="mt-12 text-center">
            <p className="text-muted-foreground mb-4">Still have questions?</p>
            <Link href="/contact">
              <Button size="lg" className="bg-blue-600 hover:bg-blue-700">Contact Our Team</Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 px-4 bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700 text-white">
        <div className="container mx-auto max-w-4xl text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Ready to Transform Your Marketing Operations?
          </h2>
          <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
            Join thousands of marketing teams who have streamlined their workflows and grown their business with our platform.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link href="/signup">
              <Button size="lg" className="bg-white text-blue-700 hover:bg-gray-100 text-lg px-8 py-6">
                Start Your Free Trial
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
            <Link href="/login">
              <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10 text-lg px-8 py-6">
                Schedule a Demo
              </Button>
            </Link>
          </div>
          <p className="text-sm text-blue-200 mt-6">
            ✓ 14-day free trial  ✓ No credit card required  ✓ Cancel anytime
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-12 px-4 bg-background">
        <div className="container mx-auto max-w-6xl">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <img src={mtaLogoBlue} alt="Marketing Team App" className="h-12 w-auto mb-4" />
              <p className="text-sm text-muted-foreground">
                Navigate the digital landscape with Marketing Team App, the epitome of sophistication in digital marketing services.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Services</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="hover:text-primary transition-colors cursor-pointer">Digital Marketing</li>
                <li className="hover:text-primary transition-colors cursor-pointer">Web Development & CRMs</li>
                <li className="hover:text-primary transition-colors cursor-pointer">Content Creation</li>
                <li className="hover:text-primary transition-colors cursor-pointer">AI Automation</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Quick Links</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="/login" className="hover:text-primary transition-colors">Login</Link></li>
                <li className="hover:text-primary transition-colors cursor-pointer">About Us</li>
                <li className="hover:text-primary transition-colors cursor-pointer">Contact Us</li>
                <li className="hover:text-primary transition-colors cursor-pointer">Privacy Policy</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Company</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="hover:text-primary transition-colors cursor-pointer">About us</li>
                <li className="hover:text-primary transition-colors cursor-pointer">Leadership</li>
                <li className="hover:text-primary transition-colors cursor-pointer">Careers</li>
                <li className="hover:text-primary transition-colors cursor-pointer">Legal Notice</li>
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

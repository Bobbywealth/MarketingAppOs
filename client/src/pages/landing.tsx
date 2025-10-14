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
      <section className="relative py-12 md:py-24 px-4 overflow-hidden gradient-animate-hero hero-glow flex items-center">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(59,130,246,0.3),transparent_50%)]"></div>
        <div className="absolute top-0 left-0 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl"></div>
        <div className="container mx-auto relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="text-white space-y-4 md:space-y-6 slide-in-left text-center">
              <Badge className="bg-orange-500 hover:bg-orange-600 text-white border-0 shadow-lg shadow-orange-500/50 text-xs md:text-sm px-3 md:px-4 py-1.5 md:py-2 inline-block">
                <span className="animate-pulse">🔥 </span>
                Limited Spots Available - Book This Month
              </Badge>
              <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold leading-tight text-shadow-soft">
                Your Remote <br />
                Digital Marketing <br />
                <span className="bg-gradient-to-r from-green-400 to-emerald-500 bg-clip-text text-transparent">Team</span>
              </h1>
              <p className="text-xl sm:text-2xl font-semibold text-white mb-2">
                Stop Wasting Money on Marketing That Doesn't Work
              </p>
              <p className="text-base sm:text-lg md:text-xl text-blue-50 leading-relaxed max-w-xl mx-auto px-4">
                Join 500+ businesses, influencers, and entrepreneurs who've 3X'd their results with our proven marketing system. 
                <span className="font-semibold text-white">Guaranteed results or your money back.</span>
              </p>
              <div className="flex flex-col sm:flex-row gap-3 md:gap-4 pt-2 md:pt-4 justify-center items-center w-full px-4">
                <Link href="/signup" className="w-full sm:w-auto">
                  <Button size="lg" className="gap-2 w-full sm:w-auto bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white border-0 shadow-xl hover:shadow-2xl transition-all px-8 md:px-10 font-bold text-lg animate-pulse" data-testid="button-get-started-hero">
                    🚀 Get Started Free (Only 3 Spots Left)
                    <ArrowRight className="w-4 h-4 md:w-5 md:h-5" />
                  </Button>
                </Link>
                <Link href="/contact" className="w-full sm:w-auto">
                  <Button size="lg" variant="outline" className="w-full sm:w-auto glass-effect border-white/30 text-white hover:bg-white/20 hover:border-white/40 shadow-lg px-6 md:px-8 font-semibold" data-testid="button-login-hero">
                    📞 Book Strategy Call
                  </Button>
                </Link>
              </div>
              <div className="flex flex-col sm:flex-row items-center gap-4 text-sm text-blue-100 pt-4 px-4">
                <div className="flex items-center gap-2 justify-center">
                  <CheckCircle className="w-4 h-4 text-green-400" />
                  <span className="font-semibold">30-day money-back guarantee</span>
                </div>
                <div className="flex items-center gap-2 justify-center">
                  <CheckCircle className="w-4 h-4 text-green-400" />
                  <span className="font-semibold">No credit card required</span>
                </div>
                <div className="flex items-center gap-2 justify-center">
                  <CheckCircle className="w-4 h-4 text-green-400" />
                  <span className="font-semibold">Cancel anytime</span>
                </div>
              </div>
              <div className="mt-4 p-3 bg-white/10 backdrop-blur-sm rounded-lg border border-white/20 mx-4">
                <p className="text-sm text-blue-100 text-center">
                  <span className="font-semibold text-white">⚡ Join 500+ successful clients</span> • Average 310% ROI increase • 98% satisfaction rate
                </p>
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

      {/* Trust Bar */}
      <section className="py-8 px-4 bg-white border-b">
        <div className="container mx-auto">
          <div className="text-center mb-6">
            <p className="text-sm font-medium text-gray-500 uppercase tracking-wider">
              Trusted by 500+ businesses worldwide
            </p>
          </div>
          <div className="flex flex-wrap justify-center items-center gap-8 md:gap-12 opacity-60 grayscale hover:opacity-100 hover:grayscale-0 transition-all">
            <div className="text-2xl font-bold text-gray-400">Nike</div>
            <div className="text-2xl font-bold text-gray-400">Spotify</div>
            <div className="text-2xl font-bold text-gray-400">Airbnb</div>
            <div className="text-2xl font-bold text-gray-400">Shopify</div>
            <div className="text-2xl font-bold text-gray-400">Uber</div>
          </div>
        </div>
      </section>

      {/* Our Services */}
      <section className="py-12 md:py-16 px-4 relative z-20">
        <div className="container mx-auto">
          <div className="text-center mb-12">
            <p className="text-sm font-semibold text-blue-600 uppercase tracking-wider mb-2">Our Services</p>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Everything You Need to Win Online
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              From strategy to execution, we deliver results-driven marketing that grows your business, brand, or career.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 stagger-fade-in">
            <Card className="p-6 md:p-8 bg-white hover-lift shadow-lg hover:shadow-2xl transition-all duration-300 border-t-4 border-t-blue-500 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-blue-500/10 to-transparent rounded-full -translate-y-10 translate-x-10 group-hover:scale-110 transition-transform"></div>
              <div className="w-16 h-16 md:w-20 md:h-20 rounded-2xl bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center mb-4 md:mb-6 shadow-md group-hover:scale-110 transition-transform">
                <TrendingUp className="w-8 h-8 md:w-10 md:h-10 text-blue-600" />
              </div>
              <h3 className="text-lg md:text-xl font-bold mb-2 md:mb-3">Digital Marketing</h3>
              <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                Social media, ads, email campaigns, and SEO that actually convert and grow your audience.
              </p>
              <div className="text-xs text-green-600 font-semibold mb-2">🔥 850+ Campaigns Launched</div>
              <Link href="/contact">
                <Button size="sm" className="w-full bg-blue-600 hover:bg-blue-700 text-white text-xs">
                  Get Started →
                </Button>
              </Link>
            </Card>
            
            <Card className="p-6 md:p-8 bg-white hover-lift shadow-lg hover:shadow-2xl transition-all duration-300 border-t-4 border-t-purple-500 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-purple-500/10 to-transparent rounded-full -translate-y-10 translate-x-10 group-hover:scale-110 transition-transform"></div>
              <div className="w-16 h-16 md:w-20 md:h-20 rounded-2xl bg-gradient-to-br from-purple-50 to-purple-100 flex items-center justify-center mb-4 md:mb-6 shadow-md group-hover:scale-110 transition-transform">
                <Pencil className="w-8 h-8 md:w-10 md:h-10 text-purple-600" />
              </div>
              <h3 className="text-lg md:text-xl font-bold mb-2 md:mb-3">Content Creation</h3>
              <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                Compelling copy, stunning graphics, and engaging videos that tell your story and sell.
              </p>
              <div className="text-xs text-green-600 font-semibold mb-2">⚡ 50K+ Content Pieces</div>
              <Link href="/contact">
                <Button size="sm" className="w-full bg-purple-600 hover:bg-purple-700 text-white text-xs">
                  Get Started →
                </Button>
              </Link>
            </Card>
            
            <Card className="p-6 md:p-8 bg-white hover-lift shadow-lg hover:shadow-2xl transition-all duration-300 border-t-4 border-t-emerald-500 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-emerald-500/10 to-transparent rounded-full -translate-y-10 translate-x-10 group-hover:scale-110 transition-transform"></div>
              <div className="w-16 h-16 md:w-20 md:h-20 rounded-2xl bg-gradient-to-br from-emerald-50 to-emerald-100 flex items-center justify-center mb-4 md:mb-6 shadow-md group-hover:scale-110 transition-transform">
                <Globe className="w-8 h-8 md:w-10 md:h-10 text-emerald-600" />
              </div>
              <h3 className="text-lg md:text-xl font-bold mb-2 md:mb-3">Web & App Development</h3>
              <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                Beautiful websites, mobile apps, and custom CRMs that convert visitors into customers.
              </p>
              <div className="text-xs text-green-600 font-semibold mb-2">🚀 200+ Apps Built</div>
              <Link href="/contact">
                <Button size="sm" className="w-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs">
                  Get Started →
                </Button>
              </Link>
            </Card>
            
            <Card className="p-6 md:p-8 bg-white hover-lift shadow-lg hover:shadow-2xl transition-all duration-300 border-t-4 border-t-orange-500 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-orange-500/10 to-transparent rounded-full -translate-y-10 translate-x-10 group-hover:scale-110 transition-transform"></div>
              <div className="w-16 h-16 md:w-20 md:h-20 rounded-2xl bg-gradient-to-br from-orange-50 to-orange-100 flex items-center justify-center mb-4 md:mb-6 shadow-md group-hover:scale-110 transition-transform">
                <Bot className="w-8 h-8 md:w-10 md:h-10 text-orange-600" />
              </div>
              <h3 className="text-lg md:text-xl font-bold mb-2 md:mb-3">AI Automation</h3>
              <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                Smart automation that saves time, cuts costs, and scales your marketing effortlessly.
              </p>
              <div className="text-xs text-green-600 font-semibold mb-2">🤖 95% Time Saved</div>
              <Link href="/contact">
                <Button size="sm" className="w-full bg-orange-600 hover:bg-orange-700 text-white text-xs">
                  Get Started →
                </Button>
              </Link>
            </Card>
          </div>
        </div>
      </section>

      {/* Marketing Channels */}
      <section className="py-16 px-4 bg-gradient-to-b from-white to-gray-50">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-12">
            <p className="text-sm font-semibold text-blue-600 uppercase tracking-wider mb-2">We're Everywhere You Need to Be</p>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Marketing Channels We Master
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              From social media to search engines, we dominate every platform where your audience lives.
            </p>
          </div>

          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-6 gap-4 sm:gap-6 md:gap-8 items-center justify-items-center">
            {/* Social Media */}
            <div className="text-center group">
              <div className="w-16 h-16 sm:w-18 sm:h-18 md:w-20 md:h-20 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mb-3 sm:mb-4 mx-auto shadow-lg group-hover:shadow-xl transition-all">
                <span className="text-white text-lg sm:text-xl md:text-2xl font-bold">FB</span>
              </div>
              <p className="text-xs sm:text-sm font-semibold text-gray-700">Facebook</p>
            </div>

            <div className="text-center group">
              <div className="w-16 h-16 sm:w-18 sm:h-18 md:w-20 md:h-20 bg-gradient-to-br from-pink-500 to-pink-600 rounded-2xl flex items-center justify-center mb-3 sm:mb-4 mx-auto shadow-lg group-hover:shadow-xl transition-all">
                <span className="text-white text-lg sm:text-xl md:text-2xl font-bold">IG</span>
              </div>
              <p className="text-xs sm:text-sm font-semibold text-gray-700">Instagram</p>
            </div>

            <div className="text-center group">
              <div className="w-16 h-16 sm:w-18 sm:h-18 md:w-20 md:h-20 bg-gradient-to-br from-blue-400 to-blue-500 rounded-2xl flex items-center justify-center mb-3 sm:mb-4 mx-auto shadow-lg group-hover:shadow-xl transition-all">
                <span className="text-white text-lg sm:text-xl md:text-2xl font-bold">TW</span>
              </div>
              <p className="text-xs sm:text-sm font-semibold text-gray-700">Twitter/X</p>
            </div>

            <div className="text-center group">
              <div className="w-16 h-16 sm:w-18 sm:h-18 md:w-20 md:h-20 bg-gradient-to-br from-red-500 to-red-600 rounded-2xl flex items-center justify-center mb-3 sm:mb-4 mx-auto shadow-lg group-hover:shadow-xl transition-all">
                <span className="text-white text-lg sm:text-xl md:text-2xl font-bold">YT</span>
              </div>
              <p className="text-xs sm:text-sm font-semibold text-gray-700">YouTube</p>
            </div>

            <div className="text-center group">
              <div className="w-16 h-16 sm:w-18 sm:h-18 md:w-20 md:h-20 bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl flex items-center justify-center mb-3 sm:mb-4 mx-auto shadow-lg group-hover:shadow-xl transition-all">
                <span className="text-white text-lg sm:text-xl md:text-2xl font-bold">LI</span>
              </div>
              <p className="text-xs sm:text-sm font-semibold text-gray-700">LinkedIn</p>
            </div>

            <div className="text-center group">
              <div className="w-16 h-16 sm:w-18 sm:h-18 md:w-20 md:h-20 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center mb-3 sm:mb-4 mx-auto shadow-lg group-hover:shadow-xl transition-all">
                <span className="text-white text-lg sm:text-xl md:text-2xl font-bold">TT</span>
              </div>
              <p className="text-xs sm:text-sm font-semibold text-gray-700">TikTok</p>
            </div>

            {/* Search & Ads */}
            <div className="text-center group">
              <div className="w-16 h-16 sm:w-18 sm:h-18 md:w-20 md:h-20 bg-gradient-to-br from-blue-500 to-green-500 rounded-2xl flex items-center justify-center mb-3 sm:mb-4 mx-auto shadow-lg group-hover:shadow-xl transition-all">
                <span className="text-white text-lg sm:text-xl md:text-2xl font-bold">GO</span>
              </div>
              <p className="text-xs sm:text-sm font-semibold text-gray-700">Google Ads</p>
            </div>

            <div className="text-center group">
              <div className="w-16 h-16 sm:w-18 sm:h-18 md:w-20 md:h-20 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl flex items-center justify-center mb-3 sm:mb-4 mx-auto shadow-lg group-hover:shadow-xl transition-all">
                <span className="text-white text-lg sm:text-xl md:text-2xl font-bold">SEO</span>
              </div>
              <p className="text-xs sm:text-sm font-semibold text-gray-700">SEO</p>
            </div>

            <div className="text-center group">
              <div className="w-16 h-16 sm:w-18 sm:h-18 md:w-20 md:h-20 bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl flex items-center justify-center mb-3 sm:mb-4 mx-auto shadow-lg group-hover:shadow-xl transition-all">
                <span className="text-white text-lg sm:text-xl md:text-2xl font-bold">EM</span>
              </div>
              <p className="text-xs sm:text-sm font-semibold text-gray-700">Email</p>
            </div>

            <div className="text-center group">
              <div className="w-16 h-16 sm:w-18 sm:h-18 md:w-20 md:h-20 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-2xl flex items-center justify-center mb-3 sm:mb-4 mx-auto shadow-lg group-hover:shadow-xl transition-all">
                <span className="text-white text-lg sm:text-xl md:text-2xl font-bold">GA</span>
              </div>
              <p className="text-xs sm:text-sm font-semibold text-gray-700">Analytics</p>
            </div>

            <div className="text-center group">
              <div className="w-16 h-16 sm:w-18 sm:h-18 md:w-20 md:h-20 bg-gradient-to-br from-teal-500 to-teal-600 rounded-2xl flex items-center justify-center mb-3 sm:mb-4 mx-auto shadow-lg group-hover:shadow-xl transition-all">
                <span className="text-white text-lg sm:text-xl md:text-2xl font-bold">CR</span>
              </div>
              <p className="text-xs sm:text-sm font-semibold text-gray-700">Conversion</p>
            </div>

            <div className="text-center group">
              <div className="w-16 h-16 sm:w-18 sm:h-18 md:w-20 md:h-20 bg-gradient-to-br from-rose-500 to-rose-600 rounded-2xl flex items-center justify-center mb-3 sm:mb-4 mx-auto shadow-lg group-hover:shadow-xl transition-all">
                <span className="text-white text-lg sm:text-xl md:text-2xl font-bold">+</span>
              </div>
              <p className="text-xs sm:text-sm font-semibold text-gray-700">More</p>
            </div>
          </div>

          <div className="mt-8 text-center">
            <p className="text-sm text-muted-foreground">
              Don't see your preferred channel? <span className="text-blue-600 font-semibold">We can work on any platform!</span>
            </p>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 px-4 bg-gradient-to-b from-gray-50 to-white">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <p className="text-sm font-semibold text-blue-600 uppercase tracking-wider mb-2">How It Works</p>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              From Idea to Impact in 3 Simple Steps
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              No fluff, no complicated process. Just results-driven marketing that works.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-12 max-w-4xl mx-auto">
            <div className="text-center">
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white text-4xl font-bold mx-auto mb-6 shadow-xl">
                1
              </div>
              <h3 className="text-2xl font-bold mb-3">Tell Us Your Goals</h3>
              <p className="text-muted-foreground text-base">
                Book a quick call or fill out our form. We'll understand what you need and create a custom plan.
              </p>
            </div>

            <div className="text-center">
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center text-white text-4xl font-bold mx-auto mb-6 shadow-xl">
                2
              </div>
              <h3 className="text-2xl font-bold mb-3">We Execute</h3>
              <p className="text-muted-foreground text-base">
                Our team gets to work immediately. Campaigns launch fast, content goes live, results start rolling in.
              </p>
            </div>

            <div className="text-center">
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center text-white text-4xl font-bold mx-auto mb-6 shadow-xl">
                3
              </div>
              <h3 className="text-2xl font-bold mb-3">You Grow</h3>
              <p className="text-muted-foreground text-base">
                Track results in real-time, watch your audience grow, and scale what works.
              </p>
            </div>
          </div>

          <div className="mt-16 text-center">
            <Link href="/signup">
              <Button size="lg" className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-lg px-10 py-6 shadow-xl">
                Get Started Now
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
            <p className="text-sm text-muted-foreground mt-4">No credit card required • 14-day free trial</p>
          </div>
        </div>
      </section>

      {/* Service Packages Section */}
      <section className="py-20 px-4 bg-gradient-to-b from-gray-50 to-white">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-12">
            <p className="text-sm font-semibold text-blue-600 uppercase tracking-wider mb-2">Service Packages</p>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Marketing Packages for Every Need
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Whether you're launching a product, building your brand, or growing your audience - we have a package for you.
            </p>
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg inline-block">
              <p className="text-sm text-red-600 font-semibold">
                🔥 LIMITED TIME: 20% OFF All Packages This Month Only
              </p>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {/* Essential Package */}
            <Card className="p-8 hover-lift transition-all duration-300 border-2 border-gray-200">
              <div className="mb-6">
                <h3 className="text-2xl font-bold mb-2">Essential</h3>
                <p className="text-muted-foreground text-sm">Perfect for getting started</p>
              </div>
              <div className="mb-6">
                <span className="text-4xl font-bold">$1,995</span>
                <span className="text-muted-foreground">/month</span>
              </div>
              <ul className="space-y-3 mb-8">
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  <span>1 marketing channel</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  <span>20 hours per month</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  <span>Monthly reporting</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  <span>Email & chat support</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  <span>Basic analytics dashboard</span>
                </li>
              </ul>
              <Link href="/contact">
                <Button className="w-full" variant="outline">Get Started</Button>
              </Link>
            </Card>

            {/* Growth Package - Most Popular */}
            <Card className="p-8 border-2 border-blue-500 relative hover-lift transition-all duration-300 shadow-xl">
              <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                <Badge className="bg-blue-600 text-white">Most Popular</Badge>
              </div>
              <div className="mb-6">
                <h3 className="text-2xl font-bold mb-2">Growth</h3>
                <p className="text-muted-foreground text-sm">For serious growth</p>
              </div>
              <div className="mb-6">
                <span className="text-4xl font-bold">$4,995</span>
                <span className="text-muted-foreground">/month</span>
              </div>
              <ul className="space-y-3 mb-8">
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  <span>Multi-channel campaigns</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  <span>60 hours per month</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  <span>Dedicated account manager</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  <span>Weekly strategy calls</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  <span>Advanced analytics & reporting</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  <span>Priority support</span>
                </li>
              </ul>
              <Link href="/contact">
                <Button className="w-full bg-blue-600 hover:bg-blue-700">Get Started</Button>
              </Link>
            </Card>

            {/* Enterprise Package */}
            <Card className="p-8 hover-lift transition-all duration-300 border-2 border-purple-200 bg-gradient-to-br from-white to-purple-50/30">
              <div className="mb-6">
                <h3 className="text-2xl font-bold mb-2">Enterprise</h3>
                <p className="text-muted-foreground text-sm">Complete marketing solution</p>
              </div>
              <div className="mb-6">
                <span className="text-4xl font-bold">Custom</span>
              </div>
              <ul className="space-y-3 mb-8">
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  <span>Unlimited marketing channels</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  <span>Unlimited hours</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  <span>Dedicated team of specialists</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  <span>Custom strategy & execution</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  <span>White-label reporting</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  <span>24/7 support</span>
                </li>
              </ul>
              <Link href="/contact">
                <Button className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white">Contact Sales</Button>
              </Link>
            </Card>
          </div>

          <div className="mt-12 text-center">
            <p className="text-sm text-muted-foreground mb-4">
              All packages include: Strategy development, campaign execution, performance tracking, and monthly reporting
            </p>
            <p className="text-sm text-muted-foreground">
              Need something custom? <Link href="/contact" className="text-blue-600 hover:underline font-semibold">Let's talk</Link>
            </p>
          </div>
        </div>
      </section>

      {/* Client Success Stories */}
      <section className="py-20 px-4 bg-gradient-to-b from-white to-gray-50">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-12">
            <p className="text-sm font-semibold text-blue-600 uppercase tracking-wider mb-2">Client Success</p>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Real Results. Real People.
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              See how we've helped businesses, influencers, and entrepreneurs grow.
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
                "Wolfpaq took my Instagram from 5K to 50K followers in 6 months. Their content strategy and ad campaigns were game-changers. My music career has never been better!"
              </p>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold">
                  MJ
                </div>
                <div>
                  <p className="font-semibold">Marcus Johnson</p>
                  <p className="text-sm text-muted-foreground">Independent Musician</p>
                </div>
              </div>
            </Card>

            <Card className="p-8 hover-lift border-2 border-blue-500 shadow-xl">
              <div className="flex gap-1 mb-4">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                ))}
              </div>
              <p className="text-muted-foreground mb-6 italic">
                "Our e-commerce sales tripled after Wolfpaq revamped our website and ran our ad campaigns. The ROI has been insane. Best marketing investment we've ever made!"
              </p>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center text-white font-bold">
                  TC
                </div>
                <div>
                  <p className="font-semibold">Tanya Chen</p>
                  <p className="text-sm text-muted-foreground">E-commerce Business Owner</p>
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
                "As a fitness coach, I needed help building my personal brand. Wolfpaq handled everything - content, ads, website. Now I'm booked out 3 months in advance!"
              </p>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center text-white font-bold">
                  DR
                </div>
                <div>
                  <p className="font-semibold">David Rodriguez</p>
                  <p className="text-sm text-muted-foreground">Fitness Coach & Influencer</p>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* Results Section */}
      <section className="py-20 px-4 bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700 text-white">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-6">The Numbers Don't Lie</h2>
            <p className="text-xl text-blue-100 max-w-2xl mx-auto">
              We're obsessed with results. Here's what we've delivered for our clients.
            </p>
          </div>

          <div className="grid md:grid-cols-4 gap-8 mb-12">
            <div className="text-center">
              <div className="text-5xl md:text-6xl font-bold mb-3 bg-gradient-to-r from-white to-blue-100 bg-clip-text text-transparent">850+</div>
              <p className="text-blue-100 text-lg">Successful Campaigns</p>
            </div>
            <div className="text-center">
              <div className="text-5xl md:text-6xl font-bold mb-3 bg-gradient-to-r from-white to-blue-100 bg-clip-text text-transparent">4.2M+</div>
              <p className="text-blue-100 text-lg">Leads Generated</p>
            </div>
            <div className="text-center">
              <div className="text-5xl md:text-6xl font-bold mb-3 bg-gradient-to-r from-white to-blue-100 bg-clip-text text-transparent">310%</div>
              <p className="text-blue-100 text-lg">Avg ROI Increase</p>
            </div>
            <div className="text-center">
              <div className="text-5xl md:text-6xl font-bold mb-3 bg-gradient-to-r from-white to-blue-100 bg-clip-text text-transparent">98%</div>
              <p className="text-blue-100 text-lg">Client Satisfaction</p>
            </div>
          </div>
        </div>
      </section>

      {/* Risk Reversal Section */}
      <section className="py-16 px-4 bg-gradient-to-br from-green-50 to-blue-50">
        <div className="container mx-auto max-w-4xl text-center">
          <div className="bg-white p-12 rounded-2xl shadow-2xl border-2 border-green-200">
            <div className="text-6xl mb-6">🛡️</div>
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-gray-900">
              Your Success is Our Guarantee
            </h2>
            <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
              We're so confident in our results that we guarantee them. If you don't see measurable improvements within 30 days, we'll refund every penny.
            </p>
            <div className="grid md:grid-cols-3 gap-6 text-left">
              <div className="flex items-start gap-3">
                <CheckCircle className="w-6 h-6 text-green-500 mt-1" />
                <div>
                  <h3 className="font-semibold text-gray-900">30-Day Money Back</h3>
                  <p className="text-sm text-gray-600">Full refund if not satisfied</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle className="w-6 h-6 text-green-500 mt-1" />
                <div>
                  <h3 className="font-semibold text-gray-900">Results Guarantee</h3>
                  <p className="text-sm text-gray-600">Or we work for free</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle className="w-6 h-6 text-green-500 mt-1" />
                <div>
                  <h3 className="font-semibold text-gray-900">No Long-Term Contracts</h3>
                  <p className="text-sm text-gray-600">Cancel anytime</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 px-4 bg-gradient-to-b from-white to-gray-50">
        <div className="container mx-auto max-w-4xl">
          <div className="text-center mb-12">
            <p className="text-sm font-semibold text-blue-600 uppercase tracking-wider mb-2">FAQ</p>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Got Questions? We've Got Answers.
            </h2>
            <p className="text-muted-foreground">
              Everything you need to know about working with us
            </p>
          </div>

          <div className="space-y-4">
            <Card className="p-6 hover-lift">
              <h3 className="font-bold text-lg mb-2">What kind of businesses do you work with?</h3>
              <p className="text-muted-foreground">
                All kinds! We work with e-commerce stores, service businesses, influencers, musicians, coaches, startups - anyone who needs marketing. If you need to grow online, we can help.
              </p>
            </Card>

            <Card className="p-6 hover-lift">
              <h3 className="font-bold text-lg mb-2">How fast can you get started?</h3>
              <p className="text-muted-foreground">
                Most campaigns launch within 7-10 days of our kickoff call. Need it faster? Let us know - we can move quicker for urgent projects.
              </p>
            </Card>

            <Card className="p-6 hover-lift">
              <h3 className="font-bold text-lg mb-2">What's included in a package?</h3>
              <p className="text-muted-foreground">
                It depends on your needs! Every package includes strategy, execution, monthly reporting, and dedicated support. We customize based on what will actually move the needle for you.
              </p>
            </Card>

            <Card className="p-6 hover-lift">
              <h3 className="font-bold text-lg mb-2">Do I need a long-term contract?</h3>
              <p className="text-muted-foreground">
                Nope! We offer month-to-month services. We earn your business every single month by delivering results. No lock-ins, no BS.
              </p>
            </Card>

            <Card className="p-6 hover-lift">
              <h3 className="font-bold text-lg mb-2">How do I track results?</h3>
              <p className="text-muted-foreground">
                You'll get access to a real-time dashboard showing all your campaign metrics, plus monthly reports. We believe in full transparency - you'll always know exactly what's working.
              </p>
            </Card>

            <Card className="p-6 hover-lift">
              <h3 className="font-bold text-lg mb-2">What if I'm not happy with the results?</h3>
              <p className="text-muted-foreground">
                We stand behind our work. If something's not working, we pivot fast. And since there are no contracts, you're never stuck. But honestly? Our 98% client retention rate speaks for itself.
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
      <section className="py-24 px-4 bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(255,255,255,0.1),transparent_50%)]"></div>
        <div className="container mx-auto max-w-4xl text-center relative z-10">
          <h2 className="text-4xl md:text-6xl font-bold mb-6">
            Let's Grow Together 🚀
          </h2>
          <p className="text-xl md:text-2xl text-blue-100 mb-10 max-w-2xl mx-auto font-medium">
            Stop wasting money on marketing that doesn't work. Let's build something that actually drives results.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-8">
            <Link href="/signup">
              <Button size="lg" className="bg-white text-blue-700 hover:bg-gray-100 text-xl px-12 py-7 shadow-2xl font-bold">
                Get Started Free
                <ArrowRight className="w-6 h-6 ml-2" />
              </Button>
            </Link>
            <Link href="/contact">
              <Button size="lg" variant="outline" className="border-2 border-white text-white hover:bg-white/10 text-xl px-12 py-7 font-bold">
                Book a Call
              </Button>
            </Link>
          </div>
          <p className="text-base text-blue-100 flex flex-wrap justify-center gap-6">
            <span>✓ No long-term contracts</span>
            <span>✓ 14-day free trial</span>
            <span>✓ Cancel anytime</span>
          </p>
        </div>
      </section>

      {/* Sticky CTA */}
      <div className="fixed bottom-6 right-6 z-50 hidden md:block">
        <div className="bg-gradient-to-r from-orange-500 to-red-500 text-white px-6 py-4 rounded-full shadow-2xl animate-bounce">
          <Link href="/signup">
            <Button size="sm" className="bg-transparent hover:bg-white/20 text-white font-bold border-0 gap-2">
              🚀 Get Started Now
              <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </div>
      </div>

      {/* Mobile CTA Bar */}
      <div className="fixed bottom-0 left-0 right-0 z-50 md:hidden">
        <div className="bg-gradient-to-r from-orange-500 to-red-500 text-white p-4 shadow-2xl">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold">🚀 Limited Spots Available</p>
              <p className="text-xs opacity-90">Only 3 spots left this month</p>
            </div>
            <Link href="/signup">
              <Button size="sm" className="bg-white text-orange-600 hover:bg-gray-100 font-bold border-0">
                Get Started
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Live Chat Indicator */}
      <div className="fixed bottom-6 left-6 z-50 hidden md:block">
        <div className="bg-green-500 text-white px-4 py-3 rounded-full shadow-xl flex items-center gap-2 animate-pulse">
          <div className="w-3 h-3 bg-white rounded-full animate-ping"></div>
          <span className="text-sm font-semibold">Live Support</span>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t py-12 px-4 bg-background pb-20 md:pb-12">
        <div className="container mx-auto max-w-6xl">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <img src={mtaLogoBlue} alt="Wolfpaq Marketing" className="h-12 w-auto mb-4" />
              <p className="text-sm text-muted-foreground">
                Your go-to remote marketing team. We help businesses, influencers, and entrepreneurs grow with results-driven digital marketing.
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

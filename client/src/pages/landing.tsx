import { useState } from "react";
import { Link } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import type { SubscriptionPackage } from "@shared/schema";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu";
import { ArrowRight, CheckCircle, Star, TrendingUp, Globe, Smartphone, Palette, Brain, CreditCard, Lightbulb, Users, Target, Zap, ChevronDown, Pencil, FileText, Sparkles, Bot } from "lucide-react";
import { HeaderLogo, FooterLogo } from "@/components/Logo";
import { useDocumentMeta } from "@/hooks/useDocumentMeta";
import heroImage from "@assets/hero-header-image.png";
import resultsImage from "@assets/stock_images/woman_working_on_lap_e8e31683.jpg";
import instagramLogo from "@assets/instagram-logo.png";
import tiktokLogo from "@assets/tiktok-logo.png";
import linkedinLogo from "@assets/linkedin-logo.png";
import googleAdsLogo from "@assets/google-ads-logo.png";

export default function LandingPage() {
  useDocumentMeta(
    "Marketing Team App | Your Remote Digital Marketing Team",
    "Stop wasting money on marketing that doesn't work. Marketing Team App is your remote digital marketing team for strategy, content, campaigns and growth."
  );
  const { toast } = useToast();
  const [auditForm, setAuditForm] = useState({
    website: "",
    instagramUrl: "",
    tiktokUrl: "",
    facebookUrl: ""
  });
  const [auditResults, setAuditResults] = useState<any>(null);
  const [showResults, setShowResults] = useState(false);

  const { data: packages = [], isLoading: packagesLoading } = useQuery<SubscriptionPackage[]>({
    queryKey: ["/api/subscription-packages"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/subscription-packages");
      return response.json();
    },
    retry: false,
    meta: { returnNull: true },
  });

  const auditMutation = useMutation({
    mutationFn: async (data: typeof auditForm) => {
      const response = await apiRequest("POST", "/api/social-audit", data);
      return response.json();
    },
    onSuccess: (result) => {
      setAuditResults(result);
      setShowResults(true);
      toast({
        title: "🎉 Audit Complete!",
        description: "Your social media audit results are ready.",
      });
    },
    onError: (error) => {
      toast({
        title: "❌ Audit Failed",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleAuditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!auditForm.website) {
      toast({
        title: "⚠️ Website Required",
        description: "Please enter your website URL to start the audit.",
        variant: "destructive",
      });
      return;
    }
    auditMutation.mutate(auditForm);
  };

  const formatCurrency = (cents: number) => `$${(cents / 100).toLocaleString()}`;

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      {/* Header */}
      <header className="border-b sticky top-0 z-50 bg-white/95 backdrop-blur shadow-sm">
        <div className="container mx-auto px-4 py-3 md:py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <HeaderLogo />
          </div>
          
          <nav className="hidden md:flex items-center gap-8">
            <Link href="/" className="text-base font-medium text-foreground hover:text-primary transition-colors" data-testid="nav-home">
              Home
            </Link>
            
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
            
            <Link href="/blog" className="text-base font-medium text-foreground hover:text-primary transition-colors" data-testid="nav-blog">
              Blog
            </Link>
            <a href="#about" className="text-base font-medium text-foreground hover:text-primary transition-colors" data-testid="nav-about">
              About Us
            </a>
            <Link href="/contact" className="text-base font-medium text-foreground hover:text-primary transition-colors" data-testid="nav-contact">
              Contact Us
            </Link>
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
      <section className="relative py-16 md:py-24 lg:py-32 px-4 overflow-hidden gradient-animate-hero hero-glow flex items-center min-h-[80vh] md:min-h-[85vh]">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(59,130,246,0.3),transparent_50%)]"></div>
        <div className="absolute top-0 left-0 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl"></div>
        <div className="container mx-auto relative z-10">
          <div className="grid lg:grid-cols-2 gap-8 md:gap-12 items-center">
            <div className="text-white space-y-4 md:space-y-6 slide-in-left text-center lg:text-left max-w-full">
              <Badge className="bg-orange-500 hover:bg-orange-600 text-white border-0 shadow-lg shadow-orange-500/50 text-xs md:text-sm px-3 md:px-4 py-1.5 md:py-2 inline-block mx-auto lg:mx-0">
                <span className="animate-pulse">🔥 </span>
                <span className="hidden sm:inline">Limited Spots Available - Book This Month</span>
                <span className="sm:hidden">Only 3 Spots Left!</span>
              </Badge>
              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold leading-tight text-shadow-soft px-2">
                Your Remote <br className="hidden sm:block" />
                Digital Marketing <br className="hidden sm:block" />
                <span className="bg-gradient-to-r from-green-400 to-emerald-500 bg-clip-text text-transparent">Team</span>
              </h1>
              <p className="text-lg sm:text-xl md:text-2xl font-semibold text-white mb-2 px-2 sm:px-4">
                Stop Wasting Money on Marketing That Doesn't Work
              </p>
              <p className="text-sm sm:text-base md:text-lg lg:text-xl text-blue-50 leading-relaxed max-w-xl mx-auto lg:mx-0 px-2 sm:px-6 lg:px-0">
                Join 500+ businesses, influencers, and entrepreneurs who've 3X'd their results with our proven marketing system. 
                <span className="font-semibold text-white block mt-1">Guaranteed results or your money back.</span>
              </p>
              <div className="flex flex-col sm:flex-row gap-3 md:gap-4 pt-2 md:pt-4 justify-center lg:justify-start items-stretch sm:items-center w-full px-2 sm:px-4 lg:px-0">
                <Link href="/signup" className="w-full sm:w-auto">
                  <Button size="lg" className="gap-2 w-full sm:w-auto bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white border-0 shadow-xl hover:shadow-2xl transition-all px-6 sm:px-8 md:px-10 py-6 md:py-7 font-bold text-base md:text-lg animate-pulse" data-testid="button-get-started-hero">
                    <span className="hidden sm:inline">🚀 Get Started Free (Only 3 Spots Left)</span>
                    <span className="sm:hidden">🚀 Get Started Free</span>
                    <ArrowRight className="w-4 h-4 md:w-5 md:h-5" />
                  </Button>
                </Link>
                <Link href="/contact" className="w-full sm:w-auto">
                  <Button 
                    size="lg" 
                    variant="outline" 
                    className="w-full sm:w-auto glass-effect border-white/30 text-white hover:bg-white/20 hover:border-white/40 shadow-lg px-6 md:px-8 py-6 md:py-7 font-semibold text-base md:text-lg" 
                    data-testid="button-login-hero"
                  >
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
              <div className="w-16 h-16 sm:w-18 sm:h-18 md:w-20 md:h-20 bg-white rounded-2xl flex items-center justify-center mb-3 sm:mb-4 mx-auto shadow-lg group-hover:shadow-xl transition-all border border-gray-100">
                <img src={tiktokLogo} alt="TikTok" className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 object-contain" />
              </div>
              <p className="text-xs sm:text-sm font-semibold text-gray-700">TikTok</p>
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
              <div className="w-16 h-16 sm:w-18 sm:h-18 md:w-20 md:h-20 bg-white rounded-2xl flex items-center justify-center mb-3 sm:mb-4 mx-auto shadow-lg group-hover:shadow-xl transition-all border border-gray-100">
                <img src={linkedinLogo} alt="LinkedIn" className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 object-contain" />
              </div>
              <p className="text-xs sm:text-sm font-semibold text-gray-700">LinkedIn</p>
            </div>

            <div className="text-center group">
              <div className="w-16 h-16 sm:w-18 sm:h-18 md:w-20 md:h-20 bg-white rounded-2xl flex items-center justify-center mb-3 sm:mb-4 mx-auto shadow-lg group-hover:shadow-xl transition-all border border-gray-100">
                <img src={instagramLogo} alt="Instagram" className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 object-contain" />
              </div>
              <p className="text-xs sm:text-sm font-semibold text-gray-700">Instagram</p>
            </div>

            {/* Search & Ads */}
            <div className="text-center group">
              <div className="w-16 h-16 sm:w-18 sm:h-18 md:w-20 md:h-20 bg-white rounded-2xl flex items-center justify-center mb-3 sm:mb-4 mx-auto shadow-lg group-hover:shadow-xl transition-all border border-gray-100">
                <img src={googleAdsLogo} alt="Google Ads" className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 object-contain" />
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

      {/* Free Social Media Audit Section */}
      <section className="py-20 px-4 bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="absolute top-0 left-0 w-full h-full">
          <div className="absolute top-10 left-10 w-32 h-32 bg-white/10 rounded-full blur-xl"></div>
          <div className="absolute bottom-10 right-10 w-48 h-48 bg-white/5 rounded-full blur-2xl"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-r from-pink-500/20 to-yellow-500/20 rounded-full blur-3xl"></div>
        </div>
        
        <div className="container mx-auto max-w-4xl relative z-10">
          <div className="text-center mb-12">
            <Badge className="bg-white/20 text-white border-white/30 mb-4">
              🎯 Free Analysis
            </Badge>
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              Get Your FREE Social Media Audit
            </h2>
            <p className="text-xl text-blue-100 max-w-2xl mx-auto mb-8">
              Discover what's holding your social media back. Get a detailed analysis of your online presence in under 60 seconds.
            </p>
          </div>

          {!showResults ? (
            <Card className="bg-white/10 backdrop-blur border-white/20 shadow-2xl">
              <CardHeader>
                <CardTitle className="text-white text-center text-2xl">
                  Enter Your Details for Instant Analysis
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleAuditSubmit} className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-white font-medium mb-2">
                        Website URL *
                      </label>
                      <Input
                        type="url"
                        placeholder="https://yourwebsite.com"
                        value={auditForm.website}
                        onChange={(e) => setAuditForm({...auditForm, website: e.target.value})}
                        className="bg-white/20 border-white/30 text-white placeholder:text-white/60"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-white font-medium mb-2">
                        Instagram URL
                      </label>
                      <Input
                        type="url"
                        placeholder="https://instagram.com/yourusername"
                        value={auditForm.instagramUrl}
                        onChange={(e) => setAuditForm({...auditForm, instagramUrl: e.target.value})}
                        className="bg-white/20 border-white/30 text-white placeholder:text-white/60"
                      />
                    </div>
                    <div>
                      <label className="block text-white font-medium mb-2">
                        TikTok URL
                      </label>
                      <Input
                        type="url"
                        placeholder="https://tiktok.com/@yourusername"
                        value={auditForm.tiktokUrl}
                        onChange={(e) => setAuditForm({...auditForm, tiktokUrl: e.target.value})}
                        className="bg-white/20 border-white/30 text-white placeholder:text-white/60"
                      />
                    </div>
                    <div>
                      <label className="block text-white font-medium mb-2">
                        Facebook URL
                      </label>
                      <Input
                        type="url"
                        placeholder="https://facebook.com/yourpage"
                        value={auditForm.facebookUrl}
                        onChange={(e) => setAuditForm({...auditForm, facebookUrl: e.target.value})}
                        className="bg-white/20 border-white/30 text-white placeholder:text-white/60"
                      />
                    </div>
                  </div>
                  
                  <div className="text-center">
                    <Button 
                      type="submit" 
                      size="lg"
                      disabled={auditMutation.isPending}
                      className="bg-white text-blue-600 hover:bg-gray-100 font-bold text-lg px-12 py-4 shadow-xl"
                    >
                      {auditMutation.isPending ? (
                        <>
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600 mr-2"></div>
                          Analyzing...
                        </>
                      ) : (
                        <>
                          🚀 Get My FREE Audit Now
                        </>
                      )}
                    </Button>
                    <p className="text-blue-100 text-sm mt-4">
                      ✅ No signup required • ✅ Instant results • ✅ 100% Free
                    </p>
                  </div>
                </form>
              </CardContent>
            </Card>
          ) : (
            <Card className="bg-white/10 backdrop-blur border-white/20 shadow-2xl">
              <CardHeader>
                <CardTitle className="text-white text-center text-2xl">
                  🎉 Your Social Media Audit Results
                </CardTitle>
              </CardHeader>
              <CardContent className="text-white">
                {auditResults && (
                  <div className="space-y-6">
                    <div className="grid md:grid-cols-3 gap-6">
                      <div className="text-center">
                        <div className="text-3xl font-bold text-yellow-300">
                          {auditResults.summary?.totalIssues || 0}
                        </div>
                        <div className="text-blue-100">Issues Found</div>
                      </div>
                      <div className="text-center">
                        <div className="text-3xl font-bold text-green-300">
                          {auditResults.summary?.score || 0}/100
                        </div>
                        <div className="text-blue-100">Overall Score</div>
                      </div>
                      <div className="text-center">
                        <div className="text-3xl font-bold text-blue-300">
                          {auditResults.summary?.opportunities || 0}
                        </div>
                        <div className="text-blue-100">Opportunities</div>
                      </div>
                    </div>
                    
                    <div className="text-center">
                      <Button 
                        onClick={() => setShowResults(false)}
                        variant="outline"
                        className="border-white/30 text-white hover:bg-white/20 mr-4"
                      >
                        ← Run Another Audit
                      </Button>
                      <Link href="/signup">
                        <Button className="bg-white text-blue-600 hover:bg-gray-100 font-bold">
                          🎯 Get Professional Help →
                        </Button>
                      </Link>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
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

          {packagesLoading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-muted-foreground">Loading packages...</p>
            </div>
          ) : packages.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No packages available at this time.</p>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
              {packages.map((pkg) => (
                <Card
                  key={pkg.id}
                  className={`p-8 hover-lift transition-all duration-300 ${
                    pkg.isFeatured
                      ? "border-2 border-blue-500 relative shadow-xl"
                      : "border-2 border-gray-200"
                  }`}
                >
                  {pkg.isFeatured && (
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                      <Badge className="bg-blue-600 text-white">Most Popular</Badge>
                    </div>
                  )}
                  <div className="mb-6">
                    <h3 className="text-2xl font-bold mb-2">{pkg.name}</h3>
                    {pkg.description && (
                      <p className="text-muted-foreground text-sm">{pkg.description}</p>
                    )}
                  </div>
                  <div className="mb-6">
                    <span className="text-4xl font-bold">{formatCurrency(pkg.price)}</span>
                    <span className="text-muted-foreground">/{pkg.billingPeriod}</span>
                  </div>
                  <ul className="space-y-3 mb-8">
                    {(pkg.features as string[]).map((feature, idx) => (
                      <li key={idx} className="flex items-center gap-2">
                        <CheckCircle className="w-5 h-5 text-green-500" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <Link href={pkg.buttonLink || "/contact"}>
                    <Button
                      className={`w-full ${
                        pkg.isFeatured
                          ? "bg-blue-600 hover:bg-blue-700"
                          : ""
                      }`}
                      variant={pkg.isFeatured ? "default" : "outline"}
                    >
                      {pkg.buttonText || "Get Started"}
                    </Button>
                  </Link>
                </Card>
              ))}
            </div>
          )}

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

      {/* Second Me AI Pricing */}
      <section className="py-20 px-4 bg-gradient-to-br from-purple-50 via-blue-50 to-pink-50 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_30%,rgba(139,92,246,0.1),transparent_50%)]"></div>
        <div className="container mx-auto max-w-6xl relative z-10">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white px-4 py-2 rounded-full mb-4">
              <Bot className="w-5 h-5" />
              <span className="font-semibold">NEW: AI-Powered</span>
            </div>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4 bg-gradient-to-r from-purple-600 via-blue-600 to-pink-600 bg-clip-text text-transparent">
              Second Me: Your AI Marketing Assistant
            </h2>
            <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto">
              Clone your expertise and let AI handle the repetitive work. Available 24/7 to answer questions, create content, and engage with your audience. Includes a digital visual version of you with AI-generated pictures, videos, and multimedia content.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto mb-12">
            {/* Second Me Starter */}
            <Card className="p-6 md:p-8 hover-lift transition-all duration-300 border-2 border-purple-200 bg-white/80 backdrop-blur">
              <div className="mb-6">
                <div className="flex items-center gap-2 mb-3">
                  <Brain className="w-6 h-6 text-purple-600" />
                  <h3 className="text-2xl font-bold">Second Me Starter</h3>
                </div>
                <p className="text-muted-foreground">Perfect for solopreneurs and small teams</p>
              </div>
              <div className="mb-6">
                <span className="text-4xl md:text-5xl font-bold">$297</span>
                <span className="text-muted-foreground">/month</span>
              </div>
              <ul className="space-y-3 mb-8">
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 shrink-0" />
                  <span className="text-sm md:text-base">1 AI personality trained on your brand</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 shrink-0" />
                  <span className="text-sm md:text-base">Up to 500 conversations/month</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 shrink-0" />
                  <span className="text-sm md:text-base">Website chat widget integration</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 shrink-0" />
                  <span className="text-sm md:text-base">Social media auto-responses</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 shrink-0" />
                  <span className="text-sm md:text-base">Basic analytics dashboard</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 shrink-0" />
                  <span className="text-sm md:text-base">Email support</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 shrink-0" />
                  <span className="text-sm md:text-base">AI-generated photos & videos of your digital twin</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 shrink-0" />
                  <span className="text-sm md:text-base">Weekly visual content delivery</span>
                </li>
              </ul>
              <Link href="/signup">
                <Button className="w-full bg-purple-600 hover:bg-purple-700" size="lg">
                  Start Free Trial
                </Button>
              </Link>
            </Card>

            {/* Second Me Pro */}
            <Card className="p-6 md:p-8 hover-lift transition-all duration-300 border-2 border-blue-500 bg-gradient-to-br from-blue-50 to-purple-50 relative shadow-xl">
              <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                <Badge className="bg-blue-600 text-white">Most Popular</Badge>
              </div>
              <div className="mb-6">
                <div className="flex items-center gap-2 mb-3">
                  <Sparkles className="w-6 h-6 text-blue-600" />
                  <h3 className="text-2xl font-bold">Second Me Pro</h3>
                </div>
                <p className="text-muted-foreground">For growing businesses and agencies</p>
              </div>
              <div className="mb-6">
                <span className="text-4xl md:text-5xl font-bold">$597</span>
                <span className="text-muted-foreground">/month</span>
              </div>
              <ul className="space-y-3 mb-8">
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 shrink-0" />
                  <span className="text-sm md:text-base">Up to 3 AI personalities</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 shrink-0" />
                  <span className="text-sm md:text-base">Unlimited conversations</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 shrink-0" />
                  <span className="text-sm md:text-base">All Starter features</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 shrink-0" />
                  <span className="text-sm md:text-base">Advanced AI training & customization</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 shrink-0" />
                  <span className="text-sm md:text-base">Multi-platform integration (Instagram, Facebook, WhatsApp)</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 shrink-0" />
                  <span className="text-sm md:text-base">Lead qualification & CRM integration</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 shrink-0" />
                  <span className="text-sm md:text-base">Priority support & dedicated account manager</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 shrink-0" />
                  <span className="text-sm md:text-base">Advanced AI-generated photos, videos & multimedia content</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 shrink-0" />
                  <span className="text-sm md:text-base">Custom visual content styles & branding</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 shrink-0" />
                  <span className="text-sm md:text-base">Daily visual content delivery</span>
                </li>
              </ul>
              <Link href="/signup">
                <Button className="w-full bg-blue-600 hover:bg-blue-700" size="lg">
                  Start Free Trial
                </Button>
              </Link>
            </Card>
          </div>

          <div className="text-center">
            <p className="text-sm md:text-base text-muted-foreground mb-4">
              🎁 <strong>Special Launch Offer:</strong> Get 2 months free when you pay annually
            </p>
            <p className="text-sm text-muted-foreground">
              Need enterprise features? <Link href="/contact" className="text-blue-600 hover:underline font-semibold">Contact us for custom pricing</Link>
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
              <Button 
                size="lg" 
                variant="outline" 
                className="border-2 border-white text-white hover:bg-white/10 text-xl px-12 py-7 font-bold"
              >
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

      {/* Footer */}
      <footer className="border-t py-12 px-4 bg-background pb-20 md:pb-12">
        <div className="container mx-auto max-w-6xl">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <FooterLogo className="mb-4" />
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

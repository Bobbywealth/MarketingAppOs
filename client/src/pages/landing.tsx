import { useState, useEffect, useRef } from "react";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { ArrowRight, CheckCircle, Star, TrendingUp, Globe, Smartphone, Palette, Brain, CreditCard, Lightbulb, Users, Target, Zap, ChevronDown, Pencil, FileText, Sparkles, Bot, ChevronLeft, ChevronRight, Menu, X } from "lucide-react";
import { HeaderLogo, FooterLogo } from "@/components/Logo";
import { useDocumentMeta } from "@/hooks/useDocumentMeta";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetClose,
} from "@/components/ui/sheet";
import heroImage from "@assets/hero-header-image.png";
import resultsImage from "@assets/stock_images/woman_working_on_lap_e8e31683.jpg";
import instagramLogo from "@assets/instagram-logo.png";
import tiktokLogo from "@assets/tiktok-logo.png";
import linkedinLogo from "@assets/linkedin-logo.png";
import googleAdsLogo from "@assets/google-ads-logo.png";

export default function LandingPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  useDocumentMeta({
    title: "Marketing Team App | Your Remote Digital Marketing Team",
    description: "Stop wasting money on marketing that doesn't work. Marketing Team App is your remote digital marketing team for strategy, content, campaigns and growth.",
    ogImage: "https://www.marketingteam.app/icon-512x512.png", // Assuming this exists or will be useful
    ogType: "website",
    twitterCard: "summary_large_image"
  });

  // Add structured data for SEO
  useEffect(() => {
    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.text = JSON.stringify({
      "@context": "https://schema.org",
      "@type": "Organization",
      "name": "Marketing Team App",
      "description": "Your remote digital marketing team for strategy, content, campaigns and growth",
      "url": window.location.origin,
      "logo": `${window.location.origin}/icon-512x512.png`,
      "sameAs": [
        "https://facebook.com/marketingteamapp",
        "https://twitter.com/marketingteamapp",
        "https://linkedin.com/company/marketingteamapp"
      ],
      "aggregateRating": {
        "@type": "AggregateRating",
        "ratingValue": "4.9",
        "reviewCount": "500",
        "bestRating": "5"
      },
      "offers": {
        "@type": "AggregateOffer",
        "priceCurrency": "USD",
        "lowPrice": "297",
        "highPrice": "2997",
        "offerCount": "6"
      }
    });
    document.head.appendChild(script);
    return () => {
      document.head.removeChild(script);
    };
  }, []);
  const { toast } = useToast();
  const [auditForm, setAuditForm] = useState({
    website: "",
    instagramUrl: "",
    tiktokUrl: "",
    facebookUrl: ""
  });
  const [auditResults, setAuditResults] = useState<any>(null);
  const [showResults, setShowResults] = useState(false);
  const [showStickyCTA, setShowStickyCTA] = useState(false);
  const [currentTestimonialIndex, setCurrentTestimonialIndex] = useState(0);
  const testimonialIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const [expandedService, setExpandedService] = useState<string | null>(null);

  // Scroll-triggered sticky CTA
  useEffect(() => {
    const handleScroll = () => {
      setShowStickyCTA(window.scrollY > 600);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Auto-rotate testimonials every 5 seconds on mobile
  useEffect(() => {
    const startAutoRotate = () => {
      testimonialIntervalRef.current = setInterval(() => {
        setCurrentTestimonialIndex((prev) => (prev + 1) % testimonials.length);
      }, 5000);
    };

    // Only auto-rotate on mobile
    if (window.innerWidth < 768) {
      startAutoRotate();
    }

    const handleResize = () => {
      if (window.innerWidth < 768) {
        if (!testimonialIntervalRef.current) startAutoRotate();
      } else {
        if (testimonialIntervalRef.current) {
          clearInterval(testimonialIntervalRef.current);
          testimonialIntervalRef.current = null;
        }
      }
    };

    window.addEventListener('resize', handleResize);

    return () => {
      if (testimonialIntervalRef.current) {
        clearInterval(testimonialIntervalRef.current);
      }
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  const testimonials = [
    {
      name: "Marcus Johnson",
      role: "Independent Musician",
      initials: "MJ",
      gradient: "from-blue-500 to-purple-500",
      text: "Marketing Team App took my Instagram from 5K to 50K followers in 6 months. Their content strategy and ad campaigns were game-changers. My music career has never been better!",
      featured: false
    },
    {
      name: "Tanya Chen",
      role: "E-commerce Business Owner",
      initials: "TC",
      gradient: "from-green-500 to-emerald-500",
      text: "Our e-commerce sales tripled after Marketing Team App revamped our website and ran our ad campaigns. The ROI has been insane. Best marketing investment we've ever made!",
      featured: true
    },
    {
      name: "David Rodriguez",
      role: "Fitness Coach & Influencer",
      initials: "DR",
      gradient: "from-orange-500 to-red-500",
      text: "As a fitness coach, I needed help building my personal brand. Marketing Team App handled everything - content, ads, website. Now I'm booked out 3 months in advance!",
      featured: false
    },
    {
      name: "Sarah Patel",
      role: "Restaurant Owner",
      initials: "SP",
      gradient: "from-pink-500 to-rose-500",
      text: "Running a restaurant with zero marketing experience was tough. Marketing Team App created our entire digital presence - website, social media, Google Ads. We're now fully booked every weekend!",
      featured: false
    },
    {
      name: "James Wilson",
      role: "SaaS Founder",
      initials: "JW",
      gradient: "from-indigo-500 to-blue-500",
      text: "As a B2B SaaS company, we needed LinkedIn expertise and enterprise-level campaigns. Marketing Team App delivered beyond expectations - 300% increase in qualified leads in just 4 months!",
      featured: false
    },
    {
      name: "Lisa Martinez",
      role: "Real Estate Agent",
      initials: "LM",
      gradient: "from-teal-500 to-cyan-500",
      text: "I'm a real estate agent competing in a saturated market. Marketing Team App's targeted Facebook ads and professional content helped me close 40% more deals this year. Absolute game changer!",
      featured: false
    },
    {
      name: "Michael Chang",
      role: "Fashion Brand Owner",
      initials: "MC",
      gradient: "from-violet-500 to-purple-500",
      text: "Launching my fashion brand was scary. Marketing Team App created our entire launch strategy - influencer partnerships, Instagram ads, email campaigns. We sold out our first collection in 2 weeks!",
      featured: false
    },
    {
      name: "Emma Thompson",
      role: "Online Course Creator",
      initials: "ET",
      gradient: "from-amber-500 to-orange-500",
      text: "I was struggling to sell my online courses. Marketing Team App built my sales funnels, created compelling ads, and optimized my landing pages. My course sales increased by 450% in 3 months!",
      featured: false
    }
  ];

  const nextTestimonial = () => {
    setCurrentTestimonialIndex((prev) => (prev + 1) % testimonials.length);
  };

  const prevTestimonial = () => {
    setCurrentTestimonialIndex((prev) => (prev - 1 + testimonials.length) % testimonials.length);
  };

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
    <div className="min-h-screen bg-background overflow-x-hidden scroll-smooth">
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
                    <div className="w-80 p-3">
                      <a href="#digital-marketing" className="flex items-start gap-3 px-4 py-3 text-sm hover:bg-accent rounded-md transition-colors group" data-testid="nav-digital-marketing">
                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                          <TrendingUp className="w-5 h-5 text-white" />
                        </div>
                        <div className="flex-1">
                          <div className="font-semibold text-foreground mb-0.5">Digital Marketing</div>
                          <div className="text-xs text-muted-foreground">Social media, ads & campaigns</div>
                        </div>
                      </a>
                      <a href="#content-creation" className="flex items-start gap-3 px-4 py-3 text-sm hover:bg-accent rounded-md transition-colors group" data-testid="nav-content-creation">
                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                          <Pencil className="w-5 h-5 text-white" />
                        </div>
                        <div className="flex-1">
                          <div className="font-semibold text-foreground mb-0.5">Content Creation</div>
                          <div className="text-xs text-muted-foreground">Copy, graphics & videos</div>
                        </div>
                      </a>
                      <a href="#web-design" className="flex items-start gap-3 px-4 py-3 text-sm hover:bg-accent rounded-md transition-colors group" data-testid="nav-web-design">
                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                          <Globe className="w-5 h-5 text-white" />
                        </div>
                        <div className="flex-1">
                          <div className="font-semibold text-foreground mb-0.5">Web & App Development</div>
                          <div className="text-xs text-muted-foreground">Websites, apps & CRMs</div>
                        </div>
                      </a>
                      <a href="#ai-automation" className="flex items-start gap-3 px-4 py-3 text-sm hover:bg-accent rounded-md transition-colors group" data-testid="nav-ai-automation">
                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                          <Bot className="w-5 h-5 text-white" />
                        </div>
                        <div className="flex-1">
                          <div className="font-semibold text-foreground mb-0.5 flex items-center gap-2">
                            AI Automation
                            <Badge className="bg-orange-500 text-white text-[10px] px-1.5 py-0">New</Badge>
                          </div>
                          <div className="text-xs text-muted-foreground">Chatbots & workflow automation</div>
                        </div>
                      </a>
                      <div className="border-t my-2"></div>
                      <a href="#seo" className="flex items-start gap-3 px-4 py-3 text-sm hover:bg-accent rounded-md transition-colors group" data-testid="nav-seo">
                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                          <Target className="w-5 h-5 text-white" />
                        </div>
                        <div className="flex-1">
                          <div className="font-semibold text-foreground mb-0.5">SEO & Analytics</div>
                          <div className="text-xs text-muted-foreground">Search optimization & tracking</div>
                        </div>
                      </a>
                    </div>
                  </NavigationMenuContent>
                </NavigationMenuItem>
              </NavigationMenuList>
            </NavigationMenu>
            
            <Link href="/blog" className="text-base font-medium text-foreground hover:text-primary transition-colors" data-testid="nav-blog">
              Blog
            </Link>
            <Link
              href="/signup/creator"
              className="text-base font-medium text-foreground hover:text-primary transition-colors"
              data-testid="nav-creator-signup"
            >
              Become a Creator
            </Link>
            <a href="#about" className="text-base font-medium text-foreground hover:text-primary transition-colors" data-testid="nav-about">
              About Us
            </a>
            <Link href="/contact" className="text-base font-medium text-foreground hover:text-primary transition-colors" data-testid="nav-contact">
              Contact Us
            </Link>
          </nav>

          <div className="flex items-center gap-2 md:gap-4">
            {/* Mobile Menu */}
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden" aria-label="Open menu">
                  <Menu className="h-6 w-6" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[85vw] sm:w-[400px]">
                <SheetHeader>
                  <SheetTitle>Menu</SheetTitle>
                </SheetHeader>
                <nav className="flex flex-col gap-4 mt-6">
                  <SheetClose asChild>
                    <Link href="/" className="text-base font-medium text-foreground hover:text-primary transition-colors py-2">
                      Home
                    </Link>
                  </SheetClose>
                  
                  <div className="space-y-2">
                    <div className="text-sm font-semibold text-muted-foreground uppercase tracking-wider px-2">Services</div>
                    <SheetClose asChild>
                      <a href="#digital-marketing" className="flex items-start gap-3 px-4 py-3 text-sm hover:bg-accent rounded-md transition-colors group">
                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shrink-0">
                          <TrendingUp className="w-5 h-5 text-white" />
                        </div>
                        <div className="flex-1">
                          <div className="font-semibold text-foreground mb-0.5">Digital Marketing</div>
                          <div className="text-xs text-muted-foreground">Social media, ads & campaigns</div>
                        </div>
                      </a>
                    </SheetClose>
                    <SheetClose asChild>
                      <a href="#content-creation" className="flex items-start gap-3 px-4 py-3 text-sm hover:bg-accent rounded-md transition-colors group">
                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center shrink-0">
                          <Pencil className="w-5 h-5 text-white" />
                        </div>
                        <div className="flex-1">
                          <div className="font-semibold text-foreground mb-0.5">Content Creation</div>
                          <div className="text-xs text-muted-foreground">Copy, graphics & videos</div>
                        </div>
                      </a>
                    </SheetClose>
                    <SheetClose asChild>
                      <a href="#web-design" className="flex items-start gap-3 px-4 py-3 text-sm hover:bg-accent rounded-md transition-colors group">
                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center shrink-0">
                          <Globe className="w-5 h-5 text-white" />
                        </div>
                        <div className="flex-1">
                          <div className="font-semibold text-foreground mb-0.5">Web & App Development</div>
                          <div className="text-xs text-muted-foreground">Websites, apps & CRMs</div>
                        </div>
                      </a>
                    </SheetClose>
                    <SheetClose asChild>
                      <a href="#ai-automation" className="flex items-start gap-3 px-4 py-3 text-sm hover:bg-accent rounded-md transition-colors group">
                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center shrink-0">
                          <Bot className="w-5 h-5 text-white" />
                        </div>
                        <div className="flex-1">
                          <div className="font-semibold text-foreground mb-0.5 flex items-center gap-2">
                            AI Automation
                            <Badge className="bg-orange-500 text-white text-[10px] px-1.5 py-0">New</Badge>
                          </div>
                          <div className="text-xs text-muted-foreground">Chatbots & workflow automation</div>
                        </div>
                      </a>
                    </SheetClose>
                    <SheetClose asChild>
                      <a href="#seo" className="flex items-start gap-3 px-4 py-3 text-sm hover:bg-accent rounded-md transition-colors group">
                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center shrink-0">
                          <Target className="w-5 h-5 text-white" />
                        </div>
                        <div className="flex-1">
                          <div className="font-semibold text-foreground mb-0.5">SEO & Analytics</div>
                          <div className="text-xs text-muted-foreground">Search optimization & tracking</div>
                        </div>
                      </a>
                    </SheetClose>
                  </div>
                  
                  <div className="border-t pt-4 space-y-2">
                    <SheetClose asChild>
                      <Link href="/blog" className="block text-base font-medium text-foreground hover:text-primary transition-colors py-2">
                        Blog
                      </Link>
                    </SheetClose>
                    <SheetClose asChild>
                      <Link href="/signup/creator" className="block text-base font-medium text-foreground hover:text-primary transition-colors py-2">
                        Become a Creator
                      </Link>
                    </SheetClose>
                    <SheetClose asChild>
                      <a href="#about" className="block text-base font-medium text-foreground hover:text-primary transition-colors py-2">
                        About Us
                      </a>
                    </SheetClose>
                    <SheetClose asChild>
                      <Link href="/contact" className="block text-base font-medium text-foreground hover:text-primary transition-colors py-2">
                        Contact Us
                      </Link>
                    </SheetClose>
                  </div>
                  
                  <div className="border-t pt-4 space-y-2">
                    <SheetClose asChild>
                      <Link href="/login" className="block">
                        <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white" data-testid="button-login-mobile">
                          Login
                        </Button>
                      </Link>
                    </SheetClose>
                    <SheetClose asChild>
                      <Link href="/signup" className="block">
                        <Button className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white" data-testid="button-signup-mobile">
                          Start Free Trial
                        </Button>
                      </Link>
                    </SheetClose>
                  </div>
                </nav>
              </SheetContent>
            </Sheet>
            
            {/* Desktop buttons */}
            <Link href="/login">
              <Button className="hidden md:inline-flex bg-blue-600 hover:bg-blue-700 text-white" data-testid="button-login-header">Login</Button>
            </Link>
            <Link href="/signup">
              <Button size="sm" className="gap-1 md:gap-2 text-sm bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white shadow-lg shadow-orange-500/30" data-testid="button-get-started-header">
                Start Free Trial
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
                  <Button size="lg" className="gap-2 w-full sm:w-auto bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white border-0 shadow-xl hover:shadow-2xl transition-all px-6 sm:px-8 md:px-10 py-6 md:py-7 font-bold text-base md:text-lg" data-testid="button-get-started-hero">
                    <span className="hidden sm:inline">🚀 Start Free Trial (Only 3 Spots Left)</span>
                    <span className="sm:hidden">🚀 Start Free Trial</span>
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
              <div className="text-center lg:text-left pt-2 px-2 sm:px-6 lg:px-0">
                <Link
                  href="/signup/creator"
                  className="text-sm text-blue-100/90 hover:text-white underline underline-offset-4"
                  data-testid="link-creator-apply-hero"
                >
                  Are you a creator? Apply here →
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

      {/* Trust Indicators Section - Positioned High */}
      <section className="py-12 px-4 bg-white border-y">
        <div className="container mx-auto max-w-6xl">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-bold text-blue-600 mb-2">850+</div>
              <p className="text-sm text-muted-foreground">Successful Campaigns</p>
            </div>
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-bold text-green-600 mb-2">4.2M+</div>
              <p className="text-sm text-muted-foreground">Leads Generated</p>
            </div>
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-bold text-orange-600 mb-2">310%</div>
              <p className="text-sm text-muted-foreground">Avg ROI Increase</p>
            </div>
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-bold text-purple-600 mb-2">98%</div>
              <p className="text-sm text-muted-foreground">Client Satisfaction</p>
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
            {/* Digital Marketing */}
            <Card className="p-6 md:p-8 bg-white hover-lift shadow-lg hover:shadow-2xl transition-all duration-300 border-t-4 border-t-blue-500 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-blue-500/10 to-transparent rounded-full -translate-y-10 translate-x-10 group-hover:scale-110 transition-transform"></div>
              <div className="w-16 h-16 md:w-20 md:h-20 rounded-2xl bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center mb-4 md:mb-6 shadow-md group-hover:scale-110 transition-transform">
                <TrendingUp className="w-8 h-8 md:w-10 md:h-10 text-blue-600" />
              </div>
              <h3 className="text-lg md:text-xl font-bold mb-2 md:mb-3">Digital Marketing</h3>
              <p className="text-sm text-muted-foreground leading-relaxed mb-3">
                Social media management, paid advertising, email marketing campaigns, and SEO optimization that actually convert visitors into customers and grow your audience organically.
              </p>
              
              {expandedService === 'digital' && (
                <div className="mb-3 text-sm text-muted-foreground space-y-2 border-t pt-3 animate-in fade-in slide-in-from-top-2">
                  <p className="font-semibold text-foreground">What you get:</p>
                  <ul className="list-disc pl-5 space-y-1">
                    <li>Full social media management (all platforms)</li>
                    <li>Targeted paid ad campaigns (Facebook, Instagram, Google)</li>
                    <li>Email marketing automation & sequences</li>
                    <li>SEO optimization & content strategy</li>
                    <li>Monthly analytics & performance reports</li>
                  </ul>
                </div>
              )}
              
              <button
                onClick={() => setExpandedService(expandedService === 'digital' ? null : 'digital')}
                className="text-xs text-blue-600 hover:text-blue-700 font-semibold mb-2 flex items-center gap-1"
              >
                {expandedService === 'digital' ? '− Show Less' : '+ Learn More'}
              </button>
              
              <div className="text-xs text-green-600 font-semibold mb-2">🔥 850+ Campaigns Launched</div>
              <Link href="/signup">
                <Button size="sm" className="w-full bg-blue-600 hover:bg-blue-700 text-white text-xs">
                  Get Started →
                </Button>
              </Link>
            </Card>
            
            {/* Content Creation */}
            <Card className="p-6 md:p-8 bg-white hover-lift shadow-lg hover:shadow-2xl transition-all duration-300 border-t-4 border-t-purple-500 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-purple-500/10 to-transparent rounded-full -translate-y-10 translate-x-10 group-hover:scale-110 transition-transform"></div>
              <div className="w-16 h-16 md:w-20 md:h-20 rounded-2xl bg-gradient-to-br from-purple-50 to-purple-100 flex items-center justify-center mb-4 md:mb-6 shadow-md group-hover:scale-110 transition-transform">
                <Pencil className="w-8 h-8 md:w-10 md:h-10 text-purple-600" />
              </div>
              <h3 className="text-lg md:text-xl font-bold mb-2 md:mb-3">Content Creation</h3>
              <p className="text-sm text-muted-foreground leading-relaxed mb-3">
                Professional copywriting, eye-catching graphics, engaging videos, and multimedia content that tells your brand story and drives sales. From social posts to landing pages.
              </p>
              
              {expandedService === 'content' && (
                <div className="mb-3 text-sm text-muted-foreground space-y-2 border-t pt-3 animate-in fade-in slide-in-from-top-2">
                  <p className="font-semibold text-foreground">What you get:</p>
                  <ul className="list-disc pl-5 space-y-1">
                    <li>Professional copywriting for all channels</li>
                    <li>Custom graphic design & branded templates</li>
                    <li>Video editing & production</li>
                    <li>Social media content calendars</li>
                    <li>Landing page & website copy</li>
                  </ul>
                </div>
              )}
              
              <button
                onClick={() => setExpandedService(expandedService === 'content' ? null : 'content')}
                className="text-xs text-purple-600 hover:text-purple-700 font-semibold mb-2 flex items-center gap-1"
              >
                {expandedService === 'content' ? '− Show Less' : '+ Learn More'}
              </button>
              
              <div className="text-xs text-green-600 font-semibold mb-2">⚡ 50K+ Content Pieces</div>
              <Link href="/signup">
                <Button size="sm" className="w-full bg-blue-600 hover:bg-blue-700 text-white text-xs">
                  Get Started →
                </Button>
              </Link>
            </Card>
            
            {/* Web & App Development */}
            <Card className="p-6 md:p-8 bg-white hover-lift shadow-lg hover:shadow-2xl transition-all duration-300 border-t-4 border-t-emerald-500 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-emerald-500/10 to-transparent rounded-full -translate-y-10 translate-x-10 group-hover:scale-110 transition-transform"></div>
              <div className="w-16 h-16 md:w-20 md:h-20 rounded-2xl bg-gradient-to-br from-emerald-50 to-emerald-100 flex items-center justify-center mb-4 md:mb-6 shadow-md group-hover:scale-110 transition-transform">
                <Globe className="w-8 h-8 md:w-10 md:h-10 text-emerald-600" />
              </div>
              <h3 className="text-lg md:text-xl font-bold mb-2 md:mb-3">Web & App Development</h3>
              <p className="text-sm text-muted-foreground leading-relaxed mb-3">
                Modern, responsive websites, native mobile apps, custom CRM systems, and e-commerce platforms that provide seamless user experiences and convert visitors into loyal customers.
              </p>
              
              {expandedService === 'web' && (
                <div className="mb-3 text-sm text-muted-foreground space-y-2 border-t pt-3 animate-in fade-in slide-in-from-top-2">
                  <p className="font-semibold text-foreground">What you get:</p>
                  <ul className="list-disc pl-5 space-y-1">
                    <li>Custom website design & development</li>
                    <li>iOS & Android native mobile apps</li>
                    <li>E-commerce platforms (Shopify, WooCommerce)</li>
                    <li>Custom CRM & business software</li>
                    <li>Ongoing maintenance & support</li>
                  </ul>
                </div>
              )}
              
              <button
                onClick={() => setExpandedService(expandedService === 'web' ? null : 'web')}
                className="text-xs text-emerald-600 hover:text-emerald-700 font-semibold mb-2 flex items-center gap-1"
              >
                {expandedService === 'web' ? '− Show Less' : '+ Learn More'}
              </button>
              
              <div className="text-xs text-green-600 font-semibold mb-2">🚀 200+ Apps Built</div>
              <Link href="/signup">
                <Button size="sm" className="w-full bg-blue-600 hover:bg-blue-700 text-white text-xs">
                  Get Started →
                </Button>
              </Link>
            </Card>
            
            {/* AI Automation */}
            <Card className="p-6 md:p-8 bg-white hover-lift shadow-lg hover:shadow-2xl transition-all duration-300 border-t-4 border-t-orange-500 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-orange-500/10 to-transparent rounded-full -translate-y-10 translate-x-10 group-hover:scale-110 transition-transform"></div>
              <div className="w-16 h-16 md:w-20 md:h-20 rounded-2xl bg-gradient-to-br from-orange-50 to-orange-100 flex items-center justify-center mb-4 md:mb-6 shadow-md group-hover:scale-110 transition-transform">
                <Bot className="w-8 h-8 md:w-10 md:h-10 text-orange-600" />
              </div>
              <h3 className="text-lg md:text-xl font-bold mb-2 md:mb-3">AI Automation</h3>
              <p className="text-sm text-muted-foreground leading-relaxed mb-3">
                AI-powered chatbots, automated email sequences, intelligent lead scoring, and workflow automation that saves you time, reduces costs, and scales your marketing efforts effortlessly.
              </p>
              
              {expandedService === 'ai' && (
                <div className="mb-3 text-sm text-muted-foreground space-y-2 border-t pt-3 animate-in fade-in slide-in-from-top-2">
                  <p className="font-semibold text-foreground">What you get:</p>
                  <ul className="list-disc pl-5 space-y-1">
                    <li>AI chatbot setup & training</li>
                    <li>Automated email & SMS sequences</li>
                    <li>Intelligent lead scoring & routing</li>
                    <li>Workflow automation (Zapier, Make.com)</li>
                    <li>AI content generation tools</li>
                  </ul>
                </div>
              )}
              
              <button
                onClick={() => setExpandedService(expandedService === 'ai' ? null : 'ai')}
                className="text-xs text-orange-600 hover:text-orange-700 font-semibold mb-2 flex items-center gap-1"
              >
                {expandedService === 'ai' ? '− Show Less' : '+ Learn More'}
              </button>
              
              <div className="text-xs text-green-600 font-semibold mb-2">🤖 95% Time Saved</div>
              <Link href="/signup">
                <Button size="sm" className="w-full bg-blue-600 hover:bg-blue-700 text-white text-xs">
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
                      <label className="block text-white font-semibold mb-2 text-sm flex items-center gap-1">
                        Website URL 
                        <span className="text-red-400 text-lg font-bold animate-pulse">*</span>
                      </label>
                      <Input
                        type="url"
                        placeholder="https://yourwebsite.com"
                        value={auditForm.website}
                        onChange={(e) => setAuditForm({...auditForm, website: e.target.value})}
                        className="bg-white/20 border-2 border-white/30 text-white placeholder:text-white/60 focus:border-orange-400 focus:ring-4 focus:ring-orange-400/40 focus:bg-white/25 transition-all h-12 text-base"
                        required
                      />
                      <p className="text-xs text-blue-100 mt-1.5 flex items-center gap-1">
                        <CheckCircle className="w-3 h-3" />
                        Required for audit analysis
                      </p>
                    </div>
                    <div>
                      <label className="block text-white font-semibold mb-2 text-sm flex items-center gap-2">
                        Instagram URL 
                        <span className="text-white/60 text-xs font-normal">(Optional)</span>
                      </label>
                      <Input
                        type="url"
                        placeholder="https://instagram.com/yourusername"
                        value={auditForm.instagramUrl}
                        onChange={(e) => setAuditForm({...auditForm, instagramUrl: e.target.value})}
                        className="bg-white/20 border-2 border-white/30 text-white placeholder:text-white/50 focus:border-blue-400 focus:ring-4 focus:ring-blue-400/40 focus:bg-white/25 transition-all h-12 text-base"
                      />
                    </div>
                    <div>
                      <label className="block text-white font-semibold mb-2 text-sm flex items-center gap-2">
                        TikTok URL 
                        <span className="text-white/60 text-xs font-normal">(Optional)</span>
                      </label>
                      <Input
                        type="url"
                        placeholder="https://tiktok.com/@yourusername"
                        value={auditForm.tiktokUrl}
                        onChange={(e) => setAuditForm({...auditForm, tiktokUrl: e.target.value})}
                        className="bg-white/20 border-2 border-white/30 text-white placeholder:text-white/50 focus:border-blue-400 focus:ring-4 focus:ring-blue-400/40 focus:bg-white/25 transition-all h-12 text-base"
                      />
                    </div>
                    <div>
                      <label className="block text-white font-semibold mb-2 text-sm flex items-center gap-2">
                        Facebook URL 
                        <span className="text-white/60 text-xs font-normal">(Optional)</span>
                      </label>
                      <Input
                        type="url"
                        placeholder="https://facebook.com/yourpage"
                        value={auditForm.facebookUrl}
                        onChange={(e) => setAuditForm({...auditForm, facebookUrl: e.target.value})}
                        className="bg-white/20 border-2 border-white/30 text-white placeholder:text-white/50 focus:border-blue-400 focus:ring-4 focus:ring-blue-400/40 focus:bg-white/25 transition-all h-12 text-base"
                      />
                    </div>
                  </div>
                  
                  <div className="text-center">
                    <Button 
                      type="submit" 
                      size="lg"
                      disabled={auditMutation.isPending}
                      className="bg-white text-blue-600 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed font-bold text-lg px-12 py-6 shadow-xl hover:shadow-2xl transition-all"
                    >
                      {auditMutation.isPending ? (
                        <>
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600 mr-2"></div>
                          Analyzing Your Social Media...
                        </>
                      ) : (
                        <>
                          🚀 Get My FREE Audit Now
                        </>
                      )}
                    </Button>
                    <p className="text-blue-100 text-sm mt-4 flex flex-wrap justify-center gap-4">
                      <span>✅ No signup required</span>
                      <span>✅ Instant results</span>
                      <span>✅ 100% Free</span>
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

      {/* Why Trust Us Section - New */}
      <section className="py-16 px-4 bg-white border-y">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-12">
            <p className="text-sm font-semibold text-blue-600 uppercase tracking-wider mb-2">Trusted by Leaders</p>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Why Top Brands Choose Us
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Join hundreds of successful businesses, influencers, and entrepreneurs who trust us with their growth.
            </p>
          </div>

          {/* Trust Badges Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-12">
            <div className="text-center p-6 bg-gradient-to-br from-blue-50 to-white rounded-xl border border-blue-100 hover:shadow-lg transition-shadow">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center mx-auto mb-3 shadow-lg">
                <CheckCircle className="w-8 h-8 text-white" />
              </div>
              <p className="font-bold text-lg text-gray-900">98%</p>
              <p className="text-sm text-muted-foreground">Client Satisfaction</p>
            </div>

            <div className="text-center p-6 bg-gradient-to-br from-green-50 to-white rounded-xl border border-green-100 hover:shadow-lg transition-shadow">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center mx-auto mb-3 shadow-lg">
                <Target className="w-8 h-8 text-white" />
              </div>
              <p className="font-bold text-lg text-gray-900">310%</p>
              <p className="text-sm text-muted-foreground">Avg ROI Increase</p>
            </div>

            <div className="text-center p-6 bg-gradient-to-br from-orange-50 to-white rounded-xl border border-orange-100 hover:shadow-lg transition-shadow">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center mx-auto mb-3 shadow-lg">
                <Zap className="w-8 h-8 text-white" />
              </div>
              <p className="font-bold text-lg text-gray-900">7-10 Days</p>
              <p className="text-sm text-muted-foreground">Fast Launch</p>
            </div>

            <div className="text-center p-6 bg-gradient-to-br from-purple-50 to-white rounded-xl border border-purple-100 hover:shadow-lg transition-shadow">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center mx-auto mb-3 shadow-lg">
                <Users className="w-8 h-8 text-white" />
              </div>
              <p className="font-bold text-lg text-gray-900">500+</p>
              <p className="text-sm text-muted-foreground">Happy Clients</p>
            </div>
          </div>

          {/* Guarantees Row */}
          <div className="grid md:grid-cols-3 gap-6">
            <Card className="p-6 text-center hover-lift bg-gradient-to-br from-white to-blue-50 border-blue-100">
              <div className="text-4xl mb-3">🛡️</div>
              <h3 className="font-bold text-lg mb-2">30-Day Guarantee</h3>
              <p className="text-sm text-muted-foreground">
                Full refund if you're not satisfied with our work. No questions asked.
              </p>
            </Card>

            <Card className="p-6 text-center hover-lift bg-gradient-to-br from-white to-green-50 border-green-100">
              <div className="text-4xl mb-3">📊</div>
              <h3 className="font-bold text-lg mb-2">100% Transparency</h3>
              <p className="text-sm text-muted-foreground">
                Real-time access to all metrics, reports, and campaign performance data.
              </p>
            </Card>

            <Card className="p-6 text-center hover-lift bg-gradient-to-br from-white to-orange-50 border-orange-100">
              <div className="text-4xl mb-3">🚀</div>
              <h3 className="font-bold text-lg mb-2">No Contracts</h3>
              <p className="text-sm text-muted-foreground">
                Month-to-month service. We earn your business with results, not lock-ins.
              </p>
            </Card>
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
              <Button size="lg" className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white text-lg px-10 py-6 shadow-xl">
                Start Free Trial
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
            <p className="text-sm text-muted-foreground mt-4">No credit card required • 14-day free trial</p>
          </div>
        </div>
      </section>

      {/* All Packages Section with Tabs */}
      <section className="py-20 px-4 bg-gradient-to-b from-gray-50 to-white">
        <div className="container mx-auto max-w-7xl">
          <div className="text-center mb-12">
            <p className="text-sm font-semibold text-blue-600 uppercase tracking-wider mb-2">Pricing & Packages</p>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Choose Your Perfect Package
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Whether you're launching a product, building your brand, or growing your audience - we have a package for you.
            </p>
            <div className="mt-6 relative">
              <div className="absolute inset-0 bg-gradient-to-r from-orange-500 to-red-500 rounded-xl blur-xl opacity-50 animate-pulse"></div>
              <div className="relative p-5 bg-gradient-to-r from-red-50 via-orange-50 to-red-50 border-3 border-orange-500 rounded-xl shadow-2xl hover:shadow-orange-500/50 transition-all duration-300 hover:scale-105">
                <div className="flex flex-col md:flex-row items-center justify-center gap-3">
                  <div className="flex items-center gap-2">
                    <span className="text-4xl animate-bounce">🔥</span>
                    <p className="text-lg md:text-xl text-orange-700 font-black">
                      LIMITED TIME: 20% OFF All Packages
                    </p>
                  </div>
                  <Badge className="bg-gradient-to-r from-orange-600 to-red-600 text-white text-sm px-4 py-1.5 shadow-lg animate-pulse">
                    This Month Only!
                  </Badge>
                </div>
                <p className="text-center text-sm text-orange-600 font-semibold mt-2">
                  ⏰ Offer expires in 7 days • Limited to first 3 clients
                </p>
              </div>
            </div>
          </div>

          <Tabs defaultValue="marketing" className="w-full">
            <TabsList className="grid w-full max-w-md mx-auto grid-cols-2 mb-12">
              <TabsTrigger value="marketing" className="text-base font-semibold">
                Marketing Packages
              </TabsTrigger>
              <TabsTrigger value="ai" className="text-base font-semibold">
                AI Packages (Second Me)
              </TabsTrigger>
            </TabsList>

            <TabsContent value="marketing" className="mt-8">
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
                <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  {packages.filter(pkg => !pkg.name.toLowerCase().includes('second me')).map((pkg) => (
                    <Card
                      key={pkg.id}
                      className={`p-6 md:p-8 hover-lift transition-all duration-300 ${
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
                        <h3 className="text-xl md:text-2xl font-bold mb-2">{pkg.name}</h3>
                        {pkg.description && (
                          <p className="text-muted-foreground text-sm">{pkg.description}</p>
                        )}
                      </div>
                      <div className="mb-6">
                        <span className="text-3xl md:text-4xl font-bold">{formatCurrency(pkg.price)}</span>
                        <span className="text-muted-foreground">/{pkg.billingPeriod}</span>
                      </div>
                      <ul className="space-y-3 mb-8">
                        {(pkg.features as string[]).map((feature, idx) => (
                          <li key={idx} className="flex items-start gap-2">
                            <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 shrink-0" />
                            <span className="text-sm">{feature}</span>
                          </li>
                        ))}
                      </ul>
                      <Link href={pkg.buttonLink || "/signup"}>
                        <Button
                          className={`w-full ${
                            pkg.isFeatured
                              ? "bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700"
                              : "bg-blue-600 hover:bg-blue-700"
                          }`}
                        >
                          {pkg.buttonText || "Start Free Trial"}
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
            </TabsContent>

            <TabsContent value="ai" className="mt-8">
              <div className="text-center mb-8">
                <div className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white px-4 py-2 rounded-full mb-4">
                  <Bot className="w-5 h-5" />
                  <span className="font-semibold">NEW: AI-Powered Marketing Assistant</span>
                </div>
                <h3 className="text-2xl md:text-3xl font-bold mb-4">
                  Second Me: Your AI Marketing Clone
                </h3>
                <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
                  Clone your expertise and let AI handle the repetitive work. Available 24/7 to answer questions, create content, and engage with your audience. Includes a digital visual version of you with AI-generated pictures, videos, and multimedia content.
                </p>
              </div>

              <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
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
                <Button className="w-full bg-blue-600 hover:bg-blue-700" size="lg">
                  Get Started
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
                <Button className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700" size="lg">
                  Start Free Trial
                </Button>
              </Link>
            </Card>
          </div>

          <div className="text-center mt-8">
            <p className="text-sm md:text-base text-muted-foreground mb-4">
              🎁 <strong>Special Launch Offer:</strong> Get 2 months free when you pay annually
            </p>
            <p className="text-sm text-muted-foreground">
              Need enterprise features? <Link href="/contact" className="text-blue-600 hover:underline font-semibold">Contact us for custom pricing</Link>
            </p>
          </div>
            </TabsContent>
          </Tabs>
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

          {/* Desktop: Show 3 at a time in grid */}
          <div className="hidden md:grid md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
            {testimonials.map((testimonial, index) => (
              <Card 
                key={index}
                className={`p-6 md:p-8 hover-lift ${testimonial.featured ? 'border-2 border-blue-500 shadow-xl' : ''}`}
              >
                <div className="flex gap-1 mb-4">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <p className="text-muted-foreground mb-6 italic">
                  "{testimonial.text}"
                </p>
                <div className="flex items-center gap-3">
                  <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${testimonial.gradient} flex items-center justify-center text-white font-bold`}>
                    {testimonial.initials}
                  </div>
                  <div>
                    <p className="font-semibold">{testimonial.name}</p>
                    <p className="text-sm text-muted-foreground">{testimonial.role}</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {/* Mobile: Show 1 at a time with carousel */}
          <div className="md:hidden relative">
            <div className="overflow-hidden">
              <div 
                className="flex transition-transform duration-500 ease-in-out"
                style={{ transform: `translateX(-${currentTestimonialIndex * 100}%)` }}
              >
                {testimonials.map((testimonial, index) => (
                  <div key={index} className="w-full flex-shrink-0 px-2">
                    <Card className="p-6 hover-lift">
                      <div className="flex gap-1 mb-4">
                        {[1, 2, 3, 4, 5].map((i) => (
                          <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                        ))}
                      </div>
                      <p className="text-muted-foreground mb-6 italic text-sm">
                        "{testimonial.text}"
                      </p>
                      <div className="flex items-center gap-3">
                        <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${testimonial.gradient} flex items-center justify-center text-white font-bold`}>
                          {testimonial.initials}
                        </div>
                        <div>
                          <p className="font-semibold">{testimonial.name}</p>
                          <p className="text-sm text-muted-foreground">{testimonial.role}</p>
                        </div>
                      </div>
                    </Card>
                  </div>
                ))}
              </div>
            </div>

            {/* Navigation Controls */}
            <div className="flex items-center justify-center gap-4 mt-6">
              <button
                onClick={prevTestimonial}
                className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center hover:bg-blue-700 transition-colors shadow-lg"
                aria-label="Previous testimonial"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              
              {/* Dots Indicator */}
              <div className="flex gap-2">
                {testimonials.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentTestimonialIndex(index)}
                    className={`w-2 h-2 rounded-full transition-all ${
                      index === currentTestimonialIndex 
                        ? 'bg-blue-600 w-8' 
                        : 'bg-gray-300 hover:bg-gray-400'
                    }`}
                    aria-label={`Go to testimonial ${index + 1}`}
                  />
                ))}
              </div>

              <button
                onClick={nextTestimonial}
                className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center hover:bg-blue-700 transition-colors shadow-lg"
                aria-label="Next testimonial"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>

            {/* Auto-play indicator */}
            <p className="text-center text-xs text-muted-foreground mt-3">
              Auto-rotates every 5 seconds
            </p>
          </div>
        </div>
      </section>

      {/* Why Choose Us Section */}
      <section className="py-20 px-4 bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700 text-white">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-6">Why Marketing Teams Choose Us</h2>
            <p className="text-xl text-blue-100 max-w-2xl mx-auto">
              We're obsessed with results, transparency, and building long-term partnerships.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="text-center p-6 bg-white/10 backdrop-blur rounded-xl border border-white/20 hover:bg-white/15 transition-all">
              <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Zap className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold mb-2">Fast Implementation</h3>
              <p className="text-blue-100">Most campaigns launch within 7-10 days. Need it faster? We can move quicker for urgent projects.</p>
            </div>
            <div className="text-center p-6 bg-white/10 backdrop-blur rounded-xl border border-white/20 hover:bg-white/15 transition-all">
              <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Target className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold mb-2">Results Guaranteed</h3>
              <p className="text-blue-100">30-day money-back guarantee. If you don't see measurable improvements, we refund every penny.</p>
            </div>
            <div className="text-center p-6 bg-white/10 backdrop-blur rounded-xl border border-white/20 hover:bg-white/15 transition-all">
              <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold mb-2">Dedicated Team</h3>
              <p className="text-blue-100">Work with a full marketing team: strategist, designer, copywriter, and campaign manager.</p>
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

          <Accordion type="single" collapsible className="w-full space-y-4">
            <AccordionItem value="item-1" className="bg-white border rounded-lg px-6 shadow-sm hover:shadow-md transition-shadow">
              <AccordionTrigger className="text-lg font-bold hover:no-underline py-6">
                What kind of businesses do you work with?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground pb-6">
                <p className="mb-3">
                  All kinds! We work with e-commerce stores, service businesses, influencers, musicians, coaches, startups - anyone who needs marketing.
                </p>
                <ul className="list-disc pl-5 space-y-2">
                  <li>E-commerce & Online Stores</li>
                  <li>B2B & SaaS Companies</li>
                  <li>Influencers & Content Creators</li>
                  <li>Local Businesses (Restaurants, Salons, etc.)</li>
                  <li>Professional Services (Coaches, Consultants)</li>
                  <li>Startups & Entrepreneurs</li>
                </ul>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-2" className="bg-white border rounded-lg px-6 shadow-sm hover:shadow-md transition-shadow">
              <AccordionTrigger className="text-lg font-bold hover:no-underline py-6">
                How fast can you get started?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground pb-6">
                <p className="mb-3">
                  Most campaigns launch within 7-10 days of our kickoff call. Here's our typical timeline:
                </p>
                <ul className="list-disc pl-5 space-y-2">
                  <li><strong>Day 1-2:</strong> Strategy session & goal setting</li>
                  <li><strong>Day 3-5:</strong> Campaign setup & content creation</li>
                  <li><strong>Day 6-7:</strong> Review & approval</li>
                  <li><strong>Day 8-10:</strong> Launch & optimization</li>
                </ul>
                <p className="mt-3 text-sm">
                  Need it faster? Let us know - we can expedite for urgent projects!
                </p>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-3" className="bg-white border rounded-lg px-6 shadow-sm hover:shadow-md transition-shadow">
              <AccordionTrigger className="text-lg font-bold hover:no-underline py-6">
                What's included in a package?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground pb-6">
                <p className="mb-3">
                  Every package includes:
                </p>
                <ul className="list-disc pl-5 space-y-2">
                  <li>Custom strategy development</li>
                  <li>Campaign execution & management</li>
                  <li>Professional content creation</li>
                  <li>Performance tracking & analytics</li>
                  <li>Monthly reporting & insights</li>
                  <li>Dedicated support team</li>
                  <li>Regular optimization & A/B testing</li>
                </ul>
                <p className="mt-3">
                  We customize based on what will actually move the needle for your specific goals.
                </p>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-4" className="bg-white border rounded-lg px-6 shadow-sm hover:shadow-md transition-shadow">
              <AccordionTrigger className="text-lg font-bold hover:no-underline py-6">
                Do I need a long-term contract?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground pb-6">
                <p className="mb-3">
                  <strong>Nope!</strong> We offer month-to-month services. We earn your business every single month by delivering results.
                </p>
                <ul className="list-disc pl-5 space-y-2">
                  <li>✅ No lock-ins or long-term commitments</li>
                  <li>✅ Cancel anytime with 30 days notice</li>
                  <li>✅ Flexible packages that scale with you</li>
                  <li>✅ No hidden fees or surprise charges</li>
                </ul>
                <p className="mt-3 text-sm">
                  Our 98% client retention rate speaks for itself - we keep clients happy, not trapped.
                </p>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-5" className="bg-white border rounded-lg px-6 shadow-sm hover:shadow-md transition-shadow">
              <AccordionTrigger className="text-lg font-bold hover:no-underline py-6">
                How do I track results?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground pb-6">
                <p className="mb-3">
                  Full transparency is our promise. You'll have:
                </p>
                <ul className="list-disc pl-5 space-y-2">
                  <li><strong>Real-time dashboard:</strong> Access 24/7 to see all metrics</li>
                  <li><strong>Monthly reports:</strong> Detailed insights & recommendations</li>
                  <li><strong>Weekly check-ins:</strong> Stay aligned on progress</li>
                  <li><strong>Custom KPIs:</strong> Track what matters to your business</li>
                  <li><strong>Performance alerts:</strong> Get notified of significant changes</li>
                </ul>
                <p className="mt-3">
                  We believe in complete transparency - you'll always know exactly what's working and what needs improvement.
                </p>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-6" className="bg-white border rounded-lg px-6 shadow-sm hover:shadow-md transition-shadow">
              <AccordionTrigger className="text-lg font-bold hover:no-underline py-6">
                What if I'm not happy with the results?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground pb-6">
                <p className="mb-3">
                  We stand behind our work 100%. Here's what happens:
                </p>
                <ul className="list-disc pl-5 space-y-2">
                  <li><strong>30-day money-back guarantee:</strong> Full refund if not satisfied</li>
                  <li><strong>Fast pivots:</strong> If something's not working, we adjust immediately</li>
                  <li><strong>No contracts:</strong> You're never stuck with us</li>
                  <li><strong>Dedicated support:</strong> Your success is our priority</li>
                </ul>
                <p className="mt-3 font-semibold text-blue-600">
                  Our 98% client retention rate and 310% average ROI increase speak for themselves.
                </p>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-7" className="bg-white border rounded-lg px-6 shadow-sm hover:shadow-md transition-shadow">
              <AccordionTrigger className="text-lg font-bold hover:no-underline py-6">
                What makes you different from other agencies?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground pb-6">
                <p className="mb-3">
                  We're not your typical agency. Here's why:
                </p>
                <ul className="list-disc pl-5 space-y-2">
                  <li><strong>Results-first approach:</strong> We only care about what drives actual growth</li>
                  <li><strong>Full transparency:</strong> Real-time access to all metrics and performance data</li>
                  <li><strong>No BS pricing:</strong> Clear, straightforward packages with no hidden fees</li>
                  <li><strong>Fast execution:</strong> Campaigns launch in days, not months</li>
                  <li><strong>Tech-enabled:</strong> We use cutting-edge AI and automation to maximize ROI</li>
                  <li><strong>Dedicated team:</strong> You get a full marketing team, not just one person</li>
                </ul>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-8" className="bg-white border rounded-lg px-6 shadow-sm hover:shadow-md transition-shadow">
              <AccordionTrigger className="text-lg font-bold hover:no-underline py-6">
                Do you handle the ad spend, or do I?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground pb-6">
                <p className="mb-3">
                  We offer both options depending on your preference:
                </p>
                <div className="space-y-3">
                  <div>
                    <p className="font-semibold mb-1">Option 1: You handle ad spend</p>
                    <p className="text-sm">You maintain control of your ad accounts and budget. We manage and optimize the campaigns.</p>
                  </div>
                  <div>
                    <p className="font-semibold mb-1">Option 2: We handle everything</p>
                    <p className="text-sm">We manage your ad accounts and budget allocation for maximum convenience.</p>
                  </div>
                </div>
                <p className="mt-3 text-sm">
                  Either way, you'll have full transparency and access to all performance data.
                </p>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-9" className="bg-white border rounded-lg px-6 shadow-sm hover:shadow-md transition-shadow">
              <AccordionTrigger className="text-lg font-bold hover:no-underline py-6">
                Can I upgrade or downgrade my package?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground pb-6">
                <p className="mb-3">
                  <strong>Absolutely!</strong> We understand that business needs change.
                </p>
                <ul className="list-disc pl-5 space-y-2">
                  <li>Upgrade anytime to access more services</li>
                  <li>Downgrade with 30 days notice</li>
                  <li>Add à la carte services as needed</li>
                  <li>Pause services if you need a break (up to 60 days)</li>
                </ul>
                <p className="mt-3">
                  We're here to grow with you, not hold you back. Your package should fit your current needs.
                </p>
              </AccordionContent>
            </AccordionItem>
          </Accordion>

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
              <Button size="lg" className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white text-xl px-12 py-7 shadow-2xl font-bold">
                Start Free Trial
                <ArrowRight className="w-6 h-6 ml-2" />
              </Button>
            </Link>
            <Link href="/contact">
              <Button 
                size="lg" 
                variant="outline" 
                className="border-2 border-white text-white hover:bg-white/10 text-xl px-12 py-7 font-bold"
              >
                Book Strategy Call
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

      {/* Sticky CTA - Desktop - Shows after scrolling */}
      {showStickyCTA && (
        <div className="fixed bottom-6 right-6 z-50 hidden md:block animate-in fade-in slide-in-from-bottom-4 duration-300">
          <div className="bg-gradient-to-r from-orange-500 to-orange-600 text-white px-6 py-4 rounded-full shadow-2xl hover:shadow-orange-500/50 transition-all hover:scale-105">
            <Link href="/signup">
              <Button size="sm" className="bg-transparent hover:bg-white/20 text-white font-bold border-0 gap-2">
                🚀 Start Free Trial
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>
        </div>
      )}

      {/* Mobile CTA Bar - Shows after scrolling */}
      {showStickyCTA && (
        <div className="fixed bottom-0 left-0 right-0 z-50 md:hidden animate-in fade-in slide-in-from-bottom-4 duration-300" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
          <div className="bg-gradient-to-r from-orange-500 to-orange-600 text-white p-4 shadow-2xl border-t-2 border-white/20">
            <div className="flex items-center justify-between gap-3">
              <div className="flex-1">
                <p className="text-sm font-semibold">🚀 Only 3 Spots Left</p>
                <p className="text-xs opacity-90">Start your free trial today</p>
              </div>
              <Link href="/signup">
                <Button size="sm" className="bg-white text-orange-600 hover:bg-gray-100 font-bold border-0 shrink-0">
                  Start Trial
                </Button>
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="border-t py-12 px-4 bg-background pb-24 md:pb-12">
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

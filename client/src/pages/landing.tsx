import { useState, useEffect, useRef } from "react";
import { Link } from "wouter";
import { motion, AnimatePresence, useInView } from "framer-motion";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
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
import { 
  ArrowRight, 
  CheckCircle, 
  Star, 
  TrendingUp, 
  Globe, 
  Smartphone, 
  Palette, 
  Brain, 
  CreditCard, 
  Lightbulb, 
  Users, 
  Target, 
  Zap, 
  ChevronDown, 
  Pencil, 
  FileText, 
  Sparkles, 
  Bot, 
  ChevronLeft, 
  ChevronRight, 
  Menu, 
  X, 
  Play, 
  ShieldCheck, 
  Rocket, 
  BarChart3, 
  MessageSquare 
} from "lucide-react";

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
import { AnimatedBackground } from "@/components/AnimatedBackground";
import heroImage from "@assets/hero-header-image.png";
import resultsImage from "@assets/stock_images/woman_working_on_lap_e8e31683.jpg";
import instagramLogo from "@assets/instagram-logo.png";
import tiktokLogo from "@assets/tiktok-logo.png";
import linkedinLogo from "@assets/linkedin-logo.png";
import googleAdsLogo from "@assets/google-ads-logo.png";

// Counter Component for Trust Indicators
function Counter({ value, suffix = "", duration = 2 }: { value: number, suffix?: string, duration?: number }) {
  const [count, setCount] = useState(0);
  const nodeRef = useRef(null);
  const isVisible = useInView(nodeRef, { once: true });

  useEffect(() => {
    if (isVisible) {
      let start = 0;
      const end = value;
      if (start === end) return;

      let totalMiliseconds = duration * 1000;
      let incrementTime = (totalMiliseconds / end);

      let timer = setInterval(() => {
        start += 1;
        setCount(start);
        if (start === end) clearInterval(timer);
      }, incrementTime);

      return () => clearInterval(timer);
    }
  }, [isVisible, value, duration]);

  return <span ref={nodeRef}>{count}{suffix}</span>;
}

// Live Feed Mockup Data
const LIVE_ACTIVITIES = [
  { name: "Alpha Tech", action: "started a new campaign", time: "just now", icon: Rocket },
  { name: "Sarah J.", action: "reached 10k followers", time: "2m ago", icon: Star },
  { name: "Zen Fitness", action: "generated 45 new leads", time: "5m ago", icon: Users },
  { name: "Urban Eats", action: "launched new website", time: "12m ago", icon: Globe },
];

// Platform Logo Cloud Component
function LogoCloud() {
  const logos = [
    { name: "Instagram", icon: instagramLogo },
    { name: "TikTok", icon: tiktokLogo },
    { name: "LinkedIn", icon: linkedinLogo },
    { name: "Google Ads", icon: googleAdsLogo },
  ];

  return (
    <div className="py-12 border-y bg-white/30 backdrop-blur-sm overflow-hidden">
      <div className="container mx-auto px-4">
        <p className="text-center text-sm font-bold text-slate-400 uppercase tracking-widest mb-8">Powering growth across every major platform</p>
        <div className="flex flex-wrap justify-center items-center gap-12 md:gap-24 opacity-50">
          {logos.map((logo) => (
            <motion.img 
              key={logo.name}
              whileHover={{ opacity: 1, scale: 1.1, filter: "grayscale(0%)" }}
              src={logo.icon} 
              alt={logo.name} 
              className="h-8 md:h-12 grayscale transition-all duration-300 cursor-pointer" 
            />
          ))}
        </div>
      </div>
    </div>
  );
}

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

  const [heroWordIndex, setHeroWordIndex] = useState(0);
  const heroWords = ["Team", "Partner", "Growth Engine", "Strategy"];

  const formatCurrency = (cents: number) => `$${(cents / 100).toFixed(2)}`;

  useEffect(() => {
    const interval = setInterval(() => {
      setHeroWordIndex((prev) => (prev + 1) % heroWords.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-background overflow-x-hidden scroll-smooth relative">
      <AnimatedBackground />
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
              <SheetContent side="right" className="w-[85vw] sm:w-[400px] border-l-0 p-0 overflow-hidden">
                <div className="flex flex-col h-full bg-gradient-to-b from-slate-50 to-white dark:from-slate-900 dark:to-slate-950">
                  <div className="p-6 border-b bg-white/50 dark:bg-slate-900/50 backdrop-blur-md">
                    <SheetHeader className="text-left">
                      <SheetTitle className="text-2xl font-black bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">Menu</SheetTitle>
                    </SheetHeader>
                  </div>
                  
                  <div className="flex-1 overflow-y-auto p-6 space-y-8">
                    <nav className="flex flex-col gap-2">
                      <SheetClose asChild>
                        <Link href="/" className="text-lg font-bold text-slate-900 dark:text-white hover:text-blue-600 transition-colors py-3 flex items-center justify-between border-b border-slate-100 dark:border-slate-800">
                          Home
                          <ChevronRight className="w-4 h-4 opacity-30" />
                        </Link>
                      </SheetClose>
                      
                      <div className="pt-4 space-y-4">
                        <div className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2 px-1">Expert Services</div>
                        <div className="grid gap-3">
                          <SheetClose asChild>
                            <a href="#digital-marketing" className="flex items-center gap-4 p-4 hover:bg-white dark:hover:bg-slate-800 rounded-2xl transition-all border border-transparent hover:border-slate-100 dark:hover:border-slate-700 hover:shadow-xl hover:shadow-blue-500/5 group">
                              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shrink-0 shadow-lg shadow-blue-500/20 group-hover:scale-110 transition-transform">
                                <TrendingUp className="w-6 h-6 text-white" />
                              </div>
                              <div className="flex-1">
                                <div className="font-black text-slate-900 dark:text-white text-sm mb-0.5">Digital Marketing</div>
                                <div className="text-[11px] text-slate-500 font-medium">Ads & Campaigns</div>
                              </div>
                            </a>
                          </SheetClose>
                          <SheetClose asChild>
                            <a href="#content-creation" className="flex items-center gap-4 p-4 hover:bg-white dark:hover:bg-slate-800 rounded-2xl transition-all border border-transparent hover:border-slate-100 dark:hover:border-slate-700 hover:shadow-xl hover:shadow-purple-500/5 group">
                              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center shrink-0 shadow-lg shadow-purple-500/20 group-hover:scale-110 transition-transform">
                                <Pencil className="w-6 h-6 text-white" />
                              </div>
                              <div className="flex-1">
                                <div className="font-black text-slate-900 dark:text-white text-sm mb-0.5">Content Creation</div>
                                <div className="text-[11px] text-slate-500 font-medium">Social & Video</div>
                              </div>
                            </a>
                          </SheetClose>
                        </div>
                      </div>
                      
                      <div className="pt-6 space-y-3">
                        <div className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2 px-1">More</div>
                        <SheetClose asChild>
                          <Link href="/signup/creator" className="text-base font-bold text-slate-700 dark:text-slate-300 hover:text-blue-600 transition-colors py-2 flex items-center gap-3">
                            <Users className="w-4 h-4 text-blue-500" />
                            Become a Creator
                          </Link>
                        </SheetClose>
                        <SheetClose asChild>
                          <Link href="/contact" className="text-base font-bold text-slate-700 dark:text-slate-300 hover:text-blue-600 transition-colors py-2 flex items-center gap-3">
                            <MessageSquare className="w-4 h-4 text-blue-500" />
                            Contact Us
                          </Link>
                        </SheetClose>
                      </div>
                    </nav>
                  </div>
                  
                  <div className="p-6 border-t bg-white dark:bg-slate-900 space-y-3 shadow-[0_-10px_30px_rgba(0,0,0,0.05)]">
                    <SheetClose asChild>
                      <Link href="/login" className="block">
                        <Button variant="outline" className="w-full h-12 rounded-xl font-bold border-2" data-testid="button-login-mobile">
                          Login
                        </Button>
                      </Link>
                    </SheetClose>
                    <SheetClose asChild>
                      <Link href="/signup" className="block">
                        <Button className="w-full h-12 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-black shadow-xl shadow-blue-500/20" data-testid="button-signup-mobile">
                          Get Started
                        </Button>
                      </Link>
                    </SheetClose>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
            
            {/* Desktop buttons */}
            <Link href="/login">
              <Button className="hidden md:inline-flex bg-blue-600 hover:bg-blue-700 text-white" data-testid="button-login-header">Login</Button>
            </Link>
            <Link href="/signup" className="hidden xs:block">
              <Button size="sm" className="gap-1 md:gap-2 text-[10px] xs:text-xs md:text-sm bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white shadow-lg shadow-orange-500/30 px-2 xs:px-3 md:px-4 h-8 xs:h-9 md:h-10 rounded-full font-bold" data-testid="button-get-started-header">
                Get Started
                <ArrowRight className="w-2.5 h-2.5 xs:w-3 xs:h-3 md:w-4 md:h-4" />
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-12 pb-16 md:pt-32 md:pb-24 lg:pt-40 lg:pb-32 px-4 overflow-hidden min-h-[80vh] md:min-h-[90vh] flex items-center">
        {/* Background Decorative Elements */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(59,130,246,0.1),transparent_50%)]"></div>
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03] pointer-events-none"></div>
        
        {/* Animated Orbs */}
        <motion.div 
          animate={{ 
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-1/4 -left-20 w-64 md:w-96 h-64 md:h-96 bg-blue-500/20 rounded-full blur-[80px] md:blur-[100px] pointer-events-none"
        />
        <motion.div 
          animate={{ 
            scale: [1, 1.3, 1],
            opacity: [0.2, 0.4, 0.2],
          }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 1 }}
          className="absolute bottom-1/4 -right-20 w-80 md:w-[500px] h-80 md:h-[500px] bg-purple-500/10 rounded-full blur-[100px] md:blur-[120px] pointer-events-none"
        />

        <div className="container mx-auto relative z-10">
          <div className="grid lg:grid-cols-12 gap-8 md:gap-12 items-center">
            <div className="lg:col-span-7 text-center lg:text-left space-y-6 md:space-y-8">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                <Badge className="bg-blue-600/10 text-blue-600 hover:bg-blue-600/20 border-blue-600/20 px-3 md:px-4 py-1 md:py-1.5 rounded-full text-[10px] md:text-sm font-bold backdrop-blur-sm mb-4 md:mb-6">
                  <Sparkles className="w-3 md:w-4 h-3 md:h-4 mr-2 inline-block animate-pulse" />
                  The Future of Remote Marketing
                </Badge>
                
                <h1 className="text-4xl sm:text-5xl md:text-7xl xl:text-8xl font-black tracking-tighter leading-[1.1] sm:leading-[1] md:leading-[0.9] mb-6 md:mb-8">
                  Your Digital <br className="hidden xs:block sm:block" />
                  <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent italic">
                    Marketing Force
                  </span>
                </h1>

                <p className="text-base sm:text-lg md:text-2xl text-slate-600 dark:text-slate-400 font-medium max-w-2xl mx-auto lg:mx-0 leading-relaxed sm:leading-snug md:leading-tight mb-8 md:mb-10 px-4 sm:px-0">
                  Stop hiring freelancers. Start scaling with an entire elite marketing team for the price of one junior employee.
                </p>

                <div className="flex flex-col sm:flex-row gap-4 md:gap-5 justify-center lg:justify-start px-6 sm:px-0">
                  <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="w-full sm:w-auto">
                    <Link href="/signup">
                      <Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-white h-16 sm:h-auto px-8 md:px-10 py-6 md:py-8 rounded-2xl text-lg md:text-xl font-black shadow-2xl shadow-blue-600/30 group w-full border-b-4 border-blue-800 active:border-b-0 transition-all">
                        Get Started <ArrowRight className="ml-2 w-5 md:w-6 h-5 md:h-6 group-hover:translate-x-1 transition-transform" />
                      </Button>
                    </Link>
                  </motion.div>
                  <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="w-full sm:w-auto">
                    <Link href="/contact">
                      <Button size="lg" variant="outline" className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-2 border-slate-200 dark:border-slate-800 h-16 sm:h-auto px-8 md:px-10 py-6 md:py-8 rounded-2xl text-lg md:text-xl font-bold hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors w-full shadow-lg">
                        Book a Call
                      </Button>
                    </Link>
                  </motion.div>
                </div>

                <div className="pt-10 md:pt-12 flex flex-wrap items-center justify-center lg:justify-start gap-6 sm:gap-10 opacity-50 grayscale hover:opacity-100 hover:grayscale-0 transition-all duration-700">
                  <img src={instagramLogo} alt="Instagram" className="h-6 sm:h-7 md:h-9" />
                  <img src={tiktokLogo} alt="TikTok" className="h-6 sm:h-7 md:h-9" />
                  <img src={linkedinLogo} alt="LinkedIn" className="h-6 sm:h-7 md:h-9" />
                  <img src={googleAdsLogo} alt="Google Ads" className="h-6 sm:h-7 md:h-9" />
                </div>

                {/* Live Activity Feed */}
                <div className="mt-12 hidden lg:block overflow-hidden h-10 relative">
                  <div className="flex flex-col animate-[slide-up_10s_linear_infinite]">
                    {[...LIVE_ACTIVITIES, ...LIVE_ACTIVITIES].map((activity, i) => (
                      <div key={i} className="flex items-center gap-3 h-10 text-slate-500 dark:text-slate-400 text-sm">
                        <div className="w-6 h-6 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-600">
                          <activity.icon className="w-3 h-3" />
                        </div>
                        <span className="font-bold text-slate-700 dark:text-slate-200">{activity.name}</span>
                        <span>{activity.action}</span>
                        <span className="text-xs opacity-50">• {activity.time}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            </div>

            <div className="lg:col-span-5 relative">
              <motion.div
                initial={{ opacity: 0, scale: 0.8, rotateY: 20 }}
                animate={{ opacity: 1, scale: 1, rotateY: 0 }}
                transition={{ duration: 1, ease: "easeOut" }}
                className="relative z-10"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-blue-600/20 to-purple-600/20 rounded-[2.5rem] blur-3xl -z-10 transform rotate-6 scale-110"></div>
                <div className="relative bg-white/10 dark:bg-slate-900/10 backdrop-blur-sm border border-white/20 dark:border-slate-800/50 p-2 rounded-[2.5rem] shadow-2xl shadow-blue-500/10">
                  <div className="rounded-[2rem] overflow-hidden shadow-inner ring-1 ring-black/5">
                    <img 
                      src={heroImage} 
                      alt="Marketing Dashboard" 
                      className="w-full h-auto object-cover"
                    />
                  </div>
                  
                  {/* Floating Elements on Image */}
                  <motion.div 
                    animate={{ y: [0, -15, 0] }}
                    transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                    className="absolute -top-6 -right-6 bg-white dark:bg-slate-800 p-4 rounded-2xl shadow-xl border border-slate-100 dark:border-slate-700 hidden sm:block"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/20 flex items-center justify-center">
                        <TrendingUp className="w-5 h-5 text-green-600" />
                      </div>
                      <div>
                        <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Growth</p>
                        <p className="text-lg font-black">+214%</p>
                      </div>
                    </div>
                  </motion.div>

                  <motion.div 
                    animate={{ y: [0, 15, 0] }}
                    transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
                    className="absolute -bottom-6 -left-6 bg-white dark:bg-slate-800 p-4 rounded-2xl shadow-xl border border-slate-100 dark:border-slate-700 hidden sm:block"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center">
                        <Users className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Active Leads</p>
                        <p className="text-lg font-black">1,482</p>
                      </div>
                    </div>
                  </motion.div>
                </div>
              </motion.div>
            </div>
          </div>
        </div>

        {/* Scroll Indicator */}
        <motion.div 
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 opacity-40 hover:opacity-100 transition-opacity cursor-pointer hidden md:flex"
          onClick={() => document.getElementById('services')?.scrollIntoView({ behavior: 'smooth' })}
        >
          <span className="text-[10px] font-black uppercase tracking-[0.2em]">Explore</span>
          <div className="w-px h-12 bg-gradient-to-b from-blue-600 to-transparent"></div>
        </motion.div>
      </section>

      <LogoCloud />

      {/* Trust Indicators Section - Positioned High */}
      <motion.section 
        initial={{ opacity: 0, y: 50 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.8 }}
        className="py-16 px-4 bg-white/40 dark:bg-slate-900/40 backdrop-blur-md border-y border-white/20 dark:border-slate-800/50 relative z-20"
      >
        <div className="container mx-auto max-w-6xl">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12">
            <motion.div 
              whileHover={{ y: -5 }}
              className="text-center group"
            >
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-blue-500/10 mb-4 group-hover:bg-blue-500 group-hover:text-white transition-all duration-300">
                <Rocket className="w-6 h-6 text-blue-600 group-hover:text-white" />
              </div>
              <div className="text-4xl md:text-5xl font-extrabold bg-gradient-to-br from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-2 tabular-nums">
                <Counter value={850} suffix="+" />
              </div>
              <p className="text-sm font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Campaigns</p>
            </motion.div>
            
            <motion.div 
              whileHover={{ y: -5 }}
              className="text-center group"
            >
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-green-500/10 mb-4 group-hover:bg-green-500 group-hover:text-white transition-all duration-300">
                <Users className="w-6 h-6 text-green-600 group-hover:text-white" />
              </div>
              <div className="text-4xl md:text-5xl font-extrabold bg-gradient-to-br from-green-600 to-emerald-600 bg-clip-text text-transparent mb-2 tabular-nums">
                <Counter value={4} suffix="M+" />
              </div>
              <p className="text-sm font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Leads Generated</p>
            </motion.div>

            <motion.div 
              whileHover={{ y: -5 }}
              className="text-center group"
            >
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-orange-500/10 mb-4 group-hover:bg-orange-500 group-hover:text-white transition-all duration-300">
                <BarChart3 className="w-6 h-6 text-orange-600 group-hover:text-white" />
              </div>
              <div className="text-4xl md:text-5xl font-extrabold bg-gradient-to-br from-orange-600 to-red-600 bg-clip-text text-transparent mb-2 tabular-nums">
                <Counter value={310} suffix="%" />
              </div>
              <p className="text-sm font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Avg ROI Increase</p>
            </motion.div>

            <motion.div 
              whileHover={{ y: -5 }}
              className="text-center group"
            >
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-purple-500/10 mb-4 group-hover:bg-purple-500 group-hover:text-white transition-all duration-300">
                <ShieldCheck className="w-6 h-6 text-purple-600 group-hover:text-white" />
              </div>
              <div className="text-4xl md:text-5xl font-extrabold bg-gradient-to-br from-purple-600 to-pink-600 bg-clip-text text-transparent mb-2 tabular-nums">
                <Counter value={98} suffix="%" />
              </div>
              <p className="text-sm font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Satisfaction</p>
            </motion.div>
          </div>
        </div>
      </motion.section>


      {/* Our Services - Bento Grid Style */}
      <section className="py-24 md:py-32 px-4 relative z-20 overflow-hidden" id="services">
        <div className="container mx-auto max-w-7xl">
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16 md:mb-24"
          >
            <Badge variant="outline" className="mb-4 border-blue-200 dark:border-blue-800 text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 px-4 py-1 rounded-full font-bold uppercase tracking-wider text-[10px]">
              Our Capabilities
            </Badge>
            <h2 className="text-4xl md:text-6xl font-extrabold mb-6 tracking-tight">
              Scale Your Brand with <br />
              <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent italic tracking-tight">Modern Marketing</span>
            </h2>
            <p className="text-xl text-slate-600 dark:text-slate-400 max-w-3xl mx-auto leading-relaxed">
              We've consolidated every essential growth tool into one high-performance team. No more managing multiple agencies or freelancers.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-6 gap-4 md:gap-6">
            {/* Main Feature: Digital Marketing (Large) */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              whileHover={{ y: -5 }}
              className="md:col-span-4 md:row-span-2 group"
            >
              <Card className="h-full border-0 bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl shadow-2xl shadow-blue-500/5 hover:shadow-blue-500/10 transition-all duration-500 overflow-hidden flex flex-col">
                <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
                  <TrendingUp className="w-48 h-48 text-blue-600 rotate-12" />
                </div>
                <CardContent className="p-8 md:p-12 flex flex-col h-full relative z-10">
                  <div className="w-16 h-16 rounded-2xl bg-blue-600 flex items-center justify-center mb-8 shadow-xl shadow-blue-600/20 group-hover:scale-110 transition-transform">
                    <TrendingUp className="w-8 h-8 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-3xl font-extrabold mb-4 group-hover:text-blue-600 transition-colors">Growth Marketing & Ads</h3>
                    <p className="text-lg text-slate-600 dark:text-slate-400 leading-relaxed mb-8 max-w-xl">
                      We don't just "run ads"—we build high-converting growth engines. From pixel tracking to creative optimization, we handle the full funnel.
                    </p>
                    <div className="grid grid-cols-2 gap-4 mb-8">
                      {['Social Ads', 'Google Search', 'Retargeting', 'Email Funnels'].map(item => (
                        <div key={item} className="flex items-center gap-2 text-sm font-bold text-slate-700 dark:text-slate-300">
                          <CheckCircle className="w-4 h-4 text-blue-500" />
                          {item}
                        </div>
                      ))}
                    </div>
                  </div>
                  <Link href="/signup">
                    <Button className="w-fit bg-blue-600 hover:bg-blue-700 text-white rounded-full px-8 py-6 h-auto font-bold group shadow-lg shadow-blue-600/20">
                      Get Started <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </motion.div>

            {/* Feature: Content Creation (Medium) */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              whileHover={{ y: -5 }}
              className="md:col-span-2 group"
            >
              <Card className="h-full border-0 bg-purple-600 text-white shadow-2xl shadow-purple-500/20 hover:shadow-purple-500/30 transition-all duration-500 overflow-hidden min-h-[300px]">
                <div className="absolute -bottom-10 -right-10 opacity-20 group-hover:scale-110 transition-transform duration-700">
                  <Pencil className="w-40 h-40" />
                </div>
                <CardContent className="p-8 relative z-10 flex flex-col h-full">
                  <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center mb-6">
                    <Pencil className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold mb-2">Content Engine</h3>
                  <p className="text-purple-100 leading-relaxed mb-6">
                    Viral-worthy reels, professional copy, and stunning graphics delivered weekly.
                  </p>
                  <div className="mt-auto">
                    <Badge className="bg-white/20 hover:bg-white/30 text-white border-0 py-1.5 px-3">Unlimited Requests</Badge>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Feature: AI Automation (Small) */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              whileHover={{ y: -5 }}
              className="md:col-span-2 group"
            >
              <Card className="h-full border-0 bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl shadow-2xl shadow-orange-500/5 hover:shadow-orange-500/10 transition-all duration-500">
                <CardContent className="p-8">
                  <div className="w-12 h-12 rounded-xl bg-orange-500 flex items-center justify-center mb-6 shadow-lg shadow-orange-500/20">
                    <Bot className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-xl font-bold mb-2 flex items-center gap-2">
                    AI Systems
                    <Badge className="bg-orange-100 text-orange-600 text-[10px] uppercase border-0 font-bold">Beta</Badge>
                  </h3>
                  <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">
                    Custom AI chatbots and workflow automations that save you 20+ hours per week.
                  </p>
                </CardContent>
              </Card>
            </motion.div>

            {/* Feature: Web & Apps (Wide) */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3 }}
              whileHover={{ y: -5 }}
              className="md:col-span-3 group"
            >
              <Card className="h-full border-0 bg-slate-900 text-white shadow-2xl transition-all duration-500 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-transparent"></div>
                <CardContent className="p-8 flex items-center gap-8 relative z-10 h-full">
                  <div className="flex-1">
                    <div className="w-12 h-12 rounded-xl bg-emerald-500 flex items-center justify-center mb-6 shadow-lg shadow-emerald-500/20">
                      <Globe className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="text-2xl font-bold mb-2">High-Perf Web</h3>
                    <p className="text-slate-400 text-sm leading-relaxed">
                      Custom websites and web-apps built for speed, SEO, and conversion from day one.
                    </p>
                  </div>
                  <div className="hidden sm:block w-32 h-32 rounded-full border-4 border-dashed border-emerald-500/30 animate-[spin_20s_linear_infinite] flex items-center justify-center shrink-0">
                    <Zap className="w-12 h-12 text-emerald-500 shadow-glow shadow-emerald-500/50" />
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Feature: SEO (Small) */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.4 }}
              whileHover={{ y: -5 }}
              className="md:col-span-3 group"
            >
              <Card className="h-full border-0 bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl shadow-2xl shadow-green-500/5 hover:shadow-green-500/10 transition-all duration-500">
                <CardContent className="p-8 flex items-center gap-6">
                  <div className="w-12 h-12 rounded-xl bg-green-500 flex items-center justify-center shrink-0 shadow-lg shadow-green-500/20">
                    <Target className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold mb-1 group-hover:text-green-600 transition-colors">SEO Dominance</h3>
                    <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">Rank #1 for your high-value keywords and stay there with our evergreen strategies.</p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
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

          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-6 gap-4 sm:gap-6 md:gap-8 items-center justify-items-center">
            {/* Social Media */}
            <motion.div 
              whileHover={{ scale: 1.1, rotate: 5 }}
              className="text-center group w-full"
            >
              <div className="w-14 h-14 sm:w-18 sm:h-18 md:w-20 md:h-20 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mb-2 sm:mb-4 mx-auto shadow-lg group-hover:shadow-xl transition-all">
                <span className="text-white text-base sm:text-xl md:text-2xl font-bold">FB</span>
              </div>
              <p className="text-[10px] sm:text-sm font-semibold text-gray-700">Facebook</p>
            </motion.div>

            <motion.div 
              whileHover={{ scale: 1.1, rotate: -5 }}
              className="text-center group w-full"
            >
              <div className="w-14 h-14 sm:w-18 sm:h-18 md:w-20 md:h-20 bg-white rounded-2xl flex items-center justify-center mb-2 sm:mb-4 mx-auto shadow-lg group-hover:shadow-xl transition-all border border-gray-100">
                <img src={tiktokLogo} alt="TikTok" className="w-8 h-8 sm:w-12 sm:h-12 md:w-14 md:h-14 object-contain" />
              </div>
              <p className="text-[10px] sm:text-sm font-semibold text-gray-700">TikTok</p>
            </motion.div>

            <motion.div 
              whileHover={{ scale: 1.1, rotate: 5 }}
              className="text-center group w-full"
            >
              <div className="w-14 h-14 sm:w-18 sm:h-18 md:w-20 md:h-20 bg-gradient-to-br from-blue-400 to-blue-500 rounded-2xl flex items-center justify-center mb-2 sm:mb-4 mx-auto shadow-lg group-hover:shadow-xl transition-all">
                <span className="text-white text-base sm:text-xl md:text-2xl font-bold">TW</span>
              </div>
              <p className="text-[10px] sm:text-sm font-semibold text-gray-700">Twitter/X</p>
            </motion.div>

            <motion.div 
              whileHover={{ scale: 1.1, rotate: -5 }}
              className="text-center group w-full"
            >
              <div className="w-14 h-14 sm:w-18 sm:h-18 md:w-20 md:h-20 bg-gradient-to-br from-red-500 to-red-600 rounded-2xl flex items-center justify-center mb-2 sm:mb-4 mx-auto shadow-lg group-hover:shadow-xl transition-all">
                <span className="text-white text-base sm:text-xl md:text-2xl font-bold">YT</span>
              </div>
              <p className="text-[10px] sm:text-sm font-semibold text-gray-700">YouTube</p>
            </motion.div>

            <motion.div 
              whileHover={{ scale: 1.1, rotate: 5 }}
              className="text-center group w-full"
            >
              <div className="w-14 h-14 sm:w-18 sm:h-18 md:w-20 md:h-20 bg-white rounded-2xl flex items-center justify-center mb-2 sm:mb-4 mx-auto shadow-lg group-hover:shadow-xl transition-all border border-gray-100">
                <img src={linkedinLogo} alt="LinkedIn" className="w-8 h-8 sm:w-12 sm:h-12 md:w-14 md:h-14 object-contain" />
              </div>
              <p className="text-[10px] sm:text-sm font-semibold text-gray-700">LinkedIn</p>
            </motion.div>

            <motion.div 
              whileHover={{ scale: 1.1, rotate: -5 }}
              className="text-center group w-full"
            >
              <div className="w-14 h-14 sm:w-18 sm:h-18 md:w-20 md:h-20 bg-white rounded-2xl flex items-center justify-center mb-2 sm:mb-4 mx-auto shadow-lg group-hover:shadow-xl transition-all border border-gray-100">
                <img src={instagramLogo} alt="Instagram" className="w-8 h-8 sm:w-12 sm:h-12 md:w-14 md:h-14 object-contain" />
              </div>
              <p className="text-[10px] sm:text-sm font-semibold text-gray-700">Instagram</p>
            </motion.div>

            {/* Search & Ads */}
            <motion.div 
              whileHover={{ scale: 1.1, rotate: 5 }}
              className="text-center group w-full"
            >
              <div className="w-14 h-14 sm:w-18 sm:h-18 md:w-20 md:h-20 bg-white rounded-2xl flex items-center justify-center mb-2 sm:mb-4 mx-auto shadow-lg group-hover:shadow-xl transition-all border border-gray-100">
                <img src={googleAdsLogo} alt="Google Ads" className="w-8 h-8 sm:w-12 sm:h-12 md:w-14 md:h-14 object-contain" />
              </div>
              <p className="text-[10px] sm:text-sm font-semibold text-gray-700">Google Ads</p>
            </motion.div>

            <motion.div 
              whileHover={{ scale: 1.1, rotate: -5 }}
              className="text-center group w-full"
            >
              <div className="w-14 h-14 sm:w-18 sm:h-18 md:w-20 md:h-20 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl flex items-center justify-center mb-2 sm:mb-4 mx-auto shadow-lg group-hover:shadow-xl transition-all">
                <span className="text-white text-base sm:text-xl md:text-2xl font-bold">SEO</span>
              </div>
              <p className="text-[10px] sm:text-sm font-semibold text-gray-700">SEO</p>
            </motion.div>

            <motion.div 
              whileHover={{ scale: 1.1, rotate: 5 }}
              className="text-center group w-full"
            >
              <div className="w-14 h-14 sm:w-18 sm:h-18 md:w-20 md:h-20 bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl flex items-center justify-center mb-2 sm:mb-4 mx-auto shadow-lg group-hover:shadow-xl transition-all">
                <span className="text-white text-base sm:text-xl md:text-2xl font-bold">EM</span>
              </div>
              <p className="text-[10px] sm:text-sm font-semibold text-gray-700">Email</p>
            </motion.div>

            <motion.div 
              whileHover={{ scale: 1.1, rotate: -5 }}
              className="text-center group w-full"
            >
              <div className="w-14 h-14 sm:w-18 sm:h-18 md:w-20 md:h-20 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-2xl flex items-center justify-center mb-2 sm:mb-4 mx-auto shadow-lg group-hover:shadow-xl transition-all">
                <span className="text-white text-base sm:text-xl md:text-2xl font-bold">GA</span>
              </div>
              <p className="text-[10px] sm:text-sm font-semibold text-gray-700">Analytics</p>
            </motion.div>

            <motion.div 
              whileHover={{ scale: 1.1, rotate: 5 }}
              className="text-center group w-full"
            >
              <div className="w-14 h-14 sm:w-18 sm:h-18 md:w-20 md:h-20 bg-gradient-to-br from-teal-500 to-teal-600 rounded-2xl flex items-center justify-center mb-2 sm:mb-4 mx-auto shadow-lg group-hover:shadow-xl transition-all">
                <span className="text-white text-base sm:text-xl md:text-2xl font-bold">CR</span>
              </div>
              <p className="text-[10px] sm:text-sm font-semibold text-gray-700">Conversion</p>
            </motion.div>

            <motion.div 
              whileHover={{ scale: 1.1, rotate: -5 }}
              className="text-center group w-full"
            >
              <div className="w-14 h-14 sm:w-18 sm:h-18 md:w-20 md:h-20 bg-gradient-to-br from-rose-500 to-rose-600 rounded-2xl flex items-center justify-center mb-2 sm:mb-4 mx-auto shadow-lg group-hover:shadow-xl transition-all">
                <span className="text-white text-base sm:text-xl md:text-2xl font-bold">+</span>
              </div>
              <p className="text-[10px] sm:text-sm font-semibold text-gray-700">More</p>
            </motion.div>
          </div>

          <div className="mt-8 text-center">
            <p className="text-sm text-muted-foreground">
              Don't see your preferred channel? <span className="text-blue-600 font-semibold">We can work on any platform!</span>
            </p>
          </div>
        </div>
      </section>

      {/* Free Social Audit Section - Modernized */}
      <motion.section 
        id="audit"
        className="py-24 md:py-32 px-4 relative overflow-hidden bg-slate-50 dark:bg-slate-950"
      >
        <div className="container mx-auto max-w-6xl relative z-10">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <motion.div 
              initial={{ x: -30, opacity: 0 }}
              whileInView={{ x: 0, opacity: 1 }}
              viewport={{ once: true }}
            >
              <Badge className="bg-orange-500/10 text-orange-600 mb-6 px-4 py-1.5 rounded-full font-bold uppercase tracking-widest text-[10px]">
                Diagnostic Engine
              </Badge>
              <h2 className="text-3xl md:text-6xl font-black mb-6 md:mb-8 leading-[1.1] tracking-tighter text-slate-900 dark:text-white">
                Is your social media <br className="hidden sm:block" />
                <span className="text-orange-500">working or wasting?</span>
              </h2>
              <p className="text-lg md:text-xl text-slate-600 dark:text-slate-400 mb-8 leading-relaxed">
                Most businesses are one small tweak away from doubling their engagement. Our AI-powered diagnostic engine scans your presence and identifies the exact growth bottlenecks.
              </p>
              
              <div className="grid grid-cols-2 gap-4 md:gap-6">
                {[
                  { label: "Data-Points Scanned", val: "50+" },
                  { label: "Analysis Time", val: "< 60s" },
                  { label: "Cost", val: "$0.00" },
                  { label: "Insights", val: "Actionable" }
                ].map((stat, i) => (
                  <div key={i} className="bg-white dark:bg-slate-900 p-3 md:p-4 rounded-xl md:rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
                    <p className="text-xl md:text-2xl font-black text-slate-900 dark:text-white">{stat.val}</p>
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest leading-tight">{stat.label}</p>
                  </div>
                ))}
              </div>
            </motion.div>

            <motion.div
              initial={{ x: 30, opacity: 0 }}
              whileInView={{ x: 0, opacity: 1 }}
              viewport={{ once: true }}
            >
              {!showResults ? (
                <Card className="border-0 bg-white dark:bg-slate-900 shadow-3xl rounded-[2.5rem] overflow-hidden p-1 relative group">
                  <div className="absolute inset-0 bg-gradient-to-br from-orange-500/20 to-blue-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                  <CardContent className="p-8 md:p-12 relative z-10">
                    <h3 className="text-2xl font-bold mb-8 text-center">Run Your Growth Scan</h3>
                    <form onSubmit={handleAuditSubmit} className="space-y-6">
                      <div className="space-y-4">
                        <div className="relative">
                          <Globe className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                          <Input
                            type="url"
                            placeholder="Website URL (required)"
                            value={auditForm.website}
                            onChange={(e) => setAuditForm({...auditForm, website: e.target.value})}
                            className="pl-12 bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 h-14 text-lg rounded-xl focus:ring-orange-500"
                            required
                          />
                        </div>
                        <div className="relative">
                          <img src={instagramLogo} alt="IG" className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 grayscale opacity-50" />
                          <Input
                            type="url"
                            placeholder="Instagram URL (optional)"
                            value={auditForm.instagramUrl}
                            onChange={(e) => setAuditForm({...auditForm, instagramUrl: e.target.value})}
                            className="pl-12 bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 h-14 text-lg rounded-xl focus:ring-orange-500"
                          />
                        </div>
                      </div>
                      <Button 
                        type="submit" 
                        size="lg"
                        disabled={auditMutation.isPending}
                        className="w-full bg-orange-500 hover:bg-orange-600 text-white font-black text-lg h-16 rounded-xl shadow-xl shadow-orange-500/20"
                      >
                        {auditMutation.isPending ? (
                          <span className="flex items-center gap-3">
                            <span className="animate-spin rounded-full h-5 w-5 border-2 border-white/30 border-t-white"></span>
                            SCANNING SYSTEMS...
                          </span>
                        ) : "START ENGINE SCAN →"}
                      </Button>
                      <p className="text-center text-xs text-slate-400 font-medium">
                        We never share your data. 100% private analysis.
                      </p>
                    </form>
                  </CardContent>
                </Card>
              ) : (
                <Card className="border-0 bg-slate-900 text-white shadow-3xl rounded-[2.5rem] p-12 overflow-hidden">
                  <div className="text-center space-y-8">
                    <div className="w-24 h-24 bg-green-500 rounded-full flex items-center justify-center mx-auto shadow-glow shadow-green-500/50">
                      <CheckCircle className="w-12 h-12 text-white" />
                    </div>
                    <h3 className="text-3xl font-black">Analysis Complete!</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-white/5 p-6 rounded-2xl border border-white/10">
                        <p className="text-4xl font-black text-green-400">{auditResults.summary?.score || 72}</p>
                        <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-2">Efficiency Score</p>
                      </div>
                      <div className="bg-white/5 p-6 rounded-2xl border border-white/10">
                        <p className="text-4xl font-black text-orange-400">{auditResults.summary?.totalIssues || 12}</p>
                        <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-2">Key Bottlenecks</p>
                      </div>
                    </div>
                    <Button 
                      onClick={() => setShowResults(false)}
                      variant="ghost"
                      className="text-slate-400 hover:text-white"
                    >
                      ← Run New Scan
                    </Button>
                    <Link href="/signup">
                      <Button className="w-full bg-blue-600 hover:bg-blue-700 h-16 rounded-xl font-black text-lg shadow-xl shadow-blue-600/20">
                        Fix All Bottlenecks Now
                      </Button>
                    </Link>
                  </div>
                </Card>
              )}
            </motion.div>
          </div>
        </div>
      </motion.section>

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
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-12">
            <div className="text-center p-4 md:p-6 bg-gradient-to-br from-blue-50 to-white rounded-xl border border-blue-100 hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 md:w-16 md:h-16 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center mx-auto mb-3 shadow-lg">
                <CheckCircle className="w-6 h-6 md:w-8 md:h-8 text-white" />
              </div>
              <p className="font-bold text-base md:text-lg text-gray-900">98%</p>
              <p className="text-[10px] md:text-sm text-muted-foreground uppercase tracking-widest font-bold">Client Satisfaction</p>
            </div>

            <div className="text-center p-4 md:p-6 bg-gradient-to-br from-green-50 to-white rounded-xl border border-green-100 hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 md:w-16 md:h-16 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center mx-auto mb-3 shadow-lg">
                <Target className="w-6 h-6 md:w-8 md:h-8 text-white" />
              </div>
              <p className="font-bold text-base md:text-lg text-gray-900">310%</p>
              <p className="text-[10px] md:text-sm text-muted-foreground uppercase tracking-widest font-bold">Avg ROI Increase</p>
            </div>

            <div className="text-center p-4 md:p-6 bg-gradient-to-br from-orange-50 to-white rounded-xl border border-orange-100 hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 md:w-16 md:h-16 rounded-full bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center mx-auto mb-3 shadow-lg">
                <Zap className="w-6 h-6 md:w-8 md:h-8 text-white" />
              </div>
              <p className="font-bold text-base md:text-lg text-gray-900">7-10 Days</p>
              <p className="text-[10px] md:text-sm text-muted-foreground uppercase tracking-widest font-bold">Fast Launch</p>
            </div>

            <div className="text-center p-4 md:p-6 bg-gradient-to-br from-purple-50 to-white rounded-xl border border-purple-100 hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 md:w-16 md:h-16 rounded-full bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center mx-auto mb-3 shadow-lg">
                <Users className="w-6 h-6 md:w-8 md:h-8 text-white" />
              </div>
              <p className="font-bold text-base md:text-lg text-gray-900">500+</p>
              <p className="text-[10px] md:text-sm text-muted-foreground uppercase tracking-widest font-bold">Happy Clients</p>
            </div>
          </div>

          {/* Core Values Row */}
          <div className="grid md:grid-cols-3 gap-6">
            <Card className="p-6 text-center hover-lift bg-gradient-to-br from-white to-blue-50 border-blue-100">
              <div className="text-4xl mb-3">🎯</div>
              <h3 className="font-bold text-lg mb-2">Professional Results</h3>
              <p className="text-sm text-muted-foreground">
                We're obsessed with your ROI. Every campaign is designed to deliver measurable business growth.
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
                Get Started
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
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
                  Get Started
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
      <section className="py-24 md:py-32 px-4 relative overflow-hidden bg-slate-900 text-white">
        {/* Animated background lines */}
        <div className="absolute inset-0 opacity-20 pointer-events-none">
          <div className="absolute top-0 left-1/4 w-px h-full bg-gradient-to-b from-transparent via-blue-500 to-transparent"></div>
          <div className="absolute top-0 left-2/4 w-px h-full bg-gradient-to-b from-transparent via-purple-500 to-transparent"></div>
          <div className="absolute top-0 left-3/4 w-px h-full bg-gradient-to-b from-transparent via-blue-500 to-transparent"></div>
        </div>

        <div className="container mx-auto max-w-7xl relative z-10">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <Badge className="bg-blue-500 text-white mb-6 border-0">Why MarketingOS?</Badge>
              <h2 className="text-4xl md:text-6xl font-black mb-8 leading-[1.1]">
                We're not an agency. <br />
                <span className="text-blue-500">We're your core growth team.</span>
              </h2>
              <p className="text-xl text-slate-400 mb-12 leading-relaxed">
                Traditional agencies are slow, expensive, and often disconnected. We built MarketingOS to give you an elite, high-speed marketing department that lives inside your business.
              </p>
              
              <div className="space-y-8">
                {[
                  { title: "Real-Time Collaboration", desc: "No more waiting for email replies. Chat with your team directly via our platform.", icon: MessageSquare },
                  { title: "Infinite Scalability", desc: "Scale your creative and ad spend up or down instantly as your business grows.", icon: TrendingUp },
                  { title: "Data-First Decisioning", desc: "Every campaign is backed by deep analytics and cross-platform data intelligence.", icon: BarChart3 }
                ].map((item, i) => (
                  <div key={i} className="flex gap-6">
                    <div className="w-14 h-14 rounded-2xl bg-blue-500/10 flex items-center justify-center shrink-0 border border-blue-500/20">
                      <item.icon className="w-7 h-7 text-blue-500" />
                    </div>
                    <div>
                      <h4 className="text-xl font-bold mb-2">{item.title}</h4>
                      <p className="text-slate-400 leading-relaxed">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative">
              <div className="absolute inset-0 bg-blue-600/20 blur-[120px] rounded-full"></div>
              <Card className="bg-slate-800/50 backdrop-blur-xl border-slate-700/50 p-6 md:p-12 relative z-10 rounded-[2rem] md:rounded-[2.5rem] shadow-3xl">
                <div className="text-center mb-8">
                  <div className="w-16 h-16 md:w-20 md:h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6 border border-green-500/30">
                    <ShieldCheck className="w-8 h-8 md:w-10 md:h-10 text-green-500" />
                  </div>
                  <h3 className="text-2xl md:text-3xl font-black mb-4">Performance Focused</h3>
                  <p className="text-slate-400 leading-relaxed italic text-sm md:text-base">
                    "We don't just provide services; we deliver measurable results that impact your bottom line every single day."
                  </p>
                </div>
                <Separator className="bg-slate-700 mb-8" />
                <div className="grid grid-cols-2 gap-4 md:gap-8">
                  <div className="text-center">
                    <p className="text-3xl md:text-4xl font-black text-white mb-1">100%</p>
                    <p className="text-[10px] md:text-xs font-bold text-slate-500 uppercase tracking-widest">Transparency</p>
                  </div>
                  <div className="text-center">
                    <p className="text-3xl md:text-4xl font-black text-blue-500 mb-1">24/7</p>
                    <p className="text-[10px] md:text-xs font-bold text-slate-500 uppercase tracking-widest">Dashboards</p>
                  </div>
                </div>
                <Link href="/signup">
                  <Button className="w-full mt-8 md:mt-10 bg-white text-slate-900 hover:bg-slate-100 h-14 md:h-16 rounded-xl md:rounded-2xl font-black text-base md:text-lg">
                    Join the Elite 1%
                  </Button>
                </Link>
              </Card>
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
                  <li><strong>High-speed implementation:</strong> Most campaigns launch in 7-10 days</li>
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
                Get Started
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
                🚀 Get Started
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
                <p className="text-xs opacity-90">Scale your brand today</p>
              </div>
              <Link href="/signup">
                <Button size="sm" className="bg-white text-orange-600 hover:bg-gray-100 font-bold border-0 shrink-0">
                  Get Started
                </Button>
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="border-t py-12 px-4 bg-background pb-32 md:pb-12">
        <div className="container mx-auto max-w-6xl">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-x-4 gap-y-10 mb-12">
            <div className="col-span-2 md:col-span-1">
              <FooterLogo className="mb-4" />
              <p className="text-sm text-muted-foreground leading-relaxed">
                Your go-to remote marketing team. We help businesses, influencers, and entrepreneurs grow with results-driven digital marketing.
              </p>
            </div>
            <div>
              <h3 className="font-bold text-slate-900 mb-4 uppercase tracking-widest text-[10px]">Services</h3>
              <ul className="space-y-3 text-sm text-muted-foreground">
                <li className="hover:text-primary transition-colors cursor-pointer">Digital Marketing</li>
                <li className="hover:text-primary transition-colors cursor-pointer">Web Dev & CRMs</li>
                <li className="hover:text-primary transition-colors cursor-pointer">Content Creation</li>
                <li className="hover:text-primary transition-colors cursor-pointer">AI Automation</li>
              </ul>
            </div>
            <div>
              <h3 className="font-bold text-slate-900 mb-4 uppercase tracking-widest text-[10px]">Quick Links</h3>
              <ul className="space-y-3 text-sm text-muted-foreground">
                <li><Link href="/login" className="hover:text-primary transition-colors">Login</Link></li>
                <li className="hover:text-primary transition-colors cursor-pointer">About Us</li>
                <li className="hover:text-primary transition-colors cursor-pointer">Contact Us</li>
                <li className="hover:text-primary transition-colors cursor-pointer">Privacy</li>
              </ul>
            </div>
          </div>
          <div className="border-t pt-8 text-center text-[10px] sm:text-xs font-bold uppercase tracking-widest text-slate-400">
            Copyright © 2025 Marketing Team App, All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { ArrowRight, ArrowLeft, Building2, User, Target, CheckCircle, Star, TrendingUp, Users, Zap, Shield, Clock, Sparkles } from "lucide-react";
import mtaLogoBlue from "@assets/mta-logo-blue.png";

const signupSchema = z.object({
  // Company Information
  company: z.string().min(1, "Company name is required"),
  website: z.string().url("Must be a valid URL").or(z.literal("")),
  industry: z.string().optional(),
  companySize: z.string().optional(),
  
  // Contact Information
  name: z.string().min(1, "Your name is required"),
  email: z.string().email("Must be a valid email"),
  phone: z.string().min(1, "Phone number is required"),
  
  // Service Interests
  services: z.array(z.string()).min(1, "Please select at least one service"),
  budget: z.string().optional(),
  
  // Social Media Platforms
  socialPlatforms: z.array(z.string()).optional(),
  instagramUrl: z.string().optional(),
  facebookUrl: z.string().optional(),
  tiktokUrl: z.string().optional(),
  linkedinUrl: z.string().optional(),
  twitterUrl: z.string().optional(),
  youtubeUrl: z.string().optional(),
  
  notes: z.string().optional(),
});

type SignupFormData = z.infer<typeof signupSchema>;

export default function SignupPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [step, setStep] = useState(1);
  const [auditResults, setAuditResults] = useState<any>(null);
  const [canSubmit, setCanSubmit] = useState(false);

  const form = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      company: "",
      website: "",
      industry: "",
      companySize: "",
      name: "",
      email: "",
      phone: "",
      services: [],
      budget: "",
      socialPlatforms: [],
      instagramUrl: "",
      facebookUrl: "",
      tiktokUrl: "",
      linkedinUrl: "",
      twitterUrl: "",
      youtubeUrl: "",
      notes: "",
    },
  });

  const earlyLeadCaptureMutation = useMutation({
    mutationFn: async (data: { name: string; email: string; phone: string; company: string; website?: string; industry?: string }) => {
      const response = await apiRequest("POST", "/api/early-lead", data);
      return response.json();
    },
    onSuccess: () => {
      console.log("✅ Early lead captured after step 2");
    },
    onError: (error) => {
      console.error("❌ Failed to capture early lead:", error);
    },
  });

  const signupMutation = useMutation({
    mutationFn: async (data: SignupFormData) => {
      const response = await apiRequest("POST", "/api/signup", data);
      const result = await response.json();
      return result;
    },
    onSuccess: (result) => {
      setAuditResults(result.audit);
      toast({
        title: "🎉 Your Free Audit is Ready!",
        description: "Check out your personalized marketing insights below.",
      });
      setStep(5); // Show results page
    },
    onError: (error: Error) => {
      toast({
        title: "Signup Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: SignupFormData) => {
    signupMutation.mutate(data);
  };

  const nextStep = async () => {
    const fields = step === 1 
      ? ["company", "website", "industry", "companySize"] as const
      : step === 2 
      ? ["name", "email", "phone"] as const
      : step === 3
      ? ["services"] as const
      : [];
    
    const isValid = await form.trigger(fields);
    if (isValid) {
      // Capture lead early after step 2 (contact info completed)
      if (step === 2) {
        const formData = form.getValues();
        earlyLeadCaptureMutation.mutate({
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          company: formData.company,
          website: formData.website || undefined,
          industry: formData.industry || undefined,
        });
      }
      
      const nextStepNum = step + 1;
      setStep(nextStepNum);
      
      // Enable submit only when reaching step 4
      if (nextStepNum === 4) {
        // Add a longer delay to give user time to enter URLs
        setTimeout(() => {
          setCanSubmit(true);
        }, 3000); // 3 seconds should be enough
      } else {
        setCanSubmit(false);
      }
    }
  };

  const services = [
    "Digital Marketing",
    "SEO Optimization",
    "Social Media Management",
    "Content Marketing",
    "Web Development",
    "Mobile App Development",
    "Graphic Design",
    "Email Marketing",
    "PPC Advertising",
    "Analytics & Reporting",
  ];

  const socialPlatforms = [
    { name: "Instagram", value: "instagram", icon: "📸", color: "from-pink-500 to-purple-500" },
    { name: "Facebook", value: "facebook", icon: "👥", color: "from-blue-500 to-blue-600" },
    { name: "TikTok", value: "tiktok", icon: "🎵", color: "from-black to-gray-800" },
    { name: "LinkedIn", value: "linkedin", icon: "💼", color: "from-blue-600 to-blue-700" },
    { name: "Twitter/X", value: "twitter", icon: "🐦", color: "from-blue-400 to-blue-500" },
    { name: "YouTube", value: "youtube", icon: "📺", color: "from-red-500 to-red-600" },
  ];

  if (step === 5) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-4">
        <div className="max-w-5xl mx-auto py-12">
          {/* Success Header */}
          <div className="text-center mb-12">
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center mx-auto mb-6 shadow-2xl">
              <CheckCircle className="w-12 h-12 text-white" />
            </div>
            <h1 className="text-5xl font-black mb-4 bg-gradient-to-r from-green-500 to-emerald-600 bg-clip-text text-transparent">
              🎉 Your FREE Audit is Ready!
            </h1>
            <p className="text-xl text-gray-600 mb-4">
              Here's what we found about your digital presence
            </p>
            <Badge className="bg-gradient-to-r from-orange-500 to-pink-500 text-white text-lg px-6 py-2">
              Worth $2,500 • Yours FREE
            </Badge>
          </div>

          {/* Debug Info */}
          {auditResults && (
            <div className="mb-4 p-4 bg-gray-100 rounded text-xs">
              <details>
                <summary className="cursor-pointer font-bold">🔍 Debug: View Raw Audit Data</summary>
                <pre className="mt-2 overflow-auto">{JSON.stringify(auditResults, null, 2)}</pre>
              </details>
            </div>
          )}

          {/* Audit Summary */}
          {auditResults && (
            <div className="space-y-8">
              {/* Overview Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="border-0 shadow-xl bg-gradient-to-br from-blue-50 to-cyan-50">
                  <CardHeader>
                    <CardTitle className="text-center">Total Issues Found</CardTitle>
                  </CardHeader>
                  <CardContent className="text-center">
                    <div className="text-5xl font-black text-blue-600">{auditResults.summary?.totalIssues || 0}</div>
                  </CardContent>
                </Card>
                <Card className="border-0 shadow-xl bg-gradient-to-br from-red-50 to-orange-50">
                  <CardHeader>
                    <CardTitle className="text-center">Critical Issues</CardTitle>
                  </CardHeader>
                  <CardContent className="text-center">
                    <div className="text-5xl font-black text-red-600">{auditResults.summary?.criticalIssues || 0}</div>
                  </CardContent>
                </Card>
                <Card className="border-0 shadow-xl bg-gradient-to-br from-green-50 to-emerald-50">
                  <CardHeader>
                    <CardTitle className="text-center">Audit Value</CardTitle>
                  </CardHeader>
                  <CardContent className="text-center">
                    <div className="text-5xl font-black text-green-600">${auditResults.summary?.estimatedValue || 2500}</div>
                  </CardContent>
                </Card>
              </div>

              {/* Website Audit Results */}
              {auditResults.website && (
                <Card className="border-0 shadow-2xl">
                  <CardHeader className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-t-lg">
                    <CardTitle className="text-2xl flex items-center gap-3">
                      🌐 Website Audit Results
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6 space-y-6">
                    {/* SEO Info */}
                    <div>
                      <h3 className="text-xl font-bold mb-3">SEO Analysis</h3>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        <div className="p-4 bg-gray-50 rounded-lg">
                          <p className="text-sm text-gray-600">Title Tag</p>
                          <p className="font-semibold truncate">{auditResults.website.seo.title || '❌ Missing'}</p>
                        </div>
                        <div className="p-4 bg-gray-50 rounded-lg">
                          <p className="text-sm text-gray-600">SSL/HTTPS</p>
                          <p className="font-semibold">{auditResults.website.seo.hasSSL ? '✅ Enabled' : '❌ Missing'}</p>
                        </div>
                        <div className="p-4 bg-gray-50 rounded-lg">
                          <p className="text-sm text-gray-600">H1 Tags</p>
                          <p className="font-semibold">{auditResults.website.seo.h1Tags} found</p>
                        </div>
                        <div className="p-4 bg-gray-50 rounded-lg">
                          <p className="text-sm text-gray-600">Images</p>
                          <p className="font-semibold">{auditResults.website.seo.imageCount} total</p>
                        </div>
                        <div className="p-4 bg-gray-50 rounded-lg">
                          <p className="text-sm text-gray-600">Alt Tags Missing</p>
                          <p className="font-semibold">{auditResults.website.seo.imagesWithoutAlt}</p>
                        </div>
                        <div className="p-4 bg-gray-50 rounded-lg">
                          <p className="text-sm text-gray-600">Load Time</p>
                          <p className="font-semibold">{(auditResults.website.performance.loadTime / 1000).toFixed(2)}s</p>
                        </div>
                      </div>
                    </div>

                    {/* Recommendations */}
                    <div>
                      <h3 className="text-xl font-bold mb-3">🎯 Recommendations</h3>
                      <div className="space-y-2">
                        {auditResults.website.recommendations.map((rec: string, idx: number) => (
                          <div key={idx} className="p-3 bg-yellow-50 border-l-4 border-yellow-400 rounded">
                            <p className="text-sm font-medium">{rec}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Social Media Audit Results */}
              {auditResults.socialMedia && auditResults.socialMedia.length > 0 && (
                <Card className="border-0 shadow-2xl">
                  <CardHeader className="bg-gradient-to-r from-pink-500 to-purple-500 text-white rounded-t-lg">
                    <CardTitle className="text-2xl flex items-center gap-3">
                      📱 Social Media Audit Results
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6 space-y-4">
                    {auditResults.socialMedia.map((social: any, idx: number) => (
                      <div key={idx} className="p-6 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl">
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="text-xl font-bold capitalize">{social.platform}</h3>
                          {social.isValid ? (
                            <Badge className="bg-green-500 text-white">✅ Valid</Badge>
                          ) : (
                            <Badge className="bg-red-500 text-white">❌ Invalid</Badge>
                          )}
                        </div>
                        
                        {social.stats && (
                          <div className="grid grid-cols-3 gap-4 mb-4">
                            {social.stats.followers !== undefined && (
                              <div className="text-center p-3 bg-white rounded-lg">
                                <p className="text-2xl font-black text-blue-600">{social.stats.followers.toLocaleString()}</p>
                                <p className="text-sm text-gray-600">Followers</p>
                              </div>
                            )}
                            {social.stats.following !== undefined && (
                              <div className="text-center p-3 bg-white rounded-lg">
                                <p className="text-2xl font-black text-green-600">{social.stats.following.toLocaleString()}</p>
                                <p className="text-sm text-gray-600">Following</p>
                              </div>
                            )}
                            {social.stats.posts !== undefined && (
                              <div className="text-center p-3 bg-white rounded-lg">
                                <p className="text-2xl font-black text-purple-600">{social.stats.posts.toLocaleString()}</p>
                                <p className="text-sm text-gray-600">Posts</p>
                              </div>
                            )}
                          </div>
                        )}

                        <div className="space-y-2">
                          {social.recommendations.map((rec: string, recIdx: number) => (
                            <div key={recIdx} className="p-2 bg-white rounded text-sm">
                              {rec}
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}

              {/* CTA Section */}
              <Card className="border-0 shadow-2xl bg-gradient-to-r from-orange-500 to-pink-500 text-white">
                <CardContent className="p-8 text-center">
                  <h2 className="text-3xl font-black mb-4">🚀 Ready to Fix These Issues?</h2>
                  <p className="text-xl mb-6">Our team will contact you within 24 hours with a custom strategy</p>
                  <div className="flex gap-4 justify-center">
          <Button 
            onClick={() => setLocation("/")} 
                      className="bg-white text-orange-500 hover:bg-gray-100 font-bold text-lg px-8 py-4"
          >
            Back to Home
          </Button>
                    <Button 
                      onClick={() => window.print()} 
                      variant="outline"
                      className="border-2 border-white text-white hover:bg-white/20 font-bold text-lg px-8 py-4"
                    >
                      📄 Download Report
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Fallback if no audit results */}
          {!auditResults && (
            <Card className="border-0 shadow-2xl">
              <CardContent className="p-12 text-center">
                <h2 className="text-2xl font-bold mb-4">Processing Your Audit...</h2>
                <p className="text-gray-600 mb-6">We're analyzing your digital presence. This may take a few moments.</p>
                <Button onClick={() => setLocation("/")} className="bg-gradient-to-r from-blue-600 to-blue-700">
                  Back to Home
                </Button>
              </CardContent>
        </Card>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <header className="border-b bg-white/95 backdrop-blur shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <img src={mtaLogoBlue} alt="Marketing Team App" className="h-12 w-auto" data-testid="img-logo" />
        </div>
      </header>

      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          {/* Hero Section */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 bg-gradient-to-r from-orange-500 to-pink-500 text-white px-6 py-3 rounded-full text-sm font-bold mb-6 shadow-lg">
              <Sparkles className="w-4 h-4" />
              🚀 Join 500+ Businesses Growing 3x Faster
            </div>
            <h1 className="text-6xl font-black mb-6 bg-gradient-to-r from-orange-500 via-pink-500 to-purple-600 bg-clip-text text-transparent leading-tight">
              Your Marketing
              <br />
              <span className="text-5xl">Dream Team</span>
              <br />
              <span className="text-4xl text-gray-700">Awaits</span>
            </h1>
            <p className="text-2xl text-gray-600 mb-8 max-w-3xl mx-auto font-medium">
              Stop struggling with marketing. Get a <span className="font-black text-orange-500">pro team</span> that delivers 
              <span className="font-black text-pink-500"> real results</span> in 30 days or less.
            </p>
            
            {/* Social Proof */}
            <div className="flex items-center justify-center gap-8 mb-8">
              <div className="flex items-center gap-2">
                <div className="flex -space-x-2">
                  {[1,2,3,4,5].map((i) => (
                    <div key={i} className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-400 to-purple-400 border-2 border-white" />
                  ))}
                </div>
                <span className="text-sm text-muted-foreground">500+ happy clients</span>
              </div>
              <div className="flex items-center gap-1">
                {[1,2,3,4,5].map((i) => (
                  <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                ))}
                <span className="text-sm font-medium ml-1">4.9/5 rating</span>
              </div>
            </div>
          </div>

          {/* Benefits Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
            <div className="text-center p-8 rounded-2xl bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200 hover:border-green-300 transition-all hover:scale-105">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-r from-green-500 to-emerald-500 flex items-center justify-center mx-auto mb-6 shadow-lg">
                <TrendingUp className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-black mb-3 text-green-700">3x Faster Growth</h3>
              <p className="text-gray-600 font-medium">Our clients see 3x faster growth compared to in-house teams</p>
            </div>
            <div className="text-center p-8 rounded-2xl bg-gradient-to-br from-blue-50 to-cyan-50 border-2 border-blue-200 hover:border-blue-300 transition-all hover:scale-105">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-r from-blue-500 to-cyan-500 flex items-center justify-center mx-auto mb-6 shadow-lg">
                <Zap className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-black mb-3 text-blue-700">24/7 Support</h3>
              <p className="text-gray-600 font-medium">Dedicated account manager and round-the-clock support</p>
            </div>
            <div className="text-center p-8 rounded-2xl bg-gradient-to-br from-purple-50 to-pink-50 border-2 border-purple-200 hover:border-purple-300 transition-all hover:scale-105">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center mx-auto mb-6 shadow-lg">
                <Shield className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-black mb-3 text-purple-700">Proven Results</h3>
              <p className="text-gray-600 font-medium">Data-driven strategies that deliver measurable ROI</p>
            </div>
          </div>

          {/* Urgency Section */}
          <div className="text-center mb-12 p-8 rounded-2xl bg-gradient-to-r from-orange-500 to-pink-500 text-white">
            <h2 className="text-3xl font-black mb-4">⚡ LIMITED TIME OFFER ⚡</h2>
            <p className="text-xl font-bold mb-2">Get Your FREE Marketing Audit ($2,500 Value)</p>
            <p className="text-lg opacity-90">Plus 30% OFF your first 3 months</p>
            <div className="flex items-center justify-center gap-4 mt-6">
              <div className="bg-white/20 px-4 py-2 rounded-full">
                <span className="font-bold">🎯 Custom Strategy</span>
              </div>
              <div className="bg-white/20 px-4 py-2 rounded-full">
                <span className="font-bold">📊 ROI Analysis</span>
              </div>
              <div className="bg-white/20 px-4 py-2 rounded-full">
                <span className="font-bold">🚀 Growth Plan</span>
              </div>
            </div>
          </div>

          {/* Progress Steps */}
          <div className="flex items-center justify-between mb-8">
            {[
              { num: 1, label: "Company", icon: Building2 },
              { num: 2, label: "Contact", icon: User },
              { num: 3, label: "Services", icon: Target },
              { num: 4, label: "Social URLs", icon: Users },
            ].map((s) => (
              <div key={s.num} className="flex items-center flex-1">
                <div className={`flex items-center gap-2 ${s.num < 3 ? 'flex-1' : ''}`}>
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                      step >= s.num
                        ? "bg-gradient-to-r from-blue-600 to-blue-700 text-white"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {step > s.num ? (
                      <CheckCircle className="w-5 h-5" />
                    ) : (
                      <s.icon className="w-5 h-5" />
                    )}
                  </div>
                  <span className={`text-sm font-medium hidden sm:inline ${step >= s.num ? "text-foreground" : "text-muted-foreground"}`}>
                    {s.label}
                  </span>
                </div>
                {s.num < 4 && (
                  <div className={`h-1 flex-1 mx-2 rounded-full ${step > s.num ? "bg-blue-600" : "bg-muted"}`} />
                )}
              </div>
            ))}
          </div>

          <Card className="p-8 shadow-2xl border-0 bg-white/90 backdrop-blur rounded-3xl">
            <div className="text-center mb-8">
              <h2 className="text-4xl font-black mb-4 bg-gradient-to-r from-orange-500 to-pink-500 bg-clip-text text-transparent">
                🎯 Get Your FREE Marketing Audit
              </h2>
              <p className="text-xl text-gray-600 font-medium">Tell us about your business and we'll create a custom growth plan worth $2,500</p>
              <div className="mt-4 inline-flex items-center gap-2 bg-green-100 text-green-800 px-4 py-2 rounded-full text-sm font-bold">
                <CheckCircle className="w-4 h-4" />
                No commitment required • 100% Free
              </div>
            </div>
            
            <Form {...form}>
              <form 
                onSubmit={(e) => {
                  if (step !== 4 || !canSubmit) {
                    e.preventDefault();
                    if (step === 4 && !canSubmit) {
                      toast({
                        title: "Please wait...",
                        description: "Form is loading, try again in a moment",
                      });
                    }
                    return false;
                  }
                  form.handleSubmit(onSubmit)(e);
                }} 
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    e.stopPropagation();
                  }
                }}
                className="space-y-6"
              >
                {/* Step 1: Company Information */}
                {step === 1 && (
                  <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                    <div>
                      <h2 className="text-2xl font-bold mb-2">Company Information</h2>
                      <p className="text-sm text-muted-foreground">Let's start with some basic details about your company.</p>
                    </div>

                    <FormField
                      control={form.control}
                      name="company"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Company Name *</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="Acme Inc." 
                              {...field} 
                              data-testid="input-company"
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  e.preventDefault();
                                }
                              }}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="website"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Website</FormLabel>
                          <FormControl>
                            <Input placeholder="https://example.com" {...field} data-testid="input-website" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="industry"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Industry</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger data-testid="select-industry">
                                <SelectValue placeholder="Select your industry" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="technology">Technology</SelectItem>
                              <SelectItem value="healthcare">Healthcare</SelectItem>
                              <SelectItem value="finance">Finance</SelectItem>
                              <SelectItem value="retail">Retail</SelectItem>
                              <SelectItem value="education">Education</SelectItem>
                              <SelectItem value="manufacturing">Manufacturing</SelectItem>
                              <SelectItem value="real-estate">Real Estate</SelectItem>
                              <SelectItem value="hospitality">Hospitality</SelectItem>
                              <SelectItem value="other">Other</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="companySize"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Company Size</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger data-testid="select-company-size">
                                <SelectValue placeholder="Select company size" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="1-10">1-10 employees</SelectItem>
                              <SelectItem value="11-50">11-50 employees</SelectItem>
                              <SelectItem value="51-200">51-200 employees</SelectItem>
                              <SelectItem value="201-500">201-500 employees</SelectItem>
                              <SelectItem value="500+">500+ employees</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                )}

                {/* Step 2: Contact Information */}
                {step === 2 && (
                  <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                    <div>
                      <h2 className="text-2xl font-bold mb-2">Contact Information</h2>
                      <p className="text-sm text-muted-foreground">How can we reach you?</p>
                    </div>

                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Full Name *</FormLabel>
                          <FormControl>
                            <Input placeholder="John Doe" {...field} data-testid="input-name" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email Address *</FormLabel>
                          <FormControl>
                            <Input type="email" placeholder="john@example.com" {...field} data-testid="input-email" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Phone Number *</FormLabel>
                          <FormControl>
                            <Input placeholder="+1 (555) 123-4567" {...field} data-testid="input-phone" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                )}

                {/* Step 3: Service Interests */}
                {step === 3 && (
                  <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                    <div>
                      <h2 className="text-2xl font-bold mb-2">What Services Interest You?</h2>
                      <p className="text-sm text-muted-foreground">Select all that apply to your needs.</p>
                    </div>

                    <FormField
                      control={form.control}
                      name="services"
                      render={() => (
                        <FormItem>
                          <FormLabel>Services * (Select at least one)</FormLabel>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2">
                            {services.map((service) => (
                              <FormField
                                key={service}
                                control={form.control}
                                name="services"
                                render={({ field }) => (
                                  <FormItem className="flex items-start space-x-2 space-y-0">
                                    <FormControl>
                                      <Checkbox
                                        checked={field.value?.includes(service)}
                                        onCheckedChange={(checked) => {
                                          return checked
                                            ? field.onChange([...field.value, service])
                                            : field.onChange(field.value?.filter((value) => value !== service));
                                        }}
                                        data-testid={`checkbox-${service.toLowerCase().replace(/\s+/g, "-")}`}
                                      />
                                    </FormControl>
                                    <FormLabel className="font-normal cursor-pointer">
                                      {service}
                                    </FormLabel>
                                  </FormItem>
                                )}
                              />
                            ))}
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="budget"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Monthly Budget Range</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger data-testid="select-budget">
                                <SelectValue placeholder="Select budget range" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="<5000">Less than $5,000</SelectItem>
                              <SelectItem value="5000-10000">$5,000 - $10,000</SelectItem>
                              <SelectItem value="10000-25000">$10,000 - $25,000</SelectItem>
                              <SelectItem value="25000-50000">$25,000 - $50,000</SelectItem>
                              <SelectItem value="50000+">$50,000+</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="notes"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Additional Notes</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Tell us more about your project goals and any specific requirements..."
                              className="min-h-24"
                              {...field}
                              data-testid="textarea-notes"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                )}

                {/* Step 4: Social Media URLs */}
                {step === 4 && (
                  <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                    <div>
                      <h2 className="text-2xl font-bold mb-2">🔗 Your Social Media URLs</h2>
                      <p className="text-sm text-muted-foreground">Provide your current social media profiles so we can analyze them (Optional - but recommended for complete audit)</p>
                    </div>

                    <div className="space-y-4" onClick={(e) => e.stopPropagation()}>
                      <FormField
                        control={form.control}
                        name="instagramUrl"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="flex items-center gap-2">
                              <span className="text-xl">📸</span>
                              Instagram URL
                            </FormLabel>
                            <FormControl>
                              <Input 
                                type="text"
                                placeholder="https://instagram.com/yourusername" 
                                value={field.value || ''} 
                                onChange={(e) => {
                                  field.onChange(e);
                                  // Enable submit when user starts typing
                                  if (!canSubmit && e.target.value.length > 0) {
                                    setCanSubmit(true);
                                  }
                                }}
                                onBlur={field.onBlur}
                                name={field.name}
                                className="w-full"
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    e.preventDefault();
                                    e.stopPropagation();
                                  }
                                }}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="facebookUrl"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="flex items-center gap-2">
                              <span className="text-xl">👥</span>
                              Facebook URL
                            </FormLabel>
                            <FormControl>
                              <Input 
                                type="text"
                                placeholder="https://facebook.com/yourusername" 
                                value={field.value || ''} 
                                onChange={field.onChange}
                                onBlur={field.onBlur}
                                name={field.name}
                                className="w-full"
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    e.preventDefault();
                                    e.stopPropagation();
                                  }
                                }}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="tiktokUrl"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="flex items-center gap-2">
                              <span className="text-xl">🎵</span>
                              TikTok URL
                            </FormLabel>
                            <FormControl>
                              <Input 
                                type="text"
                                placeholder="https://tiktok.com/@yourusername" 
                                value={field.value || ''} 
                                onChange={field.onChange}
                                onBlur={field.onBlur}
                                name={field.name}
                                className="w-full"
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    e.preventDefault();
                                    e.stopPropagation();
                                  }
                                }}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="linkedinUrl"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="flex items-center gap-2">
                              <span className="text-xl">💼</span>
                              LinkedIn URL
                            </FormLabel>
                            <FormControl>
                              <Input 
                                type="text"
                                placeholder="https://linkedin.com/company/yourcompany" 
                                value={field.value || ''} 
                                onChange={field.onChange}
                                onBlur={field.onBlur}
                                name={field.name}
                                className="w-full"
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    e.preventDefault();
                                    e.stopPropagation();
                                  }
                                }}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="twitterUrl"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="flex items-center gap-2">
                              <span className="text-xl">🐦</span>
                              Twitter/X URL
                            </FormLabel>
                            <FormControl>
                              <Input 
                                type="text"
                                placeholder="https://twitter.com/yourusername" 
                                value={field.value || ''} 
                                onChange={field.onChange}
                                onBlur={field.onBlur}
                                name={field.name}
                                className="w-full"
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    e.preventDefault();
                                    e.stopPropagation();
                                  }
                                }}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="youtubeUrl"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="flex items-center gap-2">
                              <span className="text-xl">📺</span>
                              YouTube URL
                            </FormLabel>
                            <FormControl>
                              <Input 
                                type="text"
                                placeholder="https://youtube.com/c/yourchannel" 
                                value={field.value || ''} 
                                onChange={field.onChange}
                                onBlur={field.onBlur}
                                name={field.name}
                                className="w-full"
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    e.preventDefault();
                                    e.stopPropagation();
                                  }
                                }}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                )}

                {/* Navigation Buttons */}
                <div className="flex justify-between pt-4">
                  {step > 1 && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setStep(step - 1)}
                      data-testid="button-back"
                    >
                      <ArrowLeft className="w-4 h-4 mr-2" />
                      Back
                    </Button>
                  )}
                  {step <= 3 ? (
                    <Button
                      type="button"
                      onClick={nextStep}
                      className="ml-auto bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800"
                      data-testid="button-next"
                    >
                      Next
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  ) : step === 4 ? (
                    <>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setCanSubmit(true)}
                        className="ml-auto"
                      >
                        Skip Social Media
                      </Button>
                    <Button
                      type="submit"
                        disabled={signupMutation.isPending || !canSubmit}
                        className="bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600 text-white font-black text-lg px-8 py-4 rounded-xl shadow-lg hover:shadow-xl transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                      data-testid="button-submit"
                    >
                        {signupMutation.isPending ? "🚀 Creating Your Audit..." : !canSubmit ? "⏳ Enter at least one URL or skip" : "🎯 GET MY FREE AUDIT NOW"}
                        <ArrowRight className="w-5 h-5 ml-2" />
                    </Button>
                    </>
                  ) : null}
                </div>
              </form>
            </Form>
          </Card>

          {/* Trust Indicators */}
          <div className="mt-16 text-center">
            <div className="flex items-center justify-center gap-8 mb-8">
              <div className="flex items-center gap-3 bg-white/80 px-6 py-3 rounded-full shadow-lg">
                <Clock className="w-6 h-6 text-green-500" />
                <span className="font-bold text-gray-700">⚡ Response in 24 hours</span>
              </div>
              <div className="flex items-center gap-3 bg-white/80 px-6 py-3 rounded-full shadow-lg">
                <Shield className="w-6 h-6 text-blue-500" />
                <span className="font-bold text-gray-700">🔒 100% Secure</span>
              </div>
              <div className="flex items-center gap-3 bg-white/80 px-6 py-3 rounded-full shadow-lg">
                <Users className="w-6 h-6 text-purple-500" />
                <span className="font-bold text-gray-700">🚫 No spam, ever</span>
              </div>
            </div>
            
            <div className="bg-gradient-to-r from-gray-50 to-gray-100 p-6 rounded-2xl max-w-4xl mx-auto">
              <p className="text-gray-600 font-medium">
                By submitting this form, you agree to receive marketing communications from Marketing Team App. 
                You can unsubscribe at any time. We respect your privacy.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

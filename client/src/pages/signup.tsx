import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery } from "@tanstack/react-query";
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
  
  // Web Development Details
  webDevType: z.string().optional(),
  webDevFeatures: z.array(z.string()).optional(),
  webDevTimeline: z.string().optional(),
  webDevBudget: z.string().optional(),
  
  // Mobile App Development Details
  appPlatforms: z.array(z.string()).optional(),
  appType: z.string().optional(),
  appFeatures: z.array(z.string()).optional(),
  appTimeline: z.string().optional(),
  appBudget: z.string().optional(),
  
  notes: z.string().optional(),
});

type SignupFormData = z.infer<typeof signupSchema>;

export default function SignupPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [step, setStep] = useState(1);
  const [selectedPackage, setSelectedPackage] = useState<string | null>(null);
  const [auditResults, setAuditResults] = useState<any>(null);

  // Fetch subscription packages
  const { data: packages } = useQuery({
    queryKey: ["/api/subscription-packages"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/subscription-packages", undefined);
      return response.json();
    },
  });

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
      webDevType: "",
      webDevFeatures: [],
      webDevTimeline: "",
      webDevBudget: "",
      appPlatforms: [],
      appType: "",
      appFeatures: [],
      appTimeline: "",
      appBudget: "",
      notes: "",
    },
  });

  const earlyLeadCaptureMutation = useMutation({
    mutationFn: async (data: { name: string; email: string; phone: string; company: string; website?: string; industry?: string }) => {
      const response = await apiRequest("POST", "/api/early-lead", data);
      const result = await response.json();
      if (!result.success) {
        throw new Error(result.message || "Failed to create lead");
      }
      return result;
    },
    onSuccess: (result) => {
      console.log("✅ Early lead captured after step 2:", result);
    },
    onError: (error) => {
      console.error("❌ Failed to capture early lead:", error);
      toast({
        title: "⚠️ Lead Capture Failed",
        description: "We couldn't save your information, but you can still continue with the audit.",
        variant: "destructive",
      });
    },
  });

  const signupMutation = useMutation({
    mutationFn: async (data: SignupFormData) => {
      const response = await apiRequest("POST", "/api/signup-simple", data);
      const result = await response.json();
      return result;
    },
    onSuccess: (result) => {
      toast({
        title: "🎉 Account Created!",
        description: "Welcome! Choose your package to get started.",
      });
      setStep(4); // Go directly to package selection
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
        const leadData = {
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          company: formData.company,
          website: formData.website || undefined,
          industry: formData.industry || undefined,
        };
        console.log("📝 Capturing early lead with data:", leadData);
        earlyLeadCaptureMutation.mutate(leadData);
      }
      
      // If on step 3 (services), submit the form to create account and go to package selection
      if (step === 3) {
        const formData = form.getValues();
        signupMutation.mutate(formData);
      } else {
        setStep(step + 1);
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

  // Step 4: Package Selection
  if (step === 4) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-4">
        <div className="max-w-6xl mx-auto py-12">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-5xl font-black mb-4 bg-gradient-to-r from-blue-500 to-purple-600 bg-clip-text text-transparent">
              🎯 Choose Your Package
            </h1>
            <p className="text-xl text-gray-600 mb-4">
              Based on your audit, here are our recommended packages to fix your issues and grow your brand
            </p>
            <Badge className="bg-gradient-to-r from-green-500 to-emerald-500 text-white text-lg px-6 py-2">
              {auditResults?.summary?.totalIssues || 0} Issues Found • Let's Fix Them!
            </Badge>
          </div>

          {/* Package Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {packages && Array.isArray(packages) && packages.length > 0 ? packages.map((pkg: any) => (
              <Card 
                key={pkg.id} 
                className={`relative border-2 cursor-pointer transition-all hover:shadow-2xl ${
                  selectedPackage === pkg.id 
                    ? 'border-blue-500 bg-blue-50 shadow-xl' 
                    : 'border-gray-200 hover:border-blue-300'
                } ${pkg.isFeatured ? 'ring-2 ring-orange-400 ring-offset-2' : ''}`}
                onClick={() => setSelectedPackage(pkg.id)}
              >
                {pkg.isFeatured && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <Badge className="bg-gradient-to-r from-orange-500 to-pink-500 text-white px-4 py-1">
                      🔥 Most Popular
                    </Badge>
                  </div>
                )}
                
                <CardHeader className="text-center pb-4">
                  <CardTitle className="text-2xl mb-2">{pkg.name}</CardTitle>
                  <div className="text-4xl font-black text-blue-600 mb-2">
                    ${(pkg.price / 100).toFixed(0)}
                    <span className="text-lg font-normal text-gray-500">/month</span>
                  </div>
                  <CardDescription className="text-sm">{pkg.description}</CardDescription>
                </CardHeader>
                
                <CardContent className="pt-0">
                  <ul className="space-y-2 mb-6">
                    {Array.isArray(pkg.features) && pkg.features.slice(0, 6).map((feature: string, idx: number) => (
                      <li key={idx} className="flex items-start gap-2 text-sm">
                        <span className="text-green-500 mt-0.5">✓</span>
                        <span>{feature}</span>
                      </li>
                    ))}
                    {Array.isArray(pkg.features) && pkg.features.length > 6 && (
                      <li className="text-sm text-gray-500 italic">
                        +{pkg.features.length - 6} more features...
                      </li>
                    )}
                  </ul>
                  
                  <Button 
                    className={`w-full ${
                      selectedPackage === pkg.id 
                        ? 'bg-blue-600 hover:bg-blue-700' 
                        : 'bg-gray-600 hover:bg-gray-700'
                    }`}
                    onClick={() => setSelectedPackage(pkg.id)}
                  >
                    {selectedPackage === pkg.id ? '✓ Selected' : pkg.buttonText || 'Select Package'}
                  </Button>
                </CardContent>
              </Card>
            )) : (
              <div className="col-span-full text-center py-12">
                <p className="text-gray-500 mb-4">Loading packages...</p>
                <div className="animate-pulse flex justify-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-blue-500"></div>
                  <div className="h-2 w-2 rounded-full bg-blue-500"></div>
                  <div className="h-2 w-2 rounded-full bg-blue-500"></div>
                </div>
              </div>
            )}
          </div>

          {/* Continue Button */}
          <div className="text-center">
            <Button 
              size="lg" 
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold text-lg px-12 py-4"
              disabled={!selectedPackage}
              onClick={() => {
                if (selectedPackage) {
                  // TODO: Integrate Stripe checkout
                  toast({
                    title: "🚀 Package Selected!",
                    description: "Redirecting to secure checkout...",
                  });
                }
              }}
            >
              Continue to Checkout 🚀
            </Button>
            
            <div className="mt-4">
              <Button 
                variant="ghost" 
                onClick={() => setStep(5)}
                className="text-gray-500 hover:text-gray-700"
              >
                ← Back to Audit Results
              </Button>
            </div>
          </div>
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

          {/* Welcome Section */}
          <div className="text-center mb-12 p-8 rounded-2xl bg-gradient-to-r from-blue-600 to-purple-600 text-white">
            <h2 className="text-3xl font-black mb-4">🚀 START YOUR GROWTH JOURNEY</h2>
            <p className="text-xl font-bold mb-2">Join Hundreds of Growing Businesses</p>
            <p className="text-lg opacity-90">Professional marketing services tailored to your needs</p>
            <div className="flex items-center justify-center gap-4 mt-6">
              <div className="bg-white/20 px-4 py-2 rounded-full">
                <span className="font-bold">🎯 Expert Strategy</span>
              </div>
              <div className="bg-white/20 px-4 py-2 rounded-full">
                <span className="font-bold">📈 Proven Results</span>
              </div>
              <div className="bg-white/20 px-4 py-2 rounded-full">
                <span className="font-bold">🚀 Fast Growth</span>
              </div>
            </div>
          </div>

          {/* Progress Steps */}
          <div className="flex items-center justify-between mb-8">
            {[
              { num: 1, label: "Company", icon: Building2 },
              { num: 2, label: "Contact", icon: User },
              { num: 3, label: "Services", icon: Target },
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
                {s.num < 3 && (
                  <div className={`h-1 flex-1 mx-2 rounded-full ${step > s.num ? "bg-blue-600" : "bg-muted"}`} />
                )}
              </div>
            ))}
          </div>

          <Card className="p-8 shadow-2xl border-0 bg-white/90 backdrop-blur rounded-3xl">
            <div className="text-center mb-8">
              <h2 className="text-4xl font-black mb-4 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                🚀 Create Your Account
              </h2>
              <p className="text-xl text-gray-600 font-medium">Tell us about your business and choose the perfect marketing package for your needs</p>
              <div className="mt-4 inline-flex items-center gap-2 bg-blue-100 text-blue-800 px-4 py-2 rounded-full text-sm font-bold">
                <CheckCircle className="w-4 h-4" />
                Quick setup • Choose your package • Start growing
              </div>
            </div>
            
            <Form {...form}>
              <form 
                onSubmit={(e) => {
                  e.preventDefault();
                  // Form submission is handled by nextStep function
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

                    {/* Web Development Details */}
                    {form.watch("services")?.includes("Web Development") && (
                      <div className="space-y-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                        <h3 className="font-semibold text-blue-900 flex items-center gap-2">
                          <span className="text-xl">🌐</span>
                          Web Development Details
                        </h3>
                        
                        <FormField
                          control={form.control}
                          name="webDevType"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>What type of website do you need?</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select website type" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="business-website">Business Website</SelectItem>
                                  <SelectItem value="ecommerce">E-commerce Store</SelectItem>
                                  <SelectItem value="portfolio">Portfolio/Personal Site</SelectItem>
                                  <SelectItem value="blog">Blog/Content Site</SelectItem>
                                  <SelectItem value="landing-page">Landing Page</SelectItem>
                                  <SelectItem value="web-app">Web Application</SelectItem>
                                  <SelectItem value="redesign">Website Redesign</SelectItem>
                                  <SelectItem value="other">Other</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="webDevFeatures"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>What features do you need? (Select all that apply)</FormLabel>
                              <div className="grid grid-cols-2 gap-2">
                                {[
                                  "Contact Forms",
                                  "Online Payments",
                                  "User Accounts/Login",
                                  "Content Management",
                                  "Search Functionality",
                                  "Multi-language Support",
                                  "Analytics Integration",
                                  "Social Media Integration",
                                  "Email Marketing Integration",
                                  "Live Chat",
                                  "Booking/Scheduling",
                                  "Custom Database"
                                ].map((feature) => (
                                  <FormField
                                    key={feature}
                                    control={form.control}
                                    name="webDevFeatures"
                                    render={({ field }) => (
                                      <FormItem className="flex items-start space-x-2 space-y-0">
                                        <FormControl>
                                          <Checkbox
                                            checked={field.value?.includes(feature)}
                                            onCheckedChange={(checked) => {
                                              return checked
                                                ? field.onChange([...(field.value || []), feature])
                                                : field.onChange(field.value?.filter((value) => value !== feature));
                                            }}
                                          />
                                        </FormControl>
                                        <FormLabel className="font-normal cursor-pointer text-sm">
                                          {feature}
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

                        <div className="grid md:grid-cols-2 gap-4">
                          <FormField
                            control={form.control}
                            name="webDevTimeline"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>When do you need it completed?</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Select timeline" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    <SelectItem value="asap">ASAP (Rush job)</SelectItem>
                                    <SelectItem value="1-month">Within 1 month</SelectItem>
                                    <SelectItem value="2-3-months">2-3 months</SelectItem>
                                    <SelectItem value="3-6-months">3-6 months</SelectItem>
                                    <SelectItem value="6-months-plus">6+ months</SelectItem>
                                    <SelectItem value="flexible">Flexible timeline</SelectItem>
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name="webDevBudget"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Web Development Budget</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                  <FormControl>
                                    <SelectTrigger>
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
                        </div>
                      </div>
                    )}

                    {/* Mobile App Development Details */}
                    {form.watch("services")?.includes("Mobile App Development") && (
                      <div className="space-y-4 p-4 bg-purple-50 rounded-lg border border-purple-200">
                        <h3 className="font-semibold text-purple-900 flex items-center gap-2">
                          <span className="text-xl">📱</span>
                          Mobile App Development Details
                        </h3>
                        
                        <FormField
                          control={form.control}
                          name="appPlatforms"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Which platforms do you need? (Select all that apply)</FormLabel>
                              <div className="grid grid-cols-2 gap-2">
                                {[
                                  "iOS (iPhone/iPad)",
                                  "Android",
                                  "Cross-platform (React Native/Flutter)",
                                  "Progressive Web App (PWA)"
                                ].map((platform) => (
                                  <FormField
                                    key={platform}
                                    control={form.control}
                                    name="appPlatforms"
                                    render={({ field }) => (
                                      <FormItem className="flex items-start space-x-2 space-y-0">
                                        <FormControl>
                                          <Checkbox
                                            checked={field.value?.includes(platform)}
                                            onCheckedChange={(checked) => {
                                              return checked
                                                ? field.onChange([...(field.value || []), platform])
                                                : field.onChange(field.value?.filter((value) => value !== platform));
                                            }}
                                          />
                                        </FormControl>
                                        <FormLabel className="font-normal cursor-pointer text-sm">
                                          {platform}
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
                          name="appType"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>What type of app do you need?</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select app type" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="business-app">Business/Corporate App</SelectItem>
                                  <SelectItem value="ecommerce-app">E-commerce App</SelectItem>
                                  <SelectItem value="social-app">Social/Community App</SelectItem>
                                  <SelectItem value="utility-app">Utility/Productivity App</SelectItem>
                                  <SelectItem value="game">Game/Entertainment</SelectItem>
                                  <SelectItem value="education-app">Education/Learning App</SelectItem>
                                  <SelectItem value="health-fitness">Health/Fitness App</SelectItem>
                                  <SelectItem value="other">Other</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="appFeatures"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>What features do you need? (Select all that apply)</FormLabel>
                              <div className="grid grid-cols-2 gap-2">
                                {[
                                  "User Registration/Login",
                                  "Push Notifications",
                                  "In-App Purchases",
                                  "GPS/Location Services",
                                  "Camera Integration",
                                  "Social Media Sharing",
                                  "Offline Functionality",
                                  "Real-time Chat",
                                  "Payment Processing",
                                  "Analytics/Tracking",
                                  "Admin Dashboard",
                                  "API Integration"
                                ].map((feature) => (
                                  <FormField
                                    key={feature}
                                    control={form.control}
                                    name="appFeatures"
                                    render={({ field }) => (
                                      <FormItem className="flex items-start space-x-2 space-y-0">
                                        <FormControl>
                                          <Checkbox
                                            checked={field.value?.includes(feature)}
                                            onCheckedChange={(checked) => {
                                              return checked
                                                ? field.onChange([...(field.value || []), feature])
                                                : field.onChange(field.value?.filter((value) => value !== feature));
                                            }}
                                          />
                                        </FormControl>
                                        <FormLabel className="font-normal cursor-pointer text-sm">
                                          {feature}
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

                        <div className="grid md:grid-cols-2 gap-4">
                          <FormField
                            control={form.control}
                            name="appTimeline"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>When do you need it completed?</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Select timeline" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    <SelectItem value="asap">ASAP (Rush job)</SelectItem>
                                    <SelectItem value="2-3-months">2-3 months</SelectItem>
                                    <SelectItem value="3-6-months">3-6 months</SelectItem>
                                    <SelectItem value="6-12-months">6-12 months</SelectItem>
                                    <SelectItem value="12-months-plus">12+ months</SelectItem>
                                    <SelectItem value="flexible">Flexible timeline</SelectItem>
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name="appBudget"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>App Development Budget</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Select budget range" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    <SelectItem value="<10000">Less than $10,000</SelectItem>
                                    <SelectItem value="10000-25000">$10,000 - $25,000</SelectItem>
                                    <SelectItem value="25000-50000">$25,000 - $50,000</SelectItem>
                                    <SelectItem value="50000-100000">$50,000 - $100,000</SelectItem>
                                    <SelectItem value="100000+">$100,000+</SelectItem>
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      </div>
                    )}

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
                  {step < 3 ? (
                    <Button
                      type="button"
                      onClick={nextStep}
                      className="ml-auto bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800"
                      data-testid="button-next"
                    >
                      Next
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  ) : step === 3 ? (
                    <Button
                      type="button"
                      onClick={nextStep}
                      disabled={signupMutation.isPending}
                      className="ml-auto bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600 text-white font-bold text-lg px-8 py-4"
                      data-testid="button-submit"
                    >
                      {signupMutation.isPending ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Creating Account...
                        </>
                      ) : (
                        <>
                          🚀 Create Account & Choose Package
                          <ArrowRight className="w-4 h-4 ml-2" />
                        </>
                      )}
                    </Button>
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

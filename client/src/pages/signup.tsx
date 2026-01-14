import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useLocation, Link } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { 
  ArrowRight, 
  ArrowLeft, 
  User, 
  Target, 
  Star, 
  TrendingUp, 
  Users, 
  Zap, 
  Shield, 
  Clock, 
  Sparkles, 
  Palette, 
  Mail, 
  Globe, 
  Smartphone, 
  Pencil, 
  BarChart3,
  Lock,
  ShieldCheck
} from "lucide-react";
import { HeaderLogo } from "@/components/Logo";
import { useDocumentMeta } from "@/hooks/useDocumentMeta";
import { Form } from "@/components/ui/form";

// Import new sub-components
import { SignupProgress } from "@/components/signup/SignupProgress";
import { AccountStep } from "@/components/signup/AccountStep";
import { ContactStep } from "@/components/signup/ContactStep";
import { VerificationStep } from "@/components/signup/VerificationStep";
import { ServicesStep } from "@/components/signup/ServicesStep";
import { LoginsStep } from "@/components/signup/LoginsStep";
import { BrandStep } from "@/components/signup/BrandStep";
import { PackageSelection } from "@/components/signup/PackageSelection";

const signupSchema = z.object({
  // Account Creation
  username: z.string().min(3, "Username must be at least 3 characters"),
  password: z.string().min(8, "Password must be at least 8 characters"),

  // Contact Information
  name: z.string().min(1, "Your name is required"),
  email: z.string().email("Must be a valid email"),
  phone: z.string().min(1, "Phone number is required"),

  // Service Interests
  services: z.array(z.string()).min(1, "Please select at least one service"),
  selectedPlatforms: z.array(z.string()).optional(),
  budget: z.string().optional(),

  // Social Credentials (Dynamic)
  socialCredentials: z.record(z.object({
    username: z.string().min(1, "Username is required"),
    password: z.string().min(1, "Password is required"),
  })).optional(),

  // Brand Assets
  brandAssets: z.object({
    primaryColor: z.string().optional(),
    secondaryColor: z.string().optional(),
    logoUrl: z.string().optional(),
    brandVoice: z.string().optional(),
  }).optional(),

  // Company Information
  company: z.string().min(1, "Company name is required"),
  website: z.preprocess(
    (val) => {
      if (val === null || val === undefined) return "";
      if (typeof val !== "string") return val;
      const s = val.trim();
      if (!s) return "";
      const normalized = /^https?:\/\//i.test(s) ? s : `https://${s}`;
      return normalized;
    },
    z.string().min(3, "Must be a valid URL").or(z.literal(""))
  ),
  industry: z.string().optional(),
  companySize: z.string().optional(),
  
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
  useDocumentMeta({
    title: "Get Started | Marketing Team App",
    description: "Start your journey with Marketing Team App. Tell us about your goals and we'll tailor a plan to grow your brand."
  });
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [step, setStep] = useState(1);
  const [selectedPackage, setSelectedPackage] = useState<string | null>(null);
  const [discountCode, setDiscountCode] = useState("");
  const [validDiscount, setValidDiscount] = useState<any>(null);
  const [isValidatingDiscount, setIsValidatingDiscount] = useState(false);
  const [isAdvancing, setIsAdvancing] = useState(false);
  const { user } = useAuth();

  // If user is already logged in as a prospective client, skip to appropriate step
  useEffect(() => {
    if (user && user.role === 'prospective_client' && step === 1) {
      if (user.emailVerified) {
        setStep(4);
      } else {
        setStep(3);
      }
    }
  }, [user, step]);

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
      username: "",
      password: "",
      name: "",
      email: "",
      phone: "",
      services: [],
      selectedPlatforms: [],
      budget: "",
      socialCredentials: {},
      brandAssets: {
        primaryColor: "#3B82F6",
        secondaryColor: "#6366F1",
        logoUrl: "",
        brandVoice: "",
      },
      company: "",
      website: "",
      industry: "",
      companySize: "",
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

  const selectedServices = form.watch("services");
  const needsSocialCredentials = selectedServices.some(s => 
    ["Social Media Management", "Digital Marketing", "PPC Advertising"].includes(s)
  );

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
      console.log("✅ Early lead captured:", result);
    },
    onError: (error) => {
      console.error("❌ Failed to capture early lead:", error);
    },
  });

  const signupMutation = useMutation({
    mutationFn: async (data: SignupFormData) => {
      const response = await apiRequest("POST", "/api/signup-simple", data);
      const result = await response.json();
      if (!result?.success) {
        throw new Error(result?.message || "Failed to save your signup details");
      }
      return result;
    },
    onSuccess: (result) => {
      toast({
        title: "✅ Selections Saved!",
        description: "Next: choose your package to get started.",
      });
      setStep(5);
    },
    onError: (error: Error) => {
      toast({
        title: "Signup Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const validateDiscountCode = async (code: string) => {
    if (!code.trim()) {
      setValidDiscount(null);
      return;
    }

    setIsValidatingDiscount(true);
    try {
      const response = await apiRequest("POST", "/api/discounts/validate", {
        code: code.trim(),
        packageId: selectedPackage,
      });
      const data = await response.json();
      
      if (data.valid) {
        setValidDiscount(data);
        toast({
          title: "✅ Discount Applied!",
          description: `${data.discountPercentage}% off${data.durationMonths ? ` for ${data.durationMonths} months` : ''}`,
        });
      } else {
        setValidDiscount(null);
        toast({
          title: "❌ Invalid Code",
          description: data.message,
          variant: "destructive",
        });
      }
    } catch (error) {
      setValidDiscount(null);
      toast({
        title: "❌ Error",
        description: "Failed to validate discount code",
        variant: "destructive",
      });
    } finally {
      setIsValidatingDiscount(false);
    }
  };

  const checkoutMutation = useMutation({
    mutationFn: async (data: { packageId: string; leadId?: string; email: string; name: string; discountCode?: string }) => {
      const response = await apiRequest("POST", "/api/create-checkout-session", data);
      const result = await response.json();
      if (!result.success) {
        throw new Error(result.message || "Failed to create checkout session");
      }
      return result;
    },
    onSuccess: (result) => {
      if (result.checkoutUrl) {
        toast({
          title: "🚀 Redirecting to Checkout...",
          description: "Taking you to secure payment page",
        });
        setTimeout(() => {
          window.location.href = result.checkoutUrl;
        }, 1000);
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Checkout Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const nextStep = async () => {
    if (isAdvancing) return;
    setIsAdvancing(true);
    
    let fields: any[] = [];
    if (step === 1) fields = ["username", "password"];
    else if (step === 2) fields = ["name", "email", "phone", "company", "website"];
    else if (step === 4) fields = ["services", "budget", "industry"];
    
    try {
      const isValid = await form.trigger(fields as any);
      if (isValid) {
        if (step === 1) {
          setStep(2);
        } else if (step === 2) {
          // Register the user and move to verification step
          const formData = form.getValues();
          try {
            await apiRequest("POST", "/api/register", {
              username: formData.username,
              password: formData.password,
              email: formData.email,
              firstName: formData.name.split(' ')[0],
              lastName: formData.name.split(' ').slice(1).join(' '),
              role: "client",
            });
            
            // Also capture early lead
            earlyLeadCaptureMutation.mutate({
              name: formData.name,
              email: formData.email,
              phone: formData.phone,
              company: formData.company || "Pending",
              website: formData.website || null,
            });

            setStep(3);
          } catch (error: any) {
            toast({
              title: "Registration Failed",
              description: error.message || "Could not create account. Please try a different username.",
              variant: "destructive",
            });
          }
        } else if (step === 4) {
          // Save services selection to lead before showing packages
          const formData = form.getValues();
          // Omit sensitive/existing account info to avoid backend "already exists" errors
          const { username, password, ...updateData } = formData;
          signupMutation.mutate(updateData as any);
        }
      }
    } finally {
      setIsAdvancing(false);
    }
  };

  const prevStep = () => {
    if (step === 4) setStep(2); // Skip verification step if going back
    else setStep(step - 1);
  };

  const services = [
    { name: "Digital Marketing", icon: TrendingUp, color: "bg-blue-500", desc: "Growth & ads strategy", recommended: true },
    { name: "SEO Optimization", icon: Target, color: "bg-green-500", desc: "Search engine visibility", recommended: true },
    { name: "Social Media Management", icon: Users, color: "bg-pink-500", desc: "Content & community", recommended: true },
    { name: "Content Marketing", icon: Pencil, color: "bg-purple-500", desc: "Engaging brand stories" },
    { name: "Web Development", icon: Globe, color: "bg-emerald-500", desc: "Modern & fast websites" },
    { name: "Mobile App Development", icon: Smartphone, color: "bg-indigo-500", desc: "iOS & Android apps" },
    { name: "Graphic Design", icon: Palette, color: "bg-orange-500", desc: "Stunning visual identity" },
    { name: "Email Marketing", icon: Mail, color: "bg-cyan-500", desc: "Direct customer outreach" },
    { name: "PPC Advertising", icon: Zap, color: "bg-yellow-500", desc: "Paid search & social" },
    { name: "Analytics & Reporting", icon: BarChart3, color: "bg-slate-500", desc: "Data-driven insights" },
  ];

  const steps = [
    { num: 1, label: "Account", icon: Lock },
    { num: 2, label: "Contact", icon: User },
    { num: 3, label: "Verify", icon: ShieldCheck },
    { num: 4, label: "Services", icon: Target },
    { num: 5, label: "Payment", icon: Zap },
  ];

  if (step === 5) {
    return (
      <PackageSelection 
        packages={packages || []}
        selectedPackage={selectedPackage}
        setSelectedPackage={setSelectedPackage}
        discountCode={discountCode}
        setDiscountCode={setDiscountCode}
        validateDiscountCode={validateDiscountCode}
        validDiscount={validDiscount}
        isValidatingDiscount={isValidatingDiscount}
        checkoutMutation={checkoutMutation}
        onBack={() => setStep(4)}
        formValues={form.getValues()}
        onSuccess={() => setLocation("/onboarding/post-payment")}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 relative overflow-hidden">
      {/* Animated Blobs */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none -z-10">
        <motion.div 
          animate={{ 
            x: [0, 50, 0],
            y: [0, 100, 0],
            rotate: [0, 90, 0]
          }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className="absolute -top-20 -left-20 w-96 h-96 bg-blue-400/10 rounded-full blur-3xl"
        />
        <motion.div 
          animate={{ 
            x: [0, -50, 0],
            y: [0, -100, 0],
            rotate: [0, -90, 0]
          }}
          transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
          className="absolute top-1/2 -right-20 w-96 h-96 bg-purple-400/10 rounded-full blur-3xl"
        />
        <motion.div 
          animate={{ 
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3]
          }}
          transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
          className="absolute bottom-0 left-1/4 w-[500px] h-[500px] bg-pink-400/5 rounded-full blur-[100px]"
        />
      </div>

      <header className="border-b bg-white/80 backdrop-blur-md sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/">
            <HeaderLogo className="cursor-pointer" />
          </Link>
          <div className="hidden md:flex items-center gap-2 text-sm text-muted-foreground font-medium">
            <ShieldCheck className="w-4 h-4 text-green-600" />
            Secure Enterprise Encryption
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 md:py-12">
        <div className="max-w-4xl mx-auto">
          {/* Welcome Section (Only on Step 1) */}
          {step === 1 && (
            <motion.div 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center mb-8 md:mb-12"
            >
              <div className="inline-flex items-center gap-2 bg-gradient-to-r from-orange-500 to-pink-500 text-white px-4 md:px-6 py-2 md:py-3 rounded-full text-xs md:text-sm font-black mb-4 md:mb-6 shadow-xl shadow-orange-500/20">
                <Sparkles className="w-3 md:w-4 h-3 md:h-4" />
                🚀 Join 500+ Businesses Growing 3x Faster
              </div>
              <h1 className="text-4xl md:text-7xl font-black mb-4 md:mb-6 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 bg-clip-text text-transparent leading-[1.1] tracking-tight">
                Your Elite, High-Speed
                <br />
                <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text">Marketing Department</span>
                <br />
                <span className="text-3xl md:text-5xl">is Ready to Launch.</span>
              </h1>
              <p className="text-lg md:text-xl text-slate-600 max-w-2xl mx-auto font-medium px-4 md:px-0 mb-6">
                Let's build your brand with a pro team that delivers <span className="text-blue-600 font-bold">real results</span>.
              </p>
              
              <div className="inline-flex items-center gap-2 py-2 px-4 rounded-full bg-blue-50 border border-blue-100 text-blue-700 text-sm font-bold animate-in fade-in slide-in-from-top-4 duration-1000">
                <Users className="w-4 h-4" />
                Are you a content creator? 
                <Link href="/signup/creator" className="underline decoration-2 underline-offset-4 hover:text-blue-800 transition-colors">Apply to our network here →</Link>
              </div>
            </motion.div>
          )}

          <SignupProgress step={step} steps={steps} />

          <Card className="p-0 border-0 bg-white shadow-[0_32px_64px_-16px_rgba(0,0,0,0.1)] rounded-[1.5rem] md:rounded-[2.5rem] relative overflow-hidden ring-1 ring-slate-200">
            <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500" />
            
            <div className="p-6 md:p-12">
              <Form {...form}>
                <form 
                  onSubmit={(e) => {
                    e.preventDefault();
                  }} 
                  className="space-y-6 md:space-y-8"
                >
                  <AnimatePresence mode="wait">
                    {step === 1 && <AccountStep form={form} />}
                    {step === 2 && <ContactStep form={form} />}
                    {step === 3 && (
                      <VerificationStep 
                        email={form.getValues("email")} 
                        onVerified={() => setStep(4)} 
                      />
                    )}
                    {step === 4 && <ServicesStep form={form} services={services} />}
                  </AnimatePresence>

                  {/* Navigation Buttons */}
                  {step !== 3 && (
                    <div className="flex flex-col sm:flex-row justify-between gap-4 pt-8 md:pt-12 border-t border-slate-100">
                      {step > 1 ? (
                        <Button
                          type="button"
                          variant="ghost"
                          size="lg"
                          onClick={prevStep}
                          className="rounded-xl md:rounded-2xl h-14 md:h-16 px-8 text-slate-500 font-bold hover:bg-slate-50"
                        >
                          <ArrowLeft className="w-5 h-5 mr-3" />
                          Back
                        </Button>
                      ) : <div className="hidden sm:block w-32" />}
                      
                      <motion.div
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className="flex-1 sm:max-w-[300px]"
                      >
                        <Button
                          type="button"
                          size="lg"
                          onClick={nextStep}
                          disabled={isAdvancing || earlyLeadCaptureMutation.isPending || signupMutation.isPending}
                          className="w-full rounded-xl md:rounded-2xl h-14 md:h-16 px-12 font-black text-lg md:text-xl transition-all shadow-[0_20px_40px_-12px_rgba(0,0,0,0.2)] bg-gradient-to-r from-blue-600 to-blue-700 text-white"
                        >
                          {isAdvancing || signupMutation.isPending ? (
                            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white" />
                          ) : (
                            <>
                              Continue
                              <ArrowRight className="w-5 h-5 ml-3" />
                            </>
                          )}
                        </Button>
                      </motion.div>
                    </div>
                  )}
                </form>
              </Form>
            </div>
          </Card>

          {/* Social Proof & Trust Indicators */}
          <div className="mt-12 md:mt-20 px-4 md:px-0">
            <div className="text-center mb-8 md:mb-10">
              <div className="inline-flex items-center gap-1 mb-2">
                {[1,2,3,4,5].map(i => <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />)}
              </div>
              <p className="font-bold text-slate-900">Rated 4.9/5 by 500+ happy business owners</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-8">
              {[
                { label: "24h Response", desc: "Always on time", icon: Clock, color: "text-green-600", bg: "bg-green-100" },
                { label: "Secure Setup", desc: "Encrypted data", icon: Shield, color: "text-blue-600", bg: "bg-blue-100" },
                { label: "Expert Team", desc: "Pro management", icon: Users, color: "text-purple-600", bg: "bg-purple-100" },
              ].map((item, i) => (
                <motion.div 
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 + (i * 0.1) }}
                  className="bg-white/60 backdrop-blur-sm p-6 md:p-8 rounded-[1.5rem] md:rounded-[2rem] flex flex-row md:flex-col items-center text-left md:text-center gap-4 shadow-sm border border-white group hover:bg-white hover:shadow-md transition-all"
                >
                  <div className={`w-12 h-12 md:w-16 md:h-16 ${item.bg} ${item.color} rounded-xl md:rounded-[1.25rem] flex items-center justify-center group-hover:scale-110 transition-transform shrink-0`}>
                    <item.icon className="w-6 h-6 md:w-8 md:h-8" />
                  </div>
                  <div>
                    <p className="font-black text-slate-900 text-base md:text-lg">{item.label}</p>
                    <p className="text-xs md:text-sm text-slate-500">{item.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

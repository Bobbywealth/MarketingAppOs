import { useState, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { 
  CheckCircle, 
  MapPin, 
  DollarSign, 
  Clock, 
  Mail, 
  Phone, 
  User, 
  Lock, 
  X, 
  Plus, 
  Video, 
  Sparkles, 
  Play, 
  ArrowDown,
  Camera,
  TrendingUp,
  Zap
} from "lucide-react";
import { HeaderLogo } from "@/components/Logo";
import { useDocumentMeta } from "@/hooks/useDocumentMeta";
import { motion } from "framer-motion";

const INDUSTRIES = [
  "Restaurants",
  "Real Estate",
  "E-commerce",
  "Health & Wellness",
  "Beauty & Personal Care",
  "Technology",
  "Fashion",
  "Automotive",
  "Events",
  "Education",
  "Other"
];

export default function CreatorSignupPage() {
  useDocumentMeta({
    title: "The Creator Opportunity | Marketing Team",
    description: "Watch the opportunity and apply to become an elite creator."
  });
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  useEffect(() => {
    // Load Vimeo API script
    const script = document.createElement("script");
    script.src = "https://player.vimeo.com/api/player.js";
    script.async = true;
    document.body.appendChild(script);
    return () => {
      document.body.removeChild(script);
    };
  }, []);

  const [form, setForm] = useState({
    fullName: "",
    phone: "",
    email: "",
    password: "",
    confirmPassword: "",
    homeCities: [] as string[],
    newCity: "",
    baseZip: "",
    serviceZipCodes: "",
    serviceRadiusMiles: "",
    industries: [] as string[],
    availabilityNotes: "",
  });

  const toggleIndustry = (industry: string) => {
    setForm(prev => ({
      ...prev,
      industries: prev.industries.includes(industry)
        ? prev.industries.filter(i => i !== industry)
        : [...prev.industries, industry]
    }));
  };

  const addCity = () => {
    if (form.newCity.trim() && !form.homeCities.includes(form.newCity.trim())) {
      setForm(prev => ({
        ...prev,
        homeCities: [...prev.homeCities, prev.newCity.trim()],
        newCity: ""
      }));
    }
  };

  const removeCity = (city: string) => {
    setForm(prev => ({
      ...prev,
      homeCities: prev.homeCities.filter(c => c !== city)
    }));
  };

  const applyMutation = useMutation({
    mutationFn: async () => {
      if (form.password.trim().length < 8) {
        throw new Error("Password must be at least 8 characters.");
      }
      if (form.password !== form.confirmPassword) {
        throw new Error("Passwords do not match.");
      }
      const payload: any = {
        fullName: form.fullName.trim(),
        phone: form.phone.trim(),
        email: form.email.trim(),
        password: form.password,
        homeCities: form.homeCities,
        baseZip: form.baseZip.trim() || null,
        serviceZipCodes: form.serviceZipCodes.trim()
          ? form.serviceZipCodes.split(",").map((z) => z.trim()).filter(Boolean)
          : null,
        serviceRadiusMiles: form.serviceRadiusMiles.trim() ? Number(form.serviceRadiusMiles) : null,
        industries: form.industries,
        ratePerVisitCents: 7500, // Default internal rate, can be decided later
        availabilityNotes: form.availabilityNotes.trim() || null,
      };
      const res = await apiRequest("POST", "/api/creators/signup", payload);
      return await res.json();
    },
    onSuccess: (user: any) => {
      // Ensure the app immediately "knows" the user is logged in.
      queryClient.setQueryData(["/api/user"], user);
      toast({
        title: "🎉 Account created!",
        description: "You're signed up and logged in. Redirecting you to your dashboard…",
      });
      setTimeout(() => setLocation("/"), 400);
    },
    onError: (e: any) => {
      toast({
        title: "Signup Failed",
        description: e?.message || "Please check your information and try again.",
        variant: "destructive",
      });
    },
  });

  return (
    <div className="min-h-screen bg-slate-50 overflow-x-hidden">
      {/* Floating header (matches landing vibe) */}
      <motion.header
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, ease: "easeOut" }}
        className="sticky top-0 z-50 border-b border-white/10 bg-[#0f172a]/70 backdrop-blur-xl supports-[backdrop-filter]:bg-[#0f172a]/50"
      >
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center">
            <HeaderLogo />
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="h-9 rounded-full border-white/20 bg-white/5 text-white hover:bg-white/10 hover:text-white"
              onClick={() => {
                document.getElementById("apply-now")?.scrollIntoView({ behavior: "smooth", block: "start" });
              }}
            >
              Apply
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-9 w-9 rounded-full border-white/20 bg-white/5 text-white hover:bg-white/10 hover:text-white"
              aria-label="Login"
              onClick={() => setLocation("/login")}
            >
              <User className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </motion.header>

      {/* Cinematic Hero Section */}
      <div className="bg-[#0f172a] text-white pt-16 pb-24 md:pt-24 md:pb-32 relative overflow-hidden">
        {/* Background Decorative Elements */}
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_0%,rgba(59,130,246,0.15),transparent_50%)]"></div>
        <motion.div 
          animate={{ scale: [1, 1.1, 1], opacity: [0.2, 0.3, 0.2] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -top-24 -left-24 w-96 h-96 bg-blue-600/20 rounded-full blur-[100px]"
        />
        <motion.div 
          animate={{ scale: [1, 1.2, 1], opacity: [0.1, 0.2, 0.1] }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 1 }}
          className="absolute -bottom-24 -right-24 w-96 h-96 bg-purple-600/20 rounded-full blur-[100px]"
        />

        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <div className="inline-flex items-center gap-2 bg-blue-500/10 text-blue-400 border border-blue-500/20 px-4 py-2 rounded-full text-xs md:text-sm font-black mb-6 backdrop-blur-md">
                <Sparkles className="w-4 h-4 animate-pulse" />
                THE FUTURE OF CONTENT CREATION
              </div>
              
              <h1 className="text-4xl md:text-7xl font-black mb-6 leading-[1.1] tracking-tight">
                Turn Your Content <br />
                <span className="bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400 bg-clip-text text-transparent italic">
                  Into A Career
                </span>
              </h1>
              
              <p className="text-lg md:text-xl text-slate-400 max-w-2xl mx-auto mb-12 font-medium">
                Join our network of elite creators capturing high-impact content for the world's fastest growing local businesses.
              </p>
            </motion.div>

            {/* Theatre-Mode Video Player */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="relative group max-w-3xl mx-auto"
            >
              <div className="absolute -inset-1 bg-gradient-to-r from-blue-500 to-purple-600 rounded-[2rem] blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
              <Card className="relative overflow-hidden border-0 bg-black rounded-[2rem] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.5)] ring-1 ring-white/10">
                <div className="relative" style={{ padding: '56.25% 0 0 0' }}>
                  <iframe 
                    src="https://player.vimeo.com/video/1151485036?badge=0&autopause=0&player_id=0&app_id=58479&autoplay=1&loop=1&muted=1&controls=0" 
                    frameBorder="0" 
                    allow="autoplay; fullscreen; picture-in-picture; clipboard-write; encrypted-media; web-share" 
                    style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}
                    title="Creator Opportunity Video"
                  ></iframe>
                </div>
              </Card>

              {/* Watch Label */}
              <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-blue-400/60">
                <Play className="w-3 h-3 fill-current" />
                Watch The Opportunity Above
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Benefits Section */}
      <div className="container mx-auto px-4 -mt-12 relative z-20 pb-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {[
            { icon: DollarSign, title: "High-Pay Visits", desc: "Earn consistent rates for local content capturing visits.", color: "text-emerald-500", bg: "bg-emerald-500/10" },
            { icon: Zap, title: "Pro Workflow", desc: "Access elite gear, training, and a dedicated management team.", color: "text-blue-500", bg: "bg-blue-500/10" },
            { icon: MapPin, title: "Local Impact", desc: "Grow local brands right in your city with professional media.", color: "text-purple-500", bg: "bg-purple-500/10" }
          ].map((benefit, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 * i }}
              whileHover={{ y: -5 }}
            >
              <Card className="border-0 bg-white/80 backdrop-blur-xl shadow-xl shadow-slate-200/50 rounded-3xl h-full transition-all hover:shadow-2xl">
                <CardContent className="p-8">
                  <div className={`w-14 h-14 rounded-2xl ${benefit.bg} flex items-center justify-center ${benefit.color} mb-6 shadow-inner`}>
                    <benefit.icon className="w-7 h-7" />
                  </div>
                  <h3 className="text-xl font-black text-slate-900 mb-3">{benefit.title}</h3>
                  <p className="text-slate-500 font-medium leading-relaxed">{benefit.desc}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Application Form Section */}
      <div id="apply-now" className="container mx-auto px-4 pb-24 max-w-4xl">
        <div className="flex flex-col items-center mb-12">
          <div className="w-12 h-1 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full mb-6"></div>
          <h2 className="text-3xl md:text-5xl font-black text-slate-900 text-center mb-4">Start Your Application</h2>
          <p className="text-slate-500 font-medium text-center max-w-md">
            Complete the form below to join our next intake of content creators.
          </p>
        </div>

        <Card className="p-0 border-0 bg-white shadow-[0_32px_64px_-16px_rgba(0,0,0,0.1)] rounded-[2.5rem] relative overflow-hidden ring-1 ring-slate-200">
          <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500" />
          
          <CardHeader className="p-8 md:p-12 pb-0">
            <CardTitle className="text-2xl font-black text-slate-900">Account Credentials</CardTitle>
            <CardDescription className="font-medium">
              These details will be used to access your creator dashboard once approved.
            </CardDescription>
          </CardHeader>

          <CardContent className="p-8 md:p-12 space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-3">
                <Label htmlFor="fullName" className="text-xs font-black uppercase tracking-widest text-slate-500 px-1">Full Name *</Label>
                <div className="relative group">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                  <Input
                    id="fullName"
                    value={form.fullName}
                    onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                    className="pl-12 h-14 border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 rounded-2xl bg-slate-50/50 font-medium"
                    placeholder="John Doe"
                    required
                  />
                </div>
              </div>

              <div className="space-y-3">
                <Label htmlFor="email" className="text-xs font-black uppercase tracking-widest text-slate-500 px-1">Email Address *</Label>
                <div className="relative group">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                  <Input
                    id="email"
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    className="pl-12 h-14 border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 rounded-2xl bg-slate-50/50 font-medium"
                    placeholder="john@example.com"
                    required
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-3">
                <Label htmlFor="phone" className="text-xs font-black uppercase tracking-widest text-slate-500 px-1">Phone Number *</Label>
                <div className="relative group">
                  <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                  <Input
                    id="phone"
                    type="tel"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    className="pl-12 h-14 border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 rounded-2xl bg-slate-50/50 font-medium"
                    placeholder="(555) 123-4567"
                    required
                  />
                </div>
              </div>

              <div className="space-y-3">
                <Label className="text-xs font-black uppercase tracking-widest text-slate-500 px-1">Industries of Interest *</Label>
                <div className="flex flex-wrap gap-2">
                  {INDUSTRIES.map(industry => (
                    <Badge
                      key={industry}
                      variant={form.industries.includes(industry) ? "default" : "outline"}
                      className={`cursor-pointer py-2 px-4 rounded-xl border-2 transition-all font-bold ${
                        form.industries.includes(industry) 
                          ? 'bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-600/20' 
                          : 'border-slate-200 text-slate-500 hover:border-blue-200 hover:bg-blue-50/50'
                      }`}
                      onClick={() => toggleIndustry(industry)}
                    >
                      {industry}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-3">
                <Label htmlFor="password" title="At least 8 characters" className="text-xs font-black uppercase tracking-widest text-slate-500 px-1">Password *</Label>
                <div className="relative group">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                  <Input
                    id="password"
                    type="password"
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    className="pl-12 h-14 border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 rounded-2xl bg-slate-50/50 font-medium"
                    placeholder="Minimum 8 characters"
                    required
                    minLength={8}
                  />
                </div>
              </div>
              <div className="space-y-3">
                <Label htmlFor="confirmPassword" className="text-xs font-black uppercase tracking-widest text-slate-500 px-1">Confirm Password *</Label>
                <div className="relative group">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={form.confirmPassword}
                    onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
                    className="pl-12 h-14 border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 rounded-2xl bg-slate-50/50 font-medium"
                    placeholder="Re-enter password"
                    required
                    minLength={8}
                  />
                </div>
              </div>
            </div>

            <div className="space-y-4 pt-4">
              <div className="p-6 bg-slate-50 rounded-[2rem] border-2 border-slate-100 space-y-6">
                <div className="flex flex-col md:flex-row gap-6">
                  <div className="flex-1 space-y-3">
                    <Label className="text-xs font-black uppercase tracking-widest text-slate-500 px-1">Service Cities *</Label>
                    <div className="flex gap-2">
                      <Input
                        value={form.newCity}
                        onChange={(e) => setForm({ ...form, newCity: e.target.value })}
                        className="h-12 border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 rounded-xl bg-white"
                        placeholder="Add city"
                        onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addCity())}
                      />
                      <Button type="button" variant="outline" onClick={addCity} className="h-12 rounded-xl border-2 font-bold px-6">
                        <Plus className="w-4 h-4 mr-2" />
                        Add
                      </Button>
                    </div>
                  </div>
                  <div className="flex-1 space-y-3">
                    <Label className="text-xs font-black uppercase tracking-widest text-slate-500 px-1">Selected Cities</Label>
                    <div className="flex flex-wrap gap-2 min-h-[48px] p-2 bg-white rounded-xl border border-dashed border-slate-200">
                      {form.homeCities.map(city => (
                        <Badge key={city} variant="secondary" className="gap-2 py-2 px-4 rounded-lg bg-blue-50 text-blue-700 border-0 font-bold">
                          {city}
                          <X className="w-3.5 h-3.5 cursor-pointer hover:text-destructive transition-colors" onClick={() => removeCity(city)} />
                        </Badge>
                      ))}
                      {form.homeCities.length === 0 && (
                        <p className="text-xs text-slate-400 italic flex items-center h-8 px-2">No cities added.</p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <Label htmlFor="baseZip" className="text-xs font-black uppercase tracking-widest text-slate-500 px-1">Base Zip Code</Label>
                    <Input
                      id="baseZip"
                      value={form.baseZip}
                      onChange={(e) => setForm({ ...form, baseZip: e.target.value })}
                      className="h-12 border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 rounded-xl bg-white"
                      placeholder="10001"
                    />
                  </div>
                  <div className="space-y-3">
                    <Label htmlFor="serviceRadiusMiles" className="text-xs font-black uppercase tracking-widest text-slate-500 px-1">Service Radius (miles)</Label>
                    <Input
                      id="serviceRadiusMiles"
                      type="number"
                      value={form.serviceRadiusMiles}
                      onChange={(e) => setForm({ ...form, serviceRadiusMiles: e.target.value })}
                      className="h-12 border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 rounded-xl bg-white"
                      placeholder="25"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <Label htmlFor="availabilityNotes" className="text-xs font-black uppercase tracking-widest text-slate-500 px-1">Availability Notes</Label>
              <Textarea
                id="availabilityNotes"
                value={form.availabilityNotes}
                onChange={(e) => setForm({ ...form, availabilityNotes: e.target.value })}
                className="border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 rounded-2xl bg-slate-50/50 p-6 min-h-[120px] font-medium"
                placeholder="Tell us about your general availability (e.g., Weekends only, Weekdays after 5pm, etc.)"
              />
            </div>

            <div className="flex flex-col sm:flex-row gap-4 pt-6">
              <Button
                onClick={() => applyMutation.mutate()}
                disabled={
                  applyMutation.isPending ||
                  !form.fullName.trim() ||
                  !form.email.trim() ||
                  !form.phone.trim() ||
                  form.industries.length === 0 ||
                  form.homeCities.length === 0 ||
                  form.password.trim().length < 8 ||
                  form.password !== form.confirmPassword
                }
                className="flex-1 h-16 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-black text-xl shadow-2xl shadow-blue-600/20 group transition-all hover:scale-[1.02] active:scale-[0.98]"
              >
                {applyMutation.isPending ? (
                  "Submitting..."
                ) : (
                  <>
                    Apply To Network
                    <CheckCircle className="ml-3 w-6 h-6" />
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                onClick={() => setLocation("/")}
                className="h-16 rounded-2xl border-2 px-10 font-black text-slate-500 hover:text-slate-900 transition-colors"
              >
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <footer className="py-12 border-t border-slate-200 bg-white">
        <div className="container mx-auto px-4 text-center">
          <HeaderLogo />
          <p className="mt-4 text-slate-400 font-medium text-sm">© 2026 Marketing Team App. All Rights Reserved.</p>
        </div>
      </footer>
    </div>
  );
}
}





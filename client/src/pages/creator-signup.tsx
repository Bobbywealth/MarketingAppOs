import { useState, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { useLocation, Link } from "wouter";
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
  Zap,
  Instagram,
  Youtube,
  Globe,
  FileText,
  ShieldCheck
} from "lucide-react";
import { HeaderLogo } from "@/components/Logo";
import { useDocumentMeta } from "@/hooks/useDocumentMeta";
import { motion, AnimatePresence } from "framer-motion";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";

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

const CREATOR_TERMS = `
# CREATOR TERMS & INDEPENDENT CONTRACTOR AGREEMENT
WolfpaqMarketing LLC d/b/a Marketing Team App
Last Updated: January 5, 2026

This Creator Terms & Independent Contractor Agreement ("Agreement") is entered into by and between WolfpaqMarketing LLC, a New Jersey limited liability company, doing business as Marketing Team App ("Company," "Marketing Team App," "we," "us," or "our"), and the individual applying to or participating in the Marketing Team App Creator Network ("Creator," "you," or "your").

By submitting an application, accepting approval, accessing the platform, or performing services, you expressly agree to all terms below.

### 1. Independent Contractor Status (NO EMPLOYMENT)
Creator acknowledges and agrees:
- Creator is an independent contractor, not an employee, partner, agent, joint venturer, or representative.
- No employer-employee relationship exists now or in the future.
- Creator is not entitled to wages, overtime, benefits, insurance, workers' compensation, unemployment benefits, or leave.
- Creator controls how services are performed, subject only to project requirements.
- Creator has no authority to bind Marketing Team App.

### 2. Taxes, Insurance & Legal Compliance
Creator is solely responsible for:
- All federal, state, and local taxes (including self-employment tax)
- Filing all required tax returns
- Obtaining business licenses or permits
- Maintaining any insurance deemed necessary, including health, liability, disability, or equipment insurance
Marketing Team App does not withhold taxes. Where required, a 1099-NEC may be issued.

### 3. Creator Application & Approval (MANUAL ONLY)
- Submitting an application does not guarantee acceptance.
- All creators are subject to manual review and approval.
- Marketing Team App may accept, decline, suspend, or remove any creator at any time, with or without notice.
- Access to the creator back office is disabled until approval.

### 4. No Guarantee of Work or Income
- Marketing Team App does not guarantee any number of projects, any level of income, or continued access to work opportunities.
- Opportunities are offered at the Company's discretion.

### 5. Payment Terms
- Payment is issued per approved project or visit.
- Rates are disclosed after approval and may vary.
- Payment is issued only for completed, approved work.
- Marketing Team App may reject work that is late, incomplete, or below quality standards.

### 6. Content Ownership & Licensing (MAXIMUM RIGHTS)
Unless otherwise stated in writing:
- All content created through the platform grants Marketing Team App and its clients a perpetual, irrevocable, worldwide, royalty-free license.
- Content may be used for marketing, advertising, social media, paid ads, websites, and promotions.
- Creator waives any right to compensation beyond agreed project payment.
- Creator may display content in a portfolio unless restricted by client agreement.

### 7. EQUIPMENT, TRANSPORTATION & EXPENSES (ZERO LIABILITY)
Creator expressly agrees:
- Marketing Team App provides NO transportation, vehicles, tools, equipment, lodging, or materials.
- Creator is 100% responsible for: Transportation to/from locations, Fuel, tolls, parking, tickets, fines, Equipment purchase, use, maintenance, and loss, Travel planning and safety.
- Marketing Team App bears NO responsibility for: Accidents, Injuries, Illness, Death, Theft, Property or equipment damage, Missed jobs due to transportation issues.

### 8. ASSUMPTION OF RISK (ABSOLUTE)
Creator knowingly and voluntarily assumes ALL risks, including but not limited to:
- Travel and commuting
- Entering private or public properties
- Physical activity
- Equipment usage
- Interaction with third parties
- Environmental or on-site hazards
Creator accepts full responsibility for personal safety at all times.

### 9. WAIVER & RELEASE OF LIABILITY
To the fullest extent permitted under New Jersey law, Creator waives, releases, and forever discharges Marketing Team App, Wolfpaq Marketing LLC, its owners, officers, members, contractors, clients, and affiliates from ANY AND ALL claims, including those arising from negligence, except where prohibited by law.

### 10. Indemnification (CREATOR PAYS)
Creator agrees to defend, indemnify, and hold harmless Marketing Team App from any claims, damages, losses, lawsuits, or expenses (including attorneys' fees) arising from Creator's services, conduct, or failure to follow laws or this Agreement.

### 11. Confidentiality
Creator shall not disclose or misuse any confidential or proprietary information belonging to Marketing Team App or its clients.

### 12. TERMINATION (AT WILL)
- Either party may terminate at any time.
- Marketing Team App may terminate immediately for any reason.
- Upon termination, access is revoked immediately. Approved outstanding payments (if any) will be processed.

### 13. LIMITATION OF LIABILITY (MAXIMUM)
To the fullest extent permitted by law:
- Marketing Team App shall NOT be liable for any indirect, incidental, consequential, special, or punitive damages.
- If liability is found despite this Agreement, maximum total liability shall not exceed $100 OR the amount paid for the specific project, whichever is less.

### 14. Governing Law & Venue
This Agreement shall be governed exclusively by the laws of the State of New Jersey. Any legal action shall be brought exclusively in New Jersey courts.

### 15. Acceptance
By applying, checking the acceptance box, or performing services, Creator confirms they have read, understood, and agreed to all terms.
`;

const LIABILITY_WAIVER = `
# LIABILITY WAIVER & RELEASE
WolfpaqMarketing LLC d/b/a Marketing Team App

This Liability Waiver ("Waiver") is a legally binding agreement.

### ASSUMPTION OF RISK & FULL RELEASE
I, the Creator, voluntarily agree to participate in activities associated with Marketing Team App and acknowledge that such activities involve inherent risks, including but not limited to:
- Travel and transportation
- Physical injury
- Property damage
- Equipment loss
- Third-party actions
- Environmental hazards

### COMPLETE WAIVER OF LIABILITY
To the fullest extent permitted by New Jersey law, I fully waive, release, and discharge WolfpaqMarketing LLC d/b/a Marketing Team App from any and all liability, claims, demands, or causes of action, including those arising from negligence.

### NO RESPONSIBILITY ACKNOWLEDGMENT
I acknowledge that:
- Marketing Team App has NO responsibility for my safety
- I am solely responsible for transportation, equipment, insurance, and personal well-being
- I assume all risks, known and unknown

### INDEMNIFICATION
I agree to indemnify and hold harmless Marketing Team App from any claims resulting from my actions or participation.

### GOVERNING LAW
This Waiver shall be governed by the laws of the State of New Jersey.

### ACKNOWLEDGMENT & ACCEPTANCE
By checking the acceptance box, I confirm that:
- I understand this Waiver
- I voluntarily agree
- I waive substantial legal rights
`;

export default function CreatorSignupPage() {
  useDocumentMeta({
    title: "The Creator Opportunity | Join Marketing Team",
    description: "🎥 Turn your content into a career. We're looking for elite creators to capture high-impact content for the world's fastest growing brands. Apply now to join the network."
  });
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [submitted, setSubmitted] = useState(false);

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
    serviceRadiusMiles: "25",
    industries: [] as string[],
    availabilityNotes: "",
    instagramUsername: "",
    tiktokUsername: "",
    youtubeHandle: "",
    portfolioUrl: "",
    agreeTerms: false,
    agreeWaiver: false,
  });

  const toggleIndustry = (industry: string) => {
    setForm(prev => {
      const exists = prev.industries.includes(industry);
      if (!exists && prev.industries.length >= 3) {
        toast({
          title: "Industry Limit",
          description: "Please select up to 3 primary industries.",
          variant: "default",
        });
        return prev;
      }
      return {
        ...prev,
        industries: exists
          ? prev.industries.filter(i => i !== industry)
          : [...prev.industries, industry]
      };
    });
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
      if (!form.agreeTerms || !form.agreeWaiver) {
        throw new Error("You must agree to the legal terms.");
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
        serviceRadiusMiles: form.serviceRadiusMiles.trim() ? Number(form.serviceRadiusMiles) : 25,
        industries: form.industries,
        ratePerVisitCents: 7500, 
        availabilityNotes: form.availabilityNotes.trim() || null,
        instagramUsername: form.instagramUsername.trim(),
        tiktokUsername: form.tiktokUsername.trim() || null,
        youtubeHandle: form.youtubeHandle.trim() || null,
        portfolioUrl: form.portfolioUrl.trim() || null,
        termsSigned: true,
        waiverSigned: true,
        termsVersion: "1.0"
      };
      const res = await apiRequest("POST", "/api/creators/signup", payload);
      return await res.json();
    },
    onSuccess: () => {
      setSubmitted(true);
      window.scrollTo({ top: 0, behavior: "smooth" });
    },
    onError: (e: any) => {
      toast({
        title: "Signup Failed",
        description: e?.message || "Please check your information and try again.",
        variant: "destructive",
      });
    },
  });

  if (submitted) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-xl w-full text-center space-y-8"
        >
          <div className="w-24 h-24 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-8">
            <CheckCircle className="w-12 h-12" />
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-slate-900 leading-tight">Application Received!</h1>
          <p className="text-xl text-slate-600 font-medium leading-relaxed">
            Thank you for applying to the Marketing Team Creator Network. Our team reviews applications within 24–72 hours.
          </p>
          <div className="p-6 bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 text-left">
            <h3 className="font-black text-slate-900 mb-2">What happens next?</h3>
            <ul className="space-y-3 text-slate-500 font-medium">
              <li className="flex items-start gap-3">
                <div className="w-5 h-5 rounded-full bg-blue-100 text-blue-600 flex-shrink-0 flex items-center justify-center text-xs">1</div>
                Our talent managers will review your social media and portfolio.
              </li>
              <li className="flex items-start gap-3">
                <div className="w-5 h-5 rounded-full bg-blue-100 text-blue-600 flex-shrink-0 flex items-center justify-center text-xs">2</div>
                You'll receive an email with our decision (Accept/Decline).
              </li>
              <li className="flex items-start gap-3">
                <div className="w-5 h-5 rounded-full bg-blue-100 text-blue-600 flex-shrink-0 flex items-center justify-center text-xs">3</div>
                If accepted, you can log in using the credentials you just created.
              </li>
            </ul>
          </div>
          <Button 
            variant="outline" 
            onClick={() => setLocation("/")}
            className="h-14 rounded-2xl px-12 font-black text-lg border-2"
          >
            Back to Home
          </Button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 overflow-x-hidden">
      {/* Floating header (matches landing vibe) */}
      <motion.header
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, ease: "easeOut" }}
        className="sticky top-0 z-50 border-b bg-white/80 backdrop-blur-xl shadow-sm supports-[backdrop-filter]:bg-white/60"
      >
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center">
            <Link href="/">
              <HeaderLogo className="cursor-pointer" />
            </Link>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="h-9 rounded-full border-slate-200 bg-white/50 text-slate-900 hover:bg-slate-100 hover:text-slate-900"
              onClick={() => {
                document.getElementById("apply-now")?.scrollIntoView({ behavior: "smooth", block: "start" });
              }}
            >
              Apply
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-9 w-9 rounded-full border-slate-200 bg-white/50 text-slate-900 hover:bg-slate-100 hover:text-slate-900"
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
                    src="https://player.vimeo.com/video/1151485036?badge=0&autopause=0&player_id=0&app_id=58479&autoplay=1&loop=1" 
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
            <CardTitle className="text-2xl font-black text-slate-900 flex items-center gap-3">
              <User className="w-6 h-6 text-blue-600" />
              Basic Account Info
            </CardTitle>
            <CardDescription className="font-medium text-slate-500">
              Provide your contact details so we can reach you.
            </CardDescription>
          </CardHeader>

          <CardContent className="p-8 md:p-12 space-y-12">
            {/* Section A & B: Basic Info & Credentials */}
            <div className="space-y-8">
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
                  <Label className="text-xs font-black uppercase tracking-widest text-slate-500 px-1">Password *</Label>
                  <div className="relative group">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                    <Input
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
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-3">
                  <Label className="text-xs font-black uppercase tracking-widest text-slate-500 px-1">Confirm Password *</Label>
                  <div className="relative group">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                    <Input
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
            </div>

            <hr className="border-slate-100" />

            {/* Section C: Social Media & Portfolio */}
            <div className="space-y-8">
              <div className="space-y-2">
                <CardTitle className="text-2xl font-black text-slate-900 flex items-center gap-3">
                  <Camera className="w-6 h-6 text-purple-600" />
                  Social Media & Portfolio
                </CardTitle>
                <CardDescription className="font-medium text-slate-500">
                  Show us your best work. Instagram is required.
                </CardDescription>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-3">
                  <Label htmlFor="instagram" className="text-xs font-black uppercase tracking-widest text-slate-500 px-1">Instagram Username *</Label>
                  <div className="relative group">
                    <Instagram className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-pink-500 transition-colors" />
                    <Input
                      id="instagram"
                      value={form.instagramUsername}
                      onChange={(e) => setForm({ ...form, instagramUsername: e.target.value })}
                      className="pl-12 h-14 border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 rounded-2xl bg-slate-50/50 font-medium"
                      placeholder="@username"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <Label htmlFor="tiktok" className="text-xs font-black uppercase tracking-widest text-slate-500 px-1">TikTok Username</Label>
                  <div className="relative group">
                    <Video className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-slate-900 transition-colors" />
                    <Input
                      id="tiktok"
                      value={form.tiktokUsername}
                      onChange={(e) => setForm({ ...form, tiktokUsername: e.target.value })}
                      className="pl-12 h-14 border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 rounded-2xl bg-slate-50/50 font-medium"
                      placeholder="@username"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-3">
                  <Label htmlFor="youtube" className="text-xs font-black uppercase tracking-widest text-slate-500 px-1">YouTube Handle</Label>
                  <div className="relative group">
                    <Youtube className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-red-600 transition-colors" />
                    <Input
                      id="youtube"
                      value={form.youtubeHandle}
                      onChange={(e) => setForm({ ...form, youtubeHandle: e.target.value })}
                      className="pl-12 h-14 border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 rounded-2xl bg-slate-50/50 font-medium"
                      placeholder="@handle or channel URL"
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <Label htmlFor="portfolio" className="text-xs font-black uppercase tracking-widest text-slate-500 px-1">Portfolio / Drive Link</Label>
                  <div className="relative group">
                    <Globe className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                    <Input
                      id="portfolio"
                      value={form.portfolioUrl}
                      onChange={(e) => setForm({ ...form, portfolioUrl: e.target.value })}
                      className="pl-12 h-14 border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 rounded-2xl bg-slate-50/50 font-medium"
                      placeholder="https://..."
                    />
                  </div>
                </div>
              </div>
            </div>

            <hr className="border-slate-100" />

            {/* Section D & E: Industries & Coverage */}
            <div className="space-y-10">
              <div className="space-y-6">
                <div className="space-y-2">
                  <CardTitle className="text-2xl font-black text-slate-900 flex items-center gap-3">
                    <Sparkles className="w-6 h-6 text-yellow-500" />
                    Specialization & Coverage
                  </CardTitle>
                  <CardDescription className="font-medium text-slate-500">
                    Select up to 3 primary industries and your service areas.
                  </CardDescription>
                </div>

                <div className="space-y-3">
                  <Label className="text-xs font-black uppercase tracking-widest text-slate-500 px-1">Industries of Interest (Select up to 3) *</Label>
                  <div className="flex flex-wrap gap-2">
                    {INDUSTRIES.map(industry => (
                      <Badge
                        key={industry}
                        variant={form.industries.includes(industry) ? "default" : "outline"}
                        className={`cursor-pointer py-2.5 px-5 rounded-xl border-2 transition-all font-bold text-sm ${
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

              <div className="p-8 bg-slate-50 rounded-[2.5rem] border-2 border-slate-100 space-y-8">
                <div className="flex flex-col md:flex-row gap-8">
                  <div className="flex-1 space-y-3">
                    <Label className="text-xs font-black uppercase tracking-widest text-slate-500 px-1">Service Cities *</Label>
                    <div className="flex gap-2">
                      <Input
                        value={form.newCity}
                        onChange={(e) => setForm({ ...form, newCity: e.target.value })}
                        className="h-14 border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 rounded-2xl bg-white font-medium"
                        placeholder="Add city"
                        onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addCity())}
                      />
                      <Button type="button" variant="outline" onClick={addCity} className="h-14 rounded-2xl border-2 font-bold px-6">
                        <Plus className="w-4 h-4 mr-2" />
                        Add
                      </Button>
                    </div>
                  </div>
                  <div className="flex-1 space-y-3">
                    <Label className="text-xs font-black uppercase tracking-widest text-slate-500 px-1">Selected Cities</Label>
                    <div className="flex flex-wrap gap-2 min-h-[56px] p-3 bg-white rounded-2xl border border-dashed border-slate-200">
                      {form.homeCities.map(city => (
                        <Badge key={city} variant="secondary" className="gap-2 py-2 px-4 rounded-xl bg-blue-50 text-blue-700 border-0 font-bold">
                          {city}
                          <X className="w-3.5 h-3.5 cursor-pointer hover:text-destructive transition-colors" onClick={() => removeCity(city)} />
                        </Badge>
                      ))}
                      {form.homeCities.length === 0 && (
                        <p className="text-xs text-slate-400 italic flex items-center h-10 px-2">No cities added.</p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-3">
                    <Label htmlFor="baseZip" className="text-xs font-black uppercase tracking-widest text-slate-500 px-1">Base Zip Code</Label>
                    <Input
                      id="baseZip"
                      value={form.baseZip}
                      onChange={(e) => setForm({ ...form, baseZip: e.target.value })}
                      className="h-14 border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 rounded-2xl bg-white font-medium"
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
                      className="h-14 border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 rounded-2xl bg-white font-medium"
                      placeholder="25"
                    />
                  </div>
                </div>
              </div>
            </div>

            <hr className="border-slate-100" />

            {/* Section F: Availability */}
            <div className="space-y-6">
              <div className="space-y-2">
                <CardTitle className="text-2xl font-black text-slate-900 flex items-center gap-3">
                  <Clock className="w-6 h-6 text-blue-600" />
                  Availability
                </CardTitle>
                <CardDescription className="font-medium text-slate-500">
                  Tell us when you're typically available for captures.
                </CardDescription>
              </div>
              <div className="space-y-3">
                <Label htmlFor="availabilityNotes" className="text-xs font-black uppercase tracking-widest text-slate-500 px-1">Availability Notes</Label>
                <Textarea
                  id="availabilityNotes"
                  value={form.availabilityNotes}
                  onChange={(e) => setForm({ ...form, availabilityNotes: e.target.value })}
                  className="border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 rounded-[2rem] bg-slate-50/50 p-8 min-h-[160px] font-medium text-lg leading-relaxed"
                  placeholder="e.g., Weekends only, Weekdays after 5pm, Available full-time in Miami area..."
                />
              </div>
            </div>

            <hr className="border-slate-100" />

            {/* Step 2: Legal Agreements */}
            <div className="space-y-8">
              <div className="space-y-2">
                <CardTitle className="text-2xl font-black text-slate-900 flex items-center gap-3">
                  <ShieldCheck className="w-6 h-6 text-green-600" />
                  Agreements & Acknowledgments
                </CardTitle>
                <CardDescription className="font-medium text-slate-500">
                  Please review and accept our terms before submitting.
                </CardDescription>
              </div>

              <div className="space-y-6">
                <div className="p-6 bg-slate-50 rounded-3xl border-2 border-slate-100 space-y-4">
                  <div className="flex items-start gap-4">
                    <Checkbox 
                      id="terms" 
                      checked={form.agreeTerms} 
                      onCheckedChange={(checked) => setForm({ ...form, agreeTerms: checked === true })}
                      className="mt-1 w-6 h-6 rounded-lg border-2"
                    />
                    <div className="space-y-1">
                      <Label htmlFor="terms" className="text-base font-bold text-slate-900 leading-tight">
                        I have read and agree to the Creator Terms & Independent Contractor Agreement
                      </Label>
                      <Dialog>
                        <DialogTrigger asChild>
                          <button className="text-sm text-blue-600 hover:underline">View Creator Terms</button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col p-0 overflow-hidden">
                          <DialogHeader className="p-6 border-b">
                            <DialogTitle className="text-2xl font-black">Creator Terms & Agreement</DialogTitle>
                          </DialogHeader>
                          <ScrollArea className="flex-1 p-6 overflow-y-auto">
                            <div className="prose prose-slate prose-sm max-w-none space-y-4">
                              {CREATOR_TERMS.split('\n').map((line, i) => {
                                if (line.startsWith('# ')) return <h1 key={i} className="text-2xl font-black text-slate-900 mt-6 first:mt-0">{line.replace('# ', '')}</h1>;
                                if (line.startsWith('### ')) return <h3 key={i} className="text-lg font-black text-slate-900 mt-4">{line.replace('### ', '')}</h3>;
                                if (line.trim() === '') return null;
                                return <p key={i} className="text-slate-600 leading-relaxed font-medium">{line}</p>;
                              })}
                            </div>
                          </ScrollArea>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <Checkbox 
                      id="waiver" 
                      checked={form.agreeWaiver} 
                      onCheckedChange={(checked) => setForm({ ...form, agreeWaiver: checked === true })}
                      className="mt-1 w-6 h-6 rounded-lg border-2"
                    />
                    <div className="space-y-1">
                      <Label htmlFor="waiver" className="text-base font-bold text-slate-900 leading-tight">
                        I have read and agree to the Liability Waiver & Release
                      </Label>
                      <Dialog>
                        <DialogTrigger asChild>
                          <button className="text-sm text-blue-600 hover:underline">View Liability Waiver</button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col p-0 overflow-hidden">
                          <DialogHeader className="p-6 border-b">
                            <DialogTitle className="text-2xl font-black">Liability Waiver & Release</DialogTitle>
                          </DialogHeader>
                          <ScrollArea className="flex-1 p-6 overflow-y-auto">
                            <div className="prose prose-slate prose-sm max-w-none space-y-4">
                              {LIABILITY_WAIVER.split('\n').map((line, i) => {
                                if (line.startsWith('# ')) return <h1 key={i} className="text-2xl font-black text-slate-900 mt-6 first:mt-0">{line.replace('# ', '')}</h1>;
                                if (line.startsWith('### ')) return <h3 key={i} className="text-lg font-black text-slate-900 mt-4">{line.replace('### ', '')}</h3>;
                                if (line.trim() === '') return null;
                                return <p key={i} className="text-slate-600 leading-relaxed font-medium">{line}</p>;
                              })}
                            </div>
                          </ScrollArea>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-6 pt-10">
              <div className="space-y-4">
                <Button
                  onClick={() => applyMutation.mutate()}
                  disabled={
                    applyMutation.isPending ||
                    !form.fullName.trim() ||
                    !form.email.trim() ||
                    !form.phone.trim() ||
                    !form.instagramUsername.trim() ||
                    form.industries.length === 0 ||
                    form.homeCities.length === 0 ||
                    form.password.trim().length < 8 ||
                    form.password !== form.confirmPassword ||
                    !form.agreeTerms ||
                    !form.agreeWaiver
                  }
                  className="w-full h-20 rounded-[2rem] bg-blue-600 hover:bg-blue-700 text-white font-black text-2xl shadow-2xl shadow-blue-600/20 group transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-4 disabled:opacity-50 disabled:grayscale disabled:scale-100"
                >
                  {applyMutation.isPending ? (
                    "Submitting Application..."
                  ) : (
                    <>
                      Apply To Network
                      <CheckCircle className="w-8 h-8" />
                    </>
                  )}
                </Button>

                {/* Validation Feedback Helper */}
                {(!form.fullName.trim() || !form.email.trim() || !form.phone.trim() || !form.instagramUsername.trim() || form.industries.length === 0 || form.homeCities.length === 0 || form.password.trim().length < 8 || form.password !== form.confirmPassword || !form.agreeTerms || !form.agreeWaiver) && (
                  <div className="p-4 bg-slate-100 rounded-2xl border border-slate-200">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Remaining Requirements:</p>
                    <div className="flex flex-wrap gap-x-4 gap-y-2">
                      {!form.fullName.trim() && <span className="text-[11px] font-bold text-slate-500 flex items-center gap-1.5"><X className="w-3 h-3 text-red-400" /> Name</span>}
                      {!form.email.trim() && <span className="text-[11px] font-bold text-slate-500 flex items-center gap-1.5"><X className="w-3 h-3 text-red-400" /> Email</span>}
                      {!form.phone.trim() && <span className="text-[11px] font-bold text-slate-500 flex items-center gap-1.5"><X className="w-3 h-3 text-red-400" /> Phone</span>}
                      {!form.instagramUsername.trim() && <span className="text-[11px] font-bold text-slate-500 flex items-center gap-1.5"><X className="w-3 h-3 text-red-400" /> Instagram</span>}
                      {form.industries.length === 0 && <span className="text-[11px] font-bold text-slate-500 flex items-center gap-1.5"><X className="w-3 h-3 text-red-400" /> Industries</span>}
                      {form.homeCities.length === 0 && <span className="text-[11px] font-bold text-slate-500 flex items-center gap-1.5"><X className="w-3 h-3 text-red-400" /> Service Cities</span>}
                      {form.password.trim().length < 8 && <span className="text-[11px] font-bold text-slate-500 flex items-center gap-1.5"><X className="w-3 h-3 text-red-400" /> Password (8+ chars)</span>}
                      {form.password !== form.confirmPassword && <span className="text-[11px] font-bold text-slate-500 flex items-center gap-1.5"><X className="w-3 h-3 text-red-400" /> Passwords Match</span>}
                      {(!form.agreeTerms || !form.agreeWaiver) && <span className="text-[11px] font-bold text-slate-500 flex items-center gap-1.5"><X className="w-3 h-3 text-red-400" /> Accept Agreements</span>}
                    </div>
                  </div>
                )}
              </div>
              
              <div className="text-center">
                <button
                  onClick={() => setLocation("/")}
                  className="text-slate-400 hover:text-slate-600 font-black uppercase tracking-widest text-xs transition-colors"
                >
                  Cancel & Go Back
                </button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <footer className="py-12 border-t border-slate-200 bg-white">
        <div className="container mx-auto px-4 text-center flex flex-col items-center">
          <Link href="/">
            <HeaderLogo className="cursor-pointer" />
          </Link>
          <p className="mt-4 text-slate-400 font-medium text-sm">© 2026 Marketing Team App. All Rights Reserved.</p>
        </div>
      </footer>
    </div>
  );
}





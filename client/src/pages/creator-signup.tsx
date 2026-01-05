import { useState } from "react";
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
import { CheckCircle, MapPin, DollarSign, Clock, Mail, Phone, User, Lock, X, Plus } from "lucide-react";
import { HeaderLogo } from "@/components/Logo";
import { useDocumentMeta } from "@/hooks/useDocumentMeta";

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
    title: "Creator Application | Marketing Team App",
    description: "Apply to become a creator and start earning with Marketing Team App"
  });
  const [, setLocation] = useLocation();
  const { toast } = useToast();

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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <header className="border-b bg-white/95 backdrop-blur shadow-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <HeaderLogo />
          <Button variant="ghost" onClick={() => setLocation("/login")}>
            Login
          </Button>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 md:py-12 max-w-4xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold mb-3">
            Become a Creator
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Join our network of creators and start earning by completing visits for our clients. 
            Fill out the form below and we'll review your application.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3 mb-2">
                <DollarSign className="w-5 h-5 text-primary" />
                <h3 className="font-semibold">Get Paid</h3>
              </div>
              <p className="text-sm text-muted-foreground">
                Earn competitive rates for each visit you complete
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3 mb-2">
                <Clock className="w-5 h-5 text-primary" />
                <h3 className="font-semibold">Flexible Schedule</h3>
              </div>
              <p className="text-sm text-muted-foreground">
                Choose visits that fit your availability
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3 mb-2">
                <MapPin className="w-5 h-5 text-primary" />
                <h3 className="font-semibold">Local Opportunities</h3>
              </div>
              <p className="text-sm text-muted-foreground">
                Work with clients in your area
              </p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Create Your Creator Account</CardTitle>
            <CardDescription>
              Create your login (email + password) and tell us a bit about your availability. All fields marked with * are required.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="fullName">
                  Full Name *
                </Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="fullName"
                    value={form.fullName}
                    onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                    className="pl-10"
                    placeholder="John Doe"
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">
                  Email *
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    className="pl-10"
                    placeholder="john@example.com"
                    required
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  You’ll log in using this email in the “Username” field.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="phone">
                  Phone Number *
                </Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="phone"
                    type="tel"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    className="pl-10"
                    placeholder="(555) 123-4567"
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Industries of Interest *</Label>
                <div className="flex flex-wrap gap-2">
                  {INDUSTRIES.map(industry => (
                    <Badge
                      key={industry}
                      variant={form.industries.includes(industry) ? "default" : "outline"}
                      className="cursor-pointer py-1 px-3"
                      onClick={() => toggleIndustry(industry)}
                    >
                      {industry}
                    </Badge>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground">
                  Select all industries you'd like to create content for
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="password">
                  Password *
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type="password"
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    className="pl-10"
                    placeholder="At least 8 characters"
                    required
                    minLength={8}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">
                  Confirm Password *
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={form.confirmPassword}
                    onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
                    className="pl-10"
                    placeholder="Re-enter password"
                    required
                    minLength={8}
                  />
                </div>
                {form.confirmPassword && form.password !== form.confirmPassword && (
                  <p className="text-xs text-destructive">
                    Passwords do not match.
                  </p>
                )}
              </div>
            </div>

            <div className="space-y-3">
              <Label>Service Cities *</Label>
              <div className="flex gap-2">
                <Input
                  value={form.newCity}
                  onChange={(e) => setForm({ ...form, newCity: e.target.value })}
                  placeholder="Add a city you're willing to service"
                  onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addCity())}
                />
                <Button type="button" variant="outline" onClick={addCity}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {form.homeCities.map(city => (
                  <Badge key={city} variant="secondary" className="gap-2 py-1.5 px-3">
                    {city}
                    <X className="w-3 h-3 cursor-pointer hover:text-destructive" onClick={() => removeCity(city)} />
                  </Badge>
                ))}
                {form.homeCities.length === 0 && (
                  <p className="text-sm text-muted-foreground italic">No cities added yet.</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="baseZip">
                  Base Zip Code
                </Label>
                <Input
                  id="baseZip"
                  value={form.baseZip}
                  onChange={(e) => setForm({ ...form, baseZip: e.target.value })}
                  placeholder="10001"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="serviceRadiusMiles">
                  Service Radius (miles)
                </Label>
                <Input
                  id="serviceRadiusMiles"
                  type="number"
                  value={form.serviceRadiusMiles}
                  onChange={(e) => setForm({ ...form, serviceRadiusMiles: e.target.value })}
                  placeholder="25"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="serviceZipCodes">
                Specific Service Zip Codes (optional, comma-separated)
              </Label>
              <Input
                id="serviceZipCodes"
                value={form.serviceZipCodes}
                onChange={(e) => setForm({ ...form, serviceZipCodes: e.target.value })}
                placeholder="10001, 10002, 10003"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="availabilityNotes">
                Availability Notes
              </Label>
              <Textarea
                id="availabilityNotes"
                value={form.availabilityNotes}
                onChange={(e) => setForm({ ...form, availabilityNotes: e.target.value })}
                rows={4}
                placeholder="Tell us about your general availability (e.g., Weekends only, Weekdays after 5pm, etc.)"
              />
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-4">
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
                className="flex-1 min-h-[44px]"
                size="lg"
              >
                {applyMutation.isPending ? (
                  "Submitting..."
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Create Account
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                onClick={() => setLocation("/")}
                className="min-h-[44px]"
                size="lg"
              >
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}





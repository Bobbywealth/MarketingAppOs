import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle, MapPin, DollarSign, Clock, Mail, Phone, User, Lock } from "lucide-react";
import { HeaderLogo } from "@/components/Logo";
import { useDocumentMeta } from "@/hooks/useDocumentMeta";

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
    homeCity: "",
    baseZip: "",
    serviceZipCodes: "",
    serviceRadiusMiles: "",
    ratePerVisitCents: "",
    availabilityNotes: "",
  });

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
        homeCity: form.homeCity.trim() || null,
        baseZip: form.baseZip.trim() || null,
        serviceZipCodes: form.serviceZipCodes.trim()
          ? form.serviceZipCodes.split(",").map((z) => z.trim()).filter(Boolean)
          : null,
        serviceRadiusMiles: form.serviceRadiusMiles.trim() ? Number(form.serviceRadiusMiles) : null,
        ratePerVisitCents: form.ratePerVisitCents.trim() ? Math.round(Number(form.ratePerVisitCents) * 100) : null, // Convert dollars to cents
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
          <CardContent className="space-y-5">
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
                <Label htmlFor="ratePerVisitCents">
                  Rate per Visit (USD) *
                </Label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="ratePerVisitCents"
                    type="number"
                    step="0.01"
                    min="0"
                    value={form.ratePerVisitCents}
                    onChange={(e) => setForm({ ...form, ratePerVisitCents: e.target.value })}
                    className="pl-10"
                    placeholder="75.00"
                    required
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Enter your desired rate per visit in US dollars
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

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="homeCity">
                  Home City
                </Label>
                <Input
                  id="homeCity"
                  value={form.homeCity}
                  onChange={(e) => setForm({ ...form, homeCity: e.target.value })}
                  placeholder="New York"
                />
              </div>
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
                Service Zip Codes (comma-separated)
              </Label>
              <Input
                id="serviceZipCodes"
                value={form.serviceZipCodes}
                onChange={(e) => setForm({ ...form, serviceZipCodes: e.target.value })}
                placeholder="10001, 10002, 10003"
              />
              <p className="text-xs text-muted-foreground">
                List specific zip codes you're willing to service, separated by commas
              </p>
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
                placeholder="Tell us about your availability, preferred days/times, any restrictions, etc."
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
                  !form.ratePerVisitCents.trim() ||
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

            {applyMutation.isSuccess && (
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center gap-2 text-green-800">
                  <CheckCircle className="w-5 h-5" />
                  <p className="font-semibold">Account Created Successfully!</p>
                </div>
                <p className="text-sm text-green-700 mt-2">
                  You’re signed in now. If you ever need to log in again, use your email as your username.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="mt-8 text-center text-sm text-muted-foreground">
          <p>Have questions? <a href="/contact" className="text-primary hover:underline">Contact us</a></p>
        </div>
      </div>
    </div>
  );
}





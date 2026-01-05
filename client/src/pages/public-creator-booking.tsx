import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useRoute, useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar as CalendarUI } from "@/components/ui/calendar";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  Calendar, 
  Utensils, 
  Star, 
  CheckCircle2, 
  Clock, 
  MapPin, 
  Instagram, 
  Video,
  Youtube,
  Globe,
  ArrowLeft,
  ChevronRight
} from "lucide-react";
import { format } from "date-fns";
import { Creator } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Logo } from "@/components/Logo";

export default function PublicCreatorBooking() {
  const [, params] = useRoute("/book/:creatorId");
  const creatorId = params?.creatorId;
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [step, setStep] = useState<"calendar" | "details" | "success">("calendar");
  const [bookingData, setBookingData] = useState({
    restaurantName: "",
    contactName: "",
    email: "",
    phone: "",
    notes: ""
  });

  // Fetch creator profile (public info only)
  const { data: creator, isLoading } = useQuery<Creator>({
    queryKey: [`/api/public/creators/${creatorId}`],
    enabled: !!creatorId,
  });

  const bookingMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", `/api/public/creators/${creatorId}/book`, data);
      return res.json();
    },
    onSuccess: () => {
      setStep("success");
      toast({
        title: "Booking Request Sent!",
        description: "The creator has been notified and will get back to you shortly.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Booking failed",
        description: error.message || "Could not submit booking request.",
        variant: "destructive",
      });
    }
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="animate-spin w-12 h-12 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (!creator) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <Card className="max-w-md w-full mx-4">
          <CardContent className="pt-6 text-center space-y-4">
            <div className="h-16 w-16 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto">
              <Clock className="h-8 w-8 text-red-600" />
            </div>
            <h2 className="text-2xl font-bold">Creator Not Found</h2>
            <p className="text-muted-foreground">The booking link you followed appears to be invalid or expired.</p>
            <Button onClick={() => window.location.href = "/"} className="w-full">Back to Home</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleNextStep = () => {
    if (step === "calendar" && selectedDate) {
      setStep("details");
    } else if (step === "details") {
      // Validate form
      if (!bookingData.restaurantName || !bookingData.email) {
        toast({ title: "Required Fields", description: "Please fill in all required fields.", variant: "destructive" });
        return;
      }
      bookingMutation.mutate({
        ...bookingData,
        date: selectedDate
      });
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pb-12">
      {/* Public Header */}
      <header className="bg-white dark:bg-slate-900 border-b py-4 px-6 sticky top-0 z-10 shadow-sm">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <Logo variant="auto" size="md" />
          <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20">Creator Booking</Badge>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 pt-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Creator Info Sidebar */}
        <div className="space-y-6">
          <Card className="overflow-hidden border-0 shadow-lg">
            <div className="h-32 bg-primary/10 relative">
              <div className="absolute -bottom-12 left-6 h-24 w-24 rounded-2xl border-4 border-white dark:border-slate-900 bg-white overflow-hidden shadow-md">
                <div className="h-full w-full bg-slate-100 flex items-center justify-center text-primary text-3xl font-bold">
                  {creator.fullName[0]}
                </div>
              </div>
            </div>
            <CardContent className="pt-16 pb-6 px-6 space-y-4">
              <div>
                <h2 className="text-2xl font-bold">{creator.fullName}</h2>
                <div className="flex items-center gap-1 text-amber-500 mt-1">
                  <Star className="h-4 w-4 fill-current" />
                  <Star className="h-4 w-4 fill-current" />
                  <Star className="h-4 w-4 fill-current" />
                  <Star className="h-4 w-4 fill-current" />
                  <Star className="h-4 w-4 fill-current" />
                  <span className="text-xs text-muted-foreground ml-1 font-medium">(5.0 Rating)</span>
                </div>
              </div>

              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <MapPin className="h-4 w-4" />
                <span>{(creator.homeCities || []).join(", ") || "United States"}</span>
              </div>

              <div className="flex gap-2">
                {creator.instagramUsername && (
                  <a href={`https://instagram.com/${creator.instagramUsername}`} target="_blank" rel="noopener noreferrer">
                    <Button size="icon" variant="outline" className="h-8 w-8 rounded-full border-pink-500/20 text-pink-500 hover:bg-pink-500/10">
                      <Instagram className="h-4 w-4" />
                    </Button>
                  </a>
                )}
                {creator.tiktokUsername && (
                  <a href={`https://tiktok.com/@${creator.tiktokUsername}`} target="_blank" rel="noopener noreferrer">
                    <Button size="icon" variant="outline" className="h-8 w-8 rounded-full border-slate-500/20 text-slate-900 dark:text-white hover:bg-slate-500/10">
                      <Video className="h-4 w-4" />
                    </Button>
                  </a>
                )}
                {creator.portfolioUrl && (
                  <a href={creator.portfolioUrl} target="_blank" rel="noopener noreferrer">
                    <Button size="icon" variant="outline" className="h-8 w-8 rounded-full border-blue-500/20 text-blue-500 hover:bg-blue-500/10">
                      <Globe className="h-4 w-4" />
                    </Button>
                  </a>
                )}
              </div>

              <div className="pt-4 border-t space-y-2">
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Expertise</p>
                <div className="flex flex-wrap gap-1.5">
                  {(creator.industries || ["Food & Beverage", "Events", "Hospitality"]).map(ind => (
                    <Badge key={ind} variant="secondary" className="bg-slate-100 dark:bg-slate-800 text-[10px]">{ind}</Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-primary text-primary-foreground border-0 shadow-lg">
            <CardContent className="pt-6">
              <p className="text-sm opacity-90 mb-1">Standard Rate</p>
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-bold">${creator.ratePerVisitCents / 100}</span>
                <span className="text-sm opacity-80">/ visit</span>
              </div>
              <p className="text-xs mt-4 opacity-80 flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3" />
                Includes high-quality reels & photography
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Booking Flow Content */}
        <div className="lg:col-span-2">
          {step === "calendar" && (
            <Card className="border-0 shadow-xl min-h-[500px]">
              <CardHeader>
                <CardTitle className="text-2xl">Select a Date</CardTitle>
                <CardDescription>Choose when you'd like the creator to visit your restaurant.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-8">
                <div className="flex flex-col md:flex-row gap-8 justify-center items-start">
                  <div className="p-4 border rounded-2xl bg-white dark:bg-slate-900 shadow-inner">
                    <CalendarUI
                      mode="single"
                      selected={selectedDate}
                      onSelect={setSelectedDate}
                      className="rounded-md"
                      disabled={{ before: new Date() }}
                      modifiers={{
                        available: (date) => creator.availability?.[format(date, "yyyy-MM-dd")] === "available",
                        unavailable: (date) => creator.availability?.[format(date, "yyyy-MM-dd")] === "unavailable",
                      }}
                      modifiersClassNames={{
                        available: "bg-green-100 text-green-700 font-bold",
                        unavailable: "bg-red-50 text-red-400 opacity-50 pointer-events-none",
                      }}
                    />
                  </div>
                  
                  <div className="flex-1 space-y-6">
                    <div className="space-y-4">
                      <h3 className="font-bold text-lg flex items-center gap-2">
                        <Clock className="h-5 w-5 text-primary" />
                        Availability Legend
                      </h3>
                      <div className="space-y-3">
                        <div className="flex items-center gap-3 p-3 rounded-xl bg-green-50 dark:bg-green-900/10 border border-green-100 dark:border-green-900/20">
                          <div className="h-3 w-3 bg-green-500 rounded-full" />
                          <div className="text-sm">
                            <p className="font-semibold text-green-700 dark:text-green-400">Available</p>
                            <p className="text-xs text-green-600 dark:text-green-500">Dates highlighted in green are confirmed available.</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800">
                          <div className="h-3 w-3 bg-slate-300 rounded-full" />
                          <div className="text-sm">
                            <p className="font-semibold text-slate-600 dark:text-slate-400">Request Only</p>
                            <p className="text-xs text-slate-500 dark:text-slate-500">Other dates can be requested but require confirmation.</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {selectedDate && (
                      <div className="p-4 bg-primary/5 rounded-2xl border-2 border-primary/20 animate-in zoom-in-95 duration-200">
                        <p className="text-sm font-medium text-primary uppercase tracking-wider mb-1">Selected Date</p>
                        <p className="text-xl font-bold">{format(selectedDate, "EEEE, MMMM do, yyyy")}</p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="pt-6 border-t flex justify-end">
                  <Button 
                    size="lg" 
                    className="gap-2 px-8 h-12 text-lg font-bold"
                    disabled={!selectedDate}
                    onClick={handleNextStep}
                  >
                    Continue to Details
                    <ChevronRight className="h-5 w-5" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {step === "details" && (
            <Card className="border-0 shadow-xl">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-2xl">Booking Details</CardTitle>
                  <CardDescription>Tell the creator about your restaurant and vision.</CardDescription>
                </div>
                <Button variant="ghost" className="gap-2" onClick={() => setStep("calendar")}>
                  <ArrowLeft className="h-4 w-4" />
                  Change Date
                </Button>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="restaurant">Restaurant Name *</Label>
                    <Input 
                      id="restaurant" 
                      placeholder="e.g. Pasta Palace" 
                      value={bookingData.restaurantName}
                      onChange={e => setBookingData({...bookingData, restaurantName: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="contact">Contact Person *</Label>
                    <Input 
                      id="contact" 
                      placeholder="e.g. John Doe"
                      value={bookingData.contactName}
                      onChange={e => setBookingData({...bookingData, contactName: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address *</Label>
                    <Input 
                      id="email" 
                      type="email" 
                      placeholder="e.g. john@restaurant.com"
                      value={bookingData.email}
                      onChange={e => setBookingData({...bookingData, email: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input 
                      id="phone" 
                      placeholder="e.g. (555) 000-0000"
                      value={bookingData.phone}
                      onChange={e => setBookingData({...bookingData, phone: e.target.value})}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="notes">Vision & Notes (Optional)</Label>
                  <Textarea 
                    id="notes" 
                    placeholder="Tell us about the dishes you want featured or any specific goals for this content..." 
                    className="min-h-[120px]"
                    value={bookingData.notes}
                    onChange={e => setBookingData({...bookingData, notes: e.target.value})}
                  />
                </div>

                <div className="pt-6 border-t flex justify-between items-center">
                  <div className="text-sm text-muted-foreground flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Booking for {selectedDate && format(selectedDate, "MMM d, yyyy")}
                  </div>
                  <Button 
                    size="lg" 
                    className="gap-2 px-12 h-12 text-lg font-bold"
                    onClick={handleNextStep}
                    disabled={bookingMutation.isPending}
                  >
                    {bookingMutation.isPending ? "Sending Request..." : "Request Booking"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {step === "success" && (
            <Card className="border-0 shadow-xl py-12">
              <CardContent className="text-center space-y-6">
                <div className="h-24 w-24 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle2 className="h-12 w-12 text-green-600" />
                </div>
                <div className="space-y-2">
                  <h2 className="text-3xl font-bold">Booking Request Sent!</h2>
                  <p className="text-muted-foreground text-lg max-w-md mx-auto">
                    Thanks for reaching out! <strong>{creator.fullName}</strong> has been notified and will review your request.
                  </p>
                </div>
                <div className="p-6 bg-slate-50 dark:bg-slate-900 rounded-2xl border-2 border-dashed max-w-sm mx-auto space-y-2">
                  <p className="text-sm font-medium">What's next?</p>
                  <p className="text-xs text-muted-foreground">
                    Keep an eye on your email <strong>({bookingData.email})</strong>. You'll receive a confirmation once the booking is approved.
                  </p>
                </div>
                <div className="pt-4">
                  <Button variant="outline" onClick={() => window.location.reload()}>Book Another Date</Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </main>

      {/* Public Footer */}
      <footer className="max-w-5xl mx-auto px-4 mt-12 pt-8 border-t border-slate-200 dark:border-slate-800 text-center space-y-4">
        <Logo variant="auto" size="sm" className="grayscale opacity-50 mx-auto" />
        <p className="text-xs text-muted-foreground">© {new Date().getFullYear()} Marketing Team. All rights reserved. Professional creators for modern businesses.</p>
      </footer>
    </div>
  );
}


import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Megaphone, 
  Copy, 
  ExternalLink, 
  Calendar, 
  Users, 
  Share2,
  CheckCircle2,
  QrCode
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { Creator } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";

export default function CreatorMarketing() {
  const { user } = useAuth();
  const { toast } = useToast();

  // Fetch creator profile
  const { data: creator } = useQuery<Creator>({
    queryKey: [`/api/creators/${user?.creatorId}`],
    enabled: !!user?.creatorId,
  });

  const bookingLink = `${window.location.origin}/book/${user?.creatorId}`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(bookingLink);
    toast({
      title: "Link Copied!",
      description: "Your booking link has been copied to your clipboard.",
    });
  };

  return (
    <div className="min-h-full bg-slate-50/50 dark:bg-slate-950/50 p-4 md:p-8 space-y-8">
      {/* Header section */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Creator Marketing</h1>
        <p className="text-muted-foreground">Grow your presence and get more bookings from restaurants.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content: Booking Link & Tools */}
        <div className="lg:col-span-2 space-y-8">
          <Card className="border-primary/20 bg-primary/5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-2xl">
                <Megaphone className="h-6 w-6 text-primary" />
                Your Booking Link
              </CardTitle>
              <CardDescription className="text-base">
                Share this link with restaurants to allow them to see your availability and book you directly.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex gap-2">
                <Input 
                  value={bookingLink} 
                  readOnly 
                  className="bg-white dark:bg-slate-900 border-2 h-12 text-lg font-medium"
                />
                <Button 
                  size="lg" 
                  className="gap-2 h-12"
                  onClick={copyToClipboard}
                >
                  <Copy className="h-5 w-5" />
                  Copy Link
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4">
                <Button variant="outline" className="h-24 flex-col gap-2 border-2 hover:border-primary hover:bg-primary/5 transition-all">
                  <Share2 className="h-6 w-6 text-primary" />
                  <span>Share on Social</span>
                </Button>
                <Button variant="outline" className="h-24 flex-col gap-2 border-2 hover:border-primary hover:bg-primary/5 transition-all">
                  <QrCode className="h-6 w-6 text-primary" />
                  <span>Get QR Code</span>
                </Button>
                <a href={bookingLink} target="_blank" rel="noopener noreferrer" className="block">
                  <Button variant="outline" className="h-24 w-full flex-col gap-2 border-2 hover:border-primary hover:bg-primary/5 transition-all">
                    <ExternalLink className="h-6 w-6 text-primary" />
                    <span>Preview Link</span>
                  </Button>
                </a>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Marketing Assets</CardTitle>
              <CardDescription>Everything you need to pitch yourself to new clients.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 border rounded-xl hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors cursor-pointer group">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="h-10 w-10 rounded-lg bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center">
                      <Users className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <h3 className="font-bold group-hover:text-primary transition-colors">Restaurant Pitch Deck</h3>
                  </div>
                  <p className="text-sm text-muted-foreground">A professional presentation deck tailored for restaurant owners.</p>
                </div>
                <div className="p-4 border rounded-xl hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors cursor-pointer group">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="h-10 w-10 rounded-lg bg-green-100 dark:bg-green-900/20 flex items-center justify-center">
                      <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
                    </div>
                    <h3 className="font-bold group-hover:text-primary transition-colors">Service List & Pricing</h3>
                  </div>
                  <p className="text-sm text-muted-foreground">Editable PDF listing your content packages and rates.</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar: Tips & Stats */}
        <div className="space-y-6">
          <Card>
            <CardHeader className="bg-amber-50 dark:bg-amber-950/20">
              <CardTitle className="text-lg flex items-center gap-2">
                <Calendar className="h-5 w-5 text-amber-600" />
                Booking Tips
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div className="space-y-4">
                <div className="flex gap-3">
                  <div className="h-6 w-6 rounded-full bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center shrink-0 mt-0.5">
                    <span className="text-xs font-bold text-amber-700 dark:text-amber-400">1</span>
                  </div>
                  <div>
                    <p className="font-semibold text-sm">Keep availability updated</p>
                    <p className="text-xs text-muted-foreground">Restaurants are more likely to book if they see immediate openings.</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <div className="h-6 w-6 rounded-full bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center shrink-0 mt-0.5">
                    <span className="text-xs font-bold text-amber-700 dark:text-amber-400">2</span>
                  </div>
                  <div>
                    <p className="font-semibold text-sm">Update your portfolio</p>
                    <p className="text-xs text-muted-foreground">Clients will see your best work when they visit your booking link.</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <div className="h-6 w-6 rounded-full bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center shrink-0 mt-0.5">
                    <span className="text-xs font-bold text-amber-700 dark:text-amber-400">3</span>
                  </div>
                  <div>
                    <p className="font-semibold text-sm">Follow up quickly</p>
                    <p className="text-xs text-muted-foreground">When a booking request comes in, respond within 24 hours to secure it.</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Recent Link Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-6">
                <p className="text-2xl font-bold text-primary">0</p>
                <p className="text-sm text-muted-foreground font-medium uppercase tracking-wider">Link Views (Last 7 Days)</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}


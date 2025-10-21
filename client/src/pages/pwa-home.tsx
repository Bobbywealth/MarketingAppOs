import { useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowRight, Loader2 } from "lucide-react";
import mtaLogoBlue from "@assets/mta-logo-blue.png";

export default function PWAHomePage() {
  const { user, isLoading } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!isLoading && user) {
      // User is logged in, redirect to their dashboard
      if (user.role === 'client') {
        setLocation("/");
      } else {
        setLocation("/");
      }
    }
  }, [user, isLoading, setLocation]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-primary/5 to-background">
        <Loader2 className="w-12 h-12 animate-spin text-primary" />
      </div>
    );
  }

  // If not logged in, show PWA-specific welcome screen
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-background flex items-center justify-center p-4">
      <Card className="max-w-md w-full glass-strong">
        <CardContent className="p-8 space-y-6 text-center">
          {/* Logo */}
          <div className="flex justify-center mb-4">
            <img 
              src={mtaLogoBlue} 
              alt="Marketing Team App" 
              className="h-24 w-auto"
            />
          </div>

          {/* Welcome Message */}
          <div className="space-y-2">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">
              Welcome to MTA
            </h1>
            <p className="text-muted-foreground">
              Your complete marketing management solution
            </p>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-3 gap-4 py-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">24/7</div>
              <div className="text-xs text-muted-foreground">Access</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">∞</div>
              <div className="text-xs text-muted-foreground">Clients</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">All</div>
              <div className="text-xs text-muted-foreground">Tools</div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            <Button 
              onClick={() => setLocation("/login")}
              className="w-full gap-2"
              size="lg"
            >
              Sign In
              <ArrowRight className="w-4 h-4" />
            </Button>
            <Button 
              onClick={() => setLocation("/signup")}
              variant="outline"
              className="w-full"
              size="lg"
            >
              Create Account
            </Button>
          </div>

          {/* App Info */}
          <div className="pt-4 border-t">
            <p className="text-xs text-muted-foreground">
              📱 You're using the PWA version
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}


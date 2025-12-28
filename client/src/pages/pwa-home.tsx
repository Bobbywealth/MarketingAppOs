import { useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { ArrowRight, Loader2, Sparkles, Rocket, TrendingUp, Target, Users, Zap, BarChart3 } from "lucide-react";
import { HeaderLogo } from "@/components/Logo";
import { useDocumentMeta } from "@/hooks/useDocumentMeta";

export default function PWAHomePage() {
  useDocumentMeta({
    title: "Loading App | Marketing Team App",
    description: "Launching Marketing Team App — your remote digital marketing team."
  });
  const { user, isLoading } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!isLoading && user) {
      // User is logged in, redirect to their dashboard
      setLocation("/");
    }
  }, [user, isLoading, setLocation]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-600 via-purple-600 to-pink-500 p-6">
        {/* Animated Background */}
        <div className="absolute top-0 left-0 w-72 h-72 bg-white/10 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '4s' }}></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-blue-400/20 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '6s' }}></div>
        
        {/* Logo */}
        <div className="relative z-10 mb-8">
          <HeaderLogo className="mx-auto drop-shadow-2xl animate-pulse" style={{ animationDuration: '2s' }} />
        </div>
        
        {/* Loading Content */}
        <div className="relative z-10 text-center space-y-6 max-w-md">
          <h1 className="text-3xl md:text-4xl font-bold text-white drop-shadow-lg">
            Marketing Team App
          </h1>
          
          {/* Progress Bar */}
          <div className="space-y-3">
            <div className="w-64 h-2 bg-white/20 rounded-full overflow-hidden backdrop-blur-sm">
              <div className="h-full bg-gradient-to-r from-white via-blue-200 to-white rounded-full animate-pulse" style={{ width: '80%', animationDuration: '1.5s' }}></div>
            </div>
            <p className="text-white/90 text-lg font-medium animate-pulse">
              Preparing your workspace...
            </p>
          </div>
          
          {/* Loading Dots */}
          <div className="flex items-center justify-center gap-2">
            <div className="w-3 h-3 bg-white rounded-full animate-bounce" style={{ animationDelay: '0s' }}></div>
            <div className="w-3 h-3 bg-white rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
            <div className="w-3 h-3 bg-white rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
          </div>
          
          {/* Tagline */}
          <p className="text-white/70 text-sm">
            ✨ Your complete marketing management solution
          </p>
        </div>
      </div>
    );
  }

  // If not logged in, show PWA-specific welcome screen
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 text-center bg-gradient-to-br from-blue-600 via-purple-600 to-pink-500 text-white overflow-hidden relative">
      {/* Animated Background Circles */}
      <div className="absolute top-0 left-0 w-72 h-72 bg-white/10 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '4s' }}></div>
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-blue-400/20 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '6s', animationDelay: '1s' }}></div>
      <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-purple-400/20 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '5s', animationDelay: '2s' }}></div>

      {/* Content */}
      <div className="relative z-10 max-w-md w-full">
        {/* Logo with glow effect */}
        <div className="mb-8 relative">
          <div className="absolute inset-0 bg-white/20 blur-2xl rounded-full"></div>
          <HeaderLogo className="mx-auto relative z-10 drop-shadow-2xl animate-bounce" style={{ animationDuration: '3s' }} />
        </div>

        {/* Title with gradient text */}
        <div className="mb-6 space-y-2">
          <h1 className="text-5xl font-black mb-3 bg-gradient-to-r from-white via-blue-100 to-white bg-clip-text text-transparent drop-shadow-lg animate-pulse" style={{ animationDuration: '2s' }}>
            Welcome to MTA
          </h1>
          <p className="text-xl font-light text-white/90 tracking-wide">
            Your complete marketing management solution
          </p>
          <div className="flex items-center justify-center gap-2 text-sm text-white/80 mt-4">
            <Sparkles className="w-4 h-4 animate-spin" style={{ animationDuration: '3s' }} />
            <span>Powered by AI & Innovation</span>
            <Sparkles className="w-4 h-4 animate-spin" style={{ animationDuration: '3s' }} />
          </div>
        </div>

        {/* Feature Cards with glassmorphism */}
        <div className="grid grid-cols-3 gap-3 mb-8">
          <div className="backdrop-blur-xl bg-white/10 p-4 rounded-2xl border border-white/20 hover:bg-white/20 transition-all hover:scale-105 shadow-2xl">
            <Rocket className="w-8 h-8 mb-2 mx-auto text-yellow-300 drop-shadow-lg" />
            <p className="text-xs font-bold">Fast</p>
          </div>
          <div className="backdrop-blur-xl bg-white/10 p-4 rounded-2xl border border-white/20 hover:bg-white/20 transition-all hover:scale-105 shadow-2xl">
            <Target className="w-8 h-8 mb-2 mx-auto text-green-300 drop-shadow-lg" />
            <p className="text-xs font-bold">Focused</p>
          </div>
          <div className="backdrop-blur-xl bg-white/10 p-4 rounded-2xl border border-white/20 hover:bg-white/20 transition-all hover:scale-105 shadow-2xl">
            <Zap className="w-8 h-8 mb-2 mx-auto text-orange-300 drop-shadow-lg" />
            <p className="text-xs font-bold">Powerful</p>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-3 gap-2 mb-8 text-center">
          <div className="backdrop-blur-md bg-white/5 p-3 rounded-xl border border-white/10">
            <Users className="w-5 h-5 mx-auto mb-1 text-blue-200" />
            <p className="text-2xl font-black">∞</p>
            <p className="text-xs text-white/70">Clients</p>
          </div>
          <div className="backdrop-blur-md bg-white/5 p-3 rounded-xl border border-white/10">
            <TrendingUp className="w-5 h-5 mx-auto mb-1 text-green-200" />
            <p className="text-2xl font-black">24/7</p>
            <p className="text-xs text-white/70">Access</p>
          </div>
          <div className="backdrop-blur-md bg-white/5 p-3 rounded-xl border border-white/10">
            <BarChart3 className="w-5 h-5 mx-auto mb-1 text-purple-200" />
            <p className="text-2xl font-black">All</p>
            <p className="text-xs text-white/70">Tools</p>
          </div>
        </div>

        {/* CTA Buttons with enhanced styling */}
        <div className="space-y-3 w-full">
          <Button 
            onClick={() => setLocation("/login")}
            size="lg" 
            className="w-full bg-white text-blue-600 hover:bg-blue-50 shadow-2xl hover:shadow-white/50 transition-all hover:scale-105 font-bold text-lg py-6 rounded-2xl"
          >
            Sign In 
            <ArrowRight className="ml-2 w-5 h-5" />
          </Button>
          <Button 
            onClick={() => setLocation("/signup")}
            size="lg" 
            variant="outline" 
            className="w-full border-2 border-white/50 text-white hover:bg-white/20 backdrop-blur-md shadow-lg hover:scale-105 transition-all font-semibold py-6 rounded-2xl"
          >
            Create Account
          </Button>
        </div>

        {/* PWA Badge */}
        <div className="mt-8 inline-flex items-center gap-2 backdrop-blur-xl bg-white/10 px-4 py-2 rounded-full border border-white/20 shadow-lg">
          <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
          <p className="text-xs font-medium">📱 PWA Mode Active</p>
        </div>
      </div>
    </div>
  );
}

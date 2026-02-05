import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertCircle, Home, LayoutDashboard, Search, ArrowLeft } from "lucide-react";
import { useDocumentMeta } from "@/hooks/useDocumentMeta";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { getDefaultDashboardPath, getEffectiveRole } from "@/lib/effective-role";

export default function NotFound() {
  useDocumentMeta({
    title: "404 - Page Not Found",
    description: "The page you are looking for does not exist.",
    robots: "noindex, nofollow"
  });

  const { user } = useAuth();
  const [, setLocation] = useLocation();

  const handleGoBack = () => {
    window.history.back();
  };

  const handleGoHome = () => {
    setLocation("/");
  };

  const handleGoDashboard = () => {
    if (user) {
      const role = getEffectiveRole((user as any)?.role);
      setLocation(getDefaultDashboardPath(role));
    } else {
      setLocation("/");
    }
  };

  const commonDestinations = [
    { name: "Dashboard", path: user ? getDefaultDashboardPath(getEffectiveRole((user as any)?.role)) : "/", icon: LayoutDashboard },
    { name: "Tasks", path: "/tasks", icon: Search },
    { name: "Leads", path: "/leads", icon: Search },
    { name: "Calendar", path: "/company-calendar", icon: Search },
  ];

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 dark:from-slate-950 dark:via-blue-950/20 dark:to-purple-950/20 p-4">
      <Card className="w-full max-w-2xl mx-4 shadow-xl border-2">
        <CardContent className="pt-10 pb-8 px-6 md:px-10">
          {/* Icon Section */}
          <div className="flex justify-center mb-6">
            <div className="w-20 h-20 md:w-24 md:h-24 rounded-full bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center shadow-lg">
              <AlertCircle className="h-10 w-10 md:h-12 md:w-12 text-white" />
            </div>
          </div>

          {/* Title Section */}
          <div className="text-center mb-4">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-2">
              404
            </h1>
            <h2 className="text-xl md:text-2xl font-semibold text-gray-700 dark:text-gray-300">
              Page Not Found
            </h2>
          </div>

          {/* Description */}
          <p className="text-center text-gray-600 dark:text-gray-400 mb-8 text-base md:text-lg">
            The page you're looking for doesn't exist or has been moved.
            Let's get you back on track!
          </p>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center mb-8">
            <Button
              onClick={handleGoBack}
              variant="outline"
              className="w-full sm:w-auto gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Go Back
            </Button>
            <Button
              onClick={handleGoHome}
              variant="outline"
              className="w-full sm:w-auto gap-2"
            >
              <Home className="h-4 w-4" />
              Go Home
            </Button>
            <Button
              onClick={handleGoDashboard}
              className="w-full sm:w-auto gap-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
            >
              <LayoutDashboard className="h-4 w-4" />
              Dashboard
            </Button>
          </div>

          {/* Common Destinations */}
          <div className="border-t border-gray-200 dark:border-gray-800 pt-6">
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-4 text-center">
              Common destinations
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {commonDestinations.map((dest) => {
                const Icon = dest.icon;
                return (
                  <Button
                    key={dest.name}
                    onClick={() => setLocation(dest.path)}
                    variant="ghost"
                    className="flex flex-col items-center gap-2 h-auto py-4 hover:bg-gray-100 dark:hover:bg-gray-800"
                  >
                    <Icon className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                    <span className="text-xs text-gray-700 dark:text-gray-300">{dest.name}</span>
                  </Button>
                );
              })}
            </div>
          </div>

          {/* Help Text */}
          <p className="text-center text-xs text-gray-500 dark:text-gray-500 mt-6">
            If you believe this is an error, please contact support.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

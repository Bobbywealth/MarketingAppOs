import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarProvider, useSidebar } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { ThemeToggle } from "@/components/theme-toggle";
import { GlobalSearch } from "@/components/GlobalSearch";
import { NotificationsCenter } from "@/components/NotificationsCenter";
// NotificationPermissionPrompt removed - using Native Web Push
import { PWAInstallButton } from "@/components/PWAInstallButton";
import { useAuth, AuthProvider } from "@/hooks/use-auth";
import { ProtectedRoute } from "@/lib/protected-route";
import { usePageTracking } from "@/hooks/usePageTracking";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";

import AuthPage from "@/pages/auth-page";
import Landing from "@/pages/landing";
import SignupPage from "@/pages/signup";
import PaymentSuccessPage from "@/pages/payment-success";
import mtaLogoBlue from "@assets/mta-logo-blue.png";
import mtaLogoWhite from "@assets/mta-logo.png";
import Dashboard from "@/pages/dashboard";
import ClientDashboard from "@/pages/client-dashboard";
import ClientContent from "@/pages/client-content";
import ClientCampaigns from "@/pages/client-campaigns";
import ClientBilling from "@/pages/client-billing";
import ClientAnalytics from "@/pages/client-analytics";
import Clients from "@/pages/clients";
import Campaigns from "@/pages/campaigns";
import Tasks from "@/pages/tasks";
import Leads from "@/pages/leads";
import Content from "@/pages/content";
import Invoices from "@/pages/invoices";
import Tickets from "@/pages/tickets";
import Onboarding from "@/pages/onboarding";
import Messages from "@/pages/messages";
import WebsiteProjects from "@/pages/website-projects";
import Analytics from "@/pages/analytics";
import Team from "@/pages/team";
import Emails from "@/pages/emails";
import Phone from "@/pages/phone";
import Settings from "@/pages/settings";
import CompanyCalendar from "@/pages/company-calendar";
import SubscriptionPackages from "@/pages/subscription-packages";
import SecondMe from "@/pages/second-me";
import AdminSecondMe from "@/pages/admin-second-me";
import Training from "@/pages/training";
import PWAHomePage from "@/pages/pwa-home";
import NotFound from "@/pages/not-found";

function Router() {
  const { user } = useAuth();
  const isClient = user?.role === 'client';
  
  // Track page views for non-authenticated pages
  if (!user) {
    usePageTracking();
  }

  return (
    <Switch>
      <Route path="/pwa-home" component={PWAHomePage} />
      <Route path="/login" component={AuthPage} />
      <Route path="/auth" component={AuthPage} />
      <Route path="/signup" component={SignupPage} />
      <Route path="/payment-success" component={PaymentSuccessPage} />
      {!user && <Route path="/" component={Landing} />}
      {/* Client-specific routes */}
      {isClient && <ProtectedRoute path="/" component={ClientDashboard} />}
      {isClient && <ProtectedRoute path="/client-campaigns" component={ClientCampaigns} />}
      {isClient && <ProtectedRoute path="/client-content" component={ClientContent} />}
      {isClient && <ProtectedRoute path="/client-analytics" component={ClientAnalytics} />}
      {isClient && <ProtectedRoute path="/client-billing" component={ClientBilling} />}
      {isClient && <ProtectedRoute path="/second-me" component={SecondMe} />}
      {/* Admin/Manager/Staff routes */}
      {!isClient && <ProtectedRoute path="/" component={Dashboard} />}
      {!isClient && <ProtectedRoute path="/clients" component={Clients} />}
      {!isClient && <ProtectedRoute path="/campaigns" component={Campaigns} />}
      {!isClient && <ProtectedRoute path="/tasks" component={Tasks} />}
      {!isClient && <ProtectedRoute path="/leads" component={Leads} />}
      {!isClient && <ProtectedRoute path="/content" component={Content} />}
      {!isClient && <ProtectedRoute path="/invoices" component={Invoices} />}
      {!isClient && <ProtectedRoute path="/subscription-packages" component={SubscriptionPackages} />}
      {!isClient && <ProtectedRoute path="/onboarding" component={Onboarding} />}
      {!isClient && <ProtectedRoute path="/messages" component={Messages} />}
      {!isClient && <ProtectedRoute path="/website-projects" component={WebsiteProjects} />}
      {!isClient && <ProtectedRoute path="/analytics" component={Analytics} />}
      {!isClient && <ProtectedRoute path="/team" component={Team} />}
      {!isClient && <ProtectedRoute path="/emails" component={Emails} />}
      {!isClient && <ProtectedRoute path="/phone" component={Phone} />}
      {!isClient && <ProtectedRoute path="/company-calendar" component={CompanyCalendar} />}
      {!isClient && <ProtectedRoute path="/admin-second-me" component={AdminSecondMe} />}
      {!isClient && <ProtectedRoute path="/training" component={Training} />}
      {/* Shared routes (both clients and staff) */}
      <ProtectedRoute path="/tickets" component={Tickets} />
      <ProtectedRoute path="/settings" component={Settings} />
      <Route component={NotFound} />
    </Switch>
  );
}

// Custom Hamburger Menu Button Component
function HamburgerMenu() {
  const { toggleSidebar } = useSidebar();
  
  return (
    <Button
      variant="outline"
      size="lg"
      onClick={toggleSidebar}
      className="h-12 w-12 p-0 rounded-xl border-2 hover:bg-primary/10 hover:border-primary transition-all shadow-sm"
      aria-label="Toggle menu"
    >
      <Menu className="h-6 w-6" strokeWidth={2.5} />
    </Button>
  );
}

function AppContent() {
  const { user, isLoading } = useAuth();
  
  // Track page views automatically
  usePageTracking();

  const sidebarStyle = {
    "--sidebar-width": "16rem",
    "--sidebar-width-icon": "3rem",
  };

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-background">
        <div className="animate-spin w-12 h-12 border-4 border-primary border-t-transparent rounded-full" data-testid="loading-spinner"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <TooltipProvider>
        <Toaster />
        <PWAInstallButton />
        <Router />
      </TooltipProvider>
    );
  }

  return (
    <TooltipProvider>
      <SidebarProvider style={sidebarStyle as React.CSSProperties}>
        <div className="flex h-screen w-full">
          <AppSidebar />
          <div className="flex flex-col flex-1 overflow-hidden">
            <header className="sticky top-0 z-50 flex items-center gap-3 px-3 md:px-6 py-4 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
              {/* Left: Hamburger + Logo (logo only on mobile) */}
              <div className="flex items-center gap-3 md:gap-3">
                <HamburgerMenu />
                <img 
                  src={mtaLogoBlue} 
                  alt="Marketing Team App" 
                  className="h-20 w-auto dark:hidden md:hidden"
                />
                <img 
                  src={mtaLogoWhite} 
                  alt="Marketing Team App" 
                  className="h-20 w-auto hidden dark:block md:dark:hidden"
                />
              </div>
              
              {/* Center: Search Bar (all screens) */}
              <div className="flex items-center justify-center flex-1">
                <GlobalSearch />
              </div>
              
              {/* Right: Actions */}
              <div className="flex items-center gap-2 ml-auto">
                <NotificationsCenter />
                <ThemeToggle />
              </div>
            </header>
            <main className="flex-1 overflow-auto">
              <Router />
            </main>
          </div>
        </div>
        {/* NotificationPermissionPrompt removed - using Native Web Push */}
      </SidebarProvider>
      <Toaster />
      <PWAInstallButton />
    </TooltipProvider>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;

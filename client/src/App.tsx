import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider, useQuery } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { ThemeToggle } from "@/components/theme-toggle";
import { GlobalSearch } from "@/components/GlobalSearch";
import { NotificationsCenter } from "@/components/NotificationsCenter";
import { useAuth, AuthProvider } from "@/hooks/use-auth";
import { ProtectedRoute } from "@/lib/protected-route";
import { usePageTracking } from "@/hooks/usePageTracking";

import AuthPage from "@/pages/auth-page";
import Landing from "@/pages/landing";
import SignupPage from "@/pages/signup";
import PaymentSuccessPage from "@/pages/payment-success";
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
import Pipeline from "@/pages/pipeline";
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
import NotFound from "@/pages/not-found";
import MarketingCenter from "@/pages/marketing-center";
import AdminBlog from "@/pages/admin-blog";
import Creators from "@/pages/creators";
import Visits from "@/pages/visits";
import AdminPayouts from "@/pages/admin-payouts";
import AdminVault from "@/pages/admin-vault";
import AdminSocialStats from "@/pages/admin-social-stats";
import Commissions from "@/pages/commissions";
import DiscountCodes from "@/pages/discount-codes";
import AIBusinessManager from "@/pages/ai-business-manager";
import AIContentGenerator from "@/pages/ai-content-generator";
import Training from "@/pages/training";
import PushNotifications from "@/pages/push-notifications";
import DashboardStaff from "@/pages/dashboard-staff";
import DashboardManager from "@/pages/dashboard-manager";
import AdminDebugLogs from "@/pages/admin-debug-logs";

function Router() {
  const { user } = useAuth();
  const isClient = user?.role === 'client';

  return (
    <Switch>
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
      {!isClient && <ProtectedRoute path="/pipeline" component={Pipeline} />}
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
      {!isClient && <ProtectedRoute path="/marketing-center" component={MarketingCenter} />}
      {!isClient && <ProtectedRoute path="/admin/blog" component={AdminBlog} />}
      {!isClient && <ProtectedRoute path="/creators" component={Creators} />}
      {!isClient && <ProtectedRoute path="/visits" component={Visits} />}
      {!isClient && <ProtectedRoute path="/admin/creators/payouts" component={AdminPayouts} />}
      {!isClient && <ProtectedRoute path="/admin/vault" component={AdminVault} />}
      {!isClient && <ProtectedRoute path="/admin/social-stats" component={AdminSocialStats} />}
      {!isClient && <ProtectedRoute path="/commissions" component={Commissions} />}
      {!isClient && <ProtectedRoute path="/discount-codes" component={DiscountCodes} />}
      {!isClient && <ProtectedRoute path="/admin/ai-manager" component={AIBusinessManager} />}
      {!isClient && <ProtectedRoute path="/admin/ai-content-generator" component={AIContentGenerator} />}
      {!isClient && <ProtectedRoute path="/training" component={Training} />}
      {!isClient && <ProtectedRoute path="/push-notifications" component={PushNotifications} />}
      {!isClient && <ProtectedRoute path="/dashboard-staff" component={DashboardStaff} />}
      {!isClient && <ProtectedRoute path="/dashboard-manager" component={DashboardManager} />}
      {!isClient && <ProtectedRoute path="/admin/debug-logs" component={AdminDebugLogs} />}
      {/* Shared routes (both clients and staff) */}
      <ProtectedRoute path="/tickets" component={Tickets} />
      <ProtectedRoute path="/settings" component={Settings} />
      <Route component={NotFound} />
    </Switch>
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
            <header className="flex items-center gap-4 px-4 py-3 border-b bg-background">
              <div className="flex items-center gap-2 flex-1">
                <SidebarTrigger data-testid="button-sidebar-toggle" />
              </div>
              <div className="flex items-center justify-center flex-1">
                <GlobalSearch />
              </div>
              <div className="flex items-center justify-end gap-2 flex-1">
                <NotificationsCenter />
                <ThemeToggle />
              </div>
            </header>
            <main className="flex-1 overflow-auto">
              <Router />
            </main>
          </div>
        </div>
      </SidebarProvider>
      <Toaster />
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

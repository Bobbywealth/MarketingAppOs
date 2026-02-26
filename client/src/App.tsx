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
import { CommandPalette } from "@/components/CommandPalette";
import { useAuth, AuthProvider } from "@/hooks/use-auth";
import { ProtectedRoute } from "@/lib/protected-route";
import { usePageTracking } from "@/hooks/usePageTracking";

import AuthPage from "@/pages/auth-page";
import Landing from "@/pages/landing";
import SignupPage from "@/pages/signup";
import PaymentSuccessPage from "@/pages/payment-success";
import Dashboard from "@/pages/dashboard";
import ClientDashboard from "@/pages/client-dashboard";
import CreatorDashboard from "@/pages/creator-dashboard";
import SalesDashboard from "@/pages/sales-dashboard";
import ClientContent from "@/pages/client-content";
import ClientCampaigns from "@/pages/client-campaigns";
import ClientBilling from "@/pages/client-billing";
import ClientAnalytics from "@/pages/client-analytics";
import ClientDailyWorkflow from "@/pages/client-daily-workflow";
import ClientAutomation from "@/pages/client-automation";
import Clients from "@/pages/clients";
import ClientDetail from "@/pages/client-detail";
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
import DashboardAdmin from "@/pages/dashboard-admin";
import AdminDebugLogs from "@/pages/admin-debug-logs";
import Demo from "@/pages/demo";
import Blog from "@/pages/blog";
import Contact from "@/pages/contact";
import CreatorSignup from "@/pages/creator-signup";
import Privacy from "@/pages/privacy";
import Terms from "@/pages/terms";
import Services from "@/pages/services";
import About from "@/pages/about";
import Pricing from "@/pages/pricing";

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
      {/* Public pages accessible to everyone */}
      <Route path="/blog" component={Blog} />
      <Route path="/blog/:slug" component={Blog} />
      <Route path="/contact" component={Contact} />
      <Route path="/become-creator" component={CreatorSignup} />
      <Route path="/privacy" component={Privacy} />
      <Route path="/terms" component={Terms} />
      <Route path="/services" component={Services} />
      <Route path="/about" component={About} />
      <Route path="/pricing" component={Pricing} />
      {/* Client-specific routes */}
      {isClient && <ProtectedRoute path="/" component={ClientDashboard} />}
      {isClient && <ProtectedRoute path="/client-dashboard" component={ClientDashboard} allowedRoles={["client"]} />}
      {isClient && <ProtectedRoute path="/client-campaigns" component={ClientCampaigns} />}
      {isClient && <ProtectedRoute path="/client-content" component={ClientContent} />}
      {isClient && <ProtectedRoute path="/client-analytics" component={ClientAnalytics} />}
      {isClient && <ProtectedRoute path="/client-daily-workflow" component={ClientDailyWorkflow} />}
      {isClient && <ProtectedRoute path="/client-automation" component={ClientAutomation} />}
      <ProtectedRoute path="/client-automation" component={ClientAutomation} />
      {isClient && <ProtectedRoute path="/client-billing" component={ClientBilling} />}
      {isClient && <ProtectedRoute path="/second-me" component={SecondMe} />}
      {/* Admin/Manager/Staff routes */}
      {!isClient && <ProtectedRoute path="/" component={Dashboard} />}
      {!isClient && <ProtectedRoute path="/dashboard" component={Dashboard} />}
      {!isClient && (
        <ProtectedRoute
          path="/dashboard-admin"
          component={DashboardAdmin}
          allowedRoles={["admin", "creator_manager", "staff_content_creator"]}
        />
      )}
      {!isClient && <ProtectedRoute path="/dashboard-manager" component={DashboardManager} allowedRoles={["manager"]} />}
      {!isClient && <ProtectedRoute path="/dashboard-staff" component={DashboardStaff} allowedRoles={["staff"]} />}
      {!isClient && <ProtectedRoute path="/creator-dashboard" component={CreatorDashboard} allowedRoles={["creator"]} />}
      {!isClient && <ProtectedRoute path="/sales-dashboard" component={SalesDashboard} allowedRoles={["sales_agent"]} />}
      {!isClient && <ProtectedRoute path="/clients" component={Clients} />}
      {!isClient && <ProtectedRoute path="/clients/:id" component={ClientDetail} />}
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
      {!isClient && <ProtectedRoute path="/admin/debug-logs" component={AdminDebugLogs} />}
      {!isClient && <ProtectedRoute path="/demo" component={Demo} />}
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
        {/* Skip to main content link for accessibility */}
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded-md focus:outline-none"
        >
          Skip to main content
        </a>
        <div className="flex h-screen w-full">
          <AppSidebar />
          <div className="flex flex-col flex-1 overflow-hidden">
            <header className="flex items-center gap-4 px-4 py-3 border-b bg-background">
              <div className="flex items-center gap-2 flex-1">
                <SidebarTrigger data-testid="button-sidebar-toggle" aria-label="Toggle sidebar" />
              </div>
              <div className="flex items-center justify-center flex-1">
                <GlobalSearch />
              </div>
              <div className="flex items-center justify-end gap-2 flex-1">
                <NotificationsCenter />
                <ThemeToggle />
              </div>
            </header>
            <main id="main-content" className="flex-1 overflow-auto" tabIndex={-1}>
              <Router />
            </main>
          </div>
        </div>
      </SidebarProvider>
      <Toaster />
      <CommandPalette />
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

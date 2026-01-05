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
import { DashboardSwitcher } from "@/components/DashboardSwitcher";
// NotificationPermissionPrompt removed - using Native Web Push
import { PWAInstallButton } from "@/components/PWAInstallButton";
import { LoadingScreen } from "@/components/LoadingScreen";
import ErrorBoundary from "@/components/ErrorBoundary";
import { useAuth, AuthProvider } from "@/hooks/use-auth";
import { ProtectedRoute } from "@/lib/protected-route";
import { usePageTracking } from "@/hooks/usePageTracking";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useEffect, lazy, Suspense } from "react";
import { useLocation } from "wouter";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import { Logo } from "@/components/Logo";
import { MobileNav } from "@/components/MobileNav";
import { useIsMobile } from "@/hooks/use-mobile";
import { RouteSkeleton } from "@/components/RouteSkeleton";
import { AnimatePresence } from "framer-motion";
import { PageTransition } from "@/components/PageTransition";
import { OfflineBanner } from "@/components/OfflineBanner";
import { UpdateBanner } from "@/components/UpdateBanner";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";

// Lazy load all pages for better mobile performance
const AuthPage = lazy(() => import("@/pages/auth-page"));
const VerifyEmail = lazy(() => import("@/pages/verify-email"));
const Landing = lazy(() => import("@/pages/landing"));
const SignupPage = lazy(() => import("@/pages/signup"));
const PostPaymentOnboarding = lazy(() => import("@/pages/post-payment-onboarding"));
const PaymentSuccessPage = lazy(() => import("@/pages/payment-success"));
const ContactPage = lazy(() => import("@/pages/contact"));
const BlogPage = lazy(() => import("@/pages/blog"));
const Dashboard = lazy(() => import("@/pages/dashboard"));
const ClientDashboard = lazy(() => import("@/pages/client-dashboard"));
const SalesDashboard = lazy(() => import("@/pages/sales-dashboard"));
const ClientContent = lazy(() => import("@/pages/client-content"));
const ClientCampaigns = lazy(() => import("@/pages/client-campaigns"));
const ClientBilling = lazy(() => import("@/pages/client-billing"));
const ClientAnalytics = lazy(() => import("@/pages/client-analytics"));
const Clients = lazy(() => import("@/pages/clients"));
const ClientDetail = lazy(() => import("@/pages/client-detail"));
const AdminSocialStats = lazy(() => import("@/pages/admin-social-stats"));
const Campaigns = lazy(() => import("@/pages/campaigns"));
const MarketingCenter = lazy(() => import("@/pages/marketing-center"));
const Tasks = lazy(() => import("@/pages/tasks"));
const Leads = lazy(() => import("@/pages/leads"));
const Content = lazy(() => import("@/pages/content"));
const Invoices = lazy(() => import("@/pages/invoices"));
const Tickets = lazy(() => import("@/pages/tickets"));
const Onboarding = lazy(() => import("@/pages/onboarding"));
const Messages = lazy(() => import("@/pages/messages"));
const WebsiteProjects = lazy(() => import("@/pages/website-projects"));
const Analytics = lazy(() => import("@/pages/analytics"));
const Team = lazy(() => import("@/pages/team"));
const Emails = lazy(() => import("@/pages/emails"));
const Phone = lazy(() => import("@/pages/phone"));
const Settings = lazy(() => import("@/pages/settings"));
const CompanyCalendar = lazy(() => import("@/pages/company-calendar"));
const SubscriptionPackages = lazy(() => import("@/pages/subscription-packages"));
const DiscountCodes = lazy(() => import("@/pages/discount-codes"));
const SecondMe = lazy(() => import("@/pages/second-me"));
const SecondMeOnboarding = lazy(() => import("@/pages/second-me-onboarding"));
const ClientSecondMeDashboard = lazy(() => import("@/pages/client-second-me-dashboard"));
const AdminSecondMe = lazy(() => import("@/pages/admin-second-me"));
const AdminSecondMeUpload = lazy(() => import("@/pages/admin-second-me-upload"));
const Training = lazy(() => import("@/pages/training"));
const PushNotifications = lazy(() => import("@/pages/push-notifications"));
const PWAHomePage = lazy(() => import("@/pages/pwa-home"));
const NotFound = lazy(() => import("@/pages/not-found"));
const AdminSocialOverview = lazy(() => import("@/pages/admin-social-overview"));
const AdminSocialAccounts = lazy(() => import("@/pages/admin-social-accounts"));
const AIBusinessManager = lazy(() => import("@/pages/ai-business-manager"));
const Commissions = lazy(() => import("@/pages/commissions"));
const Creators = lazy(() => import("@/pages/creators"));
const AdminPayouts = lazy(() => import("@/pages/admin-payouts"));
const CreatorNew = lazy(() => import("@/pages/creator-new"));
const CreatorDetail = lazy(() => import("@/pages/creator-detail"));
const CreatorEdit = lazy(() => import("@/pages/creator-edit"));
const CreatorSignup = lazy(() => import("@/pages/creator-signup"));
const CreatorSignupRedirect = lazy(() => import("@/pages/creator-signup-redirect"));
const CreatorDashboard = lazy(() => import("@/pages/creator-dashboard"));
const CreatorPayouts = lazy(() => import("@/pages/creator-payouts"));
const CreatorCourse = lazy(() => import("@/pages/creator-course"));
const ManageCourses = lazy(() => import("@/pages/creator/ManageCourses"));
const EditCourse = lazy(() => import("@/pages/creator/EditCourse"));
const CreatorMasteringContent = lazy(() => import("@/pages/creator-mastering-content"));
const CreatorVisits = lazy(() => import("@/pages/creator-visits"));
const CreatorMarketing = lazy(() => import("@/pages/creator-marketing"));
const PublicCreatorBooking = lazy(() => import("@/pages/public-creator-booking"));
const Visits = lazy(() => import("@/pages/visits"));
const VisitNew = lazy(() => import("@/pages/visit-new"));
const VisitDetail = lazy(() => import("@/pages/visit-detail"));

// Loading fallback component
function PageLoader() {
  return (
    <RouteSkeleton />
  );
}

function Router() {
  const { user } = useAuth();
  // Role override for testing
  const overrideRole = localStorage.getItem('admin_role_override');
  const effectiveRole = (user?.role === 'admin' && overrideRole) ? overrideRole : user?.role;
  
  const isClient = effectiveRole === 'client';
  const isSalesAgent = effectiveRole === 'sales_agent';
  const isCreator = effectiveRole === 'creator';
  const isInternal = !!user && !isClient && !isSalesAgent && !isCreator; // admin/manager/staff/creator_manager

  return (
    <Suspense fallback={<PageLoader />}>
      <Switch>
        <Route path="/pwa-home" component={PWAHomePage} />
        <Route path="/login" component={AuthPage} />
        <Route path="/auth" component={AuthPage} />
        <Route path="/verify-email" component={VerifyEmail} />
        <Route path="/signup" component={SignupPage} />
        <Route path="/onboarding/post-payment" component={PostPaymentOnboarding} />
        <Route path="/creator-signup" component={CreatorSignupRedirect} />
        <Route path="/signup/creator" component={CreatorSignup} />
        <Route path="/book/:creatorId" component={PublicCreatorBooking} />
        <Route path="/payment-success" component={PaymentSuccessPage} />
        <Route path="/contact" component={ContactPage} />
        <Route path="/blog" component={BlogPage} />
        {!user && <Route path="/" component={Landing} />}
        {/* Client-specific routes */}
        {isClient && <ProtectedRoute path="/" component={ClientDashboard} />}
        {/* Sales Agent-specific routes */}
        {isSalesAgent && <ProtectedRoute path="/" component={SalesDashboard} />}
        {/* Creator-specific routes */}
        {isCreator && <ProtectedRoute path="/" component={CreatorDashboard} />}
        {isCreator && <ProtectedRoute path="/course" component={CreatorCourse} />}
        {isCreator && <ProtectedRoute path="/payouts" component={CreatorPayouts} />}
        {isCreator && <ProtectedRoute path="/marketing" component={CreatorMarketing} />}
        {effectiveRole === 'admin' && <ProtectedRoute path="/manage-courses" component={ManageCourses} />}
        {effectiveRole === 'admin' && <ProtectedRoute path="/manage-courses/:id" component={EditCourse} />}
        {isCreator && <ProtectedRoute path="/training/mastering-content" component={CreatorMasteringContent} />}
        <ProtectedRoute path="/course/:id" component={CreatorCourse} />
        {isCreator && <ProtectedRoute path="/visits" component={CreatorVisits} />}
        {isCreator && <ProtectedRoute path="/visits/:id" component={VisitDetail} />}
        
        {isClient && <ProtectedRoute path="/client-campaigns" component={ClientCampaigns} />}
        {isClient && <ProtectedRoute path="/client-content" component={ClientContent} />}
        {isClient && <ProtectedRoute path="/client-analytics" component={ClientAnalytics} />}
        {isClient && <ProtectedRoute path="/client-billing" component={ClientBilling} />}
        {isClient && <ProtectedRoute path="/second-me" component={ClientSecondMeDashboard} />}
        {isClient && <ProtectedRoute path="/second-me/onboarding" component={SecondMeOnboarding} />}
        {/* Admin/Manager/Staff routes */}
        {isInternal && <ProtectedRoute path="/" component={Dashboard} />}
        {!isClient && <ProtectedRoute path="/clients/:id" component={ClientDetail} />}
        {!isClient && <ProtectedRoute path="/clients" component={Clients} />}
        {isInternal && <ProtectedRoute path="/admin/social-stats" component={AdminSocialStats} />}
        {isInternal && <ProtectedRoute path="/marketing-center" component={MarketingCenter} />}
        {isInternal && <ProtectedRoute path="/campaigns" component={Campaigns} />}
        {!isClient && <ProtectedRoute path="/tasks" component={Tasks} />}
        {!isClient && <ProtectedRoute path="/leads" component={Leads} />}
        {isInternal && <ProtectedRoute path="/content" component={Content} />}
        {isInternal && <ProtectedRoute path="/invoices" component={Invoices} />}
        {isInternal && <ProtectedRoute path="/commissions" component={Commissions} />}
        {isInternal && <ProtectedRoute path="/subscription-packages" component={SubscriptionPackages} />}
        {isInternal && <ProtectedRoute path="/discount-codes" component={DiscountCodes} />}
        {isInternal && <ProtectedRoute path="/onboarding" component={Onboarding} />}
        {!isClient && <ProtectedRoute path="/messages" component={Messages} />}
        {isInternal && <ProtectedRoute path="/website-projects" component={WebsiteProjects} />}
        {isInternal && <ProtectedRoute path="/analytics" component={Analytics} />}
        {isInternal && <ProtectedRoute path="/team" component={Team} />}
        {!isClient && <ProtectedRoute path="/emails" component={Emails} />}
        {!isClient && <ProtectedRoute path="/phone" component={Phone} />}
        {!isClient && <ProtectedRoute path="/company-calendar" component={CompanyCalendar} />}
        {isInternal && <ProtectedRoute path="/admin-second-me" component={AdminSecondMe} />}
        {isInternal && <ProtectedRoute path="/admin-second-me/upload" component={AdminSecondMeUpload} />}
        {isInternal && <ProtectedRoute path="/training" component={Training} />}
        {isInternal && <ProtectedRoute path="/push-notifications" component={PushNotifications} />}
        {isInternal && <ProtectedRoute path="/social" component={AdminSocialOverview} />}
        {isInternal && <ProtectedRoute path="/social/accounts" component={AdminSocialAccounts} />}
        {isInternal && <ProtectedRoute path="/creators" component={Creators} />}
        {isInternal && <ProtectedRoute path="/creators/payouts" component={AdminPayouts} />}
        {isInternal && <ProtectedRoute path="/creators/new" component={CreatorNew} />}
        {isInternal && <ProtectedRoute path="/creators/:id" component={CreatorDetail} />}
        {isInternal && <ProtectedRoute path="/creators/:id/edit" component={CreatorEdit} />}
        {isInternal && <ProtectedRoute path="/visits" component={Visits} />}
        {isInternal && <ProtectedRoute path="/visits/new" component={VisitNew} />}
        {isInternal && <ProtectedRoute path="/visits/:id" component={VisitDetail} />}
        {user?.role === "admin" && <ProtectedRoute path="/ai-manager" component={AIBusinessManager} />}
        {/* Shared routes (both clients and staff) */}
        <ProtectedRoute path="/tickets" component={Tickets} />
        <ProtectedRoute path="/settings" component={Settings} />
        <Route component={NotFound} />
      </Switch>
    </Suspense>
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
  const [, setLocation] = useLocation();
  const [routeLocation] = useLocation();
  const isMobile = useIsMobile();
  const { isSupported, isSubscribed, subscribe, loading } = usePushNotifications({ enabled: !!user });
  const shouldShowPushPrompt = !!user && isSupported && !isSubscribed && typeof Notification !== 'undefined' && Notification.permission === 'default' && !localStorage.getItem('pushPromptShownV2');
  
  // Track page views automatically
  usePageTracking();

  // Keyboard shortcuts (desktop): Cmd/Ctrl+K opens search, g+t tasks, g+m messages
  useKeyboardShortcuts({
    enabled: !isMobile && !!user,
    onGoToSearch: () => {
      try {
        window.dispatchEvent(new CustomEvent("mta:open-global-search"));
      } catch {}
    },
    onGoToTasks: () => setLocation("/tasks"),
    onGoToMessages: () => setLocation("/messages"),
  });

  // Handle navigation from push notifications
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data && event.data.type === 'NAVIGATE') {
        console.log('Navigating to:', event.data.url);
        setLocation(event.data.url);
      }
    };

    navigator.serviceWorker?.addEventListener('message', handleMessage);
    
    return () => {
      navigator.serviceWorker?.removeEventListener('message', handleMessage);
    };
  }, [setLocation]);

  // Persist last visited route for offline retry UX
  useEffect(() => {
    try {
      sessionStorage.setItem("mta:lastUrl", routeLocation);
    } catch {}
  }, [routeLocation]);

  // Force email verification if logged in but not verified
  // Exempt admins and managers from being blocked by verification screen
  useEffect(() => {
    const isExempt = user?.role === 'admin' || user?.role === 'manager';
    if (user && !user.emailVerified && !isExempt && routeLocation !== "/verify-email") {
      setLocation("/verify-email");
    }
  }, [user, routeLocation, setLocation]);

  const sidebarStyle = {
    "--sidebar-width": "16.25rem", // 260px - wider for better readability
    "--sidebar-width-icon": "3rem",
  };

  if (isLoading) {
    const publicPages = ["/", "/signup", "/signup/creator", "/contact", "/blog", "/auth", "/login"];
    const isPublicPage = publicPages.includes(window.location.pathname) || 
                         window.location.pathname.startsWith("/signup/");
    
    if (isPublicPage) {
      return (
        <div className="h-screen flex items-center justify-center bg-background">
          <div className="animate-spin w-12 h-12 border-4 border-primary border-t-transparent rounded-full" data-testid="loading-spinner"></div>
        </div>
      );
    }
    
    return <LoadingScreen />;
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
            <UpdateBanner />
            <OfflineBanner />
            <header className="sticky top-0 z-50 flex items-center gap-2 px-3 md:px-6 py-3 md:py-4 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
              {/* Left: Hamburger (logo removed on mobile) */}
              <div className="flex items-center gap-2 md:gap-3">
                <HamburgerMenu />
              </div>
              
              {/* Center: Search Bar (all screens) */}
              <div className="flex items-center justify-center flex-1">
                <GlobalSearch />
              </div>
              
              {/* Right: Actions */}
              <div className="flex items-center gap-1 md:gap-2 ml-auto">
                {user?.role === 'admin' && <DashboardSwitcher />}
                <NotificationsCenter />
                {!isMobile && <ThemeToggle />}
              </div>
            </header>
            {shouldShowPushPrompt && (
              <div className="px-3 md:px-6 py-3 bg-blue-50 dark:bg-blue-950/30 border-b text-sm flex items-center justify-between">
                <div className="text-blue-900 dark:text-blue-100">Enable push notifications to get alerts on this device.</div>
                <div className="flex items-center gap-2">
                  <Button size="sm" onClick={async () => { await subscribe(); localStorage.setItem('pushPromptShownV2', '1'); }} disabled={loading}>
                    {loading ? 'Enabling…' : 'Enable'}
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => localStorage.setItem('pushPromptShownV2', '1')}>Later</Button>
                </div>
              </div>
            )}
            <main className={`flex-1 overflow-auto ${isMobile ? 'pb-20' : ''}`}>
              <AnimatePresence mode="wait" initial={false}>
                <PageTransition routeKey={routeLocation}>
                  <Router />
                </PageTransition>
              </AnimatePresence>
            </main>
          </div>
        </div>
        {/* NotificationPermissionPrompt removed - using Native Web Push */}
      </SidebarProvider>
      <Toaster />
      <PWAInstallButton />
      <MobileNav />
    </TooltipProvider>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ErrorBoundary>
          <AppContent />
        </ErrorBoundary>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;

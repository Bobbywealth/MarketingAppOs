import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { resolveApiUrl } from "./lib/api";
import { isNativeApp } from "./lib/runtime";
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
import { getEffectiveRole } from "@/lib/effective-role";
import { usePermissions } from "@/hooks/usePermissions";

// Lazy load all pages for better mobile performance
const AuthPage = lazy(() => import("@/pages/auth-page"));
const VerifyEmail = lazy(() => import("@/pages/verify-email"));
const Landing = lazy(() => import("@/pages/landing"));
const SignupPage = lazy(() => import("@/pages/signup"));
const PostPaymentOnboarding = lazy(() => import("@/pages/post-payment-onboarding"));
const PaymentSuccessPage = lazy(() => import("@/pages/payment-success"));
const ContactPage = lazy(() => import("@/pages/contact"));
const BlogPage = lazy(() => import("@/pages/blog-db"));
const PrivacyPolicyPage = lazy(() => import("@/pages/privacy"));
const TermsOfServicePage = lazy(() => import("@/pages/terms"));
const Dashboard = lazy(() => import("@/pages/dashboard")); // /dashboard redirect
const AdminDashboard = lazy(() => import("@/pages/dashboard-admin"));
const ManagerDashboard = lazy(() => import("@/pages/dashboard-manager"));
const StaffDashboard = lazy(() => import("@/pages/dashboard-staff"));
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
const HelpPage = lazy(() => import("@/pages/help"));
const NotFound = lazy(() => import("@/pages/not-found"));
const AdminSocialOverview = lazy(() => import("@/pages/admin-social-overview"));
const AdminSocialAccounts = lazy(() => import("@/pages/admin-social-accounts"));
const AdminBlog = lazy(() => import("@/pages/admin-blog"));
const AIBusinessManager = lazy(() => import("@/pages/ai-business-manager"));
const AIContentGenerator = lazy(() => import("@/pages/ai-content-generator"));
const Commissions = lazy(() => import("@/pages/commissions"));
const Creators = lazy(() => import("@/pages/creators"));
const AdminPayouts = lazy(() => import("@/pages/admin-payouts"));
const AdminVault = lazy(() => import("@/pages/admin-vault"));
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
  const effectiveRole = getEffectiveRole((user as any)?.role);
  const { canAccess, isAdmin, isManager } = usePermissions();
  
  const isClient = effectiveRole === 'client';
  const isSalesAgent = effectiveRole === 'sales_agent';
  const isCreator = effectiveRole === 'creator';
  const isProspectiveClient = effectiveRole === 'prospective_client';
  const isInternal = !!user && ["admin", "manager", "staff", "creator_manager"].includes(effectiveRole); // explicit allowlist

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
        <Route path="/privacy" component={PrivacyPolicyPage} />
        <Route path="/terms" component={TermsOfServicePage} />
        {!user && <Route path="/" component={Landing} />}
        {/* Client-specific routes */}
        {isClient && <ProtectedRoute path="/" component={ClientDashboard} />}
        {isProspectiveClient && <ProtectedRoute path="/" component={() => <Redirect to="/signup" />} />}
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
        {/* Clients should use /content (keep /client-content for backwards compat) */}
        {isClient && <ProtectedRoute path="/content" component={ClientContent} />}
        {isClient && <ProtectedRoute path="/client-content" component={ClientContent} />}
        {isClient && <ProtectedRoute path="/client-analytics" component={ClientAnalytics} />}
        {isClient && <ProtectedRoute path="/client-billing" component={ClientBilling} />}
        {isClient && <ProtectedRoute path="/second-me" component={ClientSecondMeDashboard} />}
        {isClient && <ProtectedRoute path="/second-me/onboarding" component={SecondMeOnboarding} />}
        {/* Admin/Manager/Staff routes */}
        {isInternal && <ProtectedRoute path="/dashboard/admin" component={AdminDashboard} />}
        {isInternal && <ProtectedRoute path="/dashboard/manager" component={ManagerDashboard} />}
        {isInternal && <ProtectedRoute path="/dashboard/staff" component={StaffDashboard} />}
        {user && <ProtectedRoute path="/dashboard" component={Dashboard} />}
        {isInternal && <ProtectedRoute path="/" component={Dashboard} />}
        {!isClient && <ProtectedRoute path="/clients/:id" component={ClientDetail} />}
        {!isClient && <ProtectedRoute path="/clients" component={Clients} />}
        {isInternal && <ProtectedRoute path="/admin/social-stats" component={AdminSocialStats} />}
        {isInternal && <ProtectedRoute path="/marketing-center" component={isAdmin ? MarketingCenter : Dashboard} />}
        {isInternal && <ProtectedRoute path="/campaigns" component={Campaigns} />}
        {!isClient && <ProtectedRoute path="/tasks" component={Tasks} />}
        {!isClient && <ProtectedRoute path="/leads" component={Leads} />}
        {isInternal && <ProtectedRoute path="/content" component={Content} />}
        {isInternal && <ProtectedRoute path="/admin/blog" component={AdminBlog} />}
        {isInternal && <ProtectedRoute path="/admin/vault" component={isAdmin ? AdminVault : Dashboard} />}
        {isInternal && <ProtectedRoute path="/invoices" component={canAccess("canManageInvoices") ? Invoices : Dashboard} />}
        {isInternal && <ProtectedRoute path="/commissions" component={(isAdmin || isManager) ? Commissions : Dashboard} />}
        {isInternal && <ProtectedRoute path="/subscription-packages" component={isAdmin ? SubscriptionPackages : Dashboard} />}
        {isInternal && <ProtectedRoute path="/discount-codes" component={isAdmin ? DiscountCodes : Dashboard} />}
        {isInternal && <ProtectedRoute path="/onboarding" component={Onboarding} />}
        {!isClient && <ProtectedRoute path="/messages" component={Messages} />}
        {isInternal && <ProtectedRoute path="/website-projects" component={WebsiteProjects} />}
        {isInternal && <ProtectedRoute path="/analytics" component={Analytics} />}
        {isInternal && <ProtectedRoute path="/team" component={isAdmin ? Team : Dashboard} />}
        {!isClient && <ProtectedRoute path="/emails" component={Emails} />}
        {!isClient && <ProtectedRoute path="/phone" component={Phone} />}
        {!isClient && <ProtectedRoute path="/company-calendar" component={CompanyCalendar} />}
        {isInternal && <ProtectedRoute path="/help" component={HelpPage} />}
        {isInternal && <ProtectedRoute path="/admin-second-me" component={AdminSecondMe} />}
        {isInternal && <ProtectedRoute path="/admin-second-me/upload" component={AdminSecondMeUpload} />}
        {isInternal && <ProtectedRoute path="/training" component={isAdmin ? Training : Dashboard} />}
        {isInternal && <ProtectedRoute path="/push-notifications" component={PushNotifications} />}
        {isInternal && <ProtectedRoute path="/social" component={AdminSocialOverview} />}
        {isInternal && <ProtectedRoute path="/social/accounts" component={AdminSocialAccounts} />}
        {isInternal && <ProtectedRoute path="/creators" component={Creators} />}
        {isInternal && <ProtectedRoute path="/creators/payouts" component={(isAdmin || isManager) ? AdminPayouts : Dashboard} />}
        {isInternal && <ProtectedRoute path="/creators/new" component={CreatorNew} />}
        {isInternal && <ProtectedRoute path="/creators/:id" component={CreatorDetail} />}
        {isInternal && <ProtectedRoute path="/creators/:id/edit" component={CreatorEdit} />}
        {isInternal && <ProtectedRoute path="/visits" component={Visits} />}
        {isInternal && <ProtectedRoute path="/visits/new" component={VisitNew} />}
        {isInternal && <ProtectedRoute path="/visits/:id" component={VisitDetail} />}
        {isInternal && <ProtectedRoute path="/ai-manager" component={isAdmin ? AIBusinessManager : Dashboard} />}
        {isInternal && <ProtectedRoute path="/ai-content-generator" component={isAdmin ? AIContentGenerator : Dashboard} />}
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
  // wouter's location may include query/hash; normalize so route checks are reliable
  const routePathname = (routeLocation || "").split(/[?#]/)[0].replace(/\/+$/, "") || "/";
  const isMessagesRoute = routePathname === "/messages" || routePathname.startsWith("/messages/");
  const debugEnabled =
    Boolean((import.meta as any)?.env?.DEV) ||
    (() => {
      try {
        return new URLSearchParams(window.location.search).has("__debug");
      } catch {
        return false;
      }
    })();
  const { isSupported, isSubscribed, subscribe, loading } = usePushNotifications({ enabled: !!user });
  const shouldShowPushPrompt = !!user && isSupported && !isSubscribed && typeof Notification !== 'undefined' && Notification.permission === 'default' && !localStorage.getItem('pushPromptShownV2');
  const native = isNativeApp();

  // #region agent log (hypothesis A/B: page is scrolling instead of chat container, or main isn't overflow-hidden at runtime)
  useEffect(() => {
    try {
      if (!debugEnabled) return;
      const main = document.querySelector("main");
      const mainStyle = main ? window.getComputedStyle(main) : null;
      const docEl = document.documentElement;
      fetch('http://127.0.0.1:7243/ingest/80b2583d-14fd-4900-b577-b2baae4d468c',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({sessionId:'debug-session',runId:'messages-height-pre',hypothesisId:'A',location:'client/src/App.tsx:route-effect',message:'route/layout snapshot',data:{routeLocation,routePathname,isMessagesRoute,mainOverflowY:mainStyle?.overflowY,mainOverflowX:mainStyle?.overflowX,mainClientH:(main as any)?.clientHeight,mainScrollH:(main as any)?.scrollHeight,windowInnerH:window.innerHeight,docClientH:docEl.clientHeight,docScrollH:docEl.scrollHeight,bodyScrollH:document.body?.scrollHeight},timestamp:Date.now()})}).catch(()=>{});
      fetch(resolveApiUrl('/api/__debug/log'),{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({sessionId:'debug-session',runId:'messages-height-pre',hypothesisId:'A',location:'client/src/App.tsx:route-effect',message:'route/layout snapshot',data:{routeLocation,routePathname,isMessagesRoute,mainOverflowY:mainStyle?.overflowY,mainOverflowX:mainStyle?.overflowX,mainClientH:(main as any)?.clientHeight,mainScrollH:(main as any)?.scrollHeight,windowInnerH:window.innerHeight,docClientH:docEl.clientHeight,docScrollH:docEl.scrollHeight,bodyScrollH:document.body?.scrollHeight},timestamp:Date.now()})}).catch(()=>{});
    } catch {}
  }, [routeLocation, routePathname, isMessagesRoute, debugEnabled]);
  // #endregion agent log
  
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
    if (native) return;
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
  }, [setLocation, native]);

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
    const publicPages = ["/", "/signup", "/signup/creator", "/contact", "/blog", "/privacy", "/terms", "/auth", "/login"];
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
          <div className="flex flex-col flex-1 overflow-hidden min-w-0">
            <UpdateBanner />
            <OfflineBanner />
            <header className="sticky top-0 z-50 flex items-center gap-2 px-2 md:px-6 py-3 md:py-4 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 overflow-hidden w-full">
              {/* Left: Hamburger (logo removed on mobile) */}
              <div className="flex items-center gap-1 md:gap-3 flex-shrink-0">
                <HamburgerMenu />
              </div>
              
              {/* Center: Search Bar (all screens) */}
              <div className="flex items-center justify-center flex-1 min-w-0">
                <GlobalSearch />
              </div>
              
              {/* Right: Actions */}
              <div className="flex items-center gap-1 md:gap-2 ml-auto flex-shrink-0">
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
            {/* Messages needs its own internal scroll containers; avoid body/main growing with long threads */}
            <main className={`flex-1 min-h-0 ${isMessagesRoute ? 'overflow-hidden' : 'overflow-auto'} ${isMobile ? 'pb-20' : ''} overflow-x-hidden w-full`}>
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

import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { ThemeToggle } from "@/components/theme-toggle";
import { GlobalSearch } from "@/components/GlobalSearch";
import { useAuth, AuthProvider } from "@/hooks/use-auth";
import { ProtectedRoute } from "@/lib/protected-route";

import AuthPage from "@/pages/auth-page";
import Landing from "@/pages/landing";
import SignupPage from "@/pages/signup";
import DigitalMarketing from "@/pages/digital-marketing";
import GraphicDesign from "@/pages/graphic-design";
import WebDesign from "@/pages/web-design";
import MobileApp from "@/pages/mobile-app";
import SEO from "@/pages/seo";
import CRM from "@/pages/crm";
import AIAutomation from "@/pages/ai-automation";
import PaymentSolutions from "@/pages/payment-solutions";
import Funding from "@/pages/funding";
import Dashboard from "@/pages/dashboard";
import Clients from "@/pages/clients";
import Campaigns from "@/pages/campaigns";
import Tasks from "@/pages/tasks";
import Pipeline from "@/pages/pipeline";
import Content from "@/pages/content";
import Invoices from "@/pages/invoices";
import Tickets from "@/pages/tickets";
import Onboarding from "@/pages/onboarding";
import Messages from "@/pages/messages";
import WebsiteProjects from "@/pages/website-projects";
import Analytics from "@/pages/analytics";
import Settings from "@/pages/settings";
import NotFound from "@/pages/not-found";

function Router() {
  const { user } = useAuth();

  return (
    <Switch>
      <Route path="/login" component={AuthPage} />
      <Route path="/auth" component={AuthPage} />
      <Route path="/signup" component={SignupPage} />
      <Route path="/digital-marketing" component={DigitalMarketing} />
      <Route path="/graphic-design" component={GraphicDesign} />
      <Route path="/web-design" component={WebDesign} />
      <Route path="/mobile-app" component={MobileApp} />
      <Route path="/seo" component={SEO} />
      <Route path="/crm" component={CRM} />
      <Route path="/ai-automation" component={AIAutomation} />
      <Route path="/payment-solutions" component={PaymentSolutions} />
      <Route path="/funding" component={Funding} />
      {!user && <Route path="/" component={Landing} />}
      <ProtectedRoute path="/" component={Dashboard} />
      <ProtectedRoute path="/clients" component={Clients} />
      <ProtectedRoute path="/campaigns" component={Campaigns} />
      <ProtectedRoute path="/tasks" component={Tasks} />
      <ProtectedRoute path="/pipeline" component={Pipeline} />
      <ProtectedRoute path="/content" component={Content} />
      <ProtectedRoute path="/invoices" component={Invoices} />
      <ProtectedRoute path="/tickets" component={Tickets} />
      <ProtectedRoute path="/onboarding" component={Onboarding} />
      <ProtectedRoute path="/messages" component={Messages} />
      <ProtectedRoute path="/website-projects" component={WebsiteProjects} />
      <ProtectedRoute path="/analytics" component={Analytics} />
      <ProtectedRoute path="/settings" component={Settings} />
      <Route component={NotFound} />
    </Switch>
  );
}

function AppContent() {
  const { user, isLoading } = useAuth();

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
            <header className="flex items-center justify-between gap-4 px-4 py-3 border-b bg-background">
              <div className="flex items-center gap-2 flex-1">
                <SidebarTrigger data-testid="button-sidebar-toggle" />
                <GlobalSearch />
              </div>
              <ThemeToggle />
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

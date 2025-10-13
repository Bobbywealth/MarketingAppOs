import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { ThemeToggle } from "@/components/theme-toggle";
import { GlobalSearch } from "@/components/GlobalSearch";
import { useAuth } from "@/hooks/useAuth";

import Landing from "@/pages/landing";
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
import NotFound from "@/pages/not-found";

function Router({ isAuthenticated }: { isAuthenticated: boolean }) {
  return (
    <Switch>
      {!isAuthenticated ? (
        <Route path="/" component={Landing} />
      ) : (
        <>
          <Route path="/" component={Dashboard} />
          <Route path="/clients" component={Clients} />
          <Route path="/campaigns" component={Campaigns} />
          <Route path="/tasks" component={Tasks} />
          <Route path="/pipeline" component={Pipeline} />
          <Route path="/content" component={Content} />
          <Route path="/invoices" component={Invoices} />
          <Route path="/tickets" component={Tickets} />
          <Route path="/onboarding" component={Onboarding} />
          <Route path="/messages" component={Messages} />
          <Route path="/website-projects" component={WebsiteProjects} />
          <Route path="/analytics" component={Analytics} />
        </>
      )}
      <Route component={NotFound} />
    </Switch>
  );
}

function AppContent() {
  const { isAuthenticated, isLoading } = useAuth();

  const sidebarStyle = {
    "--sidebar-width": "16rem",
    "--sidebar-width-icon": "3rem",
  };

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-background">
        <div className="animate-spin w-12 h-12 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <TooltipProvider>
        <Toaster />
        <Router isAuthenticated={isAuthenticated} />
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
              <Router isAuthenticated={isAuthenticated} />
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
      <AppContent />
    </QueryClientProvider>
  );
}

export default App;

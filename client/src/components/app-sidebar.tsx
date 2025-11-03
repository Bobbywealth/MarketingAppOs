import { 
  LayoutDashboard, 
  Users, 
  Megaphone,
  ListTodo,
  UserPlus,
  TrendingUp, 
  Calendar, 
  DollarSign, 
  Package,
  Ticket, 
  ClipboardCheck,
  MessageSquare,
  Mail,
  Phone,
  Globe,
  BarChart3,
  UsersRound,
  LogOut,
  Settings,
  Sparkles,
  BookOpen,
  Bell
} from "lucide-react";
import { SidebarLogo } from "@/components/Logo";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
  SidebarHeader,
  useSidebar,
} from "@/components/ui/sidebar";
import { Link, useLocation } from "wouter";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/hooks/useAuth";
import { usePermissions } from "@/hooks/usePermissions";

// Client-specific navigation
const clientTools = [
  {
    title: "Dashboard",
    url: "/",
    icon: LayoutDashboard,
  },
  {
    title: "My Campaigns",
    url: "/client-campaigns",
    icon: Megaphone,
  },
  {
    title: "My Content",
    url: "/client-content",
    icon: Calendar,
  },
  {
    title: "Analytics",
    url: "/client-analytics",
    icon: BarChart3,
  },
  {
    title: "Billing",
    url: "/client-billing",
    icon: DollarSign,
  },
  {
    title: "Second Me",
    url: "/second-me",
    icon: Sparkles,
  },
  {
    title: "Support Tickets",
    url: "/tickets",
    icon: Ticket,
  },
  {
    title: "Settings",
    url: "/settings",
    icon: Settings,
  },
];

const companyTools = [
  {
    title: "Dashboard",
    url: "/",
    icon: LayoutDashboard,
    permission: null, // Everyone can access dashboard
  },
  {
    title: "Company Calendar",
    url: "/company-calendar",
    icon: Calendar,
    permission: null, // Everyone can access company calendar
  },
  {
    title: "Team",
    url: "/team",
    icon: UsersRound,
    permission: "canManageUsers" as const,
  },
  {
    title: "Messages",
    url: "/messages",
    icon: MessageSquare,
    permission: null, // Everyone can access messages
  },
  {
    title: "Emails",
    url: "/emails",
    icon: Mail,
    permission: null, // Everyone can access emails
  },
  {
    title: "Phone",
    url: "/phone",
    icon: Phone,
    permission: null, // Everyone can access phone
  },
];

// Operations Section (Clients, Marketing, Projects)
const operationsTools = [
  {
    title: "Clients",
    url: "/clients",
    icon: Users,
    permission: "canManageClients" as const,
  },
  {
    title: "Leads",
    url: "/leads",
    icon: UserPlus,
    permission: "canManageLeads" as const,
  },
  {
    title: "Campaigns",
    url: "/campaigns",
    icon: Megaphone,
    permission: "canManageCampaigns" as const,
  },
  {
    title: "Content Calendar",
    url: "/content",
    icon: Calendar,
    permission: "canManageContent" as const,
  },
  {
    title: "Tasks",
    url: "/tasks",
    icon: ListTodo,
    permission: null, // Everyone can access tasks
  },
  {
    title: "Onboarding",
    url: "/onboarding",
    icon: ClipboardCheck,
    permission: "canManageClients" as const,
  },
  {
    title: "Support Tickets",
    url: "/tickets",
    icon: Ticket,
    permission: "canManageTickets" as const,
  },
  {
    title: "Website Projects",
    url: "/website-projects",
    icon: Globe,
    permission: "canManageClients" as const,
  },
  {
    title: "Second Me",
    url: "/admin-second-me",
    icon: Sparkles,
    permission: "canManageClients" as const,
  },
];

// Business Section (Analytics, Finance, Admin)
const businessTools = [
  {
    title: "Analytics",
    url: "/analytics",
    icon: BarChart3,
    permission: "canManageClients" as const,
  },
  {
    title: "Invoices & Billing",
    url: "/invoices",
    icon: DollarSign,
    permission: "canManageInvoices" as const,
  },
  {
    title: "Subscription Packages",
    url: "/subscription-packages",
    icon: Package,
    permission: "canManageUsers" as const, // Admin only
  },
  {
    title: "Training",
    url: "/training",
    icon: BookOpen,
    permission: "canManageUsers" as const,
  },
  {
    title: "AI Business Manager",
    url: "/ai-manager",
    icon: Sparkles,
    roles: ["admin"] as const, // Admin only
  },
  {
    title: "Push Notifications",
    url: "/push-notifications",
    icon: Bell,
    roles: ["admin", "manager", "staff"] as const, // Admin, managers, and staff only
  },
];

export function AppSidebar() {
  const [location] = useLocation();
  const { user } = useAuth();
  const { setOpenMobile } = useSidebar();

  // Check if running as PWA (standalone mode)
  const isPWA = window.matchMedia('(display-mode: standalone)').matches || 
                (window.navigator as any).standalone === true;
  
  const logoutUrl = isPWA ? '/api/logout?pwa=true' : '/api/logout';
  const { canAccess } = usePermissions();
  const isClient = user?.role === 'client';

  // Close sidebar on mobile when a link is clicked
  const handleLinkClick = () => {
    setOpenMobile(false);
  };

  const getUserInitials = () => {
    if (user?.firstName && user?.lastName) {
      return `${user.firstName[0]}${user.lastName[0]}`.toUpperCase();
    }
    return user?.email?.[0]?.toUpperCase() || "U";
  };

  // For clients, show client-specific menu
  if (isClient) {
    return (
      <Sidebar>
        <SidebarHeader className="flex items-center justify-center py-4">
          <SidebarLogo />
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-3 py-2">
              Menu
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {clientTools.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton 
                      asChild 
                      isActive={location === item.url}
                      data-testid={`sidebar-link-${item.title.toLowerCase().replace(/\s+/g, '-')}`}
                    >
                      <Link href={item.url} className="flex items-center gap-3" onClick={handleLinkClick}>
                        <item.icon className="w-5 h-5" />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
        <SidebarFooter className="p-4 border-t">
          <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 mb-2">
            <Avatar className="h-10 w-10">
              <AvatarFallback className="bg-primary text-primary-foreground">
                {getUserInitials()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{user?.username || "Client"}</p>
              <p className="text-xs text-muted-foreground truncate capitalize">{user?.role || "client"}</p>
            </div>
          </div>
          <a
            href={logoutUrl}
            className="flex items-center gap-2 text-sm text-muted-foreground hover:bg-muted rounded-md px-3 py-2 transition-colors"
            data-testid="button-logout"
          >
            <LogOut className="w-4 h-4" />
            <span>Log Out</span>
          </a>
        </SidebarFooter>
      </Sidebar>
    );
  }

  // For staff/managers/admins, show full menu
  const filteredCompanyTools = companyTools.filter(item => {
    if (!item.permission) return true; // No permission required
    return canAccess(item.permission);
  });

  const filteredOperations = operationsTools.filter(item => {
    if (!item.permission) return true;
    return canAccess(item.permission);
  });

  const filteredBusiness = businessTools.filter(item => {
    if (!item.permission) return true;
    return canAccess(item.permission);
  });

  return (
    <Sidebar>
      <SidebarHeader className="flex items-center justify-center py-4">
          <SidebarLogo />
      </SidebarHeader>
      <SidebarContent>
        {/* Company Tools Section */}
        <SidebarGroup>
          <SidebarGroupLabel className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-3 py-2">
            Company Tools
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {filteredCompanyTools.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={location === item.url} data-testid={`nav-${item.url === '/' ? 'dashboard' : item.url.slice(1)}`}>
                    <Link href={item.url} onClick={handleLinkClick}>
                      <item.icon className="w-4 h-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Operations Section */}
        <SidebarGroup>
          <SidebarGroupLabel className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-3 py-2">
            Operations
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {filteredOperations.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={location === item.url} data-testid={`nav-${item.url === '/' ? 'dashboard' : item.url.slice(1)}`}>
                    <Link href={item.url} onClick={handleLinkClick}>
                      <item.icon className="w-4 h-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Business Section */}
        <SidebarGroup>
          <SidebarGroupLabel className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-3 py-2">
            Business
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {filteredBusiness.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={location === item.url} data-testid={`nav-${item.url === '/' ? 'dashboard' : item.url.slice(1)}`}>
                    <Link href={item.url} onClick={handleLinkClick}>
                      <item.icon className="w-4 h-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="p-4">
        <div className="flex items-center gap-3 mb-3">
          <Avatar className="h-9 w-9">
            <AvatarImage src={user?.profileImageUrl || ""} />
            <AvatarFallback className="bg-primary text-primary-foreground text-sm">
              {getUserInitials()}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate" data-testid="text-user-name">
              {user?.firstName && user?.lastName
                ? `${user.firstName} ${user.lastName}`
                : user?.email || "User"}
            </p>
            <p className="text-xs text-muted-foreground capitalize">{user?.role || "staff"}</p>
          </div>
        </div>
        <div className="space-y-1">
          <Link href="/settings" onClick={handleLinkClick}>
            <div className="flex items-center gap-2 text-sm text-muted-foreground hover-elevate rounded-md px-3 py-2 transition-colors cursor-pointer">
              <Settings className="w-4 h-4" />
              <span>Settings</span>
            </div>
          </Link>
          <a
            href={logoutUrl}
            className="flex items-center gap-2 text-sm text-muted-foreground hover-elevate rounded-md px-3 py-2 transition-colors"
            data-testid="button-logout"
          >
            <LogOut className="w-4 h-4" />
            <span>Log Out</span>
          </a>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}


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
  Bell,
  ChevronLeft,
  ChevronRight,
  Circle,
  LineChart,
  User,
  Percent,
} from "lucide-react";
import { Logo } from "@/components/Logo";
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
  SidebarRail,
  useSidebar,
} from "@/components/ui/sidebar";
import { Link, useLocation } from "wouter";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/hooks/useAuth";
import { usePermissions } from "@/hooks/usePermissions";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Separator } from "@/components/ui/separator";
import { Moon, Sun } from "lucide-react";
import { motion } from "framer-motion";

type SidebarNavItem = {
  title: string;
  url: string;
  icon: any;
  permission?: any;
  sidebarKey?: any;
  badgeKey?: any;
  roles?: readonly string[];
};

// Client-specific navigation
const clientTools: SidebarNavItem[] = [
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

// Creator-specific navigation
const creatorTools: SidebarNavItem[] = [
  {
    title: "Dashboard",
    url: "/",
    icon: LayoutDashboard,
  },
  {
    title: "Training Course",
    url: "/course",
    icon: BookOpen,
  },
  {
    title: "My Visits",
    url: "/visits",
    icon: Calendar,
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

// Sales Agent-specific navigation
const salesAgentTools: SidebarNavItem[] = [
  {
    title: "Sales Dashboard",
    url: "/",
    icon: LayoutDashboard,
  },
  {
    title: "My Leads",
    url: "/leads",
    icon: UserPlus,
  },
  {
    title: "My Clients",
    url: "/clients",
    icon: Users,
  },
  {
    title: "Tasks",
    url: "/tasks",
    icon: ListTodo,
  },
  {
    title: "My Calendar",
    url: "/company-calendar",
    icon: Calendar,
  },
  {
    title: "Messages",
    url: "/messages",
    icon: MessageSquare,
  },
  {
    title: "Phone",
    url: "/phone",
    icon: Phone,
  },
  {
    title: "Emails",
    url: "/emails",
    icon: Mail,
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

// Reordered for better workflow logic - Team communication tools together
const companyTools: SidebarNavItem[] = [
  {
    title: "Dashboard",
    url: "/",
    icon: LayoutDashboard,
    permission: null,
    sidebarKey: "dashboard" as const,
  },
  {
    title: "Team",
    url: "/team",
    icon: UsersRound,
    permission: "canManageUsers" as const,
    sidebarKey: "team" as const,
  },
  {
    title: "Messages",
    url: "/messages",
    icon: MessageSquare,
    permission: null,
    badgeKey: "messages", // Will fetch unread count
    sidebarKey: "messages" as const,
  },
  {
    title: "Emails",
    url: "/emails",
    icon: Mail,
    permission: null,
    badgeKey: "emails", // Will fetch unread count
    sidebarKey: "emails" as const,
  },
  {
    title: "Phone",
    url: "/phone",
    icon: Phone,
    permission: null,
    sidebarKey: "phone" as const,
  },
  {
    title: "My Calendar",
    url: "/company-calendar",
    icon: Calendar,
    permission: null,
    sidebarKey: "calendar" as const,
  },
];

const operationsTools: SidebarNavItem[] = [
  {
    title: "Clients",
    url: "/clients",
    icon: Users,
    permission: "canManageClients" as const,
    sidebarKey: "clients" as const,
  },
  {
    title: "Social Stats",
    url: "/admin/social-stats",
    icon: LineChart,
    permission: "canManageClients" as const,
    sidebarKey: "socialStats" as const,
  },
  {
    title: "Leads",
    url: "/leads",
    icon: UserPlus,
    permission: "canManageLeads" as const,
    sidebarKey: "leads" as const,
  },
  {
    title: "Campaigns",
    url: "/campaigns",
    icon: Megaphone,
    permission: "canManageCampaigns" as const,
    sidebarKey: "campaigns" as const,
  },
  {
    title: "Marketing Center",
    url: "/marketing-center",
    icon: Zap,
    roles: ["admin"] as const,
    sidebarKey: "marketingCenter" as const,
  },
  {
    title: "Content Calendar",
    url: "/content",
    icon: Calendar,
    permission: "canManageContent" as const,
    sidebarKey: "content" as const,
  },
  {
    title: "Visits",
    url: "/visits",
    icon: Calendar,
    permission: "canManageClients" as const,
    sidebarKey: "visits" as const,
    roles: ["admin", "manager", "staff", "creator_manager"] as const,
  },
  {
    title: "Creators",
    url: "/creators",
    icon: UsersRound,
    permission: "canManageClients" as const,
    sidebarKey: "creators" as const,
    roles: ["admin", "manager", "staff", "creator_manager"] as const,
  },
  {
    title: "Tasks",
    url: "/tasks",
    icon: ListTodo,
    permission: null,
    sidebarKey: "tasks" as const,
  },
  {
    title: "Onboarding",
    url: "/onboarding",
    icon: ClipboardCheck,
    permission: "canManageClients" as const,
    sidebarKey: "onboarding" as const,
  },
  {
    title: "Support Tickets",
    url: "/tickets",
    icon: Ticket,
    permission: "canManageTickets" as const,
    sidebarKey: "tickets" as const,
  },
  {
    title: "Website Projects",
    url: "/website-projects",
    icon: Globe,
    permission: "canManageClients" as const,
    sidebarKey: "websiteProjects" as const,
  },
  {
    title: "Second Me",
    url: "/admin-second-me",
    icon: Sparkles,
    permission: "canManageClients" as const,
    sidebarKey: "secondMe" as const,
  },
];

const businessTools: SidebarNavItem[] = [
  {
    title: "Analytics",
    url: "/analytics",
    icon: BarChart3,
    permission: "canManageClients" as const,
    sidebarKey: "analytics" as const,
  },
  {
    title: "Invoices & Billing",
    url: "/invoices",
    icon: DollarSign,
    permission: "canManageInvoices" as const,
    sidebarKey: "invoices" as const,
  },
  {
    title: "Commissions",
    url: "/commissions",
    icon: TrendingUp,
    roles: ["admin", "manager"] as const,
    sidebarKey: "commissions" as const,
  },
  {
    title: "Subscription Packages",
    url: "/subscription-packages",
    icon: Package,
    permission: "canManageUsers" as const,
    sidebarKey: "packages" as const,
  },
  {
    title: "Discount Codes",
    url: "/discount-codes",
    icon: Percent,
    roles: ["admin"] as const,
    sidebarKey: "discountCodes" as const,
  },
  {
    title: "Training",
    url: "/training",
    icon: BookOpen,
    permission: "canManageUsers" as const,
    sidebarKey: "training" as const,
  },
  {
    title: "AI Business Manager",
    url: "/ai-manager",
    icon: Sparkles,
    roles: ["admin"] as const,
    sidebarKey: "aiManager" as const,
  },
  {
    title: "Push Notifications",
    url: "/push-notifications",
    icon: Bell,
    roles: ["admin", "manager", "staff"] as const,
    sidebarKey: "pushNotifications" as const,
  },
];

// Enhanced Navigation Item Component with Badge Support
function NavItem({ 
  item, 
  isActive, 
  isCollapsed, 
  onClick,
  badgeCount 
}: { 
  item: typeof companyTools[0];
  isActive: boolean;
  isCollapsed: boolean;
  onClick: () => void;
  badgeCount?: number | null;
}) {
  const Icon = item.icon;
  const showBadge = badgeCount !== undefined && badgeCount !== null && badgeCount > 0;
  
  const content = (
    <SidebarMenuButton 
      asChild 
      isActive={isActive}
      className={`group relative transition-all duration-300 ease-in-out rounded-lg h-11 ${
        isActive 
          ? 'bg-primary/10 shadow-sm ring-1 ring-primary/20' 
          : 'hover:bg-blue-50 dark:hover:bg-blue-900/10'
      }`}
      data-testid={`nav-${item.url === '/' ? 'dashboard' : item.url.slice(1)}`}
    >
      <Link href={item.url} onClick={onClick} className="flex items-center gap-3 w-full py-0 px-3 overflow-hidden">
        {/* Animated Left Border */}
        <div className={`absolute left-0 top-1/2 -translate-y-1/2 w-1 h-0 bg-primary rounded-r-full transition-all duration-300 ${
          isActive ? 'h-6 opacity-100' : 'group-hover:h-4 group-hover:opacity-50'
        }`} />
        
        <motion.div 
          className={`transition-all duration-300 ${
            isActive 
              ? 'text-primary' 
              : 'text-zinc-400 group-hover:text-primary'
          }`}
          whileHover={{ scale: 1.2, rotate: 5 }}
          whileTap={{ scale: 0.9 }}
        >
          <Icon className="w-5 h-5" />
        </motion.div>
        
        {!isCollapsed && (
          <>
            <span className={`font-semibold text-sm transition-all duration-300 ${
              isActive 
                ? 'text-zinc-900 dark:text-zinc-100 translate-x-1' 
                : 'text-zinc-500 group-hover:text-zinc-900 dark:group-hover:text-zinc-100 group-hover:translate-x-1'
            }`}>
              {item.title}
            </span>
            {showBadge && (
              <Badge 
                variant="destructive" 
                className="ml-auto text-[10px] h-5 min-w-[20px] rounded-full flex items-center justify-center animate-pulse shadow-lg shadow-destructive/20"
              >
                {badgeCount > 99 ? '99+' : badgeCount}
              </Badge>
            )}
          </>
        )}
        {isCollapsed && showBadge && (
          <div className="absolute top-2 right-2 w-2.5 h-2.5 bg-destructive rounded-full border-2 border-white dark:border-zinc-900 animate-pulse shadow-sm" />
        )}
      </Link>
    </SidebarMenuButton>
  );

  if (isCollapsed) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            {content}
          </TooltipTrigger>
          <TooltipContent side="right">
            <div className="flex items-center gap-2">
              <p>{item.title}</p>
              {showBadge && (
                <Badge variant="destructive" className="text-xs h-4 min-w-[16px]">
                  {badgeCount}
                </Badge>
              )}
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return content;
}

export function AppSidebar() {
  const [location] = useLocation();
  const { user } = useAuth();
  const { setOpenMobile, state, toggleSidebar, isMobile } = useSidebar();
  const { canAccess, canSeeSidebarItem } = usePermissions();

  // Role override for testing
  const overrideRole = localStorage.getItem('admin_role_override');
  const effectiveRole = (user?.role === 'admin' && overrideRole) ? overrideRole : user?.role;

  const isClient = effectiveRole === 'client';
  const isSalesAgent = effectiveRole === 'sales_agent';
  const isCreator = effectiveRole === 'creator';
  const isCollapsed = state === "collapsed" && !isMobile;

  // Fetch unread message counts
  const { data: unreadCounts } = useQuery<Record<number, number>>({
    queryKey: ["/api/messages/unread-counts"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/messages/unread-counts", undefined);
      return response.json();
    },
    enabled: !isClient && !isMobile, // Only fetch for staff/admin, not on mobile
    refetchInterval: 5000, // Refresh every 5 seconds
  });

  // Calculate total unread messages
  const totalUnreadMessages = unreadCounts ? Object.values(unreadCounts).reduce((sum, count) => sum + count, 0) : 0;

  // Fetch unread email count (mock for now - would need email endpoint)
  const { data: unreadEmails } = useQuery<number>({
    queryKey: ["/api/emails/unread-count"],
    queryFn: async () => {
      try {
        const response = await apiRequest("GET", "/api/emails/unread-count", undefined);
        return response.json();
      } catch {
        return 0; // Return 0 if endpoint doesn't exist yet
      }
    },
    enabled: !isClient && !isMobile,
    refetchInterval: 10000, // Refresh every 10 seconds
    meta: { returnNull: true },
  });

  // Check if running as PWA (standalone mode)
  const isPWA = window.matchMedia('(display-mode: standalone)').matches || 
                (window.navigator as any).standalone === true;
  
  const logoutUrl = isPWA ? '/api/logout?pwa=true' : '/api/logout';

  const handleLinkClick = () => {
    setOpenMobile(false);
  };

  const getUserInitials = () => {
    const u = user as any;
    if (u?.firstName && u?.lastName) {
      return `${u.firstName[0]}${u.lastName[0]}`.toUpperCase();
    }
    return u?.email?.[0]?.toUpperCase() || "U";
  };

  // Helper to get badge count for a navigation item
  const getBadgeCount = (badgeKey?: string) => {
    if (!badgeKey) return null;
    if (badgeKey === "messages") return totalUnreadMessages || null;
    if (badgeKey === "emails") return unreadEmails || null;
    return null;
  };

  // For clients, show client-specific menu
  if (isClient) {
    return (
      <Sidebar collapsible="icon" className="bg-gradient-to-b from-[#F9FAFB] to-[#F3F4F6] border-r border-border/50 shadow-[inset_-1px_0_0_0_rgb(229,231,235)]">
        <SidebarHeader className="px-3 py-6 border-b border-border/50 flex items-center justify-center">
          <Link href="/" className="flex items-center justify-center group transition-opacity hover:opacity-80 w-full">
            {isCollapsed ? (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="w-full flex justify-center">
                      <Logo variant="auto" size="xl" className="!h-24 !w-auto" />
                    </div>
                  </TooltipTrigger>
                  <TooltipContent side="right">
                    <p>Marketing Team App</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            ) : (
              <Logo variant="auto" size="xl" className="!h-24 !w-auto mx-auto" />
            )}
          </Link>
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup className="mt-4">
            <SidebarGroupLabel className="px-4 py-2 text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest opacity-80">
              Menu
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu className="px-2 gap-1">
                {clientTools.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <NavItem
                      item={item}
                      isActive={location === item.url}
                      isCollapsed={isCollapsed}
                      onClick={handleLinkClick}
                      badgeCount={getBadgeCount((item as any).badgeKey)}
                    />
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
        <SidebarFooter className="p-4 border-t border-border/50">
          <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 mb-2">
            <div className="relative">
              <Avatar className="h-9 w-9">
                <AvatarFallback className="bg-primary text-primary-foreground">
                  {getUserInitials()}
                </AvatarFallback>
              </Avatar>
              <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-background"></div>
            </div>
            {!isCollapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{(user as any)?.username || "Client"}</p>
                <p className="text-xs text-muted-foreground truncate capitalize">{(user as any)?.role || "client"}</p>
              </div>
            )}
          </div>
          {!isCollapsed && (
            <a
              href={logoutUrl}
              className="flex items-center gap-2 text-sm text-muted-foreground hover:bg-muted rounded-md px-3 py-2 transition-colors"
              data-testid="button-logout"
            >
              <LogOut className="w-4 h-4" />
              <span>Log Out</span>
            </a>
          )}
        </SidebarFooter>
      </Sidebar>
    );
  }

  // For creators, show creator-specific menu
  if (isCreator) {
    return (
      <Sidebar collapsible="icon" className="bg-gradient-to-b from-[#F9FAFB] to-[#F3F4F6] border-r border-border/50 shadow-[inset_-1px_0_0_0_rgb(229,231,235)]">
        <SidebarHeader className="px-3 py-6 border-b border-border/50 flex items-center justify-center">
          <Link href="/" className="flex items-center justify-center group transition-opacity hover:opacity-80 w-full">
            {isCollapsed ? (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="w-full flex justify-center">
                      <Logo variant="auto" size="xl" className="!h-24 !w-auto" />
                    </div>
                  </TooltipTrigger>
                  <TooltipContent side="right">
                    <p>Marketing Team App</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            ) : (
              <Logo variant="auto" size="xl" className="!h-24 !w-auto mx-auto" />
            )}
          </Link>
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup className="mt-4">
            <SidebarGroupLabel className="px-4 py-2 text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest opacity-80">
              Creator Menu
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu className="px-2 gap-1">
                {creatorTools.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <NavItem
                      item={item}
                      isActive={location === item.url}
                      isCollapsed={isCollapsed}
                      onClick={handleLinkClick}
                    />
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
        <SidebarFooter className="p-4 border-t border-border/50">
          <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 mb-2">
            <div className="relative">
              <Avatar className="h-9 w-9">
                <AvatarFallback className="bg-primary text-primary-foreground">
                  {getUserInitials()}
                </AvatarFallback>
              </Avatar>
              <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-background"></div>
            </div>
            {!isCollapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{(user as any)?.username || "Creator"}</p>
                <p className="text-xs text-muted-foreground truncate capitalize">Creator</p>
              </div>
            )}
          </div>
          {!isCollapsed && (
            <a
              href={logoutUrl}
              className="flex items-center gap-2 text-sm text-muted-foreground hover:bg-muted rounded-md px-3 py-2 transition-colors"
              data-testid="button-logout"
            >
              <LogOut className="w-4 h-4" />
              <span>Log Out</span>
            </a>
          )}
        </SidebarFooter>
      </Sidebar>
    );
  }

  // For sales agents, show sales-specific menu
  if (isSalesAgent) {
    return (
      <Sidebar collapsible="icon" className="bg-gradient-to-b from-[#F9FAFB] to-[#F3F4F6] border-r border-border/50 shadow-[inset_-1px_0_0_0_rgb(229,231,235)]">
        <SidebarHeader className="px-3 py-6 border-b border-border/50 flex items-center justify-center">
          <Link href="/" className="flex items-center justify-center group transition-opacity hover:opacity-80 w-full">
            {isCollapsed ? (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="w-full flex justify-center">
                      <Logo variant="auto" size="xl" className="!h-24 !w-auto" />
                    </div>
                  </TooltipTrigger>
                  <TooltipContent side="right">
                    <p>Marketing Team App</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            ) : (
              <Logo variant="auto" size="xl" className="!h-24 !w-auto mx-auto" />
            )}
          </Link>
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup className="mt-4">
            <SidebarGroupLabel className="px-4 py-2 text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest opacity-80">
              Sales Tools
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu className="px-2 gap-1">
                {salesAgentTools.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <NavItem
                      item={item}
                      isActive={location === item.url}
                      isCollapsed={isCollapsed}
                      onClick={handleLinkClick}
                    />
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
        <SidebarFooter className="px-3 py-4 border-t border-border/50">
          <div className="flex items-center gap-3 px-3 py-2">
            <Avatar className="h-8 w-8">
              <AvatarImage src={(user as any)?.avatar} />
              <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                {getUserInitials()}
              </AvatarFallback>
            </Avatar>
            {!isCollapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{(user as any)?.firstName || (user as any)?.username}</p>
                <p className="text-xs text-muted-foreground truncate capitalize">Sales Agent</p>
              </div>
            )}
          </div>
          {!isCollapsed && (
            <a
              href={logoutUrl}
              className="flex items-center gap-2 text-sm text-muted-foreground hover:bg-muted rounded-md px-3 py-2 transition-colors"
              data-testid="button-logout"
            >
              <LogOut className="w-4 h-4" />
              <span>Log Out</span>
            </a>
          )}
        </SidebarFooter>
      </Sidebar>
    );
  }

  // For staff/managers/admins, show full menu
  const filteredCompanyTools = companyTools.filter(item => {
    if (item.sidebarKey && !canSeeSidebarItem(item.sidebarKey)) {
      return false;
    }
    if (!item.permission) return true;
    return canAccess(item.permission);
  });

  const filteredOperations = operationsTools.filter(item => {
    if (item.sidebarKey && !canSeeSidebarItem(item.sidebarKey)) {
      return false;
    }
    if (item.roles) {
      return item.roles.includes((user as any)?.role as any);
    }
    if (!item.permission) return true;
    return canAccess(item.permission);
  });

  const filteredBusiness = businessTools.filter(item => {
    if (item.sidebarKey && !canSeeSidebarItem(item.sidebarKey)) {
      return false;
    }
    if (item.roles) {
      return item.roles.includes((user as any)?.role as any);
    }
    if (!item.permission) return true;
    return canAccess(item.permission);
  });

  return (
    <Sidebar 
      collapsible="icon" 
      className="bg-gradient-to-b from-[#F9FAFB] to-[#F3F4F6] border-r border-border/50 shadow-[inset_-1px_0_0_0_rgb(229,231,235)]"
      style={{ "--sidebar-width": "260px" } as React.CSSProperties}
    >
      <SidebarHeader className="px-3 py-6 border-b border-border/50 flex items-center justify-center relative">
        <Link href="/" className="flex items-center justify-center group transition-opacity hover:opacity-80 w-full">
          {isCollapsed ? (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="w-full flex justify-center">
                    <Logo variant="auto" size="xl" className="!h-24 !w-auto" />
                  </div>
                </TooltipTrigger>
                <TooltipContent side="right">
                  <p>Marketing Team App</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          ) : (
            <Logo variant="auto" size="xl" className="!h-24 !w-auto mx-auto" />
          )}
        </Link>
        {!isMobile && !isCollapsed && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={toggleSidebar}
                  className="absolute top-6 right-3 p-1.5 rounded-md hover:bg-muted transition-colors"
                  aria-label="Collapse sidebar"
                >
                  <ChevronLeft className="w-4 h-4 text-muted-foreground" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="right">
                Collapse sidebar
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
        {!isMobile && isCollapsed && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={toggleSidebar}
                  className="absolute top-6 right-2 p-1.5 rounded-md hover:bg-muted transition-colors opacity-0 group-hover/sidebar-wrapper:opacity-100"
                  aria-label="Expand sidebar"
                >
                  <ChevronRight className="w-4 h-4 text-muted-foreground" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="right">
                Expand sidebar
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </SidebarHeader>
      
      <SidebarContent className="data-[collapsible=icon]:overflow-hidden">
        {/* Company Tools Section */}
        <SidebarGroup className="mt-4">
          <SidebarGroupLabel className="px-4 py-2 text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest opacity-80">
            Company
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="px-2 gap-1">
              {filteredCompanyTools.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <NavItem
                    item={item}
                    isActive={location === item.url}
                    isCollapsed={isCollapsed}
                    onClick={handleLinkClick}
                    badgeCount={getBadgeCount((item as any).badgeKey)}
                  />
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Divider */}
        <div className="px-4 my-4">
          <Separator className="bg-zinc-100 dark:bg-zinc-800 opacity-50" />
        </div>

        {/* Operations Section */}
        <SidebarGroup>
          <SidebarGroupLabel className="px-4 py-2 text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest opacity-80">
            Operations
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="px-2 gap-1">
              {filteredOperations.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <NavItem
                    item={item}
                    isActive={location === item.url}
                    isCollapsed={isCollapsed}
                    onClick={handleLinkClick}
                    badgeCount={getBadgeCount((item as any).badgeKey)}
                  />
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Divider */}
        <div className="px-4 my-4">
          <Separator className="bg-zinc-100 dark:bg-zinc-800 opacity-50" />
        </div>

        {/* Business Section */}
        <SidebarGroup>
          <SidebarGroupLabel className="px-4 py-2 text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest opacity-80">
            Business
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="px-2 gap-1">
              {filteredBusiness.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <NavItem
                    item={item}
                    isActive={location === item.url}
                    isCollapsed={isCollapsed}
                    onClick={handleLinkClick}
                    badgeCount={getBadgeCount((item as any).badgeKey)}
                  />
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      
      <SidebarFooter className="p-4 border-t border-border/50">
        {!isCollapsed ? (
          <>
            <HoverCard>
              <HoverCardTrigger asChild>
                <div className="flex items-center gap-3 mb-3 p-2 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer">
                  <div className="relative">
                    <Avatar className="h-9 w-9">
                      <AvatarImage src={(user as any)?.profileImageUrl || ""} />
                      <AvatarFallback className="bg-primary text-primary-foreground text-sm">
                        {getUserInitials()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-background shadow-sm"></div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate" data-testid="text-user-name">
                      {(user as any)?.firstName && (user as any)?.lastName
                        ? `${(user as any).firstName} ${(user as any).lastName}`
                        : (user as any)?.email || "User"}
                    </p>
                    <p className="text-xs text-muted-foreground capitalize flex items-center gap-1">
                      {(user as any)?.role || "staff"} | Marketing Team App
                    </p>
                  </div>
                </div>
              </HoverCardTrigger>
              <HoverCardContent className="w-64 p-4" side="right" align="end">
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={(user as any)?.profileImageUrl || ""} />
                      <AvatarFallback className="bg-primary text-primary-foreground">
                        {getUserInitials()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <p className="font-semibold text-sm">
                        {(user as any)?.firstName && (user as any)?.lastName
                          ? `${(user as any).firstName} ${(user as any).lastName}`
                          : (user as any)?.email || "User"}
                      </p>
                      <p className="text-xs text-muted-foreground capitalize flex items-center gap-1">
                        <Circle className="w-2 h-2 fill-emerald-500 text-emerald-500" />
                        Online • {(user as any)?.role || "staff"}
                      </p>
                    </div>
                  </div>
                  <Separator />
                  <div className="space-y-1">
                    <Link href="/settings" onClick={handleLinkClick}>
                      <div className="flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-muted transition-colors cursor-pointer">
                        <User className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm">My Profile</span>
                      </div>
                    </Link>
                    <Link href="/settings" onClick={handleLinkClick}>
                      <div className="flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-muted transition-colors cursor-pointer">
                        <Settings className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm">Preferences</span>
                      </div>
                    </Link>
                    <div className="flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-muted transition-colors cursor-pointer">
                      <Bell className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm">Notifications</span>
                    </div>
                  </div>
                  <Separator />
                  <a
                    href={logoutUrl}
                    className="flex items-center gap-2 text-sm text-destructive hover:bg-destructive/10 rounded-md px-2 py-1.5 transition-colors"
                    data-testid="button-logout"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Log Out</span>
                  </a>
                </div>
              </HoverCardContent>
            </HoverCard>
            <div className="space-y-1">
              <Link href="/settings" onClick={handleLinkClick}>
                <div className="w-full flex items-center gap-2 text-sm text-muted-foreground hover:bg-muted rounded-md px-3 py-2 transition-colors cursor-pointer">
                  <Settings className="w-4 h-4" />
                  <span>Settings</span>
                </div>
              </Link>
              <a
                href={logoutUrl}
                className="flex items-center gap-2 text-sm text-muted-foreground hover:bg-muted rounded-md px-3 py-2 transition-colors"
                data-testid="button-logout"
              >
                <LogOut className="w-4 h-4" />
                <span>Log Out</span>
              </a>
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="relative">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                        {getUserInitials()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="absolute bottom-0 right-0 w-2 h-2 bg-emerald-500 rounded-full border-2 border-background"></div>
                  </div>
                </TooltipTrigger>
                <TooltipContent side="right">
                  <p>{(user as any)?.username || "User"}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <a
                    href={logoutUrl}
                    className="p-2 rounded-md hover:bg-muted transition-colors"
                    data-testid="button-logout"
                  >
                    <LogOut className="w-4 h-4 text-muted-foreground" />
                  </a>
                </TooltipTrigger>
                <TooltipContent side="right">
                  <p>Log Out</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        )}
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}

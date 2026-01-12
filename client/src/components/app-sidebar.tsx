import { useState, useEffect } from "react";
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
  KeyRound,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Circle,
  LineChart,
  User,
  Percent,
  Zap,
} from "lucide-react";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/button";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
  useSidebar,
} from "@/components/ui/sidebar";
import { Link, useLocation } from "wouter";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/hooks/use-auth";
import { usePermissions } from "@/hooks/usePermissions";
import { getEffectiveRole } from "@/lib/effective-role";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { resolveApiUrl } from "@/lib/api";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
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
    url: "/content",
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
    title: "AI Digital Twin",
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
    title: "Marketing",
    url: "/marketing",
    icon: Megaphone,
  },
  {
    title: "My Payouts",
    url: "/payouts",
    icon: DollarSign,
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
    title: "Settings",
    url: "/settings",
    icon: Settings,
  },
];

// Reordered for better workflow logic - Team communication tools together
const communicationTools: SidebarNavItem[] = [
  {
    title: "Dashboard",
    url: "/dashboard",
    icon: LayoutDashboard,
    permission: null,
    sidebarKey: "dashboard" as const,
  },
  {
    title: "User Management",
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
    badgeKey: "messages",
    sidebarKey: "messages" as const,
  },
  {
    title: "Emails",
    url: "/emails",
    icon: Mail,
    permission: null,
    badgeKey: "emails",
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

const growthTools: SidebarNavItem[] = [
  {
    title: "Leads",
    url: "/leads",
    icon: UserPlus,
    permission: "canManageLeads" as const,
    sidebarKey: "leads" as const,
  },
  {
    title: "Marketing Center",
    url: "/marketing-center",
    icon: Zap,
    roles: ["admin"] as const,
    sidebarKey: "marketingCenter" as const,
  },
  {
    title: "Campaigns",
    url: "/campaigns",
    icon: Megaphone,
    permission: "canManageCampaigns" as const,
    sidebarKey: "campaigns" as const,
  },
  {
    title: "Website Projects",
    url: "/website-projects",
    icon: Globe,
    permission: "canManageClients" as const,
    sidebarKey: "websiteProjects" as const,
  },
];

const contentCreatorsTools: SidebarNavItem[] = [
  {
    title: "Content Calendar",
    url: "/content",
    icon: Calendar,
    permission: "canManageContent" as const,
    sidebarKey: "content" as const,
  },
  {
    title: "Blog Posts",
    url: "/admin/blog",
    icon: BookOpen,
    permission: "canManageContent" as const,
    sidebarKey: "blog" as const,
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
    title: "Visits",
    url: "/visits",
    icon: Calendar,
    permission: "canManageClients" as const,
    sidebarKey: "visits" as const,
    roles: ["admin", "manager", "staff", "creator_manager"] as const,
  },
  {
    title: "Payouts",
    url: "/creators/payouts",
    icon: DollarSign,
    permission: "canManageInvoices" as const,
    sidebarKey: "invoices" as const,
    roles: ["admin", "manager"] as const,
  },
  {
    title: "Manage Courses",
    url: "/manage-courses",
    icon: BookOpen,
    roles: ["admin"] as const,
    sidebarKey: "training" as const,
  },
  {
    title: "AI Digital Twin",
    url: "/admin-second-me",
    icon: Sparkles,
    permission: "canManageClients" as const,
    sidebarKey: "secondMe" as const,
  },
];

const managementTools: SidebarNavItem[] = [
  {
    title: "Clients",
    url: "/clients",
    icon: Users,
    permission: "canManageClients" as const,
    sidebarKey: "clients" as const,
  },
  {
    title: "Tasks",
    url: "/tasks",
    icon: ListTodo,
    permission: null,
    sidebarKey: "tasks" as const,
  },
  {
    title: "Support Tickets",
    url: "/tickets",
    icon: Ticket,
    permission: "canManageTickets" as const,
    sidebarKey: "tickets" as const,
  },
  {
    title: "Onboarding",
    url: "/onboarding",
    icon: ClipboardCheck,
    permission: "canManageClients" as const,
    sidebarKey: "onboarding" as const,
  },
];

const intelligenceFinanceTools: SidebarNavItem[] = [
  {
    title: "Analytics",
    url: "/analytics",
    icon: BarChart3,
    permission: "canManageClients" as const,
    sidebarKey: "analytics" as const,
  },
  {
    title: "Password Vault",
    url: "/admin/vault",
    icon: KeyRound,
    roles: ["admin"] as const,
    sidebarKey: "vault" as const,
  },
  {
    title: "Social Stats",
    url: "/admin/social-stats",
    icon: LineChart,
    permission: "canManageClients" as const,
    sidebarKey: "socialStats" as const,
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
    title: "AI Business Manager",
    url: "/ai-manager",
    icon: Sparkles,
    roles: ["admin"] as const,
    sidebarKey: "aiManager" as const,
  },
  {
    title: "Training",
    url: "/training",
    icon: BookOpen,
    permission: "canManageUsers" as const,
    sidebarKey: "training" as const,
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
  item: SidebarNavItem;
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

// Collapsible Group Component for grouping multiple items
function NavCollapsibleGroup({
  title,
  icon: Icon,
  items,
  location,
  isCollapsed,
  onClick,
  getBadgeCount,
}: {
  title: string;
  icon: any;
  items: SidebarNavItem[];
  location: string;
  isCollapsed: boolean;
  onClick: () => void;
  getBadgeCount: (key?: string) => number | null;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const hasActiveItem = items.some(item => location === item.url);

  // Auto-open if an item is active
  useEffect(() => {
    if (hasActiveItem && !isCollapsed) setIsOpen(true);
  }, [hasActiveItem, isCollapsed]);

  if (items.length === 0) return null;

  // In collapsed mode, show a dropdown menu
  if (isCollapsed) {
    return (
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton 
              isActive={hasActiveItem}
              className={`group transition-all duration-300 ease-in-out rounded-lg h-11 ${
                hasActiveItem 
                  ? 'bg-primary/10 shadow-sm ring-1 ring-primary/20' 
                  : 'hover:bg-blue-50 dark:hover:bg-blue-900/10'
              }`}
            >
              <div className={`flex items-center justify-center w-full ${hasActiveItem ? 'text-primary' : 'text-zinc-400 group-hover:text-primary'}`}>
                <Icon className="w-5 h-5" />
              </div>
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent side="right" align="start" className="w-56 p-2">
            <div className="px-2 py-1.5 text-xs font-bold text-zinc-400 uppercase tracking-widest">{title}</div>
            <DropdownMenuSeparator className="my-1" />
            {items.map(item => {
              const badge = getBadgeCount(item.badgeKey);
              return (
                <DropdownMenuItem key={item.title} asChild className="rounded-md">
                  <Link href={item.url} onClick={onClick} className="flex items-center gap-2 w-full cursor-pointer">
                    <item.icon className={`w-4 h-4 ${location === item.url ? 'text-primary' : 'text-zinc-400'}`} />
                    <span className={location === item.url ? 'font-semibold text-primary' : ''}>{item.title}</span>
                    {badge && (
                      <Badge variant="destructive" className="ml-auto text-[10px] h-4 min-w-[16px] px-1">
                        {badge}
                      </Badge>
                    )}
                  </Link>
                </DropdownMenuItem>
              );
            })}
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    );
  }

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen} className="w-full">
      <SidebarMenuItem>
        <CollapsibleTrigger asChild>
          <SidebarMenuButton 
            isActive={hasActiveItem && !isOpen}
            className={`group transition-all duration-300 ease-in-out rounded-lg h-11 mb-1 ${
              hasActiveItem && !isOpen
                ? 'bg-primary/10 shadow-sm ring-1 ring-primary/20' 
                : 'hover:bg-blue-50 dark:hover:bg-blue-900/10'
            }`}
          >
            <div className="flex items-center gap-3 w-full px-3">
              <Icon className={`w-5 h-5 transition-colors duration-300 ${
                hasActiveItem ? 'text-primary' : 'text-zinc-400 group-hover:text-primary'
              }`} />
              <span className={`font-semibold text-sm transition-colors duration-300 flex-1 text-left ${
                hasActiveItem ? 'text-zinc-900 dark:text-zinc-100' : 'text-zinc-500 group-hover:text-zinc-900 dark:group-hover:text-zinc-100'
              }`}>
                {title}
              </span>
              <ChevronDown className={`w-4 h-4 text-zinc-400 transition-transform duration-300 ${isOpen ? "rotate-180" : ""}`} />
            </div>
          </SidebarMenuButton>
        </CollapsibleTrigger>
        <CollapsibleContent className="animate-in slide-in-from-top-1 duration-200">
          <SidebarMenuSub className="ml-8 border-l-2 border-zinc-100 dark:border-zinc-800 gap-1 mt-1 mb-2">
            {items.map((item) => {
              const badge = getBadgeCount(item.badgeKey);
              const isSubActive = location === item.url;
              return (
                <SidebarMenuSubItem key={item.title}>
                  <SidebarMenuSubButton 
                    asChild 
                    isActive={isSubActive}
                    className={`transition-all duration-200 rounded-md px-3 h-9 ${
                      isSubActive 
                        ? 'bg-primary/5 text-primary font-semibold' 
                        : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-50 dark:hover:bg-zinc-800'
                    }`}
                  >
                    <Link href={item.url} onClick={onClick} className="flex items-center gap-2 w-full">
                      <item.icon className={`w-4 h-4 ${isSubActive ? 'text-primary' : 'opacity-70'}`} />
                      <span className="text-sm">{item.title}</span>
                      {badge && (
                        <Badge 
                          variant="destructive" 
                          className="ml-auto text-[10px] h-4 min-w-[16px] px-1 flex items-center justify-center rounded-full"
                        >
                          {badge}
                        </Badge>
                      )}
                    </Link>
                  </SidebarMenuSubButton>
                </SidebarMenuSubItem>
              );
            })}
          </SidebarMenuSub>
        </CollapsibleContent>
      </SidebarMenuItem>
    </Collapsible>
  );
}

export function AppSidebar() {
  const [location] = useLocation();
  const { user, switchRoleMutation } = useAuth();
  const { setOpenMobile, state, toggleSidebar, isMobile } = useSidebar();
  const { canAccess, canSeeSidebarItem } = usePermissions();

  // Role override for testing
  const effectiveRole = getEffectiveRole((user as any)?.role);

  const isClient = effectiveRole === 'client';
  const isSalesAgent = effectiveRole === 'sales_agent';
  const isCreator = effectiveRole === 'creator';
  const isCollapsed = state === "collapsed" && !isMobile;
  const isHybrid = Boolean((user as any)?.clientId) && Boolean((user as any)?.creatorId);
  const switchLabel = isCreator ? "Switch to Client View" : "Switch to Creator View";
  const canShowSwitch = !isCollapsed && isHybrid && (isCreator || isClient);

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
  
  const logoutUrl = resolveApiUrl(isPWA ? '/api/logout?pwa=true' : '/api/logout');

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
          {canShowSwitch && (
            <Button
              variant="outline"
              className="w-full mb-2"
              onClick={() => switchRoleMutation.mutate()}
              disabled={switchRoleMutation.isPending}
            >
              {switchRoleMutation.isPending ? "Switching..." : switchLabel}
            </Button>
          )}
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
          {canShowSwitch && (
            <Button
              variant="outline"
              className="w-full mb-2"
              onClick={() => switchRoleMutation.mutate()}
              disabled={switchRoleMutation.isPending}
            >
              {switchRoleMutation.isPending ? "Switching..." : switchLabel}
            </Button>
          )}
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
  const filteredCommunication = communicationTools.filter(item => {
    if (item.sidebarKey && !canSeeSidebarItem(item.sidebarKey)) {
      return false;
    }
    if (!item.permission) return true;
    return canAccess(item.permission);
  });

  const filteredGrowth = growthTools.filter(item => {
    if (item.sidebarKey && !canSeeSidebarItem(item.sidebarKey)) {
      return false;
    }
    if (item.roles) {
      return item.roles.includes(effectiveRole as any);
    }
    if (!item.permission) return true;
    return canAccess(item.permission);
  });

  const filteredContentCreators = contentCreatorsTools.filter(item => {
    if (item.sidebarKey && !canSeeSidebarItem(item.sidebarKey)) {
      return false;
    }
    if (item.roles) {
      return item.roles.includes(effectiveRole as any);
    }
    if (!item.permission) return true;
    return canAccess(item.permission);
  });

  const filteredManagement = managementTools.filter(item => {
    if (item.sidebarKey && !canSeeSidebarItem(item.sidebarKey)) {
      return false;
    }
    if (item.roles) {
      return item.roles.includes(effectiveRole as any);
    }
    if (!item.permission) return true;
    return canAccess(item.permission);
  });

  const filteredIntelligenceFinance = intelligenceFinanceTools.filter(item => {
    if (item.sidebarKey && !canSeeSidebarItem(item.sidebarKey)) {
      return false;
    }
    if (item.roles) {
      return item.roles.includes(effectiveRole as any);
    }
    if (!item.permission) return true;
    return canAccess(item.permission);
  });

  // Split communication for better organization
  const topLevelItems = filteredCommunication.filter(item => 
    ["dashboard", "team"].includes(item.sidebarKey)
  );
  
  const communicationGroupItems = filteredCommunication.filter(item => 
    !["dashboard", "team"].includes(item.sidebarKey)
  );

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
      
      <SidebarContent className="data-[collapsible=icon]:overflow-hidden px-2">
        {/* Main Section - Top Level Items */}
        <SidebarGroup className="mt-2">
          <SidebarGroupLabel className="px-4 py-2 text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest opacity-80">
            Overview
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="gap-1">
              {topLevelItems.map((item) => (
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

        <div className="px-4 my-2">
          <Separator className="bg-zinc-100 dark:bg-zinc-800 opacity-50" />
        </div>

        {/* Organized Groups */}
        <SidebarGroup>
          <SidebarGroupLabel className="px-4 py-2 text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest opacity-80">
            Tools & Operations
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="gap-1">
              {/* Communication Group */}
              <NavCollapsibleGroup 
                title="Communication"
                icon={MessageSquare}
                items={communicationGroupItems}
                location={location}
                isCollapsed={isCollapsed}
                onClick={handleLinkClick}
                getBadgeCount={getBadgeCount}
              />

              {/* Growth Group */}
              <NavCollapsibleGroup 
                title="Growth & Sales"
                icon={Zap}
                items={filteredGrowth}
                location={location}
                isCollapsed={isCollapsed}
                onClick={handleLinkClick}
                getBadgeCount={getBadgeCount}
              />

              {/* Creators Group */}
              <NavCollapsibleGroup 
                title="Creators & Content"
                icon={Sparkles}
                items={filteredContentCreators}
                location={location}
                isCollapsed={isCollapsed}
                onClick={handleLinkClick}
                getBadgeCount={getBadgeCount}
              />

              {/* Management Group */}
              <NavCollapsibleGroup 
                title="Operations"
                icon={ClipboardCheck}
                items={filteredManagement}
                location={location}
                isCollapsed={isCollapsed}
                onClick={handleLinkClick}
                getBadgeCount={getBadgeCount}
              />

              {/* Intelligence Group */}
              <NavCollapsibleGroup 
                title="Business Intelligence"
                icon={BarChart3}
                items={filteredIntelligenceFinance}
                location={location}
                isCollapsed={isCollapsed}
                onClick={handleLinkClick}
                getBadgeCount={getBadgeCount}
              />
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
              {canShowSwitch && (
                <Button
                  variant="outline"
                  className="w-full justify-start gap-2"
                  onClick={() => switchRoleMutation.mutate()}
                  disabled={switchRoleMutation.isPending}
                >
                  <UsersRound className="w-4 h-4" />
                  <span>{switchRoleMutation.isPending ? "Switching..." : switchLabel}</span>
                </Button>
              )}
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

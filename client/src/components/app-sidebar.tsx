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
  Circle
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
  SidebarRail,
  useSidebar,
} from "@/components/ui/sidebar";
import { Link, useLocation } from "wouter";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/hooks/useAuth";
import { usePermissions } from "@/hooks/usePermissions";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Separator } from "@/components/ui/separator";

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
    permission: null,
  },
  {
    title: "Company Calendar",
    url: "/company-calendar",
    icon: Calendar,
    permission: null,
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
    permission: null,
    badge: null, // Can add unread count later
  },
  {
    title: "Emails",
    url: "/emails",
    icon: Mail,
    permission: null,
  },
  {
    title: "Phone",
    url: "/phone",
    icon: Phone,
    permission: null,
  },
];

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
    permission: null,
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
    permission: "canManageUsers" as const,
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
    roles: ["admin"] as const,
  },
  {
    title: "Push Notifications",
    url: "/push-notifications",
    icon: Bell,
    roles: ["admin", "manager", "staff"] as const,
  },
];

// Enhanced Navigation Item Component
function NavItem({ 
  item, 
  isActive, 
  isCollapsed, 
  onClick 
}: { 
  item: typeof companyTools[0];
  isActive: boolean;
  isCollapsed: boolean;
  onClick: () => void;
}) {
  const Icon = item.icon;
  
  const content = (
    <SidebarMenuButton 
      asChild 
      isActive={isActive}
      className="group relative transition-all duration-200 ease-in-out hover:bg-primary/8 rounded-md"
      data-testid={`nav-${item.url === '/' ? 'dashboard' : item.url.slice(1)}`}
    >
      <Link href={item.url} onClick={onClick} className="flex items-center gap-3 w-full">
        {/* Active Accent Bar */}
        {isActive && (
          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-primary rounded-r-full" />
        )}
        
        <div className={`transition-colors duration-200 ${isActive ? 'text-primary' : 'text-muted-foreground group-hover:text-primary'}`}>
          <Icon className="w-4 h-4" />
        </div>
        
        {!isCollapsed && (
          <>
            <span className={`font-medium ${isActive ? 'text-foreground' : 'text-muted-foreground group-hover:text-foreground'}`}>
              {item.title}
            </span>
            {item.badge && (
              <Badge variant="destructive" className="ml-auto text-xs h-5 min-w-[20px]">
                {item.badge}
              </Badge>
            )}
          </>
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
            <p>{item.title}</p>
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
  const { canAccess } = usePermissions();
  const isClient = (user as any)?.role === 'client';
  const isCollapsed = state === "collapsed" && !isMobile;

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

  // For clients, show client-specific menu
  if (isClient) {
    return (
      <Sidebar collapsible="icon" className="bg-gradient-to-b from-[#F9FAFB] to-[#F3F4F6] border-r border-border/50 shadow-[inset_-1px_0_0_0_rgb(229,231,235)]">
        <SidebarHeader className="px-3 py-5 border-b border-border/50">
          <Link href="/" className="flex items-center justify-center group">
            <SidebarLogo />
          </Link>
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel className="px-3 py-2 text-[11px] font-medium text-[#9CA3AF] uppercase tracking-[0.05em]">
              Menu
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {clientTools.map((item) => (
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

  // For staff/managers/admins, show full menu
  const filteredCompanyTools = companyTools.filter(item => {
    if (!item.permission) return true;
    return canAccess(item.permission);
  });

  const filteredOperations = operationsTools.filter(item => {
    if (!item.permission) return true;
    return canAccess(item.permission);
  });

  const filteredBusiness = businessTools.filter(item => {
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
      style={{ "--sidebar-width": "200px" } as React.CSSProperties}
    >
      <SidebarHeader className="px-3 py-5 border-b border-border/50">
        <div className="flex items-center justify-between">
          <Link href="/" className="flex items-center justify-center group transition-opacity hover:opacity-80">
            <SidebarLogo />
          </Link>
          {!isMobile && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={toggleSidebar}
                    className="p-1.5 rounded-md hover:bg-muted transition-colors opacity-100 group-hover/sidebar-wrapper:opacity-100"
                    aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
                  >
                    {isCollapsed ? (
                      <ChevronRight className="w-4 h-4 text-muted-foreground" />
                    ) : (
                      <ChevronLeft className="w-4 h-4 text-muted-foreground" />
                    )}
                  </button>
                </TooltipTrigger>
                <TooltipContent side="right">
                  {isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
      </SidebarHeader>
      
      <SidebarContent className="data-[collapsible=icon]:overflow-hidden">
        {/* Company Tools Section */}
        <SidebarGroup className="mt-3">
          <SidebarGroupLabel className="px-3 py-3 text-[11px] font-medium text-[#9CA3AF] uppercase tracking-[0.05em]">
            Company Tools
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {filteredCompanyTools.map((item) => (
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

        {/* Divider */}
        <Separator className="my-2" />

        {/* Operations Section */}
        <SidebarGroup>
          <SidebarGroupLabel className="px-3 py-3 text-[11px] font-medium text-[#9CA3AF] uppercase tracking-[0.05em]">
            Operations
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {filteredOperations.map((item) => (
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

        {/* Divider */}
        <Separator className="my-2" />

        {/* Business Section */}
        <SidebarGroup>
          <SidebarGroupLabel className="px-3 py-3 text-[11px] font-medium text-[#9CA3AF] uppercase tracking-[0.05em]">
            Business
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {filteredBusiness.map((item) => (
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
        {!isCollapsed ? (
          <>
            <div className="flex items-center gap-3 mb-3">
              <div className="relative">
                <Avatar className="h-9 w-9">
                  <AvatarImage src={(user as any)?.profileImageUrl || ""} />
                  <AvatarFallback className="bg-primary text-primary-foreground text-sm">
                    {getUserInitials()}
                  </AvatarFallback>
                </Avatar>
                <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-background"></div>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate" data-testid="text-user-name">
                  {(user as any)?.firstName && (user as any)?.lastName
                    ? `${(user as any).firstName} ${(user as any).lastName}`
                    : (user as any)?.email || "User"}
                </p>
                <p className="text-xs text-muted-foreground capitalize">{(user as any)?.role || "staff"}</p>
              </div>
            </div>
            <div className="space-y-1">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="w-full flex items-center gap-2 text-sm text-muted-foreground hover:bg-muted rounded-md px-3 py-2 transition-colors cursor-pointer">
                    <Settings className="w-4 h-4" />
                    <span>Settings</span>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuItem asChild>
                    <Link href="/settings" onClick={handleLinkClick}>
                      My Profile
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/settings" onClick={handleLinkClick}>
                      Preferences
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem>
                    <span>Help & Support</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
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

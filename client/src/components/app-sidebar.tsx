import {
  LogOut,
  Settings,
  Bell,
  ChevronLeft,
  ChevronRight,
  Circle,
  User,
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
import { clientTools, companyTools, operationsTools, businessTools } from "@/data/sidebar-items";
import type { SidebarPermissionKey } from "@/data/sidebar-items";
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
      className="group relative transition-all duration-200 ease-in-out rounded-md hover:bg-primary/10 hover:shadow-sm"
      data-testid={`nav-${item.url === '/' ? 'dashboard' : item.url.slice(1)}`}
    >
      <Link href={item.url} onClick={onClick} className="flex items-center gap-3 w-full py-2.5 px-2">
        {/* Active Accent Bar with Gradient */}
        {isActive && (
          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-gradient-to-b from-primary to-primary/80 rounded-r-full shadow-sm" />
        )}
        
        <div className={`transition-colors duration-200 ${isActive ? 'text-primary' : 'text-muted-foreground group-hover:text-primary'}`}>
          <Icon className="w-4 h-4" />
        </div>
        
        {!isCollapsed && (
          <>
            <span className={`font-medium transition-colors duration-200 ${isActive ? 'text-foreground' : 'text-muted-foreground group-hover:text-foreground'}`}>
              {item.title}
            </span>
            {showBadge && (
              <Badge 
                variant="destructive" 
                className="ml-auto text-xs h-5 min-w-[20px] flex items-center justify-center animate-pulse"
              >
                {badgeCount > 99 ? '99+' : badgeCount}
              </Badge>
            )}
          </>
        )}
        {isCollapsed && showBadge && (
          <div className="absolute top-1 right-1 w-2 h-2 bg-destructive rounded-full border-2 border-background animate-pulse" />
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
  const isClient = (user as any)?.role === 'client';
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
                    badgeCount={getBadgeCount((item as any).badgeKey)}
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
                    badgeCount={getBadgeCount((item as any).badgeKey)}
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

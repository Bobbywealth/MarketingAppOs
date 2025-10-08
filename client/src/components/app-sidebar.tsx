import { 
  LayoutDashboard, 
  Users, 
  Megaphone, 
  TrendingUp, 
  Calendar, 
  DollarSign, 
  Ticket, 
  ClipboardCheck,
  MessageSquare,
  LogOut
} from "lucide-react";
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
} from "@/components/ui/sidebar";
import { Link, useLocation } from "wouter";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/hooks/useAuth";
import { usePermissions } from "@/hooks/usePermissions";

const menuItems = [
  {
    title: "Dashboard",
    url: "/",
    icon: LayoutDashboard,
    permission: null, // Everyone can access dashboard
  },
  {
    title: "Clients",
    url: "/clients",
    icon: Users,
    permission: "canManageClients" as const,
  },
  {
    title: "Campaigns",
    url: "/campaigns",
    icon: Megaphone,
    permission: "canManageCampaigns" as const,
  },
  {
    title: "Sales Pipeline",
    url: "/pipeline",
    icon: TrendingUp,
    permission: "canManageLeads" as const,
  },
  {
    title: "Content Calendar",
    url: "/content",
    icon: Calendar,
    permission: "canManageContent" as const,
  },
  {
    title: "Invoices & Billing",
    url: "/invoices",
    icon: DollarSign,
    permission: "canManageInvoices" as const,
  },
  {
    title: "Support Tickets",
    url: "/tickets",
    icon: Ticket,
    permission: "canManageTickets" as const,
  },
  {
    title: "Onboarding",
    url: "/onboarding",
    icon: ClipboardCheck,
    permission: "canManageClients" as const,
  },
  {
    title: "Messages",
    url: "/messages",
    icon: MessageSquare,
    permission: null, // Everyone can access messages
  },
];

export function AppSidebar() {
  const [location] = useLocation();
  const { user } = useAuth();
  const { canAccess } = usePermissions();

  const getUserInitials = () => {
    if (user?.firstName && user?.lastName) {
      return `${user.firstName[0]}${user.lastName[0]}`.toUpperCase();
    }
    return user?.email?.[0]?.toUpperCase() || "U";
  };

  const filteredMenuItems = menuItems.filter(item => {
    if (!item.permission) return true; // No permission required
    return canAccess(item.permission);
  });

  return (
    <Sidebar>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-lg font-semibold text-primary px-4 py-3">
            MTA CRM
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {filteredMenuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={location === item.url} data-testid={`nav-${item.url === '/' ? 'dashboard' : item.url.slice(1)}`}>
                    <Link href={item.url}>
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
        <a
          href="/api/logout"
          className="flex items-center gap-2 text-sm text-muted-foreground hover-elevate rounded-md px-3 py-2 transition-colors"
          data-testid="button-logout"
        >
          <LogOut className="w-4 h-4" />
          <span>Log Out</span>
        </a>
      </SidebarFooter>
    </Sidebar>
  );
}

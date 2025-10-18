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
  Settings
} from "lucide-react";
import mtaLogoWhite from "@assets/mta-logo.png";
import mtaLogoBlue from "@assets/mta-logo-blue.png";
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
} from "@/components/ui/sidebar";
import { Link, useLocation } from "wouter";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/hooks/useAuth";
import { usePermissions } from "@/hooks/usePermissions";

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

const businessTools = [
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
    title: "Tasks",
    url: "/tasks",
    icon: ListTodo,
    permission: null, // Everyone can access tasks
  },
  {
    title: "Leads",
    url: "/leads",
    icon: UserPlus,
    permission: "canManageLeads" as const,
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
    title: "Subscription Packages",
    url: "/subscription-packages",
    icon: Package,
    permission: "canManageUsers" as const, // Admin only
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
    title: "Website Projects",
    url: "/website-projects",
    icon: Globe,
    permission: "canManageClients" as const,
  },
  {
    title: "Analytics",
    url: "/analytics",
    icon: BarChart3,
    permission: "canManageClients" as const,
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

  const filteredCompanyTools = companyTools.filter(item => {
    if (!item.permission) return true; // No permission required
    return canAccess(item.permission);
  });

  const filteredBusinessTools = businessTools.filter(item => {
    if (!item.permission) return true; // No permission required
    return canAccess(item.permission);
  });

  return (
    <Sidebar>
      <SidebarHeader className="flex items-center justify-center py-4">
        <img 
          src={mtaLogoBlue} 
          alt="Marketing Team App" 
          className="h-32 w-auto dark:hidden"
          data-testid="img-logo"
        />
        <img 
          src={mtaLogoWhite} 
          alt="Marketing Team App" 
          className="h-32 w-auto hidden dark:block"
          data-testid="img-logo-dark"
        />
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

        {/* Business/Marketing Tools Section */}
        <SidebarGroup>
          <SidebarGroupLabel className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-3 py-2">
            Business & Marketing
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {filteredBusinessTools.map((item) => (
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
        <div className="space-y-1">
          <Link href="/settings">
            <div className="flex items-center gap-2 text-sm text-muted-foreground hover-elevate rounded-md px-3 py-2 transition-colors cursor-pointer">
              <Settings className="w-4 h-4" />
              <span>Settings</span>
            </div>
          </Link>
          <a
            href="/api/logout"
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

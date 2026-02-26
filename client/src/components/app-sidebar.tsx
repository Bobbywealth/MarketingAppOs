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
  FileText,
  BookOpen
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
  SidebarHeader,
  SidebarFooter,
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarMenuSubButton,
  useSidebar,
} from "@/components/ui/sidebar";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ChevronRight } from "lucide-react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

type NavItem = {
  title: string;
  url: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string | number;
  items?: NavItem[];
};

const navigationItems: NavItem[] = [
  {
    title: "Dashboard",
    url: "/",
    icon: LayoutDashboard,
  },
  {
    title: "CRM",
    url: "/crm",
    icon: Users,
    items: [
      { title: "Leads", url: "/leads", icon: UserPlus },
      { title: "Contacts", url: "/contacts", icon: Users },
      { title: "Deals", url: "/deals", icon: DollarSign },
      { title: "Accounts", url: "/accounts", icon: Package },
    ]
  },
  {
    title: "Marketing",
    url: "/marketing",
    icon: Megaphone,
    items: [
      { title: "Campaigns", url: "/campaigns", icon: Megaphone },
      { title: "Email", url: "/email-marketing", icon: Mail },
      { title: "SMS", url: "/sms", icon: MessageSquare },
      { title: "Social", url: "/social", icon: Globe },
    ]
  },
  {
    title: "Sales",
    url: "/sales",
    icon: TrendingUp,
    items: [
      { title: "Pipeline", url: "/pipeline", icon: TrendingUp },
      { title: "Quotes", url: "/quotes", icon: FileText },
      { title: "Orders", url: "/orders", icon: ClipboardCheck },
    ]
  },
  {
    title: "Support",
    url: "/support",
    icon: Ticket,
    items: [
      { title: "Tickets", url: "/tickets", icon: Ticket },
      { title: "Knowledge Base", url: "/knowledge-base", icon: BookOpen },
    ]
  },
  {
    title: "Calendar",
    url: "/calendar",
    icon: Calendar,
  },
  {
    title: "Tasks",
    url: "/tasks",
    icon: ListTodo,
  },
  {
    title: "Reports",
    url: "/reports",
    icon: BarChart3,
    items: [
      { title: "Analytics", url: "/analytics", icon: BarChart3 },
      { title: "Performance", url: "/performance", icon: TrendingUp },
    ]
  },
  {
    title: "AI Assistant",
    url: "/ai-assistant",
    icon: Sparkles,
  },
  {
    title: "Team",
    url: "/team",
    icon: UsersRound,
  },
  {
    title: "Phone",
    url: "/phone",
    icon: Phone,
  },
];

export function AppSidebar() {
  const { user, logoutMutation } = useAuth();
  const [location] = useLocation();
  const { state } = useSidebar();
  const isCollapsed = state === "collapsed";

  const isActive = (url: string) => {
    if (url === "/") return location === "/";
    return location.startsWith(url);
  };

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <div className="flex items-center gap-2 px-2 py-1">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground flex-shrink-0">
            <Sparkles className="h-4 w-4" />
          </div>
          {!isCollapsed && (
            <div className="flex flex-col">
              <span className="text-sm font-semibold">MarketingOS</span>
              <span className="text-xs text-muted-foreground">CRM Platform</span>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {navigationItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  {item.items ? (
                    <Collapsible
                      defaultOpen={item.items.some(subItem => isActive(subItem.url))}
                      className="group/collapsible"
                    >
                      <CollapsibleTrigger asChild>
                        <SidebarMenuButton
                          tooltip={item.title}
                          isActive={isActive(item.url)}
                        >
                          <item.icon className="h-4 w-4" />
                          <span>{item.title}</span>
                          <ChevronRight className="ml-auto h-4 w-4 transition-transform group-data-[state=open]/collapsible:rotate-90" />
                        </SidebarMenuButton>
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <SidebarMenuSub>
                          {item.items.map((subItem) => (
                            <SidebarMenuSubItem key={subItem.title}>
                              <SidebarMenuSubButton
                                asChild
                                isActive={isActive(subItem.url)}
                              >
                                <Link
                                  href={subItem.url || "#"}
                                  onClick={() => {}}
                                >
                                  <subItem.icon className="h-4 w-4" />
                                  <span>{subItem.title}</span>
                                </Link>
                              </SidebarMenuSubButton>
                            </SidebarMenuSubItem>
                          ))}
                        </SidebarMenuSub>
                      </CollapsibleContent>
                    </Collapsible>
                  ) : (
                    <SidebarMenuButton
                      asChild
                      tooltip={item.title}
                      isActive={isActive(item.url)}
                    >
                      <Link href={item.url || "#"}>
                        <item.icon className="h-4 w-4" />
                        <span>{item.title}</span>
                        {item.badge && (
                          <Badge variant="secondary" className="ml-auto">
                            {item.badge}
                          </Badge>
                        )}
                      </Link>
                    </SidebarMenuButton>
                  )}
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild tooltip="Settings">
              <Link href="/settings" onClick={() => {}}>
                <Settings className="h-4 w-4" />
                <span>Settings</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton
              tooltip="Profile"
              onClick={handleLogout}
              className="cursor-pointer"
            >
              <Avatar className="h-6 w-6">
                <AvatarFallback className="text-xs">
                  {user?.username?.[0]?.toUpperCase() || "U"}
                </AvatarFallback>
              </Avatar>
              {!isCollapsed && (
                <>
                  <span className="flex-1 truncate text-sm">{user?.username}</span>
                  <LogOut className="h-4 w-4 text-muted-foreground" />
                </>
              )}
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
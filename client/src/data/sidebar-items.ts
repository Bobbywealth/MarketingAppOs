import {
  LayoutDashboard,
  Users,
  Megaphone,
  ListTodo,
  UserPlus,
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
  Settings,
  Sparkles,
  BookOpen,
  Bell,
  LineChart,
} from "lucide-react";

export type SidebarPermissionKey =
  | "dashboard"
  | "team"
  | "messages"
  | "emails"
  | "phone"
  | "calendar"
  | "clients"
  | "socialStats"
  | "leads"
  | "campaigns"
  | "content"
  | "tasks"
  | "onboarding"
  | "tickets"
  | "websiteProjects"
  | "secondMe"
  | "analytics"
  | "invoices"
  | "packages"
  | "training"
  | "aiManager"
  | "pushNotifications";

export const companyTools = [
  {
    title: "Dashboard",
    url: "/",
    icon: LayoutDashboard,
    permission: null,
    sidebarKey: "dashboard" as SidebarPermissionKey,
  },
  {
    title: "Team",
    url: "/team",
    icon: UsersRound,
    permission: "canManageUsers" as const,
    sidebarKey: "team" as SidebarPermissionKey,
  },
  {
    title: "Messages",
    url: "/messages",
    icon: MessageSquare,
    permission: null,
    badgeKey: "messages",
    sidebarKey: "messages" as SidebarPermissionKey,
  },
  {
    title: "Emails",
    url: "/emails",
    icon: Mail,
    permission: null,
    badgeKey: "emails",
    sidebarKey: "emails" as SidebarPermissionKey,
  },
  {
    title: "Phone",
    url: "/phone",
    icon: Phone,
    permission: null,
    sidebarKey: "phone" as SidebarPermissionKey,
  },
  {
    title: "My Calendar",
    url: "/company-calendar",
    icon: Calendar,
    permission: null,
    sidebarKey: "calendar" as SidebarPermissionKey,
  },
];

export const operationsTools = [
  {
    title: "Clients",
    url: "/clients",
    icon: Users,
    permission: "canManageClients" as const,
    sidebarKey: "clients" as SidebarPermissionKey,
  },
  {
    title: "Social Stats",
    url: "/admin/social-stats",
    icon: LineChart,
    permission: "canManageClients" as const,
    sidebarKey: "socialStats" as SidebarPermissionKey,
  },
  {
    title: "Leads",
    url: "/leads",
    icon: UserPlus,
    permission: "canManageLeads" as const,
    sidebarKey: "leads" as SidebarPermissionKey,
  },
  {
    title: "Campaigns",
    url: "/campaigns",
    icon: Megaphone,
    permission: "canManageCampaigns" as const,
    sidebarKey: "campaigns" as SidebarPermissionKey,
  },
  {
    title: "Content Calendar",
    url: "/content",
    icon: Calendar,
    permission: "canManageContent" as const,
    sidebarKey: "content" as SidebarPermissionKey,
  },
  {
    title: "Tasks",
    url: "/tasks",
    icon: ListTodo,
    permission: null,
    sidebarKey: "tasks" as SidebarPermissionKey,
  },
  {
    title: "Onboarding",
    url: "/onboarding",
    icon: ClipboardCheck,
    permission: "canManageClients" as const,
    sidebarKey: "onboarding" as SidebarPermissionKey,
  },
  {
    title: "Support Tickets",
    url: "/tickets",
    icon: Ticket,
    permission: "canManageTickets" as const,
    sidebarKey: "tickets" as SidebarPermissionKey,
  },
  {
    title: "Website Projects",
    url: "/website-projects",
    icon: Globe,
    permission: "canManageClients" as const,
    sidebarKey: "websiteProjects" as SidebarPermissionKey,
  },
  {
    title: "Second Me",
    url: "/admin-second-me",
    icon: Sparkles,
    permission: "canManageClients" as const,
    sidebarKey: "secondMe" as SidebarPermissionKey,
  },
];

export const businessTools = [
  {
    title: "Analytics",
    url: "/analytics",
    icon: BarChart3,
    permission: "canManageClients" as const,
    sidebarKey: "analytics" as SidebarPermissionKey,
  },
  {
    title: "Invoices & Billing",
    url: "/invoices",
    icon: DollarSign,
    permission: "canManageInvoices" as const,
    sidebarKey: "invoices" as SidebarPermissionKey,
  },
  {
    title: "Subscription Packages",
    url: "/subscription-packages",
    icon: Package,
    permission: "canManageUsers" as const,
    sidebarKey: "packages" as SidebarPermissionKey,
  },
  {
    title: "Training",
    url: "/training",
    icon: BookOpen,
    permission: "canManageUsers" as const,
    sidebarKey: "training" as SidebarPermissionKey,
  },
  {
    title: "AI Business Manager",
    url: "/ai-manager",
    icon: Sparkles,
    roles: ["admin"] as const,
    sidebarKey: "aiManager" as SidebarPermissionKey,
  },
  {
    title: "Push Notifications",
    url: "/push-notifications",
    icon: Bell,
    roles: ["admin", "manager", "staff"] as const,
    sidebarKey: "pushNotifications" as SidebarPermissionKey,
  },
];

export const clientTools = [
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

export const sidebarPermissionList = [
  ...companyTools.map((item) => ({
    key: item.sidebarKey,
    label: item.title,
    category: "Company Tools",
  })),
  ...operationsTools.map((item) => ({
    key: item.sidebarKey,
    label: item.title,
    category: "Operations",
  })),
  ...businessTools.map((item) => ({
    key: item.sidebarKey,
    label: item.title,
    category: "Business",
  })),
];


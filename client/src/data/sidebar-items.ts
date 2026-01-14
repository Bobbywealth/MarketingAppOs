// Shared sidebar permission definitions used across the app
export const sidebarPermissionList = [
  // Company Tools
  { key: "dashboard", label: "Dashboard", category: "Company Tools" },
  { key: "team", label: "User Management", category: "Company Tools" },
  { key: "messages", label: "Messages", category: "Company Tools" },
  { key: "emails", label: "Emails", category: "Company Tools" },
  { key: "phone", label: "Phone", category: "Company Tools" },
  { key: "calendar", label: "Calendar", category: "Company Tools" },
  
  // Operations Tools  
  { key: "clients", label: "Clients", category: "Operations" },
  { key: "socialStats", label: "Social Stats", category: "Operations" },
  { key: "leads", label: "Leads", category: "Operations" },
  { key: "campaigns", label: "Campaigns", category: "Operations" },
  { key: "marketingCenter", label: "Marketing Center", category: "Operations" },
  { key: "content", label: "Content Calendar", category: "Operations" },
  { key: "blog", label: "Blog Posts", category: "Operations" },
  { key: "visits", label: "Visits", category: "Operations" },
  { key: "creators", label: "Creators", category: "Operations" },
  { key: "tasks", label: "Tasks", category: "Operations" },
  { key: "onboarding", label: "Onboarding", category: "Operations" },
  { key: "tickets", label: "Support Tickets", category: "Operations" },
  { key: "websiteProjects", label: "Website Projects", category: "Operations" },
  { key: "secondMe", label: "Second Me", category: "Operations" },
  
  // Business Tools
  { key: "analytics", label: "Analytics", category: "Business" },
  { key: "invoices", label: "Invoices & Billing", category: "Business" },
  { key: "commissions", label: "Commissions", category: "Business" },
  { key: "packages", label: "Subscription Packages", category: "Business" },
  { key: "discountCodes", label: "Discount Codes", category: "Business" },
  { key: "training", label: "Training", category: "Business" },
  { key: "aiManager", label: "AI Business Manager", category: "Business" },
  { key: "aiContentGenerator", label: "AI Content Generator", category: "Business" },
  { key: "pushNotifications", label: "Push Notifications", category: "Business" },
];

export type SidebarPermissionKey = (typeof sidebarPermissionList)[number]["key"];

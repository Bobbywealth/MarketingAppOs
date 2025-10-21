import { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  BookOpen,
  Search,
  LayoutDashboard,
  Users,
  Calendar,
  CheckSquare,
  MessageSquare,
  Mail,
  Phone,
  TrendingUp,
  Megaphone,
  FileText,
  DollarSign,
  UserCog,
  Video,
  Lightbulb,
  AlertCircle,
  Target,
  PieChart,
  Settings,
} from "lucide-react";

interface TrainingSection {
  id: string;
  title: string;
  icon: any;
  category: string;
  content: string;
  steps?: string[];
  tips?: string[];
}

const trainingContent: TrainingSection[] = [
  {
    id: "dashboard",
    title: "Dashboard Overview",
    icon: LayoutDashboard,
    category: "Getting Started",
    content: "The Dashboard is your central hub showing key metrics at a glance. It displays total clients, active campaigns, pipeline value, monthly revenue, task progress, and recent activity.",
    steps: [
      "View real-time stats for clients, campaigns, and revenue",
      "Track task progress with the visual progress bar",
      "Monitor recent activity including logins, new clients, and completed tasks",
      "Check upcoming deadlines to stay on track",
      "View Stripe subscription metrics if connected",
    ],
    tips: [
      "The dashboard auto-refreshes every 30 seconds",
      "Click on any metric card to drill down into details",
      "Use the date range selector to view historical data",
    ],
  },
  {
    id: "clients",
    title: "Managing Clients",
    icon: Users,
    category: "Core Features",
    content: "The Clients page helps you organize and manage all your client relationships. You can add new clients, track their status, and view detailed profiles.",
    steps: [
      "Click 'Add Client' to create a new client profile",
      "Fill in company name, contact info, and social media links",
      "Set client status: Lead, Active, or Inactive",
      "Drag clients to reorder by priority (most important at top)",
      "Click a client card to view their full dashboard",
      "Assign content posts and tasks to specific clients",
    ],
    tips: [
      "Use client status to filter and organize your pipeline",
      "Each client has their own dashboard showing assigned content and tasks",
      "Clients can log in to see their personalized view",
    ],
  },
  {
    id: "campaigns",
    title: "Campaign Management",
    icon: Megaphone,
    category: "Core Features",
    content: "Campaigns help you organize marketing initiatives for your clients. Track budgets, timelines, and performance all in one place.",
    steps: [
      "Click 'New Campaign' to create a campaign",
      "Select the client and campaign type (Social, Ads, Content, Email)",
      "Set start/end dates and budget",
      "Define campaign goals and description",
      "Update status as campaign progresses: Planning → Active → Completed",
      "Link tasks to campaigns for better organization",
    ],
    tips: [
      "Use campaign types to filter and report on specific channels",
      "Set realistic budgets to track ROI",
      "Review completed campaigns to identify what works",
    ],
  },
  {
    id: "tasks",
    title: "Task Management & Kanban",
    icon: CheckSquare,
    category: "Core Features",
    content: "The Task Manager uses a Kanban board to visualize your workflow. Organize tasks in Spaces, drag-and-drop between statuses, and track progress.",
    steps: [
      "Create new tasks with the 'New Task' button",
      "Organize tasks into Spaces (folders) for different projects",
      "Drag tasks between columns: To Do → In Progress → Review → Completed",
      "Set due dates and assign to team members",
      "Enable recurring tasks for regular activities",
      "Use the AI Task Assistant for natural language task creation",
      "Toggle 'Hide Completed' to reduce clutter while keeping tasks accessible",
    ],
    tips: [
      "📋 To Do: Tasks not yet started",
      "⚡ In Progress: Currently working on",
      "👀 Review: Awaiting approval or feedback",
      "✅ Completed: Finished tasks (click 'Hide Completed' to declutter)",
      "For recurring tasks: completed instance stays visible until hidden, new instance appears in To Do",
      "Use voice input in AI Assistant for hands-free task creation",
    ],
  },
  {
    id: "content-calendar",
    title: "Content Calendar",
    icon: Calendar,
    category: "Core Features",
    content: "Plan and schedule content posts across all platforms. The Content Calendar helps you maintain a consistent posting schedule.",
    steps: [
      "Click 'New Post' to create content",
      "Select client, platform (Instagram, Facebook, TikTok, LinkedIn, Twitter)",
      "Write your caption and upload media (images/videos)",
      "Set scheduled date and time",
      "Switch between Day, Week, and Month views",
      "Drag posts to reschedule them",
      "Filter by client to see their content calendar",
    ],
    tips: [
      "Plan content in advance for better consistency",
      "Use the week view for quick overview of upcoming posts",
      "Clients can see their assigned content in their dashboard",
    ],
  },
  {
    id: "team",
    title: "Team Management",
    icon: UserCog,
    category: "Administration",
    content: "Manage your team members, roles, and permissions. Control what each team member can access.",
    steps: [
      "Click 'Add Team Member' to invite someone",
      "Enter username, email, and password",
      "Assign a role: Admin, Manager, Staff, or Client",
      "Customize permissions for each role using checkboxes",
      "View role permissions to understand access levels",
    ],
    tips: [
      "Admins have full access to everything",
      "Managers can manage clients, campaigns, and content",
      "Staff can create tasks and content but not manage team",
      "Clients only see their own dashboard and assigned content",
    ],
  },
  {
    id: "messages",
    title: "Internal Messaging",
    icon: MessageSquare,
    category: "Communication",
    content: "Communicate with team members and clients directly in the app. Keep all conversations organized and searchable.",
    steps: [
      "Select a user from the sidebar to start a conversation",
      "Type your message and press Enter to send",
      "Messages auto-update in real-time",
      "View conversation history with each team member",
    ],
    tips: [
      "Use messages for quick team updates",
      "Keep client communication documented",
      "Messages are private between you and the recipient",
    ],
  },
  {
    id: "emails",
    title: "Email Integration (Outlook)",
    icon: Mail,
    category: "Communication",
    content: "Connect your Microsoft Outlook email to send and receive emails directly in the CRM. Track all client email communication.",
    steps: [
      "Click 'Connect Email Account' to link Outlook",
      "Authorize Microsoft account access",
      "View inbox, sent, and spam folders",
      "Click email to expand and read full content",
      "Reply to emails directly from the CRM",
      "Use AI Email Analysis to get insights",
      "Emails auto-sync every 30 seconds",
    ],
    tips: [
      "Connected emails stay logged in unless manually disconnected",
      "Use email search to find specific conversations",
      "View client emails on their profile page",
    ],
  },
  {
    id: "phone",
    title: "Phone Integration (Dialpad)",
    icon: Phone,
    category: "Communication",
    content: "Make and receive calls through Dialpad integration. Track call history and log call notes.",
    steps: [
      "Connect your Dialpad account in settings",
      "Make calls directly from client profiles",
      "View call history and duration",
      "Add notes after each call",
    ],
    tips: [
      "Keep call notes for better client service",
      "Review call history to track touchpoints",
    ],
  },
  {
    id: "analytics",
    title: "Analytics & Reports",
    icon: PieChart,
    category: "Insights",
    content: "Track performance across social media, advertising, and website analytics. Make data-driven decisions.",
    steps: [
      "Filter by client or platform",
      "Switch between Social, Ads, and Website tabs",
      "View key metrics like followers, engagement, ROAS, page views",
      "Check top pages and traffic sources",
      "Export data for custom reports",
    ],
    tips: [
      "Use analytics to identify what's working",
      "Compare performance across platforms",
      "Website analytics track real visitor data",
    ],
  },
  {
    id: "invoices",
    title: "Invoices & Billing (Stripe)",
    icon: DollarSign,
    category: "Finance",
    content: "Manage invoices and track payments through Stripe integration. Monitor MRR, revenue, and customer payments.",
    steps: [
      "Connect Stripe with your secret key",
      "View active subscribers and MRR",
      "See top customers by spending",
      "Create new invoices for customers",
      "Track gross volume and payouts",
      "Filter metrics by date range",
    ],
    tips: [
      "Stripe data updates in real-time",
      "Use MRR to forecast revenue",
      "Revenue (MTD) shows actual month-to-date earnings",
    ],
  },
  {
    id: "leads",
    title: "Lead Management",
    icon: Target,
    category: "Sales",
    content: "Track potential clients through your sales pipeline. Convert leads to clients when deals close.",
    steps: [
      "Add new leads with contact info",
      "Track lead source and status",
      "Add website links and social media",
      "Move leads through pipeline stages",
      "Convert leads to clients when ready",
    ],
    tips: [
      "Follow up with leads regularly",
      "Track lead source to optimize marketing spend",
      "Use notes to remember key details",
    ],
  },
  {
    id: "notifications",
    title: "Notification Center",
    icon: AlertCircle,
    category: "System",
    content: "Stay updated with real-time notifications for tasks, deadlines, and system events.",
    steps: [
      "Click bell icon to view notifications",
      "Receive alerts for due tasks and past due tasks",
      "Mark notifications as read",
      "Enable sound for important alerts",
    ],
    tips: [
      "Notifications check every minute",
      "Don't miss deadlines with task due alerts",
    ],
  },
  {
    id: "ai-assistant",
    title: "AI Task Assistant",
    icon: Lightbulb,
    category: "Advanced",
    content: "Use AI to create tasks from natural language. Just describe what needs to be done, and AI creates the task for you.",
    steps: [
      "Click AI Assistant button on Tasks page",
      "Type or speak what you need done",
      "AI will extract title, description, due date, priority",
      "Review and confirm task creation",
      "Use voice input for hands-free task creation",
    ],
    tips: [
      "Be specific: 'Create task to design Instagram post for Acme Corp due Friday'",
      "AI understands dates like 'tomorrow', 'next Monday', 'in 3 days'",
      "Mention priority: 'urgent', 'high priority', 'low priority'",
    ],
  },
  {
    id: "settings",
    title: "Settings & Preferences",
    icon: Settings,
    category: "Administration",
    content: "Customize your account, manage integrations, and configure system settings.",
    steps: [
      "Update your profile info and password",
      "Connect third-party integrations",
      "Set notification preferences",
      "Manage role permissions",
      "Configure email settings",
    ],
    tips: [
      "Keep your profile info up to date",
      "Enable 2FA for extra security (if available)",
    ],
  },
];

export default function Training() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");

  const categories = ["All", "Getting Started", "Core Features", "Communication", "Insights", "Finance", "Sales", "Administration", "Advanced", "System"];

  const filteredContent = trainingContent.filter((item) => {
    const matchesSearch =
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.content.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory =
      selectedCategory === "all" || item.category.toLowerCase() === selectedCategory.toLowerCase();
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="min-h-full gradient-mesh">
      <div className="max-w-7xl mx-auto p-6 lg:p-8 xl:p-12 space-y-8">
        {/* Header */}
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center">
              <BookOpen className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold tracking-tight text-gradient-purple">
                Knowledge & Training
              </h1>
              <p className="text-lg text-muted-foreground">
                Learn how to use every feature of your Marketing CRM
              </p>
            </div>
          </div>

          {/* Search Bar */}
          <div className="relative max-w-2xl">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              placeholder="Search for features, guides, or tips..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 glass h-12 text-lg"
            />
          </div>
        </div>

        {/* Category Filter */}
        <Tabs value={selectedCategory} onValueChange={setSelectedCategory} className="space-y-6">
          <TabsList className="grid w-full grid-cols-5 lg:grid-cols-10 h-auto">
            {categories.map((cat) => (
              <TabsTrigger key={cat} value={cat.toLowerCase()} className="text-xs lg:text-sm">
                {cat}
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value={selectedCategory} className="space-y-4">
            {filteredContent.length === 0 ? (
              <Card className="glass-strong">
                <CardContent className="p-12 text-center">
                  <Search className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                  <h3 className="text-xl font-semibold mb-2">No results found</h3>
                  <p className="text-muted-foreground">
                    Try adjusting your search or browse all categories
                  </p>
                </CardContent>
              </Card>
            ) : (
              <Accordion type="single" collapsible className="space-y-4">
                {filteredContent.map((section) => {
                  const Icon = section.icon;
                  return (
                    <AccordionItem
                      key={section.id}
                      value={section.id}
                      className="glass-strong border-0 rounded-xl overflow-hidden"
                    >
                      <AccordionTrigger className="px-6 py-4 hover:no-underline hover:bg-muted/50 transition-colors">
                        <div className="flex items-center gap-4 text-left">
                          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary/20 to-purple-500/20 flex items-center justify-center flex-shrink-0">
                            <Icon className="w-5 h-5 text-primary" />
                          </div>
                          <div className="flex-1">
                            <h3 className="text-lg font-semibold">{section.title}</h3>
                            <Badge variant="secondary" className="mt-1">
                              {section.category}
                            </Badge>
                          </div>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="px-6 pb-6 space-y-4">
                        {/* Overview */}
                        <div className="bg-muted/30 rounded-lg p-4">
                          <p className="text-muted-foreground leading-relaxed">
                            {section.content}
                          </p>
                        </div>

                        {/* Steps */}
                        {section.steps && section.steps.length > 0 && (
                          <div>
                            <h4 className="font-semibold mb-3 flex items-center gap-2">
                              <CheckSquare className="w-4 h-4 text-primary" />
                              How to Use
                            </h4>
                            <ol className="space-y-2">
                              {section.steps.map((step, idx) => (
                                <li key={idx} className="flex gap-3">
                                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/20 text-primary flex items-center justify-center text-sm font-semibold">
                                    {idx + 1}
                                  </span>
                                  <span className="flex-1 pt-0.5">{step}</span>
                                </li>
                              ))}
                            </ol>
                          </div>
                        )}

                        {/* Tips */}
                        {section.tips && section.tips.length > 0 && (
                          <div className="bg-gradient-to-r from-amber-500/10 to-orange-500/10 rounded-lg p-4 border border-amber-500/20">
                            <h4 className="font-semibold mb-3 flex items-center gap-2 text-amber-600 dark:text-amber-400">
                              <Lightbulb className="w-4 h-4" />
                              Pro Tips
                            </h4>
                            <ul className="space-y-2">
                              {section.tips.map((tip, idx) => (
                                <li key={idx} className="flex gap-2">
                                  <span className="text-amber-600 dark:text-amber-400">•</span>
                                  <span className="flex-1">{tip}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </AccordionContent>
                    </AccordionItem>
                  );
                })}
              </Accordion>
            )}
          </TabsContent>
        </Tabs>

        {/* Quick Links */}
        <Card className="glass-strong border-0">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Video className="w-5 h-5 text-primary" />
              Additional Resources
            </CardTitle>
            <CardDescription>
              Need more help? Check out these resources
            </CardDescription>
          </CardHeader>
          <CardContent className="grid md:grid-cols-3 gap-4">
            <div className="p-4 rounded-lg bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border border-blue-500/20">
              <h4 className="font-semibold mb-2">📺 Video Tutorials</h4>
              <p className="text-sm text-muted-foreground">
                Watch step-by-step video guides
              </p>
            </div>
            <div className="p-4 rounded-lg bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-500/20">
              <h4 className="font-semibold mb-2">💬 Support Chat</h4>
              <p className="text-sm text-muted-foreground">
                Get help from our support team
              </p>
            </div>
            <div className="p-4 rounded-lg bg-gradient-to-br from-emerald-500/10 to-teal-500/10 border border-emerald-500/20">
              <h4 className="font-semibold mb-2">📖 Documentation</h4>
              <p className="text-sm text-muted-foreground">
                Read detailed technical docs
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}


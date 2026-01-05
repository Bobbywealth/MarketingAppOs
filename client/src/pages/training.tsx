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
  Ticket,
  Globe,
  Package,
  Sparkles,
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
    content: "The Dashboard is your central hub showing key metrics at a glance. It displays total clients, active campaigns, pipeline value, monthly revenue, task progress, and recent activity with live month-over-month percentage changes.",
    steps: [
      "View real-time stats for clients, campaigns, pipeline value, and revenue",
      "Monitor live percentage changes showing month-over-month growth/decline",
      "Track task progress with the visual progress bar",
      "Monitor recent activity including logins, new clients, and completed tasks",
      "Check upcoming deadlines to stay on track",
      "View Stripe subscription metrics if connected",
    ],
    tips: [
      "Green percentages show positive growth, red shows decline",
      "Percentage changes are calculated automatically from last month's data",
      "The dashboard auto-refreshes to show latest metrics",
      "Click on any metric card to drill down into details",
    ],
  },
  {
    id: "clients",
    title: "Managing Clients",
    icon: Users,
    category: "Core Features",
    content: "The Clients page helps you organize and manage all your client relationships. You can add new clients, track their status, assign subscription packages with automatic payment processing, and view detailed profiles.",
    steps: [
      "Click 'Add Client' to create a new client profile",
      "Fill in company name, contact info, and social media links",
      "Set client status: Lead, Active, or Inactive",
      "Select a subscription package (optional) - triggers Stripe checkout",
      "If package selected, you'll be redirected to Stripe for secure payment",
      "Drag clients to reorder by priority (most important at top)",
      "Click a client card to view their full dashboard",
      "Assign content posts and tasks to specific clients",
    ],
    tips: [
      "Selecting a package during client creation automatically creates a Stripe checkout session",
      "Payment must be completed before client package is activated",
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
    title: "Content Calendar & Approval",
    icon: Calendar,
    category: "Core Features",
    content: "Plan and schedule content posts across all platforms. The Content Calendar features a multi-stage approval workflow to ensure quality before publishing.",
    steps: [
      "Click 'New Post' to create content",
      "Select client, platform (Instagram, Facebook, TikTok, LinkedIn, Twitter)",
      "Write your caption and upload media (images/videos)",
      "Set scheduled date and time",
      "Track approval status: Draft → Pending → Approved → Published",
      "Clients can review and approve/reject content from their dashboard",
      "Drag posts in the calendar to reschedule them instantly",
    ],
    tips: [
      "Plan content in advance for better consistency",
      "Use 'Draft' mode for early ideas before requesting approval",
      "Rejected posts include feedback from the client for easy revisions",
      "Use the Month view for long-term planning, and Day view for final checks",
    ],
  },
  {
    id: "creator-visits",
    title: "Creator Visits & Fulfillment",
    icon: Video,
    category: "Creators",
    content: "Creators capture professional-grade media at local businesses. This workflow manages scheduling, fulfillment, and asset delivery.",
    steps: [
      "Admins schedule 'Content Visits' for creators at client locations",
      "Set visit window (Start/End) and specific capture instructions",
      "Creators view their schedule on the 'My Visits' page",
      "After the visit, creators upload media links (e.g., Google Drive, Dropbox)",
      "Admins review uploads and provide a Quality Score (1-5 stars)",
      "Once approved, visit status moves to 'Completed' and payment is released",
    ],
    tips: [
      "Creators should upload content within 24 hours of visit completion",
      "Quality scores (Lighting, Framing, Content) help track creator performance",
      "Use 'Revision Requested' if content doesn't meet brand guidelines",
    ],
  },
  {
    id: "creator-lms",
    title: "Learning Management (LMS)",
    icon: BookOpen,
    category: "Creators",
    content: "Creators can host and manage training courses. Build curriculum with modules and lessons to educate clients or other creators.",
    steps: [
      "Go to 'Manage Courses' to create a new curriculum",
      "Add Modules to organize the course into logical sections",
      "Create Lessons with video URLs, documents, or rich text content",
      "Set specific lessons as 'Free Preview' to attract students",
      "Publish the course to make it available for enrollment",
      "Track student progress through 'Course Enrollments'",
    ],
    tips: [
      "Break complex topics into small, 5-10 minute lessons",
      "Difficulty levels (Beginner/Advanced) help students find the right content",
      "Use Course Categories to make your content easier to browse",
    ],
  },
  {
    id: "sales-agent",
    title: "Sales Agent Dashboards",
    icon: TrendingUp,
    category: "Sales",
    content: "Sales Agents have a dedicated view for managing their pipeline, tracking leads, and monitoring commission earnings.",
    steps: [
      "Access the Sales Dashboard to view targets and pipeline status",
      "Manage assigned Leads and move them through pipeline stages",
      "Monitor 'Commission' status (Pending → Approved → Paid)",
      "Track progress against monthly and quarterly Sales Quotas",
      "Use the lead 'Score' (Hot, Warm, Cold) to prioritize your day",
    ],
    tips: [
      "The dashboard shows your conversion rate from Lead to Client",
      "Revenue targets are calculated based on 'Closed Won' deal values",
      "Commissions are automatically generated when a lead is converted",
    ],
  },
  {
    id: "marketing-center",
    title: "Marketing Center & Broadcasts",
    icon: Zap,
    category: "Sales",
    content: "Send mass communications via SMS and Email to specific audiences or your entire lead database with real-time tracking.",
    steps: [
      "Select 'New Broadcast' in the Marketing Center",
      "Choose channel (Email or SMS) and your target audience",
      "Filter recipients by Industry, Service Tags, or specific Lead Stages",
      "Compose your message and schedule for delivery",
      "Track live 'Success Count' and 'Failed Count' as messages go out",
    ],
    tips: [
      "Use tags to segment your database for highly targeted outreach",
      "Monitor 'Opt-in' status to ensure compliance with communication laws",
      "Check the broadcast history to see which messages had the best response",
    ],
  },
  {
    id: "ai-manager",
    title: "AI Business Manager",
    icon: Sparkles,
    category: "Advanced",
    content: "Manage the AI personas that power digital twins and automated content. Fine-tune brand voice and personality traits.",
    steps: [
      "Access the AI Manager from the Admin dashboard",
      "Configure the 'Mission' and 'Vibe' for each AI character",
      "Input 'Story Words' to define the vocabulary the AI uses",
      "Specify Target Audiences and preferred Content Styles",
      "Update catchphrases and 'Dream Collaborations' to build personality",
    ],
    tips: [
      "The 'Mission' field is the most important for guiding AI behavior",
      "Review the AI Bio frequently as the client's brand evolves",
      "Story Words should include brand-specific terminology and slang",
    ],
  },
  {
    id: "pwa-mobile",
    title: "PWA & Mobile Installation",
    icon: Globe,
    category: "System",
    content: "Install the Marketing Team App as a Progressive Web App on your home screen for a fast, native-like experience.",
    steps: [
      "Open the app in your mobile browser (Safari for iOS, Chrome for Android)",
      "Tap 'Share' and select 'Add to Home Screen' (iOS) or click 'Install' prompt (Android)",
      "Open the app from your home screen to enter 'Standalone Mode'",
      "Enable Push Notifications when prompted to receive real-time alerts",
    ],
    tips: [
      "The PWA uses less battery and storage than a traditional app",
      "Notifications work even when the app is closed if you've opted in",
      "Standalone mode removes browser address bars for more screen space",
    ],
  },
  {
    id: "team",
    title: "User Management",
    icon: UserCog,
    category: "Administration",
    content: "Manage all user accounts, roles, and permissions across the entire platform.",
    steps: [
      "Click 'Add New User' to invite someone",
      "Enter username, email, and password",
      "Assign a role: Admin, Manager, Staff, Sales Agent, Creator, or Client",
      "Customize sidebar visibility permissions for each user",
      "View and filter users by role to manage large teams",
    ],
    tips: [
      "Admins have full access to everything",
      "Managers can manage clients, campaigns, and content",
      "Staff can create tasks and content but not manage other users",
      "Clients only see their own dashboard and assigned content",
      "Creators handle content fulfillment and visit scheduling",
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
    content: "Connect your Microsoft Outlook email to send and receive emails directly in the CRM. Features a compact, Gmail/Outlook-style interface for efficient email management and client communication tracking.",
    steps: [
      "Click 'Connect Email Account' to link Outlook",
      "Authorize Microsoft account access",
      "View inbox, sent, and spam folders in compact list view",
      "Click any email to expand and read full content (70% of content visible without scrolling)",
      "Compact design maximizes email viewing space",
      "Reply to emails directly from the CRM",
      "Use AI Email Analysis to get insights and sentiment analysis",
      "Emails auto-sync every 30 seconds",
    ],
    tips: [
      "Compact Gmail-like design shows more emails on screen at once",
      "Selected emails have a subtle blue border for easy tracking",
      "Email preview text appears inline with subject for quick scanning",
      "Connected emails stay logged in unless manually disconnected",
      "Use email search to find specific conversations",
      "AI analysis provides sentiment and urgency detection",
    ],
  },
  {
    id: "phone",
    title: "Phone Integration (Dialpad)",
    icon: Phone,
    category: "Communication",
    content: "Make and receive calls through Dialpad integration. Track call history, SMS messages, and contacts. System automatically checks connection status and provides setup guidance.",
    steps: [
      "Add your Dialpad API key in Settings (get from dialpad.com/settings)",
      "System automatically verifies connection status",
      "If connected, you'll see a success message with green checkmark",
      "If not connected, follow the setup instructions displayed",
      "View call logs with duration, direction (inbound/outbound), and timestamps",
      "Send and receive SMS messages to/from clients",
      "Access and manage your Dialpad contacts",
      "Make calls directly from client profiles",
    ],
    tips: [
      "Connection status is checked automatically when you visit the phone page",
      "Setup instructions include links to Dialpad settings and Render dashboard",
      "All call history and SMS are synced from your Dialpad account",
      "Keep call notes for better client service",
      "Review call history to track client touchpoints",
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
  {
    id: "company-calendar",
    title: "Company Calendar",
    icon: Calendar,
    category: "Core Features",
    content: "Manage company-wide events, meetings, and deadlines. Sync with Google Calendar for seamless scheduling.",
    steps: [
      "Click 'New Event' to create meetings or deadlines",
      "Set event title, date/time, location, and attendees",
      "Choose event type: Meeting, Call, Deadline, Reminder, or Event",
      "Toggle 'Sync with Google Calendar' to integrate with Google",
      "Switch between Month, Week, and Day views",
      "Click any event to view details or edit",
      "Export calendar to share with team",
    ],
    tips: [
      "Use Google Calendar sync to keep everything in one place",
      "Color-coded event types make it easy to see what's coming up",
      "Set reminders for important deadlines",
      "View all team events in one shared calendar",
    ],
  },
  {
    id: "support-tickets",
    title: "Admin Ticket Management",
    icon: Ticket,
    category: "Communication",
    content: "Comprehensive admin dashboard for managing all client support requests. Features ticket stats overview, status-based filtering with tabs, and streamlined ticket management workflow.",
    steps: [
      "View dashboard stats: Total Open, In Progress, Resolved, and Urgent tickets",
      "Use tabs to filter tickets by status: All, Open, In Progress, Resolved, Urgent",
      "Each ticket card shows client name, priority badge, status badge, and description",
      "Click 'New Ticket' to create a support request",
      "Enter subject, description, and priority (Normal or Urgent)",
      "Track ticket status: Open → In Progress → Resolved → Closed",
      "Update ticket status as you work on issues",
      "Stats cards provide quick overview of workload",
    ],
    tips: [
      "Dashboard provides at-a-glance view of all ticket metrics",
      "Urgent tickets are highlighted in red for immediate attention",
      "Use status tabs to focus on specific ticket categories",
      "Stats show real-time counts for effective workload management",
      "Prioritize urgent and open tickets for faster response times",
      "Clients can only create tickets, admins manage all aspects",
      "Close tickets once fully resolved to keep dashboard organized",
    ],
  },
  {
    id: "website-projects",
    title: "Website Projects",
    icon: Globe,
    category: "Core Features",
    content: "Manage client website development projects from start to finish. Track progress, milestones, and deliverables.",
    steps: [
      "Create new website projects for clients",
      "Set project timelines and milestones",
      "Track project status and progress",
      "Assign team members to projects",
      "Upload deliverables and assets",
      "Communicate with clients about project updates",
    ],
    tips: [
      "Break projects into clear milestones",
      "Keep clients updated on progress",
      "Document all requirements upfront",
    ],
  },
  {
    id: "subscription-packages",
    title: "Subscription Packages",
    icon: Package,
    category: "Finance",
    content: "Create and manage subscription tiers that clients can purchase. Packages integrate seamlessly with Stripe Checkout for automatic payment processing when clients are created with a selected package.",
    steps: [
      "Click 'Add Package' to create a new subscription tier",
      "Set package name, description, and monthly price",
      "Define features included in each tier",
      "Toggle 'Active' to show/hide packages on landing page",
      "Packages appear on homepage for new client signup",
      "When creating a client, select a package to trigger Stripe checkout",
      "Client is redirected to Stripe for secure payment processing",
      "Edit or archive packages as needed",
    ],
    tips: [
      "Offer 3-4 tiers for best conversion (Basic, Pro, Premium)",
      "Clearly highlight value in package descriptions",
      "Stripe checkout is automatically triggered when package is selected during client creation",
      "Payment completion required before package activation",
      "Update packages based on client feedback",
      "Prices are synced with Stripe for accurate billing",
    ],
  },
  {
    id: "second-me",
    title: "Second Me - AI Digital Twin",
    icon: Sparkles,
    category: "Advanced",
    content: "Premium service that creates an AI-generated digital twin of the client for automated content creation. Features high-fidelity photo processing and weekly subscription-based video/image generation.",
    steps: [
      "Client uploads 15-30 high-quality photos during onboarding",
      "System processes photos to train a custom AI model (Higgsfield integration)",
      "Client pays the one-time Setup Fee to activate the avatar",
      "Optional: Subscribe to 'Weekly Content' for automated AI posts",
      "Admin reviews submissions and tracks status: Pending → Processing → Ready",
      "Weekly subscribers receive AI-generated videos and images in their 'My Content' tab",
    ],
    tips: [
      "High-quality, varied photos (different angles, lighting) are crucial for model accuracy",
      "The 'Weekly Content' subscription provides 5-7 pieces of AI media per week",
      "AI content automatically adopts the brand voice set in the AI Manager",
      "Clients can review and schedule AI-generated posts just like manual ones",
    ],
  },
];

export default function Training() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");

  const categories = ["All", "Getting Started", "Core Features", "Creators", "Sales", "Communication", "Insights", "Finance", "Administration", "Advanced", "System"];

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
      <div className="max-w-7xl mx-auto p-4 md:p-6 lg:p-8 xl:p-12 space-y-4 md:space-y-6 lg:space-y-8">
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


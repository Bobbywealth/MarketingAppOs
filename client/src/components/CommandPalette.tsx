import { useState, useEffect, useCallback } from "react";
import { useLocation } from "wouter";
import { Command } from "cmdk";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
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
  MessageSquare,
  Mail,
  Phone,
  BarChart3,
  Settings,
  Sparkles,
  Bot,
  Bell,
  Search,
  FileText,
  Globe,
  KeyRound,
  LineChart,
  Percent,
  Zap,
  CreditCard,
  ClipboardCheck,
  UsersRound,
  BookOpen,
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";

interface CommandItem {
  id: string;
  title: string;
  icon: React.ReactNode;
  href?: string;
  action?: () => void;
  keywords?: string[];
  category?: string;
}

const iconMap: Record<string, React.ReactNode> = {
  dashboard: <LayoutDashboard className="w-4 h-4" />,
  clients: <Users className="w-4 h-4" />,
  campaigns: <Megaphone className="w-4 h-4" />,
  tasks: <ListTodo className="w-4 h-4" />,
  leads: <UserPlus className="w-4 h-4" />,
  pipeline: <TrendingUp className="w-4 h-4" />,
  calendar: <Calendar className="w-4 h-4" />,
  billing: <DollarSign className="w-4 h-4" />,
  packages: <Package className="w-4 h-4" />,
  tickets: <Ticket className="w-4 h-4" />,
  messages: <MessageSquare className="w-4 h-4" />,
  emails: <Mail className="w-4 h-4" />,
  phone: <Phone className="w-4 h-4" />,
  analytics: <BarChart3 className="w-4 h-4" />,
  settings: <Settings className="w-4 h-4" />,
  ai: <Sparkles className="w-4 h-4" />,
  bot: <Bot className="w-4 h-4" />,
  notifications: <Bell className="w-4 h-4" />,
  content: <FileText className="w-4 h-4" />,
  website: <Globe className="w-4 h-4" />,
  commissions: <Percent className="w-4 h-4" />,
  training: <BookOpen className="w-4 h-4" />,
};

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const isClient = user?.role === "client";

  // Build commands based on user role
  const getCommands = useCallback((): CommandItem[] => {
    const commands: CommandItem[] = [];

    if (isClient) {
      // Client commands
      commands.push(
        { id: "dashboard", title: "Dashboard", icon: iconMap.dashboard, href: "/client-dashboard", category: "Navigation" },
        { id: "campaigns", title: "My Campaigns", icon: iconMap.campaigns, href: "/client-campaigns", category: "Navigation" },
        { id: "content", title: "My Content", icon: iconMap.content, href: "/client-content", category: "Navigation" },
        { id: "analytics", title: "Analytics", icon: iconMap.analytics, href: "/client-analytics", category: "Navigation" },
        { id: "billing", title: "Billing", icon: iconMap.billing, href: "/client-billing", category: "Navigation" },
        { id: "second-me", title: "AI Digital Twin", icon: iconMap.ai, href: "/second-me", category: "Navigation" },
        { id: "tickets", title: "Support Tickets", icon: iconMap.tickets, href: "/tickets", category: "Navigation" },
        { id: "settings", title: "Settings", icon: iconMap.settings, href: "/settings", category: "Navigation" }
      );
    } else {
      // Admin/Manager/Staff commands
      commands.push(
        { id: "dashboard", title: "Dashboard", icon: iconMap.dashboard, href: "/", category: "Navigation" },
        { id: "clients", title: "Clients", icon: iconMap.clients, href: "/clients", category: "Navigation", keywords: ["customers"] },
        { id: "campaigns", title: "Campaigns", icon: iconMap.campaigns, href: "/campaigns", category: "Navigation" },
        { id: "tasks", title: "Tasks", icon: iconMap.tasks, href: "/tasks", category: "Navigation", keywords: ["todos", "to-do"] },
        { id: "leads", title: "Leads", icon: iconMap.leads, href: "/leads", category: "Navigation", keywords: ["prospects"] },
        { id: "pipeline", title: "Pipeline", icon: iconMap.pipeline, href: "/pipeline", category: "Navigation" },
        { id: "content", title: "Content", icon: iconMap.content, href: "/content", category: "Navigation" },
        { id: "calendar", title: "Calendar", icon: iconMap.calendar, href: "/company-calendar", category: "Navigation" },
        { id: "invoices", title: "Invoices", icon: iconMap.billing, href: "/invoices", category: "Navigation" },
        { id: "messages", title: "Messages", icon: iconMap.messages, href: "/messages", category: "Navigation" },
        { id: "emails", title: "Emails", icon: iconMap.emails, href: "/emails", category: "Navigation" },
        { id: "phone", title: "Phone", icon: iconMap.phone, href: "/phone", category: "Navigation" },
        { id: "analytics", title: "Analytics", icon: iconMap.analytics, href: "/analytics", category: "Navigation" },
        { id: "team", title: "Team", icon: iconMap.clients, href: "/team", category: "Navigation" },
        { id: "marketing", title: "Marketing Center", icon: iconMap.campaigns, href: "/marketing-center", category: "Navigation" },
        { id: "tickets", title: "Tickets", icon: iconMap.tickets, href: "/tickets", category: "Navigation" },
        { id: "settings", title: "Settings", icon: iconMap.settings, href: "/settings", category: "Navigation" }
      );
    }

    return commands;
  }, [isClient]);

  const commands = getCommands();

  // Keyboard shortcut to open
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  // Handle command selection
  const handleSelect = (command: CommandItem) => {
    setOpen(false);
    if (command.href) {
      navigate(command.href);
    } else if (command.action) {
      command.action();
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="overflow-hidden p-0 shadow-lg max-w-lg">
        <Command className="[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-muted-foreground [&_[cmdk-group]:not([hidden])_~[cmdk-group]]:pt-0 [&_[cmdk-input-wrapper]_svg]:h-5 [&_[cmdk-input-wrapper]_svg]:w-5 [&_[cmdk-input]]:h-12 [&_[cmdk-item]]:px-2 [&_[cmdk-item]]:py-3 [&_[cmdk-item]_svg]:h-5 [&_[cmdk-item]_svg]:w-5">
          <div className="flex items-center border-b px-3">
            <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
            <Command.Input
              placeholder="Type a command or search..."
              className="flex h-11 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
            />
          </div>
          <Command.List className="max-h-[300px] overflow-y-auto overflow-x-hidden">
            <Command.Empty className="py-6 text-center text-sm">
              No results found.
            </Command.Empty>
            
            {/* Group by category */}
            {Array.from(new Set(commands.map(c => c.category))).map(category => (
              <Command.Group key={category} heading={category} className="p-2">
                {commands
                  .filter(c => c.category === category)
                  .map(command => (
                    <Command.Item
                      key={command.id}
                      value={`${command.title} ${command.keywords?.join(" ") || ""}`}
                      onSelect={() => handleSelect(command)}
                      className={cn(
                        "relative flex cursor-pointer select-none items-center rounded-md px-2 py-2 text-sm outline-none",
                        "aria-selected:bg-accent aria-selected:text-accent-foreground",
                        "data-[disabled]:pointer-events-none data-[disabled]:opacity-50"
                      )}
                    >
                      <span className="mr-2 flex h-4 w-4 items-center justify-center text-muted-foreground">
                        {command.icon}
                      </span>
                      <span>{command.title}</span>
                      {command.keywords && (
                        <span className="ml-auto text-xs text-muted-foreground">
                          ↵
                        </span>
                      )}
                    </Command.Item>
                  ))}
              </Command.Group>
            ))}
          </Command.List>
          
          {/* Footer with shortcut hint */}
          <div className="border-t px-3 py-2 text-xs text-muted-foreground flex items-center justify-between">
            <span>
              <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100">
                <span className="text-xs">⌘</span>K
              </kbd>
              {" "}to toggle
            </span>
            <span className="flex items-center gap-2">
              <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100">
                ↑↓
              </kbd>
              to navigate
              <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100">
                ↵
              </kbd>
              to select
            </span>
          </div>
        </Command>
      </DialogContent>
    </Dialog>
  );
}

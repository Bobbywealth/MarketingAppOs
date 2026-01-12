import { useState, useEffect, useCallback, useMemo } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import {
  Search,
  Building2,
  Megaphone,
  Users,
  FileText,
  DollarSign,
  Ticket,
  LayoutDashboard,
  ListTodo,
  MessageSquare,
  Mail,
  Phone,
  Calendar,
  Settings,
  BarChart3,
  LineChart,
  UsersRound,
  KeyRound,
  HelpCircle,
  ArrowLeft,
  Folder,
  ArrowRightLeft,
} from "lucide-react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { usePermissions } from "@/hooks/usePermissions";
import { HELP_DOCS } from "@/lib/helpDocs";
import { apiRequest, queryClient } from "@/lib/queryClient";

interface SearchResults {
  clients: Array<{ id: string; name: string; company?: string; email?: string }>;
  campaigns: Array<{ id: string; name: string; description?: string }>;
  leads: Array<{ id: string; name: string; email?: string; company?: string }>;
  contentPosts: Array<{ id: string; title: string; channel?: string }>;
  invoices: Array<{ id: string; invoiceNumber: string; amount: number }>;
  tickets: Array<{ id: string; subject: string; priority?: string }>;
}

type TaskMini = { id: string; title: string; spaceId?: string | null; status?: string | null; priority?: string | null };
type TaskSpaceMini = { id: string; name: string; icon?: string | null };

type Mode = "default" | "assignTaskSpace_task" | "assignTaskSpace_space";

export function GlobalSearch() {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [mode, setMode] = useState<Mode>("default");
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [, setLocation] = useLocation();
  const { role, isAdmin, canAccess } = usePermissions();
  const isInternal = ["admin", "manager", "staff", "creator_manager", "sales_agent"].includes(role);
  const canManageSpaces = role === "admin" || role === "manager" || role === "staff";

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const { data: results } = useQuery<SearchResults>({
    queryKey: ["/api/search", debouncedQuery],
    queryFn: async () => {
      const res = await fetch(`/api/search?q=${encodeURIComponent(debouncedQuery)}`, {
        credentials: "include",
      });
      if (!res.ok) {
        throw new Error("Search failed");
      }
      return res.json();
    },
    enabled: mode === "default" && debouncedQuery.length >= 2,
  });

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

  // App-wide keyboard shortcut hook can dispatch this event
  useEffect(() => {
    const openSearch = () => setOpen(true);
    window.addEventListener("mta:open-global-search", openSearch as EventListener);
    return () => window.removeEventListener("mta:open-global-search", openSearch as EventListener);
  }, []);

  // Reset modal state when closing
  useEffect(() => {
    if (!open) {
      setMode("default");
      setSelectedTaskId(null);
      setSearchQuery("");
      setDebouncedQuery("");
    }
  }, [open]);

  const handleSelect = useCallback((path: string) => {
    setOpen(false);
    setSearchQuery("");
    setLocation(path);
  }, [setLocation]);

  const navigateItems = useMemo(() => {
    // Keep this list high-signal: common destinations + role-gated items.
    const items: Array<{
      title: string;
      path: string;
      icon: any;
      keywords: string[];
      show: boolean;
    }> = [
      { title: "Dashboard", path: "/dashboard", icon: LayoutDashboard, keywords: ["home", "overview"], show: role !== "client" && role !== "creator" && role !== "sales_agent" },
      { title: "Clients", path: "/clients", icon: Building2, keywords: ["accounts", "customers"], show: role !== "client" && canAccess("canManageClients") },
      { title: "Leads", path: "/leads", icon: Users, keywords: ["pipeline", "prospects"], show: role !== "client" && canAccess("canManageLeads") },
      { title: "Tasks", path: "/tasks", icon: ListTodo, keywords: ["to-do", "todos"], show: role !== "client" },
      { title: "Messages", path: "/messages", icon: MessageSquare, keywords: ["chat", "dm"], show: role !== "client" },
      { title: "Emails", path: "/emails", icon: Mail, keywords: ["inbox"], show: role !== "client" },
      { title: "Phone", path: "/phone", icon: Phone, keywords: ["dialer", "calls"], show: role !== "client" },
      { title: "Company Calendar", path: "/company-calendar", icon: Calendar, keywords: ["meetings", "events"], show: role !== "client" },
      { title: "Content Calendar", path: "/content", icon: FileText, keywords: ["posts", "content"], show: role !== "client" && canAccess("canManageContent") },
      { title: "Tickets", path: "/tickets", icon: Ticket, keywords: ["support"], show: canAccess("canManageTickets") },
      { title: "Analytics", path: "/analytics", icon: BarChart3, keywords: ["reports"], show: role !== "client" && canAccess("canManageClients") },
      { title: "Social Stats", path: "/admin/social-stats", icon: LineChart, keywords: ["instagram", "tiktok", "facebook"], show: role !== "client" && canAccess("canManageClients") },
      { title: "User Management", path: "/team", icon: UsersRound, keywords: ["users", "roles", "permissions"], show: role !== "client" && isAdmin },
      { title: "Settings", path: "/settings", icon: Settings, keywords: ["profile", "preferences"], show: true },
      { title: "Password Vault", path: "/admin/vault", icon: KeyRound, keywords: ["secrets", "credentials", "passwords"], show: isAdmin },
      { title: "Help Center", path: "/help", icon: HelpCircle, keywords: ["docs", "sop", "how-to", "knowledge base"], show: isInternal },
    ];
    return items.filter((i) => i.show);
  }, [role, isAdmin, canAccess, isInternal]);

  const helpItems = useMemo(() => {
    if (!isInternal) return [];
    // Keep cmdk values keyword-rich; we still cap rendering to avoid huge lists.
    const q = searchQuery.trim().toLowerCase();
    const base = HELP_DOCS.map((d) => ({
      id: d.id,
      title: d.title,
      summary: d.summary,
      value: `${d.title} ${d.summary} ${d.id}`.toLowerCase(),
    }));
    if (!q) return base.slice(0, 10);
    const scored = base
      .map((d) => ({
        ...d,
        score:
          (d.title.toLowerCase().includes(q) ? 10 : 0) +
          (d.id.toLowerCase().includes(q) ? 5 : 0) +
          (d.summary.toLowerCase().includes(q) ? 2 : 0),
      }))
      .filter((d) => d.score > 0)
      .sort((a, b) => b.score - a.score || a.title.localeCompare(b.title));
    return scored.slice(0, 10);
  }, [searchQuery, isInternal]);

  const tasksQuery = useQuery<TaskMini[]>({
    queryKey: ["/api/tasks"],
    enabled: open && (mode === "assignTaskSpace_task" || mode === "assignTaskSpace_space"),
  });

  const spacesQuery = useQuery<TaskSpaceMini[]>({
    queryKey: ["/api/task-spaces"],
    enabled: open && (mode === "assignTaskSpace_task" || mode === "assignTaskSpace_space"),
  });

  const spacesById = useMemo(() => {
    const map = new Map<string, TaskSpaceMini>();
    for (const s of spacesQuery.data || []) map.set(s.id, s);
    return map;
  }, [spacesQuery.data]);

  const selectedTask = useMemo(() => {
    if (!selectedTaskId) return null;
    return (tasksQuery.data || []).find((t) => t.id === selectedTaskId) || null;
  }, [tasksQuery.data, selectedTaskId]);

  const filteredTasks = useMemo(() => {
    const all = tasksQuery.data || [];
    const q = searchQuery.trim().toLowerCase();
    if (!q) return all.slice(0, 25);
    return all
      .filter((t) => (t.title || "").toLowerCase().includes(q))
      .slice(0, 25);
  }, [tasksQuery.data, searchQuery]);

  const filteredSpaces = useMemo(() => {
    const all = spacesQuery.data || [];
    const q = searchQuery.trim().toLowerCase();
    const normalize = (s: TaskSpaceMini) => `${s.name} ${s.icon || ""}`.toLowerCase();
    if (!q) return all.slice(0, 25);
    return all.filter((s) => normalize(s).includes(q)).slice(0, 25);
  }, [spacesQuery.data, searchQuery]);

  const assignSpaceMutation = useMutation({
    mutationFn: async (payload: { taskId: string; spaceId: string | null }) => {
      const res = await apiRequest("PATCH", `/api/tasks/${payload.taskId}`, { spaceId: payload.spaceId });
      if (!res.ok) {
        let msg = "Failed to assign space";
        try {
          const data = await res.json();
          msg = data?.message || msg;
        } catch {}
        throw new Error(msg);
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
      setOpen(false);
    },
  });

  const inputPlaceholder =
    mode === "assignTaskSpace_task"
      ? "Select a task to move…"
      : mode === "assignTaskSpace_space"
        ? `Select a space for “${selectedTask?.title || "task"}”…`
        : "Ask MarketingOS… (pages, actions, SOPs, clients/leads)";

  return (
    <>
      <Button
        variant="outline"
        className="relative w-full max-w-[200px] h-10 px-3 justify-start md:w-40 lg:w-64 md:px-4 md:py-2 text-sm text-muted-foreground rounded-xl border-2 hover:bg-primary/10 hover:border-primary transition-all"
        onClick={() => setOpen(true)}
        aria-label="Open global search"
        data-testid="button-global-search"
      >
        <Search className="h-4 w-4 mr-2" />
        <span className="inline-flex">Help…</span>
        <kbd className="pointer-events-none absolute right-1.5 top-1.5 hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 sm:flex">
          <span className="text-xs">⌘</span>K
        </kbd>
      </Button>

      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput 
          placeholder={inputPlaceholder}
          value={searchQuery}
          onValueChange={setSearchQuery}
          data-testid="input-search-query"
        />
        <CommandList>
          <CommandEmpty>No results found.</CommandEmpty>

          {mode === "default" && (
            <>
              <CommandGroup heading="Navigate">
                {navigateItems.map((item) => (
                  <CommandItem
                    key={item.path}
                    value={`${item.title} ${item.keywords.join(" ")}`}
                    onSelect={() => handleSelect(item.path)}
                  >
                    <item.icon className="mr-2 h-4 w-4" />
                    <div className="flex flex-col">
                      <span>{item.title}</span>
                      <span className="text-xs text-muted-foreground">{item.path}</span>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>

              {canManageSpaces && (
                <>
                  <CommandSeparator />
                  <CommandGroup heading="Actions">
                    <CommandItem
                      value="assign task to space move task to space"
                      onSelect={() => {
                        setMode("assignTaskSpace_task");
                        setSelectedTaskId(null);
                        setSearchQuery("");
                      }}
                    >
                      <ArrowRightLeft className="mr-2 h-4 w-4" />
                      Assign task to Space…
                    </CommandItem>
                  </CommandGroup>
                </>
              )}

              <CommandSeparator />
            </>
          )}

          {results?.clients && results.clients.length > 0 && (
            <CommandGroup heading="Clients">
              {results.clients.map((client) => (
                <CommandItem
                  key={client.id}
                  value={`${client.name} ${client.company || ""} ${client.email || ""}`.trim()}
                  onSelect={() => handleSelect(`/clients/${client.id}`)}
                  data-testid={`search-result-client-${client.id}`}
                >
                  <Building2 className="mr-2 h-4 w-4" />
                  <div className="flex flex-col">
                    <span>{client.name}</span>
                    {client.company && (
                      <span className="text-xs text-muted-foreground">{client.company}</span>
                    )}
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          )}

          {results?.campaigns && results.campaigns.length > 0 && (
            <CommandGroup heading="Campaigns">
              {results.campaigns.map((campaign) => (
                <CommandItem
                  key={campaign.id}
                  value={`${campaign.name} ${campaign.description || ""}`.trim()}
                  onSelect={() => handleSelect(`/campaigns`)}
                  data-testid={`search-result-campaign-${campaign.id}`}
                >
                  <Megaphone className="mr-2 h-4 w-4" />
                  <div className="flex flex-col">
                    <span>{campaign.name}</span>
                    {campaign.description && (
                      <span className="text-xs text-muted-foreground line-clamp-1">{campaign.description}</span>
                    )}
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          )}

          {results?.leads && results.leads.length > 0 && (
            <CommandGroup heading="Leads">
              {results.leads.map((lead) => (
                <CommandItem
                  key={lead.id}
                  value={`${lead.name} ${lead.company || ""} ${lead.email || ""}`.trim()}
                  onSelect={() => handleSelect(`/leads?leadId=${encodeURIComponent(lead.id)}`)}
                  data-testid={`search-result-lead-${lead.id}`}
                >
                  <Users className="mr-2 h-4 w-4" />
                  <div className="flex flex-col">
                    <span>{lead.name}</span>
                    {lead.company && (
                      <span className="text-xs text-muted-foreground">{lead.company}</span>
                    )}
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          )}

          {results?.contentPosts && results.contentPosts.length > 0 && (
            <CommandGroup heading="Content">
              {results.contentPosts.map((post) => (
                <CommandItem
                  key={post.id}
                  value={`${post.title} ${post.channel || ""}`.trim()}
                  onSelect={() => handleSelect(`/content`)}
                  data-testid={`search-result-content-${post.id}`}
                >
                  <FileText className="mr-2 h-4 w-4" />
                  <div className="flex flex-col">
                    <span>{post.title}</span>
                    {post.channel && (
                      <span className="text-xs text-muted-foreground capitalize">{post.channel}</span>
                    )}
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          )}

          {results?.invoices && results.invoices.length > 0 && (
            <CommandGroup heading="Invoices">
              {results.invoices.map((invoice) => (
                <CommandItem
                  key={invoice.id}
                  value={`${invoice.invoiceNumber} ${invoice.amount}`}
                  onSelect={() => handleSelect(`/invoices`)}
                  data-testid={`search-result-invoice-${invoice.id}`}
                >
                  <DollarSign className="mr-2 h-4 w-4" />
                  <div className="flex flex-col">
                    <span>{invoice.invoiceNumber}</span>
                    <span className="text-xs text-muted-foreground">${invoice.amount.toLocaleString()}</span>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          )}

          {results?.tickets && results.tickets.length > 0 && (
            <CommandGroup heading="Tickets">
              {results.tickets.map((ticket) => (
                <CommandItem
                  key={ticket.id}
                  value={`${ticket.subject} ${ticket.priority || ""}`.trim()}
                  onSelect={() => handleSelect(`/tickets`)}
                  data-testid={`search-result-ticket-${ticket.id}`}
                >
                  <Ticket className="mr-2 h-4 w-4" />
                  <div className="flex flex-col">
                    <span>{ticket.subject}</span>
                    {ticket.priority && (
                      <span className="text-xs text-muted-foreground capitalize">{ticket.priority}</span>
                    )}
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          )}

          {mode === "default" && <CommandSeparator />}

          {isInternal && (
            <CommandGroup heading="Help articles">
              {helpItems.map((d) => (
                <CommandItem
                  key={d.id}
                  value={d.value}
                  onSelect={() => handleSelect(`/help?doc=${encodeURIComponent(d.id)}`)}
                >
                  <HelpCircle className="mr-2 h-4 w-4" />
                  <div className="flex flex-col">
                    <span>{d.title}</span>
                    <span className="text-xs text-muted-foreground">{d.summary || d.id}</span>
                  </div>
                </CommandItem>
              ))}
              {helpItems.length === 0 ? (
                <div className="px-3 py-2 text-sm text-muted-foreground">
                  Type a keyword (e.g. “lead import”, “deploy”, “roles”).
                </div>
              ) : null}
            </CommandGroup>
          )}

          {mode === "assignTaskSpace_task" && (
            <CommandGroup heading="Pick a task">
              <CommandItem
                value="back cancel"
                onSelect={() => {
                  setMode("default");
                  setSelectedTaskId(null);
                  setSearchQuery("");
                }}
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </CommandItem>

              {(tasksQuery.isLoading || spacesQuery.isLoading) && (
                <div className="px-3 py-2 text-sm text-muted-foreground">Loading tasks/spaces…</div>
              )}

              {filteredTasks.map((t) => {
                const space = t.spaceId ? spacesById.get(t.spaceId) : null;
                return (
                  <CommandItem
                    key={t.id}
                    value={`${t.title}`.trim()}
                    onSelect={() => {
                      setSelectedTaskId(t.id);
                      setMode("assignTaskSpace_space");
                      setSearchQuery("");
                    }}
                  >
                    <ListTodo className="mr-2 h-4 w-4" />
                    <div className="flex flex-col">
                      <span>{t.title}</span>
                      <span className="text-xs text-muted-foreground">
                        {space ? `Current: ${space.icon ? `${space.icon} ` : ""}${space.name}` : "Current: No space"}
                      </span>
                    </div>
                  </CommandItem>
                );
              })}
            </CommandGroup>
          )}

          {mode === "assignTaskSpace_space" && selectedTask && (
            <CommandGroup heading="Pick a space">
              <CommandItem
                value="back"
                onSelect={() => {
                  setMode("assignTaskSpace_task");
                  setSearchQuery("");
                }}
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to tasks
              </CommandItem>

              <CommandItem
                value="no space unassigned"
                onSelect={() => assignSpaceMutation.mutate({ taskId: selectedTask.id, spaceId: null })}
                disabled={assignSpaceMutation.isPending}
              >
                <Folder className="mr-2 h-4 w-4" />
                No space (All Tasks)
              </CommandItem>

              {filteredSpaces.map((s) => (
                <CommandItem
                  key={s.id}
                  value={`${s.name} ${s.icon || ""}`.trim()}
                  onSelect={() => assignSpaceMutation.mutate({ taskId: selectedTask.id, spaceId: s.id })}
                  disabled={assignSpaceMutation.isPending}
                >
                  <span className="mr-2 w-4 text-center">{s.icon || "📁"}</span>
                  <div className="flex flex-col">
                    <span>{s.name}</span>
                    <span className="text-xs text-muted-foreground">{s.id}</span>
                  </div>
                </CommandItem>
              ))}

              {assignSpaceMutation.isError && (
                <div className="px-3 py-2 text-sm text-destructive">
                  {(assignSpaceMutation.error as any)?.message || "Failed to assign space"}
                </div>
              )}
            </CommandGroup>
          )}
        </CommandList>
      </CommandDialog>
    </>
  );
}

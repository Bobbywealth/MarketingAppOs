import { useState, useEffect, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { 
  Search, Plus, LayoutGrid, List, CalendarDays, ChevronRight, ChevronLeft, X, 
  Clock3, Flag, CheckCircle2, Loader2
} from "lucide-react";
import type { Task, Client, User as UserType } from "@shared/schema";
import { toInputDateEST } from "@/lib/dateUtils";
import { VibePageShell } from "@/components/layout/VibePageShell";
import { VibeHeroHeader } from "@/components/layout/VibeHeroHeader";
import { VibeSectionCard } from "@/components/ui/VibeSectionCard";
import { VibeStatCard } from "@/components/ui/VibeStatCard";
import { VibeFilterChips } from "@/components/ui/VibeFilterChips";
import { VibeViewToggle } from "@/components/ui/VibeViewToggle";

// Status mapping between our schema and the UI
const statusMap: Record<string, string> = {
  "todo": "Inbox",
  "in_progress": "In Progress",
  "review": "Review",
  "completed": "Done"
};

const reverseStatusMap: Record<string, string> = {
  "Inbox": "todo",
  "In Progress": "in_progress",
  "Review": "review",
  "Done": "completed"
};

const priorityMap: Record<string, string> = {
  "low": "Low",
  "normal": "Medium",
  "high": "High",
  "urgent": "High"
};

const reversePriorityMap: Record<string, string> = {
  "Low": "low",
  "Medium": "normal",
  "High": "high"
};

const statuses = ["Inbox", "In Progress", "Review", "Done"];
const viewOptions = [
  { label: "Board", icon: LayoutGrid },
  { label: "List", icon: List },
  { label: "Calendar", icon: CalendarDays },
];
const views = viewOptions.map((option) => option.label);
const filters = ["All Tasks", "My Tasks", "Today", "Overdue", "High Priority", "Waiting"];

const priorityStyles: Record<string, string> = {
  High: "bg-red-50 text-red-700 border-red-200",
  Medium: "bg-amber-50 text-amber-700 border-amber-200",
  Low: "bg-slate-100 text-slate-700 border-slate-200",
};

const statusAccent: Record<string, string> = {
  Inbox: "from-slate-900 to-slate-700",
  "In Progress": "from-blue-700 to-cyan-600",
  Review: "from-amber-600 to-orange-500",
  Done: "from-emerald-600 to-green-500",
};

// Helper to format due date for display
function formatDueDate(dueDate: string | null | undefined): string {
  if (!dueDate) return "No due date";
  
  const date = new Date(dueDate);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const taskDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  
  if (taskDate.getTime() === today.getTime()) {
    const hours = date.getHours();
    const minutes = date.getMinutes();
    if (hours === 23 && minutes === 59) {
      return "Today";
    }
    return `Today · ${hours === 0 ? 12 : hours > 12 ? hours - 12 : hours}:${minutes.toString().padStart(2, '0')} ${hours >= 12 ? 'PM' : 'AM'}`;
  }
  if (taskDate.getTime() === tomorrow.getTime()) {
    return "Tomorrow";
  }
  
  const diffDays = Math.ceil((taskDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays > 0 && diffDays <= 7) {
    return date.toLocaleDateString('en-US', { weekday: 'short' });
  }
  
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

// Helper to get user initials
function getInitials(userId: number | null, users: UserType[]): string {
  if (!userId) return "?";
  const user = users.find(u => u.id === userId);
  if (!user) return "?";
  const names = user.fullName?.split(" ") || user.username?.split(" ") || [];
  return names.map(n => n[0]).join("").toUpperCase().slice(0, 2);
}

// Helper to get company name from client
function getCompanyName(clientId: string | null, clients: Client[]): string {
  if (!clientId) return "No company";
  const client = clients.find(c => c.id === clientId);
  return client?.name || "Unknown";
}

export default function TasksPage() {
  const { toast } = useToast();
  const { user } = useAuth();
  // UI State
  const [tasks, setTasks] = useState<Task[]>([]);
  const [activeView, setActiveView] = useState("Board");
  const [activeFilter, setActiveFilter] = useState("All Tasks");
  const [search, setSearch] = useState("");
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [showNewTask, setShowNewTask] = useState(false);
  
  // New task form state
  const [newTask, setNewTask] = useState({
    title: "",
    description: "",
    status: "todo",
    priority: "normal",
    assignedToId: "" as string,
    clientId: "" as string,
    dueDate: "" as string,
    tags: "",
  });

  // Filter state for API
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterPriority, setFilterPriority] = useState<string>("all");

  // Fetch tasks
  const { data: tasksData = [], isLoading, refetch } = useQuery<Task[]>({
    queryKey: ["/api/tasks"],
    refetchInterval: 15000,
  });

  // Fetch users and clients
  const { data: users = [] } = useQuery<UserType[]>({
    queryKey: ["/api/users"],
    retry: false,
  });

  const { data: clients = [] } = useQuery<Client[]>({
    queryKey: ["/api/clients"],
    retry: false,
  });

  // Update local tasks when data changes
  useEffect(() => {
    setTasks(tasksData);
  }, [tasksData]);

  // Find selected task
  const selectedTask = tasks.find((task) => task.id === selectedTaskId) || null;
  const showTaskDetail = Boolean(selectedTask);

  // Map task status to UI status
  const mapStatusToUI = (status: string): string => {
    return statusMap[status] || "Inbox";
  };

  // Map priority to UI priority
  const mapPriorityToUI = (priority: string): string => {
    return priorityMap[priority] || "Medium";
  };

  // Filter tasks
  const filteredTasks = useMemo(() => {
    const q = search.trim().toLowerCase();
    return tasks.filter((task) => {
      // Search filter
      const matchesSearch =
        !q ||
        task.title.toLowerCase().includes(q) ||
        (task.description?.toLowerCase().includes(q) || false) ||
        getCompanyName(task.clientId, clients).toLowerCase().includes(q) ||
        (task.tags?.join(" ").toLowerCase().includes(q) || false) ||
        getInitials(task.assignedToId, users).toLowerCase().includes(q);

      // Status filter
      const uiStatus = mapStatusToUI(task.status);
      let matchesStatus = true;
      if (filterStatus !== "all") {
        matchesStatus = task.status === filterStatus;
      }

      // Priority filter
      let matchesPriority = true;
      if (filterPriority !== "all") {
        matchesPriority = task.priority === filterPriority;
      }

      // Quick filter
      let matchesFilter = true;
      if (activeFilter === "My Tasks" && user) {
        matchesFilter = task.assignedToId === (user as any).id;
      } else if (activeFilter === "Today") {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        if (task.dueDate) {
          const due = new Date(task.dueDate);
          matchesFilter = due >= today && due < tomorrow;
        } else {
          matchesFilter = false;
        }
      } else if (activeFilter === "Overdue") {
        const now = new Date();
        if (task.dueDate) {
          matchesFilter = new Date(task.dueDate) < now && task.status !== "completed";
        } else {
          matchesFilter = false;
        }
      } else if (activeFilter === "High Priority") {
        matchesFilter = task.priority === "high" || task.priority === "urgent";
      } else if (activeFilter === "Waiting") {
        matchesFilter = task.status === "review";
      }

      return matchesSearch && matchesStatus && matchesPriority && matchesFilter;
    });
  }, [tasks, search, activeFilter, filterStatus, filterPriority, clients, users, user]);

  // Group tasks by status
  const groupedTasks = useMemo(() => {
    return statuses.reduce((acc, status) => {
      acc[status] = filteredTasks.filter((task) => mapStatusToUI(task.status) === status);
      return acc;
    }, {} as Record<string, Task[]>);
  }, [filteredTasks]);

  // Summary stats
  const summary = useMemo(() => {
    const open = tasks.filter((t) => t.status !== "completed").length;
    const inProgress = tasks.filter((t) => t.status === "in_progress").length;
    const waiting = tasks.filter((t) => t.status === "review").length;
    const completed = tasks.filter((t) => t.status === "completed").length;
    const high = tasks.filter((t) => (t.priority === "high" || t.priority === "urgent") && t.status !== "completed").length;
    return [
      { label: "Open", value: open, note: "Active tasks across all teams" },
      { label: "In Progress", value: inProgress, note: "Currently being worked" },
      { label: "Waiting", value: waiting, note: "Pending review or reply" },
      { label: "Completed", value: completed, note: "Closed tasks" },
      { label: "High Priority", value: high, note: "Needs attention first" },
    ];
  }, [tasks]);

  // Move task to next/previous status
  const moveTask = async (taskId: string, direction: number) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    const currentIndex = statuses.indexOf(mapStatusToUI(task.status));
    const nextIndex = Math.max(0, Math.min(statuses.length - 1, currentIndex + direction));
    const newStatus = reverseStatusMap[statuses[nextIndex]];

    try {
      await apiRequest("PATCH", `/api/tasks/${taskId}`, { status: newStatus });
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
    } catch (error) {
      toast({ title: "Failed to update task", variant: "destructive" });
    }
  };

  // Cycle priority
  const cyclePriority = async (taskId: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    const order = ["low", "normal", "high"];
    const currentIndex = order.indexOf(task.priority);
    const nextPriority = order[(currentIndex + 1) % order.length];

    try {
      await apiRequest("PATCH", `/api/tasks/${taskId}`, { priority: nextPriority });
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
    } catch (error) {
      toast({ title: "Failed to update priority", variant: "destructive" });
    }
  };

  // Update task field
  const updateSelectedTask = async (patch: Partial<Task>) => {
    if (!selectedTask) return;
    try {
      await apiRequest("PATCH", `/api/tasks/${selectedTask.id}`, patch);
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
    } catch (error) {
      toast({ title: "Failed to update task", variant: "destructive" });
    }
  };

  // Add new task
  const addTask = async () => {
    if (!newTask.title.trim()) return;
    
    const taskData: any = {
      title: newTask.title,
      description: newTask.description,
      status: newTask.status,
      priority: newTask.priority,
    };

    if (newTask.assignedToId) {
      taskData.assignedToId = parseInt(newTask.assignedToId);
    }
    if (newTask.clientId) {
      taskData.clientId = newTask.clientId;
    }
    if (newTask.dueDate) {
      taskData.dueDate = new Date(newTask.dueDate + "T23:59").toISOString();
    }
    if (newTask.tags) {
      taskData.tags = newTask.tags.split(",").map((tag) => tag.trim()).filter(Boolean);
    }

    try {
      await apiRequest("POST", "/api/tasks", taskData);
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
      toast({ title: "Task created successfully" });
      setShowNewTask(false);
      setNewTask({
        title: "",
        description: "",
        status: "todo",
        priority: "normal",
        assignedToId: "",
        clientId: "",
        dueDate: "",
        tags: "",
      });
    } catch (error) {
      toast({ title: "Failed to create task", variant: "destructive" });
    }
  };

  // Delete task
  const deleteTask = async (taskId: string) => {
    try {
      await apiRequest("DELETE", `/api/tasks/${taskId}`);
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
      toast({ title: "Task deleted" });
      setSelectedTaskId(null);
    } catch (error) {
      toast({ title: "Failed to delete task", variant: "destructive" });
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-page-radial text-slate-900">
      <div className="mx-auto max-w-[1680px] p-4 md:p-6 xl:p-8">
        <div className="space-y-6">
          {/* Header Section */}
          <section className="overflow-hidden rounded-surface-xl border border-slate-200/80 bg-white/90 shadow-shell-elevated backdrop-blur">
            <div className="border-b border-slate-100 bg-hero-command px-5 py-6 text-white md:px-6">
              <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
                <div>
                  <div className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-300">Task Management</div>
                  <h1 className="mt-2 text-3xl font-bold tracking-tight md:text-4xl">Modern Interactive Task Command Center</h1>
                  <p className="mt-2 max-w-3xl text-sm text-slate-300 md:text-base">
                    Search, filter, move tasks, edit task details, and add new tasks on one page.
                  </p>
                </div>

                <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap xl:justify-end">
                  <div className="flex min-w-[280px] items-center rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-sm text-slate-200 backdrop-blur">
                    <Search className="mr-2 h-4 w-4" />
                    <input
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder="Search tasks, people, tags, company..."
                      className="w-full bg-transparent outline-none placeholder:text-slate-400"
                    />
                  </div>
                  <button
                    onClick={() => setShowNewTask(true)}
                    className="flex items-center justify-center gap-2 rounded-2xl bg-white px-4 py-3 text-sm font-semibold text-slate-900 shadow-sm transition hover:scale-[1.01]"
                  >
                    <Plus className="h-4 w-4" /> New Task
                  </button>
                </div>
              </div>
            </div>

            <div className="px-5 py-5 md:px-6">
              <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                <div className="flex flex-wrap gap-2">
                  {filters.map((filter) => (
                    <button
                      key={filter}
                      onClick={() => setActiveFilter(filter)}
                      className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                        activeFilter === filter
                          ? "chip-selected"
                          : "chip-unselected"
                      }`}
                    >
                      {filter}
                    </button>
                  ))}
                </div>

                <div className="flex flex-wrap gap-2">
                  {views.map((view) => {
                    const Icon = view === "Board" ? LayoutGrid : view === "List" ? List : CalendarDays;
                    return (
                      <button
                        key={view}
                        onClick={() => setActiveView(view)}
                        className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition ${
                          activeView === view
                            ? "chip-selected-brand"
                            : "chip-unselected"
                        }`}
                      >
                        <Icon className="h-4 w-4" />
                        {view}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </section>

          {/* Summary Cards */}
          <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
            {summary.map((card) => (
              <div key={card.label} className="rounded-surface-lg border border-slate-200 bg-white p-5 shadow-card-elevated">
                <div className="text-sm text-slate-500">{card.label}</div>
                <div className="mt-2 text-3xl font-bold tracking-tight">{card.value}</div>
                <div className="mt-2 text-sm text-slate-500">{card.note}</div>
              </div>
            ))}
          </section>

          {/* Task Workspace */}
          <section>
            <div className="rounded-surface-xl border border-slate-200 bg-white p-4 shadow-card-elevated md:p-5">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold">Task Workspace</h2>
                  <p className="text-sm text-slate-500">Clean layout, better hierarchy, and direct control without jumping around pages.</p>
                </div>
                <div className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
                  {filteredTasks.length} shown
                </div>
              </div>

              {activeView === "Board" && (
                <div className="grid gap-4 xl:grid-cols-4">
                  {statuses.map((status) => (
                    <div key={status} className="overflow-hidden rounded-surface-lg border border-slate-200 bg-slate-50">
                      <div className={`bg-gradient-to-r ${statusAccent[status]} px-4 py-4 text-white`}>
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-semibold">{status}</div>
                            <div className="text-xs text-white/80">{groupedTasks[status]?.length || 0} tasks</div>
                          </div>
                          <div className="rounded-full bg-white/15 px-2.5 py-1 text-xs">Live</div>
                        </div>
                      </div>

                      <div className="max-h-[680px] space-y-3 overflow-auto p-3">
                        {(groupedTasks[status] || []).map((task) => (
                          <button
                            key={task.id}
                            onClick={() => setSelectedTaskId(task.id)}
                            className={`w-full rounded-3xl border bg-white p-4 text-left shadow-card-elevated transition hover:-translate-y-0.5 hover:shadow-md ${
                              selectedTaskId === task.id ? "border-indigo-500 ring-2 ring-indigo-100" : "border-slate-200"
                            }`}
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0">
                                <div className="truncate text-sm font-semibold leading-5 text-slate-900">{task.title}</div>
                                <div className="mt-1 flex items-center gap-2 text-xs text-slate-500">
                                  <span>{getCompanyName(task.clientId, clients)}</span>
                                  <span>•</span>
                                  <span>{getInitials(task.assignedToId, users)}</span>
                                </div>
                              </div>
                              <span className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold ${priorityStyles[mapPriorityToUI(task.priority)]}`}>
                                {mapPriorityToUI(task.priority)}
                              </span>
                            </div>

                            <p className="mt-3 line-clamp-2 text-sm leading-5 text-slate-600">{task.description || "No description"}</p>

                            <div className="mt-3 flex flex-wrap gap-2">
                              {(task.tags || []).slice(0, 2).map((tag) => (
                                <span key={tag} className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-medium text-slate-600">
                                  {tag}
                                </span>
                              ))}
                            </div>

                            <div className="mt-4 flex items-center justify-between gap-3">
                              <div className="flex items-center gap-2 text-xs text-slate-500">
                                <Clock3 className="h-3.5 w-3.5" />
                                {formatDueDate(task.dueDate)}
                              </div>
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    moveTask(task.id, -1);
                                  }}
                                  className="rounded-full border border-slate-200 p-1.5 text-slate-500 hover:bg-slate-100"
                                >
                                  <ChevronLeft className="h-4 w-4" />
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    moveTask(task.id, 1);
                                  }}
                                  className="rounded-full border border-slate-200 p-1.5 text-slate-500 hover:bg-slate-100"
                                >
                                  <ChevronRight className="h-4 w-4" />
                                </button>
                              </div>
                            </div>
                          </button>
                        ))}

                        {(groupedTasks[status] || []).length === 0 && (
                          <div className="rounded-2xl border border-dashed border-slate-200 bg-white px-4 py-8 text-center text-sm text-slate-400">
                            No tasks here
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {activeView === "List" && (
                <div className="overflow-hidden rounded-surface-lg border border-slate-200">
                  <div className="grid grid-cols-[1.7fr_0.9fr_0.7fr_0.7fr_0.7fr] gap-3 bg-slate-50 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    <div>Task</div>
                    <div>Company</div>
                    <div>Status</div>
                    <div>Priority</div>
                    <div>Assignee</div>
                  </div>
                  <div className="divide-y divide-slate-100">
                    {filteredTasks.map((task) => (
                      <button
                        key={task.id}
                        onClick={() => setSelectedTaskId(task.id)}
                        className="grid w-full grid-cols-[1.7fr_0.9fr_0.7fr_0.7fr_0.7fr] gap-3 px-4 py-4 text-left transition hover:bg-slate-50"
                      >
                        <div>
                          <div className="font-semibold text-slate-900">{task.title}</div>
                          <div className="mt-1 text-sm text-slate-500">{formatDueDate(task.dueDate)}</div>
                        </div>
                        <div className="text-sm text-slate-600">{getCompanyName(task.clientId, clients)}</div>
                        <div className="text-sm text-slate-600">{mapStatusToUI(task.status)}</div>
                        <div>
                          <span className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold ${priorityStyles[mapPriorityToUI(task.priority)]}`}>
                            {mapPriorityToUI(task.priority)}
                          </span>
                        </div>
                        <div className="text-sm text-slate-600">{getInitials(task.assignedToId, users)}</div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {activeView === "Calendar" && (
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {["Today", "Tomorrow", "This Week"].map((bucket) => (
                    <div key={bucket} className="rounded-surface-lg border border-slate-200 bg-slate-50 p-4">
                      <div className="mb-3 flex items-center justify-between">
                        <h3 className="font-semibold text-slate-900">{bucket}</h3>
                        <div className="text-xs text-slate-500">Schedule view</div>
                      </div>
                      <div className="space-y-3">
                        {filteredTasks
                          .filter((task) => {
                            if (!task.dueDate) return false;
                            const due = new Date(task.dueDate);
                            const today = new Date();
                            today.setHours(0, 0, 0, 0);
                            const tomorrow = new Date(today);
                            tomorrow.setDate(tomorrow.getDate() + 1);
                            const nextWeek = new Date(today);
                            nextWeek.setDate(nextWeek.getDate() + 7);

                            if (bucket === "Today") {
                              return due >= today && due < tomorrow;
                            } else if (bucket === "Tomorrow") {
                              return due >= tomorrow && due < new Date(tomorrow.getTime() + 24 * 60 * 60 * 1000);
                            } else {
                              return due >= today && due < nextWeek;
                            }
                          })
                          .map((task) => (
                            <button
                              key={task.id}
                              onClick={() => setSelectedTaskId(task.id)}
                              className="w-full rounded-2xl border border-slate-200 bg-white p-4 text-left shadow-card-elevated hover:border-indigo-300"
                            >
                              <div className="font-semibold text-slate-900">{task.title}</div>
                              <div className="mt-1 text-sm text-slate-500">{formatDueDate(task.dueDate)}</div>
                              <div className="mt-3 flex items-center justify-between">
                                <span className="text-xs text-slate-500">{getCompanyName(task.clientId, clients)}</span>
                                <span className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold ${priorityStyles[mapPriorityToUI(task.priority)]}`}>
                                  {mapPriorityToUI(task.priority)}
                                </span>
                              </div>
                            </button>
                          ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
        </section>
      </div>

      {/* Task Detail Sidebar */}
      {showTaskDetail && selectedTask && (
        <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/40 backdrop-blur-sm">
          <div className="h-full w-full max-w-2xl overflow-y-auto border-l border-slate-200 bg-white shadow-2xl">
            <div className="sticky top-0 z-10 border-b border-slate-100 bg-white/95 px-6 py-5 backdrop-blur">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <div className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Task Detail</div>
                  <h2 className="mt-1 text-2xl font-semibold">{selectedTask.title}</h2>
                  <p className="mt-1 text-sm text-slate-500">Live editor opens only after clicking a task.</p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => deleteTask(selectedTask.id)}
                    className="rounded-full border border-red-200 p-2 text-red-500 hover:bg-red-50"
                    title="Delete task"
                  >
                    <X className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setSelectedTaskId(null)}
                    className="rounded-full border border-slate-200 p-2 text-slate-500 hover:bg-slate-100"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>

            <div className="space-y-5 p-6">
              <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500">Task title</label>
                <input
                  value={selectedTask.title}
                  onChange={(e) => updateSelectedTask({ title: e.target.value })}
                  className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-indigo-400"
                />
              </div>

              <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500">Description</label>
                <textarea
                  value={selectedTask.description || ""}
                  onChange={(e) => updateSelectedTask({ description: e.target.value })}
                  rows={5}
                  className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-indigo-400"
                />
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500">Status</label>
                  <select
                    value={selectedTask.status}
                    onChange={(e) => updateSelectedTask({ status: e.target.value })}
                    className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-indigo-400"
                  >
                    <option value="todo">Inbox</option>
                    <option value="in_progress">In Progress</option>
                    <option value="review">Review</option>
                    <option value="completed">Done</option>
                  </select>
                </div>
                <div>
                  <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500">Priority</label>
                  <button
                    onClick={() => cyclePriority(selectedTask.id)}
                    className={`flex w-full items-center justify-center gap-2 rounded-2xl border px-4 py-3 text-sm font-semibold ${priorityStyles[mapPriorityToUI(selectedTask.priority)]}`}
                  >
                    <Flag className="h-4 w-4" />
                    {mapPriorityToUI(selectedTask.priority)} — click to cycle
                  </button>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500">Assignee</label>
                  <select
                    value={selectedTask.assignedToId?.toString() || ""}
                    onChange={(e) => updateSelectedTask({ assignedToId: e.target.value ? parseInt(e.target.value) : null })}
                    className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-indigo-400"
                  >
                    <option value="">Unassigned</option>
                    {users.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.fullName || u.username}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500">Company</label>
                  <select
                    value={selectedTask.clientId || ""}
                    onChange={(e) => updateSelectedTask({ clientId: e.target.value || null })}
                    className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-indigo-400"
                  >
                    <option value="">No company</option>
                    {clients.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500">Due Date</label>
                <input
                  type="date"
                  value={selectedTask.dueDate ? toInputDateEST(selectedTask.dueDate) : ""}
                  onChange={(e) => updateSelectedTask({ dueDate: e.target.value ? new Date(e.target.value + "T23:59").toISOString() : null })}
                  className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-indigo-400"
                />
              </div>

              <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500">Tags (comma separated)</label>
                <input
                  value={(selectedTask.tags || []).join(", ")}
                  onChange={(e) => updateSelectedTask({ tags: e.target.value.split(",").map(t => t.trim()).filter(Boolean) })}
                  className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-indigo-400"
                  placeholder="Marketing, Content, Urgent"
                />
              </div>

              <div className="rounded-3xl bg-slate-50 p-4">
                <div className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Quick actions</div>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => moveTask(selectedTask.id, -1)}
                    className="flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-100"
                  >
                    <ChevronLeft className="h-4 w-4" /> Move Back
                  </button>
                  <button
                    onClick={() => moveTask(selectedTask.id, 1)}
                    className="flex items-center justify-center gap-2 rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white hover:bg-slate-800"
                  >
                    Move Forward <ChevronRight className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => updateSelectedTask({ status: "completed" })}
                    className="col-span-2 flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white hover:bg-emerald-700"
                  >
                    <CheckCircle2 className="h-4 w-4" /> Mark Complete
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* New Task Modal */}
      {showNewTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4 backdrop-blur-sm">
          <div className="w-full max-w-2xl rounded-surface-xl border border-slate-200 bg-white p-6 shadow-shell-elevated">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-semibold">Create New Task</h2>
                <p className="mt-1 text-sm text-slate-500">Simple modal so your developer sees how task creation can feel in the redesigned page.</p>
              </div>
              <button onClick={() => setShowNewTask(false)} className="rounded-full border border-slate-200 p-2 text-slate-500 hover:bg-slate-100">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <div className="md:col-span-2">
                <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500">Task title</label>
                <input
                  value={newTask.title}
                  onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                  className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-indigo-400"
                  placeholder="Enter task title"
                />
              </div>

              <div className="md:col-span-2">
                <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500">Description</label>
                <textarea
                  rows={4}
                  value={newTask.description}
                  onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                  className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-indigo-400"
                  placeholder="Add description"
                />
              </div>

              <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500">Status</label>
                <select
                  value={newTask.status}
                  onChange={(e) => setNewTask({ ...newTask, status: e.target.value })}
                  className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-indigo-400"
                >
                  <option value="todo">Inbox</option>
                  <option value="in_progress">In Progress</option>
                  <option value="review">Review</option>
                  <option value="completed">Done</option>
                </select>
              </div>

              <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500">Priority</label>
                <select
                  value={newTask.priority}
                  onChange={(e) => setNewTask({ ...newTask, priority: e.target.value })}
                  className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-indigo-400"
                >
                  <option value="low">Low</option>
                  <option value="normal">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>

              <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500">Assignee</label>
                <select
                  value={newTask.assignedToId}
                  onChange={(e) => setNewTask({ ...newTask, assignedToId: e.target.value })}
                  className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-indigo-400"
                >
                  <option value="">Unassigned</option>
                  {users.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.fullName || u.username}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500">Company</label>
                <select
                  value={newTask.clientId}
                  onChange={(e) => setNewTask({ ...newTask, clientId: e.target.value })}
                  className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-indigo-400"
                >
                  <option value="">No company</option>
                  {clients.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500">Due Date</label>
                <input
                  type="date"
                  value={newTask.dueDate}
                  onChange={(e) => setNewTask({ ...newTask, dueDate: e.target.value })}
                  className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-indigo-400"
                />
              </div>

              <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500">Tags</label>
                <input
                  value={newTask.tags}
                  onChange={(e) => setNewTask({ ...newTask, tags: e.target.value })}
                  className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-indigo-400"
                  placeholder="Marketing, Content"
                />
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setShowNewTask(false)}
                className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={addTask}
                className="rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white hover:bg-slate-800"
              >
                Create Task
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
    </div>
  );
}

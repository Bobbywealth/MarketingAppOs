import { useState, useEffect, useMemo, useCallback } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import {
  Plus,
  Calendar,
  User,
  ListTodo,
  KanbanSquare,
  Filter,
  Loader2,
  Edit,
  Trash2,
  MessageSquare,
  X,
  Repeat,
  Eye,
  EyeOff,
  CheckCircle2,
  MoreHorizontal,
  LayoutGrid,
  List,
  AlignLeft,
  Search,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Clock,
  AlertTriangle,
  CircleDot,
  Circle,
  GripVertical,
} from "lucide-react";
import type { Task, InsertTask, Client, User as UserType, TaskSpace } from "@shared/schema";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { TaskSpacesSidebar } from "@/components/TaskSpacesSidebar";
import { TaskDetailSidebar } from "@/components/TaskDetailSidebar";
import { parseInputDateEST, toLocaleDateStringEST, toInputDateEST, nowEST, toEST } from "@/lib/dateUtils";

const taskFormSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  status: z.enum(["todo", "in_progress", "review", "completed"]),
  priority: z.enum(["low", "normal", "high", "urgent"]),
  dueDate: z.string().optional(),
  dueTime: z.string().optional(),
  campaignId: z.string().optional(),
  clientId: z.string().optional(),
  assignedToId: z.string().optional(),
  spaceId: z.string().optional(),
  isRecurring: z.boolean().optional(),
  recurringPattern: z.enum(["daily", "weekly", "monthly", "yearly"]).optional(),
  recurringInterval: z.number().optional(),
  recurringEndDate: z.string().optional(),
  scheduleFrom: z.enum(["due_date", "completion_date"]).optional(),
});

type TaskFormData = z.infer<typeof taskFormSchema>;
type SortField = "title" | "dueDate" | "priority" | "status" | "createdAt";
type SortOrder = "asc" | "desc";

const PRIORITY_ORDER: Record<string, number> = { urgent: 4, high: 3, normal: 2, low: 1 };
const STATUS_ORDER: Record<string, number> = { todo: 1, in_progress: 2, review: 3, completed: 4 };

function isOverdue(dueDate: string | Date | null | undefined, status: string): boolean {
  if (!dueDate || status === "completed") return false;
  const now = nowEST();
  const due = toEST(dueDate);
  return due < now;
}

function isDueSoon(dueDate: string | Date | null | undefined, status: string): boolean {
  if (!dueDate || status === "completed") return false;
  const now = nowEST();
  const due = toEST(dueDate);
  const oneDayFromNow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  return due >= now && due <= oneDayFromNow;
}

function getDueDateClass(dueDate: string | Date | null | undefined, status: string): string {
  if (isOverdue(dueDate, status)) return "text-red-600 dark:text-red-400 font-semibold";
  if (isDueSoon(dueDate, status)) return "text-amber-600 dark:text-amber-400 font-medium";
  return "text-muted-foreground";
}

function getDueDateBg(dueDate: string | Date | null | undefined, status: string): string {
  if (isOverdue(dueDate, status)) return "bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-900";
  if (isDueSoon(dueDate, status)) return "bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-900";
  return "";
}

export default function TasksPage() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [viewMode, setViewMode] = useState<"list" | "kanban" | "compact">("kanban");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterPriority, setFilterPriority] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<SortField>("createdAt");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");
  const [isFilterPanelOpen, setIsFilterPanelOpen] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [draggedTask, setDraggedTask] = useState<Task | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [selectedSpaceId, setSelectedSpaceId] = useState<string | null>(null);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isDetailSidebarOpen, setIsDetailSidebarOpen] = useState(false);
  const [selectedTaskIds, setSelectedTaskIds] = useState<Set<string>>(new Set());
  const [spacesDialogOpen, setSpacesDialogOpen] = useState(false);
  const [showCompleted, setShowCompleted] = useState(() => {
    const saved = localStorage.getItem('tasks-show-completed');
    try {
      return saved !== null ? JSON.parse(saved) : false;
    } catch {
      return false;
    }
  });

  useEffect(() => {
    localStorage.setItem('tasks-show-completed', JSON.stringify(showCompleted));
  }, [showCompleted]);

  // Close detail sidebar on Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isDetailSidebarOpen) {
        setIsDetailSidebarOpen(false);
        setSelectedTask(null);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isDetailSidebarOpen]);

  const { data: tasks = [], isLoading, error: tasksError } = useQuery<Task[]>({
    queryKey: ["/api/tasks"],
  });

  const isAdminOrManager = (user as any)?.role === "admin" || (user as any)?.role === "manager";
  const backfillRecurringMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/tasks/backfill-recurring", {});
      return await res.json();
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
      toast({
        title: "Recurring tasks backfilled",
        description: `Created ${data.tasksCreated ?? 0} task(s) across ${data.seriesProcessed ?? 0} series.`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Backfill failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  useEffect(() => {
    if (!tasksError) return;
    toast({
      title: "Failed to load tasks",
      description: tasksError.message,
      variant: "destructive",
    });
  }, [tasksError, toast]);

  const { data: clients = [] } = useQuery<Client[]>({
    queryKey: ["/api/clients"],
    retry: false,
    meta: { returnNull: true },
  });

  const { data: users = [] } = useQuery<UserType[]>({
    queryKey: ["/api/users"],
    retry: false,
  });

  const { data: spaces = [] } = useQuery<TaskSpace[]>({
    queryKey: ["/api/task-spaces"],
    retry: false,
    meta: { returnNull: true },
  });

  const buildSpaceOptions = () => {
    const byParent = new Map<string | null, TaskSpace[]>();
    for (const s of spaces) {
      const pid = (s.parentSpaceId ?? null) as string | null;
      const list = byParent.get(pid) || [];
      list.push(s);
      byParent.set(pid, list);
    }
    for (const [pid, list] of byParent) {
      list.sort((a, b) => (a.order ?? 0) - (b.order ?? 0) || a.name.localeCompare(b.name));
      byParent.set(pid, list);
    }

    const out: Array<{ id: string; label: string }> = [];
    const walk = (parentId: string | null, depth: number) => {
      const children = byParent.get(parentId) || [];
      for (const s of children) {
        const indent = depth > 0 ? `${"— ".repeat(Math.min(depth, 6))}` : "";
        out.push({ id: s.id, label: `${indent}${s.icon ?? "📁"} ${s.name}` });
        walk(s.id, depth + 1);
      }
    };
    walk(null, 0);
    return out;
  };

  const form = useForm<TaskFormData>({
    resolver: zodResolver(taskFormSchema),
    defaultValues: {
      title: "",
      description: "",
      status: "todo",
      priority: "normal",
      dueDate: "",
      dueTime: "",
      campaignId: "",
      clientId: "",
      assignedToId: "",
      spaceId: "",
      isRecurring: false,
      recurringPattern: undefined,
      recurringInterval: 1,
      recurringEndDate: "",
      scheduleFrom: "due_date",
    },
  });

  const createTaskMutation = useMutation({
    mutationFn: async (data: TaskFormData) => {
      const taskData: any = {
        title: data.title,
        status: data.status,
        priority: data.priority,
      };

      if (data.description) taskData.description = data.description;

      if (data.dueDate) {
        if (data.dueTime) {
          taskData.dueDate = parseInputDateEST(`${data.dueDate}T${data.dueTime}`).toISOString();
        } else {
          taskData.dueDate = parseInputDateEST(`${data.dueDate}T23:59`).toISOString();
        }
      }

      if (data.campaignId) taskData.campaignId = data.campaignId;
      if (data.clientId) taskData.clientId = data.clientId;
      if (data.spaceId) taskData.spaceId = data.spaceId;
      if (data.assignedToId && data.assignedToId !== "") {
        const parsedId = parseInt(data.assignedToId);
        if (!isNaN(parsedId)) {
          taskData.assignedToId = parsedId;
        }
      }
      if (data.isRecurring) {
        taskData.isRecurring = true;
        if (data.recurringPattern) taskData.recurringPattern = data.recurringPattern;
        if (data.recurringInterval) taskData.recurringInterval = data.recurringInterval;
        if (data.recurringEndDate) taskData.recurringEndDate = parseInputDateEST(data.recurringEndDate).toISOString();
        if (data.scheduleFrom) taskData.scheduleFrom = data.scheduleFrom;
      }

      return apiRequest("POST", "/api/tasks", taskData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
      toast({ title: "Task created successfully" });
      setIsCreateDialogOpen(false);
      form.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Failed to create task",
        description: error?.message || "Please try again",
        variant: "destructive"
      });
    },
  });

  const editTaskMutation = useMutation({
    mutationFn: async (data: TaskFormData) => {
      if (!editingTask) return;
      const taskData: any = {
        title: data.title,
        status: data.status,
        priority: data.priority,
      };

      if (data.description) taskData.description = data.description;

      if (data.dueDate) {
        if (data.dueTime) {
          taskData.dueDate = parseInputDateEST(`${data.dueDate}T${data.dueTime}`).toISOString();
        } else {
          taskData.dueDate = parseInputDateEST(`${data.dueDate}T23:59`).toISOString();
        }
      }

      if (data.campaignId) taskData.campaignId = data.campaignId;
      if (data.clientId) taskData.clientId = data.clientId;
      if (data.spaceId) taskData.spaceId = data.spaceId;
      if (data.assignedToId) taskData.assignedToId = parseInt(data.assignedToId);
      if (data.isRecurring) {
        taskData.isRecurring = true;
        if (data.recurringPattern) taskData.recurringPattern = data.recurringPattern;
        if (data.recurringInterval) taskData.recurringInterval = data.recurringInterval;
        if (data.recurringEndDate) taskData.recurringEndDate = parseInputDateEST(data.recurringEndDate).toISOString();
        if (data.scheduleFrom) taskData.scheduleFrom = data.scheduleFrom;
      } else {
        taskData.isRecurring = false;
      }

      return apiRequest("PATCH", `/api/tasks/${editingTask.id}`, taskData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
      toast({ title: "Task updated successfully" });
      setIsEditDialogOpen(false);
      setEditingTask(null);
      form.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Failed to update task",
        description: error?.message || "Please try again",
        variant: "destructive"
      });
    },
  });

  const deleteTaskMutation = useMutation({
    mutationFn: async (taskId: string) => {
      return apiRequest("DELETE", `/api/tasks/${taskId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
      toast({ title: "Task deleted successfully" });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to delete task",
        description: error?.message || "Please try again",
        variant: "destructive"
      });
    },
  });

  const bulkUpdateMutation = useMutation({
    mutationFn: async ({ ids, data }: { ids: string[], data: any }) => {
      return Promise.all(ids.map(id => apiRequest("PATCH", `/api/tasks/${id}`, data)));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
      setSelectedTaskIds(new Set());
      toast({ title: "Tasks updated successfully" });
    },
  });

  const bulkDeleteMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      return Promise.all(ids.map(id => apiRequest("DELETE", `/api/tasks/${id}`)));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
      setSelectedTaskIds(new Set());
      toast({ title: "Tasks deleted successfully" });
    },
  });

  const handleEditTask = (task: Task) => {
    setEditingTask(task);
    form.reset({
      title: task.title,
      description: task.description || "",
      status: task.status as any,
      priority: task.priority as any,
      dueDate: task.dueDate ? toInputDateEST(task.dueDate) : "",
      campaignId: task.campaignId || "",
      clientId: task.clientId || "",
      spaceId: task.spaceId || "",
      assignedToId: task.assignedToId?.toString() || "",
      isRecurring: task.isRecurring || false,
      recurringPattern: task.recurringPattern as any,
      recurringInterval: task.recurringInterval || 1,
      recurringEndDate: task.recurringEndDate ? toInputDateEST(task.recurringEndDate) : "",
    });
    setIsEditDialogOpen(true);
  };

  const toggleTaskSelection = (taskId: string, event?: React.MouseEvent) => {
    if (event) event.stopPropagation();
    const newSelection = new Set(selectedTaskIds);
    if (newSelection.has(taskId)) {
      newSelection.delete(taskId);
    } else {
      newSelection.add(taskId);
    }
    setSelectedTaskIds(newSelection);
  };

  const selectAllTasks = () => {
    if (selectedTaskIds.size === filteredTasks.length) {
      setSelectedTaskIds(new Set());
    } else {
      setSelectedTaskIds(new Set(filteredTasks.map(t => t.id)));
    }
  };

  const handleDragStart = (task: Task) => {
    setDraggedTask(task);
    setIsDragging(true);
  };

  const handleDragEnd = () => {
    setDraggedTask(null);
    setIsDragging(false);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, newStatus: string) => {
    e.preventDefault();
    if (draggedTask && draggedTask.status !== newStatus) {
      updateTaskStatusMutation.mutate({
        id: draggedTask.id,
        status: newStatus
      });
    }
    setDraggedTask(null);
    setIsDragging(false);
  };

  const updateTaskStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      return apiRequest("PATCH", `/api/tasks/${id}`, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
      toast({ title: "Task moved successfully" });
    },
    onError: () => {
      toast({ title: "Failed to update task", variant: "destructive" });
    },
  });

  const toggleSort = useCallback((field: SortField) => {
    if (sortBy === field) {
      setSortOrder(prev => prev === "asc" ? "desc" : "asc");
    } else {
      setSortBy(field);
      setSortOrder(field === "dueDate" ? "asc" : "desc");
    }
  }, [sortBy]);

  const matchesBaseFilters = (task: Task) => {
    if (filterStatus !== "all" && task.status !== filterStatus) return false;
    if (filterPriority !== "all" && task.priority !== filterPriority) return false;
    if (selectedSpaceId !== null && task.spaceId !== selectedSpaceId) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const titleMatch = task.title.toLowerCase().includes(q);
      const descMatch = task.description?.toLowerCase().includes(q) ?? false;
      if (!titleMatch && !descMatch) return false;
    }
    return true;
  };

  const completedHiddenByToggle = !showCompleted
    ? tasks.filter((t) => matchesBaseFilters(t) && t.status === "completed").length
    : 0;

  const filteredTasks = useMemo(() => {
    const filtered = tasks.filter((task) => {
      if (!matchesBaseFilters(task)) return false;
      if (!showCompleted && task.status === "completed") return false;
      return true;
    });

    // Sort
    filtered.sort((a, b) => {
      let cmp = 0;
      switch (sortBy) {
        case "title":
          cmp = a.title.localeCompare(b.title);
          break;
        case "dueDate": {
          const aDate = a.dueDate ? new Date(a.dueDate).getTime() : Infinity;
          const bDate = b.dueDate ? new Date(b.dueDate).getTime() : Infinity;
          cmp = aDate - bDate;
          break;
        }
        case "priority":
          cmp = (PRIORITY_ORDER[b.priority] ?? 0) - (PRIORITY_ORDER[a.priority] ?? 0);
          break;
        case "status":
          cmp = (STATUS_ORDER[a.status] ?? 0) - (STATUS_ORDER[b.status] ?? 0);
          break;
        case "createdAt": {
          const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0;
          const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0;
          cmp = bTime - aTime;
          break;
        }
      }
      return sortOrder === "asc" ? cmp : -cmp;
    });

    return filtered;
  }, [tasks, filterStatus, filterPriority, selectedSpaceId, showCompleted, searchQuery, sortBy, sortOrder]);

  // Task statistics
  const taskStats = useMemo(() => {
    const relevantTasks = tasks.filter(t => {
      if (selectedSpaceId !== null && t.spaceId !== selectedSpaceId) return false;
      return true;
    });
    return {
      total: relevantTasks.length,
      todo: relevantTasks.filter(t => t.status === "todo").length,
      inProgress: relevantTasks.filter(t => t.status === "in_progress").length,
      review: relevantTasks.filter(t => t.status === "review").length,
      completed: relevantTasks.filter(t => t.status === "completed").length,
      overdue: relevantTasks.filter(t => isOverdue(t.dueDate, t.status)).length,
    };
  }, [tasks, selectedSpaceId]);

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "urgent": return "bg-red-500";
      case "high": return "bg-orange-500";
      case "normal": return "bg-blue-500";
      case "low": return "bg-gray-400";
      default: return "bg-gray-400";
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case "urgent": return "bg-red-100 text-red-700 border-red-200 dark:bg-red-950 dark:text-red-400 dark:border-red-900";
      case "high": return "bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-950 dark:text-orange-400 dark:border-orange-900";
      case "normal": return "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-400 dark:border-blue-900";
      case "low": return "bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-900 dark:text-slate-400 dark:border-slate-800";
      default: return "bg-slate-100 text-slate-600 border-slate-200";
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed": return "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-400 dark:border-emerald-900";
      case "in_progress": return "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-400 dark:border-blue-900";
      case "review": return "bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-950 dark:text-purple-400 dark:border-purple-900";
      case "todo": return "bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-900 dark:text-slate-400 dark:border-slate-800";
      default: return "bg-slate-100 text-slate-600 border-slate-200";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed": return <CheckCircle2 className="w-3.5 h-3.5" />;
      case "in_progress": return <Clock className="w-3.5 h-3.5" />;
      case "review": return <CircleDot className="w-3.5 h-3.5" />;
      case "todo": return <Circle className="w-3.5 h-3.5" />;
      default: return <Circle className="w-3.5 h-3.5" />;
    }
  };

  const formatStatus = (status: string) => status.replace("_", " ");

  const SortButton = ({ field, label }: { field: SortField; label: string }) => (
    <button
      onClick={() => toggleSort(field)}
      className="flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors uppercase tracking-wider"
    >
      {label}
      {sortBy === field ? (
        sortOrder === "asc" ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />
      ) : (
        <ArrowUpDown className="w-3 h-3 opacity-40" />
      )}
    </button>
  );

  const renderTaskForm = (onSubmit: (data: TaskFormData) => void, isPending: boolean, submitLabel: string) => (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Title *</FormLabel>
              <FormControl>
                <Input {...field} placeholder="Task title" data-testid="input-task-title" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea {...field} placeholder="Task description" rows={3} data-testid="input-task-description" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="status"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Status *</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger data-testid="select-task-status">
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="todo">To Do</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="review">Review</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="priority"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Priority *</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger data-testid="select-task-priority">
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="normal">Normal</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="dueDate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Due Date</FormLabel>
                <FormControl>
                  <Input type="date" {...field} data-testid="input-task-due-date" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="dueTime"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Due Time (Optional)</FormLabel>
                <FormControl>
                  <Input type="time" {...field} placeholder="HH:MM" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="assignedToId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Assign To</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger data-testid="select-task-assignee">
                    <SelectValue placeholder="Select team member" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {users.map((user) => (
                    <SelectItem key={user.id} value={user.id.toString()}>
                      {user.username}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="clientId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Related Client</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger data-testid="select-task-client">
                    <SelectValue placeholder="Select client (optional)" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {clients.map((client) => (
                    <SelectItem key={client.id} value={client.id}>
                      {client.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="spaceId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Space (Optional)</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger data-testid="select-task-space">
                    <SelectValue placeholder="Select space (optional)" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {buildSpaceOptions().map((space) => (
                    <SelectItem key={space.id} value={space.id}>
                      {space.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Recurring Task Settings */}
        <div className="border rounded-lg p-4 space-y-4 bg-muted/30">
          <FormField
            control={form.control}
            name="isRecurring"
            render={({ field }) => (
              <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                <FormControl>
                  <Checkbox
                    checked={field.value || false}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
                <div className="space-y-1 leading-none">
                  <FormLabel className="cursor-pointer">
                    Make this a recurring task
                  </FormLabel>
                  <p className="text-xs text-muted-foreground">
                    Automatically create a new task when this one is completed
                  </p>
                </div>
              </FormItem>
            )}
          />

          {form.watch("isRecurring") && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="recurringPattern"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Repeat Pattern</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select pattern" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="daily">Daily</SelectItem>
                          <SelectItem value="weekly">Weekly</SelectItem>
                          <SelectItem value="monthly">Monthly</SelectItem>
                          <SelectItem value="yearly">Yearly</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="recurringInterval"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Every</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="1"
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value))}
                          placeholder="1"
                        />
                      </FormControl>
                      <p className="text-xs text-muted-foreground">
                        Repeat every X {form.watch("recurringPattern") || "period"}(s)
                      </p>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="scheduleFrom"
                render={({ field }) => (
                  <FormItem className="space-y-3">
                    <FormLabel>Schedule Next Task From</FormLabel>
                    <FormControl>
                      <div className="flex flex-col gap-2">
                        <label className="flex items-center gap-2 cursor-pointer p-2 rounded-md hover:bg-muted/50 transition-colors">
                          <input
                            type="radio"
                            value="due_date"
                            checked={field.value === "due_date"}
                            onChange={() => field.onChange("due_date")}
                            className="h-4 w-4"
                          />
                          <div>
                            <div className="font-medium text-sm">Due Date</div>
                            <div className="text-xs text-muted-foreground">Next task uses same schedule (e.g., every Monday)</div>
                          </div>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer p-2 rounded-md hover:bg-muted/50 transition-colors">
                          <input
                            type="radio"
                            value="completion_date"
                            checked={field.value === "completion_date"}
                            onChange={() => field.onChange("completion_date")}
                            className="h-4 w-4"
                          />
                          <div>
                            <div className="font-medium text-sm">Completion Date</div>
                            <div className="text-xs text-muted-foreground">Next task starts from when you complete this one</div>
                          </div>
                        </label>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="recurringEndDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>End Date (Optional)</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <p className="text-xs text-muted-foreground">
                      Leave empty to repeat indefinitely
                    </p>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </>
          )}
        </div>

        <div className="flex justify-end gap-3 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              setIsCreateDialogOpen(false);
              setIsEditDialogOpen(false);
              setEditingTask(null);
            }}
            data-testid="button-cancel-task"
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isPending} data-testid="button-submit-task">
            {isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
            {submitLabel}
          </Button>
        </div>
      </form>
    </Form>
  );

  // ─── Skeleton Loading ─────────────────────────────────────────────
  const renderKanbanSkeleton = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 p-4">
      {[1, 2, 3, 4].map((col) => (
        <div key={col} className="flex flex-col bg-muted/30 rounded-xl border p-3">
          <div className="mb-4 px-2 py-1 flex items-center gap-2">
            <Skeleton className="w-6 h-6 rounded" />
            <Skeleton className="w-20 h-4" />
            <Skeleton className="w-6 h-4 rounded-full" />
          </div>
          <div className="space-y-3">
            {[1, 2, 3].map((card) => (
              <div key={card} className="rounded-lg border bg-card p-3 space-y-3">
                <div className="flex items-start gap-2">
                  <Skeleton className="w-1.5 h-1.5 rounded-full mt-1.5" />
                  <Skeleton className="h-4 flex-1" />
                </div>
                <div className="flex items-center justify-between">
                  <Skeleton className="w-16 h-3" />
                  <Skeleton className="w-5 h-5 rounded-full" />
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );

  const renderListSkeleton = () => (
    <div className="space-y-2 p-4">
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <div key={i} className="flex items-center gap-4 p-4 rounded-lg border bg-card">
          <Skeleton className="w-4 h-4 rounded" />
          <Skeleton className="w-2 h-8 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/4" />
          </div>
          <Skeleton className="w-24 h-8 rounded" />
          <Skeleton className="w-8 h-8 rounded-full" />
        </div>
      ))}
    </div>
  );

  const renderCompactSkeleton = () => (
    <div className="border rounded-lg overflow-hidden bg-card">
      <div className="hidden md:grid grid-cols-12 gap-4 px-4 py-2 bg-muted/50 border-b">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="col-span-2">
            <Skeleton className="h-3 w-16" />
          </div>
        ))}
      </div>
      {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
        <div key={i} className="grid grid-cols-12 gap-4 px-4 py-3 border-b items-center">
          <div className="col-span-1 flex justify-center"><Skeleton className="w-4 h-4 rounded" /></div>
          <div className="col-span-4 flex items-center gap-2">
            <Skeleton className="w-2 h-2 rounded-full" />
            <Skeleton className="h-4 flex-1" />
          </div>
          <div className="col-span-2"><Skeleton className="h-5 w-16 rounded" /></div>
          <div className="col-span-2"><Skeleton className="h-5 w-16 rounded" /></div>
          <div className="col-span-1"><Skeleton className="h-3 w-14" /></div>
          <div className="col-span-2 flex justify-end"><Skeleton className="w-7 h-7 rounded-full" /></div>
        </div>
      ))}
    </div>
  );

  // ─── Kanban View ──────────────────────────────────────────────────
  const renderKanbanView = () => {
    const columns = [
      { id: "todo", title: "To Do", icon: "📋", color: "border-t-slate-400" },
      { id: "in_progress", title: "In Progress", icon: "⚡", color: "border-t-blue-500" },
      { id: "review", title: "Review", icon: "👀", color: "border-t-purple-500" },
      { id: "completed", title: "Completed", icon: "✅", color: "border-t-emerald-500" },
    ];

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5 h-full min-h-0 p-4 overflow-x-auto overflow-y-hidden">
        {columns.map((column) => {
          const columnTasks = filteredTasks.filter((task) => task.status === column.id);
          const isDragTarget = draggedTask && draggedTask.status !== column.id;

          return (
            <div
              key={column.id}
              className={`flex flex-col h-full min-h-0 min-w-[200px] md:min-w-[240px] lg:min-w-[280px] bg-muted/20 rounded-xl border border-t-[3px] ${column.color} transition-all ${
                isDragTarget ? "ring-2 ring-primary/30 bg-primary/5" : ""
              }`}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, column.id)}
            >
              <div className="p-3 pb-2 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-base">{column.icon}</span>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    {column.title}
                  </h3>
                  <Badge variant="secondary" className="bg-background/60 text-[10px] px-1.5 h-5 min-w-[22px] justify-center font-semibold">
                    {columnTasks.length}
                  </Badge>
                </div>
              </div>

              <div className="space-y-2 flex-1 min-h-0 overflow-y-auto px-2 pb-2 custom-scrollbar">
                {columnTasks.map((task) => {
                  const overdueTask = isOverdue(task.dueDate, task.status);
                  const dueSoonTask = isDueSoon(task.dueDate, task.status);
                  const checklistDone = task.checklist?.filter(i => i.completed).length ?? 0;
                  const checklistTotal = task.checklist?.length ?? 0;

                  return (
                    <Card
                      key={task.id}
                      draggable
                      onDragStart={() => handleDragStart(task)}
                      onDragEnd={handleDragEnd}
                      className={`relative transition-all group cursor-grab active:cursor-grabbing border shadow-sm hover:shadow-md bg-card ${
                        draggedTask?.id === task.id ? 'opacity-40 scale-95' : 'hover:-translate-y-0.5'
                      } ${overdueTask ? "border-red-200 dark:border-red-900" : ""} ${
                        selectedTaskIds.has(task.id) ? "ring-2 ring-primary" : ""
                      }`}
                      data-testid={`task-card-${task.id}`}
                      onClick={() => {
                        if (!isDragging) {
                          setSelectedTask(task);
                          setIsDetailSidebarOpen(true);
                        }
                      }}
                    >
                      <CardContent className="p-3 space-y-2.5">
                        {/* Title row with priority dot */}
                        <div className="flex items-start gap-2 pr-6">
                          <div className={`w-2 h-2 rounded-full flex-shrink-0 mt-1.5 ${getPriorityColor(task.priority)}`} />
                          <h4 className="font-medium text-sm leading-snug line-clamp-2">{task.title}</h4>
                        </div>

                        {/* Description preview */}
                        {task.description && (
                          <p className="text-xs text-muted-foreground line-clamp-1 pl-4">{task.description}</p>
                        )}

                        {/* Checklist progress */}
                        {checklistTotal > 0 && (
                          <div className="pl-4 space-y-1">
                            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                              <CheckCircle2 className="w-3 h-3" />
                              <span>{checklistDone}/{checklistTotal}</span>
                            </div>
                            <Progress
                              value={checklistTotal > 0 ? (checklistDone / checklistTotal) * 100 : 0}
                              className="h-1"
                            />
                          </div>
                        )}

                        {/* Meta info row */}
                        <div className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-2 flex-wrap">
                            {task.dueDate && (
                              <div className={`flex items-center gap-1 ${getDueDateClass(task.dueDate, task.status)}`}>
                                {overdueTask ? <AlertTriangle className="w-3 h-3" /> : <Calendar className="w-3 h-3" />}
                                <span>{toLocaleDateStringEST(task.dueDate)}</span>
                              </div>
                            )}
                            {task.isRecurring && (
                              <Repeat className="w-3 h-3 text-blue-500" />
                            )}
                          </div>
                          {task.assignedToId && (
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-[10px] font-bold text-primary">
                                    {users.find(u => u.id === task.assignedToId)?.firstName?.[0] || "?"}
                                  </div>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>{users.find(u => u.id === task.assignedToId)?.firstName || users.find(u => u.id === task.assignedToId)?.username || "Unknown"}</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          )}
                        </div>

                        {/* Hover actions */}
                        <div className="absolute top-1.5 right-1.5 opacity-0 group-hover:opacity-100 transition-opacity flex gap-0.5">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEditTask(task);
                            }}
                            className="p-1 rounded-md bg-muted/80 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                            title="Edit task"
                          >
                            <Edit className="w-3 h-3" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              if (confirm(`Delete task "${task.title}"?`)) {
                                deleteTaskMutation.mutate(task.id);
                              }
                            }}
                            className="p-1 rounded-md bg-destructive/10 hover:bg-destructive/20 text-destructive transition-colors"
                            title="Delete task"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
                {columnTasks.length === 0 && (
                  <div className="text-center py-8 border-2 border-dashed rounded-xl border-muted/30 text-muted-foreground/40">
                    <div className="text-2xl mb-1">{column.icon}</div>
                    <p className="text-xs">Drop tasks here</p>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  // ─── Compact View ─────────────────────────────────────────────────
  const renderCompactView = () => {
    return (
      <div className="border rounded-lg overflow-hidden bg-card mx-4">
        {/* Header */}
        <div className="hidden md:grid grid-cols-12 gap-4 px-4 py-2.5 bg-muted/50 border-b items-center">
          <div className="col-span-1 flex justify-center">
            <Checkbox
              checked={selectedTaskIds.size === filteredTasks.length && filteredTasks.length > 0}
              onCheckedChange={selectAllTasks}
              className="h-4 w-4"
            />
          </div>
          <div className="col-span-4"><SortButton field="title" label="Task" /></div>
          <div className="col-span-2"><SortButton field="status" label="Status" /></div>
          <div className="col-span-2"><SortButton field="priority" label="Priority" /></div>
          <div className="col-span-1"><SortButton field="dueDate" label="Due" /></div>
          <div className="col-span-2 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">Assignee</div>
        </div>

        {/* Task Rows */}
        <div className="divide-y">
          {filteredTasks.map((task) => {
            const overdueTask = isOverdue(task.dueDate, task.status);
            return (
              <div key={task.id} className="group relative">
                <div
                  className={`px-3 md:px-4 py-2.5 cursor-pointer hover:bg-muted/30 transition-colors ${
                    selectedTaskIds.has(task.id) ? "bg-primary/5 hover:bg-primary/10" :
                    selectedTask?.id === task.id ? "bg-muted/50" : ""
                  } ${overdueTask ? "bg-red-50/30 dark:bg-red-950/10" : ""}`}
                  onClick={() => {
                    setSelectedTask(task);
                    setIsDetailSidebarOpen(true);
                  }}
                  data-testid={`task-row-${task.id}`}
                >
                  {/* Mobile Layout */}
                  <div className="md:hidden flex items-center gap-3">
                    <Checkbox
                      checked={selectedTaskIds.has(task.id)}
                      onCheckedChange={() => toggleTaskSelection(task.id)}
                      onClick={(e) => e.stopPropagation()}
                      className="h-4 w-4"
                    />
                    <div className={`w-1.5 h-8 rounded-full flex-shrink-0 ${getPriorityColor(task.priority)}`} />
                    <div className="flex-1 min-w-0">
                      <span className="font-medium text-sm truncate block">{task.title}</span>
                      <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                        <Badge variant="outline" className={`${getStatusBadge(task.status)} text-[10px] h-4 px-1.5`}>
                          {formatStatus(task.status)}
                        </Badge>
                        {task.dueDate && (
                          <span className={getDueDateClass(task.dueDate, task.status)}>
                            {toLocaleDateStringEST(task.dueDate)}
                          </span>
                        )}
                      </div>
                    </div>
                    {task.assignedToId && (
                      <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
                        {users.find(u => u.id === task.assignedToId)?.firstName?.[0] || "?"}
                      </div>
                    )}
                  </div>

                  {/* Desktop Layout */}
                  <div className="hidden md:grid grid-cols-12 gap-4 items-center">
                    <div className="col-span-1 flex justify-center">
                      <Checkbox
                        checked={selectedTaskIds.has(task.id)}
                        onCheckedChange={() => toggleTaskSelection(task.id)}
                        onClick={(e) => e.stopPropagation()}
                        className="h-4 w-4"
                      />
                    </div>
                    <div className="col-span-4 flex items-center gap-2.5 min-w-0">
                      <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${getPriorityColor(task.priority)}`} />
                      <span className="truncate text-sm font-medium">{task.title}</span>
                      {task.isRecurring && <Repeat className="w-3 h-3 text-blue-500 flex-shrink-0" />}
                      {task.checklist && task.checklist.length > 0 && (
                        <span className="text-[10px] text-muted-foreground flex-shrink-0">
                          {task.checklist.filter(i => i.completed).length}/{task.checklist.length}
                        </span>
                      )}
                    </div>

                    <div className="col-span-2">
                      <Badge variant="outline" className={`${getStatusBadge(task.status)} text-[10px] px-2 py-0.5 capitalize`}>
                        {getStatusIcon(task.status)}
                        <span className="ml-1">{formatStatus(task.status)}</span>
                      </Badge>
                    </div>

                    <div className="col-span-2">
                      <Badge variant="outline" className={`${getPriorityBadge(task.priority)} text-[10px] px-2 py-0.5 capitalize`}>
                        {task.priority}
                      </Badge>
                    </div>

                    <div className={`col-span-1 text-xs ${getDueDateClass(task.dueDate, task.status)}`}>
                      {task.dueDate ? (
                        <div className="flex items-center gap-1">
                          {overdueTask && <AlertTriangle className="w-3 h-3 text-red-500" />}
                          {toLocaleDateStringEST(task.dueDate)}
                        </div>
                      ) : (
                        <span className="text-muted-foreground/40">-</span>
                      )}
                    </div>

                    <div className="col-span-2 flex items-center justify-end gap-2">
                      {task.assignedToId ? (
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
                                {users.find(u => u.id === task.assignedToId)?.firstName?.[0] || "?"}
                              </div>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>{users.find(u => u.id === task.assignedToId)?.firstName || users.find(u => u.id === task.assignedToId)?.username || "Unassigned"}</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      ) : (
                        <div className="w-7 h-7 rounded-full border border-dashed flex items-center justify-center text-muted-foreground/30">
                          <User className="w-3 h-3" />
                        </div>
                      )}

                      {/* Row actions */}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <MoreHorizontal className="w-3.5 h-3.5" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleEditTask(task); }}>
                            <Edit className="w-3.5 h-3.5 mr-2" /> Edit
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (confirm(`Delete task "${task.title}"?`)) deleteTaskMutation.mutate(task.id);
                            }}
                          >
                            <Trash2 className="w-3.5 h-3.5 mr-2" /> Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {filteredTasks.length === 0 && (
          <div className="text-center py-16">
            <ListTodo className="w-12 h-12 mx-auto mb-3 text-muted-foreground/20" />
            <p className="text-muted-foreground font-medium">No tasks match your filters</p>
            <p className="text-sm text-muted-foreground/60 mt-1">Try adjusting your search or filter criteria</p>
          </div>
        )}
      </div>
    );
  };

  // ─── List View ────────────────────────────────────────────────────
  const renderListView = () => {
    return (
      <div className="space-y-2 px-4">
        {filteredTasks.map((task) => {
          const overdueTask = isOverdue(task.dueDate, task.status);
          const checklistDone = task.checklist?.filter(i => i.completed).length ?? 0;
          const checklistTotal = task.checklist?.length ?? 0;

          return (
            <Card
              key={task.id}
              className={`transition-all group cursor-pointer hover:shadow-md ${
                selectedTaskIds.has(task.id) ? "ring-2 ring-primary bg-primary/5" : ""
              } ${overdueTask ? "border-red-200 dark:border-red-900" : ""}`}
              data-testid={`task-card-${task.id}`}
              onClick={() => {
                setSelectedTask(task);
                setIsDetailSidebarOpen(true);
              }}
            >
              <CardContent className="p-4 flex items-center gap-4">
                {/* Checkbox */}
                <Checkbox
                  checked={selectedTaskIds.has(task.id)}
                  onCheckedChange={() => toggleTaskSelection(task.id)}
                  onClick={(e) => e.stopPropagation()}
                  className="h-4 w-4 flex-shrink-0"
                />

                {/* Priority indicator */}
                <div className={`w-1.5 h-10 rounded-full flex-shrink-0 ${getPriorityColor(task.priority)}`} />

                {/* Task info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-medium truncate">{task.title}</h3>
                    {task.isRecurring && <Repeat className="w-3.5 h-3.5 text-blue-500 flex-shrink-0" />}
                  </div>
                  {task.description && (
                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{task.description}</p>
                  )}
                  <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                    {task.dueDate && (
                      <div className={`flex items-center gap-1 text-xs ${getDueDateClass(task.dueDate, task.status)}`}>
                        {overdueTask ? <AlertTriangle className="w-3 h-3" /> : <Calendar className="w-3 h-3" />}
                        {toLocaleDateStringEST(task.dueDate)}
                      </div>
                    )}
                    {checklistTotal > 0 && (
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <CheckCircle2 className="w-3 h-3" />
                        {checklistDone}/{checklistTotal}
                      </div>
                    )}
                    <Badge variant="outline" className={`${getPriorityBadge(task.priority)} text-[10px] h-4 px-1.5 capitalize`}>
                      {task.priority}
                    </Badge>
                  </div>
                </div>

                {/* Status dropdown */}
                <Select
                  value={task.status}
                  onValueChange={(status) => updateTaskStatusMutation.mutate({ id: task.id, status })}
                >
                  <SelectTrigger className="w-[130px] h-8 text-xs" onClick={(e) => e.stopPropagation()} data-testid={`select-status-${task.id}`}>
                    <div className="flex items-center gap-1.5">
                      {getStatusIcon(task.status)}
                      <span className="capitalize">{formatStatus(task.status)}</span>
                    </div>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todo">To Do</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="review">Review</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                  </SelectContent>
                </Select>

                {/* Assignee */}
                {task.assignedToId ? (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary flex-shrink-0">
                          {users.find(u => u.id === task.assignedToId)?.firstName?.[0] || "?"}
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>{users.find(u => u.id === task.assignedToId)?.firstName || users.find(u => u.id === task.assignedToId)?.username || "Unassigned"}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                ) : (
                  <div className="w-8 h-8 rounded-full border border-dashed flex items-center justify-center text-muted-foreground/30 flex-shrink-0">
                    <User className="w-4 h-4" />
                  </div>
                )}

                {/* Actions */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <MoreHorizontal className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleEditTask(task); }}>
                      <Edit className="w-3.5 h-3.5 mr-2" /> Edit
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      className="text-destructive"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (confirm(`Delete task "${task.title}"?`)) deleteTaskMutation.mutate(task.id);
                      }}
                    >
                      <Trash2 className="w-3.5 h-3.5 mr-2" /> Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </CardContent>
            </Card>
          );
        })}
        {filteredTasks.length === 0 && (
          <div className="text-center py-16">
            <ListTodo className="w-12 h-12 mx-auto mb-3 text-muted-foreground/20" />
            <p className="text-muted-foreground font-medium">No tasks match your filters</p>
            <p className="text-sm text-muted-foreground/60 mt-1">Try adjusting your search or filter criteria</p>
          </div>
        )}
      </div>
    );
  };

  // ─── Loading State ────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="flex h-full overflow-hidden">
        <div className="hidden md:block w-64 border-r bg-card/50 overflow-y-auto">
          <div className="p-3 space-y-2">
            <Skeleton className="h-9 w-full rounded-md" />
            <Skeleton className="h-4 w-20 mt-4" />
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-8 w-full rounded-md" />
            ))}
          </div>
        </div>
        <div className="flex-1 flex flex-col h-full overflow-hidden">
          <div className="p-3 md:p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <Skeleton className="h-7 w-32" />
                <Skeleton className="h-4 w-48" />
              </div>
              <Skeleton className="h-9 w-28 rounded-md" />
            </div>
          </div>
          <div className="flex-1 min-h-0 overflow-y-auto">
            {renderKanbanSkeleton()}
          </div>
        </div>
      </div>
    );
  }

  // ─── Main Render ──────────────────────────────────────────────────
  return (
    <div className="flex h-full overflow-hidden">
      {/* Left Sidebar - Task Spaces */}
      <div className="hidden md:block w-64 border-r bg-card/50 overflow-y-auto">
        <TaskSpacesSidebar
          selectedSpaceId={selectedSpaceId}
          onSpaceSelect={setSelectedSpaceId}
        />
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        <div className="p-3 md:p-5 space-y-3 shrink-0">
          {/* Header */}
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
            <div>
              <h1 className="text-xl md:text-2xl font-bold tracking-tight">Tasks</h1>
              <div className="flex items-center gap-3 mt-1">
                <p className="text-sm text-muted-foreground">
                  {filteredTasks.length} task{filteredTasks.length !== 1 ? "s" : ""}
                  {filterStatus !== "all" && ` · ${formatStatus(filterStatus)}`}
                  {filterPriority !== "all" && ` · ${filterPriority}`}
                  {searchQuery && ` · "${searchQuery}"`}
                </p>
                {taskStats.overdue > 0 && (
                  <Badge variant="outline" className="bg-red-50 text-red-600 border-red-200 dark:bg-red-950 dark:text-red-400 dark:border-red-900 text-[10px] gap-1">
                    <AlertTriangle className="w-3 h-3" />
                    {taskStats.overdue} overdue
                  </Badge>
                )}
              </div>
            </div>

            {/* Mobile: Spaces button */}
            <div className="md:hidden">
              <Dialog open={spacesDialogOpen} onOpenChange={setSpacesDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm">Spaces</Button>
                </DialogTrigger>
                <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Spaces</DialogTitle>
                    <DialogDescription>Select a space to filter tasks</DialogDescription>
                  </DialogHeader>
                  <TaskSpacesSidebar
                    selectedSpaceId={selectedSpaceId}
                    onSpaceSelect={(id) => { setSelectedSpaceId(id); setSpacesDialogOpen(false); }}
                  />
                </DialogContent>
              </Dialog>
            </div>
          </div>

          {/* Task Stats Mini-Bar */}
          {!isFilterPanelOpen && taskStats.total > 0 && (
            <div className="flex items-center gap-1.5 flex-wrap">
              <button
                onClick={() => { setFilterStatus("todo"); setIsFilterPanelOpen(true); }}
                className="flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 transition-colors"
              >
                <Circle className="w-3 h-3" />
                {taskStats.todo} To Do
              </button>
              <button
                onClick={() => { setFilterStatus("in_progress"); setIsFilterPanelOpen(true); }}
                className="flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium bg-blue-100 text-blue-600 hover:bg-blue-200 dark:bg-blue-950 dark:text-blue-400 dark:hover:bg-blue-900 transition-colors"
              >
                <Clock className="w-3 h-3" />
                {taskStats.inProgress} In Progress
              </button>
              <button
                onClick={() => { setFilterStatus("review"); setIsFilterPanelOpen(true); }}
                className="flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium bg-purple-100 text-purple-600 hover:bg-purple-200 dark:bg-purple-950 dark:text-purple-400 dark:hover:bg-purple-900 transition-colors"
              >
                <CircleDot className="w-3 h-3" />
                {taskStats.review} Review
              </button>
              <button
                onClick={() => { setFilterStatus("completed"); setShowCompleted(true); setIsFilterPanelOpen(true); }}
                className="flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium bg-emerald-100 text-emerald-600 hover:bg-emerald-200 dark:bg-emerald-950 dark:text-emerald-400 dark:hover:bg-emerald-900 transition-colors"
              >
                <CheckCircle2 className="w-3 h-3" />
                {taskStats.completed} Done
              </button>
            </div>
          )}

          {/* Error Banner */}
          {tasksError && (
            <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm flex items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="font-medium text-destructive">Tasks failed to load</div>
                <div className="text-muted-foreground truncate">{tasksError.message}</div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => queryClient.invalidateQueries({ queryKey: ["/api/tasks"] })}
              >
                Retry
              </Button>
            </div>
          )}

          {/* Completed Hidden Banner */}
          {!tasksError && completedHiddenByToggle > 0 && !isFilterPanelOpen && (
            <div className="rounded-lg border bg-muted/30 px-3 py-2 text-sm flex items-center justify-between gap-3">
              <span className="text-muted-foreground">
                {completedHiddenByToggle} completed task{completedHiddenByToggle !== 1 ? "s" : ""} hidden
              </span>
              <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => setShowCompleted(true)}>
                Show
              </Button>
            </div>
          )}

          {/* Toolbar */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Search */}
            <div className="relative flex-1 min-w-[180px] max-w-xs">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search tasks..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-9 pl-9 pr-8 text-sm"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 rounded hover:bg-muted transition-colors"
                >
                  <X className="w-3.5 h-3.5 text-muted-foreground" />
                </button>
              )}
            </div>

            {/* Filter Button */}
            <Button
              variant={isFilterPanelOpen ? "default" : "outline"}
              size="sm"
              onClick={() => setIsFilterPanelOpen(!isFilterPanelOpen)}
              className="h-9 gap-1.5"
            >
              <Filter className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Filter</span>
              {(filterStatus !== "all" || filterPriority !== "all" || selectedSpaceId !== null) && (
                <Badge variant="secondary" className="ml-0.5 h-4 px-1 text-[10px]">
                  {(filterStatus !== "all" ? 1 : 0) + (filterPriority !== "all" ? 1 : 0) + (selectedSpaceId !== null ? 1 : 0)}
                </Badge>
              )}
            </Button>

            {/* Sort Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="h-9 gap-1.5">
                  <ArrowUpDown className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline capitalize">{sortBy === "createdAt" ? "Newest" : sortBy === "dueDate" ? "Due Date" : sortBy}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => { setSortBy("createdAt"); setSortOrder("desc"); }}>
                  Newest First
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => { setSortBy("dueDate"); setSortOrder("asc"); }}>
                  Due Date (Soonest)
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => { setSortBy("priority"); setSortOrder("desc"); }}>
                  Priority (Highest)
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => { setSortBy("title"); setSortOrder("asc"); }}>
                  Title (A-Z)
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => { setSortBy("status"); setSortOrder("asc"); }}>
                  Status
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* View Mode Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="h-9 gap-1.5">
                  {viewMode === "kanban" && <LayoutGrid className="w-3.5 h-3.5" />}
                  {viewMode === "list" && <List className="w-3.5 h-3.5" />}
                  {viewMode === "compact" && <AlignLeft className="w-3.5 h-3.5" />}
                  <span className="hidden sm:inline capitalize">{viewMode}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setViewMode("kanban")}>
                  <LayoutGrid className="w-4 h-4 mr-2" /> Kanban
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setViewMode("list")}>
                  <List className="w-4 h-4 mr-2" /> List
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setViewMode("compact")}>
                  <AlignLeft className="w-4 h-4 mr-2" /> Compact
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* More Options */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-9 w-9 p-0">
                  <MoreHorizontal className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {isAdminOrManager && (
                  <>
                    <DropdownMenuItem
                      onClick={() => backfillRecurringMutation.mutate()}
                      disabled={backfillRecurringMutation.isPending}
                    >
                      <Repeat className="w-4 h-4 mr-2" />
                      {backfillRecurringMutation.isPending ? "Backfilling..." : "Backfill Recurring"}
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                  </>
                )}
                <DropdownMenuItem onClick={() => setSelectedSpaceId(null)}>
                  <LayoutGrid className="w-4 h-4 mr-2" /> All Spaces
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSpacesDialogOpen(true)}>
                  <ListTodo className="w-4 h-4 mr-2" /> Manage Spaces
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <div className="flex-1" />

            {/* New Task Button */}
            <Dialog open={isCreateDialogOpen} onOpenChange={(open) => {
              setIsCreateDialogOpen(open);
              if (!open) form.reset();
            }}>
              <DialogTrigger asChild>
                <Button data-testid="button-create-task" size="sm" className="h-9 gap-1.5">
                  <Plus className="w-4 h-4" />
                  New Task
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Create New Task</DialogTitle>
                  <DialogDescription>Add a new task to your workflow</DialogDescription>
                </DialogHeader>
                {renderTaskForm((data) => createTaskMutation.mutate(data), createTaskMutation.isPending, "Create Task")}
              </DialogContent>
            </Dialog>
          </div>

          {/* Collapsible Filter Panel */}
          {isFilterPanelOpen && (
            <div className="flex flex-wrap items-center gap-2.5 p-3 bg-muted/30 rounded-lg border animate-in fade-in slide-in-from-top-2 duration-200">
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-36 h-8 text-xs" data-testid="select-filter-status">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="todo">To Do</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="review">Review</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>

              <Select value={filterPriority} onValueChange={setFilterPriority}>
                <SelectTrigger className="w-36 h-8 text-xs" data-testid="select-filter-priority">
                  <SelectValue placeholder="Priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Priority</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="normal">Normal</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                </SelectContent>
              </Select>

              <Select
                value={selectedSpaceId || ""}
                onValueChange={(val) => setSelectedSpaceId(val || null)}
              >
                <SelectTrigger className="w-40 h-8 text-xs">
                  <SelectValue placeholder="All Spaces" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Spaces</SelectItem>
                  {buildSpaceOptions().map((space) => (
                    <SelectItem key={space.id} value={space.id}>
                      {space.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Button
                variant={showCompleted ? "outline" : "secondary"}
                size="sm"
                onClick={() => setShowCompleted(!showCompleted)}
                className="h-8 gap-1.5 text-xs"
              >
                {showCompleted ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                {showCompleted ? "Hide Completed" : "Show Completed"}
              </Button>

              {(filterStatus !== "all" || filterPriority !== "all" || selectedSpaceId !== null || !showCompleted) && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setFilterStatus("all");
                    setFilterPriority("all");
                    setSelectedSpaceId(null);
                    setShowCompleted(true);
                  }}
                  className="h-8 text-xs text-muted-foreground"
                >
                  <X className="w-3 h-3 mr-1" />
                  Clear all
                </Button>
              )}
            </div>
          )}
        </div>

        {/* Content Area */}
        <div className="flex-1 min-h-0 overflow-y-auto">
          {viewMode === "kanban"
            ? renderKanbanView()
            : viewMode === "compact"
            ? renderCompactView()
            : renderListView()}
        </div>
      </div>

      {/* Edit Task Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={(open) => {
        setIsEditDialogOpen(open);
        if (!open) { setEditingTask(null); form.reset(); }
      }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Task</DialogTitle>
            <DialogDescription>Update task details</DialogDescription>
          </DialogHeader>
          {renderTaskForm((data) => editTaskMutation.mutate(data), editTaskMutation.isPending, "Update Task")}
        </DialogContent>
      </Dialog>

      {/* Task Detail Sidebar */}
      <TaskDetailSidebar
        task={selectedTask}
        isOpen={isDetailSidebarOpen}
        onClose={() => {
          setIsDetailSidebarOpen(false);
          setSelectedTask(null);
        }}
        onEdit={(task) => {
          handleEditTask(task);
          setIsDetailSidebarOpen(false);
        }}
      />

      {/* Bulk Action Bar */}
      {selectedTaskIds.size > 0 && (
        <div className="fixed bottom-[85px] md:bottom-6 left-1/2 -translate-x-1/2 z-50 bg-background/95 backdrop-blur-sm border shadow-2xl rounded-2xl px-5 py-3 flex items-center gap-4 animate-in fade-in slide-in-from-bottom-4 duration-300">
          <div className="flex items-center gap-2 border-r pr-4">
            <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center">
              <span className="text-xs font-bold text-primary">{selectedTaskIds.size}</span>
            </div>
            <span className="text-sm font-medium">selected</span>
            <Button variant="ghost" size="sm" onClick={() => setSelectedTaskIds(new Set())} className="h-7 px-2 text-xs">
              <X className="w-3 h-3" />
            </Button>
          </div>

          <div className="flex items-center gap-2">
            {selectedTaskIds.size === 1 && (
              <Button
                variant="outline"
                size="sm"
                className="h-8 rounded-lg text-xs gap-1.5"
                onClick={() => {
                  const selectedId = Array.from(selectedTaskIds)[0];
                  const task = tasks.find((t) => t.id === selectedId);
                  if (task) handleEditTask(task);
                }}
              >
                <Edit className="w-3.5 h-3.5" /> Edit
              </Button>
            )}

            <Select onValueChange={(status) => bulkUpdateMutation.mutate({ ids: Array.from(selectedTaskIds), data: { status } })}>
              <SelectTrigger className="h-8 w-32 rounded-lg text-xs">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todo">To Do</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="review">Review</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
              </SelectContent>
            </Select>

            <Select onValueChange={(priority) => bulkUpdateMutation.mutate({ ids: Array.from(selectedTaskIds), data: { priority } })}>
              <SelectTrigger className="h-8 w-32 rounded-lg text-xs">
                <SelectValue placeholder="Priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="normal">Normal</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="urgent">Urgent</SelectItem>
              </SelectContent>
            </Select>

            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 rounded-lg text-destructive hover:bg-destructive/10"
              onClick={() => {
                if (confirm(`Delete ${selectedTaskIds.size} task${selectedTaskIds.size > 1 ? "s" : ""}?`)) {
                  bulkDeleteMutation.mutate(Array.from(selectedTaskIds));
                }
              }}
            >
              <Trash2 className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

import { useState, useEffect, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { Plus, Calendar, User, ListTodo, KanbanSquare, Filter, Loader2, Edit, Trash2, MessageSquare, X, Repeat, Eye, EyeOff, CheckCircle2, MoreHorizontal, LayoutGrid, List, AlignLeft, Search } from "lucide-react";
import type { Task, InsertTask, Client, User as UserType, TaskSpace, TaskTemplate } from "@shared/schema";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { TaskSpacesSidebar } from "@/components/TaskSpacesSidebar";
import { TaskDetailSidebar } from "@/components/TaskDetailSidebar";
import { parseInputDateEST, toLocaleDateStringEST, toInputDateEST, nowEST, toEST } from "@/lib/dateUtils";

function getNextWeekday(): string {
  const now = new Date();
  const day = now.getDay();
  const diff = 7 - day; // Days until next Monday
  const nextMonday = new Date(now);
  nextMonday.setDate(now.getDate() + diff);
  return nextMonday.toISOString().split('T')[0];
}

interface ChecklistItem {
  id: string;
  text: string;
  completed: boolean;
}

function applyTemplate(
  template: TaskTemplate,
  form: any,
  setSelectedTemplateId: (id: string | null) => void
) {
  // Set basic fields
  form.setValue('title', template.title);
  form.setValue('description', template.taskDescription || '');
  form.setValue('status', template.status);
  form.setValue('priority', template.priority);
  
  // Set due date based on offset
  if (template.dueDateOffset !== null && template.dueDateOffset !== undefined) {
    const now = new Date();
    now.setDate(now.getDate() + template.dueDateOffset);
    form.setValue('dueDate', now.toISOString().split('T')[0]);
  } else {
    form.setValue('dueDate', '');
  }
  
  // Set recurring settings
  form.setValue('isRecurring', template.isRecurring);
  form.setValue('recurringPattern', template.recurringPattern || '');
  form.setValue('recurringInterval', template.recurringInterval || 1);
  
  // Set checklist if available
  if (template.checklist && Array.isArray(template.checklist)) {
    form.setValue('checklist', template.checklist);
  }
  
  setSelectedTemplateId(template.id);
}

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
  checklist: z.array(z.object({
    id: z.string(),
    text: z.string(),
    completed: z.boolean(),
  })).optional(),
});

type TaskFormData = z.infer<typeof taskFormSchema>;

export default function TasksPage() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"list" | "kanban" | "compact">("kanban");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterPriority, setFilterPriority] = useState<string>("all");
  const [isFilterPanelOpen, setIsFilterPanelOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [draggedTask, setDraggedTask] = useState<Task | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [selectedSpaceId, setSelectedSpaceId] = useState<string | null>(null);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isDetailSidebarOpen, setIsDetailSidebarOpen] = useState(false);
  const [selectedTaskIds, setSelectedTaskIds] = useState<Set<string>>(new Set());
  const [expandedTaskId, setExpandedTaskId] = useState<string | null>(null);
  const [spacesDialogOpen, setSpacesDialogOpen] = useState(false);
  const [isRecurringMasterOpen, setIsRecurringMasterOpen] = useState(false);
  const [editingRecurringTask, setEditingRecurringTask] = useState<Task | null>(null);
  // Load showCompleted preference from localStorage.
  // Default to FALSE to hide completed tasks by default.
  const [showCompleted, setShowCompleted] = useState(() => {
    const saved = localStorage.getItem('tasks-show-completed');
    try {
      return saved !== null ? JSON.parse(saved) : false;
    } catch {
      return false;
    }
  });

  // Save showCompleted preference to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('tasks-show-completed', JSON.stringify(showCompleted));
  }, [showCompleted]);

  // Load hideCompleted preference from localStorage
  const [hideCompleted, setHideCompleted] = useState(() => {
    const saved = localStorage.getItem('tasks-hide-completed');
    try {
      return saved !== null ? JSON.parse(saved) : false;
    } catch {
      return false;
    }
  });

  // Save hideCompleted preference to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('tasks-hide-completed', JSON.stringify(hideCompleted));
  }, [hideCompleted]);

  const { data: tasks = [], isLoading, error: tasksError } = useQuery<Task[]>({
    queryKey: ["/api/tasks"],
    refetchInterval: 15000, // Poll every 15 seconds for real-time updates (optimized)
    refetchIntervalInBackground: false, // Stop polling when tab is hidden
    refetchOnWindowFocus: true, // Only refresh when user returns to tab
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

  // Surface task loading errors instead of silently showing an empty list
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
    meta: { returnNull: true }, // Don't throw error if forbidden
  });

  const { data: users = [] } = useQuery<UserType[]>({
    queryKey: ["/api/users"],
    retry: false,
  });

  const { data: spaces = [] } = useQuery<TaskSpace[]>({
    queryKey: ["/api/task-spaces"],
    refetchInterval: 10000, // Poll every 10 seconds for real-time updates
    retry: false,
    meta: { returnNull: true }, // Don't throw error if forbidden
  });

  const { data: templates = [] } = useQuery<TaskTemplate[]>({
    queryKey: ["/api/tasks/templates"],
    retry: false,
    meta: { returnNull: true }, // Don't throw error if forbidden
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
      console.log("📝 Form data received:", data);
      
      const taskData: any = {
        title: data.title,
        status: data.status,
        priority: data.priority,
      };
      
      // Only add optional fields if they have values
      if (data.description) taskData.description = data.description;
      
      // Combine date and time if both are provided, using EST timezone
      if (data.dueDate) {
        if (data.dueTime) {
          // Parse as EST datetime
          taskData.dueDate = parseInputDateEST(`${data.dueDate}T${data.dueTime}`).toISOString();
        } else {
          // Parse as EST date, set to end of day (11:59 PM EST)
          taskData.dueDate = parseInputDateEST(`${data.dueDate}T23:59`).toISOString();
        }
      }
      
      if (data.campaignId) taskData.campaignId = data.campaignId;
      if (data.clientId) taskData.clientId = data.clientId;
      if (data.spaceId) {
        taskData.spaceId = data.spaceId;
        console.log("✅ Adding task to space:", data.spaceId);
      }
      if (data.assignedToId && data.assignedToId !== "") {
        const parsedId = parseInt(data.assignedToId);
        if (!isNaN(parsedId)) {
          taskData.assignedToId = parsedId;
          console.log("✅ Parsed assignedToId:", parsedId);
        } else {
          console.error("❌ Failed to parse assignedToId:", data.assignedToId);
        }
      }
      if (data.isRecurring) {
        taskData.isRecurring = true;
        if (data.recurringPattern) taskData.recurringPattern = data.recurringPattern;
        if (data.recurringInterval) taskData.recurringInterval = data.recurringInterval;
        if (data.recurringEndDate) taskData.recurringEndDate = parseInputDateEST(data.recurringEndDate).toISOString();
        if (data.scheduleFrom) taskData.scheduleFrom = data.scheduleFrom;
      }
      
      console.log("📤 Sending taskData:", taskData);
      return apiRequest("POST", "/api/tasks", taskData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
      toast({ title: "Task created successfully" });
      setIsCreateDialogOpen(false);
      form.reset();
    },
    onError: (error: any) => {
      console.error("Task creation error:", error);
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

      // Only add optional fields if they have values
      if (data.description) taskData.description = data.description;

      // Combine date and time if both are provided, using EST timezone
      if (data.dueDate) {
        if (data.dueTime) {
          // Parse as EST datetime
          taskData.dueDate = parseInputDateEST(`${data.dueDate}T${data.dueTime}`).toISOString();
        } else {
          // Parse as EST date, set to end of day (11:59 PM EST)
          taskData.dueDate = parseInputDateEST(`${data.dueDate}T23:59`).toISOString();
        }
      } else {
        // Explicitly clear due date when not provided
        taskData.dueDate = null;
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
      console.error("Task update error:", error);
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
      console.error("Task delete error:", error);
      toast({ 
        title: "Failed to delete task", 
        description: error?.message || "Please try again",
        variant: "destructive" 
      });
    },
  });

  const bulkUpdateMutation = useMutation({
    mutationFn: async ({ ids, data }: { ids: string[], data: any }) => {
      // For now, update tasks one by one as we don't have a bulk endpoint
      // In a real app, you'd want a POST /api/tasks/bulk-update
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

  // Recurring task series mutations
  const updateRecurringSeriesMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      return apiRequest("PATCH", `/api/tasks/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
      toast({ title: "Recurring task updated successfully" });
    },
    onError: (error: any) => {
      toast({ 
        title: "Failed to update recurring task", 
        description: error?.message || "Please try again",
        variant: "destructive" 
      });
    },
  });

  const deleteRecurringSeriesMutation = useMutation({
    mutationFn: async (taskId: string) => {
      return apiRequest("DELETE", `/api/tasks/${taskId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
      toast({ title: "Recurring task series deleted" });
    },
    onError: (error: any) => {
      toast({ 
        title: "Failed to delete recurring task", 
        description: error?.message || "Please try again",
        variant: "destructive" 
      });
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
    e.preventDefault(); // Allow drop
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

  const handleVoiceInput = () => {
    // Check if browser supports speech recognition
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      toast({
        title: "Voice input not supported",
        description: "Please use Chrome or Edge browser for voice input",
        variant: "destructive"
      });
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    recognition.onstart = () => {
      setIsListening(true);
      toast({
        title: "🎤 Listening...",
        description: "Speak your task naturally"
      });
    };

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setAiInput(transcript);
      toast({
        title: "✓ Captured",
        description: `"${transcript}"`
      });
    };

    recognition.onerror = (event: any) => {
      console.error("Speech recognition error:", event.error);
      toast({
        title: "Voice input error",
        description: event.error === 'no-speech' ? "No speech detected. Please try again." : "Failed to capture voice input",
        variant: "destructive"
      });
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.start();
  };

  const updateTaskStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      return apiRequest("PATCH", `/api/tasks/${id}`, { 
        status,
      });
    },
    onMutate: async ({ id, status }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ["/api/tasks"] });
      
      // Snapshot previous value
      const previousTasks = queryClient.getQueryData<Task[]>("/api/tasks");
      
      // Optimistically update
      queryClient.setQueryData<Task[]>("/api/tasks", (old: Task[] | undefined) => {
        if (!old) return old;
        return old.map(t => t.id === id ? { ...t, status } : t);
      });
      
      return { previousTasks };
    },
    onError: (err, { id, status }, context) => {
      // Rollback on error
      if (context?.previousTasks) {
        queryClient.setQueryData<Task[]>("/api/tasks", context.previousTasks);
      }
      toast({ title: "Failed to update task", variant: "destructive" });
    },
    onSettled: () => {
      // Refetch to ensure consistency
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
    },
  });

  const matchesBaseFilters = (task: Task) => {
    if (filterStatus !== "all" && task.status !== filterStatus) return false;
    if (filterPriority !== "all" && task.priority !== filterPriority) return false;
    if (selectedSpaceId !== null && task.spaceId !== selectedSpaceId) return false;
    if (searchQuery.trim() !== '' && !task.title.toLowerCase().includes(searchQuery.toLowerCase()) && !task.description?.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  };

  const completedHiddenByToggle = !showCompleted
    ? tasks.filter((t) => matchesBaseFilters(t) && t.status === "completed").length
    : 0;

  // Memoized filtered tasks for performance
  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      if (!matchesBaseFilters(task)) return false;

      // Hide all completed tasks if toggle is off
      if (!showCompleted && task.status === "completed") return false;
      return true;
    });
  }, [tasks, filterStatus, filterPriority, selectedSpaceId, showCompleted]);

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "urgent": return "bg-red-500";
      case "high": return "bg-orange-500";
      case "normal": return "bg-blue-500";
      case "low": return "bg-gray-400";
      default: return "bg-gray-400";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed": return "bg-green-500";
      case "in_progress": return "bg-blue-500";
      case "review": return "bg-purple-500";
      case "todo": return "bg-gray-500";
      default: return "bg-gray-500";
    }
  };

  const renderKanbanView = () => {
    const columns = [
      { id: "todo", title: "To Do", icon: "📋" },
      { id: "in_progress", title: "In Progress", icon: "⚡" },
      { id: "review", title: "Review", icon: "👀" },
      { id: "completed", title: "Completed", icon: "✅" },
    ];
    
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 h-full p-4 overflow-x-auto">
        {columns.map((column) => {
          const columnTasks = filteredTasks.filter((task) => task.status === column.id);
          
          return (
            <div
              key={column.id}
              className="flex flex-col h-full min-w-[200px] md:min-w-[240px] lg:min-w-[280px] bg-muted/30 rounded-xl border p-3 backdrop-blur-sm"
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, column.id)}
            >
              <div className="mb-4 px-2 py-1 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xl">{column.icon}</span>
                  <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
                    {column.title}
                  </h3>
                  <Badge variant="secondary" className="ml-2 bg-background/50 text-[10px] px-1.5 h-4 min-w-[20px] justify-center">
                    {columnTasks.length}
                  </Badge>
                </div>
                <Button variant="ghost" size="sm" className="h-7 w-7 p-0 opacity-50 hover:opacity-100">
                  <Plus className="w-4 h-4" />
                </Button>
              </div>

              <div className="space-y-3 flex-1 overflow-y-auto pr-1 custom-scrollbar"
                style={{ 
                  borderColor: draggedTask && draggedTask.status !== column.id ? 'hsl(var(--primary) / 0.3)' : 'transparent',
                  backgroundColor: draggedTask && draggedTask.status !== column.id ? 'hsl(var(--primary) / 0.05)' : 'transparent'
                }}
              >
                {columnTasks.map((task) => (
                  <Card
                    key={task.id}
                    draggable
                    onDragStart={() => handleDragStart(task)}
                    onDragEnd={handleDragEnd}
                    className={`hover-elevate transition-all group cursor-grab active:cursor-grabbing border border-muted shadow-sm hover:shadow-md bg-card ${
                      draggedTask?.id === task.id ? 'opacity-50' : ''
                    }`}
                    data-testid={`task-card-${task.id}`}
                    onClick={() => {
                      if (!isDragging) {
                        setSelectedTask(task);
                        setIsDetailSidebarOpen(true);
                      }
                    }}
                  >
                    <CardContent className="p-3 space-y-2">
                      {/* Priority indicator */}
                      <div className="flex items-start justify-between gap-2 mr-8">
                        <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 mt-1.5 ${
                          task.priority === "urgent" ? "bg-red-500" :
                          task.priority === "high" ? "bg-orange-500" :
                          task.priority === "normal" ? "bg-blue-500" : "bg-gray-400"
                        }`} />
                        <h4 className="font-medium text-sm leading-tight flex-1 line-clamp-2">{task.title}</h4>
                      </div>

                      {/* Description preview */}
                      {task.description && (
                        <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                          {task.description}
                        </p>
                      )}

                      {/* Meta info row */}
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <div className="flex items-center gap-2">
                          {task.dueDate && (
                            <div className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {toLocaleDateStringEST(task.dueDate)}
                            </div>
                          )}
                          {task.checklist && task.checklist.length > 0 && (
                            <div className="flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3" />
                              {task.checklist.filter(i => i.completed).length}/{task.checklist.length}
                            </div>
                          )}
                          {task.isRecurring && (
                            <Repeat className="w-3 h-3 text-blue-500" />
                          )}
                        </div>
                        {task.assignedToId && (
                          <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center text-[10px] font-bold text-primary">
                            {users.find(u => u.id === task.assignedToId)?.firstName?.[0] || "?"}
                          </div>
                        )}
                        {/* Delete button */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (confirm(`Delete task "${task.title}"?`)) {
                              deleteTaskMutation.mutate(task.id);
                            }
                          }}
                          className="absolute top-2 right-2 p-1.5 rounded-md bg-destructive/10 hover:bg-destructive/20 text-destructive transition-colors"
                          title="Delete task"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
                {columnTasks.length === 0 && (
                  <div className="text-center py-10 border-2 border-dashed rounded-xl border-muted/20 text-muted-foreground/50 text-xs">
                    Drop tasks here
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const renderCompactView = () => {
    return (
      <div className="border rounded-lg overflow-hidden bg-card">
        {/* Header */}
        <div className="hidden md:grid grid-cols-12 gap-4 px-4 py-2 bg-muted/50 border-b text-xs font-medium text-muted-foreground items-center">
          <div className="col-span-1 flex justify-center">
            <Checkbox
              checked={selectedTaskIds.size === filteredTasks.length && filteredTasks.length > 0}
              onCheckedChange={selectAllTasks}
              className="h-4 w-4"
            />
          </div>
          <div className="col-span-5">TASK</div>
          <div className="col-span-2">STATUS</div>
          <div className="col-span-2">DUE</div>
          <div className="col-span-2 text-right">ASSIGNEE</div>
        </div>

        {/* Task Rows */}
        <div className="divide-y">
          {filteredTasks.map((task) => (
            <div key={task.id} className="group relative">
              <div
                className={`px-3 md:px-4 py-3 cursor-pointer hover:bg-muted/30 transition-colors ${
                  selectedTaskIds.has(task.id) ? "bg-primary/5 hover:bg-primary/10" :
                  selectedTask?.id === task.id ? "bg-muted/50" : ""
                }`}
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
                  <div className={`w-2 h-8 rounded-full flex-shrink-0 ${
                    task.priority === "urgent" ? "bg-red-500" :
                    task.priority === "high" ? "bg-orange-500" :
                    task.priority === "normal" ? "bg-blue-500" : "bg-gray-400"
                  }`} />
                  <div className="flex-1 min-w-0">
                    <span className="font-medium text-sm line-clamp-2">{task.title}</span>
                    {task.description && (
                      <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5 leading-relaxed">
                        {task.description}
                      </p>
                    )}
                    <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                      <span className="capitalize">{task.status.replace("_", " ")}</span>
                      {task.dueDate && <span>{toLocaleDateStringEST(task.dueDate)}</span>}
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
                  <div className="col-span-5 flex items-center gap-3 min-w-0">
                    <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
                      task.priority === "urgent" ? "bg-red-500" :
                      task.priority === "high" ? "bg-orange-500" :
                      task.priority === "normal" ? "bg-blue-500" : "bg-gray-400"
                    }`} />
                    <div className="min-w-0">
                      <span className="line-clamp-2 text-sm font-medium">{task.title}</span>
                      {task.description && (
                        <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5 leading-relaxed">
                          {task.description}
                        </p>
                      )}
                    </div>
                    {task.isRecurring && <Repeat className="w-3.5 h-3.5 text-blue-500 flex-shrink-0" />}
                  </div>

                  <div className="col-span-2">
                    <span className="text-xs capitalize bg-muted/50 px-2 py-1 rounded">{task.status.replace("_", " ")}</span>
                  </div>

                  <div className="col-span-2 text-xs text-muted-foreground">
                    {task.dueDate ? toLocaleDateStringEST(task.dueDate) : "-"}
                  </div>

                  <div className="col-span-2 flex items-center justify-end gap-2">
                    {task.assignedToId ? (
                      <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
                        {users.find(u => u.id === task.assignedToId)?.firstName?.[0] || "?"}
                      </div>
                    ) : (
                      <div className="w-7 h-7 rounded-full border border-dashed flex items-center justify-center text-muted-foreground/30">
                        <User className="w-3 h-3" />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredTasks.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No tasks match the current filters</p>
          </div>
        )}
      </div>
    );
  };

  const renderListView = () => {
    return (
      <div className="space-y-2">
        {filteredTasks.map((task) => (
          <Card
            key={task.id}
            className={`hover-elevate transition-all group cursor-pointer ${
              selectedTaskIds.has(task.id) ? "border-primary bg-primary/5" : ""
            }`}
            data-testid={`task-card-${task.id}`}
            onClick={() => {
              setSelectedTask(task);
              setIsDetailSidebarOpen(true);
            }}
          >
            <CardContent className="p-4 flex items-center gap-4">
              {/* Checkbox */}
              <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                <Checkbox
                  checked={selectedTaskIds.has(task.id)}
                  onCheckedChange={() => toggleTaskSelection(task.id)}
                  onClick={(e) => e.stopPropagation()}
                  className="h-4 w-4"
                />
              </div>

              {/* Priority indicator */}
              <div className={`w-2 h-8 rounded-full flex-shrink-0 ${
                task.priority === "urgent" ? "bg-red-500" :
                task.priority === "high" ? "bg-orange-500" :
                task.priority === "normal" ? "bg-blue-500" : "bg-gray-400"
              }`} />

              {/* Task info */}
              <div className="flex-1 min-w-0">
                <h3 className="font-medium line-clamp-2">{task.title}</h3>
                {task.description && (
                  <p className="text-sm text-muted-foreground line-clamp-2 mt-1 leading-relaxed">
                    {task.description}
                  </p>
                )}
                <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                  {task.dueDate && (
                    <div className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {toLocaleDateStringEST(task.dueDate)}
                    </div>
                  )}
                  {task.checklist && task.checklist.length > 0 && (
                    <div className="flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" />
                      {task.checklist.filter(i => i.completed).length}/{task.checklist.length}
                    </div>
                  )}
                  {task.isRecurring && (
                    <Repeat className="w-3 h-3 text-blue-500" />
                  )}
                </div>
              </div>

              {/* Status dropdown */}
              <Select
                value={task.status}
                onValueChange={(status) => updateTaskStatusMutation.mutate({ id: task.id, status })}
              >
                <SelectTrigger className="w-32" onClick={(e) => e.stopPropagation()} data-testid={`select-status-${task.id}`}>
                  <SelectValue />
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
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary">
                  {users.find(u => u.id === task.assignedToId)?.firstName?.[0] || "?"}
                </div>
              ) : (
                <div className="w-8 h-8 rounded-full border border-dashed flex items-center justify-center text-muted-foreground/30">
                  <User className="w-4 h-4" />
                </div>
              )}
            </CardContent>
          </Card>
        ))}
        {filteredTasks.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No tasks match the current filters</p>
          </div>
        )}
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground">Loading tasks...</p>
      </div>
    );
  }

  return (
    <div className="flex h-full overflow-hidden">
      {/* Left Sidebar - Task Spaces - Hidden on mobile */}
      <div className="hidden md:block w-64 border-r bg-card/50 overflow-y-auto">
        <TaskSpacesSidebar 
          selectedSpaceId={selectedSpaceId}
          onSpaceSelect={setSelectedSpaceId}
        />
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        <div className="p-3 md:p-6 space-y-4 md:space-y-6 flex-1 overflow-y-auto">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <h1 className="text-xl md:text-2xl font-bold">Tasks</h1>
              <p className="text-sm text-muted-foreground mt-1">
                {filteredTasks.length} task{filteredTasks.length !== 1 ? "s" : ""}
                {filterStatus !== "all" && ` • ${filterStatus.replace("_", " ")}`}
                {filterPriority !== "all" && ` • ${filterPriority}`}
              </p>
            </div>

            {/* Search Input */}
            <div className="relative w-full lg:w-72">
              <Input
                placeholder="Search tasks..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              {searchQuery && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute right-1 top-1/2 -translate-y-1/2 h-6 w-6 p-0"
                  onClick={() => setSearchQuery('')}
                >
                  <X className="w-3 h-3" />
                </Button>
              )}
            </div>
            {/* Mobile: open Spaces sidebar */}
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
        
        <div className="flex flex-wrap items-center gap-3">
          {tasksError && (
            <div className="w-full rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm flex items-center justify-between gap-3">
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

          {!tasksError && completedHiddenByToggle > 0 && (
            <div className="w-full rounded-lg border bg-muted/30 px-3 py-2 text-sm flex items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="font-medium">Completed tasks are hidden</div>
                <div className="text-muted-foreground truncate">
                  {completedHiddenByToggle} completed tasks match your current filters.
                </div>
              </div>
              <Button variant="secondary" size="sm" onClick={() => setShowCompleted(true)}>
                Show completed
              </Button>
            </div>
          )}

          {/* Filter Button */}
          <Button
            variant={isFilterPanelOpen ? "default" : "outline"}
            size="sm"
            onClick={() => setIsFilterPanelOpen(!isFilterPanelOpen)}
            className="gap-2"
          >
            <Filter className="w-4 h-4" />
            Filter
            {(filterStatus !== "all" || filterPriority !== "all" || selectedSpaceId !== null) && (
              <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs">
                {(filterStatus !== "all" ? 1 : 0) + (filterPriority !== "all" ? 1 : 0) + (selectedSpaceId !== null ? 1 : 0)}
              </Badge>
            )}
          </Button>

          {/* Collapsible Filter Panel */}
          {isFilterPanelOpen && (
            <div className="w-full flex flex-wrap items-center gap-3 p-3 bg-muted/30 rounded-lg animate-in fade-in slide-in-from-top-2">
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-36" data-testid="select-filter-status">
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
                <SelectTrigger className="w-36" data-testid="select-filter-priority">
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
                <SelectTrigger className="w-40">
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
                className="gap-2"
              >
                {showCompleted ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
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
                    setSearchQuery('');
                  }}
                  className="text-muted-foreground"
                >
                  Clear filters
                </Button>
              )}
            </div>
          )}

          {/* View Mode Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2">
                {viewMode === "kanban" && <LayoutGrid className="w-4 h-4" />}
                {viewMode === "list" && <List className="w-4 h-4" />}
                {viewMode === "compact" && <AlignLeft className="w-4 h-4" />}
                <span className="hidden sm:inline capitalize">{viewMode}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setViewMode("kanban")}>
                <LayoutGrid className="w-4 h-4 mr-2" />
                Kanban
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setViewMode("list")}>
                <List className="w-4 h-4 mr-2" />
                List
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setViewMode("compact")}>
                <AlignLeft className="w-4 h-4 mr-2" />
                Compact
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* More Options Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm">
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
              <DropdownMenuItem onClick={() => setIsRecurringMasterOpen(true)}>
                <List className="w-4 h-4 mr-2" />
                Recurring Tasks Master
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setSelectedSpaceId(null)}>
                <LayoutGrid className="w-4 h-4 mr-2" />
                All Spaces
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSpacesDialogOpen(true)}>
                <ListTodo className="w-4 h-4 mr-2" />
                Manage Spaces
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <div className="flex-1" />

          {/* New Task Button */}
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button data-testid="button-create-task" size="sm">
                <Plus className="w-4 h-4 mr-2" />
                New Task
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto glass-strong">
              <DialogHeader>
                <DialogTitle>Create New Task</DialogTitle>
                <DialogDescription>Add a new task to your workflow</DialogDescription>
              </DialogHeader>
              {/* Predefined Task Templates */}
              <div className="mb-4">
                <label className="text-sm font-medium text-muted-foreground">Quick Templates</label>
                {templates.length > 0 ? (
                  <div className="grid grid-cols-2 gap-2">
                    {templates.map((template) => (
                      <button
                        key={template.id}
                        type="button"
                        onClick={() => applyTemplate(template, form, setSelectedTemplateId)}
                        className={`p-3 text-left border rounded-lg hover:bg-muted/50 transition-colors ${
                          selectedTemplateId === template.id ? 'border-primary bg-primary/5' : ''
                        }`}
                      >
                        <div className="text-sm">
                          <div className="font-medium">{template.name}</div>
                          <div className="text-xs text-muted-foreground">{template.description || template.title}</div>
                        </div>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="text-sm text-muted-foreground">No templates available</div>
                )}
              </div>

              <Form {...form}>
                <form onSubmit={form.handleSubmit((data) => {
                  const templateData = selectedTemplateId
                    ? { ...data, templateId: selectedTemplateId }
                    : data;
                  createTaskMutation.mutate(templateData);
                })} className="space-y-4">
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
                          <FormLabel>Due Date (Optional)</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Input type="date" {...field} data-testid="input-task-due-date" />
                              {field.value && (
                                <button
                                  type="button"
                                  onClick={() => field.onChange("")}
                                  className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 rounded-full hover:bg-muted text-muted-foreground"
                                  title="Clear due date"
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
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
                            <input
                              type="checkbox"
                              checked={field.value || false}
                              onChange={(e) => field.onChange(e.target.checked)}
                              className="h-4 w-4 rounded border-gray-300 mt-1"
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel className="cursor-pointer">
                              🔄 Make this a recurring task
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
                                  <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                      type="radio"
                                      value="due_date"
                                      checked={field.value === "due_date"}
                                      onChange={() => field.onChange("due_date")}
                                      className="h-4 w-4"
                                    />
                                    <div>
                                      <div className="font-medium text-sm">📅 Due Date</div>
                                      <div className="text-xs text-muted-foreground">Next task uses same schedule (e.g., every Monday)</div>
                                    </div>
                                  </label>
                                  <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                      type="radio"
                                      value="completion_date"
                                      checked={field.value === "completion_date"}
                                      onChange={() => field.onChange("completion_date")}
                                      className="h-4 w-4"
                                    />
                                    <div>
                                      <div className="font-medium text-sm">✅ Completion Date</div>
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
                      onClick={() => setIsCreateDialogOpen(false)}
                      data-testid="button-cancel-task"
                    >
                      Cancel
                    </Button>
                    <Button type="submit" disabled={createTaskMutation.isPending} data-testid="button-submit-task">
                      {createTaskMutation.isPending ? "Creating..." : "Create Task"}
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>

          {/* Edit Task Dialog */}
          <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto glass-strong">
              <DialogHeader>
                <DialogTitle>Edit Task</DialogTitle>
                <DialogDescription>Update task details</DialogDescription>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit((data) => editTaskMutation.mutate(data))} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Title *</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Task title" />
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
                          <Textarea {...field} placeholder="Task description" rows={3} />
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
                              <SelectTrigger>
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
                              <SelectTrigger>
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

                  <FormField
                    control={form.control}
                    name="dueDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Due Date (Optional)</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Input type="date" {...field} />
                            {field.value && (
                              <button
                                type="button"
                                onClick={() => field.onChange("")}
                                className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 rounded-full hover:bg-muted text-muted-foreground"
                                title="Clear due date"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="assignedToId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Assign To</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
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
                            <SelectTrigger>
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
                            <SelectTrigger>
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
                            <input
                              type="checkbox"
                              checked={field.value || false}
                              onChange={(e) => field.onChange(e.target.checked)}
                              className="h-4 w-4 rounded border-gray-300 mt-1"
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel className="cursor-pointer">
                              🔄 Make this a recurring task
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
                        setIsEditDialogOpen(false);
                        setEditingTask(null);
                      }}
                    >
                      Cancel
                    </Button>
                    <Button type="submit" disabled={editTaskMutation.isPending}>
                      {editTaskMutation.isPending ? "Updating..." : "Update Task"}
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="flex-1 overflow-auto">
        {viewMode === "kanban" ? renderKanbanView() : viewMode === "compact" ? renderCompactView() : renderListView()}
      </div>
        </div>
      </div>

      <TaskDetailSidebar
        task={selectedTask}
        isOpen={isDetailSidebarOpen}
        onClose={() => {
          setIsDetailSidebarOpen(false);
          setSelectedTask(null);
        }}
      />

      {/* Recurring Task Master List Dialog */}
      <Dialog open={isRecurringMasterOpen} onOpenChange={setIsRecurringMasterOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto glass-strong">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Repeat className="w-5 h-5 text-blue-500" />
              Recurring Task Master List
            </DialogTitle>
            <DialogDescription>
              Manage all your recurring tasks in one place. Edit patterns, intervals, or delete series.
            </DialogDescription>
          </DialogHeader>
          
          {/* Filter recurring tasks */}
          <div className="flex items-center gap-3 pb-3 border-b">
            <Input
              placeholder="Search recurring tasks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1"
            />
            <Button variant="outline" size="sm" onClick={() => setSearchQuery('')}>
              Clear
            </Button>
          </div>
          
          {/* Recurring tasks list */}
          <div className="space-y-3 max-h-[60vh] overflow-y-auto">
            {(() => {
              const recurringTasks = tasks.filter(t => t.isRecurring);
              const filteredRecurring = recurringTasks.filter(task =>
                task.title.toLowerCase().includes(searchQuery.toLowerCase())
              );
              
              if (filteredRecurring.length === 0) {
                return (
                  <div className="text-center py-12 text-muted-foreground">
                    <Repeat className="w-12 h-12 mx-auto mb-3 opacity-30" />
                    <p className="font-medium">No recurring tasks found</p>
                    <p className="text-sm mt-1">
                      {recurringTasks.length === 0 
                        ? "Create a task with recurring enabled to see it here"
                        : "Try a different search term"}
                    </p>
                  </div>
                );
              }
              
              return filteredRecurring.map(task => (
                <Card key={task.id} className="hover:bg-muted/30 transition-colors">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-medium line-clamp-2">{task.title}</h4>
                          <Badge variant="outline" className="text-xs">
                            {task.recurringPattern || "weekly"}
                          </Badge>
                          {task.recurringInterval && task.recurringInterval > 1 && (
                            <Badge variant="secondary" className="text-xs">
                              Every {task.recurringInterval}
                            </Badge>
                          )}
                        </div>
                        
                        {task.description && (
                          <p className="text-sm text-muted-foreground line-clamp-2 mb-2 leading-relaxed">
                            {task.description}
                          </p>
                        )}
                        
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          {task.dueDate && (
                            <div className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              Next: {toLocaleDateStringEST(task.dueDate)}
                            </div>
                          )}
                          {task.assignedToId && (
                            <div className="flex items-center gap-1">
                              <User className="w-3 h-3" />
                              {users.find(u => u.id === task.assignedToId)?.firstName || "Unassigned"}
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        {/* Toggle recurring */}
                        <Button
                          variant={task.isRecurring ? "default" : "outline"}
                          size="sm"
                          onClick={() => updateRecurringSeriesMutation.mutate({
                            id: task.id,
                            data: { isRecurring: !task.isRecurring }
                          })}
                          className="gap-2"
                        >
                          {task.isRecurring ? (
                            <>
                              <CheckCircle2 className="w-4 h-4" />
                              Active
                            </>
                          ) : (
                            <>
                              <X className="w-4 h-4" />
                              Paused
                            </>
                          )}
                        </Button>
                        
                        {/* Edit button */}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            handleEditTask(task);
                            setIsRecurringMasterOpen(false);
                          }}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        
                        {/* Delete button */}
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-destructive hover:bg-destructive/10"
                          onClick={() => {
                            if (confirm(`Delete this recurring task and all future occurrences?`)) {
                              deleteRecurringSeriesMutation.mutate(task.id);
                            }
                          }}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ));
            })()}
          </div>
          
          <div className="flex justify-end pt-4 border-t">
            <Button variant="outline" onClick={() => setIsRecurringMasterOpen(false)}>
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Bulk Action Bar */}
      {selectedTaskIds.size > 0 && (
        <div className="fixed bottom-[85px] md:bottom-6 left-1/2 -translate-x-1/2 z-50 bg-background border shadow-2xl rounded-full px-6 py-3 flex items-center gap-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
          <div className="flex items-center gap-3 border-r pr-6">
            <span className="text-sm font-bold text-primary">{selectedTaskIds.size} selected</span>
            <Button variant="ghost" size="sm" onClick={() => setSelectedTaskIds(new Set())} className="h-7 text-xs">
              Clear
            </Button>
          </div>
          
          <div className="flex items-center gap-2">
            {selectedTaskIds.size >= 1 && (
              <Button
                variant="outline"
                size="sm"
                className="h-9 rounded-full text-xs"
                onClick={() => {
                  const selectedId = Array.from(selectedTaskIds)[0];
                  const task = tasks.find((t) => t.id === selectedId);
                  if (!task) {
                    toast({
                      title: "Couldn't find that task",
                      description: "Please refresh and try again.",
                      variant: "destructive",
                    });
                    return;
                  }
                  handleEditTask(task);
                }}
              >
                <Edit className="w-4 h-4 mr-2" />
                Edit Name
              </Button>
            )}

            <Select onValueChange={(status) => bulkUpdateMutation.mutate({ ids: Array.from(selectedTaskIds), data: { status } })}>
              <SelectTrigger className="h-9 w-32 rounded-full text-xs">
                <SelectValue placeholder="Update Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todo">To Do</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="review">Review</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
              </SelectContent>
            </Select>

            <Select onValueChange={(priority) => bulkUpdateMutation.mutate({ ids: Array.from(selectedTaskIds), data: { priority } })}>
              <SelectTrigger className="h-9 w-32 rounded-full text-xs">
                <SelectValue placeholder="Update Priority" />
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
              className="h-9 w-9 rounded-full text-destructive hover:bg-destructive/10"
              onClick={() => {
                if (confirm(`Delete ${selectedTaskIds.size} tasks?`)) {
                  bulkDeleteMutation.mutate(Array.from(selectedTaskIds));
                }
              }}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

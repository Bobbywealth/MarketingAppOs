import { useState, useEffect } from "react";
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
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { Plus, Calendar, User, ListTodo, KanbanSquare, Filter, Sparkles, Loader2, Edit, Trash2, Mic, MicOff, MessageSquare, X, Repeat } from "lucide-react";
import type { Task, InsertTask, Client, User as UserType } from "@shared/schema";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { TaskSpacesSidebar } from "@/components/TaskSpacesSidebar";
import { ConversationalTaskChat } from "@/components/ConversationalTaskChat";
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

export default function TasksPage() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [viewMode, setViewMode] = useState<"list" | "kanban" | "compact">("compact");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterPriority, setFilterPriority] = useState<string>("all");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [aiInput, setAiInput] = useState("");
  const [isAiParsing, setIsAiParsing] = useState(false);
  const [draggedTask, setDraggedTask] = useState<Task | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [selectedSpaceId, setSelectedSpaceId] = useState<string | null>(null);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isDetailSidebarOpen, setIsDetailSidebarOpen] = useState(false);
  const [selectedTaskIds, setSelectedTaskIds] = useState<Set<string>>(new Set());
  const [expandedTaskId, setExpandedTaskId] = useState<string | null>(null);
  const [spacesDialogOpen, setSpacesDialogOpen] = useState(false);
  // Load showCompleted preference from localStorage.
  // Default to TRUE so "previous tasks" (mostly completed) aren't accidentally hidden.
  const [showCompleted, setShowCompleted] = useState(() => {
    const saved = localStorage.getItem('tasks-show-completed');
    try {
      return saved !== null ? JSON.parse(saved) : true;
    } catch {
      return true;
    }
  });

  // Save showCompleted preference to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('tasks-show-completed', JSON.stringify(showCompleted));
  }, [showCompleted]);

  const { data: tasks = [], isLoading, error: tasksError } = useQuery<Task[]>({
    queryKey: ["/api/tasks"],
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

  const { data: spaces = [] } = useQuery<any[]>({
    queryKey: ["/api/task-spaces"],
    retry: false,
  });

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
  };

  const handleAiQuickAdd = async () => {
    if (!aiInput.trim()) return;

    setIsAiParsing(true);
    try {
      // Parse with AI
      const parseRes = await apiRequest("POST", "/api/tasks/parse-ai", { input: aiInput });
      const parseData = await parseRes.json();
      
      if (!parseData.success) {
        throw new Error("Failed to parse task");
      }

      // Format the task data - convert date to ISO string if present
      const taskData = {
        ...parseData.taskData,
        dueDate: parseData.taskData.dueDate 
          ? new Date(parseData.taskData.dueDate).toISOString() 
          : undefined,
      };

      // Create the task directly
      await apiRequest("POST", "/api/tasks", taskData);
      
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
      toast({ 
        title: "✨ Task created with AI!", 
        description: `Created: "${taskData.title}"` 
      });
      setAiInput("");
    } catch (error: any) {
      toast({ 
        title: "Failed to create task", 
        description: error.message || "AI parsing failed",
        variant: "destructive" 
      });
    } finally {
      setIsAiParsing(false);
    }
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
      toast({ title: "✅ Task moved successfully" });
    },
    onError: () => {
      toast({ title: "Failed to update task", variant: "destructive" });
    },
  });

  const matchesBaseFilters = (task: Task) => {
    if (filterStatus !== "all" && task.status !== filterStatus) return false;
    if (filterPriority !== "all" && task.priority !== filterPriority) return false;
    if (selectedSpaceId !== null && task.spaceId !== selectedSpaceId) return false;
    return true;
  };

  const completedHiddenByToggle = !showCompleted
    ? tasks.filter((t) => matchesBaseFilters(t) && t.status === "completed").length
    : 0;

  const filteredTasks = tasks.filter((task) => {
    if (!matchesBaseFilters(task)) return false;
    
    // Hide all completed tasks if toggle is off
    if (!showCompleted && task.status === "completed") return false;
    return true;
  });

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "urgent": return "bg-gradient-to-r from-red-500 to-red-600 text-white";
      case "high": return "bg-gradient-to-r from-orange-500 to-orange-600 text-white";
      case "normal": return "bg-gradient-to-r from-blue-500 to-blue-600 text-white";
      case "low": return "bg-gradient-to-r from-gray-500 to-gray-600 text-white";
      default: return "bg-gradient-to-r from-gray-500 to-gray-600 text-white";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed": return "bg-gradient-to-r from-green-500 to-emerald-600 text-white";
      case "in_progress": return "bg-gradient-to-r from-blue-500 to-blue-600 text-white";
      case "review": return "bg-gradient-to-r from-purple-500 to-purple-600 text-white";
      case "todo": return "bg-gradient-to-r from-gray-500 to-gray-600 text-white";
      default: return "bg-gradient-to-r from-gray-500 to-gray-600 text-white";
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 h-full p-4 overflow-x-auto">
        {columns.map((column) => {
          const columnTasks = filteredTasks.filter((task) => task.status === column.id);
          
          return (
            <div 
              key={column.id} 
              className="flex flex-col h-full min-w-[280px] bg-muted/30 rounded-xl border p-3 backdrop-blur-sm"
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
                    className={`hover-elevate transition-all group cursor-grab active:cursor-grabbing border-none shadow-sm hover:shadow-md bg-card/80 backdrop-blur-md border border-white/10 dark:border-white/5 ${
                      draggedTask?.id === task.id ? 'opacity-50' : ''
                    }`}
                    data-testid={`task-card-${task.id}`}
                    onClick={() => {
                      setSelectedTask(task);
                      setIsDetailSidebarOpen(true);
                    }}
                  >
                    <CardHeader className="p-3 space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <h4 className="font-semibold text-sm leading-tight flex-1">{task.title}</h4>
                      </div>
                      
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge className={`${getPriorityColor(task.priority)} text-[10px] px-1.5 h-5`} variant="outline">
                          {task.priority.toUpperCase()}
                        </Badge>
                        {task.isRecurring && (
                          <div className="flex items-center gap-1 text-[10px] font-medium text-blue-600 bg-blue-50 dark:bg-blue-950/30 px-1.5 py-0.5 rounded-full border border-blue-100 dark:border-blue-900">
                            <Repeat className="w-2.5 h-2.5" />
                            {task.recurringPattern}
                          </div>
                        )}
                      </div>

                      <div className="flex items-center justify-between mt-1 pt-2 border-t border-muted/30">
                        <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
                          {task.dueDate && (
                            <div className="flex items-center gap-1">
                              <Calendar className="w-2.5 h-2.5" />
                              {toLocaleDateStringEST(task.dueDate)}
                            </div>
                          )}
                          {task.checklist && task.checklist.length > 0 && (
                            <div className="flex items-center gap-1">
                              <CheckCircle2 className="w-2.5 h-2.5" />
                              {task.checklist.filter(i => i.completed).length}/{task.checklist.length}
                            </div>
                          )}
                        </div>
                        <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center text-[10px] font-bold text-primary">
                          {users.find(u => u.id === task.assignedToId)?.firstName?.[0] || "?"}
                        </div>
                      </div>
                    </CardHeader>
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
        {/* Header - Hidden on mobile, shown on desktop */}
        <div className="hidden md:grid grid-cols-12 gap-4 px-4 py-2 bg-muted/50 border-b text-xs font-medium text-muted-foreground items-center">
          <div className="col-span-1 flex justify-center">
            <Checkbox 
              checked={selectedTaskIds.size === filteredTasks.length && filteredTasks.length > 0}
              onCheckedChange={selectAllTasks}
              className="h-3 w-3 md:h-4 md:w-4"
            />
          </div>
          <div className="col-span-4">TASK NAME</div>
          <div className="col-span-2">STATUS</div>
          <div className="col-span-2">PRIORITY</div>
          <div className="col-span-2">DUE DATE</div>
          <div className="col-span-1 text-right pr-4">ASSIGNEE</div>
        </div>
        
        {/* Task Rows */}
        <div className="divide-y">
          {filteredTasks.map((task) => (
            <div key={task.id} className="group relative">
              {/* Compact Row - Responsive layout */}
              <div 
                className={`px-3 md:px-4 py-3 md:py-2.5 cursor-pointer hover:bg-muted/30 transition-colors ${
                  selectedTaskIds.has(task.id) ? "bg-primary/5 hover:bg-primary/10" : 
                  selectedTask?.id === task.id ? "bg-muted/50" : ""
                }`}
                onClick={() => {
                  setSelectedTask(task);
                  setIsDetailSidebarOpen(true);
                }}
                data-testid={`task-row-${task.id}`}
              >
                {/* Mobile Layout - Stacked */}
                <div className="md:hidden space-y-2">
                  <div className="flex items-center gap-2">
                    <Checkbox 
                      checked={selectedTaskIds.has(task.id)}
                      onCheckedChange={() => toggleTaskSelection(task.id)}
                      onClick={(e) => e.stopPropagation()}
                      className="mr-1 h-3 w-3 md:h-4 md:w-4"
                    />
                    <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${getPriorityColor(task.priority)}`} />
                    <span className="font-medium text-sm flex-1">{task.title}</span>
                    {task.isRecurring && (
                      <Repeat className="w-3.5 h-3.5 text-blue-500 flex-shrink-0" title={`Recurring: ${task.recurringPattern}`} />
                    )}
                  </div>
                  <div className="flex items-center gap-2 flex-wrap pl-7">
                    <Badge className={`${getStatusColor(task.status)} text-xs`} variant="secondary">
                      {task.status.replace("_", " ")}
                    </Badge>
                    <Badge className={`${getPriorityColor(task.priority)} text-xs`} variant="secondary">
                      {task.priority}
                    </Badge>
                    {task.dueDate && (
                      <span className="text-xs text-muted-foreground">
                        {toLocaleDateStringEST(task.dueDate)}
                      </span>
                    )}
                  </div>
                </div>

                {/* Desktop Layout - Grid */}
                <div className="hidden md:grid grid-cols-12 gap-4 items-center">
                  <div className="col-span-1 flex justify-center">
                    <Checkbox 
                      checked={selectedTaskIds.has(task.id)}
                      onCheckedChange={() => toggleTaskSelection(task.id)}
                      onClick={(e) => e.stopPropagation()}
                      className="h-3 w-3 md:h-4 md:w-4"
                    />
                  </div>
                  <div className="col-span-4 flex items-center gap-3 min-w-0">
                    <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
                      task.status === "in_progress" ? "animate-pulse" : ""
                    } ${getPriorityColor(task.priority)}`} />
                    <span className="truncate text-sm font-semibold tracking-tight group-hover:text-primary transition-colors">
                      {task.title}
                    </span>
                    {task.isRecurring && (
                      <Repeat className="w-3.5 h-3.5 text-blue-500 flex-shrink-0 opacity-70" title={`Recurring: ${task.recurringPattern}`} />
                    )}
                  </div>
                  
                  <div className="col-span-2">
                    <Badge className={`${getStatusColor(task.status)} text-[10px] uppercase tracking-wide px-1.5 h-5`} variant="outline">
                      {task.status.replace("_", " ")}
                    </Badge>
                  </div>
                  
                  <div className="col-span-2">
                    <Badge className={`${getPriorityColor(task.priority)} text-[10px] uppercase tracking-wide px-1.5 h-5`} variant="outline">
                      {task.priority}
                    </Badge>
                  </div>
                  
                  <div className="col-span-2 text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                    {task.dueDate && <Calendar className="w-3 h-3 opacity-50" />}
                    {task.dueDate ? toLocaleDateStringEST(task.dueDate) : "-"}
                  </div>
                  
                  <div className="col-span-1 flex items-center justify-end pr-2">
                    {task.assignedToId ? (
                      <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-[10px] font-bold text-primary border border-primary/20">
                        {users.find(u => u.id === task.assignedToId)?.firstName?.[0] || "?"}
                      </div>
                    ) : (
                      <div className="w-6 h-6 rounded-full border border-dashed flex items-center justify-center text-muted-foreground/30">
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
      <div className="space-y-3">
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
            <CardContent className="p-6 relative">
              <div className="absolute left-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                <Checkbox 
                  checked={selectedTaskIds.has(task.id)}
                  onCheckedChange={() => toggleTaskSelection(task.id)}
                  onClick={(e) => e.stopPropagation()}
                  className="h-4 w-4"
                />
              </div>
              <div className={`flex items-start justify-between gap-4 transition-transform ${selectedTaskIds.has(task.id) ? "translate-x-6" : "group-hover:translate-x-6"}`}>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-2 flex-wrap">
                    <h3 className="font-semibold">{task.title}</h3>
                    {task.isRecurring && (
                      <Badge variant="outline" className="bg-blue-500/10 border-blue-500/30 text-blue-700 dark:text-blue-400">
                        <Repeat className="w-3 h-3 mr-1" />
                        {task.recurringPattern}
                      </Badge>
                    )}
                    <Badge className={getStatusColor(task.status)} variant="secondary">
                      {task.status.replace("_", " ")}
                    </Badge>
                    <Badge className={getPriorityColor(task.priority)} variant="secondary">
                      {task.priority}
                    </Badge>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 px-2 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => handleEditTask(task)}
                    >
                      <Edit className="w-4 h-4 mr-1" />
                      Edit
                    </Button>
                  </div>
                  {task.description && (
                    <p className="text-sm text-muted-foreground mb-3">{task.description}</p>
                  )}
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    {task.dueDate && (
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        Due: {toLocaleDateStringEST(task.dueDate)}
                      </div>
                    )}
                    {task.assignedToId && (
                      <div className="flex items-center gap-1">
                        <User className="w-4 h-4" />
                        Assigned
                      </div>
                    )}
                  </div>
                </div>
                <Select
                  value={task.status}
                  onValueChange={(status) => updateTaskStatusMutation.mutate({ id: task.id, status })}
                >
                  <SelectTrigger className="w-40" data-testid={`select-status-${task.id}`}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todo">To Do</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="review">Review</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
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
              <h1 className="text-xl md:text-2xl lg:text-3xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                Task Management
              </h1>
              <p className="text-sm md:text-base text-muted-foreground mt-1">Organize and track your team's tasks</p>
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

          <div className="flex items-center gap-2 rounded-lg border bg-card p-1">
            <Button
              variant={viewMode === "compact" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("compact")}
              data-testid="button-view-compact"
            >
              <ListTodo className="w-4 h-4 mr-2" />
              Compact
            </Button>
            <Button
              variant={viewMode === "list" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("list")}
              data-testid="button-view-list"
            >
              <ListTodo className="w-4 h-4 mr-2" />
              List
            </Button>
            <Button
              variant={viewMode === "kanban" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("kanban")}
              data-testid="button-view-kanban"
            >
              <KanbanSquare className="w-4 h-4 mr-2" />
              Kanban
            </Button>
          </div>

          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-40" data-testid="select-filter-status">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue />
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
            <SelectTrigger className="w-40" data-testid="select-filter-priority">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Priority</SelectItem>
              <SelectItem value="low">Low</SelectItem>
              <SelectItem value="normal">Normal</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="urgent">Urgent</SelectItem>
            </SelectContent>
          </Select>

          <Button
            variant={showCompleted ? "outline" : "secondary"}
            size="default"
            onClick={() => setShowCompleted(!showCompleted)}
            data-testid="button-toggle-completed"
            className="gap-2"
          >
            {showCompleted ? "✅ Hide Completed" : "👁️ Show Completed"}
          </Button>

          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button data-testid="button-create-task">
                <Plus className="w-4 h-4 mr-2" />
                New Task
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto glass-strong">
              <DialogHeader>
                <DialogTitle>Create New Task</DialogTitle>
                <DialogDescription>Add a new task to your workflow</DialogDescription>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit((data) => createTaskMutation.mutate(data))} className="space-y-4">
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
                            {spaces.map((space) => (
                              <SelectItem key={space.id} value={space.id}>
                                {space.name}
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
                        <FormLabel>Due Date</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
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
                            {spaces.map((space) => (
                              <SelectItem key={space.id} value={space.id}>
                                {space.name}
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

      {/* Conversational AI Task Assistant - Positioned outside flex container */}
      <>
        {!isChatOpen ? (
          <Button
            size="lg"
            onClick={() => setIsChatOpen(true)}
            className="fixed bottom-[80px] md:bottom-6 right-6 z-[9999] rounded-full w-14 h-14 md:w-16 md:h-16 shadow-2xl hover:scale-110 transition-transform bg-gradient-to-r from-primary to-purple-600"
          >
            <Sparkles className="w-6 h-6 md:w-7 md:h-7" />
          </Button>
        ) : (
          <ConversationalTaskChat
            isOpen={isChatOpen}
            onClose={() => setIsChatOpen(false)}
            onTaskCreated={() => {
              queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
            }}
          />
        )}
      </>

      <TaskDetailSidebar
        task={selectedTask}
        isOpen={isDetailSidebarOpen}
        onClose={() => {
          setIsDetailSidebarOpen(false);
          setSelectedTask(null);
        }}
      />

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

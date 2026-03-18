import { useMemo, useState } from "react";
import { format } from "date-fns";
import { useMutation, useQuery } from "@tanstack/react-query";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  BarChart,
  Bar,
} from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { CalendarDays, Workflow, Plus, BarChart3, CheckCircle2, ListChecks, Trash2 } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";
import { Textarea } from "@/components/ui/textarea";

type WorkflowViewMode = "checklist" | "analytics" | "flow";
type WorkflowStatus = "todo" | "in_progress" | "review" | "completed";
type WorkflowPriority = "low" | "normal" | "high" | "urgent";
type RecurrencePattern = "daily" | "weekly" | "monthly" | "yearly";

type ChecklistItem = {
  id: string;
  text: string;
  completed: boolean;
};

type WorkflowTask = {
  id: string;
  title: string;
  description: string | null;
  status: WorkflowStatus;
  priority: WorkflowPriority;
  dueDate: string | null;
  createdAt: string;
  completedAt: string | null;
  clientId: string | null;
  checklist: ChecklistItem[] | null;
  taskProgress: number | null;
  isRecurring: boolean | null;
  recurringPattern: RecurrencePattern | null;
  recurringInterval: number | null;
};

const statusLabel: Record<WorkflowStatus, string> = {
  todo: "To Do",
  in_progress: "In Progress",
  review: "Review",
  completed: "Completed",
};

const statusVariant: Record<WorkflowStatus, "secondary" | "default" | "outline"> = {
  todo: "outline",
  in_progress: "secondary",
  review: "secondary",
  completed: "default",
};

function dateKey(date: Date) {
  return date.toISOString().slice(0, 10);
}

function normalizeChecklist(value: unknown): ChecklistItem[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((item) => item && typeof item === "object")
    .map((item: any) => ({
      id: String(item.id ?? crypto.randomUUID()),
      text: String(item.text ?? "").trim(),
      completed: Boolean(item.completed),
    }))
    .filter((item) => item.text.length > 0);
}

function computeProgress(task: WorkflowTask): number {
  const checklist = normalizeChecklist(task.checklist);
  if (checklist.length > 0) {
    const completed = checklist.filter((item) => item.completed).length;
    return Math.round((completed / checklist.length) * 100);
  }

  if (task.status === "completed") return 100;
  if (typeof task.taskProgress === "number") return Math.max(0, Math.min(100, task.taskProgress));
  return 0;
}

export default function ClientDailyWorkflow() {
  const { toast } = useToast();
  const { user } = useAuth();

  const [viewMode, setViewMode] = useState<WorkflowViewMode>("checklist");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<WorkflowStatus>("todo");
  const [priority, setPriority] = useState<WorkflowPriority>("normal");
  const [dueDate, setDueDate] = useState(dateKey(new Date()));
  const [checklistText, setChecklistText] = useState("");
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurringPattern, setRecurringPattern] = useState<RecurrencePattern>("daily");
  const [recurringInterval, setRecurringInterval] = useState("1");

  const { data: tasks = [], isLoading } = useQuery<WorkflowTask[]>({
    queryKey: ["/api/tasks"],
  });

  const clientTasks = useMemo(() => {
    if (!Array.isArray(tasks)) return [];
    if (!user?.clientId) return tasks;
    return tasks.filter((task) => !task.clientId || task.clientId === user.clientId);
  }, [tasks, user?.clientId]);

  const todayKey = dateKey(new Date());

  const todayTasks = useMemo(() => {
    return clientTasks.filter((task) => {
      if (!task.dueDate) return false;
      return dateKey(new Date(task.dueDate)) === todayKey;
    });
  }, [clientTasks, todayKey]);

  const overdueOpenTasks = useMemo(() => {
    const now = new Date();
    return clientTasks.filter((task) => {
      if (!task.dueDate || task.status === "completed") return false;
      return new Date(task.dueDate) < now && dateKey(new Date(task.dueDate)) !== todayKey;
    });
  }, [clientTasks, todayKey]);

  const visibleTasks = useMemo(() => [...todayTasks, ...overdueOpenTasks], [todayTasks, overdueOpenTasks]);

  const completedCount = visibleTasks.filter((task) => task.status === "completed").length;
  const overallProgress = visibleTasks.length > 0
    ? Math.round(visibleTasks.reduce((sum, task) => sum + computeProgress(task), 0) / visibleTasks.length)
    : 0;

  const timelineData = useMemo(() => {
    const grouped = clientTasks.reduce<Record<string, { key: string; day: string; total: number; completed: number }>>((acc, task) => {
      if (!task.dueDate) return acc;
      const key = dateKey(new Date(task.dueDate));
      if (!acc[key]) {
        acc[key] = {
          key,
          day: format(new Date(task.dueDate), "MMM d"),
          total: 0,
          completed: 0,
        };
      }
      acc[key].total += 1;
      if (task.status === "completed") acc[key].completed += 1;
      return acc;
    }, {});

    return Object.values(grouped)
      .sort((a, b) => a.key.localeCompare(b.key))
      .map((entry) => ({
        day: entry.day,
        completionRate: entry.total > 0 ? Math.round((entry.completed / entry.total) * 100) : 0,
        total: entry.total,
      }));
  }, [clientTasks]);

  const channelData = useMemo(() => {
    const recurring = clientTasks.filter((task) => task.isRecurring).length;
    const nonRecurring = clientTasks.length - recurring;
    const overdue = overdueOpenTasks.length;
    const dueToday = todayTasks.length;

    return [
      { name: "Due Today", total: dueToday },
      { name: "Overdue", total: overdue },
      { name: "Recurring", total: recurring },
      { name: "One-time", total: nonRecurring },
    ];
  }, [clientTasks, overdueOpenTasks.length, todayTasks.length]);

  const statusFlow = useMemo(() => {
    const counts: Record<WorkflowStatus, number> = {
      todo: 0,
      in_progress: 0,
      review: 0,
      completed: 0,
    };

    visibleTasks.forEach((task) => {
      counts[task.status] += 1;
    });

    return counts;
  }, [visibleTasks]);

  const createTaskMutation = useMutation({
    mutationFn: async () => {
      const checklist = checklistText
        .split("\n")
        .map((item) => item.trim())
        .filter(Boolean)
        .map((text) => ({ id: crypto.randomUUID(), text, completed: false }));

      const interval = Math.max(1, Number(recurringInterval) || 1);
      const payload: any = {
        title: title.trim(),
        description: description.trim() || null,
        status,
        priority,
        dueDate: dueDate ? new Date(`${dueDate}T23:59:59`).toISOString() : null,
        checklist,
        taskProgress: checklist.length > 0 ? 0 : status === "completed" ? 100 : 0,
        isRecurring,
      };

      if (isRecurring) {
        payload.recurringPattern = recurringPattern;
        payload.recurringInterval = interval;
      }

      const response = await apiRequest("POST", "/api/tasks", payload);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
      setTitle("");
      setDescription("");
      setStatus("todo");
      setPriority("normal");
      setChecklistText("");
      setIsRecurring(false);
      setRecurringPattern("daily");
      setRecurringInterval("1");
      toast({ title: "Daily workflow task created" });
    },
    onError: (error: Error) => {
      toast({ title: "Failed to create task", description: error.message, variant: "destructive" });
    },
  });

  const updateTaskMutation = useMutation({
    mutationFn: async ({ taskId, updates }: { taskId: string; updates: Partial<WorkflowTask> }) => {
      await apiRequest("PATCH", `/api/tasks/${taskId}`, updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
    },
    onError: (error: Error) => {
      toast({ title: "Update failed", description: error.message, variant: "destructive" });
    },
  });

  const deleteTaskMutation = useMutation({
    mutationFn: async (taskId: string) => {
      await apiRequest("DELETE", `/api/tasks/${taskId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
      toast({ title: "Task deleted" });
    },
    onError: (error: Error) => {
      toast({ title: "Delete failed", description: error.message, variant: "destructive" });
    },
  });

  const handleCreateWorkflow = () => {
    if (!title.trim()) return;
    createTaskMutation.mutate();
  };

  const toggleTaskComplete = (task: WorkflowTask) => {
    const nextStatus: WorkflowStatus = task.status === "completed" ? "todo" : "completed";
    updateTaskMutation.mutate({
      taskId: task.id,
      updates: {
        status: nextStatus,
        taskProgress: nextStatus === "completed" ? 100 : 0,
      } as any,
    });
  };

  const toggleChecklistItem = (task: WorkflowTask, checklistItemId: string) => {
    const checklist = normalizeChecklist(task.checklist).map((item) =>
      item.id === checklistItemId ? { ...item, completed: !item.completed } : item,
    );
    const completed = checklist.filter((item) => item.completed).length;
    const nextProgress = checklist.length > 0 ? Math.round((completed / checklist.length) * 100) : 0;
    const nextStatus: WorkflowStatus = nextProgress === 100 ? "completed" : task.status === "completed" ? "in_progress" : task.status;

    updateTaskMutation.mutate({
      taskId: task.id,
      updates: {
        checklist,
        taskProgress: nextProgress,
        status: nextStatus,
      } as any,
    });
  };

  return (
    <div className="min-h-full gradient-mesh">
      <div className="max-w-7xl mx-auto p-6 lg:p-8 xl:p-12 space-y-8">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-4xl font-bold tracking-tight text-gradient-purple">Client Daily Workflow</h1>
            <p className="text-lg text-muted-foreground">Daily checklist + recurring tasks + progress analytics in one place.</p>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant="secondary" className="w-fit text-sm py-1 px-3">
              <CalendarDays className="w-4 h-4 mr-2" />
              {format(new Date(), "EEEE, MMM d")}
            </Badge>
            <div className="inline-flex rounded-md border bg-card p-1">
              <Button size="sm" variant={viewMode === "checklist" ? "default" : "ghost"} onClick={() => setViewMode("checklist")}>Checklist</Button>
              <Button size="sm" variant={viewMode === "analytics" ? "default" : "ghost"} onClick={() => setViewMode("analytics")}>Analytics</Button>
              <Button size="sm" variant={viewMode === "flow" ? "default" : "ghost"} onClick={() => setViewMode("flow")}>Flow</Button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          <Card className="border-0 shadow-lg"><CardContent className="pt-6"><p className="text-xs text-muted-foreground">Today + Overdue</p><p className="text-3xl font-bold">{visibleTasks.length}</p></CardContent></Card>
          <Card className="border-0 shadow-lg"><CardContent className="pt-6"><p className="text-xs text-muted-foreground">Completed</p><p className="text-3xl font-bold">{completedCount}</p></CardContent></Card>
          <Card className="border-0 shadow-lg"><CardContent className="pt-6"><p className="text-xs text-muted-foreground">Recurring Active</p><p className="text-3xl font-bold">{clientTasks.filter((task) => task.isRecurring).length}</p></CardContent></Card>
          <Card className="border-0 shadow-lg"><CardContent className="pt-6"><p className="text-xs text-muted-foreground">Daily Completion</p><p className="text-3xl font-bold">{overallProgress}%</p><Progress value={overallProgress} className="mt-2" /></CardContent></Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-1 border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Plus className="w-5 h-5" /> Add Daily Item</CardTitle>
              <CardDescription>Create one-time or recurring checklist tasks.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="workflow-title">Task title</Label>
                <Input id="workflow-title" placeholder="Ex: Check campaign performance" value={title} onChange={(event) => setTitle(event.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="workflow-description">Description</Label>
                <Textarea id="workflow-description" placeholder="Optional context" value={description} onChange={(event) => setDescription(event.target.value)} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select value={status} onValueChange={(value) => setStatus(value as WorkflowStatus)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todo">To Do</SelectItem>
                      <SelectItem value="in_progress">In Progress</SelectItem>
                      <SelectItem value="review">Review</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Priority</Label>
                  <Select value={priority} onValueChange={(value) => setPriority(value as WorkflowPriority)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="normal">Normal</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="urgent">Urgent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="workflow-due">Due date</Label>
                <Input id="workflow-due" type="date" value={dueDate} onChange={(event) => setDueDate(event.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="workflow-checklist">Checklist items (one per line)</Label>
                <Textarea
                  id="workflow-checklist"
                  placeholder={"Review spend pacing\nCheck yesterday leads\nConfirm approvals"}
                  value={checklistText}
                  onChange={(event) => setChecklistText(event.target.value)}
                />
              </div>

              <div className="rounded-md border p-3 space-y-3">
                <div className="flex items-center justify-between">
                  <Label>Recurring task</Label>
                  <Button type="button" size="sm" variant={isRecurring ? "default" : "outline"} onClick={() => setIsRecurring((current) => !current)}>
                    {isRecurring ? "Enabled" : "Disabled"}
                  </Button>
                </div>
                {isRecurring && (
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label>Pattern</Label>
                      <Select value={recurringPattern} onValueChange={(value) => setRecurringPattern(value as RecurrencePattern)}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="daily">Daily</SelectItem>
                          <SelectItem value="weekly">Weekly</SelectItem>
                          <SelectItem value="monthly">Monthly</SelectItem>
                          <SelectItem value="yearly">Yearly</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="workflow-interval">Every</Label>
                      <Input id="workflow-interval" type="number" min={1} value={recurringInterval} onChange={(event) => setRecurringInterval(event.target.value)} />
                    </div>
                  </div>
                )}
              </div>

              <Button className="w-full" onClick={handleCreateWorkflow} disabled={!title.trim() || createTaskMutation.isPending}>
                <Workflow className="w-4 h-4 mr-2" />
                {createTaskMutation.isPending ? "Creating..." : "Add workflow item"}
              </Button>
            </CardContent>
          </Card>

          <Card className="lg:col-span-2 border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><BarChart3 className="w-5 h-5" /> Daily Progress Trend</CardTitle>
              <CardDescription>Completion rate by due date.</CardDescription>
            </CardHeader>
            <CardContent className="h-[320px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={timelineData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="day" />
                  <YAxis domain={[0, 100]} />
                  <Tooltip />
                  <Line type="monotone" dataKey="completionRate" stroke="hsl(var(--primary))" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {viewMode === "checklist" && (
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><ListChecks className="w-5 h-5" /> Today’s Checklist</CardTitle>
              <CardDescription>
                {completedCount} of {visibleTasks.length} completed • includes overdue carryover.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {isLoading && <p className="text-sm text-muted-foreground">Loading checklist...</p>}
              {!isLoading && visibleTasks.length === 0 && (
                <p className="text-sm text-muted-foreground">No tasks due today. Add your first daily checklist item.</p>
              )}

              {visibleTasks.map((task) => {
                const checklist = normalizeChecklist(task.checklist);
                const progress = computeProgress(task);
                const isOverdue = task.dueDate ? new Date(task.dueDate) < new Date() && task.status !== "completed" && dateKey(new Date(task.dueDate)) !== todayKey : false;

                return (
                  <div key={task.id} className={cn("p-4 rounded-lg border bg-card/40 space-y-3", isOverdue && "border-red-300") }>
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="font-medium">{task.title}</p>
                        <p className="text-sm text-muted-foreground">
                          Due {task.dueDate ? format(new Date(task.dueDate), "MMM d, yyyy") : "No due date"}
                          {task.isRecurring ? ` · Recurs ${task.recurringPattern || "daily"}` : ""}
                          {isOverdue ? " · Overdue" : ""}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={statusVariant[task.status]}>{statusLabel[task.status]}</Badge>
                        <Button size="icon" variant="ghost" onClick={() => toggleTaskComplete(task)}>
                          <CheckCircle2 className="w-4 h-4" />
                        </Button>
                        <Button size="icon" variant="ghost" onClick={() => deleteTaskMutation.mutate(task.id)}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                    <Progress value={progress} />
                    {checklist.length > 0 && (
                      <div className="space-y-2">
                        {checklist.map((item) => (
                          <button
                            key={item.id}
                            type="button"
                            className={cn(
                              "w-full text-left text-sm rounded-md border px-3 py-2 transition",
                              item.completed ? "bg-emerald-50 border-emerald-200 line-through text-muted-foreground" : "hover:bg-muted/40",
                            )}
                            onClick={() => toggleChecklistItem(task, item.id)}
                          >
                            {item.completed ? "✅" : "⬜"} {item.text}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </CardContent>
          </Card>
        )}

        {viewMode === "analytics" && (
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle>Workload Breakdown</CardTitle>
              <CardDescription>Daily delivery snapshot for client execution.</CardDescription>
            </CardHeader>
            <CardContent className="h-[360px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={channelData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="total" fill="hsl(var(--primary))" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {viewMode === "flow" && (
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle>Workflow Flow View</CardTitle>
              <CardDescription>Track movement from To Do to Completed.</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-4 gap-3">
              {(Object.keys(statusFlow) as WorkflowStatus[]).map((key) => (
                <div key={key} className="rounded-lg border p-4">
                  <p className="text-xs uppercase text-muted-foreground">{statusLabel[key]}</p>
                  <p className="text-3xl font-bold mt-2">{statusFlow[key]}</p>
                  <Progress
                    className="mt-3"
                    value={visibleTasks.length > 0 ? Math.round((statusFlow[key] / visibleTasks.length) * 100) : 0}
                  />
                </div>
              ))}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

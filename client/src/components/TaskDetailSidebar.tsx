import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Calendar,
  User,
  Trash2,
  Briefcase,
  FolderOpen,
  Clock,
  ChevronDown,
  ChevronUp,
  FileText,
} from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Task, Client, User as UserType, TaskSpace } from "@shared/schema";
import { toLocaleDateStringEST, toInputDateEST, parseInputDateEST } from "@/lib/dateUtils";
import { TaskProgressBar } from "./tasks/TaskProgressBar";
import { TaskActivityTimeline } from "./tasks/TaskActivityTimeline";
import { TaskAttachmentsList } from "./tasks/TaskAttachmentsList";

interface TaskDetailSidebarProps {
  task: Task | null;
  isOpen: boolean;
  onClose: () => void;
  onDelete?: (task: Task) => void;
}

export function TaskDetailSidebar({ task, isOpen, onClose, onDelete }: TaskDetailSidebarProps) {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("details");

  // Inline editing state
  const [editingTitle, setEditingTitle] = useState(false);
  const [editingDescription, setEditingDescription] = useState(false);
  const [descriptionExpanded, setDescriptionExpanded] = useState(false);
  const [titleValue, setTitleValue] = useState("");
  const [descriptionValue, setDescriptionValue] = useState("");
  const titleInputRef = useRef<HTMLInputElement>(null);
  const descriptionRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (isOpen && task) {
      setActiveTab("details");
      setEditingTitle(false);
      setEditingDescription(false);
      setDescriptionExpanded(false);
      setTitleValue(task.title);
      setDescriptionValue(task.description || "");
    }
  }, [isOpen, task?.id]);

  // Keep local values in sync when task changes externally
  useEffect(() => {
    if (task) {
      setTitleValue(task.title);
      setDescriptionValue(task.description || "");
    }
  }, [task?.title, task?.description]);

  const { data: users = [] } = useQuery<UserType[]>({ queryKey: ["/api/users"], retry: false });
  const { data: clients = [] } = useQuery<Client[]>({ queryKey: ["/api/clients"], retry: false, meta: { returnNull: true } });
  const { data: spaces = [] } = useQuery<TaskSpace[]>({ queryKey: ["/api/task-spaces"], retry: false, meta: { returnNull: true } });

  const updateTaskMutation = useMutation({
    mutationFn: async (data: Partial<Task>) => {
      const res = await apiRequest("PATCH", `/api/tasks/${task?.id}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
      toast({ title: "Task updated" });
    },
    onError: (error: any) => {
      toast({ title: "Failed to update task", description: error?.message, variant: "destructive" });
    },
  });

  const deleteTaskMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("DELETE", `/api/tasks/${task?.id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
      toast({ title: "Task deleted" });
      onClose();
    },
    onError: (error: any) => {
      toast({ title: "Failed to delete task", description: error?.message, variant: "destructive" });
    },
  });

  const handleChecklistUpdate = (checklist: any[], progress: number) => {
    updateTaskMutation.mutate({ checklist, taskProgress: progress } as any);
  };

  const saveTitle = () => {
    setEditingTitle(false);
    if (titleValue.trim() && titleValue !== task?.title) {
      updateTaskMutation.mutate({ title: titleValue.trim() });
    } else {
      setTitleValue(task?.title || "");
    }
  };

  const saveDescription = () => {
    setEditingDescription(false);
    if (descriptionValue !== (task?.description || "")) {
      updateTaskMutation.mutate({ description: descriptionValue });
    }
  };

  const handleFieldUpdate = (field: string, value: any) => {
    if (field === "dueDate" && value) {
      const parsed = parseInputDateEST(`${value}T23:59`);
      updateTaskMutation.mutate({ [field]: parsed.toISOString() } as any);
    } else if (field === "assignedToId") {
      const parsed = value ? parseInt(value) : null;
      updateTaskMutation.mutate({ [field]: parsed } as any);
    } else {
      updateTaskMutation.mutate({ [field]: value || null } as any);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "urgent": return "bg-red-500/10 text-red-700 border-red-200";
      case "high": return "bg-orange-500/10 text-orange-700 border-orange-200";
      case "normal": return "bg-blue-500/10 text-blue-700 border-blue-200";
      case "low": return "bg-slate-500/10 text-slate-700 border-slate-200";
      default: return "bg-slate-500/10 text-slate-700";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed": return "bg-green-500/10 text-green-700 border-green-200";
      case "review": return "bg-purple-500/10 text-purple-700 border-purple-200";
      case "in_progress": return "bg-amber-500/10 text-amber-700 border-amber-200";
      case "todo": return "bg-slate-500/10 text-slate-700 border-slate-200";
      default: return "bg-slate-500/10 text-slate-700";
    }
  };

  // Build nested space options (same logic as tasks.tsx)
  const buildSpaceOptions = () => {
    const byParent = new Map<string | null, TaskSpace[]>();
    for (const s of spaces) {
      const pid = ((s as any).parentSpaceId ?? null) as string | null;
      const list = byParent.get(pid) || [];
      list.push(s);
      byParent.set(pid, list);
    }
    for (const [pid, list] of byParent) {
      list.sort((a: any, b: any) => (a.order ?? 0) - (b.order ?? 0) || a.name.localeCompare(b.name));
      byParent.set(pid, list);
    }
    const out: Array<{ id: string; label: string }> = [];
    const walk = (parentId: string | null, depth: number) => {
      const children = byParent.get(parentId) || [];
      for (const s of children) {
        const indent = depth > 0 ? `${"— ".repeat(Math.min(depth, 6))}` : "";
        out.push({ id: s.id, label: `${indent}${(s as any).icon ?? "📁"} ${s.name}` });
        walk(s.id, depth + 1);
      }
    };
    walk(null, 0);
    return out;
  };

  if (!task) return null;

  const assignee = users.find((u: any) => u.id === task.assignedToId);
  const client = clients.find((c: any) => c.id === task.clientId);
  const space = spaces.find((s: any) => s.id === task.spaceId);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl p-0 flex flex-col max-h-[85vh] overflow-hidden">
        {/* Header - Editable Title & Description */}
        <div className="p-6 pb-4 bg-muted/30 border-b">
          <DialogHeader className="space-y-3">
            {/* Status & Priority inline selects */}
            <div className="flex items-center gap-2 flex-wrap">
              <Select
                value={task.status}
                onValueChange={(val) => handleFieldUpdate("status", val)}
              >
                <SelectTrigger className={`h-7 w-auto gap-1.5 text-xs font-semibold border px-2.5 ${getStatusColor(task.status)}`}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todo">TO DO</SelectItem>
                  <SelectItem value="in_progress">IN PROGRESS</SelectItem>
                  <SelectItem value="review">REVIEW</SelectItem>
                  <SelectItem value="completed">COMPLETED</SelectItem>
                </SelectContent>
              </Select>

              <Select
                value={task.priority}
                onValueChange={(val) => handleFieldUpdate("priority", val)}
              >
                <SelectTrigger className={`h-7 w-auto gap-1.5 text-xs font-semibold border px-2.5 ${getPriorityColor(task.priority)}`}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">LOW</SelectItem>
                  <SelectItem value="normal">NORMAL</SelectItem>
                  <SelectItem value="high">HIGH</SelectItem>
                  <SelectItem value="urgent">URGENT</SelectItem>
                </SelectContent>
              </Select>

              <div className="flex-1" />

              <Button
                variant="ghost"
                size="sm"
                className="h-7 px-2 text-destructive hover:bg-destructive/10"
                onClick={() => {
                  if (confirm(`Delete task "${task.title}"?`)) {
                    deleteTaskMutation.mutate();
                  }
                }}
              >
                <Trash2 className="w-3.5 h-3.5" />
              </Button>
            </div>

            {/* Editable Title */}
            {editingTitle ? (
              <Input
                ref={titleInputRef}
                value={titleValue}
                onChange={(e) => setTitleValue(e.target.value)}
                onBlur={saveTitle}
                onKeyDown={(e) => {
                  if (e.key === "Enter") saveTitle();
                  if (e.key === "Escape") {
                    setTitleValue(task.title);
                    setEditingTitle(false);
                  }
                }}
                className="text-2xl font-bold h-auto py-1 px-2 -ml-2"
                autoFocus
              />
            ) : (
              <DialogTitle
                className="text-2xl font-bold leading-tight cursor-pointer hover:bg-muted/50 rounded px-2 py-1 -ml-2 transition-colors"
                onClick={() => {
                  setEditingTitle(true);
                  setTimeout(() => titleInputRef.current?.focus(), 0);
                }}
              >
                {task.title}
              </DialogTitle>
            )}

          </DialogHeader>
        </div>

        {/* Description Section - separated from header for better visual hierarchy */}
        <div className="px-6 pb-2">
          <div className="rounded-lg border bg-muted/20">
            <div className="flex items-center justify-between px-3 py-2 border-b bg-muted/30 rounded-t-lg">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5" />
                Description
              </span>
              {!editingDescription && task.description && task.description.length > 150 && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 px-2 text-xs text-muted-foreground hover:text-foreground"
                  onClick={() => setDescriptionExpanded(!descriptionExpanded)}
                >
                  {descriptionExpanded ? (
                    <>Show less <ChevronUp className="w-3 h-3 ml-1" /></>
                  ) : (
                    <>Show more <ChevronDown className="w-3 h-3 ml-1" /></>
                  )}
                </Button>
              )}
            </div>
            <div className="px-3 py-2.5">
              {editingDescription ? (
                <Textarea
                  ref={descriptionRef}
                  value={descriptionValue}
                  onChange={(e) => setDescriptionValue(e.target.value)}
                  onBlur={saveDescription}
                  onKeyDown={(e) => {
                    if (e.key === "Escape") {
                      setDescriptionValue(task.description || "");
                      setEditingDescription(false);
                    }
                  }}
                  className="text-sm min-h-[100px] max-h-[250px] resize-y border-0 shadow-none focus-visible:ring-0 p-0"
                  placeholder="Add a description..."
                  autoFocus
                />
              ) : (
                <div
                  className={`text-sm leading-relaxed cursor-pointer hover:bg-muted/30 rounded p-1 -m-1 transition-colors whitespace-pre-wrap break-words ${
                    !descriptionExpanded && task.description && task.description.length > 150
                      ? "max-h-[4.5rem] overflow-hidden relative"
                      : ""
                  }`}
                  onClick={() => {
                    setEditingDescription(true);
                    setTimeout(() => descriptionRef.current?.focus(), 0);
                  }}
                >
                  <span className={!task.description ? "text-muted-foreground italic" : "text-foreground/90"}>
                    {task.description || "Click to add a description..."}
                  </span>
                  {!descriptionExpanded && task.description && task.description.length > 150 && (
                    <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-muted/20 to-transparent rounded-b pointer-events-none" />
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col min-h-0">
          <TabsList className="mx-6 mt-4 justify-start h-auto bg-transparent p-0 gap-2">
            <TabsTrigger value="details" className="data-[state=active]:bg-muted px-4 py-2">
              Details
            </TabsTrigger>
            <TabsTrigger value="checklist" className="data-[state=active]:bg-muted px-4 py-2">
              Checklist
            </TabsTrigger>
            <TabsTrigger value="activity" className="data-[state=active]:bg-muted px-4 py-2">
              Activity
            </TabsTrigger>
            <TabsTrigger value="attachments" className="data-[state=active]:bg-muted px-4 py-2">
              Files
            </TabsTrigger>
          </TabsList>

          <ScrollArea className="flex-1">
            <div className="p-6 space-y-6 pb-32">
              {/* Details Tab - All editable fields */}
              <TabsContent value="details" className="mt-0 space-y-5">
                {/* Assignee */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5" />
                    Assignee
                  </label>
                  <Select
                    value={task.assignedToId?.toString() || "unassigned"}
                    onValueChange={(val) => handleFieldUpdate("assignedToId", val === "unassigned" ? null : val)}
                  >
                    <SelectTrigger className="w-full h-9">
                      <SelectValue placeholder="Unassigned" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="unassigned">Unassigned</SelectItem>
                      {users.map((u: any) => (
                        <SelectItem key={u.id} value={u.id.toString()}>
                          {u.firstName || u.username}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Due Date */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5" />
                    Due Date
                  </label>
                  <Input
                    type="date"
                    value={task.dueDate ? toInputDateEST(task.dueDate) : ""}
                    onChange={(e) => handleFieldUpdate("dueDate", e.target.value)}
                    className="w-full h-9"
                  />
                </div>

                {/* Client */}
                {clients.length > 0 && (
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                      <Briefcase className="w-3.5 h-3.5" />
                      Client
                    </label>
                    <Select
                      value={task.clientId || "none"}
                      onValueChange={(val) => handleFieldUpdate("clientId", val === "none" ? null : val)}
                    >
                      <SelectTrigger className="w-full h-9">
                        <SelectValue placeholder="No client" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">No client</SelectItem>
                        {clients.map((c: any) => (
                          <SelectItem key={c.id} value={c.id}>
                            {c.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {/* Space */}
                {spaces.length > 0 && (
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                      <FolderOpen className="w-3.5 h-3.5" />
                      Space
                    </label>
                    <Select
                      value={task.spaceId || "none"}
                      onValueChange={(val) => handleFieldUpdate("spaceId", val === "none" ? null : val)}
                    >
                      <SelectTrigger className="w-full h-9">
                        <SelectValue placeholder="No space" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">No space</SelectItem>
                        {buildSpaceOptions().map((s) => (
                          <SelectItem key={s.id} value={s.id}>
                            {s.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {/* Timestamps */}
                <div className="pt-3 border-t space-y-2">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Clock className="w-3.5 h-3.5" />
                    <span>Created {task.createdAt ? toLocaleDateStringEST(task.createdAt) : "N/A"}</span>
                  </div>
                  {task.completedAt && (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Clock className="w-3.5 h-3.5" />
                      <span>Completed {toLocaleDateStringEST(task.completedAt)}</span>
                    </div>
                  )}
                </div>
              </TabsContent>

              {/* Checklist Tab */}
              <TabsContent value="checklist" className="mt-0">
                <TaskProgressBar task={task} onUpdate={handleChecklistUpdate} />
              </TabsContent>

              {/* Activity Tab */}
              <TabsContent value="activity" className="mt-0">
                <TaskActivityTimeline taskId={task.id} limit={50} />
              </TabsContent>

              {/* Attachments Tab */}
              <TabsContent value="attachments" className="mt-0">
                <TaskAttachmentsList taskId={task.id} />
              </TabsContent>
            </div>
          </ScrollArea>
        </Tabs>

        {/* Footer with actions */}
      </DialogContent>
    </Dialog>
  );
}

export default TaskDetailSidebar;

import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import {
  Calendar,
  User,
  Clock,
  MessageSquare,
  Paperclip,
  Plus,
  Trash2,
  CheckCircle2,
  Send,
  History,
  AlertTriangle,
  Repeat,
  Check,
  CircleDot,
  Circle,
  Building2,
  FolderOpen,
  Tag,
} from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";
import type { Task, TaskComment, User as UserType, Client, TaskSpace } from "@shared/schema";
import { toLocaleDateStringEST, toEST, nowEST, toInputDateEST } from "@/lib/dateUtils";

interface TaskDetailSidebarProps {
  task: Task | null;
  isOpen: boolean;
  onClose: () => void;
  onDelete?: (taskId: string) => void;
}

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

export function TaskDetailSidebar({ task, isOpen, onClose, onDelete }: TaskDetailSidebarProps) {
  const { toast } = useToast();
  const [comment, setComment] = useState("");
  const [checklist, setChecklist] = useState<Array<{ id: string; text: string; completed: boolean }>>(
    task?.checklist || []
  );
  const [newChecklistItem, setNewChecklistItem] = useState("");

  // Inline editing states
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editTitle, setEditTitle] = useState(task?.title || "");
  const [isEditingDescription, setIsEditingDescription] = useState(false);
  const [editDescription, setEditDescription] = useState(task?.description || "");
  const titleInputRef = useRef<HTMLInputElement>(null);
  const descriptionRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (task) {
      setChecklist(task.checklist || []);
      setEditTitle(task.title);
      setEditDescription(task.description || "");
      setIsEditingTitle(false);
      setIsEditingDescription(false);
    }
  }, [task]);

  useEffect(() => {
    if (isEditingTitle && titleInputRef.current) {
      titleInputRef.current.focus();
      titleInputRef.current.select();
    }
  }, [isEditingTitle]);

  useEffect(() => {
    if (isEditingDescription && descriptionRef.current) {
      descriptionRef.current.focus();
    }
  }, [isEditingDescription]);

  const { data: comments = [], isLoading: isLoadingComments } = useQuery<TaskComment[]>({
    queryKey: [`/api/tasks/${task?.id}/comments`],
    enabled: !!task?.id,
  });

  const { data: users = [] } = useQuery<UserType[]>({
    queryKey: ["/api/users"],
  });

  const { data: clients = [] } = useQuery<Client[]>({
    queryKey: ["/api/clients"],
    retry: false,
  });

  const { data: spaces = [] } = useQuery<TaskSpace[]>({
    queryKey: ["/api/task-spaces"],
    retry: false,
  });

  const updateTaskMutation = useMutation({
    mutationFn: async (data: Partial<Task>) => {
      const res = await apiRequest("PATCH", `/api/tasks/${task?.id}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
      toast({ title: "Task updated" });
    },
    onError: () => {
      toast({ title: "Failed to update task", variant: "destructive" });
    },
  });

  const addCommentMutation = useMutation({
    mutationFn: async (content: string) => {
      const res = await apiRequest("POST", `/api/tasks/${task?.id}/comments`, { comment: content });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/tasks/${task?.id}/comments`] });
      setComment("");
    },
  });

  // Checklist handlers
  const handleAddChecklistItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newChecklistItem.trim()) return;
    const newItem = {
      id: crypto.randomUUID(),
      text: newChecklistItem.trim(),
      completed: false,
    };
    const updatedChecklist = [...checklist, newItem];
    setChecklist(updatedChecklist);
    updateTaskMutation.mutate({ checklist: updatedChecklist });
    setNewChecklistItem("");
  };

  const toggleChecklistItem = (id: string) => {
    const updatedChecklist = checklist.map((item) =>
      item.id === id ? { ...item, completed: !item.completed } : item
    );
    setChecklist(updatedChecklist);
    updateTaskMutation.mutate({ checklist: updatedChecklist });
  };

  const removeChecklistItem = (id: string) => {
    const updatedChecklist = checklist.filter((item) => item.id !== id);
    setChecklist(updatedChecklist);
    updateTaskMutation.mutate({ checklist: updatedChecklist });
  };

  // Inline edit handlers
  const handleSaveTitle = () => {
    if (editTitle.trim() && editTitle !== task?.title) {
      updateTaskMutation.mutate({ title: editTitle.trim() });
    } else {
      setEditTitle(task?.title || "");
    }
    setIsEditingTitle(false);
  };

  const handleSaveDescription = () => {
    if (editDescription !== (task?.description || "")) {
      updateTaskMutation.mutate({ description: editDescription });
    }
    setIsEditingDescription(false);
  };

  const handleFieldUpdate = (field: string, value: any) => {
    updateTaskMutation.mutate({ [field]: value });
  };

  // Color helpers
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "urgent": return "bg-red-100 text-red-700 border-red-200 dark:bg-red-950 dark:text-red-400 dark:border-red-900";
      case "high": return "bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-950 dark:text-orange-400 dark:border-orange-900";
      case "normal": return "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-400 dark:border-blue-900";
      case "low": return "bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-900 dark:text-slate-400 dark:border-slate-800";
      default: return "bg-slate-100 text-slate-600 border-slate-200";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed": return "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-400 dark:border-emerald-900";
      case "review": return "bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-950 dark:text-purple-400 dark:border-purple-900";
      case "in_progress": return "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-400 dark:border-blue-900";
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

  const buildSpaceOptions = () => {
    const byParent = new Map<string | null, TaskSpace[]>();
    for (const s of spaces) {
      const pid = (s.parentSpaceId ?? null) as string | null;
      const list = byParent.get(pid) || [];
      list.push(s);
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

  if (!task) return null;

  const checklistDone = checklist.filter(i => i.completed).length;
  const checklistTotal = checklist.length;
  const checklistPercent = checklistTotal > 0 ? Math.round((checklistDone / checklistTotal) * 100) : 0;
  const overdueTask = isOverdue(task.dueDate, task.status);
  const dueSoonTask = isDueSoon(task.dueDate, task.status);
  const assignedUser = users.find(u => u.id === task.assignedToId);
  const taskClient = clients.find(c => c.id === task.clientId);
  const taskSpace = spaces.find(s => s.id === task.spaceId);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="max-w-4xl w-[95vw] max-h-[90vh] p-0 gap-0 overflow-hidden">
        <DialogHeader className="sr-only">
          <DialogTitle>{task.title}</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col lg:flex-row h-full max-h-[90vh]">
          {/* ─── Left Column: Main Content ─── */}
          <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
            <ScrollArea className="flex-1">
              <div className="p-6 space-y-6">
                {/* Status & Priority Badges Row */}
                <div className="flex items-center gap-2 flex-wrap">
                  <Select
                    value={task.status}
                    onValueChange={(value) => handleFieldUpdate("status", value)}
                  >
                    <SelectTrigger className="w-auto h-7 border-0 p-0 shadow-none focus:ring-0 [&>svg]:ml-0.5 [&>svg]:w-3 [&>svg]:h-3">
                      <Badge variant="outline" className={`${getStatusColor(task.status)} cursor-pointer gap-1`}>
                        {getStatusIcon(task.status)}
                        {task.status.replace("_", " ").toUpperCase()}
                      </Badge>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todo">To Do</SelectItem>
                      <SelectItem value="in_progress">In Progress</SelectItem>
                      <SelectItem value="review">Review</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select
                    value={task.priority}
                    onValueChange={(value) => handleFieldUpdate("priority", value)}
                  >
                    <SelectTrigger className="w-auto h-7 border-0 p-0 shadow-none focus:ring-0 [&>svg]:ml-0.5 [&>svg]:w-3 [&>svg]:h-3">
                      <Badge variant="outline" className={`${getPriorityColor(task.priority)} cursor-pointer`}>
                        {task.priority.toUpperCase()}
                      </Badge>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="normal">Normal</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="urgent">Urgent</SelectItem>
                    </SelectContent>
                  </Select>

                  {task.isRecurring && (
                    <Badge variant="outline" className="bg-blue-50 text-blue-600 border-blue-200 dark:bg-blue-950 dark:text-blue-400 dark:border-blue-900 gap-1">
                      <Repeat className="w-3 h-3" />
                      Recurring
                    </Badge>
                  )}
                </div>

                {/* Title - Click to Edit */}
                <div>
                  {isEditingTitle ? (
                    <div className="flex items-center gap-2">
                      <Input
                        ref={titleInputRef}
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleSaveTitle();
                          if (e.key === "Escape") {
                            setEditTitle(task.title);
                            setIsEditingTitle(false);
                          }
                        }}
                        onBlur={handleSaveTitle}
                        className="text-2xl font-bold h-auto py-1 px-2"
                      />
                    </div>
                  ) : (
                    <h2
                      className="text-2xl font-bold leading-tight cursor-pointer hover:bg-muted/50 rounded-md px-2 py-1 -mx-2 transition-colors"
                      onClick={() => setIsEditingTitle(true)}
                      title="Click to edit title"
                    >
                      {task.title}
                    </h2>
                  )}
                </div>

                {/* Description - Click to Edit */}
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Description</p>
                  {isEditingDescription ? (
                    <div className="space-y-2">
                      <Textarea
                        ref={descriptionRef}
                        value={editDescription}
                        onChange={(e) => setEditDescription(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Escape") {
                            setEditDescription(task.description || "");
                            setIsEditingDescription(false);
                          }
                        }}
                        className="min-h-[100px] text-sm"
                        placeholder="Add a description..."
                      />
                      <div className="flex items-center gap-2">
                        <Button size="sm" onClick={handleSaveDescription} className="h-7 gap-1">
                          <Check className="w-3 h-3" />
                          Save
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setEditDescription(task.description || "");
                            setIsEditingDescription(false);
                          }}
                          className="h-7"
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div
                      className="text-sm text-muted-foreground cursor-pointer hover:bg-muted/50 rounded-md p-2 -mx-2 transition-colors min-h-[40px]"
                      onClick={() => setIsEditingDescription(true)}
                      title="Click to edit description"
                    >
                      {task.description || (
                        <span className="italic text-muted-foreground/50">Click to add a description...</span>
                      )}
                    </div>
                  )}
                </div>

                <Separator />

                {/* Checklist Section */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold flex items-center gap-2 uppercase tracking-widest text-muted-foreground">
                      <CheckCircle2 className="w-4 h-4" />
                      Checklist
                    </h3>
                    <span className="text-xs font-medium bg-muted px-2 py-0.5 rounded-full">
                      {checklistDone}/{checklistTotal}
                    </span>
                  </div>

                  {checklistTotal > 0 && (
                    <div className="space-y-1.5">
                      <Progress value={checklistPercent} className="h-2" />
                      <p className="text-xs text-muted-foreground text-right">{checklistPercent}% complete</p>
                    </div>
                  )}

                  <div className="space-y-1.5">
                    {checklist.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center gap-3 p-2 rounded-md hover:bg-muted/50 group transition-colors"
                      >
                        <Checkbox
                          checked={item.completed}
                          onCheckedChange={() => toggleChecklistItem(item.id)}
                          className="w-5 h-5"
                        />
                        <span className={`text-sm flex-1 ${item.completed ? "line-through text-muted-foreground" : ""}`}>
                          {item.text}
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => removeChecklistItem(item.id)}
                        >
                          <Trash2 className="w-3.5 h-3.5 text-destructive" />
                        </Button>
                      </div>
                    ))}

                    <form onSubmit={handleAddChecklistItem} className="flex gap-2 mt-2">
                      <Input
                        placeholder="Add an item..."
                        value={newChecklistItem}
                        onChange={(e) => setNewChecklistItem(e.target.value)}
                        className="h-9 text-sm"
                      />
                      <Button type="submit" size="sm" className="h-9 px-3">
                        <Plus className="w-4 h-4" />
                      </Button>
                    </form>
                  </div>
                </div>

                <Separator />

                {/* Attachments */}
                <div className="space-y-4">
                  <h3 className="text-xs font-bold flex items-center gap-2 uppercase tracking-widest text-muted-foreground">
                    <Paperclip className="w-4 h-4" />
                    Attachments
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="border-2 border-dashed rounded-lg p-4 flex flex-col items-center justify-center gap-2 hover:bg-muted/50 transition-colors cursor-pointer min-h-[80px]">
                      <Plus className="w-5 h-5 text-muted-foreground" />
                      <span className="text-xs font-medium text-muted-foreground">Upload file</span>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Activity Feed / Comments */}
                <div className="space-y-6">
                  <h3 className="text-xs font-bold flex items-center gap-2 uppercase tracking-widest text-muted-foreground">
                    <History className="w-4 h-4" />
                    Activity Feed
                    {comments.length > 0 && (
                      <Badge variant="secondary" className="text-[10px] h-4 px-1.5">
                        {comments.length}
                      </Badge>
                    )}
                  </h3>

                  <div className="space-y-5">
                    {isLoadingComments ? (
                      <div className="space-y-4">
                        {[1, 2].map((i) => (
                          <div key={i} className="flex gap-3 animate-pulse">
                            <div className="w-8 h-8 rounded-full bg-muted" />
                            <div className="flex-1 space-y-2">
                              <div className="h-3 bg-muted rounded w-1/4" />
                              <div className="h-10 bg-muted rounded w-full" />
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      comments.map((c) => {
                        const commenter = users.find(u => u.id === c.userId);
                        return (
                          <div key={c.id} className="flex gap-3 group">
                            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                              <span className="text-[10px] font-bold text-primary uppercase">
                                {commenter?.firstName?.[0] || commenter?.username?.[0] || "?"}
                              </span>
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-sm font-bold truncate">
                                  {commenter?.firstName || commenter?.username}
                                </span>
                                <span className="text-[10px] text-muted-foreground">
                                  {formatDistanceToNow(new Date(c.createdAt), { addSuffix: true })}
                                </span>
                              </div>
                              <div className="bg-muted/50 rounded-lg p-3 text-sm leading-relaxed border border-transparent hover:border-muted-foreground/10 transition-colors">
                                {c.comment}
                              </div>
                            </div>
                          </div>
                        );
                      })
                    )}

                    {comments.length === 0 && !isLoadingComments && (
                      <div className="text-center py-6 text-muted-foreground">
                        <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-20" />
                        <p className="text-sm">No activity yet. Be the first to comment!</p>
                      </div>
                    )}
                  </div>

                  {/* Comment Input */}
                  <div className="space-y-2">
                    <div className="relative">
                      <Textarea
                        placeholder="Write a comment..."
                        className="min-h-[70px] pr-12 text-sm resize-none focus-visible:ring-1"
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            if (comment.trim()) addCommentMutation.mutate(comment);
                          }
                        }}
                      />
                      <Button
                        size="sm"
                        className="absolute bottom-2 right-2 h-8 w-8 p-0 rounded-full"
                        disabled={!comment.trim() || addCommentMutation.isPending}
                        onClick={() => addCommentMutation.mutate(comment)}
                      >
                        <Send className="w-4 h-4" />
                      </Button>
                    </div>
                    <p className="text-[10px] text-muted-foreground px-1">
                      Press <strong>Enter</strong> to send, <strong>Shift + Enter</strong> for new line.
                    </p>
                  </div>
                </div>
              </div>
            </ScrollArea>
          </div>

          {/* ─── Right Column: Task Details / Metadata ─── */}
          <div className="w-full lg:w-80 border-t lg:border-t-0 lg:border-l bg-muted/20 flex-shrink-0">
            <ScrollArea className="h-full">
              <div className="p-5 space-y-5">
                <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Details</h3>

                {/* Status */}
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                    <CircleDot className="w-3.5 h-3.5" />
                    Status
                  </label>
                  <Select
                    value={task.status}
                    onValueChange={(value) => handleFieldUpdate("status", value)}
                  >
                    <SelectTrigger className="h-9 text-sm">
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

                {/* Priority */}
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                    <Tag className="w-3.5 h-3.5" />
                    Priority
                  </label>
                  <Select
                    value={task.priority}
                    onValueChange={(value) => handleFieldUpdate("priority", value)}
                  >
                    <SelectTrigger className="h-9 text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="normal">Normal</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="urgent">Urgent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Separator />

                {/* Assignee */}
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5" />
                    Assignee
                  </label>
                  <Select
                    value={task.assignedToId?.toString() || "unassigned"}
                    onValueChange={(value) => {
                      const newVal = value === "unassigned" ? null : parseInt(value);
                      handleFieldUpdate("assignedToId", newVal);
                    }}
                  >
                    <SelectTrigger className="h-9 text-sm">
                      <SelectValue placeholder="Unassigned" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="unassigned">Unassigned</SelectItem>
                      {users.map((u) => (
                        <SelectItem key={u.id} value={u.id.toString()}>
                          {u.firstName || u.username}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Due Date */}
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5" />
                    Due Date
                    {overdueTask && (
                      <Badge variant="outline" className="bg-red-50 text-red-600 border-red-200 dark:bg-red-950 dark:text-red-400 dark:border-red-900 text-[10px] h-4 px-1 ml-1">
                        <AlertTriangle className="w-2.5 h-2.5 mr-0.5" />
                        Overdue
                      </Badge>
                    )}
                    {dueSoonTask && (
                      <Badge variant="outline" className="bg-amber-50 text-amber-600 border-amber-200 dark:bg-amber-950 dark:text-amber-400 dark:border-amber-900 text-[10px] h-4 px-1 ml-1">
                        Due soon
                      </Badge>
                    )}
                  </label>
                  <Input
                    type="date"
                    value={task.dueDate ? toInputDateEST(task.dueDate) : ""}
                    onChange={(e) => {
                      if (e.target.value) {
                        const dateStr = `${e.target.value}T23:59:00`;
                        const date = new Date(dateStr);
                        handleFieldUpdate("dueDate", date.toISOString());
                      } else {
                        handleFieldUpdate("dueDate", null);
                      }
                    }}
                    className={`h-9 text-sm ${overdueTask ? "border-red-300 dark:border-red-800" : ""}`}
                  />
                </div>

                <Separator />

                {/* Client */}
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5" />
                    Client
                  </label>
                  <Select
                    value={task.clientId || "none"}
                    onValueChange={(value) => {
                      handleFieldUpdate("clientId", value === "none" ? null : value);
                    }}
                  >
                    <SelectTrigger className="h-9 text-sm">
                      <SelectValue placeholder="No client" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No client</SelectItem>
                      {clients.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Space */}
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                    <FolderOpen className="w-3.5 h-3.5" />
                    Space
                  </label>
                  <Select
                    value={task.spaceId || "none"}
                    onValueChange={(value) => {
                      handleFieldUpdate("spaceId", value === "none" ? null : value);
                    }}
                  >
                    <SelectTrigger className="h-9 text-sm">
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

                {/* Recurring Settings */}
                {task.isRecurring && (
                  <>
                    <Separator />
                    <div className="space-y-3">
                      <h3 className="text-xs font-bold flex items-center gap-2 uppercase tracking-widest text-muted-foreground">
                        <Repeat className="w-3.5 h-3.5" />
                        Recurring
                      </h3>
                      <div className="bg-blue-50/50 dark:bg-blue-950/20 rounded-lg p-3 space-y-2 border border-blue-100 dark:border-blue-900/50">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-muted-foreground">Pattern</span>
                          <span className="font-medium capitalize">{task.recurringPattern || "—"}</span>
                        </div>
                        {task.recurringInterval && task.recurringInterval > 1 && (
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-muted-foreground">Interval</span>
                            <span className="font-medium">Every {task.recurringInterval} {task.recurringPattern}(s)</span>
                          </div>
                        )}
                        {task.recurringEndDate && (
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-muted-foreground">Ends</span>
                            <span className="font-medium">{toLocaleDateStringEST(task.recurringEndDate)}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </>
                )}

                <Separator />

                {/* Created / Updated Info */}
                <div className="space-y-2 text-xs text-muted-foreground">
                  {task.createdAt && (
                    <div className="flex items-center justify-between">
                      <span>Created</span>
                      <span>{toLocaleDateStringEST(task.createdAt)}</span>
                    </div>
                  )}
                  {task.updatedAt && (
                    <div className="flex items-center justify-between">
                      <span>Updated</span>
                      <span>{toLocaleDateStringEST(task.updatedAt)}</span>
                    </div>
                  )}
                  {task.completedAt && (
                    <div className="flex items-center justify-between">
                      <span>Completed</span>
                      <span>{toLocaleDateStringEST(task.completedAt)}</span>
                    </div>
                  )}
                </div>

                {/* Delete Action */}
                {onDelete && (
                  <>
                    <Separator />
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full text-destructive border-destructive/30 hover:bg-destructive/10 hover:text-destructive gap-2"
                      onClick={() => {
                        if (confirm(`Delete task "${task.title}"?`)) {
                          onDelete(task.id);
                          onClose();
                        }
                      }}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Delete Task
                    </Button>
                  </>
                )}
              </div>
            </ScrollArea>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

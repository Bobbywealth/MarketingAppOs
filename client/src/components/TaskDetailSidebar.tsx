import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter
} from "@/components/ui/sheet";
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
  Edit,
  AlertTriangle,
  Repeat,
} from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";
import type { Task, TaskComment, User as UserType } from "@shared/schema";
import { toLocaleDateStringEST, toEST, nowEST } from "@/lib/dateUtils";

interface TaskDetailSidebarProps {
  task: Task | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit?: (task: Task) => void;
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

export function TaskDetailSidebar({ task, isOpen, onClose, onEdit }: TaskDetailSidebarProps) {
  const { toast } = useToast();
  const [comment, setComment] = useState("");
  const [checklist, setChecklist] = useState<Array<{ id: string; text: string; completed: boolean }>>(
    task?.checklist || []
  );
  const [newChecklistItem, setNewChecklistItem] = useState("");

  useEffect(() => {
    if (task) {
      setChecklist(task.checklist || []);
    }
  }, [task]);

  const { data: comments = [], isLoading: isLoadingComments } = useQuery<TaskComment[]>({
    queryKey: [`/api/tasks/${task?.id}/comments`],
    enabled: !!task?.id,
  });

  const { data: users = [] } = useQuery<UserType[]>({
    queryKey: ["/api/users"],
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

  if (!task) return null;

  const checklistDone = checklist.filter(i => i.completed).length;
  const checklistTotal = checklist.length;
  const checklistPercent = checklistTotal > 0 ? Math.round((checklistDone / checklistTotal) * 100) : 0;
  const overdueTask = isOverdue(task.dueDate, task.status);
  const dueSoonTask = isDueSoon(task.dueDate, task.status);

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="sm:max-w-xl p-0 flex flex-col h-full border-l-0 shadow-2xl">
        {/* Header Section */}
        <div className="p-6 pb-4 bg-muted/30 border-b">
          <SheetHeader className="space-y-4">
            <div className="flex items-start justify-between">
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline" className={getStatusColor(task.status)}>
                  {task.status.replace("_", " ").toUpperCase()}
                </Badge>
                <Badge variant="outline" className={getPriorityColor(task.priority)}>
                  {task.priority.toUpperCase()}
                </Badge>
                {task.isRecurring && (
                  <Badge variant="outline" className="bg-blue-50 text-blue-600 border-blue-200 dark:bg-blue-950 dark:text-blue-400 dark:border-blue-900 gap-1">
                    <Repeat className="w-3 h-3" />
                    Recurring
                  </Badge>
                )}
              </div>
              {onEdit && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onEdit(task)}
                  className="gap-2"
                >
                  <Edit className="w-4 h-4" />
                  Edit
                </Button>
              )}
            </div>
            <SheetTitle className="text-2xl font-bold leading-tight">
              {task.title}
            </SheetTitle>
            <SheetDescription className="text-base">
              {task.description || "No description provided."}
            </SheetDescription>
          </SheetHeader>
        </div>

        {/* Content Section */}
        <ScrollArea className="flex-1">
          <div className="p-6 space-y-8 pb-32">
            {/* Task Details Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-1.5">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Assignee</p>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <User className="w-4 h-4 text-primary" />
                  </div>
                  <span className="text-sm font-medium">
                    {users.find(u => u.id === task.assignedToId)?.firstName || "Unassigned"}
                  </span>
                </div>
              </div>
              <div className="space-y-1.5">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Due Date</p>
                <div className="flex items-center gap-2">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    overdueTask ? "bg-red-100 dark:bg-red-950" : dueSoonTask ? "bg-amber-100 dark:bg-amber-950" : "bg-orange-500/10"
                  }`}>
                    {overdueTask ? (
                      <AlertTriangle className="w-4 h-4 text-red-600 dark:text-red-400" />
                    ) : (
                      <Calendar className="w-4 h-4 text-orange-600" />
                    )}
                  </div>
                  <div>
                    <span className={`text-sm font-medium ${
                      overdueTask ? "text-red-600 dark:text-red-400" :
                      dueSoonTask ? "text-amber-600 dark:text-amber-400" : ""
                    }`}>
                      {task.dueDate ? toLocaleDateStringEST(task.dueDate) : "No due date"}
                    </span>
                    {overdueTask && (
                      <p className="text-xs text-red-500 font-medium">Overdue</p>
                    )}
                    {dueSoonTask && (
                      <p className="text-xs text-amber-500 font-medium">Due soon</p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <Separator />

            {/* Checklist Section */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold flex items-center gap-2 uppercase tracking-widest text-muted-foreground">
                  <CheckCircle2 className="w-4 h-4" />
                  Checklist
                </h3>
                <span className="text-xs font-medium bg-muted px-2 py-0.5 rounded-full">
                  {checklistDone}/{checklistTotal}
                </span>
              </div>

              {/* Progress bar */}
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
              <h3 className="text-sm font-bold flex items-center gap-2 uppercase tracking-widest text-muted-foreground">
                <Paperclip className="w-4 h-4" />
                Attachments
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="border-2 border-dashed rounded-lg p-4 flex flex-col items-center justify-center gap-2 hover:bg-muted/50 transition-colors cursor-pointer min-h-[100px]">
                  <Plus className="w-5 h-5 text-muted-foreground" />
                  <span className="text-xs font-medium text-muted-foreground">Upload file</span>
                </div>
              </div>
            </div>

            <Separator />

            {/* Activity Feed / Comments Section */}
            <div className="space-y-6">
              <h3 className="text-sm font-bold flex items-center gap-2 uppercase tracking-widest text-muted-foreground">
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
                  <div className="text-center py-8 text-muted-foreground">
                    <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-20" />
                    <p className="text-sm">No activity yet. Be the first to comment!</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </ScrollArea>

        {/* Footer: Comment Input Area */}
        <SheetFooter className="p-4 bg-background border-t">
          <div className="w-full space-y-3">
            <div className="relative">
              <Textarea
                placeholder="Write a comment..."
                className="min-h-[80px] pr-12 text-sm resize-none focus-visible:ring-1"
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
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

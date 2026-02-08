import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Calendar,
  User,
  MessageSquare,
  Paperclip,
  History,
  Edit,
  Link,
  Send,
} from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Task, TaskComment } from "@shared/schema";
import { toLocaleDateStringEST } from "@/lib/dateUtils";
import { TaskProgressBar } from "./tasks/TaskProgressBar";
import { TaskActivityTimeline } from "./tasks/TaskActivityTimeline";
import { TaskAttachmentsList } from "./tasks/TaskAttachmentsList";

interface TaskDetailSidebarProps {
  task: Task | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit?: (task: Task) => void;
}

export function TaskDetailSidebar({ task, isOpen, onClose, onEdit }: TaskDetailSidebarProps) {
  const { toast } = useToast();
  const [comment, setComment] = useState("");
  const [activeTab, setActiveTab] = useState("overview");

  useEffect(() => {
    if (isOpen && task) {
      setActiveTab("overview");
    }
  }, [isOpen, task]);

  const { data: users = [] } = useQuery({ queryKey: ["/api/users"] });

  const { data: comments = [] } = useQuery<TaskComment[]>({
    queryKey: [`/api/tasks/${task?.id}/comments`],
    enabled: !!task?.id,
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

  const handleChecklistUpdate = (checklist: any[], progress: number) => {
    updateTaskMutation.mutate({ checklist, taskProgress: progress });
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

  if (!task) return null;

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="sm:max-w-xl p-0 flex flex-col h-full border-l-0 shadow-2xl">
        {/* Header */}
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
              </div>
              {onEdit && (
                <Button variant="outline" size="sm" onClick={() => onEdit(task)}>
                  <Edit className="w-4 h-4 mr-2" />
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

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
          <TabsList className="mx-6 mt-4 justify-start h-auto bg-transparent p-0 gap-2">
            <TabsTrigger value="overview" className="data-[state=active]:bg-muted px-4 py-2">
              Overview
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
              {/* Overview Tab */}
              <TabsContent value="overview" className="mt-0 space-y-6">
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-1.5">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Assignee</p>
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                        <User className="w-4 h-4 text-primary" />
                      </div>
                      <span className="text-sm font-medium">
                        {users.find((u: any) => u.id === task.assignedToId)?.firstName || "Unassigned"}
                      </span>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Due Date</p>
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-orange-500/10 flex items-center justify-center">
                        <Calendar className="w-4 h-4 text-orange-600" />
                      </div>
                      <span className="text-sm font-medium">
                        {task.dueDate ? toLocaleDateStringEST(task.dueDate) : "No due date"}
                      </span>
                    </div>
                  </div>
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

        {/* Comment Input */}
        <SheetFooter className="p-4 bg-background border-t">
          <div className="w-full space-y-3">
            <Textarea
              placeholder="Write a comment..."
              className="min-h-[80px] pr-12 text-sm resize-none focus-visible:ring-1"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
            />
            <Button
              size="sm"
              onClick={() => addCommentMutation.mutate(comment)}
              disabled={!comment.trim() || addCommentMutation.isPending}
            >
              <Send className="w-4 h-4 mr-2" />
              {addCommentMutation.isPending ? "Sending..." : "Send"}
            </Button>
          </div>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

export default TaskDetailSidebar;

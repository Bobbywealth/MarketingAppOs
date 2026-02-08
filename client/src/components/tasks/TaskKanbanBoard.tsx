import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  GripVertical,
  MoreHorizontal,
  Calendar,
  User,
  Flag,
  Paperclip,
  MessageSquare,
  Plus,
  Search,
  Filter,
  LayoutGrid,
  List,
  Loader2,
} from "lucide-react";
import type { Task } from "@shared/schema";
import { formatDistanceToNow } from "date-fns";

interface TaskKanbanBoardProps {
  tasks: Task[];
  onTaskMove: (taskId: string, newStatus: string) => void;
  onTaskClick: (task: Task) => void;
  isLoading?: boolean;
}

interface KanbanColumn {
  id: string;
  title: string;
  color: string;
  tasks: Task[];
}

const statusConfig: Record<string, { label: string; color: string }> = {
  todo: { label: "To Do", color: "bg-gray-100 border-gray-200" },
  in_progress: { label: "In Progress", color: "bg-blue-100 border-blue-200" },
  review: { label: "Review", color: "bg-yellow-100 border-yellow-200" },
  completed: { label: "Completed", color: "bg-green-100 border-green-200" },
};

const priorityConfig: Record<string, { label: string; color: string; icon: string }> = {
  low: { label: "Low", color: "text-blue-600 bg-blue-50", icon: "↓" },
  normal: { label: "Normal", color: "text-gray-600 bg-gray-50", icon: "→" },
  high: { label: "High", color: "text-orange-600 bg-orange-50", icon: "↑" },
  urgent: { label: "Urgent", color: "text-red-600 bg-red-50", icon: "🔥" },
};

export function TaskKanbanBoard({
  tasks,
  onTaskMove,
  onTaskClick,
  isLoading = false,
}: TaskKanbanBoardProps) {
  const [searchText, setSearchText] = useState("");
  const [selectedPriority, setSelectedPriority] = useState<string>("all");

  // Filter tasks based on search and priority
  const filteredTasks = tasks.filter((task) => {
    const matchesSearch =
      !searchText ||
      task.title.toLowerCase().includes(searchText.toLowerCase()) ||
      task.description?.toLowerCase().includes(searchText.toLowerCase());
    const matchesPriority =
      selectedPriority === "all" || task.priority === selectedPriority;
    return matchesSearch && matchesPriority;
  });

  // Group tasks by status
  const columns: KanbanColumn[] = Object.entries(statusConfig).map(
    ([status, config]) => ({
      id: status,
      title: config.label,
      color: config.color,
      tasks: filteredTasks.filter((t) => t.status === status),
    })
  );

  const handleDragStart = (e: React.DragEvent, task: Task) => {
    e.dataTransfer.setData("taskId", task.id);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDrop = (e: React.DragEvent, newStatus: string) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData("taskId");
    if (taskId) {
      onTaskMove(taskId, newStatus);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex items-center gap-4 pb-4 border-b">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search tasks..."
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
        <Select
          value={selectedPriority}
          onValueChange={setSelectedPriority}
        >
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="All Priorities" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Priorities</SelectItem>
            <SelectItem value="low">Low</SelectItem>
            <SelectItem value="normal">Normal</SelectItem>
            <SelectItem value="high">High</SelectItem>
            <SelectItem value="urgent">Urgent</SelectItem>
          </SelectContent>
        </Select>
        <div className="text-sm text-muted-foreground">
          {filteredTasks.length} tasks
        </div>
      </div>

      {/* Kanban Board */}
      <div className="grid grid-cols-4 gap-4 overflow-x-auto pb-4">
        {columns.map((column) => (
          <div
            key={column.id}
            className={`min-w-[280px] rounded-lg border ${column.color}`}
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, column.id)}
          >
            <div className="p-3 border-b flex items-center justify-between">
              <h3 className="font-semibold text-sm">{column.title}</h3>
              <Badge variant="secondary" className="text-xs">
                {column.tasks.length}
              </Badge>
            </div>
            <ScrollArea className="h-[calc(100vh-300px)] p-2">
              <div className="space-y-2">
                {column.tasks.map((task) => (
                  <KanbanCard
                    key={task.id}
                    task={task}
                    onClick={() => onTaskClick(task)}
                    onDragStart={(e) => handleDragStart(e, task)}
                  />
                ))}
                {column.tasks.length === 0 && (
                  <div className="p-4 text-center text-sm text-muted-foreground">
                    No tasks
                  </div>
                )}
              </div>
            </ScrollArea>
          </div>
        ))}
      </div>
    </div>
  );
}

interface KanbanCardProps {
  task: Task;
  onClick: () => void;
  onDragStart: (e: React.DragEvent) => void;
}

function KanbanCard({ task, onClick, onDragStart }: KanbanCardProps) {
  const priority = priorityConfig[task.priority] || priorityConfig.normal;
  const isOverdue =
    task.dueDate && new Date(task.dueDate) < new Date() && task.status !== "completed";
  const checklist = task.checklist as Array<{ id: string; text: string; completed: boolean }> | null;
  const completedCount = checklist?.filter((i) => i.completed).length || 0;
  const totalCount = checklist?.length || 0;
  const progress = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

  return (
    <Card
      className="cursor-move hover:shadow-md transition-shadow"
      onClick={onClick}
      draggable
      onDragStart={onDragStart}
    >
      <CardContent className="p-3 space-y-2">
        {/* Header */}
        <div className="flex items-start justify-between gap-2">
          <h4 className="font-medium text-sm line-clamp-2">{task.title}</h4>
          <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0">
            <MoreHorizontal className="w-4 h-4" />
          </Button>
        </div>

        {/* Priority Badge */}
        <div className="flex items-center gap-2">
          <Badge
            variant="outline"
            className={`text-xs ${priority.color}`}
          >
            {priority.icon} {priority.label}
          </Badge>
          {isOverdue && (
            <Badge variant="destructive" className="text-xs">
              Overdue
            </Badge>
          )}
        </div>

        {/* Progress */}
        {totalCount > 0 && (
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Progress</span>
              <span>
                {completedCount}/{totalCount}
              </span>
            </div>
            <Progress value={progress} className="h-1" />
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t">
          <div className="flex items-center gap-3">
            {task.dueDate && (
              <span className={`flex items-center gap-1 ${isOverdue ? "text-red-500" : ""}`}>
                <Calendar className="w-3 h-3" />
                {formatDistanceToNow(new Date(task.dueDate), { addSuffix: true })}
              </span>
            )}
            {(task as any)._count?.comments > 0 && (
              <span className="flex items-center gap-1">
                <MessageSquare className="w-3 h-3" />
                {(task as any)._count.comments}
              </span>
            )}
            {(task as any).attachmentCount > 0 && (
              <span className="flex items-center gap-1">
                <Paperclip className="w-3 h-3" />
                {(task as any).attachmentCount}
              </span>
            )}
          </div>
          {task.assignedToId && (
            <div className="flex items-center gap-1">
              <User className="w-3 h-3" />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default TaskKanbanBoard;

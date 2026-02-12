import { memo } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, CheckCircle2, Repeat, User, Trash2 } from "lucide-react";
import type { Task, User as UserType } from "@shared/schema";
import { toLocaleDateStringEST } from "@/lib/dateUtils";

interface TaskCardProps {
  task: Task;
  users: UserType[];
  isDragging?: boolean;
  onDragStart?: () => void;
  onDragEnd?: () => void;
  onClick?: () => void;
  onDelete?: (e: React.MouseEvent) => void;
}

export const TaskCard = memo(function TaskCard({
  task,
  users,
  isDragging = false,
  onDragStart,
  onDragEnd,
  onClick,
  onDelete,
}: TaskCardProps) {
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

  return (
    <Card
      draggable
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      className={`hover-elevate transition-all group cursor-grab active:cursor-grabbing border border-muted shadow-sm hover:shadow-md bg-card ${
        isDragging ? 'opacity-50' : ''
      }`}
      data-testid={`task-card-${task.id}`}
      onClick={onClick}
    >
      <CardContent className="p-3 space-y-2">
        {/* Priority indicator */}
        <div className="flex items-start justify-between gap-2 mr-8">
          <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 mt-1.5 ${getPriorityColor(task.priority)}`} />
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
              if (onDelete) onDelete(e);
            }}
            className="absolute top-2 right-2 p-1.5 rounded-md bg-destructive/10 hover:bg-destructive/20 text-destructive transition-colors"
            title="Delete task"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </CardContent>
    </Card>
  );
});

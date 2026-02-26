import { memo } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, CheckCircle2, Repeat, User, Trash2, Clock, Edit, Copy, AlertTriangle } from "lucide-react";
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
  onComplete?: (e: React.MouseEvent) => void;
  onEdit?: (e: React.MouseEvent) => void;
  onDuplicate?: (e: React.MouseEvent) => void;
}

export const TaskCard = memo(function TaskCard({
  task,
  users,
  isDragging = false,
  onDragStart,
  onDragEnd,
  onClick,
  onDelete,
  onComplete,
  onEdit,
  onDuplicate,
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

  const getPriorityBorderColor = (priority: string) => {
    switch (priority) {
      case "urgent": return "border-l-red-500 border-l-4";
      case "high": return "border-l-orange-500 border-l-4";
      default: return "";
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

  // Check if task is overdue
  const isOverdue = () => {
    if (!task.dueDate || task.status === "completed") return false;
    const dueDate = new Date(task.dueDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return dueDate < today;
  };

  // Check if task is due today
  const isDueToday = () => {
    if (!task.dueDate) return false;
    const dueDate = new Date(task.dueDate);
    const today = new Date();
    return dueDate.toDateString() === today.toDateString();
  };

  const overdue = isOverdue();
  const dueToday = isDueToday();
  const assignee = users.find(u => u.id === task.assignedToId);

  return (
    <Card
      draggable
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      className={`hover-elevate transition-all group cursor-grab active:cursor-grabbing border shadow-sm hover:shadow-md bg-card relative ${
        isDragging ? 'opacity-50' : ''
      } ${getPriorityBorderColor(task.priority)}
      ${overdue ? 'border-red-300 bg-red-50/50 dark:bg-red-950/20' : ''}
      ${task.priority === "urgent" && !overdue ? 'border-red-200 bg-red-50/30 dark:bg-red-950/10' : ''}
      `}
      data-testid={`task-card-${task.id}`}
      onClick={onClick}
    >
      {/* Quick Actions Overlay - appears on hover */}
      <div className="absolute top-2 right-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
        {task.status !== "completed" && onComplete && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onComplete(e);
            }}
            className="p-1.5 rounded-md bg-green-500/10 hover:bg-green-500/20 text-green-600 transition-colors"
            title="Mark complete"
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
          </button>
        )}
        {onEdit && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onEdit(e);
            }}
            className="p-1.5 rounded-md bg-blue-500/10 hover:bg-blue-500/20 text-blue-600 transition-colors"
            title="Edit task"
          >
            <Edit className="w-3.5 h-3.5" />
          </button>
        )}
        {onDuplicate && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDuplicate(e);
            }}
            className="p-1.5 rounded-md bg-gray-500/10 hover:bg-gray-500/20 text-gray-600 transition-colors"
            title="Duplicate task"
          >
            <Copy className="w-3.5 h-3.5" />
          </button>
        )}
        {onDelete && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete(e);
            }}
            className="p-1.5 rounded-md bg-destructive/10 hover:bg-destructive/20 text-destructive transition-colors"
            title="Delete task"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      <CardContent className="p-3 space-y-2">
        {/* Priority Badge for Urgent/High Priority */}
        {(task.priority === "urgent" || task.priority === "high") && (
          <div className="flex items-center gap-1.5">
            {task.priority === "urgent" && (
              <Badge variant="destructive" className="text-[10px] px-1.5 py-0 h-4 gap-1">
                <AlertTriangle className="w-2.5 h-2.5" />
                URGENT
              </Badge>
            )}
            {task.priority === "high" && (
              <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4 bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400">
                HIGH
              </Badge>
            )}
          </div>
        )}

        {/* Title with priority indicator */}
        <div className="flex items-start gap-2 pr-16">
          <div className={`w-2 h-2 rounded-full flex-shrink-0 mt-1.5 ${getPriorityColor(task.priority)}`} />
          <h4 className={`font-medium text-sm leading-tight flex-1 line-clamp-2 ${
            task.status === "completed" ? "line-through text-muted-foreground" : ""
          }`}>
            {task.title}
          </h4>
        </div>

        {/* Description preview */}
        {task.description && (
          <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed pl-4">
            {task.description}
          </p>
        )}

        {/* Meta info row */}
        <div className="flex items-center justify-between text-xs text-muted-foreground pl-4">
          <div className="flex items-center gap-2 flex-wrap">
            {/* Due Date with overdue/today highlighting */}
            {!!task.dueDate && (
              <div className={`flex items-center gap-1 ${
                overdue ? "text-red-600 font-medium" : 
                dueToday ? "text-orange-600 font-medium" : ""
              }`}>
                {overdue ? (
                  <Clock className="w-3 h-3" />
                ) : (
                  <Calendar className="w-3 h-3" />
                )}
                {String(toLocaleDateStringEST(task.dueDate))}
                {overdue && <span className="text-[10px]">(Overdue)</span>}
                {dueToday && !overdue && <span className="text-[10px]">(Today)</span>}
              </div>
            )}
            
            {/* Checklist progress */}
            {!!task.checklist && Array.isArray(task.checklist) && (task.checklist as any[]).length > 0 && (
              <div className="flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" />
                {(task.checklist as any[]).filter((i: any) => i.completed).length}/{(task.checklist as any[]).length}
              </div>
            )}
            
            {/* Recurring indicator */}
            {task.isRecurring && (
              <Repeat className="w-3 h-3 text-blue-500" />
            )}
          </div>
          
          {/* Assignee avatar */}
          {assignee && (
            <div className="flex items-center gap-1.5">
              <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center text-[10px] font-bold text-primary" title={assignee.username}>
                {assignee.firstName?.[0] || assignee.username?.[0] || "?"}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
});

export default TaskCard;

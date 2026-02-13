import { memo, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Calendar, 
  CheckCircle2, 
  Repeat, 
  Trash2, 
  User,
  MoreHorizontal
} from "lucide-react";
import type { Task, User as UserType } from "@shared/schema";
import { toLocaleDateStringEST } from "@/lib/dateUtils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface TaskCardProps {
  task: Task;
  users: UserType[];
  isDragging: boolean;
  onClick: () => void;
  onDragStart: () => void;
  onDragEnd: () => void;
  onDelete: () => void;
  onDuplicate: () => void;
}

const TaskCard = memo(function TaskCard({
  task,
  users,
  isDragging,
  onClick,
  onDragStart,
  onDragEnd,
  onDelete,
  onDuplicate,
}: TaskCardProps) {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const taskDueDate = task.dueDate ? new Date(task.dueDate) : null;
  const isOverdue = taskDueDate && taskDueDate < today && task.status !== "completed";
  const isDueToday = taskDueDate && taskDueDate.toDateString() === today.toDateString();

  const priorityColors = {
    urgent: "bg-red-500",
    high: "bg-orange-500",
    normal: "bg-blue-500",
    low: "bg-gray-400",
  };

  return (
    <Card
      draggable
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      className={`
        hover-elevate transition-all group cursor-grab active:cursor-grabbing 
        border shadow-sm hover:shadow-md relative
        ${isDragging ? "opacity-50" : ""}
        ${isOverdue ? "border-l-4 border-l-red-500 bg-red-50/50 dark:bg-red-950/20" : ""}
        ${isDueToday && !isOverdue ? "border-l-4 border-l-orange-500 bg-orange-50/50 dark:bg-orange-950/20" : ""}
      `}
      onClick={onClick}
      data-testid={`task-card-${task.id}`}
      data-priority={task.priority}
      data-overdue={isOverdue}
    >
      <CardContent className="p-3 space-y-2">
        {/* Priority indicator */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-start gap-2 flex-1 min-w-0">
            <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 mt-1.5 ${priorityColors[task.priority as keyof typeof priorityColors] || "bg-gray-400"}`} />
            <h4 className="font-medium text-sm leading-tight flex-1 line-clamp-2">{task.title}</h4>
          </div>
          
          {/* Actions menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
              <Button variant="ghost" size="sm" className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100">
                <MoreHorizontal className="w-3.5 h-3.5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
              <DropdownMenuItem onClick={onDuplicate}>
                Duplicate
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete();
                }}
                className="text-destructive focus:text-destructive"
              >
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Description preview */}
        {task.description && (
          <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
            {task.description}
          </p>
        )}

        {/* Tags */}
        {task.tags && task.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {task.tags.slice(0, 3).map((tag, i) => (
              <Badge key={i} variant="outline" className="text-[10px] px-1.5 py-0 h-4">
                {tag}
              </Badge>
            ))}
            {task.tags.length > 3 && (
              <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4">
                +{task.tags.length - 3}
              </Badge>
            )}
          </div>
        )}

        {/* Meta info row */}
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            {taskDueDate && (
              <div className={`flex items-center gap-1 ${isOverdue ? "text-red-600 font-medium" : ""}`}>
                <Calendar className="w-3 h-3" />
                {toLocaleDateStringEST(task.dueDate!)}
              </div>
            )}
            {task.checklist && Array.isArray(task.checklist) && (task.checklist as Array<{completed: boolean}>).length > 0 ? (
              <div className="flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" />
                <span>{(task.checklist as Array<{completed: boolean}>).filter(i => i.completed).length}/{(task.checklist as Array<{completed: boolean}>).length}</span>
              </div>
            ) : null}
            {task.isRecurring && (
              <Repeat className="w-3 h-3 text-blue-500" />
            )}
          </div>
          <div className="flex items-center gap-1">
            {task.assignedToId ? (
              <div 
                className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center text-[10px] font-bold text-primary"
                title={users.find(u => u.id === task.assignedToId)?.firstName || "Unknown"}
              >
                {users.find(u => u.id === task.assignedToId)?.firstName?.[0] || "?"}
              </div>
            ) : (
              <div className="w-5 h-5 rounded-full border border-dashed flex items-center justify-center text-muted-foreground/30">
                <User className="w-3 h-3" />
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
});

interface KanbanColumn {
  id: string;
  title: string;
  icon: string;
}

interface TaskKanbanBoardProps {
  tasks: Task[];
  users: UserType[];
  draggedTask: Task | null;
  onDragStart: (task: Task) => void;
  onDragEnd: () => void;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent, status: string) => void;
  onTaskClick: (task: Task) => void;
  onTaskDelete: (taskId: string) => void;
  onTaskDuplicate: (taskId: string) => void;
}

const DEFAULT_COLUMNS: KanbanColumn[] = [
  { id: "todo", title: "To Do", icon: "📋" },
  { id: "in_progress", title: "In Progress", icon: "⚡" },
  { id: "review", title: "Review", icon: "👀" },
  { id: "completed", title: "Completed", icon: "✅" },
];

export function TaskKanbanBoard({
  tasks,
  users,
  draggedTask,
  onDragStart,
  onDragEnd,
  onDragOver,
  onDrop,
  onTaskClick,
  onTaskDelete,
  onTaskDuplicate,
}: TaskKanbanBoardProps) {
  const getColumnTasks = useCallback((status: string) => {
    return tasks.filter(task => task.status === status);
  }, [tasks]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 h-full p-4 overflow-x-auto">
      {DEFAULT_COLUMNS.map((column) => {
        const columnTasks = getColumnTasks(column.id);
        const isDropTarget = draggedTask && draggedTask.status !== column.id;

        return (
          <div
            key={column.id}
            className="flex flex-col h-full min-w-[200px] md:min-w-[240px] lg:min-w-[280px] bg-muted/30 rounded-xl border p-3 backdrop-blur-sm"
            onDragOver={onDragOver}
            onDrop={(e) => onDrop(e, column.id)}
            style={{
              borderColor: isDropTarget ? "hsl(var(--primary) / 0.3)" : undefined,
              backgroundColor: isDropTarget ? "hsl(var(--primary) / 0.05)" : undefined,
            }}
          >
            {/* Column Header */}
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
            </div>

            {/* Task Cards */}
            <div 
              className="space-y-3 flex-1 overflow-y-auto pr-1 custom-scrollbar"
            >
              {columnTasks.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  users={users}
                  isDragging={draggedTask?.id === task.id}
                  onClick={() => onTaskClick(task)}
                  onDragStart={() => onDragStart(task)}
                  onDragEnd={onDragEnd}
                  onDelete={() => onTaskDelete(task.id)}
                  onDuplicate={() => onTaskDuplicate(task.id)}
                />
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
}

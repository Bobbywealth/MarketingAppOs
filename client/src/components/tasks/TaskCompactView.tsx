import { memo } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { User, Repeat, MoreHorizontal, Copy, Trash2 } from "lucide-react";
import type { Task, User as UserType } from "@shared/schema";
import { toLocaleDateStringEST } from "@/lib/dateUtils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

interface TaskRowProps {
  task: Task;
  users: UserType[];
  isSelected: boolean;
  isExpanded: boolean;
  onToggleSelection: (e?: React.MouseEvent) => void;
  onClick: () => void;
  onDelete: () => void;
  onDuplicate: () => void;
}

const TaskRow = memo(function TaskRow({
  task,
  users,
  isSelected,
  isExpanded,
  onToggleSelection,
  onClick,
  onDelete,
  onDuplicate,
}: TaskRowProps) {
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

  const assignee = users.find(u => u.id === task.assignedToId);

  return (
    <div 
      className={`group relative ${
        isSelected ? "bg-primary/5" : ""
      } ${isOverdue ? "bg-red-50/30 dark:bg-red-950/10" : ""}`}
      data-testid={`task-row-${task.id}`}
      data-priority={task.priority}
      data-overdue={isOverdue}
    >
      {/* Mobile Layout */}
      <div
        className={`md:hidden flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-muted/30 transition-colors ${
          isOverdue ? "border-l-4 border-l-red-500" : isDueToday ? "border-l-4 border-l-orange-500" : ""
        }`}
        onClick={onClick}
      >
        <Checkbox
          checked={isSelected}
          onCheckedChange={() => onToggleSelection()}
          onClick={(e) => e.stopPropagation()}
          className="h-4 w-4"
        />
        <div className={`w-2 h-8 rounded-full flex-shrink-0 ${priorityColors[task.priority as keyof typeof priorityColors] || "bg-gray-400"}`} />
        <div className="flex-1 min-w-0">
          <span className="font-medium text-sm line-clamp-2">{task.title}</span>
          {task.description && (
            <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5 leading-relaxed">
              {task.description}
            </p>
          )}
          <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
            <span className="capitalize">{task.status.replace("_", " ")}</span>
            {taskDueDate && (
              <span className={isOverdue ? "text-red-600 font-medium" : ""}>
                {toLocaleDateStringEST(task.dueDate!)}
              </span>
            )}
          </div>
        </div>
        {assignee && (
          <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
            {assignee.firstName?.[0] || "?"}
          </div>
        )}
      </div>

      {/* Desktop Layout */}
      <div
        className="hidden md:grid grid-cols-12 gap-4 items-center px-4 py-3 cursor-pointer hover:bg-muted/30 transition-colors"
        onClick={onClick}
      >
        <div className="col-span-1 flex justify-center">
          <Checkbox
            checked={isSelected}
            onCheckedChange={() => onToggleSelection()}
            onClick={(e) => e.stopPropagation()}
            className="h-4 w-4"
          />
        </div>
        
        <div className="col-span-5 flex items-center gap-3 min-w-0">
          <div className={`w-2 h-2 rounded-full flex-shrink-0 ${priorityColors[task.priority as keyof typeof priorityColors] || "bg-gray-400"}`} />
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="line-clamp-2 text-sm font-medium">{task.title}</span>
              {task.isRecurring && <Repeat className="w-3.5 h-3.5 text-blue-500 flex-shrink-0" />}
            </div>
            {task.description && (
              <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5 leading-relaxed">
                {task.description}
              </p>
            )}
            {/* Tags */}
            {task.tags && task.tags.length > 0 && (
              <div className="flex gap-1 mt-1">
                {task.tags.slice(0, 2).map((tag, i) => (
                  <Badge key={i} variant="outline" className="text-[10px] px-1 py-0 h-4">
                    {tag}
                  </Badge>
                ))}
                {task.tags.length > 2 && (
                  <Badge variant="outline" className="text-[10px] px-1 py-0 h-4">
                    +{task.tags.length - 2}
                  </Badge>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="col-span-2">
          <Badge 
            variant="secondary" 
            className={`text-xs capitalize ${
              task.status === "completed" ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" :
              task.status === "in_progress" ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" :
              task.status === "review" ? "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400" :
              ""
            }`}
          >
            {task.status.replace("_", " ")}
          </Badge>
        </div>

        <div className={`col-span-2 text-xs ${isOverdue ? "text-red-600 font-medium" : "text-muted-foreground"}`}>
          {taskDueDate ? toLocaleDateStringEST(task.dueDate!) : "-"}
          {isOverdue && <span className="ml-1">⚠️</span>}
        </div>

        <div className="col-span-2 flex items-center justify-end gap-2">
          {assignee ? (
            <div 
              className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary"
              title={`${assignee.firstName} ${assignee.lastName}`}
            >
              {assignee.firstName?.[0] || "?"}
            </div>
          ) : (
            <div className="w-7 h-7 rounded-full border border-dashed flex items-center justify-center text-muted-foreground/30">
              <User className="w-3 h-3" />
            </div>
          )}
          
          {/* Quick actions */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
              <Button variant="ghost" size="sm" className="h-7 w-7 p-0 opacity-0 group-hover:opacity-100">
                <MoreHorizontal className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
              <DropdownMenuItem onClick={onDuplicate}>
                <Copy className="w-4 h-4 mr-2" />
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
                <Trash2 className="w-4 h-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  );
});

interface TaskCompactViewProps {
  tasks: Task[];
  users: UserType[];
  selectedTaskIds: Set<string>;
  expandedTaskId: string | null;
  onToggleTaskSelection: (taskId: string, event?: React.MouseEvent) => void;
  onSelectAll: () => void;
  onTaskClick: (task: Task) => void;
  onTaskDelete: (taskId: string) => void;
  onTaskDuplicate: (taskId: string) => void;
}

export function TaskCompactView({
  tasks,
  users,
  selectedTaskIds,
  expandedTaskId,
  onToggleTaskSelection,
  onSelectAll,
  onTaskClick,
  onTaskDelete,
  onTaskDuplicate,
}: TaskCompactViewProps) {
  const allSelected = tasks.length > 0 && selectedTaskIds.size === tasks.length;

  return (
    <div className="border rounded-lg overflow-hidden bg-card">
      {/* Header */}
      <div className="hidden md:grid grid-cols-12 gap-4 px-4 py-2 bg-muted/50 border-b text-xs font-medium text-muted-foreground items-center">
        <div className="col-span-1 flex justify-center">
          <Checkbox
            checked={allSelected}
            onCheckedChange={onSelectAll}
            className="h-4 w-4"
          />
        </div>
        <div className="col-span-5">TASK</div>
        <div className="col-span-2">STATUS</div>
        <div className="col-span-2">DUE</div>
        <div className="col-span-2 text-right">ASSIGNEE</div>
      </div>

      {/* Task Rows */}
      <div className="divide-y">
        {tasks.map((task) => (
          <TaskRow
            key={task.id}
            task={task}
            users={users}
            isSelected={selectedTaskIds.has(task.id)}
            isExpanded={expandedTaskId === task.id}
            onToggleSelection={(e) => onToggleTaskSelection(task.id, e)}
            onClick={() => onTaskClick(task)}
            onDelete={() => onTaskDelete(task.id)}
            onDuplicate={() => onTaskDuplicate(task.id)}
          />
        ))}
        {tasks.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            No tasks match your filters
          </div>
        )}
      </div>
    </div>
  );
}

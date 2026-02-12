import { memo } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Plus, MoreHorizontal } from "lucide-react";
import { TaskCard } from './TaskCard';
import type { Task } from "@shared/schema";
import { toLocaleDateStringEST } from "@/lib/dateUtils";

interface TaskKanbanColumnProps {
  id: string;
  title: string;
  icon: string;
  tasks: Task[];
  users: any[];
  isDragging?: boolean;
  onDragStart?: (task: Task) => void;
  onDragEnd?: () => void;
  onClickTask?: (task: Task) => void;
  onDeleteTask?: (task: Task, e: React.MouseEvent) => void;
  onAddTask?: () => void;
  onMenuClick?: (task: Task, e: React.MouseEvent) => void;
}

export const TaskKanbanColumn = memo(function TaskKanbanColumn({
  id,
  title,
  icon,
  tasks,
  users,
  isDragging = false,
  onDragStart,
  onDragEnd,
  onClickTask,
  onDeleteTask,
  onAddTask,
  onMenuClick,
}: TaskKanbanColumnProps) {
  return (
    <div
      className="flex flex-col h-full min-w-[200px] md:min-w-[240px] lg:min-w-[280px] bg-muted/30 rounded-xl border p-3 backdrop-blur-sm"
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => {
        e.preventDefault();
        // Handle drop logic in parent
      }}
    >
      <div className="mb-4 px-2 py-1 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xl">{icon}</span>
          <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
            {title}
          </h3>
          <Badge variant="secondary" className="ml-2 bg-background/50 text-[10px] px-1.5 h-4 min-w-[20px] justify-center">
            {tasks.length}
          </Badge>
        </div>
        <Button variant="ghost" size="sm" className="h-7 w-7 p-0 opacity-50 hover:opacity-100">
          <Plus className="w-4 h-4" />
        </Button>
      </div>

      <div className="space-y-3 flex-1 overflow-y-auto pr-1 custom-scrollbar"
        style={{
          borderColor: isDragging ? 'hsl(var(--primary) / 0.3)' : 'transparent',
          backgroundColor: isDragging ? 'hsl(var(--primary) / 0.05)' : 'transparent'
        }}
      >
        {tasks.map((task) => (
          <TaskCard
            key={task.id}
            task={task}
            users={users}
            isDragging={isDragging}
            onDragStart={() => onDragStart?.(task)}
            onDragEnd={onDragEnd}
            onClick={() => onClickTask?.(task)}
            onDelete={(e) => onDeleteTask?.(task, e)}
          />
        ))}
        {tasks.length === 0 && (
          <div className="text-center py-10 border-2 border-dashed rounded-xl border-muted/20 text-muted-foreground/50 text-xs">
            Drop tasks here
          </div>
        )}
      </div>
    </div>
  );
});

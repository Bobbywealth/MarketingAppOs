import { memo } from 'react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { CheckCircle2, Trash2, Edit, Archive, MoreHorizontal } from "lucide-react";
import type { Task } from "@shared/schema";

interface TaskBulkActionsProps {
  selectedTaskIds: Set<string>;
  totalTasks: number;
  onClearSelection: () => void;
  onEditTasks: () => void;
  onDeleteTasks: () => void;
  onArchiveTasks: () => void;
  onMarkComplete: () => void;
  onMarkIncomplete: () => void;
}

export const TaskBulkActions = memo(function TaskBulkActions({
  selectedTaskIds,
  totalTasks,
  onClearSelection,
  onEditTasks,
  onDeleteTasks,
  onArchiveTasks,
  onMarkComplete,
  onMarkIncomplete,
}: TaskBulkActionsProps) {
  const selectedCount = selectedTaskIds.size;

  if (selectedCount === 0) {
    return null;
  }

  return (
    <div className="flex items-center justify-between px-4 py-2 bg-muted/50 border-b">
      <div className="flex items-center gap-2">
        <Checkbox
          checked={selectedCount === totalTasks && totalTasks > 0}
          onCheckedChange={onClearSelection}
          className="h-4 w-4"
        />
        <Badge variant="secondary" className="bg-background/50">
          {selectedCount} selected
        </Badge>
      </div>

      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={onMarkComplete}
          className="gap-2"
        >
          <CheckCircle2 className="w-4 h-4" />
          Mark Complete
        </Button>

        <Button
          variant="ghost"
          size="sm"
          onClick={onMarkIncomplete}
          className="gap-2"
        >
          <Edit className="w-4 h-4" />
          Mark Incomplete
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="gap-2">
              <MoreHorizontal className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={onEditTasks} className="gap-2">
              <Edit className="w-4 h-4" />
              Edit Tasks
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onArchiveTasks} className="gap-2">
              <Archive className="w-4 h-4" />
              Archive Tasks
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={onDeleteTasks}
              className="gap-2 text-destructive"
            >
              <Trash2 className="w-4 h-4" />
              Delete Tasks
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
});

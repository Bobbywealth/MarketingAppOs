import { memo } from 'react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Filter, Eye, EyeOff } from "lucide-react";
import type { TaskSpace } from "@shared/schema";

interface SpaceOption {
  id: string;
  label: string;
}

interface TaskFiltersPanelProps {
  isOpen: boolean;
  onToggle: () => void;
  filterStatus: string;
  onStatusChange: (status: string) => void;
  filterPriority: string;
  onPriorityChange: (priority: string) => void;
  selectedSpaceId: string | null;
  onSpaceChange: (spaceId: string | null) => void;
  showCompleted: boolean;
  onShowCompletedChange: (show: boolean) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  spaceOptions: SpaceOption[];
  activeFilterCount: number;
}

export const TaskFiltersPanel = memo(function TaskFiltersPanel({
  isOpen,
  onToggle,
  filterStatus,
  onStatusChange,
  filterPriority,
  onPriorityChange,
  selectedSpaceId,
  onSpaceChange,
  showCompleted,
  onShowCompletedChange,
  searchQuery,
  onSearchChange,
  spaceOptions,
  activeFilterCount,
}: TaskFiltersPanelProps) {
  const handleClearFilters = () => {
    onStatusChange("all");
    onPriorityChange("all");
    onSpaceChange(null);
    onShowCompletedChange(true);
    onSearchChange('');
  };

  const hasActiveFilters = filterStatus !== "all" || filterPriority !== "all" || selectedSpaceId !== null || !showCompleted;

  return (
    <>
      {/* Filter Button */}
      <Button
        variant={isOpen ? "default" : "outline"}
        size="sm"
        onClick={onToggle}
        className="gap-2"
      >
        <Filter className="w-4 h-4" />
        Filter
        {activeFilterCount > 0 && (
          <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs">
            {activeFilterCount}
          </Badge>
        )}
      </Button>

      {/* Collapsible Filter Panel */}
      {isOpen && (
        <div className="w-full flex flex-wrap items-center gap-3 p-3 bg-muted/30 rounded-lg animate-in fade-in slide-in-from-top-2">
          <Select value={filterStatus} onValueChange={onStatusChange}>
            <SelectTrigger className="w-36" data-testid="select-filter-status">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="todo">To Do</SelectItem>
              <SelectItem value="in_progress">In Progress</SelectItem>
              <SelectItem value="review">Review</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
            </SelectContent>
          </Select>

          <Select value={filterPriority} onValueChange={onPriorityChange}>
            <SelectTrigger className="w-36" data-testid="select-filter-priority">
              <SelectValue placeholder="Priority" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Priority</SelectItem>
              <SelectItem value="low">Low</SelectItem>
              <SelectItem value="normal">Normal</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="urgent">Urgent</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={selectedSpaceId || ""}
            onValueChange={(val) => onSpaceChange(val || null)}
          >
            <SelectTrigger className="w-40">
              <SelectValue placeholder="All Spaces" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Spaces</SelectItem>
              {spaceOptions.map((space) => (
                <SelectItem key={space.id} value={space.id}>
                  {space.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button
            variant={showCompleted ? "outline" : "secondary"}
            size="sm"
            onClick={() => onShowCompletedChange(!showCompleted)}
            className="gap-2"
          >
            {showCompleted ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            {showCompleted ? "Hide Completed" : "Show Completed"}
          </Button>

          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClearFilters}
              className="text-muted-foreground"
            >
              Clear filters
            </Button>
          )}
        </div>
      )}
    </>
  );
});

export default TaskFiltersPanel;

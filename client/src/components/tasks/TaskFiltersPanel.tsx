import { memo } from 'react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Filter, Eye, EyeOff, X, Calendar, User as UserIcon, Building2, Clock } from "lucide-react";
import type { TaskSpace, Client, User } from "@shared/schema";

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
  // New advanced filters
  filterClientId?: string | null;
  onClientChange?: (clientId: string | null) => void;
  filterAssigneeId?: string | null;
  onAssigneeChange?: (assigneeId: string | null) => void;
  filterDueDateRange?: string | null;
  onDueDateRangeChange?: (range: string | null) => void;
  clients?: Client[];
  users?: User[];
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
  // New advanced filters
  filterClientId = null,
  onClientChange,
  filterAssigneeId = null,
  onAssigneeChange,
  filterDueDateRange = null,
  onDueDateRangeChange,
  clients = [],
  users = [],
}: TaskFiltersPanelProps) {
  const handleClearFilters = () => {
    onStatusChange("all");
    onPriorityChange("all");
    onSpaceChange(null);
    onShowCompletedChange(true);
    onSearchChange('');
    onClientChange?.(null);
    onAssigneeChange?.(null);
    onDueDateRangeChange?.(null);
  };

  const hasActiveFilters = 
    filterStatus !== "all" || 
    filterPriority !== "all" || 
    selectedSpaceId !== null || 
    !showCompleted ||
    filterClientId !== null ||
    filterAssigneeId !== null ||
    filterDueDateRange !== null;

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
        <div className="w-full space-y-3 p-4 bg-muted/30 rounded-lg animate-in fade-in slide-in-from-top-2">
          {/* Row 1: Basic Filters */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Search Input */}
            <div className="relative flex-1 min-w-[200px] max-w-[300px]">
              <Input
                placeholder="Search tasks..."
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                className="pr-8"
                data-testid="input-search-tasks"
              />
              {searchQuery && (
                <button
                  onClick={() => onSearchChange('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 rounded-full hover:bg-muted text-muted-foreground"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

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
          </div>

          {/* Row 2: Advanced Filters */}
          <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-muted">
            <span className="text-xs text-muted-foreground font-medium flex items-center gap-1">
              <Filter className="w-3 h-3" />
              Advanced Filters
            </span>

            {/* Client Filter */}
            {onClientChange && (
              <Select
                value={filterClientId || ""}
                onValueChange={(val) => onClientChange(val || null)}
              >
                <SelectTrigger className="w-44" data-testid="select-filter-client">
                  <Building2 className="w-3.5 h-3.5 mr-1.5 text-muted-foreground" />
                  <SelectValue placeholder="All Clients" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Clients</SelectItem>
                  {clients.map((client) => (
                    <SelectItem key={client.id} value={client.id}>
                      {client.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            {/* Assignee Filter */}
            {onAssigneeChange && (
              <Select
                value={filterAssigneeId || ""}
                onValueChange={(val) => onAssigneeChange(val || null)}
              >
                <SelectTrigger className="w-44" data-testid="select-filter-assignee">
                  <UserIcon className="w-3.5 h-3.5 mr-1.5 text-muted-foreground" />
                  <SelectValue placeholder="All Assignees" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Assignees</SelectItem>
                  <SelectItem value="unassigned">Unassigned</SelectItem>
                  {users.map((user) => (
                    <SelectItem key={user.id} value={user.id.toString()}>
                      {user.firstName && user.lastName 
                        ? `${user.firstName} ${user.lastName}`
                        : user.username}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            {/* Due Date Range Filter */}
            {onDueDateRangeChange && (
              <Select
                value={filterDueDateRange || ""}
                onValueChange={(val) => onDueDateRangeChange(val || null)}
              >
                <SelectTrigger className="w-44" data-testid="select-filter-due-date">
                  <Calendar className="w-3.5 h-3.5 mr-1.5 text-muted-foreground" />
                  <SelectValue placeholder="Any Due Date" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Any Due Date</SelectItem>
                  <SelectItem value="overdue">
                    <span className="flex items-center gap-1.5">
                      <Clock className="w-3 h-3 text-red-500" />
                      Overdue
                    </span>
                  </SelectItem>
                  <SelectItem value="today">Today</SelectItem>
                  <SelectItem value="tomorrow">Tomorrow</SelectItem>
                  <SelectItem value="this_week">This Week</SelectItem>
                  <SelectItem value="next_week">Next Week</SelectItem>
                  <SelectItem value="this_month">This Month</SelectItem>
                  <SelectItem value="no_date">No Due Date</SelectItem>
                </SelectContent>
              </Select>
            )}

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
                Clear all filters
              </Button>
            )}
          </div>
        </div>
      )}
    </>
  );
});

export default TaskFiltersPanel;

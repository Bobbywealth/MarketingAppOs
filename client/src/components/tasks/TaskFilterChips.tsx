import { X, Calendar, User, Building2, Tag, AlertTriangle, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { Client, User as UserType } from "@shared/schema";

interface FilterChip {
  id: string;
  label: string;
  icon?: React.ReactNode;
  onRemove: () => void;
}

interface TaskFilterChipsProps {
  // Basic filters
  filterStatus: string;
  filterPriority: string;
  searchQuery: string;
  // Advanced filters
  filterClientId: string | null;
  filterAssigneeId: string | null;
  filterDueDateRange: string | null;
  selectedSpaceId: string | null;
  showCompleted: boolean;
  // Data for labels
  clients: Client[];
  users: UserType[];
  // Clear functions
  onClearStatus: () => void;
  onClearPriority: () => void;
  onClearSearch: () => void;
  onClearClient: () => void;
  onClearAssignee: () => void;
  onClearDueDate: () => void;
  onClearSpace: () => void;
  onToggleCompleted: () => void;
  onClearAll: () => void;
}

const statusLabels: Record<string, string> = {
  todo: "To Do",
  in_progress: "In Progress",
  review: "Review",
  completed: "Completed",
};

const priorityLabels: Record<string, string> = {
  low: "Low Priority",
  normal: "Normal Priority",
  high: "High Priority",
  urgent: "Urgent",
};

const dueDateLabels: Record<string, string> = {
  overdue: "Overdue",
  today: "Due Today",
  tomorrow: "Due Tomorrow",
  this_week: "Due This Week",
  next_week: "Due Next Week",
  this_month: "Due This Month",
  no_date: "No Due Date",
};

export function TaskFilterChips({
  filterStatus,
  filterPriority,
  searchQuery,
  filterClientId,
  filterAssigneeId,
  filterDueDateRange,
  selectedSpaceId,
  showCompleted,
  clients,
  users,
  onClearStatus,
  onClearPriority,
  onClearSearch,
  onClearClient,
  onClearAssignee,
  onClearDueDate,
  onClearSpace,
  onToggleCompleted,
  onClearAll,
}: TaskFilterChipsProps) {
  const chips: FilterChip[] = [];

  // Status filter
  if (filterStatus !== "all") {
    chips.push({
      id: "status",
      label: statusLabels[filterStatus] || filterStatus,
      icon: <Tag className="w-3 h-3" />,
      onRemove: onClearStatus,
    });
  }

  // Priority filter
  if (filterPriority !== "all") {
    chips.push({
      id: "priority",
      label: priorityLabels[filterPriority] || filterPriority,
      icon: <AlertTriangle className="w-3 h-3" />,
      onRemove: onClearPriority,
    });
  }

  // Search query
  if (searchQuery.trim()) {
    chips.push({
      id: "search",
      label: `"${searchQuery.trim().slice(0, 20)}${searchQuery.trim().length > 20 ? '...' : ''}"`,
      onRemove: onClearSearch,
    });
  }

  // Client filter
  if (filterClientId) {
    const client = clients.find(c => c.id === filterClientId);
    chips.push({
      id: "client",
      label: client?.name || "Unknown Client",
      icon: <Building2 className="w-3 h-3" />,
      onRemove: onClearClient,
    });
  }

  // Assignee filter
  if (filterAssigneeId) {
    const assigneeLabel = filterAssigneeId === "unassigned" 
      ? "Unassigned" 
      : users.find(u => u.id.toString() === filterAssigneeId)?.firstName || "Unknown";
    chips.push({
      id: "assignee",
      label: assigneeLabel,
      icon: <User className="w-3 h-3" />,
      onRemove: onClearAssignee,
    });
  }

  // Due date filter
  if (filterDueDateRange) {
    chips.push({
      id: "dueDate",
      label: dueDateLabels[filterDueDateRange] || filterDueDateRange,
      icon: <Calendar className="w-3 h-3" />,
      onRemove: onClearDueDate,
    });
  }

  // Space filter
  if (selectedSpaceId) {
    chips.push({
      id: "space",
      label: "Space Filter Active",
      icon: <Tag className="w-3 h-3" />,
      onRemove: onClearSpace,
    });
  }

  // Show completed toggle
  if (showCompleted) {
    chips.push({
      id: "completed",
      label: "Showing Completed",
      icon: <Clock className="w-3 h-3" />,
      onRemove: onToggleCompleted,
    });
  }

  if (chips.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-wrap items-center gap-2 px-4 py-2 bg-muted/30 border-b">
      <span className="text-xs text-muted-foreground font-medium">Active Filters:</span>
      {chips.map((chip) => (
        <Badge
          key={chip.id}
          variant="secondary"
          className="flex items-center gap-1.5 pr-1.5 text-xs bg-primary/10 hover:bg-primary/20 transition-colors"
        >
          {chip.icon}
          <span>{chip.label}</span>
          <button
            onClick={chip.onRemove}
            className="ml-1 rounded-full p-0.5 hover:bg-background/50 transition-colors"
            aria-label={`Remove ${chip.label} filter`}
          >
            <X className="w-3 h-3" />
          </button>
        </Badge>
      ))}
      {chips.length > 1 && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onClearAll}
          className="h-6 px-2 text-xs text-muted-foreground hover:text-destructive"
        >
          Clear All
        </Button>
      )}
    </div>
  );
}

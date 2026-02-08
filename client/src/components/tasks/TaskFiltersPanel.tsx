import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Search,
  Filter,
  X,
  Save,
  Star,
  Trash2,
  Calendar,
  User,
  Flag,
  Tag,
  Loader2,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { Task, User as UserType } from "@shared/schema";

interface TaskFilters {
  status?: string[];
  priority?: string[];
  assigneeId?: number;
  spaceId?: string;
  clientId?: string;
  dueDateFrom?: string;
  dueDateTo?: string;
  tags?: string[];
  searchText?: string;
  hasDependencies?: boolean;
  isBlocking?: boolean;
  overdue?: boolean;
}

interface TaskFiltersPanelProps {
  filters: TaskFilters;
  onChange: (filters: TaskFilters) => void;
  onClear: () => void;
  onSave?: (name: string) => void;
  savedSearches?: Array<{ id: string; name: string; filters: TaskFilters }>;
}

const statusOptions = [
  { value: "todo", label: "To Do", color: "bg-gray-100" },
  { value: "in_progress", label: "In Progress", color: "bg-blue-100" },
  { value: "review", label: "Review", color: "bg-yellow-100" },
  { value: "completed", label: "Completed", color: "bg-green-100" },
];

const priorityOptions = [
  { value: "low", label: "Low", color: "text-blue-600" },
  { value: "normal", label: "Normal", color: "text-gray-600" },
  { value: "high", label: "High", color: "text-orange-600" },
  { value: "urgent", label: "Urgent", color: "text-red-600" },
];

export function TaskFiltersPanel({
  filters,
  onChange,
  onClear,
  onSave,
  savedSearches = [],
}: TaskFiltersPanelProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isExpanded, setIsExpanded] = useState(false);
  const [saveName, setSaveName] = useState("");

  // Fetch users for assignee dropdown
  const { data: users = [] } = useQuery<UserType[]>({
    queryKey: ["/api/users"],
  });

  // Fetch saved searches
  const { data: fetchedSavedSearches = [] } = useQuery<Array<{ id: string; name: string; filters: TaskFilters }>>({
    queryKey: ["/api/tasks/searches/saved"],
  });

  const allSavedSearches = [...savedSearches, ...fetchedSavedSearches];

  const toggleStatus = (status: string) => {
    const current = filters.status || [];
    const updated = current.includes(status)
      ? current.filter((s) => s !== status)
      : [...current, status];
    onChange({ ...filters, status: updated.length > 0 ? updated : undefined });
  };

  const togglePriority = (priority: string) => {
    const current = filters.priority || [];
    const updated = current.includes(priority)
      ? current.filter((p) => p !== priority)
      : [...current, priority];
    onChange({ ...filters, priority: updated.length > 0 ? updated : undefined });
  };

  const hasActiveFilters =
    (filters.status?.length || 0) > 0 ||
    (filters.priority?.length || 0) > 0 ||
    filters.assigneeId ||
    filters.spaceId ||
    filters.clientId ||
    filters.dueDateFrom ||
    filters.dueDateTo ||
    (filters.tags?.length || 0) > 0 ||
    filters.searchText ||
    filters.hasDependencies ||
    filters.isBlocking ||
    filters.overdue;

  const activeFilterCount =
    (filters.status?.length || 0) +
    (filters.priority?.length || 0) +
    (filters.tags?.length || 0) +
    (filters.assigneeId ? 1 : 0) +
    (filters.spaceId ? 1 : 0) +
    (filters.clientId ? 1 : 0) +
    (filters.dueDateFrom ? 1 : 0) +
    (filters.dueDateTo ? 1 : 0) +
    (filters.hasDependencies ? 1 : 0) +
    (filters.isBlocking ? 1 : 0) +
    (filters.overdue ? 1 : 0);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search tasks..."
            value={filters.searchText || ""}
            onChange={(e) =>
              onChange({ ...filters, searchText: e.target.value || undefined })
            }
            className="pl-9"
          />
        </div>
        <Button
          variant={hasActiveFilters ? "default" : "outline"}
          size="sm"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <Filter className="w-4 h-4 mr-2" />
          Filters
          {activeFilterCount > 0 && (
            <Badge variant="secondary" className="ml-2">
              {activeFilterCount}
            </Badge>
          )}
        </Button>
        {hasActiveFilters && (
          <Button variant="ghost" size="sm" onClick={onClear}>
            <X className="w-4 h-4 mr-1" />
            Clear
          </Button>
        )}
      </div>

      {/* Expanded Filters */}
      {isExpanded && (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm">Advanced Filters</CardTitle>
              {onSave && (
                <div className="flex items-center gap-2">
                  <Input
                    placeholder="Save as..."
                    value={saveName}
                    onChange={(e) => setSaveName(e.target.value)}
                    className="w-32 h-8"
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      if (saveName.trim()) {
                        onSave(saveName);
                        setSaveName("");
                      }
                    }}
                    disabled={!saveName.trim()}
                  >
                    <Save className="w-4 h-4 mr-1" />
                    Save
                  </Button>
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Status */}
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-2">
                <Flag className="w-4 h-4" />
                Status
              </label>
              <div className="flex flex-wrap gap-2">
                {statusOptions.map((option) => (
                  <label
                    key={option.value}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg border cursor-pointer hover:bg-muted/50 transition-colors"
                  >
                    <Checkbox
                      checked={filters.status?.includes(option.value) || false}
                      onCheckedChange={() => toggleStatus(option.value)}
                    />
                    <span className={`text-sm ${option.color}`}>{option.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Priority */}
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-2">
                <Star className="w-4 h-4" />
                Priority
              </label>
              <div className="flex flex-wrap gap-2">
                {priorityOptions.map((option) => (
                  <label
                    key={option.value}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg border cursor-pointer hover:bg-muted/50 transition-colors"
                  >
                    <Checkbox
                      checked={filters.priority?.includes(option.value) || false}
                      onCheckedChange={() => togglePriority(option.value)}
                    />
                    <span className={`text-sm ${option.color}`}>{option.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Assignee */}
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-2">
                <User className="w-4 h-4" />
                Assignee
              </label>
              <Select
                value={filters.assigneeId?.toString() || ""}
                onValueChange={(value) =>
                  onChange({
                    ...filters,
                    assigneeId: value ? parseInt(value) : undefined,
                  })
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="All assignees" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All assignees</SelectItem>
                  {users.map((user) => (
                    <SelectItem key={user.id} value={user.id.toString()}>
                      {user.firstName || user.username}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Due Date Range */}
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Due Date Range
              </label>
              <div className="flex items-center gap-2">
                <Input
                  type="date"
                  value={filters.dueDateFrom || ""}
                  onChange={(e) =>
                    onChange({
                      ...filters,
                      dueDateFrom: e.target.value || undefined,
                    })
                  }
                  className="w-auto"
                />
                <span className="text-muted-foreground">to</span>
                <Input
                  type="date"
                  value={filters.dueDateTo || ""}
                  onChange={(e) =>
                    onChange({
                      ...filters,
                      dueDateTo: e.target.value || undefined,
                    })
                  }
                  className="w-auto"
                />
              </div>
            </div>

            {/* Toggles */}
            <div className="flex flex-wrap gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <Checkbox
                  checked={filters.overdue || false}
                  onCheckedChange={(checked) =>
                    onChange({
                      ...filters,
                      overdue: checked ? true : undefined,
                    })
                  }
                />
                <span className="text-sm">Overdue only</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <Checkbox
                  checked={filters.hasDependencies || false}
                  onCheckedChange={(checked) =>
                    onChange({
                      ...filters,
                      hasDependencies: checked ? true : undefined,
                    })
                  }
                />
                <span className="text-sm">Has dependencies</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <Checkbox
                  checked={filters.isBlocking || false}
                  onCheckedChange={(checked) =>
                    onChange({
                      ...filters,
                      isBlocking: checked ? true : undefined,
                    })
                  }
                />
                <span className="text-sm">Is blocking</span>
              </label>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Saved Searches */}
      {allSavedSearches.length > 0 && (
        <div className="space-y-2">
          <label className="text-sm font-medium flex items-center gap-2">
            <Tag className="w-4 h-4" />
            Saved Filters
          </label>
          <div className="flex flex-wrap gap-2">
            {allSavedSearches.map((search) => (
              <Badge
                key={search.id}
                variant="outline"
                className="cursor-pointer hover:bg-muted"
                onClick={() => onChange(search.filters)}
              >
                {search.name}
              </Badge>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default TaskFiltersPanel;

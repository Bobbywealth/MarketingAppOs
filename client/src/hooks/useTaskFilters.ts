import { useState, useMemo, useCallback } from "react";
import type { Task } from "@shared/schema";

interface FilterState {
  status: string;
  priority: string;
  searchQuery: string;
  clientId: string | null;
  assigneeId: string | null;
  dueDateRange: string | null;
  spaceId: string | null;
  showCompleted: boolean;
}

interface UseTaskFiltersOptions {
  persistKey?: string;
  defaultShowCompleted?: boolean;
}

const DUE_DATE_RANGES = {
  overdue: (taskDate: Date, today: Date) => taskDate < today,
  today: (taskDate: Date, today: Date) => taskDate.toDateString() === today.toDateString(),
  tomorrow: (taskDate: Date, today: Date) => {
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    return taskDate.toDateString() === tomorrow.toDateString();
  },
  this_week: (taskDate: Date, today: Date) => {
    const weekEnd = new Date(today);
    weekEnd.setDate(weekEnd.getDate() + (6 - today.getDay()));
    return taskDate >= today && taskDate <= weekEnd;
  },
  next_week: (taskDate: Date, today: Date) => {
    const nextWeekStart = new Date(today);
    nextWeekStart.setDate(nextWeekStart.getDate() + (7 - today.getDay()));
    const nextWeekEnd = new Date(nextWeekStart);
    nextWeekEnd.setDate(nextWeekEnd.getDate() + 6);
    return taskDate >= nextWeekStart && taskDate <= nextWeekEnd;
  },
  this_month: (taskDate: Date, today: Date) => {
    const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    return taskDate >= today && taskDate <= monthEnd;
  },
  no_date: () => false, // Handled separately
};

export function useTaskFilters(
  tasks: Task[],
  options: UseTaskFiltersOptions = {}
) {
  const { persistKey = "task-filters", defaultShowCompleted = false } = options;

  // Initialize state with persisted values
  const [filters, setFilters] = useState<FilterState>(() => {
    if (typeof window === "undefined") {
      return {
        status: "all",
        priority: "all",
        searchQuery: "",
        clientId: null,
        assigneeId: null,
        dueDateRange: null,
        spaceId: null,
        showCompleted: defaultShowCompleted,
      };
    }

    try {
      const saved = localStorage.getItem(persistKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        return {
          status: parsed.status || "all",
          priority: parsed.priority || "all",
          searchQuery: parsed.searchQuery || "",
          clientId: parsed.clientId || null,
          assigneeId: parsed.assigneeId || null,
          dueDateRange: parsed.dueDateRange || null,
          spaceId: parsed.spaceId || null,
          showCompleted: parsed.showCompleted ?? defaultShowCompleted,
        };
      }
    } catch (e) {
      console.error("Failed to load saved filters:", e);
    }

    return {
      status: "all",
      priority: "all",
      searchQuery: "",
      clientId: null,
      assigneeId: null,
      dueDateRange: null,
      spaceId: null,
      showCompleted: defaultShowCompleted,
    };
  });

  // Persist filters on change
  const updateFilters = useCallback((updates: Partial<FilterState>) => {
    setFilters(prev => {
      const newFilters = { ...prev, ...updates };
      if (typeof window !== "undefined") {
        try {
          localStorage.setItem(persistKey, JSON.stringify(newFilters));
        } catch (e) {
          console.error("Failed to save filters:", e);
        }
      }
      return newFilters;
    });
  }, [persistKey]);

  // Individual filter setters
  const setStatusFilter = useCallback((status: string) => {
    updateFilters({ status });
  }, [updateFilters]);

  const setPriorityFilter = useCallback((priority: string) => {
    updateFilters({ priority });
  }, [updateFilters]);

  const setSearchQuery = useCallback((searchQuery: string) => {
    updateFilters({ searchQuery });
  }, [updateFilters]);

  const setClientFilter = useCallback((clientId: string | null) => {
    updateFilters({ clientId });
  }, [updateFilters]);

  const setAssigneeFilter = useCallback((assigneeId: string | null) => {
    updateFilters({ assigneeId });
  }, [updateFilters]);

  const setDueDateFilter = useCallback((dueDateRange: string | null) => {
    updateFilters({ dueDateRange });
  }, [updateFilters]);

  const setSpaceFilter = useCallback((spaceId: string | null) => {
    updateFilters({ spaceId });
  }, [updateFilters]);

  const toggleShowCompleted = useCallback(() => {
    setFilters(prev => {
      const newValue = !prev.showCompleted;
      if (typeof window !== "undefined") {
        try {
          localStorage.setItem("tasks-show-completed", JSON.stringify(newValue));
        } catch (e) {
          console.error("Failed to save showCompleted:", e);
        }
      }
      return { ...prev, showCompleted: newValue };
    });
  }, []);

  // Clear functions
  const clearStatusFilter = useCallback(() => setStatusFilter("all"), [setStatusFilter]);
  const clearPriorityFilter = useCallback(() => setPriorityFilter("all"), [setPriorityFilter]);
  const clearSearchQuery = useCallback(() => setSearchQuery(""), [setSearchQuery]);
  const clearClientFilter = useCallback(() => setClientFilter(null), [setClientFilter]);
  const clearAssigneeFilter = useCallback(() => setAssigneeFilter(null), [setAssigneeFilter]);
  const clearDueDateFilter = useCallback(() => setDueDateFilter(null), [setDueDateFilter]);
  const clearSpaceFilter = useCallback(() => setSpaceFilter(null), [setSpaceFilter]);

  const clearAllFilters = useCallback(() => {
    updateFilters({
      status: "all",
      priority: "all",
      searchQuery: "",
      clientId: null,
      assigneeId: null,
      dueDateRange: null,
      spaceId: null,
    });
  }, [updateFilters]);

  // Filter matching function
  const matchesFilters = useCallback((task: Task): boolean => {
    // Status filter
    if (filters.status !== "all" && task.status !== filters.status) {
      return false;
    }

    // Priority filter
    if (filters.priority !== "all" && task.priority !== filters.priority) {
      return false;
    }

    // Space filter
    if (filters.spaceId !== null && task.spaceId !== filters.spaceId) {
      return false;
    }

    // Search query
    if (filters.searchQuery.trim() !== "") {
      const query = filters.searchQuery.toLowerCase();
      const titleMatch = task.title.toLowerCase().includes(query);
      const descMatch = task.description?.toLowerCase().includes(query);
      if (!titleMatch && !descMatch) {
        return false;
      }
    }

    // Client filter
    if (filters.clientId !== null && task.clientId !== filters.clientId) {
      return false;
    }

    // Assignee filter
    if (filters.assigneeId !== null) {
      if (filters.assigneeId === "unassigned" && task.assignedToId) {
        return false;
      }
      if (filters.assigneeId !== "unassigned" && task.assignedToId?.toString() !== filters.assigneeId) {
        return false;
      }
    }

    // Due date range filter
    if (filters.dueDateRange !== null) {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const taskDueDate = task.dueDate ? new Date(task.dueDate) : null;

      if (filters.dueDateRange === "no_date") {
        if (taskDueDate) return false;
      } else if (!taskDueDate) {
        return false;
      } else {
        const rangeChecker = DUE_DATE_RANGES[filters.dueDateRange as keyof typeof DUE_DATE_RANGES];
        if (rangeChecker && !rangeChecker(taskDueDate, today)) {
          return false;
        }
      }
    }

    // Show completed toggle
    if (!filters.showCompleted && task.status === "completed") {
      return false;
    }

    return true;
  }, [filters]);

  // Memoized filtered tasks
  const filteredTasks = useMemo(() => {
    return tasks.filter(matchesFilters);
  }, [tasks, matchesFilters]);

  // Count active filters
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filters.status !== "all") count++;
    if (filters.priority !== "all") count++;
    if (filters.searchQuery.trim()) count++;
    if (filters.clientId) count++;
    if (filters.assigneeId) count++;
    if (filters.dueDateRange) count++;
    if (filters.spaceId) count++;
    if (filters.showCompleted) count++;
    return count;
  }, [filters]);

  // Check if any filters are active
  const hasActiveFilters = activeFilterCount > 0;

  return {
    // Filter state
    filters,
    filteredTasks,
    activeFilterCount,
    hasActiveFilters,

    // Individual setters
    setStatusFilter,
    setPriorityFilter,
    setSearchQuery,
    setClientFilter,
    setAssigneeFilter,
    setDueDateFilter,
    setSpaceFilter,
    toggleShowCompleted,

    // Clear functions
    clearStatusFilter,
    clearPriorityFilter,
    clearSearchQuery,
    clearClientFilter,
    clearAssigneeFilter,
    clearDueDateFilter,
    clearSpaceFilter,
    clearAllFilters,

    // Utility
    matchesFilters,
  };
}

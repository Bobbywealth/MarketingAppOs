import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Task } from "@shared/schema";

interface CreateTaskData {
  title: string;
  description?: string;
  status: string;
  priority: string;
  dueDate?: string;
  campaignId?: string;
  clientId?: string;
  spaceId?: string;
  assignedToId?: number;
  isRecurring?: boolean;
  recurringPattern?: string;
  recurringInterval?: number;
  recurringEndDate?: string;
  scheduleFrom?: string;
  checklist?: Array<{ id: string; text: string; completed: boolean }>;
  tags?: string[];
}

interface UpdateTaskData extends Partial<CreateTaskData> {
  id: string;
}

interface BulkUpdateData {
  taskIds: string[];
  updates: Partial<CreateTaskData>;
}

interface DuplicateTaskData {
  taskIds: string[];
}

const TASKS_QUERY_KEY = ["/api/tasks"];

export function useTaskMutations() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Create single task
  const createTask = useMutation({
    mutationFn: async (data: CreateTaskData) => {
      return apiRequest("POST", "/api/tasks", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TASKS_QUERY_KEY });
      toast({ title: "Task created successfully" });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to create task",
        description: error?.message || "Please try again",
        variant: "destructive",
      });
    },
  });

  // Update single task
  const updateTask = useMutation({
    mutationFn: async ({ id, ...data }: UpdateTaskData) => {
      return apiRequest("PATCH", `/api/tasks/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TASKS_QUERY_KEY });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to update task",
        description: error?.message || "Please try again",
        variant: "destructive",
      });
    },
  });

  // Update task status with optimistic update
  const updateTaskStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      return apiRequest("PATCH", `/api/tasks/${id}`, { status });
    },
    onMutate: async ({ id, status }) => {
      await queryClient.cancelQueries({ queryKey: TASKS_QUERY_KEY });
      const previousTasks = queryClient.getQueryData<Task[]>(TASKS_QUERY_KEY);
      
      queryClient.setQueryData<Task[]>(TASKS_QUERY_KEY, (old: Task[] | undefined) => {
        if (!old) return old;
        return old.map((t: Task) => t.id === id ? { ...t, status } : t);
      });
      
      return { previousTasks };
    },
    onError: (err, { id, status }, context) => {
      if (context?.previousTasks) {
        queryClient.setQueryData<Task[]>(TASKS_QUERY_KEY, context.previousTasks);
      }
      toast({ title: "Failed to update task", variant: "destructive" });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: TASKS_QUERY_KEY });
    },
  });

  // Delete single task
  const deleteTask = useMutation({
    mutationFn: async (taskId: string) => {
      return apiRequest("DELETE", `/api/tasks/${taskId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TASKS_QUERY_KEY });
      toast({ title: "Task deleted successfully" });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to delete task",
        description: error?.message || "Please try again",
        variant: "destructive",
      });
    },
  });

  // Bulk update tasks
  const bulkUpdateTasks = useMutation({
    mutationFn: async ({ taskIds, updates }: BulkUpdateData) => {
      return apiRequest("PATCH", "/api/tasks/bulk", { taskIds, updates });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TASKS_QUERY_KEY });
      toast({ title: "Tasks updated successfully" });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to update tasks",
        description: error?.message || "Please try again",
        variant: "destructive",
      });
    },
  });

  // Bulk delete tasks
  const bulkDeleteTasks = useMutation({
    mutationFn: async (taskIds: string[]) => {
      return apiRequest("DELETE", "/api/tasks/bulk", { taskIds });
    },
    onSuccess: (_, taskIds) => {
      queryClient.invalidateQueries({ queryKey: TASKS_QUERY_KEY });
      toast({ 
        title: "Tasks deleted", 
        description: `${taskIds.length} task(s) permanently deleted` 
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to delete tasks",
        description: error?.message || "Please try again",
        variant: "destructive",
      });
    },
  });

  // Duplicate tasks
  const duplicateTasks = useMutation({
    mutationFn: async ({ taskIds }: DuplicateTaskData) => {
      return apiRequest("POST", "/api/tasks/duplicate", { taskIds });
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: TASKS_QUERY_KEY });
      toast({
        title: "Tasks duplicated",
        description: `${data?.count || 0} task(s) copied`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to duplicate tasks",
        description: error?.message || "Please try again",
        variant: "destructive",
      });
    },
  });

  // Archive tasks
  const archiveTasks = useMutation({
    mutationFn: async (taskIds: string[]) => {
      return apiRequest("PATCH", "/api/tasks/bulk", { 
        taskIds, 
        updates: { archived: true } 
      });
    },
    onSuccess: (_, taskIds) => {
      queryClient.invalidateQueries({ queryKey: TASKS_QUERY_KEY });
      toast({
        title: "Tasks archived",
        description: `${taskIds.length} task(s) moved to archive`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to archive tasks",
        description: error?.message || "Please try again",
        variant: "destructive",
      });
    },
  });

  // Backfill recurring tasks
  const backfillRecurring = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/tasks/backfill-recurring", {});
      return await res.json();
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: TASKS_QUERY_KEY });
      toast({
        title: "Recurring tasks backfilled",
        description: `Created ${data.tasksCreated ?? 0} task(s) across ${data.seriesProcessed ?? 0} series.`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Backfill failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return {
    createTask,
    updateTask,
    updateTaskStatus,
    deleteTask,
    bulkUpdateTasks,
    bulkDeleteTasks,
    duplicateTasks,
    archiveTasks,
    backfillRecurring,
  };
}

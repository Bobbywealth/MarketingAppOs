import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Task } from "@shared/schema";

interface BulkUpdateResponse {
  success: boolean;
  updated: number;
  tasks: Task[];
}

interface BulkDeleteResponse {
  success: boolean;
  deleted: number;
}

/**
 * Custom hook for bulk task operations
 */
export function useBulkTasks() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const bulkUpdate = useMutation({
    mutationFn: async ({ 
      taskIds, 
      updates 
    }: { 
      taskIds: string[]; 
      updates: Partial<Task> 
    }): Promise<BulkUpdateResponse> => {
      const res = await apiRequest("PATCH", "/api/tasks/bulk", {
        taskIds,
        updates,
      });
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
      toast({
        title: "Tasks updated",
        description: `Successfully updated ${data.updated} task(s)`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to update tasks",
        description: error?.message || "Please try again",
        variant: "destructive",
      });
    },
  });

  const bulkDelete = useMutation({
    mutationFn: async (taskIds: string[]): Promise<BulkDeleteResponse> => {
      const res = await apiRequest("DELETE", "/api/tasks/bulk", {
        taskIds,
      });
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
      toast({
        title: "Tasks deleted",
        description: `Successfully deleted ${data.deleted} task(s)`,
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

  const bulkMarkComplete = useMutation({
    mutationFn: async (taskIds: string[]) => {
      const res = await apiRequest("PATCH", "/api/tasks/bulk", {
        taskIds,
        updates: { status: "completed" },
      });
      return res.json();
    },
    onSuccess: (data: BulkUpdateResponse) => {
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
      toast({
        title: "Tasks completed",
        description: `Marked ${data.updated} task(s) as complete`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to complete tasks",
        description: error?.message || "Please try again",
        variant: "destructive",
      });
    },
  });

  const bulkMarkIncomplete = useMutation({
    mutationFn: async (taskIds: string[]) => {
      const res = await apiRequest("PATCH", "/api/tasks/bulk", {
        taskIds,
        updates: { status: "todo" },
      });
      return res.json();
    },
    onSuccess: (data: BulkUpdateResponse) => {
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
      toast({
        title: "Tasks updated",
        description: `Marked ${data.updated} task(s) as incomplete`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to update tasks",
        description: error?.message || "Please try again",
        variant: "destructive",
      });
    },
  });

  const bulkAssign = useMutation({
    mutationFn: async ({ 
      taskIds, 
      assignedToId 
    }: { 
      taskIds: string[]; 
      assignedToId: number | null 
    }) => {
      const res = await apiRequest("PATCH", "/api/tasks/bulk", {
        taskIds,
        updates: { assignedToId },
      });
      return res.json();
    },
    onSuccess: (data: BulkUpdateResponse) => {
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
      toast({
        title: "Tasks assigned",
        description: `Assigned ${data.updated} task(s)`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to assign tasks",
        description: error?.message || "Please try again",
        variant: "destructive",
      });
    },
  });

  const bulkSetPriority = useMutation({
    mutationFn: async ({ 
      taskIds, 
      priority 
    }: { 
      taskIds: string[]; 
      priority: string 
    }) => {
      const res = await apiRequest("PATCH", "/api/tasks/bulk", {
        taskIds,
        updates: { priority },
      });
      return res.json();
    },
    onSuccess: (data: BulkUpdateResponse) => {
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
      toast({
        title: "Priority updated",
        description: `Updated priority for ${data.updated} task(s)`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to update priority",
        description: error?.message || "Please try again",
        variant: "destructive",
      });
    },
  });

  const archiveCompleted = useMutation({
    mutationFn: async (daysOld: number = 30) => {
      const res = await apiRequest("POST", "/api/tasks/archive-completed", {
        daysOld,
      });
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
      toast({
        title: "Tasks archived",
        description: data.message || `Archived ${data.archived} completed task(s)`,
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

  return {
    bulkUpdate: bulkUpdate.mutate,
    bulkDelete: bulkDelete.mutate,
    bulkMarkComplete: bulkMarkComplete.mutate,
    bulkMarkIncomplete: bulkMarkIncomplete.mutate,
    bulkAssign: bulkAssign.mutate,
    bulkSetPriority: bulkSetPriority.mutate,
    archiveCompleted: archiveCompleted.mutate,
    isPending:
      bulkUpdate.isPending ||
      bulkDelete.isPending ||
      bulkMarkComplete.isPending ||
      bulkMarkIncomplete.isPending ||
      bulkAssign.isPending ||
      bulkSetPriority.isPending ||
      archiveCompleted.isPending,
  };
}

export default useBulkTasks;

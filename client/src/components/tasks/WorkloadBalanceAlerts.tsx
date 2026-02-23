import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  AlertTriangle,
  AlertCircle,
  CheckCircle2,
  Users,
  ArrowRight,
  RefreshCw,
  X,
  Lightbulb,
  TrendingUp,
  TrendingDown,
} from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Task, User } from "@shared/schema";

interface UserWorkload {
  userId: number;
  userName: string;
  activeTasks: number;
  overdueTasks: number;
  estimatedHoursTotal: number;
  tasksByPriority: Record<string, number>;
  upcomingDeadlines: Task[];
}

interface WorkloadBalanceAlertsProps {
  currentUser?: User | null;
  onReassign?: (taskId: string, newUserId: number) => void;
}

export function WorkloadBalanceAlerts({ currentUser, onReassign }: WorkloadBalanceAlertsProps) {
  const { toast } = useToast();
  const [dismissedAlerts, setDismissedAlerts] = useState<Set<number>>(new Set());
  const [reassignDialogOpen, setReassignDialogOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [selectedUser, setSelectedUser] = useState<string>("");

  // Fetch all users' workload
  const { data: workloads = [], isLoading, refetch } = useQuery<UserWorkload[]>({
    queryKey: ["/api/users/workload/all"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/users/workload/all");
      return res.json();
    },
    refetchInterval: 60000, // Refresh every minute
  });

  // Fetch all users for reassignment dropdown
  const { data: users = [] } = useQuery<User[]>({
    queryKey: ["/api/users"],
  });

  // Fetch current user's tasks
  const { data: tasks = [] } = useQuery<Task[]>({
    queryKey: ["/api/tasks"],
  });

  // Analyze workload and generate alerts
  const alerts = analyzeWorkloads(workloads, dismissedAlerts);

  const handleDismissAlert = (alertId: number) => {
    setDismissedAlerts(prev => new Set([...prev, alertId]));
  };

  const handleReassignTask = async () => {
    if (!selectedTask || !selectedUser) return;
    
    try {
      await apiRequest("PATCH", `/api/tasks/${selectedTask.id}`, {
        assignedToId: parseInt(selectedUser),
      });
      
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
      queryClient.invalidateQueries({ queryKey: ["/api/users/workload/all"] });
      
      toast({
        title: "Task reassigned",
        description: `"${selectedTask.title}" has been reassigned.`,
      });
      
      onReassign?.(selectedTask.id, parseInt(selectedUser));
      setReassignDialogOpen(false);
      setSelectedTask(null);
      setSelectedUser("");
    } catch (error: any) {
      toast({
        title: "Failed to reassign task",
        description: error?.message || "An error occurred",
        variant: "destructive",
      });
    }
  };

  const getWorkloadLevel = (workload: UserWorkload): "low" | "balanced" | "high" | "overloaded" => {
    const { activeTasks, overdueTasks, estimatedHoursTotal } = workload;
    const score = activeTasks + (overdueTasks * 2) + (estimatedHoursTotal / 8);
    
    if (score < 5) return "low";
    if (score < 10) return "balanced";
    if (score < 15) return "high";
    return "overloaded";
  };

  const getWorkloadColor = (level: "low" | "balanced" | "high" | "overloaded") => {
    switch (level) {
      case "low":
        return "text-green-600";
      case "balanced":
        return "text-blue-600";
      case "high":
        return "text-yellow-600";
      case "overloaded":
        return "text-red-600";
    }
  };

  const getWorkloadProgress = (workload: UserWorkload) => {
    const level = getWorkloadLevel(workload);
    switch (level) {
      case "low":
        return 25;
      case "balanced":
        return 50;
      case "high":
        return 75;
      case "overloaded":
        return 100;
    }
  };

  if (isLoading || alerts.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3">
      {alerts.map(alert => (
        <Alert
          key={alert.id}
          variant={alert.severity === "critical" ? "destructive" : "default"}
          className="relative"
        >
          <div className="flex items-start gap-3">
            {alert.severity === "critical" ? (
              <AlertCircle className="h-4 w-4 mt-0.5" />
            ) : (
              <AlertTriangle className="h-4 w-4 mt-0.5" />
            )}
            <div className="flex-1">
              <AlertTitle className="flex items-center gap-2">
                {alert.title}
                <Badge variant={alert.severity === "critical" ? "destructive" : "secondary"}>
                  {alert.severity}
                </Badge>
              </AlertTitle>
              <AlertDescription className="mt-1">
                {alert.description}
              </AlertDescription>
              
              {alert.suggestions && alert.suggestions.length > 0 && (
                <div className="mt-3 space-y-2">
                  <div className="flex items-center gap-1 text-sm font-medium">
                    <Lightbulb className="h-3.5 w-3.5" />
                    Suggestions
                  </div>
                  <div className="space-y-1">
                    {alert.suggestions.map((suggestion, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-2 bg-muted/50 rounded text-sm"
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-muted-foreground">
                            "{suggestion.taskTitle}"
                          </span>
                          <ArrowRight className="h-3 w-3 text-muted-foreground" />
                          <span className="font-medium">
                            {suggestion.suggestedUserName}
                          </span>
                          <Badge variant="outline" className="text-xs">
                            {suggestion.reason}
                          </Badge>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            const task = tasks.find(t => t.id === suggestion.taskId);
                            if (task) {
                              setSelectedTask(task);
                              setSelectedUser(suggestion.suggestedUserId.toString());
                              setReassignDialogOpen(true);
                            }
                          }}
                        >
                          Reassign
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0"
              onClick={() => handleDismissAlert(alert.id)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </Alert>
      ))}

      {/* Reassignment Dialog */}
      <Dialog open={reassignDialogOpen} onOpenChange={setReassignDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reassign Task</DialogTitle>
            <DialogDescription>
              Choose a new assignee for "{selectedTask?.title}"
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            <Select value={selectedUser} onValueChange={setSelectedUser}>
              <SelectTrigger>
                <SelectValue placeholder="Select new assignee" />
              </SelectTrigger>
              <SelectContent>
                {workloads.map(workload => (
                  <SelectItem key={workload.userId} value={workload.userId.toString()}>
                    <div className="flex items-center justify-between w-full gap-2">
                      <span>{workload.userName}</span>
                      <Badge variant="outline" className="ml-2">
                        {workload.activeTasks} tasks
                      </Badge>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setReassignDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleReassignTask} disabled={!selectedUser}>
              Reassign
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Helper function to analyze workloads and generate alerts
function analyzeWorkloads(
  workloads: UserWorkload[],
  dismissedAlerts: Set<number>
): Array<{
  id: number;
  title: string;
  description: string;
  severity: "warning" | "critical";
  suggestions?: Array<{
    taskId: string;
    taskTitle: string;
    suggestedUserId: number;
    suggestedUserName: string;
    reason: string;
  }>;
}> {
  const alerts: Array<any> = [];
  
  // Find overloaded users
  const overloadedUsers = workloads.filter(w => {
    const score = w.activeTasks + (w.overdueTasks * 2) + (w.estimatedHoursTotal / 8);
    return score >= 15;
  });
  
  // Find users with low workload (can take more tasks)
  const availableUsers = workloads.filter(w => {
    const score = w.activeTasks + (w.estimatedHoursTotal / 8);
    return score < 5;
  });
  
  // Generate alerts for overloaded users
  overloadedUsers.forEach(user => {
    const alertId = `overload-${user.userId}`.hashCode();
    
    if (dismissedAlerts.has(alertId)) return;
    
    const suggestions: any[] = [];
    
    // Suggest reassigning tasks to available users
    if (availableUsers.length > 0 && user.upcomingDeadlines.length > 0) {
      const lowPriorityTasks = user.upcomingDeadlines.filter(
        t => t.priority === "low" || t.priority === "normal"
      );
      
      lowPriorityTasks.slice(0, 2).forEach(task => {
        const targetUser = availableUsers[0];
        suggestions.push({
          taskId: task.id,
          taskTitle: task.title,
          suggestedUserId: targetUser.userId,
          suggestedUserName: targetUser.userName,
          reason: `${targetUser.activeTasks} active tasks`,
        });
      });
    }
    
    alerts.push({
      id: alertId,
      title: `${user.userName} is overloaded`,
      description: `${user.activeTasks} active tasks, ${user.overdueTasks} overdue, ~${user.estimatedHoursTotal}h estimated work`,
      severity: "critical" as const,
      suggestions,
    });
  });
  
  // Check for unbalanced team workload
  if (workloads.length > 1) {
    const scores = workloads.map(w => w.activeTasks + (w.estimatedHoursTotal / 8));
    const avgScore = scores.reduce((a, b) => a + b, 0) / scores.length;
    const maxDeviation = Math.max(...scores.map(s => Math.abs(s - avgScore)));
    
    if (maxDeviation > 5) {
      const alertId = "unbalanced-workload".hashCode();
      
      if (!dismissedAlerts.has(alertId)) {
        alerts.push({
          id: alertId,
          title: "Team workload is unbalanced",
          description: `Workload distribution varies significantly across team members. Consider redistributing tasks.`,
          severity: "warning" as const,
        });
      }
    }
  }
  
  return alerts;
}

// Simple hash function for alert IDs
declare global {
  interface String {
    hashCode(): number;
  }
}

String.prototype.hashCode = function() {
  let hash = 0;
  for (let i = 0; i < this.length; i++) {
    const char = this.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return hash;
};

export default WorkloadBalanceAlerts;

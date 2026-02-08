import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Clock,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  TrendingUp,
  Users,
  Loader2,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import type { Task } from "@shared/schema";

interface WorkloadData {
  activeTasks: number;
  overdueTasks: number;
  estimatedHoursTotal: number;
  tasksByPriority: Record<string, number>;
  upcomingDeadlines: Task[];
}

interface WorkloadIndicatorProps {
  userId: number;
  compact?: boolean;
  showDetails?: boolean;
}

const priorityColors: Record<string, string> = {
  low: "bg-blue-100 text-blue-700",
  normal: "bg-gray-100 text-gray-700",
  high: "bg-orange-100 text-orange-700",
  urgent: "bg-red-100 text-red-700",
};

export function WorkloadIndicator({
  userId,
  compact = false,
  showDetails = false,
}: WorkloadIndicatorProps) {
  const { data: workload, isLoading, error } = useQuery<WorkloadData>({
    queryKey: [`/api/users/${userId}/workload`],
    enabled: !!userId,
    refetchInterval: 60000, // Refresh every minute
  });

  if (isLoading) {
    return <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />;
  }

  if (error || !workload) {
    return null;
  }

  const { activeTasks, overdueTasks, estimatedHoursTotal, tasksByPriority, upcomingDeadlines } =
    workload;

  // Calculate workload level
  const getWorkloadLevel = () => {
    if (activeTasks >= 15 || overdueTasks > 3) return "high";
    if (activeTasks >= 8 || overdueTasks > 0) return "medium";
    return "low";
  };

  const level = getWorkloadLevel();
  const levelConfig = {
    low: { color: "text-green-600", bg: "bg-green-50", icon: <CheckCircle2 className="w-4 h-4" />, label: "Light" },
    medium: { color: "text-yellow-600", bg: "bg-yellow-50", icon: <TrendingUp className="w-4 h-4" />, label: "Moderate" },
    high: { color: "text-red-600", bg: "bg-red-50", icon: <AlertTriangle className="w-4 h-4" />, label: "Heavy" },
  };
  const config = levelConfig[level];

  if (compact) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className={`flex items-center gap-1 px-2 py-1 rounded-full ${config.bg}`}>
              <span className={config.color}>{config.icon}</span>
              <span className={`text-xs font-medium ${config.color}`}>
                {activeTasks}
              </span>
            </div>
          </TooltipTrigger>
          <TooltipContent className="w-64 p-3">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-semibold">Workload Status</span>
                <Badge variant={level === "high" ? "destructive" : level === "medium" ? "secondary" : "default"}>
                  {config.label}
                </Badge>
              </div>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="flex items-center gap-1">
                  <Clock className="w-3 h-3 text-muted-foreground" />
                  <span>{activeTasks} active</span>
                </div>
                <div className="flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3 text-red-500" />
                  <span>{overdueTasks} overdue</span>
                </div>
              </div>
              {estimatedHoursTotal > 0 && (
                <div className="text-sm text-muted-foreground">
                  ~{estimatedHoursTotal}h estimated
                </div>
              )}
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <div className="space-y-4">
      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-3">
        <div className="p-3 rounded-lg bg-muted/50">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-muted-foreground" />
            <span className="text-2xl font-bold">{activeTasks}</span>
          </div>
          <p className="text-xs text-muted-foreground">Active Tasks</p>
        </div>
        <div className="p-3 rounded-lg bg-red-50">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-red-500" />
            <span className="text-2xl font-bold text-red-600">{overdueTasks}</span>
          </div>
          <p className="text-xs text-muted-foreground">Overdue</p>
        </div>
        <div className="p-3 rounded-lg bg-blue-50">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-blue-500" />
            <span className="text-2xl font-bold text-blue-600">{estimatedHoursTotal}h</span>
          </div>
          <p className="text-xs text-muted-foreground">Est. Hours</p>
        </div>
      </div>

      {/* Priority Distribution */}
      {showDetails && Object.keys(tasksByPriority).length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium">By Priority</h4>
          <div className="flex flex-wrap gap-2">
            {Object.entries(tasksByPriority).map(([priority, count]) => (
              <Badge key={priority} className={priorityColors[priority]}>
                {priority.charAt(0).toUpperCase() + priority.slice(1)}: {count}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Upcoming Deadlines */}
      {showDetails && upcomingDeadlines.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium">Upcoming Deadlines</h4>
          <div className="space-y-1">
            {upcomingDeadlines.slice(0, 5).map((task) => {
              const isOverdue = task.dueDate && new Date(task.dueDate) < new Date();
              return (
                <div
                  key={task.id}
                  className="flex items-center justify-between p-2 rounded bg-muted/50"
                >
                  <span className="text-sm truncate flex-1">{task.title}</span>
                  <span
                    className={`text-xs ${
                      isOverdue ? "text-red-500 font-medium" : "text-muted-foreground"
                    }`}
                  >
                    {task.dueDate && formatDistanceToNow(new Date(task.dueDate), { addSuffix: true })}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Actions */}
      {level === "high" && (
        <Button variant="outline" size="sm" className="w-full">
          <Users className="w-4 h-4 mr-2" />
          Suggest Reassignment
        </Button>
      )}
    </div>
  );
}

export default WorkloadIndicator;

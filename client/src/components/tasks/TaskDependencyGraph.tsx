import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  ArrowRight,
  Lock,
  CheckCircle2,
  Circle,
  AlertTriangle,
  ChevronDown,
  ChevronRight,
  GitBranch,
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import type { Task, TaskDependency } from "@shared/schema";

interface TaskDependencyGraphProps {
  task: Task;
  onTaskClick?: (task: Task) => void;
  compact?: boolean;
}

interface DependencyNode {
  task: Task;
  dependencies: TaskDependency[];
  dependents: TaskDependency[];
  isBlocked: boolean;
  blockingTasks: Task[];
  level: number;
}

export function TaskDependencyGraph({ task, onTaskClick, compact = false }: TaskDependencyGraphProps) {
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set([task.id]));

  // Fetch dependencies for the current task
  const { data: dependencies = [], isLoading: loadingDeps } = useQuery<TaskDependency[]>({
    queryKey: ["/api/tasks", task.id, "dependencies"],
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/tasks/${task.id}/dependencies`);
      return res.json();
    },
    enabled: !!task.id,
  });

  // Fetch tasks that depend on this task
  const { data: dependents = [], isLoading: loadingDependents } = useQuery<TaskDependency[]>({
    queryKey: ["/api/tasks", task.id, "dependents"],
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/tasks/${task.id}/dependents`);
      return res.json();
    },
    enabled: !!task.id,
  });

  // Fetch all tasks to get full details
  const { data: allTasks = [] } = useQuery<Task[]>({
    queryKey: ["/api/tasks"],
    enabled: !!task.id,
  });

  // Build dependency graph
  const graphData = useMemo(() => {
    const taskMap = new Map<string, Task>();
    allTasks.forEach(t => taskMap.set(t.id, t));

    // Get prerequisite tasks (tasks this task depends on)
    const prerequisiteTasks: Task[] = dependencies
      .map(dep => taskMap.get(dep.prerequisiteTaskId))
      .filter((t): t is Task => !!t);

    // Get dependent tasks (tasks that depend on this task)
    const dependentTasks: Task[] = dependents
      .map(dep => taskMap.get(dep.taskId))
      .filter((t): t is Task => !!t);

    // Check if this task is blocked
    const blockingTasks = prerequisiteTasks.filter(
      prereq => prereq.status !== "completed"
    );
    const isBlocked = blockingTasks.length > 0;

    return {
      prerequisiteTasks,
      dependentTasks,
      blockingTasks,
      isBlocked,
    };
  }, [dependencies, dependents, allTasks]);

  const toggleNode = (taskId: string) => {
    setExpandedNodes(prev => {
      const next = new Set(prev);
      if (next.has(taskId)) {
        next.delete(taskId);
      } else {
        next.add(taskId);
      }
      return next;
    });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case "in_progress":
        return <Circle className="h-4 w-4 text-blue-500 fill-current" />;
      case "review":
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      default:
        return <Circle className="h-4 w-4 text-gray-400" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "urgent":
        return "bg-red-100 text-red-800 border-red-200";
      case "high":
        return "bg-orange-100 text-orange-800 border-orange-200";
      case "normal":
        return "bg-gray-100 text-gray-800 border-gray-200";
      case "low":
        return "bg-blue-100 text-blue-800 border-blue-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  if (loadingDeps || loadingDependents) {
    return (
      <div className="flex items-center justify-center p-4">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
      </div>
    );
  }

  const { prerequisiteTasks, dependentTasks, blockingTasks, isBlocked } = graphData;

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        {isBlocked && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger>
                <Lock className="h-4 w-4 text-red-500" />
              </TooltipTrigger>
              <TooltipContent>
                <p>Blocked by {blockingTasks.length} task(s)</p>
                {blockingTasks.map(t => (
                  <p key={t.id} className="text-sm">• {t.title}</p>
                ))}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
        {prerequisiteTasks.length > 0 && (
          <Badge variant="outline" className="text-xs">
            <GitBranch className="h-3 w-3 mr-1" />
            {prerequisiteTasks.length} prerequisite{prerequisiteTasks.length !== 1 ? "s" : ""}
          </Badge>
        )}
        {dependentTasks.length > 0 && (
          <Badge variant="outline" className="text-xs">
            <ArrowRight className="h-3 w-3 mr-1" />
            {dependentTasks.length} dependent{dependentTasks.length !== 1 ? "s" : ""}
          </Badge>
        )}
      </div>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <GitBranch className="h-4 w-4" />
          Task Dependencies
          {isBlocked && (
            <Badge variant="destructive" className="ml-2">
              <Lock className="h-3 w-3 mr-1" />
              Blocked
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[300px]">
          <div className="space-y-4">
            {/* Prerequisites Section */}
            {prerequisiteTasks.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  Prerequisites (Must Complete First)
                </h4>
                <div className="space-y-1">
                  {prerequisiteTasks.map(prereq => (
                    <div
                      key={prereq.id}
                      className={`
                        flex items-center gap-2 p-2 rounded-lg border
                        ${prereq.status !== "completed" 
                          ? "border-red-200 bg-red-50" 
                          : "border-green-200 bg-green-50"}
                        ${onTaskClick ? "cursor-pointer hover:bg-opacity-80" : ""}
                      `}
                      onClick={() => onTaskClick?.(prereq)}
                    >
                      {getStatusIcon(prereq.status)}
                      <span className="flex-1 text-sm truncate">{prereq.title}</span>
                      <Badge className={getPriorityColor(prereq.priority)} variant="outline">
                        {prereq.priority}
                      </Badge>
                      {prereq.status !== "completed" && (
                        <Lock className="h-4 w-4 text-red-500" />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Current Task */}
            <div className="flex items-center gap-2">
              <div className="flex-1 h-px bg-border" />
              <span className="text-xs text-muted-foreground">This Task</span>
              <div className="flex-1 h-px bg-border" />
            </div>
            <div
              className={`
                flex items-center gap-2 p-3 rounded-lg border-2
                ${isBlocked 
                  ? "border-red-300 bg-red-50" 
                  : "border-primary bg-primary/5"}
              `}
            >
              {getStatusIcon(task.status)}
              <span className="flex-1 font-medium truncate">{task.title}</span>
              <Badge className={getPriorityColor(task.priority)} variant="outline">
                {task.priority}
              </Badge>
            </div>

            {/* Dependents Section */}
            {dependentTasks.length > 0 && (
              <>
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-px bg-border" />
                  <ArrowRight className="h-4 w-4 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">Blocks</span>
                  <div className="flex-1 h-px bg-border" />
                </div>
                <div className="space-y-2">
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    Dependent Tasks (Waiting on This)
                  </h4>
                  <div className="space-y-1">
                    {dependentTasks.map(dep => (
                      <div
                        key={dep.id}
                        className={`
                          flex items-center gap-2 p-2 rounded-lg border
                          ${task.status !== "completed" 
                            ? "border-yellow-200 bg-yellow-50" 
                            : "border-gray-200 bg-gray-50"}
                          ${onTaskClick ? "cursor-pointer hover:bg-opacity-80" : ""}
                        `}
                        onClick={() => onTaskClick?.(dep)}
                      >
                        {getStatusIcon(dep.status)}
                        <span className="flex-1 text-sm truncate">{dep.title}</span>
                        <Badge className={getPriorityColor(dep.priority)} variant="outline">
                          {dep.priority}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}

            {/* Empty State */}
            {prerequisiteTasks.length === 0 && dependentTasks.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <GitBranch className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No dependencies configured</p>
                <p className="text-xs">Add prerequisites or link dependent tasks</p>
              </div>
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}

// Compact blocking indicator for task cards
export function TaskBlockingIndicator({ 
  task, 
  blockingTasks = [],
  onClick 
}: { 
  task: Task; 
  blockingTasks?: Task[];
  onClick?: () => void;
}) {
  if (blockingTasks.length === 0) return null;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onClick?.();
            }}
            className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-100 text-red-700 text-xs hover:bg-red-200 transition-colors"
          >
            <Lock className="h-3 w-3" />
            <span>Blocked</span>
          </button>
        </TooltipTrigger>
        <TooltipContent side="top">
          <p className="font-medium">Blocked by incomplete tasks:</p>
          {blockingTasks.map(t => (
            <p key={t.id} className="text-sm">• {t.title}</p>
          ))}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

export default TaskDependencyGraph;

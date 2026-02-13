import { useState } from "react";
import { 
  ChevronDown, 
  ChevronUp, 
  TrendingUp, 
  TrendingDown, 
  CheckCircle2, 
  Clock, 
  AlertTriangle,
  BarChart3,
  Users,
  Target,
  Zap
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import type { Task, User as UserType } from "@shared/schema";

interface TaskInsightsPanelProps {
  tasks: Task[];
  users: UserType[];
  filteredTasks: Task[];
}

interface TaskStats {
  total: number;
  completed: number;
  inProgress: number;
  todo: number;
  review: number;
  overdue: number;
  dueToday: number;
  dueThisWeek: number;
  completionRate: number;
  averageCompletionTime: number | null;
}

function calculateStats(tasks: Task[], filteredTasks: Task[]): TaskStats {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const weekEnd = new Date(today);
  weekEnd.setDate(weekEnd.getDate() + (6 - today.getDay()));

  const total = filteredTasks.length;
  const completed = filteredTasks.filter(t => t.status === "completed").length;
  const inProgress = filteredTasks.filter(t => t.status === "in_progress").length;
  const todo = filteredTasks.filter(t => t.status === "todo").length;
  const review = filteredTasks.filter(t => t.status === "review").length;

  const overdue = filteredTasks.filter(t => {
    if (!t.dueDate || t.status === "completed") return false;
    const dueDate = new Date(t.dueDate);
    return dueDate < today;
  }).length;

  const dueToday = filteredTasks.filter(t => {
    if (!t.dueDate) return false;
    const dueDate = new Date(t.dueDate);
    return dueDate.toDateString() === today.toDateString();
  }).length;

  const dueThisWeek = filteredTasks.filter(t => {
    if (!t.dueDate) return false;
    const dueDate = new Date(t.dueDate);
    return dueDate >= today && dueDate <= weekEnd;
  }).length;

  const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

  // Calculate average completion time for tasks completed in the last 7 days
  const sevenDaysAgo = new Date(today);
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  
  const recentlyCompleted = tasks.filter(t => 
    t.status === "completed" && 
    t.updatedAt && 
    new Date(t.updatedAt) >= sevenDaysAgo &&
    t.createdAt
  );

  let averageCompletionTime: number | null = null;
  if (recentlyCompleted.length > 0) {
    const totalHours = recentlyCompleted.reduce((acc, t) => {
      const created = new Date(t.createdAt!);
      const completed = new Date(t.updatedAt!);
      return acc + (completed.getTime() - created.getTime()) / (1000 * 60 * 60);
    }, 0);
    averageCompletionTime = totalHours / recentlyCompleted.length;
  }

  return {
    total,
    completed,
    inProgress,
    todo,
    review,
    overdue,
    dueToday,
    dueThisWeek,
    completionRate,
    averageCompletionTime,
  };
}

function getAssigneeWorkload(tasks: Task[], users: UserType[]) {
  const workload = new Map<number, { user: UserType; tasks: Task[] }>();
  
  users.forEach(user => {
    const userTasks = tasks.filter(t => t.assignedToId === user.id && t.status !== "completed");
    if (userTasks.length > 0) {
      workload.set(user.id, { user, tasks: userTasks });
    }
  });

  return Array.from(workload.values()).sort((a, b) => b.tasks.length - a.tasks.length);
}

export function TaskInsightsPanel({ tasks, users, filteredTasks }: TaskInsightsPanelProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  
  const stats = calculateStats(tasks, filteredTasks);
  const workload = getAssigneeWorkload(filteredTasks, users);

  return (
    <div className="border-b bg-gradient-to-r from-muted/30 to-muted/10">
      {/* Compact Header - Always Visible */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-muted/30 transition-colors"
      >
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-primary" />
            <span className="font-medium text-sm">Task Insights</span>
          </div>
          
          {/* Quick Stats */}
          <div className="flex items-center gap-3 text-xs">
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-green-500" />
              <span className="text-muted-foreground">{stats.completed} done</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-blue-500" />
              <span className="text-muted-foreground">{stats.inProgress} active</span>
            </div>
            {stats.overdue > 0 && (
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-red-500" />
                <span className="text-red-600 font-medium">{stats.overdue} overdue</span>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="text-xs">
            {stats.completionRate}% complete
          </Badge>
          {isExpanded ? (
            <ChevronUp className="w-4 h-4 text-muted-foreground" />
          ) : (
            <ChevronDown className="w-4 h-4 text-muted-foreground" />
          )}
        </div>
      </button>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="px-4 pb-4 animate-in slide-in-from-top-2 duration-200">
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {/* Total Tasks */}
            <Card className="bg-card/50">
              <CardContent className="p-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground">Total</p>
                    <p className="text-2xl font-bold">{stats.total}</p>
                  </div>
                  <Target className="w-8 h-8 text-muted-foreground/30" />
                </div>
              </CardContent>
            </Card>

            {/* Completed */}
            <Card className="bg-card/50">
              <CardContent className="p-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground">Completed</p>
                    <p className="text-2xl font-bold text-green-600">{stats.completed}</p>
                  </div>
                  <CheckCircle2 className="w-8 h-8 text-green-500/30" />
                </div>
              </CardContent>
            </Card>

            {/* In Progress */}
            <Card className="bg-card/50">
              <CardContent className="p-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground">In Progress</p>
                    <p className="text-2xl font-bold text-blue-600">{stats.inProgress}</p>
                  </div>
                  <Zap className="w-8 h-8 text-blue-500/30" />
                </div>
              </CardContent>
            </Card>

            {/* Overdue */}
            <Card className={`bg-card/50 ${stats.overdue > 0 ? 'border-red-200' : ''}`}>
              <CardContent className="p-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground">Overdue</p>
                    <p className={`text-2xl font-bold ${stats.overdue > 0 ? 'text-red-600' : ''}`}>
                      {stats.overdue}
                    </p>
                  </div>
                  <AlertTriangle className={`w-8 h-8 ${stats.overdue > 0 ? 'text-red-500/50' : 'text-muted-foreground/30'}`} />
                </div>
              </CardContent>
            </Card>

            {/* Due Today */}
            <Card className="bg-card/50">
              <CardContent className="p-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground">Due Today</p>
                    <p className="text-2xl font-bold text-orange-600">{stats.dueToday}</p>
                  </div>
                  <Clock className="w-8 h-8 text-orange-500/30" />
                </div>
              </CardContent>
            </Card>

            {/* Completion Rate */}
            <Card className="bg-card/50">
              <CardContent className="p-3">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <p className="text-xs text-muted-foreground">Completion Rate</p>
                    <p className="text-2xl font-bold">{stats.completionRate}%</p>
                  </div>
                  {stats.completionRate >= 70 ? (
                    <TrendingUp className="w-6 h-6 text-green-500" />
                  ) : stats.completionRate >= 40 ? (
                    <TrendingUp className="w-6 h-6 text-yellow-500" />
                  ) : (
                    <TrendingDown className="w-6 h-6 text-red-500" />
                  )}
                </div>
                <Progress value={stats.completionRate} className="h-1.5" />
              </CardContent>
            </Card>
          </div>

          {/* Workload Distribution */}
          {workload.length > 0 && (
            <div className="mt-4">
              <h4 className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-2">
                <Users className="w-3.5 h-3.5" />
                Team Workload
              </h4>
              <div className="flex flex-wrap gap-2">
                {workload.slice(0, 6).map(({ user, tasks: userTasks }) => {
                  const highPriority = userTasks.filter(t => t.priority === "high" || t.priority === "urgent").length;
                  return (
                    <div
                      key={user.id}
                      className="flex items-center gap-2 px-3 py-1.5 bg-card/50 rounded-full border text-xs"
                    >
                      <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-[10px] font-bold text-primary">
                        {user.firstName?.[0] || "?"}
                      </div>
                      <span className="font-medium">{user.firstName}</span>
                      <Badge variant="secondary" className="text-[10px] px-1.5 h-4">
                        {userTasks.length}
                      </Badge>
                      {highPriority > 0 && (
                        <Badge variant="destructive" className="text-[10px] px-1.5 h-4">
                          {highPriority} high
                        </Badge>
                      )}
                    </div>
                  );
                })}
                {workload.length > 6 && (
                  <div className="flex items-center px-3 py-1.5 text-xs text-muted-foreground">
                    +{workload.length - 6} more
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Average Completion Time */}
          {stats.averageCompletionTime !== null && (
            <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
              <Clock className="w-3.5 h-3.5" />
              <span>
                Average completion time:{" "}
                <span className="font-medium text-foreground">
                  {stats.averageCompletionTime < 24
                    ? `${Math.round(stats.averageCompletionTime)} hours`
                    : `${Math.round(stats.averageCompletionTime / 24)} days`}
                </span>
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

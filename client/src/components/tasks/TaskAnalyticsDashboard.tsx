import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Legend,
  Area,
  AreaChart,
} from "recharts";
import {
  TrendingUp,
  TrendingDown,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Users,
  Target,
  BarChart3,
  Activity,
  Zap,
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import type { Task, User } from "@shared/schema";

interface TaskAnalyticsDashboardProps {
  dateRange?: { from: Date; to: Date };
  userId?: number;
}

interface AnalyticsData {
  totalTasks: number;
  completedTasks: number;
  overdueTasks: number;
  inProgressTasks: number;
  todoTasks: number;
  reviewTasks: number;
  completionRate: number;
  avgCompletionTime: number;
  tasksByStatus: Record<string, number>;
  tasksByPriority: Record<string, number>;
  productivityByUser: Array<{
    userId: number;
    userName: string;
    completed: number;
    inProgress: number;
    total: number;
  }>;
  dailyCompletions: Array<{
    date: string;
    completed: number;
    created: number;
  }>;
}

const STATUS_COLORS: Record<string, string> = {
  todo: "#94a3b8",
  in_progress: "#3b82f6",
  review: "#f59e0b",
  completed: "#22c55e",
};

const PRIORITY_COLORS: Record<string, string> = {
  low: "#3b82f6",
  normal: "#94a3b8",
  high: "#f97316",
  urgent: "#ef4444",
};

export function TaskAnalyticsDashboard({ dateRange, userId }: TaskAnalyticsDashboardProps) {
  const [timeRange, setTimeRange] = useState<"7d" | "30d" | "90d">("30d");

  // Fetch analytics data
  const { data: analytics, isLoading } = useQuery<AnalyticsData>({
    queryKey: ["/api/tasks/analytics", timeRange, userId],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (dateRange?.from) {
        params.set("dateFrom", dateRange.from.toISOString());
      }
      if (dateRange?.to) {
        params.set("dateTo", dateRange.to.toISOString());
      }
      const res = await apiRequest("GET", `/api/tasks/analytics?${params.toString()}`);
      return res.json();
    },
  });

  // Fetch all tasks for calculations
  const { data: tasks = [] } = useQuery<Task[]>({
    queryKey: ["/api/tasks"],
  });

  // Fetch users for productivity metrics
  const { data: users = [] } = useQuery<User[]>({
    queryKey: ["/api/users"],
  });

  // Calculate analytics from tasks
  const calculatedAnalytics = useMemo((): AnalyticsData => {
    const now = new Date();
    const filteredTasks = tasks.filter(task => {
      if (userId && task.assignedToId !== userId) return false;
      return true;
    });

    const completed = filteredTasks.filter(t => t.status === "completed");
    const overdue = filteredTasks.filter(
      t => t.status !== "completed" && t.dueDate && new Date(t.dueDate) < now
    );
    const inProgress = filteredTasks.filter(t => t.status === "in_progress");
    const todo = filteredTasks.filter(t => t.status === "todo");
    const review = filteredTasks.filter(t => t.status === "review");

    // Tasks by status
    const tasksByStatus: Record<string, number> = {
      todo: todo.length,
      in_progress: inProgress.length,
      review: review.length,
      completed: completed.length,
    };

    // Tasks by priority
    const tasksByPriority: Record<string, number> = {};
    filteredTasks.forEach(task => {
      const priority = task.priority || "normal";
      tasksByPriority[priority] = (tasksByPriority[priority] || 0) + 1;
    });

    // Productivity by user
    const userProductivity = new Map<number, { completed: number; inProgress: number; total: number }>();
    filteredTasks.forEach(task => {
      if (!task.assignedToId) return;
      const current = userProductivity.get(task.assignedToId) || { completed: 0, inProgress: 0, total: 0 };
      current.total++;
      if (task.status === "completed") current.completed++;
      if (task.status === "in_progress") current.inProgress++;
      userProductivity.set(task.assignedToId, current);
    });

    const productivityByUser = Array.from(userProductivity.entries()).map(([userId, stats]) => {
      const user = users.find(u => u.id === userId);
      return {
        userId,
        userName: user ? `${user.firstName || ""} ${user.lastName || ""}`.trim() || user.username : `User ${userId}`,
        ...stats,
      };
    }).sort((a, b) => b.completed - a.completed);

    // Daily completions (last 7 days)
    const dailyCompletions = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split("T")[0];
      
      const completedOnDay = completed.filter(t => {
        if (!t.completedAt) return false;
        return t.completedAt.toISOString().split("T")[0] === dateStr;
      }).length;

      const createdOnDay = filteredTasks.filter(t => {
        if (!t.createdAt) return false;
        return t.createdAt.toISOString().split("T")[0] === dateStr;
      }).length;

      dailyCompletions.push({
        date: date.toLocaleDateString("en-US", { weekday: "short" }),
        completed: completedOnDay,
        created: createdOnDay,
      });
    }

    return {
      totalTasks: filteredTasks.length,
      completedTasks: completed.length,
      overdueTasks: overdue.length,
      inProgressTasks: inProgress.length,
      todoTasks: todo.length,
      reviewTasks: review.length,
      completionRate: filteredTasks.length > 0 
        ? Math.round((completed.length / filteredTasks.length) * 100) 
        : 0,
      avgCompletionTime: 0, // Would need historical data
      tasksByStatus,
      tasksByPriority,
      productivityByUser,
      dailyCompletions,
    };
  }, [tasks, users, userId]);

  const data = analytics || calculatedAnalytics;

  // Prepare chart data
  const statusChartData = Object.entries(data.tasksByStatus || {}).map(([status, count]) => ({
    name: status.replace("_", " ").replace(/\b\w/g, l => l.toUpperCase()),
    value: count,
    fill: STATUS_COLORS[status] || "#94a3b8",
  }));

  const priorityChartData = Object.entries(data.tasksByPriority || {}).map(([priority, count]) => ({
    name: priority.charAt(0).toUpperCase() + priority.slice(1),
    value: count,
    fill: PRIORITY_COLORS[priority] || "#94a3b8",
  }));

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Time Range Selector */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Task Analytics</h2>
          <p className="text-muted-foreground">
            Track team productivity and task completion metrics
          </p>
        </div>
        <Select value={timeRange} onValueChange={(v) => setTimeRange(v as typeof timeRange)}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Select time range" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7d">Last 7 days</SelectItem>
            <SelectItem value="30d">Last 30 days</SelectItem>
            <SelectItem value="90d">Last 90 days</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Tasks</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.totalTasks}</div>
            <p className="text-xs text-muted-foreground">
              {data.todoTasks} pending, {data.inProgressTasks} in progress
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
            {data.completionRate >= 70 ? (
              <TrendingUp className="h-4 w-4 text-green-500" />
            ) : (
              <TrendingDown className="h-4 w-4 text-red-500" />
            )}
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.completionRate}%</div>
            <p className="text-xs text-muted-foreground">
              {data.completedTasks} of {data.totalTasks} completed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">In Progress</CardTitle>
            <Activity className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.inProgressTasks}</div>
            <p className="text-xs text-muted-foreground">
              {data.reviewTasks} awaiting review
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overdue</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{data.overdueTasks}</div>
            <p className="text-xs text-muted-foreground">
              Tasks past due date
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Status Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Tasks by Status</CardTitle>
            <CardDescription>Distribution of tasks across workflow stages</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusChartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    labelLine={false}
                  >
                    {statusChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Priority Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Tasks by Priority</CardTitle>
            <CardDescription>Task priority breakdown</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={priorityChartData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis dataKey="name" type="category" width={70} />
                  <Tooltip />
                  <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                    {priorityChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Daily Activity Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Daily Activity</CardTitle>
          <CardDescription>Tasks created vs completed over the last 7 days</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.dailyCompletions}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Area
                  type="monotone"
                  dataKey="created"
                  stackId="1"
                  stroke="#3b82f6"
                  fill="#3b82f6"
                  fillOpacity={0.3}
                  name="Created"
                />
                <Area
                  type="monotone"
                  dataKey="completed"
                  stackId="2"
                  stroke="#22c55e"
                  fill="#22c55e"
                  fillOpacity={0.3}
                  name="Completed"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Team Productivity Leaderboard */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Users className="h-5 w-5" />
            Team Productivity
          </CardTitle>
          <CardDescription>Top performers by completed tasks</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {data.productivityByUser.slice(0, 5).map((user, index) => (
              <div key={user.userId} className="flex items-center gap-4">
                <div className={`
                  flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold
                  ${index === 0 ? "bg-yellow-100 text-yellow-800" : ""}
                  ${index === 1 ? "bg-gray-100 text-gray-800" : ""}
                  ${index === 2 ? "bg-orange-100 text-orange-800" : ""}
                  ${index > 2 ? "bg-muted text-muted-foreground" : ""}
                `}>
                  {index + 1}
                </div>
                <div className="flex-1">
                  <p className="font-medium">{user.userName}</p>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <CheckCircle2 className="h-3 w-3 text-green-500" />
                      {user.completed} completed
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3 text-blue-500" />
                      {user.inProgress} in progress
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium">
                    {user.total > 0 ? Math.round((user.completed / user.total) * 100) : 0}%
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {user.total} total
                  </div>
                </div>
              </div>
            ))}
            {data.productivityByUser.length === 0 && (
              <div className="text-center py-4 text-muted-foreground">
                No team data available
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default TaskAnalyticsDashboard;

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Megaphone, TrendingUp, DollarSign, ArrowUpRight, ArrowDownRight, Activity, Calendar, CreditCard, CheckCircle2, ListTodo, Eye, Plus, Clock, UserPlus } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { LineChart, Line, PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip } from "recharts";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { PullToRefresh } from "@/components/PullToRefresh";
import { NumberTicker } from "@/components/ui/number-ticker";
import { InteractiveCard } from "@/components/ui/interactive-card";
import { Celebration } from "@/components/Celebration";
import { motion } from "framer-motion";
import { usePermissions } from "@/hooks/usePermissions";
import { getDefaultDashboardPath } from "@/lib/effective-role";
import { useEffect, useMemo, useState } from "react";

export default function AdminDashboard() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const { role, isAdmin } = usePermissions();
  const [lastUpdatedAt, setLastUpdatedAt] = useState<Date | null>(null);

  useEffect(() => {
    if (!isAdmin) navigate(getDefaultDashboardPath(role));
  }, [isAdmin, navigate, role]);
  
  const { data: stats, isLoading, error, refetch } = useQuery({
    queryKey: ["/api/dashboard/admin-stats"],
    refetchInterval: 30000, // Auto-refresh every 30 seconds
    retry: 3,
    onSuccess: () => {
      setLastUpdatedAt(new Date());
    },
  });

  const { data: stripeData } = useQuery({
    queryKey: ["/api/stripe/dashboard"],
    enabled: isAdmin,
    retry: false,
    meta: { returnNull: true }, // Don't throw error if Stripe not configured
  });

  // Use Stripe revenue if available, otherwise fall back to internal invoices
  const stripeRevenue = stripeData?.totalRevenue || 0;
  const displayRevenue = stripeRevenue > 0 ? stripeRevenue : (stats?.monthlyRevenue || 0);

  // Get current time for greeting
  const getGreeting = () => {
    const hour = new Date().getHours();
    const displayName = user?.firstName || user?.username?.split(' ')[0] || 'there';
    
    const playfulGreetings = [
      "Ready to crush it",
      "Let's make some magic",
      "Time to shine",
      "You're doing amazing",
      "Let's win today",
      "Welcome back, Rockstar"
    ];
    const playfulGreeting = playfulGreetings[Math.floor(Math.random() * playfulGreetings.length)];
    
    if (hour < 12) return `Good morning, ${displayName}! ${playfulGreeting}`;
    if (hour < 18) return `Good afternoon, ${displayName}! ${playfulGreeting}`;
    return `Good evening, ${displayName}! ${playfulGreeting}`;
  };

  const greeting = useMemo(() => getGreeting(), [user?.firstName, user?.username]);

  const getCurrentDate = () => {
    return new Date().toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  // Placeholder for sparkline data (in production, this would come from historical API data)
  const generateSparklineData = (baseValue: number, _trend: number) => {
    // Return empty or flat data instead of random mock data
    return Array.from({ length: 7 }, () => ({ value: baseValue }));
  };

  const metrics = [
    {
      title: "Total Clients",
      value: stats?.totalClients || 0,
      displayValue: stats?.totalClients || 0,
      change: `${stats?.clientsChange || "0"}%`,
      changeType: (stats?.clientsChange && parseInt(stats.clientsChange) >= 0) ? "positive" as const : "negative" as const,
      icon: Users,
      gradientFrom: "from-blue-500",
      gradientTo: "to-cyan-500",
      iconBg: "from-blue-500/20 to-cyan-500/20",
      sparklineData: generateSparklineData(stats?.totalClients || 10, parseInt(stats?.clientsChange || "0")),
      link: "/clients",
      tooltip: "Total number of active clients",
    },
    {
      title: "Active Campaigns",
      value: stats?.activeCampaigns || 0,
      displayValue: stats?.activeCampaigns || 0,
      change: `${stats?.campaignsChange || "0"}%`,
      changeType: (stats?.campaignsChange && parseInt(stats.campaignsChange) >= 0) ? "positive" as const : "negative" as const,
      icon: Megaphone,
      gradientFrom: "from-orange-500",
      gradientTo: "to-pink-500",
      iconBg: "from-orange-500/20 to-pink-500/20",
      sparklineData: generateSparklineData(stats?.activeCampaigns || 5, parseInt(stats?.campaignsChange || "0")),
      link: "/campaigns",
      tooltip: "Currently running marketing campaigns",
    },
    {
      title: "Pipeline Value",
      value: `$${((stats?.pipelineValue || 0) / 1000).toFixed(1)}k`,
      displayValue: stats?.pipelineValue || 0,
      change: `${stats?.pipelineChange || "0"}%`,
      changeType: (stats?.pipelineChange && parseInt(stats.pipelineChange) >= 0) ? "positive" as const : "negative" as const,
      icon: TrendingUp,
      gradientFrom: "from-emerald-500",
      gradientTo: "to-teal-500",
      iconBg: "from-emerald-500/20 to-teal-500/20",
      sparklineData: generateSparklineData(stats?.pipelineValue || 10000, parseInt(stats?.pipelineChange || "0")),
      link: "/pipeline",
      tooltip: "Total value of deals in pipeline",
    },
    {
      title: "Revenue (MTD)",
      value: displayRevenue === 0 ? "$0" : `$${(displayRevenue / 1000).toFixed(1)}k`,
      displayValue: displayRevenue,
      change: `${stats?.revenueChange || "0"}%`,
      changeType: (stats?.revenueChange && parseInt(stats.revenueChange) >= 0) ? "positive" as const : "negative" as const,
      icon: DollarSign,
      gradientFrom: "from-violet-500",
      gradientTo: "to-purple-500",
      iconBg: "from-violet-500/20 to-purple-500/20",
      sparklineData: generateSparklineData(displayRevenue || 5000, parseInt(stats?.revenueChange || "0")),
      link: "/invoices",
      tooltip: "Month-to-date revenue from all sources",
    },
  ];

  // Manager-specific metrics (operational, non-financial)
  const managerMetrics = [
    {
      title: "Total Clients",
      value: stats?.totalClients || 0,
      displayValue: stats?.totalClients || 0,
      change: `${stats?.clientsChange || "0"}%`,
      changeType: (stats?.clientsChange && parseInt(stats.clientsChange) >= 0) ? "positive" as const : "negative" as const,
      icon: Users,
      gradientFrom: "from-blue-500",
      gradientTo: "to-cyan-500",
      iconBg: "from-blue-500/20 to-cyan-500/20",
      sparklineData: generateSparklineData(stats?.totalClients || 10, parseInt(stats?.clientsChange || "0")),
      link: "/clients",
      tooltip: "Total number of active clients",
    },
    {
      title: "Active Campaigns",
      value: stats?.activeCampaigns || 0,
      displayValue: stats?.activeCampaigns || 0,
      change: `${stats?.campaignsChange || "0"}%`,
      changeType: (stats?.campaignsChange && parseInt(stats.campaignsChange) >= 0) ? "positive" as const : "negative" as const,
      icon: Megaphone,
      gradientFrom: "from-orange-500",
      gradientTo: "to-pink-500",
      iconBg: "from-orange-500/20 to-pink-500/20",
      sparklineData: generateSparklineData(stats?.activeCampaigns || 5, parseInt(stats?.campaignsChange || "0")),
      link: "/campaigns",
      tooltip: "Currently running marketing campaigns",
    },
    {
      title: "Total Leads",
      value: stats?.totalLeads || 0,
      displayValue: stats?.totalLeads || 0,
      change: "+0%",
      changeType: "positive" as const,
      icon: UserPlus,
      gradientFrom: "from-purple-500",
      gradientTo: "to-pink-500",
      iconBg: "from-purple-500/20 to-pink-500/20",
      sparklineData: generateSparklineData(stats?.totalLeads || 20, 0),
      link: "/leads",
      tooltip: "Leads in the pipeline",
    },
    {
      title: "Task Completion",
      value: `${stats?.taskMetrics?.completionPercentage || 0}%`,
      displayValue: stats?.taskMetrics?.completionPercentage || 0,
      change: "+0%",
      changeType: "positive" as const,
      icon: CheckCircle2,
      gradientFrom: "from-emerald-500",
      gradientTo: "to-teal-500",
      iconBg: "from-emerald-500/20 to-teal-500/20",
      sparklineData: generateSparklineData(stats?.taskMetrics?.completionPercentage || 50, 0),
      link: "/tasks",
      tooltip: "Team task completion rate",
    },
  ];

  // Role-based metric visibility
  const visibleMetrics = (() => {
    if (user?.role === 'staff') {
      // Staff see only their task completion - no company-wide stats
      return [];
    }
    if (user?.role === 'manager') {
      // Managers see operational metrics (no financial data)
      return managerMetrics;
    }
    // Admins see everything
    return metrics;
  })();

  // Task distribution data for pie chart
  const taskDistributionData = stats?.taskMetrics ? [
    { name: 'To Do', value: stats.taskMetrics.pending, color: '#f59e0b' },
    { name: 'In Progress', value: stats.taskMetrics.inProgress, color: '#3b82f6' },
    { name: 'Review', value: stats.taskMetrics.review, color: '#8b5cf6' },
    { name: 'Completed', value: stats.taskMetrics.completed, color: '#10b981' },
  ] : [];

  // Calculate MRR growth (would come from historical API data)
  const mrrGrowth = "0";

  if (isLoading) {
    return (
      <div className="min-h-full gradient-mesh">
        <div className="max-w-7xl mx-auto p-6 lg:p-8 xl:p-12">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <Card key={i} className="glass">
                <CardHeader className="pb-2">
                  <div className="h-4 bg-muted/50 rounded w-24 shimmer"></div>
                </CardHeader>
                <CardContent>
                  <div className="h-8 bg-muted/50 rounded w-16 shimmer"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <PullToRefresh onRefresh={async () => { await refetch(); }}>
      <Celebration active={stats?.taskMetrics?.completionPercentage === 100} />
      <div className="min-h-full gradient-mesh overflow-x-hidden">
        <div className="max-w-7xl mx-auto p-4 md:p-6 lg:p-8 xl:p-12 space-y-6 md:space-y-8">
        {error && (
          <Card className="glass-strong border-0 shadow-lg">
            <CardContent className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3 p-4 md:p-6">
              <div>
                <p className="text-sm font-semibold text-rose-600 dark:text-rose-400">We couldn't load the latest admin stats.</p>
                <p className="text-xs text-muted-foreground mt-1">Try again or pull to refresh.</p>
              </div>
              <Button size="sm" variant="secondary" onClick={() => refetch()}>
                Retry
              </Button>
            </CardContent>
          </Card>
        )}
        {/* Premium Header with Welcome Message */}
        <motion.div
          className="space-y-2 md:space-y-3"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, ease: "easeOut" }}
        >
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold tracking-tight text-gradient-purple" data-testid="text-page-title">
                {greeting}! 👋
              </h1>
              <p className="text-sm md:text-base lg:text-lg text-muted-foreground mt-1">{getCurrentDate()}</p>
              <p className="text-xs md:text-sm text-muted-foreground/80 mt-0.5">
                {lastUpdatedAt ? `Last updated ${lastUpdatedAt.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}` : "Updating dashboard stats..."}
                {" • Auto-refreshes every 30s"}
              </p>
              <p className="text-xs md:text-sm text-muted-foreground/80 mt-0.5">
                {user?.role === 'staff' ? "Here's your daily work overview" : "Here's your agency snapshot"}
              </p>
            </div>
          </div>
        </motion.div>

        {/* Staff Personal Stats - Simple View */}
        {user?.role === 'staff' && stats && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 stagger-fade-in">
            <InteractiveCard className="group">
              <Card className="relative overflow-hidden border-0 shadow-lg hover:shadow-2xl transition-all duration-300 cursor-pointer h-full" onClick={() => navigate('/tasks')}>
                <CardHeader className="relative flex flex-row items-center justify-between gap-2 pb-2 md:pb-3 p-4 md:p-6">
                  <CardTitle className="text-xs md:text-sm font-medium text-muted-foreground">
                    My Tasks
                  </CardTitle>
                  <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center shadow-md flex-shrink-0">
                    <ListTodo className="w-5 h-5 md:w-6 md:h-6 text-white" />
                  </div>
                </CardHeader>
                <CardContent className="relative p-4 md:p-6 pt-0">
                  <div className="text-3xl md:text-4xl font-bold tracking-tight font-mono">
                    <NumberTicker value={stats?.taskMetrics?.total || 0} />
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    {stats?.taskMetrics?.completionPercentage || 0}% Complete
                  </p>
                </CardContent>
              </Card>
            </InteractiveCard>

            <InteractiveCard className="group">
              <Card className="relative overflow-hidden border-0 shadow-lg hover:shadow-2xl transition-all duration-300 cursor-pointer h-full" onClick={() => navigate('/leads')}>
                <CardHeader className="relative flex flex-row items-center justify-between gap-2 pb-2 md:pb-3 p-4 md:p-6">
                  <CardTitle className="text-xs md:text-sm font-medium text-muted-foreground">
                    My Leads
                  </CardTitle>
                  <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-md flex-shrink-0">
                    <Users className="w-5 h-5 md:w-6 md:h-6 text-white" />
                  </div>
                </CardHeader>
                <CardContent className="relative p-4 md:p-6 pt-0">
                  <div className="text-3xl md:text-4xl font-bold tracking-tight font-mono">
                    <NumberTicker value={stats?.totalLeads || 0} />
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">Assigned to you</p>
                </CardContent>
              </Card>
            </InteractiveCard>

            <InteractiveCard className="group">
              <Card className="relative overflow-hidden border-0 shadow-lg hover:shadow-2xl transition-all duration-300 cursor-pointer h-full" onClick={() => navigate('/messages')}>
                <CardHeader className="relative flex flex-row items-center justify-between gap-2 pb-2 md:pb-3 p-4 md:p-6">
                  <CardTitle className="text-xs md:text-sm font-medium text-muted-foreground">
                    Messages
                  </CardTitle>
                  <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center shadow-md flex-shrink-0">
                    <Activity className="w-5 h-5 md:w-6 md:h-6 text-white" />
                  </div>
                </CardHeader>
                <CardContent className="relative p-4 md:p-6 pt-0">
                  <div className="text-3xl md:text-4xl font-bold tracking-tight font-mono">
                    <NumberTicker value={(stats as any)?.unreadMessagesCount || 0} />
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">Unread</p>
                </CardContent>
              </Card>
            </InteractiveCard>

            <InteractiveCard className="group">
              <Card className="relative overflow-hidden border-0 shadow-lg hover:shadow-2xl transition-all duration-300 cursor-pointer h-full" onClick={() => navigate('/company-calendar')}>
                <CardHeader className="relative flex flex-row items-center justify-between gap-2 pb-2 md:pb-3 p-4 md:p-6">
                  <CardTitle className="text-xs md:text-sm font-medium text-muted-foreground">
                    Deadlines
                  </CardTitle>
                  <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center shadow-md flex-shrink-0">
                    <Clock className="w-5 h-5 md:w-6 md:h-6 text-white" />
                  </div>
                </CardHeader>
                <CardContent className="relative p-4 md:p-6 pt-0">
                  <div className="text-3xl md:text-4xl font-bold tracking-tight font-mono">
                    <NumberTicker value={(stats as any)?.deadLinesThisWeek || 0} />
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">This week</p>
                </CardContent>
              </Card>
            </InteractiveCard>
          </div>
        )}

        {/* Premium Metric Cards with Sparklines & Click Navigation (Admin/Manager only) */}
        {user?.role !== 'staff' && (
        <TooltipProvider>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 stagger-fade-in">
            {visibleMetrics.map((metric) => (
              <Tooltip key={metric.title}>
                <TooltipTrigger asChild>
                  <InteractiveCard
                    className="group"
                  >
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.22, ease: "easeOut" }}
                    >
                    <Card 
                      onClick={() => navigate(metric.link)}
                      className="relative overflow-hidden border-0 shadow-lg hover:shadow-2xl transition-all duration-300 card-hover-lift gradient-border cursor-pointer h-full"
                      data-testid={`card-metric-${metric.title.toLowerCase().replace(/\s+/g, '-')}`}
                    >
                      {/* Gradient Background Overlay */}
                      <div className={`absolute inset-0 bg-gradient-to-br ${metric.iconBg} opacity-0 group-hover:opacity-100 transition-opacity duration-300`}></div>
                      
                      <CardHeader className="relative flex flex-row items-center justify-between gap-2 pb-2 md:pb-3 p-4 md:p-6">
                        <CardTitle className="text-xs md:text-sm font-medium text-muted-foreground">
                          {metric.title}
                        </CardTitle>
                        <div className={`w-10 h-10 md:w-12 md:h-12 rounded-xl bg-gradient-to-br ${metric.gradientFrom} ${metric.gradientTo} flex items-center justify-center shadow-md group-hover:scale-110 transition-transform duration-300 flex-shrink-0`}>
                          <metric.icon className="w-5 h-5 md:w-6 md:h-6 text-white" />
                        </div>
                      </CardHeader>
                      <CardContent className="relative p-4 md:p-6 pt-0 space-y-3">
                        <div className="flex items-end justify-between gap-2">
                          <div className="text-3xl md:text-4xl font-bold tracking-tight font-mono" data-testid={`metric-${metric.title.toLowerCase().replace(/\s+/g, '-')}`}>
                            {typeof metric.displayValue === 'number' ? (
                              <NumberTicker 
                                value={metric.displayValue} 
                                prefix={metric.title.includes('Revenue') || metric.title.includes('Value') ? '$' : ''}
                                suffix={metric.title.includes('Revenue') || metric.title.includes('Value') ? (metric.displayValue >= 1000 ? 'k' : '') : ''}
                                decimalPlaces={metric.title.includes('Revenue') || metric.title.includes('Value') ? (metric.displayValue >= 1000 ? 1 : 0) : 0}
                              />
                            ) : metric.value}
                          </div>
                          <div className={`flex items-center gap-0.5 text-xs md:text-sm font-semibold px-2 py-0.5 md:px-2.5 md:py-1 rounded-full flex-shrink-0 ${
                            metric.changeType === 'positive' 
                              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' 
                              : 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
                          }`}>
                            {metric.changeType === 'positive' ? (
                              <ArrowUpRight className="w-3 h-3 md:w-4 md:h-4" />
                            ) : (
                              <ArrowDownRight className="w-3 h-3 md:w-4 md:h-4" />
                            )}
                            <span className="text-xs md:text-sm">{metric.change}</span>
                          </div>
                        </div>
                        
                        {/* Mini Sparkline Chart */}
                        <div className="h-8 -mx-2">
                          <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={metric.sparklineData}>
                              <Line 
                                type="monotone" 
                                dataKey="value" 
                                stroke={metric.changeType === 'positive' ? '#10b981' : '#ef4444'}
                                strokeWidth={2}
                                dot={false}
                              />
                            </LineChart>
                          </ResponsiveContainer>
                        </div>
                      </CardContent>
                    </Card>
                    </motion.div>
                  </InteractiveCard>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{metric.tooltip}</p>
                </TooltipContent>
              </Tooltip>
            ))}
          </div>
        </TooltipProvider>
        )}

        {/* Task Progress Section with Donut Chart */}
        {stats?.taskMetrics && (
          <Card className="glass-strong border-0 shadow-xl overflow-hidden">
            <CardHeader className="border-b border-border/50 bg-gradient-to-r from-blue-500/5 via-transparent to-transparent p-4 md:p-6">
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500/20 to-cyan-500/20 flex items-center justify-center">
                    <ListTodo className="w-5 h-5 text-blue-500" />
                  </div>
                  <div>
                    <CardTitle className="text-lg md:text-xl font-semibold">Task Progress</CardTitle>
                    <p className="text-xs md:text-sm text-muted-foreground mt-0.5">
                      Daily work completion tracking
                      {stats.taskMetrics.completionPercentage > 75 && " • Great progress! 🎉"}
                    </p>
                  </div>
                </div>
                <Badge variant="secondary" className="text-xs md:text-sm">
                  {stats.taskMetrics.completionPercentage}% Complete
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="p-4 md:p-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Donut Chart */}
                <div className="flex items-center justify-center">
                  <div className="relative w-48 h-48">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={taskDistributionData}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={80}
                          paddingAngle={2}
                          dataKey="value"
                        >
                          {taskDistributionData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <RechartsTooltip />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="absolute inset-0 flex items-center justify-center flex-col">
                      <div className="text-3xl font-bold">{stats.taskMetrics.total}</div>
                      <div className="text-xs text-muted-foreground">Total Tasks</div>
                    </div>
                  </div>
                </div>

                  {/* Progress Bar & Stats */}
                <div className="lg:col-span-2 space-y-6">
                  {/* Today's Completion Highlight */}
                  {stats.completedTasksToday !== undefined && stats.completedTasksToday > 0 && (
                    <div className="bg-gradient-to-r from-emerald-500/10 via-emerald-500/5 to-transparent rounded-lg p-4 border border-emerald-500/20">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-full bg-emerald-500/20 flex items-center justify-center">
                            <span className="text-2xl">🎯</span>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Completed Today</p>
                            <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                              {stats.completedTasksToday} {stats.completedTasksToday === 1 ? 'Task' : 'Tasks'}
                            </p>
                          </div>
                        </div>
                        {stats.totalTasksToday > 0 && (
                          <div className="text-right">
                            <p className="text-xs text-muted-foreground">Today's Progress</p>
                            <p className="text-lg font-semibold">
                              {Math.round((stats.completedTasksToday / stats.totalTasksToday) * 100)}%
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Overall Progress Bar */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Overall Progress</span>
                      <span className="font-semibold">
                        {stats.taskMetrics.completed} / {stats.taskMetrics.total} Tasks
                      </span>
                    </div>
                    <Progress 
                      value={stats.taskMetrics.completionPercentage} 
                      className="h-3"
                      data-testid="progress-task-completion"
                    />
                  </div>

                  {/* Task Stats Grid - Clickable */}
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
                    {/* 📋 To Do */}
                    <button
                      onClick={() => navigate('/tasks?status=pending')}
                      className="flex items-center gap-2 md:gap-3 p-2 md:p-3 rounded-lg bg-amber-500/5 border border-amber-500/10 hover:bg-amber-500/10 transition-colors text-left"
                    >
                      <div className="w-8 h-8 md:w-10 md:h-10 rounded-lg bg-amber-500/20 flex items-center justify-center text-xl md:text-2xl flex-shrink-0">
                        📋
                      </div>
                      <div className="min-w-0">
                        <p className="text-xl md:text-2xl font-bold text-amber-600 dark:text-amber-400 truncate" data-testid="metric-pending-tasks">
                          {stats.taskMetrics.pending}
                        </p>
                        <p className="text-xs text-muted-foreground">To Do</p>
                      </div>
                    </button>

                    {/* ⚡ In Progress */}
                    <button
                      onClick={() => navigate('/tasks?status=in-progress')}
                      className="flex items-center gap-2 md:gap-3 p-2 md:p-3 rounded-lg bg-blue-500/5 border border-blue-500/10 hover:bg-blue-500/10 transition-colors text-left"
                    >
                      <div className="w-8 h-8 md:w-10 md:h-10 rounded-lg bg-blue-500/20 flex items-center justify-center text-xl md:text-2xl flex-shrink-0">
                        ⚡
                      </div>
                      <div className="min-w-0">
                        <p className="text-xl md:text-2xl font-bold text-blue-600 dark:text-blue-400 truncate" data-testid="metric-inprogress-tasks">
                          {stats.taskMetrics.inProgress}
                        </p>
                        <p className="text-xs text-muted-foreground">In Progress</p>
                      </div>
                    </button>

                    {/* 👀 Review */}
                    <button
                      onClick={() => navigate('/tasks?status=review')}
                      className="flex items-center gap-2 md:gap-3 p-2 md:p-3 rounded-lg bg-violet-500/5 border border-violet-500/10 hover:bg-violet-500/10 transition-colors text-left"
                    >
                      <div className="w-8 h-8 md:w-10 md:h-10 rounded-lg bg-violet-500/20 flex items-center justify-center text-xl md:text-2xl flex-shrink-0">
                        👀
                      </div>
                      <div className="min-w-0">
                        <p className="text-xl md:text-2xl font-bold text-violet-600 dark:text-violet-400 truncate" data-testid="metric-review-tasks">
                          {stats.taskMetrics.review}
                        </p>
                        <p className="text-xs text-muted-foreground">Review</p>
                      </div>
                    </button>

                    {/* ✅ Completed */}
                    <button
                      onClick={() => navigate('/tasks?status=completed')}
                      className="flex items-center gap-2 md:gap-3 p-2 md:p-3 rounded-lg bg-emerald-500/5 border border-emerald-500/10 hover:bg-emerald-500/10 transition-colors text-left"
                    >
                      <div className="w-8 h-8 md:w-10 md:h-10 rounded-lg bg-emerald-500/20 flex items-center justify-center text-xl md:text-2xl flex-shrink-0">
                        ✅
                      </div>
                      <div className="min-w-0">
                        <p className="text-xl md:text-2xl font-bold text-emerald-600 dark:text-emerald-400 truncate" data-testid="metric-completed-tasks">
                          {stats.taskMetrics.completed}
                        </p>
                        <p className="text-xs text-muted-foreground">Completed</p>
                      </div>
                    </button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Stripe Subscription Metrics with Enhanced Visuals */}
        {stripeData && (
          <Card className="glass-strong border-0 shadow-xl overflow-hidden">
            <CardHeader className="border-b border-border/50 bg-gradient-to-r from-primary/5 via-transparent to-transparent p-4 md:p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary/20 to-purple-500/20 flex items-center justify-center">
                    <CreditCard className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-xl font-semibold">Subscription Overview</CardTitle>
                    <p className="text-sm text-muted-foreground mt-0.5">Active customer subscriptions from Stripe</p>
                  </div>
                </div>
                <Badge variant="secondary" className="text-sm bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-3 py-1">
                  {stripeData?.activeSubscriptions || 0} Active
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Total Subscriptions</p>
                  <p className="text-3xl font-bold" data-testid="metric-total-subscriptions">{stripeData?.totalSubscriptions || 0}</p>
                  <p className="text-xs text-muted-foreground">
                    {stripeData?.activeSubscriptions || 0} active • {((stripeData?.totalSubscriptions || 0) - (stripeData?.activeSubscriptions || 0))} inactive
                  </p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Active Subscriptions</p>
                  <p className="text-3xl font-bold text-emerald-600 dark:text-emerald-400" data-testid="metric-active-subscriptions">{stripeData?.activeSubscriptions || 0}</p>
                  <div className="flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400">
                    <ArrowUpRight className="w-3 h-3" />
                    <span>Healthy retention</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Monthly Recurring Revenue</p>
                  <p className="text-3xl font-bold text-primary" data-testid="metric-mrr">${stripeData.mrr.toFixed(2)}</p>
                  <div className="flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400">
                    <ArrowUpRight className="w-3 h-3" />
                    <span>↑{mrrGrowth}% MoM growth</span>
                  </div>
                </div>
              </div>

              {stripeData.subscriptions && stripeData.subscriptions.length > 0 && (
                <div className="space-y-3">
                  <h4 className="text-sm font-medium text-muted-foreground">Recent Subscriptions</h4>
                  {stripeData.subscriptions.slice(0, 5).map((sub: any) => (
                    <div key={sub.id} className="flex items-center justify-between p-3 rounded-lg hover-elevate transition-all" data-testid={`subscription-${sub.id}`}>
                      <div className="flex items-center gap-3">
                        <div className={`w-3 h-3 rounded-full ${
                          sub.status === 'active' ? 'bg-emerald-500 shadow-lg shadow-emerald-500/50' : 
                          sub.status === 'canceled' ? 'bg-rose-500' : 'bg-amber-500'
                        }`}></div>
                        <div>
                          <p className="text-sm font-medium">{typeof sub.customerId === 'string' ? sub.customerId.slice(0, 20) : 'Customer'}</p>
                          <p className="text-xs text-muted-foreground capitalize">{sub.status}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold">${sub.amount.toFixed(2)}</p>
                        <p className="text-xs text-muted-foreground">/{sub.interval}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Activity Sections with Enhanced Design */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
          {/* Recent Activity with Avatars */}
          <Card className="glass-strong border-0 shadow-xl overflow-hidden">
            <CardHeader className="border-b border-border/50 bg-gradient-to-r from-primary/5 via-transparent to-transparent p-4 md:p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary/20 to-purple-500/20 flex items-center justify-center">
                    <Activity className="w-5 h-5 text-primary" />
                  </div>
                  <CardTitle className="text-lg md:text-xl font-semibold">Recent Activity</CardTitle>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-4 md:p-6">
              {stats?.recentActivity?.length > 0 ? (
                <div className="space-y-3">
                  {stats.recentActivity.map((activity: any, idx: number) => (
                    <div key={idx} className="flex items-start gap-3 p-3 rounded-lg hover-elevate transition-all group">
                      <div className="relative">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg ${
                          activity.type === 'success' ? 'bg-emerald-500/20' : 
                          activity.type === 'warning' ? 'bg-amber-500/20' : 'bg-primary/20'
                        }`}>
                          {activity.type === 'success' ? '✅' : activity.type === 'warning' ? '⚠️' : '📢'}
                        </div>
                        <div className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-background ${
                          activity.type === 'success' ? 'bg-emerald-500' : 
                          activity.type === 'warning' ? 'bg-amber-500' : 'bg-primary'
                        }`}></div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium group-hover:text-primary transition-colors">{activity.title}</p>
                        <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {activity.time}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-12 text-center">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary/10 to-purple-500/10 flex items-center justify-center mx-auto mb-4">
                    <Activity className="w-8 h-8 text-primary/50" />
                  </div>
                  <p className="text-sm text-muted-foreground">No recent activity</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Upcoming Deadlines with Color Coding & Quick Actions */}
          <Card className="glass-strong border-0 shadow-xl overflow-hidden">
            <CardHeader className="border-b border-border/50 bg-gradient-to-r from-orange-500/5 via-transparent to-transparent p-4 md:p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-orange-500/20 to-pink-500/20 flex items-center justify-center">
                    <Calendar className="w-5 h-5 text-orange-500" />
                  </div>
                  <CardTitle className="text-lg md:text-xl font-semibold">Upcoming Deadlines</CardTitle>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-4 md:p-6">
              {stats?.upcomingDeadlines?.length > 0 ? (
                <div className="space-y-3">
                  {stats.upcomingDeadlines.map((deadline: any, idx: number) => (
                    <div key={idx} className="flex items-center gap-3 p-3 rounded-lg hover-elevate transition-all group">
                      <div className={`w-3 h-3 rounded-full flex-shrink-0 ${
                        deadline.urgent ? 'bg-rose-500 pulse-glow' : 
                        deadline.soon ? 'bg-orange-500' : 'bg-emerald-500'
                      }`}></div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium group-hover:text-primary transition-colors">{deadline.title}</p>
                        <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {deadline.date}
                          {deadline.urgent && (
                            <Badge variant="destructive" className="ml-2 text-xs">Overdue</Badge>
                          )}
                          {deadline.soon && !deadline.urgent && (
                            <Badge variant="secondary" className="ml-2 text-xs bg-orange-500/10 text-orange-600">Due Soon</Badge>
                          )}
                        </p>
                      </div>
                      <Button size="sm" variant="ghost" className="opacity-0 group-hover:opacity-100 transition-opacity">
                        <CheckCircle2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-12 text-center">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-orange-500/10 to-pink-500/10 flex items-center justify-center mx-auto mb-4">
                    <Calendar className="w-8 h-8 text-orange-500/50" />
                  </div>
                  <p className="text-sm text-muted-foreground">No upcoming deadlines</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Floating Action Button (FAB) */}
      <div className="fixed bottom-[80px] md:bottom-6 right-6 z-50">
        <div className="relative group">
          <Button
            size="lg"
            className="w-14 h-14 rounded-full shadow-2xl bg-gradient-to-br from-primary to-purple-600 hover:from-primary/90 hover:to-purple-700 transition-all duration-300 group-hover:scale-110"
          >
            <Plus className="w-6 h-6" />
          </Button>
          
          {/* FAB Menu */}
          <div className="absolute bottom-16 right-0 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 space-y-2">
            <Button
              onClick={() => navigate('/tasks')}
              size="sm"
              variant="secondary"
              className="w-full justify-start gap-2 shadow-lg"
            >
              <ListTodo className="w-4 h-4" />
              New Task
            </Button>
            <Button
              onClick={() => navigate('/clients')}
              size="sm"
              variant="secondary"
              className="w-full justify-start gap-2 shadow-lg"
            >
              <Users className="w-4 h-4" />
              New Client
            </Button>
            <Button
              onClick={() => navigate('/campaigns')}
              size="sm"
              variant="secondary"
              className="w-full justify-start gap-2 shadow-lg"
            >
              <Megaphone className="w-4 h-4" />
              New Campaign
            </Button>
          </div>
        </div>
      </div>
    </div>
  </PullToRefresh>
  );
}

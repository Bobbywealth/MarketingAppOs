import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Megaphone, TrendingUp, DollarSign, ArrowUpRight, ArrowDownRight, Activity, Calendar, CreditCard, CheckCircle2, ListTodo, Eye } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

export default function Dashboard() {
  const { data: stats, isLoading, error, refetch } = useQuery({
    queryKey: ["/api/dashboard/stats"],
    refetchInterval: 30000, // Auto-refresh every 30 seconds
    retry: 3,
  });

  console.log("📊 Dashboard Stats Debug:");
  console.log("  - Is Loading:", isLoading);
  console.log("  - Error:", error);
  console.log("  - Total Clients:", stats?.totalClients);
  console.log("  - Active Campaigns:", stats?.activeCampaigns);
  console.log("  - Full stats object:", JSON.stringify(stats, null, 2));

  const { data: stripeData } = useQuery({
    queryKey: ["/api/stripe/dashboard"],
    retry: false,
    meta: { returnNull: true }, // Don't throw error if Stripe not configured
  });

  // Use Stripe revenue if available, otherwise fall back to internal invoices
  const stripeRevenue = stripeData?.totalRevenue || 0;
  const displayRevenue = stripeRevenue > 0 ? stripeRevenue : (stats?.monthlyRevenue || 0);

  const metrics = [
    {
      title: "Total Clients",
      value: stats?.totalClients || 0,
      change: "+12%",
      changeType: "positive" as const,
      icon: Users,
      gradientFrom: "from-blue-500",
      gradientTo: "to-cyan-500",
      iconBg: "from-blue-500/20 to-cyan-500/20",
    },
    {
      title: "Active Campaigns",
      value: stats?.activeCampaigns || 0,
      change: "+8%",
      changeType: "positive" as const,
      icon: Megaphone,
      gradientFrom: "from-orange-500",
      gradientTo: "to-pink-500",
      iconBg: "from-orange-500/20 to-pink-500/20",
    },
    {
      title: "Pipeline Value",
      value: `$${((stats?.pipelineValue || 0) / 1000).toFixed(1)}k`,
      change: "+23%",
      changeType: "positive" as const,
      icon: TrendingUp,
      gradientFrom: "from-emerald-500",
      gradientTo: "to-teal-500",
      iconBg: "from-emerald-500/20 to-teal-500/20",
    },
    {
      title: "Revenue (MTD)",
      value: `$${(displayRevenue / 1000).toFixed(1)}k`,
      change: "-5%",
      changeType: "negative" as const,
      icon: DollarSign,
      gradientFrom: "from-violet-500",
      gradientTo: "to-purple-500",
      iconBg: "from-violet-500/20 to-purple-500/20",
    },
  ];

  if (isLoading) {
    return (
      <div className="min-h-full gradient-mesh-animated">
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
    <div className="min-h-full gradient-mesh-animated">
      <div className="max-w-7xl mx-auto p-4 md:p-6 lg:p-8 xl:p-12 space-y-6 md:space-y-8">
        {/* Premium Header */}
        <div className="space-y-1 md:space-y-2">
          <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold tracking-tight text-gradient-purple" data-testid="text-page-title">
            Dashboard
          </h1>
          <p className="text-sm md:text-base lg:text-lg text-muted-foreground">Welcome back! Here's your agency overview</p>
        </div>

        {/* Premium Metric Cards with Stagger Animation */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 stagger-fade-in">
          {metrics.map((metric) => (
            <Card 
              key={metric.title} 
              className="group relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 card-hover-lift gradient-border"
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
              <CardContent className="relative p-4 md:p-6 pt-0">
                <div className="flex items-end justify-between gap-2">
                  <div className="text-3xl md:text-4xl font-bold tracking-tight font-mono" data-testid={`metric-${metric.title.toLowerCase().replace(/\s+/g, '-')}`}>
                    {metric.value}
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
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Task Progress Section */}
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
                    <p className="text-xs md:text-sm text-muted-foreground mt-0.5">Daily work completion tracking</p>
                  </div>
                </div>
                <Badge variant="secondary" className="text-xs md:text-sm">
                  {stats.taskMetrics.completionPercentage}% Complete
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="p-4 md:p-6">
              <div className="space-y-6">
                {/* Progress Bar */}
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

                {/* Task Stats Grid - 2 cols on mobile, 4 on desktop */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 pt-2">
                  {/* 📋 To Do */}
                  <div className="flex items-center gap-2 md:gap-3 p-2 md:p-3 rounded-lg bg-amber-500/5 border border-amber-500/10">
                    <div className="w-8 h-8 md:w-10 md:h-10 rounded-lg bg-amber-500/20 flex items-center justify-center text-xl md:text-2xl flex-shrink-0">
                      📋
                    </div>
                    <div className="min-w-0">
                      <p className="text-xl md:text-2xl font-bold text-amber-600 dark:text-amber-400 truncate" data-testid="metric-pending-tasks">
                        {stats.taskMetrics.pending}
                      </p>
                      <p className="text-xs text-muted-foreground">To Do</p>
                    </div>
                  </div>

                  {/* ⚡ In Progress */}
                  <div className="flex items-center gap-2 md:gap-3 p-2 md:p-3 rounded-lg bg-blue-500/5 border border-blue-500/10">
                    <div className="w-8 h-8 md:w-10 md:h-10 rounded-lg bg-blue-500/20 flex items-center justify-center text-xl md:text-2xl flex-shrink-0">
                      ⚡
                    </div>
                    <div className="min-w-0">
                      <p className="text-xl md:text-2xl font-bold text-blue-600 dark:text-blue-400 truncate" data-testid="metric-inprogress-tasks">
                        {stats.taskMetrics.inProgress}
                      </p>
                      <p className="text-xs text-muted-foreground">In Progress</p>
                    </div>
                  </div>

                  {/* 👀 Review */}
                  <div className="flex items-center gap-2 md:gap-3 p-2 md:p-3 rounded-lg bg-violet-500/5 border border-violet-500/10">
                    <div className="w-8 h-8 md:w-10 md:h-10 rounded-lg bg-violet-500/20 flex items-center justify-center text-xl md:text-2xl flex-shrink-0">
                      👀
                    </div>
                    <div className="min-w-0">
                      <p className="text-xl md:text-2xl font-bold text-violet-600 dark:text-violet-400 truncate" data-testid="metric-review-tasks">
                        {stats.taskMetrics.review}
                      </p>
                      <p className="text-xs text-muted-foreground">Review</p>
                    </div>
                  </div>

                  {/* ✅ Completed */}
                  <div className="flex items-center gap-2 md:gap-3 p-2 md:p-3 rounded-lg bg-emerald-500/5 border border-emerald-500/10">
                    <div className="w-8 h-8 md:w-10 md:h-10 rounded-lg bg-emerald-500/20 flex items-center justify-center text-xl md:text-2xl flex-shrink-0">
                      ✅
                    </div>
                    <div className="min-w-0">
                      <p className="text-xl md:text-2xl font-bold text-emerald-600 dark:text-emerald-400 truncate" data-testid="metric-completed-tasks">
                        {stats.taskMetrics.completed}
                      </p>
                      <p className="text-xs text-muted-foreground">Completed</p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Stripe Subscription Metrics */}
        {stripeData && (
          <Card className="glass-strong border-0 shadow-xl overflow-hidden">
            <CardHeader className="border-b border-border/50 bg-gradient-to-r from-primary/5 via-transparent to-transparent">
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
                <Badge variant="secondary" className="text-sm">
                  {stripeData.activeSubscriptions} Active
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Total Subscriptions</p>
                  <p className="text-3xl font-bold" data-testid="metric-total-subscriptions">{stripeData.totalSubscriptions}</p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Active Subscriptions</p>
                  <p className="text-3xl font-bold text-emerald-600 dark:text-emerald-400" data-testid="metric-active-subscriptions">{stripeData.activeSubscriptions}</p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Monthly Recurring Revenue</p>
                  <p className="text-3xl font-bold text-primary" data-testid="metric-mrr">${stripeData.mrr.toFixed(2)}</p>
                </div>
              </div>

              {stripeData.subscriptions && stripeData.subscriptions.length > 0 && (
                <div className="space-y-3">
                  <h4 className="text-sm font-medium text-muted-foreground">Recent Subscriptions</h4>
                  {stripeData.subscriptions.slice(0, 5).map((sub: any) => (
                    <div key={sub.id} className="flex items-center justify-between p-3 rounded-lg hover-elevate transition-all" data-testid={`subscription-${sub.id}`}>
                      <div className="flex items-center gap-3">
                        <div className={`w-2 h-2 rounded-full ${
                          sub.status === 'active' ? 'bg-emerald-500' : 
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

        {/* Activity Sections with Premium Design */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
          {/* Recent Activity */}
          <Card className="glass-strong border-0 shadow-xl overflow-hidden">
            <CardHeader className="border-b border-border/50 bg-gradient-to-r from-primary/5 via-transparent to-transparent p-4 md:p-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary/20 to-purple-500/20 flex items-center justify-center">
                  <Activity className="w-5 h-5 text-primary" />
                </div>
                <CardTitle className="text-lg md:text-xl font-semibold">Recent Activity</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-4 md:p-6">
              {stats?.recentActivity?.length > 0 ? (
                <div className="space-y-4">
                  {stats.recentActivity.map((activity: any, idx: number) => (
                    <div key={idx} className="flex items-start gap-3 p-3 rounded-lg hover-elevate transition-all">
                      <div className={`w-2 h-2 rounded-full mt-2 ${
                        activity.type === 'success' ? 'bg-emerald-500' : 
                        activity.type === 'warning' ? 'bg-amber-500' : 'bg-primary'
                      }`}></div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">{activity.title}</p>
                        <p className="text-xs text-muted-foreground mt-1">{activity.time}</p>
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

          {/* Upcoming Deadlines */}
          <Card className="glass-strong border-0 shadow-xl overflow-hidden">
            <CardHeader className="border-b border-border/50 bg-gradient-to-r from-orange-500/5 via-transparent to-transparent p-4 md:p-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-orange-500/20 to-pink-500/20 flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-orange-500" />
                </div>
                <CardTitle className="text-lg md:text-xl font-semibold">Upcoming Deadlines</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-4 md:p-6">
              {stats?.upcomingDeadlines?.length > 0 ? (
                <div className="space-y-4">
                  {stats.upcomingDeadlines.map((deadline: any, idx: number) => (
                    <div key={idx} className="flex items-start gap-3 p-3 rounded-lg hover-elevate transition-all">
                      <div className={`w-2 h-2 rounded-full mt-2 ${
                        deadline.urgent ? 'bg-rose-500 pulse-glow' : 'bg-amber-500'
                      }`}></div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">{deadline.title}</p>
                        <p className="text-xs text-muted-foreground mt-1">{deadline.date}</p>
                      </div>
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
    </div>
  );
}

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Megaphone, TrendingUp, DollarSign, ArrowUpRight, ArrowDownRight, Activity, Calendar } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

export default function Dashboard() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ["/api/dashboard/stats"],
  });

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
      value: `$${((stats?.monthlyRevenue || 0) / 1000).toFixed(1)}k`,
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
    <div className="min-h-full gradient-mesh">
      <div className="max-w-7xl mx-auto p-6 lg:p-8 xl:p-12 space-y-8">
        {/* Premium Header */}
        <div className="space-y-2">
          <h1 className="text-4xl font-bold tracking-tight text-gradient-purple" data-testid="text-page-title">
            Dashboard
          </h1>
          <p className="text-lg text-muted-foreground">Welcome back! Here's your agency overview</p>
        </div>

        {/* Premium Metric Cards with Stagger Animation */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 stagger-fade-in">
          {metrics.map((metric) => (
            <Card 
              key={metric.title} 
              className="group relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 card-hover-lift gradient-border"
              data-testid={`card-metric-${metric.title.toLowerCase().replace(/\s+/g, '-')}`}
            >
              {/* Gradient Background Overlay */}
              <div className={`absolute inset-0 bg-gradient-to-br ${metric.iconBg} opacity-0 group-hover:opacity-100 transition-opacity duration-300`}></div>
              
              <CardHeader className="relative flex flex-row items-center justify-between gap-2 pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {metric.title}
                </CardTitle>
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${metric.iconBg} flex items-center justify-center shadow-md group-hover:scale-110 transition-transform duration-300`}>
                  <metric.icon className={`w-6 h-6 bg-gradient-to-br ${metric.gradientFrom} ${metric.gradientTo} bg-clip-text text-transparent`} style={{WebkitTextFillColor: 'transparent'}} />
                </div>
              </CardHeader>
              <CardContent className="relative">
                <div className="flex items-end justify-between">
                  <div className="text-4xl font-bold tracking-tight font-mono" data-testid={`metric-${metric.title.toLowerCase().replace(/\s+/g, '-')}`}>
                    {metric.value}
                  </div>
                  <div className={`flex items-center gap-0.5 text-sm font-semibold px-2.5 py-1 rounded-full ${
                    metric.changeType === 'positive' 
                      ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' 
                      : 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
                  }`}>
                    {metric.changeType === 'positive' ? (
                      <ArrowUpRight className="w-4 h-4" />
                    ) : (
                      <ArrowDownRight className="w-4 h-4" />
                    )}
                    <span>{metric.change}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Activity Sections with Premium Design */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Activity */}
          <Card className="glass-strong border-0 shadow-xl overflow-hidden">
            <CardHeader className="border-b border-border/50 bg-gradient-to-r from-primary/5 via-transparent to-transparent">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary/20 to-purple-500/20 flex items-center justify-center">
                  <Activity className="w-5 h-5 text-primary" />
                </div>
                <CardTitle className="text-xl font-semibold">Recent Activity</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-6">
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
            <CardHeader className="border-b border-border/50 bg-gradient-to-r from-orange-500/5 via-transparent to-transparent">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-orange-500/20 to-pink-500/20 flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-orange-500" />
                </div>
                <CardTitle className="text-xl font-semibold">Upcoming Deadlines</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-6">
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

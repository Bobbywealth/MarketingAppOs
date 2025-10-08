import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Megaphone, TrendingUp, DollarSign, ArrowUpRight, ArrowDownRight } from "lucide-react";
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
      color: "text-chart-1",
    },
    {
      title: "Active Campaigns",
      value: stats?.activeCampaigns || 0,
      change: "+8%",
      changeType: "positive" as const,
      icon: Megaphone,
      color: "text-chart-2",
    },
    {
      title: "Pipeline Value",
      value: `$${((stats?.pipelineValue || 0) / 1000).toFixed(1)}k`,
      change: "+23%",
      changeType: "positive" as const,
      icon: TrendingUp,
      color: "text-chart-3",
    },
    {
      title: "Revenue (MTD)",
      value: `$${((stats?.monthlyRevenue || 0) / 1000).toFixed(1)}k`,
      change: "-5%",
      changeType: "negative" as const,
      icon: DollarSign,
      color: "text-chart-4",
    },
  ];

  if (isLoading) {
    return (
      <div className="p-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <div className="h-4 bg-muted rounded w-24 animate-pulse"></div>
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-muted rounded w-16 animate-pulse"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-8">
      <div>
        <h1 className="text-2xl font-semibold mb-2" data-testid="text-page-title">Dashboard</h1>
        <p className="text-muted-foreground">Welcome back! Here's your agency overview</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {metrics.map((metric) => (
          <Card key={metric.title} className="hover-elevate transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {metric.title}
              </CardTitle>
              <metric.icon className={`w-4 h-4 ${metric.color}`} />
            </CardHeader>
            <CardContent>
              <div className="flex items-end justify-between">
                <div className="text-3xl font-semibold" data-testid={`metric-${metric.title.toLowerCase().replace(/\s+/g, '-')}`}>
                  {metric.value}
                </div>
                <div className={`flex items-center text-sm ${metric.changeType === 'positive' ? 'text-chart-3' : 'text-destructive'}`}>
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats?.recentActivity?.map((activity: any, index: number) => (
                <div key={index} className="flex items-start gap-3 pb-3 border-b last:border-0">
                  <div className="w-2 h-2 rounded-full bg-primary mt-2"></div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{activity.title}</p>
                    <p className="text-xs text-muted-foreground">{activity.time}</p>
                  </div>
                </div>
              )) || (
                <p className="text-sm text-muted-foreground">No recent activity</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Upcoming Deadlines</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats?.upcomingDeadlines?.map((deadline: any, index: number) => (
                <div key={index} className="flex items-start justify-between gap-3 pb-3 border-b last:border-0">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{deadline.task}</p>
                    <p className="text-xs text-muted-foreground">{deadline.client}</p>
                  </div>
                  <div className="text-xs text-muted-foreground whitespace-nowrap">
                    {deadline.dueDate}
                  </div>
                </div>
              )) || (
                <p className="text-sm text-muted-foreground">No upcoming deadlines</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

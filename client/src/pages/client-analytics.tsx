import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown, 
  Download, 
  Target, 
  Calendar, 
  Users, 
  Eye, 
  Heart, 
  Share2, 
  DollarSign, 
  MousePointer,
  RefreshCw,
  Clock,
  AlertCircle
} from "lucide-react";
import { formatDistanceToNow, format, subDays } from "date-fns";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { SocialAccountManager } from "@/components/SocialAccountManager";

export default function ClientAnalytics() {
  const { data: user } = useQuery<any>({ queryKey: ["/api/user"] });
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Fetch social accounts
  const { data: socialAccounts = [] } = useQuery<any[]>({
    queryKey: ["/api/social/accounts"],
    enabled: !!user,
  });

  // Fetch metrics for the first active account if exists
  const activeAccountId = socialAccounts.find(a => a.status === "active")?.id;
  const { data: metricsData, isLoading: metricsLoading } = useQuery<any>({
    queryKey: ["/api/social/metrics", { accountId: activeAccountId }],
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/social/metrics?accountId=${activeAccountId}`);
      return res.json();
    },
    enabled: !!activeAccountId,
  });

  const refreshMutation = useMutation({
    mutationFn: async (accountId: string) => {
      const res = await apiRequest("POST", `/api/social/accounts/${accountId}/refresh`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/social/accounts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/social/metrics", { accountId: activeAccountId }] });
      toast({ title: "Refresh successful", description: "Social stats have been updated." });
    },
    onError: (error: any) => {
      toast({ title: "Refresh failed", description: error.message, variant: "destructive" });
    }
  });

  // Fetch generic analytics data
  const { data: analytics = [] } = useQuery<any[]>({
    queryKey: ["/api/analytics"],
    enabled: !!user,
  });

  const { data: goals = [] } = useQuery<any[]>({
    queryKey: ["/api/goals"],
    enabled: !!user,
  });

  // Filter analytics for this client
  const clientAnalytics = analytics.filter((metric: any) => 
    metric.clientId === user?.clientId
  );

  // Latest snapshot metrics from all accounts
  const latestMetrics = socialAccounts.reduce((acc: any, account: any) => {
    // We'd ideally need a way to get the latest snapshot per account easily
    // For now we assume the most recent refresh updated the account fields or we'd fetch snapshots
    return acc;
  }, {});

  const totalFollowers = socialAccounts.reduce((sum, acc) => sum + (acc.lastFollowers || 0), 0); // Need to add these fields or fetch snapshots

  // Let's use the first account's latest snapshot for the main display if available
  const currentSnapshot = metricsData?.snapshots?.[0];

  const getTrendIcon = (trend: string | number) => {
    const isPositive = typeof trend === "string" ? trend.startsWith('+') : trend > 0;
    return isPositive ? 
      <TrendingUp className="w-4 h-4 text-green-500" /> : 
      <TrendingDown className="w-4 h-4 text-red-500" />;
  };

  const getTrendColor = (trend: string | number) => {
    const isPositive = typeof trend === "string" ? trend.startsWith('+') : trend > 0;
    return isPositive ? 'text-green-600' : 'text-red-600';
  };

  return (
    <div className="min-h-full gradient-mesh">
      <div className="max-w-7xl mx-auto p-6 lg:p-8 xl:p-12 space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="space-y-2">
            <h1 className="text-4xl font-bold tracking-tight text-gradient-purple">
              Analytics & Reports
            </h1>
            <p className="text-lg text-muted-foreground">
              Track your social media performance and growth
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm">
              <Download className="w-4 h-4 mr-2" />
              Export Report
            </Button>
          </div>
        </div>

        {/* Key Metrics Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="border-0 shadow-lg">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                  <Users className="w-5 h-5 text-blue-500" />
                </div>
                <div>
                  <CardTitle className="text-lg">Followers</CardTitle>
                  <p className="text-2xl font-bold mt-1">
                    {currentSnapshot?.followers?.toLocaleString() || "—"}
                  </p>
                </div>
              </div>
            </CardHeader>
          </Card>

          <Card className="border-0 shadow-lg">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                  <Heart className="w-5 h-5 text-green-500" />
                </div>
                <div>
                  <CardTitle className="text-lg">Likes / Hearts</CardTitle>
                  <p className="text-2xl font-bold mt-1">
                    {currentSnapshot?.likesCount?.toLocaleString() || "—"}
                  </p>
                </div>
              </div>
            </CardHeader>
          </Card>

          <Card className="border-0 shadow-lg">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
                  <Eye className="w-5 h-5 text-purple-500" />
                </div>
                <div>
                  <CardTitle className="text-lg">Total Views</CardTitle>
                  <p className="text-2xl font-bold mt-1">
                    {currentSnapshot?.viewsCount?.toLocaleString() || "—"}
                  </p>
                </div>
              </div>
            </CardHeader>
          </Card>

          <Card className="border-0 shadow-lg">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-orange-500/10 flex items-center justify-center">
                  <BarChart3 className="w-5 h-5 text-orange-500" />
                </div>
                <div>
                  <CardTitle className="text-lg">Posts</CardTitle>
                  <p className="text-2xl font-bold mt-1">
                    {currentSnapshot?.postsCount?.toLocaleString() || "—"}
                  </p>
                </div>
              </div>
            </CardHeader>
          </Card>
        </div>

        {/* Social Accounts Management Section */}
        <section className="space-y-6">
          <div className="flex items-center gap-2">
            <Share2 className="w-5 h-5 text-primary" />
            <h2 className="text-2xl font-bold">Social Connections</h2>
          </div>
          <SocialAccountManager />
        </section>

        {/* Detailed Performance Charts */}
        <Card className="glass-strong border-0 shadow-xl">
          <CardHeader className="border-b border-border/50">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-xl">Growth Trends</CardTitle>
                <CardDescription>Follower growth over time from your snapshots</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            {metricsData?.snapshots?.length > 1 ? (
              <div className="h-[300px] flex items-end gap-2 px-2">
                {/* Simplified bar chart using snapshots */}
                {metricsData.snapshots.slice().reverse().map((s: any, i: number) => {
                  const max = Math.max(...metricsData.snapshots.map((ss: any) => ss.followers || 0));
                  const height = max > 0 ? ((s.followers || 0) / max) * 100 : 0;
                  return (
                    <div key={s.id} className="flex-1 flex flex-col items-center gap-2 group">
                      <div 
                        className="w-full bg-primary/20 hover:bg-primary/40 rounded-t transition-all relative"
                        style={{ height: `${height}%` }}
                      >
                        <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-popover text-popover-foreground text-[10px] px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity border whitespace-nowrap z-10">
                          {s.followers?.toLocaleString()}
                        </div>
                      </div>
                      <span className="text-[10px] text-muted-foreground rotate-45 origin-left whitespace-nowrap">
                        {format(new Date(s.capturedAt), "MMM d")}
                      </span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="h-[300px] flex flex-col items-center justify-center text-center text-muted-foreground bg-muted/10 rounded-lg border-2 border-dashed">
                <BarChart3 className="w-12 h-12 mb-3 opacity-20" />
                <p>Not enough snapshot data to show trends.</p>
                <p className="text-sm">Click "Update Now" periodically to build your growth history.</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Platform Insights */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Recent Activity */}
          <Card className="glass-strong border-0 shadow-xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5" />
                Recent Snapshots
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {metricsData?.snapshots?.slice(0, 5).map((s: any) => (
                  <div key={s.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                    <div className="flex flex-col">
                      <span className="text-sm font-medium">{format(new Date(s.capturedAt), "MMM d, yyyy h:mm a")}</span>
                      <span className="text-xs text-muted-foreground">Snapshot taken</span>
                    </div>
                    <div className="text-right">
                      <span className="font-bold">{s.followers?.toLocaleString()}</span>
                      <p className="text-[10px] text-muted-foreground">Followers</p>
                    </div>
                  </div>
                ))}
                {!metricsData?.snapshots?.length && (
                  <p className="text-sm text-center text-muted-foreground py-8">No snapshots available.</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Goals Placeholder */}
          <Card className="glass-strong border-0 shadow-xl">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Target className="w-5 h-5" />
                Active Goals
              </CardTitle>
              <Button variant="ghost" size="sm">Set New</Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-6 py-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm font-medium">
                    <span>Follower Target (10k)</span>
                    <span>75%</span>
                  </div>
                  <Progress value={75} className="h-2" />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm font-medium">
                    <span>Monthly Reach Goal</span>
                    <span>42%</span>
                  </div>
                  <Progress value={42} className="h-2" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

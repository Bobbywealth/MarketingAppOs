import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useQuery } from "@tanstack/react-query";
import { BarChart3, TrendingUp, TrendingDown, Download, Target, Calendar, Users, Eye, Heart, Share2, DollarSign, MousePointer } from "lucide-react";
import { formatDistanceToNow, format, subDays, startOfMonth, endOfMonth } from "date-fns";

export default function ClientAnalytics() {
  const { data: user } = useQuery({ queryKey: ["/api/user"] });
  
  // Fetch analytics data
  const { data: analytics = [] } = useQuery({
    queryKey: ["/api/analytics"],
    enabled: !!user,
  });

  const { data: goals = [] } = useQuery({
    queryKey: ["/api/goals"],
    enabled: !!user,
  });

  // Fetch Instagram analytics
  const { data: instagramData, isLoading: instagramLoading } = useQuery({
    queryKey: ["/api/instagram/analytics"],
    enabled: !!user?.clientId,
    refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes
  });

  // Fetch Instagram posts
  const { data: instagramPosts } = useQuery({
    queryKey: ["/api/instagram/posts"],
    enabled: !!user?.clientId,
  });

  // Filter analytics for this client
  const clientAnalytics = analytics.filter((metric: any) => 
    metric.clientId === user?.clientId
  );

  // Calculate totals and trends
  const totalFollowers = clientAnalytics.reduce((sum: number, metric: any) => 
    sum + (metric.metrics?.followers || 0), 0
  );

  const totalEngagement = clientAnalytics.reduce((sum: number, metric: any) => 
    sum + (metric.metrics?.engagement_rate || 0), 0
  ) / Math.max(clientAnalytics.length, 1);

  const totalReach = clientAnalytics.reduce((sum: number, metric: any) => 
    sum + (metric.metrics?.reach || 0), 0
  );

  const totalClicks = clientAnalytics.reduce((sum: number, metric: any) => 
    sum + (metric.metrics?.clicks || 0), 0
  );

  const totalSpend = clientAnalytics.reduce((sum: number, metric: any) => 
    sum + (metric.metrics?.spend || 0), 0
  );

  const totalConversions = clientAnalytics.reduce((sum: number, metric: any) => 
    sum + (metric.metrics?.conversions || 0), 0
  );

  // Calculate ROI
  const roi = totalSpend > 0 ? ((totalConversions * 100) / totalSpend) : 0;

  // Get recent performance (last 30 days)
  const thirtyDaysAgo = subDays(new Date(), 30);
  const recentMetrics = clientAnalytics.filter((metric: any) => 
    new Date(metric.date) >= thirtyDaysAgo
  );

  // Platform breakdown with real Instagram data
  const platformStats = {
    instagram: {
      followers: instagramData?.metrics?.followers || 0,
      engagement: instagramData?.metrics?.engagement_rate || 0,
      reach: instagramData?.metrics?.reach || 0,
      posts: instagramData?.metrics?.posts || 0,
      trend: "+12%", // TODO: Calculate real trend
      connected: instagramData?.connected || false,
      username: instagramData?.username || null,
      lastUpdated: instagramData?.lastUpdated || null,
    },
    facebook: {
      followers: 8932,
      engagement: 3.2,
      reach: 28500,
      posts: 8,
      trend: "+8%",
      connected: false,
    },
    tiktok: {
      followers: 23567,
      engagement: 6.5,
      reach: 125000,
      posts: 15,
      trend: "+23%",
      connected: false,
    }
  };

  const getTrendIcon = (trend: string) => {
    return trend.startsWith('+') ? 
      <TrendingUp className="w-4 h-4 text-green-500" /> : 
      <TrendingDown className="w-4 h-4 text-red-500" />;
  };

  const getTrendColor = (trend: string) => {
    return trend.startsWith('+') ? 'text-green-600' : 'text-red-600';
  };

  return (
    <div className="min-h-full gradient-mesh">
      <div className="max-w-7xl mx-auto p-6 lg:p-8 xl:p-12 space-y-8">
        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-4xl font-bold tracking-tight text-gradient-purple">
            Analytics & Reports
          </h1>
          <p className="text-lg text-muted-foreground">
            Track your marketing performance and ROI
          </p>
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
                  <CardTitle className="text-lg">Total Followers</CardTitle>
                  <p className="text-2xl font-bold mt-1">{totalFollowers.toLocaleString()}</p>
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
                  <CardTitle className="text-lg">Avg Engagement</CardTitle>
                  <p className="text-2xl font-bold mt-1">{totalEngagement.toFixed(1)}%</p>
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
                  <CardTitle className="text-lg">Total Reach</CardTitle>
                  <p className="text-2xl font-bold mt-1">{totalReach.toLocaleString()}</p>
                </div>
              </div>
            </CardHeader>
          </Card>

          <Card className="border-0 shadow-lg">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-orange-500/10 flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-orange-500" />
                </div>
                <div>
                  <CardTitle className="text-lg">ROI</CardTitle>
                  <p className="text-2xl font-bold mt-1">{roi.toFixed(1)}%</p>
                </div>
              </div>
            </CardHeader>
          </Card>
        </div>

        {/* Platform Performance */}
        <Card className="glass-strong border-0 shadow-xl">
          <CardHeader className="border-b border-border/50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center">
                  <BarChart3 className="w-5 h-5 text-blue-500" />
                </div>
                <div>
                  <CardTitle className="text-xl">Platform Performance</CardTitle>
                  <CardDescription>Your social media metrics by platform</CardDescription>
                </div>
              </div>
              <Button variant="outline" size="sm">
                <Download className="w-4 h-4 mr-2" />
                Export Report
              </Button>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Instagram */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-pink-500 to-orange-500 flex items-center justify-center shadow-lg">
                      <span className="text-2xl">📷</span>
                    </div>
                    <div>
                      <h3 className="font-semibold flex items-center gap-2">
                        Instagram
                        {platformStats.instagram.connected ? (
                          <Badge className="bg-green-500/10 text-green-600 text-xs">Connected</Badge>
                        ) : (
                          <Badge className="bg-gray-500/10 text-gray-600 text-xs">Not Connected</Badge>
                        )}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {platformStats.instagram.username ? `@${platformStats.instagram.username}` : `${platformStats.instagram.posts} posts`}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    {getTrendIcon(platformStats.instagram.trend)}
                    <span className={`text-sm font-medium ${getTrendColor(platformStats.instagram.trend)}`}>
                      {platformStats.instagram.trend}
                    </span>
                  </div>
                </div>
                
                {platformStats.instagram.connected ? (
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Followers</span>
                      <span className="font-semibold">{platformStats.instagram.followers.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Engagement</span>
                      <span className="font-semibold">{platformStats.instagram.engagement.toFixed(1)}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Reach</span>
                      <span className="font-semibold">{platformStats.instagram.reach.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Posts</span>
                      <span className="font-semibold">{platformStats.instagram.posts}</span>
                    </div>
                    {platformStats.instagram.lastUpdated && (
                      <div className="text-xs text-muted-foreground pt-2 border-t">
                        Last updated: {format(new Date(platformStats.instagram.lastUpdated), 'MMM d, h:mm a')}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="text-center py-4">
                      <p className="text-sm text-muted-foreground mb-3">
                        Connect your Instagram account to see real analytics
                      </p>
                      <Button 
                        size="sm" 
                        className="bg-gradient-to-r from-pink-500 to-orange-500 hover:from-pink-600 hover:to-orange-600"
                        onClick={() => window.location.href = '/api/instagram/auth'}
                      >
                        📷 Connect Instagram
                      </Button>
                    </div>
                  </div>
                )}
              </div>

              {/* Facebook */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-600 to-blue-400 flex items-center justify-center shadow-lg">
                      <span className="text-2xl">📘</span>
                    </div>
                    <div>
                      <h3 className="font-semibold">Facebook</h3>
                      <p className="text-sm text-muted-foreground">{platformStats.facebook.posts} posts</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    {getTrendIcon(platformStats.facebook.trend)}
                    <span className={`text-sm font-medium ${getTrendColor(platformStats.facebook.trend)}`}>
                      {platformStats.facebook.trend}
                    </span>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Followers</span>
                    <span className="font-semibold">{platformStats.facebook.followers.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Engagement</span>
                    <span className="font-semibold">{platformStats.facebook.engagement}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Reach</span>
                    <span className="font-semibold">{platformStats.facebook.reach.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* TikTok */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-black to-cyan-500 flex items-center justify-center shadow-lg">
                      <span className="text-2xl">🎵</span>
                    </div>
                    <div>
                      <h3 className="font-semibold">TikTok</h3>
                      <p className="text-sm text-muted-foreground">{platformStats.tiktok.posts} posts</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    {getTrendIcon(platformStats.tiktok.trend)}
                    <span className={`text-sm font-medium ${getTrendColor(platformStats.tiktok.trend)}`}>
                      {platformStats.tiktok.trend}
                    </span>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Followers</span>
                    <span className="font-semibold">{platformStats.tiktok.followers.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Engagement</span>
                    <span className="font-semibold">{platformStats.tiktok.engagement}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Views</span>
                    <span className="font-semibold">{platformStats.tiktok.reach.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Goals & Objectives */}
        <Card className="glass-strong border-0 shadow-xl">
          <CardHeader className="border-b border-border/50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-green-500/20 to-emerald-500/20 flex items-center justify-center">
                  <Target className="w-5 h-5 text-green-500" />
                </div>
                <div>
                  <CardTitle className="text-xl">Goals & Objectives</CardTitle>
                  <CardDescription>Track your marketing goals and progress</CardDescription>
                </div>
              </div>
              <Button variant="outline" size="sm">
                <Target className="w-4 h-4 mr-2" />
                Set New Goal
              </Button>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            {goals.length === 0 ? (
              <div className="text-center py-8">
                <Target className="w-12 h-12 mx-auto mb-3 text-muted-foreground opacity-50" />
                <h3 className="text-lg font-semibold mb-2">No goals set yet</h3>
                <p className="text-muted-foreground mb-4">
                  Set your first marketing goal to start tracking progress.
                </p>
                <Button>
                  <Target className="w-4 h-4 mr-2" />
                  Create Your First Goal
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {goals.slice(0, 3).map((goal: any) => (
                  <div key={goal.id} className="p-4 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h4 className="font-semibold">{goal.title}</h4>
                        <p className="text-sm text-muted-foreground">{goal.description}</p>
                      </div>
                      <Badge className={
                        goal.status === 'completed' ? 'bg-green-500/10 text-green-600' :
                        goal.status === 'in_progress' ? 'bg-blue-500/10 text-blue-600' :
                        'bg-gray-500/10 text-gray-600'
                      }>
                        {goal.status}
                      </Badge>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Progress</span>
                        <span>{goal.progress || 0}%</span>
                      </div>
                      <Progress value={goal.progress || 0} className="h-2" />
                    </div>
                    <div className="flex items-center justify-between mt-3 text-xs text-muted-foreground">
                      <span>Target: {goal.targetDate ? format(new Date(goal.targetDate), 'MMM d, yyyy') : 'No deadline'}</span>
                      <span>Created {formatDistanceToNow(new Date(goal.createdAt), { addSuffix: true })}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Performance */}
        <Card className="glass-strong border-0 shadow-xl">
          <CardHeader className="border-b border-border/50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-purple-500" />
                </div>
                <div>
                  <CardTitle className="text-xl">Recent Performance (30 Days)</CardTitle>
                  <CardDescription>Your latest marketing metrics and trends</CardDescription>
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm">
                  <Download className="w-4 h-4 mr-2" />
                  Export PDF
                </Button>
                <Button variant="outline" size="sm">
                  <Download className="w-4 h-4 mr-2" />
                  Export Excel
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="w-12 h-12 rounded-lg bg-blue-500/10 flex items-center justify-center mx-auto mb-3">
                  <MousePointer className="w-6 h-6 text-blue-500" />
                </div>
                <p className="text-2xl font-bold">{totalClicks.toLocaleString()}</p>
                <p className="text-sm text-muted-foreground">Total Clicks</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 rounded-lg bg-green-500/10 flex items-center justify-center mx-auto mb-3">
                  <DollarSign className="w-6 h-6 text-green-500" />
                </div>
                <p className="text-2xl font-bold">${totalSpend.toLocaleString()}</p>
                <p className="text-sm text-muted-foreground">Total Spend</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 rounded-lg bg-purple-500/10 flex items-center justify-center mx-auto mb-3">
                  <TrendingUp className="w-6 h-6 text-purple-500" />
                </div>
                <p className="text-2xl font-bold">{totalConversions}</p>
                <p className="text-sm text-muted-foreground">Conversions</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 rounded-lg bg-orange-500/10 flex items-center justify-center mx-auto mb-3">
                  <Share2 className="w-6 h-6 text-orange-500" />
                </div>
                <p className="text-2xl font-bold">{roi.toFixed(1)}%</p>
                <p className="text-sm text-muted-foreground">ROI</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

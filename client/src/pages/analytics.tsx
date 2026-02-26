import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  TrendingUp,
  TrendingDown,
  Users,
  Eye,
  MousePointer,
  DollarSign,
  Target,
  BarChart3,
  LineChart,
  Clock,
} from "lucide-react";
import type { Client, AnalyticsMetric } from "@shared/schema";
import { format } from "date-fns";

export default function Analytics() {
  const [selectedClient, setSelectedClient] = useState<string>("all");
  const [selectedPlatform, setSelectedPlatform] = useState<string>("all");

  const { data: clients } = useQuery<Client[]>({
    queryKey: ["/api/clients"],
  });

  const metricsUrl = selectedClient !== "all" 
    ? `/api/analytics/metrics?clientId=${selectedClient}` 
    : "/api/analytics/metrics";

  const { data: metrics, isLoading } = useQuery<AnalyticsMetric[]>({
    queryKey: [metricsUrl],
  });

  // Fetch website analytics
  const { data: websiteStats } = useQuery<any>({
    queryKey: ["/api/analytics/website"],
  });

  const getFilteredMetrics = () => {
    if (!metrics) return [];
    if (selectedPlatform === "all") return metrics;
    return metrics.filter((m) => m.platform === selectedPlatform);
  };

  const filteredMetrics = getFilteredMetrics();

  const getSocialMetrics = () => {
    const socialData = filteredMetrics.filter((m) => m.metricType === "social");
    if (socialData.length === 0) return null;

    const latestMetric = socialData[0];
    const metrics = latestMetric?.metrics as any;

    return {
      followers: metrics?.followers || 0,
      engagementRate: metrics?.engagement_rate || 0,
      reach: metrics?.reach || 0,
      clicks: metrics?.clicks || 0,
      ctr: metrics?.ctr || 0,
    };
  };

  const getAdMetrics = () => {
    const adData = filteredMetrics.filter((m) => m.metricType === "ads");
    if (adData.length === 0) return null;

    const totalSpend = adData.reduce((sum, m) => {
      const metrics = m.metrics as any;
      return sum + (metrics?.spend || 0);
    }, 0);

    const totalRevenue = adData.reduce((sum, m) => {
      const metrics = m.metrics as any;
      return sum + (metrics?.revenue || 0);
    }, 0);

    const totalConversions = adData.reduce((sum, m) => {
      const metrics = m.metrics as any;
      return sum + (metrics?.conversions || 0);
    }, 0);

    const avgCTR = adData.length > 0
      ? adData.reduce((sum, m) => {
          const metrics = m.metrics as any;
          return sum + (metrics?.ctr || 0);
        }, 0) / adData.length
      : 0;

    const roas = totalSpend > 0 ? totalRevenue / totalSpend : 0;

    return {
      spend: totalSpend,
      revenue: totalRevenue,
      roas,
      conversions: totalConversions,
      ctr: avgCTR,
    };
  };

  const getWebsiteMetrics = () => {
    const websiteData = filteredMetrics.filter((m) => m.metricType === "website");
    if (websiteData.length === 0) return null;

    const latestMetric = websiteData[0];
    const metrics = latestMetric?.metrics as any;

    return {
      pageViews: metrics?.page_views || 0,
      bounceRate: metrics?.bounce_rate || 0,
      avgSessionDuration: metrics?.avg_session_duration || 0,
      conversionRate: metrics?.conversion_rate || 0,
    };
  };

  const socialMetrics = getSocialMetrics();
  const adMetrics = getAdMetrics();
  const websiteMetrics = getWebsiteMetrics();

  if (isLoading) {
    return (
      <div className="min-h-full gradient-mesh">
        <div className="p-6 lg:p-8">
          <div className="space-y-4">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="border-0 shadow-lg">
                <CardHeader>
                  <div className="h-6 bg-muted/50 rounded w-48 shimmer"></div>
                </CardHeader>
                <CardContent>
                  <div className="h-20 bg-muted/50 rounded shimmer"></div>
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
      <div className="p-6 lg:p-8 xl:p-12 space-y-8">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="space-y-2">
            <h1 className="text-4xl font-bold tracking-tight text-gradient-purple" data-testid="text-page-title">
              Analytics & Reports
            </h1>
            <p className="text-lg text-muted-foreground">Track performance across all channels</p>
          </div>
          <div className="flex gap-3">
            <Select value={selectedClient} onValueChange={setSelectedClient}>
              <SelectTrigger className="w-48" data-testid="select-client">
                <SelectValue placeholder="All Clients" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Clients</SelectItem>
                {clients?.map((client) => (
                  <SelectItem key={client.id} value={client.id}>
                    {client.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={selectedPlatform} onValueChange={setSelectedPlatform}>
              <SelectTrigger className="w-48" data-testid="select-platform">
                <SelectValue placeholder="All Platforms" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Platforms</SelectItem>
                <SelectItem value="facebook">Facebook</SelectItem>
                <SelectItem value="instagram">Instagram</SelectItem>
                <SelectItem value="google_ads">Google Ads</SelectItem>
                <SelectItem value="google_analytics">Google Analytics</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <Tabs defaultValue="social" className="space-y-6">
          <TabsList className="grid w-full max-w-md grid-cols-3">
            <TabsTrigger value="social" data-testid="tab-social">Social Media</TabsTrigger>
            <TabsTrigger value="ads" data-testid="tab-ads">Advertising</TabsTrigger>
            <TabsTrigger value="website" data-testid="tab-website">Website</TabsTrigger>
          </TabsList>

          <TabsContent value="social" className="space-y-6">
            {!socialMetrics ? (
              <Card className="border-0 shadow-lg">
                <CardContent className="p-12 text-center text-muted-foreground">
                  <BarChart3 className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No social media metrics available</p>
                  <p className="text-sm mt-2">Import data from your social media platforms to see insights</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                <Card className="border-0 shadow-lg" data-testid="card-followers">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Followers</CardTitle>
                    <Users className="w-4 h-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold" data-testid="text-followers">
                      {socialMetrics.followers.toLocaleString()}
                    </div>
                    <div className="flex items-center gap-1 mt-2 text-sm text-emerald-600">
                      <TrendingUp className="w-3 h-3" />
                      <span>Growth tracking</span>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-0 shadow-lg" data-testid="card-engagement">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Engagement Rate</CardTitle>
                    <Target className="w-4 h-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold" data-testid="text-engagement-rate">
                      {socialMetrics.engagementRate.toFixed(2)}%
                    </div>
                    <p className="text-sm text-muted-foreground mt-2">Avg. across all platforms</p>
                  </CardContent>
                </Card>

                <Card className="border-0 shadow-lg" data-testid="card-reach">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Reach</CardTitle>
                    <Eye className="w-4 h-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold" data-testid="text-reach">
                      {socialMetrics.reach.toLocaleString()}
                    </div>
                    <p className="text-sm text-muted-foreground mt-2">Total impressions</p>
                  </CardContent>
                </Card>

                <Card className="border-0 shadow-lg" data-testid="card-clicks">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Clicks</CardTitle>
                    <MousePointer className="w-4 h-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold" data-testid="text-clicks">
                      {socialMetrics.clicks.toLocaleString()}
                    </div>
                    <p className="text-sm text-muted-foreground mt-2">Link clicks</p>
                  </CardContent>
                </Card>

                <Card className="border-0 shadow-lg" data-testid="card-ctr">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Click-Through Rate</CardTitle>
                    <LineChart className="w-4 h-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold" data-testid="text-ctr">
                      {socialMetrics.ctr.toFixed(2)}%
                    </div>
                    <p className="text-sm text-muted-foreground mt-2">From impressions to clicks</p>
                  </CardContent>
                </Card>
              </div>
            )}
          </TabsContent>

          <TabsContent value="ads" className="space-y-6">
            {!adMetrics ? (
              <Card className="border-0 shadow-lg">
                <CardContent className="p-12 text-center text-muted-foreground">
                  <DollarSign className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No advertising metrics available</p>
                  <p className="text-sm mt-2">Connect your ad platforms to track ROAS and performance</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                <Card className="border-0 shadow-lg" data-testid="card-spend">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Spend</CardTitle>
                    <DollarSign className="w-4 h-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold" data-testid="text-spend">
                      ${adMetrics.spend.toLocaleString()}
                    </div>
                    <p className="text-sm text-muted-foreground mt-2">All platforms</p>
                  </CardContent>
                </Card>

                <Card className="border-0 shadow-lg" data-testid="card-roas">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">ROAS</CardTitle>
                    <TrendingUp className="w-4 h-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold" data-testid="text-roas">
                      {adMetrics.roas.toFixed(2)}x
                    </div>
                    <p className="text-sm text-muted-foreground mt-2">Return on ad spend</p>
                  </CardContent>
                </Card>

                <Card className="border-0 shadow-lg" data-testid="card-conversions">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Conversions</CardTitle>
                    <Target className="w-4 h-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold" data-testid="text-conversions">
                      {adMetrics.conversions.toLocaleString()}
                    </div>
                    <p className="text-sm text-muted-foreground mt-2">Total conversions</p>
                  </CardContent>
                </Card>

                <Card className="border-0 shadow-lg" data-testid="card-ad-ctr">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Ad CTR</CardTitle>
                    <LineChart className="w-4 h-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold" data-testid="text-ad-ctr">
                      {adMetrics.ctr.toFixed(2)}%
                    </div>
                    <p className="text-sm text-muted-foreground mt-2">Click-through rate</p>
                  </CardContent>
                </Card>

                <Card className="border-0 shadow-lg" data-testid="card-revenue">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Revenue</CardTitle>
                    <DollarSign className="w-4 h-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold" data-testid="text-revenue">
                      ${adMetrics.revenue.toLocaleString()}
                    </div>
                    <p className="text-sm text-muted-foreground mt-2">Total revenue generated</p>
                  </CardContent>
                </Card>
              </div>
            )}
          </TabsContent>

          <TabsContent value="website" className="space-y-6">
            {!websiteStats ? (
              <Card className="border-0 shadow-lg">
                <CardContent className="p-12 text-center text-muted-foreground">
                  <BarChart3 className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Loading website analytics...</p>
                </CardContent>
              </Card>
            ) : (
              <>
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                  <Card className="border-0 shadow-lg" data-testid="card-page-views">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Page Views</CardTitle>
                      <Eye className="w-4 h-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold" data-testid="text-page-views">
                        {websiteStats.pageViews.toLocaleString()}
                      </div>
                      <p className="text-sm text-muted-foreground mt-2">Total visits</p>
                    </CardContent>
                  </Card>

                  <Card className="border-0 shadow-lg" data-testid="card-unique-visitors">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Unique Visitors</CardTitle>
                      <Users className="w-4 h-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold" data-testid="text-unique-visitors">
                        {websiteStats.uniqueVisitors.toLocaleString()}
                      </div>
                      <p className="text-sm text-muted-foreground mt-2">Individual users</p>
                    </CardContent>
                  </Card>

                  <Card className="border-0 shadow-lg" data-testid="card-bounce-rate">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Bounce Rate</CardTitle>
                      <TrendingDown className="w-4 h-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold" data-testid="text-bounce-rate">
                        {websiteStats.bounceRate.toFixed(1)}%
                      </div>
                      <p className="text-sm text-muted-foreground mt-2">Single-page sessions</p>
                    </CardContent>
                  </Card>

                  <Card className="border-0 shadow-lg" data-testid="card-session-duration">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Avg. Session</CardTitle>
                      <Clock className="w-4 h-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold" data-testid="text-session-duration">
                        {Math.floor(websiteStats.avgSessionDuration / 60)}m {websiteStats.avgSessionDuration % 60}s
                      </div>
                      <p className="text-sm text-muted-foreground mt-2">Time on site</p>
                    </CardContent>
                  </Card>
                </div>

                <div className="grid gap-6 md:grid-cols-2">
                  <Card className="border-0 shadow-lg">
                    <CardHeader>
                      <CardTitle>Top Pages</CardTitle>
                      <CardDescription>Most visited pages on your website</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {websiteStats.topPages?.map((page: any, index: number) => (
                          <div key={page.path} className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white font-bold text-sm">
                                {index + 1}
                              </div>
                              <div>
                                <p className="font-medium">{page.title || page.path}</p>
                                <p className="text-sm text-muted-foreground">{page.path}</p>
                              </div>
                            </div>
                            <Badge variant="secondary">{page.views} views</Badge>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-0 shadow-lg">
                    <CardHeader>
                      <CardTitle>Traffic Sources</CardTitle>
                      <CardDescription>Where your visitors come from</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {websiteStats.trafficSources?.map((source: any) => (
                          <div key={source.source} className="space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="font-medium">{source.source}</span>
                              <span className="text-sm text-muted-foreground">{source.visits} visits ({source.percentage}%)</span>
                            </div>
                            <div className="w-full bg-muted rounded-full h-2">
                              <div 
                                className="bg-gradient-to-r from-purple-500 to-blue-500 h-2 rounded-full transition-all"
                                style={{ width: `${source.percentage}%` }}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </>
            )}
          </TabsContent>
        </Tabs>

        {filteredMetrics.length > 0 && (
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle>Recent Data Points</CardTitle>
              <CardDescription>Latest metrics from all platforms</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {filteredMetrics.slice(0, 5).map((metric) => (
                  <div
                    key={metric.id}
                    className="flex items-center justify-between p-4 rounded-lg bg-muted/50 hover-elevate"
                    data-testid={`metric-${metric.id}`}
                  >
                    <div className="flex items-center gap-4">
                      <Badge variant="outline" className="capitalize">
                        {metric.metricType}
                      </Badge>
                      <div>
                        <p className="font-medium capitalize">{metric.platform?.replace("_", " ")}</p>
                        <p className="text-sm text-muted-foreground">
                          {format(new Date(metric.date), "MMM d, yyyy")}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

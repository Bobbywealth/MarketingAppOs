import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  TrendingUp, 
  Target, 
  DollarSign, 
  Users, 
  Phone, 
  Mail, 
  Calendar,
  CheckCircle2,
  Clock,
  Award,
  ArrowRight
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { Link } from "wouter";

interface SalesMetrics {
  leadsAssigned: number;
  leadsContacted: number;
  leadsConverted: number;
  conversionRate: number;
  revenueGenerated: number;
  activitiesThisWeek: {
    calls: number;
    emails: number;
    meetings: number;
  };
  quota: {
    target: number;
    achieved: number;
    percentage: number;
  };
  topLeads: Array<{
    id: number;
    name: string;
    company: string;
    status: string;
    value: number;
    lastContact: string;
  }>;
  recentActivity: Array<{
    id: number;
    type: string;
    description: string;
    timestamp: string;
  }>;
}

export default function SalesDashboard() {
  const { user } = useAuth();
  
  const { data: metrics, isLoading } = useQuery<SalesMetrics>({
    queryKey: ["/api/sales/metrics"],
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Get current time for greeting
  const getGreeting = () => {
    const hour = new Date().getHours();
    const displayName = user?.firstName || user?.username?.split(' ')[0] || 'there';
    
    if (hour < 12) return `Good morning, ${displayName}`;
    if (hour < 18) return `Good afternoon, ${displayName}`;
    return `Good evening, ${displayName}`;
  };

  return (
    <div className="min-h-full gradient-mesh p-4 md:p-6 lg:p-8 space-y-6">
      {/* Welcome Header */}
      <div className="space-y-2">
        <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold">
          {getGreeting()}! 👋
        </h1>
        <p className="text-muted-foreground text-sm md:text-base">
          Here's your sales performance overview
        </p>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="glass-strong">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Leads Assigned</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics?.leadsAssigned || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {metrics?.leadsContacted || 0} contacted
            </p>
          </CardContent>
        </Card>

        <Card className="glass-strong">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics?.conversionRate || 0}%</div>
            <p className="text-xs text-muted-foreground mt-1">
              {metrics?.leadsConverted || 0} conversions
            </p>
          </CardContent>
        </Card>

        <Card className="glass-strong">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Revenue Generated</CardTitle>
            <DollarSign className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${(metrics?.revenueGenerated || 0).toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground mt-1">This month</p>
          </CardContent>
        </Card>

        <Card className="glass-strong">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Quota Progress</CardTitle>
            <Target className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics?.quota?.percentage || 0}%</div>
            <div className="w-full bg-muted rounded-full h-2 mt-2">
              <div
                className="bg-primary h-2 rounded-full transition-all"
                style={{ width: `${Math.min(metrics?.quota?.percentage || 0, 100)}%` }}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Activity Summary */}
      <Card className="glass-strong">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="w-5 h-5 text-primary" />
            This Week's Activity
          </CardTitle>
          <CardDescription>Your sales activities for the current week</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="flex items-center gap-4 p-4 rounded-lg bg-muted/50">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <Phone className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{metrics?.activitiesThisWeek?.calls || 0}</p>
                <p className="text-sm text-muted-foreground">Calls Made</p>
              </div>
            </div>

            <div className="flex items-center gap-4 p-4 rounded-lg bg-muted/50">
              <div className="w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center">
                <Mail className="w-6 h-6 text-emerald-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{metrics?.activitiesThisWeek?.emails || 0}</p>
                <p className="text-sm text-muted-foreground">Emails Sent</p>
              </div>
            </div>

            <div className="flex items-center gap-4 p-4 rounded-lg bg-muted/50">
              <div className="w-12 h-12 rounded-full bg-purple-500/10 flex items-center justify-center">
                <Calendar className="w-6 h-6 text-purple-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{metrics?.activitiesThisWeek?.meetings || 0}</p>
                <p className="text-sm text-muted-foreground">Meetings</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Top Leads */}
        <Card className="glass-strong">
          <CardHeader>
            <CardTitle>Your Top Leads</CardTitle>
            <CardDescription>High-priority leads requiring attention</CardDescription>
          </CardHeader>
          <CardContent>
            {metrics?.topLeads && metrics.topLeads.length > 0 ? (
              <div className="space-y-4">
                {metrics.topLeads.map((lead) => (
                  <div
                    key={lead.id}
                    className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                  >
                    <div className="space-y-1">
                      <p className="font-medium">{lead.name}</p>
                      <p className="text-sm text-muted-foreground">{lead.company}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <Badge variant="outline" className="text-xs">
                          {lead.status}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          Last contact: {new Date(lead.lastContact).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-emerald-600">${Number(lead.value).toLocaleString()}</p>
                      <Link href={`/leads/${lead.id}`}>
                        <Button variant="ghost" size="sm" className="mt-2">
                          View <ArrowRight className="w-3 h-3 ml-1" />
                        </Button>
                      </Link>
                    </div>
                  </div>
                ))}
                <Link href="/leads">
                  <Button variant="outline" className="w-full">
                    View All Leads
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Users className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>No leads assigned yet</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card className="glass-strong">
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Your latest sales activities</CardDescription>
          </CardHeader>
          <CardContent>
            {metrics?.recentActivity && metrics.recentActivity.length > 0 ? (
              <div className="space-y-4">
                {metrics.recentActivity.map((activity) => (
                  <div
                    key={activity.id}
                    className="flex items-start gap-3 p-3 rounded-lg border bg-card"
                  >
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      {activity.type === "call" && <Phone className="w-4 h-4 text-primary" />}
                      {activity.type === "email" && <Mail className="w-4 h-4 text-primary" />}
                      {activity.type === "meeting" && <Calendar className="w-4 h-4 text-primary" />}
                      {activity.type === "conversion" && <CheckCircle2 className="w-4 h-4 text-emerald-500" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">{activity.description}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(activity.timestamp).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Clock className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>No recent activity</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className="glass-strong">
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Common tasks to help you stay productive</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
            <Link href="/leads">
              <Button variant="outline" className="w-full justify-start">
                <Users className="w-4 h-4 mr-2" />
                View My Leads
              </Button>
            </Link>
            <Link href="/clients">
              <Button variant="outline" className="w-full justify-start">
                <CheckCircle2 className="w-4 h-4 mr-2" />
                My Clients
              </Button>
            </Link>
            <Link href="/tasks">
              <Button variant="outline" className="w-full justify-start">
                <Clock className="w-4 h-4 mr-2" />
                My Tasks
              </Button>
            </Link>
            <Link href="/calendar">
              <Button variant="outline" className="w-full justify-start">
                <Calendar className="w-4 h-4 mr-2" />
                My Calendar
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

